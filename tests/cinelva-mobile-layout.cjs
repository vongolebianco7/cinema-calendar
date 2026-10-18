const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  fs.mkdirSync('test-results/cinelva', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let failed = false;
  for (const width of [375, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
    const errors = [], consoleErrors = [];
    const year = new Date().getFullYear();
    const watchedAt = year + '-06-15';
    await page.addInitScript(({ watchedAt }) => {
      localStorage.setItem('cinelva-library-records-v2', JSON.stringify({
        '999001': { id: '999001', title: 'CINELVA QA fixture', watched: true, watchedAt, rating: 4.5, viewingMethod: '映画館', genres: [], countries: [] }
      }));
    }, { watchedAt });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto('http://127.0.0.1:8765/my-cinelva/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('#summaryView').waitFor({ state: 'visible' });
    const calendarReady = await page.waitForFunction(() => document.querySelectorAll('#yearHeatmap .cy-month').length === 12, null, { timeout: 7000 }).then(() => true).catch(() => false);
    if (!calendarReady) {
      const diagnostics = await page.evaluate(() => ({
        monthCount: document.querySelectorAll('#yearHeatmap .cy-month').length,
        heatmapHTML: document.querySelector('#yearHeatmap')?.innerHTML.slice(0, 1200),
        periodOptions: [...(document.querySelector('#csPeriod')?.options || [])].map(option => option.value),
        recordCount: document.querySelector('#statTotal')?.textContent,
        pageErrors: window.__cinelvaTestErrors || []
      }));
      console.error('annual calendar initialization diagnostic', JSON.stringify({ width, diagnostics, errors, consoleErrors }));
      throw new Error('annual calendar did not render 12 months');
    }
    await page.locator('#yearHeatmap .cy-month').first().waitFor({ state: 'visible' });
    await page.waitForTimeout(150);
    const result = await page.evaluate(({ year, width }) => {
      const root = document.querySelector('#yearHeatmap');
      if (!root) return { error: 'missing annual calendar' };
      const months = [...root.querySelectorAll('.cy-month')];
      const overlaps = [];
      const monthRects = months.map(m => m.getBoundingClientRect());
      const visible = root.getBoundingClientRect().width > 0 && root.getBoundingClientRect().height > 0;
      const days = [...root.querySelectorAll('.cy-day')];
      if (width <= 768 && days.some(d => d.getBoundingClientRect().height > 32 || d.getBoundingClientRect().width > 32)) overlaps.push('oversized day cells');
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
      return { months: months.length, overlaps, watchedDays: root.querySelectorAll('.cy-day.watched').length, juneCount: months[5]?.querySelector('.cy-month-total')?.textContent.replace(/\s+/g, ''), overflow: document.documentElement.scrollWidth > window.innerWidth + 2, rootClass: root.className };
    }, { year, width });
    // Donut regression: check both value modes and reject labels outside the
    // circle or overlapping the central counter. The legend is the fallback.
    for (const valueMode of ['percent','count']) {
      await page.evaluate(mode => {
        localStorage.setItem('cinelva-donut-value-mode',mode);
        const button=[...document.querySelectorAll('#csGenres .cs-donut-mode button')]
          .find(el=>el.textContent.trim()===(mode==='count'?'本数':'%'));
        if(button)button.click();
      },valueMode);
      await page.waitForTimeout(80);
      const charts=await page.evaluate(()=>{
        const ids=['csGenres','csCountries','csDecades','csMethods'];
        return ids.map(id=>{
          const root=document.getElementById(id),donut=root?.querySelector('.cs-donut');
          const ring=donut?.getBoundingClientRect(),center=donut?.querySelector('.cs-donut-center')?.getBoundingClientRect();
          const labels=[...(donut?.querySelectorAll('svg text')||[])];
          const violations=[];
          for(const label of labels){
            const box=label.getBoundingClientRect();
            if(!ring||box.left<ring.left-1||box.right>ring.right+1||box.top<ring.top-1||box.bottom>ring.bottom+1)violations.push('outside donut');
            if(center&&box.left<center.right-2&&box.right>center.left+2&&box.top<center.bottom-2&&box.bottom>center.top+2)violations.push('overlaps center');
          }
          for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
            const a=labels[i].getBoundingClientRect(),b=labels[j].getBoundingClientRect();
            if(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)violations.push('label overlap');
          }
          return {id,labels:labels.length,legend:root?.querySelectorAll('.cs-donut-legend-row').length||0,violations};
        });
      });
      await page.screenshot({path:'test-results/cinelva/donuts-'+width+'-'+valueMode+'.png',fullPage:true});
      if(charts.some(c=>c.violations.length)){failed=true;console.error('donut layout',width,valueMode,JSON.stringify(charts));}
      else console.log('donut layout',width,valueMode,'PASS',JSON.stringify(charts));
    }
    const yearSelect = page.locator('#calendarYearSelect');
    if (!(await yearSelect.isVisible())) { failed = true; console.error(width, 'annual year selector is hidden'); }
    const selectedYear = await yearSelect.inputValue();
    if (selectedYear !== String(year)) {
      failed = true;
      console.error(width, 'unexpected selected year', selectedYear, 'expected', year);
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
