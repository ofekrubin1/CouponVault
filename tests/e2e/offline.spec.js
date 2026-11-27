import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { adminRead, adminWrite, openTicket, seed, setup, ticket } from './helpers';

const VOUCHER = new Uint8Array(readFileSync('tests/e2e/fixtures/voucher.jpg'));

/** A coupon whose photo was added on another phone: this phone has to download it by itself. */
async function couponWithPhotoFromElsewhere(page, familyId) {
  const [id] = await seed(page, familyId, [{ title: 'שובר בלי קליטה', store: 'שופרסל', type: 'money', value: 200, code: '7290012345678' }]);
  await adminWrite(`families/${familyId}/coupons/${id}/media/photo`, { data: VOUCHER, type: 'image/jpeg', w: 800, h: 560 });
  await adminWrite(`families/${familyId}/coupons/${id}`, { hasPhoto: true }, ['hasPhoto']);
  return id;
}

test('T85 without signal the app still opens, shows the coupons and their photos, and a use made offline syncs later', async ({ page, context }) => {
  const { familyId } = await setup(page);
  const id = await couponWithPhotoFromElsewhere(page, familyId);
  // online: the app gets saved on the device, and the photo downloads in the background
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 20000 });
  await expect.poll(() => page.evaluate(([f, c]) => window.__cv.photoOnDevice(f, c), [familyId, id]), { timeout: 20000 }).toBe(true);

  // no signal, and the app is opened again from scratch
  await context.setOffline(true);
  await page.reload();
  await expect(ticket(page, 'שובר בלי קליטה')).toBeVisible({ timeout: 20000 });
  const d = await openTicket(page, 'שובר בלי קליטה');
  await expect(d.getByTestId('photo-row')).toContainText('הקשה להגדלה');
  await d.getByTestId('photo-row').click();
  const img = page.getByTestId('photo-viewer').getByRole('img', { name: 'תמונת השובר' });
  await expect.poll(() => img.evaluate((el) => el.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'סגירה' }).click();

  // used at the till without signal: saved on the phone…
  await d.getByRole('button', { name: 'מימשתי הכול' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'כן, מימשתי' }).click();
  await expect(ticket(page, 'שובר בלי קליטה')).toHaveCount(0);
  expect((await adminRead(`families/${familyId}/coupons/${id}`)).status).toBe('active'); // the server doesn't know yet
  // …and sent once the signal is back
  await context.setOffline(false);
  await expect.poll(async () => (await adminRead(`families/${familyId}/coupons/${id}`)).status, { timeout: 30000 }).toBe('used');
});

test('T86 online the page always comes fresh from the server; the saved copy is only for no signal', async ({ page, context }) => {
  await setup(page);
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 20000 });
  // the version check is never answered from the saved copy (so updates still arrive)
  const offlineVersion = async () => page.evaluate(() => fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' }).then(() => 'answered', () => 'failed'));
  await context.setOffline(true);
  expect(await offlineVersion()).toBe('failed');
  await context.setOffline(false);
  // online, a page load is served by the network: the server's answer carries its own headers
  const res = await page.reload();
  expect(res.headers()['content-type']).toContain('text/html');
  expect(await page.evaluate(() => performance.getEntriesByType('navigation')[0].transferSize)).toBeGreaterThan(0);
});
