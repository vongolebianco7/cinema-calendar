(function(root){
 'use strict';
 const normalize=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
 function availabilityIsFresh(info,now=Date.now()) {
  const checked=Date.parse(info?.checked_at||'');
  return Number.isFinite(checked)&&checked<=now+300000&&now-checked<=7*86400000;
 }
 function uniqueMovies(rows) {
  const ids=new Set(),titles=new Set(),output=[];
  for(const movie of rows||[]) {
   const id=String(movie.tmdbId||movie.tmdb_id||movie.id||''),year=Number(movie.year);
   const keys=year>0?[movie.title,movie.original_title,movie.originalTitle,...(movie.aliases||[])].filter(Boolean).map(title=>year+':'+normalize(title)):[];
   const duplicate=(id&&ids.has(id))||keys.some(key=>titles.has(key));
   if(id)ids.add(id);for(const key of keys)titles.add(key);
   if(!duplicate)output.push(movie);
  }
  return output;
 }
 function activeOfficialOffers(rows,now=Date.now()) {
  return (rows||[]).filter(row=>row.source_type==='official_on_demand_listing'&&/^https:\/\//.test(row.source_url||'')&&availabilityIsFresh(row,now)&&Date.parse(row.ends_at||'')>=now&&(!row.starts_at||Date.parse(row.starts_at)<=now));
 }
 const api={availabilityIsFresh,uniqueMovies,activeOfficialOffers};
 root.CinelvaDataQuality=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
