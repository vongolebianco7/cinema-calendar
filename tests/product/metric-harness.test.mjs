import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let harness;
try {
  harness = await import('./helpers/metric-harness.mjs');
} catch {
  harness = null;
}

test('metric harness emits canonical browser evidence JSON', () => {
  assert.ok(harness, 'helpers/metric-harness.mjs must exist');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cinemap-metrics-'));
  const output = path.join(dir, 'metrics.json');
  const rows = [];
  harness.recordMetric(rows, {
    id: 'DISC-03',
    status: 'pass',
    earned: 0.5,
    browser: 'webkit',
    details: 'overflow=0',
  });
  harness.writeMetrics(output, rows);
  const payload = JSON.parse(fs.readFileSync(output, 'utf8'));
  assert.equal(payload.metrics.length, 1);
  assert.deepEqual(payload.metrics[0], {
    id: 'DISC-03',
    status: 'pass',
    earned: 0.5,
    browser: 'webkit',
    details: 'overflow=0',
  });
});

test('recordMetric rejects missing stable id or invalid status', () => {
  assert.ok(harness, 'helpers/metric-harness.mjs must exist');
  assert.throws(() => harness.recordMetric([], {status:'pass', earned:1}), /id/i);
  assert.throws(() => harness.recordMetric([], {id:'X', status:'wat', earned:1}), /status/i);
});
