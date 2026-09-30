const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const read = (path) => fs.readFileSync(path, 'utf8');

test('dense canvas population keeps ordinary fish visibly colored instead of dark silhouettes', () => {
  const source = read('preview/ocean/real-fish/performance-renderer.js');
  assert.match(source, /ORDINARY_FISH_PALETTE/);
  assert.match(source, /brightness\(1\.[23-9]/);
  assert.match(source, /saturate\(1\.[2-9]/);
});

test('clownfish commemorative is deliberately much smaller than larger milestone animals', () => {
  const source = read('preview/ocean/real-fish/photo-four-points.js');
  assert.match(source, /clownfish[^\n]+0\.4[0-9]/);
});

test('dolphin dugong and manta body animation does not bend or squash the source pose', () => {
  const source = read('preview/ocean/real-fish/milestone-swim.js');
  assert.match(source, /rayBody\{[^}]*translateY[^}]*\}/);
  assert.doesNotMatch(source, /rayBody\{[^}]*scaleY/);
  assert.match(source, /cetaceanPlayBody\{[^}]*translateY[^}]*\}/);
  assert.doesNotMatch(source, /cetaceanPlayBody\{[^}]*rotate/);
  assert.match(source, /gentleBody\{[^}]*translateY[^}]*\}/);
  assert.doesNotMatch(source, /gentleBody\{[^}]*rotate/);
});
