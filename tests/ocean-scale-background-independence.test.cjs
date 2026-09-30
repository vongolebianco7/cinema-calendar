const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('creature scale is independent from the photographic background asset',()=>{
 assert.doesNotMatch(src,/background-approved|background-image|object-fit/);
 assert.match(src,/REAL_LENGTH_M/);
});
