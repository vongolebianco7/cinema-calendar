'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'quality', 'route-manifest.json'), 'utf8'));
const inventory = [...fs.readdirSync(root).filter(file => file.endsWith('.html')),...fs.readdirSync(path.join(root, 'cinelva')).filter(file => file.endsWith('.html')).map(file => `cinelva/${file}`),'my-cinelva/index.html'].sort();

test('route manifest covers every active non-Ocean HTML route exactly once', () => {
  const routes = manifest.routes.map(route => route.path).sort();
  assert.deepEqual(routes, inventory);assert.equal(new Set(routes).size, routes.length);assert.equal(routes.length, 30);assert.equal(routes.some(route => /ocean/i.test(route)), false);
});

test('every route declares ownership, counts, CTA, sources and audit defaults', () => {
  assert.deepEqual(manifest.audit_matrix.viewports,[375,390,768,1280]);assert.deepEqual(manifest.audit_matrix.themes,['light','dark']);assert.deepEqual(manifest.audit_matrix.browsers,['chromium','webkit']);assert.match(manifest.defaults.brand_component,/Cinelva/);
  for(const route of manifest.routes){for(const field of ['path','surface','purpose','data_owner','count_contract','primary_cta']){assert.equal(typeof route[field],'string',`${route.path}: ${field}`);assert.ok(route[field].trim(),`${route.path}: ${field}`)}assert.ok(Array.isArray(route.source_refs)&&route.source_refs.length,`${route.path}: source_refs`);assert.equal(fs.existsSync(path.join(root,route.path)),true,route.path)}
});

test('browser route audit preserves machine-readable evidence in CI', () => {
  const browserAudit = fs.readFileSync(path.join(root, 'tests', 'cinelva-route-audit-browser.cjs'), 'utf8');
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'validate-frontend.yml'), 'utf8');
  assert.match(browserAudit, /artifacts[\\/'].*route-audit/);
  assert.match(browserAudit, /JSON\.stringify\(report/);
  assert.match(browserAudit, /CINELVA_BROWSER/);
  assert.match(browserAudit, /report-\$\{browserName\}\.json/);
  assert.match(browserAudit, /waitForFunction\([^\n]*querySelector\('main'\)/);
  assert.match(workflow, /name: cinelva-route-audit/);
  assert.match(workflow, /path: artifacts\/route-audit\//);
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /CINELVA_BROWSER=webkit[^\n]*cinelva-route-audit-browser\.cjs/);
});

test('route audit preserves bounded visual proof and failure screenshots', () => {
  const audit = fs.readFileSync(path.join(root, 'tests/cinelva-route-audit-browser.cjs'), 'utf8');
  assert.match(audit, /width === 390 && theme === 'light'/);
  assert.match(audit, /page\.screenshot\(/);
  assert.match(audit, /failure_context/);
  assert.match(audit, /screenshot: relative\.split\(path\.sep\)/);
});
