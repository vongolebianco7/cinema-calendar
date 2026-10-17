const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const assert = require('node:assert/strict');

const routes = [
  'preview/ocean/index.html',
  'preview/ocean/ocean-demo.html',
  'preview/ocean/poc/index.html',
  'preview/ocean/real-fish/ecosystem.html',
  'preview/ocean/real-fish/index.html',
  'preview/ocean/real-fish/milestone-gallery.html',
  'preview/ocean/real-fish/ordinary-species-gallery.html',
  'preview/ocean/renderer/index.html',
];
const recordKey = 'cinelva-library-records-v2';

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
        try { if ((await fetch(base)).ok) return resolve(); } catch (_) {}
        if (Date.now() > deadline) return reject(new Error('local static server did not start'));
        setTimeout(poll, 100);
      };
      poll();
    });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    for (const count of [0, 1, 1000]) {
      const records = Object.fromEntries(Array.from({ length: count }, (_, index) => [String(index + 1), { id: String(index + 1), title: `保存記録 ${index + 1}`, watched: true }]));
      const serialized = JSON.stringify(records);
      await page.goto(`${base}/my-cinemap.html`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(([key, value]) => localStorage.setItem(key, value), [recordKey, serialized]);
      for (const route of routes) {
        await page.goto(`${base}/${route}?retirement-test=${count}#records`, { waitUntil: 'domcontentloaded' });
        await page.waitForURL(url => url.pathname === '/my-cinemap.html' && url.searchParams.get('retirement-test') === String(count) && url.hash === '#records');
        assert.equal(await page.evaluate(key => localStorage.getItem(key), recordKey), serialized, `${route} preserves ${count} records exactly`);
      }
    }
    console.log('All eight retired Ocean routes redirect to My CINELVA and preserve 0/1/1000-record storage snapshots.');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
