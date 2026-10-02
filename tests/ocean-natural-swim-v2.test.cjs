const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const swim=fs.readFileSync('preview/ocean/real-fish/milestone-swim.js','utf8');
const photo=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');
const manifest=JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));

test('dolphin tail deformation targets the right-side tail, not the head',()=>{
  assert.equal(manifest.species.dolphin.deformation.profile,'tail-flex-right');
  assert.ok(Number(manifest.species.dolphin.deformation.flexSpan)<=0.3);
});

test('pass-through creatures use natural eased routes with vertical variation',()=>{
  assert.match(swim,/@keyframes milestoneForwardNatural/);
  assert.match(swim,/@keyframes milestoneReverseNatural/);
  assert.doesNotMatch(swim,/animation-timing-function:linear!important/);
  assert.match(swim,/var\(--swim-lane-y\)/);
  assert.match(swim,/var\(--swim-wave\)/);
});

test('manta swims in the direction its body faces',()=>{
  assert.match(swim,/manta-ray:\{[^}]*direction:'reverse'/);
});

test('all pass-through milestone creatures are activated and staggered instead of stacked static',()=>{
  assert.doesNotMatch(swim,/cap=list\.length>=8\?1:requested/);
  assert.match(swim,/node\.dataset\.swimActive='1'/);
  assert.match(swim,/--swim-delay/);
  assert.match(swim,/--swim-lane-y/);
  assert.match(photo,/activatePassThrough\?\.\(passThroughNodes,passThroughNodes\.length\)/);
});
