const {chromium,webkit}=require('playwright'),{spawn}=require('child_process'),net=require('net'),assert=require('assert/strict'),{waitForLocalServer}=require('./helpers/local-server.cjs');
(async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 const movie={id:587,tmdbId:587,title:'ビッグ・フィッシュ',year:2003,poster:'https://image.tmdb.org/t/p/w500/fiPam4cMjYqYqJEWGdDX7dkNaB9.jpg',vote_average:8,vote_count:100};
 try{await waitForLocalServer(port);browser=await (process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch();for(const width of [375,390,768])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:844}});await context.addInitScript(t=>localStorage.setItem('cinelva-theme-v1',t),theme);
  await context.route('https://image.tmdb.org/**',r=>r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYl8AAAAASUVORK5CYII=','base64')}));
  await context.route('**/api/movies?*',r=>r.fulfill({json:{movies:[{...movie,tmdbId:undefined}],external:[]}}));await context.route('**/api/movie-detail?*',r=>r.fulfill({json:{movie}}));
  await context.route('**/data/revival_screenings.json',r=>r.fulfill({json:{generated_at:'2026-10-20',screenings:[{...movie,date:'2026-10-23',venue:'確認済み劇場',source_url:'https://www.ttcg.jp/'},{id:550,title:'ID未確認の上映',date:'2026-10-23',source_url:'https://www.ttcg.jp/'}]}}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}/revivals.html`,{waitUntil:'domcontentloaded'});
  const card=page.locator('[data-revival-index="0"]');await card.locator('.cinelva-rate-button').waitFor();await card.locator('.poster > img').waitFor();await page.waitForFunction(()=>document.querySelector('[data-revival-index="0"] .poster > img')?.naturalWidth>0);assert.equal(await page.locator('#grid').evaluate(x=>getComputedStyle(x).gridTemplateColumns.split(' ').length),3);
  assert.equal(new URL(await card.locator('.revival-detail').getAttribute('href'),'http://local').searchParams.get('id'),'587');
  assert.equal(await page.locator('[data-revival-index="1"] .cinelva-rate-button').count(),0);assert.equal(new URL(await page.locator('[data-revival-index="1"] .revival-detail').getAttribute('href'),'http://local').searchParams.has('id'),false);
  await card.locator('.cinelva-rate-button').click();assert.equal(await page.locator('#cinelvaRateTitle').innerText(),movie.title);await page.locator('#cinelvaRateClose').click();await card.locator('.cinelva-bookmark-button').click();assert.equal(await card.locator('.cinelva-bookmark-button').getAttribute('aria-pressed'),'true');
  await page.goto(`http://127.0.0.1:${port}/experience.html`,{waitUntil:'domcontentloaded'});await page.locator('[data-exp-tab="recommend"]').click();await page.locator('#formatFilm').fill(movie.title);await page.locator('[data-candidate-index="0"]').waitFor();await page.locator('[data-candidate-index="0"]').click();const selected=page.locator('#formatSelectedMovie');await selected.locator('.cinelva-rate-button').waitFor();assert.equal(await selected.locator('a').count(),2);for(const href of await selected.locator('a').evaluateAll(xs=>xs.map(x=>x.href)))assert.equal(new URL(href).searchParams.get('id'),'587');
  await context.route('**/api/people?*',r=>r.fulfill({json:{ids:[movie.id]}}));
  await context.route('**/api/discover?*',r=>r.fulfill({json:{movies:[movie,{id:141052,tmdbId:141052,title:'Justice League',year:2017},{id:57729,tmdbId:57729,title:'The Cobol Job',year:2010}],total_pages:1,total_results:3}}));
  await page.goto(`http://127.0.0.1:${port}/discover.html?person=525&role=${encodeURIComponent('監督')}&name=Nolan`,{waitUntil:'domcontentloaded'});
  await page.locator('#grid .card').waitFor();assert.equal(await page.locator('#grid .card').count(),1);
  assert.equal(await page.locator('#grid .title').innerText(),movie.title);
  await page.locator('#grid .cinelva-rate-button').waitFor();await page.locator('#grid .cinelva-rate-button').click();assert.equal(await page.locator('#cinelvaRateTitle').innerText(),movie.title);await page.locator('#cinelvaRateClose').click();
  // An older backend returns people rather than ids: verify the real published snapshot path.
  await context.route('**/api/people?*',r=>r.fulfill({json:{people:[]}}));
  await context.route('**/api/discover?*',r=>r.fulfill({json:{movies:[{id:27205,tmdbId:27205,title:'インセプション',year:2010},{id:141052,tmdbId:141052,title:'Justice League',year:2017},{id:57729,tmdbId:57729,title:'The Cobol Job',year:2010}],total_pages:1,total_results:3}}));
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#grid .card').waitFor();
  assert.equal(await page.locator('#grid .card').count(),1);assert.equal(await page.locator('#grid .title').innerText(),'インセプション');
  assert.match(await page.locator('#status').innerText(),/収録/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);await context.close();
 }console.log('Secondary revival and selected experience cards: 6 viewport/theme combinations passed');}finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
