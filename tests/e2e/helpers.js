import { expect } from '@playwright/test';

/** Local YYYY-MM-DD, `days` from today. */
export function isoIn(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const uniq = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Make the clipboard observable in every browser engine. */
export async function stubClipboard(page) {
  await page.addInitScript(() => {
    window.__copied = [];
    const writeText = async (t) => {
      window.__copied.push(t);
    };
    try {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    } catch {
      navigator.clipboard.writeText = writeText;
    }
  });
}

/** Opens the app and signs in as a fresh user (Auth emulator, no Google popup). */
export async function login(page, { name = 'דנה כהן', email, path = '/' } = {}) {
  const mail = email || `u-${uniq()}@test.dev`;
  await page.goto(path);
  await page.waitForFunction(() => !!window.__cv);
  const uid = await page.evaluate(([e, n]) => window.__cv.login(e, n), [mail, name]);
  return { email: mail, name, uid };
}

export async function createFamily(page, name = 'משפחת בדיקה') {
  await page.getByRole('button', { name: /משפחה חדשה/ }).click();
  await page.getByLabel('שם המשפחה', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'צור משפחה' }).click();
  await expect(page.locator('[data-family-id]')).toBeVisible();
  return page.locator('[data-family-id]').getAttribute('data-family-id');
}

/** Signed-in user with a family; returns { user, familyId }. */
export async function setup(page, opts = {}) {
  const user = await login(page, opts);
  const familyId = await createFamily(page, opts.family || 'משפחת בדיקה');
  return { user, familyId };
}

/** Writes coupons straight to the database (through the app's own SDK, as the signed-in member). */
export async function seed(page, familyId, coupons) {
  return page.evaluate(
    async ([fid, list]) => {
      const ids = [];
      for (const c of list) ids.push(await window.__cv.seedCoupon(fid, c));
      return ids;
    },
    [familyId, coupons],
  );
}

export async function serverCoupons(page, familyId) {
  return page.evaluate((fid) => window.__cv.serverCoupons(fid), familyId);
}

export const sheet = (page, name) => page.getByRole('dialog', { name });

/** Fill and submit the "new coupon" sheet. */
export async function addCoupon(page, c) {
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await expect(s).toBeVisible();
  await s.getByLabel('שם הקופון').fill(c.title);
  await s.getByLabel('איפה אפשר לממש').fill(c.store);
  if (c.category) await s.getByRole('button', { name: c.category, exact: true }).click();
  if (c.type === 'percent') await s.getByRole('radio', { name: 'אחוזים' }).click();
  if (c.type === 'other') await s.getByRole('radio', { name: 'אחר' }).click();
  if (c.value != null) await s.locator('#value').fill(String(c.value));
  if (c.expiry) await s.locator('#expiry').fill(c.expiry);
  if (c.code) await s.getByLabel('קוד / מספר שובר').fill(c.code);
  await s.getByTestId('coupon-save').click();
  await expect(s).toBeHidden();
}

export const ticket = (page, title) => page.locator(`[data-testid="coupon-ticket"][data-title="${title}"]`);

export async function openTicket(page, title) {
  await ticket(page, title).click();
  const s = sheet(page, title);
  await expect(s).toBeVisible();
  return s;
}

export async function tab(page, name) {
  await page.getByRole('navigation', { name: 'ניווט' }).getByRole('button', { name }).click();
}

/** A second phone (separate browser context) with the same device profile as the current project. */
export async function secondPhone(browser, testInfo) {
  const u = testInfo.project.use;
  const ctx = await browser.newContext({
    viewport: u.viewport,
    userAgent: u.userAgent,
    deviceScaleFactor: u.deviceScaleFactor,
    isMobile: u.isMobile,
    hasTouch: u.hasTouch,
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    baseURL: 'http://127.0.0.1:5180',
  });
  return { ctx, page: await ctx.newPage() };
}

export async function noHorizontalOverflow(page) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw, 'page must not scroll sideways').toBeLessThanOrEqual(cw + 1);
}
