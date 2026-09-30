import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base='http://127.0.0.1:4173/preview/ocean/real-fish/ecosystem.html?state=100';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
await context.addInitScript(()=>{
  const records={};
  for(let i=0;i<100;i++)records[String(i)]={watched:true,rating:4,genres:['ドラマ'],region:'日本'};
  localStorage.setItem('cinemap-ocean-demo-records-v1',JSON.stringify(records));
});
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
  await page.waitForFunction(()=>window.CinemapOceanPhotoFourPoints&&window.__OCEAN_PHOTO__?.CREATURES?.length>0);
  await page.waitForFunction(()=>document.querySelectorAll('.fishWrap,.seabedCreature').length===100);
  await page.waitForFunction(()=>document.querySelector('#oceanBackdrop')?.complete&&document.querySelector('#oceanBackdrop')?.naturalWidth>0);
  await page.waitForTimeout(300);
  const result=await page.evaluate(()=>{
    const stage=document.querySelector('#stage');
    const hud=document.querySelector('.hud');
    const backdrop=document.querySelector('#oceanBackdrop');
    const fish=[...document.querySelectorAll('.fishWrap')];
    const creatures=[...document.querySelectorAll('.fishWrap,.seabedCreature')];
    const commemorative=[...document.querySelectorAll('[data-commemorative]')];
    const depth=new Set(fish.map(el=>el.dataset.depth));
    const images=[...document.images].map(img=>({src:img.getAttribute('src')||'',currentSrc:img.currentSrc,complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,className:img.className}));
    const stageRect=stage.getBoundingClientRect();
    const hudRect=hud.getBoundingClientRect();
    const backdropRect=backdrop.getBoundingClientRect();
    const backdropStyle=getComputedStyle(backdrop);
    const canvas=document.createElement('canvas');canvas.width=12;canvas.height=12;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(backdrop,0,0,12,12);
    const px=ctx.getImageData(0,0,12,12).data,lum=[];
    for(let i=0;i<px.length;i+=4)lum.push(.2126*px[i]+.7152*px[i+1]+.0722*px[i+2]);
    const mean=lum.reduce((a,b)=>a+b,0)/lum.length;
    const variance=lum.reduce((a,b)=>a+(b-mean)**2,0)/lum.length;
    return {
      overflow:document.documentElement.scrollWidth>window.innerWidth+1,
      fishCount:fish.length,creatureCount:creatures.length,commemorativeCount:commemorative.length,
      depths:[...depth],
      hudBelowOcean:hudRect.top>=stageRect.bottom-1,
      backdrop:{src:backdrop.getAttribute('src')||'',complete:backdrop.complete,naturalWidth:backdrop.naturalWidth,naturalHeight:backdrop.naturalHeight,width:backdropRect.width,height:backdropRect.height,objectFit:backdropStyle.objectFit,luminanceStdDev:Math.sqrt(variance)},
      stageWidth:stageRect.width,stageHeight:stageRect.height,
      fallback:document.querySelector('#oceanFallback')?.hidden===false,
      failedImages:images.filter(img=>img.complete&&img.naturalWidth===0)
    };
  });
  await mkdir('artifacts/mobile-smoke',{recursive:true});
  await page.screenshot({path:'artifacts/mobile-smoke/ocean-ecosystem.png',fullPage:true});
  await writeFile('artifacts/mobile-smoke/ocean-diagnostics.json',JSON.stringify({result,errors,requestFailures,badResponses},null,2));
  const failures=[];
  if(result.overflow)failures.push('iPhone horizontal overflow');
  if(result.fallback)failures.push('Ocean fell back instead of rendering');
  if(result.creatureCount!==100)failures.push(`100 watched films must render 100 creatures, got ${result.creatureCount}`);
  if(result.commemorativeCount!==1)failures.push(`100 watched films must include exactly one commemorative creature, got ${result.commemorativeCount}`);
  if(!result.hudBelowOcean)failures.push('message/HUD overlaps the ocean instead of sitting below it');
  if(!result.backdrop.src.endsWith('ocean-background-approved-hires.png'))failures.push(`high-resolution approved backdrop is not active (${result.backdrop.src})`);
  if(!result.backdrop.complete||result.backdrop.naturalWidth<1000||result.backdrop.naturalHeight<1000)failures.push(`high-resolution backdrop did not decode at sufficient resolution (${result.backdrop.naturalWidth}x${result.backdrop.naturalHeight})`);
  if(Math.abs(result.backdrop.width-result.stageWidth)>1||Math.abs(result.backdrop.height-result.stageHeight)>1)failures.push(`approved backdrop does not fill stage (${result.backdrop.width}x${result.backdrop.height} vs ${result.stageWidth}x${result.stageHeight})`);
  if(result.backdrop.objectFit!=='cover')failures.push(`approved backdrop should preserve aspect ratio with cover (${result.backdrop.objectFit})`);
  if(result.backdrop.luminanceStdDev<12)failures.push(`approved backdrop lacks visible scene variation (${result.backdrop.luminanceStdDev.toFixed(1)})`);
  if(result.stageWidth>390||result.stageWidth<330)failures.push(`unexpected stage width ${result.stageWidth}`);
  if(result.stageHeight<430)failures.push(`stage too shallow ${result.stageHeight}`);
  if(result.failedImages.length)failures.push(`failed images: ${result.failedImages.map(x=>x.src).join(',')}`);
  if(requestFailures.length)failures.push(`request failures: ${requestFailures.map(x=>x.url).join(',')}`);
  if(badResponses.length)failures.push(`bad responses: ${badResponses.map(x=>`${x.status}:${x.url}`).join(',')}`);
  failures.push(...errors);
  if(failures.length)throw new Error(`${failures.join('; ')} | metrics=${JSON.stringify(result)}`);
  console.log(`Ocean iPhone visual gate passed: ${result.creatureCount} creatures, ${result.commemorativeCount} commemorative, HUD below ocean, high-res backdrop ${result.backdrop.naturalWidth}x${result.backdrop.naturalHeight}.`);
}finally{await browser.close();}
