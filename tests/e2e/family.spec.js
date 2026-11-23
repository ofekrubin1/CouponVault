import { test, expect } from '@playwright/test';
import { addCoupon, createFamily, login, secondPhone, setup, tab, ticket } from './helpers';

async function inviteCode(page) {
  await tab(page, 'הגדרות');
  const code = (await page.getByTestId('invite-code').textContent()).trim();
  await tab(page, 'קופונים');
  return code;
}

async function joinWithCode(page, code) {
  await page.getByRole('button', { name: /הצטרפות בקוד/ }).click();
  await page.getByLabel('קוד הזמנה').fill(code);
  await page.getByRole('button', { name: 'הצטרף' }).click();
}

test('T04 create a family: empty state and the family name in the header', async ({ page }) => {
  await login(page);
  await createFamily(page, 'משפחת לוי');
  await expect(page.getByRole('heading', { name: 'משפחת לוי' })).toBeVisible();
  await expect(page.getByText('אין קופונים פעילים')).toBeVisible();
});

test('T05 joining with an unknown code shows an error', async ({ page }) => {
  await login(page);
  await joinWithCode(page, 'ZZZZ99');
  await expect(page.getByRole('alert')).toHaveText('הקוד לא נמצא. בדוק שהקלדת נכון');
});

test('T06 second member joins by code; both phones see coupons in real time', async ({ page, browser }, testInfo) => {
  await setup(page, { name: 'אמא', family: 'משפחה משותפת' });
  await addCoupon(page, { title: 'שובר זארה', store: 'זארה', value: 300 });
  const code = await inviteCode(page);

  const b = await secondPhone(browser, testInfo);
  await login(b.page, { name: 'אבא' });
  await joinWithCode(b.page, code);
  await expect(b.page.getByRole('heading', { name: 'משפחה משותפת' })).toBeVisible();
  await expect(ticket(b.page, 'שובר זארה')).toBeVisible();

  // a coupon added on phone A shows up on phone B without reloading
  await addCoupon(page, { title: 'קפה חינם', store: 'ארומה', type: 'other' });
  await expect(ticket(b.page, 'קפה חינם')).toBeVisible();
  // and the other way round
  await addCoupon(b.page, { title: 'הנחה בסופר', store: 'שופרסל', type: 'percent', value: 15 });
  await expect(ticket(page, 'הנחה בסופר')).toBeVisible();
  await b.ctx.close();
});

test('T07 invite link (?join=CODE) pre-fills the code for a new user', async ({ page, browser }, testInfo) => {
  await setup(page, { family: 'משפחת קישור' });
  const code = await inviteCode(page);
  const b = await secondPhone(browser, testInfo);
  await login(b.page, { path: `/?join=${code}` });
  await expect(b.page.getByLabel('קוד הזמנה')).toHaveValue(code);
  await b.page.getByRole('button', { name: 'הצטרף' }).click();
  await expect(b.page.getByRole('heading', { name: 'משפחת קישור' })).toBeVisible();
  await b.ctx.close();
});

test('T08 a regenerated invite code replaces the old one', async ({ page, browser }, testInfo) => {
  await setup(page);
  const oldCode = await inviteCode(page);
  await tab(page, 'הגדרות');
  await page.getByRole('button', { name: 'קוד חדש' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'צור קוד חדש' }).click();
  await expect(page.getByTestId('invite-code')).not.toHaveText(oldCode);

  const b = await secondPhone(browser, testInfo);
  await login(b.page);
  await joinWithCode(b.page, oldCode);
  await expect(b.page.getByRole('alert')).toHaveText('הקוד לא נמצא. בדוק שהקלדת נכון');
  await b.ctx.close();
});

test('T09 removing a member takes away their access immediately', async ({ page, browser }, testInfo) => {
  await setup(page, { name: 'מנהלת' });
  const code = await inviteCode(page);
  const b = await secondPhone(browser, testInfo);
  await login(b.page, { name: 'יוסי' });
  await joinWithCode(b.page, code);
  await expect(b.page.locator('[data-family-id]')).toBeVisible();

  await tab(page, 'הגדרות');
  await expect(page.getByTestId('members').getByText('יוסי')).toBeVisible();
  await page.getByTestId('members').getByRole('button', { name: 'הסר' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'הסר' }).click();
  await expect(page.getByTestId('members').getByText('יוסי')).toBeHidden();
  // Yossi's phone drops back to the welcome screen
  await expect(b.page.getByRole('button', { name: /משפחה חדשה/ })).toBeVisible();
  await b.ctx.close();
});

test('T10 leaving a family', async ({ page, browser }, testInfo) => {
  await setup(page, { name: 'רותי' });
  const code = await inviteCode(page);
  const b = await secondPhone(browser, testInfo);
  await login(b.page, { name: 'עוזב' });
  await joinWithCode(b.page, code);
  await tab(b.page, 'הגדרות');
  await b.page.getByRole('button', { name: 'עזיבת המשפחה' }).click();
  await b.page.getByRole('alertdialog').getByRole('button', { name: 'עזוב' }).click();
  await expect(b.page.getByRole('button', { name: /משפחה חדשה/ })).toBeVisible();
  await tab(page, 'הגדרות');
  await expect(page.getByTestId('members').locator('li')).toHaveCount(1);
  await b.ctx.close();
});

test('T11 several families: switcher in the header keeps their coupons apart', async ({ page }) => {
  await setup(page, { family: 'בית' });
  await addCoupon(page, { title: 'קופון של הבית', store: 'איקאה', value: 100 });
  await tab(page, 'הגדרות');
  await page.getByTestId('my-families').locator('..').getByRole('button', { name: /משפחה חדשה/ }).click();
  await page.getByLabel('שם המשפחה', { exact: true }).fill('עבודה');
  await page.getByRole('button', { name: 'צור משפחה' }).click();
  await tab(page, 'קופונים');
  await expect(page.getByTestId('family-switcher')).toContainText('עבודה');
  await expect(page.getByText('אין קופונים פעילים')).toBeVisible();

  await page.getByTestId('family-switcher').click();
  await page.getByRole('menuitem', { name: 'בית' }).click();
  await expect(page.getByTestId('family-switcher')).toContainText('בית');
  await expect(ticket(page, 'קופון של הבית')).toBeVisible();
});

test('T54 joining succeeds on the first try even when the phone is slow to update its family list', async ({ page, browser }, testInfo) => {
  await setup(page, { family: 'משפחה איטית' });
  const code = await inviteCode(page);
  const b = await secondPhone(browser, testInfo);
  // the joining phone receives family-list updates 20s late (a slow cold start)
  await b.page.addInitScript(() => {
    window.__cvFamiliesDelay = 20000;
  });
  await login(b.page, { name: 'אישה' });
  await expect(b.page.getByRole('button', { name: /הצטרפות בקוד/ })).toBeVisible({ timeout: 30000 });
  await joinWithCode(b.page, code);
  await expect(b.page.getByRole('status')).toHaveText('הצטרפת ל"משפחה איטית" 🎉', { timeout: 15000 });
  await expect(b.page.getByRole('alert')).toHaveCount(0);
  // the inviting phone sees the new member
  await tab(page, 'הגדרות');
  await expect(page.getByTestId('members').getByText('אישה')).toBeVisible();
  await b.ctx.close();
});

test('T55 the expiry alert is personal: changing it does not change it for the rest of the family', async ({ page, browser }, testInfo) => {
  const { familyId } = await setup(page, { name: 'אופק', family: 'רובין' });
  await page.evaluate(async (fid) => {
    const d = new Date();
    d.setDate(d.getDate() + 20);
    const iso = d.toISOString().slice(0, 10);
    await window.__cv.seedCoupon(fid, { title: 'בעוד 20 יום', store: 'x', code: 'X', type: 'other', expiry: iso });
  }, familyId);
  const code = await inviteCode(page);
  const b = await secondPhone(browser, testInfo);
  await login(b.page, { name: 'דנה' });
  await joinWithCode(b.page, code);
  await expect(b.page.locator('[data-family-id]')).toBeVisible();

  // Ofek widens his window to 30 days → the coupon is "about to expire" for him only
  await tab(page, 'הגדרות');
  await page.getByRole('radio', { name: '30 ימים' }).click();
  await tab(page, 'קופונים');
  await expect(page.getByTestId('summary-expiring')).toHaveText('1 פגים בקרוב');
  await expect(page.getByTestId('row-expiry')).toHaveAttribute('data-urgency', 'gold');
  await b.page.waitForTimeout(1500);
  await expect(b.page.getByTestId('summary-expiring')).toHaveCount(0);
  await expect(b.page.getByTestId('row-expiry')).not.toHaveAttribute('data-urgency', /./);
  await tab(b.page, 'הגדרות');
  await expect(b.page.getByRole('radio', { name: '14 ימים' })).toHaveAttribute('aria-checked', 'true');
  await b.ctx.close();
});
