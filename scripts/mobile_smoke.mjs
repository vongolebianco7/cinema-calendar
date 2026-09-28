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
  let res=await page.goto(`${base}/${path}`,{waitUntil:'domcontentloaded'});
  if (!res || res.status()>=400) {
    if (path==='index.html' || path.startsWith('preview/ocean/')) errors.push(`${path}: HTTP ${res?.status() ?? 'no response'}`);
    continue; // other optional pages may not exist in every branch
  }
  if(path.startsWith('preview/ocean/')){
    const mature=Object.fromEntries(Array.from({length:100},(_,i)=>{const id=700000+i;return[String(id),{id,watched:true,rating:i%19===0?5:i%5===0?4.5:3.5,title:`Smoke film ${i+1}`,genres:[],year:1980+(i%45)}]}));
    await page.evaluate(records=>localStorage.setItem('cinemap-ocean-demo-records-v1',JSON.stringify(records)),mature);
    res=await page.reload({waitUntil:'domcontentloaded'});
  }
  await page.waitForTimeout(path.startsWith('preview/ocean/')?1100:250);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  if (overflow>2) errors.push(`${path}: page-level horizontal overflow ${overflow}px`);
  if(path.startsWith('preview/ocean/')){
    const ocean=await page.locator('.oceanWorld').count();
    const reef=await page.locator('.oceanReefArt').count();
    const fauna=await page.locator('.oceanAnimal').count();
    if(!ocean||!reef||fauna<28||fauna>40)errors.push(`${path}: mature ecosystem did not render as expected (world=${ocean}, reef=${reef}, fauna=${fauna})`);
  }
  const safeName=path.split('?')[0].replace(/\.html$/,'').replaceAll('/','-');
  await page.screenshot({path:`artifacts/mobile-smoke/${safeName}.png`,fullPage:true});
}
await browser.close();
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log('Mobile smoke checks passed.');
