const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function month(count) {
  const nodes = new Map();
  const $ = id => {
    if (!nodes.has(id)) nodes.set(id, { classList: { add() {},remove() {} }, setAttribute() {} });
    return nodes.get(id);
  };
  const records = Array.from({ length: count }, (_, i) => ({ id: i + 1, watchedAt: '2026-01-02' }));
  const source = fs.readFileSync('js/cinelva-records-page.js', 'utf8');
  const action = source.slice(source.indexOf('  function renderYearHeatmap()'), source.indexOf('  function renderDateFilms('));
  vm.runInNewContext(action + '\nrenderYearHeatmap();', {
    state: { year: 2026 }, currentYear: 2026, recordMovies: () => records,
    dateOf: movie => movie.watchedAt, $,
  });
  const months = $('yearHeatmap').innerHTML.match(/<section[^]*?<\/section>/g);
  assert.equal(months.length, 12);
  return months[0];
}

test('annual calendar keeps high-volume months in the deepest blue tone', () => {
  for (const count of [5, 6, 10]) {
    const html = month(count);
    assert.match(html, /cy-month deep-month/);
    assert.doesNotMatch(html, /gold-month|cy-medal|GOLD/);
    assert.match(html, new RegExp('1月 ' + count + '本'));
  }
});

test('months below five have no gold medal and zero remains empty', () => {
  for (const count of [0, 1, 4]) {
    const html = month(count);
    assert.doesNotMatch(html, /gold-month|cy-medal|GOLD/);
    if (count === 0) assert.match(html, /empty-month/);
  }
});
