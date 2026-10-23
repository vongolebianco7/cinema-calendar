'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const file=require('node:path').join(__dirname,'../js/cinelva-now-playing.js');
const now=Date.parse('2026-10-24T00:00:00Z');
const snapshot=(extra={})=>({schema_version:1,region:'JP',source:{id:'tmdb',endpoint:'/movie/now_playing'},complete:true,generated_at:'2026-10-24T00:00:00Z',movies:[{id:1,title:'上映中'}],...extra});
function api(){assert.ok(fs.existsSync(file),'now-playing module must exist');return require(file);}
test('only complete JP observations are current, with fresh empty results distinct',()=>{
 const {snapshotState}=api();assert.equal(snapshotState(snapshot(),now),'fresh');assert.equal(snapshotState(snapshot({movies:[]}),now),'empty');
 for(const extra of [{region:'US'},{complete:false},{source:{id:'other'}},{generated_at:null},{movies:[{id:'bad',title:'作品'}]}])assert.equal(snapshotState(snapshot(extra),now),'unavailable');
});
test('stale and implausibly future observations cannot become current',()=>{
 const {snapshotState}=api();assert.equal(snapshotState(snapshot({generated_at:new Date(now-36*3600000).toISOString()}),now),'fresh');
 assert.equal(snapshotState(snapshot({generated_at:new Date(now-36*3600000-1).toISOString()}),now),'stale');
 assert.equal(snapshotState(snapshot({generated_at:new Date(now+300001).toISOString()}),now),'unavailable');
 assert.equal(snapshotState(snapshot({generated_at:'not a date'}),now),'unavailable');
});
test('search ignores punctuation and deduplicates by exact film identity',()=>{
 const {selectMovies}=api();const rows=[{id:1,title:'スター・ウォーズ',popularity:1},{id:1,title:'スターウォーズ重複',popularity:2},{id:2,title:'スター・ウォーズ 続編',popularity:3}];
 assert.deepEqual(selectMovies(rows,'スターウォーズ').map(x=>x.id),[2,1]);assert.equal(selectMovies(rows,'一致しない').length,0);
});
test('title sort and all-results selection retain unrated and posterless movies',()=>{
 const {selectMovies}=api();const rows=[{id:2,title:'い',score:0},{id:1,title:'あ',poster:null}];assert.deepEqual(selectMovies(rows,'','title').map(x=>x.id),[1,2]);
 assert.equal(selectMovies(Array.from({length:40},(_,i)=>({id:i+1,title:'映画'+i}))).length,40);
});
test('committed observation is either an explicit uninitialized file or valid source metadata',()=>{
 const data=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../data/now_playing.json'),'utf8'));
 if(data.complete===false){assert.equal(data.generated_at,null);assert.deepEqual(data.movies,[]);}
 else assert.notEqual(api().snapshotState(data),'unavailable');
});
test('offline detail uses an exact identity and never an invalid or future observation',async()=>{
 const original=global.fetch;let data=snapshot({generated_at:new Date().toISOString()});
 global.fetch=async()=>({ok:true,json:async()=>data});
 try{assert.equal((await api().detailFallback(1)).title,'上映中');assert.equal(await api().detailFallback(2),null);data={...data,region:'US'};assert.equal(await api().detailFallback(1),null);}
 finally{global.fetch=original;}
});
