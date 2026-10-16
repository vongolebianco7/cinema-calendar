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
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 for(const [i,script] of scripts.entries()){
  if(!script[1].trim())continue;
  try{new vm.Script(script[1],{filename:page+'#inline'+i});}catch(e){check(false,'JS parse: '+e.message);}
 }
 for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/gi)){
  const ref=match[1].split(/[?#]/)[0];
  if(!ref||/^(https?:|data:|mailto:|\/\/)/i.test(ref)||ref.startsWith('/'))continue;
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
console.log(checks+' checks; '+failures+' failures');
if(failures)process.exit(1);
