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
  const headers = new Headers(securityHeaders(request));
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  if ((init.status || 200) >= 400) headers.set("Cache-Control", "no-store");
  return Response.json(data, { ...init, headers });
}

const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(request: Request, limit = 90, windowMs = 60_000) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const key = ip + ":" + new URL(request.url).pathname;
  const now = Date.now();
  // Per-instance best effort only; this is not a distributed/WAF quota.
  // Never evict active offenders to make room for attacker-controlled identities.
  if (buckets.size >= 5000) {
    for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    if (!buckets.has(key) && buckets.size >= 5000) return { ok: false, retryAfter: Math.ceil(windowMs / 1000) };
  }
  const old = buckets.get(key);
  const b = !old || old.reset <= now ? { count: 0, reset: now + windowMs } : old;
  b.count = Math.min(b.count + 1, limit + 1); buckets.set(key, b);
  return { ok: b.count <= limit, retryAfter: Math.max(1, Math.ceil((b.reset-now)/1000)) };
}

export function rateLimited(request: Request, limit?: number) {
  if (request.url.length > 4096) return json({ error: "Request URL too long" }, { status: 414 }, request);
  const r = rateLimit(request, limit);
  return r.ok ? null : json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(r.retryAfter), "Cache-Control": "no-store" } }, request);
}

export function options(request: Request, methods = ["GET", "OPTIONS"]) {
  return new Response(null, { status: 204, headers: { ...securityHeaders(request), "Access-Control-Allow-Methods": methods.join(",") } });
}

export async function readJsonBody(request: Request, maxBytes = 4096): Promise<{ data: unknown; response?: never } | { data?: never; response: Response }> {
  const reject = (status: number, error: string) => ({ response: json({ error }, { status }, request) });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) return reject(415, "JSON content type required");
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return reject(413, "Request body too large");
  const reader = request.body?.getReader();
  if (!reader) return reject(400, "Invalid JSON");
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel(); return reject(413, "Request body too large"); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { data: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch { return reject(400, "Invalid JSON"); }
  finally { reader.releaseLock(); }
}
