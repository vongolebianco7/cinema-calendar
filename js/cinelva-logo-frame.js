/* Move the original emblem's fine inset outline to the outer perimeter. */
(() => {
  'use strict';
  const filename='411DC24B-E557-4A36-95D2-5FA3550E7BD7.png';
  const selector='img.gBrandImage[src*="'+filename+'"]';
  const source=document.currentScript.src;
  function render(image){
    const w=image.naturalWidth,h=image.naturalHeight;
    if(!w||!h)return null;
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(image,0,0);
    const data=ctx.getImageData(0,0,w,h),a=data.data;
    // Inset outline sits at ~9% from the original image edge. Erase
    // only the thin rounded-rectangle line; keep the C and spotlight.
    const x0=w*.092,x1=w*.908,y0=h*.115,y1=h*.885;
    const rad=Math.min(w,h)*.135;
    const thickness=Math.min(w,h)*.028;
    function sdf(x,y){
      const cx=(x0+x1)/2,cy=(y0+y1)/2;
      const bx=(x1-x0)/2-rad,by=(y1-y0)/2-rad;
      const qx=Math.abs(x-cx)-bx,qy=Math.abs(y-cy)-by;
      return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-rad;
    }
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      if(Math.abs(sdf(x,y))>thickness)continue;
      const k=(y*w+x)*4;
      // Only remove light/gold pixels near the original fine outline.
      // This preserves the inner C and beam even where their bounds overlap.
      if(a[k]>105&&a[k+1]>88&&a[k+2]>65){
        a[k]=17;a[k+1]=17;a[k+2]=17;a[k+3]=255;
      }
    }
    ctx.putImageData(data,0,0);
    return canvas.toDataURL('image/png');
  }
  function mount(){
    const nodes=[...document.querySelectorAll(selector)];
    if(!nodes.length)return;
    const image=new Image();
    image.onload=()=>{
      try{const url=render(image);if(url)nodes.forEach(node=>{node.src=url;});}
      catch(err){console.warn('Cinelva emblem rendering skipped',err);}
    };
    image.src=nodes[0].src;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
  else mount();
})();
