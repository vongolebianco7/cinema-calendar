const assert=require('node:assert/strict');
const fs=require('node:fs');
const net=require('node:net');
const {spawn}=require('node:child_process');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
const {assertTextContrast}=require('./helpers/text-contrast.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));
 const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 const engine=process.env.CINELVA_BROWSER||'chromium';let browser;
 try{
  await waitForLocalServer(port);browser=await require('playwright')[engine].launch();
  fs.mkdirSync('artifacts/route-audit/search-rating-theme',{recursive:true});
  for(const width of [390,1280])for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width,height:844},colorScheme:theme});
   await context.addInitScript(theme=>localStorage.setItem('cinelva-theme-v1',theme),theme);
   const movie={id:111,tmdbId:111,title:'テーマ検証',year:2020,score:8,votes:100};
   await context.route('https://**/*',route=>route.abort());
   await context.route('**/data/movies.json*',route=>route.fulfill({json:{movies:[movie]}}));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const url=`http://127.0.0.1:${port}/search.html?search=${encodeURIComponent(movie.title)}`;
   await page.goto(url,{waitUntil:'domcontentloaded'});
   const card=page.locator('#grid .cinelva-rate-wrap').first();
   await card.locator('.cinelva-rating-audience').waitFor();
   assert.equal(await card.locator('.card .score').isVisible(),false,'shared TMDB rating replaces standalone line');
   assert.equal(await card.locator('.cinelva-rating-audience').count(),1);
   assert.match(await card.locator('.cinelva-rating-audience').innerText(),/4\.0/);
   await page.locator('#movieGridSortSelect').waitFor();
   await assertTextContrast(page,['.movieGridSort label','#movieGridSortSelect',
    '#grid .cinelva-rating-audience .rating-caption','#grid .cinelva-rating-audience .rating-value'],`${engine} ${width} ${theme}`);
   assert.equal(await page.locator('#movieGridSortSelect').evaluate(el=>getComputedStyle(el).appearance),'none');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   await page.screenshot({path:`artifacts/route-audit/search-rating-theme/${engine}-${theme}-${width}.png`});
   // If the shared module cannot load, the original rating must remain available.
   await context.route('**/js/cinelva-quick-rate.js*',route=>route.abort());
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#grid .card .score').waitFor();
   assert.match(await page.locator('#grid .card .score').first().innerText(),/4\.0/);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(`${engine}: single TMDB rating, script-failure fallback and readable native sort at390/1280 light/dark passed`);
 }finally{await browser?.close();server.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1;});
