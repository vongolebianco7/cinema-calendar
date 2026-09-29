const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const h=fs.readFileSync('preview/ocean/real-fish/ecosystem.html','utf8');

test('Ocean keeps essential content when renderer or assets fail',()=>{
  assert.match(h,/id="oceanFallback"/);
  assert.match(h,/activateFallback/);
  assert.match(h,/window\.addEventListener\('error'/);
  assert.match(h,/画像なしでも/);
});

test('fish image failures trigger fallback instead of silent blank state',()=>{
  assert.match(h,/addEventListener\('error',activateFallback/);
  assert.match(h,/fallbackStats/);
});
