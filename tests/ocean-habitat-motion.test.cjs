const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('seabed life moves more quietly than pelagic schools',()=>{
 assert.match(src,/speed:\(hero\?\.026:deep\?\.035:\.058\)/);
 assert.match(src,/bob:deep\?\.18:hero\?\.42:/);
});
