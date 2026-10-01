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

function loadManifest() {
  return JSON.parse(fs.readFileSync('preview/ocean/real-fish/milestone-assets.json', 'utf8'));
}

function milestoneWidthCaps() {
  const source = fs.readFileSync('preview/ocean/real-fish/photo-four-points.js', 'utf8');
  const match = source.match(/const MILESTONE_WIDTH_CAP=\{([^}]*)\}/);
  assert.ok(match, 'missing MILESTONE_WIDTH_CAP');
  return Object.fromEntries([...match[1].matchAll(/['\"]?([a-z-]+)['\"]?:(\d+(?:\.\d+)?)/g)].map(m => [m[1], Number(m[2])]));
}

const APPROVED = [
  'clownfish', 'sea-turtle', 'ocean-sunfish', 'giant-octopus', 'manta-ray',
  'dolphin', 'hammerhead-shark', 'large-shark', 'dugong', 'minke-whale',
  'orca', 'humpback-whale', 'whale-shark', 'blue-whale'
];

test('milestone asset catalog is exactly the approved 14 species', () => {
  const keys = Object.keys(loadManifest().species).sort();
  assert.deepEqual(keys, APPROVED.slice().sort());
  assert.equal(keys.includes('seahorse'), false);
});

test('1000-film rewards expose all 14 approved milestone species and no rejected species', () => {
  const keys = [...new Set(Array.from(loadRewards().rewardsForCount(1000), reward => reward.key))].sort();
  assert.deepEqual(keys, APPROVED.slice().sort());
  assert.equal(keys.includes('seahorse'), false);
});

test('clownfish presentation is decisively smaller than large milestone animals', () => {
  const species = loadManifest().species;
  assert.ok(species.clownfish.presentationScale <= 0.35, 'clownfish must stay genuinely tiny');
  assert.ok(species['sea-turtle'].presentationScale >= species.clownfish.presentationScale * 4);
  assert.ok(species.dolphin.presentationScale >= species.clownfish.presentationScale * 5);
  assert.ok(species['blue-whale'].presentationScale >= species.clownfish.presentationScale * 10);
});

test('whales and whale shark render as unmistakable megafauna', () => {
  const caps = milestoneWidthCaps();
  assert.ok(caps['minke-whale'] >= 30, 'minke whale should read as giant');
  assert.ok(caps['humpback-whale'] >= 38, 'humpback whale should dominate the scene');
  assert.ok(caps['whale-shark'] >= 36, 'whale shark should read as giant');
  assert.ok(caps['blue-whale'] >= 44, 'blue whale should be the largest milestone animal');
  assert.ok(caps['blue-whale'] >= caps.dolphin * 3, 'blue whale must be at least three times dolphin width');
  assert.ok(caps['whale-shark'] >= caps['large-shark'] * 1.8, 'whale shark must clearly exceed ordinary large shark scale');
});

test('rigid swimmers use straight-pose motion families instead of body-bending families', () => {
  const swim = fs.readFileSync('preview/ocean/real-fish/milestone-swim.js', 'utf8');
  for (const expression of [
    /'manta-ray':\{family:'rigid-glide'/,
    /dolphin:\{family:'rigid-cruise'/,
    /dugong:\{family:'rigid-cruise'/,
    /'humpback-whale':\{family:'cetacean-cruise'/,
    /'blue-whale':\{family:'cetacean-cruise'/
  ]) assert.match(swim, expression);
  assert.doesNotMatch(swim, /body-bend|spine-bend|curveBody|bendBody/i);
});
