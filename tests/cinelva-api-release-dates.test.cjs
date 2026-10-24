const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function route(name,results,rows=[]){
 let code=require('node:module').stripTypeScriptTypes(fs.readFileSync(`backend/app/api/${name}/route.ts`,'utf8'),{mode:'transform'});
 code=code.replace(/^import .*?;\n/gm,'').replaceAll('export ','');
 const requested=[];
 const context={URL,process:{env:{TMDB_API_KEY:'fixture'}},console,
  fetch:async url=>{requested.push(String(url));return {ok:true,json:async()=>({results,page:1})}},
  json:body=>body,rateLimited:()=>null,options:()=>null,
  readWithSnapshot:read=>read(),movieSnapshot:()=>({movies:[]}),
  prisma:{movie:{findMany:async()=>rows},$queryRaw:async()=>[]}};
 vm.runInNewContext(code+';globalThis.get=GET',context);
 return {get:context.get,requested};
}
test('discover keeps day-level TMDB dates and their regional fallback provenance in one request',async()=>{
 const api=route('discover',[{id:1,title:'Fixture',release_date:'2007-11-10'},{id:2,title:'Unknown',release_date:''}]);
 const response=await api.get({url:'https://local/api/discover'});
 assert.equal(response.movies[0].release_date,'2007-11-10');
 assert.equal(response.movies[0].date,'2007-11-10');
 assert.equal(response.movies[0].release_date_source,'tmdb_region_with_primary_fallback');
 assert.equal(response.movies[0].release_date_region_requested,'JP');
 assert.equal(response.movies[1].release_date,'');
 assert.equal(api.requested.length,1);
 assert.equal(new URL(api.requested[0]).searchParams.get('region'),'JP');
});
test('search preserves upstream full dates without claiming a verified Japanese release',async()=>{
 const api=route('movies',[{id:1,title:'Fixture',release_date:'2007-11-10'}]);
 const response=await api.get({url:'https://local/api/movies?q=Fixture'});
 assert.equal(response.external[0].release_date,'2007-11-10');
 assert.equal(response.external[0].release_date_source,'tmdb_region_with_primary_fallback');
 assert.equal(response.external[0].release_date_region_requested,'JP');
 assert.equal(api.requested.length,1);
});
test('local catalog calendar dates retain event provenance instead of becoming original release dates',async()=>{
 const api=route('movies',[],[{id:'local',title:'Fixture',releases:[{date:new Date('2026-10-23T00:00:00Z'),event:'streaming',service:'Prime Video',source:'Official announcement',sourceUrl:'https://www.aboutamazon.jp/announcement'}]}]);
 const response=await api.get({url:'https://local/api/movies'});
 assert.equal(response.movies[0].date,'2026-10-23');
 assert.equal(response.movies[0].event,'streaming');
 assert.equal(response.movies[0].source_url,'https://www.aboutamazon.jp/announcement');
 assert.equal(response.movies[0].release_date,undefined);
 assert.equal(api.requested.length,0);
});
