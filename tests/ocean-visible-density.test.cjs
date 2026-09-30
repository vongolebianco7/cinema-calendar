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

test('added fish use visible depth classes and larger readable sizes while preserving the exact count',()=>{
  assert.match(src,/const depth=index%5===0\?'near':index%3===0\?'far':'mid'/);
  assert.match(src,/node\.classList\.remove\('near','mid','far'\)/);
  assert.match(src,/node\.classList\.add\(depth\)/);
  assert.match(src,/5\.4\+\(index%5\)\*\.72/);
  assert.match(src,/target=populationTarget\(records\)/);
});
