const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const enhancer=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');
const ecology=fs.readFileSync('preview/ocean/real-fish/ecology-state.js','utf8');

test('Photo Ocean loads layout, performance renderer, milestone rewards and atlas before correction module',()=>{
  assert.match(ecology,/population-layout\.js\?v=1/);
  assert.match(ecology,/performance-renderer\.js\?v=2/);
  assert.match(ecology,/milestone-rewards\.js\?v=4/);
  assert.match(ecology,/milestone-atlas\.js\?v=2/);
  assert.match(ecology,/milestone-swim\.js\?v=3/);
  assert.match(ecology,/ordinary-species-motion\.js\?v=1/);
  assert.match(ecology,/photo-four-points\.js\?v=8/);
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

test('production growth creates ordinary fish from the full creature catalog instead of cloning a tiny initial pool',()=>{
  assert.match(enhancer,/function ordinaryFishCatalog\(/);
  assert.match(enhancer,/window\.__OCEAN_PHOTO__\?\.CREATURES/);
  assert.match(enhancer,/function makeCatalogFish\(/);
  assert.match(enhancer,/dataset\.creatureId/);
  assert.doesNotMatch(enhancer,/sources\[i%sources\.length\]\.cloneNode\(true\)/);
});

test('legacy state query and preview query select the same exact population target',()=>{
  assert.match(enhancer,/params\.get\('preview'\)\?\?params\.get\('state'\)/);
});

test('ordinary DOM fish are lifted for underwater readability instead of appearing black',()=>{
  assert.match(enhancer,/function ordinaryVisualFilter\(depth\)/);
  assert.match(enhancer,/brightness\(1\.3/);
  assert.match(enhancer,/saturate\(1\.2/);
  assert.match(enhancer,/node\.style\.filter=ordinaryVisualFilter\(depth\)/);
});

test('fallback fish never uses the dark legacy killifish asset',()=>{
  assert.match(enhancer,/function makeFallbackFish/);
  assert.doesNotMatch(enhancer,/optimized\/fish-real\.webp/);
  assert.match(enhancer,/optimized\/species-aji\.webp/);
});

test('FPS diagnostics are hidden unless debug is explicitly requested',()=>{
  assert.match(enhancer,/params\.get\('debug'\)==='1'/);
  assert.match(enhancer,/fps\.hidden=!debug/);
});

test('preview controls expose the new 50-film cadence through 1500',()=>{
  assert.match(enhancer,/PREVIEW_STATES=\[[^\]]*250[^\]]*350[^\]]*550[^\]]*950[^\]]*1050[^\]]*1450[^\]]*1500\]/);
  assert.match(enhancer,/button\[data-state\]/);
  assert.match(enhancer,/previewTarget=Math\.max\(0,Number\(button\.dataset\.state\)\|\|0\)/);
});

test('milestone rewards replace ordinary creatures without changing node count and never overwrite another reward at the same film count',()=>{
  assert.match(enhancer,/for\(const reward of rewards\)/);
  assert.match(enhancer,/occupiedMilestoneIndices/);
  assert.match(enhancer,/findMilestoneNodeIndex/);
  assert.match(enhancer,/renderCommemorative\(reward,nodes\[index\],manifest\)/);
});
