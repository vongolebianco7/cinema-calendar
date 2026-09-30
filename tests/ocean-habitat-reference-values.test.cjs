const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('habitat lanes remain explicit and reviewable',()=>{
 assert.match(src,/HABITAT_Y=\{reef:-2\.1,benthic:-3\.8,drifter:-3\.2,pelagic:\.3\}/);
});
