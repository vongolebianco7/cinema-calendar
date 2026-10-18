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

    const recordLink = page.locator('#detail .recordAction a');
    await recordLink.waitFor({ state: 'visible', timeout: 15000 });
    const href = await recordLink.getAttribute('href');
    assert.match(href, /^search\.html\?search=/);
    assert.equal(new URL(href, base).searchParams.get('search'), movie.title);
    await recordLink.click();
    await page.waitForURL(url => url.pathname.endsWith('/search.html') && url.searchParams.has('search'));
    assert.equal(await page.locator('.gSearch').inputValue(), movie.title, 'movie detail returns to its searchable listing without opening a record window');
    assert.equal(await page.locator('#modal').getAttribute('class'), 'modal');

    const calendarHref = CalendarContext.detailHref({ id: movie.id, title: movie.title, date: '2026-10-17', event: 'streaming', service: 'Netflix' });
    await page.goto(`${base}/${calendarHref}`, { waitUntil: 'domcontentloaded' });
    await page.locator('#detail .recordAction a').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#detail .recordAction a').click();
    await page.waitForURL(url => url.pathname.endsWith('/search.html') && url.searchParams.has('search'));
    assert.equal(await page.locator('.gSearch').inputValue(), movie.title, 'calendar context returns to the searchable listing');

    await page.goto(`${base}/rankings.html?axis=rating`, { waitUntil: 'domcontentloaded' });
    const rankedMovie = page.locator('#grid .rankCard[href*="search.html?id="]').first();
    await rankedMovie.waitFor({ state: 'visible', timeout: 15000 });
    const rankedTitle = (await rankedMovie.locator('.title').textContent()).trim();
    await rankedMovie.click();
    await page.locator('#detail .recordAction a').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#detail .recordAction a').click();
    await page.waitForURL(url => url.pathname.endsWith('/search.html') && url.searchParams.has('search'));
    assert.equal(await page.locator('.gSearch').inputValue(), rankedTitle, 'ranking selection returns to a searchable list without opening a record window');
    console.log('Offline movie detail, calendar-context, and ranking to the searchable rating list passed at 390px.');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
