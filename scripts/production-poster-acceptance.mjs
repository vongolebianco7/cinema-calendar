// Read-only production acceptance for #593. This script never writes user data.
import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
import { posterFailures } from './production-poster-acceptance-metrics.mjs';

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
const auditFixture = {
  id: '597',
  tmdbId: 597,
  title: 'タイタニック',
  year: 1997,
  poster: 'https://image.tmdb.org/t/p/w342/ofhCnW6i7mQIiLSSucBHqZQ7XT7.jpg',
  watched: true,
  watchedAt: '2026-11-10',
  rating: 4.5,
  director: 'James Cameron',
  genres: ['ドラマ'],
};
const routes = [
  { name: 'calendar', path: '/index.html' },
  { name: 'discover', path: '/discover.html' },
  { name: 'streaming', path: '/streaming.html' },
  { name: 'movie-detail', path: '/search.html?search=%E3%82%A4%E3%83%B3%E3%82%BF%E3%83%BC%E3%82%B9%E3%83%86%E3%83%A9%E3%83%BC' },
  { name: 'director-collection', path: '/my-cinemap.html' },
  { name: 'my-cinelva-records', path: '/my-cinelva/', tab: 'records', fixture: true },
  { name: 'my-cinelva-watchlist', path: '/my-cinelva/?tab=watchlist', tab: 'watchlist', fixture: true },
  { name: 'my-cinelva-awards', path: '/my-cinelva/', tab: 'awards', fixture: true },
  { name: 'my-cinelva-directors', path: '/my-cinelva/', tab: 'directors', fixture: true },
];

async function settleImages(page, { forceEager = false } = {}) {
  const images = page.locator('img[src]');
  const count = await images.count();
  for (let index = 0; index < count; index += 1) {
    const image = images.nth(index);
    const handle = await image.elementHandle();
    if (!handle) continue;
    await handle.evaluate((element, eager) => {
      element.scrollIntoView({ block: 'center' });
      // Synthetic localStorage fixtures lack real user scroll gestures.
      // Force only their isolated images to load; production routes retain lazy loading.
      if (eager && element.loading === 'lazy') element.loading = 'eager';
    }, forceEager);
  }

  // Scrolling each image triggers native lazy loading. Wait once for the whole
  // page so slow WebKit/TMDB responses do not consume a separate timeout per
  // image; anything still pending after this bounded window remains a failure
  // in the final DOM snapshot.
  await page.waitForFunction(() => [...document.images]
    .filter(image => /^https?:/.test(image.getAttribute('src') || ''))
    .every(image => image.complete), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(100);
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
      empty_source_images: [...document.querySelectorAll('img[data-box-poster]:not([hidden])')]
        .filter(image => !/^https?:/.test(image.getAttribute('src') || ''))
        .map(image => ({
          alt: image.alt || '',
          card_title: image.closest('.rankCard')?.querySelector('.title')?.textContent?.trim() || '',
        })),
      placeholders: document.querySelectorAll('.rankPosterPlaceholder:not([hidden]), .posterPlaceholder:not([hidden]), [data-poster-placeholder]:not([hidden])').length,
      horizontal_overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    };
  });
  return { name, ...result, image_http_errors: [...imageResponses] };
}

async function auditRoute(context, route, browser, width) {
  // The fixture gets its own Service-Worker-free context. Playwright cannot
  // route requests already intercepted by a Service Worker; real routes keep
  // the normal production-like context and still exercise that behavior.
  const pageContext = route.fixture
    ? await browser.newContext({
      viewport: { width, height: 844 },
      deviceScaleFactor: 1,
      serviceWorkers: 'block',
    })
    : context;
  const page = await pageContext.newPage();
  let fixtureResponses = 0;
  if (route.fixture) {
    // Keep synthetic My Cinelva records deterministic; real production routes still load TMDB images.
    await pageContext.route(url => url.hostname === 'image.tmdb.org', async imageRoute => {
      fixtureResponses += 1;
      await imageRoute.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513"><rect width="100%" height="100%" fill="#17212b"/><text x="171" y="256" text-anchor="middle" fill="#fff" font-size="18">CINELVA AUDIT FIXTURE</text></svg>',
      });
    });
    await page.addInitScript(({ movie }) => {
      localStorage.setItem('cinelva-library-records-v2', JSON.stringify({
        [movie.id]: { ...movie, id: String(movie.id), watched: true },
      }));
      localStorage.setItem('cinelva-want-to-watch-v1', JSON.stringify({
        [movie.id]: { id: String(movie.id), tmdbId: movie.tmdbId, title: movie.title, year: movie.year, poster: movie.poster, savedAt: '2026-11-10T00:00:00.000Z' },
      }));
    }, { movie: auditFixture });
  }
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
    if (route.tab) {
      await page.locator(`[data-tab="${route.tab}"]`).click();
      await page.waitForTimeout(500);
    }
    await settleImages(page, { forceEager: Boolean(route.fixture) });
    if (route.fixture && fixtureResponses === 0) {
      throw new Error(`${route.name}: synthetic poster fixture was not fulfilled`);
    }
    return {
      ...(await imageResult(page, route.name, imageResponses)),
      fixture_used: Boolean(route.fixture),
      fixture_response_count: route.fixture ? fixtureResponses : 0,
      page_errors: pageErrors,
    };
  } finally {
    await page.close();
    if (route.fixture) await pageContext.close();
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
    const datasetCoverage = await page.evaluate(async () => {
      const response = await fetch('/data/boxoffice.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`boxoffice.json: HTTP ${response.status}`);
      const dataset = await response.json();
      const byYear = dataset?.by_year;
      if (!byYear || typeof byYear !== 'object' || Array.isArray(byYear)) {
        throw new Error('boxoffice.json has no valid by_year object');
      }

      let totalRows = 0;
      let posterRows = 0;
      let missingTmdbIdRows = 0;
      const missingByYear = {};
      const missingExamples = [];
      for (const [year, entries] of Object.entries(byYear)) {
        if (!Array.isArray(entries)) throw new Error(`boxoffice.json has invalid year ${year}`);
        for (const row of entries) {
          if (!row || typeof row !== 'object' || Array.isArray(row)) {
            throw new Error(`boxoffice.json has invalid row in ${year}`);
          }
          totalRows += 1;
          if (typeof row.poster === 'string' && row.poster.trim()) {
            posterRows += 1;
            continue;
          }
          missingByYear[year] = (missingByYear[year] || 0) + 1;
          if (!/^\d+$/.test(String(row.tmdbId ?? row.tmdb_id ?? ''))) missingTmdbIdRows += 1;
          if (missingExamples.length < 10) {
            missingExamples.push({ year, title: String(row.title || '') });
          }
        }
      }
      return {
        source_url: new URL('/data/boxoffice.json', location.href).href,
        generated_at: dataset.generated_at || null,
        total_rows: totalRows,
        poster_rows: posterRows,
        missing_poster_rows: totalRows - posterRows,
        missing_tmdb_id_rows: missingTmdbIdRows,
        missing_by_year: missingByYear,
        missing_examples: missingExamples,
      };
    });
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
    return {
      ...(await imageResult(page, 'box-office-1980', imageResponses)),
      ...historical,
      dataset_coverage: datasetCoverage,
      page_errors: pageErrors,
    };
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
  for (const route of routes) results.push(await auditRoute(context, route, browser, width));
  results.push(await auditHistoricalBoxOffice(context));
  await context.close();
} finally {
  await browser.close();
}

for (const result of results) failures.push(...posterFailures(result, width));
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
