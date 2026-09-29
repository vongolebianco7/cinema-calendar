const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');

test('renderer consumes real-scale catalog metadata instead of legacy size buckets',()=>{
  assert.match(html,/displayScale/);
  assert.match(html,/globalPresentationScale/);
  assert.doesNotMatch(html,/SIZE\[c\.size\]/);
});

test('foreground midground and background biases deterministically affect fish depth styling',()=>{
  assert.match(html,/depthBias/);
  assert.match(html,/foreground/);
  assert.match(html,/midground/);
  assert.match(html,/background/);
  assert.match(html,/depthClass/);
});

test('habitat zones map seabed reef midwater and upper-water animals to different vertical bands',()=>{
  assert.match(html,/zoneTopRange/);
  assert.match(html,/seabed/);
  assert.match(html,/reef/);
  assert.match(html,/midwater/);
  assert.match(html,/upper/);
});

test('seabed creatures also honor biological display scale and per-creature presentation scale',()=>{
  assert.match(html,/presentationScale/);
  assert.match(html,/renderSeabed/);
});
