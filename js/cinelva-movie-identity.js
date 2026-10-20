/* Canonical movie identity for CINELVA: TMDB ID is authoritative. */
(function(root){'use strict';
const byId=new Map(),aliases=new Map(),pending=new Map();
const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const year=m=>Number(m?.release_year||m?.year||String(m?.release_date||m?.date||'').slice(0,4))||0;
const id=m=>Number(m?.tmdb_id||m?.tmdbId||m?.id||0);
const poster=m=>{const v=String(m?.poster||m?.poster_url||m?.poster_path||m?.posterPath||'');if(!v)return '';if(/^https?:\/\//.test(v))return v;if(v.startsWith('/'))return 'https://image.tmdb.org/t/p/w500'+v;return ''};
function ingest(m){const key=id(m);if(!Number.isSafeInteger(key)||key<=0)return null;const prev=byId.get(key)||{};const next={...prev,...m,id:key,tmdbId:key,title:m.title||prev.title||'',original_title:m.original_title||prev.original_title||'',year:year(m)||year(prev),poster:poster(m)||poster(prev)};byId.set(key,next);for(const title of [next.title,next.original_title,m.film_title,m.display_title]){const n=norm(title);if(!n)continue;const k=n+'|'+next.year;if(!aliases.has(k))aliases.set(k,new Set());aliases.get(k).add(key)}return next}
function ingestMany(rows){for(const m of rows||[])ingest(m)}
function resolve(query){const key=id(query);if(key>0)return byId.get(key)||null;const title=norm(query?.film_title||query?.title||query?.original_title),y=year(query);if(!title||!y)return null;const hits=aliases.get(title+'|'+y);return hits?.size===1?byId.get([...hits][0]):null}
async function fetchOne(query){const cached=resolve(query);if(cached?.poster)return cached;const key=id(query)||norm(query?.title||query?.film_title)+'|'+year(query);if(pending.has(key))return pending.get(key);const task=(async()=>{const title=query?.film_title||query?.title||'';if(!title)return cached;try{const response=await fetch('https://backend-one-gray-94.vercel.app/api/movies?'+new URLSearchParams({q:title,limit:'30'}));if(!response.ok)return cached;const d=await response.json();const candidates=[...(d.movies||[]),...(d.external||[]),...(d.results||[])];const wanted=id(query),y=year(query),n=norm(title);const matches=candidates.filter(m=>wanted?id(m)===wanted:year(m)===y&&[m.title,m.original_title,m.originalTitle].some(t=>norm(t)===n));const ids=new Set(matches.map(id).filter(Boolean));if(ids.size!==1)return cached;return ingest(matches.find(m=>poster(m))||matches[0])||cached}catch{return cached}})();pending.set(key,task);try{return await task}finally{pending.delete(key)}}
const localPath=location.pathname.includes('/my-cinelva/')?'../data/':'data/';
let readyPromise;
async function loadMaster(){
 if(readyPromise)return readyPromise;
 readyPromise=(async()=>{
  const sources=['movies.json','awards.json','boxoffice.json'];
  const loaded=await Promise.all(sources.map(async name=>{
   try{const response=await fetch(localPath+name);if(!response.ok)return null;return {name,data:await response.json()}}catch{return null}
  }));
  for(const source of loaded){
   if(!source)continue;
   const d=source.data;
   if(source.name==='movies.json'){
    if(Array.isArray(d))ingestMany(d);
    else if(Array.isArray(d.movies))ingestMany(d.movies);
   }else if(source.name==='awards.json')ingestMany(d.catalog||[]);
   else if(source.name==='boxoffice.json'){
    ingestMany(d.all_time||[]);
    for(const rows of Object.values(d.by_year||{}))ingestMany(rows);
   }
  }
  return byId.size;
 })();
 return readyPromise;
}
function diagnostics(){return {movies:byId.size,aliases:aliases.size,pending:pending.size}}
root.CinelvaMovieIdentity={ingest,ingestMany,resolve,fetchOne,loadMaster,ready:loadMaster,stats:diagnostics};
loadMaster();

})(window);
