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
  assert.deepEqual(errors,[]);
  console.log('Theater directory excludes known closure and duplicate source while retaining different same-name locations at390px');
 }finally{await browser?.close();server.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1;});
