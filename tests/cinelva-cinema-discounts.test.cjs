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

test('national guide shows conditional methods without selected benefits',()=>{
 const fixture={chains:[{id:'toho',name:'TOHO',offers:[{id:'coupon',price:1100,access:'member',verifiedAt:'2026-10-26',when:{kind:'weekday',days:[1,3]},feeText:'月額548円',steps:['クーポンを取得']},{id:'public',price:1400,access:'public',verifiedAt:'2026-10-26',when:{kind:'weekday',days:[3]}}]}]};
 const r=D.guide(fixture,{date:'2026-10-26'},new Date('2026-10-26T01:00:00Z'))[0];
 assert.equal(r.available[0].price,1100);assert.equal(r.publicBest,null);assert.equal(r.conditionalBest.price,1100);assert.equal(r.upcoming[0].nextDate,'2026-10-28');
});
test('national guide excludes named theaters and never uses stale or future reviews',()=>{
 const fixture={chains:[{id:'smt',name:'MOVIX',offers:[{id:'a',price:1400,access:'member',verifiedAt:'2026-10-26',when:{kind:'always'},excludedTheaters:['東劇']},{id:'old',price:500,verifiedAt:'2026-01-01',when:{kind:'always'}},{id:'future',price:600,verifiedAt:'2026-10-27',when:{kind:'always'}}]}]};
 const now=new Date('2026-10-26T01:00:00Z');
 assert.equal(D.guide(fixture,{date:'2026-10-26',theater:'東劇'},now)[0].available.length,0);
 assert.equal(D.guide(fixture,{date:'2026-10-26'},now)[0].available[0].price,1400);
 assert.equal(D.guide(fixture,{date:'2026-12-26'},now)[0].available.length,0);
 assert.deepEqual(D.guide(fixture,{date:'invalid'},now),[]);
});
test('national theater matching does not confuse AEON shops or premium109 with ordinary theaters',()=>{
 assert.equal(D.chainForTheater('イオンシネマ北見'),'aeon');assert.equal(D.chainForTheater('イオンモール映画館'),'');
 assert.equal(D.chainForTheater('109シネマズプレミアム新宿'),'109');assert.equal(D.chainForTheater('T・ジョイ出雲'),'tjoy');
 assert.equal(D.chainForTheater('MOVIX日吉津'),'smt');assert.equal(D.chainForTheater('未知の映画館'),'');
});
test('national facts cover broad chains and retain actionable primary provenance and fees',()=>{
 assert.equal(data.chains.length,14);
 for(const c of data.chains)for(const o of c.offers){assert.ok(o.sourceUrl.startsWith('https://'));assert.ok(o.feeText);assert.ok(o.condition);assert.ok(o.steps.length>=2);assert.match(o.verifiedAt,/^2026-10-(26|27|29|30)$/);}
 const now=new Date('2026-10-26T01:00:00Z');
 const r=D.guide(data,{date:'2026-12-01',chain:'tjoy'},now)[0];assert.equal(r.available.some(o=>o.id==='first'),false);assert.equal(r.publicBest.price,1000);
 assert.equal(D.guide(data,{date:'2026-10-28',chain:'109',theater:'109シネマズプレミアム新宿'},now)[0].available.length,0);
});
test('every prefecture has a sourced example and a usable guide, including Miyazaki',()=>{
 const prefs='北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県'.split(' ');
 assert.deepEqual(data.regions?.map(r=>r.prefecture).sort(),prefs.sort());
 const now=new Date('2026-10-26T01:00:00Z');
 for(const r of data.regions){assert.ok(r.sourceUrl.startsWith('https://'));assert.ok(r.theater);const rows=D.guide(data,{date:'2026-10-28',prefecture:r.prefecture},now);assert.equal(rows.length,1);assert.equal(rows[0].id,r.chain);assert.ok(rows[0].available.length>0);}
 const m=D.guide(data,{date:'2026-10-28',prefecture:'宮崎県'},now)[0];assert.equal(m.publicBest.price,1300);
 assert.deepEqual(D.guide(data,{date:'2026-10-28',prefecture:'架空県'},now),[]);
});
test('stale regional theater association cannot expose a fresh chain coupon',()=>{
 const f=JSON.parse(JSON.stringify(data));f.regions.find(r=>r.prefecture==='沖縄県').verifiedAt='2026-01-01';
 const r=D.guide(f,{date:'2026-10-28',prefecture:'沖縄県'},new Date('2026-10-26T01:00:00Z'))[0];assert.equal(r.available.length,0);assert.equal(r.upcoming.length,0);
});
test('upcoming price dates cannot outlive a regional association reviewed earlier than the offer',()=>{
 const f=JSON.parse(JSON.stringify(data));f.regions.find(r=>r.prefecture==='東京都').verifiedAt='2026-10-01';
 const r=D.guide(f,{date:'2026-11-29',prefecture:'東京都'},new Date('2026-10-26T01:00:00Z'))[0];
 assert.ok(r.upcoming.every(o=>o.nextDate<='2026-11-30'));assert.ok(r.upcoming.some(o=>o.nextDate==='2026-11-30'));
});

test('named-theater methods never leak to other cinemas, including future dates',()=>{
 const f={chains:[{id:'united',offers:[{id:'local',price:1300,access:'public',verifiedAt:'2026-10-27',when:{kind:'weekday',days:[4]},includedTheaters:['ユナイテッドシネマ札幌']}]}]};
 const now=new Date('2026-10-27T01:00:00Z');
 assert.equal(D.guide(f,{date:'2026-10-29',chain:'united',theater:'ユナイテッド・シネマ豊洲'},now)[0].available.length,0);
 assert.equal(D.guide(f,{date:'2026-10-28',chain:'united',theater:'ユナイテッド・シネマ豊洲'},now)[0].upcoming.length,0);
 assert.equal(D.guide(f,{date:'2026-10-29',chain:'united',theater:'ローソン・ユナイテッドシネマ札幌'},now)[0].publicBest.price,1300);
});
test('public service days follow United theater exceptions and December pricing',()=>{
 const now=new Date('2026-10-27T01:00:00Z');
 const row=(theater,date)=>D.guide(data,{date,chain:'united',theater},now)[0];
 assert.equal(row('ユナイテッド・シネマ豊洲','2026-10-28').publicBest?.price,1300);
 for(const t of ['札幌','稲沢','阿久比','PARCO CITY 浦添'])assert.equal(row('ユナイテッド・シネマ'+t,'2026-10-28').publicBest,null,t+' has no Wednesday service day');
 assert.equal(row('ユナイテッド・シネマ札幌','2026-10-29').publicBest?.price,1300);
 assert.equal(row('ユナイテッド・シネマ稲沢','2026-10-29').publicBest?.price,1300);
 assert.equal(row('ユナイテッド・シネマ阿久比','2026-10-27').publicBest?.price,1300);
 assert.equal(row('ユナイテッド・シネマ豊洲','2026-11-01').publicBest?.price,1300);
 assert.equal(row('ユナイテッド・シネマPARCO CITY浦添','2026-11-01').publicBest,null);
 assert.equal(row('ユナイテッド・シネマPARCO CITY浦添','2026-12-01').publicBest?.price,1000);
 assert.equal(row('ユナイテッド・シネマ豊洲','2026-12-01').available.some(o=>o.id==='first'),false);
});
test('MOVIX public tariffs and free KINEZO booking are actionable without paid membership',()=>{
 const now=new Date('2026-10-27T01:00:00Z');
 const smt=date=>D.guide(data,{date,chain:'smt',theater:'MOVIX日吉津'},now)[0];
 assert.equal(smt('2026-10-28').publicBest?.price,1400);
 assert.equal(smt('2026-11-01').publicBest?.price,1400);
 assert.equal(smt('2026-12-01').publicBest?.price,1000);
 assert.equal(D.guide(data,{date:'2026-10-28',chain:'smt',theater:'東劇'},now)[0].available.length,0);
 const k=D.guide(data,{date:'2026-10-27',chain:'tjoy'},now)[0].conditionalBest;
 assert.equal(k?.price,1500);assert.match(k.feeText,/無料/);assert.match(k.condition,/オンライン/);
});
test('malformed named-theater restrictions fail closed rather than broadening a local tariff',()=>{
 for(const includedTheaters of ['札幌',null,[],[''],[null]]){
  const f={chains:[{id:'united',offers:[{id:'local',price:1300,access:'public',verifiedAt:'2026-10-27',when:{kind:'always'},includedTheaters}]}]};
  const r=D.guide(f,{date:'2026-10-28',theater:'ユナイテッド・シネマ豊洲'},new Date('2026-10-27T01:00:00Z'))[0];
  assert.equal(r.available.length,0,JSON.stringify(includedTheaters));assert.equal(r.upcoming.length,0);
 }
});
test('method calendar separates public and conditional minima and retains named exceptions',()=>{
 const now=new Date('2026-10-27T01:00:00Z');
 const a=D.guideCalendar(data,{date:'2026-10-27',chain:'united',theater:'ユナイテッド・シネマ札幌'},now);
 assert.equal(a.length,14);assert.equal(a[1].date,'2026-10-28');assert.equal(a[1].publicPrice,null);assert.equal(a[2].publicPrice,1300);
 const b=D.guideCalendar(data,{date:'2026-10-28',chain:'smt',theater:'MOVIX日吉津'},now)[0];assert.equal(b.publicPrice,1400);assert.equal(b.conditionalPrice,1400);
 assert.deepEqual(D.guideCalendar(data,{date:'invalid'},now),[]);
 assert.ok(D.guideCalendar(data,{date:'2027-01-01'},new Date('2027-01-01T01:00:00Z')).every(d=>d.publicPrice===null&&d.conditionalPrice===null));
});

const regionalNow=new Date('2026-10-27T01:00:00Z');
test('one-time acquisition offers never enter guide or calendar minima',()=>{
 const d={chains:[{id:'x',name:'X',offers:[{id:'intro',price:100,access:'intro',verifiedAt:'2026-10-26',when:{kind:'always'}},{id:'once',price:200,access:'member',repeatability:'one-time',verifiedAt:'2026-10-26',when:{kind:'always'}},{id:'recurring',price:1300,access:'public',verifiedAt:'2026-10-26',when:{kind:'always'}}]}]};
 assert.deepEqual(D.guide(d,{date:'2026-10-28'},regionalNow)[0].available.map(o=>o.id),['recurring']);
 assert.equal(D.guideCalendar(d,{date:'2026-10-28'},regionalNow)[0].conditionalPrice,null);
});
test('prefecture comparison ranks multiple local chains and preserves cheapest ties without sample mapping',()=>{
 const offer=(id,price)=>({id,price,access:'public',verifiedAt:'2026-10-26',when:{kind:'always'}});
 const d={chains:[{id:'a',name:'A',offers:[offer('a',1300)]},{id:'b',name:'B',offers:[offer('b',1200)]},{id:'c',name:'C',offers:[offer('c',1200)]},{id:'outside',name:'Outside',offers:[offer('o',100)]}],regions:[{prefecture:'神奈川県',chain:'a',theater:'A1',verifiedAt:'2026-10-26'}],regionalCoverage:[{prefecture:'神奈川県',chain:'a',theaters:['A1','A2'],verifiedAt:'2026-10-26'},{prefecture:'神奈川県',chain:'b',theaters:['B1'],verifiedAt:'2026-10-26'},{prefecture:'神奈川県',chain:'c',theaters:['C1'],verifiedAt:'2026-10-26'},{prefecture:'東京都',chain:'outside',theaters:['O1'],verifiedAt:'2026-10-26'}]};
 const rows=D.regionalGuide(d,{date:'2026-10-28',prefecture:'神奈川県'},regionalNow);assert.deepEqual(rows.map(c=>c.id),['b','c','a']);assert.equal(rows[2].theaters.length,2);
 const cell=D.regionalCalendar(d,{date:'2026-10-28',prefecture:'神奈川県'},regionalNow)[0];assert.equal(cell.publicPrice,1200);assert.deepEqual(cell.publicChains.map(c=>c.id),['b','c']);
 assert.deepEqual(D.regionalGuide(d,{date:'2026-10-28',prefecture:'存在しない県'},regionalNow),[]);
 d.regionalCoverage[1].verifiedAt='2026-01-01';assert.equal(D.regionalGuide(d,{date:'2026-10-28',prefecture:'神奈川県'},regionalNow).some(c=>c.id==='b'),false);
});
test('regional calendar ranks up to three distinct confirmed public chains per day',()=>{
 const offer=(id,price)=>({id,price,access:'public',repeatability:'recurring',verifiedAt:'2026-10-27',when:{kind:'always'}});
 const f={chains:[{id:'a',name:'Alpha',offers:[offer('a1',2000),offer('a2',1900)]},{id:'b',name:'Beta',offers:[offer('b1',1400)]},{id:'c',name:'Gamma',offers:[offer('c1',1400)]},{id:'d',name:'Delta',offers:[offer('d1',1800)]}],regionalCoverage:[{prefecture:'神奈川県',chain:'a',theaters:['A'],verifiedAt:'2026-10-27'},{prefecture:'神奈川県',chain:'b',theaters:['B'],verifiedAt:'2026-10-27'},{prefecture:'神奈川県',chain:'c',theaters:['C'],verifiedAt:'2026-10-27'},{prefecture:'神奈川県',chain:'d',theaters:['D'],verifiedAt:'2026-10-27'}]};
 const cell=D.regionalCalendar(f,{date:'2026-10-28',prefecture:'神奈川県'},regionalNow)[0];
 assert.deepEqual(cell.publicTop3.map(x=>[x.id,x.name,x.price]),[['b','Beta',1400],['c','Gamma',1400],['d','Delta',1800]]);
 assert.equal(cell.publicPrice,1400);assert.deepEqual(cell.publicChains.map(x=>x.id),['b','c']);
 assert.deepEqual(D.regionalCalendar({chains:[],regionalCoverage:[]},{date:'2026-10-28',prefecture:'神奈川県'},regionalNow)[0].publicTop3,[]);
});
test('reviewed ordinary fares are theater-scoped and 109 service prices follow its 2026 revision',()=>{
 const clock=new Date('2026-10-30T01:00:00Z');
 const cell=D.regionalCalendar(data,{date:'2026-10-30',prefecture:'神奈川県'},clock)[0];
 assert.equal(cell.publicTop3.length,3);assert.deepEqual(cell.publicTop3.map(x=>x.price),[2000,2000,2000]);
 assert.ok(cell.publicTop3.every(x=>x.theaterCount>0&&x.theaterCount<=x.regionalTheaterCount));
 const wed=D.regionalGuide(data,{date:'2026-11-04',prefecture:'神奈川県'},clock).find(c=>c.id==='109');
 const byTheater=new Map(wed.available.filter(o=>o.id==='wed').flatMap(o=>o.applicableTheaters.map(t=>[t,o.price])));
 assert.equal(byTheater.get('109シネマズ 港北'),1300);
 for(const t of ['109シネマズ 川崎','109シネマズ 湘南','109シネマズ ゆめが丘'])assert.equal(byTheater.get(t),1400);
 const ordinary=data.chains.flatMap(c=>c.offers.map(o=>({chain:c.id,offer:o}))).filter(x=>x.offer.id.startsWith('ordinary-'));
 assert.equal(ordinary.length,13);
 for(const {offer} of ordinary){assert.match(offer.sourceUrl,/^https:\/\//);assert.equal(offer.verifiedAt,'2026-10-30');assert.equal(offer.repeatability,'recurring');assert.ok(offer.includedTheaters?.length||offer.theaterPrices?.length);for(const row of offer.theaterPrices||[])assert.match(row.sourceUrl,/^https:\/\//);}
 const kino=ordinary.find(x=>x.chain==='kino').offer;assert.equal(kino.theaterPrices.length,6);assert.ok(kino.theaterPrices.every(row=>row.price===2000));
 const tachikawa=D.regionalGuide(data,{date:'2026-10-30',prefecture:'東京都'},clock).find(c=>c.id==='kino');assert.equal(tachikawa.publicBest.price,2000);
 const toho=D.regionalGuide(data,{date:'2026-10-30',prefecture:'神奈川県'},clock).find(c=>c.id==='toho');assert.equal(toho.publicBest.price,2000);assert.match(toho.publicBest.sourceUrl,/theater\/008\/price\.html$/);assert.deepEqual(toho.publicBest.applicableTheaters,['TOHOシネマズ 小田原']);
});
test('regional tariffs bind local inclusions and theater prices before choosing chain minimum',()=>{
 const d={chains:[{id:'a',name:'A',offers:[{id:'regular',price:1300,maxPrice:1400,access:'public',verifiedAt:'2026-10-26',when:{kind:'always'},excludedTheaters:['Premium'],theaterPrices:[{theaters:['Expensive'],price:1400}],defaultTheaterPrice:1300},{id:'local',price:500,access:'public',verifiedAt:'2026-10-26',when:{kind:'always'},includedTheaters:['Elsewhere']}]}],regionalCoverage:[{prefecture:'神奈川県',chain:'a',theaters:['Expensive','Premium'],verifiedAt:'2026-10-26'}]};
 const row=D.regionalGuide(d,{date:'2026-10-28',prefecture:'神奈川県'},regionalNow)[0];assert.equal(row.publicBest.price,1400);assert.deepEqual(row.publicBest.applicableTheaters,['Expensive']);
 d.regionalCoverage[0].theaters.push('Regular');assert.equal(D.regionalGuide(d,{date:'2026-10-28',prefecture:'神奈川県'},regionalNow)[0].publicBest.price,1300);
 d.regionalCoverage[0].theaters='Expensive';assert.deepEqual(D.regionalGuide(d,{date:'2026-10-28',prefecture:'神奈川県'},regionalNow),[]);
});
test('reviewed regional inventory covers all prefectures and applies exact local conditions',()=>{
 const groups=data.regionalCoverage,prefs=new Set(groups.map(r=>r.prefecture));assert.equal(prefs.size,47);assert.equal(new Set(groups.map(r=>r.chain)).size,14);assert.ok(groups.reduce((n,r)=>n+r.theaters.length,0)>300);
 for(const r of groups){assert.match(r.sourceUrl,/^https:\/\//);assert.equal(r.verifiedAt,'2026-10-27');assert.ok(r.theaters.length);}
 assert.ok(data.chains.every(c=>c.offers.every(o=>o.access!=='intro'&&o.repeatability==='recurring')));
 const tokyo=D.regionalGuide(data,{date:'2026-10-28',prefecture:'東京都'},regionalNow);assert.equal(tokyo.find(c=>c.id==='109').publicBest.price,1400);
 const kanagawa=D.regionalGuide(data,{date:'2026-10-28',prefecture:'神奈川県'},regionalNow);assert.equal(kanagawa.length,8);assert.equal(kanagawa.find(c=>c.id==='109').publicBest.price,1300);
 const okinawa=D.regionalGuide(data,{date:'2026-11-01',prefecture:'沖縄県'},regionalNow);assert.equal(okinawa.length,1);assert.equal(okinawa[0].publicBest,null);
 const monday=D.regionalGuide(data,{date:'2026-11-02',prefecture:'香川県'},regionalNow).find(c=>c.id==='aeon').publicBest;assert.equal(monday.price,1200);assert.deepEqual(monday.applicableTheaters,['イオンシネマ 綾川']);
 for(const p of prefs)assert.ok(D.regionalGuide(data,{date:'2026-10-28',prefecture:p},regionalNow).length,p);
});
test('punctuation-only theater restrictions and overrides never broaden a regional price',()=>{
 for(const value of ['-','・','ー'])for(const field of ['includedTheaters','excludedTheaters','override']){
  const offer={id:'bad',price:1200,access:'public',verifiedAt:'2026-10-26',when:{kind:'always'}};
  if(field==='override'){offer.defaultTheaterPrice=1300;offer.theaterPrices=[{theaters:[value],price:500}];}else offer[field]=[value];
  const d={chains:[{id:'a',name:'A',offers:[offer]}],regionalCoverage:[{prefecture:'東京都',chain:'a',theaters:['Tokyo'],verifiedAt:'2026-10-26'}]};
  assert.equal(D.regionalGuide(d,{date:'2026-10-28',prefecture:'東京都'},regionalNow)[0].publicBest,null,field+':'+value);
 }
});
