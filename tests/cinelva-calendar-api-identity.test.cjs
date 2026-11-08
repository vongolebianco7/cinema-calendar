const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');

test('calendar API serves the reviewed snapshot and excludes stale database duplicates', async () => {
  const source = stripTypeScriptTypes(
    fs.readFileSync('backend/app/api/calendar/route.ts', 'utf8'),
    { mode: 'transform' },
  ).replace(/^import .*?;\s*$/gm, '').replaceAll('export ', '');

  const snapshot = {
    generated_at: '2026-11-08T00:00:00Z',
    movies: [{
      id: 1707955,
      tmdbId: 1707955,
      title: '呪いのスマホ',
      date: '2026-11-13',
      event: 'theatrical',
      service: '劇場公開',
    }],
  };
  let databaseReads = 0;
  const context = vm.createContext({
    calendarSnapshot: () => snapshot,
    Request,
    json: value => value,
    rateLimited: () => null,
    options: () => null,
    prisma: {
      release: {
        findMany: async () => {
          databaseReads += 1;
          return [{
            date: new Date('2026-11-13'),
            event: 'theatrical',
            service: '劇場公開',
            movie: { id: 'stale-db-id', tmdbId: 1737072, title: '呪いのスマホ' },
          }];
        },
      },
    },
  });
  vm.runInContext(source + '\nthis.handler = GET;', context);

  const response = await context.handler(new Request('https://cinelva.test/api/calendar'));
  assert.deepEqual(JSON.parse(JSON.stringify(response)), snapshot);
  assert.equal(response.movies.length, 1);
  assert.equal(response.movies[0].tmdbId, 1707955);
  assert.equal(databaseReads, 0, 'calendar must not mix stale database releases into the reviewed snapshot');
});
