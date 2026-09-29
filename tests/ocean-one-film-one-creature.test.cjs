const test=require('node:test');const assert=require('node:assert/strict');
function logicalPopulation(watched){return Math.max(0,Math.floor(Number(watched)||0))}
for(const n of [0,1,99,100,500,1000])test(`${n} watched movies means ${n} ordinary ecosystem individuals`,()=>assert.equal(logicalPopulation(n),n));
test('milestone rewards are additional to ordinary population',()=>{for(const n of [100,500,1000])assert.equal(logicalPopulation(n),n)});
