// Logic that used to live inside components: redemption math, form validation, filters, families.
import { describe, it, expect } from 'vitest';
import { planRedemption, rebalance, summarize, isExpiringSoon, balanceOf } from '@/domain/coupon';
import { validateCouponForm, couponFromForm, formFromCoupon, firstInvalidField } from '@/domain/couponForm';
import { couponCategories } from '@/domain/coupon';
import { isUrl, urlHost, displayStore, splitLinks } from '@/domain/links';
import { brandDomain, brandDomainOf, logoUrl, logoSources, isOwnLogo, BRAND_LIST, searchBrands } from '@/domain/brands';
import { EMPTY_FILTERS, filterCoupons, categoryCounts, typeCounts, toggleIn, activeFilterCount, voucherBalance } from '@/domain/filters';
import { normalizeInviteCode, familyCategories, membersOf, pickCurrentFamily, inviteMessage, alertDaysFor } from '@/domain/family';
import { NO_CATEGORY } from '@/domain/constants';

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
  it('rebalance after editing the face value keeps what was used', () => expect(rebalance(300, voucher({ usages: [{ amount: 50 }] }))).toBe(250));
  it('rebalance never goes negative', () => expect(rebalance(30, voucher({ usages: [{ amount: 50 }] }))).toBe(0));
  it('balanceOf falls back to the face value', () => expect(balanceOf(voucher({ balance: undefined }))).toBe(200));
  it('summary counts and sums', () => {
    const active = [voucher({ balance: 120, expiry: '2026-11-20' }), voucher({ id: 'b', balance: 80 }), { id: 'p', status: 'active', type: 'percent', value: 10 }];
    expect(summarize(active, 14, NOW)).toEqual({ activeCount: 3, expiringCount: 1, moneyCount: 2, balance: 200 });
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
  it('the code is required', () => {
    const e = validateCouponForm({ ...valid, code: '  ' });
    expect(e.code).toBe('חסר קוד / מספר שובר');
    expect(firstInvalidField(e)).toBe('code');
  });
  it('name and store are required', () => {
    const e = validateCouponForm({ ...valid, title: ' ', store: '' });
    expect(e).toMatchObject({ title: 'חסר שם לקופון', store: 'חסר איפה אפשר לממש' });
    expect(firstInvalidField(e)).toBe('title');
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
  it('a product voucher (e.g. a McRoyal meal) needs no amount and stores none', () => {
    const data = couponFromForm({ ...valid, type: 'product', title: 'ארוחת מקרויאל', value: '150' });
    expect(data.type).toBe('product');
    expect(data.value).toBeNull();
  });
  it('a new category needs a name', () => expect(validateCouponForm({ ...valid, addingCategory: true }).category).toBe('חסר שם לקטגוריה החדשה'));
  it('converts to stored fields (trimmed, typed, several categories incl. a new one)', () => {
    const data = couponFromForm({ ...valid, title: ' שובר ', categories: ['אופנה', 'בית'], addingCategory: true, newCategory: ' דלק ', expiry: '' });
    expect(data).toEqual({ title: 'שובר', store: 'זארה', categories: ['אופנה', 'בית', 'דלק'], category: 'אופנה', type: 'money', format: 'digital', value: 200, expiry: null, code: 'Z-1', source: '', notes: '' });
  });
  it('no duplicate categories', () => expect(couponFromForm({ ...valid, categories: ['בית'], addingCategory: true, newCategory: 'בית' }).categories).toEqual(['בית']));
  it('an old coupon with a single category opens with it selected', () => expect(formFromCoupon({ title: 'x', category: 'אופנה' }).categories).toEqual(['אופנה']));
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

describe('filters', () => {
  const list = [
    { id: 1, title: 'פיצה', store: 'דומינוס', category: 'מסעדות', type: 'money', value: 100, balance: 100, status: 'active' },
    { id: 2, title: 'סושי', store: 'ג׳פניקה', category: 'מסעדות', type: 'money', value: 150, balance: 90, status: 'active', expiry: '2026-11-18' },
    { id: 3, title: 'חולצה', store: 'קסטרו', category: 'אופנה', type: 'percent', value: 20, status: 'active', code: 'CAS20' },
    { id: 4, title: 'קפה', store: 'ארומה', type: 'other', status: 'active' },
  ];
  const run = (opts) => filterCoupons(list, { alertDays: 14, now: NOW, ...opts }).map((c) => c.id);
  it('no filters = everything', () => expect(run({})).toEqual([1, 2, 3, 4]));
  it('several categories at once', () => expect(run({ filters: { ...EMPTY_FILTERS, cats: new Set(['מסעדות', 'אופנה']) } })).toEqual([1, 2, 3]));
  it('"no category" is a filter of its own', () => expect(run({ filters: { ...EMPTY_FILTERS, cats: new Set([NO_CATEGORY]) } })).toEqual([4]));
  it('by type + expiring soon', () => expect(run({ filters: { ...EMPTY_FILTERS, types: new Set(['money']), soon: true } })).toEqual([2]));
  it('search looks at title, store and code (case-insensitive)', () => {
    expect(run({ query: 'דומי' })).toEqual([1]);
    expect(run({ query: 'cas20' })).toEqual([3]);
  });
  it('counts per category (most first) and per type', () => {
    expect(categoryCounts(list)).toEqual([['מסעדות', 2], ['אופנה', 1], [NO_CATEGORY, 1]]);
    expect(typeCounts(list)).toEqual({ money: 2, percent: 1, other: 1 });
  });
  it('toggle + active count + voucher balance', () => {
    const f = { ...EMPTY_FILTERS, cats: toggleIn(new Set(), 'אופנה'), soon: true };
    expect(activeFilterCount(f)).toBe(2);
    expect(toggleIn(f.cats, 'אופנה').size).toBe(0);
    expect(voucherBalance(list)).toBe(190);
  });
});

describe('categories', () => {
  it('reads the list, or the old single field', () => {
    expect(couponCategories({ categories: ['א', 'ב'] })).toEqual(['א', 'ב']);
    expect(couponCategories({ category: 'א' })).toEqual(['א']);
    expect(couponCategories({})).toEqual([]);
  });
  it('a coupon with several categories matches each of them', () => {
    const list = [{ id: 1, categories: ['מסעדות', 'פנאי ובילוי'], type: 'other', status: 'active' }, { id: 2, category: 'אופנה', type: 'other', status: 'active' }];
    const ids = (cats) => filterCoupons(list, { filters: { ...EMPTY_FILTERS, cats: new Set(cats) } }).map((c) => c.id);
    expect(ids(['פנאי ובילוי'])).toEqual([1]);
    expect(ids(['אופנה', 'מסעדות'])).toEqual([1, 2]);
    expect(categoryCounts(list)).toEqual([['אופנה', 1], ['מסעדות', 1], ['פנאי ובילוי', 1]]);
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
      'LOVE GIFT CARD': 'castro.com/lovecard', 'Love Gift Card קסטרו': 'castro.com/lovecard', 'Power Gift Card': 'powergift.co.il',
      'Be פארם': 'bestore.co.il', 'ניו פארם': 'bestore.co.il', 'BE': 'bestore.co.il', 'המשביר לצרכן': '365mashbir.co.il',
    };
    for (const [text, domain] of Object.entries(cases)) expect([text, brandDomainOf(text)]).toEqual([text, domain]);
    expect(brandDomainOf('מועדון נאמנות')).toBeNull();
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
    expect(logoSources('zara.com')).toHaveLength(1);
  });
});

describe('families', () => {
  it('expiry alert is personal: own setting, else the family (old shared setting), else 14 days', () => {
    expect(alertDaysFor({ alertDays: 7 }, { alertDays: 30 })).toBe(7);
    expect(alertDaysFor({}, { alertDays: 30 })).toBe(30);
    expect(alertDaysFor({}, {})).toBe(14);
  });
  it('invite codes are cleaned while typing', () => expect(normalizeInviteCode('ab-c1 23x')).toBe('ABC123'));
  it('categories = defaults + custom, no duplicates', () => {
    const cats = familyCategories({ customCategories: ['דלק', 'מסעדות'] });
    expect(cats.filter((c) => c === 'מסעדות')).toHaveLength(1);
    expect(cats.at(-1)).toBe('דלק');
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
  it('long wordmarks lead on the board, the square site icon leads on a coupon tile', () => {
    expect(logoSources('dreamcard.co.il', 'wide')[0]).toBe('/brands/dreamcard.png');
    expect(logoSources('dreamcard.co.il')[0]).toContain('s2/favicons');
    expect(logoSources('dreamcard.co.il')[1]).toBe('/brands/dreamcard.png');
    expect(logoSources('crocs.co.il')[0]).toBe('/brands/crocs.svg');
  });
  it('dropped brands are no longer recognised', () => {
    for (const n of ['אמזון', 'נקסט', 'גודי']) expect(brandDomainOf(n), n).toBe(null);
  });
  it('Yeinot Bitan shows Carrefour (the chain was renamed)', () => expect(brandDomainOf('יינות ביתן')).toBe('carrefour.co.il'));
  it('stored logos exist in public/brands', async () => {
    const { existsSync } = await import('node:fs');
    for (const b of BRAND_LIST) {
      const own = logoSources(b.domain, 'wide').find(isOwnLogo);
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
