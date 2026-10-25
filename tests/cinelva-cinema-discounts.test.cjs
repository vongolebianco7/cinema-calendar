const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const D=require('../js/cinelva-cinema-discounts.js');
const data=JSON.parse(fs.readFileSync('data/cinema_discounts.json','utf8'));
const now=new Date('2026-10-25T12:00:00Z');
const rows=(date,options={},source=data,clock=now)=>D.compare(source,{date,benefits:[],...options},clock);
const venue=(id,date,options={},source=data,clock=now)=>rows(date,options,source,clock).find(x=>x.id===id);
test('ordinary Wednesday and eligible memberships choose one price; no invented stacking',()=>{
 assert.equal(venue('toho-kawasaki','2026-10-28').best.price,1400);
 assert.equal(venue('toho-kawasaki','2026-10-28',{benefits:['ponta']}).best.price,1100);
 assert.equal(venue('109-kawasaki','2026-10-27').best.price,2200);
 assert.equal(venue('109-kawasaki','2026-10-27',{benefits:['cinema109']}).best.price,1300);
 assert.equal(venue('aeon-kohoku','2026-10-26',{benefits:['aeonPlus','aeonCard']}).best.price,1100);
 assert.equal(venue('toho-kawasaki','2026-10-29').best.price,2100);
 assert.equal(venue('toho-kawasaki','2026-10-29',{benefits:['saison']}).best.price,1200);
});
test('time-dependent tariffs require explicit evening selection and respect cheaper service days',()=>{
 assert.equal(venue('109-kawasaki','2026-10-31').best.price,2200);
 assert.equal(venue('109-kawasaki','2026-10-31',{evening:true}).best.price,1600);
 assert.equal(venue('109-kawasaki','2026-10-31',{evening:true,benefits:['cinema109']}).best.price,1500);
 assert.equal(venue('toho-kawasaki','2026-10-28',{evening:true}).best.price,1400);
});
test('December1 override and simultaneous service days use individual eligible tariffs',()=>{
 assert.equal(venue('toho-kawasaki','2026-12-01',{benefits:['tohoOne']}).best.price,1000);
 assert.equal(venue('aeon-kohoku','2026-12-01',{benefits:['aeonPlus']}).best.price,1000);
 assert.equal(venue('cinecitta','2026-11-23').best.price,1400);
});
test('February card day moves from30th to month end including leap years',()=>{
 const copy=structuredClone(data); for(const v of copy.venues)v.verifiedAt='2028-02-01';
 assert.equal(venue('aeon-kohoku','2028-02-29',{benefits:['aeonCard']},copy,new Date('2028-02-20T00:00:00Z')).best.price,1100);
 const ordinaryFebruaryDay=venue('aeon-kohoku','2028-02-28',{benefits:['aeonCard']},copy,new Date('2028-02-20T00:00:00Z'));
 assert.equal(ordinaryFebruaryDay.offers.some(x=>x.id==='thanks'),false);
 assert.equal(ordinaryFebruaryDay.best.price,1200); // Monday is independently cheaper than the card tariff.
});
test('JST civil date, leap day and invalid inputs do not roll silently',()=>{
 assert.equal(D.today(new Date('2026-10-25T15:01:00Z')),'2026-10-26');
 assert.equal(D.addDays('2028-02-28',1),'2028-02-29');
 assert.equal(D.addDays('2026-12-31',1),'2027-01-01');
 for(const date of ['2026-02-30','','invalid','2026-13-01'])assert.equal(rows(date).length,0);
 assert.equal(rows('2026-10-24').length,0);
 assert.equal(rows('2026-10-25',{area:'unknown'}).length,0);
});
test('stale, future, missing reviews and dates beyond review horizon never expose prices',()=>{
 for(const verifiedAt of ['2026-07-01','2026-10-26','',null,'not-a-date']){
  const copy=structuredClone(data);copy.venues[0].verifiedAt=verifiedAt;
  const r=venue(copy.venues[0].id,'2026-10-25',{},copy);
  assert.equal(r.best,null);assert.deepEqual(r.offers,[]);
 }
 assert.equal(venue('toho-kawasaki','2027-01-01').best,null);
 assert.equal(venue('toho-kawasaki','2026-12-25').best,null);
 assert.equal(venue('toho-kawasaki','2026-12-24').best.price,2100);
});
test('calendar minima respect area, benefits and dates; missing data is empty',()=>{
 const cal=D.calendar(data,{date:'2026-10-25',area:'川崎',benefits:['ponta']},now);
 assert.equal(cal.length,14);assert.equal(cal[1].date,'2026-10-26');assert.equal(cal[1].price,1100);
 assert.equal(D.compare(null,{date:'2026-10-25'},now).length,0);
 assert.equal(D.calendar({venues:[]},{date:'2026-10-25'},now)[0].price,null);
});
test('every price retains reviewed primary provenance and bounded manual coverage',()=>{
 assert.equal(data.venues.length,6);
 const registry=JSON.parse(fs.readFileSync('data/source_registry.json','utf8'));
 assert.equal(registry.sources.find(x=>x.id==='manual_cinema_discount_facts').mode,'approved');
 assert.equal(registry.sources.find(x=>x.id==='109cinemas').mode,'disabled');
 const ids=new Set();
 for(const v of data.venues){
  assert.ok(!ids.has(v.id));ids.add(v.id);
  assert.match(v.sourceUrl,/^https:\/\/(www\.tohotheater\.jp|109cinemas\.net|www\.aeoncinema\.com|cinecitta\.co\.jp)\//);
  assert.equal(v.verifiedAt,'2026-10-25');assert.ok(v.offers.length);
  for(const o of v.offers){assert.ok(Number.isInteger(o.price)&&o.price>0);assert.ok(o.condition);}
 }
});
