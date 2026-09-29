const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const ecosystem=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');

test('photo ecosystem derives deterministic ecology energy from saved ratings',()=>{
  assert.match(ecosystem,/cinemap-ocean-demo-records-v1/);
  assert.match(ecosystem,/function\s+ratingEnergy\s*\(/);
  assert.match(ecosystem,/\.rating/);
  assert.match(ecosystem,/const\s+energy\s*=\s*ratingEnergy/);
});

test('rating energy visibly changes ecology, not only labels',()=>{
  assert.match(ecosystem,/cfg\.count\s*\+\s*energy/);
  assert.match(ecosystem,/--energy/);
  assert.match(ecosystem,/saturate\(/);
  assert.match(ecosystem,/var\(--energy\)/);
  assert.match(ecosystem,/--dur/);
});
