const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const search = fs.readFileSync('search.html', 'utf8');
const calendar = fs.readFileSync('index.html', 'utf8');
const theme = fs.readFileSync('assets/theme.css', 'utf8');
const model = require('../js/screening-model-v7.js');
const evidence = JSON.parse(fs.readFileSync('data/screening_format_evidence.json', 'utf8'));

test('movie details always show runtime and provide a Filmarks search link', () => {
  assert.match(search, /row\('上映時間',movieRuntimeLabel\(m\)\)/);
  const start = search.indexOf('function movieRuntimeLabel(');
  const end = search.indexOf('function renderMovieInformation(', start);
  const context = { E: String };
  vm.createContext(context);
  vm.runInContext(search.slice(start, end), context);
  assert.equal(context.movieRuntimeLabel({ runtime: 135 }), '135分');
  assert.equal(context.movieRuntimeLabel({}), '未確認');
  assert.match(search, /filmarks\.com\/search\/movies\?term=/);
  assert.match(calendar, /filmarks\.com\/search\/movies\?term=/);
});

test('detail timeline follows production information and related films are last', () => {
  assert.ok(search.indexOf("group('製作情報'") < search.indexOf("公開・視聴タイムライン"));
  assert.ok(search.indexOf("公開・視聴タイムライン") < search.indexOf("作り手の別作品へ"));
  // Check the call in the rendered detail template, not the helper's earlier
  // function declaration; declaration order does not determine section order.
  assert.ok(search.indexOf("作り手の別作品へ") < search.indexOf("+renderMovieRelated(m)"));
  assert.match(calendar, /\+rating\+info\+timeline\+story/);
});

test('light mode renders format cards legibly and marks one recommendation', () => {
  assert.match(search, /formatCompactRecommended/);
  assert.match(theme, /html\[data-theme="light"\] #detail \.formatCompact/);
  assert.match(theme, /\.experienceFitCard\.recommended/);
});

test('Godzilla Minus Zero recommends IMAX from its official format evidence', () => {
  const movie = { id: 'no-tmdb-id', title: 'ゴジラ-0.0', original_title: 'Godzilla Minus Zero', year: 2026, genres: ['アクション', 'SF'], overview: '大規模な怪獣映画' };
  const rows = model.scoreMovie(movie, evidence);
  const imax = rows.find(row => row.key === 'imax');
  assert.equal(imax.score, 5);
  assert.equal(imax.sources[0].url, 'https://godzilla-minuszero.toho-movie.jp/format.html');
  const recommended = rows.reduce((a, b) => b.score > a.score ? b : a, rows[0]);
  assert.equal(recommended.key, 'imax');
});
