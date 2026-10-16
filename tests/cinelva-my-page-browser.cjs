const { chromium, webkit } = require('playwright');
const fs = require('node:fs');
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
    browser = await (process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch({ headless: true });
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
        [String(film.id)]: { id: String(film.id), title: film.title, year: Number(film.year) === 2002 ? 2010 : (Number(film.year) || 2010), poster: film.poster, director: directorName, genres: ['SF'], formats:['アニメーション'], workForms:['フィクション'], countries: ['Japan'], region: 'Japan', rating: 4.5, watchedAt: '2026-04-12' },
        '900001': { id: '900001', title: 'Browser Test Film', year: 2002, director: directorName, genres: ['SF', 'Crime'], formats:['実写'], workForms:['フィクション'], region: '日本', rating: 0, watchedAt: '2025-04-15' },
      }));
    }, { key: 'cinelva-library-records-v2', film: work, directorName: director.name });
    await page.goto(`${base}/my-cinelva/`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#statTotal').textContent(), '2');
    assert.equal(await page.locator('#statOrigin').textContent(), '2 / 0');
    const annual = await page.locator('#annualComparison').textContent();
    assert.match(annual, /2026年[\s\S]*1本/);
    assert.match(annual, /2025年[\s\S]*1本/);
    assert.match(annual, /前年との比較/);
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
    assert.ok((await page.locator('#worldFilm').textContent()).includes(plotPoint.record.title));

    await page.locator('#worldToggle').click();
    assert.equal(await page.locator('#worldList').isVisible(),true);
    assert.equal(await page.locator('#worldList [data-record-card]').count(),2);
    await page.locator('#worldToggle').click();
    await page.locator('#worldCanvas').focus();await page.keyboard.press('Enter');
    assert.ok(await page.locator('#worldFilm [data-record-card]').count()===1);
    await page.locator('[data-tab="genres"]').click();
    await page.locator('#genreFormat').selectOption('アニメーション');
    await page.locator('[data-genre-pair="SF|SF"]').click();
    assert.equal(await page.locator('#genreFilms [data-record-card]').count(),1);
    await page.locator('#genreWorkForm').selectOption('ドキュメンタリー');
    assert.equal(await page.locator('#genreFilms [data-record-card]').count(),0);
    await page.locator('#genreFormat').selectOption('all');await page.locator('#genreWorkForm').selectOption('all');
    assert.match(await page.locator('#classificationSummary').textContent(),/上映時間/);
    await page.getByLabel('表示テーマ',{exact:true}).selectOption('dark');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    await page.getByLabel('表示テーマ',{exact:true}).selectOption('light');
    assert.ok(await page.locator('#genreMatrix button[data-genre-pair]').count() > 0);
    await page.locator('[data-tab="awards"]').click();
    assert.match(await page.locator('#awardCoverage').textContent(), /達成率は表示しません/);
    assert.ok((await page.locator('#awardMatrix').textContent()).includes('年代'));

    await page.locator('[data-tab="directors"]').click();
    assert.ok(await page.locator('[data-director-film]').count()>0);
    await page.locator('[data-director-film]').last().click();
    assert.equal(await page.locator('#recordDialog').isVisible(),true);
    assert.match(await page.locator('#chosenMovie').textContent(),/./);
    await page.locator('#closeDialog').click();
    await page.route('https://backend-one-gray-94.vercel.app/api/movie-detail*',route=>route.abort());
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
    await page.locator('#recordFormat').selectOption('実写');await page.locator('#recordWorkForm').selectOption('フィクション');
    await page.locator('#saveRecord').click();
    await page.waitForFunction(() => document.getElementById('statTotal').textContent === '3');
    assert.match(await page.locator('#recordList').textContent(), /New Browser Film/);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cinelva-library-records-v2'))['99999999'].rating), 0);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#statTotal').textContent(), '3');

    await page.locator('[data-edit="99999999"]').click();
    await page.locator('#watchedAt').fill('2026-06-12');await page.locator('#unrated').check();await page.locator('#saveRecord').click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cinelva-library-records-v2'))['99999999'].rating),null);
    const backupWait=page.waitForEvent('download');await page.locator('#exportRecords').click();
    const backupDownload=await backupWait, backupData=fs.readFileSync(await backupDownload.path());
    page.once('dialog',dialog=>dialog.accept());await page.locator('[data-delete="99999999"]').click();
    assert.equal(await page.locator('#statTotal').textContent(),'2');
    page.once('dialog',dialog=>dialog.accept());await page.locator('#importFile').setInputFiles({name:'records.json',mimeType:'application/json',buffer:backupData});
    await page.waitForFunction(()=>document.getElementById('statTotal').textContent==='3');
    const savedBefore=await page.evaluate(()=>localStorage.getItem('cinelva-library-records-v2'));
    await page.locator('#importFile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"records":[{"id":1,"title":"bad","rating":8}]}')});
    await page.waitForFunction(()=>document.getElementById('status').textContent.includes('復元できません'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('cinelva-library-records-v2')),savedBefore);
    await page.goto(`${base}/my-cinemap.html`, { waitUntil: 'networkidle' });
    assert.ok(await page.locator('#art').evaluate(canvas => canvas.width > 0 && canvas.height > 0));
    const download = page.waitForEvent('download');
    await page.locator('#save').click();
    assert.match((await download).suggestedFilename(), /cinelva-.*\.png/);
    await page.locator('#imageSort').selectOption('rating');
    await page.locator('#format').selectOption('square');
    await page.route('https://image.tmdb.org/**',route=>route.abort());
    await page.locator('#format').selectOption('landscape');
    const fallbackDownload=page.waitForEvent('download');await page.locator('#save').click();assert.match((await fallbackDownload).suggestedFilename(),/\.png$/);
    const phone=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1'});
    await phone.addInitScript(()=>{localStorage.setItem('cinelva-library-records-v2','{"77":{"id":"77","title":"Phone Film","rating":0,"watchedAt":"2026-01-01"}}');});
    const phonePage=await phone.newPage();await phonePage.goto(`${base}/my-cinemap.html`,{waitUntil:'networkidle'});await phonePage.locator('#save').click();assert.equal(await phonePage.locator('#saveDialog').isVisible(),true);assert.match(await phonePage.locator('#download').getAttribute('href'),/^blob:/);await phone.close();
    await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args){return this.id==='worldCanvas'?null:get.apply(this,args);};});
    await page.route('**/data/awards.json',route=>route.fulfill({status:503,body:'Unavailable'}));
    await page.goto(`${base}/my-cinelva/`,{waitUntil:'networkidle'});await page.locator('[data-tab="world"]').click();
    assert.equal(await page.locator('#worldList').isVisible(),true);assert.equal(await page.locator('#worldList [data-record-card]').count(),3);
    assert.deepEqual(errors, []);
    console.log('My Cinelva mobile records, insights, persistence and PNG export passed');
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
