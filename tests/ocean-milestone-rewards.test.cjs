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
  return loadRewards().rewardsForCount(count).map((reward) => reward.key);
}

function ordinalsAt(count, key) {
  return loadRewards().rewardsForCount(count).filter((reward) => reward.key === key).map((reward) => reward.ordinal);
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

test('large milestone ladder escalates through 1500 films', () => {
  const expected = [
    [150, 'giant-octopus'], [200, 'manta-ray'], [300, 'dolphin'],
    [400, 'hammerhead-shark'], [500, 'large-shark'], [600, 'dugong'],
    [700, 'minke-whale'], [800, 'orca'], [1000, 'humpback-whale'],
    [1200, 'whale-shark'], [1500, 'blue-whale']
  ];
  for (const [count, key] of expected) {
    assert.ok(keysAt(count).includes(key), `${key} should be unlocked at ${count}`);
  }
});

test('hero rewards contain only hero-role animals', () => {
  const api = loadRewards();
  const heroes = api.heroRewardsForCount(1500);
  assert.ok(heroes.length > 0);
  assert.ok(heroes.every((reward) => reward.role === 'hero'));
});

test('special rewards never exceed exact logical movie population', () => {
  const api = loadRewards();
  for (let count = 0; count <= 1500; count += 1) {
    assert.ok(api.rewardsForCount(count).length <= count, `reward overflow at ${count}`);
  }
});
