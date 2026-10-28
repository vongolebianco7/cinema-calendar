const {waitForLocalServer}=require('./helpers/local-server.cjs');
const {chromium,webkit}=require('playwright'),{spawn}=require('child_process'),net=require('net'),assert=require('assert/strict');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await waitForLocalServer(port);browser=await(process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch();
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.route('https://backend-one-gray-94.vercel.app/**',r=>r.abort());
  const theaters=[{name:'Cinema',source:'Wikidata',source_id:'Q1',lat:35,lon:139},{name:'Cinema',source:'Wikidata',source_id:'Q2',lat:36,lon:140},{name:'Cinema closed',status:'closed',source:'Wikidata',source_id:'Q3'}];
  await context.route('**/data/theaters_master.json?*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({theaters})}));
  await context.route('**/data/theaters_osm.json?*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({theaters:[{name:'Cinema',lat:35,lon:139,source:'OpenStreetMap',osm_type:'node',osm_id:1}]})}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/theaters.html?search=Cinema`);
  await page.locator('#grid .theaterTable').waitFor();
  assert.equal(await page.locator('#grid .theaterName').count(),2);
  assert.equal(await page.locator('#grid .theaterName').allTextContents().then(xs=>xs.some(s=>s.includes('closed'))),false);
  assert.match(await page.locator('#theaterOperationNote').innerText(),/営業状況は未確認/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  for(const width of [390,768,1280]) {
   await page.setViewportSize({width,height:844});
   const layout=await page.locator('#grid').evaluate(grid=>({
    grid:grid.getBoundingClientRect().width,
    table:grid.querySelector('.theaterTableWrap').getBoundingClientRect().width,
    hintWidth:grid.querySelector('.tableHint').getBoundingClientRect().width,
    hintHeight:grid.querySelector('.tableHint').getBoundingClientRect().height
   }));
   assert.ok(layout.table>=layout.grid-2,`cinema search table must span full directory at${width}px: ${JSON.stringify(layout)}`);
   if(layout.hintHeight)assert.ok(layout.hintWidth>=layout.grid-2,`table scroll hint must span full directory at${width}px`);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }
  // Source-verified cinema branches must be discoverable by common abbreviated names.
  await page.goto(`http://127.0.0.1:${port}/theaters.html?prefecture=神奈川県&search=TOHO川崎`);
  await page.locator('#grid .theaterTable').waitFor();
  assert.match(await page.locator('#grid .theaterName').allTextContents().then(xs=>xs.join(' ')),/TOHOシネマズ 川崎/);
  await page.evaluate(()=>document.documentElement.dataset.theme='light');
  const color=await page.locator('#grid .theaterName').first().evaluate(el=>getComputedStyle(el).color);
  assert.notEqual(color,'rgb(238, 238, 238)','light theater names must not be near-white');
  await page.locator('#q').fill('109シネマズ川崎');
  await page.locator('#grid .theaterTable').waitFor();
  assert.match(await page.locator('#grid .theaterTable').innerText(),/IMAXレーザー/);
  await page.locator('#q').fill('TOHO川崎');
  await page.locator('.schedulePanel summary').click();
  await page.locator('#scheduleQ').fill('TOHO川崎');
  await page.locator('#theaterChips .chip').first().click();
  assert.match(await page.locator('#theaterDetail').innerText(),/TOHOシネマズ 川崎/);
  assert.ok(await page.locator('#theaterDetail a.official').count()>0);
  assert.deepEqual(errors,[]);
  console.log('Theater directory excludes known closure and duplicate source while retaining different same-name locations at390px');
 }finally{await browser?.close();server.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1;});
