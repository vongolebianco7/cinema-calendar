import {chromium} from 'playwright';
import {metricOutputPath,recordMetric,writeMetrics} from './helpers/metric-harness.mjs';

const base=process.env.CINEMAP_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
const pages=['index.html','discover.html','my-cinemap.html'];
const timings=[];
for(const path of pages){
  const start=performance.now();
  let ok=true;
  try{const response=await page.goto(`${base}/${path}`,{waitUntil:'domcontentloaded',timeout:10000});ok=Boolean(response&&response.status()<400);}catch{ok=false;}
  timings.push({path,ms:performance.now()-start,ok});
}
const recordsStart=performance.now();
let recordsReady=true;
try{
  const response=await page.goto(`${base}/my-cinelva/`,{waitUntil:'domcontentloaded',timeout:10000});
  if(!response||response.status()>=400)recordsReady=false;
  if(recordsReady)await page.waitForFunction(()=>document.querySelector('main'),{timeout:5000});
}catch{recordsReady=false;}
const recordsMs=performance.now()-recordsStart;
const maxNav=Math.max(...timings.map(x=>x.ms));

function navPoints(ms){if(ms<1500)return 2;if(ms<3000)return 1.5;if(ms<5000)return 1;if(ms<8000)return .5;return 0;}
function recordsPoints(ms,ready){if(!ready||ms>=5000)return 0;if(ms<1500)return 2;if(ms<3000)return 1.5;return 1;}
const earned=navPoints(maxNav)+recordsPoints(recordsMs,recordsReady);
const hardFail=timings.some(x=>!x.ok||x.ms>=8000)||!recordsReady||recordsMs>=5000;
const status=hardFail?'fail':earned===4?'pass':'partial';
const rows=[];
recordMetric(rows,{id:'CROSS-PERFORMANCE',status,earned,browser:'chromium',duration_ms:Math.round(Math.max(maxNav,recordsMs)),details:JSON.stringify({timings,records:{ms:recordsMs,ready:recordsReady}})});
writeMetrics(metricOutputPath('performance','chromium'),rows);
await browser.close();
console.log(`Performance score ${earned}/4; maxNav=${Math.round(maxNav)}ms records=${Math.round(recordsMs)}ms ready=${recordsReady}`);
