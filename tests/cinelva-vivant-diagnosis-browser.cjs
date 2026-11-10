'use strict';
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const { waitForLocalServer } = require('./helpers/local-server.cjs');
const { chromium, webkit } = require('playwright');

(async () => {
  const socket = net.createServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { stdio: 'ignore' });
  let browser;
  try {
    await waitForLocalServer(port);
    const browserType = process.env.CINELVA_BROWSER === 'webkit' ? webkit : chromium;
    browser = await browserType.launch({ headless: true, ...(process.env.CINELVA_CHROMIUM_PATH && process.env.CINELVA_BROWSER !== 'webkit' ? { executablePath: process.env.CINELVA_CHROMIUM_PATH } : {}) });
    const context = await browser.newContext({ viewport: { width: 320, height: 844 } });
    const preserved = {
      'cinelva-library-records-v2': JSON.stringify({ '101': { id: '101', title: 'Existing viewing record', score: 4.2 } }),
      'cinemap-viewing-records-v1': JSON.stringify({ '202': { id: '202', title: 'Legacy viewing record' } }),
      'cinelva-want-to-watch-v1': JSON.stringify({ '303': true })
    };
    await context.addInitScript(values => { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value); }, preserved);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/vivant-diagnosis.html`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'VIVANT診断' }).waitFor();
    assert.match(await page.locator('.fanNote').innerText(), /非公式ファン企画/);
    for (let question = 0; question < 8; question++) {
      assert.equal(await page.locator('.choice').count(), 4);
      await page.locator('.choice').nth(question % 4).click();
      await page.locator('#nextButton').click();
    }
    await page.getByRole('heading', { name: '診断結果' }).waitFor();
    assert.equal(await page.locator('.movie').count(), 3);
    assert.equal(await page.locator('.identityBlock').count(), 2);
    const firstTitle = await page.locator('.movie h3').first().innerText();
    await page.locator('.movie .replace').first().click();
    assert.equal(await page.locator('.movie').count(), 3);
    assert.notEqual(await page.locator('.movie h3').allInnerTexts().then(titles => titles[0]), firstTitle);
    const saved = await page.evaluate(() => Object.fromEntries(['cinelva-library-records-v2','cinemap-viewing-records-v1','cinelva-want-to-watch-v1'].map(key => [key, localStorage.getItem(key)])));
    assert.deepEqual(saved, preserved, 'diagnosis leaves existing records, legacy records and bookmarks untouched');
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      assert.ok(layout.scrollWidth <= layout.width, `no horizontal page overflow at ${width}px: ${JSON.stringify(layout)}`);
    }
    assert.deepEqual(errors, [], 'no uncaught browser errors');
    console.log(`VIVANT diagnosis ${process.env.CINELVA_BROWSER || 'chromium'} 390px journey passed; 8 answers, 3 recommendations, replacement and saved-data preservation verified.`);
    await context.close();
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
