const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const enhancer=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');
const ecology=fs.readFileSync('preview/ocean/real-fish/ecology-state.js','utf8');

test('Photo Ocean loads layout, performance renderer, milestone rewards and atlas before correction module',()=>{
  assert.match(ecology,/population-layout\.js\?v=1/);
  assert.match(ecology,/performance-renderer\.js\?v=1/);
  assert.match(ecology,/milestone-rewards\.js\?v=2/);
  assert.match(ecology,/milestone-atlas\.js\?v=2/);
  assert.match(ecology,/milestone-swim\.js\?v=2/);
  assert.match(ecology,/photo-four-points\.js\?v=7/);
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
  assert.match(enhancer,/const rewards=window\.CinemapOceanMilestoneRewards\?\.rewardsForCount\?\.\(target\)\|\|\[\]/);
  assert.match(enhancer,/nodes\.forEach\(\(node,index\)=>applyNaturalPosition\(node,points\[index\],index\)\)/);
});

test('preview controls render milestone counts through 1500 instead of saved-record count',()=>{
  assert.match(enhancer,/PREVIEW_STATES=\[25,50,75,100,150,200,300,400,500,600,700,800,1000,1200,1500\]/);
  assert.match(enhancer,/button\[data-state\]/);
  assert.match(enhancer,/previewTarget=Math\.max\(0,Number\(button\.dataset\.state\)\|\|0\)/);
});

test('milestone rewards replace ordinary creatures without changing node count',()=>{
  assert.match(enhancer,/for\(const reward of rewards\)/);
  assert.match(enhancer,/reward\.unlockAt-1/);
  assert.match(enhancer,/renderCommemorative\(reward,nodes\[index\],manifest\)/);
});
