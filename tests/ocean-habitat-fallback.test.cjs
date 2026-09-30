const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('unknown niches retain depth variation instead of collapsing to one plane',()=>{
 assert.match(src,/HABITAT_Y\[o\.niche\]\?\?\(band===0\?2\.2:band===1\?\.3:-1\.5\)/);
});
