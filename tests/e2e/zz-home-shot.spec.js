// Visual check of the compact home screen: SCREENS=1 npx playwright test zz-home-shot --project=iphone
import { test } from '@playwright/test';
import { isoIn, seed, setup } from './helpers';

test.skip(!process.env.SCREENS, 'screenshots only on demand');

test('compact home', async ({ page }, info) => {
  const { familyId } = await setup(page, { family: 'משפחת רובין' });
  await seed(page, familyId, [
    { title: 'שובר מתנה ליום הולדת', store: 'Buyme', category: 'כללי', type: 'money', value: 400, balance: 250, code: 'BM-48213', expiry: isoIn(3) },
    { title: 'ארוחת מקרויאל', store: 'מקדונלדס', category: 'אוכל', type: 'product', code: 'MC-77120', expiry: isoIn(9) },
    { title: 'קפה ומאפה', store: 'ארומה', category: 'אוכל', type: 'product', code: 'AR-3301', expiry: isoIn(180) },
    { title: 'תו הזהב', store: 'שופרסל', category: 'סופרמרקט', type: 'money', value: 990, code: '8801-5523-14', format: 'physical', expiry: isoIn(40) },
    { title: 'שובר קניות', store: 'רמי לוי', category: 'סופרמרקט', type: 'money', value: 500, code: 'RL-20931', expiry: isoIn(140) },
    { title: '20% הנחה על הכול', store: 'קסטרו', category: 'ביגוד', type: 'percent', value: 20, code: 'CAS20', expiry: isoIn(55) },
    { title: 'דרים קארד מהעבודה', store: 'דרים קארד', category: 'כללי', type: 'money', value: 300, code: '4580 1123 9987', expiry: isoIn(100) },
    { title: 'אוזניות', store: 'KSP', category: 'כללי', type: 'money', value: 150, code: 'KSP-5510' },
  ]);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `shots/home-${info.project.name}.png`, fullPage: true });
});
