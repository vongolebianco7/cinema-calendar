const {chromium,webkit}=require('playwright');
const {spawn}=require('node:child_process');
const net=require('node:net');
const path=require('node:path');
const assert=require('node:assert/strict');

async function freePort(){
 const socket=net.createServer();
 await new Promise(ok=>socket.listen(0,'127.0.0.1',ok));
 const port=socket.address().port;
 await new Promise(ok=>socket.close(ok));
 return port;
}
(async()=>{
 const port=await freePort();
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});
 let browser;
 try{
  const base='http://127.0.0.1:'+port;
  for(let n=0;n<80;n++){
   try{const res=await fetch(base);if(res.ok)break;}catch{}
   if(n===79)throw Error('local server did not start');
   await new Promise(ok=>setTimeout(ok,100));
  }
  browser=await (process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.route(/^https:\/\//,route=>route.abort());
  await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.CinelvaQuickRate&&window.CinelvaLibraryRecords));
  await page.evaluate(()=>{
   window.CinelvaRatingResolve=index=>[{id:991001,title:'Calendar A'}, {id:991002,title:'Calendar B'}][Number(index)];
   document.querySelector('#dates').innerHTML='<article class="streamMovie" data-mi="0">Calendar A</article><article class="streamMovie" data-mi="1">Calendar B</article>';
  });
  await page.locator('#dates .cinelva-rate-button').first().waitFor();
  assert.equal(await page.locator('#dates .cinelva-rate-button').count(),2);
  await page.locator('#dates .cinelva-rate-button').first().click();
  assert.equal(await page.locator('#cinelvaRateTitle').innerText(),'Calendar A');
  assert.equal(await page.locator('#cinelvaRateScore').inputValue(),'0');
  await page.locator('#cinelvaRatePlace').selectOption('配信');
  await page.locator('#cinelvaRateComment').fill('初めてのコメント');
  await page.locator('#cinelvaRateSave').click();
  assert.match(await page.locator('#dates .cinelva-saved-score').first().innerText(),/★ 0\.0 保存済み/);
  await page.locator('#cinelvaRateNext').click();
  assert.equal(await page.locator('#cinelvaRateTitle').innerText(),'Calendar B');
  await page.locator('#cinelvaRateScore').evaluate(input=>{input.value='4.5';input.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#cinelvaRateSave').click();
  assert.equal(await page.locator('#dates .cinelva-saved-score').count(),2);
  await page.goto(base+'/rankings.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.CinelvaQuickRate&&window.CinelvaLibraryRecords));
  await page.evaluate(()=>{
   document.querySelector('#grid').innerHTML='<a class="rankCard" href="search.html?id=991001&search=Calendar%20A"><div class="title">Calendar A</div></a><a class="rankCard" href="search.html?id=991003&search=Rank%20C"><div class="title">Rank C</div></a>';
  });
  await page.locator('#grid .cinelva-rate-button').first().waitFor();
  await page.locator('#grid .cinelva-saved-score').first().waitFor();
  assert.match(await page.locator('#grid .cinelva-saved-score').first().innerText(),/0\.0 保存済み/);
  await page.locator('#grid .cinelva-rate-button').first().click();
  assert.equal(await page.locator('#cinelvaRateComment').inputValue(),'初めてのコメント');
  await page.locator('#cinelvaRateNext').click();
  assert.equal(await page.locator('#cinelvaRateTitle').innerText(),'Rank C');
  await page.locator('#cinelvaRateSave').click();
  const stored=await page.evaluate(()=>window.CinelvaLibraryRecords.all());
  assert.equal(stored.length,3);
  assert.equal(stored.find(r=>r.id==='991003').rating,0);
  assert.equal(stored.find(r=>r.id==='991001').viewingMethod,'配信');
  console.log((process.env.CINELVA_BROWSER||'chromium')+' calendar/rankings continuous rating and saved badges passed');
 }finally{
  if(browser)await browser.close();
  server.kill();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
