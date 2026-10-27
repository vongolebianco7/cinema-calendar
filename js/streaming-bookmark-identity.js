/* Safely connect existing Cinelva bookmarks with explicit TMDB identities.
 * Never infer a TMDB ID from a local storage key or from title alone.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.CinelvaStreamingBookmarks=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const id=value=>{
  if(value===null||value===undefined||!/^[1-9][0-9]*$/.test(String(value)))return null;
  const number=Number(value);
  return Number.isSafeInteger(number)?number:null;
 };
 const title=value=>String(value||'').normalize('NFKC').trim();
 const year=value=>/^(18|19|20|21)[0-9]{2}$/.test(String(value??''))?String(value):null;
 function resolve(bookmarks,records){
  if(!bookmarks||typeof bookmarks!=='object'||Array.isArray(bookmarks))return {ids:null,unresolved:0};
  const items=Object.entries(bookmarks).filter(([,value])=>value&&typeof value==='object'&&!Array.isArray(value));
  const found=new Set();let unresolved=0;
  const available=Array.isArray(records)?records:[];
  for(const [key,item] of items){
   let tmdb=id(item.tmdbId??item.tmdb_id);
   if(tmdb===null){
    const candidates=available.filter(record=>{
     if(!record||typeof record!=='object'||String(record.id)!==key)return false;
     if(!title(item.title)||title(item.title)!==title(record.title))return false;
     const itemYear=year(item.year),recordYear=year(record.year);
     return Boolean(itemYear&&recordYear&&itemYear===recordYear&&id(record.tmdbId??record.tmdb_id)!==null);
    });
    if(candidates.length===1)tmdb=id(candidates[0].tmdbId??candidates[0].tmdb_id);
   }
   if(tmdb===null)unresolved++;
   else found.add(tmdb);
  }
  return {ids:unresolved===0?[...found]:null,unresolved};
 }
 return {resolve};
});
