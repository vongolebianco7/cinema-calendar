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

test('editing and saving preserves classification, original identity, and legacy date metadata',()=>{
 const {api}=setup({'42':{title:'Old',watched:true,rating:null,watchedAt:'2024-05',countries:['Japan'],runtime:95}});
 assert.equal(api.all()[0].watchedAt,'2024-05');
 api.save({...movie,countries:['Japan'],runtime:95,original_title:'Original',formats:['実写'],workForms:['フィクション']},4);
 const record=api.all()[0];
 assert.equal(record.watchedAt,'2024-05');
 assert.deepEqual(Array.from(record.countries),['Japan']);
 assert.equal(record.runtime,95);
 assert.equal(record.original_title,'Original');
 assert.equal(api.summary([record,{id:43,rating:null,watched:true,watchedAt:'2026-10'}],2026,10).total,2);
});

test('restore validates every row before writing and retains unrated and unwatched state',()=>{
 const {api,data}=setup();api.save(movie,0,'2026');
 assert.equal(typeof api.restore,'function');
 const before=data.get(api.KEY);
 assert.throws(()=>api.restore([{id:43,title:'Valid',rating:null},{id:44,title:'Invalid',rating:8}]));
 assert.equal(data.get(api.KEY),before);
 api.restore([{id:43,title:'Unrated',rating:null,watchedAt:'2025-02',countries:['France']},{id:44,title:'Not watched',rating:null,watched:false}]);
 assert.equal(api.all().find(r=>r.id==='44').watched,false);
 assert.equal(api.all().find(r=>r.id==='43').rating,null);
 assert.equal(api.summary(api.all(),2026,10).total,2);
});

test('restore rolls back legacy visibility when record storage quota fails',()=>{
 const {api,data,storage}=setup({'42':{title:'Old',watched:true,rating:null}});
 api.remove(42);const before=data.get(api.KEY),deleted=data.get(api.DELETED);
 const original=storage.setItem;storage.setItem=(key,val)=>{if(key===api.KEY)throw Error('quota');original(key,val);};
 assert.throws(()=>api.restore([{id:42,title:'Restored',rating:null}]),/quota/);
 assert.equal(data.get(api.KEY),before);assert.equal(data.get(api.DELETED),deleted);
 assert.equal(api.all().length,0);
});

test('malformed classification metadata is rejected before any restore write',()=>{
 const {api,data}=setup();api.save(movie,0,null);const before=data.get(api.KEY);
 for(const field of ['genres','countries','formats','workForms']){
  assert.throws(()=>api.restore([{id:43,title:'Bad metadata',rating:null,[field]:{}}]));
  assert.equal(data.get(api.KEY),before);
 }
});

test('date editor contract supports partial year and clears dates intentionally',()=>{
 const fs=require('node:fs');
 const page=fs.readFileSync('my-cinelva/index.html','utf8');
 const script=fs.readFileSync('js/cinelva-records-page.js','utf8');
 assert.match(page,/id="watchedAt" type="text"/);
 assert.match(page,/YYYY \/ YYYY-MM \/ YYYY-MM-DD/);
 assert.match(script,/const typedDate=\$\('watchedAt'\)\.value\.trim\(\), date=typedDate\|\|null/);
 const {api}=setup();
 api.save(movie,0,'2025-05');
 api.save(movie,0,'2025');
 assert.equal(api.all()[0].watchedAt,'2025');
 api.save(movie,0,null);
 assert.equal(api.all()[0].watchedAt,null);
 assert.equal(api.all()[0].rating,0);
});
