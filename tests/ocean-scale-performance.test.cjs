const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('relative scaling does not increase the mobile life cap',()=>{
 assert.match(src,/caps=renderState\.caps\|\|\{life:32,habitat:72\}/);
 assert.match(src,/state\.organisms\.slice\(0,28\)/);
});
