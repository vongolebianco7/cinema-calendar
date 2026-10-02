const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const swim=fs.readFileSync('preview/ocean/real-fish/milestone-swim.js','utf8');
const atlas=fs.readFileSync('preview/ocean/real-fish/milestone-atlas.js','utf8');
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

test('special swimmers use pulse-glide-pause travel instead of continuous conveyor motion',()=>{
  assert.match(swim,/data-swim-cadence="pulse-glide"/);
  assert.match(swim,/18%\{transform:translate3d\(-50vw/);
  assert.match(swim,/25%\{transform:translate3d\(-50vw/);
  assert.match(swim,/46%\{transform:translate3d\(-8vw/);
  assert.match(swim,/55%\{transform:translate3d\(-8vw/);
  assert.match(swim,/78%\{transform:translate3d\(52vw/);
  assert.match(swim,/86%\{transform:translate3d\(52vw/);
  assert.match(swim,/node\.dataset\.swimCadence='pulse-glide'/);
});

test('deformed fins and tails strengthen during thrust and calm during glide/pause',()=>{
  assert.match(atlas,/function thrustEnvelope\(/);
  assert.match(atlas,/const thrust=thrustEnvelope\(/);
  assert.match(atlas,/amplitude\*motionScale\*thrust\*ramp/);
  assert.match(atlas,/Math\.max\(\.18/);
});

test('manta swims in the direction its body faces',()=>{
  assert.match(swim,/manta-ray:\{[^}]*direction:'reverse'/);
});

test('all pass-through milestone creatures are activated and staggered instead of stacked static',()=>{
  assert.doesNotMatch(swim,/cap=list\.length>=8\?1:requested/);
  assert.match(swim,/const count=list\.length/);
  assert.match(swim,/node\.dataset\.swimActive='1'/);
  assert.match(swim,/--swim-delay/);
  assert.match(swim,/--swim-lane-y/);
});

test('pass-through creatures share a neutral base cell while visual lanes keep them separated',()=>{
  assert.match(swim,/node\.style\.left='0%'/);
  assert.match(swim,/node\.style\.top='40%'/);
  assert.match(swim,/lanes=\[-13,-7,-2,4,10,15,-10,8,-15,1,13\]/);
});
