import { test, expect } from '@playwright/test';
import { chooseType, openTicket, seed, serverCoupons, setup, sheet, ticket } from './helpers';

const HTZONE = 'http://www.htzone.co.il/voucher-zone/10';

test('T47 a coupon can have several categories and is found under each', async ({ page }) => {
  const { familyId } = await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByLabel('שם הקופון').fill('ערב בחוץ');
  await s.getByLabel('איפה אפשר לממש').fill('Buyme');
  await s.getByRole('button', { name: 'מסעדות', exact: true }).click();
  await s.getByRole('button', { name: 'פנאי ובילוי', exact: true }).click();
  await expect(s.getByRole('button', { name: 'מסעדות', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await chooseType(s, 'אחר');
  await s.getByLabel('קוד / מספר שובר').fill('C-100');
  await s.getByTestId('coupon-save').click();
  await expect(ticket(page, 'ערב בחוץ')).toContainText('מסעדות · פנאי ובילוי');
  await expect.poll(async () => (await serverCoupons(page, familyId))[0]?.categories).toEqual(['מסעדות', 'פנאי ובילוי']);

  await seed(page, familyId, [{ title: 'רק אופנה', store: 'x', type: 'other', category: 'אופנה' }]);
  const list = page.getByTestId('coupon-list').getByTestId('coupon-ticket');
  await page.getByTestId('filter-button').click();
  await page.locator('[data-testid="filter-chip"][data-group="cat"][data-value="פנאי ובילוי"]').click();
  await expect(list).toHaveCount(1);
  await page.getByTestId('filter-panel').getByRole('button', { name: 'נקה' }).click();
  await page.locator('[data-testid="filter-chip"][data-group="cat"][data-value="מסעדות"]').click();
  await expect(list).toHaveCount(1);
  await expect(list.first()).toHaveAttribute('data-title', 'ערב בחוץ');

  const d = await openTicket(page, 'ערב בחוץ');
  await expect(d.getByTestId('hero-categories').locator('span')).toHaveCount(2);
});

test('T48 a link in "where to use" and in the notes is tappable; the list shows just the site name', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'All-inZone', store: HTZONE, type: 'money', value: 345, category: 'אחר', notes: 'תקנון: https://example.com/terms' }]);
  await expect(ticket(page, 'All-inZone')).toContainText('htzone.co.il');
  await expect(ticket(page, 'All-inZone')).not.toContainText('voucher-zone');
  const s = await openTicket(page, 'All-inZone');
  const store = s.getByTestId('store-link');
  await expect(store).toHaveAttribute('href', HTZONE);
  await expect(store).toHaveAttribute('target', '_blank');
  await expect(s.getByRole('link', { name: 'https://example.com/terms' })).toHaveAttribute('href', 'https://example.com/terms');
  // the card's header shows the site name and the category in full (nothing cut off)
  await expect(s.getByTestId('coupon-hero')).toContainText('htzone.co.il');
  await expect(s.getByTestId('hero-categories')).toHaveText('אחר');
});

/** Fire a one-finger vertical drag on an element (real touch events, like a phone). */
async function touchDrag(page, locator, dy) {
  await locator.evaluate(async (el, dist) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y0 = r.top + 30;
    // WebKit forbids `new Touch()` from scripts, so build the event by hand where needed
    const point = (y) => ({ identifier: 1, target: el, clientX: x, clientY: y });
    const fire = (type, y) => {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'touches', { value: type === 'touchend' ? [] : [point(y)] });
      Object.defineProperty(ev, 'changedTouches', { value: [point(y)] });
      el.dispatchEvent(ev);
    };
    fire('touchstart', y0);
    for (let i = 1; i <= 8; i++) {
      fire('touchmove', y0 + (dist * i) / 8);
      await new Promise((res) => setTimeout(res, 30));
    }
    fire('touchend', y0 + dist);
  }, dy);
}

test('T49 pulling down on the coupon card closes the sheet; pulling up does not', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'למשוך', store: 'x', type: 'money', value: 100 }]);
  const s = await openTicket(page, 'למשוך');
  await page.waitForTimeout(400); // opening animation
  await touchDrag(page, s.getByTestId('coupon-hero'), -200);
  await page.waitForTimeout(400);
  await expect(s).toBeVisible();
  await touchDrag(page, s.getByTestId('coupon-hero'), 220);
  await expect(s).toBeHidden();
});

test('T50 known chains get their logo; unknown stores keep the category icon', async ({ page }) => {
  await page.route('**/s2/favicons**', (route) => route.fulfill({ path: 'public/icon-192.png', contentType: 'image/png' }));
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'תו קנייה', store: 'שופרסל דיל', type: 'money', value: 200 },
    { title: 'מתנה', store: 'מכולת השכונה', type: 'other' },
  ]);
  const logo = ticket(page, 'תו קנייה').getByTestId('brand-logo');
  await expect(logo).toHaveAttribute('data-domain', 'shufersal.co.il');
  await expect(logo.locator('img')).toHaveJSProperty('complete', true);
  await expect(logo).toBeVisible();
  await expect(ticket(page, 'מתנה').getByTestId('brand-logo')).toHaveCount(0);
});

test('T50b (reported) a Dream Card coupon shows the real Dream Card logo on a wide tile, not the site icon', async ({ page }) => {
  await page.route('**/s2/favicons**', (route) => route.fulfill({ path: 'public/icon-192.png', contentType: 'image/png' }));
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'גיפט קארד', store: 'דרים קארד', type: 'money', value: 300 }]);
  const logo = ticket(page, 'גיפט קארד').getByTestId('brand-logo');
  await expect(logo.locator('img')).toHaveAttribute('src', '/brands/dreamcard.png');
  const box = await logo.boundingBox();
  expect(box.width).toBeGreaterThan(box.height * 1.8);
});

test('T51 a field focused low in the form is scrolled into view', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await page.waitForTimeout(350);
  const code = s.getByLabel('קוד / מספר שובר');
  await code.evaluate((el) => {
    el.closest('.overflow-y-auto').scrollTop = 0;
    el.focus({ preventScroll: true });
  });
  await expect(code).toBeInViewport({ timeout: 3000 });
});

test('T52 a coupon can be marked physical (digital by default) and changed back', async ({ page }) => {
  const { familyId } = await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await expect(s.getByRole('radio', { name: 'דיגיטלי' })).toHaveAttribute('aria-checked', 'true');
  await s.getByLabel('שם הקופון').fill('תו מודפס');
  await s.getByLabel('איפה אפשר לממש').fill('שופרסל');
  await s.getByRole('radio', { name: 'פיזי' }).click();
  await chooseType(s, 'אחר');
  await s.getByLabel('קוד / מספר שובר').fill('C-100');
  await s.getByTestId('coupon-save').click();
  await expect(ticket(page, 'תו מודפס').getByTestId('physical-badge')).toHaveText('פיזי');
  await expect.poll(async () => (await serverCoupons(page, familyId))[0]?.format).toBe('physical');

  const d = await openTicket(page, 'תו מודפס');
  await expect(d.getByTestId('coupon-format')).toContainText('פיזי');
  await d.getByRole('button', { name: 'עריכה' }).click();
  const f = sheet(page, 'עריכת קופון');
  await expect(f.getByRole('radio', { name: 'פיזי' })).toHaveAttribute('aria-checked', 'true');
  await f.getByRole('radio', { name: 'דיגיטלי' }).click();
  await f.getByTestId('coupon-save').click();
  await expect(ticket(page, 'תו מודפס').getByTestId('physical-badge')).toHaveCount(0);
  await expect.poll(async () => (await serverCoupons(page, familyId))[0]?.format).toBe('digital');
});

test('T53 the new-coupon form fits one screen; "more details" makes it grow', async ({ page }) => {
  // iPhone home-screen app height (no Safari toolbars)
  await page.setViewportSize({ width: 390, height: 780 });
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await page.waitForTimeout(400);
  const body = s.locator('.overflow-y-auto');
  const fits = () => body.evaluate((el) => el.scrollHeight <= el.clientHeight + 2);
  expect(await fits()).toBe(true);
  // amount and expiry on one row
  const value = await s.locator('[data-field="value"]').boundingBox();
  const expiry = await s.locator('[data-field="expiry"]').boundingBox();
  expect(Math.abs(value.y - expiry.y)).toBeLessThan(2);
  // categories in at most two rows
  const rows = await s.locator('[data-field="category"] button').evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))).size);
  expect(rows).toBeLessThanOrEqual(2);
  await s.getByRole('button', { name: 'פרטים נוספים' }).click();
  await expect(s.getByLabel('הערות')).toBeAttached();
  expect(await fits()).toBe(false);
});

test('T60 (reported) the new-coupon form does not close from a pull inside it; with typed data closing asks first', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await page.waitForTimeout(400);
  // a pull down inside the form is a scroll, never a close
  await touchDrag(page, s.getByText('קטגוריות'), 260);
  await expect(s).toBeVisible();
  await s.getByLabel('שם הקופון').fill('חצי מוכן');
  // a real pull on the handle / header: asks before throwing away what was typed
  await touchDrag(page, s.getByRole('heading', { name: 'קופון חדש' }), 240);
  const ask = page.getByRole('alertdialog');
  await expect(ask).toContainText('לסגור בלי לשמור?');
  await ask.getByRole('button', { name: 'המשך עריכה' }).click();
  await expect(s).toBeVisible();
  await expect(s.getByLabel('שם הקופון')).toHaveValue('חצי מוכן');
  // X asks too, and "close" closes
  await s.getByRole('button', { name: 'סגור' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'סגירה' }).click();
  await expect(s).toBeHidden();
  // an untouched form closes straight away
  await page.getByTestId('fab-add').click();
  await expect(s).toBeVisible();
  await s.getByRole('button', { name: 'סגור' }).click();
  await expect(s).toBeHidden();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test('T61 optional 3-digit verification code behind a switch, shown and copyable on the coupon', async ({ page }) => {
  const { familyId } = await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByLabel('שם הקופון').fill('כרטיס מתנה');
  await s.getByLabel('איפה אפשר לממש').fill('דרים קארד');
  await s.locator('#value').fill('250');
  await s.locator('#code').fill('5326-1188');
  await expect(s.locator('#cvv')).toHaveCount(0);
  await s.getByRole('switch', { name: 'קוד אימות' }).click();
  const cvv = s.locator('#cvv');
  await cvv.fill('4a07');
  await expect(cvv).toHaveValue('407'); // digits only, at most 3
  await cvv.fill('40');
  await page.getByTestId('coupon-save').click();
  await expect(s.getByText('קוד אימות הוא 3 ספרות')).toBeVisible();
  await cvv.fill('407');
  await page.getByTestId('coupon-save').click();
  await expect(s).toBeHidden();
  const [c] = await serverCoupons(page, familyId);
  expect(c.cvv).toBe('407');
  const d = await openTicket(page, 'כרטיס מתנה');
  await expect(d.getByTestId('copy-cvv')).toContainText('407');
  await expect(d.getByTestId('copy-cvv')).toContainText('קוד אימות');
});
