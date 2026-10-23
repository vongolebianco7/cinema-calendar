const {test}=require('node:test');
const assert=require('node:assert/strict');
test('scorecard read API fixtures cover snapshots and CORS without reaching the serving database',async()=>{
 const {routeDeterministicMovieBackend}=await import('./product/helpers/metric-harness.mjs');
 let pattern,handler;await routeDeterministicMovieBackend({route:async(p,h)=>{pattern=p;handler=h;}});
 const base='https://backend-one-gray-94.vercel.app';
 const sample=require('../data/movies.json').movies.find(m=>m.title);assert.ok(sample);
 assert.ok(pattern.test(base+'/api/calendar'));
 assert.equal(pattern.test('https://unrelated.example/api/calendar'),false);
 for(const [path,key] of [['calendar','movies'],['tv','movies'],['movies?q='+encodeURIComponent(sample.title)+'&limit=3','movies'],['theater-directory?prefecture=東京都','theaters'],['releases?from=2026-10-01&to=2026-11-01&service=Lemino','releases']]){
  let response;await handler({request:()=>({url:()=>base+'/api/'+path}),fulfill:async r=>{response=r;}});
  assert.equal(response.status,200,path);assert.equal(response.headers['Access-Control-Allow-Origin'],'*');
  const body=JSON.parse(response.body);assert.ok(body[key].length,path);
  if(path==='calendar')assert.equal(body.generated_at,require('../data/movies.json').generated_at);
 }
 let unknown;await handler({request:()=>({url:()=>base+'/api/unconfigured'}),fulfill:async r=>{unknown=r;}});
 assert.equal(unknown.status,503,'unknown APIs must not leak to production or fabricate successful data');
});
