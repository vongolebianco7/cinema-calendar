const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={URL,document:{readyState:'complete',querySelectorAll:()=>[]}};
vm.runInNewContext(fs.readFileSync('js/cinelva-official-offers.js','utf8'),context);
const evidence=context.CinelvaOfficialOffers;
test('a dated official event remains visible when the provider snapshot has no rows',()=>{
 const movie=JSON.parse(fs.readFileSync('data/streaming.json')).movies.find(m=>m.tmdbId===1768182);
 const result=evidence.verifiedEvent?.(movie);
 assert.equal(result?.service,'Prime Video');
 assert.equal(result?.date,'2026-10-23');
 assert.equal(result?.label,'公式配信発表');
 assert.equal(result?.source_url,movie.source_url);
});
test('provider observations and unverified dates cannot become release announcements',()=>{
 for(const row of [
  {event:'streaming',service:'Netflix',date:'2026-02-30',source_url:'https://about.netflix.com/ja/new-to-watch'},
  {event:'streaming',service:'Netflix',date:'2026-10-01',source_url:'https://example.com'},
  {event:'theatrical',service:'劇場公開',date:'2026-10-01',source_url:'https://about.netflix.com/ja/new-to-watch'},
  {services:['Netflix'],checked_at:'2026-10-24'}
 ]) assert.equal(evidence.verifiedEvent?.(row),null);
});
test('October Netflix films have reviewed first-party Japan dates without TV entries',()=>{
 const rows=JSON.parse(fs.readFileSync('data/streaming_announcements.json')).movies.filter(m=>m.service==='Netflix'&&m.date.startsWith('2026-10-'));
 assert.ok(rows.length>=2);
 assert.ok(rows.every(m=>m.verified===true&&m.content_type==='movie'&&m.source_url==='https://about.netflix.com/ja/new-to-watch'));
 assert.ok(rows.some(m=>m.title==='アニマルズ'&&m.date==='2026-10-09'));
});
