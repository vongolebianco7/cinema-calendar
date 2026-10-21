// Static smoke tests: run with node scripts/smoke-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const pages=['index.html','discover.html','rankings.html','search.html','experience.html','theaters.html','my-cinemap.html','my-cinelva/index.html'];
let failures=0,checks=0;
function check(ok,message){checks++;if(!ok){console.error('FAIL '+message);failures++;}}
for(const page of pages){
 check(fs.existsSync(page),'missing page: '+page);
 if(!fs.existsSync(page))continue;
 const html=read(page);
 check(html.includes('<html')&&html.includes('</html>'),'invalid page shell: '+page);
 const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
 for(const [i,script] of scripts.entries()){
  if(/type=["']application\/(?:json|ld\+json)["']/i.test(script[1]))continue;
  if(!script[2].trim())continue;
  try{new vm.Script(script[2],{filename:page+'#inline'+i});}catch(e){check(false,'JS parse: '+e.message);}
 }
 for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/gi)){
  const ref=match[1].split(/[?#]/)[0];
  if(!ref||/^(https?:|data:|mailto:|\/\/)/i.test(ref)||ref.startsWith('/')||ref.startsWith('#')||ref.includes('{{'))continue;
  check(fs.existsSync(path.resolve(path.dirname(page),ref)),'missing asset '+page+' -> '+ref);
 }
}
for(const file of ['data/streaming.json','data/theatrical.json','data/boxoffice.json']){
 if(!fs.existsSync(file)){check(false,'missing '+file);continue;}
 try{const d=JSON.parse(read(file));check(!!d&&typeof d==='object','invalid JSON '+file);}
 catch(e){check(false,'JSON parse '+file+': '+e.message);}
}
const streaming=JSON.parse(read('data/streaming.json'));
check(Array.isArray(streaming.movies),'streaming movie array');
if(Array.isArray(streaming.movies)){
 for(const m of streaming.movies){
  check(!!m.title&&!!m.date&&!!m.service,'streaming record missing required fields');
  if(/WOWOW/i.test(m.service||''))check(m.event==='streaming','WOWOW on-demand must be streaming');
 }
}

const posterSource=read('js/cinelva-movie-identity.js');
try {
 const store=new Map();
 const localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
 const window={};
 const context=vm.createContext({window,localStorage,URL,URLSearchParams,fetch:async()=>({ok:true,json:async()=>({movies:[]})})});
 new vm.Script(posterSource,{filename:'js/cinelva-movie-identity.js'}).runInContext(context);
 const identity=window.CinelvaMovieIdentity;
 check(!!identity,'canonical poster registry is initialized');
 if(identity){
  const local=identity.ingest({id:345,title:'Local record',poster:'/local.jpg'});
  check(local===null,'local IDs are not silently treated as TMDB IDs');
  const canonical=identity.ingest({id:345,tmdb_id:678,title:'Canonical',year:2024,poster_path:'/canonical.jpg'});
  check(canonical?.tmdbId===678,'explicit TMDB ID takes priority over local ID');
  const url=identity.posterFor({tmdb_id:678});
  check(url.includes('/canonical.jpg'),'poster registry resolves canonical artwork');
  identity.reportBroken({tmdb_id:678},url);
  check(!identity.posterFor({tmdb_id:678}),'broken poster is invalidated');
  identity.ingest({tmdb_id:678,title:'Canonical',poster_path:'/canonical.jpg'});
  check(!identity.posterFor({tmdb_id:678}),'broken poster cannot be reintroduced by ingest');
 }
} catch(error){check(false,'poster registry regression: '+error.message)}
for(const page of ['index.html','discover.html','search.html','rankings.html','my-cinelva/index.html','events.html','experience.html']){
 check(read(page).includes('cinelva-movie-identity.js'),'shared poster registry not loaded on '+page);
}
console.log(checks+' checks; '+failures+' failures');
if(failures)process.exit(1);
