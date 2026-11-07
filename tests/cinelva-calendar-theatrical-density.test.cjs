const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('function monthVisibleBounds(');
assert.notEqual(start, -1, 'month boundary helper exists in production');
const end = html.indexOf('\n}', start) + 2;
const context = vm.createContext({ Date });
vm.runInContext(html.slice(start, end), context);

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

test('theater month header and week labels are clipped to the selected month', () => {
  assert.match(html, /monthBounds\.start\.getMonth\(\).*monthBounds\.start\.getDate\(\)/);
  assert.match(html, /const visibleStart=ws<monthBounds\.start\?monthBounds\.start:ws,visibleEnd=we>monthBounds\.end\?monthBounds\.end:we/);
  assert.match(html, /visibleStart\.getMonth\(\).*visibleEnd\.getMonth\(\)/);
});

test('single-film weeks use a compact horizontal poster and details layout on mobile', () => {
  assert.match(html, /\.calendar\.theatricalWeekMode \.streamingWeekMovies \.streamMovie:only-child\{display:grid;grid-template-columns:76px minmax\(0,1fr\)/);
  assert.match(html, /@media\(max-width:760px\)[\s\S]*?\.calendar\.theatricalWeekMode \.streamingWeekFrame\{padding:6px\}/);
});
