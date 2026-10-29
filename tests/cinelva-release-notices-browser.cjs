'use strict';
const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright'),{spawn}=require('node:child_process'),net=require('node:net'),{waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(resolve=>listener.listen(0,'127.0.0.1',resolve));const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await waitForLocalServer(port);browser=await(process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch();const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.route('**/data/movies.json',route=>route.fulfill({json:{movies:[{id:42,tmdbId:42,title:'公開予定の映画',year:2025,date:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo'}).format(new Date()),event:'theatrical',service:'劇場公開',source:'公式発表',source_url:'https://example.com/official'}]}}));
  await context.route('**/data/streaming.json',route=>route.fulfill({json:{movies:[]}}));
  await context.addInitScript(()=>{if(sessionStorage.getItem('cinelva-release-notice-fixture-seeded'))return;sessionStorage.setItem('cinelva-release-notice-fixture-seeded','1');localStorage.setItem('cinelva-want-to-watch-v1',JSON.stringify({'42':{id:'42',tmdbId:'42',title:'公開予定の映画',year:2025,savedAt:'2026-01-01T00:00:00Z'}}));localStorage.setItem('cinelva-release-notices-enabled-v1','0');localStorage.setItem('cinelva-library-records-v2',JSON.stringify({999:{id:'999',title:'保持する既存記録',year:2000,rating:4,watchedAt:'2026-01-01'}}));});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:${port}/my-cinelva/`);
  assert.equal(await page.locator('#cinelvaReleaseNoticeToggle').isChecked(),false);await page.locator('[data-tab="watchlist"]').click();
  assert.match(await page.locator('.cinelva-release-notice-status').innerText(),/オフ/);
  await page.locator('#cinelvaReleaseNoticeToggle').check();await page.getByText('今日が公開・配信予定日の映画：1本').waitFor();
  assert.match(await page.locator('#cinelvaReleaseNoticeList').innerText(),/公開予定の映画/);assert.equal(await page.locator('#cinelvaReleaseNoticeList a').getAttribute('href'),'https://example.com/official');
  await page.locator('#cinelvaReleaseNoticeList button').click();assert.match(await page.locator('.cinelva-release-notice-status').innerText(),/お知らせはありません/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cinelva-library-records-v2'))['999'].title),'保持する既存記録');
  await page.reload();await page.locator('[data-tab="watchlist"]').click();assert.match(await page.locator('.cinelva-release-notice-status').innerText(),/お知らせはありません/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'watchlist notification layout must fit iPhone width');assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser?.close();server.kill();}
 console.log(`${process.env.CINELVA_BROWSER==='webkit'?'WebKit':'Chromium'} release notice browser flow passed at 390px`);
})().catch(error=>{console.error(error);process.exitCode=1;});
