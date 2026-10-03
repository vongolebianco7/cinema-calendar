import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const page=await context.newPage();
await mkdir('artifacts/mobile-smoke',{recursive:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
  await page.goto('http://127.0.0.1:4173/preview/ocean/real-fish/manta-rig-preview.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#riggedManta')?.dataset.ready==='1',{timeout:15000});
  if(errors.length)throw new Error(errors.join('; '));
  for(let i=0;i<4;i++){
    await page.screenshot({path:`artifacts/mobile-smoke/manta-rig-${i}.png`,fullPage:true});
    await page.waitForTimeout(850);
  }
  const status=await page.locator('#rigStatus').textContent();
  if(!status?.includes('live'))throw new Error(`rig status not live: ${status}`);
}finally{
  await context.close();
  await browser.close();
}
