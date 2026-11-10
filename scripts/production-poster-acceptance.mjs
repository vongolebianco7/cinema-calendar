// Read-only production acceptance for #593. This script never writes user data.
import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const browserName = process.env.CINELVA_BROWSER || 'chromium';
const browserType = { chromium, webkit }[browserName];
if (!browserType) throw new Error(`Unsupported browser: ${browserName}`);

const base = new URL(process.env.CINELVA_BASE_URL || 'https://cinelva.vercel.app');
if (base.protocol !== 'https:' && base.hostname !== '127.0.0.1') {
  throw new Error(`Refusing non-HTTPS acceptance target: ${base.origin}`);
}

const width = Number(process.env.CINELVA_VIEWPORT_WIDTH || (browserName === 'webkit' ? 390 : 1280));
const output = process.env.CINELVA_ACCEPTANCE_OUTPUT || `artifacts/production-poster-acceptance/${browserName}-${width}.json`;
const executablePath = process.env.CINELVA_BROWSER_EXECUTABLE;
const routes = [
  { name: 'calendar', path: '/index.html' },
  { name: 'discover', path: '/discover.html' },
  { name: 'streaming', path: '/streaming.html' },
  { name: 'movie-detail', path: '/search.html?search=%E3%82%A4%E3%83%B3%E3%82%BF%E3%83%BC%E3%82%B9%E3%83%86%E3%83%A9%E3%83%BC' },
  { name: 'director-collection', path: '/my-cinemap.html' },
];

async function settleImages(page) {
  const images = page.locator('img[src]');
  const count = await images.count();
  for (let index = 0; index < count; index += 1) {
    await images.nth(index).evaluate(image => image.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(35);
  }
  await page.waitForTimeout(1200);
}

async function imageResult(page, name, imageResponses) {
  const result = await page.evaluate(() => {
    const candidates = [...document.images].filter(image => /^https?:/.test(image.getAttribute('src') || ''));
    const describe = image => ({
      alt: image.alt || '',
      src: image.currentSrc || image.getAttribute('src') || '',
      complete: image.complete,
      width: image.naturalWidth,
    });
    return {
      title: document.title,
      url: location.href,
      images_with_url: candidates.length,
      loaded: candidates.filter(image => image.complete && image.naturalWidth > 0).length,
      pending: candidates.filter(image => !image.complete).map(describe),
      broken: candidates.filter(image => image.complete && image.naturalWidth === 0).map(describe),
      placeholders: document.querySelectorAll('.rankPosterPlaceholder:not([hidden]), .posterPlaceholder:not([hidden]), [data-poster-placeholder]:not([hidden])').length,
      horizontal_overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    };
  });
  return { name, ...result, image_http_errors: [...imageResponses] };
}

async function auditRoute(context, route) {
  const page = await context.newPage();
  const imageResponses = new Set();
  const pageErrors = [];
  page.on('response', response => {
    if (response.request().resourceType() === 'image' && response.status() >= 400) {
      imageResponses.add(`${response.status()} ${response.url()}`);
    }
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    const response = await page.goto(new URL(route.path, base).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!response || response.status() >= 400) throw new Error(`${route.name}: HTTP ${response?.status() ?? 'missing'}`);
    await page.waitForTimeout(2500);
    await settleImages(page);
    return { ...(await imageResult(page, route.name, imageResponses)), page_errors: pageErrors };
  } finally {
    await page.close();
  }
}

async function auditHistoricalBoxOffice(context) {
  const page = await context.newPage();
  const imageResponses = new Set();
  const pageErrors = [];
  page.on('response', response => {
    if (response.request().resourceType() === 'image' && response.status() >= 400) {
      imageResponses.add(`${response.status()} ${response.url()}`);
    }
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    await page.goto(new URL('/rankings.html', base).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: '興行収入', exact: true }).click();
    await page.getByRole('button', { name: '1980', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.rankCard').length === 19, null, { timeout: 15000 });
    await settleImages(page);
    const historical = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.rankCard')];
      const title = card => card.querySelector('.title')?.textContent?.trim() || '';
      const loadedTitles = cards.filter(card => {
        const image = card.querySelector('img[src^="http"]');
        return image?.complete && image.naturalWidth > 0;
      }).map(title);
      return {
        cards: cards.length,
        loaded_titles: loadedTitles,
        placeholder_titles: cards.filter(card => card.querySelector('.rankPosterPlaceholder:not([hidden])')).map(title),
        caligula_loaded: loadedTitles.includes('カリギュラ'),
      };
    });
    return { ...(await imageResult(page, 'box-office-1980', imageResponses)), ...historical, page_errors: pageErrors };
  } finally {
    await page.close();
  }
}

const failures = [];
const results = [];
const browser = await browserType.launch(executablePath ? {
  executablePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
} : {});
try {
  const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
  for (const route of routes) results.push(await auditRoute(context, route));
  results.push(await auditHistoricalBoxOffice(context));
  await context.close();
} finally {
  await browser.close();
}

for (const result of results) {
  if (result.broken.length) failures.push(`${result.name}: ${result.broken.length} broken rendered images`);
  if (result.pending.length) failures.push(`${result.name}: ${result.pending.length} poster images never settled`);
  if (result.image_http_errors.length) failures.push(`${result.name}: image HTTP errors: ${result.image_http_errors.join(', ')}`);
  if (result.page_errors.length) failures.push(`${result.name}: page errors: ${result.page_errors.join(' | ')}`);
  if (width <= 390 && result.horizontal_overflow > 1) failures.push(`${result.name}: ${result.horizontal_overflow}px page overflow at ${width}px`);
}
const historical = results.find(result => result.name === 'box-office-1980');
if (!historical?.caligula_loaded) failures.push('box-office-1980: restored Caligula poster did not render');

const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  target: base.origin,
  browser: browserName,
  viewport: { width, height: 844 },
  scope: 'Read-only canonical production rendering. Playwright WebKit is an iPhone-size engine check, not physical iPhone Safari evidence.',
  failures,
  results,
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
