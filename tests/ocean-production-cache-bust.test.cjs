const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const immersive=fs.readFileSync('preview/ocean/js/ocean-immersive.js','utf8');
const ecology=fs.readFileSync('preview/ocean/real-fish/ecology-state.js','utf8');

test('immersive renderer prevents legacy Photo Ocean from replacing #universe without a repair remount loop',()=>{
  assert.match(immersive,/Object\.defineProperty\(host,'innerHTML'/);
  assert.match(immersive,/includes\('photoOceanShell'\)/);
  assert.doesNotMatch(immersive,/new MutationObserver/);
  assert.doesNotMatch(immersive,/mount\(lastFilms,lastRecords,true\)/);
});

test('immersive renderer cache-busts the built Ocean bundle and milestone module',()=>{
  assert.match(immersive,/renderer\/dist\/ocean-pages\.js\?v=2/);
  assert.match(immersive,/renderer\/src\/milestone-rewards\.js\?v=2/);
});

test('legacy iframe bootstrap remains inert when the parent blocks the legacy iframe mount',()=>{
  assert.match(ecology,/ocean-immersive\.js\?v=3/);
  assert.match(ecology,/parentWindow\.CinemapOceanImmersive/);
  assert.match(ecology,/parentWindow\.CinemapRecords/);
});
