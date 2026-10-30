const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

function loadHttp() {
  const source = stripTypeScriptTypes(fs.readFileSync('backend/lib/http.ts', 'utf8'), { mode: 'transform' })
    .replaceAll('export ', '');
  const context = { Request, Response, Headers, URL, Map, Date, Number, Math, setTimeout, clearTimeout };
  vm.runInNewContext(`${source}\n;globalThis.http={json,rateLimited,options};`, context);
  return context.http;
}

function loadRoute(file, fetcher, timeoutFactory = AbortSignal.timeout) {
  const source = stripTypeScriptTypes(fs.readFileSync(file, 'utf8'), { mode: 'transform' })
    .replace(/^import .*?;\s*$/gm, '')
    .replace(/^export const dynamic\s*=.*?;\s*$/gm, '')
    .replaceAll('export async function ', 'async function ');
  const context = {
    Request, Response, Headers, URL, URLSearchParams,
    AbortSignal: { timeout: timeoutFactory },
    Map, Set, Date, Number, String, JSON, console,
    process: { env: { TMDB_API_KEY: 'fixture-key' } },
    fetch: fetcher,
    ...loadHttp(),
    isFilmMedium: () => true,
    filmMediumMetadata: value => value,
  };
  vm.runInNewContext(`${source}\n;globalThis.api={GET,OPTIONS};`, context);
  return context.api;
}

test('discover rejects malformed or out-of-range page values before upstream access', async () => {
  let upstreamCalls = 0;
  const api = loadRoute('backend/app/api/discover/route.ts', async () => {
    upstreamCalls += 1;
    return { ok: true, json: async () => ({ results: [] }) };
  });

  for (const page of ['0', '1.5', '501', 'abc']) {
    const response = await api.GET(new Request(`https://cinelva.test/api/discover?page=${page}`));
    assert.equal(response.status, 400, `page=${page} must be rejected`);
  }
  assert.equal(upstreamCalls, 0);
});

test('people profile, director, and search requests use an eight-second upstream timeout', async () => {
  const timeouts = [];
  const signals = [];
  const api = loadRoute('backend/app/api/people/route.ts', async (url, init) => {
      assert.equal(new URL(url).hostname, 'api.themoviedb.org');
      signals.push(init.signal);
      return {
        ok: true,
        json: async () => url.pathname.endsWith('/person/525')
          ? { id: 525, name: 'Fixture', movie_credits: { cast: [], crew: [] } }
          : url.pathname.endsWith('/movie_credits')
            ? { crew: [] }
            : { results: [] },
      };
    }, ms => { timeouts.push(ms); return AbortSignal.timeout(ms); });
  for (const query of ['profile=1&id=525', 'role=director&id=525', 'q=kurosawa']) {
    const response = await api.GET(new Request(`https://cinelva.test/api/people?${query}`));
    assert.equal(response.status, 200);
  }

  assert.deepEqual(timeouts, [8000, 8000, 8000]);
  assert.equal(signals.length, 3);
  assert.ok(signals.every(signal => signal instanceof AbortSignal));
});
