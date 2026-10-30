const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

const routes = ['calendar', 'health', 'releases', 'status', 'theater-directory', 'tv'];

function loadRoute(name) {
  const source = stripTypeScriptTypes(fs.readFileSync(`backend/app/api/${name}/route.ts`, 'utf8'), { mode: 'transform' })
    .replace(/^import .*?;\s*$/gm, '')
    .replace(/^export const dynamic\s*=.*?;\s*$/gm, '')
    .replaceAll('export async function ', 'async function ');
  const observed = { limits: [], databaseCalls: 0, optionsCalls: 0 };
  const context = {
    Request, Response, Headers, URL, Date, Map, Set, Number, String, JSON, Math, console,
    rateLimited: (_request, limit) => {
      observed.limits.push(limit);
      return Response.json({ error: 'Too many requests' }, { status: 429 });
    },
    options: (_request, methods = 'GET,OPTIONS') => {
      observed.optionsCalls += 1;
      return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Methods': methods,
        'X-Content-Type-Options': 'nosniff',
      } });
    },
    json: (data, init = {}) => Response.json(data, init),
    readWithSnapshot: async () => {
      observed.databaseCalls += 1;
      throw new Error('Database-backed read should be stopped by the request guard');
    },
    calendarSnapshot: () => ({}), releaseSnapshot: () => ({}), theaterSnapshot: () => ({}), tvSnapshot: () => ({}),
    prisma: new Proxy({}, { get: () => { observed.databaseCalls += 1; throw new Error('Database should be stopped by the request guard'); } }),
  };
  vm.runInNewContext(`${source}\n;globalThis.api={GET,OPTIONS};`, context);
  return { api: context.api, observed };
}

test('database-backed read routes reject excess requests before touching snapshots or DB', async () => {
  for (const name of routes) {
    const { api, observed } = loadRoute(name);
    const response = await api.GET(new Request(`https://cinelva.test/api/${name}`));
    assert.equal(response.status, 429, `${name} should stop an over-limit request`);
    assert.deepEqual(observed.limits, [60], `${name} should use the bounded read limit`);
    assert.equal(observed.databaseCalls, 0, `${name} should guard before database work`);
  }
});

test('database-backed read routes share request-aware security headers on OPTIONS', async () => {
  for (const name of routes) {
    const { api, observed } = loadRoute(name);
    const response = await api.OPTIONS(new Request(`https://cinelva.test/api/${name}`, { method: 'OPTIONS' }));
    assert.equal(response.status, 204, `${name} should keep preflight available`);
    assert.equal(response.headers.get('access-control-allow-methods'), 'GET,OPTIONS');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(observed.optionsCalls, 1, `${name} should delegate to shared OPTIONS security headers`);
  }
});
