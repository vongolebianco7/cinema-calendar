const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const src=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');

test('exact population is laid out across a deterministic grid instead of near-overlapping diagonal lanes',()=>{
  assert.match(src,/function positionExtra\(node,index,total\)/);
  assert.match(src,/const columns=Math\.ceil\(Math\.sqrt\(total\)\)/);
  assert.match(src,/const rows=Math\.ceil\(total\/columns\)/);
  assert.doesNotMatch(src,/i\*37\+lane\*11/);
  assert.doesNotMatch(src,/i\*23\+row\*9/);
});

test('all counted creatures are repositioned, not only newly added clones',()=>{
  assert.match(src,/nodes\.forEach\(\(node,index\)=>positionExtra\(node,index,target\)\)/);
});

test('100-creature layout uses compact readable sizes and preserves exact count',()=>{
  assert.match(src,/const depth=index%5===0\?'near':index%3===0\?'far':'mid'/);
  assert.match(src,/node\.classList\.remove\('near','mid','far'\)/);
  assert.match(src,/node\.classList\.add\(depth\)/);
  assert.match(src,/3\.2\+\(index%4\)\*\.38/);
  assert.match(src,/target=populationTarget\(records\)/);
});
