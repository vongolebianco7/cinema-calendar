const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'preview/ocean/real-fish/ecosystem.html'), 'utf8');

test('50-watched state shows a living school using every photographed species', () => {
  assert.match(html, /50:\{count:10,species:5/);
  const assets = html.match(/const ASSETS=\[(.*?)\];/s);
  assert.ok(assets, 'ASSETS array should exist');
  const assetCount = (assets[1].match(/optimized\//g) || []).length;
  assert.equal(assetCount, 5, 'renderer must not claim more species than distinct photographed assets');
});

test('fish scale is about thirty percent smaller than the previous range', () => {
  assert.match(html, /wrap\.style\.width=\(8\.5\+z\*12\.5\)\+'%'/);
  assert.doesNotMatch(html, /12\+z\*18/);
});

test('scene keeps seabed while shifting to a bright cobalt-turquoise water palette', () => {
  assert.match(html, /scene-seabed\.webp/);
  assert.match(html, /#0b6fb4/i);
  assert.match(html, /#27c5ff/i);
  assert.match(html, /#0d95dd/i);
  assert.match(html, /blueWash/);
});

test('100-watched state is already a diverse living scene', () => {
  assert.match(html, /100:\{count:1\d,species:5/);
  assert.match(html, /effectiveSpecies=cfg\.species===0\?0:Math\.min\(ASSETS\.length,Math\.max\(cfg\.species,diversity\|\|1\)\)/);
});
