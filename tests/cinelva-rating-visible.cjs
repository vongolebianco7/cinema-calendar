const { chromium } = require('playwright');

function inspectControls(root) {
 const controls=root.querySelector('.cinelva-rating-controls');
 const review=controls?.querySelector('.cinelva-rate-button');
 const score=controls?.querySelector('.cinelva-inline-score input[type="range"]');
 const bookmark=controls?.querySelector('.cinelva-bookmark-button');
 const rect=controls?.getBoundingClientRect();
 return {
  ok:root.dataset.mounted==='true',
  controls:Boolean(controls),
  review:Boolean(review),
  score:Boolean(score),
  bookmark:Boolean(bookmark),
  visible:[review,score,bookmark].map(el=>{
   if(!el)return false;
   const r=el.getBoundingClientRect();
   return r.width>0&&r.height>0&&getComputedStyle(el).visibility==='visible'&&getComputedStyle(el).display!=='none';
  }),
  box:{width:rect?.width,height:rect?.height,scrollWidth:controls?.scrollWidth,clientWidth:controls?.clientWidth}
 };
}

(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  for (const width of [375,390,768]) {
   const page=await browser.newPage({viewport:{width,height:844}});
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>Boolean(window.CinelvaQuickRate?.mountInline),null,{timeout:20000});
   await page.evaluate(()=>{
    const host=document.createElement('div');
    host.id='rating-fixture';
    host.style.cssText='width:190px;max-width:190px;background:#282c36;color:white;position:relative;z-index:999999;padding:0';
    document.body.prepend(host);
    host.dataset.mounted=String(window.CinelvaQuickRate.mountInline(host,{id:550,title:'Rating fixture',vote_average:7.2,vote_count:100}));
   });
   const result=await page.locator('#rating-fixture').evaluate(inspectControls);
   console.log(width,JSON.stringify(result));
   if(!result.ok||!result.controls||!result.review||!result.score||!result.bookmark||result.visible.some(x=>!x)||result.box.scrollWidth>result.box.clientWidth+1)throw Error('shared rating controls are missing or clipped '+width);
   await page.locator('.cinelva-rate-button').first().click();
   if(!await page.locator('.cinelva-rate-dialog[open]').count())throw Error('review action did not open the shared dialog '+width);
   const today=new Date().toLocaleDateString('sv-SE');
   if(await page.locator('#cinelvaRateDate').inputValue()!==today)throw Error('new review did not default its viewing date to today '+width);
   await page.locator('.cinelva-rate-dialog [aria-label="閉じる"]').click();

   await page.route('**/api/movies?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({movies:[],external:[]})}));
   await page.route('**/data/movies.json*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({movies:[{id:111,title:'スター・ウォーズ',year:1977,vote_average:7.2,vote_count:100}]})}));
   await page.goto('http://127.0.0.1:8765/search.html?search='+encodeURIComponent('スターウォーズ'),{waitUntil:'domcontentloaded'});
   const card=page.locator('#grid .card').first();
   await card.locator('.cinelva-rating-controls').waitFor({state:'visible',timeout:15000});
   const live=await card.evaluate(inspectControls);
   console.log('search card',width,JSON.stringify(live));
   if(!live.controls||!live.review||!live.score||!live.bookmark||live.visible.some(x=>!x)||live.box.scrollWidth>live.box.clientWidth+1)throw Error('search result shared controls are missing or clipped '+width);

   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{
     const grid=document.querySelector('#cards');
     if(!grid)throw Error('calendar grid missing');
     window.CinelvaRatingResolve=()=>({id:111,title:'Calendar fixture',vote_average:7.2,vote_count:100});
     const card=document.createElement('a');card.className='card';card.dataset.i='0';card.dataset.ratingFixture='calendar';card.href='#';card.textContent='Calendar fixture';
     grid.append(card);
   });
   const calendarCard=page.locator('#cards .card[data-rating-fixture="calendar"]');
   await calendarCard.locator('.cinelva-rating-controls').waitFor({state:'visible',timeout:20000});
   const calendar=await calendarCard.evaluate(root=>{
     const outer=root.querySelector('.cinelva-rating-controls').getBoundingClientRect();
     const children=[...root.querySelectorAll('.cinelva-rate-button,.cinelva-inline-score,.cinelva-bookmark-button')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}});
     return {height:outer.height,width:outer.width,scrollWidth:root.scrollWidth,clientWidth:root.clientWidth,children,clipped:children.length!==3||children.some(r=>r.width<=0||r.height<=0||r.left<outer.left-1||r.right>outer.right+1||r.top<outer.top-1||r.bottom>outer.bottom+1)};
   });
   console.log('calendar card',width,JSON.stringify(calendar));
   if(calendar.clipped||calendar.scrollWidth>calendar.clientWidth+1)throw Error('calendar shared controls are clipped '+width);
   await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
