const test=require('node:test');
const assert=require('node:assert/strict');
const {ecologySignalsForRecords}=require('../preview/ocean/real-fish/ecology-state.js');
const records=ratings=>Object.fromEntries(ratings.map((rating,i)=>['m'+i,{rating}]));

test('4.5 and 5.0 ratings enrich ecology beyond ordinary 4.0 ratings without mapping films to creatures',()=>{
  const liked=ecologySignalsForRecords(records(Array(12).fill(4)));
  const loved=ecologySignalsForRecords(records(Array(12).fill(4.5)));
  const best=ecologySignalsForRecords(records(Array(12).fill(5)));
  assert.equal(liked.count,loved.count);assert.equal(loved.count,best.count);
  assert.equal(liked.ratingBonus,loved.ratingBonus);assert.equal(loved.ratingBonus,best.ratingBonus);
  assert.ok(loved.ratingEnergy>liked.ratingEnergy);
  assert.ok(best.lifeBestRatings>0);
  assert.ok(best.ratingEnergy>=loved.ratingEnergy);
  assert.equal('fish' in best,false);assert.equal('creature' in best,false);
});

test('rating energy is bounded so watch history remains the primary growth driver',()=>{
  const signals=ecologySignalsForRecords(records(Array(200).fill(5)));
  assert.equal(signals.ratingBonus,5);
  assert.equal(signals.ratingEnergy,5);
  assert.equal(signals.effectiveCount,205);
});
