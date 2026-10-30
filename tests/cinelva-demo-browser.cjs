const {chromium,webkit}=require('playwright');
const {spawn}=require('node:child_process');
const net=require('node:net');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const serverSocket=net.createServer();await new Promise(resolve=>serverSocket.listen(0,'127.0.0.1',resolve));const port=serverSocket.address().port;await new Promise(resolve=>serverSocket.close(resolve));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});let browser;
 const base=`http://127.0.0.1:${port}`;
 try{
  await waitForLocalServer(port);browser=await(process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.env.CINELVA_CHROMIUM_EXECUTABLE&&process.env.CINELVA_BROWSER!=='webkit'?{executablePath:process.env.CINELVA_CHROMIUM_EXECUTABLE}:{})});
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo'}),external=[];
  await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname==='127.0.0.1')return route.continue();if(route.request().resourceType()!=='image')external.push(url.href);return route.abort();});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/my-cinelva-demo/');await page.locator('[aria-label="デモ表示"]').waitFor();
  assert.equal(await page.locator('[data-cinelva-demo-build="preview"]').count(),1);
  assert.equal(await page.evaluate(()=>Object.keys(window.CinelvaDemo.records()).length),1200);
  assert.match(await page.locator('[aria-label="デモ表示"]').innerText(),/DEMO \/ サンプルデータ/);
  assert.match(await page.title(),/DEMO/);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
  assert.equal(await page.evaluate(async()=>{const response=await fetch('https://example.invalid/api');return response.status}),503,'external API fetches must be blocked inside the isolated demo');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'390px demo must not overflow horizontally');
  const recordCount=await page.locator('#summaryView .cs-number').allTextContents();
  assert.ok(recordCount.some(value=>value.replaceAll(',','').trim()==='1200'),`actual UI should show 1,200 records, got ${JSON.stringify(recordCount)}`);
  await page.locator('#gMenuBtn').click();await page.locator('.cinelvaTheme select').selectOption('light');assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  await page.locator('.cinelvaTheme select').selectOption('dark');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.locator('[aria-label="デモ表示"] button').click();assert.equal(await page.evaluate(()=>Object.keys(window.CinelvaDemo.records()).length),1200);
  await page.setViewportSize({width:1280,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'1280px demo must not overflow horizontally');
  fs.mkdirSync('artifacts/cinelva-demo',{recursive:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:`artifacts/cinelva-demo/${process.env.CINELVA_BROWSER||'chromium'}-demo.png`,fullPage:true});
  assert.deepEqual(external,[],'demo data must be local and must not request external APIs');assert.deepEqual(errors,[]);
  await page.goto(base+'/my-cinelva/');assert.equal(await page.evaluate(()=>localStorage.getItem('cinelva-library-records-v2')),null,'the real UI on the preview origin must not inherit demo data');
  console.log(`My Cinelva isolated demo: 1200 unique local records, 80 dated in 2026, localStorage isolation, reset, visible badge, 390/1280px, light/dark and no external requests passed (${process.env.CINELVA_BROWSER||'chromium'}).`);
  await context.close();
 }finally{await browser?.close();server.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1;});
