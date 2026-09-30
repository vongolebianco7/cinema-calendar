const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('ecosystem density still grows from watched films and school richness',()=>{
 assert.match(src,/Math\.round\(8\+state\.watched\*\.55\+state\.schools\*2\)/);
});
