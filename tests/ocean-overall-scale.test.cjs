const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
test('all creature models receive the agreed 20 percent display enlargement',()=>{
  assert.match(src,/const DISPLAY_SCALE=1\.2/);
  for(const key of ['grouper','clown','butterfly','sword','shark','manta','whale','angler']) assert.match(src,new RegExp(`size:REAL_LENGTH_M\\.${key}\\*DISPLAY_SCALE`));
});
