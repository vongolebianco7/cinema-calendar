import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
const base='http://127.0.0.1:4173';
const candidates=['index.html','discover.html','my-cinemap.html'];
const browserName=process.env.CINEMAP_BROWSER||'chromium';
const browserType={chromium,webkit}[browserName];
if(!browserType)throw new Error(`Unsupported CINEMAP_BROWSER: ${browserName}`);
const browser=await browserType.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
// This is a layout/smoke gate. Keep it deterministic and independent from the optional
// Vercel movie-search backend, whose CORS/rate-limit state is tested separately.
await context.route(/backend-one-gray-94\.vercel\.app\/api\/movies/,route=>route.fulfill({status:200,contentType:'application/json',body:'{"results":[],"movies":[]}'}));
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));fs.mkdirSync('artifacts/mobile-smoke',{recursive:true});
for(const path of candidates){
 const res=await page.goto(`${base}/${path}`,{waitUntil:'domcontentloaded'});
 if(!res||res.status()>=400){if(path==='index.html')errors.push(`${path}: HTTP ${res?.status()??'no response'}`);continue}
 await page.waitForTimeout(250);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 if(overflow>2)errors.push(`${path}: page-level horizontal overflow ${overflow}px`);
 const safeName=path.replace(/\.html$/,'').replaceAll('/','-');
 await page.screenshot({path:`artifacts/mobile-smoke/${browserName}-${safeName}.png`,fullPage:true});
}
await browser.close();
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Mobile smoke checks passed in ${browserName} at 390x844, DPR 3.`);
