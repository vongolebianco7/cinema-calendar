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
test('official on-demand listings expire and are never made into premieres',()=>{
 assert.equal(typeof Q.activeOfficialOffers,'function');
 const offers=[{id:1,service:'WOWOWオンデマンド',source_type:'official_on_demand_listing',source_url:'https://wod.wowow.co.jp/watch/1',ends_at:'2026-10-31T23:59:00+09:00',checked_at:'2026-10-17',certainty:'listing'}, {id:2,service:'WOWOWオンデマンド',source_type:'tv_broadcast',source_url:'https://www.wowow.co.jp/',checked_at:'2026-10-17'}];
 const valid=Q.activeOfficialOffers(offers,now);assert.equal(valid.length,1);assert.equal(valid[0].date,undefined);
 assert.equal(Q.activeOfficialOffers(offers,Date.parse('2026-11-01')).length,0);
});
