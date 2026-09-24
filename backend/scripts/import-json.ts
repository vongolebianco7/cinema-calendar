import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = path.resolve(process.cwd(), "..");

type MovieJson = {
  id?: number;
  title: string;
  original_title?: string;
  date?: string;
  event?: string;
  service?: string;
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
};

async function load(file: string): Promise<{ movies?: MovieJson[] }> {
  return JSON.parse(await fs.readFile(path.join(root, "data", file), "utf8"));
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

async function main() {
  const movies = await load("movies.json");
  const streaming = await load("streaming.json");

  await importRows(movies.movies || []);
  await importRows(streaming.movies || []);

  const [movieCount, releaseCount] = await Promise.all([
    prisma.movie.count(),
    prisma.release.count(),
  ]);

  console.log(JSON.stringify({ ok: true, movieCount, releaseCount }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
