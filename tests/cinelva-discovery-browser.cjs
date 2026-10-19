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
  const movie={id:42,tmdbId:42,title:'Discovery test film',year:2024,date:new Date().toISOString().slice(0,10),score:9.1,votes:1200,popularity:80,poster:null,runtime:100,genres:['Science Fiction'],overview:'A test film.'};
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),errors=[];
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await context.route('**/api/**',route=>{
    const url=new URL(route.request().url());
    const payload=url.pathname.endsWith('/api/calendar')?{movies:[{...movie,event:'theatrical',service:'劇場公開'}]}:{movies:[movie],total_results:1,total_pages:1};
    route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
   });
   await page.goto(`http://127.0.0.1:${port}/discover.html`);
   await page.locator('#apply').click();
   const result=page.locator('#grid .cinelva-discovery-unit').filter({has:page.locator('#grid [data-id="42"]')}).first();
   await result.waitFor();
   assert.equal(await result.locator('.cinelva-inline-score input[type="range"]').count(),1,'condition results expose the shared rating gauge');
   assert.equal(await result.locator('.cinelva-rate-button').count(),1,'condition results expose the shared review action');
   const bookmark=result.locator('.cinelva-bookmark-button');await bookmark.waitFor();await bookmark.click();
   assert.equal(await bookmark.getAttribute('aria-pressed'),'true','bookmark saves from discovery results');
   assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('cinelva-want-to-watch-v1')||'{}')['42']),'bookmark persists in the shared store');
   const rating=result.locator('.cinelva-inline-score input');
   await rating.evaluate(input=>{input.value='4.2';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
   assert.equal(await page.evaluate(()=>CinelvaLibraryRecords.all().find(x=>String(x.tmdbId??x.id)==='42')?.rating),4.2,'rating saves from discovery results');
   await result.locator('.cinelva-rate-button').click();
   assert.equal(await page.locator('#cinelvaRateTitle').textContent(),'Discovery test film','review action opens the populated shared review dialog');
   await page.locator('#cinelvaRateComment').fill('Discovery review');
   await page.locator('#cinelvaRateSave').click();
   assert.equal(await page.evaluate(()=>CinelvaLibraryRecords.all().find(x=>String(x.tmdbId??x.id)==='42')?.comment),'Discovery review','review saves');
   const shelf=page.locator('#theatricalPopularGrid .cinelva-discovery-unit').first();
   await shelf.waitFor();
   assert.equal(await shelf.locator('.cinelva-rate-button').count(),1,'recommendation shelves use shared review controls');
   assert.equal(await shelf.locator('.cinelva-bookmark-button').count(),1,'recommendation shelves use shared bookmarks');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'page has no horizontal overflow');
   assert.deepEqual(errors,[],'page has no uncaught errors');
   await context.close();
   console.log(`discovery shared controls ${width}px PASS`);
  }
 }finally{if(browser)await browser.close();server.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1;});
