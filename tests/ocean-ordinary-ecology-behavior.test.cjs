const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const src=fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');
const motion=fs.readFileSync('preview/ocean/real-fish/ordinary-species-motion.js','utf8');
const catalog=JSON.parse(fs.readFileSync('preview/ocean/real-fish/creature-catalog.json','utf8'));

test('ordinary species carry enough ecology metadata to look biologically different',()=>{
  const fish=catalog.creatures.filter(c=>c.kind==='fish'&&c.asset&&c.asset!=='optimized/fish-real.webp');
  assert.ok(fish.length>=18);
  assert.ok(new Set(fish.map(c=>c.zone)).size>=6,'fish should occupy multiple habitat zones');
  assert.ok(new Set(fish.map(c=>c.silhouette)).size>=15,'fish should retain varied body silhouettes');
  assert.ok(Math.min(...fish.map(c=>Number(c.displayScale)))<=0.4,'small fish scale must exist');
  assert.ok(Math.max(...fish.map(c=>Number(c.displayScale)))>=2,'large fish scale must exist');
  assert.ok(fish.some(c=>c.schooling===true));
  assert.ok(fish.some(c=>c.schooling===false));
});

test('production renderer applies catalog size habitat and motion instead of one generic fish behavior',()=>{
  assert.match(src,/speciesDisplayFactor/);
  assert.match(src,/speciesVerticalOffset/);
  assert.match(src,/inferMotionProfile/);
  assert.match(src,/dataset\.motionProfile/);
  assert.match(src,/dataset\.speciesScale/);
  assert.match(src,/dataset\.creatureZone/);
  assert.match(src,/dataset\.schooling/);
});

test('ordinary motion includes clearly distinct school hover dart drift and heavy cruise behavior',()=>{
  for(const profile of ['dense-school-cruise','loose-school-glide','hover-dart','reef-dart','fin-drift','heavy-cruise']) assert.match(motion,new RegExp(profile));
  assert.match(motion,/dataset\.schooling/);
  assert.match(motion,/ordinarySchooling/);
});
