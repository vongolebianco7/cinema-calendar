const test = require('node:test');
const assert = require('node:assert/strict');
const Insights = require('../js/cinelva-insights.js');

test('genre normalization keeps animation separate and does not invent human drama', () => {
  const result = Insights.classifyGenres([{ id: 16, name: 'Animation' }, { id: 878, name: 'Science Fiction' }, { id: 18, name: 'Drama' }]);
  assert.deepEqual(result.genres, ['SF']);
  assert.deepEqual(result.formats, ['アニメーション']);
  assert.equal(result.genres.includes('ドラマ'), false);
});

test('3D plot coordinates use release year, country latitude, and genre category', () => {
  const point = Insights.pointForRecord({ id: 7, year: 2000, countries: ['日本'], genres: ['SF'], rating: 4.5 });
  assert.equal(point.year, 2000);
  assert.equal(point.country, '日本');
  assert.equal(point.genre, 'SF');
  assert.ok(point.coordinates.x > 0 && point.coordinates.x < 1);
  assert.ok(point.coordinates.y > 0.5);
  assert.ok(point.coordinates.z >= 0 && point.coordinates.z <= 1);
  assert.equal(point.size, 1.45);
});

test('award heatmap counts unique viewed films by award and decade', () => {
  const records = [{ id: '1', title: 'Film A', year: 1999 }, { id: '2', title: 'Film B', year: 2001 }];
  const awards = [
    { organization: 'カンヌ国際映画祭', year: 1999, title: 'Film A', category: '最高賞' },
    { organization: 'カンヌ国際映画祭', year: 1999, title: 'Film A', category: '監督賞' },
    { organization: 'カンヌ国際映画祭', year: 2001, title: 'Film B', category: '最高賞' },
  ];
  const result = Insights.buildAwardHeatmap(records, awards);
  assert.deepEqual(result.decades, [1990, 2000]);
  assert.equal(result.cells['カンヌ国際映画祭:1990'].count, 1);
  assert.equal(result.cells['カンヌ国際映画祭:2000'].count, 1);
  assert.equal(result.cells['カンヌ国際映画祭:1990'].coverage, 'partial');
  assert.equal(result.cells['カンヌ国際映画祭:1990'].completionRate, null);
});

test('zero-score and unrated records remain separate from deletion', () => {
  const source = require('../js/cinelva-library-records.js');
  const values = new Map();
  global.localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
  source.save({ id: 8, title: 'Zero' }, 0, null);
  source.saveUnrated({ id: 9, title: 'Unrated' }, null);
  const all = source.all();
  assert.equal(all.find(x => x.id === '8').rating, 0);
  assert.equal(all.find(x => x.id === '9').rating, null);
  assert.equal(source.remove('9'), true);
  assert.equal(source.all().some(x => x.id === '9'), false);
  delete global.localStorage;
});

test('documentary never implies human narrative and numeric TMDB genres preserve independent axes', () => {
  assert.deepEqual(Insights.classifyGenres(['ドキュメンタリー']).genres, []);
  assert.deepEqual(Insights.classifyGenres([16, 878, 99]).formats, ['アニメーション']);
  assert.deepEqual(Insights.classifyGenres([16, 878, 99]).workForms, ['ドキュメンタリー']);
  assert.deepEqual(Insights.classifyGenres(['ストップモーション']).formats, ['ストップモーション']);
});

test('award IDs override same-title remakes and expose unwatched sourced films', () => {
  const records = [{id:'1',title:'Remake',year:2000},{id:'2',title:'Original',year:1950}];
  const awards = [
    {organization:'賞',year:1951,title:'Remake',tmdb_id:2,category:'作品',source:'https://example.org/1951'},
    {organization:'賞',year:1951,title:'Remake',tmdb_id:2,category:'音楽',source:'https://example.org/1951'},
    {organization:'賞',year:1951,title:'Unseen',tmdb_id:3,category:'撮影',source:'https://example.org/1951'},
  ];
  const cell=Insights.buildAwardHeatmap(records,awards).cells['賞:1950'];
  assert.equal(cell.count,1);
  assert.equal(cell.films[0].id,'2');
  assert.equal(cell.entries.length,2);
  assert.equal(cell.entries.find(x=>x.id==='3').watched,false);
  assert.equal(cell.entries.find(x=>x.id==='2').categories.length,2);
});

test('title fallback rejects ambiguous same-title works and ignores unwatched records', () => {
  const a={organization:'賞',year:2025,title:'Same',category:'作品'};
  const result=Insights.buildAwardHeatmap([{id:1,title:'Same',year:2024},{id:2,title:'Same',year:2023}], [a]);
  assert.equal(result.cells['賞:2020'].count,0);
  assert.equal(Insights.buildAwardHeatmap([{id:1,title:'Same',year:2024,watched:false}], [a]).cells['賞:2020'].count,0);
});
