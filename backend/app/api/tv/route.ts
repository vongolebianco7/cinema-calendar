import { prisma } from "../../../lib/prisma";
import { json } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.tvBroadcast.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }, { service: "asc" }],
  });

  return json({
    generated_at: new Date().toISOString(),
    movies: rows.map((row) => row.payload),
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
