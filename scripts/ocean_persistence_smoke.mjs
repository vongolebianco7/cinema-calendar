import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4173/preview/ocean/ocean-demo.html?view=dashboard';
const storageKey = 'cinemap-ocean-demo-records-v1';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));

async function assertDashboardVisible(label) {
  await page.waitForSelector('#dashboard:not([hidden])', { state: 'visible', timeout: 5000 });
  const visible = await page.locator('#dashboard').isVisible();
  const canvas = await page.locator('.ocean3dCanvas').count();
  if (!visible) throw new Error(`${label}: Ocean dashboard is hidden`);
  if (!canvas) throw new Error(`${label}: Ocean 3D canvas was not mounted`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error(`${label}: Ocean page overflows the iPhone viewport`);
}

try {
  const response = await page.goto(base, { waitUntil: 'domcontentloaded' });
  if (!response || response.status() >= 400) throw new Error(`Ocean page HTTP ${response?.status() ?? 'no response'}`);
  await page.waitForFunction(() => window.CinemapRecords && window.CinemapOceanModel);
  await assertDashboardVisible('initial');

  const before = await page.evaluate(key => {
    localStorage.removeItem(key);
    CinemapRecords.clear();
    const film = { id: 129, title: '千と千尋の神隠し', year: 2001, genres: ['アニメ'], region: '日本', director: '宮崎駿' };
    if (!CinemapRecords.rate(film, 4.5)) throw new Error('record: rating was rejected');
    const records = CinemapRecords.read();
    const ecology = CinemapOceanModel.ecosystem(records, [film]);
    return {
      record: records['129'], watched: ecology.watched, discovered: ecology.discovered,
      environment: ecology.environment, stored: localStorage.getItem(key)
    };
  }, storageKey);

  if (before.record?.rating !== 4.5 || before.watched !== 1 || before.discovered.length !== 1) throw new Error(`grow: unexpected ecosystem after record ${JSON.stringify(before)}`);
  if (!before.stored) throw new Error('persist: localStorage was not written');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.CinemapRecords && window.CinemapOceanModel);
  await assertDashboardVisible('reload');

  const after = await page.evaluate(() => {
    const records = CinemapRecords.read(); const record = records['129'];
    const ecology = CinemapOceanModel.ecosystem(records, [record]);
    return { record, watched: ecology.watched, discovered: ecology.discovered, environment: ecology.environment };
  });

  if (after.record?.rating !== 4.5 || after.watched !== 1) throw new Error(`reload: record did not survive reload ${JSON.stringify(after)}`);
  if (JSON.stringify(after.discovered) !== JSON.stringify(before.discovered)) throw new Error(`model: species changed across reload ${JSON.stringify({ before: before.discovered, after: after.discovered })}`);
  if (JSON.stringify(after.environment) !== JSON.stringify(before.environment)) throw new Error(`model: environment changed across reload ${JSON.stringify({ before: before.environment, after: after.environment })}`);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Ocean persistence smoke passed: visible -> record -> grow -> reload -> persist (${after.discovered[0]}).`);
} finally { await browser.close(); }
