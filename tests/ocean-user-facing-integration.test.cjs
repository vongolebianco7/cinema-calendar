const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('preview/ocean/ocean-demo.html','utf8');
const demo=fs.readFileSync('preview/ocean/js/ocean-demo.js','utf8');
const primary=fs.readFileSync('preview/ocean/js/ocean-3d-primary.js','utf8');
const renderer=fs.readFileSync('preview/ocean/renderer/src/main.js','utf8');
const environment=fs.readFileSync('preview/ocean/renderer/src/environment.js','utf8');

test('actual Ocean page loads the record-driven ecosystem adapter',()=>{
  assert.match(html,/js\/ocean-ecosystem\.js/);
  assert.match(html,/js\/ocean-3d-primary\.js/);
  assert.doesNotMatch(html,/js\/ocean-immersive\.js/);
  assert.match(demo,/CinemapOcean3DPrimary\?\.mount\?\.\(\)/);
  assert.doesNotMatch(demo,/CinemapOceanImmersive/);
});

test('primary adapter passes the built ecosystem and approved backdrop mode into the real renderer',()=>{
  assert.match(primary,/CinemapOceanEcosystem\?\.build/);
  assert.match(primary,/mountOcean\(canvas,\{reducedMotion,ecosystem,backdrop:true\}\)/);
});

test('user-facing 3D stage uses the approved local background asset behind its canvas',()=>{
  assert.match(html,/ocean3dPrimary\{[^}]*ocean-background-approved\.webp/s);
  assert.match(html,/ocean3dCanvas\{[^}]*background:transparent/s);
});

test('renderer supports transparent backdrop mode without removing the normal standalone water dome',()=>{
  assert.match(renderer,/alpha:transparent/);
  assert.match(renderer,/options\.backdrop===true/);
  assert.match(environment,/quality\?\.backdrop===true/);
  assert.match(environment,/if\(!backdrop\)scene\.add\(waterDome\(\)\)/);
});
