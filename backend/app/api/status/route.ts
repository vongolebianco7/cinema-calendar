import { prisma } from "../../../lib/prisma";
import { json } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      movieCount,
      releaseCount,
      tvCount,
      theaterCount,
      theaterMasterCount,
      latestMovie,
      latestRelease,
      latestTv,
      latestTheater,
    ] = await Promise.all([
      prisma.movie.count(),
      prisma.release.count(),
      prisma.tvBroadcast.count(),
      prisma.theaterShowtime.count(),
      prisma.theater.count(),
      prisma.movie.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
      prisma.release.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
      prisma.tvBroadcast.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
      prisma.theaterShowtime.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    ]);

    return json({
      ok: true,
      database: "up",
      checked_at: new Date().toISOString(),
      datasets: {
        movies: { count: movieCount, updated_at: latestMovie?.updatedAt ?? null },
        releases: { count: releaseCount, updated_at: latestRelease?.updatedAt ?? null },
        tv: { count: tvCount, updated_at: latestTv?.updatedAt ?? null },
        theaters: { count: theaterCount, updated_at: latestTheater?.updatedAt ?? null },
        theater_master: { count: theaterMasterCount },
      },
    });
  } catch {
    return json(
      { ok: false, database: "down", checked_at: new Date().toISOString() },
      { status: 503 }
    );
  }
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
