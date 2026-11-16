import { test, expect } from '@playwright/test';
import { addCoupon, isoIn, openTicket, seed, serverCoupons, setup, sheet, stubClipboard, tab, ticket } from './helpers';

test('T12 add a money voucher with every field', async ({ page }) => {
  const { familyId } = await setup(page);
  await addCoupon(page, { title: 'Buyme 200', store: 'Buyme', category: 'פנאי ובילוי', value: 200, expiry: isoIn(90), code: 'BM-7781' });
  await expect(page.getByRole('status')).toHaveText('הקופון נוסף');
  const t = ticket(page, 'Buyme 200');
  await expect(t).toBeVisible();
  await expect(t).toContainText('₪200');
  await expect(t).toContainText('Buyme');
  await expect(t).toContainText('פנאי ובילוי');
  await expect.poll(async () => (await serverCoupons(page, familyId)).length).toBe(1);
  const [saved] = await serverCoupons(page, familyId);
  expect(saved).toMatchObject({ title: 'Buyme 200', store: 'Buyme', type: 'money', value: 200, balance: 200, code: 'BM-7781', status: 'active', expiry: isoIn(90) });
});

test('T13 (reported bug) a coupon without a code saves, closes the sheet and shows up', async ({ page }) => {
  const { familyId } = await setup(page);
  await addCoupon(page, { title: 'Buyme', store: 'Buyme all', value: 200, expiry: '2030-11-15' });
  await expect(ticket(page, 'Buyme')).toBeVisible();
  await expect(sheet(page, 'קופון חדש')).toBeHidden();
  await expect.poll(async () => (await serverCoupons(page, familyId))[0]?.code).toBe('');
});

test('T14 empty form: inline errors on name and store, sheet stays open', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByTestId('coupon-save').click();
  await expect(s).toBeVisible();
  await expect(s.getByText('חסר שם לקופון')).toBeVisible();
  await expect(s.getByText('חסר איפה אפשר לממש')).toBeVisible();
  await expect(s.getByLabel('שם הקופון')).toBeFocused();
  // fixing a field clears its error
  await s.getByLabel('שם הקופון').fill('משהו');
  await expect(s.getByText('חסר שם לקופון')).toBeHidden();
});

test('T15 money voucher without an amount: error next to the amount, scrolled into view', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByLabel('שם הקופון').fill('שובר');
  await s.getByLabel('איפה אפשר לממש').fill('חנות');
  await s.getByTestId('coupon-save').click();
  const err = s.getByText('בשובר כספי צריך להזין סכום');
  await expect(err).toBeVisible();
  await expect(err).toBeInViewport();
  // switching to "other" removes the need for an amount
  await s.getByRole('radio', { name: 'אחר' }).click();
  await s.getByTestId('coupon-save').click();
  await expect(s).toBeHidden();
  await expect(ticket(page, 'שובר')).toBeVisible();
});

test('T16 percent and "other" coupons show the right value on the ticket', async ({ page }) => {
  await setup(page);
  await addCoupon(page, { title: '20 אחוז', store: 'קסטרו', type: 'percent', value: 20 });
  await addCoupon(page, { title: 'קינוח חינם', store: 'מסעדה', type: 'other' });
  await expect(ticket(page, '20 אחוז')).toContainText('20%');
  await expect(ticket(page, 'קינוח חינם')).toContainText('קופון');
});

test('T17 edit: new title and amount, balance recalculated after a partial use', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'שובר ישן', store: 'סופר', type: 'money', value: 200, balance: 150, usages: [{ at: new Date().toISOString(), by: 'x', byName: 'x', amount: 50 }] }]);
  const s = await openTicket(page, 'שובר ישן');
  await s.getByRole('button', { name: 'עריכה' }).click();
  const f = sheet(page, 'עריכת קופון');
  await expect(f.getByText('כבר נוצלו ₪50')).toBeVisible();
  await f.getByLabel('שם הקופון').fill('שובר מעודכן');
  await f.locator('#value').fill('300');
  await f.getByTestId('coupon-save').click();
  await expect(f).toBeHidden();
  await expect(ticket(page, 'שובר מעודכן')).toContainText('₪250');
  await expect.poll(async () => (await serverCoupons(page, familyId))[0]).toMatchObject({ title: 'שובר מעודכן', value: 300, balance: 250 });
});

test('T18 delete asks first; cancel keeps it, confirm removes it', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'למחיקה', store: 'x', type: 'other' }]);
  let s = await openTicket(page, 'למחיקה');
  await s.getByRole('button', { name: 'מחיקה' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ביטול' }).click();
  await expect(s).toBeVisible();
  await s.getByRole('button', { name: 'מחיקה' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'מחק' }).click();
  await expect(s).toBeHidden();
  await expect(ticket(page, 'למחיקה')).toHaveCount(0);
  await expect.poll(async () => (await serverCoupons(page, familyId)).length).toBe(0);
});

test('T19 copy code button copies the code', async ({ page }) => {
  await stubClipboard(page);
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'עם קוד', store: 'x', type: 'other', code: 'SAVE-2026' }]);
  const s = await openTicket(page, 'עם קוד');
  await s.getByTestId('copy-code').click();
  await expect(page.getByRole('status')).toHaveText('הקוד הועתק');
  expect(await page.evaluate(() => window.__copied)).toEqual(['SAVE-2026']);
});

test('T20 a new category added in the form is saved for the family', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByLabel('שם הקופון').fill('תדלוק');
  await s.getByLabel('איפה אפשר לממש').fill('פז');
  await s.getByRole('button', { name: 'חדשה' }).click();
  await s.getByPlaceholder('שם הקטגוריה החדשה').fill('דלק');
  await s.getByRole('radio', { name: 'אחר' }).click();
  await s.getByTestId('coupon-save').click();
  await expect(ticket(page, 'תדלוק')).toContainText('דלק');
  await tab(page, 'הגדרות');
  await expect(page.getByRole('button', { name: 'הסר דלק' })).toBeVisible();
  // and it's offered next time
  await tab(page, 'קופונים');
  await page.getByTestId('fab-add').click();
  await expect(sheet(page, 'קופון חדש').getByRole('button', { name: 'דלק', exact: true })).toBeVisible();
});

test('T21 expiry presets and clearing the date', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  // next to the amount there's room for 3 / 6 / 12 months
  await s.getByRole('button', { name: 'שנה', exact: true }).click();
  const d = new Date();
  d.setMonth(d.getMonth() + 12);
  const shown = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  await expect(s.getByText(shown)).toBeVisible();
  await s.getByRole('button', { name: 'נקה תאריך' }).click();
  await expect(s.getByText('ללא תוקף')).toBeVisible();
  // without an amount the expiry has the whole row, so "month" shows too
  await s.getByRole('radio', { name: 'אחר' }).click();
  await expect(s.getByRole('button', { name: 'חודש', exact: true })).toBeVisible();
});

test('T22 store suggestions reuse stores already entered', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'א', store: 'שופרסל דיל', type: 'other' }]);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByLabel('איפה אפשר לממש').fill('שופ');
  await s.getByTestId('store-suggestions').getByRole('button', { name: 'שופרסל דיל' }).click();
  await expect(s.getByLabel('איפה אפשר לממש')).toHaveValue('שופרסל דיל');
});
