const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const demo=fs.readFileSync('preview/ocean/js/ocean-demo.js','utf8');
test('user-facing Ocean lazily loads ecosystem and primary renderer without paid services',()=>{assert.match(demo,/loadScript\('js\/ocean-ecosystem\.js/);assert.match(demo,/loadScript\('js\/ocean-3d-primary\.js/);});
test('dashboard mounts primary adapter and no longer mounts legacy immersive renderer',()=>{assert.match(demo,/CinemapOcean3DPrimary\?\.mount\?\.\(\)/);assert.doesNotMatch(demo,/CinemapOceanImmersive\?\.mount/);});
