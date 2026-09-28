const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.resolve(__dirname, '../preview/ocean/js/ocean-ecosystem.js');

if (!fs.existsSync(modulePath)) {
  test('living Ocean ecosystem module exists', () => { assert.ok(false, 'preview/ocean/js/ocean-ecosystem.js must be implemented'); });
} else {
  const ocean = require(modulePath);
  function fixture(count, rating = 3.5) {
    const genres = ['SF','アクション','アニメ','コメディ','ホラー','ミステリー','ファンタジー','ロマンス'];
    const catalog = Array.from({length: count}, (_, i) => ({id:i+1,title:`Film ${i+1}`,genres:[genres[i%genres.length]],year:1980+(i%45)}));
    const records = Object.fromEntries(catalog.map(f => [String(f.id), {id:f.id, watched:true, rating}]));
    return {catalog, records};
  }
  test('habitat becomes richer as viewing history grows', () => {
    const levels=[0,10,30,100].map(count=>{const {catalog,records}=fixture(count);return ocean.build(catalog,records).habitat;});
    for(let i=1;i<levels.length;i++){assert.ok(levels[i].reef>levels[i-1].reef);assert.ok(levels[i].vegetation>levels[i-1].vegetation);assert.ok(levels[i].schools>=levels[i-1].schools);}
  });
  test('rating watched films deepens the same personal ecosystem', () => {
    const {catalog,records}=fixture(24);
    Object.values(records).forEach(record=>{delete record.rating;});
    const watchedOnly=ocean.build(catalog,records);
    Object.values(records).forEach(record=>{record.rating=3.5;});
    const rated=ocean.build(catalog,records);
    assert.equal(watchedOnly.stats.watched,rated.stats.watched);
    assert.equal(watchedOnly.stats.rated,0);
    assert.equal(rated.stats.rated,24);
    assert.ok(rated.maturity>watchedOnly.maturity);
    assert.ok(rated.habitat.reef>watchedOnly.habitat.reef);
    assert.ok(rated.habitat.vegetation>watchedOnly.habitat.vegetation);
  });
  test('growth milestones make each viewing step visibly explainable', () => {
    const empty=ocean.build([],{});
    const one=fixture(1); const first=ocean.build(one.catalog,one.records);
    const twelve=fixture(12); const growing=ocean.build(twelve.catalog,twelve.records);
    assert.equal(empty.milestone.stage,0);
    assert.match(empty.milestone.label,/静かな海/);
    assert.ok(first.milestone.stage>=1,'the first watched film should visibly wake the Ocean');
    assert.ok(first.milestone.nextAt>first.stats.watched,'next growth target should be actionable');
    assert.ok(growing.milestone.stage>first.milestone.stage,'continued viewing should unlock a visibly richer stage');
    assert.ok(growing.milestone.label.length>0);
  });
  test('organism layout is deterministic and visually varied', () => {
    const {catalog,records}=fixture(30),first=ocean.build(catalog,records),second=ocean.build(catalog,records);
    assert.deepEqual(first,second);assert.ok(new Set(first.organisms.map(o=>o.scale.toFixed(2))).size>=8);assert.ok(new Set(first.organisms.map(o=>o.depthBand)).size>=3);
  });
  test('real-world silhouette scale creates a strong food-web hierarchy', () => {
    const catalog=[{id:801,title:'Whale',ecologyType:'whale-0',genres:['ドラマ']},{id:802,title:'Clownfish',ecologyType:'clownfish-0',genres:['ドラマ']},{id:803,title:'Seahorse',ecologyType:'seahorse-0',genres:['ドラマ']}];
    const records=Object.fromEntries(catalog.map(f=>[String(f.id),{id:f.id,watched:true,rating:3.5}]));
    const scene=ocean.build(catalog,records),whale=scene.organisms.find(o=>o.film.id===801),clown=scene.organisms.find(o=>o.film.id===802),horse=scene.organisms.find(o=>o.film.id===803);
    assert.ok(whale.visualScale>=4);assert.ok(clown.visualScale<=.7);assert.ok(horse.visualScale<=.6);assert.ok(whale.visualScale/clown.visualScale>=6);
  });
  test('mature scene is sparse and balanced instead of a megafauna collage', () => {
    const families=['whale-0','whaleshark-0','mantaray-0','clownfish-0','seahorse-0','angelfish-0','seastar-0','jelly-0'];
    const catalog=Array.from({length:80},(_,i)=>({id:1000+i,title:`Eco ${i}`,ecologyType:families[i%families.length],genres:['ドラマ']}));
    const records=Object.fromEntries(catalog.map(f=>[String(f.id),{id:f.id,watched:true,rating:3.5}]));
    const scene=ocean.build(catalog,records),mega=scene.organisms.filter(o=>o.visualScale>=2.2),small=scene.organisms.filter(o=>o.visualScale<1);
    assert.ok(scene.organisms.length<=22,'iPhone scene should be composed, not tiled');
    assert.ok(mega.length<=3,'megafauna must stay rare');
    assert.ok(small.length>=6,'small reef/benthic life must remain visible');
  });
  test('benthic and drifting species occupy plausible ecological niches', () => {
    const catalog=[{id:901,title:'Benthic',ecologyType:'seastar-0',genres:['ドラマ']},{id:902,title:'Drifter',ecologyType:'jelly-0',genres:['ドラマ']}],records={'901':{id:901,watched:true,rating:4},'902':{id:902,watched:true,rating:4}};
    const scene=ocean.build(catalog,records),benthic=scene.organisms.find(o=>o.film.id===901),drifter=scene.organisms.find(o=>o.film.id===902);
    assert.equal(benthic.niche,'benthic');assert.ok(benthic.y>=70);assert.equal(drifter.niche,'drifter');assert.ok(drifter.y<=68);
  });
  test('movement style follows ecology instead of one shared animation', () => {
    const catalog=[{id:911,title:'Star',ecologyType:'seastar-0',genres:['ドラマ']},{id:912,title:'Whale',ecologyType:'whale-0',genres:['ドラマ']},{id:913,title:'Jelly',ecologyType:'jelly-0',genres:['ドラマ']}],records=Object.fromEntries(catalog.map(f=>[String(f.id),{id:f.id,watched:true,rating:4}]));
    const scene=ocean.build(catalog,records);assert.equal(scene.organisms.find(o=>o.film.id===911).motion,'grounded');assert.equal(scene.organisms.find(o=>o.film.id===912).motion,'cruise');assert.equal(scene.organisms.find(o=>o.film.id===913).motion,'drift');
  });
  test('a 5.0 film is more prominent than the same ordinary film', () => {
    const {catalog,records}=fixture(12,3.5),ordinary=ocean.build(catalog,records).organisms.find(o=>o.film.id===1);records['1'].rating=5;const best=ocean.build(catalog,records).organisms.find(o=>o.film.id===1);assert.ok(best.scale>ordinary.scale);assert.equal(best.hero,true);
  });
  test('large histories cap focal organisms for mobile performance', () => {const {catalog,records}=fixture(180);const scene=ocean.build(catalog,records);assert.ok(scene.organisms.length<=22);assert.equal(scene.stats.watched,180);});
  test('empty records return a valid quiet ecosystem', () => {const scene=ocean.build([],{});assert.equal(scene.stats.watched,0);assert.equal(scene.stats.rated,0);assert.equal(scene.organisms.length,0);assert.equal(scene.habitat.reef,0);assert.equal(scene.habitat.vegetation,0);});
}
