import {chromium,webkit} from 'playwright';
import {assertNoPageOverflow,attachPageErrorCollector,metricOutputPath,recordMetric,writeMetrics} from '../product/helpers/metric-harness.mjs';

const base=process.env.CINEMAP_BASE_URL||'http://127.0.0.1:4173';
const browserName=process.env.CINEMAP_BROWSER||'chromium';
const browserType={chromium,webkit}[browserName];
if(!browserType)throw new Error(`Unsupported browser ${browserName}`);
const emptyDna={directors:[],writers:[],cinematography:[],music:[],editing:[],production:[]};
const movie={id:'mobile-fixture',tmdbId:'mobile-fixture',title:'Mobile Fixture Film',year:2026,date:'2026-10-01',score:8.0,runtime:100,genres:['ドラマ'],cast:[],countries:['日本'],director:'Director',overview:'detail fixture',availability:{},dna:emptyDna,related:[],director_works:[]};
const evidence={films:{'mobile-fixture':{title:movie.title,year:2026,sources:[{id:'a',name:'A',url:'https://example.com/a'},{id:'b',name:'B',url:'https://example.org/b'},{id:'c',name:'C',url:'https://example.net/c'}],overview:{text:'verified summary',sourceIds:['a','b','c']},positive:[],divided:[],stances:[]}}};
const browser=await browserType.launch();const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
await context.route('**/api/movie-detail?*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movie})}));
await context.route('**/data/critic_evidence.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(evidence)}));
const rows=[];
async function score(id,points,url,ready){const page=await context.newPage(),errors=attachPageErrorCollector(page);let loaded=false,overflow={pass:false,overflow:9999};try{const r=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});await ready(page);loaded=Boolean(r&&r.status()<400);overflow=await assertNoPageOverflow(page);}catch{}const pass=loaded&&errors.length===0&&overflow.pass;recordMetric(rows,{id,status:pass?'pass':'fail',earned:pass?points:0,browser:browserName,details:JSON.stringify({loaded,errors,overflowPx:overflow.overflow})});await page.close();}
await score('DETAIL-12',1,`${base}/search.html?id=mobile-fixture&search=Mobile%20Fixture%20Film`,async p=>{await p.waitForSelector('#detail h2',{timeout:8000});});
await score('CRIT-06',.5,`${base}/critic.html?id=mobile-fixture&search=Mobile%20Fixture%20Film`,async p=>{await p.waitForSelector('h1',{timeout:8000});const b=p.locator('#unlock');if(await b.count())await b.click();await p.waitForTimeout(100);});
writeMetrics(metricOutputPath('detail-mobile',browserName),rows);await browser.close();console.log(`Wrote ${rows.length} detail/critic mobile metrics for ${browserName}`);
