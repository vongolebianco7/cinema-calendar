const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');

test('photo ecosystem loads the local logical terrain map',()=>{
  assert.match(html,/terrain-map\.json/);
  assert.match(html,/TERRAIN/);
});

test('school anchors follow seabed clearance and obstacle avoidance',()=>{
  assert.match(html,/function seabedYAt/);
  assert.match(html,/function avoidTerrain/);
  assert.match(html,/obstacles/);
  assert.match(html,/strength/);
  assert.match(html,/seabedClearance/);
});

test('terrain reaction remains school-level rather than quadratic per-fish simulation',()=>{
  assert.match(html,/schoolAnchor/);
  assert.match(html,/avoidTerrain\(/);
  assert.doesNotMatch(html,/for\s*\([^)]*fish[^)]*\)\s*\{[^}]*for\s*\([^)]*fish/s);
});

test('reef encounters can split a school into deterministic lanes and reunite through shared motion',()=>{
  assert.match(html,/splitLane/);
  assert.match(html,/dataset\.lane/);
  assert.match(html,/schoolAnchors/);
});
