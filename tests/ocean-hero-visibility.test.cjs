const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('milestone hero creatures stay individually visible rather than becoming schools',()=>{
  assert.match(src,/const school=hero\?1:/);
  assert.match(src,/hero\?2\.8:/);
});
