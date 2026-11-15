import { describe, it, expect } from 'vitest';
import {
  daysLeft, isExpired, isActive, expiryLabel, urgency, valueLabel, sortByExpiry, money, makeInviteCode,
  presetDate, usedAmount, formatDate, round2, firstName,
} from '../../src/lib.js';

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
  it('valueLabel per type', () => {
    expect(valueLabel(c({ type: 'money', value: 200, balance: 200 }))).toBe('₪200');
    expect(valueLabel(c({ type: 'money', value: 200, balance: 120 }))).toBe('נותר ₪120 מתוך ₪200');
    expect(valueLabel(c({ type: 'percent', value: 20 }))).toBe('20% הנחה');
    expect(valueLabel(c({ type: 'other' }))).toBe('');
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
  it('expiry presets add months', () => {
    expect(presetDate(1, NOW)).toBe('2026-12-15');
    expect(presetDate(12, NOW)).toBe('2027-11-15');
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
