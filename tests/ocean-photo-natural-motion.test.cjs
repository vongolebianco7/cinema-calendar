const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const h=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');

test('photo fish motion separates travel from body/tail movement',()=>{
  assert.match(h,/fishWrap/);
  assert.match(h,/fishBody/);
  assert.match(h,/fishTail/);
  assert.match(h,/@keyframes\s+tailBeat/);
  assert.match(h,/@keyframes\s+bodyPulse/);
});

test('natural motion keeps compositor-friendly transforms',()=>{
  assert.match(h,/translate3d/);
  assert.match(h,/transform-origin/);
  assert.match(h,/will-change:\s*transform/);
  assert.doesNotMatch(h,/<canvas/);
});
