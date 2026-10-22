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
   const foreground=getComputedStyle(el).color,background=getComputedStyle(bg).backgroundColor;
   if(transparent(background))throw new Error(`No painted background for ${selector}: ${JSON.stringify({theme:document.documentElement?.dataset.theme,ancestors})}`);
   const a=luminance(foreground),b=luminance(background);
   return {selector,text:el.textContent.trim().slice(0,70),foreground,background,backgroundElement:bg.tagName,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  }));
 },selectors);
 for(const result of results)assert.ok(result.ratio>=4.5,`${label}: ${JSON.stringify(result)}`);
 return results;
}
module.exports={assertTextContrast};
