const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function search(query, records, year = 'all') {
  const elements = { recordSearch: { value: query }, recordYear: { value: year }, recordSort: { value: 'title' }, recordList: {} };
  const source = fs.readFileSync('js/cinelva-records-page.js', 'utf8');
  const helpers = source.slice(source.indexOf('  const normalizeRecordSearch ='), source.indexOf('  function renderList()'));
  const render = source.slice(source.indexOf('  function renderList()'), source.indexOf('  const TAB_STORAGE_KEY'));
  vm.runInNewContext(helpers + render + '\nrenderList();', {
    $: id => elements[id], mountRecordReviewAreas(){},recordMovies: () => records, enriched: movie => movie,
    metadataFor: () => ({}), dateOf: movie => movie.watchedAt || '',
    card: movie => `<article>${movie.title}</article>`,
  });
  return elements.recordList.innerHTML;
}

test('My Cinelva record search ignores separators, spaces and character width', () => {
  const records = [{ id: 1, title: 'スター・ウォーズ', watchedAt: '2026-01-01' }, { id: 2, title: 'ＡＬＩＥＮ' }];
  assert.match(search('スターウォーズ', records), /<article>スター・ウォーズ/);
  assert.match(search(' スター　ウォーズ ', records), /<article>スター・ウォーズ/);
  assert.match(search('alien', records), /<article>ＡＬＩＥＮ/);
});

test('My Cinelva record search matches original titles and normalized director names', () => {
  const records = [{ id: 1, title: 'インターステラー', original_title: 'Interstellar', director: 'クリストファー・ノーラン' }];
  assert.match(search('INTERSTELLAR', records), /<article>インターステラー/);
  assert.match(search('クリストファーノーラン', records), /<article>インターステラー/);
});

test('normalized record search still applies the viewing-year filter', () => {
  const records = [{ id: 1, title: 'スター・ウォーズ', watchedAt: '2025-01-01' }];
  assert.match(search('スターウォーズ', records, '2025'), /<article>スター・ウォーズ/);
  assert.doesNotMatch(search('スターウォーズ', records, '2026'), /<article>/);
  assert.match(search('', records), /<article>スター・ウォーズ/);
});
