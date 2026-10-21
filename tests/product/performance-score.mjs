import {chromium} from 'playwright';
import {layoutShiftScore,performanceBudgetPass} from './helpers/performance-budget.mjs';
import {metricOutputPath,recordMetric,writeMetrics} from './helpers/metric-harness.mjs';

const base=process.env.CINEMAP_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
const pages=['index.html','discover.html','my-cinelva/'];
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
const activeCases=[];
for(const width of [390,1280])for(const count of [0,1000]){
 const isolated=await browser.newContext({viewport:{width,height:844}});
 await isolated.route('https://backend-one-gray-94.vercel.app/**',route=>route.abort());
 await isolated.route('https://image.tmdb.org/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYl8AAAAASUVORK5CYII=','base64')}));
 await isolated.addInitScript(size=>{
  const records={};for(let i=0;i<size;i++)records[String(9000000+i)]={id:String(9000000+i),_localRecord:true,title:'性能検証 '+String(i).padStart(4,'0'),rating:4,watchedAt:'2026-06-15',year:2000+i%20,genres:['ドラマ'],countries:['日本'],viewingMethod:i%2?'映画館':'配信'};
  localStorage.setItem('cinelva-library-records-v2',JSON.stringify(records));localStorage.setItem('cinelva-theme-v1','light');
  window.__cinelvaPerf={supported:PerformanceObserver.supportedEntryTypes?.includes('layout-shift')||false,entries:[]};
  if(window.__cinelvaPerf.supported){
   const collect=entries=>window.__cinelvaPerf.entries.push(...entries.map(e=>({value:e.value,startTime:e.startTime,hadRecentInput:e.hadRecentInput})));
   const observer=new PerformanceObserver(list=>collect(list.getEntries()));observer.observe({type:'layout-shift',buffered:true});
   window.__cinelvaPerf.flush=()=>collect(observer.takeRecords());
  }
 },count);
 const active=await isolated.newPage(),errors=[];active.on('pageerror',error=>errors.push(error.message));
 const started=performance.now();let measured={width,count,supported:false,cls:null,ready_ms:null,interaction_ms:null,errors};
 try{
  const response=await active.goto(`${base}/my-cinelva/`,{waitUntil:'domcontentloaded',timeout:10000});
  if(!response?.ok())throw Error('record dashboard HTTP '+response?.status());
  await active.waitForFunction(size=>window.CinelvaLibraryRecords?.all().length===size&&document.getElementById('csLifetime')?.textContent===String(size),count,{timeout:10000});
  await active.waitForLoadState('networkidle');
  await active.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  measured.ready_ms=performance.now()-started;
  const shifts=await active.evaluate(()=>{window.__cinelvaPerf.flush?.();return {supported:window.__cinelvaPerf.supported,entries:window.__cinelvaPerf.entries};});
  measured.supported=shifts.supported;measured.cls=shifts.supported?layoutShiftScore(shifts.entries):null;
  const interactionStarted=performance.now();await active.locator('[data-tab="records"]').click();
  await active.locator('#recordSearch').fill(count?'性能検証 0999':'一致しない作品');
  await active.waitForFunction(size=>{const list=document.getElementById('recordList');return size?list?.children.length===1&&list.textContent.includes('性能検証 0999'):Boolean(list?.querySelector('.empty'));},count,{timeout:10000});
  await active.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  measured.interaction_ms=performance.now()-interactionStarted;
 }catch(error){measured.error=error.message;}
 measured.pass=performanceBudgetPass(measured)&&!measured.error&&!errors.length;
 activeCases.push(measured);await isolated.close();
}
const maxNav=Math.max(...timings.map(x=>x.ms));

function navPoints(ms){if(ms<1500)return 2;if(ms<3000)return 1.5;if(ms<5000)return 1;if(ms<8000)return .5;return 0;}
function recordsPoints(ms,ready){if(!ready||ms>=5000)return 0;if(ms<1500)return 2;if(ms<3000)return 1.5;return 1;}
const measuredPoints=navPoints(maxNav)+recordsPoints(recordsMs,recordsReady);
const hardFail=timings.some(x=>!x.ok||x.ms>=8000)||!recordsReady||recordsMs>=5000||activeCases.some(row=>!row.pass);
const earned=hardFail?0:measuredPoints;
const status=hardFail?'fail':earned===4?'pass':'partial';
const rows=[];
recordMetric(rows,{id:'CROSS-PERFORMANCE',status,earned,browser:'chromium',duration_ms:Math.round(Math.max(maxNav,recordsMs)),details:JSON.stringify({timings,records:{ms:recordsMs,ready:recordsReady},activeCases,scope:"Synthetic isolated0/1000records, local server, Chromium390/1280px. Not real-device or field-user performance."})});
writeMetrics(metricOutputPath('performance','chromium'),rows);
await browser.close();
console.log(`Performance score ${earned}/4; maxNav=${Math.round(maxNav)}ms records=${Math.round(recordsMs)}ms ready=${recordsReady}`);
console.log('Active dashboard performance:',JSON.stringify(activeCases));
if(hardFail)process.exitCode=1;
