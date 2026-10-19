const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),net=require('node:net'),path=require('node:path');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const socket=net.createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  await waitForLocalServer(port);browser=await (process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch({headless:true});
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),errors=[];
   context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
   const movie={id:42,tmdbId:42,title:'共通作品テスト',year:2000,director:'Other Director',runtime:120,genres:['SF'],countries:['Japan']};
   await context.route('**/api/**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(route.request().url().includes('movie-detail')?{movie}:{movies:[movie],external:[],total_pages:1})}));
   await context.route('**/data/movies.json*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({movies:[movie]})}));
   await context.route('**/data/awards.json*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({awards:[{organization:'アカデミー賞',year:2021,title:movie.title,tmdb_id:42,category:'作品賞'},{organization:'アカデミー賞',year:2022,title:'未鑑賞受賞作',tmdb_id:43,category:'作品賞'}],catalog:[{id:43,title:'未鑑賞受賞作',year:2021}]})}));
   await context.route('**/data/directors*.json*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({directors:{one:{id:1,name:'Other Director',works:[movie],coverage:{truncated:false}}}})}));
   const raw=JSON.stringify({900:{...movie,id:900,rating:4.3,watched:true,watchedAt:'2025-01',comment:'既存レビュー',unknown:'keep'}});
   await context.addInitScript(raw=>{if(!/^https?:$/.test(location.protocol))return;if(!localStorage.getItem('bookmark-test-init')){localStorage.setItem('cinelva-library-records-v2',raw);localStorage.setItem('cinelva-want-to-watch-v1',JSON.stringify({7:{id:7,title:'以前のブックマーク',custom:'keep'}}));localStorage.setItem('bookmark-test-init','yes')}},raw);
   const base='http://127.0.0.1:'+port,page=await context.newPage();
   await page.goto(base+'/search.html?search='+encodeURIComponent(movie.title));
   const mark=page.locator('#grid [data-bookmark-id="42"]').first();await mark.waitFor();await mark.click();assert.equal(await mark.getAttribute('aria-pressed'),'true');
   assert.equal(await page.evaluate(()=>localStorage.getItem('cinelva-library-records-v2')),raw);
   await page.goto(base+'/my-cinelva/?tab=watchlist');await page.locator('#watchlistView .cinelva-bookmark-button').first().waitFor();
   assert.equal(await page.locator('#summaryView #wantWatchList').count(),0);
   assert.match(await page.locator('#wantWatchList').innerText(),/共通作品テスト/);
   await page.locator('[data-tab="summary"]').click();
   await page.locator('#csTop [data-bookmark-id="42"]').waitFor();
   for(const selector of ['#csTop .cinelva-rate-button','#csTop .cinelva-bookmark-button']){
    const bounds=await page.locator(selector).first().evaluate(button=>{const box=button.getBoundingClientRect(),card=button.closest('.cs-film').getBoundingClientRect();return {width:box.width,height:box.height,inside:box.left>=card.left&&box.right<=card.right+1};});
    assert.ok(bounds.width>=44&&bounds.height>=44&&bounds.inside,'summary controls remain inside their movie card');
   }
   await page.locator('[data-tab="records"]').click();
   const recordMark=page.locator('#recordList [data-bookmark-id="42"]');await recordMark.waitFor();assert.equal(await recordMark.getAttribute('aria-pressed'),'true');
   // Another tab's storage events must update every same-film control.
   const second=await context.newPage();await second.goto(base+'/rankings.html');await second.waitForFunction(()=>Boolean(window.CinelvaBookmarks));
   await second.evaluate(()=>CinelvaBookmarks.toggle({id:42,title:'共通作品テスト'}));
   await page.waitForFunction(()=>document.querySelector('#recordList [data-bookmark-id="42"]')?.getAttribute('aria-pressed')==='false');
   assert.equal(await page.evaluate(()=>localStorage.getItem('cinelva-library-records-v2')),raw);
   assert.equal(await page.locator('#wantWatchList [data-bookmark-id="42"]').count(),0);
   await recordMark.click();await page.reload();await page.locator('[data-tab="records"]').click();
   await page.locator('#recordList .cinelva-rate-button').click();assert.equal(await page.locator('#cinelvaRateScore').inputValue(),'4.3');await page.locator('#cinelvaRateClose').click();
   const range=page.locator('#recordList .cinelva-inline-score input');await range.evaluate(input=>{input.value='4.4';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
   const saved=await page.evaluate(()=>CinelvaLibraryRecords.all()[0]);assert.equal(saved.rating,4.4);assert.equal(String(saved.id),'900');assert.equal(saved.comment,'既存レビュー');assert.equal(saved.watchedAt,'2025-01');
   assert.equal(await page.locator('#recordList .record-shared-controls input[type="range"]').count(),1);
   await page.locator('[data-tab="awards"]').click();
   await page.locator('[data-award-cell="アカデミー賞|2020"]').click();
   await page.locator('#awardFilms [data-bookmark-id="43"]').waitFor();
   const beforeAwardBookmark=await page.evaluate(()=>localStorage.getItem('cinelva-library-records-v2'));
   await page.locator('#awardFilms [data-bookmark-id="43"]').click();
   assert.equal(await page.locator('#awardFilms [data-bookmark-id="43"]').getAttribute('aria-pressed'),'true');
   assert.equal(await page.evaluate(()=>localStorage.getItem('cinelva-library-records-v2')),beforeAwardBookmark);
   await page.locator('[data-tab="directors"]').click();await page.locator('.director-pick').first().click();assert.equal(await page.locator('.director-filmography [data-bookmark-id="42"]').getAttribute('aria-pressed'),'true');
   await page.goto(base+'/search.html?id=42&search='+encodeURIComponent(movie.title));await page.locator('.recordAction [data-bookmark-id="42"]').waitFor();
   assert.equal(await page.locator('.recordAction [data-bookmark-id="42"]').getAttribute('aria-pressed'),'true');
   await page.locator('.recordAction [data-bookmark-id="42"]').click();
   const bookmarks=await page.evaluate(()=>JSON.parse(localStorage.getItem('cinelva-want-to-watch-v1')));assert.equal(bookmarks[7].custom,'keep');assert.equal(bookmarks[42],undefined);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   assert.deepEqual(errors,[]);await context.close();console.log('bookmark browser '+width+'px PASS');
  }
 }finally{if(browser)await browser.close();server.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1});
