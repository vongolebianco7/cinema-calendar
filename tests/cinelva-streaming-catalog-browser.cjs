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
  await context.route('**/data/availability.json',route=>route.fulfill({json:{
   generated_at:now,
   source:'TMDB watch/providers (JustWatch)',
   note:'国内向け配信先の観測。配信開始日ではありません。',
   movies:{
    '101':{title:'Netflixの映画',services:['Netflix'],flatrate:['Netflix'],rent:[],buy:[],checked_at:now,source_url:'https://www.themoviedb.org/movie/101/watch?locale=JP'},
    '102':{title:'レンタル映画',services:['Prime Video'],flatrate:['Prime Video'],rent:['Amazon Video'],buy:[],checked_at:now,source_url:'https://www.themoviedb.org/movie/102/watch?locale=JP'},
    '103':{title:'古い観測',services:['Netflix'],flatrate:['Netflix'],rent:[],buy:[],checked_at:'2026-01-01T00:00:00Z'},
    '104':{title:'レンタル専用',services:[],flatrate:[],rent:['Amazon Video'],buy:[],checked_at:now},
    '105':{title:'FODチャンネル作品',services:['FOD Channel Amazon Channel'],flatrate:['FOD Channel Amazon Channel'],rent:[],buy:[],checked_at:now}
   }
  }}));
  await context.route('**/data/movies.json',route=>route.fulfill({json:{movies:[
   {id:101,tmdbId:101,title:'Netflixの映画',poster:'https://cinelva.test/fake.jpg',popularity:20},
   {id:102,tmdbId:102,title:'レンタル映画',poster:null,popularity:10},
   {id:103,tmdbId:103,title:'古い観測',poster:null,popularity:5},
   {id:104,tmdbId:104,title:'レンタル専用',poster:null,popularity:4},
   {id:105,tmdbId:105,title:'FODチャンネル作品',poster:null,popularity:3}
  ]}}));
  await context.route('https://cinelva.test/fake.jpg',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp1sAAAAASUVORK5CYII=','base64')}));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/streaming.html`);
  await page.getByText('4作品で7日以内の配信状況を確認できました。',{exact:false}).waitFor();
  assert.equal(await page.locator('.card').count(),3,'fresh current availability is rendered; stale observations are excluded and rental-only rows stay out of subscription');
  assert.equal(await page.locator('.card img').count(),1,'matched canonical poster is rendered');
  const coverage=await page.locator('#status').innerText();
  assert.match(coverage,/Netflix 1.*Prime Video 1/,'subscription counts include only the selected access type');
  assert.doesNotMatch(coverage,/FOD/,'FOD Amazon Channels are not counted as the standalone FOD service');
  assert.doesNotMatch(coverage,/レンタル専用/);
  assert.doesNotMatch(coverage,/ABEMA/,'providers without fresh observations are not described as confirmed');
  assert.match(await page.locator('#service option[value="ABEMA"]').innerText(),/直近データなし/,'unsupported freshness is visible in the provider selector');
  await page.locator('#service').selectOption('ABEMA');
  assert.equal(await page.locator('.card').count(),0,'providers without recent rows do not receive stale titles');
  await page.locator('#service').selectOption('');
  await page.locator('#service').selectOption('Netflix');
  assert.equal(await page.locator('.card').count(),1,'service filter narrows the catalog');
  assert.match(await page.locator('.card').innerText(),/Netflixの映画/);
  await page.locator('#service').selectOption('');
  await page.locator('[data-kind="rent"]').click();
  assert.equal(await page.locator('.card').count(),2,'rental-only and mixed-access rows remain in the rental view');
  const rentalCoverage=await page.locator('#status').innerText();
  assert.match(rentalCoverage,/Prime Video 2/,'rental counts are calculated for rental observations only');
  assert.doesNotMatch(rentalCoverage,/Netflix/);
  assert.match(await page.locator('.card').innerText(),/レンタル映画/);
  await page.locator('#service').selectOption('Prime Video');
  assert.equal(await page.locator('.card').count(),2,'service filtering also works in the rental view');
  assert.match(await page.locator('.footer').innerText(),/配信開始日を保証するものではありません/);
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('Current streaming catalog filters observed availability, excludes stale rows, renders known posters, and labels availability separately from premiere dates.');
 }finally{
  if(browser)await browser.close();
  server.kill();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
