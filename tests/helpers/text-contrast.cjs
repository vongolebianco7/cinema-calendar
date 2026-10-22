const assert=require('node:assert/strict');
async function assertTextContrast(page,selectors,label='text') {
 const results=await page.evaluate(async selectors=>{
  // WebKit can expose the new document before its first painted frame.
  // Settle rendering before sampling colors, without waiting for a passing ratio.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const transparent=color=>color==='transparent'||(/^rgba\(/.test(color)&&Number(color.match(/[\d.]+/g)?.[3])===0);
  const luminance=color=>{
   const channels=color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{const s=n/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;});
   return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  };
  return selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.isConnected&&el.getClientRects().length).map(el=>{
   const ancestors=[];
   let bg=el;while(bg){
    const color=getComputedStyle(bg).backgroundColor;
    ancestors.push({element:bg.tagName,color});
    if(!transparent(color)||!bg.parentElement)break;
    bg=bg.parentElement;
   }
   const foreground=getComputedStyle(el).color;
   let background=getComputedStyle(bg).backgroundColor,backgroundElement=bg.tagName;
   if(transparent(background)){
    // With no painted ancestor, the browser's document canvas is the backdrop.
    // CSS Canvas follows the active color scheme; never assume black or white.
    const probe=document.createElement('span');probe.hidden=true;probe.style.backgroundColor='Canvas';
    document.documentElement.append(probe);
    try{background=getComputedStyle(probe).backgroundColor;}finally{probe.remove();}
    backgroundElement='Canvas';
    if(transparent(background))throw new Error(`No resolved canvas for ${selector}: ${JSON.stringify({theme:document.documentElement?.dataset.theme,ancestors})}`);
   }
   const a=luminance(foreground),b=luminance(background);
   return {selector,text:el.textContent.trim().slice(0,70),foreground,background,backgroundElement,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  }));
 },selectors);
 for(const result of results)assert.ok(result.ratio>=4.5,`${label}: ${JSON.stringify(result)}`);
 return results;
}
module.exports={assertTextContrast};
