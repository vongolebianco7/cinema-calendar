import { readWithSnapshot, calendarSnapshot } from "../../../lib/catalog-snapshot.cjs";
import { prisma } from "../../../lib/prisma";
import { json, rateLimited, options } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimited(request, 60); if (limited) return limited;
  return json(await readWithSnapshot(async()=>{
  const rows = await prisma.release.findMany({
    include: { movie: true },
    orderBy: [{ date: "asc" }, { service: "asc" }],
  });

  const movies = rows.map(({ movie, ...release }) => ({
    id: movie.tmdbId ?? movie.id,
    tmdbId: movie.tmdbId,
    title: movie.title,
    original_title: movie.originalTitle,
    date: release.date.toISOString().slice(0, 10),
    event: release.event,
    service: release.service,
    poster: movie.posterUrl,
    score: movie.score ?? 0,
    votes: movie.votes ?? 0,
    overview: movie.overview ?? "",
    director: movie.director ?? "",
    runtime: movie.runtime ?? null,
    genres: movie.genres ?? [],
    countries: movie.countries ?? [],
    source: release.source,
    source_url: release.sourceUrl,
  }));

  return { generated_at: new Date().toISOString(), movies };
  }, calendarSnapshot));
}

export async function OPTIONS(request: Request) { return options(request); }
