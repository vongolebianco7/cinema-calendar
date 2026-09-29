const test=require('node:test');const assert=require('node:assert/strict');const eco=require('../preview/ocean/real-fish/ecology-state.js');
const records=n=>Object.fromEntries(Array.from({length:n},(_,i)=>[String(i),{watched:true,rating:i%5?4:5}]));
for(const n of [0,1,99,100,500,1000])test(`one film = one ordinary creature at ${n}`,()=>{const r=records(n);assert.equal(eco.validRecordCount(r),n);assert.equal(eco.ordinaryCreatureCount(r),n);assert.equal(eco.ecologySignalsForRecords(r).ordinaryCreatureCount,n);assert.equal(eco.ecologySignalsForRecords(r).effectiveCount,n)});
test('ratings do not inflate creature count',()=>{const r=records(100);assert.equal(eco.ecologySignalsForRecords(r).effectiveCount,100)});
test('future milestone identity is secret',()=>{for(const n of [0,1,99,100,499,500,999,1000]){const next=eco.nextSecretMilestone(records(n));assert.equal(next.label,'???');assert.equal(Object.hasOwn(next,'key'),false);assert.equal(Object.hasOwn(next,'species'),false)}});
test('next milestone stays every 100 after 1000',()=>{const next=eco.nextSecretMilestone(records(1042));assert.equal(next.at,1100);assert.equal(next.remaining,58);assert.equal(next.label,'???')});
