const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('individual movie variation cannot erase the species scale hierarchy',()=>{
 assert.match(src,/Math\.max\(\.65,Math\.min\(1\.9,\(Number\(o\.scale\)\|\|1\)\*p\.scale\)\)/);
});
