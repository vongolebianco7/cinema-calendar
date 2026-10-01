import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const page=await context.newPage();
await mkdir('artifacts/dolphin-motion',{recursive:true});

try{
  await page.goto('http://127.0.0.1:4173/preview/ocean/real-fish/ecosystem.html?preview=500',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.CinemapOceanPhotoFourPoints&&window.__OCEAN_PHOTO__?.CREATURES?.length>0);
  await page.waitForFunction(()=>document.querySelector('[data-milestone-key="dolphin"] canvas.milestoneDeformedCanvas'));
  await page.waitForFunction(()=>document.querySelector('[data-milestone-key="dolphin"]')?.dataset.backgroundKeyed==='1');
  await page.waitForTimeout(250);

  const dolphin=page.locator('[data-milestone-key="dolphin"]');
  await dolphin.screenshot({path:'artifacts/dolphin-motion/frame-a.png'});

  const metrics=await page.evaluate(async()=>{
    const wrap=document.querySelector('[data-milestone-key="dolphin"]');
    const canvas=wrap?.querySelector('canvas.milestoneDeformedCanvas');
    if(!wrap||!canvas)throw new Error('dolphin deformation canvas missing');
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const snapshot=()=>{
      const {width,height}=canvas;
      const data=ctx.getImageData(0,0,width,height).data;
      let opaque=0,total=width*height,leftWeight=0,leftY=0,rightWeight=0,rightY=0;
      const alpha=new Uint8Array(total);
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const p=y*width+x,a=data[p*4+3];alpha[p]=a;if(a>16)opaque++;
        if(x<width*.45){leftWeight+=a;leftY+=a*y;}
        if(x>width*.58){rightWeight+=a;rightY+=a*y;}
      }
      return {alpha,width,height,coverage:opaque/total,leftCentroid:leftWeight?leftY/leftWeight:0,rightCentroid:rightWeight?rightY/rightWeight:0};
    };
    const a=snapshot();
    await new Promise(resolve=>setTimeout(resolve,450));
    const b=snapshot();
    let leftDiff=0,leftN=0,rightDiff=0,rightN=0;
    for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
      const p=y*a.width+x,d=Math.abs(a.alpha[p]-b.alpha[p]);
      if(x<a.width*.45){leftDiff+=d;leftN++;}
      else if(x>a.width*.58){rightDiff+=d;rightN++;}
    }
    return {
      keyed:wrap.dataset.backgroundKeyed==='1',
      coverage:a.coverage,
      tailCentroidShift:Math.abs(a.leftCentroid-b.leftCentroid),
      headCentroidShift:Math.abs(a.rightCentroid-b.rightCentroid),
      tailPixelDelta:leftDiff/Math.max(1,leftN),
      headPixelDelta:rightDiff/Math.max(1,rightN)
    };
  });

  await dolphin.screenshot({path:'artifacts/dolphin-motion/frame-b.png'});
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
