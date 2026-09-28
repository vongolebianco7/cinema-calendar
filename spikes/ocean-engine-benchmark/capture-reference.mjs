import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.setDefaultTimeout(10000);
await page.goto('https://ocean-simulator-silk.vercel.app/', { waitUntil: 'commit', timeout: 15000 });
await page.waitForTimeout(7000);
await page.screenshot({ path: 'ocean-mit-reference-iphone.png', fullPage: false, timeout: 8000 });
await browser.close();
process.exit(0);
