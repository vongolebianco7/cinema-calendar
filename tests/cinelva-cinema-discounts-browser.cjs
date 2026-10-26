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
   await page.clock.install({time:new Date('2026-10-26T12:00:00Z')});
   await page.goto(`http://127.0.0.1:${port}${route}#discounts`);
   try{await page.locator('#discountResults .discountCard').first().waitFor({timeout:5000});}catch(e){console.error('discount load:',errors,await page.locator('#discounts').innerText());throw e;}
   assert.equal(await page.locator('#discounts input[type=checkbox]').count(),0,'methods must be visible without benefit checkboxes');
   assert.equal(await page.locator('#discountResults .discountCard').count(),13);
   await page.locator('#discountChain').selectOption('toho');
   await page.locator('#discountDate').fill('2026-10-26');
   assert.match(await page.locator('#discountResults').innerText(),/1,100/);
   assert.match(await page.locator('#discountResults').innerText(),/548/);
   assert.match(await page.locator('#discountResults').innerText(),/クーポンを取得/);
   assert.match(await page.locator('#discountResults').innerText(),/会員/);
   await page.locator('#discountChain').selectOption('smt');
   assert.match(await page.locator('#discountResults').innerText(),/初回加入限定/);
   assert.match(await page.locator('#discountResults').innerText(),/自動更新/);
   await page.goto(`http://127.0.0.1:${port}${route}?discountChain=smt&discountTheater=${encodeURIComponent('東劇')}#discounts`);
   await page.locator('#discountResults .discountCard').first().waitFor();
   assert.equal(await page.locator('#discountResults [data-price]').count(),0,'excluded theater must not inherit a coupon');
   await page.locator('#discountChain').selectOption('tjoy');
   await page.locator('#discountDate').fill('2026-10-28');
   assert.match(await page.locator('#discountResults').innerText(),/1,400/);
   assert.match(page.url(),/discountDate=2026-10-28/,'selected date must survive copying the guide URL');
   await page.reload();await page.locator('#discountResults .discountCard').first().waitFor();
   assert.equal(await page.locator('#discountDate').inputValue(),'2026-10-28');
   for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${route}/${theme}/${width} overflow`);
   }
   await page.setViewportSize({width:390,height:844});
   const links=await page.locator('#discountResults a').evaluateAll(as=>as.map(a=>a.href));
   assert.ok(links.length>=2&&links.every(url=>url.startsWith('https://')));
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
  const page=await context.newPage();await page.clock.install({time:new Date('2026-10-26T12:00:00Z')});
  await page.goto(`http://127.0.0.1:${port}/theaters.html`);
  await page.locator('#discountRetry').waitFor();fail=false;await page.locator('#discountRetry').click();
  await page.locator('#discountResults .discountCard').first().waitFor();
  await page.clock.setSystemTime(new Date('2027-01-01T03:00:00Z'));await page.reload();
  await page.locator('#discountResults .discountCard').first().waitFor();
  assert.equal(await page.locator('#discountResults [data-price]').count(),0);
  assert.match(await page.locator('#discountResults').innerText(),/再確認/);
  await context.close();
  const malformedContext=await browser.newContext({viewport:{width:390,height:844}});
  await malformedContext.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await malformedContext.route('**/data/cinema_discounts.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({version:1,chains:[null]})}));
  const malformedPage=await malformedContext.newPage(),malformedErrors=[];malformedPage.on('pageerror',e=>malformedErrors.push(e.message));
  await malformedPage.goto(`http://127.0.0.1:${port}/theaters.html`);await malformedPage.locator('#discountRetry').waitFor();
  await malformedPage.locator('#discountDate').fill('2026-10-28');
  assert.deepEqual(malformedErrors,[]);await malformedContext.close();
  // A national directory result outside the original six venues opens the appropriate guide.
  const directoryContext=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo'});
  await directoryContext.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await directoryContext.route('**/js/cinelva-cinema-discounts.js*',async r=>{await new Promise(resolve=>setTimeout(resolve,1000));await r.continue();});
  await directoryContext.route('**/data/theaters_master.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({theaters:[{name:'TOHOシネマズ札幌',prefecture:'北海道',website:'https://www.tohotheater.jp/'},{name:'地域の独立映画館',prefecture:'北海道'}]})}));
  await directoryContext.route('**/data/theaters_osm.json*',r=>r.fulfill({contentType:'application/json',body:'{"theaters":[]}'}));
  const directoryPage=await directoryContext.newPage();await directoryPage.clock.install({time:new Date('2026-10-26T12:00:00Z')});
  await directoryPage.goto(`http://127.0.0.1:${port}/theaters.html?search=${encodeURIComponent('TOHOシネマズ札幌')}`);
  await directoryPage.locator('#q').fill('TOHOシネマズ札幌');
  const savingsLink=directoryPage.locator('#grid').getByRole('link',{name:'安く見る方法'});
  await savingsLink.waitFor({timeout:10000});await savingsLink.click();
  await directoryPage.locator('#discountResults .discountCard').first().waitFor();
  assert.equal(await directoryPage.locator('#discountResults .discountCard').count(),1);
  assert.match(await directoryPage.locator('#discountTheater').innerText(),/札幌/);
  await directoryContext.close();
  console.log('Cinema discount journeys: root/prefix, light/dark,320–1280px, national methods without checkboxes, fees, date/chain, exclusions, retry and stale prices passed');
 }finally{await browser?.close();server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
