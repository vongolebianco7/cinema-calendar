'use strict';
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const port=Number(process.env.CINELVA_TEST_PORT||4189);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){
 for(let i=0;i<80;i++){
  try{const response=await fetch(`http://127.0.0.1:${port}/discover.html`);if(response.ok)return;}catch{}
  await wait(100);
 }
 throw new Error('local discovery server did not start');
}
(async()=>{
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});
 let browser;
 try{
  await ready();
  browser=await (process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch({headless:true});
  const movie={id:42,tmdbId:42,title:'Discovery test film',year:2024,date:new Date().toISOString().slice(0,10),score:9.1,votes:1200,popularity:80,poster:'https://image.tmdb.org/t/p/w342/broken-poster.jpg',runtime:100,genres:['Science Fiction'],overview:'A test film.'};
  const unknownMovie={...movie,id:43,tmdbId:43,title:'Unconfirmed availability film',score:8.2,poster:null};
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),errors=[],discoverRequests=[];
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await context.route('**/api/**',route=>{
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/api/agent'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({answer:'検索結果を表示します。',movies:[movie]})});
    if(url.pathname.endsWith('/api/people'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({people:[{id:999,name:'Christopher Nolan',department:'Directing',known_for:['Interstellar']}]})});
    if(url.pathname.endsWith('/api/discover'))discoverRequests.push(url);
    const payload=url.pathname.endsWith('/api/calendar')?{movies:[{...movie,event:'theatrical',service:'劇場公開'}]}:{movies:[movie,unknownMovie],total_results:2,total_pages:1};
    route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
   });
   await context.route('**/data/availability.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movies:{'42':{checked_at:new Date().toISOString(),flatrate:[{provider_id:8,provider_name:'Netflix'}]}}})}));
   await context.route('**/data/movies.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movies:[movie,unknownMovie]})}));
   await context.route('https://image.tmdb.org/**',route=>route.abort());
   await page.goto(`http://127.0.0.1:${port}/discover.html`);
   await page.locator('[data-availability="available"]').click();
   await page.locator('#catalogPopularGrid [data-popular-id="42"]').waitFor();
   assert.equal(await page.locator('#catalogPopularGrid [data-popular-id="43"]').count(),0,'available filter excludes titles without a fresh offer');
   await page.locator('[data-availability="unknown"]').click();
   await page.locator('#catalogPopularGrid [data-popular-id="43"]').waitFor();
   assert.equal(await page.locator('#catalogPopularGrid [data-popular-id="42"]').count(),0,'unknown filter excludes titles with a fresh offer');
   await page.locator('[data-availability="all"]').click();
   await page.locator('[data-explore-mode="concierge"]').click();
   assert.equal(await page.locator('#conciergeMode').isVisible(),true,'AI search tab reveals its content');
   assert.equal(await page.locator('#filterMode').isVisible(),false,'AI search tab hides condition search');
   await page.locator('#conciergeQ').fill('test query');
   await page.locator('#conciergeSend').click();
   await page.locator('.conciergeMovie[data-movie-id="42"]').waitFor();
   assert.equal(await page.locator('.conciergeMsg.ai').last().textContent(),'検索結果を表示します。','AI search displays the returned answer');
   await page.locator('[data-explore-mode="filter"]').click();
   assert.equal(await page.locator('#filterMode').isVisible(),true,'condition search tab returns to its controls');
   await page.locator('#genres [data-g="878"]').click();
   await page.locator('#apply').click();
   const result=page.locator('#grid .cinelva-discovery-unit').filter({has:page.locator('[data-id="42"]')}).first();
   await result.waitFor();
   assert.ok(discoverRequests.some(url=>url.searchParams.get('genre')==='878'),'genre selection changes the actual API query');
   assert.equal(await result.locator('.cinelva-inline-score input[type="range"]').count(),1,'condition results expose the shared rating gauge');
   assert.equal(await result.locator('.cinelva-rate-button').count(),1,'condition results expose the shared review action');
   await result.locator('.posterFallback').waitFor({state:'visible'});
   const bookmark=result.locator('.cinelva-bookmark-button');await bookmark.waitFor();await bookmark.click();
   assert.equal(await bookmark.getAttribute('aria-pressed'),'true','bookmark saves from discovery results');
   assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('cinelva-want-to-watch-v1')||'{}')['42']),'bookmark persists in the shared store');
   const rating=result.locator('.cinelva-inline-score input');
   await rating.evaluate(input=>{input.value='4.2';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
   assert.equal(await page.evaluate(()=>CinelvaLibraryRecords.all().find(x=>String(x.tmdbId??x.id)==='42')?.rating),4.2,'rating saves from discovery results');
   const reviewDialog=page.locator('dialog.cinelva-rate-dialog');
   await reviewDialog.waitFor({state:'visible'});
   assert.equal(await page.locator('#cinelvaDatePicker').isVisible(),true,'new inline rating opens the date prompt');
   const today=new Date();
   const expectedToday=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
   assert.equal(await page.locator('#cinelvaRateDate').inputValue(),expectedToday,'new inline rating defaults its viewing date to today');
   await page.locator('#cinelvaRateClose').click();
   await result.locator('.cinelva-rate-button').click();
   assert.equal(await page.locator('#cinelvaRateTitle').textContent(),'Discovery test film','review action opens the populated shared review dialog');
   await page.locator('#cinelvaRateComment').fill('Discovery review');
   await page.locator('#cinelvaRateSave').click();
   assert.equal(await page.evaluate(()=>CinelvaLibraryRecords.all().find(x=>String(x.tmdbId??x.id)==='42')?.comment),'Discovery review','review saves');
   await page.locator('#director').fill('Christopher Nolan');
   await page.locator('#apply').click();
   const directorSuggestion=page.getByRole('button',{name:/Christopher Nolan Directing/});
   await directorSuggestion.waitFor();
   await directorSuggestion.click();
   const personResult=page.locator('#grid .cinelva-discovery-unit').filter({has:page.locator('[data-id="42"]')}).first();
   await personResult.waitFor();
   assert.ok(discoverRequests.some(url=>url.searchParams.get('crew')==='999'),'director selection changes the actual API query');
   assert.equal(await personResult.locator('.cinelva-inline-score input[type="range"]').count(),1,'director filmography exposes the shared rating gauge');
   assert.equal(await personResult.locator('.cinelva-rate-button').count(),1,'director filmography exposes the shared review action');
   assert.equal(await personResult.locator('.cinelva-bookmark-button').count(),1,'director filmography exposes the shared bookmark action');
   const shelf=page.locator('#theatricalPopularGrid .cinelva-discovery-unit').first();
   await shelf.waitFor();
   assert.equal(await shelf.locator('.cinelva-rate-button').count(),1,'recommendation shelves use shared review controls');
   assert.equal(await shelf.locator('.cinelva-bookmark-button').count(),1,'recommendation shelves use shared bookmarks');
   await shelf.locator('.posterFallback').waitFor({state:'visible'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'page has no horizontal overflow');
   assert.deepEqual(errors,[],'page has no uncaught errors');
   await Promise.all([page.waitForURL(url=>url.pathname.endsWith('/search.html')&&url.searchParams.get('id')==='42'),page.locator('#grid [data-id="42"]').click()]);
   await context.close();
   console.log(`discovery shared controls ${width}px PASS`);
  }
 }finally{if(browser)await browser.close();server.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1;});
