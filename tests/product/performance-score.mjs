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
const oceanStart=performance.now();
let oceanReady=true;
try{
  const response=await page.goto(`${base}/preview/ocean/real-fish/ecosystem.html?preview=100`,{waitUntil:'domcontentloaded',timeout:10000});
  if(!response||response.status()>=400)oceanReady=false;
  if(oceanReady)await page.waitForFunction(()=>document.querySelector('#stage')||window.CinemapOceanPerformanceRenderer,{timeout:5000});
}catch{oceanReady=false;}
const oceanMs=performance.now()-oceanStart;
const maxNav=Math.max(...timings.map(x=>x.ms));

function navPoints(ms){if(ms<1500)return 2;if(ms<3000)return 1.5;if(ms<5000)return 1;if(ms<8000)return .5;return 0;}
function oceanPoints(ms,ready){if(!ready||ms>=5000)return 0;if(ms<1500)return 2;if(ms<3000)return 1.5;return 1;}
const earned=navPoints(maxNav)+oceanPoints(oceanMs,oceanReady);
const hardFail=timings.some(x=>!x.ok||x.ms>=8000)||!oceanReady||oceanMs>=5000;
const status=hardFail?'fail':earned===4?'pass':'partial';
const rows=[];
recordMetric(rows,{id:'CROSS-PERFORMANCE',status,earned,browser:'chromium',duration_ms:Math.round(Math.max(maxNav,oceanMs)),details:JSON.stringify({timings,ocean:{ms:oceanMs,ready:oceanReady}})});
writeMetrics(metricOutputPath('performance','chromium'),rows);
await browser.close();
console.log(`Performance score ${earned}/4; maxNav=${Math.round(maxNav)}ms ocean=${Math.round(oceanMs)}ms ready=${oceanReady}`);
