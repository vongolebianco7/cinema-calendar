import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, webkit } from 'playwright';
const name=process.env.CINEMAP_BROWSER||'chromium';
const browser=await ({chromium,webkit}[name]).launch();
const base=process.env.CINELVA_TEST_BASE||'http://127.0.0.1:4173';
const pages=[...fs.readdirSync('.').filter(file=>file.endsWith('.html')),...fs.readdirSync('cinelva').filter(file=>file.endsWith('.html')).map(file=>`cinelva/${file}`)];
const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:'light',reducedMotion:'reduce'});
await context.route('**/api/**',route=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"results":[],"movies":[]}'}));
const page=await context.newPage();
const errors=[];let currentRoute='';
page.on('pageerror',error=>errors.push(`${currentRoute}: ${error.message}`));
fs.mkdirSync('artifacts/mobile-smoke',{recursive:true});
try {
 for (const routePath of pages) {
  currentRoute=routePath;
  const file=routePath.split('/').at(-1);
  await page.goto(`${base}/${routePath}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(document.querySelector('.cinelvaTheme select')));
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light',routePath+' system theme');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(248, 246, 241)',routePath+' light body');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=2,routePath+' light overflow');
  const contrasts=await page.locator('.heroAction,.legend>span,.gDrawerClose,.calendarCoverage').evaluateAll(elements=>{
   const rgb=value=>value.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
   const lum=value=>rgb(value).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
   return elements.map(el=>{const c=getComputedStyle(el),fg=lum(c.color),bg=lum(c.backgroundColor);return {name:el.className||el.textContent,backgroundLuminance:bg,ratio:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)}});
  });
  for(const check of contrasts) {
   assert.ok(check.ratio>=4.5,`${routePath} light text contrast ${check.name}: ${check.ratio}`);
   if(check.name==='calendarCoverage')assert.ok(check.backgroundLuminance>.75,`${routePath} coverage note should use the light surface: ${check.backgroundLuminance}`);
  }

  if(file==='discover.html') {
   const cardContrast=await page.locator('.personExploreIntro').evaluate(el=>{
    const lum=value=>{const c=value.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return c.reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);};
    const bg=lum(getComputedStyle(el).backgroundColor);
    return [...el.querySelectorAll('h2,p')].map(child=>{const fg=lum(getComputedStyle(child).color);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);});
   });
   for(const ratio of cardContrast)assert.ok(ratio>=4.5,`Discover people card text contrast: ${ratio}`);
  }

  const menu=page.locator('#gMenuBtn');
  if(await menu.count())await menu.click();
  const select=page.getByLabel('表示テーマ',{exact:true});
  await page.emulateMedia({colorScheme:'dark'});
  await select.selectOption('light');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light',routePath+' light override on dark OS');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(248, 246, 241)',routePath+' explicit light body on dark OS');
  await page.emulateMedia({colorScheme:'light'});
  await select.selectOption('dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark',routePath+' reload persistence');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=2,routePath+' dark overflow');
  if(await menu.count())await menu.click();
  await select.selectOption('system');
  await page.emulateMedia({colorScheme:'dark'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await page.emulateMedia({colorScheme:'light'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  if(['index.html','my-cinemap.html','discover.html'].includes(routePath)) {
   if(await menu.count())await page.locator('#gDrawerClose').click();
   await page.screenshot({path:`artifacts/mobile-smoke/${name}-theme-light-${routePath.replaceAll('/','-')}.png`,fullPage:true});
  }
 }
 assert.deepEqual(errors,[],'No page errors during theme journeys');
 console.log(`Theme browser checks passed in ${name}: ${pages.length} routes, 390px, OS preference, override and reload.`);
} finally {await browser.close();}
