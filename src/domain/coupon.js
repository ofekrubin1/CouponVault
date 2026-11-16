// Coupon rules: expiry, value, ordering and redemption math. Pure functions (unit-tested).
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { formatDate, money, round2 } from './format';

/** Days until expiry (0 = today, negative = expired). null if no expiry. */
export function daysLeft(coupon, now = new Date()) {
  if (!coupon?.expiry) return null;
  return differenceInCalendarDays(parseISO(coupon.expiry), now);
}

export const isUsed = (c) => c.status === 'used';
export const isExpired = (c, now) => c.status === 'active' && daysLeft(c, now) !== null && daysLeft(c, now) < 0;
export const isActive = (c, now) => c.status === 'active' && !isExpired(c, now);
export const isMoney = (c) => c.type === 'money';

/** Expiring within the family's alert window (and not yet expired). */
export function isExpiringSoon(c, alertDays, now) {
  const d = daysLeft(c, now);
  return d !== null && d >= 0 && d <= alertDays;
}

export function expiryLabel(coupon, now) {
  const d = daysLeft(coupon, now);
  if (d === null) return 'ללא תוקף';
  if (d < 0) return `פג ב-${formatDate(coupon.expiry)}`;
  if (d === 0) return 'פג היום';
  if (d === 1) return 'פג מחר';
  if (d <= 30) return `עוד ${d} ימים`;
  return `עד ${formatDate(coupon.expiry)}`;
}

/** 'red' (≤3 days) | 'gold' (≤ alertDays) | null for an active coupon. */
export function urgency(coupon, alertDays, now) {
  const d = daysLeft(coupon, now);
  if (d === null || d < 0) return null;
  if (d <= 3) return 'red';
  if (d <= alertDays) return 'gold';
  return null;
}

/** What's left on a voucher (balance falls back to the face value). */
export const balanceOf = (c) => (isMoney(c) ? c.balance ?? c.value ?? 0 : 0);

/** Short human description of a coupon's worth. */
export function valueLabel(c) {
  if (isMoney(c)) {
    if (c.balance != null && c.balance !== c.value) return `נותר ${money(c.balance)} מתוך ${money(c.value)}`;
    return money(c.value);
  }
  if (c.type === 'percent' && c.value) return `${c.value}% הנחה`;
  return '';
}

export function sortByExpiry(a, b) {
  if (!a.expiry && !b.expiry) return (a.title || '').localeCompare(b.title || '', 'he');
  if (!a.expiry) return 1;
  if (!b.expiry) return -1;
  return a.expiry.localeCompare(b.expiry) || (a.title || '').localeCompare(b.title || '', 'he');
}

export const usedAmount = (c) => (c.usages || []).reduce((s, u) => s + (Number(u.amount) || 0), 0);

/** Balance after the face value of a partly used voucher is edited. */
export const rebalance = (newValue, coupon) => Math.max(0, round2(newValue - usedAmount(coupon)));

/**
 * Plan a redemption. amount = null means "used it all".
 * Returns { spend, left, finished } or { error } for an invalid partial amount.
 */
export function planRedemption(coupon, amount = null) {
  if (!isMoney(coupon)) return { spend: null, left: 0, finished: true };
  const balance = balanceOf(coupon);
  if (amount == null) return { spend: balance, left: 0, finished: true };
  const n = Number(amount);
  if (!(n > 0)) return { error: 'יש להזין סכום' };
  if (n > balance) return { error: `הסכום גדול מהיתרה (${money(balance)})` };
  const left = round2(balance - n);
  return { spend: n, left, finished: left <= 0 };
}

/** Summary numbers for the home screen. */
export function summarize(active, alertDays, now) {
  const vouchers = active.filter(isMoney);
  return {
    activeCount: active.length,
    expiringCount: active.filter((c) => isExpiringSoon(c, alertDays, now)).length,
    moneyCount: vouchers.length,
    balance: round2(vouchers.reduce((s, c) => s + balanceOf(c), 0)),
  };
}
