const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
for(const path of ['discover.html','cinelva/discover.html'])test(path+' does not turn an event date into a release year',()=>{
 const code=fs.readFileSync(path,'utf8').match(/^function normalizeLocalMovie\(m\).*$/m)[0];
 const context={window:{CinelvaMovieIdentity:{ingest:()=>({}),posterFor:()=>''}}};
 vm.runInNewContext(code+';globalThis.normalize=normalizeLocalMovie',context);
 const event=context.normalize({id:4960,title:'脳内ニューヨーク',event:'streaming',date:'2026-10-25',release_year:2008});
 assert.equal(Number(event.year),2008);assert.equal(event.date,'2026-10-25');assert.equal(event.release_date,undefined);
 assert.equal(context.normalize({event:'tv',date:'2026-10-25'}).year,'');
 assert.equal(context.normalize({release_date:'2008-10-24',date:'2026-10-25',event:'streaming'}).year,'2008');
});
test('detail, director works and related responses retain upstream full dates with no added requests',async()=>{
 let code=require('node:module').stripTypeScriptTypes(fs.readFileSync('backend/app/api/movie-detail/route.ts','utf8'),{mode:'transform'});
 code=code.replace(/^import .*?;\n/gm,'').replaceAll('export ','');
 const requests=[];
 const context={...require('../js/cinelva-film-medium.js'),featureIndex:require('../data/director-feature-index.json'),URL,console,process:{env:{TMDB_API_KEY:'fixture'}},json:b=>b,rateLimited:()=>null,options:()=>null,
 fetch:async url=>{const path=new URL(url).pathname;requests.push(path);const body=path.endsWith('/movie_credits')?{crew:[{id:2,title:'Director work',job:'Director',runtime:90,release_date:'2001-02-03'}]}:path.endsWith('/recommendations')?{results:[{id:3,title:'Related',release_date:'2004-05-06'},{id:4,title:'Unknown'}]}:{id:1,title:'Main',release_date:'2007-08-09',credits:{crew:[{id:9,name:'Director',job:'Director'}]}};return {ok:true,json:async()=>body};}};
 vm.runInNewContext(code+';globalThis.get=GET',context);
 const {movie}=await context.get({url:'https://local/api/movie-detail?id=1'});
 assert.equal(movie.release_date,'2007-08-09');assert.equal(movie.release_date_source,'tmdb_primary');
 assert.equal(movie.director_works[0].release_date,'2001-02-03');
 assert.equal(movie.related[0].release_date,'2004-05-06');assert.equal(movie.related[1].release_date,'');
 assert.equal(requests.length,3);
});
