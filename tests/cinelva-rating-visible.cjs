const { chromium } = require('playwright');
(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  for (const width of [375,390,768]) {
   const page=await browser.newPage({viewport:{width,height:844}});
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>Boolean(window.CinelvaQuickRate?.mountInline),null,{timeout:20000});
   const result=await page.evaluate(()=>{
    const host=document.createElement('div');
    host.style.cssText='width:190px;max-width:190px;background:#282c36;color:white;position:relative;z-index:999999;padding:0';
    document.body.prepend(host);
    const ok=window.CinelvaQuickRate.mountInline(host,{id:550,title:'Rating fixture',vote_average:7.2,vote_count:100});
    const pair=host.querySelector('.cinelva-rating-pair');
    const lines=[...host.querySelectorAll('.cinelva-rating-line')];
    const box=pair?.getBoundingClientRect();
    return {ok,text:lines.map(x=>x.textContent),display:pair&&getComputedStyle(pair).display,box:{width:box?.width,height:box?.height},visible:lines.map(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(x).visibility==='visible';}),actions:host.querySelectorAll('.cinelva-rating-actions button').length};
   });
   console.log(width,JSON.stringify(result));
   if(!result.ok||result.visible.length!==2||result.visible.some(x=>!x)||!result.text[0].includes('あなたの評価')||!result.text[1].includes('みんなの評価')||result.actions!==2)throw Error('rating visibility failed '+width);
   // Real search results use the same production card renderer, not just a synthetic mount.
   await page.route('**/api/movies?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({movies:[],external:[]})}));
   await page.route('**/data/movies.json*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({movies:[{id:111,title:'スター・ウォーズ',year:1977,vote_average:7.2,vote_count:100}]})}));
   await page.goto('http://127.0.0.1:8765/search.html?search='+encodeURIComponent('スターウォーズ'),{waitUntil:'domcontentloaded'});
   await page.locator('#grid .cinelva-rating-pair').first().waitFor({state:'visible',timeout:15000});
   const live=await page.locator('#grid .cinelva-rating-pair').first().evaluate(el=>({text:el.innerText,lines:[...el.querySelectorAll('.cinelva-rating-line')].map(x=>{const b=x.getBoundingClientRect();return {text:x.textContent,width:b.width,height:b.height,display:getComputedStyle(x).display};})}));
   console.log('search card',width,JSON.stringify(live));
   if(!live.text.includes('あなたの評価')||!live.text.includes('みんなの評価')||live.lines.length!==2||live.lines.some(x=>x.width<=0||x.height<=0||x.display==='none'))throw Error('real search card ratings hidden '+width);
   await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
