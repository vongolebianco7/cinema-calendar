const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{stripTypeScriptTypes}=require('node:module');
async function details(person,credits){
 const code=stripTypeScriptTypes(fs.readFileSync('backend/app/api/movie-detail/route.ts','utf8'),{mode:'transform'}).replace(/^import .*?;\n/gm,'').replaceAll('export ','');
 const ctx={URL,AbortSignal,console,process:{env:{TMDB_API_KEY:'fixture'}},featureIndex:require('../data/director-feature-index.json'),rateLimited:()=>null,options:()=>null,json:x=>x,
 fetch:async url=>({ok:true,json:async()=>String(url).includes('movie_credits')?{crew:credits}:String(url).includes('recommendations')?{results:[]}:{id:157336,title:'Fixture',credits:{crew:[{id:person,name:'Director',job:'Director'}]}}})};
 vm.runInNewContext(code+';globalThis.get=GET',ctx);return (await ctx.get({url:'https://fixture/api/movie-detail?id=157336'})).movie;
}
test('detail director rail excludes Nolan shorts and compilation credits using reviewed feature identity',async()=>{
 const m=await details(525,[{id:77,title:'Memento',job:'Director'},{id:43629,title:'Doodlebug',job:'Director'},{id:999999,title:'Short compilation',job:'Director'},{id:157336,title:'Current',job:'Director'},{id:77,title:'Duplicate',job:'Director'}]);
 assert.deepEqual(Array.from(m.director_works,x=>x.id),[77]);assert.equal(m.director_works_scope,'verified_feature_subset');
});
test('unknown director does not promote duration-unknown or short credits as features',async()=>{
 const m=await details(999999999,[{id:1,title:'Unknown',job:'Director'},{id:2,title:'Short',job:'Director',runtime:10},{id:3,title:'Feature',job:'Director',runtime:90},{id:4,title:'Producer only',job:'Producer',runtime:100}]);
 assert.deepEqual(Array.from(m.director_works,x=>x.id),[3]);
});
