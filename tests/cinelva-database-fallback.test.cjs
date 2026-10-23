const {test}=require('node:test'),assert=require('node:assert/strict');
const {createReadFallback,calendarSnapshot,movieSnapshot,tvSnapshot,theaterSnapshot,releaseSnapshot}=require('../backend/lib/catalog-snapshot.cjs');
function snapshotFixture(movies){
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 const context={module:{exports:{}},setTimeout,clearTimeout,require:name=>{
  if(name==='../../data/movies.json')return {generated_at:'fixture-source-date',movies};
  if(name==='../../data/tv.json')return {movies:[]};
  if(name==='../../data/theaters_master.json')return {theaters:[]};
  throw Error('Unexpected fixture dependency: '+name);
 }};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../backend/lib/catalog-snapshot.cjs'),'utf8'),context);
 return context.module.exports;
}

test('database failure returns sourced static calendar without inventing a refresh timestamp',async()=>{
 const read=createReadFallback({timeoutMs:20,cooldownMs:50});const expected=calendarSnapshot();
 const result=await read(async()=>{throw Error('quota exceeded')},calendarSnapshot);
 assert.equal(result.data_source,'static_snapshot');assert.equal(result.database_status,'unavailable');
 assert.equal(result.generated_at,expected.generated_at);assert.ok(result.movies.length>50);
 assert.ok(result.movies.some(m=>m.tmdbId===1591961&&m.poster));
});
test('healthy database is preserved and outage cooldown avoids repeated failed connections',async()=>{
 let now=0,calls=0;const read=createReadFallback({timeoutMs:20,cooldownMs:50,now:()=>now});
 assert.deepEqual(await read(async()=>({movies:[{id:1}]}),calendarSnapshot),{movies:[{id:1}]});
 const fail=async()=>{calls++;throw Error('down')};await read(fail,calendarSnapshot);await read(fail,calendarSnapshot);assert.equal(calls,1);
 now=51;await read(fail,calendarSnapshot);assert.equal(calls,2);
});
test('hanging database is bounded and static search supports punctuation variants and limits',async()=>{
 const read=createReadFallback({timeoutMs:10,cooldownMs:50});const r=await read(()=>new Promise(()=>{}),calendarSnapshot);assert.equal(r.data_source,'static_snapshot');
 const fixture=snapshotFixture([{id:1,title:'スター・ウォーズ'},{id:1,title:'スターウォーズ 同じ作品'},{id:2,title:'スター・ウォーズ 続編'}]);
 const rows=fixture.movieSnapshot('スターウォーズ',3);assert.equal(rows.movies.length,2);assert.equal(fixture.movieSnapshot('',1).movies.length,1);
 assert.equal(new Set(rows.movies.map(m=>String(m.tmdbId||m.id))).size,rows.movies.length);
});
test('TV, theater filters and release interval retain established API response shapes',()=>{
 assert.ok(tvSnapshot().movies.length);const all=theaterSnapshot('','');assert.ok(all.theaters.length);
 const filtered=theaterSnapshot('','東京都');assert.ok(filtered.theaters.length);assert.ok(filtered.theaters.every(t=>t.prefecture==='東京都'));assert.equal(filtered.count,filtered.theaters.length);
 const rows=releaseSnapshot('2026-10-01','2026-11-01','Lemino');assert.ok(rows.count>=2);
 assert.ok(rows.releases.every(r=>r.movie&&r.service==='Lemino'&&r.date>='2026-10-01'&&r.date<'2026-11-01'));
});
test('release fallback normalizes movie identity and foreign keys and preserves date/service ordering',()=>{
 const fixture=snapshotFixture([
  {tmdbId:1244492,id:'database-id',title:'Primary identity',date:'2026-10-07',service:'B'},
  {tmdb_id:991,id:'legacy-database-id',title:'Legacy identity',date:'2026-10-02',service:'Z'},
  {id:992,title:'Numeric identity',date:'2026-10-02',service:'A'}
 ]);
 const r=fixture.releaseSnapshot('2026-10-01','2026-11-01','');
 assert.equal(r.generated_at,'fixture-source-date');assert.equal(r.count,3);
 assert.deepEqual(Array.from(r.releases,x=>x.movie.tmdbId),[992,991,1244492]);
 assert.ok(r.releases.every(x=>x.movieId===x.movie.id));
 assert.deepEqual(Array.from(r.releases,x=>x.movieId),['992','991','1244492']);
 assert.equal(r.releases[0].date,'2026-10-02T00:00:00.000Z');
 assert.equal(fixture.releaseSnapshot('2026-10-01','2026-10-07','B').count,0);
 assert.equal(fixture.releaseSnapshot('2026-10-07','2026-11-01','B').count,1);
});
