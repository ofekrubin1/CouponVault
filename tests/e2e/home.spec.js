import { test, expect } from '@playwright/test';
import { isoIn, openTicket, seed, setup, sheet, tab, ticket } from './helpers';

test('T28 "about to expire" lists only coupons inside the alert window, most urgent first', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'עוד יומיים', store: 'a', type: 'other', expiry: isoIn(2) },
    { title: 'עוד עשרה', store: 'b', type: 'other', expiry: isoIn(10) },
    { title: 'עוד חודשיים', store: 'c', type: 'other', expiry: isoIn(60) },
    { title: 'בלי תוקף', store: 'd', type: 'other' },
  ]);
  const card = page.getByTestId('expiring-card');
  await expect(card).toBeVisible();
  const items = card.getByTestId('expiring-item');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText('עוד יומיים');
  await expect(items.nth(0)).toContainText('עוד 2 ימים');
  await expect(items.nth(1)).toContainText('עוד עשרה');
  await expect(page.getByTestId('summary-card')).toContainText('2');
  // tapping an item opens the coupon
  await items.nth(0).click();
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

test('T30 category chips filter the list and show what is left to spend', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'פיצה', store: 'דומינוס', category: 'מסעדות', type: 'money', value: 100 },
    { title: 'סושי', store: 'ג׳פניקה', category: 'מסעדות', type: 'money', value: 150, balance: 90 },
    { title: 'סופר', store: 'רמי לוי', category: 'סופרמרקט', type: 'money', value: 300 },
    { title: 'חולצה', store: 'קסטרו', category: 'אופנה', type: 'percent', value: 20 },
  ]);
  await expect(page.getByTestId('summary-balance')).toHaveText('₪490');
  const list = page.getByTestId('coupon-list').getByTestId('coupon-ticket');
  const chip = (group, value) => page.locator(`[data-testid="filter-chip"][data-group="${group}"][data-value="${value}"]`);
  await page.getByTestId('filter-button').click();
  await expect(page.getByTestId('filter-panel')).toBeVisible();
  await chip('cat', 'מסעדות').click();
  await expect(list).toHaveCount(2);
  await expect(page.getByTestId('filtered-balance')).toContainText('₪190');
  // several tags at once
  await chip('cat', 'אופנה').click();
  await expect(list).toHaveCount(3);
  await expect(page.getByTestId('filter-count')).toHaveText('2');
  await chip('cat', 'מסעדות').click();
  await expect(list).toHaveCount(1);
  await expect(list.first()).toHaveAttribute('data-title', 'חולצה');
  // closing the panel keeps the filter, shown as a removable chip
  await page.getByRole('button', { name: 'הצג 1 קופונים' }).click();
  await expect(page.getByTestId('filter-panel')).toBeHidden();
  await page.getByTestId('active-filters').getByRole('button', { name: 'הסר סינון אופנה' }).click();
  await expect(list).toHaveCount(4);
  await expect(page.getByTestId('filter-count')).toHaveCount(0);
});

test('T30b filter by type and "expiring soon", then clear everything', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'שובר דחוף', store: 'a', type: 'money', value: 100, expiry: isoIn(3) },
    { title: 'שובר רחוק', store: 'b', type: 'money', value: 50, expiry: isoIn(200) },
    { title: 'הנחה דחופה', store: 'c', type: 'percent', value: 10, expiry: isoIn(5) },
    { title: 'סתם קופון', store: 'd', type: 'other' },
  ]);
  const list = page.getByTestId('coupon-list').getByTestId('coupon-ticket');
  await page.getByTestId('filter-button').click();
  await page.locator('[data-testid="filter-chip"][data-group="type"][data-value="money"]').click();
  await expect(list).toHaveCount(2);
  await page.getByRole('switch', { name: 'רק פגים בקרוב' }).click();
  await expect(list).toHaveCount(1);
  await expect(list.first()).toHaveAttribute('data-title', 'שובר דחוף');
  await page.getByTestId('filter-panel').getByRole('button', { name: 'נקה' }).click();
  await expect(list).toHaveCount(4);
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
  await expect(page.getByTestId('expiring-card')).toHaveCount(0);
  await tab(page, 'הגדרות');
  await page.getByRole('radio', { name: '30 ימים' }).click();
  await tab(page, 'קופונים');
  await expect(page.getByTestId('expiring-card').getByTestId('expiring-item')).toHaveCount(1);
});
