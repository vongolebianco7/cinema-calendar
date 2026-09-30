const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('placement variation remains seeded and deterministic',()=>{
 assert.match(src,/function seeded\(i\)\{const x=Math\.sin\(i\*9283\.17\)\*43758\.5453/);
 assert.doesNotMatch(src,/Math\.random/);
});
