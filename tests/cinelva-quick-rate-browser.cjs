const { waitForLocalServer } = require('./helpers/local-server.cjs');
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
  await waitForLocalServer(p);
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
  await page.locator('#grid .cinelva-inline-score input').first().evaluate(el=>{el.value='4.1';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#grid .cinelva-inline-score input').first().dispatchEvent('change');
  assert.equal((await page.evaluate(()=>window.CinelvaLibraryRecords.all()))[0].rating,4.1);
  assert.equal(await page.locator('#grid .cinelva-inline-score').first().evaluate(el=>el.classList.contains('is-watched')),true);
  assert.match(await page.locator('#grid .cinelva-rate-button').first().getAttribute('aria-label'),/この映画の評価を編集/);
  assert.equal(await page.locator('.cinelva-rate-dialog').evaluate(d=>d.open),true,'rating without a date opens the review panel');
  assert.equal(await page.locator('#cinelvaDatePicker').isVisible(),true,'date picker opens automatically after inline rating');
  assert.equal(await page.locator('#cinelvaRateValue').textContent(),'4.1');
  await page.locator('#cinelvaRateScore').evaluate(el=>{el.value='4.5';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#cinelvaRatePlace').selectOption('映画館');
  await page.locator('#cinelvaRateComment').fill('初回鑑賞。よかった。');
  await page.locator('#cinelvaRateDate').evaluate(el=>{el.value='2026-10-18';document.getElementById('cinelvaDateTrigger').textContent='2026/10/18';});
  await page.locator('#cinelvaRateSave').click();
  const first=await page.evaluate(()=>window.CinelvaLibraryRecords.all());
  assert.equal(first.length,1);
  assert.equal(first[0].rating,4.5);
  assert.equal(first[0].viewingMethod,'映画館');
  assert.equal(first[0].comment,'初回鑑賞。よかった。');
  assert.equal(first[0].watchedAt,'2026-10-18');
  assert.equal(await page.locator('.cinelva-rate-dialog').evaluate(d=>d.open),false,'save closes the review panel');
  await page.locator('.gSearch').fill('映画テスト');
  await page.locator('.gSearchForm').evaluate(form=>form.requestSubmit());
  await page.locator('#grid .cinelva-rate-button').first().waitFor({timeout:15000});
  await page.locator('#grid .cinelva-rate-button').first().click();
  assert.equal(await page.locator('.cinelva-rate-dialog').evaluate(d=>d.open),true);
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
  assert.equal(await page.locator('.cinelva-rate-dialog').evaluate(d=>d.open),false,'saving zero closes the review panel');
  assert.equal(await page.locator('#grid .cinelva-inline-score').first().evaluate(el=>el.classList.contains('is-watched')),true,'zero is a saved, visible viewing record');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#grid .cinelva-rate-button').first().waitFor({timeout:15000});
  await page.locator('#grid .cinelva-rate-button').first().click();
  assert.equal(await page.locator('#cinelvaRateComment').inputValue(),'気軽に採点。');
  assert.equal(await page.locator('#cinelvaRatePlace').inputValue(),'配信');
  await page.locator('#cinelvaRateClose').click();
  await page.evaluate(()=>{
   const key='cinelva-library-records-v2',data=JSON.parse(localStorage.getItem(key));
   const film={...data['111'],id:'900001',tmdb_id:111};delete film.tmdbId;
   delete data['111'];data['900001']=film;localStorage.setItem(key,JSON.stringify(data));
  });
  await page.goto(base+'/search.html?search='+encodeURIComponent('スターウォーズ'),{waitUntil:'domcontentloaded'});
  const importedInput=page.locator('#grid .cinelva-inline-score input').first();
  await importedInput.waitFor({timeout:15000});
  assert.equal(await importedInput.inputValue(),'4.5','imported rating is displayed using explicit film identity');
  await importedInput.evaluate(el=>{el.value='4.2';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await importedInput.dispatchEvent('change');
  const importedRows=await page.evaluate(()=>CinelvaLibraryRecords.all());
  assert.equal(importedRows.length,2,'inline edits do not add a duplicate of an imported film');
  const imported=importedRows.find(row=>row.id==='900001');
  assert.equal(imported.rating,4.2);
  assert.equal(imported.watchedAt,'2026-10-18');
  assert.equal(imported.comment,'初回鑑賞。よかった。');
  await page.locator('#grid .cinelva-rate-button').first().click();
  assert.equal(await page.locator('#cinelvaRateComment').inputValue(),'初回鑑賞。よかった。');
  await page.locator('#cinelvaRateSave').click();
  assert.equal((await page.evaluate(()=>CinelvaLibraryRecords.all())).length,2,'dialog edits keep the local imported key');
  assert.deepEqual(errors,[],'no uncaught browser errors');
  console.log((process.env.CINELVA_BROWSER||'chromium')+' existing-page quick rating, search variants and persistence passed');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
