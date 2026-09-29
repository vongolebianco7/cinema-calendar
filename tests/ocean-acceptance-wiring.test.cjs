const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = p => fs.readFileSync(p, 'utf8');
const main = read('preview/ocean/renderer/src/main.js');
const profiles = read('preview/ocean/renderer/src/creature-profiles.js');
const workflow = read('.github/workflows/ocean-mature-renderer.yml');
const acceptance = read('docs/ocean-acceptance.md');

test('Ocean acceptance contract is wired to the current renderer implementation', () => {
  assert.match(acceptance, /OCEAN-01/);
  assert.match(main, /options\.ecosystem/);
  assert.match(main, /stats\?\.watched/);
  assert.match(main, /createAssetWorld\(scene,options\.ecosystem/);
});

test('Ocean maturity is deterministic from persisted watch history', () => {
  assert.match(profiles, /ecosystemMaturity\(recordCount=0\)/);
  assert.match(profiles, /count>=100/);
  assert.match(profiles, /count>=30/);
  assert.match(profiles, /count>=10/);
  assert.match(profiles, /richness:Math\.min\(1,count\/100\)/);
  assert.match(profiles, /habitat:Math\.min\(1,count\/80\)/);
});

test('Ocean has an iPhone-oriented deterministic renderer check in CI', () => {
  assert.match(workflow, /playwright@/);
  assert.match(workflow, /Capture iPhone renderer/);
  assert.match(workflow, /capture\.mjs/);
});

test('acceptance wiring test is covered by the Ocean workflow path filter', () => {
  assert.match(workflow, /tests\/ocean-renderer-\*\.test\.cjs/);
});
