/* Personalised comparisons are only derived from verified TMDB IDs.
 * Never infer availability from award data or a release calendar.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.CinelvaStreamingPersonalMatch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const id=value=>{
  if(value===null||value===undefined||!/^[1-9][0-9]*$/.test(String(value)))return null;
  const n=Number(value);return Number.isSafeInteger(n)?n:null;
 };
 const normalize=value=>String(value||'').normalize('NFKC').trim();
 const recordId=record=>id(record?.tmdbId??record?.tmdb_id);
 function awardMatches(validated,records,awards){
  if(!validated?.ok||!Array.isArray(records)||!Array.isArray(awards))return null;
  const watched=new Set(records.filter(r=>r&&r.watched!==false).map(recordId).filter(Boolean));
  if(!watched.size)return [];
  const organizations=new Map();
  for(const entry of awards){
   if(!entry||entry.match_status!=='resolved'||!id(entry.tmdb_id)||!normalize(entry.organization))continue;
   const key=normalize(entry.organization),group=organizations.get(key)||new Set();
   group.add(id(entry.tmdb_id));organizations.set(key,group);
  }
  const ranked=[...organizations].map(([name,films])=>({
   name,watched:[...films].filter(film=>watched.has(film)).length,films
  })).filter(x=>x.watched>0).sort((a,b)=>b.watched-a.watched||a.name.localeCompare(b.name,'ja'));
  if(!ranked.length)return [];
  const winner=ranked[0];
  return validated.movies.filter(movie=>winner.films.has(id(movie.tmdb_id)));
 }
 function directorMatches(validated,records){
  if(!validated?.ok||!Array.isArray(records))return null;
  // Only numeric TMDB person IDs are safe to join; identical names are not proof.
  const watched=records.filter(r=>r&&r.watched!==false);
  const counts=new Map();
  for(const record of watched){
   const person=id(record.director_id??record.directorId);
   if(!person||!recordId(record))continue;
   counts.set(person,(counts.get(person)||0)+1);
  }
  const winner=[...counts].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0];
  if(!winner)return [];
  return validated.movies.filter(movie=>id(movie.director_id)===winner[0]);
 }
 return {awardMatches,directorMatches};
});
