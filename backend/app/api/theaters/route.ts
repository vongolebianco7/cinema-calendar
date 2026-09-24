import { prisma } from "../../../lib/prisma";
import { json } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.theaterShowtime.findMany({
    orderBy: [{ date: "asc" }, { theater: "asc" }, { start: "asc" }],
  });

  const schedules = rows.map((row) => row.payload);
  const seen = new Set<string>();
  const theaters: Array<{ name: string; area?: string }> = [];

  for (const row of rows) {
    if (seen.has(row.theater)) continue;
    seen.add(row.theater);
    theaters.push({ name: row.theater, area: row.area || undefined });
  }

  return json({
    generated_at: new Date().toISOString(),
    source: "PostgreSQL synchronized from verified theater schedules",
    theaters,
    schedules,
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
