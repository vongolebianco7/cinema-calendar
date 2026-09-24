import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = path.resolve(process.cwd(), "..");

type MovieJson = {
  id?: number;
  title: string;
  original_title?: string;
  date?: string;
  time?: string;
  event?: string;
  service?: string;
  program?: string;
  poster?: string | null;
  score?: number;
  votes?: number;
  overview?: string;
  director?: string;
  runtime?: number;
  genres?: string[];
  countries?: string[];
  source?: string;
  source_url?: string;
  [key: string]: unknown;
};

type TheaterRow = {
  title: string;
  date: string;
  theater: string;
  area?: string;
  screen?: string;
  start: string;
  end?: string;
  source_url?: string;
  [key: string]: unknown;
};

async function load<T = unknown>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(root, "data", file), "utf8"));
}

function fingerprint(parts: unknown[]) {
  return crypto.createHash("sha256").update(parts.map(v => String(v ?? "")).join("|")).digest("hex");
}

async function upsertMovie(item: MovieJson) {
  if (typeof item.id === "number") {
    return prisma.movie.upsert({
      where: { tmdbId: item.id },
      create: {
        tmdbId: item.id,
        title: item.title,
        originalTitle: item.original_title || null,
        posterUrl: item.poster || null,
        overview: item.overview || null,
        score: item.score ?? null,
        votes: item.votes ?? null,
        runtime: item.runtime ?? null,
        director: item.director || null,
        genres: item.genres || [],
        countries: item.countries || [],
      },
      update: {
        title: item.title,
        originalTitle: item.original_title || null,
        posterUrl: item.poster || null,
        overview: item.overview || null,
        score: item.score ?? null,
        votes: item.votes ?? null,
        runtime: item.runtime ?? null,
        director: item.director || null,
        genres: item.genres || [],
        countries: item.countries || [],
      },
    });
  }

  const existing = await prisma.movie.findFirst({ where: { title: item.title } });
  if (existing) return existing;

  return prisma.movie.create({
    data: {
      title: item.title,
      posterUrl: item.poster || null,
      overview: item.overview || null,
      score: item.score ?? null,
      votes: item.votes ?? null,
      genres: [],
      countries: [],
    },
  });
}

async function importRows(rows: MovieJson[]) {
  for (const item of rows) {
    if (!item.title) continue;
    const movie = await upsertMovie(item);
    if (!item.date || !item.event || !item.service) continue;

    const date = new Date(item.date + "T00:00:00.000Z");
    if (Number.isNaN(date.getTime())) continue;

    await prisma.release.upsert({
      where: {
        movieId_date_event_service: {
          movieId: movie.id,
          date,
          event: item.event,
          service: item.service,
        },
      },
      create: {
        movieId: movie.id,
        date,
        event: item.event,
        service: item.service,
        source: item.source || null,
        sourceUrl: item.source_url || null,
      },
      update: {
        source: item.source || null,
        sourceUrl: item.source_url || null,
      },
    });
  }
}

async function importTv() {
  const tv = await load<{ movies?: MovieJson[] }>("tv.json");
  const rows = tv.movies || [];
  await prisma.tvBroadcast.deleteMany({});
  for (const item of rows) {
    if (!item.title || !item.date || !item.service) continue;
    const date = new Date(item.date + "T00:00:00.000Z");
    if (Number.isNaN(date.getTime())) continue;
    await prisma.tvBroadcast.create({
      data: {
        fingerprint: fingerprint([item.title, item.date, item.time, item.service, item.program]),
        title: item.title,
        date,
        time: item.time || null,
        service: item.service,
        program: item.program || null,
        payload: item,
      },
    });
  }
  return rows.length;
}

async function importTheaters() {
  const data = await load<{ schedules?: TheaterRow[] }>("theater_schedules.json");
  const rows = data.schedules || [];
  await prisma.theaterShowtime.deleteMany({});
  for (const item of rows) {
    if (!item.title || !item.date || !item.theater || !item.start) continue;
    const date = new Date(item.date + "T00:00:00.000Z");
    if (Number.isNaN(date.getTime())) continue;
    await prisma.theaterShowtime.create({
      data: {
        fingerprint: fingerprint([item.title, item.date, item.theater, item.screen, item.start, item.end]),
        title: item.title,
        date,
        theater: item.theater,
        area: item.area || null,
        screen: item.screen || null,
        start: item.start,
        end: item.end || null,
        sourceUrl: item.source_url || null,
        payload: item,
      },
    });
  }
  return rows.length;
}

async function main() {
  const theatersOnly = process.argv.includes("--theaters-only");

  if (theatersOnly) {
    const theaterCount = await importTheaters();
    console.log(JSON.stringify({ ok: true, theaterCount }));
    return;
  }

  const movies = await load<{ movies?: MovieJson[] }>("movies.json");
  const streaming = await load<{ movies?: MovieJson[] }>("streaming.json");

  await importRows(movies.movies || []);
  await importRows(streaming.movies || []);
  const [tvCount, theaterCount] = await Promise.all([importTv(), importTheaters()]);

  const [movieCount, releaseCount] = await Promise.all([
    prisma.movie.count(),
    prisma.release.count(),
  ]);

  console.log(JSON.stringify({ ok: true, movieCount, releaseCount, tvCount, theaterCount }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
