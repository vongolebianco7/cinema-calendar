const test = require('node:test');
const assert = require('node:assert/strict');
const Context = require('../js/calendar-context.js');

test('preserves a selected calendar release through a movie detail link', () => {
  const href = Context.detailHref({id:872585,title:'オッペンハイマー',date:'2026-09-28',event:'streaming',service:'Prime Video'});
  const params = new URL(href, 'https://cinemap.example/').searchParams;
  const context = Context.read(params, {id:872585});
  assert.deepEqual(context, {date:'2026-09-28',event:'streaming',service:'Prime Video',backHref:'index.html?date=2026-09-28&mode=streaming'});
});

test('drops a calendar origin after opening a related movie', () => {
  const params = new URL(Context.detailHref({id:3,title:'A',date:'2026-10-02',event:'theatrical'}), 'https://cinemap.example/').searchParams;
  assert.equal(Context.read(params, {id:4}), null);
});

test('ignores malformed dates, unsupported event types, and titles without movie IDs', () => {
  assert.equal(Context.detailHref({title:'A',date:'2026-10-02',event:'streaming'}), null);
  assert.equal(Context.read(new URLSearchParams('id=3&date=2026-99-99&event=streaming'), {id:3}), null);
  assert.equal(Context.read(new URLSearchParams('id=3&date=2026-10-02&event=unknown'), {id:3}), null);
});

test('returns to the selected month and tab from a detail page', () => {
  assert.deepEqual(Context.initialCalendar(new URLSearchParams('date=2026-09-28&mode=streaming')), {date:'2026-09-28',mode:'streaming'});
  assert.equal(Context.initialCalendar(new URLSearchParams('date=2026-02-30&mode=streaming')), null);
});
