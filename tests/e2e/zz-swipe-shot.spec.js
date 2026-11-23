// Visual check of the swipe state: SCREENS=1 npx playwright test zz-swipe-shot --project=iphone
import { test, expect } from '@playwright/test';
import { isoIn, seed, setup, ticket } from './helpers';

test.skip(!process.env.SCREENS, 'screenshots only on demand');

test('swipe + home screens', async ({ page }) => {
  const { familyId } = await setup(page, { family: 'משפחת רובין' });
  await seed(page, familyId, [
    { title: 'Buyme מתנה', store: 'Buyme', category: 'פנאי ובילוי', type: 'money', value: 400, balance: 250, expiry: isoIn(40) },
    { title: 'תו קנייה', store: 'שופרסל', category: 'סופרמרקט', type: 'money', value: 200, expiry: isoIn(90) },
    { title: '20% הנחה', store: 'קסטרו', category: 'אופנה', type: 'percent', value: 20, expiry: isoIn(120) },
  ]);
  await expect(page.getByTestId('coupon-ticket')).toHaveCount(3);
  const t = ticket(page, 'תו קנייה');
  await t.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const b = await t.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 - 150, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/screens/20-swipe.png' });
  await t.click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/screens/21-home.png', fullPage: true });
});
