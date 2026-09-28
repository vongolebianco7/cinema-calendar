import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4173/preview/ocean/ocean-demo.html?view=dashboard';
const storageKey = 'cinemap-ocean-demo-records-v1';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
async function assertDashboardVisible(label,{requireCanvas=true}={}){await page.waitForSelector('#dashboard:not([hidden])',{state:'visible',timeout:5000});if(!(await page.locator('#dashboard .toolbar').isVisible())||!(await page.locator('#speciesCollection').isVisible()))throw new Error(`${label}: essential dashboard content unavailable`);if(requireCanvas&&!(await page.locator('.ocean3dCanvas').count()))throw new Error(`${label}: canvas missing`);if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1))throw new Error(`${label}: iPhone overflow`)}
try{
 const response=await page.goto(base,{waitUntil:'domcontentloaded'});if(!response||response.status()>=400)throw new Error(`Ocean HTTP ${response?.status()}`);await page.waitForFunction(()=>window.CinemapRecords&&window.CinemapOceanModel);await assertDashboardVisible('zero');
 const beforeText=await page.locator('#speciesCollection').innerText();
 await page.evaluate(key=>{localStorage.removeItem(key);CinemapRecords.clear();const film={id:129,title:'千と千尋の神隠し',year:2001,genres:['アニメ'],region:'日本',director:'宮崎駿'};if(!CinemapRecords.rate(film,4.5))throw new Error('rating rejected')},storageKey);
 await page.waitForFunction(()=>document.querySelector('#speciesCollection')?.textContent?.includes('最新の生命'));
 const afterText=await page.locator('#speciesCollection').innerText();if(afterText===beforeText||!afterText.includes('から誕生'))throw new Error('Phase 2: one rating did not create visible life feedback');
 const coverage=await page.locator('#coverage').innerText();if(!coverage.includes('海の豊かさ'))throw new Error('Phase 2: environment growth is not visible');
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.CinemapRecords&&window.CinemapOceanModel);await assertDashboardVisible('reload');if(!(await page.locator('#speciesCollection').innerText()).includes('最新の生命'))throw new Error('Phase 2: growth state did not survive reload');
 await page.route('**/renderer/dist/ocean-pages.js',route=>route.abort());await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.CinemapRecords&&window.CinemapOceanModel);await assertDashboardVisible('renderer failure',{requireCanvas:false});await page.waitForSelector('.ocean3dError:not([hidden])',{state:'visible',timeout:5000});
 if(errors.length)throw new Error(errors.join('\n'));console.log('Ocean Phase 2 loop passed: rate -> visible new life -> environment growth -> reload -> renderer fallback.');
}finally{await browser.close()}
