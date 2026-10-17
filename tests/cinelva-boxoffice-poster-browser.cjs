const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const assert = require('node:assert/strict');

async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

(async () => {
  const port = await freePort();
  const root = path.resolve(__dirname, '..');
  const server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
  let browser;
  try {
    const base = `http://127.0.0.1:${port}`;
    await new Promise((resolve, reject) => {
      const deadline = Date.now() + 10000;
      const poll = async () => {
        try { const response = await fetch(base); if (response.ok) return resolve(); } catch (_) {}
        if (Date.now() > deadline) return reject(new Error('local static server did not start'));
        setTimeout(poll, 100);
      };
      poll();
    });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    let backendCalls = 0;
    await page.route('https://backend-one-gray-94.vercel.app/**', route => { backendCalls += 1; return route.abort(); });
    await page.route('https://image.tmdb.org/**', route => route.abort());

    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}/rankings.html?axis=boxoffice`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelectorAll('#grid [data-box-film]').length >= 100);
      const firstCard = page.locator('#grid [data-box-film]').first();
      await firstCard.scrollIntoViewIfNeeded();
      await firstCard.locator('[data-box-placeholder]').waitFor({ state: 'visible' });
      assert.equal((await firstCard.locator('.title').textContent()).trim().length > 0, true, 'poster fallback keeps the film title visible');
      assert.equal(await firstCard.locator('[data-box-placeholder]').evaluate(el => getComputedStyle(el, '::after').content), '"画像なし"');
      await firstCard.locator('img[data-box-poster][src]').waitFor({ state: 'attached', timeout: 5000 });
      assert.equal(backendCalls, 0, 'the nested static rankings catalog resolves the first box-office poster locally');
      await firstCard.locator('[data-box-placeholder]').waitFor({ state: 'visible' });
      await page.waitForTimeout(300);
      assert.equal(await page.locator('#grid img[data-box-poster]:not([hidden])').evaluateAll(images => images.some(img => img.complete && img.naturalWidth === 0)), false, 'failed poster requests never leave a visible broken image');
    }
    console.log('Box-office poster fallback passed at 390px and 1280px with image/API requests unavailable.');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
