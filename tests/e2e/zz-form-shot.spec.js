// Visual check of the coupon form: SCREENS=1 npx playwright test zz-form-shot --project=iphone
import { test } from '@playwright/test';
import { setup, sheet } from './helpers';

test.skip(!process.env.SCREENS, 'screenshots only on demand');

test('coupon form', async ({ page }, info) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `shots/form-off-${info.project.name}.png` });
  await s.getByRole('switch', { name: 'קוד אימות' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shots/form-on-${info.project.name}.png` });
});
