import { test, expect } from '@playwright/test';
import { addCoupon, chooseType, isoIn, openTicket, seed, serverCoupons, setup, sheet, stubClipboard, tab, ticket } from './helpers';

test('T12 add a money voucher with every field', async ({ page }) => {
  const { familyId } = await setup(page);
  await addCoupon(page, { title: 'Buyme 200', store: 'Buyme', category: 'כללי', value: 200, expiry: isoIn(90), code: 'BM-7781' });
  await expect(page.getByRole('status')).toHaveText('הקופון נוסף');
  const t = ticket(page, 'Buyme 200');
  await expect(t).toBeVisible();
  await expect(t).toContainText('₪200');
  await expect(t).toContainText('Buyme');
  await expect(t).toContainText('כללי');
  await expect.poll(async () => (await serverCoupons(page, familyId)).length).toBe(1);
  const [saved] = await serverCoupons(page, familyId);
  expect(saved).toMatchObject({ title: 'Buyme 200', store: 'Buyme', type: 'money', value: 200, balance: 200, code: 'BM-7781', status: 'active', expiry: isoIn(90) });
});

test('T13 (reported bug) a new coupon saves, closes the sheet and shows up right away', async ({ page }) => {
  const { familyId } = await setup(page);
  await addCoupon(page, { title: 'Buyme', store: 'Buyme all', value: 200, expiry: '2030-11-15', code: '144536801' });
  await expect(ticket(page, 'Buyme')).toBeVisible();
  await expect(sheet(page, 'קופון חדש')).toBeHidden();
  await expect.poll(async () => (await serverCoupons(page, familyId))[0]?.code).toBe('144536801');
});

test('T13b the coupon code is required', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByLabel('שם הקופון').fill('בלי קוד');
  await s.getByLabel('איפה אפשר לממש').fill('זארה');
  await chooseType(s, 'אחר');
  await s.getByTestId('coupon-save').click();
  await expect(s).toBeVisible();
  await expect(s.getByText('חסר קוד / מספר שובר')).toBeVisible();
  await expect(s.getByLabel('קוד / מספר שובר')).toBeFocused();
  await s.getByLabel('קוד / מספר שובר').fill('Z-77');
  await s.getByTestId('coupon-save').click();
  await expect(s).toBeHidden();
  await expect(ticket(page, 'בלי קוד')).toBeVisible();
});

test('T14 empty form: inline errors on name and store, sheet stays open', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByTestId('coupon-save').click();
  await expect(s).toBeVisible();
  await expect(s.getByText('חסר שם לקופון')).toBeVisible();
  await expect(s.getByText('חסר איפה אפשר לממש')).toBeVisible();
  await expect(s.getByText('חסר קוד / מספר שובר')).toBeVisible();
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
  const err = s.getByText('בשובר כספי צריך סכום', { exact: false });
  await expect(err).toBeVisible();
  await expect(err).toBeInViewport();
  // switching to "product" removes the need for an amount
  await chooseType(s, 'מוצר');
  await s.getByLabel('קוד / מספר שובר').fill('C-100');
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
  await seed(page, familyId, [{ title: 'שובר ישן', store: 'סופר', code: 'OLD-1', type: 'money', value: 200, balance: 150, usages: [{ at: new Date().toISOString(), by: 'x', byName: 'x', amount: 50 }] }]);
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
  await chooseType(s, 'אחר');
  await s.getByLabel('קוד / מספר שובר').fill('C-100');
  await s.getByTestId('coupon-save').click();
  await expect(ticket(page, 'תדלוק')).toContainText('דלק');
  await tab(page, 'הגדרות');
  await expect(page.getByRole('button', { name: 'הסר דלק' })).toBeVisible();
  // and it's offered next time
  await tab(page, 'קופונים');
  await page.getByTestId('fab-add').click();
  await expect(sheet(page, 'קופון חדש').getByRole('button', { name: 'דלק', exact: true })).toBeVisible();
});

test('T21 expiry date can be set and cleared (no month shortcuts)', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await expect(s.getByRole('button', { name: 'שנה', exact: true })).toHaveCount(0);
  await expect(s.getByRole('button', { name: 'חודש', exact: true })).toHaveCount(0);
  await s.locator('#expiry').fill('2031-04-01');
  await expect(s.getByText('01/04/2031')).toBeVisible();
  await s.getByRole('button', { name: 'נקה תאריך' }).click();
  await expect(s.getByText('ללא תוקף')).toBeVisible();
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

test('T57 (reported bug) editing: a tap inside a field moves the cursor and text can be selected', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'שובר לעריכה', store: 'זארה', type: 'money', value: 100, code: 'ABCDEFGHIJKL' }]);
  const s = await openTicket(page, 'שובר לעריכה');
  await s.getByRole('button', { name: 'עריכה' }).click();
  const f = sheet(page, 'עריכת קופון');
  await expect(f).toBeVisible();
  // the sheet must not stay a transformed / will-change layer (breaks the iOS cursor in fields)
  await page.waitForTimeout(400);
  expect(await f.evaluate((el) => [getComputedStyle(el).willChange, el.style.transform])).toEqual(['auto', '']);

  const code = f.locator('#code');
  const body = f.locator('.overflow-y-auto');
  // focusing a field that is already visible must not move the form (it would drag the text from under the finger)
  await body.evaluate((el) => (el.scrollTop = 0));
  const title = f.getByLabel('שם הקופון');
  await title.tap();
  await page.waitForTimeout(700);
  expect(await body.evaluate((el) => el.scrollTop)).toBe(0);
  await code.tap();
  await page.waitForTimeout(700);
  // tap near the start of the (left-to-right) code: the cursor goes there, not to the end.
  // (Desktop WebKit's iPhone emulation never moves the cursor on a second tap, so this part runs on Android.)
  if (test.info().project.name === 'android') {
    const box = await code.boundingBox();
    await code.tap({ position: { x: 44, y: box.height / 2 } });
    await expect.poll(() => code.evaluate((el) => el.selectionStart)).toBeLessThan(4);
  }
  // selecting part of the text works and typing replaces just that part
  await code.evaluate((el) => el.setSelectionRange(0, 4));
  await page.keyboard.type('WXYZ');
  await expect(code).toHaveValue('WXYZEFGHIJKL');
});

test('T58 a product voucher (e.g. a McRoyal meal) is saved without an amount', async ({ page }) => {
  const { familyId } = await setup(page);
  await addCoupon(page, { title: 'ארוחת מקרויאל', store: 'מקדונלדס', type: 'product' });
  const t = ticket(page, 'ארוחת מקרויאל');
  await expect(t).toBeVisible();
  await expect(t).toContainText('מוצר');
  const [c] = await serverCoupons(page, familyId);
  expect(c.type).toBe('product');
  expect(c.value).toBeNull();
  // a money voucher without an amount points to the product type
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByLabel('שם הקופון').fill('בלי סכום');
  await s.getByLabel('איפה אפשר לממש').fill('זארה');
  await s.locator('#code').fill('X1');
  await page.getByTestId('coupon-save').click();
  await expect(s.getByRole('alert').first()).toContainText('שובר למוצר? בחרו "מוצר"');
});

test('T59 the coupon type is a drop-down beside the name: pick, outside tap and Escape close only the menu', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  const type = s.getByRole('button', { name: 'סוג הקופון' });
  await expect(type).toHaveText('כספי');
  await page.waitForTimeout(450); // sheet slide-in
  // same row as the name, on its left
  const [t, n] = [await type.boundingBox(), await s.getByLabel('שם הקופון').boundingBox()];
  expect(Math.abs(t.y + t.height / 2 - (n.y + n.height / 2))).toBeLessThan(3);
  expect(t.x).toBeLessThan(n.x);
  // the code has the whole row; digital / physical moved under "more details"
  const c = await s.locator('#code').boundingBox();
  expect(c.width).toBeGreaterThan(n.width);
  await expect(s.getByRole('radiogroup', { name: 'דיגיטלי או פיזי' })).toHaveCount(0);

  await type.click();
  const menu = s.getByRole('listbox', { name: 'סוג הקופון' });
  await expect(menu.getByRole('option')).toHaveText(['שובר כספי', 'הנחה באחוזים', 'שובר למוצר', 'אחר']);
  await menu.getByRole('option', { name: 'הנחה באחוזים' }).click();
  await expect(menu).toBeHidden();
  await expect(type).toHaveText('אחוזים');
  await expect(s.getByText('אחוז הנחה')).toBeVisible();

  await type.click();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(s).toBeVisible();
  await type.click();
  await s.getByText('קטגוריות').click();
  await expect(menu).toBeHidden();
  await expect(type).toHaveText('אחוזים');
});

test('T63 the phone back button asks before closing a coupon form with typed data', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByLabel('שם הקופון').fill('חצי מוכן');
  await page.goBack();
  const ask = page.getByRole('alertdialog', { name: 'לסגור בלי לשמור?' });
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: 'המשך עריכה' }).click();
  await expect(s).toBeVisible();
  await expect(s.getByLabel('שם הקופון')).toHaveValue('חצי מוכן');
  // back again, and this time close
  await page.goBack();
  await ask.getByRole('button', { name: 'סגירה' }).click();
  await expect(s).toBeHidden();
  // an untouched form closes straight away
  await page.getByTestId('fab-add').click();
  await expect(s).toBeVisible();
  await page.goBack();
  await expect(s).toBeHidden();
  await expect(ask).toHaveCount(0);
});
