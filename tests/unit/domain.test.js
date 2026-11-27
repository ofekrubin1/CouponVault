// Logic that used to live inside components: redemption math, form validation, filters, families.
import { describe, it, expect } from 'vitest';
import { planRedemption, rebalance, summarize, isExpiringSoon, balanceOf, balanceAfterUndo } from '@/domain/coupon';
import { validateCouponForm, couponFromForm, formFromCoupon, firstInvalidField } from '@/domain/couponForm';
import { couponCategories, resolveCategories, withFamilyCategories } from '@/domain/coupon';
import { isUrl, urlHost, displayStore, splitLinks } from '@/domain/links';
import { brandDomain, brandDomainOf, logoUrl, logoSources, isOwnLogo, isWideLogo, BRAND_LIST, searchBrands } from '@/domain/brands';
import { searchCoupons, groupByCategory } from '@/domain/homeList';
import { normalizeInviteCode, familyCategories, membersOf, pickCurrentFamily, inviteMessage, alertDaysFor, inviteExpiry, isInviteExpired } from '@/domain/family';
import { NO_CATEGORY, DEFAULT_CATEGORIES } from '@/domain/constants';

const NOW = new Date(2026, 10, 15, 12, 0);
const voucher = (fields = {}) => ({ id: 'v', status: 'active', type: 'money', value: 200, balance: 200, usages: [], ...fields });

describe('planRedemption', () => {
  it('partial use leaves the rest', () => expect(planRedemption(voucher(), 80)).toEqual({ spend: 80, left: 120, finished: false }));
  it('using exactly the balance finishes it', () => expect(planRedemption(voucher({ balance: 50 }), 50)).toMatchObject({ left: 0, finished: true }));
  it('"use all" spends the whole balance', () => expect(planRedemption(voucher({ balance: 75 }))).toEqual({ spend: 75, left: 0, finished: true }));
  it('refuses more than the balance', () => expect(planRedemption(voucher(), 250).error).toBe('הסכום גדול מהיתרה (₪200)'));
  it('refuses zero / empty', () => {
    expect(planRedemption(voucher(), 0).error).toBe('יש להזין סכום');
    expect(planRedemption(voucher(), '').error).toBe('יש להזין סכום');
  });
  it('avoids float noise', () => expect(planRedemption(voucher({ balance: 0.3 }), 0.1).left).toBe(0.2));
  it('non-money coupons are simply used', () => expect(planRedemption({ type: 'percent', value: 20 })).toEqual({ spend: null, left: 0, finished: true }));
});

describe('balances', () => {
  it('rebalance after editing the face value keeps what was used', () => expect(rebalance(300, voucher({ balance: 150, usages: [{ amount: 50 }] }))).toBe(250));
  it('rebalance never goes negative', () => expect(rebalance(30, voucher({ balance: 150, usages: [{ amount: 50 }] }))).toBe(0));
  // restored from the archive: the history stays, the balance is back to the full value
  it('editing a restored voucher keeps its balance', () => expect(rebalance(200, voucher({ balance: 200, usages: [{ amount: 200 }] }))).toBe(200));
  it('a coupon that becomes a voucher starts with its full value', () => expect(rebalance(120, { type: 'product', value: null, balance: null })).toBe(120));
  it('undoing the last use puts its amount back', () => expect(balanceAfterUndo(voucher({ balance: 120, usages: [{ amount: 80 }] }))).toBe(200));
  // restored from the archive (balance already full) and then "undo last": never more than the face value
  it('undo never lifts the balance above the face value', () => expect(balanceAfterUndo(voucher({ balance: 200, usages: [{ amount: 200 }] }))).toBe(200));
  it('balanceOf falls back to the face value', () => expect(balanceOf(voucher({ balance: undefined }))).toBe(200));
  it('summary counts and sums', () => {
    const active = [voucher({ balance: 120, expiry: '2026-11-20' }), voucher({ id: 'b', balance: 80 }), { id: 'p', status: 'active', type: 'percent', value: 10 }];
    expect(summarize(active, 14, NOW)).toEqual({ activeCount: 3, expiringCount: 1, moneyCount: 2, productCount: 0, balance: 200 });
  });
  it('expiring soon = within the window, not expired', () => {
    expect(isExpiringSoon({ expiry: '2026-11-29' }, 14, NOW)).toBe(true);
    expect(isExpiringSoon({ expiry: '2026-12-30' }, 14, NOW)).toBe(false);
    expect(isExpiringSoon({ expiry: '2026-11-01' }, 14, NOW)).toBe(false);
    expect(isExpiringSoon({}, 14, NOW)).toBe(false);
  });
});

describe('coupon form', () => {
  const valid = { ...formFromCoupon(null), title: 'שובר', store: 'זארה', value: '200', code: 'Z-1' };
  it('a complete form is valid', () => expect(validateCouponForm(valid)).toEqual({}));
  it('the code is required, unless a photo of the voucher is attached', () => {
    const e = validateCouponForm({ ...valid, code: '  ' });
    expect(e.code).toBe('חסר קוד / מספר שובר. או שצרפו תמונה של השובר');
    expect(firstInvalidField(e)).toBe('code');
    expect(validateCouponForm({ ...valid, code: '' }, { hasPhoto: true })).toEqual({});
  });
  it('the name is required; where to use it is not (the form asks before saving without it)', () => {
    const e = validateCouponForm({ ...valid, title: ' ', store: '' });
    expect(e).toEqual({ title: 'חסר שם לקופון' });
    expect(firstInvalidField(e)).toBe('title');
    expect(validateCouponForm({ ...valid, store: '  ' })).toEqual({});
  });
  it('a voucher needs an amount; "other" does not', () => {
    expect(validateCouponForm({ ...valid, value: '' }).value).toContain('בשובר כספי צריך סכום');
    expect(validateCouponForm({ ...valid, type: 'other', value: '' })).toEqual({});
    expect(validateCouponForm({ ...valid, type: 'product', value: '' })).toEqual({});
  });
  it('percent must be 1–100 when given', () => {
    expect(validateCouponForm({ ...valid, type: 'percent', value: '120' }).value).toBe('אחוז בין 1 ל-100');
    expect(validateCouponForm({ ...valid, type: 'percent', value: '' })).toEqual({});
  });
  it('verification code: optional, exactly 3 digits when switched on, dropped when switched off', () => {
    expect(validateCouponForm({ ...valid, hasCvv: true, cvv: '' })).toEqual({});
    expect(validateCouponForm({ ...valid, hasCvv: true, cvv: '12' }).cvv).toBe('קוד אימות הוא 3 ספרות');
    expect(validateCouponForm({ ...valid, hasCvv: false, cvv: '12' })).toEqual({});
    expect(couponFromForm({ ...valid, hasCvv: true, cvv: '407' }).cvv).toBe('407');
    expect(couponFromForm({ ...valid, hasCvv: false, cvv: '407' }).cvv).toBe('');
    expect(formFromCoupon({ cvv: '123' })).toMatchObject({ hasCvv: true, cvv: '123' });
    expect(formFromCoupon(null)).toMatchObject({ hasCvv: false, cvv: '' });
  });
  it('a product voucher (e.g. a McRoyal meal) needs no amount and stores none', () => {
    const data = couponFromForm({ ...valid, type: 'product', title: 'ארוחת מקרויאל', value: '150' });
    expect(data.type).toBe('product');
    expect(data.value).toBeNull();
  });
  it('a new category needs a name', () => expect(validateCouponForm({ ...valid, addingCategory: true }).category).toBe('חסר שם לקטגוריה החדשה'));
  it('converts to stored fields (trimmed, typed, several categories incl. a new one)', () => {
    const data = couponFromForm({ ...valid, title: ' שובר ', categories: ['אופנה', 'בית'], addingCategory: true, newCategory: ' דלק ', expiry: '' });
    expect(data).toEqual({ title: 'שובר', store: 'זארה', categories: ['אופנה', 'בית', 'דלק'], category: 'אופנה', type: 'money', format: 'digital', value: 200, expiry: null, code: 'Z-1', cvv: '', source: '', notes: '' });
  });
  it('"ללא קטגוריה" cannot be a new category (it is the group of coupons without one)', () =>
    expect(validateCouponForm({ ...valid, addingCategory: true, newCategory: ' ללא קטגוריה ' }).category).toBe('השם הזה שמור. בחרו שם אחר'));
  it('no duplicate categories', () => expect(couponFromForm({ ...valid, categories: ['בית'], addingCategory: true, newCategory: 'בית' }).categories).toEqual(['בית']));
  it('old built-in categories the family no longer has read as the new four', () => {
    const cats = familyCategories({ customCategories: ['דלק'] });
    expect(resolveCategories({ categories: ['מסעדות', 'אוכל', 'טיפוח', 'דלק'] }, cats)).toEqual(['אוכל', 'כללי', 'דלק']);
    expect(resolveCategories({ category: 'אופנה' }, cats)).toEqual(['ביגוד']);
    expect(DEFAULT_CATEGORIES).toEqual(['כללי', 'אוכל', 'סופרמרקט', 'ביגוד']);
  });
  // the bug: a family made its own "בית" and its coupons showed up under כללי
  it('a category of the family is never renamed, even when it has an old built-in name', () => {
    const cats = familyCategories({ customCategories: ['בית', 'טיפוח'] });
    expect(cats).toContain('בית');
    expect(resolveCategories({ categories: ['בית'] }, cats)).toEqual(['בית']);
    expect(resolveCategories({ categories: ['טיפוח', 'מסעדות'] }, cats)).toEqual(['טיפוח', 'אוכל']);
  });
  it('reading a coupon never renames its categories by itself', () => {
    expect(couponCategories({ categories: ['בית'] })).toEqual(['בית']);
    expect(couponCategories({ category: 'מסעדות' })).toEqual(['מסעדות']);
  });
  it('coupons are resolved once, with the categories of the family', () => {
    const cats = familyCategories({ customCategories: ['בית'] });
    const [a, b] = withFamilyCategories([{ id: 1, categories: ['בית'] }, { id: 2, category: 'מסעדות' }], cats);
    expect(a).toMatchObject({ categories: ['בית'], category: 'בית' });
    expect(b).toMatchObject({ categories: ['אוכל'], category: 'אוכל' });
  });
  it('an old coupon with a single category opens with it selected', () => expect(formFromCoupon({ title: 'x', category: 'ביגוד' }).categories).toEqual(['ביגוד']));
  it('editing recalculates the balance from the new value', () => {
    const existing = voucher({ usages: [{ amount: 50 }], balance: 150 });
    expect(couponFromForm({ ...formFromCoupon(existing), title: 'x', store: 'y', value: '300' }, existing).balance).toBe(250);
  });
  it('"other" stores no value', () => expect(couponFromForm({ ...valid, type: 'other' }).value).toBeNull());
  it('digital by default; physical when chosen; old coupons count as digital', () => {
    expect(formFromCoupon(null).format).toBe('digital');
    expect(formFromCoupon({ title: 'x' }).format).toBe('digital');
    expect(formFromCoupon({ title: 'x', format: 'physical' }).format).toBe('physical');
    expect(couponFromForm({ ...valid, format: 'physical' }).format).toBe('physical');
    expect(couponFromForm(valid).format).toBe('digital');
  });
});

describe('home list', () => {
  const list = [
    { id: 1, title: 'פיצה', store: 'דומינוס', category: 'אוכל', type: 'money', value: 100, balance: 100, status: 'active' },
    { id: 2, title: 'סושי', store: 'ג׳פניקה', category: 'אוכל', type: 'money', value: 150, balance: 90, status: 'active', expiry: '2026-11-18' },
    { id: 3, title: 'חולצה', store: 'קסטרו', category: 'ביגוד', type: 'percent', value: 20, status: 'active', code: 'CAS20' },
    { id: 4, title: 'קפה', store: 'ארומה', type: 'other', status: 'active' },
    { id: 5, title: 'שובר', store: 'Buyme', categories: ['כללי', 'אוכל'], type: 'money', value: 50, status: 'active' },
    { id: 6, title: 'דלק', store: 'פז', category: 'רכב', type: 'money', value: 80, status: 'active' },
  ];
  const ids = (cs) => cs.map((c) => c.id);
  it('empty search = everything', () => expect(ids(searchCoupons(list, '  '))).toEqual([1, 2, 3, 4, 5, 6]));
  it('search looks at title, store, code and category (case-insensitive)', () => {
    expect(ids(searchCoupons(list, 'דומי'))).toEqual([1]);
    expect(ids(searchCoupons(list, 'cas20'))).toEqual([3]);
    expect(ids(searchCoupons(list, 'ביגוד'))).toEqual([3]);
  });
  it('groups by the first category: the family order, its own categories, then כללי, then no category', () => {
    const groups = groupByCategory(list, ['כללי', 'אוכל', 'סופרמרקט', 'ביגוד', 'רכב']);
    expect(groups.map((g) => g.category)).toEqual(['אוכל', 'ביגוד', 'רכב', 'כללי', NO_CATEGORY]);
    expect(ids(groups[0].items)).toEqual([1, 2]); // the coupon under כללי + אוכל shows once, under כללי
    expect(ids(groups[3].items)).toEqual([5]);
  });
  it('a category the family no longer has still gets its group, before כללי', () => {
    const groups = groupByCategory(list, ['כללי', 'אוכל', 'סופרמרקט', 'ביגוד']);
    expect(groups.map((g) => g.category)).toEqual(['אוכל', 'ביגוד', 'רכב', 'כללי', NO_CATEGORY]);
  });
  it('keeps the order of the coupons inside a group (already sorted by expiry)', () => {
    const [food] = groupByCategory([list[1], list[0]], ['אוכל']);
    expect(ids(food.items)).toEqual([2, 1]);
  });
});

describe('categories', () => {
  it('reads the list, or the old single field', () => {
    expect(couponCategories({ categories: ['א', 'ב'] })).toEqual(['א', 'ב']);
    expect(couponCategories({ category: 'א' })).toEqual(['א']);
    expect(couponCategories({})).toEqual([]);
  });
});

describe('links', () => {
  it('recognises a web address and shows its site name', () => {
    expect(isUrl('http://www.htzone.co.il/voucher-zone/10')).toBe(true);
    expect(isUrl('שופרסל דיל')).toBe(false);
    expect(urlHost('http://www.htzone.co.il/voucher-zone/10')).toBe('htzone.co.il');
    expect(displayStore('www.buyme.co.il')).toBe('buyme.co.il');
    expect(displayStore('זארה')).toBe('זארה');
  });
  it('finds links inside notes', () => {
    expect(splitLinks('מימוש ב https://a.co/x. תודה')).toEqual([{ text: 'מימוש ב ' }, { text: 'https://a.co/x', href: 'https://a.co/x' }, { text: '. תודה' }]);
    expect(splitLinks('ראו www.site.com')).toEqual([{ text: 'ראו ' }, { text: 'www.site.com', href: 'https://www.site.com' }]);
    expect(splitLinks('בלי קישור')).toEqual([{ text: 'בלי קישור' }]);
  });
});

describe('brand logos', () => {
  it('knows big chains by Hebrew or English name, loosely', () => {
    expect(brandDomainOf('שופרסל דיל')).toBe('shufersal.co.il');
    expect(brandDomainOf('Super-Pharm')).toBe('super-pharm.co.il');
    expect(brandDomainOf('סופר פארם')).toBe('super-pharm.co.il');
    expect(brandDomainOf('ZARA')).toBe('zara.com');
    expect(brandDomainOf('מכולת השכונה')).toBeNull();
  });
  it('a store that is a link uses that site', () => expect(brandDomainOf('http://www.htzone.co.il/voucher-zone/10')).toBe('htzone.co.il'));
  it('the added Israeli chains', () => {
    const cases = {
      'דרים קארד': 'dreamcard.co.il', KFC: 'kfc.co.il', 'תו הזהב': 'shufersal.co.il', 'כרטיס חבר': 'hvr.co.il', חבר: 'hvr.co.il',
      'משלוחה': 'mishloha.co.il', 'גלידה גולדה': 'goldaglida.co.il', "פאפא ג'ונס": 'papajohns.co.il',
      'ג׳פניקה': 'japanika.net', 'זארה הום': 'zarahome.com', 'Pull&Bear': 'pullandbear.com', 'Factory 54': 'factory54.co.il',
      'מקס סטוק': 'maxstock.co.il', 'AM:PM': 'ampm.co.il', 'פז': 'paz.co.il', 'תחנת פז': 'paz.co.il', 'Yellow': 'yellow.co.il', 'סונול': 'sonol.co.il',
      'דור אלון': 'doralon.co.il', 'ישרוטל': 'isrotel.com', 'פתאל': 'fattal.co.il', 'אייס': 'ace.co.il',
    };
    for (const [text, domain] of Object.entries(cases)) expect([text, brandDomainOf(text)]).toEqual([text, domain]);
  });
  it('the second batch: Foot Locker, Roladin, Neeman, Nizat, gift cards, Be, Mashbir', () => {
    const cases = {
      'פוט לוקר': 'footlocker.co.il', רולדין: 'roladin.co.il', 'מאפה נאמן': 'neeman.co.il', 'ניצת הדובדבן': 'nizat.com',
      'LOVE GIFT CARD': 'castro.com/lovecard', 'Love Gift Card קסטרו': 'castro.com/lovecard', 'Power Gift Card': 'powergift.co.il', 'מיקי שמו': 'shemo.co.il', 'שמו': 'shemo.co.il', SHEMO: 'shemo.co.il',
      'Be פארם': 'bestore.co.il', 'ניו פארם': 'bestore.co.il', 'BE': 'bestore.co.il', 'המשביר לצרכן': '365mashbir.co.il',
    };
    for (const [text, domain] of Object.entries(cases)) expect([text, brandDomainOf(text)]).toEqual([text, domain]);
    expect(brandDomainOf('מועדון נאמנות')).toBeNull();
    expect(brandDomainOf('שמונה מאות')).toBeNull(); // contains "שמו"
  });
  it('Food Appeal and Minene, with the logos stored in the app', () => {
    for (const t of ['Food Appeal', 'food apeal', 'פוד אפיל', 'שובר פוד אפיל 200']) expect([t, brandDomainOf(t)]).toEqual([t, 'foodappeal.co.il']);
    for (const t of ['מיננה', 'Minene', 'MINENE בגדי תינוקות']) expect([t, brandDomainOf(t)]).toEqual([t, 'minene.net']);
    expect(logoSources('foodappeal.co.il')[0]).toBe('/brands/foodappeal.png');
    expect(logoSources('minene.net')[0]).toBe('/brands/minene.png');
    expect(isWideLogo('minene.net')).toBe(true);
    expect(isWideLogo('foodappeal.co.il')).toBe(false);
    expect(BRAND_LIST.find((b) => b.domain === 'minene.net').name).toBe('מיננה');
  });
  it('Naaman and Flying Tiger, with wide logos stored in the app', () => {
    for (const t of ['נעמן', 'Naaman', 'נעמן פורצלן']) expect([t, brandDomainOf(t)]).toEqual([t, 'naamanp.co.il']);
    for (const t of ['Flying Tiger', 'פליינג טייגר', 'flying tiger copenhagen']) expect([t, brandDomainOf(t)]).toEqual([t, 'flyingtiger.com']);
    expect(brandDomainOf('מאפה נאמן')).toBe('neeman.co.il'); // not Naaman
    for (const d of ['naamanp.co.il', 'flyingtiger.com']) {
      expect(logoSources(d)[0]).toMatch(/^\/brands\//);
      expect(isWideLogo(d)).toBe(true);
    }
  });
  it('Azrieli malls, with its wide logo', () => {
    for (const t of ['עזריאלי', 'קניוני עזריאלי', 'גיפט קארד עזריאלי', 'Azrieli']) expect([t, brandDomainOf(t)]).toEqual([t, 'azrielimalls.co.il']);
    expect(logoSources('azrielimalls.co.il')[0]).toBe('/brands/azrieli.png');
    expect(isWideLogo('azrielimalls.co.il')).toBe(true);
  });
  it('every known brand has a logo served by the app itself (so it can go into a shared image)', () => {
    expect(logoSources('aroma.co.il')).toEqual(['/brands/icons/aroma.co.il.png', logoUrl('aroma.co.il')]);
    expect(logoSources('htzone.co.il')[0]).toBe('/brands/icons/htzone.co.il.jpg');
    for (const b of BRAND_LIST) expect([b.domain, isOwnLogo(logoSources(b.domain)[0])]).toEqual([b.domain, true]);
    expect(logoSources('some-unknown-shop.co.il')).toEqual([logoUrl('some-unknown-shop.co.il')]); // only the remote icon
  });
  it('BBB is Burgers Bar (as a whole word only); Legenda with the logo the user gave', () => {
    for (const t of ['BBB', 'bbb', 'שובר BBB 100', 'בורגרס בר']) expect([t, brandDomainOf(t)]).toEqual([t, 'burgersbar.co.il']);
    expect(brandDomainOf('BBBX')).toBeNull();
    for (const t of ["לג'נדה", 'לגנדה', 'Legenda', 'גלידה בלג׳נדה']) expect([t, brandDomainOf(t)]).toEqual([t, 'legenda.co.il']);
    expect(logoSources('legenda.co.il')[0]).toBe('/brands/legenda.png');
    expect(isWideLogo('legenda.co.il')).toBe(false);
  });
  it('short names only match as a whole word', () => {
    expect(brandDomainOf('פנאי ובילוי')).toBeNull(); // contains "ילו"
    expect(brandDomainOf('מתנה לחבר')).toBeNull(); // contains "חבר"
    expect(brandDomainOf('אייסקפה')).toBeNull(); // contains "אייס"
    expect(brandDomainOf('MacBook Air')).toBeNull(); // contains "mac"
    expect(brandDomainOf('זארה')).toBe('zara.com');
  });
  it('falls back to the title', () => expect(brandDomain({ store: 'כל הרשתות', title: 'Buyme 200' })).toBe('buyme.co.il'));
  it('logo image url', () => expect(logoUrl('zara.com')).toContain('domain=zara.com'));
  it('Buyme tries its full stork logo before the site icon', () => {
    const [first, second] = logoSources('buyme.co.il');
    expect(first).toBe('/brands/buyme.svg');
    expect(second).toContain('domain=buyme.co.il');
    expect(logoSources('zara.com')).toEqual(['/brands/icons/zara.com.png', logoUrl('zara.com')]); // its stored site icon
  });
});

describe('families', () => {
  it('expiry alert is personal: own setting, else the family (old shared setting), else 14 days', () => {
    expect(alertDaysFor({ alertDays: 7 }, { alertDays: 30 })).toBe(7);
    expect(alertDaysFor({}, { alertDays: 30 })).toBe(30);
    expect(alertDaysFor({}, {})).toBe(14);
  });
  it('invite codes are cleaned while typing (8 characters at most)', () => expect(normalizeInviteCode('ab-c1 23x yz9')).toBe('ABC123XY'));
  it('an invite code is valid for 7 days from when it was made', () => {
    const made = new Date('2026-11-24T10:00:00Z');
    const fam = { inviteCode: 'ABCD2345', inviteCreatedAt: { toDate: () => made } };
    expect(inviteExpiry(fam).toISOString()).toBe('2026-12-01T10:00:00.000Z');
    expect(isInviteExpired(fam, new Date('2026-11-30T10:00:00Z'))).toBe(false);
    expect(isInviteExpired(fam, new Date('2026-12-01T10:00:01Z'))).toBe(true);
    // a code from before codes had a date (6 characters) no longer works
    expect(isInviteExpired({ inviteCode: 'ABC123' }, made)).toBe(true);
    // just created: the server time isn't back yet, so it counts as fresh
    expect(isInviteExpired({ inviteCode: 'ABCD2345', inviteCreatedAt: null }, made)).toBe(false);
  });
  it('categories = defaults + custom, no duplicates', () => {
    const cats = familyCategories({ customCategories: ['דלק', 'אוכל', 'בית'] });
    expect(cats).toEqual(['כללי', 'אוכל', 'סופרמרקט', 'ביגוד', 'דלק', 'בית']); // the family's own names, as typed
  });
  it('members carry their info (with a fallback name)', () =>
    expect(membersOf({ members: ['a', 'b'], memberInfo: { a: { name: 'דנה' } } })).toEqual([{ uid: 'a', name: 'דנה' }, { uid: 'b', name: 'משתמש' }]));
  it('current family falls back to the first', () => {
    const fams = [{ id: 'x' }, { id: 'y' }];
    expect(pickCurrentFamily(fams, 'y').id).toBe('y');
    expect(pickCurrentFamily(fams, 'gone').id).toBe('x');
  });
  it('invite message has the code and the link', () => {
    const m = inviteMessage({ name: 'רובין', inviteCode: 'ABC123' }, 'https://couponvault.web.app');
    expect(m).toContain('ABC123');
    expect(m).toContain('https://couponvault.web.app/?join=ABC123');
  });
});

describe('brands board', () => {
  it('lists every brand once with a readable name', () => {
    const domains = BRAND_LIST.map((b) => b.domain);
    expect(new Set(domains).size).toBe(domains.length);
    expect(BRAND_LIST.length).toBeGreaterThanOrEqual(90);
    expect(BRAND_LIST.every((b) => b.name && !b.name.startsWith('='))).toBe(true);
    expect(BRAND_LIST.find((b) => b.domain === 'hm.com').name).toBe('H&M');
    expect(BRAND_LIST.find((b) => b.domain === 'dreamcard.co.il').name).toBe('דרים קארד');
  });
  it('every board name is recognised on a coupon as that brand', () => {
    for (const b of BRAND_LIST) expect(brandDomainOf(b.name), b.name).toBe(b.domain);
  });
  it('a stored logo always comes first (also long wordmarks, e.g. Dream Card), then the site icon', () => {
    expect(logoSources('dreamcard.co.il')).toEqual(['/brands/dreamcard.png', logoUrl('dreamcard.co.il')]);
    expect(isWideLogo('dreamcard.co.il')).toBe(true);
    expect(isWideLogo('powergift.co.il')).toBe(false);
    expect(logoSources('zara.com')[0]).toBe('/brands/icons/zara.com.png');
  });
  it('dropped brands are no longer recognised', () => {
    for (const n of ['אמזון', 'נקסט', 'גודי', 'עלי אקספרס', 'קרוקס']) expect(brandDomainOf(n), n).toBe(null);
  });
  it('Yeinot Bitan shows Carrefour (the chain was renamed)', () => expect(brandDomainOf('יינות ביתן')).toBe('carrefour.co.il'));
  it('stored logos exist in public/brands', async () => {
    const { existsSync } = await import('node:fs');
    for (const b of BRAND_LIST) {
      const own = logoSources(b.domain).find(isOwnLogo);
      if (own) expect(existsSync(`public${own}`), own).toBe(true);
    }
  });
  it('search matches Hebrew, English and partial names', () => {
    expect(searchBrands('').length).toBe(BRAND_LIST.length);
    expect(searchBrands('תו הזהב').map((b) => b.domain)).toEqual(['shufersal.co.il']);
    expect(searchBrands('KFC').map((b) => b.domain)).toEqual(['kfc.co.il']);
    expect(searchBrands('זארה').map((b) => b.domain).sort()).toEqual(['zara.com', 'zarahome.com']);
    expect(searchBrands('xyz-nothing')).toEqual([]);
  });
});
