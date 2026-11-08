import { calendarSnapshot } from "../../../lib/catalog-snapshot.cjs";
import { json, rateLimited, options } from "../../../lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimited(request, 60); if (limited) return limited;
  // The checked-in snapshot is the reviewed source of truth used by the static
  // frontend. The database may lag scheduled catalog refreshes and contain
  // obsolete duplicate releases, so do not merge it into the public calendar.
  return json(calendarSnapshot(), {}, request);
}

export async function OPTIONS(request: Request) { return options(request); }
