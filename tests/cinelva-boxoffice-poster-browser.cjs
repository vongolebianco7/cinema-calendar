const { waitForLocalServer } = require('./helpers/local-server.cjs');
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const assert = require('node:assert/strict');
const boxoffice=JSON.parse(require('node:fs').readFileSync('data/boxoffice.json','utf8'));
const boxRows=boxoffice.all_time;
const compoundRows=[
  {year:'1999',films:[{title:'リング2',poster:'/mZrniHCiAmCRD9t0eTgLJvQrFwe.jpg'},{title:'死国',poster:'/nr9an9wscTJQxKopJ0YO50WsT43.jpg'}],gross:'21.0億円'},
  {year:'2000',films:[{title:'リング0 バースデイ',poster:'/x0ZrQmfBHgF0VA8en7K6tpnDGIT.jpg'},{title:'ISOLA 多重人格少女',poster:'/l5mBFunpO5IiMQNvcyaPm8tB3xo.jpg'}],gross:'16.0億円'},
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
      await page.locator('#boxRegionChips [data-box-region="すべて"]').waitFor({ state: 'visible' });
      await page.locator('#boxRegionChips [data-box-region="すべて"]').click();
      await page.locator('#boxEraChips [data-box-era="歴代"]').click();
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
        await page.goto(`${base}/rankings.html?axis=boxoffice`, { waitUntil: 'domcontentloaded' });
        const yearFilter = page.locator(`#boxEraChips [data-box-era="${fixture.year}"]`);
        await yearFilter.waitFor({ state: 'visible' });
        await yearFilter.click();
        const cards = page.locator('#grid [data-box-film]');
        const matchingCards = await cards.evaluateAll((elements, titles) => titles.map(title => elements.findIndex(element => element.getAttribute('data-box-film') === title)), fixture.films.map(film => film.title));
        assert.ok(matchingCards.every(index => index >= 0), `${fixture.year} renders each billed film as its own row`);
        const observedPosters = [];
        for (const [filmIndex, film] of fixture.films.entries()) {
          const card = cards.nth(matchingCards[filmIndex]);
          await card.waitFor({ state: 'visible' });
          assert.equal((await card.locator('.title').innerText()).trim(), film.title);
          assert.match(await card.locator('.meta').filter({ hasText: '億円' }).innerText(), new RegExp(fixture.gross));
          const poster = card.locator('img[data-box-poster]');
          await poster.waitFor({ state: 'attached' });
          const source = await poster.getAttribute('src');
          assert.ok(source?.endsWith(film.poster), `${film.title} uses its independent verified poster`);
          observedPosters.push(source);
        }
        assert.equal(new Set(observedPosters).size, fixture.films.length, `${fixture.year} uses a different poster for each film`);
        assert.equal(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)), 0, 'individual film rows stay within the viewport');
      }
    }
    console.log('Box-office single-row fallback and multi-poster compound rendering passed at 390px and 1280px with external image/API requests unavailable.');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
