'use strict';
const assert=require('node:assert/strict'),net=require('node:net'),{spawn}=require('node:child_process');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await waitForLocalServer(port);
  const launch=process.env.CINELVA_CHROMIUM_EXECUTABLE?{executablePath:process.env.CINELVA_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote']}:{};
  browser=await require('playwright')[process.env.CINELVA_BROWSER||'chromium'].launch(launch);
  for(const path of ['discover.html','cinelva/discover.html'])for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width:390,height:844}});await context.addInitScript(t=>localStorage.setItem('cinelva-theme-v1',t),theme);
   await context.route('https://**/*',r=>r.fulfill({status:503,headers:{'access-control-allow-origin':'*'},json:{}}));
   let release;const gate=new Promise(r=>release=r);
   const providers=Array.from({length:40},(_,i)=>({provider_id:i+1,provider_name:i===7?'Netflix':i===39?'新しいサービス'+'長い名前'.repeat(40):'Service '+i}));
   await context.route('**/api/watch-providers',async r=>{await gate;await r.fulfill({headers:{'access-control-allow-origin':'*'},json:{providers}});});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${port}/${path}`,{waitUntil:'domcontentloaded'});
   await page.locator('#providerChecks input[value="8"]').check();release();
   await page.waitForFunction(()=>document.querySelectorAll('#providerChecks input').length===40);
   assert.equal(await page.locator('#providerChecks input[value="8"]').isChecked(),true);
   await page.locator('#providerChecks input[value="40"]').check();
   assert.deepEqual(await page.evaluate(()=>build().get('provider').split('|').map(Number).sort((a,b)=>a-b)),[8,40]);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.equal(await page.locator('#providerChecks').evaluate(e=>e.scrollHeight>e.clientHeight),true);
   await context.route('**/api/watch-providers',r=>r.fulfill({status:503,headers:{'access-control-allow-origin':'*'},json:{error:'unavailable'}}));
   await page.reload({waitUntil:'domcontentloaded'});await page.getByText('サービス一覧を更新できませんでした。表示中のサービスは検索できます。',{exact:true}).waitFor();
   assert.equal(await page.locator('#providerChecks input').count(),6);
   await page.locator('#providerChecks input[value="8"]').check();assert.equal(await page.evaluate(()=>build().get('provider')),'8');
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS JP provider list:40 choices,selection during loading,new-provider query,390px light/dark root/prefix,offline fallback and no page errors');
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
