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
  await page.waitForFunction(()=>document.querySelector('#oceanBackdrop')?.complete&&document.querySelector('#oceanBackdrop')?.naturalWidth>0);
  await page.waitForTimeout(500);
  const result=await page.evaluate(()=>{
    const stage=document.querySelector('#stage');
    const backdrop=document.querySelector('#oceanBackdrop');
    const fish=[...document.querySelectorAll('.fishWrap')];
    const depth=new Set(fish.map(el=>el.dataset.depth));
    const images=[...document.images].map(img=>({src:img.getAttribute('src')||'',currentSrc:img.currentSrc,complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,className:img.className}));
    const stageRect=stage.getBoundingClientRect();
    const backdropRect=backdrop.getBoundingClientRect();
    const backdropStyle=getComputedStyle(backdrop);
    const canvas=document.createElement('canvas');
    canvas.width=12;canvas.height=12;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(backdrop,0,0,12,12);
    const px=ctx.getImageData(0,0,12,12).data;
    const lum=[];
    for(let i=0;i<px.length;i+=4)lum.push(.2126*px[i]+.7152*px[i+1]+.0722*px[i+2]);
    const mean=lum.reduce((a,b)=>a+b,0)/lum.length;
    const variance=lum.reduce((a,b)=>a+(b-mean)**2,0)/lum.length;
    return {
      overflow:document.documentElement.scrollWidth>window.innerWidth+1,
      fishCount:fish.length,
      depths:[...depth],
      backdrop:{src:backdrop.getAttribute('src')||'',complete:backdrop.complete,naturalWidth:backdrop.naturalWidth,naturalHeight:backdrop.naturalHeight,width:backdropRect.width,height:backdropRect.height,objectFit:backdropStyle.objectFit,luminanceStdDev:Math.sqrt(variance)},
      stageWidth:stageRect.width,
      stageHeight:stageRect.height,
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
  if(!result.backdrop.src.endsWith('optimized/ocean-background-approved.webp'))failures.push(`approved backdrop is not active (${result.backdrop.src})`);
  if(!result.backdrop.complete||result.backdrop.naturalWidth<100||result.backdrop.naturalHeight<100)failures.push('approved backdrop did not decode');
  if(Math.abs(result.backdrop.width-result.stageWidth)>1||Math.abs(result.backdrop.height-result.stageHeight)>1)failures.push(`approved backdrop does not fill stage (${result.backdrop.width}x${result.backdrop.height} vs ${result.stageWidth}x${result.stageHeight})`);
  if(result.backdrop.objectFit!=='fill')failures.push(`approved backdrop object-fit changed (${result.backdrop.objectFit})`);
  if(result.backdrop.luminanceStdDev<12)failures.push(`approved backdrop lacks visible scene variation (${result.backdrop.luminanceStdDev.toFixed(1)})`);
  if(result.stageWidth>390||result.stageWidth<330)failures.push(`unexpected stage width ${result.stageWidth}`);
  if(result.stageHeight<430)failures.push(`stage too shallow ${result.stageHeight}`);
  if(result.failedImages.length)failures.push(`failed images: ${result.failedImages.map(x=>x.src).join(',')}`);
  if(requestFailures.length)failures.push(`request failures: ${requestFailures.map(x=>x.url).join(',')}`);
  if(badResponses.length)failures.push(`bad responses: ${badResponses.map(x=>`${x.status}:${x.url}`).join(',')}`);
  failures.push(...errors);
  if(failures.length)throw new Error(`${failures.join('; ')} | metrics=${JSON.stringify({fishCount:result.fishCount,depths:result.depths,fallback:result.fallback,backdrop:result.backdrop,failedImages:result.failedImages.length,requestFailures:requestFailures.length,badResponses:badResponses.length})}`);
  console.log(`Ocean iPhone visual gate passed: ${result.fishCount} fish, depths ${result.depths.join('/')}, backdrop variation ${result.backdrop.luminanceStdDev.toFixed(1)}.`);
}finally{await browser.close();}
