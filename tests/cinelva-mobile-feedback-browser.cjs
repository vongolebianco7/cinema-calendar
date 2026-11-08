const assert=require('node:assert/strict'),fs=require('node:fs'),net=require('node:net'),{spawn}=require('node:child_process');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
const {assertTextContrast}=require('./helpers/text-contrast.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 const engine=process.env.CINELVA_BROWSER||'chromium';
 const movies=Array.from({length:10},(_,i)=>({id:100+i,tmdbId:100+i,title:i?'映画 '+i:'ウルフ・オブ・ウォールストリート',original_title:i?'Original '+i:'The Wolf of Wall Street',release_date:'2013-10-10',runtime:121,year:2013,director:'Hidden Director',poster:'https://image.tmdb.org/t/p/w342/fixture.jpg',score:8,votes:100,watched:true,rating:5,watchedAt:'2026-10-30'}));
 try{
  await waitForLocalServer(port);browser=await require('playwright')[engine].launch();fs.mkdirSync('artifacts/reported-audit/mobile-feedback',{recursive:true});
  for(const width of [320,390,1280])for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width,height:844},colorScheme:theme});
   await context.addInitScript(({theme,movies})=>{localStorage.setItem('cinelva-theme-v1',theme);localStorage.setItem('cinemap-my-list',JSON.stringify(movies));localStorage.setItem('cinelva-library-records-v2',JSON.stringify(Object.fromEntries(movies.map(m=>[m.id,m]))));const nativeFetch=window.fetch.bind(window);window.fetch=async(input,init)=>{const url=typeof input==='string'?input:(input&&input.url)||'';if(/^https:\/\/backend-one-gray-94\.vercel\.app\/api\//.test(url))return new Response('{"movie":null,"movies":[],"external":[],"results":[]}',{status:200,headers:{'content-type':'application/json'}});return nativeFetch(input,init)};},{theme,movies});
   await context.route('https://**/*',route=>route.abort());
   await context.route('https://image.tmdb.org/**',route=>route.fulfill({path:'assets/cinelva_original_colors_transparent.png',headers:{'access-control-allow-origin':'*'}}));
   await context.route('**/data/movies.json*',route=>route.fulfill({json:{movies}}));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>{if(!/backend-one-gray-94\.vercel\.app\/api\/movies.*due to access control checks/.test(e.message))errors.push(e.message);});
   const base=`http://127.0.0.1:${port}/`;
   for(const route of ['index.html','search.html','rankings.html','my-cinelva/','my-best10.html']){
    await page.goto(base+route,{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#gDrawer a[href$="my-best10.html"]').count(),1,route+' common Best 10 entry');
    assert.equal(await page.locator('header .gBrandWord').evaluate(el=>getComputedStyle(el).fontWeight),'600');
    if(route==='my-best10.html'){
     assert.equal(await page.locator('#format').getAttribute('type'),'hidden','Best 10 exports use the agreed fixed portrait format');
     assert.equal(await page.locator('#format').inputValue(),'portrait');
     assert.equal(await page.locator('.exportAspectLabel').textContent(),'画像サイズ 縦長 · 4:5','only the agreed vertical image shape is offered');
     await page.selectOption('#artworkTitleMode','original');
     await page.waitForFunction(()=>document.querySelector('#artCanvas')?.getAttribute('aria-label')?.includes('The Wolf of Wall Street'));
     assert.match(await page.locator('#artCanvas').getAttribute('aria-label'),/The Wolf of Wall Street/,'original title is rendered in the shareable image');
     await page.selectOption('#artworkTitleMode','japanese');
     await page.waitForFunction(()=>document.querySelector('#artCanvas')?.getAttribute('aria-label')?.includes('ウルフ・オブ・ウォールストリート'));
     await page.locator('#saveList').click();
     assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cinemap-my-saved-list')).artworkTitleMode),'japanese','title mode persists with the existing Best 10 image settings');
     await page.evaluate(()=>localStorage.setItem('cinemap-my-saved-list',JSON.stringify({...JSON.parse(localStorage.getItem('cinemap-my-saved-list')),format:'landscape'})));
     await page.locator('#loadList').click();
     assert.equal(await page.locator('#format').inputValue(),'portrait','legacy saved shape settings are normalized without changing movie records');
     await page.waitForFunction(()=>document.querySelector('#list .item'));
     await assertTextContrast(page,['#list .item>b','#list .item a','#list .compactMovieMeta'],`${theme} best10`);
     for(const layout of ['single','double']){
      await page.evaluate(layout=>{document.getElementById('layout').value=layout;drawArtwork(picks);},layout);
      assert.deepEqual(await page.locator('#artCanvas').evaluate(c=>[c.width,c.height]),[1600,2000],'all layouts keep the same portrait export dimensions');
      assert.ok(await page.locator('#artCanvas').getAttribute('aria-label'));
     }
     await page.selectOption('#layout','double');await page.evaluate(()=>drawArtwork(picks));
     await page.waitForFunction(()=>artworkReady());
     assert.ok(await page.locator('#artCanvas').evaluate(c=>c.toDataURL('image/png').startsWith('data:image/png')),'CORS-safe PNG');
     // Inspect raster pixels as well as DOM text; a nonempty data URL alone can be blank.
     const pixels=await page.locator('#artCanvas').evaluate(c=>{
      const ctx=c.getContext('2d'),rows=[];
      for(const x of [204,912])for(let row=0;row<5;row++){
       const data=ctx.getImageData(x,Math.round(232+row*323.6+74),110,170).data;
       let dark=0;for(let k=0;k<data.length;k+=4)if(data[k]+data[k+1]+data[k+2]<300)dark++;
       rows.push(dark/(data.length/4));
      }
      return rows;
     });
     assert.ok(pixels.every(value=>value>.2),'every ranking row contains its poster in the actual PNG: '+JSON.stringify(pixels));
     if(width===390){
      const png=await page.locator('#artCanvas').evaluate(c=>c.toDataURL('image/png').split(',')[1]);
      fs.writeFileSync(`artifacts/reported-audit/mobile-feedback/${engine}-${theme}-390-export.png`,Buffer.from(png,'base64'));
     }
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     assert.doesNotMatch(await page.locator('#artCanvas').getAttribute('aria-label'),/Hidden Director|2013/);
    }
    if(route==='my-cinelva/'){
     const facts=await page.evaluate(()=>{const card=document.createElement('article');card.className='want-watch-item';const poster=document.createElement('div');poster.className='want-watch-poster';const title=document.createElement('strong');title.textContent='Metadata fixture';card.append(poster,title);document.body.append(card);window.CinelvaMovieIdentity.hydrateCard(poster,{title:'Metadata fixture',runtime:121,release_date:'2013-10-10'});return card.querySelector('.cinelvaMovieMetadata')?.textContent;});
     assert.equal(facts,'121分 · 2013/10/10','shared movie cards show runtime and full release date');
     assert.equal(await page.locator('#csTop').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),width<=360?2:width<=600?3:5,'readable Top 10 columns');
     const cards=page.locator('#csTop .cinelva-rating-controls');await cards.first().waitFor();
     assert.equal(await cards.first().locator('.rating-caption').allTextContents().then(a=>a.join(',')),'MY,TMDB');
     await assertTextContrast(page,['#csTop .rating-caption','#csTop .rating-value'],`${theme} top10`);
     const fit=await cards.evaluateAll(cards=>cards.every(card=>[...card.querySelectorAll('.rating-caption,.rating-value')].every(el=>{const b=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return el.scrollWidth<=el.clientWidth+1&&b.left>=p.left-1&&b.right<=p.right+1})));
     assert.ok(fit,'labels and scores fit without clipping');
     if(theme==='light')assert.equal(await cards.first().locator('.rating-caption').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(245, 211, 108)');
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),route+' no overflow');
    await page.screenshot({path:`artifacts/reported-audit/mobile-feedback/${engine}-${theme}-${width}-${route.replace(/\W/g,'_')}.png`,fullPage:route==='my-best10.html'});
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(engine+': mobile feedback regressions passed');
 }finally{await browser?.close();server.kill('SIGTERM')}
})().catch(e=>{console.error(e);process.exitCode=1});
