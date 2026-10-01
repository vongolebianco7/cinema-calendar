import fs from 'node:fs';
import path from 'node:path';

const VALID_STATUSES = new Set(['pass', 'fail', 'partial', 'not_applicable']);

export function recordMetric(target, metric) {
  if (!Array.isArray(target)) throw new TypeError('metric target must be an array');
  if (!metric?.id || typeof metric.id !== 'string') throw new Error('metric id is required');
  if (!VALID_STATUSES.has(metric.status)) throw new Error(`invalid metric status: ${metric.status}`);
  if (typeof metric.earned !== 'number' || metric.earned < 0) throw new Error('metric earned must be a non-negative number');
  target.push({...metric});
  return metric;
}

export function writeMetrics(output, metrics) {
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, JSON.stringify({metrics}, null, 2) + '\n', 'utf8');
}

export function attachPageErrorCollector(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

export async function pageOverflowPx(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

export async function assertNoPageOverflow(page, tolerance = 2) {
  const overflow = await pageOverflowPx(page);
  return {pass: overflow <= tolerance, overflow};
}

export async function routeDeterministicMovieBackend(context, payload = {results: [], movies: []}) {
  await context.route(/backend-one-gray-94\.vercel\.app\/api\/movies/, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  }));
}

export function metricOutputPath(group, browser = '') {
  const suffix = browser ? `-${browser}` : '';
  return `artifacts/completeness/metrics/${group}${suffix}.json`;
}

export function screenshotPath(name, browser = '') {
  const suffix = browser ? `-${browser}` : '';
  return `artifacts/completeness/screenshots/${name}${suffix}.png`;
}

export async function recordBasicPageMetrics({page, response, errors, rows, browser, ids, points, screenshotName}) {
  const loaded = Boolean(response && response.status() < 400);
  recordMetric(rows, {id: ids.load, status: loaded ? 'pass' : 'fail', earned: loaded ? points.load : 0, browser, details: `HTTP ${response?.status?.() ?? 'no response'}`});

  await page.waitForTimeout(200);
  const clean = errors.length === 0;
  recordMetric(rows, {id: ids.errors, status: clean ? 'pass' : 'fail', earned: clean ? points.errors : 0, browser, details: clean ? 'no pageerror' : errors.join(' | ')});

  const overflowResult = await assertNoPageOverflow(page);
  recordMetric(rows, {id: ids.overflow, status: overflowResult.pass ? 'pass' : 'fail', earned: overflowResult.pass ? points.overflow : 0, browser, details: `overflow=${overflowResult.overflow}px`});

  if (screenshotName) {
    fs.mkdirSync('artifacts/completeness/screenshots', {recursive:true});
    await page.screenshot({path:screenshotPath(screenshotName,browser), fullPage:true});
  }
}
