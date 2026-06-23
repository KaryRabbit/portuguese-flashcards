import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

// App Store 6.5" iPhone: 414x896 CSS @3x = 1242x2688 device pixels
// (matches the size App Store Connect's iPhone screenshot box accepts).
const BASE = process.env.URL || 'http://localhost:4173/';
const OUT = 'docs/screenshots/appstore';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 414, height: 896 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

const shot = async (name) => {
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`saved ${name}.png`);
};

await page.goto(BASE, { waitUntil: 'networkidle' });

const tab = (name) => page.getByRole('button', { name, exact: true });

// Go to Manage and load the sample word set so screens have real content.
await tab('Manage').click();
await page.getByRole('button', { name: 'Load Sample Words' }).click();
await page.waitForTimeout(1500); // import settles
await shot('02-manage');

// Build a study session, then capture Study mode with a card.
await page.getByRole('button', { name: 'Select all' }).click().catch(() => {});
await page.getByRole('button', { name: 'Start batch' }).click().catch(() => {});
await page.waitForTimeout(800);
await tab('Study').click();
await page.waitForTimeout(600);
await shot('01-study');

// Conjugations / Verbs tab.
await tab('Verbs').click();
await page.waitForTimeout(600);
await shot('03-verbs');

await browser.close();
console.log('done');
