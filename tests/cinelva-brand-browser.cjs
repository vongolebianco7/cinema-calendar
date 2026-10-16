const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
    const browser=await engine.launch({headless:true});
    for(const width of [390,1280]){
      const page=await browser.newPage({viewport:{width,height:844}});
      for(const route of ['index.html','my-cinemap.html','search.html','privacy.html']){
        await page.goto('http://127.0.0.1:8765/'+route,{waitUntil:'domcontentloaded'});
        if(route==='privacy.html'){
          assert.ok(await page.getByText('CINELVA',{exact:true}).count(),`${name} ${width} ${route}: name`);
        }else{
          const brand=page.locator('.gTop .gBrand');
          assert.equal(await brand.getAttribute('aria-label'),'CINELVA');
          assert.equal(await brand.locator('.gBrandWord').textContent(),'CINELVA');
          const img=brand.locator('img');
          assert.match(await img.getAttribute('src'),/411DC24B-E557-4A36-95D2-5FA3550E7BD7\.png$/);
          await img.evaluate(el=>el.decode());
          assert.ok(await img.evaluate(el=>el.naturalWidth>0));
        }
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} ${width} ${route}: overflow`);
      }
      await page.close();
      console.log(`${name} ${width}: CINELVA name, original symbol and layout PASS`);
    }
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
