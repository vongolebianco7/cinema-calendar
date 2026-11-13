const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('rankings.html', 'utf8');
const boxoffice = JSON.parse(fs.readFileSync('data/boxoffice.json', 'utf8'));
const catalog = JSON.parse(fs.readFileSync('data/rankings.json', 'utf8'));

const catalogRows = [];
function collect(value) {
  if (Array.isArray(value)) return value.forEach(collect);
  if (!value || typeof value !== 'object') return;
  if (value.title && value.poster && (value.id || value.tmdbId || value.tmdb_id)) catalogRows.push(value);
  Object.values(value).forEach(collect);
}
collect(catalog.rankings);

const approvedGroups = [
  { year: '1999', title: 'リング2 / 死国', titles: ['リング2', '死国'], ids: [9669, 68905] },
  { year: '2000', title: 'リング0 バースデイ / ISOLA 多重人格少女', titles: ['リング0 バースデイ', 'ISOLA 多重人格少女'], ids: [9674, 68820] }
];

const norm = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
for (const group of approvedGroups) {
  const row = boxoffice.by_year[group.year].find(item => item.title === group.title);
  assert.ok(row, `source row exists for ${group.title}`);
  assert.equal(row.poster, undefined, 'a grouped row must never receive a single-film poster');
  assert.equal(row.posters?.length, group.titles.length, 'each co-billed film has one explicit poster');
  assert.equal(row.gross, group.year === '1999' ? 21 : 16, 'shared gross remains intact');
  assert.equal(row.year, Number(group.year));

  const posters = row.posters;
  assert.deepEqual(posters.map(item => item.tmdbId), group.ids);
  assert.equal(new Set(posters.map(item => item.tmdbId)).size, group.titles.length, 'all films have distinct stable IDs');
  for (const [index, poster] of posters.entries()) {
    assert.equal(norm(poster.title), norm(group.titles[index]));
    assert.equal(Number(poster.year), Number(group.year));
    assert.match(poster.tmdb, new RegExp(`^https://www\\.themoviedb\\.org/movie/${poster.tmdbId}$`));
    assert.match(poster.poster, /^https:\/\/image\.tmdb\.org\/t\/p\/w\d+\//);
    const matches = catalogRows.filter(item => Number(item.id || item.tmdbId || item.tmdb_id) === poster.tmdbId
      && norm(item.title) === norm(poster.title)
      && Number(item.year) === Number(group.year)
      && item.poster === poster.poster
      && item.tmdb === poster.tmdb);
    assert.ok(matches.length > 0, `TMDB artwork and identity are present in the existing catalog for ${poster.title}`);
  }
}

const normalizeSource = html.slice(html.indexOf('const normalizeBoxTitle='), html.indexOf('let boxMovieIndexPromise='));
const helperStart = html.indexOf('function boxPosterItems(');
assert.notEqual(helperStart, -1, 'rankings renderer exposes its fail-closed grouped artwork validator');
const helperSource = html.slice(helperStart, html.indexOf('async function resolveMovie(', helperStart));
const context = { boxPosterUrl: value => value || '' };
vm.runInNewContext(`${normalizeSource}${helperSource};globalThis.boxPosterItems=boxPosterItems`, context);

for (const group of approvedGroups) {
  const row = boxoffice.by_year[group.year].find(item => item.title === group.title);
  assert.equal(context.boxPosterItems(row).length, 2);
  assert.equal(context.boxPosterItems({ ...row, posters: row.posters.slice(0, 1) }).length, 0, 'partial evidence fails closed');
  assert.equal(context.boxPosterItems({ ...row, posters: row.posters.map(item => ({ ...item, tmdbId: row.posters[0].tmdbId })) }).length, 0, 'duplicate IDs fail closed');
  assert.equal(context.boxPosterItems({ ...row, posters: row.posters.map(item => ({ ...item, tmdb: 'https://example.com/movie' })) }).length, 0, 'non-TMDB detail links fail closed');
}

console.log('Two compound box-office rows use only complete, distinct, catalog-backed TMDB poster sets; rank and shared gross stay unchanged.');
