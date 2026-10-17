const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const smoke = fs.readFileSync('scripts/mobile_smoke.mjs', 'utf8');

test('mobile smoke isolates every backend request from the live service', () => {
  assert.match(smoke, /context\.route\(\/backend-one-gray-94\\\.vercel\\\.app\\\/api\\\//);
  assert.doesNotMatch(smoke, /context\.route\(\/backend-one-gray-94\\\.vercel\\\.app\\\/api\\\/movies\//);
});

test('mobile smoke waits for index network activity before navigating away', () => {
  assert.match(smoke, /if\(path==='index\.html'\)await page\.waitForLoadState\('networkidle'/);
});
