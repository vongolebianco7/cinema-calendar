const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const src=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');

test('all counted creatures use natural-layout positions, not an equal grid',()=>{
  assert.match(src,/const records=readRecords\(\),target=effectivePopulationTarget\(records\),points=layout\(target\)/);
  assert.match(src,/nodes\.forEach\(\(node,index\)=>applyNaturalPosition\(node,points\[index\],index\)\)/);
  assert.doesNotMatch(src,/Math\.ceil\(Math\.sqrt\(total\)\)/);
});

test('visible layout preserves depth and readable size while keeping exact count',()=>{
  assert.match(src,/node\.style\.width=/);
  assert.match(src,/node\.style\.opacity=/);
  assert.match(src,/target=effectivePopulationTarget\(records\)/);
});
