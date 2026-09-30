const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const immersive=fs.readFileSync('preview/ocean/js/ocean-immersive.js','utf8');

test('production Ocean blocks the legacy Photo Ocean overwrite without repair-loop remounts',()=>{
  assert.match(immersive,/photoOceanShell/);
  assert.match(immersive,/Object\.defineProperty\(host,'innerHTML'/);
  assert.doesNotMatch(immersive,/MutationObserver/);
  assert.doesNotMatch(immersive,/repairTimer/);
  assert.doesNotMatch(immersive,/setTimeout\(\(\)=>mount/);
});
