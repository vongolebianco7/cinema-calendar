import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (name) => readFile(new URL(name, import.meta.url), 'utf8');

test('benchmark uses PlayCanvas rather than hand-written WebGL', async () => {
  const source = await read('./main.js');
  assert.match(source, /from ['"]playcanvas['"]/);
  assert.doesNotMatch(source, /getContext\(['"]webgl/);
});

test('benchmark has a real 3D asset and underwater rendering layers', async () => {
  const source = await read('./main.js');
  assert.match(source, /BarramundiFish\.glb/);
  assert.match(source, /Fog|fog/i);
  assert.match(source, /caustic|god.?ray|marine.?snow/i);
});

test('benchmark starts from a distant cinematic camera and has no bubble effect', async () => {
  const source = await read('./main.js');
  assert.match(source, /camera\.setPosition\([^)]*,[^)]*,\s*(?:1[2-9]|[2-9]\d)/);
  assert.doesNotMatch(source, /bubble/i);
});
