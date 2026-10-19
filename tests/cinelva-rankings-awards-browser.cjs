'use strict';
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const { waitForLocalServer } = require('./helpers/local-server.cjs');
const { chromium, webkit } = require('playwright');

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
    await waitForLocalServer(port);
    const browserName = process.env.CINELVA_BROWSER === 'webkit' ? 'webkit' : 'chromium';
    browser = await (browserName === 'webkit' ? webkit : chromium).launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const apiCalls = [];
    await page.route('https://backend-one-gray-94.vercel.app/api/movies?**', async route => {
      const url = new URL(route.request().url());
      const title = url.searchParams.get('q') || '';
      apiCalls.push(title);
      const id = String([...title].reduce((value, char) => (value * 31 + char.codePointAt(0)) % 2000000000, 17) + 1);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ movies: [{ id, tmdbId: id, title, poster_path: '/fixture-award-poster.jpg' }] }) });
    });
    await page.route('https://image.tmdb.org/**', route => route.abort());

    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      apiCalls.length = 0;
      await page.setViewportSize(viewport);
      await page.goto(`${base}/rankings.html?axis=awards`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelectorAll('.awardCard').length >= 100);
      await page.waitForFunction(() => {
        const cards = [...document.querySelectorAll('.awardCard')];
        return cards.length > 100 && cards.every(card => card.querySelector('.cinelva-rate-button') && card.querySelector('.cinelva-bookmark-button'));
      }, { timeout: 30000 });
      await page.waitForFunction(() => [...document.querySelectorAll('.awardCard .awardPoster')].every(img => img.complete), { timeout: 15000 });

      const result = await page.locator('.awardCard').evaluateAll(cards => ({
        count: cards.length,
        missingActions: cards.filter(card => !card.querySelector('.cinelva-rate-button') || !card.querySelector('.cinelva-bookmark-button')).length,
        missingPosterFallback: cards.filter(card => !card.querySelector('.awardPosterPlaceholder')).length,
        hiddenPosterFallback: cards.filter(card => card.querySelector('.awardPosterPlaceholder').hidden).length,
        dimensions: cards.slice(0, 12).map(card => {
          const poster = card.querySelector('.awardPoster');
          const fallback = card.querySelector('.awardPosterPlaceholder');
          const target = poster && !poster.hidden ? poster : fallback;
          const cardRect = card.getBoundingClientRect();
          const posterRect = target.getBoundingClientRect();
          return { card: cardRect.width, poster: posterRect.width, height: posterRect.height };
        })
      }));
      assert.ok(result.count >= 100, `awards view renders at least 100 cards at ${viewport.width}px`);
      assert.equal(result.missingActions, 0, 'every award movie exposes the shared review and bookmark actions');
      assert.equal(result.missingPosterFallback, 0, 'every award movie has an explicit poster fallback');
      assert.equal(result.hiddenPosterFallback, 0, 'failed poster requests leave the fallback visible');
      for (const size of result.dimensions) {
        assert.ok(size.poster >= size.card * 0.85, `poster fills the award card at ${viewport.width}px (${size.poster}/${size.card})`);
        assert.ok(size.height > size.poster, 'poster preserves portrait proportions');
      }
      const perTitle = new Map();
      for (const title of apiCalls) perTitle.set(title, (perTitle.get(title) || 0) + 1);
      assert.equal(Math.max(0, ...perTitle.values()), 1, 'concurrent poster and shared-control hydration share one movie lookup per title');
      console.log(`Award cards passed at ${viewport.width}px: ${result.count} cards, all controls/fallbacks, poster geometry, and ${apiCalls.length} non-duplicated lookups.`);
    }
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
