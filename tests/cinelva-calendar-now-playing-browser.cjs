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
  console.log('Calendar labels: root/prefix, light/dark, theatrical/streaming/TV, exact IDs, rerenders, expiry and overflow passed');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
