const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const perf=fs.readFileSync('preview/ocean/real-fish/performance-renderer.js','utf8');

test('dense canvas fish preserve their source fish image instead of switching to polygon silhouettes',()=>{
  assert.match(perf,/function drawImageFish\(/);
  assert.match(perf,/ctx\.drawImage\(/);
  assert.match(perf,/item\.src/);
  assert.doesNotMatch(perf,/ctx\.ellipse\(/);
  assert.doesNotMatch(perf,/lineTo\(tailX/);
});

test('canvas renderer caches source images for dense populations',()=>{
  assert.match(perf,/images:new Map\(\)/);
  assert.match(perf,/function imageFor\(/);
});
