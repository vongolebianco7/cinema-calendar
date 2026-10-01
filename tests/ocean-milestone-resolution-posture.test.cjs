const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const atlas = fs.readFileSync(
  path.join(__dirname, '..', 'preview', 'ocean', 'real-fish', 'milestone-atlas.js'),
  'utf8'
);
const swim = fs.readFileSync(
  path.join(__dirname, '..', 'preview', 'ocean', 'real-fish', 'milestone-swim.js'),
  'utf8'
);

test('large milestone animals use scalable vector artwork instead of the 400x200 raster atlas', () => {
  assert.match(atlas, /const VECTOR_SPECIES=/);
  for (const key of [
    'sea-turtle', 'manta-ray', 'dolphin', 'hammerhead-shark', 'large-shark',
    'dugong', 'minke-whale', 'orca', 'humpback-whale', 'whale-shark', 'blue-whale'
  ]) {
    assert.match(atlas, new RegExp(`['\"]${key}['\"]`), `${key} should have a vector pose`);
  }
  assert.match(atlas, /className='milestoneVectorCreature'/);
  assert.match(atlas, /createElementNS\(SVG_NS,'svg'\)/);
});

test('large milestone swimmers stay in-place instead of flying across the whole viewport', () => {
  for (const route of ['milestonePassRoute','turtlePassRoute','mantaPassRoute','dolphinPassRoute','dugongPassRoute','cetaceanPassRoute','sharkPassRoute']) {
    const match = swim.match(new RegExp(`@keyframes ${route}\\{([^}]|}\\s*(?!@keyframes))*?\\}\\n`));
    assert.ok(match, `${route} should exist`);
    assert.doesNotMatch(match[0], /-92vw|92vw|-84vw|84vw/, `${route} must not traverse edge-to-edge`);
  }
});

test('rigid swimmers keep the whole body straight when fins cannot articulate', () => {
  assert.match(atlas, /data-pose=['\"]straight['\"]/);
  assert.doesNotMatch(swim, /rotateY\(180deg\)/, 'large animals must not flip like flat sprites');
});
