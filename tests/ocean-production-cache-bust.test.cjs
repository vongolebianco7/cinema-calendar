const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const immersive=fs.readFileSync('preview/ocean/js/ocean-immersive.js','utf8');
const ecology=fs.readFileSync('preview/ocean/real-fish/ecology-state.js','utf8');

test('immersive renderer reclaims the stage if legacy Photo Ocean overwrites #universe',()=>{
  assert.match(immersive,/new MutationObserver/);
  assert.match(immersive,/host\.querySelector\('\.ocean3dPrimary'\)/);
  assert.match(immersive,/mount\(lastFilms,lastRecords,true\)/);
});

test('immersive renderer cache-busts the built Ocean bundle and milestone module',()=>{
  assert.match(immersive,/renderer\/dist\/ocean-pages\.js\?v=2/);
  assert.match(immersive,/renderer\/src\/milestone-rewards\.js\?v=2/);
});

test('legacy iframe bootstraps a fresh immersive script and remounts the parent Ocean',()=>{
  assert.match(ecology,/ocean-immersive\.js\?v=3/);
  assert.match(ecology,/parentWindow\.CinemapOceanImmersive/);
  assert.match(ecology,/parentWindow\.CinemapRecords/);
});
