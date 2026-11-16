import { test, expect } from '@playwright/test';
import { seed, serverCoupons, setup, sheet, tab, ticket } from './helpers';

/** Drag a coupon row sideways (dx < 0 = to the left) like a finger swipe. */
async function swipe(page, title, dx, dy = 0) {
  // middle of the screen, clear of the floating bottom bar and + button
  await ticket(page, title).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const box = await ticket(page, title).boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 3, y + dy / 3, { steps: 4 });
  await page.mouse.move(x + dx, y + dy, { steps: 6 });
  await page.mouse.up();
}

const row = (page, title) => page.locator(`[data-testid="coupon-row"][data-title="${title}"]`);
const actions = (page, title) => row(page, title).getByTestId('swipe-actions');

test('T42 swipe reveals "ניצול" and "מחיקה"; delete asks first', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'למחוק בסלייד', store: 'x', type: 'other' }]);
  await swipe(page, 'למחוק בסלייד', -200);
  await expect(actions(page, 'למחוק בסלייד').getByRole('button', { name: 'ניצול' })).toBeVisible();
  await actions(page, 'למחוק בסלייד').getByRole('button', { name: 'מחיקה' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ביטול' }).click();
  await expect(ticket(page, 'למחוק בסלייד')).toBeVisible();
  await expect(actions(page, 'למחוק בסלייד')).toHaveCount(0); // the row closed again
  await swipe(page, 'למחוק בסלייד', -200);
  await actions(page, 'למחוק בסלייד').getByRole('button', { name: 'מחיקה' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'מחק' }).click();
  await expect(ticket(page, 'למחוק בסלייד')).toHaveCount(0);
  await expect.poll(async () => (await serverCoupons(page, familyId)).length).toBe(0);
});

test('T43 swipe the other way → "ניצול" on a voucher opens partial use; "כל היתרה" uses it up', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'שובר לסלייד', store: 'x', type: 'money', value: 120 }]);
  await swipe(page, 'שובר לסלייד', 200);
  await actions(page, 'שובר לסלייד').getByRole('button', { name: 'ניצול' }).click();
  const s = sheet(page, 'שובר לסלייד');
  await expect(s.getByLabel('סכום שנוצל')).toBeVisible();
  await s.getByRole('button', { name: 'כל היתרה' }).click();
  await expect(s.getByLabel('סכום שנוצל')).toHaveValue('120');
  await s.getByTestId('partial-confirm').click();
  await expect(s).toBeHidden();
  await expect(ticket(page, 'שובר לסלייד')).toHaveCount(0);
  await tab(page, 'ארכיון');
  await expect(ticket(page, 'שובר לסלייד')).toContainText('מומש');
});

test('T44 "ניצול" on a non-money coupon asks and moves it to the archive', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'קפה חינם', store: 'ארומה', type: 'other' }]);
  await swipe(page, 'קפה חינם', -200);
  await actions(page, 'קפה חינם').getByRole('button', { name: 'ניצול' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'כן, מימשתי' }).click();
  await expect(page.getByRole('status')).toHaveText('סומן כמומש ועבר לארכיון');
  await expect(ticket(page, 'קפה חינם')).toHaveCount(0);
  await expect.poll(async () => (await serverCoupons(page, familyId))[0]?.status).toBe('used');
});

test('T45 one open row at a time; tapping an open row closes it; a short drag snaps back', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'ראשון', store: 'x', type: 'other' },
    { title: 'שני', store: 'y', type: 'other' },
  ]);
  await swipe(page, 'ראשון', -200);
  await expect(actions(page, 'ראשון')).toBeVisible();
  await swipe(page, 'שני', -200);
  await expect(actions(page, 'שני')).toBeVisible();
  await expect(actions(page, 'ראשון')).toHaveCount(0);
  // tapping the open row closes it instead of opening the coupon
  await ticket(page, 'שני').click();
  await expect(actions(page, 'שני')).toHaveCount(0);
  await expect(sheet(page, 'שני')).toHaveCount(0);
  // a short drag doesn't open it
  await swipe(page, 'שני', -30);
  await expect(actions(page, 'שני')).toHaveCount(0);
  // and a normal tap still opens the coupon
  await ticket(page, 'שני').click();
  await expect(sheet(page, 'שני')).toBeVisible();
});

test('T46 a vertical drag on a coupon is a scroll, not a swipe', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'לא לפתוח', store: 'x', type: 'other' }]);
  await swipe(page, 'לא לפתוח', -40, -160);
  await expect(actions(page, 'לא לפתוח')).toHaveCount(0);
  await expect(sheet(page, 'לא לפתוח')).toHaveCount(0);
});
