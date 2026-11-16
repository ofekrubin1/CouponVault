// Visual check of the coupon card header: SCREENS=1 npx playwright test zz-hero-shot --project=iphone
import { test, expect } from '@playwright/test';
import { openTicket, seed, setup } from './helpers';

test.skip(!process.env.SCREENS, 'screenshots only on demand');

test('hero with a link store and a category', async ({ page }) => {
  const { familyId } = await setup(page, { family: 'רובין' });
  await seed(page, familyId, [
    { title: 'All-inZone', store: 'http://www.htzone.co.il/voucher-zone/10', type: 'money', value: 345, category: 'אחר', code: '144536801-2063', expiry: '2031-04-01' },
    { title: 'תו קנייה', store: 'שופרסל', categories: ['סופרמרקט', 'בית'], type: 'money', value: 200 },
  ]);
  await expect(page.getByTestId('coupon-ticket')).toHaveCount(2);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/screens/30-list.png' });
  await openTicket(page, 'All-inZone');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/screens/31-hero.png' });
});
