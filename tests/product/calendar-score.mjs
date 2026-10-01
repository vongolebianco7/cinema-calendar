import {chromium,webkit} from 'playwright';
import {metricOutputPath,recordMetric,writeMetrics} from './helpers/metric-harness.mjs';

const base=process.env.CINEMAP_BASE_URL||'http://127.0.0.1:4173';
const browserName=process.env.CINEMAP_BROWSER||'chromium';
const browserType={chromium,webkit}[browserName];
if(!browserType)throw new Error(`Unsupported browser ${browserName}`);
const fixture={id:'cal-fixture',tmdbId:'cal-fixture',title:'Calendar Fixture Film',date:'2026-10-01',year:2026,event:'theatrical',service:'劇場公開',score:8.1,poster:null,genres:['ドラマ']};
const browser=await browserType.launch();const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
await context.route('**/api/calendar*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movies:[fixture]})}));
await context.route('**/api/movie-detail?*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({movie:{...fixture,runtime:100,countries:['日本'],cast:[],director:'Director',overview:'fixture',availability:{},dna:{directors:[],writers:[],cinematography:[],music:[],editing:[],production:[]},related:[],director_works:[]}})}));
const rows=[];const emit=(id,points,pass,details='')=>recordMetric(rows,{id,status:pass?'pass':'fail',earned:pass?points:0,browser:browserName,details});
const page=await context.newPage();await page.goto(`${base}/index.html`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(500);

const body=await page.locator('body').innerText();const cardVisible=body.includes(fixture.title);emit('CAL-05',1,cardVisible,'fixture title rendered in calendar');
let opensDetail=false,backRestored=false;
if(cardVisible){
  const clickable=page.getByText(fixture.title,{exact:true}).first();
  if(await clickable.count()){
    const before=page.url();await clickable.click().catch(()=>{});await page.waitForTimeout(180);
    const now=page.url(),modalText=await page.locator('#detail,.modal,.sheet').allInnerTexts().catch(()=>[]);
    opensDetail=(now!==before&&/search\.html/.test(now))||modalText.join(' ').includes(fixture.title);
    if(now!==before){await page.goBack({waitUntil:'domcontentloaded'}).catch(()=>{});await page.waitForTimeout(150);backRestored=(await page.locator('body').innerText()).includes(fixture.title);}else backRestored=(await page.locator('body').innerText()).includes(fixture.title);
  }
}
emit('CAL-06',1,opensDetail,'fixture card opens detail or detail modal');

const dayCount=await page.locator('.day').count();const movieMarkers=await page.locator('.calGroup,.dot,.streamMovie').count();const emptyStateUsable=dayCount>=7&&dayCount>movieMarkers;emit('CAL-08',.5,emptyStateUsable,`days=${dayCount} markers=${movieMarkers}`);
emit('CAL-09',.5,backRestored,'calendar remains usable after detail/back');

const tabs=page.locator('.modeTab');let controls=false;if(await tabs.count()>=2){const second=tabs.nth(1);const visible=await second.isVisible().catch(()=>false);if(visible){await second.click();await page.waitForTimeout(100);controls=await second.evaluate(el=>el.classList.contains('active')).catch(()=>false);}}
emit('CAL-10',.5,controls,'mode tab can be tapped and becomes active');
writeMetrics(metricOutputPath('calendar',browserName),rows);await browser.close();console.log(`Wrote ${rows.length} Calendar metrics for ${browserName}`);
