const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  fs.mkdirSync('test-results/cinelva', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let failed = false;
  for (const width of [375, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
    const errors = [];
    const year = new Date().getFullYear();
    const watchedAt = year + '-06-15';
    await page.addInitScript(({ watchedAt }) => {
      localStorage.setItem('cinelva-library-records-v2', JSON.stringify({
        '999001': { id: '999001', title: 'CINELVA QA fixture', watched: true, watchedAt, rating: 4.5, viewingMethod: '映画館', genres: [], countries: [] }
      }));
    }, { watchedAt });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8765/my-cinelva/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('[data-tab="calendar"]').click();
    await page.locator('#calendarView').waitFor({ state: 'visible' });
    await page.locator('#yearHeatmap .cy-month').first().waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(150);
    const result = await page.evaluate(({ year }) => {
      const root = document.querySelector('#yearHeatmap');
      if (!root) return { error: 'missing annual calendar' };
      const months = [...root.querySelectorAll('.cy-month')];
      const overlaps = [];
      const monthRects = months.map(m => m.getBoundingClientRect());
      const visible = root.getBoundingClientRect().width > 0 && root.getBoundingClientRect().height > 0;
      const days = [...root.querySelectorAll('.cy-day')];
      if (days.some(d => d.getBoundingClientRect().height > 32 || d.getBoundingClientRect().width > 32)) overlaps.push('oversized day cells');
      if (!visible) overlaps.push('annual calendar hidden');
      if (root.classList.contains('heatgrid')) overlaps.push('legacy heatgrid class still applied');
      for (let i=0; i<monthRects.length; i++) for (let j=i+1; j<monthRects.length; j++) {
        const a=monthRects[i], b=monthRects[j];
        if (a.left < b.right-2 && a.right > b.left+2 && a.top < b.bottom-2 && a.bottom > b.top+2) overlaps.push('month overlap '+i+'/'+j);
      }
      for (const month of months) {
        const outer = month.getBoundingClientRect();
        const dots = month.querySelector('.cy-dots');
        if (!dots) { overlaps.push('missing dots'); continue; }
        const inner = dots.getBoundingClientRect();
        if (dots.querySelectorAll('.cy-day').length < 28) overlaps.push('missing calendar days');
        if (inner.bottom > outer.bottom+2) overlaps.push('dots below month');
        if (inner.right > outer.right + 2 || inner.left < outer.left - 2) overlaps.push('dots outside month');
      }
      return { months: months.length, overlaps, watchedDays: root.querySelectorAll('.cy-day.watched').length, juneCount: months[5]?.querySelector('.cy-month-count')?.textContent, overflow: document.documentElement.scrollWidth > window.innerWidth + 2, rootClass: root.className };
    }, { year });
    for (const mode of ['date','count','rating','method']) {
      await page.locator('#calendarMode').selectOption(mode);
      const count = await page.locator('#calendar .cw-day').count();
      if (count < 7) { failed = true; console.error(width, mode, 'weekly cells missing', count); }
    }
    await page.screenshot({ path: 'test-results/cinelva/calendar-' + width + '.png', fullPage: true });
    if (result.error || result.months !== 12 || result.watchedDays !== 1 || result.juneCount !== '1本' || result.overlaps?.length || result.overflow || errors.length) {
      failed = true;
      console.error(width, JSON.stringify({ result, errors }));
    } else console.log(width, 'PASS', JSON.stringify(result));
    await page.close();
  }
  await browser.close();
  if (failed) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
