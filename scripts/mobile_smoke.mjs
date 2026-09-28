import { chromium } from 'playwright';
import fs from 'node:fs';

const base='http://127.0.0.1:4173';
const candidates=['index.html','discover.html','my-cinemap.html','preview/ocean/ocean-demo.html?view=dashboard'];
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+e.message));
fs.mkdirSync('artifacts/mobile-smoke',{recursive:true});

for (const path of candidates) {
  const res=await page.goto(`${base}/${path}`,{waitUntil:'domcontentloaded'});
  if (!res || res.status()>=400) {
    if (path==='index.html' || path.startsWith('preview/ocean/')) errors.push(`${path}: HTTP ${res?.status() ?? 'no response'}`);
    continue; // other optional pages may not exist in every branch
  }
  await page.waitForTimeout(path.startsWith('preview/ocean/')?900:250);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  if (overflow>2) errors.push(`${path}: page-level horizontal overflow ${overflow}px`);
  if(path.startsWith('preview/ocean/')){
    const ocean=await page.locator('.oceanWorld').count();
    const reef=await page.locator('.oceanReefArt').count();
    const fauna=await page.locator('.oceanAnimal').count();
    if(!ocean||!reef||!fauna)errors.push(`${path}: living ecosystem did not render (world=${ocean}, reef=${reef}, fauna=${fauna})`);
  }
  const safeName=path.split('?')[0].replace(/\.html$/,'').replaceAll('/','-');
  await page.screenshot({path:`artifacts/mobile-smoke/${safeName}.png`,fullPage:true});
}
await browser.close();
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log('Mobile smoke checks passed.');
