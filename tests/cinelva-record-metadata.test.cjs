const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/cinelva-records-page.js', 'utf8');
const helper = source.slice(source.indexOf('  const enriched ='), source.indexOf('  const dateOf ='));

test('imported records use their explicit film identity for metadata and retain local edit IDs', () => {
  const catalog = new Map([
    ['42', { director: '別作品の監督', year: 2000, genres: ['恋愛'], countries: ['日本'] }],
    ['99', { director: '正しい監督', year: 2020, genres: ['SF'], countries: ['アメリカ'] }],
  ]);
  const context = { metadataFor: id => catalog.get(String(id)) || {}, countryJP: value => value };
  vm.runInNewContext(helper + '\nglobalThis.enrich = enriched;', context);
  for (const identity of [{ tmdbId: 99 }, { tmdb_id: 99 }]) {
    const record = { id: 42, ...identity, rating: 4.2, watchedAt: '2024', custom: 'keep' };
    const before = JSON.stringify(record);
    const result = context.enrich(record);
    assert.equal(result.director, '正しい監督');
    assert.equal(result.year, 2020);
    assert.equal(result.genres[0], 'SF');
    assert.equal(result.countries[0], 'アメリカ');
    assert.equal(result.id, 42);
    assert.equal(result.custom, 'keep');
    assert.equal(JSON.stringify(record), before);
  }
});
