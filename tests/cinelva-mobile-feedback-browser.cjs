const assert=require('node:assert/strict'),fs=require('node:fs'),net=require('node:net'),{spawn}=require('node:child_process');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
const {assertTextContrast}=require('./helpers/text-contrast.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 const engine=process.env.CINELVA_BROWSER||'chromium';
 const movies=Array.from({length:10},(_,i)=>({id:100+i,tmdbId:100+i,title:i?'映画 '+i:'ウルフ・オブ・ウォールストリート',year:2013,director:'Hidden Director',poster:'https://image.tmdb.org/t/p/w342/fixture.jpg',score:8,votes:100,watched:true,rating:5,watchedAt:'2026-10-30'}));
 try{
  await waitForLocalServer(port);browser=await require('playwright')[engine].launch();fs.mkdirSync('artifacts/mobile-feedback',{recursive:true});
  for(const width of [320,390,1280])for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width,height:844},colorScheme:theme});
   await context.addInitScript(({theme,movies})=>{localStorage.setItem('cinelva-theme-v1',theme);localStorage.setItem('cinemap-my-list',JSON.stringify(movies));localStorage.setItem('cinelva-library-records-v2',JSON.stringify(Object.fromEntries(movies.map(m=>[m.id,m]))));},{theme,movies});
   await context.route('https://**/*',route=>route.abort());
   await context.route('https://image.tmdb.org/**',route=>route.fulfill({path:'assets/cinelva_original_colors_transparent.png',headers:{'access-control-allow-origin':'*'}}));
   await context.route('**/data/movies.json*',route=>route.fulfill({json:{movies}}));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const base=`http://127.0.0.1:${port}/`;
   for(const route of ['index.html','search.html','rankings.html','my-cinelva/','my-best10.html']){
    await page.goto(base+route,{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#gDrawer a[href$="my-best10.html"]').count(),1,route+' common Best 10 entry');
    assert.equal(await page.locator('header .gBrandWord').evaluate(el=>getComputedStyle(el).fontWeight),'600');
    if(route==='my-best10.html'){
     await page.waitForFunction(()=>document.querySelector('#list .compactMovieItem'));
     await assertTextContrast(page,['#list .item>b','#list .item a','#list .compactMovieMeta'],`${theme} best10`);
     for(const format of ['portrait','square','landscape'])for(const layout of ['single','double']){
      await page.evaluate(({format,layout})=>{document.getElementById('format').value=format;document.getElementById('layout').value=layout;drawArtwork(picks);},{format,layout});
      assert.ok(await page.locator('#artCanvas').getAttribute('aria-label'));
     }
     await page.selectOption('#format','portrait');await page.selectOption('#layout','double');
     await page.waitForFunction(()=>artworkReady());
     assert.ok(await page.locator('#artCanvas').evaluate(c=>c.toDataURL('image/png').startsWith('data:image/png')),'CORS-safe PNG');
     assert.doesNotMatch(await page.locator('#artCanvas').getAttribute('aria-label'),/Hidden Director|2013/);
    }
    if(route==='my-cinelva/'){
     const cards=page.locator('#csTop .cinelva-rating-controls');await cards.first().waitFor();
     assert.equal(await cards.first().locator('.rating-caption').allTextContents().then(a=>a.join(',')),'MY,TMDB');
     await assertTextContrast(page,['#csTop .rating-caption','#csTop .rating-value'],`${theme} top10`);
     const fit=await cards.evaluateAll(cards=>cards.every(card=>[...card.querySelectorAll('.rating-caption,.rating-value')].every(el=>{const b=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return el.scrollWidth<=el.clientWidth+1&&b.left>=p.left-1&&b.right<=p.right+1})));
     assert.ok(fit,'labels and scores fit without clipping');
     if(theme==='light')assert.equal(await cards.first().locator('.rating-caption').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(245, 211, 108)');
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),route+' no overflow');
    await page.screenshot({path:`artifacts/mobile-feedback/${engine}-${theme}-${width}-${route.replace(/\W/g,'_')}.png`,fullPage:route==='my-best10.html'});
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(engine+': mobile feedback regressions passed');
 }finally{await browser?.close();server.kill('SIGTERM')}
})().catch(e=>{console.error(e);process.exitCode=1});
