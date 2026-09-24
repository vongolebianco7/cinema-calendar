import { prisma } from "../../../lib/prisma";
import { json } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

  const movies = await prisma.movie.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { originalTitle: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      releases: {
        orderBy: { date: "asc" },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: limit,
  });

  return json({ movies, count: movies.length });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" } });
}
