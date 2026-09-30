const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const index=fs.readFileSync('preview/ocean/index.html','utf8');

test('production Ocean has exactly one renderer owner for #universe',()=>{
  assert.match(index,/CinemapOceanImmersive\.mount/);
  assert.doesNotMatch(index,/id="photo-ocean-production-script"/);
  assert.doesNotMatch(index,/mountPhotoOcean/);
  assert.doesNotMatch(index,/photoOceanFrame/);
  assert.doesNotMatch(index,/photoOceanShell/);
});
