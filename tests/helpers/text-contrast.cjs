const assert=require('node:assert/strict');
async function assertTextContrast(page,selectors,label='text') {
 const results=await page.evaluate(selectors=>{
  const luminance=color=>{
   const channels=color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{const s=n/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;});
   return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  };
  return selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length).map(el=>{
   let bg=el;while(bg.parentElement&&getComputedStyle(bg).backgroundColor==='rgba(0, 0, 0, 0)')bg=bg.parentElement;
   const a=luminance(getComputedStyle(el).color),b=luminance(getComputedStyle(bg).backgroundColor);
   return {selector,text:el.textContent.trim().slice(0,70),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  }));
 },selectors);
 for(const result of results)assert.ok(result.ratio>=4.5,`${label}: ${JSON.stringify(result)}`);
 return results;
}
module.exports={assertTextContrast};
