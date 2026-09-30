const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('reef animals stay in a tighter orbit around habitat than pelagic animals',()=>{
 assert.match(src,/radius:hero\?7\.5:reef\?3\.4:4\.8/);
});
