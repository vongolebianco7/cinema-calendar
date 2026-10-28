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
    headers: { ...securityHeaders(request), ...(init.headers || {}), ...((init.status || 200) >= 400 ? {"Cache-Control":"no-store"} : {}) },
  });
}

// Enforce bytes while reading: Content-Length alone cannot bound chunked input.
export async function readJsonBody(request: Request, maxBytes = 4096): Promise<unknown> {
  const fail = (status: number) => Object.assign(new Error(status === 413 ? "Request too large" : "Invalid JSON"), {status});
  const length = request.headers.get("content-length");
  if (length && Number(length) > maxBytes) throw fail(413);
  const reader = request.body?.getReader();
  if (!reader) throw fail(400);
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw fail(413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", {fatal:true}).decode(bytes)); }
  catch { throw fail(400); }
}

const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(request: Request, limit = 90, windowMs = 60_000) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const key = ip + ":" + new URL(request.url).pathname;
  const now = Date.now();
  const old = buckets.get(key);
  if (!old && buckets.size >= 5000) {
    for (const [k,v] of buckets) if (v.reset <= now) buckets.delete(k);
    if (buckets.size >= 5000) return {ok:false, retryAfter:Math.ceil(windowMs/1000)};
  }
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
