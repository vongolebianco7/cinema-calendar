import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, webkit } from 'playwright';
const name=process.env.CINEMAP_BROWSER||'chromium';
const browser=await ({chromium,webkit}[name]).launch();
const base=process.env.CINELVA_TEST_BASE||'http://127.0.0.1:4173';
const pages=fs.readdirSync('.').filter(file=>file.endsWith('.html'));
const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:'light',reducedMotion:'reduce'});
await context.route(/backend-one-gray-94\.vercel\.app\/api\//,route=>route.fulfill({status:200,contentType:'application/json',body:'{"results":[],"movies":[]}'}));
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
fs.mkdirSync('artifacts/mobile-smoke',{recursive:true});
try {
 for (const prefix of ['', 'cinelva/']) for (const file of pages) {
  await page.goto(`${base}/${prefix}${file}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(document.querySelector('.cinelvaTheme select')));
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light',prefix+file+' system theme');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(248, 246, 241)',prefix+file+' light body');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=2,prefix+file+' light overflow');
  const contrasts=await page.locator('.heroAction,.legend>span,.gDrawerClose').evaluateAll(elements=>{
   const rgb=value=>value.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
   const lum=value=>rgb(value).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
   return elements.map(el=>{const c=getComputedStyle(el),fg=lum(c.color),bg=lum(c.backgroundColor);return {name:el.className||el.textContent,ratio:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)}});
  });
  for(const check of contrasts)assert.ok(check.ratio>=4.5,`${prefix}${file} light text contrast ${check.name}: ${check.ratio}`);

  const menu=page.locator('#gMenuBtn');
  if(await menu.count())await menu.click();
  const select=page.getByLabel('表示テーマ',{exact:true});
  await page.emulateMedia({colorScheme:'dark'});
  await select.selectOption('light');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light',prefix+file+' light override on dark OS');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(248, 246, 241)',prefix+file+' explicit light body on dark OS');
  await page.emulateMedia({colorScheme:'light'});
  await select.selectOption('dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark',prefix+file+' reload persistence');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=2,prefix+file+' dark overflow');
  if(await menu.count())await menu.click();
  await select.selectOption('system');
  await page.emulateMedia({colorScheme:'dark'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await page.emulateMedia({colorScheme:'light'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  if(['index.html','my-cinemap.html','discover.html'].includes(file)&&!prefix) {
   if(await menu.count())await page.locator('#gDrawerClose').click();
   await page.screenshot({path:`artifacts/mobile-smoke/${name}-theme-light-${file}.png`,fullPage:true});
  }
 }
 assert.deepEqual(errors,[],'No page errors during theme journeys');
 console.log(`Theme browser checks passed in ${name}: ${pages.length*2} routes, 390px, OS preference, override and reload.`);
} finally {await browser.close();}
