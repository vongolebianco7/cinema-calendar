const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  fs.mkdirSync('test-results/cinelva', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let failed = false;
  for (const width of [375, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('https://vongolebianco7.github.io/cinema-calendar/my-cinelva/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const tab = page.getByText('鑑賞カレンダー', { exact: true }).first();
    if (await tab.count()) await tab.click();
    await page.waitForTimeout(700);
    const result = await page.evaluate(() => {
      const root = document.querySelector('#yearHeatmap');
      if (!root) return { error: 'missing annual calendar' };
      const months = [...root.querySelectorAll('.cy-month')];
      const overlaps = [];
      for (const month of months) {
        const outer = month.getBoundingClientRect();
        const dots = month.querySelector('.cy-dots');
        if (!dots) { overlaps.push('missing dots'); continue; }
        const inner = dots.getBoundingClientRect();
        if (inner.right > outer.right + 2 || inner.left < outer.left - 2) overlaps.push('dots outside month');
      }
      return { months: months.length, overlaps, overflow: document.documentElement.scrollWidth > window.innerWidth + 2, rootClass: root.className };
    });
    await page.screenshot({ path: 'test-results/cinelva/calendar-' + width + '.png', fullPage: true });
    if (result.error || result.months !== 12 || result.overlaps?.length || result.overflow || errors.length) {
      failed = true;
      console.error(width, JSON.stringify({ result, errors }));
    } else console.log(width, 'PASS', JSON.stringify(result));
    await page.close();
  }
  await browser.close();
  if (failed) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
