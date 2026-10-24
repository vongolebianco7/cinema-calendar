const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
    const browser=await engine.launch({headless:true});
    try {
    for(const width of [390,1280]){
      const page=await browser.newPage({viewport:{width,height:844}});
      for(const route of ['index.html','my-cinemap.html','search.html','privacy.html']){
        console.log(`${name} ${width}: checking ${route}`);
        const response=await page.goto('http://127.0.0.1:8765/'+route,{waitUntil:'domcontentloaded'});
        if(route==='privacy.html'){
          assert.ok(await page.getByText('Cinelva',{exact:true}).count(),`${name} ${width} ${route}: name`);
        }else{
          const brand=page.locator('header .gBrand');
          assert.equal(await brand.getAttribute('aria-label'),'Cinelva');
          assert.equal(await brand.locator('.gBrandWord').textContent(),'Cinelva');
          const img=brand.locator('img');
          const expected='assets/cinelva_original_colors_transparent.png';
          // Every route must preserve the supplied image, including its frame.
          const declared=(await response.text()).match(/<img\b[^>]*class="gBrandImage"[^>]*src="([^"]+)"/);
          assert.equal(declared?.[1].split('?')[0],expected);
          const rendered=await img.getAttribute('src');
          assert.ok(rendered.split('?')[0]===expected);
          await img.evaluate(el=>el.decode());
          assert.ok(await img.evaluate(el=>el.naturalWidth>0));
        }
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} ${width} ${route}: overflow`);
      }
      await page.close();
      console.log(`${name} ${width}: Cinelva name, original symbol and layout PASS`);
    }
    } finally { await browser.close(); }
  }
})().catch(e=>{console.error(e);process.exitCode=1});
