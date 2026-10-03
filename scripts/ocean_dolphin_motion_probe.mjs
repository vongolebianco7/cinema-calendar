import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const swimmers={
  'sea-turtle':{profile:'flipper-flex',minDelta:.12,maxCoverage:.78},
  'giant-octopus':{profile:'tentacle-wave',minDelta:.12,maxCoverage:.82},
  'manta-ray':{profile:'wing-flex',minDelta:.20,maxCoverage:.72},
  dolphin:{profile:'tail-flex-right',minDelta:.8,maxCoverage:.58,direction:'reverse'},
  'hammerhead-shark':{profile:'tail-flex-right',minDelta:.15,maxCoverage:.75,direction:'reverse'},
  'large-shark':{profile:'tail-flex-left',minDelta:.15,maxCoverage:.75,direction:'forward'},
  dugong:{profile:'tail-flex-right',minDelta:.3,maxCoverage:.72,direction:'reverse'},
  'minke-whale':{profile:'tail-flex-left',minDelta:.20,maxCoverage:.72},
  orca:{profile:'tail-flex-left',minDelta:.22,maxCoverage:.72},
  'humpback-whale':{profile:'tail-flex-left',minDelta:.20,maxCoverage:.72},
  'whale-shark':{profile:'tail-flex-left',minDelta:.22,maxCoverage:.72},
  'blue-whale':{profile:'tail-flex-left',minDelta:.15,maxCoverage:.72}
};

const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const page=await context.newPage();
await mkdir('artifacts/dolphin-motion',{recursive:true});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(error.message));
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');

try{
  await page.goto('http://127.0.0.1:4173/preview/ocean/real-fish/ecosystem.html?preview=1000',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.CinemapOceanPhotoFourPoints&&window.__OCEAN_PHOTO__?.CREATURES?.length>0);
  await page.waitForFunction(keys=>keys.every(key=>document.querySelector(`[data-milestone-key="${key}"] canvas.milestoneDeformedCanvas`)),Object.keys(swimmers),{timeout:20000});
  await page.evaluate(keys=>{for(const key of keys){const canvas=document.querySelector(`[data-milestone-key="${key}"] canvas.milestoneDeformedCanvas`),inner=canvas?.closest(`[data-milestone-key="${key}"]`),outer=canvas?.closest('[data-commemorative]');if(!outer)continue;outer.style.left='12%';outer.style.top='40%';outer.style.setProperty('--swim-lane-y','0vh');outer.style.setProperty('animation','none','important');outer.style.setProperty('transform','none','important');if(inner){inner.style.setProperty('animation','none','important');inner.style.setProperty('transform','none','important');}}},Object.keys(swimmers));
  await page.waitForFunction(keys=>keys.every(key=>document.querySelector(`[data-milestone-key="${key}"]`)?.dataset.sourceState==='ready'),Object.keys(swimmers),{timeout:20000});
  await page.waitForTimeout(700);

  const diagnostic=await page.evaluate(config=>Object.fromEntries(Object.entries(config).map(([key,cfg])=>{
    const canvas=document.querySelector(`[data-milestone-key="${key}"] canvas.milestoneDeformedCanvas`),inner=canvas?.closest(`[data-milestone-key="${key}"]`),outer=canvas?.closest('[data-commemorative]'),engine=inner?.dataset.deformationEngine==='webgl-mesh'?'webgl':'2d';
    const rect=outer?.getBoundingClientRect();return[key,{dataset:inner?{...inner.dataset}:null,direction:outer?.dataset.swimDirection||null,opacity:outer?getComputedStyle(outer).opacity:null,canvasSize:canvas?{width:canvas.width,height:canvas.height}:null,engine,rect:rect?{width:rect.width,height:rect.height}:null,expectedDirection:cfg.direction||null}];
  })),swimmers);
  console.log('Swimmer preflight:',JSON.stringify({diagnostic,pageErrors}));
  await writeFile('artifacts/dolphin-motion/preflight.json',JSON.stringify({diagnostic,pageErrors},null,2)+'\n');
  if(pageErrors.length)throw new Error(`page errors: ${pageErrors.join('; ')}`);
  await page.screenshot({path:'artifacts/dolphin-motion/frame-a.png'});

  const webglMotion={};
  for(const key of Object.keys(swimmers)){
    const locator=page.locator(`[data-milestone-key="${key}"] canvas.milestoneDeformedCanvas`).first();
    const hashes=[];
    for(let i=0;i<4;i++){hashes.push(hash(await locator.screenshot({animations:'disabled'})));await page.waitForTimeout(220);}
    webglMotion[key]={hashes,changed:new Set(hashes).size>1};
  }

  const metrics=await page.evaluate(async swimmerConfig=>{
    const read2d=canvas=>{const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return null;return ctx.getImageData(0,0,canvas.width,canvas.height).data;};
    const snapshot=()=>Object.fromEntries(Object.entries(swimmerConfig).map(([key,cfg])=>{const canvas=document.querySelector(`[data-milestone-key="${key}"] canvas.milestoneDeformedCanvas`),wrap=canvas?.closest(`[data-milestone-key="${key}"]`);if(!wrap||!canvas)throw new Error(`${key} deformation canvas missing`);const data=read2d(canvas);if(!data)return[key,{webgl:true,ready:wrap.dataset.sourceState==='ready'}];const {width,height}=canvas,total=width*height,alpha=new Uint8Array(total);let opaque=0;for(let p=0;p<total;p++){const a=data[p*4+3];alpha[p]=a;if(a>16)opaque++;}return[key,{alpha,width,height,coverage:opaque/total,ready:wrap.dataset.sourceState==='ready',profile:cfg.profile,webgl:false}];}));
    const base=snapshot(),samples=[base];for(let i=0;i<8;i++){await new Promise(resolve=>setTimeout(resolve,240));samples.push(snapshot());}const output={};
    for(const [key,cfg] of Object.entries(swimmerConfig)){const a=base[key];if(a.webgl){output[key]={webgl:true,ready:samples.every(set=>set[key].ready)};continue;}let movingMax=0,anchorMax=0;for(const sampleSet of samples.slice(1)){const b=sampleSet[key];let movingDiff=0,movingN=0,anchorDiff=0,anchorN=0;for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){const p=y*a.width+x,d=Math.abs(a.alpha[p]-b.alpha[p]);let moving=false,anchor=false;if(cfg.profile==='tail-flex-left'){moving=x<a.width*.42;anchor=x>a.width*.58;}else if(cfg.profile==='tail-flex-right'){moving=x>a.width*(key==='dolphin'?.70:.58);anchor=x<a.width*(key==='dolphin'?.58:.42);}else if(cfg.profile==='flipper-flex'){moving=(x>a.width*.18&&x<a.width*.42)||(x>a.width*.58&&x<a.width*.82);anchor=x>a.width*.45&&x<a.width*.55;}else{moving=x<a.width*.34||x>a.width*.66;anchor=x>a.width*.43&&x<a.width*.57;}if(moving){movingDiff+=d;movingN++;}if(anchor){anchorDiff+=d;anchorN++;}}movingMax=Math.max(movingMax,movingDiff/Math.max(1,movingN));anchorMax=Math.max(anchorMax,anchorDiff/Math.max(1,anchorN));}output[key]={webgl:false,coverage:a.coverage,ready:samples.every(set=>set[key].ready),movingPixelDelta:movingMax,anchorPixelDelta:anchorMax};}return output;
  },swimmers);

  const cadence=await page.evaluate(async()=>{const canvas=document.querySelector('[data-milestone-key="dolphin"] canvas.milestoneDeformedCanvas'),inner=canvas?.closest('[data-milestone-key="dolphin"]'),node=canvas?.closest('[data-commemorative]');if(!node)throw new Error('dolphin commemorative wrapper missing');node.style.removeProperty('animation');node.style.removeProperty('transform');inner?.style.removeProperty('animation');inner?.style.removeProperty('transform');const steps=window.CinemapOceanMilestoneSwim?.PULSE_STEPS||200,routeMs=80000;delete node.dataset.swimActive;await new Promise(r=>setTimeout(r,80));node.dataset.swimActive='1';node.dataset.swimCadence='pulse-glide';node.dataset.swimDirection='forward';node.style.setProperty('--swim-route-duration',`${routeMs/1000}s`);node.style.setProperty('--swim-pulse-duration',`${routeMs/steps/1000}s`);node.style.setProperty('--swim-delay','0s');node.style.setProperty('--swim-lane-y','0vh');await new Promise(r=>setTimeout(r,80));const animation=node.getAnimations().find(a=>a.animationName==='milestoneForwardNatural');if(!animation)throw new Error('dolphin route animation missing');animation.pause();const left=()=>node.getBoundingClientRect().left;const leftAt=ms=>new Promise(resolve=>{animation.currentTime=ms;requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(left())));});const segmentMs=routeMs/steps,startLeft=await leftAt(0),burstLeft=await leftAt(segmentMs*.48),pauseStart=await leftAt(segmentMs*.55),pauseEnd=await leftAt(segmentMs*.95),nextBurst=await leftAt(segmentMs*1.48);return{animationName:animation.animationName,cadence:node.dataset.swimCadence,steps,segmentMs,startLeft,burstLeft,pauseStart,pauseEnd,nextBurst,firstBurstDelta:burstLeft-startLeft,pauseDelta:pauseEnd-pauseStart,secondBurstDelta:nextBurst-pauseEnd};});
  const ordinaryUpgrade=await page.evaluate(()=>{const host=document.createElement('div');host.innerHTML='<div class="fishWrap"><img class="fishBody" src="optimized/species-blue-tang.svg"><img class="fishTail" src="optimized/species-filefish.webp"></div>';document.body.appendChild(host);window.CinemapOceanMilestoneSwim.upgradeOrdinaryAssets(host);const srcs=[...host.querySelectorAll('img')].map(i=>i.getAttribute('src'));const upgraded=host.querySelector('.fishWrap')?.dataset.assetUpgraded==='1';host.remove();return{srcs,upgraded};});
  await page.screenshot({path:'artifacts/dolphin-motion/frame-b.png'});await writeFile('artifacts/dolphin-motion/metrics.json',JSON.stringify({swimmers:metrics,webglMotion,cadence,ordinaryUpgrade,diagnostic},null,2)+'\n');
  const failures=[];for(const [key,cfg] of Object.entries(swimmers)){const m=metrics[key],d=diagnostic[key];if(!m||!d)failures.push(`${key}: no metrics`);else{if(!m.ready)failures.push(`${key}: deformation source never reached ready state`);if(d.engine==='webgl'){if(!webglMotion[key]?.changed)failures.push(`${key}: composited WebGL canvas did not change across frames`);}else{if(m.coverage>cfg.maxCoverage)failures.push(`${key}: alpha coverage too large (${m.coverage.toFixed(3)})`);if(m.movingPixelDelta<cfg.minDelta)failures.push(`${key}: motion too small (${m.movingPixelDelta.toFixed(2)})`);if(m.movingPixelDelta<=m.anchorPixelDelta*1.03)failures.push(`${key}: moving region must change more than anchored body`);}if(Number(d.opacity)!==1)failures.push(`${key}: commemorative opacity is ${d.opacity}`);if(!d.rect||d.rect.width<4||d.rect.height<4)failures.push(`${key}: not visibly laid out`);if(cfg.direction&&d.direction!==cfg.direction)failures.push(`${key}: direction ${d.direction}, expected ${cfg.direction}`);}}
  if(!metrics.dolphin?.webgl&&metrics.dolphin?.anchorPixelDelta>1.0)failures.push(`dolphin: head/upper torso is still deforming too much (${metrics.dolphin.anchorPixelDelta.toFixed(2)})`);if(cadence.animationName!=='milestoneForwardNatural')failures.push(`dolphin: wrong travel animation (${cadence.animationName})`);if(cadence.firstBurstDelta<.2||cadence.firstBurstDelta>1.5)failures.push(`dolphin: propulsion burst must be tiny (${cadence.firstBurstDelta.toFixed(2)}px)`);if(Math.abs(cadence.pauseDelta)>.35)failures.push(`dolphin: pause still drifts (${cadence.pauseDelta.toFixed(2)}px)`);if(cadence.secondBurstDelta<.2||cadence.secondBurstDelta>1.5)failures.push(`dolphin: next burst must be tiny (${cadence.secondBurstDelta.toFixed(2)}px)`);if(!ordinaryUpgrade.upgraded||ordinaryUpgrade.srcs.some(s=>/\.svg$|species-filefish\.webp$/.test(s)))failures.push(`ordinary fish upgrade failed: ${JSON.stringify(ordinaryUpgrade)}`);if(failures.length)throw new Error(failures.join('; '));console.log('Ocean creature quality motion verified:',{metrics,webglMotion,cadence,ordinaryUpgrade});
}finally{await context.close();await browser.close();}