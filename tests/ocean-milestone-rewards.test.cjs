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

function keysAt(count) {
  return Array.from(loadRewards().rewardsForCount(count), (reward) => reward.key);
}

function ordinalsAt(count, key) {
  const rewards = loadRewards().rewardsForCount(count).filter((reward) => reward.key === key);
  return Array.from(rewards, (reward) => reward.ordinal);
}

test('first 100 films unlock milestone species at 25-film intervals', () => {
  assert.deepEqual(keysAt(24), []);
  assert.deepEqual(keysAt(25), ['clownfish']);
  assert.deepEqual(keysAt(50), ['clownfish', 'sea-turtle']);
  assert.deepEqual(keysAt(75), ['clownfish', 'sea-turtle', 'seahorse']);
  assert.deepEqual(keysAt(100), ['clownfish', 'sea-turtle', 'seahorse', 'ocean-sunfish']);
});

test('habitat species recur on their approved cadences', () => {
  assert.deepEqual(ordinalsAt(225, 'clownfish'), [1, 2, 3]);
  assert.deepEqual(ordinalsAt(450, 'sea-turtle'), [1, 2, 3]);
  assert.deepEqual(ordinalsAt(475, 'seahorse'), [1, 2, 3]);
});

test('special reward cadence is every 50 films from 100 through 1000', () => {
  const expected = [
    [100, 'ocean-sunfish'],
    [150, 'giant-octopus'],
    [200, 'manta-ray'],
    [250, 'dolphin'],
    [300, 'hammerhead-shark'],
    [350, 'large-shark'],
    [400, 'dugong'],
    [450, 'minke-whale'],
    [500, 'orca'],
    [550, 'manta-ray'],
    [600, 'humpback-whale'],
    [650, 'sea-turtle'],
    [700, 'whale-shark'],
    [750, 'ocean-sunfish'],
    [800, 'dolphin'],
    [850, 'hammerhead-shark'],
    [900, 'minke-whale'],
    [950, 'orca'],
    [1000, 'blue-whale']
  ];
  const api = loadRewards();
  for (const [count, key] of expected) {
    const atCount = api.rewardsForCount(count);
    const before = api.rewardsForCount(count - 1);
    assert.ok(atCount.some((reward) => reward.key === key && reward.unlockAt === count), `${key} should be rewarded at ${count}`);
    assert.equal(atCount.length, before.length + 1, `exactly one special reward should be added at ${count}`);
  }
});

test('post-1000 milestones continue every 50 films as ecosystem expansions', () => {
  const api = loadRewards();
  for (let count = 1050; count <= 1500; count += 50) {
    assert.equal(api.rewardsForCount(count).length, api.rewardsForCount(count - 1).length + 1, `one reward should be added at ${count}`);
  }
});

test('hero rewards contain only hero-role animals', () => {
  const heroes = loadRewards().heroRewardsForCount(1500);
  assert.ok(heroes.length > 0);
  assert.ok(heroes.every((reward) => reward.role === 'hero'));
});

test('special rewards never exceed exact logical movie population', () => {
  const api = loadRewards();
  for (let count = 0; count <= 1500; count += 1) {
    assert.ok(api.rewardsForCount(count).length <= count, `reward overflow at ${count}`);
  }
});
