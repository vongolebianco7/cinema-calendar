const assert = require('node:assert/strict');
const fs = require('node:fs');

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
  { year: '1999', title: 'リング2 / 死国', titles: ['リング2', '死国'], ids: [9669, 68905], gross: 21 },
  { year: '2000', title: 'リング0 バースデイ / ISOLA 多重人格少女', titles: ['リング0 バースデイ', 'ISOLA 多重人格少女'], ids: [9674, 68820], gross: 16 }
];

const norm = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
for (const group of approvedGroups) {
  const rows = boxoffice.by_year[group.year].filter(item => item.source_group_title === group.title);
  assert.equal(rows.length, group.titles.length, 'each film has its own row');
  assert.equal(boxoffice.by_year[group.year].some(item => item.title === group.title), false, 'combined title row is removed');
  assert.equal(new Set(rows.map(item => item.gross)).size, 1, 'shared gross remains identical');
  assert.equal(rows[0].gross, group.gross);
  assert.ok(rows.every(item => Number(item.year) === Number(group.year)));

  for (const [index, title] of group.titles.entries()) {
    const row = rows.find(item => item.title === title);
    assert.ok(row, 'individual row exists for ' + title);
    assert.equal(Number(row.tmdbId), group.ids[index]);
    assert.match(row.tmdb, new RegExp('^https://www\\.themoviedb\\.org/movie/' + group.ids[index] + '$'));
    assert.match(row.poster, /^https:\/\/image\.tmdb\.org\/t\/p\/w\d+\//);
    const matches = catalogRows.filter(item => Number(item.id || item.tmdbId || item.tmdb_id) === group.ids[index]
      && norm(item.title) === norm(title)
      && Number(item.year) === Number(group.year)
      && item.poster === row.poster
      && item.tmdb === row.tmdb);
    assert.ok(matches.length > 0, 'TMDB identity and poster are present for ' + title);
  }
}

const starWars = boxoffice.by_year['1999'].filter(item => item.source_group_title === 'スター・ウォーズ エピソード1 / ファントム・メナス');
assert.equal(starWars.length, 1, 'slash inside one film title must not create two film rows');
assert.equal(starWars[0].title, 'スター・ウォーズ エピソード1 ファントム・メナス');
assert.equal(starWars[0].gross, 78);
assert.equal(Number(starWars[0].tmdbId), 1893);
assert.ok(starWars[0].poster);

const pokemon = boxoffice.by_year['1999'].filter(item => item.source_group_title === '劇場版 ポケットモンスター / 幻のポケモン・ルギア爆誕 / ピカチュウたんけんたい');
assert.deepEqual(pokemon.map(item => item.title), ['劇場版 ポケットモンスター 幻のポケモン・ルギア爆誕', 'ピカチュウたんけんたい']);
assert.deepEqual(pokemon.map(item => item.gross), [35, 35]);

console.log('Combined box-office records are split into individual films with the same gross and verified poster identities.');
