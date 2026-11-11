import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function directPostgresUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new TypeError("Expected a PostgreSQL connection URL.");
  }

  if (url.hostname.endsWith(".neon.tech")) {
    url.hostname = url.hostname.replace(/-pooler(?=\.)/, "");
  }

  return url.toString();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let directUrl;
  try {
    directUrl = directPostgresUrl(process.env.DATABASE_URL || "");
  } catch {
    console.error("DATABASE_URL is not a valid PostgreSQL connection URL.");
    process.exit(2);
  }

  const result = spawnSync("npm", ["run", "db:sync"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: directUrl },
    stdio: "inherit",
  });

  if (result.error || result.signal) {
    console.error("Unable to complete the database sync command.");
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}
