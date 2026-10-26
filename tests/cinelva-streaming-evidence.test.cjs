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
test('October Netflix films have reviewed primary Japan dates without TV entries',()=>{
 const rows=JSON.parse(fs.readFileSync('data/streaming_announcements.json')).movies.filter(m=>m.service==='Netflix'&&m.date.startsWith('2026-10-'));
 assert.ok(rows.length>=2);
 assert.ok(rows.every(m=>m.verified===true&&m.content_type==='movie'&&(m.source_url==='https://about.netflix.com/ja/new-to-watch'||(m.title==='ブラック・ショーマン'&&m.date==='2026-10-12'&&m.release_year===2025&&m.title_url==='https://www.netflix.com/jp/title/82758527'&&m.source_url==='https://t-tribe.co.jp/sae-okazaki/19094.html'))));
 assert.ok(rows.some(m=>m.title==='アニマルズ'&&m.date==='2026-10-09'));
});

test('Black Showman premiere retains reviewed identity and the launch date rather than article publication',()=>{
 for(const file of ['data/streaming.json','data/movies.json']){
  const rows=JSON.parse(fs.readFileSync(file)).movies.filter(m=>m.service==='Netflix'&&m.title==='ブラック・ショーマン');
  assert.equal(rows.length,1);const movie=rows[0];
  assert.equal(movie.date,'2026-10-12');assert.equal(movie.tmdbId,1369010);
  assert.equal(movie.release_year,2025);assert.equal(movie.director,'田中亮');
  assert.equal(movie.source_url,'https://t-tribe.co.jp/sae-okazaki/19094.html');
  assert.equal(movie.type,'配信');assert.equal(movie.poster,'https://image.tmdb.org/t/p/w500/bE0oMAmJg1YUZWQVSn2nRKavMcv.jpg');
 }
});
