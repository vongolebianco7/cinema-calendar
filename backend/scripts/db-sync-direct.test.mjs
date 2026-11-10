import assert from "node:assert/strict";
import test from "node:test";
import { directPostgresUrl } from "./db-sync-direct.mjs";

function fixture(hostname) {
  const url = new URL("postgresql://example.invalid/neondb");
  url.username = "movie_user";
  url.password = "p@ss";
  url.hostname = hostname;
  url.port = "5432";
  url.searchParams.set("sslmode", "require");
  url.searchParams.set("options", "project=example");
  return url.toString();
}

test("Neon pooled hostname is converted while credentials and options are preserved", () => {
  const url = new URL(directPostgresUrl(
    fixture("ep-snowy-wave-b4gwato2-pooler.c-6.us-east-2.aws.neon.tech"),
  ));

  assert.equal(url.hostname, "ep-snowy-wave-b4gwato2.c-6.us-east-2.aws.neon.tech");
  assert.equal(url.username, "movie_user");
  assert.equal(url.password, "p%40ss");
  assert.equal(url.port, "5432");
  assert.equal(url.pathname, "/neondb");
  assert.equal(url.searchParams.get("sslmode"), "require");
  assert.equal(url.searchParams.get("options"), "project=example");
});

test("an existing direct Neon URL remains direct", () => {
  const url = new URL(directPostgresUrl(
    fixture("ep-snowy-wave-b4gwato2.c-6.us-east-2.aws.neon.tech"),
  ));
  assert.equal(url.hostname, "ep-snowy-wave-b4gwato2.c-6.us-east-2.aws.neon.tech");
});

test("non-PostgreSQL URLs are rejected", () => {
  assert.throws(() => directPostgresUrl("https://example.com"), /PostgreSQL/);
});
