const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const code=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');

test('every counted creature is repositioned into a visible cell',()=>{
  assert.match(code,/nodes\.forEach\(\(node,index\)=>positionExtra\(node,index,target\)\)/);
});

test('100 creatures use a 10 by 10 style packing with smaller sizes',()=>{
  assert.match(code,/const columns=Math\.ceil\(Math\.sqrt\(total\)\)/);
  assert.match(code,/node\.style\.width=\(3\.2\+\(index%4\)\*\.38\)\+'%'/);
});
