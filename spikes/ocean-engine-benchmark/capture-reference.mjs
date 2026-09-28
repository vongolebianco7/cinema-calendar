import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto('https://ocean-simulator-silk.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(7000);
await page.screenshot({ path: 'ocean-mit-reference-iphone.png', fullPage: false });
await browser.close();
