const { test } = require('node:test');
const assert = require('node:assert/strict');
const { snapshot } = require('../js/cinelva-theater-schedule.js');

const now = new Date('2026-10-17T03:00:00.000Z');
const schedule = (generated_at, dates) => ({
  generated_at,
  schedules: dates.map((date) => ({ theater: '109シネマズ港北', date, start: '10:00' })),
});

test('only fresh future official showtimes are available to the UI', () => {
  const result = snapshot(schedule('2026-10-17T02:30:00.000Z', ['2026-10-16', '2026-10-17', '2026-10-18']), now);
  assert.equal(result.fresh, true);
  assert.deepEqual(result.rows.map((row) => row.date), ['2026-10-17', '2026-10-18']);
  assert.equal(result.today, '2026-10-17');
});

test('stale or invalid snapshots never expose their showtimes', () => {
  assert.deepEqual(snapshot(schedule('2026-10-15T02:00:00.000Z', ['2026-10-18']), now).rows, []);
  assert.deepEqual(snapshot(schedule('not-a-date', ['2026-10-18']), now).rows, []);
});

test('a future-dated snapshot beyond the clock tolerance is rejected', () => {
  assert.equal(snapshot(schedule('2026-10-17T05:00:00.000Z', ['2026-10-18']), now).fresh, false);
});
