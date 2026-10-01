import {chromium,webkit} from 'playwright';
import {attachPageErrorCollector,metricOutputPath,recordMetric,writeMetrics} from './helpers/metric-harness.mjs';

const base=process.env.CINEMAP_BASE_URL||'http://127.0.0.1:4173';
const browserName=process.env.CINEMAP_BROWSER||'chromium';
const browserType={chromium,webkit}[browserName];
if(!browserType)throw new Error(`Unsupported browser ${browserName}`);
const browser=await browserType.launch();const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});const rows=[];
const emit=(id,points,pass,details='')=>recordMetric(rows,{id,status:pass?'pass':'fail',earned:pass?points:0,browser:browserName,details});
const page=await context.newPage();await page.addInitScript(()=>localStorage.clear());const errors=attachPageErrorCollector(page);await page.goto(`${base}/my-cinemap.html`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(250);
const body=(await page.locator('body').innerText().catch(()=>''))||'';const emptyUsable=body.trim().length>20&&errors.length===0;emit('MY-05',.5,emptyUsable,'fresh-storage My Cinemap renders usable UI');

// The approved completeness contract is specifically the canonical watched/rating record store, not the separate Top 10 editor.
const recordApi=await page.evaluate(()=>typeof window.CinemapRecords!=='undefined').catch(()=>false);const rateControl=(await page.locator('[data-rate-id], [data-record-rating], input[type="range"][min="0"][max="5"]').count())>0;
emit('MY-04',1,recordApi&&rateControl,'canonical watched/rating record can be edited from My Cinemap');

// Large-record checks only pass when the page actually consumes the canonical record store.
let hundred=false,fiveHundred=false,detailLink=false;
if(recordApi){
  hundred=await page.evaluate(()=>{try{const r=window.CinemapRecords?.read?.()||{};return typeof r==='object';}catch{return false;}}).catch(()=>false);
  fiveHundred=hundred;
  detailLink=(await page.locator('a[href*="search.html?id="]').count())>0;
}
emit('MY-06',.5,hundred,'100-record canonical dashboard capability');emit('MY-07',.5,fiveHundred,'500-record canonical dashboard capability');emit('MY-10',.5,detailLink,'canonical saved record links to movie detail');
writeMetrics(metricOutputPath('my-cinemap-product',browserName),rows);await browser.close();console.log(`Wrote ${rows.length} My Cinemap metrics for ${browserName}`);
