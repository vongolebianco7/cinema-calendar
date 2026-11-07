// Visual QA evidence: no external AI or paid service is required.
// Run with: CINELVA_BASE_URL=http://127.0.0.1:8765 CINELVA_BROWSER=chromium node scripts/continuous-visual-qa.mjs
import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync('quality/route-manifest.json','utf8'));
const browserName=process.env.CINELVA_BROWSER||'chromium';
const type={chromium,webkit}[browserName];
if(!type)throw Error('Unsupported browser: '+browserName);
const base=process.env.CINELVA_BASE_URL||'http://127.0.0.1:8765';
const routes=manifest.routes.filter(r=>r.surface==='public'||r.surface==='compatibility').map(r=>r.path);
const output='artifacts/continuous-qa/'+browserName;
fs.mkdirSync(output,{recursive:true});
const failures=[],report=[];
const browser=await type.launch();
try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
  // Do not mutate the user's real local storage, reviews or bookmarks.
  for(const theme of ['light','dark']){
   const page=await context.newPage();
   // The init script runs before <html> exists. The application reads this
   // preference during startup and applies its theme after document creation.
   await page.addInitScript(t=>localStorage.setItem('cinelva-theme',t),theme);
   for(const route of routes){
    const slug=route.replace(/[^a-z0-9]+/gi,'-');
    const id=slug+'-'+width+'-'+theme;
    const entry={route,width,theme,browser:browserName,issues:[]};
    const runtimeErrors=[];
    const onPageError=error=>runtimeErrors.push(String(error.message).slice(0,200));
    page.on('pageerror',onPageError);
    try{
     const response=await page.goto(base+'/'+route,{waitUntil:'domcontentloaded',timeout:20000});
     if(!response||response.status()>=400)entry.issues.push('HTTP '+(response?.status()??'missing'));
     try{await page.waitForLoadState('networkidle',{timeout:8000})}catch{/* retain the screenshot and record any unresolved runtime errors below */}
     await page.waitForTimeout(350);
     const audit=await page.evaluate(()=>{
      const overflow=Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth);
      const brokenLocalImages=[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.currentSrc&&new URL(i.currentSrc).origin===location.origin).map(i=>i.currentSrc).slice(0,8);
      const feedbackLinks=[...document.querySelectorAll('aside a, nav a, [role="navigation"] a')].filter(a=>/ご意見[・･]?ご要望/.test(a.textContent||'')).length;
      return {overflow,brokenLocalImages,feedbackLinks};
     });
     if(audit.overflow>2)entry.issues.push('horizontal overflow '+audit.overflow+'px');
     if(audit.brokenLocalImages.length)entry.issues.push('broken local images: '+audit.brokenLocalImages.join(', '));
     if(audit.feedbackLinks>1)entry.issues.push('duplicate feedback navigation links: '+audit.feedbackLinks);
     await page.screenshot({path:output+'/'+id+'.png',fullPage:false,animations:'disabled',timeout:15000});
    }catch(error){entry.issues.push(String(error.message).slice(0,250))}
    if(runtimeErrors.length)entry.issues.push('uncaught JavaScript errors: '+runtimeErrors.slice(0,5).join(' | '));
    page.off('pageerror',onPageError);
    report.push(entry);
    if(entry.issues.length)failures.push(id+': '+entry.issues.join('; '));
   }
   await page.close();
  }
  await context.close();
 }
}finally{await browser.close()}
fs.writeFileSync(output+'/report.json',JSON.stringify({generated_at:new Date().toISOString(),browser:browserName,checked:report.length,failures,results:report},null,2));
console.log('Audited '+report.length+' route/theme/viewport combinations in '+browserName);
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
