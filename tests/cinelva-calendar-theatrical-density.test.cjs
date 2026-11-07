const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('function monthVisibleBounds(');
assert.notEqual(start, -1, 'month boundary helper exists in production');
const end = html.indexOf('\n}', start) + 2;
const overlapStart = html.indexOf('function theatricalMoviesOverlappingWeek(');
assert.notEqual(overlapStart, -1, 'theater week overlap helper exists in production');
const overlapEnd = html.indexOf('\n}', overlapStart) + 2;
const context = vm.createContext({ Date, isoOf: (d) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-') });
vm.runInContext(html.slice(start, end) + '\n' + html.slice(overlapStart, overlapEnd), context);

test('theater month bounds exclude adjacent month dates', () => {
  for (const [year, month, expectedStart, expectedEnd] of [
    [2026, 10, '2026-11-01', '2026-11-30'],
    [2027, 1, '2027-02-01', '2027-02-28'],
  ]) {
    const bounds = context.monthVisibleBounds(new Date(year, month, 12));
    const localDate = (value) => [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-');
    assert.equal(localDate(bounds.start), expectedStart);
    assert.equal(localDate(bounds.end), expectedEnd);
  }
});

test('theater week results exclude adjacent-month films but keep screenings crossing month start', () => {
  const rows = [
    { title: 'October only', date: '2026-10-16', end_date: '2026-10-29' },
    { title: 'Crosses into November', date: '2026-10-31', end_date: '2026-11-02' },
    { title: 'November only', date: '2026-11-20' },
    { title: 'December only', date: '2026-12-04' },
  ];
  const firstWeek = context.theatricalMoviesOverlappingWeek(rows, new Date(2026, 9, 26), new Date(2026, 10, 1), new Date(2026, 10, 1), new Date(2026, 10, 30));
  assert.deepEqual(firstWeek.map((row) => row.title), ['Crosses into November']);
  const lastWeek = context.theatricalMoviesOverlappingWeek(rows, new Date(2026, 10, 30), new Date(2026, 11, 6), new Date(2026, 10, 1), new Date(2026, 10, 30));
  assert.deepEqual(lastWeek.map((row) => row.title), []);
});

test('theater month header and week labels are clipped to the selected month', () => {
  assert.match(html, /monthBounds\.start\.getMonth\(\).*monthBounds\.start\.getDate\(\)/);
  assert.match(html, /const visibleStart=ws<monthBounds\.start\?monthBounds\.start:ws,visibleEnd=we>monthBounds\.end\?monthBounds\.end:we/);
  assert.match(html, /visibleStart\.getMonth\(\).*visibleEnd\.getMonth\(\)/);
});

test('single-film weeks use a compact horizontal poster and details layout on mobile', () => {
  assert.match(html, /\.calendar\.theatricalWeekMode \.streamingWeekMovies \.streamMovie:only-child\{display:grid;grid-template-columns:76px minmax\(0,1fr\)/);
  assert.match(html, /@media\(max-width:760px\)[\s\S]*?\.calendar\.theatricalWeekMode \.streamingWeekFrame\{padding:6px\}/);
});
