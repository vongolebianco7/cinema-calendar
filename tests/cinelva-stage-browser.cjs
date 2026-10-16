const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:844}});
   const page=await context.newPage();
   const origin='http://127.0.0.1:8765';
   await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
   const rootManifest=await page.request.get(origin+'/manifest.webmanifest').then(r=>r.json());
   assert.equal(await page.title(),rootManifest.name,'old URL stays available under its root identity');
   await page.evaluate(()=>localStorage.setItem('cinemap-viewing-records-v1','{"123":{"watched":true,"rating":5}}'));
   await page.goto(origin+'/cinelva/',{waitUntil:'domcontentloaded'});
   assert.match(await page.title(),/Cinelva/);
   assert.equal(await page.locator('.gTop .gBrandWord').textContent(),'Cinelva');
   assert.ok(await page.locator('.gTop .gBrandImage').evaluate(async img=>{await img.decode();return img.naturalWidth>0}));
   assert.equal(await page.evaluate(()=>localStorage.getItem('cinemap-viewing-records-v1')),'{"123":{"watched":true,"rating":5}}');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow');
   assert.ok(await page.locator('meta[name="robots"][content="noindex,nofollow"]').count());
   for(const path of ['assets/411DC24B-E557-4A36-95D2-5FA3550E7BD7.png','data/backend.json','cinelva/js/data-backup.js','cinelva/manifest.webmanifest']){
    const response=await page.request.get(origin+'/'+path);assert.equal(response.status(),200,path);
   }
   await page.goto(origin+'/cinelva/my-cinemap.html',{waitUntil:'domcontentloaded'});
   await page.getByRole('link',{name:'鑑賞記録・Ocean・設定のバックアップと復元'}).click();
   assert.match(page.url(),/\/cinelva\/data-backup\.html$/);
   console.log(`${name} ${width}: original root, nested Cinelva, shared records, assets and backup PASS`);
   await context.close();
  }
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
