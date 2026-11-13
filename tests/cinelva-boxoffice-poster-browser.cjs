const { waitForLocalServer } = require('./helpers/local-server.cjs');
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const assert = require('node:assert/strict');
const boxoffice=JSON.parse(require('node:fs').readFileSync('data/boxoffice.json','utf8'));
const boxRows=boxoffice.all_time;
const compoundRows=[
  {year:'1999',title:'リング2 / 死国',posterTitles:['リング 2','死国'],gross:'21.0億円',rank:7},
  {year:'2000',title:'リング0 バースデイ / ISOLA 多重人格少女',posterTitles:['リング０ バースデイ','ISOLA 多重人格少女'],gross:'16.0億円',rank:25},
];

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
    const executablePath = process.env.CINELVA_BROWSER_EXECUTABLE;
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', error => console.error('Box-office browser page error:', error.stack || error.message));
    const backendQueries = [];
    await page.route('https://backend-one-gray-94.vercel.app/**', route => { backendQueries.push(new URL(route.request().url()).searchParams.get('q') || ''); return route.abort(); });
    await page.route('https://image.tmdb.org/**', route => route.abort());

    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}/rankings.html?axis=boxoffice`, { waitUntil: 'domcontentloaded' });
      try {
        await page.waitForFunction(() => document.querySelectorAll('#grid [data-box-film]').length >= 100);
      } catch (error) {
        const diagnostics = await page.evaluate(() => ({
          url: location.href,
          title: document.title,
          boxFilmCount: document.querySelectorAll('#grid [data-box-film]').length,
          gridText: document.querySelector('#grid')?.innerText?.slice(0, 300) || '',
          scripts: [...document.scripts].map(script => script.src).filter(Boolean),
        }));
        console.error('Box-office browser diagnostics:', JSON.stringify(diagnostics));
        throw error;
      }
      const firstCard = page.locator('#grid [data-box-film]').first();
      await firstCard.scrollIntoViewIfNeeded();
      await firstCard.locator('[data-box-placeholder]').waitFor({ state: 'visible' });
      assert.equal((await firstCard.locator('.title').textContent()).trim().length > 0, true, 'poster fallback keeps the film title visible');
      assert.equal(await firstCard.locator('[data-box-placeholder]').evaluate(el => getComputedStyle(el, '::after').content), '"画像なし"');
      await firstCard.locator('img[data-box-poster][src]').waitFor({ state: 'attached', timeout: 5000 });
      const title = (await firstCard.locator('.title').textContent()).trim();
      assert.ok(backendQueries.filter(query => normalizeTitle(query) === normalizeTitle(title)).length<=2, 'failed artwork retries are bounded');
      await firstCard.locator('[data-box-placeholder]').waitFor({ state: 'visible' });
      const cards = page.locator('#grid [data-box-film]');
      for (let index = 0; index < await cards.count(); index += 1) {
        const card = cards.nth(index);
        const title=await card.getAttribute('data-box-film');
        const row=boxRows.find(x=>x.title===title);assert.ok(row,'displayed film has a source row');
        const expectedRank=boxRows.filter(x=>Number(x.gross)>Number(row.gross)).length+1;
        assert.equal((await card.locator('.no').innerText()).trim(),'#'+expectedRank,'all 100 source amounts retain competition ranks');
        await card.scrollIntoViewIfNeeded();
        await card.locator('[data-box-placeholder]').waitFor({ state: 'visible' });
        assert.ok((await card.locator('.title').textContent()).trim(), 'every source row keeps its film title visible');
        const visiblePostersWithoutSource = await card.locator('img[data-box-poster]:not([hidden])').evaluateAll(images => images.filter(image => !/^https?:/.test(image.getAttribute('src') || '')).length);
        assert.equal(visiblePostersWithoutSource, 0, 'a missing poster keeps its placeholder visible instead of exposing an empty image');
        await page.waitForTimeout(10);
        assert.equal(await card.locator('img[data-box-poster]:not([hidden])').evaluateAll(images => images.some(img => img.complete && img.naturalWidth === 0)), false, 'failed poster requests never leave a visible broken image');
      }

      for (const fixture of compoundRows) {
        // Isolate each fixture's API observation from earlier pages and viewports.
        backendQueries.length = 0;
        await page.goto(`${base}/rankings.html?axis=boxoffice&boxYear=${fixture.year}`, { waitUntil: 'domcontentloaded' });
        const groupedCard = page.locator('#grid .rankReviewWrap').filter({ hasText: fixture.title });
        await groupedCard.waitFor({ state: 'visible' });
        const posterSet = groupedCard.locator('[data-box-poster-set]');
        await posterSet.waitFor({ state: 'visible' });
        const posters = groupedCard.locator('img[data-box-group-poster]');
        assert.equal(await posters.count(), 2, `${fixture.year} source row renders both distinct film posters`);
        assert.deepEqual(await posters.evaluateAll(images => images.map(image => image.alt)), fixture.posterTitles);
        assert.deepEqual(await posters.evaluateAll(images => images.map(image => new URL(image.src).hostname)), ['image.tmdb.org','image.tmdb.org']);
        const posterTiles = groupedCard.locator('.boxPosterTile');
        await posterTiles.first().scrollIntoViewIfNeeded();
        await posterTiles.last().scrollIntoViewIfNeeded();
        await groupedCard.locator('.boxPosterTileFallback:not([hidden])').first().waitFor({ state: 'visible' });
        assert.equal(await groupedCard.locator('.boxPosterTileFallback:not([hidden])').count(), 2, 'failed artwork uses one placeholder per title');
        assert.match(await groupedCard.locator('.boxGroupNote').innerText(), /収入は合算/);
        assert.match(await groupedCard.locator('.meta').filter({ hasText: '億円' }).innerText(), new RegExp(fixture.gross));
        assert.equal((await groupedCard.locator('.no').innerText()).trim(), `#${fixture.rank}`, 'source competition rank is unchanged');
        assert.equal(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)), 0, 'grouped artwork stays within the viewport');
        await page.waitForTimeout(50);
        const groupedQueries = backendQueries.filter(query => normalizeTitle(query) === normalizeTitle(fixture.title));
        assert.equal(groupedQueries.length, 0, `grouped titles never trigger single-film identity lookup: ${JSON.stringify(groupedQueries)}`);
      }
    }
    console.log('Box-office single-row fallback and multi-poster compound rendering passed at 390px and 1280px with external image/API requests unavailable.');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
