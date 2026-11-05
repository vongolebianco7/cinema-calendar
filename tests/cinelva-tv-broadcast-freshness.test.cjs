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
