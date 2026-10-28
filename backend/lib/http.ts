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

export function options(request: Request, methods: string | string[] = "GET,OPTIONS") {
  return new Response(null, { status: 204, headers: { ...securityHeaders(request), "Access-Control-Allow-Methods": Array.isArray(methods) ? methods.join(",") : methods } });
}

// Read incrementally: Content-Length may be absent or dishonest. Count bytes,
// cancel excess input, and never buffer an unbounded request before validation.
export async function readJsonBody(request: Request, maxBytes = 4096, timeoutMs = 8000): Promise<unknown> {
  const failure = (status: number) => Object.assign(new Error(status === 413 ? "request too large" : status === 415 ? "json content type required" : "invalid json"), { status });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) throw failure(415);
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) throw failure(413);
  if (!request.body) throw failure(400);
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0, text = "";
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(failure(408)), timeoutMs);
  });
  const cancel = () => { void reader.cancel().catch(() => {}); };
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { cancel(); throw failure(413); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (error) {
    cancel();
    if ([413, 408, 415].includes((error as { status?: number }).status || 0)) throw error;
    throw failure(400);
  } finally { clearTimeout(timer!); reader.releaseLock(); }
}
