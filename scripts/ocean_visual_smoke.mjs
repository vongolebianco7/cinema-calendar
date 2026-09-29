import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base='http://127.0.0.1:4173/preview/ocean/real-fish/ecosystem.html?state=100';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
  const response=await page.goto(base,{waitUntil:'networkidle'});
  if(!response||response.status()>=400)throw new Error(`Ocean visual HTTP ${response?.status()}`);
  await page.waitForFunction(()=>window.__OCEAN_PHOTO__?.CREATURES?.length>0);
  const result=await page.evaluate(()=>{
    const stage=document.querySelector('#stage');
    const fish=[...document.querySelectorAll('.fishWrap')];
    const depth=new Set(fish.map(el=>el.dataset.depth));
    const background=getComputedStyle(stage).backgroundImage;
    return {
      overflow:document.documentElement.scrollWidth>window.innerWidth+1,
      fishCount:fish.length,
      depths:[...depth],
      background,
      stageWidth:stage.getBoundingClientRect().width,
      stageHeight:stage.getBoundingClientRect().height,
      fallback:document.querySelector('#oceanFallback')?.hidden===false
    };
  });
  await mkdir('artifacts/mobile-smoke',{recursive:true});
  await page.screenshot({path:'artifacts/mobile-smoke/ocean-ecosystem.png',fullPage:true});
  const failures=[];
  if(result.overflow)failures.push('iPhone horizontal overflow');
  if(result.fallback)failures.push('Ocean fell back instead of rendering');
  if(result.fishCount<50)failures.push(`expected dense mature ecosystem, got ${result.fishCount} fish`);
  for(const cls of ['near','mid','far'])if(!result.depths.includes(cls))failures.push(`missing depth layer ${cls}`);
  if(!result.background.includes('ocean-background-approved.webp'))failures.push('approved background is not active');
  if(result.stageWidth>390||result.stageWidth<330)failures.push(`unexpected stage width ${result.stageWidth}`);
  if(result.stageHeight<430)failures.push(`stage too shallow ${result.stageHeight}`);
  failures.push(...errors);
  if(failures.length)throw new Error(`${failures.join('; ')} | metrics=${JSON.stringify(result)}`);
  console.log(`Ocean iPhone visual gate passed: ${result.fishCount} fish, depths ${result.depths.join('/')}.`);
}finally{await browser.close();}
