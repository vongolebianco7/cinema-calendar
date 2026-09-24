import { prisma } from "../../../lib/prisma";
import { json } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.release.findMany({
    include: { movie: true },
    orderBy: [{ date: "asc" }, { service: "asc" }],
  });

  const movies = rows.map(({ movie, ...release }) => ({
    id: movie.tmdbId ?? movie.id,
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

  return json({ generated_at: new Date().toISOString(), movies });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    },
  });
}
