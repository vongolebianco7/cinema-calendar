const test=require('node:test');
const assert=require('node:assert/strict');
const {ecologySignalsForRecords,maturityStateForRecords}=require('../preview/ocean/real-fish/ecology-state.js');

const STATES={0:{},10:{},20:{},30:{},40:{},50:{},60:{},70:{},80:{},90:{},100:{},300:{},500:{}};
function records(n,rating){return Object.fromEntries(Array.from({length:n},(_,i)=>['m'+i,{rating}]));}

test('ratings enrich the same watched-history maturity signal without replacing watch count',()=>{
  const plain=ecologySignalsForRecords(records(9,3));
  const loved=ecologySignalsForRecords(records(9,5));
  assert.equal(plain.count,9);
  assert.equal(plain.effectiveCount,9);
  assert.equal(loved.count,9);
  assert.equal(loved.highRatings,9);
  assert.equal(loved.effectiveCount,10);
  assert.equal(maturityStateForRecords(records(9,3),STATES,0),0);
  assert.equal(maturityStateForRecords(records(9,5),STATES,0),10);
});

test('rating bonus is bounded so watching films remains the primary growth driver',()=>{
  const signals=ecologySignalsForRecords(records(100,5));
  assert.equal(signals.ratingBonus,5);
  assert.equal(signals.effectiveCount,105);
  assert.equal(maturityStateForRecords(records(100,5),STATES,0),100);
});
