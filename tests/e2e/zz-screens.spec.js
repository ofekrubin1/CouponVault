// Visual review: SCREENS=1 npx playwright test zz-screens --project=iphone → test-results/screens/*.png
import { test, expect } from '@playwright/test';
import { isoIn, login, createFamily, seed, openTicket, sheet, tab } from './helpers';

test.skip(!process.env.SCREENS, 'screenshots only on demand');

const DIR = 'test-results/screens';
const shot = (page, name, fullPage = false) => page.screenshot({ path: `${DIR}/${name}.png`, fullPage });

test('screens', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'התחברות עם Google' })).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, '01-login');

  await login(page, { name: 'אופק רובין' });
  await expect(page.getByRole('heading', { name: /שלום/ })).toBeVisible();
  await shot(page, '02-onboarding');

  const fid = await createFamily(page, 'משפחת רובין');
  await page.waitForTimeout(300);
  await shot(page, '03-empty-home');

  const now = new Date().toISOString();
  await seed(page, fid, [
    { title: 'Buyme מתנה', store: 'Buyme', category: 'פנאי ובילוי', type: 'money', value: 400, balance: 250, code: 'BM-48213', expiry: isoIn(2), source: 'מתנת יום הולדת', usages: [{ at: now, by: 'a', byName: 'אופק רובין', amount: 150 }] },
    { title: 'תו קנייה', store: 'שופרסל', category: 'סופרמרקט', type: 'money', value: 200, expiry: isoIn(9) },
    { title: 'ארוחה זוגית', store: 'מסעדת הדסון', category: 'מסעדות', type: 'other', expiry: isoIn(45) },
    { title: '20% הנחה', store: 'קסטרו', category: 'אופנה', type: 'percent', value: 20, expiry: isoIn(120), code: 'CAS20' },
    { title: 'כרטיס מתנה', store: 'איקאה', category: 'בית', type: 'money', value: 500 },
    { title: 'שובר אוזניות', store: 'KSP', category: 'אלקטרוניקה', type: 'money', value: 150, expiry: isoIn(200) },
    { title: 'טיפול פנים', store: 'ספא', category: 'טיפוח', type: 'other', expiry: isoIn(-5) },
    { title: 'סרט', store: 'יס פלאנט', category: 'פנאי ובילוי', type: 'other', status: 'used', usedAt: now, usedByName: 'דנה רובין' },
  ]);
  await expect(page.getByTestId('coupon-ticket')).toHaveCount(6);
  await page.waitForTimeout(500);
  await shot(page, '04-home');
  await shot(page, '05-home-full', true);

  await page.evaluate(() => window.scrollBy(0, 700));
  await page.waitForTimeout(400);
  await shot(page, '06-home-scrolled');
  await page.evaluate(() => window.scrollTo(0, 0));

  const d = await openTicket(page, 'Buyme מתנה');
  await page.waitForTimeout(450);
  await shot(page, '07-detail');
  await d.getByRole('button', { name: 'מימוש חלקי' }).click();
  await d.getByLabel('סכום שנוצל').fill('70');
  await page.waitForTimeout(200);
  await shot(page, '08-detail-partial');
  await d.getByRole('button', { name: 'סגור' }).click();

  await page.getByTestId('fab-add').click();
  const f = sheet(page, 'קופון חדש');
  await page.waitForTimeout(450);
  await shot(page, '09-form');
  await f.getByTestId('coupon-save').click();
  await page.waitForTimeout(400);
  await shot(page, '10-form-errors');
  await f.getByRole('button', { name: 'סגור' }).click();

  const d2 = await openTicket(page, 'תו קנייה');
  await d2.getByRole('button', { name: 'מימשתי הכול' }).click();
  await page.waitForTimeout(250);
  await shot(page, '11-confirm');
  await page.getByRole('alertdialog').getByRole('button', { name: 'ביטול' }).click();
  await d2.getByRole('button', { name: 'סגור' }).click();

  await tab(page, 'ארכיון');
  await page.waitForTimeout(300);
  await shot(page, '12-archive');
  await page.getByRole('radio', { name: /פג תוקף/ }).click();
  await page.waitForTimeout(200);
  await shot(page, '13-archive-expired');

  await tab(page, 'הגדרות');
  await page.waitForTimeout(300);
  await shot(page, '14-settings', true);

  await page.getByTestId('my-families').locator('..').getByRole('button', { name: /משפחה חדשה/ }).click();
  await page.getByLabel('שם המשפחה', { exact: true }).fill('הורים');
  await page.getByRole('button', { name: 'צור משפחה' }).click();
  await tab(page, 'קופונים');
  await page.getByTestId('family-switcher').click();
  await page.waitForTimeout(250);
  await shot(page, '15-switcher');
});
