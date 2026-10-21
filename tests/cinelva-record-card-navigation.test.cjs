const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/cinelva-records-page.js','utf8');
function card(movie){const ctx={escapeHTML:x=>String(x??'').replaceAll('&','&amp;').replaceAll('"','&quot;'),posterHTML:()=>'<div class="poster"></div>',metadataFor:()=>({}),globalThis:{CinelvaMovieIdentity:{id:m=>Number(m.tmdbId||0)}}};vm.runInNewContext(source.slice(source.indexOf('  function card(movie)'),source.indexOf('  function mountRecordReviewAreas('))+';globalThis.card=card',ctx);return ctx.globalThis.card(movie);}
test('watched poster and title open canonical independent detail and retain release date',()=>{
 const html=card({id:'900001',tmdbId:42,title:'Film',release_date:'2000-01-02'});
 assert.equal((html.match(/href="[^\"]*search.html\?id=42/g)||[]).length,2);
 assert.match(html,/2000\.01\.02/);
 assert.doesNotMatch(html,/id=900001/);
});
test('unmapped imported record searches by title without using its storage ID as a film ID',()=>{
 const html=card({id:'900001',title:'Film'});
 assert.match(html,/href="[^\"]*search.html\?search=Film/);
 assert.doesNotMatch(html,/search.html\?id=/);
});
