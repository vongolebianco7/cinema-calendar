import { json } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return json({
    generated_at: new Date().toISOString(),
    status: "disabled_pending_permission",
    source: null,
    theaters: [],
    schedules: [],
  });
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
