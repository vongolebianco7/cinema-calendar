const test=require('node:test');
const assert=require('node:assert/strict');
const {ecologySignalsForRecords,maturityStateForRecords}=require('../preview/ocean/real-fish/ecology-state.js');

const STATES={0:{},10:{},20:{},30:{},40:{},50:{},60:{},70:{},80:{},90:{},100:{},300:{},500:{}};
function records(n,rating){return Object.fromEntries(Array.from({length:n},(_,i)=>['m'+i,{rating}]));}

test('ratings enrich ecology without inflating watched maturity or creature count',()=>{
  const plain=ecologySignalsForRecords(records(9,3));
  const loved=ecologySignalsForRecords(records(9,5));
  assert.equal(plain.count,9);
  assert.equal(plain.effectiveCount,9);
  assert.equal(loved.count,9);
  assert.equal(loved.ordinaryCreatureCount,9);
  assert.equal(loved.highRatings,9);
  assert.equal(loved.effectiveCount,9);
  assert.ok(loved.ratingEnergy>plain.ratingEnergy);
  assert.equal(maturityStateForRecords(records(9,3),STATES,0),0);
  assert.equal(maturityStateForRecords(records(9,5),STATES,0),0);
});

test('watch count alone drives maturity while ratings remain bounded ecology energy',()=>{
  const signals=ecologySignalsForRecords(records(100,5));
  assert.equal(signals.count,100);
  assert.equal(signals.ordinaryCreatureCount,100);
  assert.equal(signals.effectiveCount,100);
  assert.equal(signals.ratingEnergy,5);
  assert.equal(maturityStateForRecords(records(100,5),STATES,0),100);
});
