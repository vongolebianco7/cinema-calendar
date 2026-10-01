const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'preview', 'ocean', 'real-fish', 'milestone-swim.js'),
  'utf8'
);

test('milestone atlas sprites keep visible body motion instead of blanket disabling animation', () => {
  assert.doesNotMatch(source, /\.milestoneAtlasCreature img\{animation:none!important/);
  assert.match(source, /data-swim-key/);
});

test('major milestone swimmers have species-appropriate propulsion cues', () => {
  for (const name of ['turtleStrokeBody', 'mantaWingBody', 'dolphinKickBody', 'dugongKickBody', 'cetaceanBody', 'sharkBody']) {
    assert.match(source, new RegExp(`@keyframes ${name}\\b`), `${name} should exist`);
  }
  assert.match(source, /\[data-swim-key="manta-ray"\] img:first-child\{animation-name:mantaWingBody!important\}/);
  assert.match(source, /\[data-swim-key="dolphin"\] img:first-child\{animation-name:dolphinKickBody!important\}/);
  assert.match(source, /\[data-swim-key="dugong"\] img:first-child\{animation-name:dugongKickBody!important\}/);
});

test('large pass-through swimmers accelerate into a cruise without turning in-frame', () => {
  const passRoute = source.match(/@keyframes milestonePassRoute\{([^}]|}\s*(?!@keyframes))*?\}\n/)?.[0] || '';
  assert.ok(passRoute, 'milestonePassRoute should exist');
  assert.doesNotMatch(passRoute, /rotateY\(/, 'pass-through swimmers must not turn in-frame');
  assert.match(source, /animation-timing-function:cubic-bezier\(/, 'pass-through should not look like a constant-speed slide');
  assert.match(source, /activatePassThrough\(nodes,maxActive=2\)/, 'keep at most two active pass-through milestone swimmers');
});
