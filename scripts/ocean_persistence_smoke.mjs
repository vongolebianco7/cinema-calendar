import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4173/preview/ocean/ocean-demo.html?view=dashboard';
const storageKey = 'cinemap-ocean-demo-records-v1';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));

async function assertDashboardVisible(label, { requireCanvas = true } = {}) {
  await page.waitForSelector('#dashboard:not([hidden])', { state: 'visible', timeout: 5000 });
  const visible = await page.locator('#dashboard').isVisible();
  const controls = await page.locator('#dashboard .toolbar').isVisible();
  const species = await page.locator('#speciesCollection').isVisible();
  const canvas = await page.locator('.ocean3dCanvas').count();
  if (!visible) throw new Error(`${label}: Ocean dashboard is hidden`);
  if (!controls || !species) throw new Error(`${label}: essential non-3D dashboard content is unavailable`);
  if (requireCanvas && !canvas) throw new Error(`${label}: Ocean 3D canvas was not mounted`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error(`${label}: Ocean page overflows the iPhone viewport`);
}

async function seedRecord() {
  return page.evaluate(key => {
    localStorage.removeItem(key);
    CinemapRecords.clear();
    const film = { id: 129, title: '千と千尋の神隠し', year: 2001, genres: ['アニメ'], region: '日本', director: '宮崎駿' };
    if (!CinemapRecords.rate(film, 4.5)) throw new Error('record: rating was rejected');
    const records = CinemapRecords.read();
    const ecology = CinemapOceanModel.ecosystem(records, [film]);
    return { record: records['129'], watched: ecology.watched, discovered: ecology.discovered, environment: ecology.environment, stored: localStorage.getItem(key) };
  }, storageKey);
}

try {
  let response = await page.goto(base, { waitUntil: 'domcontentloaded' });
  if (!response || response.status() >= 400) throw new Error(`Ocean page HTTP ${response?.status() ?? 'no response'}`);
  await page.waitForFunction(() => window.CinemapRecords && window.CinemapOceanModel);
  await assertDashboardVisible('zero-record initial');

  const before = await seedRecord();
  if (before.record?.rating !== 4.5 || before.watched !== 1 || before.discovered.length !== 1) throw new Error(`grow: unexpected ecosystem after record ${JSON.stringify(before)}`);
  if (!before.stored) throw new Error('persist: localStorage was not written');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.CinemapRecords && window.CinemapOceanModel);
  await assertDashboardVisible('existing-record reload');
  const after = await page.evaluate(() => { const records=CinemapRecords.read(); const record=records['129']; const ecology=CinemapOceanModel.ecosystem(records,[record]); return {record,watched:ecology.watched,discovered:ecology.discovered,environment:ecology.environment}; });
  if (after.record?.rating !== 4.5 || after.watched !== 1) throw new Error(`reload: record did not survive reload ${JSON.stringify(after)}`);
  if (JSON.stringify(after.discovered) !== JSON.stringify(before.discovered)) throw new Error('model: species changed across reload');
  if (JSON.stringify(after.environment) !== JSON.stringify(before.environment)) throw new Error('model: environment changed across reload');

  // Renderer failure must degrade locally: the rest of the dashboard remains usable.
  await page.route('**/renderer/dist/ocean-pages.js', route => route.abort());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.CinemapRecords && window.CinemapOceanModel);
  await assertDashboardVisible('renderer-failure fallback', { requireCanvas: false });
  await page.waitForSelector('.ocean3dError:not([hidden])', { state: 'visible', timeout: 5000 });
  if (!(await page.locator('#dashboard .action').first().isVisible())) throw new Error('renderer-failure fallback: primary action disappeared');

  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Ocean Phase 1 resilience passed: zero records -> existing record -> reload -> renderer failure fallback, all within iPhone viewport.');
} finally { await browser.close(); }
