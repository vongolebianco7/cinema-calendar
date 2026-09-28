import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base='http://127.0.0.1:4173';
const candidates=['index.html','discover.html','my-cinemap.html','preview/ocean/ocean-demo.html?view=dashboard'];
fs.mkdirSync('artifacts/mobile-smoke',{recursive:true});

// Temporary, deterministic one-time vendor capture for the Ocean rebuild.
// Source: WebGLSamples/WebGLSamples.github.io aquarium assets, 3-clause BSD.
if(process.env.CI){
  const vendorDir='artifacts/mobile-smoke/ocean-bsd-vendor';
  fs.mkdirSync(vendorDir,{recursive:true});
  const files=['SmallFishA.js','SmallFishA_DM.jpg','MediumFishA.js','MediumFishA_DM.jpg','BigFishA.js','BigFishA_DM.jpg','Coral.js','Coral_DM.jpg','RockA.js','Rock01_DM.jpg','LightRay.png','Seeweeds.png'];
  for(const name of files){
    const url=`https://raw.githubusercontent.com/WebGLSamples/WebGLSamples.github.io/master/aquarium/assets/${name}`;
    const response=await fetch(url);
    if(!response.ok) throw new Error(`vendor asset fetch failed ${name}: ${response.status}`);
    fs.writeFileSync(path.join(vendorDir,name),Buffer.from(await response.arrayBuffer()));
  }
  fs.writeFileSync(path.join(vendorDir,'LICENSE-WebGLSamples.txt'),'WebGLSamples/WebGLSamples.github.io — 3-clause BSD\nCopyright 2009, Google Inc.\nSource: https://github.com/WebGLSamples/WebGLSamples.github.io\n');
}

const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+e.message));

for (const pagePath of candidates) {
  let res=await page.goto(`${base}/${pagePath}`,{waitUntil:'domcontentloaded'});
  if (!res || res.status()>=400) {
    if (pagePath==='index.html' || pagePath.startsWith('preview/ocean/')) errors.push(`${pagePath}: HTTP ${res?.status() ?? 'no response'}`);
    continue;
  }
  if(pagePath.startsWith('preview/ocean/')){
    const mature=Object.fromEntries(Array.from({length:100},(_,i)=>{const id=700000+i;return[String(id),{id,watched:true,rating:i%19===0?5:i%5===0?4.5:3.5,title:`Smoke film ${i+1}`,genres:[],year:1980+(i%45)}]}));
    await page.evaluate(records=>localStorage.setItem('cinemap-ocean-demo-records-v1',JSON.stringify(records)),mature);
    res=await page.reload({waitUntil:'domcontentloaded'});
  }
  await page.waitForTimeout(pagePath.startsWith('preview/ocean/')?1600:250);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  if (overflow>2) errors.push(`${pagePath}: page-level horizontal overflow ${overflow}px`);
  const safeName=pagePath.split('?')[0].replace(/\.html$/,'').replaceAll('/','-');
  await page.screenshot({path:`artifacts/mobile-smoke/${safeName}.png`,fullPage:true});

  if(pagePath.startsWith('preview/ocean/')){
    const scene=await page.locator('.oceanV6Scene').count();
    const canvas=await page.locator('.oceanCinematicCanvas').count();
    const version=await page.locator('[data-ocean-version="0.6.1"]').count();
    const marker=await page.getByText('OCEAN v0.6.1',{exact:true}).count();
    const fallback=await page.locator('.oceanCinematicFallback').count();
    if(!scene||!version||!marker||(!canvas&&!fallback))errors.push(`${pagePath}: cinematic Ocean shell did not render (scene=${scene}, canvas=${canvas}, fallback=${fallback}, version=${version}, marker=${marker})`);
    if(canvas){
      const box=await page.locator('.oceanCinematicViewport').boundingBox();
      if(box){await page.mouse.move(box.x+box.width*.78,box.y+box.height*.55);await page.mouse.down();await page.mouse.move(box.x+box.width*.18,box.y+box.height*.43,{steps:12});await page.mouse.up();await page.waitForTimeout(550);await page.screenshot({path:'artifacts/mobile-smoke/preview-ocean-explored.png',fullPage:true});}
    }
  }
}
await browser.close();
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log('Mobile smoke checks passed.');
