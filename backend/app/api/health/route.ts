import { prisma } from "../../../lib/prisma";
import { json, rateLimited, options } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimited(request, 60); if (limited) return limited;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return json({ ok: true, database: "up", timestamp: new Date().toISOString() });
  } catch {
    return json(
      { ok: false, database: "down", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}

export async function OPTIONS(request: Request) { return options(request); }
