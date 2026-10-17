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
    assert.match(href, /^my-cinelva\/\?record=/);
    assert.ok(href.includes(encodeURIComponent(String(movie.id))));
    await recordLink.click();
    await page.locator('#recordDialog').waitFor({ state: 'visible', timeout: 15000 });
    assert.ok((await page.locator('#chosenMovie').textContent()).includes(movie.title), 'offline movie detail selects the same catalog movie in the record form');

    await page.goto(`${base}/rankings.html?axis=rating`, { waitUntil: 'domcontentloaded' });
    const rankedMovie = page.locator('#grid .rankCard[href*="search.html?id="]').first();
    await rankedMovie.waitFor({ state: 'visible', timeout: 15000 });
    const rankedTitle = (await rankedMovie.locator('.title').textContent()).trim();
    await rankedMovie.click();
    await page.locator('#detail .recordAction a').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#detail .recordAction a').click();
    await page.locator('#recordDialog').waitFor({ state: 'visible', timeout: 15000 });
    assert.ok((await page.locator('#chosenMovie').textContent()).includes(rankedTitle), 'ranking selection remains preselected in the shared record form');
    console.log('Offline movie detail and ranking to My CINELVA record flows passed at 390px.');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
