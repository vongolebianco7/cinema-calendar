const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const modulePath = path.resolve(__dirname, '../preview/ocean/js/ocean-ecosystem.js');
const ocean = require(modulePath);

function fixture(count, rating = 3.5) {
  const genres = ['SF','アクション','アニメ','コメディ','ホラー','ミステリー','ファンタジー','ロマンス'];
  const catalog = Array.from({length: count}, (_, i) => ({
    id: i + 1,
    title: `Film ${i + 1}`,
    genres: [genres[i % genres.length]],
    year: 1980 + (i % 45)
  }));
  const records = Object.fromEntries(catalog.map(f => [String(f.id), {id:f.id, watched:true, rating}]));
  return {catalog, records};
}

test('habitat becomes richer as viewing history grows', () => {
  const levels = [0,10,30,100].map(count => {
    const {catalog,records}=fixture(count);
    return ocean.build(catalog,records).habitat;
  });
  for (let i=1;i<levels.length;i++) {
    assert.ok(levels[i].reef > levels[i-1].reef, `reef ${i} should grow`);
    assert.ok(levels[i].vegetation > levels[i-1].vegetation, `vegetation ${i} should grow`);
    assert.ok(levels[i].schools >= levels[i-1].schools, `schools ${i} should not shrink`);
  }
});

test('organism layout is deterministic and visually varied', () => {
  const {catalog,records}=fixture(30);
  const first=ocean.build(catalog,records);
  const second=ocean.build(catalog,records);
  assert.deepEqual(first,second);
  assert.ok(new Set(first.organisms.map(o=>o.scale.toFixed(2))).size >= 8);
  assert.ok(new Set(first.organisms.map(o=>o.depthBand)).size >= 3);
});

test('a 5.0 film is more prominent than the same ordinary film', () => {
  const {catalog,records}=fixture(12,3.5);
  const ordinary=ocean.build(catalog,records).organisms.find(o=>o.film.id===1);
  records['1'].rating=5;
  const best=ocean.build(catalog,records).organisms.find(o=>o.film.id===1);
  assert.ok(best.scale > ordinary.scale);
  assert.equal(best.hero,true);
});

test('large histories cap visible organisms for mobile performance', () => {
  const {catalog,records}=fixture(180);
  const scene=ocean.build(catalog,records);
  assert.ok(scene.organisms.length <= 64);
  assert.equal(scene.stats.watched,180);
});

test('empty records return a valid quiet ecosystem', () => {
  const scene=ocean.build([],{});
  assert.equal(scene.stats.watched,0);
  assert.equal(scene.organisms.length,0);
  assert.equal(scene.habitat.reef,0);
  assert.equal(scene.habitat.vegetation,0);
});
