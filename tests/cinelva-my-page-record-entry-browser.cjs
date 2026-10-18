const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const assert = require('node:assert/strict');
const CalendarContext = require('../js/calendar-context.js');

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
        try { const response = await fetch(base); await response.arrayBuffer(); if (response.ok) return resolve(); } catch (_) {}
        if (Date.now() > deadline) return reject(new Error('local static server did not start'));
        setTimeout(poll, 100);
      };
      poll();
    });
    const catalog = await fetch(`${base}/data/movies.json`).then(response => response.json());
    const movie = catalog.movies.find(row => row.id && row.title);
    assert.ok(movie, 'fixture has a movie with an ID and title');

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('https://backend-one-gray-94.vercel.app/**', route => route.abort());
    await page.goto(`${base}/search.html?id=${encodeURIComponent(movie.id)}&search=${encodeURIComponent(movie.title)}`, { waitUntil: 'domcontentloaded' });

    async function expectDirectReview(title) {
      const detailUrl = page.url();
      const recordButton = page.locator('#detail [data-detail-review]');
      await recordButton.waitFor({ state: 'visible', timeout: 15000 });
      await recordButton.click();
      await page.locator('.cinelva-rate-dialog').waitFor({ state: 'visible', timeout: 10000 });
      assert.equal(await page.locator('#cinelvaRateTitle').innerText(), title);
      assert.equal(page.url(), detailUrl, 'review opens directly without navigating away from detail');
      assert.equal(await page.locator('.cinelva-rate-dialog').getByRole('button', { name: '次へ', exact: true }).count(), 0, 'review has no next action');
      await page.locator('#cinelvaRateClose').click();
      await page.waitForFunction(() => !document.querySelector('.cinelva-rate-dialog')?.open);
    }
    await expectDirectReview(movie.title);

    const calendarHref = CalendarContext.detailHref({ id: movie.id, title: movie.title, date: '2026-10-17', event: 'streaming', service: 'Netflix' });
    await page.goto(`${base}/${calendarHref}`, { waitUntil: 'domcontentloaded' });
    await expectDirectReview(movie.title);

    await page.goto(`${base}/rankings.html?axis=rating`, { waitUntil: 'domcontentloaded' });
    const rankedMovie = page.locator('#grid .rankCard[href*="search.html?id="]').first();
    await rankedMovie.waitFor({ state: 'visible', timeout: 15000 });
    const rankedTitle = (await rankedMovie.locator('.title').textContent()).trim();
    await rankedMovie.click();
    await expectDirectReview(rankedTitle);
    console.log('Offline movie detail, calendar-context, and ranking open the shared review dialog directly at 390px.');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
