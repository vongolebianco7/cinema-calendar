import { readWithSnapshot, tvSnapshot, mergeTelevisionRows } from "../../../lib/catalog-snapshot.cjs";
import { prisma } from "../../../lib/prisma";
import { json, rateLimited, options } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimited(request, 60); if (limited) return limited;
  return json(await readWithSnapshot(async()=>{
  const rows = await prisma.tvBroadcast.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }, { service: "asc" }],
  });
  const snapshot = tvSnapshot();
  return { ...snapshot, generated_at: new Date().toISOString(), movies: mergeTelevisionRows(rows.map((row) => row.payload), snapshot.movies) };
  }, tvSnapshot));
}

export async function OPTIONS(request: Request) { return options(request); }
