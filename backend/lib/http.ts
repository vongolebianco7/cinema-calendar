export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: { ...corsHeaders, ...(init.headers || {}) },
  });
}
