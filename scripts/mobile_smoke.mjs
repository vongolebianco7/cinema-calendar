import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
const base='http://127.0.0.1:4173';
const candidates=['index.html','discover.html','my-cinemap.html'];
const browserName=process.env.CINEMAP_BROWSER||'chromium';
const browserType={chromium,webkit}[browserName];
if(!browserType)throw new Error(`Unsupported CINEMAP_BROWSER: ${browserName}`);
const browser=await browserType.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
await context.route(/backend-one-gray-94\.vercel\.app\/api\//,route=>route.fulfill({status:200,contentType:'application/json',body:'{"results":[],"movies":[],"theaters":[],"schedules":[]}'}));
const page=await context.newPage();
const errors=[];
const optionalMovieBackendError=/backend-one-gray-94\.vercel\.app\/api\/movies.*access control checks/i;
page.on('pageerror',e=>{if(!optionalMovieBackendError.test(e.message))errors.push('pageerror: '+e.message)});
fs.mkdirSync('artifacts/mobile-smoke',{recursive:true});
async function navigate(path){
 let lastError;
 for(let attempt=1;attempt<=2;attempt++){
  try{return await page.goto(`${base}/${path}`,{waitUntil:'domcontentloaded',timeout:30000})}
  catch(err){lastError=err;if(browserName!=='webkit'||attempt===2)throw err;await page.waitForTimeout(500)}
 }
 throw lastError;
}
for(const path of candidates){
 const res=await navigate(path);
 if(!res||res.status()>=400){if(path==='index.html')errors.push(`${path}: HTTP ${res?.status()??'no response'}`);continue}
 if(path==='index.html')await page.waitForLoadState('networkidle',{timeout:15000});
 await page.waitForTimeout(250);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 if(overflow>2)errors.push(`${path}: page-level horizontal overflow ${overflow}px`);
 const safeName=path.replace(/\.html$/,'').replaceAll('/','-');
 // WebKit enforces a 32,767 physical-pixel cap. Keep visual evidence
 // even for naturally long movie calendars without hiding overflow assertions.
 const pageHeight=await page.evaluate(()=>document.documentElement.scrollHeight);
 const fullPage=pageHeight*3<=30000;
 await page.screenshot({path:`artifacts/mobile-smoke/${browserName}-${safeName}.png`,fullPage});
 if(!fullPage)console.log(`${path}: captured viewport screenshot (full page ${pageHeight}px exceeds safe WebKit image limit)`);
}
await browser.close();
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Mobile smoke checks passed in ${browserName} at 390x844, DPR 3.`);
