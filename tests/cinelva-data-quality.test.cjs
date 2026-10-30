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
test('movie identity keeps distinct TMDB films with the same normalized title/year',()=>{
 assert.equal(typeof Q.uniqueMovies,'function');
 const movies=[{tmdbId:1,title:'Film: A',year:2000},{tmdbId:2,title:'Film A',year:2000},{tmdbId:1,title:'別題',year:2000},{tmdbId:3,title:'Film A',year:2020},{id:'local-4',title:'Film A'}];
 assert.deepEqual(Q.uniqueMovies(movies),[movies[0],movies[1],movies[3],movies[4]]);
});
test('an ID-less same-title row stays separate when multiple TMDB identities make it ambiguous',()=>{
 const rows=[{tmdbId:11,title:'同題',year:2020},{title:'同題',year:2020},{tmdb_id:12,title:'同題',year:2020}];
 assert.equal(Q.uniqueMovies(rows).length,3);
});
test('a legacy title/year row joins one unambiguous TMDB identity',()=>{
 const rows=[{title:'映画A',year:2020},{tmdbId:88,title:'映画 A',year:2020}];
 assert.deepEqual(Q.uniqueMovies(rows),[rows[1]]);
});
test('unverified local row IDs are not mistaken for TMDB IDs',()=>{
 const rows=[{id:'local-1',title:'映画A',year:2020},{id:'local-2',title:'映画 A',year:2020}];
 assert.equal(Q.uniqueMovies(rows).length,1);
});
test('raw TMDB-shaped rows use their numeric IDs and keep same-title remakes distinct',()=>{
 const rows=[{id:91,title:'Same',release_date:'2020-01-01',poster_path:'/a.jpg',vote_average:7.1},{id:92,title:'Same',release_date:'2020-05-01',poster_path:'/b.jpg',vote_average:7.2}];
 assert.equal(Q.uniqueMovies(rows).length,2);
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
