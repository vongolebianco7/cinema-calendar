const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const dashboard=fs.readFileSync('preview/ocean/index.html','utf8');
const ecosystem=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');

test('production Ocean derives deterministic ecology energy from user ratings',()=>{
  assert.match(dashboard,/function\s+ratingEnergy\s*\(/);
  assert.match(dashboard,/\.rating/);
  assert.match(dashboard,/energy='\+energy/);
});

test('photo ecosystem makes rating energy visibly affect ecology, not only labels',()=>{
  assert.match(ecosystem,/const\s+energy\s*=/);
  assert.match(ecosystem,/cfg\.count\s*\+\s*energy/);
  assert.match(ecosystem,/--energy/);
  assert.match(ecosystem,/saturate\(/);
  assert.match(ecosystem,/var\(--energy\)/);
});
