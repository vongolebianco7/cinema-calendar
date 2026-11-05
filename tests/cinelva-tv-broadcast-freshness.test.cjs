'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { tokyoClock, upcomingTelevisionRows } = require('../backend/lib/tv-broadcasts.cjs');

test('TV API schedule filter keeps only broadcasts still upcoming in Japan time', () => {
  const now = new Date('2026-11-05T15:00:00.000Z'); // 2026-11-06 00:00 JST
  assert.deepEqual(tokyoClock(now), { date: '2026-11-06', time: '00:00' });
  const result = upcomingTelevisionRows([
    { id: 'yesterday', date: '2026-11-05', time: '23:59' },
    { id: 'earlier-today', date: '2026-11-06', time: '00:00' },
    { id: 'later-today', date: '2026-11-06', time: '00:01' },
    { id: 'tomorrow', date: '2026-11-07', time: '00:01' },
    { id: 'missing-time', date: '2026-11-07' },
    { id: 'invalid-date', date: 'soon', time: '01:00' },
    null,
  ], now);
  assert.deepEqual(result.map(row => row.id), ['later-today', 'tomorrow']);
});

test('TV API filter leaves source rows and their historical database data untouched', () => {
  const source = [{ id: 'past', date: '2026-11-05', time: '12:00' }, { id: 'future', date: '2026-11-07', time: '12:00' }];
  const original = structuredClone(source);
  assert.deepEqual(upcomingTelevisionRows(source, new Date('2026-11-06T00:00:00Z')).map(row => row.id), ['future']);
  assert.deepEqual(source, original);
});

test('TV API filters both database and static fallback responses without changing storage inputs', async () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const { stripTypeScriptTypes } = require('node:module');
  const now = new Date('2026-11-05T15:00:00.000Z');
  const expired = { title: 'expired', date: '2026-11-05', time: '23:59' };
  const currentMinute = { title: 'started', date: '2026-11-06', time: '00:00' };
  const future = { title: 'future', date: '2026-11-06', time: '00:01' };
  const snapshot = { generated_at: '2026-11-06T01:00:00Z', movies: [expired, currentMinute, future] };
  const code = stripTypeScriptTypes(fs.readFileSync('backend/app/api/tv/route.ts', 'utf8'), { mode: 'transform' })
    .replace(/^import .*?;/gm, '').replaceAll('export ', '');
  async function request(readWithSnapshot) {
    const context = {
      readWithSnapshot,
      tvSnapshot: () => snapshot,
      mergeTelevisionRows: (database, stored) => [...database, ...stored],
      upcomingTelevisionRows: rows => upcomingTelevisionRows(rows, now),
      prisma: { tvBroadcast: { findMany: async () => [{ payload: expired }] } },
      json: value => value,
      rateLimited: () => null,
      options: () => null,
    };
    vm.runInNewContext(code + ';globalThis.get=GET', context);
    return context.get({ url: 'https://fixture/api/tv' });
  }
  const live = await request(async read => read());
  assert.deepEqual(live.movies.map(row => row.title), ['future']);
  const fallback = await request(async (_read, getSnapshot) => getSnapshot());
  assert.deepEqual(fallback.movies.map(row => row.title), ['future']);
  assert.equal(expired.date, '2026-11-05', 'filtering must not mutate source rows');
});
