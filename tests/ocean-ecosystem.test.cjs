const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.resolve(__dirname, '../preview/ocean/js/ocean-ecosystem.js');

if (!fs.existsSync(modulePath)) {
  test('living Ocean ecosystem module exists', () => {
    assert.ok(false, 'preview/ocean/js/ocean-ecosystem.js must be implemented');
  });
} else {
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

  test('benthic and drifting species occupy plausible ecological niches', () => {
    const catalog=[
      {id:901,title:'Benthic',ecologyType:'seastar-0',genres:['ドラマ']},
      {id:902,title:'Drifter',ecologyType:'jelly-0',genres:['ドラマ']}
    ];
    const records={'901':{id:901,watched:true,rating:4},'902':{id:902,watched:true,rating:4}};
    const scene=ocean.build(catalog,records);
    const benthic=scene.organisms.find(o=>o.film.id===901);
    const drifter=scene.organisms.find(o=>o.film.id===902);
    assert.equal(benthic.niche,'benthic');
    assert.ok(benthic.y>=70,'benthic life should stay near the reef floor');
    assert.equal(drifter.niche,'drifter');
    assert.ok(drifter.y<=68,'drifters should remain in the water column');
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
}
