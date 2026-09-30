const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');

test('Ocean keeps an explicit real-world relative-size baseline',()=>{
  assert.match(src,/REAL_LENGTH_M\s*=\s*\{/);
  for(const species of ['clown','grouper','sword','shark','manta','whale','angler']) assert.match(src,new RegExp(`${species}\\s*:`));
  assert.match(src,/DISPLAY_SCALE\s*=\s*1\.2/);
});

test('habitat bands separate reef, benthic and pelagic life',()=>{
  assert.match(src,/HABITAT_Y\s*=\s*\{/);
  for(const band of ['reef','benthic','drifter','pelagic']) assert.match(src,new RegExp(`${band}\\s*:`));
});
