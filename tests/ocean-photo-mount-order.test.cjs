const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const h=fs.readFileSync('preview/ocean/index.html','utf8');

test('production Ocean index never schedules competing renderer mounts',()=>{
  assert.match(h,/ocean-demo\.html/);
  assert.doesNotMatch(h,/CinemapOceanImmersive\.mount/);
  assert.doesNotMatch(h,/mountPhotoOcean/);
  assert.doesNotMatch(h,/setTimeout\(/);
});
