import { chromium } from 'playwright';
import fs from 'node:fs';
const base='http://127.0.0.1:4173';
const candidates=['index.html','discover.html','my-cinemap.html'];
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));fs.mkdirSync('artifacts/mobile-smoke',{recursive:true});
for(const path of candidates){
 const res=await page.goto(`${base}/${path}`,{waitUntil:'domcontentloaded'});
 if(!res||res.status()>=400){if(path==='index.html')errors.push(`${path}: HTTP ${res?.status()??'no response'}`);continue}
 await page.waitForTimeout(250);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 if(overflow>2)errors.push(`${path}: page-level horizontal overflow ${overflow}px`);
 const safeName=path.replace(/\.html$/,'').replaceAll('/','-');
 await page.screenshot({path:`artifacts/mobile-smoke/${safeName}.png`,fullPage:true});
}
await browser.close();
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Mobile smoke checks passed. Ocean WebGL has its own iPhone renderer workflow.');
