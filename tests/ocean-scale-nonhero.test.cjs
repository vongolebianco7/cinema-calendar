const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('hero emphasis is modest so real-world relative size remains dominant',()=>{
 assert.match(src,/o\.scale\*\(o\.hero\?1\.18:1\)/);
});
