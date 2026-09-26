const assert = require('node:assert/strict');
const fs = require('node:fs');
const {forMovie, normalize} = require('../js/critic-evidence');
const source = n => ({id:`s${n}`, name:`出典${n}`, publisher:`媒体${n}`, url:`https://example.org/review/${n}`});
const sources = Array.from({length:10},(_,i)=>source(i+1));
assert.deepEqual(forMovie({films:{}}, 123).sources, []);
assert.equal(normalize({sources:sources.slice(0,2), overview:{text:'根拠不足の総評',sourceIds:['s1','s2']}}).overview, null);
const valid = normalize({
  sources,
  overview:{text:'複数の評者が構成に着目した。',sourceIds:['s1','s2','s3']},
  positive:[{text:'演技に言及する。',sourceIds:['s1','s2']},{text:'単独意見',sourceIds:['s3']}],
  divided:[{text:'結末について意見が分かれる。',sourceIds:['s1','s2'],positiveSourceIds:['s1'],negativeSourceIds:['s2']},
    {text:'対立を確認できない',sourceIds:['s3','s4'],positiveSourceIds:['s3'],negativeSourceIds:[]}],
  stances:sources.map((x,i)=>({sourceId:x.id,value:i<6?'positive':i<8?'mixed':'negative'}))
});
assert.equal(valid.overview.text,'複数の評者が構成に着目した。');
assert.equal(valid.positive.length,1);
assert.equal(valid.divided.length,1);
assert.deepEqual(valid.ratio,{total:10,percent:60});
assert.equal(normalize({sources:sources.slice(9),stances:[{sourceId:'s10',value:'positive'}]}).ratio,null);
assert.equal(normalize({sources:[{id:'bad',name:'危険',url:'javascript:alert(1)'}],overview:{text:'x',sourceIds:['bad']}}).sources.length,0);
const db=JSON.parse(fs.readFileSync('data/critic_evidence.json','utf8'));
assert.equal(db.version,1);
for(const [id,entry] of Object.entries(db.films)){
  assert.match(id,/^\d+$/);
  const normalized=normalize(entry);
  assert.ok(normalized.sources.length>=3,`${id}: at least 3 sources required`);
  assert.ok(normalized.overview,`${id}: summary must cite 3 sources`);
}
console.log('critic evidence checks passed');
