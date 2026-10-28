// Exercise the actual Vercel policy on isolated local pages, never production records.
const assert=require('node:assert/strict'),fs=require('node:fs'),net=require('node:net'),os=require('node:os'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process'),{waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const name=process.env.CINELVA_BROWSER||'chromium',browserType=require('playwright')[name];
 const socket=net.createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
 const certDir=fs.mkdtempSync(path.join(os.tmpdir(),'cinelva-csp-')),cert=path.join(certDir,'cert.pem'),key=path.join(certDir,'key.pem');
 const generated=spawnSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1'],{encoding:'utf8'});
 assert.equal(generated.status,0,`generate ephemeral local TLS certificate: ${generated.stderr}`);
 const server=spawn('python3',['tests/helpers/security-static-server.py',String(port),cert,key],{stdio:'ignore'});
 let browser;
 try{
  await waitForLocalServer(port);browser=await browserType.launch({headless:true});
  const headers=Object.fromEntries(JSON.parse(fs.readFileSync('vercel.json')).headers.find(x=>x.source==='/(.*)').headers.map(x=>[x.key.toLowerCase(),x.value]));
  const context=await browser.newContext({viewport:{width:390,height:844},ignoreHTTPSErrors:true});
  // Serve actual policy over local TLS: upgrade-insecure-requests promotes
  // HTTP on WebKit, so an HTTP-only fixture would test a broken transport.
  // Do not mock or weaken this policy when checking Safari/WebKit compatibility.
  // Avoid upstream dependency or quota use. Existing journeys exercise known catalog fixtures.
  await context.route('https://backend-one-gray-94.vercel.app/**',route=>{
   const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,OPTIONS','access-control-allow-headers':'*'};
   return route.fulfill({status:route.request().method()==='OPTIONS'?204:503,headers,contentType:'application/json',body:route.request().method()==='OPTIONS'?'':'{"error":"isolated offline fixture"}'});
  });
  // These same-origin snapshot fetches are not the subject of this header test.
  // Fulfil them locally so browser CORS diagnostics only report CSP behavior.
  await context.route(`https://127.0.0.1:${port}/data/**`,route=>route.fulfill({status:200,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:'{"movies":[]}'}));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')console.log(name+' console '+m.text())});
  page.on('requestfailed',r=>console.log(name+' request failed '+r.url()+' '+r.failure()?.errorText));
  await page.addInitScript(()=>{window.cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.cspViolations.push({directive:e.effectiveDirective,blocked:e.blockedURI}))});
  for(const file of ['index.html','discover.html','search.html','my-cinemap.html','my-best10.html','data-backup.html','rankings.html','theaters.html','events.html','experience.html','privacy.html','terms.html','credits.html']){
   const response=await page.goto(`https://127.0.0.1:${port}/${file}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200,file);assert.equal(response.headers()['content-security-policy'],headers['content-security-policy'],file+' actual CSP');
   await page.waitForTimeout(300);
   assert.deepEqual(await page.evaluate(()=>window.cspViolations),[],file+' CSP violations');
   assert.deepEqual(errors,[],file+' page errors');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth<=2),file+' overflow');
  }
  await page.evaluate(()=>localStorage.setItem('cinemap-viewing-records-v1','{"1":{"watched":true,"rating":4}}'));
  const separate=await browser.newContext({ignoreHTTPSErrors:true});const other=await separate.newPage();await other.goto(`https://127.0.0.1:${port}/privacy.html`);
  assert.equal(await other.evaluate(()=>localStorage.getItem('cinemap-viewing-records-v1')),null,'separate browser profiles must not share records');
  await separate.close();assert.deepEqual(errors,[]);await context.close();
  console.log(name+': 13 routes with actual CSP, mobile overflow and isolated browser storage passed; no physical-device claim.');
 }finally{if(browser)await browser.close();server.kill('SIGTERM');fs.rmSync(certDir,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
