(function(root){
 'use strict';
 const DAY=86400000,REVIEW_DAYS=60;
 function civil(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const time=Date.parse(value+'T00:00:00Z');
  return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value?new Date(time):null;
 }
 function today(now=new Date()){
  const time=new Date(now).getTime();
  return Number.isFinite(time)?new Date(time+9*3600000).toISOString().slice(0,10):'';
 }
 function addDays(value,n){const d=civil(value);return d&&Number.isInteger(n)?new Date(d.getTime()+n*DAY).toISOString().slice(0,10):'';}
 function fresh(venue,date,now){
  const checked=civil(venue.verifiedAt),current=civil(today(now)),selected=civil(date);
  return !!(checked&&current&&selected&&checked<=current&&current.getTime()-checked.getTime()<=REVIEW_DAYS*DAY&&selected>=current&&selected.getTime()-checked.getTime()<=REVIEW_DAYS*DAY);
 }
 function applies(offer,date,options){
  if(offer.access==='intro'||offer.repeatability==='one-time'||offer.oneTime===true)return false;
  if(!Number.isInteger(offer.price)||offer.price<=0)return false;
  const benefits=new Set(Array.isArray(options.benefits)?options.benefits:[]);
  if((offer.requires||[]).some(key=>!benefits.has(key)))return false;
  if(offer.evening&&!options.evening)return false;
  const d=civil(date),day=d.getUTCDate(),month=d.getUTCMonth()+1,rule=offer.when||{};
  if(offer.from&&date<offer.from||offer.until&&date>offer.until)return false;
  if((offer.excludedMonths||[]).includes(month))return false;
  switch(rule.kind){
   case 'always':return true;
   case 'weekday':return (rule.days||[]).includes(d.getUTCDay());
   case 'monthday':return (rule.days||[]).includes(day);
   case 'annual':return month===rule.month&&day===rule.day;
   case 'aeonThanks':return day===20||(month===2?day===new Date(Date.UTC(d.getUTCFullYear(),month,0)).getUTCDate():day===30);
   default:return false;
  }
 }
 function compare(data,options={},now=new Date()){
  const date=options.date||'',current=today(now);
  if(!civil(date)||!current||date<current)return [];
  return (Array.isArray(data?.venues)?data.venues:[]).filter(v=>!options.area||v.area===options.area).map(v=>{
   const valid=fresh(v,date,now);
   const offers=valid?(v.offers||[]).filter(o=>applies(o,date,options)).slice().sort((a,b)=>a.price-b.price):[];
   return {...v,offers,best:offers[0]||null,fresh:valid};
  }).sort((a,b)=>(a.best?.price??Infinity)-(b.best?.price??Infinity)||a.name.localeCompare(b.name,'ja'));
 }
 function calendar(data,options={},now=new Date()){
  if(!civil(options.date))return [];
  return Array.from({length:14},(_,i)=>{
   const date=addDays(options.date,i),rows=compare(data,{...options,date},now);
   return {date,price:rows.find(v=>v.best)?.best.price??null};
  });
 }
 const normalized=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\s・･ー−–—-]/g,'');
 const validNames=(a,nonempty=false)=>Array.isArray(a)&&(!nonempty||a.length>0)&&a.every(n=>typeof n==='string'&&normalized(n));
 function chainForTheater(name){
  const n=normalized(name);
  const patterns=[['central-miyazaki',/セントラルシネマ宮崎/],['toho',/tohoシネマズ/],['aeon',/イオンシネマ/],['109',/109シネマズ|ムビル/],['tjoy',/tジョイ|ティジョイ|tjoy/],['sunshine',/シネマサンシャイン/],['smt',/movix|新宿ピカデリ|丸の内ピカデリ|熊本ピカデリ|東劇|なんばパクスシネマ|大阪ステションシティシネマ/],['united',/ユナイテッドシネマ|シネプレックス|yebisugardencinema/],['corona',/コロナシネマ/],['forum',/^(フォラム|アトフォラム|ソラリス)/],['kino',/キノシネマ|kinocinema/],['cinemart',/シネマト新宿/],['os',/osシネマズ/],['ttcg',/テアトル新宿|ヒュマントラストシネマ|シネリブル/]];
  return patterns.find(([,pattern])=>pattern.test(n))?.[0]||'';
 }
 function guide(data,options={},now=new Date()){
  const date=options.date||'',current=today(now);
  if(!civil(date)||!current||date<current)return [];
  const region=options.prefecture?(Array.isArray(data?.regions)?data.regions:[]).find(r=>r?.prefecture===options.prefecture):null;
  if(options.prefecture&&!region)return [];
  const chain=region?.chain||options.chain||'',theater=normalized(region?.theater||options.theater);
  return (Array.isArray(data?.chains)?data.chains:[]).filter(c=>c&&typeof c==='object'&&(!chain||c.id===chain)).map(c=>{
   const available=[],upcoming=[];
   for(const o of Array.isArray(c.offers)?c.offers:[]){
    if(!o||typeof o!=='object'||o.access==='intro'||o.repeatability==='one-time'||o.oneTime===true||!fresh(o,date,now)||region&&!fresh(region,date,now))continue;
    if(o.excludedTheaters!==undefined&&!validNames(o.excludedTheaters)||o.includedTheaters!==undefined&&!validNames(o.includedTheaters,true))continue;
    if(theater&&(o.excludedTheaters||[]).some(name=>theater.includes(normalized(name))))continue;
    const included=o.includedTheaters;
    if(included!==undefined){
     if(!Array.isArray(included)||!included.length||included.some(name=>typeof name!=='string'||!name.trim()))continue;
     if(theater&&!included.some(name=>theater.includes(normalized(name))))continue;
    }
    for(let i=0;i<=REVIEW_DAYS;i++){
     const nextDate=addDays(date,i);
     if(!fresh(o,nextDate,now)||region&&!fresh(region,nextDate,now))break;
     // Explain all methods; do not infer visitor membership or screening availability.
     if(applies({...o,requires:[],evening:false},nextDate,{})){
      const row={...o,nextDate};(i===0?available:upcoming).push(row);break;
     }
    }
   }
   const sort=(a,b)=>a.price-b.price||(a.maxPrice||a.price)-(b.maxPrice||b.price)||a.nextDate.localeCompare(b.nextDate);
   available.sort(sort);upcoming.sort(sort);
   return {...c,available,upcoming,publicBest:available.find(o=>o.access==='public')||null,conditionalBest:available.find(o=>o.access!=='public')||null};
  });
 }
 function guideCalendar(data,options={},now=new Date()){
  if(!civil(options.date)||options.date<today(now))return [];
  return Array.from({length:14},(_,i)=>{
   const date=addDays(options.date,i),rows=guide(data,{...options,date},now);
   const prices=access=>rows.flatMap(c=>c.available.filter(o=>(o.access==='public')===access).map(o=>o.price));
   const publicPrices=prices(true),conditionalPrices=prices(false);
   return {date,publicPrice:publicPrices.length?Math.min(...publicPrices):null,conditionalPrice:conditionalPrices.length?Math.min(...conditionalPrices):null};
  });
 }
 function regionalGuide(data,options={},now=new Date()){
  const date=options.date;
  if(!civil(date)||date<today(now))return [];
  const selected=Array.isArray(options.prefectures)?[...new Set(options.prefectures.filter(p=>typeof p==='string'&&p))]:[];
  if(selected.length){
   const merged=new Map();
   for(const pref of selected){
    for(const c of regionalGuide(data,{...options,prefectures:undefined,prefecture:pref},now)){
     if(!merged.has(c.id))merged.set(c.id,{...c,theaters:[],available:[]});
     const row=merged.get(c.id);
     row.theaters.push(...c.theaters.map(t=>pref+'：'+t));
     row.available.push(...c.available.map(o=>({...o,applicableTheaters:o.applicableTheaters.map(t=>pref+'：'+t)})));
    }
   }
   return [...merged.values()].map(c=>{
    c.available.sort((a,b)=>a.price-b.price||(a.maxPrice||a.price)-(b.maxPrice||b.price));
    c.publicBest=c.available.find(o=>o.access==='public')||null;
    c.conditionalBest=c.available.find(o=>o.access!=='public')||null;
    c.best=c.available[0]||null;
    return c;
   }).sort((a,b)=>(a.best?.price??Infinity)-(b.best?.price??Infinity)||a.name.localeCompare(b.name,'ja'));
  }
  if(typeof options.prefecture!=='string'||!options.prefecture)return [];
  const groups=new Map();
  for(const r of Array.isArray(data?.regionalCoverage)?data.regionalCoverage:[]){
   if(!r||r.prefecture!==options.prefecture||!fresh(r,date,now)||!validNames(r.theaters,true))continue;
   if(!groups.has(r.chain))groups.set(r.chain,new Set());
   r.theaters.forEach(t=>groups.get(r.chain).add(t));
  }
  const allowed=(o,t)=>{
   for(const key of ['includedTheaters','excludedTheaters'])if(o[key]!==undefined&&!validNames(o[key],key==='includedTheaters'))return false;
   const n=normalized(t);
   return !(o.excludedTheaters||[]).some(v=>n.includes(normalized(v)))&&(o.includedTheaters===undefined||o.includedTheaters.some(v=>n.includes(normalized(v))));
  };
  const order=(a,b)=>a.price-b.price||(a.maxPrice||a.price)-(b.maxPrice||b.price)||String(a.id).localeCompare(String(b.id));
  const rows=[];
  for(const c of guide(data,{date},now)){
   if(!groups.has(c.id))continue;
   const theaters=[...groups.get(c.id)],offers=[];
   for(const o of c.available){
    if(o.evening&&!options.evening)continue;
    const prices=new Map();
    for(const t of theaters.filter(t=>allowed(o,t))){
     let amount=o.price,max=o.maxPrice;
      let sourceUrl=o.sourceUrl;
      if(o.defaultTheaterPrice!==undefined||o.theaterPrices!==undefined){
      if(!Number.isInteger(o.defaultTheaterPrice)||o.defaultTheaterPrice<=0||!Array.isArray(o.theaterPrices)||o.theaterPrices.some(r=>!r||!Number.isInteger(r.price)||r.price<=0||!validNames(r.theaters,true)))continue;
      const override=o.theaterPrices.find(r=>r.theaters.some(v=>normalized(t).includes(normalized(v))));amount=override?.price??o.defaultTheaterPrice;sourceUrl=override?.sourceUrl||sourceUrl;max=undefined;
     }
     const key=amount+':'+(max||amount);
     if(!prices.has(key))prices.set(key,{...o,price:amount,maxPrice:max,sourceUrl,applicableTheaters:[]});
     prices.get(key).applicableTheaters.push(t);
    }
    offers.push(...prices.values());
   }
   offers.sort(order);
   rows.push({...c,theaters,available:offers,upcoming:[],publicBest:offers.find(o=>o.access==='public')||null,conditionalBest:offers.find(o=>o.access!=='public')||null,best:offers[0]||null});
  }
  return rows.sort((a,b)=>(a.best?.price??Infinity)-(b.best?.price??Infinity)||a.name.localeCompare(b.name,'ja'));
 }
 function regionalCalendar(data,options={},now=new Date()){
  if(!civil(options.date))return [];
  return Array.from({length:14},(_,i)=>{
   const date=addDays(options.date,i),rows=date<today(now)?[]:regionalGuide(data,{...options,date},now);
   const winners=key=>{const eligible=rows.filter(c=>c[key]);if(!eligible.length)return {price:null,chains:[]};const price=Math.min(...eligible.map(c=>c[key].price));return {price,chains:eligible.filter(c=>c[key].price===price).map(c=>({id:c.id,name:c.name}))};};
   const a=winners('publicBest'),b=winners('conditionalBest');
   const publicTop3=rows.filter(c=>c.publicBest).map(c=>({id:c.id,name:c.name,price:c.publicBest.price,theaterCount:c.publicBest.applicableTheaters?.length||0,regionalTheaterCount:c.theaters.length})).sort((x,y)=>x.price-y.price||x.name.localeCompare(y.name,'ja')||x.id.localeCompare(y.id)).slice(0,3);
   return {date,publicPrice:a.price,publicChains:a.chains,publicTop3,conditionalPrice:b.price,conditionalChains:b.chains};
  });
 }
 const api={today,addDays,compare,calendar,guide,guideCalendar,regionalGuide,regionalCalendar,chainForTheater,REVIEW_DAYS};root.CinelvaCinemaDiscounts=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
