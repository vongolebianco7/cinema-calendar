(function(root){
 'use strict';
 const normalize=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
 function availabilityIsFresh(info,now=Date.now()) {
  const checked=Date.parse(info?.checked_at||'');
  return Number.isFinite(checked)&&checked<=now+300000&&now-checked<=7*86400000;
 }
 function uniqueMovies(rows) {
  const movies=(Array.isArray(rows)?rows:[]).filter(movie=>movie&&typeof movie==='object');
  const verified=movie=>{const raw=movie.tmdbId??movie.tmdb_id;return /^[1-9]\d*$/.test(String(raw))&&Number.isSafeInteger(Number(raw))?String(Number(raw)):'';};
  const keysFor=movie=>Number(movie.year)>0?[movie.title,movie.original_title,movie.originalTitle,...(Array.isArray(movie.aliases)?movie.aliases:[])].filter(Boolean).map(title=>Number(movie.year)+':'+normalize(title)):[];
  const verifiedTitles=new Map();
  // Resolve ambiguity before considering legacy rows, independent of input order.
  for(const movie of movies){const id=verified(movie);if(!id)continue;for(const key of keysFor(movie)){if(!verifiedTitles.has(key))verifiedTitles.set(key,new Set());verifiedTitles.get(key).add(id);}}
  const ids=new Map(),titles=new Map(),output=[];
  for(const movie of movies){
   const canonical=verified(movie),local=String(movie.id||''),id=canonical?'tmdb:'+canonical:local&&local!=='0'?'local:'+local:'',keys=keysFor(movie);
   let index=id?ids.get(id):undefined;
   if(index===undefined){const key=keys.find(key=>titles.has(key)&&(verifiedTitles.get(key)?.size||0)<=1);if(key!==undefined)index=titles.get(key);}
   if(index===undefined){index=output.length;output.push(movie);}
   else if(canonical&&!verified(output[index])){
    const old=output[index];output[index]={...old,...movie,tmdbId:Number(canonical),poster:movie.poster||old.poster};
   }
   if(id)ids.set(id,index);for(const key of keys)titles.set(key,index);
  }
  return output;
 }
 function activeOfficialOffers(rows,now=Date.now()) {
  return (rows||[]).filter(row=>row.source_type==='official_on_demand_listing'&&/^https:\/\//.test(row.source_url||'')&&availabilityIsFresh(row,now)&&Date.parse(row.ends_at||'')>=now&&(!row.starts_at||Date.parse(row.starts_at)<=now));
 }
 const api={availabilityIsFresh,uniqueMovies,activeOfficialOffers};
 root.CinelvaDataQuality=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
