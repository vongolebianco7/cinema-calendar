const {test}=require('node:test');
const assert=require('node:assert/strict');
let Q;try{Q=require('../js/cinelva-data-quality.js');}catch{Q={};}
const now=Date.parse('2026-10-17T00:00:00Z');
test('only recent successful observations can support current availability',()=>{
 assert.equal(typeof Q.availabilityIsFresh,'function');
 assert.equal(Q.availabilityIsFresh({checked_at:'2026-10-16T00:00:00Z'},now),true);
 assert.equal(Q.availabilityIsFresh({checked_at:'2026-09-16'},now),false);
 assert.equal(Q.availabilityIsFresh({checked_at:'2027-01-01'},now),false);
 assert.equal(Q.availabilityIsFresh({date:'2026-10-16'},now),false);
});
test('movie identity dedupes alias IDs only with a known shared release year',()=>{
 assert.equal(typeof Q.uniqueMovies,'function');
 const movies=[{id:1,title:'Film: A',year:2000},{id:2,title:'Film A',year:2000},{id:1,title:'別題',year:2000},{id:3,title:'Film A',year:2020},{id:4,title:'Film A'}];
 assert.equal(Q.uniqueMovies(movies).length,3);
});
test('distinct verified movie IDs retain same-name same-year films',()=>{
 const rows=[{id:1,tmdbId:1,title:'同名作品',year:2026},{id:2,tmdbId:2,title:'同名作品',year:2026},{id:99,tmdbId:1,title:'別表記',year:2026}];
 assert.deepEqual(Q.uniqueMovies(rows).map(m=>m.tmdbId),[1,2]);
});
test('local and TMDB numeric ID namespaces cannot collapse unrelated films',()=>{
 const rows=[{id:550,title:'手動記録の作品',year:2026},{id:550,tmdbId:550,title:'別の作品',year:1999}];
 assert.equal(Q.uniqueMovies(rows).length,2);
});
test('zero placeholder IDs do not hide unrelated unidentified releases',()=>{
 assert.equal(Q.uniqueMovies([{id:0,title:'作品A',year:2026},{id:0,title:'作品B',year:2026}]).length,2);
});
test('legacy and verified copies collapse in either order while retaining canonical identity',()=>{
 const legacy={id:'legacy',title:'Film A',year:2000,custom:'retained'},verified={tmdbId:1,title:'Film A',year:2000};
 for(const rows of [[legacy,verified],[verified,legacy]]){
  const result=Q.uniqueMovies(rows);assert.equal(result.length,1);assert.equal(result[0].tmdbId,1);
 }
 assert.equal(legacy.tmdbId,undefined,'input records are never mutated');
});
test('ambiguous same-title legacy rows never pick between two verified film identities',()=>{
 const a={tmdbId:1,title:'Film A',year:2000},b={tmdbId:2,title:'Film A',year:2000},unknown={title:'Film A',year:2000};
 for(const rows of [[unknown,a,b],[a,unknown,b],[a,b,unknown]])assert.equal(Q.uniqueMovies(rows).length,3);
});
test('official on-demand listings expire and are never made into premieres',()=>{
 assert.equal(typeof Q.activeOfficialOffers,'function');
 const offers=[{id:1,service:'WOWOWオンデマンド',source_type:'official_on_demand_listing',source_url:'https://wod.wowow.co.jp/watch/1',ends_at:'2026-10-31T23:59:00+09:00',checked_at:'2026-10-17',certainty:'listing'}, {id:2,service:'WOWOWオンデマンド',source_type:'tv_broadcast',source_url:'https://www.wowow.co.jp/',checked_at:'2026-10-17'}];
 const valid=Q.activeOfficialOffers(offers,now);assert.equal(valid.length,1);assert.equal(valid[0].date,undefined);
 assert.equal(Q.activeOfficialOffers(offers,Date.parse('2026-11-01')).length,0);
});

test('calendar badges and timeline current block do not reuse expired provider lists',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),html=fs.readFileSync('index.html','utf8');
 const extract=name=>{const start=html.indexOf('function '+name+'('),end=html.indexOf('\nfunction ',start+10);return html.slice(start,end);};
 const ctx={CinelvaDataQuality:Q,movies:[{id:1,title:'Film',date:'2026-01-01',event:'streaming',service:'Netflix'}],availabilitySnapshot:{movies:{'1':{checked_at:'2000-01-01',flatrate:['EXPIRED_PROVIDER'],buy:['EXPIRED_BUY_PROVIDER']}}},streamingGroupOrder:()=>new Map(),missingPoster:()=>'',popularitySort:()=>0,related:()=>[],normTitle:x=>String(x),releaseHistory:{records:[]}};
 assert.doesNotMatch(vm.runInNewContext(extract('streamServiceColor')+extract('groupedMovieCards')+';groupedMovieCards(movies,"streaming");',ctx),/EXPIRED/);
 const timeline=vm.runInNewContext(extract('movieTimelineHtml')+';movieTimelineHtml(movies[0]);',ctx);
 const current=timeline.split('<div class="timelineNow">')[1].split('<div class="movieTimeline">')[0];
 assert.doesNotMatch(current,/EXPIRED/);
});
