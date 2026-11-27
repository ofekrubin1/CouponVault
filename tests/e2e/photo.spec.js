import { test, expect } from '@playwright/test';
import { openTicket, serverCoupons, setup, sheet, ticket } from './helpers';

const VOUCHER = 'tests/e2e/fixtures/voucher.jpg'; // a landscape voucher photo with a barcode

/** The stored photo of a coupon, as the server has it: { size, w, h } or null. */
const storedPhoto = (page, familyId, id) =>
  page.evaluate(async ([fid, cid]) => {
    const p = await window.__cv.data.loadPhoto(fid, cid);
    return p && { size: p.blob.size, w: p.w, h: p.h };
  }, [familyId, id]);

async function newCouponWithPhoto(page, title) {
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByLabel('שם הקופון').fill(title);
  await s.getByLabel('איפה אפשר לממש').fill('שופרסל');
  await s.locator('#value').fill('200');
  await s.getByLabel('קוד / מספר שובר').fill('7290012345678');
  await s.getByTestId('photo-input').setInputFiles(VOUCHER);
  await expect(s.getByTestId('photo-thumb')).toBeVisible();
  await s.getByTestId('coupon-save').click();
  await expect(s).toBeHidden();
}

test('T82 a voucher photo attaches beside the code, is stored small, and opens full screen for the till', async ({ page }) => {
  const { familyId } = await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await page.waitForTimeout(450); // sheet slide-in (both boxes are measured one after the other)
  // the camera button sits beside the code field, on the same row
  const [cam, code] = [await s.getByRole('button', { name: 'צירוף תמונה של השובר' }).boundingBox(), await s.getByLabel('קוד / מספר שובר').boundingBox()];
  expect(Math.abs(cam.y + cam.height / 2 - (code.y + code.height / 2))).toBeLessThan(4);
  expect(cam.x + cam.width).toBeLessThan(code.x + 1);
  await s.getByRole('button', { name: 'סגור' }).click();

  await newCouponWithPhoto(page, 'תו עם ברקוד');
  const [c] = await serverCoupons(page, familyId);
  expect(c.hasPhoto).toBe(true);
  await expect.poll(() => storedPhoto(page, familyId, c.id)).not.toBeNull();
  const p = await storedPhoto(page, familyId, c.id);
  expect(p.size).toBeLessThan(700 * 1024);
  expect(p.w).toBeGreaterThan(p.h); // still the landscape photo

  // on the coupon: a slim row under the code; tap → full screen, turned sideways on the phone
  const d = await openTicket(page, 'תו עם ברקוד');
  const row = d.getByTestId('photo-row');
  await expect(row).toContainText('הקשה להגדלה');
  await row.click();
  const viewer = page.getByTestId('photo-viewer');
  await expect(viewer).toBeVisible();
  const img = viewer.getByRole('img', { name: 'תמונת השובר' });
  await expect.poll(() => img.evaluate((el) => el.naturalWidth)).toBeGreaterThan(0);
  await expect(img).toHaveAttribute('data-rotated', 'true');
  // the back button closes it, back to the coupon
  await page.goBack();
  await expect(viewer).toHaveCount(0);
  await expect(d).toBeVisible();
});

test('T83 the photo can be removed when editing; the row goes away and the photo is deleted', async ({ page }) => {
  const { familyId } = await setup(page);
  await newCouponWithPhoto(page, 'להסיר תמונה');
  const [c] = await serverCoupons(page, familyId);
  await expect.poll(() => storedPhoto(page, familyId, c.id)).not.toBeNull();
  const d = await openTicket(page, 'להסיר תמונה');
  await d.getByRole('button', { name: 'עריכה' }).click();
  const f = sheet(page, 'עריכת קופון');
  await expect(f.getByTestId('photo-thumb')).toBeVisible(); // the stored photo shows in the form
  await f.getByRole('button', { name: 'הסרת התמונה' }).click();
  await expect(f.getByRole('button', { name: 'צירוף תמונה של השובר' })).toBeVisible();
  await f.getByTestId('coupon-save').click();
  await expect(f).toBeHidden();
  await expect.poll(async () => (await serverCoupons(page, familyId))[0].hasPhoto).toBe(false);
  await expect.poll(() => storedPhoto(page, familyId, c.id)).toBeNull();
  const again = await openTicket(page, 'להסיר תמונה');
  await expect(again.getByTestId('photo-row')).toHaveCount(0);
});

test('T84 deleting a coupon deletes its photo too (no space left taken); the photo survives a reload', async ({ page }) => {
  const { familyId } = await setup(page);
  await newCouponWithPhoto(page, 'למחיקה');
  const [c] = await serverCoupons(page, familyId);
  await expect.poll(() => storedPhoto(page, familyId, c.id)).not.toBeNull();
  await page.reload();
  const d = await openTicket(page, 'למחיקה');
  await expect(d.getByTestId('photo-row')).toContainText('הקשה להגדלה');
  await d.getByRole('button', { name: 'מחיקה' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'מחק' }).click();
  await expect(ticket(page, 'למחיקה')).toHaveCount(0);
  await expect.poll(() => storedPhoto(page, familyId, c.id)).toBeNull();
});
