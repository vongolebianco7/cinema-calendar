/* Precisely make the dark area OUTSIDE the C logo's closed gold border transparent. */
(() => {
  'use strict';
  const file = '411DC24B-E557-4A36-95D2-5FA3550E7BD7.png';
  const selector = 'img.gBrandImage[src*="' + file + '"]';
  let result;
  function trim(image) {
    const n = 640, c = document.createElement('canvas');
    c.width = c.height = n;
    const ctx = c.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(image,0,0,n,n);
    const pixels=ctx.getImageData(0,0,n,n), p=pixels.data;
    const seen=new Uint8Array(n*n), q=new Int32Array(n*n);
    let head=0,tail=0;
    function add(i) {
      if(seen[i])return;seen[i]=1;
      const k=i*4;
      if(p[k+3]>0 && p[k]<145 && p[k+1]<145 && p[k+2]<145) q[tail++]=i;
    }
    for(let x=0;x<n;x++){add(x);add((n-1)*n+x)}
    for(let y=0;y<n;y++){add(y*n);add(y*n+n-1)}
    while(head<tail){
      const i=q[head++],x=i%n;
      if(x)add(i-1);if(x<n-1)add(i+1);
      if(i>=n)add(i-n);if(i<n*(n-1))add(i+n);
    }
    // Refuse to change the source if the fine gold border isn't fully closed.
    if(tail<n*n*.015 || tail>n*n*.60)return null;
    for(let i=0;i<head;i++)p[q[i]*4+3]=0;
    let left=n,right=-1,top=n,bottom=-1;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(p[(y*n+x)*4+3]){
      if(x<left)left=x;if(x>right)right=x;
      if(y<top)top=y;if(y>bottom)bottom=y;
    }
    if(right<left)return null;
    ctx.putImageData(pixels,0,0);
    const x0=Math.max(0,left-2),y0=Math.max(0,top-2);
    const w=Math.min(n-x0,right-x0+3),h=Math.min(n-y0,bottom-y0+3);
    const out=document.createElement('canvas');out.width=w;out.height=h;
    out.getContext('2d').drawImage(c,x0,y0,w,h,0,0,w,h);
    return out.toDataURL('image/png');
  }
  function apply(){
    const icons=document.querySelectorAll(selector);
    if(!icons.length)return;
    if(!result)result=new Promise(resolve=>{
      const img=new Image();
      img.onload=()=>{try{resolve(trim(img))}catch{resolve(null)}};
      img.onerror=()=>resolve(null);
      img.src=icons[0].src;
    });
    result.then(url=>{if(url)document.querySelectorAll(selector).forEach(img=>{img.src=url})});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();
