/* Canonical movie identity for CINELVA: TMDB ID is authoritative. */
(function(root){'use strict';
const byId=new Map(),aliases=new Map(),pending=new Map(),badPosters=new Set();
const CACHE_KEY='cinelva-poster-registry-v1',MAX_CACHE=3000;
let stored={};try{stored=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')||{}}catch{stored={}}
let dirty=false;
function save(){if(!dirty)return;dirty=false;try{const entries=Object.entries(stored).slice(-MAX_CACHE);localStorage.setItem(CACHE_KEY,JSON.stringify(Object.fromEntries(entries)))}catch{}}
function posterFromCache(key){const p=stored[String(key)];return typeof p==='string'&&!badPosters.has(p)?p:''}
function cachePoster(key,url){if(!key||!url||badPosters.has(url)||posterFromCache(key)===url)return;delete stored[String(key)];stored[String(key)]=url;dirty=true;save()}

const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const year=m=>Number(m?.release_year||m?.year||String(m?.release_date||m?.date||'').slice(0,4))||0;
const id=m=>Number(m?.tmdb_id||m?.tmdbId||m?.id||0);
const poster=m=>{const v=String(m?.poster||m?.poster_url||m?.posterUrl||m?.poster_path||m?.posterPath||m?.posterURL||m?.images?.poster||m?.images?.poster_path||'');if(!v)return '';if(/^https?:\/\//.test(v))return v;if(v.startsWith('//'))return 'https:'+v;if(v.startsWith('/'))return 'https://image.tmdb.org/t/p/w500'+v;if(/^(?:w\d+|original)\//.test(v))return 'https://image.tmdb.org/t/p/'+v;return ''};
function ingest(m){const key=id(m);if(!Number.isSafeInteger(key)||key<=0)return null;const prev=byId.get(key)||{};const next={...prev,...m,id:key,tmdbId:key,title:m.title||prev.title||'',original_title:m.original_title||prev.original_title||'',year:year(m)||year(prev),poster:poster(m)||poster(prev)||posterFromCache(key)};byId.set(key,next);if(next.poster)cachePoster(key,next.poster);for(const title of [next.title,next.original_title,m.film_title,m.display_title]){const n=norm(title);if(!n)continue;const k=n+'|'+next.year;if(!aliases.has(k))aliases.set(k,new Set());aliases.get(k).add(key)}return next}
function ingestMany(rows){for(const m of rows||[])ingest(m)}
function resolve(query){const key=id(query);if(key>0)return byId.get(key)||(posterFromCache(key)?{id:key,tmdbId:key,poster:posterFromCache(key)}:null);const title=norm(query?.film_title||query?.title||query?.original_title),y=year(query);if(!title||!y)return null;const hits=aliases.get(title+'|'+y);return hits?.size===1?byId.get([...hits][0]):null}
async function fetchOne(query){const cached=resolve(query);if(cached?.poster&&!badPosters.has(cached.poster))return cached;const key=id(query)||norm(query?.title||query?.film_title)+'|'+year(query);if(pending.has(key))return pending.get(key);const task=(async()=>{const title=query?.film_title||query?.title||'';if(!title)return cached;try{const response=await fetch('https://backend-one-gray-94.vercel.app/api/movies?'+new URLSearchParams({q:title,limit:'30'}));if(!response.ok)return cached;const d=await response.json();const candidates=[...(d.movies||[]),...(d.external||[]),...(d.results||[])];const wanted=id(query),y=year(query),n=norm(title);const matches=candidates.filter(m=>wanted?id(m)===wanted:year(m)===y&&[m.title,m.original_title,m.originalTitle].some(t=>norm(t)===n));const ids=new Set(matches.map(id).filter(Boolean));if(ids.size!==1)return cached;return ingest(matches.find(m=>poster(m)&&!badPosters.has(poster(m)))||matches[0])||cached}catch{return cached}})();pending.set(key,task);try{return await task}finally{pending.delete(key)}}
function posterFor(movie){const direct=poster(movie);const key=id(movie);if(direct&&!badPosters.has(direct)){if(key>0)ingest(movie);return direct}return key>0?([byId.get(key)?.poster,posterFromCache(key)].find(v=>v&&!badPosters.has(v))||''):''}
function reportBroken(movie,url){const key=id(movie),broken=String(url||poster(movie)||'');if(broken)badPosters.add(broken);if(key>0){const entry=byId.get(key);if(entry?.poster===broken)byId.set(key,{...entry,poster:''});if(stored[String(key)]===broken){delete stored[String(key)];dirty=true;save()}}}
function hydratePoster(image,movie){if(!image||!movie)return;const key=id(movie);if(key<=0)return;const resolved=posterFor(movie);if(resolved&&(!image.getAttribute('src')||image.dataset.posterFailed==='1')){image.dataset.posterFailed='';image.src=resolved}
image.addEventListener('error',async()=>{if(image.dataset.posterRetry==='1')return;image.dataset.posterRetry='1';reportBroken(movie,image.currentSrc||image.src);const next=await fetchOne({...movie,poster:'',poster_url:'',posterUrl:'',poster_path:''});const alternative=next?.poster;if(alternative&&!badPosters.has(alternative)&&image.isConnected){image.dataset.posterFailed='';image.src=alternative}else image.dataset.posterFailed='1'},{once:true});
}
function posterStats(){return {movies:byId.size,posters:Object.keys(stored).length,aliases:aliases.size}}
root.CinelvaMovieIdentity={ingest,ingestMany,resolve,fetchOne,posterFor,hydratePoster,reportBroken,stats:posterStats};
})(window);
