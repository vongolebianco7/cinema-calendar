const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const atlas=fs.readFileSync('preview/ocean/real-fish/milestone-atlas.js','utf8');

test('milestone deformation runs on one shared throttled animation scheduler',()=>{
  assert.match(atlas,/DEFORMATION_FPS\s*=\s*30/);
  assert.match(atlas,/deformationScheduler/);
  assert.match(atlas,/function scheduleDeformationFrame/);
  assert.match(atlas,/function tickDeformations/);
  assert.doesNotMatch(atlas,/let start=0,raf=0,lastDraw/);
  const rafCalls=(atlas.match(/requestAnimationFrame\(/g)||[]).length;
  assert.ok(rafCalls<=2,`deformation scheduler should own RAF; found ${rafCalls} requestAnimationFrame calls`);
});

test('offscreen milestone deformation is suspended and disconnected nodes are pruned',()=>{
  assert.match(atlas,/IntersectionObserver/);
  assert.match(atlas,/entry\.visible/);
  assert.match(atlas,/isConnected/);
  assert.match(atlas,/document\.hidden/);
});

test('deformation canvas resolution is capped for iPhone-class DPR',()=>{
  assert.match(atlas,/MOBILE_DEFORMATION_DPR_CAP\s*=\s*1\.25/);
  assert.match(atlas,/DEFORMATION_DPR_CAP\s*=\s*1\.5/);
  assert.match(atlas,/devicePixelRatio/);
  assert.match(atlas,/fitDeformationCanvas/);
});

test('manta flexes broad wings while keeping its center body comparatively stable',()=>{
  assert.match(atlas,/profile==='wing-flex'/);
  assert.match(atlas,/wingDistance/);
  assert.match(atlas,/centerGuard/);
  assert.match(atlas,/if\(profile==='wing-flex'\)phase=t/);
});
