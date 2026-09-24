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

type TheaterMasterRow = {
  source: string;
  source_id: string;
  name: string;
  prefecture?: string | null;
  municipality?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  website?: string | null;
  source_url: string;
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
        payload: JSON.parse(JSON.stringify(item)),
      },
    });
  }
  return rows.length;
}

async function importTheaterMaster() {
  let data: { theaters?: TheaterMasterRow[] };
  try {
    data = await load<{ theaters?: TheaterMasterRow[] }>("theaters_master.json");
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      console.log(JSON.stringify({ theaterMasterSkipped: true, reason: "snapshot_not_generated_yet" }));
      return 0;
    }
    throw error;
  }
  const rows = data.theaters || [];
  const sourceIds = rows.map(x => x.source_id).filter(Boolean);
  if (sourceIds.length) {
    await prisma.theater.deleteMany({
      where: { source: "Wikidata", sourceId: { notIn: sourceIds } },
    });
  }
  for (const item of rows) {
    if (!item.source_id || !item.name || !item.source_url) continue;
    await prisma.theater.upsert({
      where: { sourceId: item.source_id },
      create: {
        source: item.source || "Wikidata",
        sourceId: item.source_id,
        name: item.name,
        prefecture: item.prefecture || null,
        municipality: item.municipality || null,
        address: item.address || null,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        website: item.website || null,
        sourceUrl: item.source_url,
        payload: JSON.parse(JSON.stringify(item)),
      },
      update: {
        name: item.name,
        prefecture: item.prefecture || null,
        municipality: item.municipality || null,
        address: item.address || null,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        website: item.website || null,
        sourceUrl: item.source_url,
        payload: JSON.parse(JSON.stringify(item)),
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
        payload: JSON.parse(JSON.stringify(item)),
      },
    });
  }
  return rows.length;
}

async function main() {
  const theatersOnly = process.argv.includes("--theaters-only");
  const theaterMasterOnly = process.argv.includes("--theater-master-only");

  if (theaterMasterOnly) {
    const theaterMasterCount = await importTheaterMaster();
    console.log(JSON.stringify({ ok: true, theaterMasterCount }));
    return;
  }

  if (theatersOnly) {
    const theaterCount = await importTheaters();
    console.log(JSON.stringify({ ok: true, theaterCount }));
    return;
  }

  const movies = await load<{ movies?: MovieJson[] }>("movies.json");
  const streaming = await load<{ movies?: MovieJson[] }>("streaming.json");

  await importRows(movies.movies || []);
  await importRows(streaming.movies || []);
  const [tvCount, theaterCount, theaterMasterCount] = await Promise.all([importTv(), importTheaters(), importTheaterMaster()]);

  const [movieCount, releaseCount] = await Promise.all([
    prisma.movie.count(),
    prisma.release.count(),
  ]);

  console.log(JSON.stringify({ ok: true, movieCount, releaseCount, tvCount, theaterCount, theaterMasterCount }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
