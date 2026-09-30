const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('empty Ocean still avoids spawning creatures before the first film',()=>{
 assert.match(src,/if\(state\.watched===0\)return\{root,update\(\)\{\},dispose\(\)/);
});
