'use strict';
const {validateCatalog}=require('./imax-catalog.js');

function canFetchSource(source,allowlist){
  if(!allowlist||allowlist.collection_enabled!==true||!source)return false;
  const host=(()=>{try{return new URL(source.url||'').hostname}catch{return ''}})();
  const entry=(allowlist.sources||[]).find(x=>x.domain===host);
  return !!(entry&&entry.approved_for_automated_fetch===true&&entry.fetch_mode==='automated'&&entry.reviewed_at&&Number(entry.minimum_interval_ms)>=1000);
}
function planRefresh(sources,allowlist,{maxRequests=10}={}){
  const budget=Math.max(0,Math.min(25,Number(maxRequests)||0));
  return {concurrency:1,maxRequests:budget,requests:(sources||[]).filter(s=>canFetchSource(s,allowlist)).slice(0,budget)};
}
async function refreshCatalog({currentCatalog,sources,allowlist,maxRequests=10,fetcher,parser}){
  const plan=planRefresh(sources,allowlist,{maxRequests});
  if(!plan.requests.length)return {updated:false,catalog:currentCatalog,requestsMade:0,skipped:true};
  let requestsMade=0;
  try{
    let proposed=currentCatalog;
    for(const source of plan.requests){
      requestsMade++;
      const payload=await fetcher(source);
      proposed=await parser(payload,source,proposed);
    }
    const validation=validateCatalog(proposed);
    if(!validation.valid)return {updated:false,catalog:currentCatalog,requestsMade,errors:validation.errors};
    return {updated:true,catalog:proposed,requestsMade,errors:[]};
  }catch(error){return {updated:false,catalog:currentCatalog,requestsMade,errors:[String(error&&error.message||error)]};}
}
if(require.main===module){console.log('IMAX refresh is disabled by default. Review and approve the source allowlist before any automated fetch.');}
module.exports={canFetchSource,planRefresh,refreshCatalog};
