import { test, expect } from '@playwright/test';
import { isoIn, openTicket, seed, setup, sheet, tab, ticket } from './helpers';

test('T28 coupons about to expire are flagged in their row (red within 3 days, amber inside the alert window)', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'עוד יומיים', store: 'a', type: 'other', expiry: isoIn(2) },
    { title: 'עוד עשרה', store: 'b', type: 'other', expiry: isoIn(10) },
    { title: 'עוד חודשיים', store: 'c', type: 'other', expiry: isoIn(60) },
    { title: 'בלי תוקף', store: 'd', type: 'other' },
  ]);
  const expiry = (title) => ticket(page, title).getByTestId('row-expiry');
  await expect(expiry('עוד יומיים')).toHaveAttribute('data-urgency', 'red');
  await expect(expiry('עוד יומיים')).toHaveText('עוד 2 ימים');
  await expect(expiry('עוד עשרה')).toHaveAttribute('data-urgency', 'gold');
  await expect(expiry('עוד חודשיים')).not.toHaveAttribute('data-urgency', /./);
  await expect(expiry('בלי תוקף')).toHaveText('ללא תוקף');
  await expect(page.getByTestId('summary-expiring')).toHaveText('2 פגים בקרוב');
  // tapping a row opens the coupon
  await ticket(page, 'עוד יומיים').click();
  await expect(sheet(page, 'עוד יומיים')).toBeVisible();
});

test('T29 list is sorted by expiry, coupons without expiry last', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'ג-ללא', store: 'x', type: 'other' },
    { title: 'ב-שנה', store: 'x', type: 'other', expiry: isoIn(365) },
    { title: 'א-שבוע', store: 'x', type: 'other', expiry: isoIn(7) },
  ]);
  await expect(page.getByTestId('coupon-list').getByTestId('coupon-ticket')).toHaveCount(3);
  const titles = await page.getByTestId('coupon-list').getByTestId('coupon-ticket').evaluateAll((els) => els.map((e) => e.dataset.title));
  expect(titles).toEqual(['א-שבוע', 'ב-שנה', 'ג-ללא']);
});

test('T30 the home list is grouped by category like a notepad: two lines per coupon, the balance on top', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'פיצה', store: 'דומינוס', category: 'אוכל', type: 'money', value: 100, code: 'DOM-1' },
    { title: 'סושי', store: 'ג׳פניקה', category: 'אוכל', type: 'money', value: 150, balance: 90 },
    { title: 'סופר', store: 'רמי לוי', category: 'סופרמרקט', type: 'money', value: 300 },
    { title: 'חולצה', store: 'קסטרו', category: 'ביגוד', type: 'percent', value: 20 },
    { title: 'שובר מתנה', store: 'Buyme', category: 'כללי', type: 'product' },
    { title: 'בלי קטגוריה', store: 'x', type: 'other' },
  ]);
  await expect(page.getByTestId('summary-balance')).toHaveText('₪490');
  await expect(page.getByTestId('summary-card')).toContainText('ב-6 קופונים');
  const groups = page.getByTestId('coupon-group');
  await expect(groups).toHaveCount(5);
  expect(await groups.evaluateAll((els) => els.map((e) => e.dataset.category))).toEqual(['אוכל', 'סופרמרקט', 'ביגוד', 'כללי', 'ללא קטגוריה']);
  await expect(groups.first().locator('h2')).toHaveText('אוכל2');
  // the row: name and worth, then store · code
  const pizza = ticket(page, 'פיצה');
  await expect(pizza).toContainText('₪100');
  await expect(pizza).toContainText('דומינוס');
  await expect(pizza).toContainText('DOM-1');
  await expect(ticket(page, 'סושי')).toContainText('₪90');
  await expect(ticket(page, 'חולצה')).toContainText('20%');
  await expect(ticket(page, 'שובר מתנה')).toContainText('מוצר');
  // compact: a row is at most ~64px tall
  const box = await pizza.boundingBox();
  expect(box.height).toBeLessThan(64);
});

test('T31 search matches title, store and code', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'כרטיס מתנה', store: 'הום סנטר', type: 'other', code: 'HC-1' },
    { title: 'ארוחה', store: 'מקדונלדס', type: 'other' },
  ]);
  const search = page.getByRole('searchbox', { name: 'חיפוש' });
  const list = page.getByTestId('coupon-list').getByTestId('coupon-ticket');
  await search.fill('מקדו');
  await expect(list).toHaveCount(1);
  await expect(list.first()).toHaveAttribute('data-title', 'ארוחה');
  await search.fill('hc-1');
  await expect(list.first()).toHaveAttribute('data-title', 'כרטיס מתנה');
  await search.fill('אין כזה');
  await expect(page.getByText('לא נמצאו קופונים')).toBeVisible();
  await page.getByRole('button', { name: 'נקה חיפוש' }).click();
  await expect(list).toHaveCount(2);
});

test('T32 expired coupons leave the home screen and wait in the archive', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'פג אתמול', store: 'x', type: 'other', expiry: isoIn(-1) },
    { title: 'עדיין בתוקף', store: 'y', type: 'other', expiry: isoIn(30) },
  ]);
  await expect(ticket(page, 'עדיין בתוקף')).toBeVisible();
  await expect(ticket(page, 'פג אתמול')).toHaveCount(0);
  await tab(page, 'ארכיון');
  await page.getByRole('radio', { name: /פג תוקף/ }).click();
  const s = await openTicket(page, 'פג אתמול');
  await s.getByRole('button', { name: 'עדכון תאריך תפוגה' }).click();
  await expect(sheet(page, 'עריכת קופון')).toBeVisible();
});

test('T33 the alert-days setting widens the "about to expire" window', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'בעוד 20 יום', store: 'x', type: 'other', expiry: isoIn(20) }]);
  await expect(page.getByTestId('summary-expiring')).toHaveCount(0);
  await tab(page, 'הגדרות');
  await page.getByRole('radio', { name: '30 ימים' }).click();
  await tab(page, 'קופונים');
  await expect(page.getByTestId('summary-expiring')).toHaveText('1 פגים בקרוב');
  await expect(ticket(page, 'בעוד 20 יום').getByTestId('row-expiry')).toHaveAttribute('data-urgency', 'gold');
});

test('T56 the "brands with a logo" board shows every supported chain, searchable, and closes with back', async ({ page }) => {
  await page.route('**/s2/favicons**', (route) => route.fulfill({ path: 'public/icon-192.png', contentType: 'image/png' }));
  const { familyId } = await setup(page);
  // reachable from the empty home screen too
  await expect(page.getByTestId('brands-button')).toBeVisible();
  await seed(page, familyId, [{ title: 'שובר', store: 'KFC', type: 'other' }]);
  // wait for the list: the empty screen's button is replaced by the one under the list (a tap in between is lost)
  await expect(ticket(page, 'שובר')).toBeVisible();
  const button = page.getByTestId('brands-button');
  await expect(button).toContainText('רשתות עם לוגו');
  await button.click();

  const board = page.getByRole('dialog', { name: 'רשתות עם לוגו' });
  await expect(board.getByTestId('brands-board-header')).toContainText('CouponVault');
  const tiles = board.getByTestId('brand-tile');
  expect(await tiles.count()).toBeGreaterThanOrEqual(90);
  await expect(tiles.first().getByTestId('brand-mark')).toBeVisible();

  await board.getByLabel('חיפוש רשת').fill('תו הזהב');
  await expect(tiles).toHaveCount(1);
  await expect(tiles.first()).toContainText('שופרסל');
  await board.getByLabel('חיפוש רשת').fill('אין כזאת רשת');
  await expect(tiles).toHaveCount(0);
  await expect(board).toContainText('הרשת לא ברשימה');

  await page.goBack();
  await expect(board).toBeHidden();
  await expect(page.getByTestId('coupon-list')).toContainText('שובר');
});

// Regression: with a 60-day alert window, a coupon 37 days away showed "עד <date>" instead of the days left.
test('T72 inside the alert window a row always shows the days left, even past 30 days', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'עוד 37', store: 'x', type: 'other', expiry: isoIn(37) },
    { title: 'עוד 19', store: 'y', type: 'other', expiry: isoIn(19) },
  ]);
  await tab(page, 'הגדרות');
  await page.getByRole('radio', { name: '60 ימים' }).click();
  await tab(page, 'קופונים');
  await expect(ticket(page, 'עוד 37').getByTestId('row-expiry')).toHaveText('עוד 37 ימים');
  await expect(ticket(page, 'עוד 19').getByTestId('row-expiry')).toHaveText('עוד 19 ימים');
  // the coupon's own card says the same
  const s = await openTicket(page, 'עוד 37');
  await expect(s.getByTestId('coupon-hero')).toContainText('עוד 37 ימים');
});

test('T73 tapping "N פגים בקרוב" shows only the coupons about to expire; tapping again shows all', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'דחוף', store: 'a', category: 'אוכל', type: 'other', expiry: isoIn(3) },
    { title: 'גם דחוף', store: 'b', category: 'ביגוד', type: 'other', expiry: isoIn(10) },
    { title: 'רחוק', store: 'c', category: 'אוכל', type: 'other', expiry: isoIn(200) },
    { title: 'בלי תוקף', store: 'd', type: 'other' },
  ]);
  const list = page.getByTestId('coupon-list').getByTestId('coupon-ticket');
  const chip = page.getByTestId('expiring-filter');
  await expect(list).toHaveCount(4);
  await expect(chip).toHaveText(/2 פגים בקרוב/);
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(list).toHaveCount(2);
  expect(await list.evaluateAll((els) => els.map((e) => e.dataset.title))).toEqual(['דחוף', 'גם דחוף']);
  // search works inside it
  await page.getByRole('searchbox', { name: 'חיפוש' }).fill('גם');
  await expect(list).toHaveCount(1);
  await page.getByRole('button', { name: 'נקה חיפוש' }).click();
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await expect(list).toHaveCount(4);
});
