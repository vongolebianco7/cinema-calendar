const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const h=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');

test('record diversity affects available biodiversity deterministically',()=>{
  assert.match(h,/function\s+recordDiversity\s*\(/);
  assert.match(h,/genres/);
  assert.match(h,/region/);
  assert.match(h,/director/);
  assert.match(h,/effectiveSpecies/);
});

test('habitat matures visibly with history instead of only changing counters',()=>{
  assert.match(h,/--habitat/);
  assert.match(h,/habitatLayer/);
  assert.match(h,/scene-seabed\.webp/);
  assert.match(h,/background-position/);
  assert.match(h,/opacity:\s*calc\(/);
});

test('sparse and mature states are compositionally distinct',()=>{
  assert.match(h,/habitatTier/);
  assert.match(h,/cfg\.species/);
  assert.match(h,/Math\.min\(ASSETS\.length/);
});
