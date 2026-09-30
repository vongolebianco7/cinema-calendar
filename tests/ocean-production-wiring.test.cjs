const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const html=fs.readFileSync('preview/ocean/ocean-demo.html','utf8');const demo=fs.readFileSync('preview/ocean/js/ocean-demo.js','utf8');
test('user-facing Ocean loads primary ecosystem adapter',()=>{assert.match(html,/js\/ocean-ecosystem\.js/);assert.match(html,/js\/ocean-3d-primary\.js/);assert.doesNotMatch(html,/js\/ocean-immersive\.js/)});
test('dashboard mounts primary adapter after records are rendered',()=>{assert.match(demo,/CinemapOcean3DPrimary\?\.mount\?\.\(\)/);assert.doesNotMatch(demo,/CinemapOceanImmersive\?\.mount/)});
