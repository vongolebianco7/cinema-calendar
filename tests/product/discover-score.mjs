import {chromium,webkit} from 'playwright';
import {metricOutputPath,recordMetric,writeMetrics} from './helpers/metric-harness.mjs';

const base=process.env.CINEMAP_BASE_URL||'http://127.0.0.1:4173';
const browserName=process.env.CINEMAP_BROWSER||'chromium';
const browserType={chromium,webkit}[browserName];
if(!browserType)throw new Error(`Unsupported browser ${browserName}`);
const movies=[
  {tmdbId:'d-beta',title:'Beta',year:2020,date:'2020-01-01',score:7.0,votes:200,popularity:20,runtime:95},
  {tmdbId:'d-alpha',title:'Alpha',year:2024,date:'2024-01-01',score:9.0,votes:500,popularity:30,runtime:120},
  {tmdbId:'d-gamma',title:'Gamma',year:2018,date:'2018-01-01',score:8.0,votes:300,popularity:10,runtime:140},
];
const browser=await browserType.launch();
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
await context.route('**/api/calendar*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movies:[]})}));
await context.route('**/api/movies?*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movies,external:[]})}));
await context.route('**/api/discover?*',route=>{
  const url=new URL(route.request().url()),from=Number(url.searchParams.get('from')||0),to=Number(url.searchParams.get('to')||9999),rating=Number(url.searchParams.get('rating')||0),country=url.searchParams.get('country')||'';
  let filtered=movies.filter(m=>Number(m.year)>=from&&Number(m.year)<=to&&Number(m.score)>=rating);
  if(country==='DE')filtered=[];
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movies:filtered,total_results:filtered.length,total_pages:1})});
});
const rows=[];const emit=(id,points,pass,details='',earned=pass?points:0)=>recordMetric(rows,{id,status:pass?'pass':'fail',earned,browser:browserName,details});
const page=await context.newPage();
await page.goto(`${base}/discover.html`,{waitUntil:'domcontentloaded'});
await page.locator('#apply').click();
await page.waitForFunction(()=>document.querySelectorAll('#grid .card').length===3,{timeout:5000}).catch(()=>{});

// DISC-04: actual computed grid has three equal columns on mobile.
const columns=await page.locator('#grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length).catch(()=>0);
emit('DISC-04',1,columns===3,`computed columns=${columns}`);

// DISC-05: header keyword search reaches search.html and returns the deterministic fixture set.
let keyword=false;
try{
  const input=page.locator('.gSearch').first();await input.fill('Alpha');await input.press('Enter');await page.waitForURL('**/search.html?search=*',{timeout:5000});await page.waitForSelector('#grid .card',{timeout:5000});keyword=(await page.locator('#grid .title').allTextContents()).includes('Alpha');
}catch{}
emit('DISC-05',1,keyword,'global keyword search returns fixture result');
await page.goto(`${base}/discover.html`,{waitUntil:'domcontentloaded'});await page.locator('#apply').click();await page.waitForFunction(()=>document.querySelectorAll('#grid .card').length===3,{timeout:5000}).catch(()=>{});

// DISC-06: filter request changes result set.
await page.locator('#era').selectOption('2020');await page.locator('#apply').click();await page.waitForTimeout(120);
const filteredTitles=await page.locator('#grid .title').allTextContents();const filterWorks=filteredTitles.length===1&&filteredTitles[0]==='Beta';
emit('DISC-06',1,filterWorks,JSON.stringify(filteredTitles));

async function resetResults(){await page.locator('#era').selectOption('');await page.locator('#country').selectOption('');await page.locator('#rating').selectOption('');await page.locator('#apply').click();await page.waitForFunction(()=>document.querySelectorAll('#grid .card').length===3,{timeout:5000}).catch(()=>{});}
async function sortAndTitles(value){const select=page.locator('#movieGridSortSelect');await select.selectOption(value);await page.waitForTimeout(60);return page.locator('#grid .title').allTextContents();}
await resetResults();
const yearOrder=await sortAndTitles('year-desc');emit('DISC-07',.75,JSON.stringify(yearOrder)===JSON.stringify(['Alpha','Beta','Gamma']),JSON.stringify(yearOrder));
const scoreOrder=await sortAndTitles('score-desc');emit('DISC-08',.75,JSON.stringify(scoreOrder)===JSON.stringify(['Alpha','Gamma','Beta']),JSON.stringify(scoreOrder));
const titleOrder=await sortAndTitles('title-asc');emit('DISC-09',.5,JSON.stringify(titleOrder)===JSON.stringify(['Alpha','Beta','Gamma']),JSON.stringify(titleOrder));

// DISC-10: active filter survives sort and stays reflected in results.
await page.locator('#era').selectOption('2020');await page.locator('#apply').click();await page.waitForTimeout(100);await page.locator('#movieGridSortSelect').selectOption('title-asc');await page.waitForTimeout(60);
const coexist=await page.locator('#era').inputValue()==='2020'&&JSON.stringify(await page.locator('#grid .title').allTextContents())===JSON.stringify(['Beta']);
emit('DISC-10',1,coexist,'filter value and result survive sort');

// DISC-11: detail/back should preserve the active discover state.
let stateBack=false;
try{await page.locator('#grid .card').first().click();await page.waitForURL('**/search.html?*',{timeout:5000});await page.goBack({waitUntil:'domcontentloaded'});await page.waitForTimeout(150);stateBack=await page.locator('#era').inputValue()==='2020';}catch{}
emit('DISC-11',1,stateBack,'detail/back preserves era=2020');

// DISC-12: deterministic empty result shows deliberate zero state.
await page.goto(`${base}/discover.html`,{waitUntil:'domcontentloaded'});await page.locator('#country').selectOption('DE');await page.locator('#apply').click();await page.waitForTimeout(100);
const emptyText=await page.locator('#grid').innerText().catch(()=>''),zero=emptyText.includes('条件に合う作品がありません');emit('DISC-12',1,zero,emptyText);

writeMetrics(metricOutputPath('discover',browserName),rows);await browser.close();console.log(`Wrote ${rows.length} Discover metrics for ${browserName}`);
