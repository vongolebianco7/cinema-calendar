import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const scenarios=(process.env.OCEAN_VISUAL_SCENARIOS||'1000')
  .split(',')
  .map(value=>Number(value.trim()))
  .filter(value=>Number.isFinite(value)&&value>0);

if(!scenarios.length)throw new Error('No Ocean observation scenarios were provided.');

const browser=await chromium.launch();
await mkdir('artifacts/mobile-smoke',{recursive:true});

async function waitForLogicalPopulation(page,count){
  await page.waitForFunction(expected=>{
    const dom=document.querySelectorAll('.fishWrap,.seabedCreature').length;
    const perf=window.CinemapOceanPerformanceRenderer?.metrics?.();
    return dom===expected||perf?.totalCount===expected;
  },count,{timeout:12000});
}

async function waitForMilestoneVisuals(page,count){
  await page.waitForFunction(expected=>{
    const rewards=window.CinemapOceanMilestoneRewards?.rewardsForCount?.(expected)||[];
    const mounted=document.querySelectorAll('[data-commemorative]').length;
    const atlasContainers=document.querySelectorAll('.milestoneAtlasCreature').length;
    const images=[...document.querySelectorAll('.milestoneAtlasCreature img')];
    const vectors=document.querySelectorAll('.milestoneVectorCreature svg').length;
    const rasterReady=images.every(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0);
    return mounted===rewards.length&&atlasContainers+vectors===rewards.length&&rasterReady;
  },count,{timeout:12000});
}

async function observe(count){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
  const page=await context.newPage();
  const errors=[],requestFailures=[],badResponses=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('requestfailed',request=>requestFailures.push({url:request.url(),failure:request.failure()?.errorText||'unknown'}));
  page.on('response',response=>{if(response.status()>=400)badResponses.push({url:response.url(),status:response.status()})});

  try{
    const response=await page.goto(`http://127.0.0.1:4173/preview/ocean/real-fish/ecosystem.html?preview=${count}`,{waitUntil:'domcontentloaded'});
    if(!response||response.status()>=400)throw new Error(`Ocean ${count} observation HTTP ${response?.status()}`);

    await page.waitForFunction(()=>window.CinemapOceanPhotoFourPoints&&window.__OCEAN_PHOTO__?.CREATURES?.length>0,{timeout:12000});
    await waitForLogicalPopulation(page,count);
    await waitForMilestoneVisuals(page,count);
    if(count>=300)await page.waitForFunction(()=>window.CinemapOceanPerformanceRenderer?.metrics?.().active===true,{timeout:12000});
    await page.waitForTimeout(500);

    const result=await page.evaluate(()=>{
      const stage=document.querySelector('#stage');
      const hud=document.querySelector('.hud');
      const backdrop=document.querySelector('#oceanBackdrop');
      const creatures=[...document.querySelectorAll('.fishWrap,.seabedCreature')];
      const fish=[...document.querySelectorAll('.fishWrap')];
      const ordinary=fish.filter(el=>!el.dataset.commemorative);
      const perf=window.CinemapOceanPerformanceRenderer?.metrics?.()||{active:false,domCount:creatures.length,canvasCount:0,totalCount:creatures.length};
      const logicalCount=perf.active?perf.totalCount:creatures.length;
      const rewards=window.CinemapOceanMilestoneRewards?.rewardsForCount?.(logicalCount)||[];
      const stageRect=stage?.getBoundingClientRect();
      const hudRect=hud?.getBoundingClientRect();
      const backdropRect=backdrop?.getBoundingClientRect();
      const cells=new Set(creatures.map(el=>`${Math.floor(parseFloat(el.style.left||'0')/10)}:${Math.floor(parseFloat(el.style.top||'0')/10)}`));
      const lowerThirdCount=creatures.filter(el=>parseFloat(el.style.top||'0')>=70).length;
      return {
        logicalCount,
        perf,
        domCreatureCount:creatures.length,
        ordinarySpeciesCount:new Set(ordinary.map(el=>el.dataset.creatureId).filter(Boolean)).size,
        ordinaryAssetCount:new Set(ordinary.map(el=>el.querySelector(':scope > img')?.getAttribute('src')).filter(Boolean)).size,
        milestoneExpected:rewards.length,
        milestoneMounted:document.querySelectorAll('[data-commemorative]').length,
        occupiedCells:cells.size,
        lowerThirdCount,
        overflow:document.documentElement.scrollWidth>window.innerWidth+1,
        fallback:document.querySelector('#oceanFallback')?.hidden===false,
        hudBelowOcean:Boolean(stageRect&&hudRect&&hudRect.top>=stageRect.bottom-1),
        backdrop:backdrop?{
          src:backdrop.getAttribute('src')||'',
          complete:backdrop.complete,
          naturalWidth:backdrop.naturalWidth,
          naturalHeight:backdrop.naturalHeight,
          width:backdropRect?.width||0,
          height:backdropRect?.height||0,
          objectFit:getComputedStyle(backdrop).objectFit
        }:null
      };
    });

    const frameStats=await page.evaluate(async()=>{
      const stamps=[];
      await new Promise(resolve=>{
        const start=performance.now();
        function step(time){
          stamps.push(time);
          if(time-start>=1200)return resolve();
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
      const gaps=stamps.slice(1).map((time,index)=>time-stamps[index]);
      return {
        frames:stamps.length,
        maxGap:gaps.length?Math.max(...gaps):0,
        avgGap:gaps.length?gaps.reduce((sum,gap)=>sum+gap,0)/gaps.length:0
      };
    });

    const evidence={scenario:count,viewport:'390x844@2x',result,frameStats,errors,requestFailures,badResponses,policy:'observational-no-new-performance-threshold'};
    await page.screenshot({path:`artifacts/mobile-smoke/ocean-observation-${count}.png`,fullPage:true});
    await writeFile(`artifacts/mobile-smoke/ocean-observation-${count}.json`,JSON.stringify(evidence,null,2));

    const integrityFailures=[];
    if(result.logicalCount!==count)integrityFailures.push(`expected ${count} logical creatures, got ${result.logicalCount}`);
    if(result.fallback)integrityFailures.push('Ocean fell back instead of rendering');
    if(result.overflow)integrityFailures.push('iPhone horizontal overflow');
    if(result.milestoneMounted!==result.milestoneExpected)integrityFailures.push(`expected ${result.milestoneExpected} milestone creatures, got ${result.milestoneMounted}`);
    if(!result.hudBelowOcean)integrityFailures.push('message/HUD overlaps the ocean');
    if(requestFailures.length)integrityFailures.push(`request failures: ${requestFailures.map(item=>item.url).join(',')}`);
    if(badResponses.length)integrityFailures.push(`bad responses: ${badResponses.map(item=>`${item.status}:${item.url}`).join(',')}`);
    integrityFailures.push(...errors);
    if(integrityFailures.length)throw new Error(`${integrityFailures.join('; ')} | evidence=${JSON.stringify(evidence)}`);

    console.log(`Ocean observation ${count}: logical=${result.logicalCount}, DOM=${result.perf.domCount}, canvas=${result.perf.canvasCount}, milestones=${result.milestoneMounted}, frames=${frameStats.frames}.`);
  }finally{
    await context.close();
  }
}

try{
  for(const scenario of scenarios)await observe(scenario);
}finally{
  await browser.close();
}
