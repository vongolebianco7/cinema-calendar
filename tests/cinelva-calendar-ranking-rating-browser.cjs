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
  await page.evaluate(()=>{
   document.querySelector('#grid').innerHTML=
    '<a class="rankCard" href="search.html?id=101&search=Film%20One"><span class="title">Film One</span></a>'+
    '<a class="rankCard" href="search.html?id=102&search=Film%20Two"><span class="title">Film Two</span></a>';
  });
  await page.locator('#grid .cinelva-rate-button').first().waitFor({timeout:10000});
  await page.locator('#grid .cinelva-rate-button').first().click();
  await page.locator('#cinelvaRateScore').evaluate(el=>{el.value='4.5';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#cinelvaRateComment').fill('ランキングから記録');
  await page.locator('#cinelvaRateSave').click();
  await page.locator('#grid .cinelva-rate-button').first().getByText('4.5点').waitFor();
  await page.locator('#cinelvaRateNext').click();
  assert.match(await page.locator('#cinelvaRateTitle').innerText(),/Film Two/);
  await page.locator('#cinelvaRatePlace').selectOption('配信');
  await page.locator('#cinelvaRateSave').click();
  assert.equal(await page.locator('#grid .cinelva-rate-button').nth(1).innerText(),'★ 0.0点 · 評価済み');

  await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.CinelvaQuickRate));
  await page.evaluate(()=>{
   movies=[{id:101,title:'Film One',event:'streaming',date:'2026-10-18'},
           {id:102,title:'Film Two',event:'tv',date:'2026-10-18'}];
   document.querySelector('#dates').innerHTML=
     '<section class="streamingWeekBlock"><article class="streamMovie" data-mi="0">Film One</article>'+
     '<article class="tvMovie" data-mi="1">Film Two</article></section>';
  });
  await page.locator('#dates .cinelva-rate-button').first().waitFor({timeout:10000});
  assert.equal(await page.locator('#dates .cinelva-rate-button').first().innerText(),'★ 4.5点 · 評価済み');
  assert.equal(await page.locator('#dates .cinelva-rate-button').nth(1).innerText(),'★ 0.0点 · 評価済み');
  await page.locator('#dates .cinelva-rate-button').first().click();
  assert.match(await page.locator('#cinelvaRateTitle').innerText(),/Film One/);
  assert.equal(await page.locator('#cinelvaRateComment').inputValue(),'ランキングから記録');
  await page.locator('#cinelvaRateNext').click();
  assert.match(await page.locator('#cinelvaRateTitle').innerText(),/Film Two/);
  assert.equal(await page.locator('#cinelvaRatePlace').inputValue(),'配信');
  const records=await page.evaluate(()=>window.CinelvaLibraryRecords.all());
  assert.equal(records.length,2);
  console.log((process.env.CINELVA_BROWSER||'chromium')+' existing ranking/calendar score badges and next-film actions passed');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
