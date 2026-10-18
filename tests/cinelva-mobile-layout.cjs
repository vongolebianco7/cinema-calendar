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
    await page.goto('http://127.0.0.1:8765/my-cinelva/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('[data-tab="calendar"]').click();
    await page.locator('#calendarView').waitFor({ state: 'visible' });
    await page.locator('#yearHeatmap .cy-month').first().waitFor({ state: 'visible' });
    await page.waitForTimeout(700);
    const result = await page.evaluate(() => {
      const root = document.querySelector('#yearHeatmap');
      if (!root) return { error: 'missing annual calendar' };
      const months = [...root.querySelectorAll('.cy-month')];
      const overlaps = [];
      const monthRects = months.map(m => m.getBoundingClientRect());
      for (let i=0; i<monthRects.length; i++) for (let j=i+1; j<monthRects.length; j++) {
        const a=monthRects[i], b=monthRects[j];
        if (a.left < b.right-2 && a.right > b.left+2 && a.top < b.bottom-2 && a.bottom > b.top+2) overlaps.push('month overlap '+i+'/'+j);
      }
      for (const month of months) {
        const outer = month.getBoundingClientRect();
        const dots = month.querySelector('.cy-dots');
        if (!dots) { overlaps.push('missing dots'); continue; }
        const inner = dots.getBoundingClientRect();
        if (inner.bottom > outer.bottom+2) overlaps.push('dots below month');
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
