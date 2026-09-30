const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'preview/ocean/index.html'), 'utf8');

test('Ocean index is only a canonical redirect, never a second renderer host', () => {
  assert.match(index, /ocean-demo\.html/);
  assert.match(index, /location\.replace/);
  assert.doesNotMatch(index, /photo-ocean-production-script/);
  assert.doesNotMatch(index, /mountPhotoOcean/);
  assert.doesNotMatch(index, /CinemapOceanView/);
  assert.doesNotMatch(index, /CinemapOceanImmersive\.mount/);
  assert.doesNotMatch(index, /id=["']universe["']/);
});
