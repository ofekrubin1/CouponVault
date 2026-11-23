import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { openTicket, seed, setup, tab } from './helpers';

/**
 * The share sheet and the "save as" window can't open in a test browser, so they're replaced by stand-ins that
 * keep what the app handed them. `picker`: whether there's a save window (computers); phones share instead.
 */
async function captureFiles(page, { picker }) {
  await page.addInitScript((hasPicker) => {
    const read = (f) =>
      new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve({ name: f.name, type: f.type, size: f.size, dataUrl: r.result });
        r.readAsDataURL(f);
      });
    window.__shared = [];
    window.__saved = [];
    navigator.canShare = (d) => !!d?.files?.length;
    navigator.share = async (d) => window.__shared.push({ title: d.title, text: d.text, files: await Promise.all(d.files.map(read)) });
    if (hasPicker) {
      window.showSaveFilePicker = async (opts) => {
        const parts = [];
        return { createWritable: async () => ({ write: async (b) => parts.push(b), close: async () => { const blob = new Blob(parts); window.__saved.push({ name: opts.suggestedName, text: await blob.text(), head: [...new Uint8Array(await blob.slice(0, 3).arrayBuffer())] }); } }) };
      };
    } else {
      delete window.showSaveFilePicker;
    }
  }, picker);
}

const full = { title: 'שובר מתנה', store: 'Buyme', type: 'money', value: 400, balance: 250, code: 'BM-48213', cvv: '412', expiry: '2031-04-01', format: 'physical', notes: 'רק בסניפים' };

test('T67 sharing a coupon sends an image of it with its details as text', async ({ page }, info) => {
  await page.route('**/s2/favicons**', (route) => route.fulfill({ path: 'public/icon-192.png', contentType: 'image/png' })); // like Google: no CORS header
  await captureFiles(page, { picker: false });
  const { familyId } = await setup(page);
  await seed(page, familyId, [full]);
  const s = await openTicket(page, 'שובר מתנה');
  const button = s.getByRole('button', { name: 'שיתוף' });
  await expect(button).toBeEnabled({ timeout: 15000 }); // the image is ready
  await button.click();
  await expect.poll(() => page.evaluate(() => window.__shared.length)).toBe(1);
  const [sent] = await page.evaluate(() => window.__shared);
  expect(sent.title).toBe('שובר מתנה');
  for (const part of ['BM-48213', '412', '₪250', 'מתוך ₪400', '01/04/2031', 'רק בסניפים']) expect(sent.text).toContain(part);
  expect(sent.files).toHaveLength(1);
  const [img] = sent.files;
  expect(img).toMatchObject({ name: 'שובר מתנה.png', type: 'image/png' });
  expect(img.size).toBeGreaterThan(20000);
  // it's a real picture, the card's width
  const width = await page.evaluate(async (url) => (await createImageBitmap(await (await fetch(url)).blob())).width, img.dataUrl);
  expect(width).toBe(1080);
  writeFileSync(`test-results/shared-coupon-${info.project.name}.png`, Buffer.from(img.dataUrl.split(',')[1], 'base64'));
});

test('T68 backup saves every family and all its coupons (archive too) as one JSON file', async ({ page }, info) => {
  const phone = info.project.name === 'iphone'; // an iPhone has no save window: the share sheet ("Save to Files")
  await captureFiles(page, { picker: !phone });
  const { familyId } = await setup(page);
  const at = new Date().toISOString();
  await seed(page, familyId, [full, { title: 'שנוצל', store: 'דומינוס', type: 'money', value: 120, balance: 0, status: 'used', usedAt: at, usedByName: 'דנה', code: 'D-1' }]);
  await tab(page, 'הגדרות');
  const button = page.getByTestId('backup-button');
  await expect(button).toContainText('1 משפחות, 2 קופונים', { timeout: 15000 });
  await button.click();

  let name;
  let json;
  let head;
  if (phone) {
    await expect.poll(() => page.evaluate(() => window.__shared.length)).toBe(1);
    const [sent] = await page.evaluate(() => window.__shared);
    name = sent.files[0].name;
    expect(sent.files[0].type).toBe('application/json');
    json = await page.evaluate(async (url) => (await fetch(url)).text(), sent.files[0].dataUrl);
    head = [...Buffer.from(sent.files[0].dataUrl.split(',')[1], 'base64').subarray(0, 3)];
  } else {
    await expect.poll(() => page.evaluate(() => window.__saved.length)).toBe(1);
    [{ name, text: json, head }] = await page.evaluate(() => window.__saved);
  }
  expect(head).toEqual([0xef, 0xbb, 0xbf]); // the UTF-8 mark, so Hebrew reads right in Notepad / Excel
  expect(name).toMatch(/^couponvault-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backup = JSON.parse(json);
  expect(backup).toMatchObject({ app: 'CouponVault', version: 1 });
  expect(backup.families).toHaveLength(1);
  expect(backup.families[0].name).toBe('משפחת בדיקה');
  expect(backup.families[0].coupons.map((c) => c.title).sort()).toEqual(['שובר מתנה', 'שנוצל']);
  expect(backup.families[0].coupons.find((c) => c.title === 'שובר מתנה')).toMatchObject({ code: 'BM-48213', cvv: '412', balance: 250 });
  await expect(page.getByRole('status')).toHaveText('הגיבוי נשמר');
});

// Regression: the logo was missing from the shared image for brands whose logo came from Google's icon service,
// which doesn't allow drawing its images (no CORS). Here it behaves like the real one.
test('T71 the shared image carries the brand logo for every known brand (Aroma: no logo file of its own before)', async ({ page }) => {
  await page.route('**/s2/favicons**', (route) => route.fulfill({ path: 'public/icon-192.png', contentType: 'image/png' })); // no CORS header, like Google
  await page.addInitScript(() => {
    window.__drawn = [];
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function drawImage(img, ...rest) {
      if (img?.src) window.__drawn.push(new URL(img.src).pathname);
      return draw.call(this, img, ...rest);
    };
  });
  await captureFiles(page, { picker: false });
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'קפה ומאפה', store: 'ארומה', type: 'product', code: 'AR-3301' }]);
  const s = await openTicket(page, 'קפה ומאפה');
  await expect(s.getByRole('button', { name: 'שיתוף' })).toBeEnabled({ timeout: 15000 });
  expect(await page.evaluate(() => window.__drawn)).toContain('/brands/icons/aroma.co.il.png');
});

test('T70 a coupon can also be shared from its row, by swiping it open', async ({ page }) => {
  await page.route('**/s2/favicons**', (route) => route.fulfill({ path: 'public/icon-192.png', contentType: 'image/png' })); // like Google: no CORS header
  await captureFiles(page, { picker: false });
  const { familyId } = await setup(page);
  await seed(page, familyId, [full]);
  const t = page.locator('[data-testid="coupon-ticket"][data-title="שובר מתנה"]');
  await t.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const b = await t.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 - 200, b.y + b.height / 2, { steps: 6 });
  await page.mouse.up();
  const share = page.getByTestId('row-share');
  await expect(share).toBeEnabled({ timeout: 15000 });
  await share.click();
  await expect.poll(() => page.evaluate(() => window.__shared.length)).toBe(1);
  const [sent] = await page.evaluate(() => window.__shared);
  expect(sent.files[0]).toMatchObject({ name: 'שובר מתנה.png', type: 'image/png' });
  expect(sent.text).toContain('BM-48213');
  // the row closes again; the coupon sheet didn't open
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
