const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const immersive=fs.readFileSync('preview/ocean/js/ocean-immersive.js','utf8');
const world=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
const rewards=fs.readFileSync('preview/ocean/renderer/src/milestone-rewards.js','utf8');
const runtime=fs.readFileSync('preview/ocean/renderer/src/runtime-policy.js','utf8');

test('bottom Ocean message reserves iPhone safe area and does not collide with the canvas edge',()=>{
  assert.match(immersive,/--ocean-hud-safe-bottom/);
  assert.match(immersive,/calc\(var\(--ocean-hud-safe-bottom\) \+ 12px\)/);
  assert.match(immersive,/line-height:1\.35/);
});

test('Ocean renderer keeps Retina-class resolution without unbounded DPR',()=>{
  assert.match(runtime,/Math\.min\(2/);
  assert.match(runtime,/Math\.max\(1/);
  assert.match(immersive,/ocean-background-approved-hires\.png/);
});

test('visible creature plan is exactly one creature per watched film',()=>{
  assert.match(world,/const target=state\.watched/);
  assert.match(world,/return life\.slice\(0,target\)/);
  assert.doesNotMatch(world,/state\.organisms\.slice\(0,28\)/);
  assert.doesNotMatch(world,/member<school/);
});

test('every completed 100-film milestone promotes one existing creature instead of adding an extra',()=>{
  assert.match(rewards,/MILESTONE_STEP=100/);
  assert.match(rewards,/milestoneSlots/);
  assert.match(world,/milestoneSlots/);
  assert.match(world,/milestoneByIndex/);
  assert.match(world,/const target=state\.watched/);
  assert.match(world,/milestoneAt:special\?\.at\|\|null/);
});
