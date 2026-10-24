'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),net=require('node:net'),{spawn}=require('node:child_process');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await waitForLocalServer(port);browser=await require('playwright')[process.env.CINELVA_BROWSER||'chromium'].launch();fs.mkdirSync('artifacts/reported-audit',{recursive:true});
  for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width:390,height:844}});await context.addInitScript(t=>localStorage.setItem('cinelva-theme-v1',t),theme);
   await context.route('https://**/*',r=>r.fulfill({status:503,headers:{'access-control-allow-origin':'*'},json:{}}));
   await context.route('https://image.tmdb.org/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#555"/></svg>'}));
   await context.route('**/data/backend.json*',r=>r.fulfill({json:{enabled:false}}));
   const film=(id,title)=>({id:'local-'+id,tmdbId:id,title,date:'2026-10-02',event:'streaming',service:'Prime Video',poster:'https://image.tmdb.org/t/p/w342/fixture.jpg',source_url:'https://www.aboutamazon.jp/news/entertainment/amazon-prime-video-new-content-october-2026'});
   const films=[film(42,'短い作品'),film(43,'とても長い作品名の映画で二行以上の高さになっていた作品')];
   await context.route('**/data/tv.json*',r=>r.fulfill({json:{movies:[{...film(44,'短い映画'),event:'tv',service:'テレビ東京',program:'短い番組',time:'13:40'},{...film(45,'長い映画名が続く二行の作品'),event:'tv',service:'テレビ東京',program:'とても長い番組名が何行も続いていても共通レビューの下端が揃う番組',time:'13:40'}]}}));
   await context.route('**/data/movies.json*',r=>r.fulfill({json:{movies:films}}));
   await context.route('**/data/availability.json*',r=>r.fulfill({json:{movies:{42:{checked_at:'2026-10-24T00:00:00Z',flatrate:['Prime Video']},43:{checked_at:'2026-10-24T00:00:00Z',flatrate:[]}}}}));
   await context.route('**/data/special_screenings.json*',r=>r.fulfill({json:{screenings:[{id:11878,tmdbId:11878,title:'用心棒',date:'2026-10-02',end_date:'2026-10-15',event:'theatrical',service:'午前十時の映画祭',special_screening:'asa10',poster:'https://image.tmdb.org/t/p/w342/fixture.jpg'}]}}));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-24T00:00:00Z')});
   await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
   await page.locator('.modeTab[data-mode="theatrical"]').click();await page.locator('.streamMovieTitle').filter({hasText:'用心棒'}).waitFor();
   assert.equal(await page.locator('.streamMovieTitle').filter({hasText:'用心棒'}).count(),1,'one poster per finite period in displayed month');
   assert.match(await page.locator('.streamMovie').filter({has:page.locator('.streamMovieTitle').filter({hasText:'用心棒'})}).locator('.streamMovieDate.isPeriod').innerText(),/10\/02.*10\/15/);
   const tab=await page.locator('.modeTab.active').evaluate(e=>({background:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow}));assert.equal(tab.background,'rgba(0, 0, 0, 0)');assert(!tab.shadow.includes('239, 63, 63'));
   await page.locator('.modeTab[data-mode="streaming"]').click();await page.locator('.streamMovie .cinelva-rating-controls').first().waitFor();
   await page.locator('.streamMovieAvail').filter({hasText:'見放題 Prime Video'}).waitFor();
   assert.match(await page.locator('.streamMovieAvail').first().innerText(),/見放題 Prime Video/,'canonical TMDB ID finds observations despite local ID');
   assert.match(await page.locator('.streamMovieAvail').nth(1).innerText(),/Prime Video.*配信開始/,'official announcement remains visible without live providers');
   const boxes=await page.locator('.streamMovie>.cinelva-rating-controls').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {y:r.y,height:r.height};}));assert.equal(boxes.length,2);assert(Math.abs(boxes[0].y-boxes[1].y)<1,'review baselines align');assert.equal(boxes[0].height,boxes[1].height);
   await page.screenshot({path:`artifacts/reported-audit/${process.env.CINELVA_BROWSER||'chromium'}-${theme}-calendar.png`});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
   await page.locator('.modeTab[data-mode="tv"]').click();await page.locator('.tvMovie>.cinelva-rating-controls').first().waitFor();
   const tvBoxes=await page.locator('.tvMovie>.cinelva-rating-controls').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {bottom:r.bottom,height:r.height};}));assert.equal(tvBoxes.length,2);assert(Math.abs(tvBoxes[0].bottom-tvBoxes[1].bottom)<1,'TV reviews align despite unequal program text');assert.equal(tvBoxes[0].height,tvBoxes[1].height);
   for(const route of ['cinelva/index.html','cinelva/credits.html','discover.html','search.html','rankings.html','my-cinelva/index.html','credits.html','theaters.html']){
    await page.goto(`http://127.0.0.1:${port}/${route}`,{waitUntil:'domcontentloaded'});
    const images=page.locator('.gBrand img,.brand img');await images.first().waitFor();
    const sources=await images.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')));assert(sources.every(x=>x.includes('cinelva_original_colors_transparent.png')),route+' uses unchanged supplied frame');
    assert.equal(await page.locator('script[src*="cinelva-logo-frame"]').count(),0,route+' never loads destructive canvas transform');
    if(route==='credits.html')assert.equal(await page.getByRole('link',{name:'映画コンシェルジュ',exact:true}).count(),0);
   }
   await page.goto(`http://127.0.0.1:${port}/theaters.html?format=IMAX&prefecture=${encodeURIComponent('神奈川県')}`,{waitUntil:'domcontentloaded'});
   await page.locator('[data-format-filter="IMAX"]').click();await page.locator('#prefectureFilter').selectOption('神奈川県');await page.waitForFunction(()=>document.querySelector('#meta')?.textContent.includes('5件表示'));
   assert.match(await page.locator('#grid').innerText(),/横浜ブルク13/);assert.match(await page.locator('#grid').innerText(),/休止/);
   await context.close();
  }
  console.log('Reported UI audit: supplied logos, period dedupe, quiet tabs, provider evidence, review alignment and Kanagawa IMAX passed in both themes');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
