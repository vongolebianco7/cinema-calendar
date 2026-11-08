'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {spawn}=require('node:child_process');
const net=require('node:net');
const {waitForLocalServer}=require('./helpers/local-server.cjs');

(async()=>{
 const listener=net.createServer();
 await new Promise(resolve=>listener.listen(0,'127.0.0.1',resolve));
 const port=listener.address().port;
 await new Promise(resolve=>listener.close(resolve));
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await waitForLocalServer(port);
  browser=await(process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch();
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const now=new Date().toISOString();
  let releaseDelayedImage;
  const delayedImageGate=new Promise(resolve=>{releaseDelayedImage=resolve;});
  await context.route('**/delayed-fail.jpg',async route=>{await delayedImageGate;await route.fulfill({status:404});});
  await context.route('**/data/availability.json',route=>route.fulfill({json:{
   generated_at:now,
   source:'TMDB watch/providers (JustWatch)',
   note:'国内向け配信先の観測。配信開始日ではありません。',
   movies:{
    '101':{title:'Netflixの映画',services:['Netflix'],flatrate:['Netflix'],rent:[],buy:[],checked_at:now,source_url:'https://www.themoviedb.org/movie/101/watch?locale=JP'},
    '102':{title:'レンタル映画',services:['Prime Video'],flatrate:['Prime Video'],rent:['Amazon Video'],buy:[],checked_at:now,source_url:'https://www.themoviedb.org/movie/102/watch?locale=JP'},
    '103':{title:'古い観測',services:['Netflix'],flatrate:['Netflix'],rent:[],buy:[],checked_at:'2026-01-01T00:00:00Z'},
    '104':{title:'レンタル専用',services:[],flatrate:[],rent:['Amazon Video'],buy:[],checked_at:now},
    '105':{title:'FODチャンネル作品',services:['FOD Channel Amazon Channel'],flatrate:['FOD Channel Amazon Channel'],rent:[],buy:[],checked_at:now},
    '106':{title:'配信ポスター補完',poster:'https://image.tmdb.org/t/p/w500/verified.jpg',services:['Netflix'],flatrate:['Netflix'],free:[],ads:[],rent:[],buy:[],checked_at:now},
    '107':{title:'無料配信作品',services:[],flatrate:[],free:['ABEMA'],ads:[],rent:[],buy:[],checked_at:now},
    '108':{title:'広告つき配信作品',services:[],flatrate:[],free:[],ads:['Hulu'],rent:[],buy:[],checked_at:now},
    '109':{title:'削除後に失敗するポスター',poster:'https://cinelva.test/delayed-fail.jpg',services:['Netflix'],flatrate:['Netflix'],free:[],ads:[],rent:[],buy:[],checked_at:now},
   '110':{title:'カタログ未収録の配信作品',services:['Netflix'],flatrate:['Netflix'],free:[],ads:[],rent:[],buy:[],checked_at:now,source_url:'https://www.themoviedb.org/movie/110/watch?locale=JP'}
   }
  }}));
  await context.route('**/data/movies.json',route=>route.fulfill({json:{movies:[
   {id:101,tmdbId:101,title:'Netflixの映画',poster:'https://cinelva.test/fake.jpg',popularity:20},
   {id:102,tmdbId:102,title:'レンタル映画',poster:null,popularity:10},
   {id:103,tmdbId:103,title:'古い観測',poster:null,popularity:5},
   {id:104,tmdbId:104,title:'レンタル専用',poster:null,popularity:4},
   {id:105,tmdbId:105,title:'FODチャンネル作品',poster:null,popularity:3},
   {id:106,tmdbId:106,title:'配信ポスター補完',poster:null,popularity:2}
  ]}}));
  await context.route('**/api/movie-detail?id=110&view=poster',route=>route.fulfill({json:{movie:{id:110,tmdbId:110,title:'カタログ未収録の配信作品',release_date:'1994-01-01',poster:'https://image.tmdb.org/t/p/w500/api-fallback.jpg'}}}));
  await context.route('https://image.tmdb.org/t/p/w500/api-fallback.jpg',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp1sAAAAASUVORK5CYII=','base64')}));
  await context.route('https://cinelva.test/fake.jpg',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp1sAAAAASUVORK5CYII=','base64')}));
  await context.route('https://image.tmdb.org/t/p/w500/verified.jpg',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp1sAAAAASUVORK5CYII=','base64')}));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const delayedImageRequest=page.waitForRequest('**/delayed-fail.jpg');
  await page.goto(`http://127.0.0.1:${port}/streaming.html`);
  await delayedImageRequest;
  await page.getByText('9作品で7日以内の配信状況を確認できました。',{exact:false}).waitFor();
  const recoveredCard=page.locator('.card').filter({hasText:'カタログ未収録の配信作品'});
  await recoveredCard.scrollIntoViewIfNeeded();
  await recoveredCard.locator('img').waitFor({state:'attached'});
  await page.waitForFunction(()=>[...document.querySelectorAll('.card img')].some(image=>image.getAttribute('src')==='https://image.tmdb.org/t/p/w500/api-fallback.jpg'));
  assert.equal(await page.locator('.card').count(),6,'fresh current availability is rendered; stale observations are excluded and rental-only rows stay out of subscription');
  assert.equal(await page.locator('.card img').count(),4,'canonical and availability snapshot posters are rendered');
  await page.locator('.card').filter({hasText:'削除後に失敗するポスター'}).evaluate(card=>card.remove());
  releaseDelayedImage();
  await page.waitForTimeout(100);
  assert.deepEqual(errors,[],'a late image error after its card is detached does not throw');
  const fallbackCard=page.locator('.card').filter({hasText:'配信ポスター補完'});
  assert.equal(await fallbackCard.locator('img').getAttribute('src'),'https://image.tmdb.org/t/p/w500/verified.jpg','availability poster is rendered even without a movie catalog row');
  assert.equal(await recoveredCard.locator('img').getAttribute('src'),'https://image.tmdb.org/t/p/w500/api-fallback.jpg','TMDB ID from the availability snapshot recovers artwork when no movie catalog record exists');
  const coverage=await page.locator('#status').innerText();
  assert.match(coverage,/Netflix 4.*Prime Video 1/,'subscription counts include only the selected access type');
  assert.doesNotMatch(coverage,/FOD/,'FOD Amazon Channels are not counted as the standalone FOD service');
  assert.doesNotMatch(coverage,/レンタル専用/);
  assert.doesNotMatch(coverage,/ABEMA/,'providers without fresh observations are not described as confirmed');
  assert.doesNotMatch(await page.locator('#service option[value="ABEMA"]').innerText(),/直近データなし/,'fresh free availability is reflected in the provider selector');
  await page.locator('#service').selectOption('ABEMA');
  assert.equal(await page.locator('.card').count(),0,'providers without recent rows do not receive stale titles');
  await page.locator('#service').selectOption('');
  await page.locator('[data-kind="free_ads"]').click();
  assert.equal(await page.locator('.card').count(),2,'free and ad-supported observations are shown in their own view');
  const freeAdsCoverage=await page.locator('#status').innerText();
  assert.match(freeAdsCoverage,/無料・広告つき.*ABEMA 1.*Hulu 1/,'free and ad-supported provider coverage is reported separately');
  await page.locator('#service').selectOption('ABEMA');
  assert.equal(await page.locator('.card').count(),1,'free providers filter correctly');
  assert.match(await page.locator('#status').innerText(),/ABEMA 1/,'provider coverage follows the selected service');
  assert.doesNotMatch(await page.locator('#status').innerText(),/Hulu 1/,'filtered coverage excludes other services');
  assert.match(await page.locator('.card').innerText(),/無料配信作品/);
  await page.locator('#service').selectOption('');
  await page.locator('[data-kind="flatrate"]').click();
  await page.locator('#service').selectOption('Netflix');
  assert.equal(await page.locator('.card').count(),4,'service filter narrows the catalog to all four Netflix titles');
  assert.match(await page.locator('#status').innerText(),/Netflix 4/,'filtered subscription count matches all four Netflix titles');
  assert.doesNotMatch(await page.locator('#status').innerText(),/Prime Video 1/,'other services do not appear in filtered coverage');
  await page.locator('#query').fill('配信ポスター補完');
  assert.equal(await page.locator('.card').count(),1,'text search narrows the visible catalog');
  assert.match(await page.locator('#status').innerText(),/Netflix 1/,'provider coverage follows the text search');
  await page.locator('#query').fill('');
  const netflixCards=(await page.locator('.card').allTextContents()).join(' ');
  assert.match(netflixCards,/Netflixの映画/);
  assert.match(netflixCards,/配信ポスター補完/);
  await page.locator('#service').selectOption('');
  await page.locator('[data-kind="rent"]').click();
  assert.equal(await page.locator('.card').count(),2,'rental-only and mixed-access rows remain in the rental view');
  const rentalCoverage=await page.locator('#status').innerText();
  assert.match(rentalCoverage,/Prime Video 2/,'rental counts are calculated for rental observations only');
  assert.doesNotMatch(rentalCoverage,/Netflix/);
  assert.equal(await page.locator('.card').filter({hasText:'レンタル映画'}).count(),1,'the mixed-access title remains in the rental results');
  await page.locator('#service').selectOption('Prime Video');
  assert.equal(await page.locator('.card').count(),2,'service filtering also works in the rental view');
  assert.match(await page.locator('.footer').innerText(),/配信開始日を保証するものではありません/);
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('Current streaming catalog recovers posters by explicit TMDB ID when the movie catalog is missing a row, filters availability, and labels freshness.');
 }finally{
  if(browser)await browser.close();
  server.kill();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
