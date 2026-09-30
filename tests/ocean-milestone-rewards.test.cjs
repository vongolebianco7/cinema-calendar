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

test('hero rewards contain only hero-role animals', () => {
  const heroes = loadRewards().heroRewardsForCount(1000);
  assert.ok(heroes.length > 0);
  assert.ok(heroes.every((reward) => reward.role === 'hero'));
});

test('special rewards never exceed exact logical movie population', () => {
  const api = loadRewards();
  for (let count = 0; count <= 1500; count += 1) assert.ok(api.rewardsForCount(count).length <= count, `reward overflow at ${count}`);
});
