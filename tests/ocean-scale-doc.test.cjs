const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('Ocean scale decisions remain documented for future renderer changes',()=>{
 const d=fs.readFileSync('docs/ocean-relative-scale.md','utf8');
 assert.match(d,/real-world body lengths/i);assert.match(d,/DISPLAY_SCALE.*1\.2/);assert.match(d,/not biological claims/i);assert.match(d,/not substituted/i);
});
