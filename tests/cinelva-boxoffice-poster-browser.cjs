const { waitForLocalServer } = require('./helpers/local-server.cjs');
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const boxoffice = require('../data/boxoffice.json');
const assert = require('node:assert/strict');

function normalizeTitle(value) { return String(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''); }

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
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const backendQueries = [];
    let backendAvailable = false;
    await page.route('https://backend-one-gray-94.vercel.app/**', async route => {
      const url = new URL(route.request().url());
      const title = url.searchParams.get('q') || '';
      backendQueries.push(title);
      if (!backendAvailable) return route.abort();
      const id = String([...title].reduce((value, char) => (value * 31 + char.codePointAt(0)) % 2000000000, 17) + 1);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ movies: [{ id, tmdbId: id, title, poster_path: '/fixture-boxoffice-poster.jpg' }] }) });
    });
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
      const title = (await firstCard.locator('.title').textContent()).trim();
      assert.equal(backendQueries.some(query => normalizeTitle(query) === normalizeTitle(title)), false, 'the nested static rankings catalog resolves the first box-office poster locally');
      await firstCard.locator('[data-box-placeholder]').waitFor({ state: 'visible' });
      const cards = page.locator('#grid [data-box-film]');
      const expected = [...boxoffice.all_time].sort((a, b) => (b.gross || 0) - (a.gross || 0));
      let priorGross = null;
      let priorRank = 0;
      for (let index = 0; index < await cards.count(); index += 1) {
        const card = cards.nth(index);
        await card.scrollIntoViewIfNeeded();
        await card.locator('[data-box-placeholder]').waitFor({ state: 'visible' });
        const title = (await card.locator('.title').textContent()).trim();
        assert.equal(title, expected[index].title, `box-office row ${index + 1} keeps its source title and order`);
        const gross = Number(expected[index].gross || 0);
        const rank = index === 0 || gross !== priorGross ? index + 1 : priorRank;
        assert.equal((await card.locator('.no').textContent()).trim(), `#${rank}`, `box-office row ${index + 1} displays the correct competition rank`);
        priorGross = gross;
        priorRank = rank;
        const href = new URL(await card.locator('a.rankCard').getAttribute('href'), base);
        assert.equal(href.pathname, '/search.html', `box-office row ${index + 1} links to search`);
        const normalizeMovieTitle=value=>value.normalize('NFKC').toLocaleLowerCase('ja').replace(/[^\p{L}\p{N}]/gu,'');
        const expectedId=expected[index].tmdbId||expected[index].tmdb_id;
        if(expectedId)assert.equal(href.searchParams.get('id'),String(expectedId),`box-office row ${index+1} links with the correct TMDB ID`);
        else assert.equal(normalizeMovieTitle(href.searchParams.get('search')),normalizeMovieTitle(expected[index].title),`box-office row ${index+1} links with the right title`);
        await page.waitForTimeout(10);
        assert.equal(await card.locator('img[data-box-poster]:not([hidden])').evaluateAll(images => images.some(img => img.complete && img.naturalWidth === 0)), false, 'failed poster requests never leave a visible broken image');
      }

      backendAvailable = true;
      backendQueries.length = 0;
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelectorAll('#grid [data-box-film]').length === 100);
      await page.waitForFunction(() => {
        const cards = [...document.querySelectorAll('#grid [data-box-film]')];
        return cards.length === 100 && cards.every(card => card.querySelector('.cinelva-rate-button') && card.querySelector('.cinelva-bookmark-button'));
      }, { timeout: 30000 });
      const controls = await page.locator('#grid [data-box-film]').evaluateAll(cards => ({
        count: cards.length,
        missingReview: cards.filter(card => !card.querySelector('.cinelva-rate-button')).length,
        missingBookmark: cards.filter(card => !card.querySelector('.cinelva-bookmark-button')).length
      }));
      assert.deepEqual(controls, { count: 100, missingReview: 0, missingBookmark: 0 }, 'all 100 box-office films expose review and bookmark controls when catalog lookups succeed');
      const domesticExpected = expected.filter(row => row.region === '邦画').length;
      await page.locator('[data-box-region="国内"]').click();
      assert.equal(await page.locator('#grid [data-box-film]').count(), domesticExpected, 'the domestic filter returns exactly the source domestic rows');
      assert.ok(await page.locator('[data-box-region="国内"]').evaluate(el => el.classList.contains('active')), 'the selected domestic filter is visibly active');
      const year = Object.keys(boxoffice.by_year).sort((a, b) => Number(b) - Number(a))[0];
      await page.locator(`[data-box-era="${year}"]`).click();
      const expectedYearCount = boxoffice.by_year[year].filter(row => row.region === '邦画').length;
      assert.equal(await page.locator('#grid [data-box-film]').count(), expectedYearCount, `the ${year} year filter combines correctly with the domestic region`);
      await page.locator('[data-box-region="すべて"]').click();
      assert.equal(await page.locator('#grid [data-box-film]').count(), boxoffice.by_year[year].length, 'resetting region preserves the selected year filter');
    }
    console.log('Box-office poster fallback passed at 390px and 1280px with image/API requests unavailable.');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
