const {chromium,webkit}=require('playwright');
const {spawn}=require('node:child_process'),net=require('node:net'),fs=require('node:fs'),assert=require('node:assert/strict');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await waitForLocalServer(port);browser=await(process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.env.CINELVA_BROWSER!=='webkit'&&process.env.CINELVA_CHROMIUM_EXECUTABLE?{executablePath:process.env.CINELVA_CHROMIUM_EXECUTABLE}:{})});
  for(const route of ['/theaters.html','/cinelva/theaters.html'])for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo'});
   await context.addInitScript(t=>localStorage.setItem('cinelva-theme-v1',t),theme);
   await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.clock.install({time:new Date('2026-10-25T12:00:00Z')});
   await page.goto(`http://127.0.0.1:${port}${route}#discounts`);
   await page.locator('#discountResults .discountCard').first().waitFor({timeout:5000});
   assert.equal(await page.locator('#discountResults .discountCard').count(),6);
   await page.locator('#discountDate').fill('2026-10-29');
   await page.locator('#discountArea').selectOption('川崎');
   const toho=page.locator('[data-discount-venue="toho-kawasaki"]');
   await page.waitForFunction(()=>document.querySelector('[data-discount-venue="toho-kawasaki"] .discountPrice')?.textContent.includes('2,100'));
   assert.match(await toho.innerText(),/2,100/);
   await page.locator('[data-discount-benefit="saison"]').check();
   assert.match(await toho.innerText(),/1,200/);
   assert.match(await toho.innerText(),/クーポン/);
   await page.reload();await page.locator('#discountDate').fill('2026-10-29');await page.locator('#discountArea').selectOption('川崎');
   assert.equal(await page.locator('[data-discount-benefit="saison"]').isChecked(),true);
   await page.locator('#discountDate').fill('2026-10-31');await page.locator('#discountEvening').check();
   assert.match(await page.locator('[data-discount-venue="109-kawasaki"]').innerText(),/1,600/);
   await page.locator('#discountArea').selectOption('横浜');
   assert.equal(await page.locator('#discountResults .discountCard').count(),3);
   assert.match(await page.locator('#discountSummary').innerText(),/上映/);
   assert.equal(await page.locator('#discountCalendar button').count(),14);
   const selectedBackground=await page.locator('#discountCalendar [aria-pressed="true"]').evaluate(x=>getComputedStyle(x).backgroundColor);
   const otherBackground=await page.locator('#discountCalendar [aria-pressed="false"]').first().evaluate(x=>getComputedStyle(x).backgroundColor);
   assert.notEqual(selectedBackground,otherBackground,`${theme} selected date must remain visible`);
   for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${route}/${theme}/${width} overflow`);
    assert.equal(await page.locator('#discountCalendar button b').evaluateAll(xs=>xs.every(x=>x.scrollWidth<=x.clientWidth)),true,`calendar price clipping at${width}px`);
    assert.equal(await page.locator('#discountCalendar button').evaluateAll(xs=>xs.every(x=>x.getBoundingClientRect().width>=44&&x.getBoundingClientRect().height>=44)),true,`calendar touch size at${width}px`);
   }
   await page.setViewportSize({width:390,height:844});
   const links=await page.locator('#discountResults a').evaluateAll(as=>as.map(a=>a.href));
   assert.ok(links.length>=6&&links.every(url=>url.startsWith('https://')));
   const targets=await page.locator('#discounts input,#discounts select,#discounts button').evaluateAll(xs=>xs.map(x=>({w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height,type:x.type})));
   assert.ok(targets.filter(x=>x.type!=='checkbox').every(x=>x.h>=44&&x.w>=44));
   fs.mkdirSync('artifacts/cinema-discounts',{recursive:true});
   await page.locator('#discounts').screenshot({path:`artifacts/cinema-discounts/${process.env.CINELVA_BROWSER||'chromium'}-${route.includes('/cinelva/')?'prefix':'root'}-${theme}.png`});
   assert.deepEqual(errors,[]);await context.close();
  }
  // Data acquisition fails independently of the existing theater directory and is retryable.
  const context=await browser.newContext({viewport:{width:390,height:844}});let fail=true;
  await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await context.route('**/data/cinema_discounts.json*',r=>fail?r.fulfill({status:503,body:'Unavailable'}):r.continue());
  const page=await context.newPage();await page.clock.install({time:new Date('2026-10-25T12:00:00Z')});
  await page.goto(`http://127.0.0.1:${port}/theaters.html`);
  await page.locator('#discountRetry').waitFor();fail=false;await page.locator('#discountRetry').click();
  await page.locator('#discountResults .discountCard').first().waitFor();
  await page.clock.setSystemTime(new Date('2027-01-01T03:00:00Z'));await page.reload();
  await page.locator('#discountResults .discountCard').first().waitFor();
  assert.equal(await page.locator('#discountResults .discountPrice[data-price]').count(),0);
  assert.match(await page.locator('#discountResults').innerText(),/再確認/);
  await context.close();
  const malformedContext=await browser.newContext({viewport:{width:390,height:844}});
  await malformedContext.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await malformedContext.route('**/data/cinema_discounts.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({version:1,venues:[null],benefits:[]})}));
  const malformedPage=await malformedContext.newPage(),malformedErrors=[];malformedPage.on('pageerror',e=>malformedErrors.push(e.message));
  await malformedPage.goto(`http://127.0.0.1:${port}/theaters.html`);await malformedPage.locator('#discountRetry').waitFor();
  await malformedPage.locator('#discountArea').selectOption('横浜');
  assert.deepEqual(malformedErrors,[]);await malformedContext.close();
  console.log('Cinema discount journeys: root/prefix, light/dark,320–1280px, eligibility, persistence, evening, retry and stale prices passed');
 }finally{await browser?.close();server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
