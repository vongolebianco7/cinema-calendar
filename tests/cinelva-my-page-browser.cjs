const { waitForLocalServer } = require('./helpers/local-server.cjs');
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
    await waitForLocalServer(port);
    browser = await (process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack || error.message));
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const url = new URL(typeof input === 'string' ? input : input.url, location.href);
        if (url.pathname.endsWith('/data/movies.json')) {
          return Promise.resolve(new Response(JSON.stringify({ movies: [] }), { headers: { 'content-type': 'application/json' } }));
        }
        return originalFetch(input, init);
      };
    });
    const directorsResponse = await fetch(`${base}/data/directors.json`);
    const directors = (await directorsResponse.json()).directors;
    const director = Object.values(directors)[0];
    const work = director.works[0];
    await context.addInitScript(({ key, film, directorName }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
        '900003': { id: '900003', tmdbId: film.id, title: film.title, year: Number(film.year) === 2002 ? 2010 : (Number(film.year) || 2010), poster: film.poster, director: directorName, genres: ['SF'], formats:['アニメーション'], workForms:['フィクション'], countries: ['Japan'], region: 'Japan', rating: 4.5, watchedAt: '2026-04-12' },
        '900001': { id: '900001', title: 'スター・ウォーズ', original_title: 'Star Wars', year: 2002, director: directorName, genres: ['SF', 'Crime'], formats:['実写'], workForms:['フィクション'], region: '日本', rating: 0, watchedAt: '2025-04-15' },
      }));
    }, { key: 'cinelva-library-records-v2', film: work, directorName: director.name });
    await page.goto(`${base}/my-cinelva/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('cinelva-want-to-watch-v1', JSON.stringify({ '900002': { id: '900002', title: '見たい作品テスト', savedAt: new Date().toISOString() } }));
      window.dispatchEvent(new CustomEvent('cinelva-bookmarks-updated', { detail: { id: '900002', marked: true } }));
    });
    assert.equal(await page.locator('#wantToWatchSection').evaluate(section => section.open), true);
    assert.match(await page.locator('#wantWatchList').textContent(), /見たい作品テスト/);
    assert.match(await page.locator('#wantToWatchSection summary').textContent(), /見たい映画/);
    assert.equal(await page.locator('#statTotal').textContent(), '2');
    assert.equal(await page.locator('#statOrigin').textContent(), '2 / 0');
    assert.equal(await page.locator('#yearHeatmapTitle').textContent(), '年間鑑賞カレンダー');
    assert.equal(await page.locator('#annualComparison').count(), 0, 'duplicate annual comparison is not displayed');
    await page.locator('#calendarYearSelect').selectOption('2025');
    assert.equal(await page.locator('#csPeriod').inputValue(), '2025');
    await page.locator('#csPeriod').selectOption('2026');
    assert.equal(await page.locator('#calendarYearSelect').inputValue(), '2026');
    assert.ok(await page.locator('#recordList [data-record-card]').count() === 2);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'page should not overflow at 390px');

    await page.getByLabel('表示テーマ',{exact:true}).selectOption('dark');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    await page.getByLabel('表示テーマ',{exact:true}).selectOption('light');
    await page.locator('[data-tab="awards"]').click();
    assert.match(await page.locator('#awardCoverage').textContent(), /達成率は表示しません/);
    assert.ok((await page.locator('#awardMatrix').textContent()).includes('年代'));

    await page.locator('[data-tab="directors"]').click();
    await page.locator('#directorTimeline .director-pick').first().click();
    const importedFilm = page.locator('#directorFilmography .director-film-tile.is-watched');
    assert.equal(await importedFilm.count(), 1, 'one imported record maps to one canonical director film');
    assert.equal(await importedFilm.locator('a').getAttribute('href'), '../search.html?id=' + work.id);
    const storedImport = await page.evaluate(() => JSON.parse(localStorage.getItem('cinelva-library-records-v2'))['900003']);
    assert.equal(storedImport.id, '900003', 'director rendering preserves the local edit key');
    assert.equal(String(storedImport.tmdbId), String(work.id));

    const directorTile=page.locator('#directorFilmography .director-film-tile').last();
    await directorTile.waitFor({state:'visible'});
    const directorTitle=(await directorTile.locator('.director-film-title').innerText()).trim();
    const directorId=new URL(await directorTile.locator('a.director-film-poster').getAttribute('href'),base).searchParams.get('id');
    assert.ok(directorId,'selected director film has a movie identity');
    await page.route('https://backend-one-gray-94.vercel.app/api/movie-detail*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movie:{...work,id:Number(directorId),tmdbId:Number(directorId),title:directorTitle}})}));
    await directorTile.locator('a.director-film-poster').click();
    await page.waitForURL(url=>url.pathname.endsWith('/search.html')&&url.searchParams.has('id'));
    const detailReview=page.locator('#detail [data-detail-review]');
    await detailReview.waitFor({state:'visible'});
    await detailReview.click();
    await page.locator('.cinelva-rate-dialog').waitFor({state:'visible'});
    assert.equal(await page.locator('#cinelvaRateTitle').innerText(),directorTitle,'director-film detail opens the shared review dialog directly');
    await page.locator('#cinelvaRateClose').click();
    await page.waitForFunction(()=>!document.querySelector('.cinelva-rate-dialog')?.open);
    await page.goto(`${base}/my-cinelva/`,{waitUntil:'networkidle'});
    const rerelease={id:27205,title:'インセプション',year:2026,director:'Christopher Nolan',genres:['SF'],countries:['US']};
    await page.route('https://backend-one-gray-94.vercel.app/api/movies*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movies:[rerelease],external:[]})}));
    await page.route('https://backend-one-gray-94.vercel.app/api/movie-detail*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movie:{...rerelease,year:'2010'}})}));
    assert.equal(await page.locator('#addRecord').getAttribute('href'),'../search.html','new records begin on the existing searchable listing');
    await page.locator('#addRecord').click();
    await page.waitForURL(url=>url.pathname.endsWith('/search.html'));
    assert.equal(await page.locator('#modal').getAttribute('class'),'modal','the new-record action does not open an unapproved window');
    await page.unroute('https://backend-one-gray-94.vercel.app/api/movies*');await page.unroute('https://backend-one-gray-94.vercel.app/api/movie-detail*');
    await page.route('https://backend-one-gray-94.vercel.app/api/movies*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ movies: [{ id: 99999999, title: 'New Browser Film', year: 2026, director: director.name, genres: ['SF'], countries: ['Japan'] }], external: [] }),
    }));
    await page.locator('.gSearch').fill('New Browser Film');await page.locator('.gSearchBtn').click();
    await page.locator('#grid .card').first().waitFor({state:'visible'});
    await page.locator('#grid .cinelva-rate-button').first().click();
    await page.locator('.cinelva-rate-dialog').waitFor({state:'visible'});
    await page.locator('#cinelvaRateDate').evaluate(input=>{input.value='2026-06-11';document.getElementById('cinelvaDateTrigger').textContent='2026/06/11';});
    await page.locator('#cinelvaRatePlace').selectOption('映画館');
    await page.locator('#cinelvaRateComment').fill('映画館で見た感想');
    await page.locator('#cinelvaRateSave').click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('cinelva-library-records-v2')||'{}')['99999999']?.rating === 0);
    await page.goto(`${base}/my-cinelva/`,{waitUntil:'networkidle'});
    await page.locator('[data-tab="records"]').click();
    assert.match(await page.locator('#recordList').textContent(), /New Browser Film/);
    for (const query of ['スターウォーズ', 'スター　ウォーズ', 'ＳＴＡＲ ＷＡＲＳ']) {
      await page.locator('#recordSearch').fill(query);
      assert.equal(await page.locator('#recordList [data-record-card]').count(), 1);
      assert.equal(await page.locator('#recordList [data-record-card]').getAttribute('data-record-card'), '900001');
    }
    await page.locator('#recordYear').selectOption('2026');
    assert.equal(await page.locator('#recordList [data-record-card]').count(), 0);
    await page.locator('#recordYear').selectOption('all');
    await page.locator('#recordSearch').fill('');
    assert.equal(await page.locator('#recordList [data-record-card]').count(), 3);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cinelva-library-records-v2'))['99999999'].rating), 0);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#statTotal').textContent(), '3');

    await page.locator('[data-tab="records"]').click();
    await page.locator('#recordList [data-edit="99999999"]').click();
    await page.locator('#cinelvaRateDate').evaluate(input=>{input.value='2026-06-12';document.getElementById('cinelvaDateTrigger').textContent='2026/06/12';});await page.locator('#cinelvaRatePlace').selectOption('配信');
    await page.locator('#cinelvaRateComment').fill('自宅で見た感想');await page.locator('#cinelvaRateSave').click();
    const updated=await page.evaluate(()=>JSON.parse(localStorage.getItem('cinelva-library-records-v2'))['99999999']);
    assert.equal(updated.rating,0);assert.equal(updated.viewingMethod,'配信');assert.equal(updated.comment,'自宅で見た感想');
    await page.locator('.recordUtilities summary').click();
    assert.equal(await page.locator('#exportRecords').isVisible(),true);
    const backupWait=page.waitForEvent('download');await page.locator('#exportRecords').click();
    const backupDownload=await backupWait, backupData=fs.readFileSync(await backupDownload.path());
    page.once('dialog',dialog=>dialog.accept());await page.locator('#recordList [data-delete="99999999"]').click();
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
    const phonePage=await phone.newPage();await phonePage.goto(`${base}/my-cinemap.html`,{waitUntil:'networkidle'});await phonePage.locator('#save').click();await phonePage.locator('#saveDialog').waitFor({state:'visible'});assert.equal(await phonePage.locator('#saveDialog').isVisible(),true);assert.match(await phonePage.locator('#download').getAttribute('href'),/^blob:/);await phone.close();
    const dense=await browser.newContext({viewport:{width:390,height:844}});
    await dense.addInitScript(()=>{const rows=Object.fromEntries(Array.from({length:1000},(_,i)=>[String(8000000+i),{id:String(8000000+i),title:'Film '+i,year:1950+i%70,countries:['Japan'],genres:['SF','アクション'],formats:[i%2?'アニメーション':'実写'],rating:4,watchedAt:'2026-01-01'}]));localStorage.setItem('cinelva-library-records-v2',JSON.stringify(rows));});
    const densePage=await dense.newPage();await densePage.goto(`${base}/my-cinelva/`,{waitUntil:'networkidle'});assert.equal(await densePage.locator('#statTotal').textContent(),'1,000');
    await densePage.locator('[data-tab="records"]').click();assert.equal(await densePage.locator('#recordList [data-record-card]').count(),1000);
    assert.ok(await densePage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await dense.close();
    assert.deepEqual(errors, []);
    console.log('My Cinelva mobile records, insights, persistence and PNG export passed');
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
