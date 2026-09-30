const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const index=fs.readFileSync('preview/ocean/index.html','utf8');
const immersive=fs.readFileSync('preview/ocean/js/ocean-immersive.js','utf8');

test('production Ocean entrypoint cache-busts immersive renderer changes',()=>{
  assert.match(index,/js\/ocean-immersive\.js\?v=2/);
});

test('immersive renderer cache-busts the built Ocean bundle and milestone module',()=>{
  assert.match(immersive,/renderer\/dist\/ocean-pages\.js\?v=2/);
  assert.match(immersive,/renderer\/src\/milestone-rewards\.js\?v=2/);
});
