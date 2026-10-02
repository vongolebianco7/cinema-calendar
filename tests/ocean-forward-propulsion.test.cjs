const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const swim=fs.readFileSync('preview/ocean/real-fish/milestone-swim.js','utf8');
const atlas=fs.readFileSync('preview/ocean/real-fish/milestone-atlas.js','utf8');
const manifest=JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json','utf8'));

test('active milestone swimmers travel forward instead of oscillating in place',()=>{
  assert.match(swim,/@keyframes milestoneForwardPass/);
  assert.match(swim,/0%\{transform:translate3d\(-35vw/);
  assert.match(swim,/100%\{transform:translate3d\(85vw/);
  assert.match(swim,/animation-name:milestoneForwardPass!important/);
  assert.match(swim,/dolphin:\{family:'rigid-cruise',duration:18/,'dolphin needs readable forward travel on iPhone');
  assert.doesNotMatch(swim,/@keyframes articulatedPassRoute\{0%\{transform:translate3d\(-\.6vw/);
});

test('dolphin deformation is confined to the tail zone so head and upper torso stay rigid',()=>{
  const dolphin=manifest.species.dolphin;
  assert.ok(Number(dolphin.deformation?.flexSpan)>0);
  assert.ok(Number(dolphin.deformation.flexSpan)<=0.3,'dolphin flex span must stay within the tail-most 30%');
  assert.match(atlas,/function tailRamp\(profile,u,flexSpan/);
  assert.match(atlas,/tailRamp\(profile,u,Number\(cfg\.flexSpan\)/);
});

test('forward propulsion remains independent from fin or tail deformation',()=>{
  assert.match(swim,/data-swim-active="1"/);
  assert.match(atlas,/requestAnimationFrame\(draw\)/);
  assert.match(atlas,/milestoneDeformedCanvas/);
});
