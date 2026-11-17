// Visual check of the brands board with live logos: SCREENS=1 npx playwright test zz-brands-shot --project=iphone
import { test } from '@playwright/test';
import { seed, setup } from './helpers';

test.skip(!process.env.SCREENS, 'screenshots only on demand');

test('brands board', async ({ page }, info) => {
  test.setTimeout(120000);
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'שובר מתנה', store: 'KFC', type: 'money', value: 100 },
    { title: 'תו קנייה', store: 'תו הזהב', type: 'money', value: 200 },
  ]);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `shots/brands-home-${info.project.name}.png` });
  await page.getByTestId('brands-button').click();
  const body = page.getByRole('dialog').locator('.overflow-y-auto');
  for (let y = 0; y < 6000; y += 300) {
    await body.evaluate((el, top) => (el.scrollTop = top), y);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(4000);
  const missing = await page.getByTestId('brand-tile').evaluateAll((tiles) => tiles.filter((t) => !t.querySelector('[data-testid="brand-mark"]')).map((t) => t.textContent));
  console.log('NO LOGO:', missing.join(', ') || 'none');
  for (const [i, y] of [0, 700, 1400, 2100, 2800, 3500].entries()) {
    await body.evaluate((el, top) => (el.scrollTop = top), y);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `shots/brands-board${i}-${info.project.name}.png` });
  }
});

test('form with product type', async ({ page }, info) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  await page.waitForTimeout(500);
  await page.getByRole('radio', { name: 'מוצר' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shots/form-product-${info.project.name}.png` });
});
