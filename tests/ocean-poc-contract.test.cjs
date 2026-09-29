const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const config = fs.readFileSync(path.resolve(__dirname, '../preview/ocean/poc/poc-config.js'), 'utf8');

test('Ocean PoC fixes the comparison modes and maturity states', () => {
  assert.match(config, /\['A', 'B', 'C', 'D', 'E'\]/);
  assert.match(config, /\[0, 10, 30, 100, 300, 500\]/);
});

test('Ocean PoC uses a deterministic seed and URL-controlled scenario', () => {
  assert.match(config, /cinemap-poc-01/);
  assert.match(config, /pocState/);
  assert.match(config, /seed/);
  assert.match(config, /createScenario/);
});
