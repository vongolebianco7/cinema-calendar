const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs');
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
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/movies.json'), 'utf8'));
  const original = catalog.movies.find(row => row.id && row.title);
  assert.ok(original, 'catalog fixture has a movie ID and title');
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const iso = date.toISOString().slice(0, 10);
  const movie = { ...original, date: iso, event: 'streaming', service: 'Netflix' };
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
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(() => {
      localStorage.setItem('cinemaNow.mode', 'streaming');
      localStorage.setItem('cinemaNow.active', 'すべて');
    });
    await page.route('https://backend-one-gray-94.vercel.app/**', route => route.abort());
    await page.route('**/data/movies.json*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...catalog, movies: [movie] })
    }));
    await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
    const event = page.locator('.streamMovie').first();
    await event.waitFor({ state: 'visible', timeout: 15000 });
    await event.click();
    await page.locator('#modal.show').waitFor({ state: 'visible', timeout: 5000 });
    const detailLink = page.locator('#detail .links a[href*="search.html?id="]').first();
    await detailLink.waitFor({ state: 'visible', timeout: 5000 });
    const detailHref = await detailLink.getAttribute('href');
    assert.ok(detailHref.includes(encodeURIComponent(String(movie.id))));
    assert.ok(detailHref.includes('date='));
    assert.ok(detailHref.includes('event=streaming'));
    await detailLink.click();
    await page.locator('#detail .recordAction a').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#detail .recordAction a').click();
    await page.locator('#recordDialog').waitFor({ state: 'visible', timeout: 15000 });
    assert.ok((await page.locator('#chosenMovie').textContent()).includes(movie.title));
    await page.route('**/api/movies*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ movies: [movie], external: [] })
    }));
    await page.goto(`${base}/search.html?search=${encodeURIComponent(movie.title)}`, { waitUntil: 'domcontentloaded' });
    const result = page.locator('#grid .card').first();
    await result.waitFor({ state: 'visible', timeout: 10000 });
    await result.click();
    await page.locator('#detail .recordAction a').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#detail .recordAction a').click();
    await page.locator('#recordDialog').waitFor({ state: 'visible', timeout: 15000 });
    assert.ok((await page.locator('#chosenMovie').textContent()).includes(movie.title));
    await page.addInitScript(row => localStorage.setItem('cinelva-library-records-v2', JSON.stringify({
      [row.id]: {
        id: String(row.id), title: row.title, poster: row.poster || '',
        year: Number(String(row.date || '').slice(0, 4)) || null,
        director: row.director || '', genres: row.genres || [],
        countries: row.countries || [], rating: 4, watchedAt: '2026-10-17', watched: true
      }
    })), movie);
    await page.goto(`${base}/my-cinelva/`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-tab="world"]').click();
    await page.locator('#worldCanvas').press('Enter');
    const mappedRecord = page.locator('#worldFilm [data-edit]').first();
    await mappedRecord.waitFor({ state: 'visible', timeout: 10000 });
    await mappedRecord.click();
    await page.locator('#recordDialog').waitFor({ state: 'visible', timeout: 10000 });
    assert.ok((await page.locator('#chosenMovie').textContent()).includes(movie.title), 'world-map selection opens the existing record in edit mode');
    console.log('Calendar event and search-page result → detail → shared record form passed at 390px with backend offline.');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
