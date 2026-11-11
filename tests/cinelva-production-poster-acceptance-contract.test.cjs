const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const script = fs.readFileSync('scripts/production-poster-acceptance.mjs', 'utf8');
const workflow = fs.readFileSync('.github/workflows/production-poster-acceptance.yml', 'utf8');

test('production poster acceptance can use a system Chromium executable locally', () => {
  assert.match(script, /CINELVA_BROWSER_EXECUTABLE/);
  assert.match(script, /executablePath/);
});

test('artifact directory uses path.dirname for relative and absolute output paths', () => {
  assert.match(script, /import path from 'node:path'/);
  assert.match(script, /path\.dirname\(output\)/);
});

test('workflow installs Playwright where the ESM script can resolve it', () => {
  assert.match(workflow, /npm install --no-save --no-package-lock playwright@1\.59\.0/);
  assert.match(workflow, /cinelva-production-poster-acceptance-metrics\.test\.mjs/);
  assert.match(workflow, /contract:\n\s+runs-on: ubuntu-latest/);
  assert.match(workflow, /rendered-posters:\n\s+if: github\.event_name == 'workflow_dispatch'/);
  assert.doesNotMatch(workflow, /NODE_PATH:/);
  assert.doesNotMatch(workflow, /cd "\$RUNNER_TEMP\/cinelva-production-acceptance"/);
});
