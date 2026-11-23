'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const net = require('node:net');
const { waitForLocalServer } = require('./helpers/local-server.cjs');
const { chromium, webkit } = require('playwright');

const homeHtml = fs.readFileSync('index.html', 'utf8');
const specialHtml = fs.readFileSync('specials.html', 'utf8');
const diagnosisHtml = fs.readFileSync('vivant-diagnosis.html', 'utf8');
assert.doesNotMatch(homeHtml, /href="vivant-diagnosis\.html" class="heroAction/);
assert.match(homeHtml, /href="specials\.html">特集・診断<\/a>/);
assert.match(specialHtml, /href="vivant-diagnosis\.html" class="specialAction"/);
assert.match(specialHtml, /specialLogoVivant/);
assert.match(diagnosisHtml, /好きな映画を選んでください/);
assert.doesNotMatch(diagnosisHtml, /鑑賞済みなら入れ替え/);
assert.match(diagnosisHtml, /href="specials\.html"[^>]*>特集・診断<\/a>/);
assert.match(diagnosisHtml, /<div class="wrap gNav">/);
assert.match(diagnosisHtml, /class="gBrandWord">Cinelva<\/span>/);
assert.match(diagnosisHtml, /class="gSearchForm"/);

(async () => {
  const socket = net.createServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { stdio: 'ignore' });
  let browser;
  try {
    await waitForLocalServer(port);
    const browserType = process.env.CINELVA_BROWSER === 'webkit' ? webkit : chromium;
    browser = await browserType.launch({ headless: true, ...(process.env.CINELVA_CHROMIUM_PATH && process.env.CINELVA_BROWSER !== 'webkit' ? { executablePath: process.env.CINELVA_CHROMIUM_PATH } : {}) });
    const context = await browser.newContext({ viewport: { width: 320, height: 844 } });
    const preserved = {
      'cinelva-library-records-v2': JSON.stringify({ '101': { id: '101', title: 'Existing viewing record', score: 4.2 } }),
      'cinemap-viewing-records-v1': JSON.stringify({ '202': { id: '202', title: 'Legacy viewing record' } }),
      'cinelva-want-to-watch-v1': JSON.stringify({ '303': true })
    };
    await context.addInitScript(values => { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value); }, preserved);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://backend-one-gray-94.vercel.app/api/movies**', async route => {
      const title = new URL(route.request().url()).searchParams.get('q') || '';
      await route.fulfill({ json: { movies: [], external: [{ id: 987654, title, poster: 'https://image.tmdb.org/t/p/w342/cinelva-test.jpg' }] } });
    });
    await page.route('https://image.tmdb.org/t/p/w342/*', route => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQXcAAAAASUVORK5CYII=', 'base64') }));
    await page.goto(`http://127.0.0.1:${port}/specials.html`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: '特集・診断' }).waitFor();
    await page.getByRole('link', { name: '診断する' }).click();
    await page.getByRole('heading', { name: 'VIVANT診断' }).waitFor();
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    assert.equal(await page.evaluate(() => { const d = window.VivantDiagnosis; return d.recommendMovies(d.QUESTIONS.map(q => q.choices[0].id), [], d.FAVORITE_CHOICES.slice(0, 2).map(m => m.title)).length; }), 3, 'two favorite movies still produce three recommendations');
    assert.match(await page.locator('.fanNote').innerText(), /非公式ファン企画/);
    for (let question = 0; question < 8; question++) {
      assert.equal(await page.locator('.choice').count(), 4);
      await page.locator('.choice').nth(question % 4).click();
      assert.equal(await page.locator('.choice[aria-pressed="true"] .choiceCheck').innerText(), '✓', 'selected quiz answer displays a concrete check mark');
      await page.locator('#nextButton').click();
    }
    assert.equal(await page.locator('.favoriteChoices .choice').count(), 9);
    await page.locator('.favoriteChoices .choice').filter({ hasText: 'ショーシャンクの空に' }).click();
    assert.equal(await page.locator('.favoriteChoices .choice[aria-pressed="true"]').count(), 1, 'the selected favorite is visibly marked');
    assert.equal(await page.locator('.favoriteChoices .choice[aria-pressed="true"] .favoriteChoiceCheck').innerText(), '✓ 選択中', 'selected poster has a concrete selected badge');
    await page.locator('#nextButton').click();
    await page.locator('.favoriteChoices .choice').filter({ hasText: '千と千尋の神隠し' }).click();
    await page.locator('#nextButton').click();
    await page.getByRole('heading', { name: '診断結果' }).waitFor();
    assert.deepEqual(errors, [], 'result rendering has no uncaught browser errors');
    assert.equal(await page.locator('.movie').count(), 3);
    assert.equal(await page.locator('.identityBlock').count(), 2);
    assert.match(await page.locator('.favoriteResult').innerText(), /ショーシャンクの空に.*千と千尋の神隠し/);
    assert.ok(!((await page.locator('.movie h3').allInnerTexts()).some(title => /ショーシャンクの空に|千と千尋の神隠し/.test(title))));
    await page.locator('.moviePoster img').first().waitFor({ state: 'visible' });
    const contrast = await page.locator('.identityBlock strong').first().evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el.closest('.identity')).backgroundColor }));
    assert.notEqual(contrast.color, contrast.background, 'result label must remain visible in light theme');
    await page.evaluate(() => { Object.defineProperty(navigator, 'share', { configurable: true, value: async payload => { window.__sharedPayload = payload; } }); });
    await page.locator('.shareButton').click();
    await page.waitForFunction(() => Boolean(window.__sharedPayload));
    const shared = await page.evaluate(() => window.__sharedPayload);
    assert.match(shared.text, /VIVANT診断/);
    assert.match(shared.text, /おすすめ映画/);
    const imageDownload = page.waitForEvent('download');
    await page.locator('.saveCardButton').click();
    assert.equal((await imageDownload).suggestedFilename(), 'vivant-diagnosis.png');
    assert.equal(await page.locator('.movie .replace').count(), 0, 'watched replacement copy and controls are removed');
    const saved = await page.evaluate(() => Object.fromEntries(['cinelva-library-records-v2','cinemap-viewing-records-v1','cinelva-want-to-watch-v1'].map(key => [key, localStorage.getItem(key)])));
    assert.deepEqual(saved, preserved, 'diagnosis leaves existing records, legacy records and bookmarks untouched');
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      assert.ok(layout.scrollWidth <= layout.width, `no horizontal page overflow at ${width}px: ${JSON.stringify(layout)}`);
      const mobileGrid = await page.locator('.movies').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      assert.equal(mobileGrid, 3, `recommendations are three columns at ${width}px`);
      const recommendationsBottom = await page.locator('.movies').evaluate(el => el.getBoundingClientRect().bottom);
      assert.ok(recommendationsBottom <= 844, `diagnosis and recommendation cards fit in one 844px screen at ${width}px: bottom=${recommendationsBottom}`);
    }
    const home = await context.newPage();
    await home.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'domcontentloaded' });
    await home.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await home.setViewportSize({ width, height: 844 });
      const dimensions = async target => target.evaluate(() => ['.gNav','.gBrandImage','.gBrandWord','.gSearchForm','.gMenuBtn'].map(selector => { const el=document.querySelector(selector),r=el.getBoundingClientRect(),s=getComputedStyle(el); return [selector,Math.round(r.width),Math.round(r.height),s.fontFamily]; }));
      assert.deepEqual(await dimensions(page), await dimensions(home), `VIVANT header matches shared header at ${width}px`);
    }
    await home.close();
    assert.deepEqual(errors, [], 'no uncaught browser errors');
    console.log(`VIVANT diagnosis ${process.env.CINELVA_BROWSER || 'chromium'} 320px/390px journey passed; shared header matched, eight answer checks and two poster checks were visible, and three recommendation columns and saved data were preserved.`);
    await context.close();
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
