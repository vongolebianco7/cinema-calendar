import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit} from 'playwright';
const name=process.env.CINEMAP_BROWSER||'chromium';
const browser=await ({chromium,webkit}[name]).launch();
const base=process.env.CINELVA_PROTOTYPE_BASE||'http://127.0.0.1:4173/preview/my-cinelva/';
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
fs.mkdirSync('artifacts/library-prototype',{recursive:true});
try {
 await page.goto(base,{waitUntil:'domcontentloaded'});
 const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=2,'390px page must not overflow');
 for(const tab of ['映画棚','映画地図','プロフィール']){
  await page.getByRole('tab',{name:new RegExp(tab)}).click();await noOverflow();
  assert.equal(await page.getByRole('tab',{name:new RegExp(tab)}).getAttribute('aria-selected'),'true');
  await page.screenshot({path:`artifacts/library-prototype/${name}-${tab}.png`,fullPage:true});
 }
 await page.getByRole('tab',{name:/映画地図/}).click();
 await page.locator('.cell:not([data-level="0"])').first().click();
 assert.ok(await page.locator('#mapDrill .movie').count()>0,'map drilldown shows matching films');
 await page.getByLabel('試作する記録件数').selectOption('0');
 await page.getByRole('tab',{name:/映画棚/}).click();
 assert.ok(await page.getByRole('heading',{name:'ここから、映画棚がはじまる。'}).isVisible());
 await page.getByRole('button',{name:'＋ 採点を試す',exact:true}).click();
 await page.locator('[data-pick]').first().click();
 await page.getByLabel('あなたの評価',{exact:true}).press('Home');
 await page.getByRole('button',{name:'この点数で記録'}).click();
 assert.equal(await page.locator('#summary .stat').last().locator('b').innerText(),'1');
 assert.equal(await page.locator('#shelfContent .score').first().innerText(),'0.0');
 await page.locator('#shelfContent .movie').first().click();
 await page.getByLabel('あなたの評価',{exact:true}).press('End');
 for(let i=0;i<8;i++)await page.getByLabel('あなたの評価',{exact:true}).press('ArrowLeft');
 await page.getByRole('button',{name:'この点数で記録'}).click();
 assert.equal(await page.locator('#summary .stat').last().locator('b').innerText(),'1');
 await page.getByRole('button',{name:'カレンダー',exact:true}).click();
 assert.equal(await page.locator('.day.has').count(),0,'unknown date must not populate calendar');
 await page.getByLabel('試作する記録件数').selectOption('1000');
 await page.getByRole('button',{name:'ポスター',exact:true}).click();
 assert.equal(await page.locator('#shelfContent .movie').count(),60,'large collection paginates posters');
 assert.equal(await page.locator('#summary .stat').last().locator('b').innerText(),'1,000');
 for(const tab of ['映画棚','映画地図','プロフィール']){await page.getByRole('tab',{name:new RegExp(tab)}).click();await noOverflow();}
 await page.getByRole('button',{name:'ダーク表示に切り替える'}).click();
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await noOverflow();
 await page.screenshot({path:`artifacts/library-prototype/${name}-dark.png`,fullPage:true});
 assert.deepEqual(errors,[],'no page errors');
 console.log(`${name}: three screens, map drilldown, score-zero, edit, unknown date, empty/1000 and dark theme passed`);
} finally {await browser.close();}
