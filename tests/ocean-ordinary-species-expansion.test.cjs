const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const catalogPath = path.join(__dirname, '..', 'preview', 'ocean', 'real-fish', 'creature-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const byId = new Map(catalog.creatures.map((c) => [c.id, c]));

const expected = [
  ['palette-surgeonfish', 'ナンヨウハギ', true, 'midwater'],
  ['firefish-goby', 'ハタタテハゼ', false, 'reef-bottom'],
  ['six-line-wrasse', 'ニセモチノウオ', false, 'reef-lower'],
  ['damselfish', 'スズメダイ', true, 'reef-midwater'],
  ['lyretail-anthias', 'アカネハナゴイ', true, 'reef-upper'],
  ['red-seabream', 'マダイ', false, 'midwater'],
  ['filefish', 'カワハギ', false, 'midwater-lower'],
];

test('ordinary Ocean catalog contains the seven approved species with distinct ecology roles', () => {
  for (const [id, name, schooling, zone] of expected) {
    const creature = byId.get(id);
    assert.ok(creature, `${id} should exist`);
    assert.equal(creature.name, name);
    assert.equal(creature.kind, 'fish');
    assert.equal(creature.schooling, schooling);
    assert.equal(creature.zone, zone);
    assert.ok(Number(creature.realLengthCm) > 0);
    assert.ok(Number(creature.displayScale) > 0);
    assert.ok(Number(creature.spawnWeight) > 0);
    assert.match(creature.assetStatus || '', /^ready-distinct-/);
  }
});

test('new species use dedicated assets rather than recoloring one shared fish', () => {
  const ids = ['palette-surgeonfish','firefish-goby','six-line-wrasse','damselfish','lyretail-anthias','filefish'];
  const assets = ids.map((id) => byId.get(id)?.asset);
  assert.equal(assets.filter(Boolean).length, ids.length);
  assert.equal(new Set(assets).size, ids.length);
  for (const asset of assets) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'preview', 'ocean', 'real-fish', asset)), `${asset} should exist`);
  }
});

test('red seabream is promoted from a generic family label to the exact species name', () => {
  const madai = byId.get('red-seabream');
  assert.equal(madai?.name, 'マダイ');
  assert.equal(madai?.realLengthCm, 40);
  assert.equal(madai?.displayScale, 1);
});
