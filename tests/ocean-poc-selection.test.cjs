const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('PoC harness fixes all comparison states and modes', () => {
  const config = read('preview/ocean/poc/poc-config.js');
  assert.match(config, /\[0, 10, 30, 100, 300, 500\]/);
  assert.match(config, /\['A', 'B', 'C', 'D', 'E'\]/);
  assert.match(config, /cinemap-poc-01/);
});

test('PoC candidates are materially distinct', () => {
  const main = read('preview/ocean/poc/poc-main.js');
  assert.match(main, /async function mountA\(\).*ocean-renderer/s);
  assert.match(main, /async function mountB\(\).*navigator/s);
  assert.match(main, /async function mountC\(\).*renderProfile:'asset-first'/s);
  assert.match(main, /async function mountD\(\).*mountLayered2D/s);
  assert.match(main, /async function mountE\(\).*mountIllustrated2D/s);
});

test('PoC exposes reproducible performance evidence', () => {
  const main = read('preview/ocean/poc/poc-main.js');
  assert.match(main, /medianFps/);
  assert.match(main, /longFrames/);
  assert.match(main, /metrics\.ready/);
  assert.match(main, /window\.__OCEAN_POC__/);
});

test('selection report keeps subjective visual gates unresolved until iPhone review', () => {
  const report = read('docs/superpowers/reviews/ocean-poc-selection.md');
  for (const gate of ['G1','G2','G3','G4','G5','G6','G7']) assert.match(report, new RegExp(`${gate}.*PENDING`));
  assert.match(report, /G8.*30 fps/);
  assert.match(report, /ADOPT.*HOLD.*REJECT/);
});
