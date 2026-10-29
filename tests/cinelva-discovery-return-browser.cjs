'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),net=require('node:net'),{spawn}=require('node:child_process');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await waitForLocalServer(port);browser=await require('playwright')[process.env.CINELVA_BROWSER||'chromium'].launch();
  for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width:390,height:844}}),errors=[];let agentCalls=0,directorRequests=0;
   await context.addInitScript(value=>localStorage.setItem('cinelva-theme-v1',value),theme);
   await context.route('https://**/*',r=>r.fulfill({status:503,headers:{'access-control-allow-origin':'*'},json:{}}));
   await context.route('**/data/{movies,theatrical,streaming}.json*',r=>r.fulfill({json:{movies:[]}}));
   await context.route('**/data/backend.json*',r=>r.fulfill({json:{enabled:false}}));
   await context.route('https://image.tmdb.org/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#777"/></svg>'}));
   const headers={'access-control-allow-origin':'*'},movie={id:42,tmdbId:42,title:'監督作品テスト',year:2010,release_date:'2010-01-01',score:8,votes:1000,runtime:120,poster:'https://image.tmdb.org/t/p/w342/fixture.jpg'};
   await context.route('**/api/people?*',r=>r.fulfill({headers,json:{ids:[42],person:{id:525,name:'クリストファー・ノーラン'},credits:{director:[movie]}}}));
   await context.route('**/api/watch-providers',async r=>{await new Promise(resolve=>setTimeout(resolve,150));return r.fulfill({headers,json:{providers:[{provider_id:8,provider_name:'Netflix'},{provider_id:999,provider_name:'追加サービス'}]}})});
   await context.route('**/api/discover?*',async r=>{const p=new URL(r.request().url()).searchParams;if(p.get('crew')==='525')directorRequests++;else await new Promise(resolve=>setTimeout(resolve,300));return r.fulfill({headers,json:{movies:[movie,{...movie,id:77,tmdbId:77,title:'別の監督の作品',year:1995,release_date:'1995-01-01'}],total_results:2,total_pages:1}})});
   await context.route('**/api/movie-detail?*',r=>r.fulfill({headers,json:{movie:{...movie,overview:'テスト用の作品情報',credits:{crew:[],cast:[]}}}}));
   await context.route('**/api/agent',r=>{agentCalls++;return r.fulfill({headers,json:{answer:'不正な汎用回答',movies:[]}})});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${port}/discover.html?mode=concierge`,{waitUntil:'domcontentloaded'});
   await page.locator('#conciergeQ').fill('ノーラン映画');await page.locator('#conciergeSend').click();
   await page.locator('#grid .card[data-id="42"]').waitFor();assert.equal(await page.locator('#grid .card').count(),1,'mixed upstream results must be restricted to verified Nolan credit IDs');
   assert.equal(agentCalls,0,'director intent bypasses generic recommendation endpoint');assert.ok(directorRequests>0);
   await page.locator('#era').selectOption('2010');
   await page.locator('#providerChecks').scrollIntoViewIfNeeded();await page.locator('#providerChecks input[value="999"]').check();
   const card=page.locator('#grid .card[data-id="42"]');await card.scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY);
   await card.click();await page.waitForURL('**/search.html?id=42&search=*');await page.locator('#close').click();await page.waitForURL('**/discover.html*');
   await page.locator('#grid .card[data-id="42"]').waitFor();
   // Force a reload as well: bfcache alone must not hide a lost history snapshot.
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('#grid .card[data-id="42"]').waitFor();
   assert.equal(await page.locator('#grid .card').count(),1);assert.equal(await page.locator('#era').inputValue(),'2010');
   assert.equal(await page.locator('#director').inputValue(),'クリストファー・ノーラン');
   assert.equal(await page.locator('#providerChecks input[value="999"]').isChecked(),true,'dynamically loaded provider selection survives return before metadata reload');
   await page.waitForFunction(y=>Math.abs(scrollY-y)<80,before,{timeout:5000});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
   await page.locator('[data-p="classic"]').click();await page.locator('[data-availability="unknown"]').click();
   await page.locator('#catalogPopularGrid .presetCard[data-popular-id="77"]').click();await page.waitForURL('**/search.html?id=77&search=*');
   await page.locator('#close').click();await page.waitForURL('**/discover.html*');await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#catalogPopularGrid .presetCard[data-popular-id="77"]').waitFor();
   assert.equal(await page.locator('[data-p="classic"]').evaluate(node=>node.classList.contains('active')),true,'popular shelf preset survives its own detail navigation');
   assert.equal(await page.locator('[data-availability="unknown"]').getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#providerChecks input[value="999"]').isChecked(),true);assert.deepEqual(errors,[]);
   fs.mkdirSync('artifacts/discovery-return',{recursive:true});await page.screenshot({path:`artifacts/discovery-return/${process.env.CINELVA_BROWSER||'chromium'}-${theme}.png`});await context.close();
  }
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1});
