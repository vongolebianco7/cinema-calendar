import { prisma } from "../../../lib/prisma";
import { json } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const prefecture = (url.searchParams.get("prefecture") || "").trim();

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

  return json({
    generated_at: new Date().toISOString(),
    source: "Wikidata",
    license: "CC0 1.0",
    count: theaters.length,
    theaters,
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
