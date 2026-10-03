const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const jsPath=path.join(root,'preview/ocean/real-fish/manta-rig-preview.js');
const htmlPath=path.join(root,'preview/ocean/real-fish/manta-rig-preview.html');

test('manta preview uses true 3D wing lift projection instead of in-plane rotation or y-only sliding',()=>{
  assert.equal(fs.existsSync(jsPath),true,'manta rig preview renderer must exist');
  const js=fs.readFileSync(jsPath,'utf8');
  assert.match(js,/projectedWingLift/,'expected projected wing lift');
  assert.match(js,/uCameraPitch/,'expected camera pitch for 3D projection');
  assert.match(js,/uDepthPerspective/,'expected depth perspective control');
  assert.match(js,/worldZ/,'expected explicit wing depth coordinate');
  assert.match(js,/cameraY/,'expected pitched-camera projection');
  assert.doesNotMatch(js,/rotateAround\(/,'in-plane rotateAround rig should be removed');
  assert.doesNotMatch(js,/p\.y\s*\+=\s*lift\s*\*\s*uPerspectiveY/,'old y-only projected lift should be removed');
});

test('manta torso stays anchored while wing tips receive strongest smooth lift',()=>{
  const js=fs.readFileSync(jsPath,'utf8');
  assert.match(js,/torsoMask/,'expected torso anchoring mask');
  assert.match(js,/tipGain/,'expected distal tip amplification');
  assert.match(js,/leftPhaseOffset/,'expected slight left/right phase asymmetry');
  assert.match(js,/powerStroke/);
  assert.match(js,/recoveryStroke/);
  assert.match(js,/amp=reduced\?\.08:\.24/,'expected visible full-motion wing amplitude');
});

test('manta normal cruise follows observed slow stroke and glide behavior',()=>{
  const js=fs.readFileSync(jsPath,'utf8');
  assert.match(js,/NORMAL_CYCLE_S\s*=\s*3\.15/,'expected roughly 3.1 second cruising cycle');
  assert.match(js,/GLIDE_START\s*=\s*\.82/,'expected short glide near end of recovery');
  assert.match(js,/milestone-manta-ray-hq\.svg/,'expected high-resolution vector manta asset');
  assert.doesNotMatch(js,/milestone-manta-ray-v2\.webp/,'old low-resolution manta asset should not drive rigged preview');
});

test('manta preview remains an isolated iPhone-first visual comparison',()=>{
  assert.equal(fs.existsSync(htmlPath),true,'manta rig preview page must exist');
  const html=fs.readFileSync(htmlPath,'utf8');
  assert.match(html,/width=device-width/);
  assert.match(html,/manta-rig-preview\.js/);
  assert.match(html,/Current/);
  assert.match(html,/Rigged/);
  assert.match(html,/390/);
});
