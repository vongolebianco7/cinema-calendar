import { json } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  // Automatic schedule collection is intentionally disabled until the
  // collection policy is explicitly approved. Return a non-2xx response so
  // the static frontend can safely fall back to the last verified snapshot
  // instead of treating an empty payload as authoritative "no showtimes".
  return json({
    generated_at: new Date().toISOString(),
    status: "disabled_pending_permission",
    source: null,
    theaters: [],
    schedules: [],
  }, { status: 503 });
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
