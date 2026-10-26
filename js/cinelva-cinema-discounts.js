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
    if(!o||typeof o!=='object'||!fresh(o,date,now)||region&&!fresh(region,date,now))continue;
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
 const api={today,addDays,compare,calendar,guide,chainForTheater,REVIEW_DAYS};root.CinelvaCinemaDiscounts=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
