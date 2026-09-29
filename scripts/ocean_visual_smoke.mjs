import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base='http://127.0.0.1:4173/preview/ocean/real-fish/ecosystem.html?state=100';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[];
const requestFailures=[];
const badResponses=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('requestfailed',req=>requestFailures.push({url:req.url(),failure:req.failure()?.errorText||'unknown'}));
page.on('response',res=>{if(res.status()>=400)badResponses.push({url:res.url(),status:res.status()})});
try{
  const response=await page.goto(base,{waitUntil:'networkidle'});
  if(!response||response.status()>=400)throw new Error(`Ocean visual HTTP ${response?.status()}`);
  await page.waitForFunction(()=>window.__OCEAN_PHOTO__?.CREATURES?.length>0);
  await page.waitForTimeout(500);
  const result=await page.evaluate(()=>{
    const stage=document.querySelector('#stage');
    const fish=[...document.querySelectorAll('.fishWrap')];
    const depth=new Set(fish.map(el=>el.dataset.depth));
    const background=getComputedStyle(stage).backgroundImage;
    const images=[...document.images].map(img=>({src:img.getAttribute('src')||'',currentSrc:img.currentSrc,complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,className:img.className}));
    return {
      overflow:document.documentElement.scrollWidth>window.innerWidth+1,
      fishCount:fish.length,
      depths:[...depth],
      background,
      stageWidth:stage.getBoundingClientRect().width,
      stageHeight:stage.getBoundingClientRect().height,
      fallback:document.querySelector('#oceanFallback')?.hidden===false,
      failedImages:images.filter(img=>img.complete&&img.naturalWidth===0),
      images
    };
  });
  await mkdir('artifacts/mobile-smoke',{recursive:true});
  await page.screenshot({path:'artifacts/mobile-smoke/ocean-ecosystem.png',fullPage:true});
  await writeFile('artifacts/mobile-smoke/ocean-diagnostics.json',JSON.stringify({result,errors,requestFailures,badResponses},null,2));
  const failures=[];
  if(result.overflow)failures.push('iPhone horizontal overflow');
  if(result.fallback)failures.push('Ocean fell back instead of rendering');
  if(result.fishCount<50)failures.push(`expected dense mature ecosystem, got ${result.fishCount} fish`);
  for(const cls of ['near','mid','far'])if(!result.depths.includes(cls))failures.push(`missing depth layer ${cls}`);
  if(!result.background.includes('ocean-background-approved.webp'))failures.push('approved background is not active');
  if(result.stageWidth>390||result.stageWidth<330)failures.push(`unexpected stage width ${result.stageWidth}`);
  if(result.stageHeight<430)failures.push(`stage too shallow ${result.stageHeight}`);
  if(result.failedImages.length)failures.push(`failed images: ${result.failedImages.map(x=>x.src).join(',')}`);
  if(requestFailures.length)failures.push(`request failures: ${requestFailures.map(x=>x.url).join(',')}`);
  if(badResponses.length)failures.push(`bad responses: ${badResponses.map(x=>`${x.status}:${x.url}`).join(',')}`);
  failures.push(...errors);
  if(failures.length)throw new Error(`${failures.join('; ')} | metrics=${JSON.stringify({fishCount:result.fishCount,depths:result.depths,fallback:result.fallback,failedImages:result.failedImages.length,requestFailures:requestFailures.length,badResponses:badResponses.length})}`);
  console.log(`Ocean iPhone visual gate passed: ${result.fishCount} fish, depths ${result.depths.join('/')}.`);
}finally{await browser.close();}
