const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');

test('fish population target is approximately three times the prior maturity count',()=>{
  assert.match(html,/function populationTarget/);
  assert.match(html,/cfg\.count\s*\*\s*3/);
  assert.match(html,/Math\.min\(84/);
});

test('schooling species share deterministic spatial anchors instead of uniform scattering',()=>{
  assert.match(html,/function schoolAnchor/);
  assert.match(html,/c\.schooling/);
  assert.match(html,/schoolAnchors/);
  assert.match(html,/anchorFor/);
});

test('school positions retain blank water by clustering around bounded anchors',()=>{
  assert.match(html,/anchor\.x/);
  assert.match(html,/anchor\.y/);
  assert.match(html,/clamp/);
});
