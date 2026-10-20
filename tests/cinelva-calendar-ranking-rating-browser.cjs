const {chromium,webkit}=require('playwright');
const {spawn}=require('node:child_process');
const net=require('node:net');
const path=require('node:path');
const assert=require('node:assert/strict');

async function getPort(){
 const server=net.createServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 await new Promise(resolve=>server.close(resolve));
 return port;
}
(async()=>{
 const port=await getPort(),root=path.resolve(__dirname,'..');
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
 let browser;
 try{
  const base='http://127.0.0.1:'+port;
  for(let i=0;i<80;i++){
   // A short TCP probe avoids Node's undici fetch/Socket parser race when
   // the temporary local HTTP server is terminated after the browser test.
   const ready=await new Promise(resolve=>{
    const socket=net.connect(port,'127.0.0.1');
    socket.once('connect',()=>{socket.destroy();resolve(true);});
    socket.once('error',()=>resolve(false));
   });
   if(ready)break;
   if(i===79)throw Error('server unavailable');
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  browser=await (process.env.CINELVA_BROWSER==='webkit'?webkit:chromium).launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  // Test the real existing ranking DOM and calendar DOM, while keeping
  // external movie feeds offline and deterministic.
  await page.goto(base+'/rankings.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.CinelvaQuickRate));
  // Wait for the application's asynchronous initial ranking render before
  // inserting deterministic fixtures; otherwise it overwrites test cards.
  await page.waitForFunction(()=>Boolean(document.querySelector('#sourceNote')?.textContent?.trim()) && document.querySelectorAll('#grid a.rankCard').length>0);
  await page.evaluate(()=>{
   document.querySelector('#grid').innerHTML=
    '<a class="rankCard" href="search.html?id=101&search=Film%20One"><span class="title">Film One</span></a>'+
    '<a class="rankCard" href="search.html?id=102&search=Film%20Two"><span class="title">Film Two</span></a>';
  });
  await page.evaluate(()=>{for(const card of document.querySelectorAll('#grid a.rankCard')){const u=new URL(card.href),slot=document.createElement('div');card.after(slot);CinelvaQuickRate.mountInline(slot,{id:Number(u.searchParams.get('id')),title:u.searchParams.get('search')});}});
  await page.locator('#grid .cinelva-rate-button').first().waitFor({timeout:10000});
  await page.locator('#grid .cinelva-rate-button').first().click();
  await page.locator('#cinelvaRateScore').evaluate(el=>{el.value='4.5';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#cinelvaRateComment').fill('ランキングから記録');
  await page.locator('#cinelvaRateSave').click();
  await page.waitForFunction(()=>document.querySelector('#grid .cinelva-rating-personal')?.textContent.includes('4.5'));
  assert.equal(await page.locator('.cinelva-rate-dialog').evaluate(dialog=>dialog.open),false,'saving closes the rating panel');
  await page.locator('#grid .cinelva-rate-button').nth(1).click();
  assert.match(await page.locator('#cinelvaRateTitle').innerText(),/Film Two/);
  await page.locator('#cinelvaRateScore').fill('3.2');
  await page.locator('#cinelvaRatePlace').selectOption('配信');
  await page.locator('#cinelvaRateSave').click();
  assert.equal(await page.locator('.cinelva-rate-dialog').evaluate(dialog=>dialog.open),false);
  assert.match(await page.locator('#grid .cinelva-rating-personal').nth(1).innerText(),/3.2/);

  await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
  try{await page.waitForFunction(()=>Boolean(window.CinelvaQuickRate),null,{timeout:15000});}
  catch(error){const diagnostics=await page.evaluate(()=>({url:location.href,readyState:document.readyState,quickRateScript:!!document.querySelector('script[src*="cinelva-quick-rate"]'),records:!!window.CinelvaLibraryRecords,dates:!!document.querySelector('#dates'),scriptTags:[...document.scripts].slice(-8).map(s=>s.src)}));throw new Error('Calendar quick-rate initialization failed: '+JSON.stringify(diagnostics),{cause:error});}
  // Let asynchronous calendar data initialization finish before replacing its
  // visible fixture cards, and lock the resolver to the supplied test records.
  await page.waitForFunction(()=>document.querySelector('#dates')?.children.length>0,{timeout:15000});
  await page.waitForFunction(()=>Boolean(window.CinelvaStreamingPosterAudit));
  await page.evaluate(()=>{
   const fixtures=[{id:101,title:'Film One',event:'streaming',date:'2026-10-18'},
                   {id:102,title:'Film Two',event:'tv',date:'2026-10-18'}];
   window.CinelvaRatingResolve=index=>fixtures[Number(index)];
   document.querySelector('#dates').innerHTML=
     '<section class="streamingWeekBlock"><article class="streamMovie" data-mi="0">Film One</article>'+
     '<article class="tvMovie" data-mi="1">Film Two</article></section>';
  });
  await page.locator('#dates .cinelva-rate-button').first().waitFor({timeout:10000});
  assert.match(await page.locator('#dates .cinelva-rating-personal').first().innerText(),/4.5/);
  assert.match(await page.locator('#dates .cinelva-rating-personal').nth(1).innerText(),/3.2/);
  await page.locator('#dates .cinelva-rate-button').first().click();
  assert.match(await page.locator('#cinelvaRateTitle').innerText(),/Film One/);
  assert.equal(await page.locator('#cinelvaRateComment').inputValue(),'ランキングから記録');
  await page.locator('#cinelvaRateClose').click();
  await page.waitForFunction(()=>!document.querySelector('.cinelva-rate-dialog')?.open);
  await page.locator('#dates .cinelva-rate-button').nth(1).click();
  assert.match(await page.locator('#cinelvaRateTitle').innerText(),/Film Two/);
  assert.equal(await page.locator('#cinelvaRatePlace').inputValue(),'配信');
  const records=await page.evaluate(()=>window.CinelvaLibraryRecords.all());
  assert.equal(records.length,2);
  console.log((process.env.CINELVA_BROWSER||'chromium')+' existing ranking/calendar score badges and close-to-list rating actions passed');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
