// Browser regression for streaming comparison. Test data is deliberately synthetic.
'use strict';
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const net=require('node:net');
const path=require('node:path');
const {waitForLocalServer}=require('./helpers/local-server.cjs');
const playwright=require('playwright');
async function freePort(){const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));return port;}
(async()=>{
 const port=await freePort(),base='http://127.0.0.1:'+port;
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});
 let browser;
 try{
  await waitForLocalServer(port);
  browser=await (process.env.CINELVA_BROWSER==='webkit'?playwright.webkit:playwright.chromium).launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>localStorage.setItem('cinelva-want-to-watch-v1',JSON.stringify({
   a:{id:'a',title:'Fixture A',year:2024,tmdbId:101},
   b:{id:'b',title:'Fixture B',year:2024,tmdbId:102}
  })));
  const group=movies=>({coverage:'complete',entitlement:'subscription',source:{urls:['https://example.org/fixture']},movies:movies.map(([id,title])=>({tmdb_id:id,title,entitlement:'subscription'}))});
  const data={schema_version:1,country:'JP',generated_at:new Date().toISOString(),
   license:{provider:'fixture',agreement_reference:'fixture-contract',public_display_authorized:true},
   coverage_audit:{auditor:'fixture',method:'full feed reconciliation',all_supported_services_verified:true},services:{
   Netflix:group([[101,'Fixture A']]),
   'U-NEXT':group([[102,'Fixture B']])
  }};
  await context.route('**/data/streaming-availability.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)}));
  await context.route('https://backend-one-gray-94.vercel.app/**',route=>route.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/streaming-compare.html',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'あなたとの相性'}).click();
  const row=page.locator('#comparisonRows tr').filter({has:page.locator('td:first-child', {hasText:'ブックマークした映画'})});
  await row.locator('button').first().getByText('1本').waitFor();
  await row.locator('button').first().click();
  await page.locator('#matchesDialog[open]').waitFor();
  assert.match(await page.locator('#matchesTitle').innerText(),/Netflix/);
  assert.equal(await page.locator('#matchesList .matchMovie').count(),1);
  assert.match(await page.locator('#matchesList a').first().getAttribute('href'), /search[.]html[?]search=Fixture[+]A&id=101/);
  await page.locator('#matchesClose').click();
  await page.selectOption('#fromService','Netflix スタンダード');
  await page.selectOption('#toService','U-NEXT');
  await page.getByText('新たに観られる映画 1本').click();
  assert.match(await page.locator('#matchesTitle').innerText(),/新たに観られる映画/);
  await page.locator('#matchesClose').click();
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('streaming comparison browser journey passed');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
