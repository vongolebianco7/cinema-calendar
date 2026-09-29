const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const catalogPath = path.join(__dirname, '..', 'preview', 'ocean', 'real-fish', 'creature-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const creatures = catalog.creatures;

test('core biodiversity unlocks between 10 and 100 films', () => {
  assert.ok(creatures.length >= 20);
  assert.equal(Math.min(...creatures.map(c => c.unlockAt)), 10);
  assert.ok(creatures.filter(c => c.unlockAt <= 100).length >= 20);
});

test('new life appears frequently from 10 through 100', () => {
  const expectedBands = [10,20,30,40,50,60,70,80,90,100];
  for (const band of expectedBands) {
    assert.ok(creatures.some(c => c.unlockAt === band), `missing unlock at ${band}`);
  }
});

test('ecosystem is not fish-only', () => {
  const kinds = new Set(creatures.map(c => c.kind));
  assert.ok(kinds.has('fish'));
  assert.ok(kinds.has('crustacean'));
  assert.ok(kinds.has('mollusk'));
  assert.ok(kinds.has('cephalopod'));
});

test('rare and epic creatures are genuinely sparse', () => {
  for (const c of creatures.filter(c => c.rarity === 'rare' || c.rarity === 'epic')) {
    assert.ok(c.spawnWeight <= 3, `${c.id} is too common`);
  }
});

test('octopus arrives before 100 and turtle/ray anchor 100', () => {
  const byId = Object.fromEntries(creatures.map(c => [c.id, c]));
  assert.equal(byId.octopus.unlockAt, 90);
  assert.equal(byId.stingray.unlockAt, 100);
  assert.equal(byId['small-sea-turtle'].unlockAt, 100);
});
