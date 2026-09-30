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

function loadEcology() {
  const source = fs.readFileSync('preview/ocean/real-fish/ecology-state.js', 'utf8');
  const context = { globalThis: {}, window: {} };
  vm.runInNewContext(source, context);
  return context.globalThis.CinemapOceanEcologyState || context.window.CinemapOceanEcologyState;
}

function keysAt(count) {
  return Array.from(loadRewards().rewardsForCount(count), (reward) => reward.key);
}

function ordinalsAt(count, key) {
  const rewards = loadRewards().rewardsForCount(count).filter((reward) => reward.key === key);
  return Array.from(rewards, (reward) => reward.ordinal);
}

function rewardsUnlockedAt(count) {
  return Array.from(loadRewards().rewardsForCount(count)).filter((reward) => reward.unlockAt === count);
}

function fakeRecords(count) {
  return Object.fromEntries(Array.from({length: count}, (_, i) => [`movie-${i}`, {rating: 3}]));
}

test('early milestones keep clownfish and turtle while the rejected seahorse is absent', () => {
  assert.deepEqual(keysAt(24), []);
  assert.deepEqual(keysAt(25), ['clownfish']);
  assert.deepEqual(keysAt(50), ['clownfish', 'sea-turtle']);
  assert.deepEqual(keysAt(75), ['clownfish', 'sea-turtle']);
  assert.deepEqual(keysAt(100), ['clownfish', 'sea-turtle', 'ocean-sunfish']);
  assert.equal(keysAt(1500).includes('seahorse'), false);
});

test('approved habitat species recur without reintroducing seahorses', () => {
  assert.deepEqual(ordinalsAt(225, 'clownfish'), [1, 2, 3]);
  assert.deepEqual(ordinalsAt(450, 'sea-turtle'), [1, 2, 3]);
  assert.deepEqual(ordinalsAt(1500, 'seahorse'), []);
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
  for (const [count, key] of expected) {
    assert.ok(rewardsUnlockedAt(count).some((reward) => reward.key === key), `${key} should be rewarded at ${count}`);
  }
});

test('post-1000 milestones continue every 50 films as ecosystem expansions', () => {
  for (let count = 1050; count <= 1500; count += 50) {
    assert.ok(rewardsUnlockedAt(count).length >= 1, `at least one special reward should unlock at ${count}`);
  }
});

test('next secret milestone follows the remaining early rewards then 50-step cadence', () => {
  const ecology = loadEcology();
  assert.equal(ecology.nextSecretMilestone(fakeRecords(24)).at, 25);
  assert.equal(ecology.nextSecretMilestone(fakeRecords(50)).at, 100);
  assert.equal(ecology.nextSecretMilestone(fakeRecords(75)).at, 100);
  assert.equal(ecology.nextSecretMilestone(fakeRecords(100)).at, 150);
  assert.equal(ecology.nextSecretMilestone(fakeRecords(249)).at, 250);
  assert.equal(ecology.nextSecretMilestone(fakeRecords(1000)).at, 1050);
  assert.equal(ecology.nextSecretMilestone(fakeRecords(1499)).at, 1500);
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
