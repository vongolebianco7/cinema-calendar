const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const catalog = JSON.parse(fs.readFileSync('preview/ocean/real-fish/creature-catalog.json','utf8'));
const byId = id => catalog.creatures.find(c => c.id === id);

test('red seabream is the real-scale reference and presentation is globally 20 percent larger', () => {
  assert.equal(catalog.scaleReference.id, 'red-seabream');
  assert.equal(catalog.scaleReference.realLengthCm, 40);
  assert.equal(catalog.scaleReference.displayScale, 1);
  assert.equal(catalog.scaleReference.globalPresentationScale, 1.2);
});

test('every creature carries deterministic real-size and habitat depth metadata', () => {
  for (const creature of catalog.creatures) {
    assert.ok(Number.isFinite(creature.realLengthCm) && creature.realLengthCm > 0, creature.id);
    assert.ok(Number.isFinite(creature.displayScale) && creature.displayScale > 0, creature.id);
    assert.ok(creature.zone, creature.id);
    assert.ok(['foreground','midground','background'].includes(creature.depthBias), creature.id);
  }
});

test('octopus is substantially larger and remains seabed anchored', () => {
  const octopus = byId('octopus');
  assert.equal(octopus.realLengthCm, 80);
  assert.equal(octopus.displayScale, 1.6);
  assert.equal(octopus.presentationScale, 1.4);
  assert.match(octopus.zone, /seabed/);
  assert.equal(octopus.depthBias, 'foreground');
});

test('large roaming animals favor background while small bottom dwellers favor foreground', () => {
  assert.equal(byId('stingray').depthBias, 'background');
  assert.equal(byId('small-sea-turtle').depthBias, 'background');
  assert.equal(byId('goby').depthBias, 'foreground');
});
