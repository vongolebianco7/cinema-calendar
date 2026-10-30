const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');

function detailRoute(fetch){
  const source=stripTypeScriptTypes(fs.readFileSync('backend/app/api/movie-detail/route.ts','utf8'),{mode:'transform'})
    .replace(/^import .*?;\n/gm,'').replaceAll('export ','');
  const context={
    URL, console, process:{env:{TMDB_API_KEY:'fixture'}},
    featureIndex:require('../data/director-feature-index.json'),
    rateLimited:()=>null, options:()=>null,
    json:(body,init={})=>({body,status:init.status||200}), fetch,
  };
  vm.runInNewContext(source+';globalThis.get=GET',context);
  return context.get;
}

test('movie detail rejects unsafe integer IDs before calling TMDB',async()=>{
  let calls=0;
  const get=detailRoute(async()=>{calls++;throw new Error('unexpected upstream request')});
  const response=await get({url:'https://fixture/api/movie-detail?id=9007199254740992'});
  assert.equal(response.status,400);
  assert.equal(response.body.error,'invalid id');
  assert.equal(calls,0);
});
