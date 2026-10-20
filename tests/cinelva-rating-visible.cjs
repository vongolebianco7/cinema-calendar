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
   if(!result.ok||result.visible.length!==2||result.visible.some(x=>!x)||!result.text[0].includes('MY評価')||!result.text[1].includes('TMDB評価')||result.actions!==2)throw Error('rating visibility failed '+width);
   // Real search results use the same production card renderer, not just a synthetic mount.
   await page.route('**/api/movies?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({movies:[],external:[]})}));
   await page.route('**/data/movies.json*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({movies:[{id:111,title:'スター・ウォーズ',year:1977,vote_average:7.2,vote_count:100}]})}));
   await page.goto('http://127.0.0.1:8765/search.html?search='+encodeURIComponent('スターウォーズ'),{waitUntil:'domcontentloaded'});
   await page.locator('#grid .cinelva-rating-pair').first().waitFor({state:'visible',timeout:15000});
   const live=await page.locator('#grid .cinelva-rating-pair').first().evaluate(el=>({text:el.innerText,lines:[...el.querySelectorAll('.cinelva-rating-line')].map(x=>{const b=x.getBoundingClientRect();return {text:x.textContent,width:b.width,height:b.height,display:getComputedStyle(x).display};})}));
   console.log('search card',width,JSON.stringify(live));
   if(!live.text.includes('MY評価')||!live.text.includes('TMDB評価')||live.lines.length!==2||live.lines.some(x=>x.width<=0||x.height<=0||x.display==='none'))throw Error('real search card ratings hidden '+width);
   // The production calendar has its own fixed-height legacy CSS; verify no clipping.
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{
     const grid=document.querySelector('#cards');
     if(!grid)throw Error('calendar grid missing');
     window.CinelvaRatingResolve=()=>({id:111,title:'Calendar fixture',vote_average:7.2,vote_count:100});
     const card=document.createElement('a');card.className='card';card.dataset.i='0';card.href='#';card.textContent='Calendar fixture';
     grid.append(card);
   });
   await page.locator('#cards .cinelva-rating-controls-no-gauge').first().waitFor({state:'visible',timeout:20000});
   const calendar=await page.locator('#cards .cinelva-rating-controls-no-gauge').first().evaluate(el=>{
     const outer=el.getBoundingClientRect(),pair=el.querySelector('.cinelva-rating-pair'),actions=el.querySelector('.cinelva-rating-actions');
     const a=pair?.getBoundingClientRect(),b=actions?.getBoundingClientRect();
     return {height:outer.height,maxHeight:getComputedStyle(el).maxHeight,text:pair?.innerText,pairHeight:a?.height,actionsHeight:b?.height,clipped:!a||!b||a.top<outer.top-1||b.bottom>outer.bottom+1};
   });
   console.log('calendar card',width,JSON.stringify(calendar));
   if(calendar.clipped||calendar.height<55||!calendar.text?.includes('MY評価')||!calendar.text?.includes('TMDB評価'))throw Error('calendar rating clipped '+width);
   await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
