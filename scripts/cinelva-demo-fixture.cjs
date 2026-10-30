'use strict';
const fs=require('node:fs');
const path=require('node:path');

const TARGET_RECORDS=1200;
const YEAR_COUNTS=[[2017,100],[2018,110],[2019,115],[2020,120],[2021,125],[2022,130],[2023,135],[2024,140],[2025,145],[2026,80]];
const SOURCE_FILES=['movies.json','rankings.json','rankings_year.json','theatrical.json','streaming.json','now_playing.json','release_history.json','boxoffice.json','boxoffice-current.json'];
const asList=value=>Array.isArray(value)?value:[];
function loadJson(root,relative){try{return JSON.parse(fs.readFileSync(path.join(root,'data',relative),'utf8'));}catch{return null;}}
function jsonFiles(directory){if(!fs.existsSync(directory))return [];return fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en')).flatMap(entry=>{const full=path.join(directory,entry.name);return entry.isDirectory()?jsonFiles(full):entry.isFile()&&entry.name.endsWith('.json')?[full]:[];});}
function walkMovies(value,visit){
 if(Array.isArray(value)){for(const item of value)walkMovies(item,visit);return;}
 if(!value||typeof value!=='object')return;
 const rawId=value.tmdbId??value.tmdb_id??value.movieId??value.id;
 const title=value.display_title??value.title??value.original_title??value.film_title;
 if(rawId!==undefined&&rawId!==null&&title)visit(value,String(title));
 for(const [key,child] of Object.entries(value))if(key!=='title'&&key!=='display_title'&&key!=='original_title'&&key!=='film_title')walkMovies(child,visit);
}
function idFor(value){const raw=value&&typeof value==='object'?(value.tmdbId??value.tmdb_id??value.movieId??value.id):value;const id=Number(raw);return Number.isSafeInteger(id)&&id>0?id:null;}
function text(value){return typeof value==='string'?value.trim():'';}
function uniqueStrings(values,limit){return [...new Set(asList(values).map(text).filter(Boolean))].slice(0,limit);}
function hash(value){let h=2166136261;for(const ch of String(value)){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function dateWithinYear(year,index,today){
 const first=Date.UTC(year,0,1),last=year===Number(today.slice(0,4))?Date.parse(today+'T00:00:00Z'):Date.UTC(year+1,0,1)-86400000;
 const days=Math.max(1,Math.floor((last-first)/86400000)+1),day=hash(`${year}:${index}`)%days;
 return new Date(first+day*86400000).toISOString().slice(0,10);
}
function summary(records,year){
 const watched=records.filter(r=>r.watched!==false);
 return {total:watched.length,year:watched.filter(r=>r.watchedAt?.slice(0,4)===String(year)).length,
  average:watched.length?watched.reduce((sum,r)=>sum+Number(r.rating||0),0)/watched.length:0,
  genres:watched.reduce((out,r)=>{for(const genre of r.genres||[])out[genre]=(out[genre]||0)+1;return out;},{}),
  countries:watched.reduce((out,r)=>{for(const country of r.countries||[])out[country]=(out[country]||0)+1;return out;},{})};
}
function buildDemoRecords({root=process.cwd(),today='2026-10-30'}={}){
 if(!/^2026-\d{2}-\d{2}$/.test(today))throw new Error('Demo fixture date must be within 2026');
 const byId=new Map(),awardIds=new Set();
 const sources=SOURCE_FILES.map(file=>loadJson(root,file)).filter(Boolean);
 for(const file of jsonFiles(path.join(root,'data','rankings')))sources.push(loadJson(root,path.relative(path.join(root,'data'),file)));
 for(const document of sources){if(!document)continue;walkMovies(document,(row,title)=>{
   const id=idFor(row.tmdbId??row.tmdb_id??row.movieId??row.id);if(!id)return;
   const prior=byId.get(id)||{id,tmdbId:id,title:'',director:'',year:'',poster:'',genres:[],countries:[],votes:0,sourcePriority:0,award:false};
   const candidate={
    title:text(row.display_title)||text(row.title)||text(row.original_title)||text(row.film_title)||title,
    director:text(row.director)||text(row.director_name),
    year:text(row.release_year||row.year)||text(row.release_date||row.date).slice(0,4),
    poster:text(row.poster||row.posterUrl||row.poster_path),
    genres:uniqueStrings(row.genres,12),
    countries:uniqueStrings(row.countries||row.country?[...(Array.isArray(row.countries)?row.countries:[]),...(typeof row.country==='string'?[row.country]:[])]:[],20),
    votes:Number(row.votes||row.vote_count||0)
   };
   for(const key of ['title','director','year','poster'])if(!prior[key]&&candidate[key])prior[key]=candidate[key];
   for(const key of ['genres','countries'])if(!prior[key].length&&candidate[key].length)prior[key]=candidate[key];
   prior.votes=Math.max(prior.votes,candidate.votes);byId.set(id,prior);
  });}
 const awards=loadJson(root,'awards.json');
 for(const award of asList(awards?.awards)){
  if(award.match_status!=='resolved')continue;
  const id=Number(award.tmdb_id);if(!Number.isSafeInteger(id)||id<=0)continue;
  awardIds.add(id);
  const prior=byId.get(id)||{id,tmdbId:id,title:'',director:'',year:'',poster:'',genres:[],countries:[],votes:0,sourcePriority:0,award:false};
  if(!prior.title)prior.title=text(award.display_title)||text(award.film_title);
  if(!prior.year)prior.year=String(award.release_year||award.year||'');
  if(!prior.poster)prior.poster=text(award.poster);
  prior.award=true;byId.set(id,prior);
 }
 const candidates=[...byId.values()].filter(row=>row.title).sort((a,b)=>Number(b.award)-Number(a.award)||b.votes-a.votes||a.id-b.id);
 if(candidates.length<TARGET_RECORDS)throw new Error(`Only ${candidates.length} real catalogue identities are available for demo records`);
 const selected=candidates.slice(0,TARGET_RECORDS),records=[];let cursor=0;
 for(const [year,count] of YEAR_COUNTS){for(let i=0;i<count;i++){
   const film=selected[cursor++],stable=hash(`rating:${film.id}`);
   records.push({id:String(film.id),tmdbId:film.id,title:film.title.slice(0,160),year:film.year||null,director:film.director,
    poster:film.poster,genres:film.genres,countries:film.countries,rating:Math.round((2.8+(stable%23)/10)*10)/10,
    watchedAt:dateWithinYear(year,i,today),watched:true,viewingMethod:hash(`method:${film.id}`)%4===0?'映画館':'配信'});
  }}
 const selectedIds=new Set(records.map(r=>Number(r.id)));
 return {records,awardMatchCount:[...awardIds].filter(id=>selectedIds.has(id)).length,sourceCount:candidates.length,generatedFor:today};
}
module.exports={TARGET_RECORDS,YEAR_COUNTS,buildDemoRecords,summary};
