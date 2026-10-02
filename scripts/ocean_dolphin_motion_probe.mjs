import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const swimmers={
  'manta-ray':{profile:'wing-flex',minDelta:.25,maxCoverage:.72},
  dolphin:{profile:'tail-flex-right',minDelta:1.5,maxCoverage:.58},
  dugong:{profile:'tail-flex-right',minDelta:.45,maxCoverage:.72},
  'minke-whale':{profile:'tail-flex-left',minDelta:.25,maxCoverage:.72},
  orca:{profile:'tail-flex-left',minDelta:.3,maxCoverage:.72},
  'humpback-whale':{profile:'tail-flex-left',minDelta:.25,maxCoverage:.72},
  'whale-shark':{profile:'tail-flex-left',minDelta:.3,maxCoverage:.72},
  'blue-whale':{profile:'tail-flex-left',minDelta:.2,maxCoverage:.72}
};

const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const page=await context.newPage();
await mkdir('artifacts/dolphin-motion',{recursive:true});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(error.message));

try{
  await page.goto('http://127.0.0.1:4173/preview/ocean/real-fish/ecosystem.html?preview=1000',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.CinemapOceanPhotoFourPoints&&window.__OCEAN_PHOTO__?.CREATURES?.length>0);
  await page.waitForFunction(keys=>keys.every(key=>document.querySelector(`[data-milestone-key="${key}"] canvas.milestoneDeformedCanvas`)),Object.keys(swimmers),{timeout:15000});
  await page.waitForTimeout(1400);

  const diagnostic=await page.evaluate(keys=>Object.fromEntries(keys.map(key=>{
    const canvas=document.querySelector(`[data-milestone-key="${key}"] canvas.milestoneDeformedCanvas`);
    const wrap=canvas?.closest(`[data-milestone-key="${key}"]`);
    const ctx=canvas?.getContext('2d',{willReadFrequently:true});
    let coverage=null;
    if(canvas&&ctx){
      const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let opaque=0;
      for(let i=3;i<data.length;i+=4)if(data[i]>16)opaque++;
      coverage=opaque/(canvas.width*canvas.height);
    }
    return [key,{dataset:wrap?{...wrap.dataset}:null,canvasSize:canvas?{width:canvas.width,height:canvas.height}:null,coverage}];
  })),Object.keys(swimmers));
  console.log('Swimmer preflight:',JSON.stringify({diagnostic,pageErrors}));
  await writeFile('artifacts/dolphin-motion/preflight.json',JSON.stringify({diagnostic,pageErrors},null,2)+'\n');
  if(pageErrors.length)throw new Error(`page errors: ${pageErrors.join('; ')}`);

  await page.screenshot({path:'artifacts/dolphin-motion/frame-a.png'});

  const metrics=await page.evaluate(async swimmerConfig=>{
    const snapshot=()=>Object.fromEntries(Object.entries(swimmerConfig).map(([key,cfg])=>{
      const canvas=document.querySelector(`[data-milestone-key="${key}"] canvas.milestoneDeformedCanvas`);
      const wrap=canvas?.closest(`[data-milestone-key="${key}"]`);
      if(!wrap||!canvas)throw new Error(`${key} deformation canvas missing`);
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      const {width,height}=canvas,data=ctx.getImageData(0,0,width,height).data,total=width*height,alpha=new Uint8Array(total);
      let opaque=0;
      for(let p=0;p<total;p++){const a=data[p*4+3];alpha[p]=a;if(a>16)opaque++;}
      return [key,{alpha,width,height,coverage:opaque/total,keyed:wrap.dataset.backgroundKeyed==='1',profile:cfg.profile}];
    }));
    const base=snapshot(),samples=[base];
    for(let i=0;i<7;i++){
      await new Promise(resolve=>setTimeout(resolve,280));
      samples.push(snapshot());
    }
    const output={};
    for(const [key,cfg] of Object.entries(swimmerConfig)){
      const a=base[key];
      let movingMax=0,anchorMax=0;
      for(const sampleSet of samples.slice(1)){
        const b=sampleSet[key];
        if(a.width!==b.width||a.height!==b.height)throw new Error(`${key} canvas dimensions changed during probe`);
        let movingDiff=0,movingN=0,anchorDiff=0,anchorN=0;
        for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
          const p=y*a.width+x,d=Math.abs(a.alpha[p]-b.alpha[p]);
          let moving=false,anchor=false;
          if(cfg.profile==='tail-flex-left'){moving=x<a.width*(key==='dolphin'?.30:.45);anchor=x>a.width*.58;}
          else if(cfg.profile==='tail-flex-right'){moving=x>a.width*(key==='dolphin'?.70:.55);anchor=x<a.width*(key==='dolphin'?.58:.42);}
          else {moving=x<a.width*.32||x>a.width*.68;anchor=x>a.width*.42&&x<a.width*.58;}
          if(moving){movingDiff+=d;movingN++;}
          if(anchor){anchorDiff+=d;anchorN++;}
        }
        movingMax=Math.max(movingMax,movingDiff/Math.max(1,movingN));
        anchorMax=Math.max(anchorMax,anchorDiff/Math.max(1,anchorN));
      }
      output[key]={coverage:a.coverage,keyed:samples.every(set=>set[key].keyed),movingPixelDelta:movingMax,anchorPixelDelta:anchorMax};
    }
    return output;
  },swimmers);

  const forward=await page.evaluate(async()=>{
    const canvas=document.querySelector('[data-milestone-key="dolphin"] canvas.milestoneDeformedCanvas');
    const node=canvas?.closest('[data-commemorative]');
    if(!node)throw new Error('dolphin commemorative wrapper missing');
    node.dataset.swimActive='1';
    node.dataset.swimDirection='forward';
    node.style.setProperty('--swim-delay','0s');
    node.style.setProperty('--swim-lane-y','0vh');
    await new Promise(resolve=>setTimeout(resolve,120));
    const animationName=getComputedStyle(node).animationName;
    const startLeft=node.getBoundingClientRect().left;
    await new Promise(resolve=>setTimeout(resolve,850));
    const endLeft=node.getBoundingClientRect().left;
    return {animationName,startLeft,endLeft,forwardDelta:endLeft-startLeft};
  });

  await page.screenshot({path:'artifacts/dolphin-motion/frame-b.png'});
  await writeFile('artifacts/dolphin-motion/metrics.json',JSON.stringify({swimmers:metrics,forward},null,2)+'\n');

  const failures=[];
  for(const [key,cfg] of Object.entries(swimmers)){
    const m=metrics[key];
    if(!m)failures.push(`${key}: no metrics`);
    else{
      if(!m.keyed)failures.push(`${key}: background isolation never reached ready state`);
      if(m.coverage>cfg.maxCoverage)failures.push(`${key}: alpha coverage too large (${m.coverage.toFixed(3)}), moving background likely remains`);
      if(m.movingPixelDelta<cfg.minDelta)failures.push(`${key}: motion too small (${m.movingPixelDelta.toFixed(2)})`);
      if(m.movingPixelDelta<=m.anchorPixelDelta*1.08)failures.push(`${key}: moving region must change more than anchored body (moving=${m.movingPixelDelta.toFixed(2)}, anchor=${m.anchorPixelDelta.toFixed(2)})`);
    }
  }
  if(metrics.dolphin?.anchorPixelDelta>1.0)failures.push(`dolphin: head/upper torso is still deforming too much (${metrics.dolphin.anchorPixelDelta.toFixed(2)})`);
  if(forward.animationName!=='milestoneForwardNatural')failures.push(`dolphin: wrong travel animation (${forward.animationName})`);
  if(forward.forwardDelta<5)failures.push(`dolphin: did not visibly advance (${forward.forwardDelta.toFixed(2)}px)`);
  if(failures.length)throw new Error(failures.join('; '));
  console.log('Ocean swimmer motion verified:',{metrics,forward});
}finally{
  await context.close();
  await browser.close();
}
