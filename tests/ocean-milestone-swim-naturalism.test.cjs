const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'preview', 'ocean', 'real-fish', 'milestone-swim.js'),
  'utf8'
);

test('milestone atlas image and crop stay fixed to avoid animating the giant source texture', () => {
  assert.match(source, /\.milestoneAtlasCreature,\.milestoneAtlasCreature > img\{animation:none!important;transform:none!important/);
  assert.match(source, /data-swim-key/);
});

test('major milestone swimmers use species-appropriate outer swim routes', () => {
  for (const name of ['turtlePassRoute', 'mantaPassRoute', 'dolphinPassRoute', 'dugongPassRoute', 'cetaceanPassRoute', 'sharkPassRoute']) {
    assert.match(source, new RegExp(`@keyframes ${name}\\b`), `${name} should exist`);
  }
  assert.match(source, /\[data-commemorative\]\[data-swim-key="manta-ray"\]\[data-swim-active="1"\]\{animation-name:mantaPassRoute!important\}/);
  assert.match(source, /\[data-commemorative\]\[data-swim-key="dolphin"\]\[data-swim-active="1"\]\{animation-name:dolphinPassRoute!important\}/);
  assert.match(source, /\[data-commemorative\]\[data-swim-key="dugong"\]\[data-swim-active="1"\]\{animation-name:dugongPassRoute!important\}/);
});

test('dense milestone states serialize large crossings for iPhone performance', () => {
  assert.match(source, /list\.length>=8\?1:/, 'dense states should animate one large pass-through creature at a time');
});

test('large milestone swimmers use restrained local motion instead of flying edge-to-edge', () => {
  for (const name of ['milestonePassRoute','turtlePassRoute', 'mantaPassRoute', 'dolphinPassRoute', 'dugongPassRoute', 'cetaceanPassRoute', 'sharkPassRoute']) {
    const marker = `@keyframes ${name}`;
    const start = source.indexOf(marker);
    assert.notEqual(start, -1, `${name} should exist`);
    const next = source.indexOf('@keyframes ', start + marker.length);
    const route = source.slice(start, next === -1 ? source.length : next);
    assert.doesNotMatch(route, /(?:-|\b)(?:84|92)vw/, `${name} must not cross almost the entire viewport`);
  }
  assert.match(source, /animation-timing-function:cubic-bezier\(/, 'motion should still ease naturally');
  assert.match(source, /activatePassThrough\(nodes,maxActive=2\)/, 'keep at most two active milestone swimmers');
});
