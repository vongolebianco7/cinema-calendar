import { readWithSnapshot, theaterSnapshot } from "../../../lib/catalog-snapshot.cjs";
import { prisma } from "../../../lib/prisma";
import { json, rateLimited, options } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimited(request, 60); if (limited) return limited;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const prefecture = (url.searchParams.get("prefecture") || "").trim();

  return json(await readWithSnapshot(async()=>{
  const rows = await prisma.theater.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } },
              { municipality: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(prefecture ? { prefecture } : {}),
    },
    orderBy: [{ prefecture: "asc" }, { name: "asc" }],
    take: q || prefecture ? 300 : 2000,
  });

  const theaters = rows.map((row) => ({
    id: row.sourceId,
    name: row.name,
    prefecture: row.prefecture,
    municipality: row.municipality,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    website: row.website,
    source: row.source,
    source_url: row.sourceUrl,
  }));

  return {
    generated_at: new Date().toISOString(),
    source: "Wikidata",
    license: "CC0 1.0",
    count: theaters.length,
    theaters,
  };
  }, ()=>theaterSnapshot(q,prefecture)));
}

export async function OPTIONS(request: Request) { return options(request); }
