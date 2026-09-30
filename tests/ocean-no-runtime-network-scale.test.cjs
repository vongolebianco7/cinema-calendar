const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('relative scale and habitat logic stays local and deterministic',()=>{
 assert.doesNotMatch(src,/fetch\s*\(/);assert.doesNotMatch(src,/https?:\/\//);assert.match(src,/REAL_LENGTH_M/);assert.match(src,/HABITAT_Y/);
});
