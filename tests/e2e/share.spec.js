import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { openTicket, seed, setup } from './helpers';

/** The share sheet can't open in a test browser, so it's replaced by a stand-in that keeps what the app handed it. */
async function captureFiles(page) {
  await page.addInitScript(() => {
    const read = (f) =>
      new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve({ name: f.name, type: f.type, size: f.size, dataUrl: r.result });
        r.readAsDataURL(f);
      });
    window.__shared = [];
    navigator.canShare = (d) => !!d?.files?.length;
    navigator.share = async (d) => window.__shared.push({ title: d.title, text: d.text, files: await Promise.all(d.files.map(read)) });
  });
}

const full = { title: 'שובר מתנה', store: 'Buyme', type: 'money', value: 400, balance: 250, code: 'BM-48213', cvv: '412', expiry: '2031-04-01', format: 'physical', notes: 'רק בסניפים' };

test('T67 sharing a coupon sends an image of it with its details as text', async ({ page }, info) => {
  await page.route('**/s2/favicons**', (route) => route.fulfill({ path: 'public/icon-192.png', contentType: 'image/png' })); // like Google: no CORS header
  await captureFiles(page);
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
  await captureFiles(page);
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'קפה ומאפה', store: 'ארומה', type: 'product', code: 'AR-3301' }]);
  const s = await openTicket(page, 'קפה ומאפה');
  await expect(s.getByRole('button', { name: 'שיתוף' })).toBeEnabled({ timeout: 15000 });
  expect(await page.evaluate(() => window.__drawn)).toContain('/brands/icons/aroma.co.il.png');
});

test('T70 a coupon can also be shared from its row, by swiping it open', async ({ page }) => {
  await page.route('**/s2/favicons**', (route) => route.fulfill({ path: 'public/icon-192.png', contentType: 'image/png' })); // like Google: no CORS header
  await captureFiles(page);
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
