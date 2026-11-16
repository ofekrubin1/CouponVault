import { test, expect } from '@playwright/test';
import { seed, serverCoupons, setup, sheet, ticket } from './helpers';

/**
 * Drag a coupon row sideways (dx < 0 = to the left) like a finger. `slow` moves in small timed steps
 * (a deliberate drag); otherwise it's a quick swipe.
 */
async function swipe(page, title, dx, { dy = 0, slow = false } = {}) {
  // middle of the screen, clear of the floating bottom bar and + button
  await ticket(page, title).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const box = await ticket(page, title).boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  if (slow) {
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(x + (dx * i) / 10, y + (dy * i) / 10);
      await page.waitForTimeout(40);
    }
  } else {
    await page.mouse.move(x + dx / 3, y + dy / 3, { steps: 4 });
    await page.mouse.move(x + dx, y + dy, { steps: 6 });
  }
  await page.mouse.up();
}

const row = (page, title) => page.locator(`[data-testid="coupon-row"][data-title="${title}"]`);
const actions = (page, title) => row(page, title).getByTestId('swipe-actions');
const expectOpen = (page, title) => expect(actions(page, title)).toHaveAttribute('aria-hidden', 'false');
const expectClosed = (page, title) => expect(actions(page, title)).toHaveAttribute('aria-hidden', 'true');

test('T42 swipe reveals a single small delete button; delete asks first', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'למחוק בסלייד', store: 'x', type: 'other' }]);
  await swipe(page, 'למחוק בסלייד', -200);
  await expectOpen(page, 'למחוק בסלייד');
  // only delete, and small
  await expect(actions(page, 'למחוק בסלייד').getByRole('button')).toHaveCount(1);
  const del = actions(page, 'למחוק בסלייד').getByRole('button', { name: 'מחיקה' });
  const box = await del.boundingBox();
  expect(box.width).toBeLessThanOrEqual(44);
  expect(box.height).toBeLessThanOrEqual(44);

  await del.click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ביטול' }).click();
  await expect(ticket(page, 'למחוק בסלייד')).toBeVisible();
  await expectClosed(page, 'למחוק בסלייד');
  await swipe(page, 'למחוק בסלייד', -200);
  await actions(page, 'למחוק בסלייד').getByRole('button', { name: 'מחיקה' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'מחק' }).click();
  await expect(ticket(page, 'למחוק בסלייד')).toHaveCount(0);
  await expect.poll(async () => (await serverCoupons(page, familyId)).length).toBe(0);
});

test('T43 swiping the other way works too, and swiping back closes it', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'דו כיווני', store: 'x', type: 'money', value: 120 }]);
  await swipe(page, 'דו כיווני', 200);
  await expectOpen(page, 'דו כיווני');
  await swipe(page, 'דו כיווני', -200);
  await expectClosed(page, 'דו כיווני');
});

test('T44 the row follows the finger: a slow short drag springs back, a quick flick opens', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'עדין', store: 'x', type: 'other' }]);
  await swipe(page, 'עדין', -24, { slow: true });
  await expectClosed(page, 'עדין');
  // while dragging slowly the ticket moves with the pointer (no jump)
  await ticket(page, 'עדין').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const box = await ticket(page, 'עדין').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 5; i++) {
    await page.mouse.move(box.x + box.width / 2 - i * 8, box.y + box.height / 2);
    await page.waitForTimeout(40);
  }
  // painted on the next animation frame: the ticket ends up ~40px over, under the pointer (headless
  // Chromium may hold back the very last move event, hence one step of tolerance)
  await expect.poll(async () => box.x - (await ticket(page, 'עדין').boundingBox()).x).toBeGreaterThan(20);
  expect(box.x - (await ticket(page, 'עדין').boundingBox()).x).toBeLessThan(46);
  await page.mouse.up();
  await expectOpen(page, 'עדין');
});

test('T45 one open row at a time; tapping an open row closes it', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [
    { title: 'ראשון', store: 'x', type: 'other' },
    { title: 'שני', store: 'y', type: 'other' },
  ]);
  await swipe(page, 'ראשון', -200);
  await expectOpen(page, 'ראשון');
  await swipe(page, 'שני', -200);
  await expectOpen(page, 'שני');
  await expectClosed(page, 'ראשון');
  // tapping the open row closes it instead of opening the coupon
  await ticket(page, 'שני').click();
  await expectClosed(page, 'שני');
  await expect(sheet(page, 'שני')).toHaveCount(0);
  // and a normal tap still opens the coupon
  await ticket(page, 'שני').click();
  await expect(sheet(page, 'שני')).toBeVisible();
});

test('T46 a vertical drag on a coupon is a scroll, not a swipe', async ({ page }) => {
  const { familyId } = await setup(page);
  await seed(page, familyId, [{ title: 'לא לפתוח', store: 'x', type: 'other' }]);
  await swipe(page, 'לא לפתוח', -40, { dy: -160 });
  await expectClosed(page, 'לא לפתוח');
  await expect(sheet(page, 'לא לפתוח')).toHaveCount(0);
});
