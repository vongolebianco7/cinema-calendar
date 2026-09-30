const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const src=fs.readFileSync('preview/ocean/renderer/src/milestone-rewards.js','utf8');
const photo=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');

const expected=[
  [100,'カクレクマノミ'],
  [200,'ウミガメ'],
  [300,'大ダコ'],
  [400,'マンタ'],
  [500,'イルカ'],
  [600,'大型サメ'],
  [700,'シャチ'],
  [800,'ザトウクジラ'],
  [900,'ジンベイザメ'],
  [1000,'シロナガスクジラ']
];

test('Ocean milestone stars follow the approved 100-1000 film reward ladder',()=>{
  for(const [at,label] of expected){
    assert.match(src,new RegExp(`\\[${at},\\{[^\\n]*label:'${label}'`),`${at} films should unlock ${label}`);
  }
});

test('milestone rewards still replace one creature every 100 films',()=>{
  assert.match(src,/export const MILESTONE_STEP=100/);
  assert.match(src,/filter\(\(\[at\]\)=>at<=n\)/);
});

test('large commemorative creatures render as one clean hero image, not duplicated fish body/tail layers',()=>{
  assert.match(photo,/const hero=imgs\[0\]/);
  assert.match(photo,/imgs\.slice\(1\)\.forEach/);
  assert.match(photo,/style\.display='none'/);
  assert.match(photo,/style\.animation='none'/);
});
