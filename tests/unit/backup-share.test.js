import { describe, it, expect } from 'vitest';
import { buildBackup, backupFileName } from '@/domain/backup';
import { couponShareText, shareFileName } from '@/domain/share';

const ts = (iso) => ({ toDate: () => new Date(iso) }); // a Firestore Timestamp, as the SDK returns it

describe('backup', () => {
  const user = { displayName: 'אופק', email: 'o@x.com' };
  const families = [
    { id: 'f1', name: 'משפחה', members: ['a', 'b'], memberInfo: { a: { name: 'אופק', email: 'o@x.com', photo: 'p' }, b: { name: 'דנה', email: 'd@x.com' } }, customCategories: ['בית'], alertDays: 14, inviteCode: 'ABC234', synced: true },
    { id: 'f2', name: 'חברים', members: ['a'], memberInfo: { a: { name: 'אופק', email: 'o@x.com' } } },
  ];
  const couponsByFamily = {
    f1: [{ id: 'c1', title: 'שובר', categories: ['בית'], createdAt: ts('2026-11-01T10:00:00Z'), usages: [{ at: '2026-11-02T10:00:00.000Z', amount: 50 }] }],
  };
  const b = buildBackup({ user, families, couponsByFamily, now: new Date('2026-11-24T08:00:00Z') });

  it('says what it is and when it was made', () => {
    expect(b).toMatchObject({ app: 'CouponVault', version: 1, exportedAt: '2026-11-24T08:00:00.000Z', exportedBy: { name: 'אופק', email: 'o@x.com' } });
  });
  it('has every family with its members, own categories and all its coupons', () => {
    expect(b.families.map((f) => f.name)).toEqual(['משפחה', 'חברים']);
    expect(b.families[0].members).toEqual([{ name: 'אופק', email: 'o@x.com' }, { name: 'דנה', email: 'd@x.com' }]);
    expect(b.families[0].customCategories).toEqual(['בית']);
    expect(b.families[0].coupons[0]).toMatchObject({ id: 'c1', title: 'שובר', categories: ['בית'] });
    expect(b.families[1].coupons).toEqual([]);
  });
  it('turns timestamps into plain dates, so the file is plain JSON', () => {
    expect(b.families[0].coupons[0].createdAt).toBe('2026-11-01T10:00:00.000Z');
    expect(JSON.parse(JSON.stringify(b))).toEqual(b);
  });
  it('leaves out what only this phone knows and the invite code', () => {
    expect(b.families[0]).not.toHaveProperty('synced');
    expect(b.families[0]).not.toHaveProperty('inviteCode');
  });
  it('file name carries the date', () => expect(backupFileName(new Date('2026-11-24T08:00:00Z'))).toBe('couponvault-backup-2026-11-24.json'));
});

describe('sharing a coupon', () => {
  const voucher = { title: 'שובר מתנה', store: 'Buyme', type: 'money', value: 400, balance: 250, code: 'BM-48213', cvv: '412', expiry: '2026-11-27', format: 'physical', notes: 'רק בסניפים' };
  it('the message carries every detail needed to use it', () => {
    const t = couponShareText(voucher);
    for (const part of ['שובר מתנה', 'Buyme', '₪250', 'מתוך ₪400', 'BM-48213', '412', '27/11/2026', 'פיזי', 'רק בסניפים']) expect(t).toContain(part);
  });
  it('per type: percent, product, no expiry, a link as the store', () => {
    expect(couponShareText({ title: 'הנחה', store: 'קסטרו', type: 'percent', value: 20, code: 'C' })).toContain('20%');
    expect(couponShareText({ title: 'ארוחה', store: 'מקדונלדס', type: 'product', code: 'M' })).toContain('שובר למוצר');
    expect(couponShareText({ title: 'x', store: 'y', type: 'other', code: 'Z' })).toContain('ללא תאריך תפוגה');
    expect(couponShareText({ title: 'x', store: 'https://www.htzone.co.il/v/10', type: 'other', code: 'Z' })).toContain('https://www.htzone.co.il/v/10');
  });
  it('leaves out what the coupon does not have', () => {
    const t = couponShareText({ title: 'x', store: 'y', type: 'other', code: 'Z' });
    expect(t).not.toContain('קוד אימות');
    expect(t).not.toContain('הערות');
  });
  it('image file name from the title, safe for any phone', () => {
    expect(shareFileName({ title: 'שובר / מתנה: 200?' })).toBe('שובר מתנה 200.png');
    expect(shareFileName({ title: '   ' })).toBe('coupon.png');
  });
});
