import { test, expect } from '@playwright/test';
import { openTicket, seed, serverCoupons, setup, tab, ticket } from './helpers';

const voucher = { title: 'שובר 200', store: 'Buyme', type: 'money', value: 200 };

test('T23 partial use: 200 → use 80 → back on the home screen with 120 left; history kept', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [voucher]);
  const s = await openTicket(page, 'שובר 200');
  await s.getByRole('button', { name: 'מימוש חלקי' }).click();
  await s.getByLabel('סכום שנוצל').fill('80');
  await expect(s.getByText('יישארו ₪120 בשובר')).toBeVisible();
  await s.getByTestId('partial-confirm').click();
  // the sheet closes and we're back on the home screen
  await expect(s).toBeHidden();
  await expect(page.getByRole('status')).toContainText('נותרו ₪120');
  await expect(page.getByRole('navigation', { name: 'ניווט' }).getByRole('button', { name: 'קופונים' })).toHaveAttribute('aria-current', 'page');
  await expect(ticket(page, 'שובר 200')).toContainText('₪120');
  await expect(ticket(page, 'שובר 200')).not.toContainText('₪200'); // the row shows what's left
  const again = await openTicket(page, 'שובר 200');
  await expect(again.getByTestId('hero-balance')).toHaveText('₪120');
  await expect(again.getByTestId('usage-history')).toContainText('-₪80');
  await expect.poll(async () => (await serverCoupons(page, familyId))[0]).toMatchObject({ balance: 120, status: 'active' });
});

test('T24 partial use above the balance is refused', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [voucher]);
  const s = await openTicket(page, 'שובר 200');
  await s.getByRole('button', { name: 'מימוש חלקי' }).click();
  await s.getByLabel('סכום שנוצל').fill('250');
  await s.getByTestId('partial-confirm').click();
  await expect(s.getByRole('alert')).toHaveText('הסכום גדול מהיתרה (₪200)');
  await expect(s.getByTestId('hero-balance')).toHaveText('₪200');
});

test('T25 using the exact remaining balance moves the voucher to the archive', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ ...voucher, balance: 50, usages: [{ at: new Date().toISOString(), by: 'x', byName: 'x', amount: 150 }] }]);
  const s = await openTicket(page, 'שובר 200');
  await s.getByRole('button', { name: 'מימוש חלקי' }).click();
  await s.getByRole('button', { name: 'כל היתרה' }).click();
  await expect(s.getByLabel('סכום שנוצל')).toHaveValue('50');
  await s.getByTestId('partial-confirm').click();
  await expect(s).toBeHidden();
  await expect(ticket(page, 'שובר 200')).toHaveCount(0);
  await tab(page, 'ארכיון');
  await expect(ticket(page, 'שובר 200')).toContainText('מומש');
});

test('T26 "used it all" (with confirmation) → archive → restore', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'קופון אחוזים', store: 'פוקס', type: 'percent', value: 30 }]);
  const s = await openTicket(page, 'קופון אחוזים');
  await s.getByRole('button', { name: 'סמן כמומש' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'כן, מימשתי' }).click();
  await expect(page.getByRole('status')).toHaveText('סומן כמומש ועבר לארכיון');
  await expect(ticket(page, 'קופון אחוזים')).toHaveCount(0);

  await tab(page, 'ארכיון');
  const a = await openTicket(page, 'קופון אחוזים');
  await a.getByRole('button', { name: 'החזר לפעילים' }).click();
  await a.getByRole('button', { name: 'סגור' }).click();
  await expect(ticket(page, 'קופון אחוזים')).toHaveCount(0);
  await tab(page, 'קופונים');
  await expect(ticket(page, 'קופון אחוזים')).toBeVisible();
});

test('T27 undo the last usage puts the money back', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [voucher]);
  const s = await openTicket(page, 'שובר 200');
  await s.getByRole('button', { name: 'מימוש חלקי' }).click();
  await s.getByLabel('סכום שנוצל').fill('45.5');
  await s.getByTestId('partial-confirm').click();
  await expect(s).toBeHidden();
  await expect(ticket(page, 'שובר 200')).toContainText('₪154.5');
  const again = await openTicket(page, 'שובר 200');
  await again.getByRole('button', { name: 'בטל אחרון' }).click();
  await expect(again.getByTestId('hero-balance')).toHaveText('₪200');
  await expect(again.getByTestId('usage-history')).toHaveCount(0);
  await expect.poll(async () => (await serverCoupons(page, familyId))[0]).toMatchObject({ balance: 200, usages: [] });
});

test('T66 restoring a used voucher and then undoing its last use never goes above the face value', async ({ page }) => {
  const { familyId } = await setup(page);
  const at = new Date().toISOString();
  await seed(page, familyId, [{ title: 'שובר שנגמר', store: 'Buyme', code: 'B-1', type: 'money', value: 120, balance: 0, status: 'used', usedAt: at, usedByName: 'דנה', usages: [{ at, by: 'x', byName: 'דנה', amount: 120 }] }]);
  await tab(page, 'ארכיון');
  const s = await openTicket(page, 'שובר שנגמר');
  await s.getByRole('button', { name: 'החזר לפעילים' }).click();
  await expect(s.getByTestId('hero-balance')).toHaveText('₪120');
  await s.getByTestId('usage-history').getByRole('button', { name: 'בטל אחרון' }).click();
  await expect(s.getByTestId('hero-balance')).toHaveText('₪120');
  await expect.poll(async () => (await serverCoupons(page, familyId))[0]?.balance).toBe(120);
});
