import { test, expect } from '@playwright/test';

test('abertura mantém logo inteira no centro, cercada de preto, até abrir o app', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  const intro = page.getByTestId('core-intro');
  const logo = page.getByTestId('core-intro-logo');
  await expect(logo).toBeVisible();
  const viewport = page.viewportSize()!;
  const box = (await logo.boundingBox())!;
  expect(box.x).toBeGreaterThan(0);
  expect(box.y).toBeGreaterThan(0);
  expect(box.x + box.width).toBeLessThan(viewport.width);
  expect(box.y + box.height).toBeLessThan(viewport.height);
  expect(Math.abs(box.width - box.height)).toBeLessThan(1);
  expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(1);
  expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(1);
  await expect(intro).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect
    .poll(() => logo.evaluate((el) => Number(getComputedStyle(el.parentElement!).opacity)), {
      intervals: [50],
    })
    .toBeGreaterThan(0.95);
  await page.screenshot({ path: testInfo.outputPath('abertura.png') });
  await expect(intro).toHaveCount(0);
  await expect(page.getByText('Esse Core é seu.', { exact: true })).toBeVisible();
});
