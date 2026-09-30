const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('same habitat retains foreground/mid/background depth spread',()=>{
 assert.match(src,/z=-25-\(i%8\)\*3\.5-Math\.floor\(i\/24\)\*5/);
 assert.match(src,/z:z\+\(seeded\(index\+4\)-\.5\)\*3\.5\*spread/);
});
