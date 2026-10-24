const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const engine=require('playwright')[process.env.CINELVA_BROWSER||'chromium'];
(async()=>{const browser=await engine.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-25T00:00:00Z')});
 await page.route('**/*',async route=>{const u=new URL(route.request().url());
  if(u.pathname==='/api/boxoffice-world'){requests.push(u.toString());return route.fulfill({headers:{'access-control-allow-origin':'*'},json:{movies:[{id:1001,title:'World One',year:'2026',release_date:'2026-01-01',revenue:2000000000,currency:'USD',displayRank:1},{id:1002,title:'World Two',year:'2026',release_date:'2026-02-01',revenue:1000000000,currency:'USD',displayRank:2}],market:'worldwide',currency:'USD',checked_at:'2026-10-25',has_more:false,partial:false}})}
  if(u.hostname!=='cinelva.test')return route.fulfill({status:503,headers:{'access-control-allow-origin':'*'},body:'{}'});
  if(u.pathname==='/data/rankings.json')return route.fulfill({json:{rankings:{}}});
  const name=path.resolve('.'+decodeURIComponent(u.pathname));if(!name.startsWith(process.cwd()+path.sep)||!fs.existsSync(name)||fs.statSync(name).isDirectory())return route.fulfill({status:404,body:''});
  return route.fulfill({body:fs.readFileSync(name),contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.json')?'application/json':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'text/html'});
 });
 await page.goto('http://cinelva.test/rankings.html?axis=boxoffice&boxYear=2026');
 await page.locator('[data-box-film]').first().waitFor();assert.equal(await page.locator('[data-box-film]').count(),12);
 assert.match(await page.locator('#sourceNote').innerText(),/全国全配給会社の年間ランキングではありません/);assert.match(await page.locator('#sourceNote').innerText(),/2026-09-30/);
 await page.locator('[data-box-market="worldwide"]').click();await page.getByText('World One',{exact:true}).waitFor();
 assert.equal(new URL(requests.at(-1)).searchParams.get('year'),'2026');assert.match(await page.locator('#boxMarketNote').innerText(),/米ドル/);assert.match(await page.locator('#boxMarketNote').innerText(),/初公開年/);
 assert.match(await page.locator('#grid').innerText(),/\$2,000,000,000/);assert.doesNotMatch(await page.locator('#grid').innerText(),/億円/);
 await page.selectOption('#movieGridSortSelect','title-asc');await page.selectOption('#movieGridSortSelect','gross-desc');assert.deepEqual(await page.locator('#grid .title').allTextContents(),['World One','World Two']);
 await page.locator('[data-box-market="Japan"]').click();await page.locator('[data-box-film]').first().waitFor();assert.equal(await page.locator('[data-box-film]').count(),12);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('PASS Japan2026 official partial coverage, worldUSD primary-year, sorting, return and390px');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
