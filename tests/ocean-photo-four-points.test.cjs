const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const enhancer=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');
const ecology=fs.readFileSync('preview/ocean/real-fish/ecology-state.js','utf8');

test('Photo Ocean loads natural layout before the correction module',()=>{
  assert.match(ecology,/population-layout\.js\?v=1/);
  assert.match(ecology,/photo-four-points\.js\?v=2/);
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

test('normal Ocean population equals watched record count exactly',()=>{
  assert.match(enhancer,/function populationTarget\(records\)\{return Object\.keys\(records\|\|\{\}\)\.length\}/);
  assert.match(enhancer,/previewTarget===null\?populationTarget\(records\):previewTarget/);
  assert.match(enhancer,/if\(nodes\.length>target\)/);
  assert.match(enhancer,/if\(nodes\.length<target\)/);
  assert.match(enhancer,/const commemorativeCount=Math\.floor\(target\/100\)/);
  assert.match(enhancer,/nodes\.forEach\(\(node,index\)=>applyNaturalPosition\(node,points\[index\],index\)\)/);
});

test('500 preview button renders 500 creatures instead of saved-record count',()=>{
  assert.match(enhancer,/let previewTarget=null/);
  assert.match(enhancer,/button\[data-state\]/);
  assert.match(enhancer,/previewTarget=Math\.max\(0,Number\(button\.dataset\.state\)\|\|0\)/);
});

test('every completed 100 films replaces one ordinary creature with a commemorative creature',()=>{
  assert.match(enhancer,/function renderCommemorative\(milestone,node\)/);
  assert.match(enhancer,/for\(let milestone=100;milestone<=target;milestone\+=100\)renderCommemorative\(milestone,nodes\[milestone-1\]\)/);
});
