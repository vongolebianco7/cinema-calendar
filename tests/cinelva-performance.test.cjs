const test=require('node:test'),assert=require('node:assert/strict');
const helper=import('./product/helpers/performance-budget.mjs');
test('rAF cadence diagnostic cannot populate the requested rendered scroll FPS',()=>{
 const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'cinelva-requested-performance-browser.cjs'),'utf8');
 assert.doesNotMatch(source,/row\.values\.scroll_fps\s*=/,'rAF callbacks alone do not prove rendered scroll FPS');
});
test('requested targets assess each operation at its exact boundary',async()=>{
 const {assessRequestedPerformance}=await helper;
 const values={initial_ms:2000,tab_ms:300,cached_ms:200,review_ms:200,search_ms:1000,scroll_fps:60};
 assert.equal(typeof assessRequestedPerformance,'function');
 const result=assessRequestedPerformance(values);
 assert.ok(Object.values(result).every(row=>row.status==='pass'));
 for(const key of Object.keys(values)){
  const slow={...values,[key]:values[key]+(key==='scroll_fps'?-0.01:0.01)};
  assert.equal(assessRequestedPerformance(slow)[key].status,'fail',key);
 }
});
test('requested targets never pass absent or invalid measurements',async()=>{
 const {assessRequestedPerformance}=await helper;
 assert.equal(typeof assessRequestedPerformance,'function');
 for(const key of ['initial_ms','tab_ms','cached_ms','review_ms','search_ms','scroll_fps']){
  assert.equal(assessRequestedPerformance({})[key].status,'unmeasured');
  for(const value of [null,undefined,NaN,Infinity,-1,'0']){
   assert.notEqual(assessRequestedPerformance({[key]:value})[key].status,'pass',key+' '+value);
  }
 }
});
test('CLS measures the largest session rather than summing separate bursts',async()=>{
 const {layoutShiftScore}=await helper;
 assert.equal(layoutShiftScore([{startTime:0,value:.06},{startTime:500,value:.07},{startTime:2000,value:.1}]),.13);
});
test('CLS ignores recent input and resets a continuous session at five seconds',async()=>{
 const {layoutShiftScore}=await helper;
 const rows=Array.from({length:7},(_,i)=>({startTime:i*900,value:.01}));rows.push({startTime:6000,value:1,hadRecentInput:true});
 assert.ok(Math.abs(layoutShiftScore(rows)-.06)<1e-9);
});
test('unavailable measurements and slow active interactions cannot pass the performance gate',async()=>{
 const {performanceBudgetPass}=await helper;
 const good={supported:true,cls:.1,ready_ms:4999,interaction_ms:999};
 assert.equal(performanceBudgetPass(good),true);
 for(const change of [{supported:false},{cls:.1001},{ready_ms:5001},{interaction_ms:1001}])assert.equal(performanceBudgetPass({...good,...change}),false);
});
