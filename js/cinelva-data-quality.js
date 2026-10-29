(function(root){
 'use strict';
 const normalize=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
 function availabilityIsFresh(info,now=Date.now()) {
  const checked=Date.parse(info?.checked_at||'');
  return Number.isFinite(checked)&&checked<=now+300000&&now-checked<=7*86400000;
 }
 function uniqueMovies(rows) {
  const list=Array.isArray(rows)?rows:[],tmdbId=movie=>{
   const explicit=movie?.tmdbId??movie?.tmdb_id??movie?.tmdbID??movie?.tmdb?.id;
   const linked=String(movie?.tmdb||movie?.tmdb_url||'').match(/^https:\/\/(?:www\.)?themoviedb\.org\/movie\/(\d+)(?:[/?#-]|$)/)?.[1];
   const shaped=movie?.poster_path&&movie?.release_date&&(movie?.vote_average!==undefined||movie?.vote_count!==undefined);
   const value=explicit??linked??(shaped?movie?.id:'');
   return /^[1-9]\d*$/.test(String(value??''))&&Number.isSafeInteger(Number(value))?String(Number(value)):'';
  };
  const identityKeys=movie=>{
   const year=Number(movie?.year||movie?.release_year||String(movie?.release_date||'').slice(0,4));
   return Number.isInteger(year)&&year>0?[movie?.title,movie?.original_title,movie?.originalTitle,...(Array.isArray(movie?.aliases)?movie.aliases:[])].filter(Boolean).map(title=>year+':'+normalize(title)):[];
  };
  // Title/year is a fallback identity only. Preserve separate verified TMDB IDs
  // even when localized titles normalize to the same text.
  const idsByTitleYear=new Map();
  for(const movie of list){const id=tmdbId(movie);if(!id)continue;for(const key of identityKeys(movie)){if(!idsByTitleYear.has(key))idsByTitleYear.set(key,new Set());idsByTitleYear.get(key).add(id);}}
  const seenIds=new Set(),seenIdlessTitles=new Set(),output=[];
  for(const movie of list){
   const id=tmdbId(movie),keys=identityKeys(movie);
   if(id){if(seenIds.has(id))continue;seenIds.add(id);output.push(movie);continue;}
   if(!keys.length){output.push(movie);continue;}
   // Do not guess which work an ID-less row means when title/year has conflicts.
   if(keys.some(key=>(idsByTitleYear.get(key)?.size||0)>1)){output.push(movie);continue;}
   // A single verified identity safely absorbs a legacy alias; otherwise only
   // repeated ID-less rows collapse by normalized title/year.
   if(keys.some(key=>(idsByTitleYear.get(key)?.size||0)===1))continue;
   if(keys.some(key=>seenIdlessTitles.has(key)))continue;
   for(const key of keys)seenIdlessTitles.add(key);output.push(movie);
  }
  return output;
 }
 function activeOfficialOffers(rows,now=Date.now()) {
  return (rows||[]).filter(row=>row.source_type==='official_on_demand_listing'&&/^https:\/\//.test(row.source_url||'')&&availabilityIsFresh(row,now)&&Date.parse(row.ends_at||'')>=now&&(!row.starts_at||Date.parse(row.starts_at)<=now));
 }
 const api={availabilityIsFresh,uniqueMovies,activeOfficialOffers};
 root.CinelvaDataQuality=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
