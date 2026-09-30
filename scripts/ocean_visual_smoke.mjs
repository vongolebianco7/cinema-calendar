import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const browser=await chromium.launch();
await mkdir('artifacts/mobile-smoke',{recursive:true});

async function waitForLogicalPopulation(page,count){
  await page.waitForFunction(expected=>{
    const dom=document.querySelectorAll('.fishWrap,.seabedCreature').length;
    const perf=window.CinemapOceanPerformanceRenderer?.metrics?.();
    return dom===expected||perf?.totalCount===expected;
  },count);
}

async function runScenario(count){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
  const page=await context.newPage();
  const errors=[],requestFailures=[],badResponses=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',req=>requestFailures.push({url:req.url(),failure:req.failure()?.errorText||'unknown'}));
  page.on('response',res=>{if(res.status()>=400)badResponses.push({url:res.url(),status:res.status()})});
  try{
    const response=await page.goto(`http://127.0.0.1:4173/preview/ocean/real-fish/ecosystem.html?preview=${count}`,{waitUntil:'domcontentloaded'});
    if(!response||response.status()>=400)throw new Error(`Ocean ${count} visual HTTP ${response?.status()}`);
    await page.waitForFunction(()=>window.CinemapOceanPhotoFourPoints&&window.__OCEAN_PHOTO__?.CREATURES?.length>0);
    await waitForLogicalPopulation(page,count);
    await page.waitForFunction(()=>document.querySelector('#oceanBackdrop')?.complete&&document.querySelector('#oceanBackdrop')?.naturalWidth>0);
    if(count>=300)await page.waitForFunction(()=>window.CinemapOceanPerformanceRenderer?.metrics?.().active===true);
    await page.waitForTimeout(350);
    const result=await page.evaluate(()=>{
      const stage=document.querySelector('#stage'),hud=document.querySelector('.hud'),backdrop=document.querySelector('#oceanBackdrop');
      const fish=[...document.querySelectorAll('.fishWrap')],creatures=[...document.querySelectorAll('.fishWrap,.seabedCreature')],commemorative=[...document.querySelectorAll('[data-commemorative]')],solitary=creatures.filter(el=>el.dataset.oceanSchool==='-1');
      const stageRect=stage.getBoundingClientRect(),hudRect=hud.getBoundingClientRect(),backdropRect=backdrop.getBoundingClientRect(),backdropStyle=getComputedStyle(backdrop);
      const visibleDom=creatures.filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>.45&&r.width>2&&r.height>2&&r.right>stageRect.left&&r.left<stageRect.right&&r.bottom>stageRect.top&&r.top<stageRect.bottom;});
      const perf=window.CinemapOceanPerformanceRenderer?.metrics?.()||{active:false,domCount:visibleDom.length,canvasCount:0,totalCount:creatures.length};
      const logicalCount=perf.active?perf.totalCount:creatures.length;
      const expectedMilestones=window.CinemapOceanMilestoneRewards?.rewardsForCount?.(logicalCount)?.length??commemorative.length;
      const cells=new Set(creatures.map(el=>`${Math.floor(parseFloat(el.style.left||'0')/10)}:${Math.floor(parseFloat(el.style.top||'0')/10)}`));
      return{overflow:document.documentElement.scrollWidth>window.innerWidth+1,fishCount:fish.length,creatureCount:logicalCount,domCreatureCount:creatures.length,visibleDomCount:visibleDom.length,visualPopulation:visibleDom.length+perf.canvasCount,solitaryCount:solitary.length,commemorativeCount:commemorative.length,expectedMilestones,occupiedCells:cells.size,perf,hudBelowOcean:hudRect.top>=stageRect.bottom-1,backdrop:{src:backdrop.getAttribute('src')||'',complete:backdrop.complete,naturalWidth:backdrop.naturalWidth,naturalHeight:backdrop.naturalHeight,width:backdropRect.width,height:backdropRect.height,objectFit:backdropStyle.objectFit},stageWidth:stageRect.width,stageHeight:stageRect.height,fallback:document.querySelector('#oceanFallback')?.hidden===false};
    });
    const frameStats=await page.evaluate(async()=>{const stamps=[];await new Promise(resolve=>{const start=performance.now();function step(t){stamps.push(t);if(t-start>=1200)return resolve();requestAnimationFrame(step)}requestAnimationFrame(step)});const gaps=stamps.slice(1).map((t,i)=>t-stamps[i]);return{frames:stamps.length,maxGap:gaps.length?Math.max(...gaps):0,avgGap:gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:0}});
    await page.screenshot({path:`artifacts/mobile-smoke/ocean-ecosystem-${count}.png`,fullPage:true});
    await writeFile(`artifacts/mobile-smoke/ocean-diagnostics-${count}.json`,JSON.stringify({result,frameStats,errors,requestFailures,badResponses},null,2));
    const failures=[];
    if(result.overflow)failures.push('iPhone horizontal overflow');
    if(result.fallback)failures.push('Ocean fell back instead of rendering');
    if(result.creatureCount!==count)failures.push(`${count} films must produce ${count} logical creatures, got ${result.creatureCount}`);
    if(result.commemorativeCount!==result.expectedMilestones)failures.push(`${count} films must render ${result.expectedMilestones} unlocked milestone creatures, got ${result.commemorativeCount}`);
    if(count===500){
      if(!result.perf.active)failures.push('500-preview must activate hybrid renderer');
      if(result.perf.domCount>40)failures.push(`500-preview DOM fish must be <=40, got ${result.perf.domCount}`);
      if(result.perf.canvasCount<450)failures.push(`500-preview canvas population must carry most fish, got ${result.perf.canvasCount}`);
      if(result.visualPopulation<490)failures.push(`500-preview visual population must remain near 500, got ${result.visualPopulation}`);
      if(result.solitaryCount<25||result.solitaryCount>50)failures.push(`500-preview solitary creatures must be 25-50, got ${result.solitaryCount}`);
      if(result.occupiedCells>60)failures.push(`500-preview must preserve open-water zones, occupied cells=${result.occupiedCells}`);
      if(frameStats.frames<20)failures.push(`500-preview animation stalled: ${JSON.stringify(frameStats)}`);
    }
    if(!result.hudBelowOcean)failures.push('message/HUD overlaps the ocean');
    if(!result.backdrop.src.endsWith('ocean-background-approved-hires.png'))failures.push(`high-resolution approved backdrop is not active (${result.backdrop.src})`);
    if(!result.backdrop.complete||result.backdrop.naturalWidth<1000||result.backdrop.naturalHeight<1000)failures.push(`high-resolution backdrop did not decode (${result.backdrop.naturalWidth}x${result.backdrop.naturalHeight})`);
    if(result.backdrop.objectFit!=='cover')failures.push(`approved backdrop should use cover (${result.backdrop.objectFit})`);
    if(requestFailures.length)failures.push(`request failures: ${requestFailures.map(x=>x.url).join(',')}`);
    if(badResponses.length)failures.push(`bad responses: ${badResponses.map(x=>`${x.status}:${x.url}`).join(',')}`);
    failures.push(...errors);
    if(failures.length)throw new Error(`${failures.join('; ')} | metrics=${JSON.stringify({result,frameStats})}`);
    console.log(`Ocean iPhone visual gate ${count}: logical=${result.creatureCount}, DOM=${result.perf.domCount}, canvas=${result.perf.canvasCount}, frames=${frameStats.frames}.`);
  }finally{await context.close()}
}

async function runPreviewOverrideScenario(){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
  const page=await context.newPage();
  try{await page.goto('http://127.0.0.1:4173/preview/ocean/real-fish/ecosystem.html?preview=100',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.CinemapOceanPhotoFourPoints&&window.__OCEAN_PHOTO__?.CREATURES?.length>0);await waitForLogicalPopulation(page,100);await page.click('button[data-state="500"]');await waitForLogicalPopulation(page,500);await page.waitForFunction(()=>window.CinemapOceanPerformanceRenderer?.metrics?.().totalCount===500);const result=await page.evaluate(()=>({count:window.CinemapOceanPerformanceRenderer?.metrics?.().totalCount||document.querySelectorAll('.fishWrap,.seabedCreature').length,previewTarget:window.CinemapOceanPhotoFourPoints.previewTarget,perf:window.CinemapOceanPerformanceRenderer.metrics()}));if(result.count!==500||result.previewTarget!==500||result.perf.totalCount!==500)throw new Error(`500 preview override failed: ${JSON.stringify(result)}`);}finally{await context.close()}
}

try{await runScenario(100);await runScenario(500);await runPreviewOverrideScenario();}finally{await browser.close();}
