import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('preview/ocean/real-fish/asset-manifest.json','utf8'));

test('real-fish PoC has zero-cost self-contained provenance', () => {
  assert.equal(manifest.runtimeExternalRequests, 0);
  assert.equal(manifest.thirdPartyScraping, false);
  assert.equal(manifest.paidRuntimeApi, false);
  assert.match(manifest.provenance, /OpenAI image generation/);
});

test('realism and FPS thresholds are explicit', () => {
  assert.equal(manifest.acceptance.iphoneFirstImpression, 'real fish underwater');
  assert.equal(manifest.acceptance.fpsMedianMinimum, 50);
  assert.ok(manifest.acceptance.rejectIf.includes('low-poly'));
});
