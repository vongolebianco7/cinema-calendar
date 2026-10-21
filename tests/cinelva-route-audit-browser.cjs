const { waitForLocalServer } = require('./helpers/local-server.cjs');
const { assertTextContrast } = require('./helpers/text-contrast.cjs');
'use strict';
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const playwright = require('playwright');
const browserName = process.env.CINELVA_BROWSER || 'chromium';
const browserType = playwright[browserName];
assert.ok(['chromium', 'webkit'].includes(browserName) && browserType, `unsupported browser: ${browserName}`);

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
  assert.equal(routes.length, 30, 'route audit covers all current non-Ocean HTML pages');

  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
  let browser;
  const pageErrors = [];
  const navigationCancellationWarnings = [];
  const localAssetFailures = [];
  const report = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    manifest: 'quality/route-manifest.json',
    matrix: {
      viewports: manifest.audit_matrix.viewports,
      themes: manifest.audit_matrix.themes,
      browser: browserName
    },
    expected_page_loads: routes.length * manifest.audit_matrix.viewports.length * 2,
    status: 'running',
    results: [],
    page_errors: pageErrors,
    navigation_cancellation_warnings: navigationCancellationWarnings,
    local_asset_failures: localAssetFailures
  };
  try {
    await waitForLocalServer(port);

    browser = await browserType.launch({ headless: true });
    let checked = 0;
    for (const width of manifest.audit_matrix.viewports) {
      for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({ viewport: { width, height: 844 } });
        await context.addInitScript(value => localStorage.setItem('cinelva-theme-v1', value), theme);
        await context.route('https://backend-one-gray-94.vercel.app/**', route => route.abort());
        // Exercise attribution artwork failure without changing source or API attribution.
        await context.route('https://www.themoviedb.org/assets/2/v4/logos/v2/**', route => route.abort());
        for (const route of routes) {
        // Each matrix cell audits one document. A fresh page releases the previous
        // dashboard and its pending work before WebKit loads the next route.
        const page = await context.newPage();
        page.on('pageerror', error => {
          const detail = `${width}px ${theme} ${page.url()}: ${error.message}`;
          // WebKit reports canceled in-flight fetches from the outgoing document
          // as page errors during intentional route navigation. Keep this
          // evidence separate; other runtime exceptions remain release blockers.
          if (browserName === 'webkit' && /due to access control checks\.?$/.test(error.message)) {
            navigationCancellationWarnings.push(detail);
          } else {
            pageErrors.push(detail);
          }
        });
        page.on('response', response => {
          const request = response.request();
          const localAsset = response.url().startsWith(`${base}/`) && ['document', 'script', 'stylesheet', 'image', 'font'].includes(request.resourceType());
          if (localAsset && response.status() >= 400) localAssetFailures.push(`${width}px ${theme} ${response.status()} ${response.url()}`);
        });

          try {
          const response = await page.goto(`${base}/${route}`, { waitUntil: 'domcontentloaded' });
          assert.ok(response && response.ok(), `${route} responds successfully at ${width}px in ${theme} mode`);
          // A legacy route may replace its URL during document load. Wait for the
          // concierge destination rather than sampling the outgoing document.
          if (route === 'cinelva/agent.html') {
            await page.waitForURL(url =>
              url.pathname.endsWith('/cinelva/discover.html') &&
              url.searchParams.get('mode') === 'concierge',
              { timeout: 15000, waitUntil: 'commit' }
            );
            // The correct redirect destination is asserted above. WebKit
            // occasionally reports an internal error while waiting for a
            // legacy page's load event after a location.replace navigation.
            // The theme/main-content assertions below confirm readiness.
          }
          await page.waitForFunction(expected => document.documentElement.dataset.theme === expected, theme);
          await page.waitForFunction(() => (document.querySelector('main')?.textContent.trim().length || 0) > 10);
          // Theme controls mount at DOMContentLoaded. A redirected WebKit document
          // can expose its early html theme and main before the later meta tag is updated.
          await page.waitForFunction(() => Boolean(document.querySelector('.cinelvaTheme select')));
          await assertTextContrast(page,[
            '.hero a.specialLink','.providerCheck','.movieGridSort label',
            '#summaryView .cs-donut-global-mode>span',
            'body:has(#events) .tabs a[aria-current="page"]',
            'body:has(#events) .filmTitle','body:has(#events) .filmMeta',
            'body:has(#events) .eventGroup .date','body:has(#events) .eventGroup a.source',
            'body:has(#events) .notice','body:has(#data-status) .card a'
          ],`${route} ${width}px ${theme}`);
          if(theme==='light') {
            const backings=await page.locator('.brand img').evaluateAll(images=>images.map(img=>getComputedStyle(img).backgroundColor));
            assert.ok(backings.every(color=>color!=='rgba(0, 0, 0, 0)'),`${route}: secondary logo must have a visible backing`);
          }
          if(route==='credits.html') {
            await page.locator('.tmdbLogoFallback').waitFor({state:'visible'});
            assert.equal(await page.locator('.tmdbLogo').isVisible(),false,'failed attribution artwork must not display a broken image icon');
            assert.equal(await page.locator('.tmdbLogoFallback').innerText(),'TMDB');
          }
          if(route==='theaters.html') {
            await page.locator('#grid>.empty').waitFor({state:'visible'});
            const layout=await page.locator('#grid').evaluate(grid=>({
              columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,
              width:grid.getBoundingClientRect().width,
              emptyWidth:grid.querySelector('.empty').getBoundingClientRect().width
            }));
            assert.equal(layout.columns,width<=520?1:width<=720?2:3,'cinema directory retains its own responsive columns');
            assert.ok(layout.emptyWidth>=layout.width-2,'cinema empty state spans the directory width');
          }
          const state = await page.evaluate(() => ({
            title: document.title.trim(),
            textLength: document.querySelector('main')?.textContent.trim().length || 0,
            colorScheme: document.documentElement.style.colorScheme,
            themeColor: document.querySelector('meta[name="theme-color"]')?.content || '',
            documentHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
          }));
          assert.ok(state.title, `${route} has a document title`);
          assert.ok(state.textLength > 10, `${route} has visible main content`);
          assert.equal(state.colorScheme, theme, `${route} applies the ${theme} color scheme`);
          assert.equal(state.themeColor, theme === 'dark' ? '#0a0c0f' : '#f8f6f1', `${route} updates its browser theme color`);
          // Capture the full scrollable document in the mobile/light evidence.
          // A viewport-only image cannot support review of lower sections or footers.
          let screenshot = null;
          if (width === 390 && theme === 'light') {
            const slug = route.replace(/[^a-z0-9.-]+/gi, '-');
            const relative = path.join('screenshots', browserName, `${slug}.png`);
            const destination = path.join(root, 'artifacts', 'route-audit', relative);
            fs.mkdirSync(path.dirname(destination), { recursive: true });
            await page.screenshot({ path: destination, fullPage: true, animations: 'disabled' });
            screenshot = relative.split(path.sep).join('/');
          }
          report.results.push({
            route,
            screenshot,
            screenshot_scope: screenshot ? 'full_document' : null,
            browser: browserName,
            viewport: { width, height: 844 },
            theme,
            http_status: response.status(),
            resolved_url: page.url().replace(base, ''),
            ...state
          });
          checked++;
          } catch (error) {
            // Preserve a useful screenshot of the failing route even when the
            // browser assertions abort before the report row is appended.
            const slug = route.replace(/[^a-z0-9.-]+/gi, '-');
            const relative = path.join('screenshots', browserName,
              `failure-${width}-${theme}-${slug}.png`);
            const destination = path.join(root, 'artifacts', 'route-audit', relative);
            fs.mkdirSync(path.dirname(destination), { recursive: true });
            await page.screenshot({ path: destination, fullPage: false, timeout: 5000 }).catch(() => {});
            report.failure_context = {
              route, browser: browserName, viewport_width: width, theme,
              screenshot: relative.split(path.sep).join('/')
            };
            throw error;
          } finally {
            await page.close();
          }
        }
        await context.close();
      }
    }
    assert.deepEqual(pageErrors, [], 'routes load without uncaught browser JavaScript exceptions');
    assert.deepEqual(localAssetFailures, [], 'routes load without missing local documents, scripts, stylesheets, images, or fonts');
    report.status = 'passed';
    console.log(`Cinelva ${browserName} route audit passed: ${routes.length} routes × ${manifest.audit_matrix.viewports.length} viewports × 2 themes (${checked} page loads), no uncaught page errors or missing local assets.`);
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
    fs.writeFileSync(path.join(evidenceDir, `report-${browserName}.json`), `${JSON.stringify(report, null, 2)}\n`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
