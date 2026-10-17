const {chromium,webkit}=require('playwright');
const {spawn}=require('node:child_process');
const net=require('node:net');
const path=require('node:path');
const assert=require('node:assert/strict');

async function port(){
 const server=net.createServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const n=server.address().port;
 await new Promise(r=>server.close(r));return n;
}
(async()=>{
 const p=await port(),root=path.resolve(__dirname,'..');
 const server=spawn('python',['-m','http.server',String(p),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
 let browser;
 try{
  const base='http://127.0.0.1:'+p;
  for(let i=0;i<60;i++){
   try{const r=await fetch(base);if(r.ok)break;}catch{}
   if(i===59)throw Error('server startup timed out');
   await new Promise(r=>setTimeout(r,100));
  }
  browser=await (process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/movies?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({movies:[],external:[]})}));
  await page.route('**/data/movies.json*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({movies:[
   {id:111,title:'スター・ウォーズ',year:1977},
   {id:222,title:'映画 テスト',year:2026}
  ]})}));
  await page.goto(base+'/search.html?search='+encodeURIComponent('スターウォーズ'),{waitUntil:'domcontentloaded'});
  await page.locator('#grid .cinelva-rate-button').first().waitFor({timeout:15000});
  assert.match(await page.locator('#grid').innerText(),/スター・ウォーズ/);
  await page.locator('#grid .cinelva-rate-button').first().click();
  assert.equal(await page.locator('.cinelva-rate-dialog').evaluate(d=>d.open),true);
  assert.equal(await page.locator('#cinelvaRateValue').textContent(),'0.0');
  await page.locator('#cinelvaRateScore').evaluate(el=>{el.value='4.5';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#cinelvaRatePlace').selectOption('映画館');
  await page.locator('#cinelvaRateComment').fill('初回鑑賞。よかった。');
  await page.locator('#cinelvaRateDate').fill('2026-10');
  await page.locator('#cinelvaRateSave').click();
  const first=await page.evaluate(()=>window.CinelvaLibraryRecords.all());
  assert.equal(first.length,1);
  assert.equal(first[0].rating,4.5);
  assert.equal(first[0].viewingMethod,'映画館');
  assert.equal(first[0].comment,'初回鑑賞。よかった。');
  assert.equal(first[0].watchedAt,'2026-10');
  assert.match(await page.locator('#grid .cinelva-rate-saved').first().innerText(),/採点済み ★ 4\.5/);
  assert.equal(await page.locator('.cinelva-rate-dialog').evaluate(d=>d.open),true,'rating panel stays available for continuous rating');
  await page.locator('.gSearch').fill('映画テスト');
  await page.locator('.gSearchForm').evaluate(form=>form.requestSubmit());
  await page.locator('#grid .cinelva-rate-button').first().waitFor({timeout:15000});
  // On a 390px viewport the persistent panel may overlay the movie card.
  // Use its built-in next-film control rather than forcing a click through it.
  await page.locator('#cinelvaRateNext').click();
  assert.match(await page.locator('#cinelvaRateTitle').innerText(),/映画 テスト/);
  assert.equal(await page.locator('#cinelvaRateValue').textContent(),'0.0');
  await page.locator('#cinelvaRateScore').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#cinelvaRatePlace').selectOption('配信');
  await page.locator('#cinelvaRateComment').fill('気軽に採点。');
  await page.locator('#cinelvaRateSave').click();
  const rows=await page.evaluate(()=>window.CinelvaLibraryRecords.all());
  assert.equal(rows.length,2);
  assert.equal(rows.find(r=>r.id==='222').rating,0);
  assert.equal(rows.find(r=>r.id==='222').comment,'気軽に採点。');
  assert.match(await page.locator('#grid .cinelva-rate-saved').first().innerText(),/採点済み ★ 0\.0/);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#grid .cinelva-rate-button').first().waitFor({timeout:15000});
  await page.locator('#grid .cinelva-rate-button').first().click();
  assert.equal(await page.locator('#cinelvaRateComment').inputValue(),'気軽に採点。');
  assert.equal(await page.locator('#cinelvaRatePlace').inputValue(),'配信');
  assert.match(await page.locator('#grid .cinelva-rate-saved').first().innerText(),/採点済み ★ 0\.0/);
  // Assert that the real ranking and calendar list containers mount saved
  // labels without introducing a separate movie-list page.
  await page.goto(base+'/rankings.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.CinelvaQuickRate));
  await page.locator('#grid').evaluate(grid=>{
    grid.innerHTML='<a class="rankCard" href="search.html?id=111&search=%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%BB%E3%82%A6%E3%82%A9%E3%83%BC%E3%82%BA"><span class="title">スター・ウォーズ</span></a>';
  });
  await page.locator('#grid .cinelva-rate-saved').first().waitFor({timeout:10000});
  assert.match(await page.locator('#grid .cinelva-rate-saved').first().innerText(),/採点済み ★ 4\.5/);
  await page.locator('#grid .cinelva-rate-button').first().click();
  assert.equal(await page.locator('#cinelvaRateScore').inputValue(),'4.5');
  await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.CinelvaQuickRate));
  await page.evaluate(()=>{
    window.CinelvaRatingResolve=()=>({id:222,title:'映画 テスト'});
    document.getElementById('cards').innerHTML='<article class="card" data-i="0"><span class="title">映画 テスト</span></article>';
  });
  await page.locator('#cards .cinelva-rate-saved').first().waitFor({timeout:10000});
  assert.match(await page.locator('#cards .cinelva-rate-saved').first().innerText(),/採点済み ★ 0\.0/);
  await page.locator('#cards .cinelva-rate-button').first().click();
  assert.equal(await page.locator('#cinelvaRateComment').inputValue(),'気軽に採点。');
  assert.deepEqual(errors,[],'no uncaught browser errors');
  console.log((process.env.CINELVA_BROWSER||'chromium')+' existing-page quick rating, search variants and persistence passed');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
