import { json, rateLimited, options } from "../../../lib/http";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const limited = rateLimited(request, 60);
  if (limited) return limited;
  const url = new URL("https://api.themoviedb.org/3/watch/providers/movie");
  url.searchParams.set("language", "ja-JP");
  url.searchParams.set("watch_region", "JP");
  const token = process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_API_TOKEN;
  const key = process.env.TMDB_API_KEY;
  const headers: Record<string, string> = { accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (key) url.searchParams.set("api_key", key);
  else return json({ error: "TMDB not configured" }, { status: 503 });
  try {
    const response = await fetch(url, { headers, next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Provider metadata unavailable");
    const data = await response.json();
    if (!Array.isArray(data.results) || !data.results.length) throw new Error("Invalid provider metadata");
    return json({ providers: data.results, country: "JP", source: "TMDB / JustWatch" });
  } catch {
    return json({ error: "Provider metadata unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
export async function OPTIONS(request: Request) { return options(request); }
