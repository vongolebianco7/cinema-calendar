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
  assert.match(workflow, /rendered-posters:\n\s+if: github\.event_name == 'workflow_dispatch' \|\| github\.event_name == 'push'/);
  assert.doesNotMatch(workflow, /NODE_PATH:/);
  assert.doesNotMatch(workflow, /cd "\$RUNNER_TEMP\/cinelva-production-acceptance"/);
});

test('synthetic My Cinelva poster fixture is fulfilled locally for deterministic browser checks at any TMDB image size', () => {
  assert.match(script, /pageContext\.route\(url => url\.hostname === 'image\.tmdb\.org', async imageRoute =>/);
  assert.match(script, /serviceWorkers: 'block'/);
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

test('post-merge production audit runs only when acceptance files change on main', () => {
  const pushTrigger = workflow.split('  pull_request:')[0];
  assert.match(pushTrigger, /  push:\n    branches: \[main\]\n    paths:/);
  for (const path of [
    'scripts/production-poster-acceptance.mjs',
    'scripts/production-poster-acceptance-metrics.mjs',
    'tests/cinelva-production-poster-acceptance-contract.test.cjs',
    'tests/cinelva-production-poster-acceptance-metrics.test.mjs',
    '.github/workflows/production-poster-acceptance.yml'
  ]) assert.ok(pushTrigger.includes(`      - ${path}`), `missing main push filter for ${path}`);
});

test('poster audit triggers lazy images then waits once with a bounded page-wide window', () => {
  assert.match(script, /scrollIntoView\(\{ block: 'center' \}\)/);
  assert.match(script, /await page\.waitForFunction\(\(\) => \[\.\.\.document\.images\]/);
  assert.ok(script.includes('every(image => image.complete), null, { timeout: 15000 }'));
  assert.doesNotMatch(script, /waitForFunction\(element => element\.complete, handle, \{ timeout: 2500 \}\)/);
  assert.doesNotMatch(script, /await page\.waitForTimeout\(1200\)/);
});

test('only isolated synthetic fixture routes force lazy images to eager loading', () => {
  assert.match(script, /await settleImages\(page, \{ forceEager: Boolean\(route\.fixture\) \}\)/);
  assert.match(script, /if \(eager && element\.loading === 'lazy'\) element\.loading = 'eager'/);
});

test('production poster acceptance reports source-level missing rows separately from rendered image failures', () => {
  assert.match(script, /fetch\('\/data\/boxoffice\.json', \{ cache: 'no-store' \}\)/);
  for (const field of ['total_rows', 'poster_rows', 'single_poster_rows', 'grouped_poster_rows', 'missing_poster_rows', 'missing_tmdb_id_rows', 'missing_by_year', 'missing_examples']) {
    assert.match(script, new RegExp(field));
  }
  assert.match(script, /dataset_coverage: datasetCoverage/);
  assert.match(script, /invalid row in/);
});

test('production poster acceptance audits split films as separate rows with their own poster and unchanged shared gross', () => {
  assert.match(script, /const splitBoxOfficeFixtures = \[/);
  assert.match(script, /auditSplitBoxOffice\(context, fixture\)/);
  for (const title of ['リング2', '死国', 'リング0 バースデイ', 'ISOLA 多重人格少女']) {
    assert.ok(script.includes(`title: '${title}'`), `missing split fixture for ${title}`);
  }
  assert.match(script, /img\[data-box-poster\]/);
  assert.match(script, /compound_posters/);
  assert.match(script, /shared gross changed/);
  assert.match(script, /not rendered as its own row/);
  assert.match(script, /regressed to compound poster rendering/);
  assert.doesNotMatch(script, /const compoundBoxOfficeFixtures = \[/);
  assert.doesNotMatch(script, /auditCompoundBoxOffice\(context, fixture\)/);
});
