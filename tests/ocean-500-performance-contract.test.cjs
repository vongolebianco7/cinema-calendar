const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const perf=fs.readFileSync('preview/ocean/real-fish/performance-renderer.js','utf8');
const photo=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');

test('500 fish uses canvas-backed mid/background layers with a small DOM foreground cap',()=>{
  assert.match(perf,/canvas/);
  assert.match(perf,/MAX_DOM_FISH\s*=\s*40/);
  assert.match(perf,/midCanvas/);
  assert.match(perf,/farCanvas/);
});

test('animation is centralized in one RAF-driven tick and throttles the far layer',()=>{
  assert.match(perf,/const tick=t=>/);
  assert.match(perf,/state\.raf=requestAnimationFrame\(tick\)/);
  assert.doesNotMatch(perf,/setInterval\(/);
  assert.match(perf,/frame\s*%\s*3/);
});

test('photo population hands large populations to performance renderer',()=>{
  assert.match(photo,/CinemapOceanPerformanceRenderer/);
  assert.match(photo,/target>=300/);
});

test('milestone animals remain DOM foreground and are not hidden into canvas',()=>{
  assert.match(perf,/data-commemorative/);
  assert.match(perf,/keepDom/);
});
