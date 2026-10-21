const {waitForLocalServer}=require('./helpers/local-server.cjs');
const {chromium,webkit}=require('playwright'),{spawn}=require('child_process'),net=require('net'),assert=require('assert/strict');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await waitForLocalServer(port);browser=await(process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch();
  const context=await browser.newContext({viewport:{width:390,height:844}});await context.route('https://backend-one-gray-94.vercel.app/**',r=>r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/my-cinelva/`);
  await page.locator('#gMenuBtn').click();
  const link=page.getByRole('link',{name:'情報源と収録日時',exact:true});
  assert.match(await link.getAttribute('href'),/\/credits.html#data-status$/);
  await link.click();await page.waitForURL('**/credits.html#data-status');
  await page.locator('[data-source-category="editorial-features"]').waitFor();
  assert.equal(await page.locator('.source-status-item').count(),9);
  assert.match(await page.locator('[data-source-category="theater-directory"]').innerText(),/自動更新停止中[\s\S]*営業状況は未確認/);
  assert.match(await page.locator('[data-source-category="television-schedules"]').innerText(),/掲載していません[\s\S]*収録日時：未確認/);
  assert.match(await page.locator('[data-source-category="streaming-availability"]').innerText(),/一覧生成時点[\s\S]*未観測の作品もあります/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('cinelva-library-records-v2')),null);
  await page.waitForLoadState('networkidle');
  await context.route('**/data/source-status.json',r=>r.fulfill({status:503,body:'unavailable'}));
  await page.reload();await page.getByText('収録状態を取得できませんでした。以下の個別の出典をご確認ください。',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('Source provenance link,9categories,unknown/disabled/observation states and fetch failure pass at390px without record writes');
 }finally{await browser?.close();server.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1;});
