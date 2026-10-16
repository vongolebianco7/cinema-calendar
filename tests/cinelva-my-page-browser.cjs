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
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const directorsResponse = await fetch(`${base}/data/directors.json`);
    const directors = (await directorsResponse.json()).directors;
    const director = Object.values(directors)[0];
    const work = director.works[0];
    await context.addInitScript(({ key, film, directorName }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
        [String(film.id)]: { id: String(film.id), title: film.title, year: Number(film.year) === 2002 ? 2010 : (Number(film.year) || 2010), poster: film.poster, director: directorName, genres: ['SF'], countries: ['Japan'], region: 'Japan', rating: 4.5, watchedAt: '2026-04-12' },
        '900001': { id: '900001', title: 'Browser Test Film', year: 2002, director: directorName, genres: ['SF', 'Crime'], region: '日本', rating: 0, watchedAt: '2025-04-15' },
      }));
    }, { key: 'cinelva-library-records-v2', film: work, directorName: director.name });
    await page.goto(`${base}/my-cinelva/`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#statTotal').textContent(), '2');
    assert.equal(await page.locator('#statOrigin').textContent(), '2 / 0');
    assert.ok(await page.locator('#recordList [data-record-card]').count() === 2);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'page should not overflow at 390px');

    await page.locator('[data-tab="world"]').click();
    await page.waitForFunction(() => document.getElementById('worldCanvas')._points?.length === 2);
    assert.match(await page.locator('#worldStatus').textContent(), /2作品を表示/);
    await page.locator('#worldGenre').selectOption('犯罪');
    await page.waitForFunction(() => document.getElementById('worldCanvas')._points?.length === 1);
    await page.locator('#worldGenre').selectOption('all');
    await page.locator('#worldCountry').selectOption('Japan');
    await page.waitForFunction(() => document.getElementById('worldCanvas')._points?.length === 1);
    await page.locator('#worldCountry').selectOption('all');
    await page.locator('#worldYear').selectOption(String(Number(work.year) === 2002 ? 2010 : 2002));
    await page.waitForFunction(() => document.getElementById('worldCanvas')._points?.length === 1);
    await page.locator('#worldYear').selectOption('all');
    const plotPoint = await page.locator('#worldCanvas').evaluate(canvas => canvas._points[0]);
    await page.locator('#worldCanvas').click({ position: { x: Math.round(plotPoint.x), y: Math.round(plotPoint.y) } });
    assert.match(await page.locator('#worldFilm').textContent(), /Browser Test Film|Film/);

    await page.locator('[data-tab="genres"]').click();
    assert.ok(await page.locator('#genreMatrix button[data-genre-pair]').count() > 0);
    await page.locator('[data-tab="awards"]').click();
    assert.match(await page.locator('#awardCoverage').textContent(), /達成率は表示しません/);
    assert.ok((await page.locator('#awardMatrix').textContent()).includes('年代'));

    await page.route('https://backend-one-gray-94.vercel.app/api/movies*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ movies: [{ id: 99999999, title: 'New Browser Film', year: 2026, director: director.name, genres: ['SF'], countries: ['Japan'] }], external: [] }),
    }));
    await page.locator('#addRecord').click();
    await page.locator('#movieQuery').fill('New Browser Film');
    await page.locator('[data-choose-movie="99999999"]').click();
    await page.locator('#watchedAt').fill('2026-06-11');
    await page.locator('#rating').evaluate(input => { input.value = '0'; input.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.locator('#unrated').uncheck();
    await page.locator('#saveRecord').click();
    await page.waitForFunction(() => document.getElementById('statTotal').textContent === '3');
    assert.match(await page.locator('#recordList').textContent(), /New Browser Film/);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cinelva-library-records-v2'))['99999999'].rating), 0);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#statTotal').textContent(), '3');

    await page.goto(`${base}/my-cinemap.html`, { waitUntil: 'networkidle' });
    assert.ok(await page.locator('#art').evaluate(canvas => canvas.width > 0 && canvas.height > 0));
    const download = page.waitForEvent('download');
    await page.locator('#save').click();
    assert.match((await download).suggestedFilename(), /cinelva-.*\.png/);
    assert.deepEqual(errors, []);
    console.log('My Cinelva mobile records, insights, persistence and PNG export passed');
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
