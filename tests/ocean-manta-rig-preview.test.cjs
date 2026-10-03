const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const test=require('node:test');

const root=path.resolve(__dirname,'..');
const jsPath=path.join(root,'preview/ocean/real-fish/manta-rig-preview.js');
const htmlPath=path.join(root,'preview/ocean/real-fish/manta-rig-preview.html');

test('manta preview uses seven-bone weighted skinning and asymmetric stroke timing',()=>{
  assert.equal(fs.existsSync(jsPath),true,'manta rig preview renderer must exist');
  const src=fs.readFileSync(jsPath,'utf8');
  assert.match(src,/BONE_COUNT\s*=\s*7/);
  assert.match(src,/leftRoot/);
  assert.match(src,/leftMid/);
  assert.match(src,/leftTip/);
  assert.match(src,/rightRoot/);
  assert.match(src,/rightMid/);
  assert.match(src,/rightTip/);
  assert.match(src,/aBoneWeights/);
  assert.match(src,/powerStroke/);
  assert.match(src,/recoveryStroke/);
  assert.doesNotMatch(src,/Math\.sin\([^\n]*\)\s*\*\s*amplitude[^\n]*\/\/\s*global-wave/i);
});

test('manta preview is an isolated iPhone-first visual review page',()=>{
  assert.equal(fs.existsSync(htmlPath),true,'manta rig preview page must exist');
  const html=fs.readFileSync(htmlPath,'utf8');
  assert.match(html,/width=device-width/);
  assert.match(html,/manta-rig-preview\.js/);
  assert.match(html,/Current/);
  assert.match(html,/Rigged/);
  assert.match(html,/390/);
});
