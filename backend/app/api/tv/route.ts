import { readWithSnapshot, tvSnapshot } from "../../../lib/catalog-snapshot.cjs";
import { prisma } from "../../../lib/prisma";
import { json, rateLimited } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimited(request, 60); if (limited) return limited;
  return json(await readWithSnapshot(async()=>{
  const rows = await prisma.tvBroadcast.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }, { service: "asc" }],
  });

  return {
    generated_at: new Date().toISOString(),
    movies: rows.map((row) => row.payload),
  };
  }, tvSnapshot));
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
