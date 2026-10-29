const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const {searchMovies} = require('../backend/lib/movie-search.cjs');
const {movieSnapshot} = require('../backend/lib/catalog-snapshot.cjs');
function endpoint(fetch) {
 const source = fs.readFileSync(require.resolve('../backend/app/api/movies/route.ts'),'utf8')
  .replace(/^import .*;\n/gm,'').replace(/export /g,'');
 const context = {URL,AbortSignal,console,process:{env:{TMDB_API_KEY:'test-key'}},fetch,
  searchMovies,movieSnapshot,readWithSnapshot:async(read)=>read(),
  prisma:{movie:{findMany:async()=>[]},$queryRaw:async()=>[]},
  json:body=>body,rateLimited:()=>null,options:()=>null};
 vm.createContext(context);
 vm.runInContext(stripTypeScriptTypes(source)+'\nthis.GET = GET;',context);
 return context.GET;
}
test('movie API uses observed catalog spelling, paginates past 20 and preserves result metadata',async()=>{
 const calls=[];
 const GET=endpoint(async url=>{
  const query=url.searchParams.get('query'), page=Number(url.searchParams.get('page'));
  calls.push([query,page]);
  return {ok:true,json:async()=>({total_pages:query==='スター・ウォーズ'?2:1,results:query==='スター・ウォーズ'?Array.from({length:page===1?20:3},(_,i)=>({id:(page-1)*20+i+1,title:'スター・ウォーズ '+i,original_title:'Star Wars '+i,release_date:'1980-05-21'})):[]})};
 });
 const body=await GET({url:'https://example.test/api/movies?q=スターウォーズ'});
 assert.equal(body.external.length,23);
 assert.equal(body.count,23);
 assert.equal(body.external_search.truncated,false);
 assert.equal(body.external_search.incomplete,false);
 assert.equal(body.external[0].source,'tmdb');
 assert.equal(body.external[0].release_date_region_requested,'JP');
 assert.ok(calls.some(([q,p])=>q==='スター・ウォーズ'&&p===2));
});
test('movie API keeps database response usable when upstream is unavailable',async()=>{
 const GET=endpoint(async()=>({ok:false,status:503}));
 const body=await GET({url:'https://example.test/api/movies?q=example'});
 assert.equal(body.count,0);
 assert.equal(body.external_search.incomplete,true);
 assert.deepEqual(Array.from(body.external),[]);
});
