const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const immersive=fs.readFileSync('preview/ocean/js/ocean-immersive.js','utf8');
const world=fs.readFileSync('preview/ocean/renderer/src/asset-world.js','utf8');
const rewards=fs.readFileSync('preview/ocean/renderer/src/milestone-rewards.js','utf8');
const runtime=fs.readFileSync('preview/ocean/renderer/src/runtime-policy.js','utf8');

test('growth message sits outside the ocean visual area',()=>{
  assert.match(immersive,/<\/section><details class="ocean3dStatus ocean3dStatusBelow"/);
  assert.doesNotMatch(immersive,/<details class="ocean3dStatus[^>]*style="position:absolute/);
});

test('Ocean keeps the high-resolution backdrop and Retina DPR',()=>{
  assert.match(immersive,/ocean-background-approved-hires\.png/);
  assert.match(runtime,/Math\.min\(2,dpr\)/);
});

test('visible creature population equals watched movie count',()=>{
  assert.match(world,/const target=state\.watched/);
  assert.match(world,/for\(let i=0;i<target;i\+\+\)/);
  assert.doesNotMatch(world,/caps\?\.life|slice\(0,28\)|life\.length<max/);
});

test('every 100 watched movies promotes one creature to a commemorative slot',()=>{
  assert.match(rewards,/Math\.floor\(n\/MILESTONE_STEP\)/);
  assert.match(rewards,/index:reward\.at-1/);
  assert.match(world,/milestoneSlots\(target\)/);
});
