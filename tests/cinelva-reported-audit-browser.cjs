'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),net=require('node:net'),{spawn}=require('node:child_process');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await waitForLocalServer(port);browser=await require('playwright')[process.env.CINELVA_BROWSER||'chromium'].launch();fs.mkdirSync('artifacts/reported-audit',{recursive:true});
  for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width:390,height:844}});await context.addInitScript(t=>localStorage.setItem('cinelva-theme-v1',t),theme);
   await context.route('https://**/*',r=>r.fulfill({status:503,headers:{'access-control-allow-origin':'*'},json:{}}));
   await context.route('https://image.tmdb.org/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#555"/></svg>'}));
   await context.route('**/data/backend.json*',r=>r.fulfill({json:{enabled:false}}));
   const film=(id,title)=>({id:'local-'+id,tmdbId:id,title,date:'2026-10-02',event:'streaming',service:'Prime Video',poster:'https://image.tmdb.org/t/p/w342/fixture.jpg',source_url:'https://www.aboutamazon.jp/news/entertainment/amazon-prime-video-new-content-october-2026'});
   const films=[film(42,'短い作品'),film(43,'とても長い作品名の映画で二行以上の高さになっていた作品')];
   await context.route('**/data/tv.json*',r=>r.fulfill({json:{movies:[{...film(44,'短い映画'),event:'tv',service:'テレビ東京',program:'短い番組',time:'13:40'},{...film(45,'長い映画名が続く二行の作品'),event:'tv',service:'テレビ東京',program:'とても長い番組名が何行も続いていても共通レビューの下端が揃う番組',time:'13:40'}]}}));
   await context.route('**/data/movies.json*',r=>r.fulfill({json:{movies:films}}));
   await context.route('**/data/availability.json*',r=>r.fulfill({json:{movies:{42:{checked_at:'2026-10-24T00:00:00Z',flatrate:['Prime Video']},43:{checked_at:'2026-10-24T00:00:00Z',flatrate:[]}}}}));
   await context.route('**/data/special_screenings.json*',r=>r.fulfill({json:{screenings:[{id:11878,tmdbId:11878,title:'用心棒',date:'2026-10-02',end_date:'2026-10-15',event:'theatrical',service:'午前十時の映画祭',special_screening:'asa10',poster:'https://image.tmdb.org/t/p/w342/fixture.jpg'}]}}));
   const errors=[];let page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-24T00:00:00Z')});
   // A new document must not inherit WebKit errors from intentionally canceled
   // background fetches in an outgoing document. Keep all current-page errors fatal.
   const freshPage=async()=>{assert.deepEqual(errors,[]);page.removeAllListeners('pageerror');await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));};
   await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
   await page.locator('.modeTab[data-mode="theatrical"]').click();await page.locator('.streamMovieTitle').filter({hasText:'用心棒'}).waitFor();
   assert.equal(await page.locator('.streamMovieTitle').filter({hasText:'用心棒'}).count(),1,'one poster per finite period in displayed month');
   assert.match(await page.locator('.streamMovie').filter({has:page.locator('.streamMovieTitle').filter({hasText:'用心棒'})}).locator('.streamMovieDate.isPeriod').innerText(),/10\/02.*10\/15/);
   const tab=await page.locator('.modeTab.active').evaluate(e=>({background:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow}));assert.equal(tab.background,'rgba(0, 0, 0, 0)');assert(!tab.shadow.includes('239, 63, 63'));
   await page.locator('.modeTab[data-mode="streaming"]').click();await page.locator('.streamMovie .cinelva-rating-controls').first().waitFor();
   await page.locator('.streamMovieAvail').filter({hasText:'見放題 Prime Video'}).waitFor();
   assert.match(await page.locator('.streamMovie').filter({has:page.getByText('短い作品',{exact:true})}).locator('.streamMovieAvail').innerText(),/見放題 Prime Video/,'canonical TMDB ID finds observations despite local ID');
   assert.match(await page.locator('.streamMovie').filter({has:page.getByText('とても長い作品名の映画で二行以上の高さになっていた作品',{exact:true})}).locator('.streamMovieAvail').innerText(),/Prime Video.*配信開始/,'official announcement remains visible without live providers');
   const boxes=await page.locator('.streamMovie>.cinelva-rating-controls').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {y:r.y,height:r.height};}));assert.equal(boxes.length,2);assert(Math.abs(boxes[0].y-boxes[1].y)<1,'review baselines align');assert.equal(boxes[0].height,boxes[1].height);
   await page.screenshot({path:`artifacts/reported-audit/${process.env.CINELVA_BROWSER||'chromium'}-${theme}-calendar.png`});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
   await page.locator('.modeTab[data-mode="tv"]').click();await page.locator('.tvMovie>.cinelva-rating-controls').first().waitFor();
   const tvBoxes=await page.locator('.tvMovie>.cinelva-rating-controls').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {bottom:r.bottom,height:r.height};}));assert.equal(tvBoxes.length,2);assert(Math.abs(tvBoxes[0].bottom-tvBoxes[1].bottom)<1,'TV reviews align despite unequal program text');assert.equal(tvBoxes[0].height,tvBoxes[1].height);
   for(const route of ['cinelva/index.html','cinelva/credits.html','discover.html','search.html','rankings.html','my-cinelva/index.html','credits.html','theaters.html']){
    await freshPage();
    await page.goto(`http://127.0.0.1:${port}/${route}`,{waitUntil:'domcontentloaded'});
    const images=page.locator('.gBrand img,.brand img');await images.first().waitFor();
    const sources=await images.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')));assert(sources.every(x=>x.includes('cinelva_original_colors_transparent.png')),route+' uses unchanged supplied frame');
    assert.equal(await page.locator('script[src*="cinelva-logo-frame"]').count(),0,route+' never loads destructive canvas transform');
    if(route==='credits.html')assert.equal(await page.getByRole('link',{name:'映画コンシェルジュ',exact:true}).count(),0);
   }
   await freshPage();
   // Hold schedules until the directory is usable: late boot completion must
   // preserve both filters and the active comparison table, in either theme.
   let releaseSchedules;
   const schedulesReady=new Promise(resolve=>{releaseSchedules=resolve});
   await context.route('**/data/theater_schedules.json*',async route=>{await schedulesReady;await route.fulfill({json:{__loadRace:true,theaters:[]}})});
   await page.goto(`http://127.0.0.1:${port}/theaters.html?format=IMAX&prefecture=${encodeURIComponent('神奈川県')}`,{waitUntil:'domcontentloaded'});
   await page.locator('[data-format-filter="IMAX"]').click();await page.locator('#prefectureFilter').selectOption('神奈川県');await page.waitForFunction(()=>document.querySelector('#meta')?.textContent.includes('5件表示'));
   releaseSchedules();
   await page.waitForFunction(()=>typeof scheduleData!=='undefined'&&scheduleData.__loadRace);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert.match(await page.locator('#meta').innerText(),/5件表示.*神奈川県/,'late schedules preserve prefecture and equipment filters');
   assert.equal(await page.locator('#grid .theaterTable').count(),1,'late schedules preserve comparison table');
   await context.unroute('**/data/theater_schedules.json*');
   assert.match(await page.locator('#grid').innerText(),/横浜ブルク13/);assert.match(await page.locator('#grid').innerText(),/休止/);
   await context.route('**/data/awards.json*',r=>r.fulfill({json:{awards:[{organization:'アカデミー賞',category:'作品賞',year:1944,title:'カサブランカ',tmdb_id:289,release_year:1942,source:'https://www.oscars.org/oscars/ceremonies/1944'}],catalog:[{id:289,title:'カサブランカ',year:1942,poster:'https://image.tmdb.org/t/p/w342/verified.jpg'}]}}));
   await context.route('**/data/movies.json*',r=>r.fulfill({json:{movies:[{id:289,title:'カサブランカ',year:1942,poster:null}]}}));
   await freshPage();
   await page.goto(`http://127.0.0.1:${port}/my-cinelva/`,{waitUntil:'domcontentloaded'});
   await page.locator('[data-tab="awards"]').click();
   await page.waitForFunction(()=>document.querySelector('#awardMatrix th'));
   assert.equal(await page.locator('#awardMatrix thead th').nth(1).innerText(),'鑑賞計','watched total precedes decades');
   await page.locator('[data-award-cell="アカデミー賞|1940"]').click();
   const awardImage=page.locator('#awardFilms .poster img').first();await awardImage.waitFor();
   assert.match(await awardImage.getAttribute('src'),/verified.jpg/,'empty calendar artwork never erases award catalog poster');
   await page.waitForFunction(()=>document.querySelector('#awardFilms .poster img')?.naturalWidth>0);
   await page.locator('[data-tab="watchlist"]').click();
   assert.match((await page.locator('#wantWatchSort option').allTextContents()).join(' '),/保存した日/);
   assert.doesNotMatch(await page.locator('body').innerText(),/ソートキー|実装済み|作品ID未照合|照合保留/);
   await context.route('**/data/now_playing.json*',r=>r.fulfill({json:{schema_version:1,region:'JP',source:{id:'tmdb',endpoint:'/movie/now_playing'},complete:true,generated_at:'2026-10-24T00:00:00Z',movies:[{id:43,title:'上映中の作品'}]}}));
   await context.route('**/api/movie-detail?*',r=>r.fulfill({headers:{'access-control-allow-origin':'*'},json:{movie:{id:Number(new URL(r.request().url()).searchParams.get('id')),tmdbId:Number(new URL(r.request().url()).searchParams.get('id')),title:'短い作品',event:'catalog',availability:{logos:{Netflix:'/netflix.png','Amazon Prime Video':'/prime.png','Amazon Video':'/prime.png','Apple TV Store':'/apple.png'},flatrate:['Netflix','Amazon Prime Video'],rent:['Amazon Video'],buy:['Apple TV Store'],source_url:'https://www.themoviedb.org/movie/42/watch?locale=JP'}}}}));
   for(const prefix of ['', 'cinelva/']){
    await freshPage();
    await page.goto(`http://127.0.0.1:${port}/${prefix}search.html?id=42`,{waitUntil:'domcontentloaded'});
    assert.equal(await page.evaluate(()=>new Date().toISOString().slice(0,10)),'2026-10-24','context clock is retained by fresh documents');
    try{await page.getByRole('heading',{name:'視聴可能なサービス',exact:true}).waitFor();}catch(error){await page.screenshot({path:`artifacts/reported-audit/provider-failure-${prefix?'prefix':'root'}.png`});throw Error(JSON.stringify({errors,detail:await page.locator('#detail').innerText()})+' '+error.message);}
    assert.equal(await page.getByRole('heading',{name:'どの上映方式で見る？',exact:true}).count(),0,'old films do not show cinema formats');
    const panel=page.locator('.watchProviders');assert.match(await panel.innerText(),/見放題[\s\S]*レンタル[\s\S]*購入/);
    const netflix=panel.getByRole('link',{name:'Netflixで検索',exact:true});
    assert.equal(new URL(await netflix.getAttribute('href')).searchParams.get('q'),'短い作品');
    assert.equal(await netflix.evaluate(e=>e.getBoundingClientRect().height>=44),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await panel.locator('.watchProviderLink').count(),4);assert.equal(await panel.locator('.watchProviderLink img').count(),4);assert.equal(await panel.locator('.watchProviderGroup').count(),3);assert.equal(await panel.locator('.watchProviderColumns').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),3);
    const popupPromise=page.waitForEvent('popup');await netflix.click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');assert.equal(new URL(popup.url()).hostname,'www.netflix.com');await popup.close();
    await page.screenshot({path:`artifacts/reported-audit/${process.env.CINELVA_BROWSER||'chromium'}-${theme}-${prefix?'prefix':'root'}-providers.png`});
    assert.deepEqual(errors,[]);
   }
   await freshPage();
   await page.goto(`http://127.0.0.1:${port}/search.html?id=43`,{waitUntil:'domcontentloaded'});
   await page.getByRole('heading',{name:'どの上映方式で見る？',exact:true}).waitFor();
   assert.deepEqual(errors,[]);
   await freshPage();
   await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof groupedMovieCards==='function');
   const streamingOrder=await page.evaluate(()=>{movies=[{id:101,title:'Later Netflix',date:'2026-10-04',service:'Netflix',event:'streaming'},{id:102,title:'Early Prime',date:'2026-10-01',service:'Prime Video',event:'streaming'},{id:103,title:'Early Netflix',date:'2026-10-01',service:'Netflix',event:'streaming'},{id:104,title:'Early FOD',date:'2026-10-01',service:'FOD',event:'streaming'}];mode='streaming';active='すべて';view=new Date(2026,9,1);streamRangeStart=null;render();return {titles:[...document.querySelectorAll('.streamMovieTitle')].map(e=>e.textContent),tags:[...document.querySelectorAll('.streamMovieService')].map(e=>({name:e.textContent,color:getComputedStyle(e).backgroundColor,legend:getComputedStyle([...document.querySelectorAll('#legend span')].find(x=>x.textContent===e.textContent).querySelector('i')).backgroundColor}))};});
   assert.deepEqual(streamingOrder.titles,['Early Netflix','Early Prime','Early FOD','Later Netflix']);assert.equal(streamingOrder.tags.length,4);for(const tag of streamingOrder.tags)assert.equal(tag.color,tag.legend,tag.name);
   const theatricalOrder=await page.evaluate(()=>{movies=[{id:101,title:'Later Regular',date:'2026-10-05',service:'劇場公開',event:'theatrical'},{id:102,title:'Early Morning',date:'2026-10-01',end_date:'2026-10-02',service:'午前十時の映画祭',special_screening:'asa10',event:'theatrical'},{id:103,title:'Middle Revival',date:'2026-10-03',service:'リバイバル上映',event:'theatrical'}];mode='theatrical';active='すべて';theatricalRangeStart=null;render();return [...document.querySelectorAll('.streamMovieTitle')].map(e=>e.textContent);});
   assert.deepEqual(theatricalOrder,['Early Morning','Middle Revival','Later Regular']);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await context.close();
  }
  console.log('Reported UI audit: supplied logos, period dedupe, quiet tabs, provider evidence, review alignment and Kanagawa IMAX passed in both themes');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
