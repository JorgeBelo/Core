import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('docs/screenshots', { recursive: true });
const browser = await chromium.launch();
for (const [name, width, height] of [
  ['desktop', 1440, 900],
  ['mobile', 390, 844],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4174/home');
  await page.getByText('Conecte seu ambiente', { exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.screenshot({ path: `docs/screenshots/setup-${name}.png`, fullPage: true });
  console.log(
    JSON.stringify({
      name,
      errors,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    }),
  );
  await page.close();
}
await browser.close();
