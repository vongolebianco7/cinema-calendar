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
  assert.match(source, /\[data-commemorative\]\[data-swim-key="manta-ray"\]\[data-swim-active="1"\] img:first-child\{animation-name:mantaWingBody!important\}/);
  assert.match(source, /\[data-commemorative\]\[data-swim-key="dolphin"\]\[data-swim-active="1"\] img:first-child\{animation-name:dolphinKickBody!important\}/);
  assert.match(source, /\[data-commemorative\]\[data-swim-key="dugong"\]\[data-swim-active="1"\] img:first-child\{animation-name:dugongKickBody!important\}/);
});

test('inactive large milestone swimmers do not burn animation budget', () => {
  assert.match(source, /data-swim-profile="cetacean-cruise"\]:not\(\[data-swim-active="1"\]\) img:first-child/);
  assert.match(source, /animation:none!important/);
});

test('dense milestone states serialize large crossings for iPhone performance', () => {
  assert.match(source, /list\.length>=8\?1:/, 'dense states should animate one large pass-through creature at a time');
});

test('large pass-through swimmers accelerate into a cruise without turning in-frame', () => {
  const passRoute = source.match(/@keyframes milestonePassRoute\{([^}]|}\s*(?!@keyframes))*?\}\n/)?.[0] || '';
  assert.ok(passRoute, 'milestonePassRoute should exist');
  assert.doesNotMatch(passRoute, /rotateY\(/, 'pass-through swimmers must not turn in-frame');
  assert.match(source, /animation-timing-function:cubic-bezier\(/, 'pass-through should not look like a constant-speed slide');
  assert.match(source, /activatePassThrough\(nodes,maxActive=2\)/, 'keep at most two active pass-through milestone swimmers');
});
