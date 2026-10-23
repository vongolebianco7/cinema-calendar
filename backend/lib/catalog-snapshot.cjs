'use strict';
// These are the same reviewed snapshots published by the static frontend.
const films=require('../../data/movies.json');
const television=require('../../data/tv.json');
const venues=require('../../data/theaters_master.json');
const compact=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
const bounded=value=>Number.isFinite(Number(value))?Math.min(100,Math.max(1,Math.floor(Number(value)))):50;
function calendarSnapshot(){return {generated_at:films.generated_at,movies:films.movies};}
function tvSnapshot(){return {generated_at:television.generated_at,movies:television.movies};}
function movieSnapshot(query='',limit=50){
 const term=compact(query),seen=new Set();
 const movies=films.movies.filter(m=>{
  if(term&&!compact(m.title).includes(term)&&!compact(m.original_title).includes(term))return false;
  const key=String(m.tmdbId||m.tmdb_id||m.id||`${m.title}:${m.year||m.release_year||''}`);
  if(seen.has(key))return false;seen.add(key);return true;
 }).slice(0,bounded(limit));
 return {generated_at:films.generated_at,movies};
}
function theaterSnapshot(query='',prefecture=''){
 const term=compact(query);
 const theaters=venues.theaters.filter(t=>(!prefecture||t.prefecture===prefecture)&&(!term||[t.name,t.address,t.municipality].some(v=>compact(v).includes(term))))
 .slice(0,query||prefecture?300:2000).map(t=>({...t,id:t.source_id}));
 return {generated_at:venues.generated_at,source:venues.source,license:venues.license,count:theaters.length,theaters};
}
function releaseSnapshot(from,to,service=''){
 const releases=films.movies.filter(m=>m.date>=from&&m.date<to&&(!service||m.service===service)).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.service||'').localeCompare(String(b.service||''))).map((m,i)=>({
  id:`snapshot:${m.tmdbId||m.tmdb_id||m.id||i}:${m.date}:${m.service}`,movieId:String(m.tmdbId||m.tmdb_id||m.id||i),date:m.date+'T00:00:00.000Z',event:m.event,service:m.service,source:m.source,sourceUrl:m.source_url,
  movie:{id:String(m.tmdbId||m.tmdb_id||m.id||i),tmdbId:m.tmdbId||m.tmdb_id||m.id||null,title:m.title,originalTitle:m.original_title,posterUrl:m.poster,score:m.score,votes:m.votes,overview:m.overview,director:m.director,runtime:m.runtime,genres:m.genres,countries:m.countries}
 }));
 return {generated_at:films.generated_at,releases,count:releases.length,from:from+'T00:00:00.000Z',to:to+'T00:00:00.000Z'};
}
function createReadFallback({timeoutMs=1500,cooldownMs=60000,now=Date.now}={}){
 let nextAttemptAt=0;
 const fallback=snapshot=>({...snapshot(),data_source:'static_snapshot',database_status:'unavailable'});
 return async(read,snapshot)=>{
  if(nextAttemptAt>now())return fallback(snapshot);
  let timer;
  try{return await Promise.race([Promise.resolve().then(read),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('database read deadline')),timeoutMs);})]);}
  catch{nextAttemptAt=now()+cooldownMs;return fallback(snapshot);}
  finally{clearTimeout(timer);}
 };
}
const readWithSnapshot=createReadFallback();
module.exports={createReadFallback,readWithSnapshot,calendarSnapshot,movieSnapshot,tvSnapshot,theaterSnapshot,releaseSnapshot};
