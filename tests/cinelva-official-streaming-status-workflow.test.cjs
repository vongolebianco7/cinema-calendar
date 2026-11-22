'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('official feed refresh publishes candidate freshness without auto-publishing candidates', () => {
  const workflow = fs.readFileSync('.github/workflows/refresh-official-streaming.yml', 'utf8');
  const discovery = workflow.indexOf('python scripts/discover_streaming_announcements.py');
  const status = workflow.indexOf('node scripts/source-status.cjs --output data/source-status.json');
  const commit = workflow.indexOf('git add data/streaming-official-current.json');
  assert.ok(discovery >= 0 && status > discovery && commit > status);
  assert.match(workflow, /git add[^\n]*data\/streaming-announcement-candidates\.json[^\n]*data\/source-status\.json/);
  assert.doesNotMatch(
    workflow.slice(discovery, status),
    /import_official_streaming_snapshot|streaming_announcements\.json/,
    'discovered candidates must not enter the reviewed publication intake automatically',
  );
});
