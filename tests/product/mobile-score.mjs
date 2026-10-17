import {chromium, webkit} from 'playwright';
import fs from 'node:fs';
import {
  attachPageErrorCollector,
  assertNoPageOverflow,
  metricOutputPath,
  recordMetric,
  routeDeterministicMovieBackend,
  screenshotPath,
  writeMetrics,
} from './helpers/metric-harness.mjs';

const base = process.env.CINEMAP_BASE_URL || 'http://127.0.0.1:4173';
const browserName = process.env.CINEMAP_BROWSER || 'chromium';
const browserType = {chromium, webkit}[browserName];
if (!browserType) throw new Error(`Unsupported browser ${browserName}`);

const pages = [
  ['calendar', 'index.html'],
  ['discover', 'discover.html'],
  ['search', 'search.html'],
  ['rankings', 'rankings.html'],
  ['theaters', 'theaters.html'],
  ['experience', 'experience.html'],
  ['my-cinemap', 'my-cinemap.html'],
  ['critic', 'critic.html'],
  ['data-backup', 'data-backup.html'],
];

const browser = await browserType.launch();
const watchdog=setTimeout(()=>{console.error(`${browserName}: mobile score exceeded 150 seconds; terminating hung browser`);process.exit(124)},150000);
watchdog.unref();
const context = await browser.newContext({viewport:{width:390,height:844}, deviceScaleFactor:3});
await routeDeterministicMovieBackend(context);
fs.mkdirSync('artifacts/completeness/screenshots',{recursive:true});

const rows = [];
const observations = new Map();
for (const [area, path] of pages) {
  console.log(`${browserName}: scoring ${area} (${path})`);
  const page = await context.newPage();
  const errors = attachPageErrorCollector(page);
  let response = null;
  let navigationError = null;
  try {
    response = await page.goto(`${base}/${path}`, {waitUntil:'domcontentloaded', timeout:30000});
    await page.waitForTimeout(250);
  } catch (error) {
    navigationError = error;
  }
  const overflow = navigationError ? {pass:false, overflow:9999} : await assertNoPageOverflow(page);
  const loaded = Boolean(response && response.status() < 400 && !navigationError);
  const clean = errors.length === 0 && !navigationError;
  observations.set(area,{loaded,clean,overflow:overflow.pass,status:response?.status?.(),errors,overflowPx:overflow.overflow});
  if (!navigationError) {
    const height=await page.evaluate(()=>document.documentElement.scrollHeight);
    await page.screenshot({path:screenshotPath(area,browserName),fullPage:height<=10000,timeout:20000,animations:'disabled'});
  }
  await page.close();
}

function emit(id, points, pass, details) {
  recordMetric(rows,{id,status:pass?'pass':'fail',earned:pass?points:0,browser:browserName,details});
}
const detail = area => JSON.stringify(observations.get(area));

const cal = observations.get('calendar');
emit('CAL-01',0.5,cal.loaded,detail('calendar'));
emit('CAL-02',1.0,cal.clean,detail('calendar'));
emit('CAL-03',1.0,cal.overflow,detail('calendar'));

const discover = observations.get('discover');
emit('DISC-01',0.5,discover.loaded,detail('discover'));
emit('DISC-02',1.0,discover.clean,detail('discover'));
emit('DISC-03',0.5,discover.overflow,detail('discover'));

const my = observations.get('my-cinemap');
emit('MY-08',1.0,my.overflow,detail('my-cinemap'));
emit('MY-09',1.0,my.loaded&&my.clean,detail('my-cinemap'));

const mobilePass = [...observations.values()].every(x=>x.loaded&&x.clean&&x.overflow);
emit('CROSS-MOBILE',5.0,mobilePass,JSON.stringify(Object.fromEntries(observations)));

writeMetrics(metricOutputPath('mobile',browserName),rows);
await browser.close();
clearTimeout(watchdog);
console.log(`Wrote ${rows.length} mobile score metrics for ${browserName}`);
