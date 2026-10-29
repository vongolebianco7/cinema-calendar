(function(root){
 'use strict';
 const clean=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
 const positive=value=>/^[1-9]\d*$/.test(String(value??''))&&Number.isSafeInteger(Number(value))?String(Number(value)):'';
 function todayInJapan(now=Date.now()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const value=Object.fromEntries(parts.map(part=>[part.type,part.value]));return `${value.year}-${value.month}-${value.day}`;
 }
 function collectReleaseNotices({bookmarks=[],catalog=[],today=todayInJapan(),dismissed=[]}={}){
  const saved=Array.isArray(bookmarks)?bookmarks:[],rows=Array.isArray(catalog)?catalog:[],ignored=new Set(dismissed),eligible=[];
  for(const item of rows){
   const id=positive(item?.tmdbId??item?.tmdb_id??item?.id),title=clean(item?.title),year=Number(item?.year||String(item?.release_date||'').slice(0,4)),date=String(item?.date||'');
   if(!id||!title||!Number.isInteger(year)||year<1888||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date!==today)continue;
   if(!['theatrical','streaming'].includes(item?.event)||!/^https:\/\//i.test(String(item?.source_url||'')))continue;
   eligible.push({id,title,year,date,event:item.event,service:String(item.service||item.provider||''),source:String(item.source||''),source_url:item.source_url,original:item});
  }
  const sameTitleYear=(bookmark,item)=>clean(bookmark?.title)===item.title&&Number(bookmark?.year)===item.year;
  const results=[],seen=new Set();
  for(const item of eligible){
   const key=`${item.id}:${item.date}:${item.event}`;
   if(seen.has(key)||ignored.has(key))continue;
   const matches=saved.filter(bookmark=>{
    if(!sameTitleYear(bookmark,item))return false;
    const bookmarkId=positive(bookmark?.tmdbId??bookmark?.tmdb_id);
    if(bookmarkId)return bookmarkId===item.id;
    // Older bookmarks stored their TMDB key as id. Keep them only when that key,
    // title, and year all agree; the catalog must not contain a same-name ambiguity.
    if(positive(bookmark?.id)!==item.id)return false;
    const collisions=new Set(eligible.filter(candidate=>candidate.title===item.title&&candidate.year===item.year).map(candidate=>candidate.id));
    return collisions.size===1;
   });
   if(matches.length!==1)continue;
   const savedAt=String(matches[0].savedAt||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(savedAt)||savedAt>item.date)continue;
   seen.add(key);results.push({key,id:item.id,title:String(item.original.title),year:item.year,date:item.date,event:item.event,service:item.service,source:item.source,source_url:item.source_url});
  }
  return results;
 }
 const api={todayInJapan,collectReleaseNotices};root.CinelvaReleaseNotices=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
