'use strict';
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { chromium } = require('playwright');

async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

(async () => {
  const root = path.resolve(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'quality', 'route-manifest.json'), 'utf8'));
  const routes = manifest.routes.map(route => route.path).sort();
  assert.equal(routes.length, 29, 'route audit covers all current non-Ocean HTML pages');

  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
  let browser;
  const pageErrors = [];
  const localAssetFailures = [];
  const report = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    manifest: 'quality/route-manifest.json',
    matrix: manifest.audit_matrix,
    expected_page_loads: routes.length * 4,
    status: 'running',
    results: [],
    page_errors: pageErrors,
    local_asset_failures: localAssetFailures
  };
  try {
    await new Promise((resolve, reject) => {
      const deadline = Date.now() + 10000;
      const poll = async () => {
        try {
          const response = await fetch(base);
          await response.arrayBuffer();
          if (response.ok) return resolve();
        } catch (_) {}
        if (Date.now() > deadline) return reject(new Error('local static server did not start'));
        setTimeout(poll, 100);
      };
      poll();
    });

    browser = await chromium.launch({ headless: true });
    let checked = 0;
    for (const width of [390, 1280]) {
      for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({ viewport: { width, height: 844 } });
        await context.addInitScript(value => localStorage.setItem('cinelva-theme-v1', value), theme);
        await context.route('https://backend-one-gray-94.vercel.app/**', route => route.abort());
        const page = await context.newPage();
        page.on('pageerror', error => pageErrors.push(`${width}px ${theme} ${page.url()}: ${error.message}`));
        page.on('response', response => {
          const request = response.request();
          const localAsset = response.url().startsWith(`${base}/`) && ['document', 'script', 'stylesheet', 'image', 'font'].includes(request.resourceType());
          if (localAsset && response.status() >= 400) localAssetFailures.push(`${width}px ${theme} ${response.status()} ${response.url()}`);
        });

        for (const route of routes) {
          const response = await page.goto(`${base}/${route}`, { waitUntil: 'domcontentloaded' });
          assert.ok(response && response.ok(), `${route} responds successfully at ${width}px in ${theme} mode`);
          await page.waitForFunction(expected => document.documentElement.dataset.theme === expected, theme);
          const state = await page.evaluate(() => ({
            title: document.title.trim(),
            textLength: document.querySelector('main')?.textContent.trim().length || 0,
            colorScheme: document.documentElement.style.colorScheme,
            themeColor: document.querySelector('meta[name="theme-color"]')?.content || ''
          }));
          assert.ok(state.title, `${route} has a document title`);
          assert.ok(state.textLength > 10, `${route} has visible main content`);
          assert.equal(state.colorScheme, theme, `${route} applies the ${theme} color scheme`);
          assert.equal(state.themeColor, theme === 'dark' ? '#0a0c0f' : '#f8f6f1', `${route} updates its browser theme color`);
          report.results.push({
            route,
            viewport: { width, height: 844 },
            theme,
            http_status: response.status(),
            ...state
          });
          checked++;
        }
        await context.close();
      }
    }
    assert.deepEqual(pageErrors, [], 'routes load without uncaught browser JavaScript exceptions');
    assert.deepEqual(localAssetFailures, [], 'routes load without missing local documents, scripts, stylesheets, images, or fonts');
    report.status = 'passed';
    console.log(`CINELVA route audit passed: ${routes.length} routes × 2 viewports × 2 themes (${checked} page loads), no uncaught page errors or missing local assets.`);
  } catch (error) {
    report.status = 'failed';
    report.failure = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
    report.completed_page_loads = report.results.length;
    report.completed_at = new Date().toISOString();
    const evidenceDir = path.join(root, 'artifacts', 'route-audit');
    fs.mkdirSync(evidenceDir, { recursive: true });
    fs.writeFileSync(path.join(evidenceDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
