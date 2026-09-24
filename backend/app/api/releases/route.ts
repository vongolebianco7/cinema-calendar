import { prisma } from "../../../lib/prisma";
import { json } from "../../../lib/http";

export const dynamic = "force-dynamic";

function startOfDay(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const d = new Date(value + "T00:00:00.000Z");
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const from = startOfDay(searchParams.get("from"), new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
  const to = startOfDay(searchParams.get("to"), new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1)));
  const service = searchParams.get("service")?.trim();

  const releases = await prisma.release.findMany({
    where: {
      date: { gte: from, lt: to },
      ...(service ? { service } : {}),
    },
    include: { movie: true },
    orderBy: [{ date: "asc" }, { service: "asc" }],
  });

  return json({ releases, count: releases.length, from: from.toISOString(), to: to.toISOString() });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" } });
}
