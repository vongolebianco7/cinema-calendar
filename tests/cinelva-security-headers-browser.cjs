// Exercise the actual Vercel policy on isolated local pages, never production records.
const assert=require('node:assert/strict'),fs=require('node:fs'),net=require('node:net');
const {spawn}=require('node:child_process'),{waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const name=process.env.CINELVA_BROWSER||'chromium',browserType=require('playwright')[name];
 const socket=net.createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await waitForLocalServer(port);browser=await browserType.launch({headless:true});
  const headers=Object.fromEntries(JSON.parse(fs.readFileSync('vercel.json')).headers.find(x=>x.source==='/(.*)').headers.map(x=>[x.key.toLowerCase(),x.value]));
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.route(`http://127.0.0.1:${port}/**`,async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),...headers}})});
  // Avoid upstream dependency or quota use. Existing journeys exercise known catalog fixtures.
  await context.route('https://backend-one-gray-94.vercel.app/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"isolated offline fixture"}'}));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.cspViolations.push({directive:e.effectiveDirective,blocked:e.blockedURI}))});
  for(const file of ['index.html','discover.html','search.html','my-cinemap.html','my-best10.html','data-backup.html','rankings.html','theaters.html','events.html','experience.html','privacy.html','terms.html','credits.html']){
   const response=await page.goto(`http://127.0.0.1:${port}/${file}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200,file);
   await page.waitForTimeout(300);
   assert.deepEqual(await page.evaluate(()=>window.cspViolations),[],file+' CSP violations');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth<=2),file+' overflow');
  }
  await page.evaluate(()=>localStorage.setItem('cinemap-viewing-records-v1','{"1":{"watched":true,"rating":4}}'));
  const separate=await browser.newContext();const other=await separate.newPage();await other.goto(`http://127.0.0.1:${port}/privacy.html`);
  assert.equal(await other.evaluate(()=>localStorage.getItem('cinemap-viewing-records-v1')),null,'separate browser profiles must not share records');
  await separate.close();assert.deepEqual(errors,[]);await context.close();
  console.log(name+': 13 routes with actual CSP, mobile overflow and isolated browser storage passed; no physical-device claim.');
 }finally{if(browser)await browser.close();server.kill('SIGTERM')}
})().catch(e=>{console.error(e);process.exitCode=1});
