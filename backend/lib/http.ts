const ALLOWED_ORIGINS = new Set([
  "https://cinema-calendar-three.vercel.app",
  "https://cinema-calendar-vongole1.vercel.app",
  "https://cinema-calendar-git-main-vongole1.vercel.app",
  "https://vongolebianco7.github.io",
]);

function allowedOrigin(request?: Request) {
  // Public read-only movie APIs do not use cookies or browser credentials.
  // Use wildcard CORS so GitHub Pages, Vercel aliases and a future custom domain
  // can all consume the same catalog without silently losing movie results.
  return "*";
}

export function securityHeaders(request?: Request) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(request),
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Resource-Policy": "cross-origin",
  };
}

export function json(data: unknown, init: ResponseInit = {}, request?: Request) {
  return Response.json(data, {
    ...init,
    headers: { ...securityHeaders(request), ...(init.headers || {}) },
  });
}

const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(request: Request, limit = 90, windowMs = 60_000) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const key = ip + ":" + new URL(request.url).pathname;
  const now = Date.now();
  const old = buckets.get(key);
  const b = !old || old.reset <= now ? { count: 0, reset: now + windowMs } : old;
  b.count += 1; buckets.set(key, b);
  if (buckets.size > 5000) for (const [k,v] of buckets) if (v.reset <= now) buckets.delete(k);
  return { ok: b.count <= limit, retryAfter: Math.max(1, Math.ceil((b.reset-now)/1000)) };
}

export function rateLimited(request: Request, limit?: number) {
  const r = rateLimit(request, limit);
  return r.ok ? null : json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(r.retryAfter), "Cache-Control": "no-store" } }, request);
}

export function options(request: Request) {
  return new Response(null, { status: 204, headers: securityHeaders(request) });
}
