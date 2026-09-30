const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const index=fs.readFileSync('preview/ocean/index.html','utf8');const ecology=fs.readFileSync('preview/ocean/real-fish/ecology-state.js','utf8');
test('user-facing restored Ocean mounts the local Photo Ocean without paid runtime services',()=>{assert.match(index,/real-fish\/ecosystem\.html\?state=/);assert.match(index,/photoOceanFrame/);});
test('Photo Ocean loads the four-point correction module locally',()=>{assert.match(ecology,/photo-four-points\.js\?v=1/);assert.doesNotMatch(ecology,/https?:\/\//);});
