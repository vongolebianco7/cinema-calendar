'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),net=require('node:net'),{spawn}=require('node:child_process');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 const date=new Date().toISOString().slice(0,10),film=(id,event)=>({id,tmdbId:id,title:id===42?'上映中確認作品':'同名判定禁止',year:2026,date,event,service:event==='streaming'?'Netflix':event==='tv'?'日本テレビ':'劇場公開',poster:'https://image.tmdb.org/t/p/w342/fixture.jpg',score:7,source_url:'https://kinro.ntv.co.jp/',time:'21:00'});
 try{
  await waitForLocalServer(port);browser=await require('playwright')[process.env.CINELVA_BROWSER||'chromium'].launch();fs.mkdirSync('artifacts/now-playing',{recursive:true});
  for(const theme of ['light','dark'])for(const route of ['index.html','cinelva/index.html']){
   const context=await browser.newContext({viewport:{width:390,height:844}});await context.addInitScript(t=>localStorage.setItem('cinelva-theme-v1',t),theme);
   await context.route('https://**/*',r=>r.fulfill({status:503,headers:{'access-control-allow-origin':'*'},json:{}}));
   await context.route('https://image.tmdb.org/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#555"/></svg>'}));
   await context.route('**/data/backend.json*',r=>r.fulfill({json:{enabled:false}}));
   await context.route('**/data/movies.json*',r=>r.fulfill({json:{movies:['theatrical','streaming'].flatMap(event=>[film(42,event),film(43,event)])}}));
   await context.route('**/data/tv.json*',r=>r.fulfill({json:{movies:[film(42,'tv'),film(43,'tv')]}}));
   await context.route('**/data/now_playing.json*',r=>r.fulfill({json:{schema_version:1,region:'JP',complete:true,generated_at:new Date().toISOString(),source:{id:'tmdb',endpoint:'/movie/now_playing'},movies:[{id:42,title:'上映中確認作品'}]}}));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date()});
   await page.goto(`http://127.0.0.1:${port}/${route}`,{waitUntil:'domcontentloaded'});
   for(const mode of ['theatrical','streaming','tv']){
    await page.locator(`.modeTab[data-mode="${mode}"]`).click();await page.locator('.calendar [data-now-film-id="42"] > .cinelva-now-playing-label').first().waitFor();
    assert.equal(await page.locator('[data-now-film-id="43"] > .cinelva-now-playing-label').count(),0);
    assert.equal(await page.locator('.cinelva-now-playing-label .cinelva-now-playing-label').count(),0);
    assert.equal(await page.locator('.calendar [data-now-film-id="42"] .cinelva-now-playing-label').first().innerText(),'上映中');
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.locator('.calendar').screenshot({path:`artifacts/now-playing/calendar-label-${process.env.CINELVA_BROWSER||'chromium'}-${theme}-${route.replace('/','-')}.png`});
   await page.clock.fastForward(37*3600000);assert.equal(await page.locator('.cinelva-now-playing-label').count(),0,'open pages expire current status');
   assert.deepEqual(errors,[]);await context.close();
  }
  // Every real entry point must bootstrap labels through the shared identity module.
  for(const route of ['search.html','discover.html','rankings.html','revivals.html','my-cinelva/index.html','events.html','experience.html','critic.html','cinelva/discover.html']){
   const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
   const today=new Date(Date.now()+9*3600000).toISOString().slice(0,10),yesterday=new Date(Date.now()+9*3600000-86400000).toISOString().slice(0,10);
   await context.route('https://**/*',r=>r.fulfill({status:503,headers:{'access-control-allow-origin':'*'},json:{}}));
   await context.route('https://image.tmdb.org/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#555"/></svg>'}));
   await context.route('**/data/backend.json*',r=>r.fulfill({json:{enabled:false}}));
   await context.route('**/data/now_playing.json*',r=>r.fulfill({json:{schema_version:1,region:'JP',complete:true,generated_at:new Date().toISOString(),source:{id:'tmdb',endpoint:'/movie/now_playing'},movies:[{id:42,title:'上映中'}]}}));
   await context.route('**/data/special_screenings.json*',r=>r.fulfill({json:{screenings:[{id:44,date:today,end_date:today,source_url:'https://asa10.eiga.com/2026/schedule/'}]}}));
   await context.route('**/data/revival_screenings.json*',r=>r.fulfill({json:{screenings:[{tmdbId:45,date:today,end_date:today,source_url:'https://www.ttcg.jp/official'},{tmdbId:46,date:yesterday,end_date:yesterday,source_url:'https://www.ttcg.jp/official'},{tmdbId:47,date:today,source_url:'https://www.ttcg.jp/official'}]}}));
   await page.goto(`http://127.0.0.1:${port}/${route}`,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.CinelvaCalendarNowPlaying);
   await page.evaluate(()=>{
    const section=document.createElement('section');section.id='shared-label-proof';section.style='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px';
    section.innerHTML=[42,43,44,45,46,47].map(id=>`<a href="search.html?id=${id}"><img src="https://image.tmdb.org/t/p/w342/fixture.jpg" style="display:block;width:100%;aspect-ratio:2/3"><span>作品${id}</span></a>`).join('');
    section.insertAdjacentHTML('beforeend','<a class="rankCard" id="rank-failure-proof" href="search.html?id=43"><img src="https://image.tmdb.org/t/p/w342/fixture.jpg" style="width:100%" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="rankPosterPlaceholder" hidden>ポスター未取得</span></a>');
    document.body.prepend(section);
    const holder=document.createElement('div');holder.className='poster';holder.id='direct-hydrated-poster';section.append(holder);window.CinelvaMovieIdentity.hydrateCard(holder,{tmdbId:44,poster:'https://image.tmdb.org/t/p/w342/fixture.jpg'});
   });
   for(const id of [42,44,45])await page.locator(`#shared-label-proof [data-now-film-id="${id}"] > .cinelva-now-playing-label`).first().waitFor();
   for(const id of [43,46,47])assert.equal(await page.locator(`#shared-label-proof [data-now-film-id="${id}"] > .cinelva-now-playing-label`).count(),0,route+' does not infer ended/start-only');
   assert.equal(await page.locator('#direct-hydrated-poster > .cinelva-now-playing-label').count(),1);
   await page.locator('#rank-failure-proof .cinelva-label-poster').waitFor();
   await page.locator('#rank-failure-proof img').dispatchEvent('error');
   assert.equal(await page.locator('#rank-failure-proof .rankPosterPlaceholder').isVisible(),true,'real rank-card failure fallback survives label wrapper');
   const sizes=await page.locator('#shared-label-proof .cinelva-now-playing-label').evaluateAll(nodes=>nodes.map(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return a.left>=b.left&&a.right<=b.right+1&&a.width>0;}));assert(sizes.every(Boolean),route+' badges fit posters');
   await page.locator('#shared-label-proof').screenshot({path:`artifacts/now-playing/shared-label-${process.env.CINELVA_BROWSER||'chromium'}-${route.replace('/','-')}.png`});
   await context.close();
  }
  console.log('Calendar labels: root/prefix, light/dark, theatrical/streaming/TV, exact IDs, rerenders, expiry and overflow passed');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
