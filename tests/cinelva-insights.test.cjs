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
