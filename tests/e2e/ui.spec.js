import { test, expect } from '@playwright/test';
import { isoIn, noHorizontalOverflow, openTicket, seed, setup, sheet, tab } from './helpers';

const many = (n) =>
  Array.from({ length: n }, (_, i) => ({
    title: `קופון ${i + 1}`,
    store: ['שופרסל', 'זארה', 'Buyme', 'איקאה'][i % 4],
    category: ['סופרמרקט', 'אופנה', 'פנאי ובילוי', 'בית'][i % 4],
    type: i % 3 === 0 ? 'percent' : 'money',
    value: i % 3 === 0 ? 10 + i : 50 * (i + 1),
    expiry: i % 5 === 0 ? null : isoIn(5 + i * 7),
  }));

test('T34 no screen scrolls sideways (home, sheet, archive, settings)', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, many(6));
  await expect(page.getByTestId('coupon-ticket').first()).toBeVisible();
  await noHorizontalOverflow(page);
  await page.getByTestId('fab-add').click();
  await expect(sheet(page, 'קופון חדש')).toBeVisible();
  await noHorizontalOverflow(page);
  await sheet(page, 'קופון חדש').getByRole('button', { name: 'סגור' }).click();
  await tab(page, 'ארכיון');
  await noHorizontalOverflow(page);
  await tab(page, 'הגדרות');
  await noHorizontalOverflow(page);
});

test('T35 the + button and the bottom bar stay put while the list scrolls', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, many(18));
  await expect(page.getByTestId('coupon-ticket')).toHaveCount(18);
  const fab = page.getByTestId('fab-add');
  const nav = page.getByRole('navigation', { name: 'ניווט' });
  expect(await fab.evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
  const vp = page.viewportSize();
  const before = await fab.boundingBox();
  // bottom-left corner, above the bar
  expect(before.x).toBeLessThan(vp.width / 3);
  expect(before.y + before.height).toBeLessThan((await nav.boundingBox()).y);

  await page.evaluate(() => window.scrollBy(0, 1500));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  const after = await fab.boundingBox();
  expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  await expect(fab).toBeInViewport();
  await expect(nav).toBeInViewport();
});

test('T36 opening and closing a sheet keeps the scroll position and unlocks the page', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, many(18));
  await expect(page.getByTestId('coupon-ticket')).toHaveCount(18);
  await page.getByTestId('coupon-ticket').nth(10).scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(300);
  const title = await page.getByTestId('coupon-ticket').nth(10).getAttribute('data-title');
  const s = await openTicket(page, title);
  expect(await page.evaluate(() => getComputedStyle(document.body).position)).toBe('fixed');
  await s.getByRole('button', { name: 'סגור' }).click();
  await expect(s).toBeHidden();
  expect(await page.evaluate(() => document.body.style.position)).toBe('');
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - y)).toBeLessThan(4);
});

test('T37 the back button closes the sheet and stays in the app', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  await expect(sheet(page, 'קופון חדש')).toBeVisible();
  await page.goBack();
  await expect(sheet(page, 'קופון חדש')).toBeHidden();
  await expect(page.getByTestId('fab-add')).toBeVisible();
  expect(page.url()).toContain('127.0.0.1:5180');
});

test('T38 iOS zoom protection: fields are ≥16px and the viewport cannot auto-zoom', async ({ page }) => {
  await setup(page);
  const meta = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(meta).toContain('maximum-scale=1');
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByRole('button', { name: 'פרטים נוספים' }).click();
  const sizes = await s.locator('input, textarea, select').evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
  expect(sizes.length).toBeGreaterThan(5);
  for (const px of sizes) expect(px).toBeGreaterThanOrEqual(16);
});

test('T39 a toast never blocks taps on the + button', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByLabel('שם הקופון').fill('מהיר');
  await s.getByLabel('איפה אפשר לממש').fill('x');
  await s.getByRole('radio', { name: 'אחר' }).click();
  await s.getByTestId('coupon-save').click();
  await expect(page.getByRole('status')).toBeVisible();
  // tap the + while the toast is still showing
  await page.getByTestId('fab-add').click({ timeout: 2000 });
  await expect(sheet(page, 'קופון חדש')).toBeVisible();
});

test('T40 scrolling inside a sheet stays inside it', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, many(12));
  await expect(page.getByTestId('coupon-ticket')).toHaveCount(12);
  await page.evaluate(() => window.scrollTo(0, 400));
  const pageY = await page.evaluate(() => window.scrollY);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  await s.getByRole('button', { name: 'פרטים נוספים' }).click();
  const body = s.locator('.overflow-y-auto');
  // the form scrolls on its own...
  const { scrollable, moved, overscroll } = await body.evaluate((el) => {
    const scrollable = el.scrollHeight > el.clientHeight;
    el.scrollTop = 100000;
    const cs = getComputedStyle(el);
    return { scrollable, moved: el.scrollTop > 0, overscroll: cs.getPropertyValue('overscroll-behavior-y') || cs.getPropertyValue('overscroll-behavior') };
  });
  expect(scrollable).toBe(true);
  expect(moved).toBe(true);
  // ...without chaining into the page behind it (where the engine supports overscroll-behavior)
  if (overscroll) expect(overscroll).toContain('contain');
  await s.getByRole('button', { name: 'סגור' }).click();
  await expect(s).toBeHidden();
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - pageY)).toBeLessThan(4);
});

/** Bounding box once the element stops moving (the sheet slides up for ~0.3s). */
async function settledBox(page, locator) {
  let prev = null;
  for (let i = 0; i < 40; i++) {
    const b = await locator.boundingBox();
    if (prev && b && Math.abs(b.y - prev.y) < 0.5) return b;
    prev = b;
    await page.waitForTimeout(50);
  }
  return prev;
}

async function dragDown(page, box, distance) {
  await page.mouse.move(box.x + 10, box.y + 5);
  await page.mouse.down();
  await page.mouse.move(box.x + 10, box.y + 5 + distance / 2, { steps: 5 });
  await page.mouse.move(box.x + 10, box.y + 5 + distance, { steps: 5 });
  await page.mouse.up();
}

test('T41 dragging the sheet handle down dismisses it (a short drag snaps back)', async ({ page }) => {
  await setup(page);
  await page.getByTestId('fab-add').click();
  const s = sheet(page, 'קופון חדש');
  const title = s.getByRole('heading', { name: 'קופון חדש' });
  // a short pull springs back
  await dragDown(page, await settledBox(page, title), 60);
  await expect(s).toBeVisible();
  const back = await settledBox(page, title);
  // a real pull closes it
  await dragDown(page, back, 220);
  await expect(s).toBeHidden();
});
