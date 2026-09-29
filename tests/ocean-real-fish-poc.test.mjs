import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('preview/ocean/real-fish/index.html','utf8');
const readme = fs.readFileSync('preview/ocean/real-fish/README.md','utf8');

test('single-fish PoC uses raster asset rather than procedural fish primitives', () => {
  assert.match(html, /fish\.jpg/);
  assert.doesNotMatch(html, /<canvas|ellipse\(|bezierCurveTo\(|lineTo\(/);
});

test('motion is compositor-only and exposes an FPS reading', () => {
  assert.match(html, /translate3d/);
  assert.match(html, /requestAnimationFrame/);
  assert.match(html, /FPS median/);
});

test('visual gate blocks ecosystem expansion until one fish passes', () => {
  assert.match(readme, /not an icon, low-poly model, vector illustration, or game sprite/);
  assert.match(readme, /median >= 50 FPS/);
  assert.match(readme, /No schools, rocks, plants/);
});
