const {test}=require('node:test'),assert=require('node:assert/strict');
const {createReadFallback,calendarSnapshot,movieSnapshot,tvSnapshot,theaterSnapshot,releaseSnapshot}=require('../backend/lib/catalog-snapshot.cjs');
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
 const rows=movieSnapshot('スターウォーズ',3);assert.ok(rows.movies.length);assert.ok(rows.movies.length<=3);
 assert.equal(new Set(rows.movies.map(m=>String(m.tmdbId||m.id))).size,rows.movies.length);
});
test('TV, theater filters and release interval retain established API response shapes',()=>{
 assert.ok(tvSnapshot().movies.length);const all=theaterSnapshot('','');assert.ok(all.theaters.length);
 const filtered=theaterSnapshot('','東京都');assert.ok(filtered.theaters.length);assert.ok(filtered.theaters.every(t=>t.prefecture==='東京都'));assert.equal(filtered.count,filtered.theaters.length);
 const rows=releaseSnapshot('2026-10-01','2026-11-01','Lemino');assert.equal(rows.count,2);
 assert.ok(rows.releases.every(r=>r.movie&&r.service==='Lemino'&&r.date>='2026-10-01'&&r.date<'2026-11-01'));
});
test('release fallback normalizes movie identity and foreign keys and preserves date/service ordering',()=>{
 const r=releaseSnapshot('2026-01-01','2027-01-01','');
 assert.ok(r.releases.some(x=>x.movie.tmdbId===1244492));
 assert.ok(r.releases.every(x=>x.movieId===x.movie.id));
 const input=require('../data/movies.json').movies.find(x=>typeof x.id==='number'&&!x.tmdbId&&x.date>='2026-01-01'&&x.date<'2027-01-01');
 assert.ok(r.releases.some(x=>x.movie.tmdbId===input.id));
 for(let i=1;i<r.releases.length;i++)assert.ok(r.releases[i-1].date<=r.releases[i].date);
 const lemino=releaseSnapshot('2026-10-01','2026-11-01','Lemino');assert.equal(lemino.releases[0].date.slice(0,10),'2026-10-02');
});
