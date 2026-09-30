const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const index=fs.readFileSync('preview/ocean/index.html','utf8');
const demo=fs.readFileSync('preview/ocean/ocean-demo.html','utf8');

test('production Ocean index delegates to the canonical dashboard',()=>{
  assert.match(index,/ocean-demo\.html/);
  assert.match(index,/location\.replace/);
  assert.doesNotMatch(index,/photo-ocean-production-v1/);
  assert.doesNotMatch(index,/real-fish\/ecosystem\.html\?state=/);
});

test('canonical dashboard owns the universe host and current immersive renderer',()=>{
  assert.match(demo,/id="universe"/);
  assert.match(demo,/js\/ocean-immersive\.js\?v=2/);
  assert.match(demo,/js\/ocean-demo\.js\?v=6/);
  assert.doesNotMatch(demo,/photo-ocean-production-script/);
});
