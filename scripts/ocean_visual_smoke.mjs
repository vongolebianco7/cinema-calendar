import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const browser=await chromium.launch();
await mkdir('artifacts/mobile-smoke',{recursive:true});

async function runScenario(count){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
  await context.addInitScript((recordCount)=>{
    const records={};
    for(let i=0;i<recordCount;i++)records[String(i)]={watched:true,rating:4,genres:['ドラマ'],region:'日本'};
    localStorage.setItem('cinemap-ocean-demo-records-v1',JSON.stringify(records));
  },count);
  const page=await context.newPage();
  const errors=[],requestFailures=[],badResponses=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',req=>requestFailures.push({url:req.url(),failure:req.failure()?.errorText||'unknown'}));
  page.on('response',res=>{if(res.status()>=400)badResponses.push({url:res.url(),status:res.status()})});
  try{
    const response=await page.goto(`http://127.0.0.1:4173/preview/ocean/real-fish/ecosystem.html?state=${count}`,{waitUntil:'networkidle'});
    if(!response||response.status()>=400)throw new Error(`Ocean ${count} visual HTTP ${response?.status()}`);
    await page.waitForFunction(()=>window.CinemapOceanPhotoFourPoints&&window.__OCEAN_PHOTO__?.CREATURES?.length>0);
    await page.waitForFunction(expected=>document.querySelectorAll('.fishWrap,.seabedCreature').length===expected,count);
    await page.waitForFunction(()=>document.querySelector('#oceanBackdrop')?.complete&&document.querySelector('#oceanBackdrop')?.naturalWidth>0);
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
    await page.waitForTimeout(120);
    const result=await page.evaluate(()=>{
      const stage=document.querySelector('#stage'),hud=document.querySelector('.hud'),backdrop=document.querySelector('#oceanBackdrop');
      const fish=[...document.querySelectorAll('.fishWrap')],creatures=[...document.querySelectorAll('.fishWrap,.seabedCreature')];
      const commemorative=[...document.querySelectorAll('[data-commemorative]')];
      const solitary=creatures.filter(el=>el.dataset.oceanSchool==='-1');
      const depths=new Set(fish.map(el=>el.dataset.depth));
      const images=[...document.images].map(img=>({src:img.getAttribute('src')||'',complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}));
      const stageRect=stage.getBoundingClientRect(),hudRect=hud.getBoundingClientRect(),backdropRect=backdrop.getBoundingClientRect(),backdropStyle=getComputedStyle(backdrop);
      const visible=creatures.filter(el=>{
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>.45&&r.width>2&&r.height>2&&r.right>stageRect.left&&r.left<stageRect.right&&r.bottom>stageRect.top&&r.top<stageRect.bottom;
      });
      const cells=new Set(creatures.map(el=>`${Math.floor(parseFloat(el.style.left||'0')/10)}:${Math.floor(parseFloat(el.style.top||'0')/10)}`));
      const canvas=document.createElement('canvas');canvas.width=12;canvas.height=12;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(backdrop,0,0,12,12);
      const px=ctx.getImageData(0,0,12,12).data,lum=[];for(let i=0;i<px.length;i+=4)lum.push(.2126*px[i]+.7152*px[i+1]+.0722*px[i+2]);
      const mean=lum.reduce((a,b)=>a+b,0)/lum.length,variance=lum.reduce((a,b)=>a+(b-mean)**2,0)/lum.length;
      return{overflow:document.documentElement.scrollWidth>window.innerWidth+1,fishCount:fish.length,creatureCount:creatures.length,visibleCreatureCount:visible.length,solitaryCount:solitary.length,commemorativeCount:commemorative.length,occupiedCells:cells.size,depths:[...depths],hudBelowOcean:hudRect.top>=stageRect.bottom-1,backdrop:{src:backdrop.getAttribute('src')||'',complete:backdrop.complete,naturalWidth:backdrop.naturalWidth,naturalHeight:backdrop.naturalHeight,width:backdropRect.width,height:backdropRect.height,objectFit:backdropStyle.objectFit,luminanceStdDev:Math.sqrt(variance)},stageWidth:stageRect.width,stageHeight:stageRect.height,fallback:document.querySelector('#oceanFallback')?.hidden===false,failedImages:images.filter(img=>img.complete&&img.naturalWidth===0)};
    });
    await page.screenshot({path:`artifacts/mobile-smoke/ocean-ecosystem-${count}.png`,fullPage:true});
    await writeFile(`artifacts/mobile-smoke/ocean-diagnostics-${count}.json`,JSON.stringify({result,errors,requestFailures,badResponses},null,2));
    const failures=[];
    if(result.overflow)failures.push('iPhone horizontal overflow');
    if(result.fallback)failures.push('Ocean fell back instead of rendering');
    if(result.creatureCount!==count)failures.push(`${count} watched films must render ${count} creatures, got ${result.creatureCount}`);
    if(result.commemorativeCount!==Math.floor(count/100))failures.push(`${count} films must include ${Math.floor(count/100)} commemorative creatures, got ${result.commemorativeCount}`);
    if(count===500){
      if(result.visibleCreatureCount<425)failures.push(`500-preview must visibly show at least 425 creatures on iPhone, got ${result.visibleCreatureCount}`);
      if(result.solitaryCount<25||result.solitaryCount>50)failures.push(`500-preview solitary creatures must be 25-50, got ${result.solitaryCount}`);
      if(result.occupiedCells>55)failures.push(`500-preview must preserve open-water zones, occupied cells=${result.occupiedCells}`);
    }
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
    console.log(`Ocean iPhone visual gate ${count}: ${result.visibleCreatureCount}/${result.creatureCount} visible, ${result.solitaryCount} solitary, ${result.commemorativeCount} commemorative.`);
  }finally{await context.close()}
}

try{await runScenario(100);await runScenario(500);}finally{await browser.close();}
