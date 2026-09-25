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

  const movies = await prisma.movie.findMany({
    where: q ? { OR: [
      { title: { contains: q, mode: "insensitive" } },
      { originalTitle: { contains: q, mode: "insensitive" } },
    ] } : undefined,
    include: { releases: { orderBy: { date: "asc" } } },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: limit,
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
          const localIds = new Set(movies.map((m:any)=>String(m.tmdbId||m.tmdb_id||"")));
          external = (body.results||[]).filter((m:any)=>!localIds.has(String(m.id))).slice(0,20).map((m:any)=>({
            id: m.id, tmdbId: m.id, title: m.title, original_title: m.original_title,
            overview: m.overview, date: m.release_date, year: (m.release_date||"").slice(0,4),
            score: m.vote_average, votes: m.vote_count,
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
            event: "catalog", source: "tmdb"
          }));
        }
      }
    } catch (e) { console.warn("TMDB search unavailable", e); }
  }
  return json({ movies, external, count: movies.length + external.length });
}
export async function OPTIONS(){return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS"}})}
