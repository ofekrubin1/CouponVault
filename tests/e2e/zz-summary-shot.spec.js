// Visual check of the balance card and the category grid: SCREENS=1 npx playwright test zz-summary-shot --project=iphone
import { test } from '@playwright/test';
import { seed, setup, sheet } from './helpers';

test.skip(!process.env.SCREENS, 'screenshots only on demand');

test('balance card and category grid', async ({ page }, info) => {
  const { familyId } = await setup(page);
  const soon = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  await seed(page, familyId, [
    { title: 'שובר מתנה', store: 'Buyme', type: 'money', value: 400, balance: 250, expiry: soon },
    { title: 'תו קנייה', store: 'שופרסל', category: 'סופרמרקט', type: 'money', value: 990 },
    { title: 'ארוחת מקרויאל', store: 'מקדונלדס', category: 'אוכל', type: 'product' },
  ]);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `shots/summary-${info.project.name}.png` });
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByRole('button', { name: 'חדשה' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `shots/form-${info.project.name}.png` });
});
