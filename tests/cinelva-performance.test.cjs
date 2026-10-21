const test=require('node:test'),assert=require('node:assert/strict');
const helper=import('./product/helpers/performance-budget.mjs');
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
