const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const enhancer=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');
const ecology=fs.readFileSync('preview/ocean/real-fish/ecology-state.js','utf8');

test('Photo Ocean loads the four-point correction module',()=>{
  assert.match(ecology,/photo-four-points\.js\?v=1/);
});

test('Ocean message is moved below the sea, never overlaid on it',()=>{
  assert.match(enhancer,/function moveHudBelowStage\(stage\)/);
  assert.match(enhancer,/stage\.insertAdjacentElement\('afterend',hud\)/);
  assert.match(enhancer,/position:'relative'/);
  assert.match(enhancer,/bottom:'auto'/);
});

test('Photo Ocean switches to the approved high-resolution background without stretching',()=>{
  assert.match(enhancer,/ocean-background-approved-hires\.png/);
  assert.match(enhancer,/objectFit='cover'/);
});

test('visible creature target equals watched record count exactly',()=>{
  assert.match(enhancer,/function populationTarget\(records\)\{return Object\.keys\(records\|\|\{\}\)\.length\}/);
  assert.match(enhancer,/const records=readRecords\(\),target=populationTarget\(records\)/);
  assert.match(enhancer,/if\(nodes\.length>target\)/);
  assert.match(enhancer,/if\(nodes\.length<target\)/);
  assert.match(enhancer,/const commemorativeCount=Math\.floor\(target\/100\)/);
  assert.match(enhancer,/const ordinaryTarget=target-commemorativeCount/);
});

test('every completed 100 films replaces one ordinary creature with a commemorative creature',()=>{
  assert.match(enhancer,/function renderCommemorative\(milestone,node\)/);
  assert.match(enhancer,/for\(let milestone=100;milestone<=target;milestone\+=100\)renderCommemorative\(milestone,nodes\[milestone-1\]\)/);
});
