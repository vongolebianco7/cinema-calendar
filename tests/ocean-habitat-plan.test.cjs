const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('seabed habitat remains distributed across multiple depth rows',()=>{
 assert.match(src,/z=-27-Math\.floor\(i\/columns\.length\)\*8-\(i%2\)\*2/);
});
