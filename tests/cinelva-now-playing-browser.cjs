'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),net=require('node:net');
const {spawn}=require('node:child_process'),{waitForLocalServer}=require('./helpers/local-server.cjs'),{assertTextContrast}=require('./helpers/text-contrast.cjs');
const engine=process.env.CINELVA_BROWSER||'chromium';
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 const movies=Array.from({length:17},(_,i)=>({id:990001+i,tmdbId:990001+i,title:i?'上映中テスト '+i:'スター・ウォーズ QA',year:2026,score:7.5,popularity:100-i,poster:i===16?null:'https://image.tmdb.org/t/p/w342/fixture.jpg'}));
 const fresh=()=>({schema_version:1,region:'JP',source:{id:'tmdb',endpoint:'/movie/now_playing'},complete:true,generated_at:new Date().toISOString(),movies});
 try{
  await waitForLocalServer(port);browser=await require('playwright')[engine].launch();fs.mkdirSync('artifacts/now-playing',{recursive:true});
  for(const theme of ['light','dark'])for(const route of ['discover.html','cinelva/discover.html']){
   const context=await browser.newContext({viewport:{width:390,height:844}});let payload=fresh(),fail=false;
   await context.addInitScript(t=>localStorage.setItem('cinelva-theme-v1',t),theme);
   await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({status:503,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:'{}'}));
   await context.route('https://image.tmdb.org/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#555"/><text x="100" y="150" text-anchor="middle" fill="white">QA</text></svg>'}));
   await context.route('**/data/now_playing.json*',r=>r.fulfill({status:fail?503:200,json:payload}));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${port}/${route}`,{waitUntil:'domcontentloaded'});
   const section=page.locator('#nowPlaying'),cards=section.locator('[data-now-playing-id]');await cards.first().waitFor();assert.equal(await cards.count(),12);
   assert.match(await section.locator('[data-now-status]').innerText(),/17作品/);assert.match(await section.locator('[data-now-observed]').innerText(),/日本時間/);
   await cards.first().scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('#nowPlaying img')?.naturalWidth>0);
   assert.equal(await section.locator('[data-now-grid]').evaluate(g=>getComputedStyle(g).gridTemplateColumns.split(' ').length),3);
   await section.locator('[data-now-more]').click();assert.equal(await cards.count(),17);assert.match(await section.innerText(),/画像未提供/);
   await section.locator('[data-now-search]').fill('スターウォーズ');assert.equal(await cards.count(),1);assert.equal(await section.locator('[data-now-more]').isVisible(),false);
   const wrap=section.locator('.cinelva-discover-review-wrap').first();await wrap.locator('.cinelva-bookmark-button').click();assert.equal(await wrap.locator('.cinelva-bookmark-button').getAttribute('aria-pressed'),'true');
   assert.equal(await page.evaluate(()=>CinelvaLibraryRecords.all().length),0,'bookmark does not create viewing records');
   await wrap.locator('.cinelva-rate-button').click();assert.equal(await page.locator('#cinelvaRateTitle').innerText(),movies[0].title);
   await page.locator('#cinelvaRateScore').fill('4.2');await page.locator('#cinelvaRateScore').dispatchEvent('input');await page.locator('#cinelvaRateComment').fill('上映中一覧から記録');await page.locator('#cinelvaRateSave').click();
   await page.waitForFunction(()=>!document.querySelector('.cinelva-rate-dialog')?.open);
   await page.reload({waitUntil:'domcontentloaded'});await cards.first().waitFor();assert.equal(await wrap.locator('.cinelva-bookmark-button').getAttribute('aria-pressed'),'true');assert.match(await wrap.innerText(),/4\.2/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await assertTextContrast(page,['#nowPlaying h2','#nowPlaying .now-playing-note','#nowPlaying .now-playing-source','#nowPlaying [data-now-status]','#nowPlaying .presetCardTitle','#nowPlaying label'],`${engine}/${theme}/${route}`);
   await section.screenshot({path:`artifacts/now-playing/${engine}-${theme}-${route.replaceAll('/','-')}.png`});
   await cards.first().click();await page.locator('#detail h2').waitFor();assert.equal(await page.locator('#detail h2').innerText(),movies[0].title);assert.equal(new URL(page.url()).searchParams.get('id'),String(movies[0].id));
   if(theme==='light'&&route==='discover.html'){
    for(const [value,message] of [[{...fresh(),movies:[]},'確認できる上映中作品はありません'],[{...fresh(),generated_at:new Date(Date.now()-37*3600000).toISOString()},'更新が必要'],[{...fresh(),generated_at:new Date(Date.now()+3600000).toISOString()},'取得できません'],[{...fresh(),region:'US'},'取得できません'],[null,'取得できません']]){
     payload=value;fail=value===null;await page.goto(`http://127.0.0.1:${port}/${route}`,{waitUntil:'domcontentloaded'});await page.waitForFunction(text=>document.querySelector('#nowPlaying [data-now-status]')?.textContent.includes(text),message);assert.equal(await cards.count(),0);assert.equal(await section.locator('[data-now-controls]').isVisible(),false);
    }
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(`${engine}: nationwide now-playing root/prefix, light/dark,17-title expansion/search, shared review/bookmark persistence, offline detail and unavailable/stale/empty checks passed`);
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
