const {chromium,webkit}=require('playwright');
const {spawn}=require('node:child_process'),net=require('node:net'),fs=require('node:fs'),assert=require('node:assert/strict');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 const base=`http://127.0.0.1:${port}`;
 const isolated=async options=>{const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo',...options});await c.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());return c;};
 try{
  await waitForLocalServer(port);browser=await(process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.env.CINELVA_BROWSER!=='webkit'&&process.env.CINELVA_CHROMIUM_EXECUTABLE?{executablePath:process.env.CINELVA_CHROMIUM_EXECUTABLE}:{})});
  for(const route of ['/theaters.html','/cinelva/theaters.html'])for(const theme of ['light','dark']){
   const c=await isolated();await c.addInitScript(t=>localStorage.setItem('cinelva-theme-v1',t),theme);const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.clock.install({time:new Date('2026-10-27T01:00:00Z')});
   await p.goto(`${base}${route}#discounts`);await p.locator('.discountTable').waitFor();
   assert.equal(await p.locator('#discountCalendar button').count(),14);assert.equal(await p.locator('#discounts input[type=checkbox]').count(),0);assert.equal(await p.locator('#discountPrefecture').count(),0);assert.equal(await p.locator('#discountChain option').count(),15);
   await p.locator('#discountChain').selectOption('toho');await p.locator('[data-discount-date="2026-10-28"]').click();
   assert.match(await p.locator('.discountTable caption').innerText(),/10\/28/);assert.equal(await p.locator('[data-discount-date="2026-10-28"]').getAttribute('aria-pressed'),'true');assert.match(p.url(),/discountDate=2026-10-28/);
   const prices=await p.locator('.discountTable [data-price]').evaluateAll(es=>es.map(e=>Number(e.dataset.price)));assert.deepEqual(prices,prices.slice().sort((a,b)=>a-b));assert.ok(prices.includes(1500));
   assert.match(await p.locator('#discountResults').innerText(),/ベネポ/);assert.match(await p.locator('#discountResults').innerText(),/ポイント消費/);assert.match(await p.locator('#discountResults').innerText(),/548/);
   await p.locator('.discountTable summary').first().click();assert.match(await p.locator('#discountResults').innerText(),/クーポンを取得/);
   await p.reload();await p.locator('.discountTable').waitFor();assert.equal(await p.locator('#discountDate').inputValue(),'2026-10-28');
   await p.locator('#discountNext').click();assert.equal(await p.locator('#discountCalendar button').count(),14);
   for(let i=0;i<5&&await p.locator('#discountNext').isEnabled();i++)await p.locator('#discountNext').click();
   assert.equal(await p.locator('#discountCalendar button').last().getAttribute('data-discount-date'),'2026-12-26');
   await p.locator('#discountDate').fill('');assert.match(await p.locator('#discountSummary').innerText(),/有効/);await p.locator('#discountDate').fill('2026-10-28');
   for(const width of [320,390,768,1280]){await p.setViewportSize({width,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${route}/${theme}/${width}`);}
   await p.setViewportSize({width:390,height:844});fs.mkdirSync('artifacts/cinema-discounts',{recursive:true});await p.locator('#discounts').screenshot({path:`artifacts/cinema-discounts/${process.env.CINELVA_BROWSER||'chromium'}-${route.includes('cinelva/')?'prefix':'root'}-${theme}.png`});assert.deepEqual(errors,[]);await c.close();
  }
  for(const route of ['/theaters.html','/cinelva/theaters.html']){
   const c=await isolated(),p=await c.newPage();await p.clock.install({time:new Date('2026-10-27T01:00:00Z')});
   const visit=async(chain,theater,date)=>{await p.goto(`${base}${route}?discountChain=${chain}&discountTheater=${encodeURIComponent(theater)}&discountDate=${date}#discounts`);await p.locator('#discountCalendar button').first().waitFor();};
   const names=()=>p.locator('.discountTable h4').allTextContents();
   await visit('united','ユナイテッド・シネマ豊洲','2026-10-28');assert.ok((await names()).includes('水曜サービスデー'));
   await visit('united','ローソン・ユナイテッドシネマ札幌','2026-10-28');assert.equal((await names()).includes('水曜サービスデー'),false);await p.locator('#discountDate').fill('2026-10-29');assert.ok((await names()).includes('札幌の木曜サービスデー'));assert.equal((await names()).includes('稲沢の木曜サービスデー'),false);
   await visit('united','ユナイテッド・シネマPARCO CITY浦添','2026-11-01');assert.equal((await names()).includes('ファーストデー'),false);
   await visit('109','','2026-10-28');assert.match(await p.locator('#discountResults').innerText(),/プレミアム新宿/);
   await visit('smt','','2026-11-01');assert.match(await p.locator('#discountResults').innerText(),/大阪ステーションシティシネマ/);
   await visit('smt','東劇','2026-10-28');assert.equal(await p.locator('#discountResults [data-price]').count(),0);
   await visit('central-miyazaki','セントラルシネマ宮崎','2026-10-28');assert.match(await p.locator('#discountResults').innerText(),/1,300/);assert.equal((await names()).includes('対象イオンカードで事前チケット購入'),false);
   await visit('tjoy','','2026-10-27');assert.match(await p.locator('#discountResults').innerText(),/KINEZO会員デー/);assert.match(await p.locator('#discountResults').innerText(),/無料/);await c.close();
  }
  const c=await isolated();let fail=true;await c.route('**/data/cinema_discounts.json*',r=>fail?r.fulfill({status:503,body:'Unavailable'}):r.continue());const p=await c.newPage();await p.clock.install({time:new Date('2026-10-27T01:00:00Z')});await p.goto(base+'/theaters.html');await p.locator('#discountRetry').waitFor();fail=false;await p.locator('#discountRetry').click();await p.locator('.discountTable').waitFor();await p.clock.setSystemTime(new Date('2027-01-01T03:00:00Z'));await p.reload();await p.locator('#discountCalendar button').first().waitFor();assert.equal(await p.locator('#discountResults [data-price]').count(),0);assert.match(await p.locator('#discountResults').innerText(),/再確認/);await c.close();
  for(const included of ['札幌',null,[],[''],[null]]){const c=await isolated(),d=JSON.parse(fs.readFileSync('data/cinema_discounts.json'));d.chains[0].offers[0].includedTheaters=included;await c.route('**/data/cinema_discounts.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(d)}));const p=await c.newPage();await p.goto(base+'/theaters.html');await p.locator('#discountRetry').waitFor();assert.equal(await p.locator('#discountResults [data-price]').count(),0);await c.close();}
  const dc=await isolated();await dc.route('**/js/cinelva-cinema-discounts.js*',async r=>{await new Promise(resolve=>setTimeout(resolve,1000));await r.continue();});await dc.route('**/data/theaters_master.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({theaters:[{name:'TOHOシネマズ札幌',prefecture:'北海道',website:'https://www.tohotheater.jp/'}]})}));await dc.route('**/data/theaters_osm.json*',r=>r.fulfill({contentType:'application/json',body:'{"theaters":[]}'}));const dp=await dc.newPage();await dp.clock.install({time:new Date('2026-10-27T01:00:00Z')});await dp.goto(base+'/theaters.html');await dp.locator('#q').fill('TOHOシネマズ札幌');await dp.locator('#grid').getByRole('link',{name:'安く見る方法'}).click();await dp.waitForURL(url=>url.searchParams.get('discountTheater')==='TOHOシネマズ札幌');await dp.locator('#discountTheater').filter({hasText:'札幌'}).waitFor();await dp.locator('.discountTable').waitFor();assert.match(await dp.locator('#discountTheater').innerText(),/札幌/);await dc.close();
  const nc=await isolated(),d=JSON.parse(fs.readFileSync('data/cinema_discounts.json'));delete d.regions;await nc.route('**/data/cinema_discounts.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(d)}));const np=await nc.newPage();await np.clock.install({time:new Date('2026-10-27T01:00:00Z')});await np.goto(base+'/theaters.html?discountPrefecture=鳥取県');await np.locator('.discountTable').waitFor();assert.equal(await np.locator('#discountChain').inputValue(),'');assert.equal(await np.locator('#discountTheater').innerText(),'');await nc.close();
  console.log('Discount calendar and sorted comparison: root/prefix light/dark320–1280, day tap, navigation/horizon, fees, Benepo, named exceptions, stale/retry/malformed and national directory passed');
 }finally{await browser?.close();server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
