const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const script = fs.readFileSync('scripts/production-poster-acceptance.mjs', 'utf8');
const workflow = fs.readFileSync('.github/workflows/production-poster-acceptance.yml', 'utf8');

test('production poster acceptance can use a system Chromium executable locally', () => {
  assert.match(script, /CINELVA_BROWSER_EXECUTABLE/);
  assert.match(script, /executablePath/);
});

test('poster audit excludes intentional hidden placeholders and flags visible empty images', () => {
  assert.match(script, /img\[data-box-poster\]:not\(\[hidden\]\)/);
  assert.match(script, /image\.getAttribute\('src'\)\s*\|\|\s*''/);
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

test('synthetic My Cinelva poster fixture is fulfilled locally for deterministic browser checks at any TMDB image size', () => {
  assert.ok(script.includes('fixturePosterFilename'));
  assert.match(script, /url\.hostname === 'image\.tmdb\.org'.*url\.pathname\.endsWith/);
  assert.ok(script.includes('CINELVA AUDIT FIXTURE'));
  assert.match(script, /serviceWorkers: 'block'/);
  assert.match(script, /fixtureResponses === 0/);
});

test('production poster audit covers My Cinelva data tabs with isolated synthetic records', () => {
  for (const route of ['my-cinelva-records', 'my-cinelva-watchlist', 'my-cinelva-awards', 'my-cinelva-directors']) {
    assert.match(script, new RegExp(`name: '${route}'`));
  }
  assert.ok(script.includes('page.addInitScript'));
  assert.match(script, /cinelva-library-records-v2/);
  assert.match(script, /cinelva-want-to-watch-v1/);
  assert.ok(script.includes('fixture_used: Boolean(route.fixture)'));
});
