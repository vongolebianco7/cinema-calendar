const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  vm = require("node:vm"),
  fs = require("node:fs");
function registry(rows = [], cache = {}, broken = []) {
  const values = new Map([
      ["cinelva-poster-registry-v1", JSON.stringify(cache)],
      ["cinelva-broken-posters-v1", JSON.stringify(broken)],
    ]),
    window = {};
  let calls = 0;
  vm.runInNewContext(fs.readFileSync("js/cinelva-movie-identity.js", "utf8"), {
    window,
    URL,
    URLSearchParams,
    localStorage: {
      getItem: (k) => values.get(k) || null,
      setItem: (k, v) => values.set(k, v),
    },
    fetch: async () => {
      calls++;
      return { ok: true, json: async () => ({ movies: rows }) };
    },
  });
  return { api: window.CinelvaMovieIdentity, values, calls: () => calls };
}
test("local and event IDs are isolated while verified TMDB links identify static catalog entries", () => {
  const { api } = registry();
  assert.equal(api.ingest({ id: 99, title: "local" }), null);
  assert.equal(
    api.ingest({ id: "event-99", movie: "Film", date: "2026-10-20" }),
    null,
  );
  assert.equal(
    api.ingest({
      id: 99,
      title: "Film",
      tmdb: "https://www.themoviedb.org/movie/99",
    }).tmdbId,
    99,
  );
});
test("numeric backend API IDs are resolved at the API boundary", async () => {
  const { api } = registry([
    { id: 99, title: "Film", year: 2000, poster: "/film.jpg" },
  ]);
  assert.match(
    (await api.fetchOne({ tmdbId: 99, title: "Film" })).poster,
    /film.jpg$/,
  );
});
test("unidentified title without a release year is never matched to a remake", async () => {
  const { api, calls } = registry([
    { tmdbId: 99, title: "Film", poster: "/wrong.jpg" },
  ]);
  assert.equal(await api.fetchOne({ title: "Film" }), null);
  assert.equal(calls(), 0);
});
test("invalid cache paths are excluded and normalized artwork is reused across views", () => {
  const { api } = registry([], { 99: "javascript:bad", 100: "/ok.jpg" });
  assert.equal(api.posterFor({ tmdbId: 99 }), "");
  assert.equal(
    api.posterFor({ tmdbId: 100 }),
    "https://image.tmdb.org/t/p/w500/ok.jpg",
  );
});
test("broken artwork variants are invalidated within the document and removed from persistent cache", () => {
  const { api, values } = registry();
  api.ingest({ tmdbId: 99, title: "Film", poster: "/bad.jpg" });
  api.reportBroken({ tmdbId: 99 }, "https://image.tmdb.org/t/p/w342/bad.jpg");
  assert.equal(api.posterFor({ tmdbId: 99 }), "");
  assert.equal(api.posterFor({ tmdbId: 99, poster: "/bad.jpg" }), "");
  assert.match(
    api.posterFor({ tmdbId: 100, poster: "/good.jpg" }),
    /good.jpg$/,
  );
  assert.ok(!JSON.parse(values.get("cinelva-poster-registry-v1"))["99"]);
});
test("concurrent cards share lookup and ambiguous title-year results stay unresolved", async () => {
  const { api, calls } = registry([
    { id: 99, title: "Film", year: 2000, poster: "/a.jpg" },
    { id: 100, title: "Film", year: 2000, poster: "/b.jpg" },
  ]);
  const r = await Promise.all([
    api.fetchOne({ title: "Film", year: 2000 }),
    api.fetchOne({ title: "Film", year: 2000 }),
  ]);
  assert.ok(r.every((x) => x === null));
  assert.equal(calls(), 1);
});
test("known TMDB identity can recover a poster without guessing a title", async () => {
  const window = {};
  let requested = "";
  vm.runInNewContext(fs.readFileSync("js/cinelva-movie-identity.js", "utf8"), {
    window,
    URL,
    URLSearchParams,
    localStorage: { getItem: () => null, setItem() {} },
    fetch: async (url) => {
      requested = url;
      return {
        ok: true,
        json: async () => ({
          movie: {
            id: 128,
            title: "もののけ姫",
            year: 1997,
            poster: "/mononoke.jpg",
          },
        }),
      };
    },
  });
  assert.match(
    (await window.CinelvaMovieIdentity.fetchOne({ tmdbId: 128 }))?.poster || "",
    /mononoke.jpg$/,
  );
  assert.match(requested, /movie-detail\?id=128/);
});

test("a transient failure in a previous document cannot permanently block healthy artwork", () => {
  const url = "https://image.tmdb.org/t/p/w500/recovered.jpg";
  const { api } = registry([], { 99: url }, [url]);
  assert.equal(api.posterFor({ tmdbId: 99, poster: "/recovered.jpg" }), url);
});
