import { describe, it, expect } from 'vitest';
import { daysLeft, isExpired, isActive, expiryLabel, expiryText, urgency, sortByExpiry, usedAmount } from '@/domain/coupon';
import { money, formatDate, round2, firstName } from '@/domain/format';
import { makeInviteCode } from '@/domain/family';

const NOW = new Date(2026, 10, 15, 12, 0); // 15/11/2026 noon
const c = (fields) => ({ status: 'active', title: 'x', ...fields });

describe('daysLeft', () => {
  it('is null without an expiry', () => expect(daysLeft(c({}), NOW)).toBeNull());
  it('is 0 on the expiry day', () => expect(daysLeft(c({ expiry: '2026-11-15' }), NOW)).toBe(0));
  it('counts calendar days ahead', () => expect(daysLeft(c({ expiry: '2026-11-25' }), NOW)).toBe(10));
  it('is negative after expiry', () => expect(daysLeft(c({ expiry: '2026-11-14' }), NOW)).toBe(-1));
});

describe('isExpired / isActive', () => {
  it('expired = active coupon whose date passed', () => {
    expect(isExpired(c({ expiry: '2026-11-01' }), NOW)).toBe(true);
    expect(isActive(c({ expiry: '2026-11-01' }), NOW)).toBe(false);
  });
  it('a coupon expiring today is still active', () => expect(isActive(c({ expiry: '2026-11-15' }), NOW)).toBe(true));
  it('no expiry = active forever', () => expect(isActive(c({}), NOW)).toBe(true));
  it('used coupons are neither active nor expired', () => {
    const used = c({ status: 'used', expiry: '2026-01-01' });
    expect(isActive(used, NOW)).toBe(false);
    expect(isExpired(used, NOW)).toBe(false);
  });
});

// Regression: inside a 60-day alert window a coupon 37 days away read "עד 31/12/2026" instead of the days left.
describe('expiryText (days left whenever the coupon is inside the alert window)', () => {
  const at = (days) => {
    const d = new Date(NOW);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  it('inside the window: always the days left', () => {
    expect(expiryText(c({ expiry: at(37) }), 60, NOW)).toBe('עוד 37 ימים');
    expect(expiryText(c({ expiry: at(19) }), 60, NOW)).toBe('עוד 19 ימים');
    expect(expiryText(c({ expiry: at(1) }), 14, NOW)).toBe('פג מחר');
    expect(expiryText(c({ expiry: at(0) }), 14, NOW)).toBe('פג היום');
  });
  it('outside the window: the date; no expiry / expired as before', () => {
    expect(expiryText(c({ expiry: at(37) }), 30, NOW)).toMatch(/^עד \d\d\/\d\d\/\d{4}$/);
    expect(expiryText(c({}), 14, NOW)).toBe('ללא תוקף');
    expect(expiryText(c({ expiry: at(-2) }), 14, NOW)).toMatch(/^פג ב-/);
  });
});

describe('expiryLabel', () => {
  it.each([
    [undefined, 'ללא תוקף'],
    ['2026-11-15', 'פג היום'],
    ['2026-11-16', 'פג מחר'],
    ['2026-11-20', 'עוד 5 ימים'],
    ['2027-03-01', 'עד 01/03/2027'],
    ['2026-11-10', 'פג ב-10/11/2026'],
  ])('%s → %s', (expiry, label) => expect(expiryLabel(c({ expiry }), NOW)).toBe(label));
});

describe('urgency', () => {
  it('red within 3 days', () => expect(urgency(c({ expiry: '2026-11-18' }), 14, NOW)).toBe('red'));
  it('gold within the alert window', () => expect(urgency(c({ expiry: '2026-11-29' }), 14, NOW)).toBe('gold'));
  it('none beyond the alert window', () => expect(urgency(c({ expiry: '2026-11-30' }), 14, NOW)).toBeNull());
  it('none without expiry or when expired', () => {
    expect(urgency(c({}), 14, NOW)).toBeNull();
    expect(urgency(c({ expiry: '2026-11-01' }), 14, NOW)).toBeNull();
  });
});

describe('values', () => {
  it('money formatting', () => {
    expect(money(200)).toBe('₪200');
    expect(money(1250.5)).toBe('₪1,250.5');
    expect(money(null)).toBe('₪0');
  });
  it('usedAmount sums the history', () => {
    expect(usedAmount(c({ usages: [{ amount: 50 }, { amount: 30.5 }, { amount: null }] }))).toBe(80.5);
    expect(usedAmount(c({}))).toBe(0);
  });
  it('round2 avoids float noise', () => expect(round2(0.1 + 0.2)).toBe(0.3));
});

describe('sortByExpiry', () => {
  it('earliest first, no expiry last, ties by title', () => {
    const list = [
      c({ title: 'ב', expiry: null }),
      c({ title: 'ג', expiry: '2027-01-01' }),
      c({ title: 'א', expiry: '2026-12-01' }),
      c({ title: 'ד', expiry: '2026-12-01' }),
      c({ title: 'א', expiry: null }),
    ];
    expect(list.sort(sortByExpiry).map((x) => x.title)).toEqual(['א', 'ד', 'ג', 'א', 'ב']);
  });
});

describe('misc', () => {
  it('invite codes are 6 unambiguous characters', () => {
    for (let i = 0; i < 200; i++) expect(makeInviteCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
  it('formatDate accepts dates and timestamps', () => {
    expect(formatDate('2026-11-05')).toBe('05/11/2026');
    expect(formatDate('2026-11-05T21:30:00.000Z')).toBe('05/11/2026');
    expect(formatDate('')).toBe('');
  });
  it('firstName', () => {
    expect(firstName('אופק רובין')).toBe('אופק');
    expect(firstName(undefined)).toBe('');
  });
});
