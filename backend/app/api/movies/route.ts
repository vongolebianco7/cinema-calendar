import { prisma } from "../../../lib/prisma";
import { json } from "../../../lib/http";

export const dynamic = "force-dynamic";
const TMDB_BASE = "https://api.themoviedb.org/3";

function tmdbAuth(url: URL) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_API_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;
  const headers: Record<string,string> = { accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (apiKey) url.searchParams.set("api_key", apiKey);
  return token || apiKey ? headers : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

  const rows = await prisma.movie.findMany({
    where: q ? { OR: [
      { title: { contains: q, mode: "insensitive" } },
      { originalTitle: { contains: q, mode: "insensitive" } },
    ] } : undefined,
    include: { releases: { orderBy: { date: "asc" } } },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: limit,
  });

  // Keep the response shape identical to TMDB catalog results so the static
  // frontend can render local DB hits and remote hits through the same path.
  const movies = rows.map((m:any)=>{
    const firstRelease = m.releases?.[0];
    const date = firstRelease?.date ? firstRelease.date.toISOString().slice(0,10) : "";
    return {
      id: m.tmdbId ?? m.id,
      tmdbId: m.tmdbId ?? null,
      title: m.title,
      original_title: m.originalTitle ?? "",
      overview: m.overview ?? "",
      date,
      year: date.slice(0,4),
      score: m.score ?? 0,
      votes: m.votes ?? 0,
      runtime: m.runtime ?? 0,
      director: m.director ?? "",
      genres: Array.isArray(m.genres) ? m.genres : [],
      countries: Array.isArray(m.countries) ? m.countries : [],
      poster: m.posterUrl ?? null,
      event: firstRelease?.event ?? "catalog",
      service: firstRelease?.service ?? "作品カタログ",
      source: firstRelease?.source ?? "database",
      source_url: firstRelease?.sourceUrl ?? null,
      catalog: !firstRelease,
    };
  });

  let external: any[] = [];
  if (q && q.length >= 2) {
    try {
      const url = new URL(TMDB_BASE + "/search/movie");
      url.searchParams.set("query", q);
      url.searchParams.set("language", "ja-JP");
      url.searchParams.set("region", "JP");
      url.searchParams.set("include_adult", "false");
      const headers = tmdbAuth(url);
      if (headers) {
        const res = await fetch(url, { headers, next: { revalidate: 3600 } });
        if (res.ok) {
          const body = await res.json();
          const localIds = new Set(movies.map((m:any)=>String(m.tmdbId||m.id||"")));
          external = (body.results||[])
            .filter((m:any)=>!localIds.has(String(m.id)))
            .slice(0,20)
            .map((m:any)=>({
              id: m.id,
              tmdbId: m.id,
              title: m.title,
              original_title: m.original_title,
              overview: m.overview,
              date: m.release_date,
              year: (m.release_date||"").slice(0,4),
              score: m.vote_average,
              votes: m.vote_count,
              poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
              event: "catalog",
              service: "作品カタログ",
              source: "tmdb",
              catalog: true,
            }));
        }
      }
    } catch (e) { console.warn("TMDB search unavailable", e); }
  }

  return json({ movies, external, count: movies.length + external.length });
}

export async function OPTIONS(){
  return new Response(null,{status:204,headers:{
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,OPTIONS"
  }});
}
