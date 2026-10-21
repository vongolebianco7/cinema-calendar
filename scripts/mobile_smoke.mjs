import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
const base='http://127.0.0.1:4173';
const candidates=['index.html','discover.html','my-cinemap.html'];
const browserName=process.env.CINEMAP_BROWSER||'chromium';
const browserType={chromium,webkit}[browserName];
if(!browserType)throw new Error(`Unsupported CINEMAP_BROWSER: ${browserName}`);
const browser=await browserType.launch();
const watchdog=setTimeout(()=>{console.error(`${browserName}: mobile smoke exceeded 150 seconds; terminating hung browser`);process.exit(124)},150000);
watchdog.unref();
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
 console.log(`${browserName}: checking ${path}`);
 const res=await navigate(path);
 console.log(`${browserName}: navigated ${path} HTTP ${res?.status()}`);
 if(!res||res.status()>=400){if(path==='index.html')errors.push(`${path}: HTTP ${res?.status()??'no response'}`);continue}
 if(path==='index.html')await page.waitForLoadState('networkidle',{timeout:5000}).catch(()=>console.warn('Index remained network-active; proceeding with DOM-ready smoke checks'));
 await page.waitForTimeout(250);
 console.log(`${browserName}: DOM ready ${path}`);
 console.log(`${browserName}: measuring overflow ${path}`);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 if(overflow>2)errors.push(`${path}: page-level horizontal overflow ${overflow}px`);
 const safeName=path.replace(/\.html$/,'').replaceAll('/','-');
 // WebKit rejects any screenshot dimension beyond 32767 device pixels.
 // Preserve a genuine viewport screenshot for tall pages instead of
 // silently treating screenshot infrastructure limits as layout failures.
 const docHeight=await page.evaluate(()=>Math.max(document.documentElement.scrollHeight,document.body?.scrollHeight||0));
 const fullPage=docHeight*3<=30000;
 if(!fullPage)console.warn(`${browserName} ${path}: document ${docHeight}px is too tall for a full-page screenshot at DPR 3; preserving viewport evidence`);
 console.log(`${browserName}: capturing ${path}`);
 const captureOptions={path:`artifacts/mobile-smoke/${browserName}-${safeName}.png`,fullPage,timeout:20000,animations:'disabled'};
 try{await page.screenshot(captureOptions)}
 catch(error){
  // Content can grow between measurement and capture; only this documented
  // image-size limit may fall back. Browser failures still fail the gate.
  if(!fullPage||!/Cannot take screenshot larger than 32767 pixels/.test(String(error?.message)))throw error;
  console.warn(`${browserName} ${path}: screenshot grew beyond WebKit's image limit; preserving viewport evidence`);
  await page.screenshot({...captureOptions,fullPage:false});
 }
}
await browser.close();
clearTimeout(watchdog);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Mobile smoke checks passed in ${browserName} at 390x844, DPR 3.`);
