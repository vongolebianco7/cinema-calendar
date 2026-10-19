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
   await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
