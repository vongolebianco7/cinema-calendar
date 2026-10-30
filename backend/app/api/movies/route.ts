import { readWithSnapshot, movieSnapshot } from "../../../lib/catalog-snapshot.cjs";
import { searchMovies } from "../../../lib/movie-search.cjs";
import { prisma } from "../../../lib/prisma";
import { json, rateLimited, options } from "../../../lib/http";

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
  const limited=rateLimited(request,90);if(limited)return limited;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

  const catalog = await readWithSnapshot(async()=>{
  let rows = await prisma.movie.findMany({
    where: q ? { OR: [
      { title: { contains: q, mode: "insensitive" } },
      { originalTitle: { contains: q, mode: "insensitive" } },
    ] } : undefined,
    include: { releases: { orderBy: { date: "asc" } } },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: limit,
  });

  // Fallback for searches such as スターウォーズ versus スター・ウォーズ.
  // The value is bound by Prisma's tagged SQL API, not concatenated into SQL.
  const compact = (q || "").normalize("NFKC").toLocaleLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
  if (q && compact.length >= 2 && rows.length < limit) {
    const normalizedMatches = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Movie"
      WHERE regexp_replace(lower("title"), '[[:space:][:punct:]・･：！？（）「」『』【】―]', '', 'g') LIKE ${"%" + compact + "%"}
         OR regexp_replace(lower(COALESCE("originalTitle", '')), '[[:space:][:punct:]・･：！？（）「」『』【】―]', '', 'g') LIKE ${"%" + compact + "%"}
      LIMIT ${limit}
    `;
    const extraIds = normalizedMatches.map(row => row.id).filter(id => !rows.some(row => row.id === id));
    if (extraIds.length) {
      const extra = await prisma.movie.findMany({
        where: { id: { in: extraIds } },
        include: { releases: { orderBy: { date: "asc" } } },
        take: limit - rows.length,
      });
      rows = [...rows, ...extra];
    }
  }

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

  return {movies};
  }, ()=>movieSnapshot(q,limit));
  const movies = catalog.movies as any[];
  let external: any[] = [];
  let externalSearch = { truncated: false, incomplete: false, requests: 0 };
  if (q && q.length >= 2) {
    try {
      const authUrl = new URL(TMDB_BASE + "/search/movie");
      const headers = tmdbAuth(authUrl);
      if (headers) {
        const deadline = Date.now() + 8000;
        const result = await searchMovies({
          query: q,
          // The reviewed snapshot can supply a spelling even when the
          // requested local result limit excludes the matching catalog entry.
          titles: [...movies, ...movieSnapshot(q, 100).movies],
          fetchPage: async (query: string, page: number) => {
            const remaining = deadline - Date.now();
            if (remaining <= 0) throw new Error("TMDB search deadline");
            const url = new URL(authUrl);
            url.searchParams.set("query", query);
            url.searchParams.set("page", String(page));
            url.searchParams.set("language", "ja-JP");
            url.searchParams.set("region", "JP");
            url.searchParams.set("include_adult", "false");
            const res = await fetch(url, { headers, next: { revalidate: 3600 }, signal: request.signal ? AbortSignal.any([request.signal, AbortSignal.timeout(Math.min(2500, remaining))]) : AbortSignal.timeout(Math.min(2500, remaining)) });
            if (!res.ok) throw new Error(`TMDB search status ${res.status}`);
            return res.json();
          },
        });
        externalSearch = { truncated: result.truncated, incomplete: result.incomplete, requests: result.requests };
        const localIds = new Set(movies.map((m:any)=>String(m.tmdbId||m.id||"")));
        external = result.results
          .filter((m:any)=>!localIds.has(String(m.id)))
          .map((m:any)=>({
            id: m.id,
            tmdbId: m.id,
            title: m.title,
            original_title: m.original_title,
            overview: m.overview,
            date: m.release_date,
            release_date: m.release_date || "",
            // region=JP is a presentation preference, with a primary-date fallback.
            release_date_source: "tmdb_region_with_primary_fallback",
            release_date_region_requested: "JP",
            year: (m.release_date||"").slice(0,4),
            score: m.vote_average,
            votes: m.vote_count,
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
            event: "catalog",
            service: "作品カタログ",
            source: "tmdb",
            catalog: true,
          }));
      } else externalSearch.incomplete = true;
    } catch (e) { externalSearch.incomplete = true; console.warn("TMDB search unavailable"); }
  }

  return json({ ...catalog, movies, external, external_search: externalSearch, count: movies.length + external.length });
}

export async function OPTIONS(request:Request){return options(request)}
