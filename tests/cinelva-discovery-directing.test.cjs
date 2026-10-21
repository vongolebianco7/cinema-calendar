const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function route(fetcher,configured=true){let code=require('node:module').stripTypeScriptTypes(fs.readFileSync('backend/app/api/people/route.ts','utf8'),{mode:'transform'});code=code.replace(/^import .*?;\n/m,'').replaceAll('export ','');const ctx={URL,process:{env:configured?{TMDB_API_KEY:'test-key'}:{}},fetch:fetcher,json:(body,options)=>({body,status:options?.status||200}),rateLimited:()=>null,options:()=>null};vm.runInNewContext(code+';globalThis.get=GET',ctx);return ctx.get;}
test('director credits exclude producer/writer credits and deduplicate canonical films',async()=>{
 let requested='';const get=route(async url=>{requested=String(url);return {ok:true,json:async()=>({crew:[{id:27205,job:'Director'},{id:27205,job:'Director'},{id:141052,job:'Producer'},{id:57729,job:'Writer'}]})}});
 const r=await get({url:'https://local/api/people?role=director&id=525'});
 assert.deepEqual(Array.from(r.body.ids||[]),[27205]);assert.match(requested,/person\/525\/movie_credits/);
});
test('invalid director ID and unavailable upstream fail explicitly',async()=>{
 const get=route(async()=>({ok:false}));assert.equal((await get({url:'https://local/api/people?role=director&id=-1'})).status,400);
 assert.equal((await get({url:'https://local/api/people?role=director&id=525'})).status,502);
 assert.equal((await route(()=>{throw Error('should not fetch')},false)({url:'https://local/api/people?role=director&id=525'})).status,503);
});
function discovery(fetcher){const html=fs.readFileSync('discover.html','utf8');const start=html.includes('const directorCreditsCache=')?html.indexOf('const directorCreditsCache='):html.indexOf('async function load(reset=');const code=html.slice(start,html.indexOf('\nfunction render()',start));const nodes=new Map();const $=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'old results',textContent:'',style:{}});return nodes.get(id)};const ctx={API:'https://local',URLSearchParams,fetch:fetcher,$,page:1,items:[],directorId:'525',currentPersonKind:'director',currentPersonId:'525',build:()=>'?crew=525',normalizeLocalMovie:m=>({...m,normalized:true}),render(){},renderPersonProfile(){}};vm.runInNewContext(code+';globalThis.load=load',ctx);return {ctx,nodes,$};}
test('director search shows only verified directing credits and normalizes retained cards',async()=>{
 const {ctx}=discovery(async url=>({ok:true,json:async()=>url.includes('/api/people?')?{ids:[27205]}:{movies:[{id:27205,title:'Inception'},{id:141052,title:'Justice League'},{id:57729,title:'The Cobol Job'}],total_results:3}}));await ctx.load();assert.deepEqual(Array.from(ctx.items,x=>x.title),['Inception']);assert.equal(ctx.items[0].normalized,true);
});
test('failed director verification clears stale results instead of labeling other crew work as direction',async()=>{
 const {ctx,$}=discovery(async url=>url.includes('/api/people?')?{ok:false,status:503}:{ok:true,json:async()=>({movies:[{id:141052,title:'Justice League'}]})});await ctx.load();assert.equal(ctx.items.length,0);assert.doesNotMatch($('#grid').innerHTML,/old results/);assert.match($('#status').textContent,/取得できません/);
});
test('resetting filters requests page one even after browsing later pages',async()=>{
 let requested='';const {ctx}=discovery(async url=>{requested=String(url);return {ok:true,json:async()=>({movies:[]})}});ctx.directorId='';ctx.page=3;ctx.build=()=>'?page='+ctx.page;await ctx.load(true);assert.match(requested,/page=1$/);
});
test('a late response cannot replace results for newer filters',async()=>{
 let release,requests=0;const {ctx}=discovery(async()=>{const request=++requests;if(request===1)await new Promise(r=>release=r);return {ok:true,json:async()=>({movies:[{id:request===1?1:2,title:request===1?'Old':'New'}]})}});ctx.directorId='';const old=ctx.load();await Promise.resolve();await ctx.load();release();await old;assert.deepEqual(Array.from(ctx.items,x=>x.title),['New']);
});
test('composer and writer exploration keeps crew works without claiming direction',async()=>{
 const requested=[];const {ctx}=discovery(async url=>{requested.push(String(url));return {ok:true,json:async()=>url.includes('/api/people?')?{ids:[]}:{movies:[{id:27205,title:'Composer credit'}]}}});vm.runInContext("currentCrewRole='crew'",ctx);await ctx.load();assert.equal(requested.some(url=>url.includes('/api/people?')),false);assert.equal(ctx.items.length,1);
});
test('pending pagination cannot skip a page through concurrent More requests',async()=>{
 let release,calls=0;const {ctx,$}=discovery(async()=>{calls++;await new Promise(r=>release=r);return {ok:true,json:async()=>({movies:[{id:2,title:'Page two'}],total_pages:3})}});ctx.directorId='';ctx.items=[{id:1,title:'Page one'}];ctx.page=2;const first=ctx.load(false);assert.equal($('#more').disabled,true);const second=ctx.load(false);assert.equal(calls,1);release();await first;await second;assert.deepEqual(Array.from(ctx.items,x=>x.id),[1,2]);assert.equal($('#more').disabled,false);
});
test('an older deployed people API falls back to verified published directing credits',async()=>{
 const snapshot={generated_at:'2026-10-18T20:42:53Z',directors:{525:{id:525,source_url:'https://www.themoviedb.org/person/525',coverage:{source:'tmdb_director_movie_credits'},works:[{id:27205,director_id:525,job:'Director',source:'tmdb'},{id:141052,director_id:525,job:'Producer',source:'tmdb'},{id:57729,director_id:999,job:'Director',source:'tmdb'}]}}};
 const {ctx,$}=discovery(async url=>({ok:true,json:async()=>url.includes('/api/people?')?{people:[]}:url.includes('directors-mobile.json')?snapshot:{movies:[{id:27205,title:'Inception'},{id:141052,title:'Justice League'},{id:57729,title:'The Cobol Job'}],total_results:3}}));
 await ctx.load();assert.deepEqual(Array.from(ctx.items,x=>x.title),['Inception']);assert.match($('#status').textContent,/2026-10-18/);
});
test('unverified local catalogs do not authorize directing credits',async()=>{
 const {ctx,$}=discovery(async url=>({ok:true,json:async()=>url.includes('/api/people?')?{people:[]}:url.includes('directors-mobile.json')?{directors:{525:{id:525,works:[{id:141052,job:'Director',director_id:525}]}}}:{movies:[{id:141052,title:'Justice League'}]}}));
 await ctx.load();assert.equal(ctx.items.length,0);assert.match($('#status').textContent,/取得できません/);
});
test('failed snapshot fallback is evicted so a recovered live API can be retried',async()=>{
 let available=false;const {ctx}=discovery(async url=>url.includes('/api/people?')?{ok:available,json:async()=>({ids:[27205]})}:url.includes('directors-mobile.json')?{ok:false}:{ok:true,json:async()=>({movies:[{id:27205,title:'Inception'}]})});
 await ctx.load();assert.equal(ctx.items.length,0);available=true;await ctx.load();assert.deepEqual(Array.from(ctx.items,x=>x.title),['Inception']);
});
