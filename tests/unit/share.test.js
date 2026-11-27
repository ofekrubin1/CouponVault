import { describe, it, expect } from 'vitest';
import { couponShareText, shareFileName } from '@/domain/share';


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

describe('photo size', () => {
  it('scales the long side down to the limit, keeping the shape; small photos stay as they are', async () => {
    const { fitSize } = await import('@/domain/photo');
    expect(fitSize(4000, 3000, 1600)).toEqual({ w: 1600, h: 1200 });
    expect(fitSize(3000, 4000, 1600)).toEqual({ w: 1200, h: 1600 });
    expect(fitSize(800, 600, 1600)).toEqual({ w: 800, h: 600 });
  });
  it('a landscape photo turns sideways to fill a portrait screen', async () => {
    const { shouldRotate } = await import('@/domain/photo');
    expect(shouldRotate({ w: 800, h: 560 }, { w: 390, h: 844 })).toBe(true);
    expect(shouldRotate({ w: 560, h: 800 }, { w: 390, h: 844 })).toBe(false);
    expect(shouldRotate({ w: 800, h: 560 }, { w: 1200, h: 800 })).toBe(false); // a wide screen shows it as it is
  });
});
