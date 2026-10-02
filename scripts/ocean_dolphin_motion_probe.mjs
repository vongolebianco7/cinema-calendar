import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const page=await context.newPage();
await mkdir('artifacts/dolphin-motion',{recursive:true});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(error.message));

try{
  await page.goto('http://127.0.0.1:4173/preview/ocean/real-fish/ecosystem.html?preview=500',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.CinemapOceanPhotoFourPoints&&window.__OCEAN_PHOTO__?.CREATURES?.length>0);
  await page.waitForFunction(()=>document.querySelector('[data-milestone-key="dolphin"] canvas.milestoneDeformedCanvas'));
  await page.waitForTimeout(1200);

  const diagnostic=await page.evaluate(()=>{
    const canvas=document.querySelector('[data-milestone-key="dolphin"] canvas.milestoneDeformedCanvas');
    const wrap=canvas?.closest('[data-milestone-key="dolphin"]');
    const ctx=canvas?.getContext('2d',{willReadFrequently:true});
    let coverage=null;
    if(canvas&&ctx){
      const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let opaque=0;
      for(let i=3;i<data.length;i+=4)if(data[i]>16)opaque++;
      coverage=opaque/(canvas.width*canvas.height);
    }
    return {
      matches:[...document.querySelectorAll('[data-milestone-key="dolphin"]')].map(el=>({className:el.className,dataset:{...el.dataset},canvasCount:el.querySelectorAll('canvas.milestoneDeformedCanvas').length})),
      wrapDataset:wrap?{...wrap.dataset}:null,
      canvasSize:canvas?{width:canvas.width,height:canvas.height}:null,
      coverage
    };
  });
  console.log('Dolphin preflight:',JSON.stringify({diagnostic,pageErrors}));
  await writeFile('artifacts/dolphin-motion/preflight.json',JSON.stringify({diagnostic,pageErrors},null,2)+'\n');
  if(pageErrors.length)throw new Error(`page errors: ${pageErrors.join('; ')}`);
  if(diagnostic.wrapDataset?.backgroundKeyed!=='1')throw new Error(`dolphin source never reached keyed state: ${JSON.stringify(diagnostic)}`);

  await page.screenshot({path:'artifacts/dolphin-motion/frame-a.png'});

  const metrics=await page.evaluate(async()=>{
    const snapshot=()=>{
      const canvas=document.querySelector('[data-milestone-key="dolphin"] canvas.milestoneDeformedCanvas');
      const wrap=canvas?.closest('[data-milestone-key="dolphin"]');
      if(!wrap||!canvas)throw new Error('dolphin deformation canvas missing');
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      const {width,height}=canvas;
      const data=ctx.getImageData(0,0,width,height).data;
      let opaque=0,total=width*height,leftWeight=0,leftY=0,rightWeight=0,rightY=0;
      const alpha=new Uint8Array(total);
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const p=y*width+x,a=data[p*4+3];alpha[p]=a;if(a>16)opaque++;
        if(x<width*.45){leftWeight+=a;leftY+=a*y;}
        if(x>width*.58){rightWeight+=a;rightY+=a*y;}
      }
      return {alpha,width,height,coverage:opaque/total,leftCentroid:leftWeight?leftY/leftWeight:0,rightCentroid:rightWeight?rightY/rightWeight:0,keyed:wrap.dataset.backgroundKeyed==='1'};
    };
    const base=snapshot();
    const samples=[base];
    for(let i=0;i<4;i++){
      await new Promise(resolve=>setTimeout(resolve,220));
      samples.push(snapshot());
    }
    for(const sample of samples){if(base.width!==sample.width||base.height!==sample.height)throw new Error('dolphin canvas dimensions changed during probe');}
    let maxTailCentroidShift=0,maxHeadCentroidShift=0,maxTailPixelDelta=0,maxHeadPixelDelta=0;
    for(const sample of samples.slice(1)){
      let leftDiff=0,leftN=0,rightDiff=0,rightN=0;
      for(let y=0;y<base.height;y++)for(let x=0;x<base.width;x++){
        const p=y*base.width+x,d=Math.abs(base.alpha[p]-sample.alpha[p]);
        if(x<base.width*.45){leftDiff+=d;leftN++;}
        else if(x>base.width*.58){rightDiff+=d;rightN++;}
      }
      maxTailCentroidShift=Math.max(maxTailCentroidShift,Math.abs(base.leftCentroid-sample.leftCentroid));
      maxHeadCentroidShift=Math.max(maxHeadCentroidShift,Math.abs(base.rightCentroid-sample.rightCentroid));
      maxTailPixelDelta=Math.max(maxTailPixelDelta,leftDiff/Math.max(1,leftN));
      maxHeadPixelDelta=Math.max(maxHeadPixelDelta,rightDiff/Math.max(1,rightN));
    }
    return {
      keyed:samples.every(sample=>sample.keyed),
      coverage:base.coverage,
      tailCentroidShift:maxTailCentroidShift,
      headCentroidShift:maxHeadCentroidShift,
      tailPixelDelta:maxTailPixelDelta,
      headPixelDelta:maxHeadPixelDelta
    };
  });

  await page.screenshot({path:'artifacts/dolphin-motion/frame-b.png'});
  await writeFile('artifacts/dolphin-motion/metrics.json',JSON.stringify(metrics,null,2)+'\n');

  const failures=[];
  if(!metrics.keyed)failures.push('baked ocean background was not keyed out');
  if(metrics.coverage>.58)failures.push(`dolphin canvas alpha coverage too large (${metrics.coverage.toFixed(3)}), likely moving background remains`);
  if(metrics.tailCentroidShift<1.0)failures.push(`tail did not visibly change vertical position (${metrics.tailCentroidShift.toFixed(2)}px)`);
  if(metrics.tailPixelDelta<1.5)failures.push(`tail pixel delta too small (${metrics.tailPixelDelta.toFixed(2)})`);
  if(metrics.tailPixelDelta<=metrics.headPixelDelta*1.15)failures.push(`tail must move more than head (tail=${metrics.tailPixelDelta.toFixed(2)}, head=${metrics.headPixelDelta.toFixed(2)})`);
  if(failures.length)throw new Error(failures.join('; '));
  console.log('Dolphin motion verified:',metrics);
}finally{
  await context.close();
  await browser.close();
}
