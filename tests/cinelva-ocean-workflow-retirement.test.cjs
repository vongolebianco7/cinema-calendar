const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const retiredWorkflows = [
  'fetch-real-fish-asset.yml',
  'fetch-real-fish-species.yml',
  'fetch-real-ocean-scene.yml',
  'fix-ocean-photo-mount-order.yml',
  'integrate-photo-ocean.yml',
  'ocean-asset-quality.yml',
  'ocean-dolphin-motion.yml',
  'ocean-mature-renderer.yml',
  'ocean-milestone-v2.yml',
  'ocean-parallel-contract.yml',
  'ocean-parallel-quality.yml',
  'ocean-production-wiring.yml',
  'optimize-ocean-photo-assets.yml',
];

test('retired Ocean-only workflows are absent so old probes and bot commits cannot run', () => {
  for (const name of retiredWorkflows) {
    assert.equal(fs.existsSync(path.join(root, '.github', 'workflows', name)), false, name);
  }
});

test('active completeness scoring no longer executes or scores retired Ocean behavior', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'completeness-scorecard.yml'), 'utf8');
  const scorecard = fs.readFileSync(path.join(root, 'quality', 'scorecard.json'), 'utf8');
  const mobile = fs.readFileSync(path.join(root, 'tests', 'product', 'mobile-score.mjs'), 'utf8');
  const performance = fs.readFileSync(path.join(root, 'tests', 'product', 'performance-score.mjs'), 'utf8');
  const journeys = fs.readFileSync(path.join(root, 'tests', 'journeys', 'core-journeys.mjs'), 'utf8');
  for (const [name, source] of Object.entries({ workflow, scorecard, mobile, performance, journeys })) {
    assert.doesNotMatch(source, /ocean/i, name);
  }
});
