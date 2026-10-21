const { waitForLocalServer } = require('./helpers/local-server.cjs');
const { chromium, webkit } = require('playwright');
const fs = require('node:fs');
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
    await waitForLocalServer(port);
    const catalog = await fetch(`${base}/data/movies.json`).then(response => response.json());
    const movie = catalog.movies.find(row => row.id && row.title);
    assert.ok(movie, 'fixture has a movie with an ID and title');

    const browserName=process.env.CINELVA_BROWSER==='webkit'?'webkit':'chromium';
    browser = await ({chromium,webkit})[browserName].launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('https://backend-one-gray-94.vercel.app/**', route => route.abort());
    await page.goto(`${base}/search.html?id=${encodeURIComponent(movie.id)}&search=${encodeURIComponent(movie.title)}`, { waitUntil: 'domcontentloaded' });

    async function expectDirectReview(title) {
      const detailUrl = page.url();
      const recordButton = page.locator('#detail [data-detail-review]');
      await recordButton.waitFor({ state: 'visible', timeout: 15000 });
      await recordButton.click();
      await page.locator('.cinelva-rate-dialog').waitFor({ state: 'visible', timeout: 10000 });
      assert.equal(await page.locator('#cinelvaRateTitle').innerText(), title);
      assert.equal(page.url(), detailUrl, 'review opens directly without navigating away from detail');
      assert.equal(await page.locator('.cinelva-rate-dialog').getByRole('button', { name: '次へ', exact: true }).count(), 0, 'review has no next action');
      await page.locator('#cinelvaRateClose').click();
      await page.waitForFunction(() => !document.querySelector('.cinelva-rate-dialog')?.open);
    }
    await expectDirectReview(movie.title);
    await page.evaluate(baseMovie => renderDetail({ ...baseMovie,
      related: [{ id: 992001, tmdbId: 992001, title: 'Related QA', year: '2020', score: 8, votes: 100 }],
      director_works: [{ id: 992002, tmdbId: 992002, title: 'Director QA', year: '2021', score: 7, votes: 100 }]
    }), movie);
    await page.evaluate(()=>document.documentElement.dataset.theme='light');
    const informationContrast=await page.locator('#detail').evaluate(root=>{
      const lum=value=>{
        const rgb=value.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{
          const s=n/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;
        });
        return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
      };
      return ['.movieInfo h3','.movieInfo h4','.movieInfo dt','.movieInfo dd',
        '.detailPhase h3','.detailPhaseNo','.detailPhase p','.relatedGroupTitle','.watchTimelineWhen','.watchTimelineLabel','.watchTimelineDetail'].map(selector=>{
        const element=root.querySelector(selector);
        if(!element)throw new Error(`Missing detail contrast fixture: ${selector}`);
        let bg=element;
        while(bg.parentElement&&getComputedStyle(bg).backgroundColor==='rgba(0, 0, 0, 0)')bg=bg.parentElement;
        const background=lum(getComputedStyle(bg).backgroundColor);
        const foreground=lum(getComputedStyle(element).color);
        return {selector,ratio:(Math.max(background,foreground)+0.05)/(Math.min(background,foreground)+0.05)};
      });
    });
    for(const text of informationContrast)assert.ok(text.ratio>=4.5,
      `movie information ${text.selector} must be readable in light theme: ${text.ratio}`);
    for (const [kind,title,id] of [['related','Related QA','992001'],['director','Director QA','992002']]) {
      const card=page.locator(`.detailRelatedCard[data-detail-kind="${kind}"]`);
      const link=card.locator('a.work');
      assert.equal(new URL(await link.getAttribute('href'),base).searchParams.get('id'),id);
      assert.equal(await card.locator('input[type=range]').count(),0,'secondary cards use the shared badge, without list sliders');
      await card.locator('.cinelva-rate-button').click();
      assert.equal(await page.locator('#cinelvaRateTitle').innerText(),title);
      await page.locator('#cinelvaRateClose').click();
      const bookmark=card.locator('.cinelva-bookmark-button');
      await bookmark.click();
      assert.equal(await bookmark.getAttribute('aria-pressed'),'true');
      assert.equal(await page.evaluate(()=>CinelvaLibraryRecords.all().length),0,'bookmark does not create a viewing record');
      assert.equal(await card.locator('.cinelva-rating-audience .rating-value').innerText(),kind==='related'?'4.0':'3.5');
    }
    assert.equal(await page.locator('#detail .works').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),3);
    const touchAction=await page.locator('#detail .works').first().evaluate(el=>getComputedStyle(el).touchAction);
    assert.ok(touchAction==='auto'||touchAction==='manipulation'||touchAction.includes('pan-y'),
      `vertical related-card grid must allow vertical touch scrolling, got ${touchAction}`);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'secondary cards must not cause horizontal page overflow');
    await page.locator('.detailRelatedCard').first().scrollIntoViewIfNeeded();
    fs.mkdirSync('artifacts/route-audit/related-cards',{recursive:true});
    await page.screenshot({path:`artifacts/route-audit/related-cards/${browserName}-390.png`});

    const calendarHref = CalendarContext.detailHref({ id: movie.id, title: movie.title, date: '2026-10-17', event: 'streaming', service: 'Netflix' });
    await page.goto(`${base}/${calendarHref}`, { waitUntil: 'domcontentloaded' });
    await expectDirectReview(movie.title);

    await page.goto(`${base}/rankings.html?axis=rating`, { waitUntil: 'domcontentloaded' });
    const rankedMovie = page.locator('#grid .rankCard[href*="search.html?id="]').first();
    await rankedMovie.waitFor({ state: 'visible', timeout: 15000 });
    const rankedTitle = (await rankedMovie.locator('.title').textContent()).trim();
    await rankedMovie.click();
    await expectDirectReview(rankedTitle);
    console.log('Offline movie detail, calendar-context, and ranking open the shared review dialog directly at 390px.');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
