const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('js/cinelva-library-records.js','utf8');
function setup(old={},fresh={}) {
  const data=new Map([['cinemap-viewing-records-v1',JSON.stringify(old)],['cinelva-library-records-v2',JSON.stringify(fresh)]]);
  const storage={getItem:key=>data.has(key)?data.get(key):null,setItem:(key,val)=>data.set(key,val)};
  const ctx={localStorage:storage};vm.createContext(ctx);vm.runInContext(source,ctx);
  return {api:ctx.CinelvaLibraryRecords,data,storage};
}
const movie={id:42,title:'テスト',year:2020,director:'監督'};
test('zero score persists, survives reload and preserves date on edit',()=>{
  const {api}=setup();api.save(movie,0,'2026-10-16');
  assert.equal(api.all()[0].rating,0);
  assert.equal(api.summary(api.all(),2026,10).total,1);
  api.save(movie,4.5);assert.equal(api.all()[0].watchedAt,'2026-10-16');
  assert.equal(api.all().length,1);
});
test('legacy key is never overwritten and legacy unrated stays separate',()=>{
  const original={'42':{id:'42',watched:true,rating:null,title:'旧作品'}};
  const {api,data}=setup(original);
  assert.equal(api.summary(api.all(),2026,10).legacyUnrated,1);
  api.save(movie,0,null);
  assert.deepEqual(JSON.parse(data.get('cinemap-viewing-records-v1')),original);
  assert.equal(api.all().length,1);
});
test('partial dates count only known periods',()=>{
  const {api}=setup();['2026','2026-10','2026-10-16'].forEach((d,i)=>api.save({...movie,id:42+i},0,d));
  const s=api.summary(api.all(),2026,10);assert.equal(s.total,3);assert.equal(s.year,3);assert.equal(s.month,2);
});
test('invalid dates and ratings are rejected, including impossible leap days',()=>{
  const {api}=setup();for(const date of ['2026-02-29','2026-13','2026-10-32','bad']) assert.throws(()=>api.save(movie,4,date));
  for(const score of [-1,5.1,1.11,NaN]) assert.throws(()=>api.save(movie,score,null));
  assert.equal(api.all().length,0);
});
test('deleting a legacy record hides it without mutating the legacy key',()=>{
  const legacy={'42':{watched:true,rating:3,title:'old'}};
  const {api,data}=setup(legacy);
  api.save(movie,4,null);assert.equal(api.all()[0].rating,4);
  assert.equal(api.remove(42),true);
  assert.equal(api.all().length,0);
  assert.deepEqual(JSON.parse(data.get('cinemap-viewing-records-v1')),legacy);
});
test('storage failure is reported rather than pretending to save',()=>{
  const {api,storage}=setup();storage.setItem=()=>{throw new Error('quota')};
  assert.throws(()=>api.save(movie,5,null),/quota/);
});
