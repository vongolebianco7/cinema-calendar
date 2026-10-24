const engine=require('playwright')[process.env.CINELVA_BROWSER||'chromium'];
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('http://cinelva.test/**',route=>route.fulfill({contentType:'text/html',body:'<html><head></head><body><button data-axis="rating" class="active"></button><div id="grid"><article class="rankReviewWrap"><div class="title">B</div><div class="meta">2020 · ★ 7</div></article><article class="rankReviewWrap"><div class="title">A</div><div class="meta">2024 · ★ 8</div></article></div></body></html>'}));
  await page.goto('http://cinelva.test/rankings.html');
  await page.addScriptTag({path:'js/movie-grid-sort.js'});
  await page.selectOption('#movieGridSortSelect','title-asc');
  assert.deepEqual(await page.locator('#grid .title').allTextContents(),['A','B']);
  assert.ok(!(await page.locator('#movieGridSortSelect').textContent()).match(/ランキング順|元の表示順/));
  const html=fs.readFileSync('my-cinelva/index.html','utf8'),script=html.match(/<script id="cinelva-watchlist-tab">([\s\S]*?)<\/script>/)[1];
  await page.setContent('<div><button data-tab="watchlist"></button><div id="wantWatchList"></div></div>');
  const saved=JSON.stringify({1:{id:1,title:'B',year:2020,savedAt:'2024-02-01'},2:{id:2,title:'A',year:2024,savedAt:'2024-01-01'}});
  await page.evaluate(saved=>localStorage.setItem('cinelva-want-to-watch-v1',saved),saved);
  await page.addScriptTag({content:script});
  await page.selectOption('#wantWatchSort','title');
  assert.deepEqual(await page.locator('.want-watch-film strong').allTextContents(),['A','B']);
  await page.selectOption('#wantWatchSort','releaseOld');
  assert.deepEqual(await page.locator('.want-watch-film strong').allTextContents(),['B','A']);
  assert.equal(await page.evaluate(()=>localStorage.getItem('cinelva-want-to-watch-v1')),saved);
  console.log('PASS: mobile ranking wrapper sorting, concrete labels, bookmark sorting and storage preservation');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
