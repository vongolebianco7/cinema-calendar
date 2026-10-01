const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

function loadRewards() {
  const source = fs.readFileSync('preview/ocean/real-fish/milestone-rewards.js', 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.CinemapOceanMilestoneRewards;
}

function loadSwimSource(){return fs.readFileSync('preview/ocean/real-fish/milestone-swim.js','utf8');}
function loadPhotoSource(){return fs.readFileSync('preview/ocean/real-fish/photo-four-points.js','utf8');}

function keysAt(count) {return Array.from(loadRewards().rewardsForCount(count), (reward) => reward.key);}
function rewardsUnlockedAt(count) {return Array.from(loadRewards().rewardsForCount(count)).filter((reward) => reward.unlockAt === count);}

test('early milestones keep only approved clownfish and turtle while rejected seahorse stays absent', () => {
  assert.deepEqual(keysAt(24), []);
  assert.deepEqual(keysAt(25), ['clownfish']);
  assert.deepEqual(keysAt(50), ['clownfish', 'sea-turtle']);
  assert.deepEqual(keysAt(75), ['clownfish', 'sea-turtle']);
  assert.deepEqual(keysAt(100), ['clownfish', 'sea-turtle', 'ocean-sunfish']);
  assert.equal(keysAt(1000).includes('seahorse'), false);
});

test('clownfish and turtle do not recur except the explicitly approved turtle at 650', () => {
  assert.equal(rewardsUnlockedAt(125).some(r=>r.key==='clownfish'), false);
  assert.equal(rewardsUnlockedAt(225).some(r=>r.key==='clownfish'), false);
  assert.equal(rewardsUnlockedAt(250).some(r=>r.key==='sea-turtle'), false);
  assert.equal(rewardsUnlockedAt(450).some(r=>r.key==='sea-turtle'), false);
  assert.equal(rewardsUnlockedAt(650).filter(r=>r.key==='sea-turtle').length, 1);
});

test('approved milestone schedule through 1000 is exact', () => {
  const expected = new Map([
    [25,['clownfish']], [50,['sea-turtle']],
    [100,['ocean-sunfish']], [150,['giant-octopus']], [200,['manta-ray']],
    [250,['dolphin']], [300,['hammerhead-shark']], [350,['large-shark']],
    [400,['dugong']], [450,['minke-whale']], [500,['orca']],
    [550,['manta-ray']], [600,['humpback-whale']], [650,['sea-turtle']],
    [700,['whale-shark']], [750,['ocean-sunfish']],
    [800,['dolphin','dolphin','dolphin']], [850,['hammerhead-shark']],
    [900,['minke-whale']], [950,['orca']], [1000,['blue-whale']]
  ]);
  for (let count=1; count<=1000; count++) {
    const actual=rewardsUnlockedAt(count).map(r=>r.key).sort();
    const want=(expected.get(count)||[]).slice().sort();
    assert.deepEqual(actual,want,`unexpected milestone rewards at ${count}`);
  }
});

test('500 films has exactly the eleven approved milestone creatures',()=>{
  assert.equal(loadRewards().rewardsForCount(500).length,11);
});

test('manta dolphin and dugong use rigid-body swim profiles with no body-bending keyframes',()=>{
  const src=loadSwimSource();
  assert.match(src,/manta-ray'?:\{family:'rigid-glide'/);
  assert.match(src,/dolphin:\{family:'rigid-cruise'/);
  assert.match(src,/dugong:\{family:'rigid-cruise'/);
  assert.match(src,/data-swim-profile="rigid-glide"/);
  assert.match(src,/data-swim-profile="rigid-cruise"/);
  assert.doesNotMatch(src,/cetaceanPlayBody/);
  assert.doesNotMatch(src,/rayBody/);
});

test('large swimmers, dolphin, manta and turtle use staged pass-through with no in-frame turning',()=>{
  const swim=loadSwimSource(),photo=loadPhotoSource();
  assert.match(swim,/\[data-swim-active="1"\]\{animation-name:milestonePassRoute/);
  for(const family of ['turtle-stroke','rigid-glide','rigid-cruise','shark-cruise','cetacean-cruise']){
    assert.match(swim,new RegExp(`data-swim-profile="${family}"[^}]*not\\(\\[data-swim-active="1"\\]\\)[^}]*animation:none`,'s'));
  }
  assert.match(swim,/function activatePassThrough\(nodes,maxActive=2\)/);
  assert.match(photo,/activatePassThrough\?\.\(passThroughNodes,2\)/);
  const pass=swim.match(/@keyframes milestonePassRoute\{([^}]|\}(?!\n@keyframes))*\}/s)?.[0]||'';
  assert.ok(pass,'missing pass-through keyframes');
  assert.doesNotMatch(pass,/rotateY\(/);
});

test('octopus and gentle drifters stay on local drift routes instead of pass-through',()=>{
  const src=loadSwimSource();
  assert.match(src,/data-swim-profile="octopus-drift"[^}]*animation-name:milestoneDriftRoute/s);
  assert.match(src,/data-swim-profile="gentle-cruise"[^}]*animation-name:milestoneDriftRoute/s);
});

test('milestone size hierarchy keeps megafauna dominant while articulated specials remain readable',()=>{
  const src=loadPhotoSource();
  assert.match(src,/function milestoneWidthPercent\(/);
  assert.match(src,/const MILESTONE_WIDTH_CAP=/);
  const caps=Object.fromEntries([...src.matchAll(/(?:^|,)['\"]?([a-z-]+)['\"]?:(\d+(?:\.\d+)?)/g)].map(m=>[m[1],Number(m[2])]));
  assert.ok(caps['blue-whale']>=60);
  assert.ok(caps['humpback-whale']>=50);
  assert.ok(caps['whale-shark']>=50);
  assert.ok(caps['blue-whale']>=caps.dolphin*3);
  assert.ok(caps['manta-ray']>=24&&caps['manta-ray']<=28);
  assert.ok(caps.dolphin>=18&&caps.dolphin<=22);
  assert.ok(caps.dugong>=18&&caps.dugong<=22);
  assert.ok(caps['large-shark']<=20);
  assert.match(src,/Math\.min\(cap,/);
});

test('hero rewards contain only hero-role animals', () => {
  const heroes = loadRewards().heroRewardsForCount(1000);
  assert.ok(heroes.length > 0);
  assert.ok(heroes.every((reward) => reward.role === 'hero'));
});

test('special rewards never exceed exact logical movie population', () => {
  const api = loadRewards();
  for (let count = 0; count <= 1500; count += 1) assert.ok(api.rewardsForCount(count).length <= count, `reward overflow at ${count}`);
});
