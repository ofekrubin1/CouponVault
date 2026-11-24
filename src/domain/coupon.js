// Coupon rules: expiry, value, ordering and redemption math. Pure functions (unit-tested).
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { formatDate, money, round2 } from './format';
import { LEGACY_CATEGORIES } from './constants';

/** Days until expiry (0 = today, negative = expired). null if no expiry. */
export function daysLeft(coupon, now = new Date()) {
  if (!coupon?.expiry) return null;
  return differenceInCalendarDays(parseISO(coupon.expiry), now);
}

/** A coupon's categories as stored. Older coupons stored a single `category`; newer ones a `categories` list. */
export function couponCategories(c) {
  return Array.isArray(c?.categories) && c.categories.length ? c.categories : c?.category ? [c.category] : [];
}

/**
 * The coupon's categories in terms of the family's: an old built-in category (from before there were four)
 * that the family doesn't have reads as the one it was folded into (e.g. מסעדות → אוכל). A name the family
 * has (built-in or its own, like a "בית" it created) is kept exactly as it is.
 */
export function resolveCategories(c, familyCats) {
  return [...new Set(couponCategories(c).map((x) => (familyCats.includes(x) ? x : LEGACY_CATEGORIES[x] || x)))];
}

/** Coupons as loaded, with their categories resolved once for the family (every screen then shows the same). */
export const withFamilyCategories = (coupons, familyCats) =>
  coupons.map((c) => {
    const categories = resolveCategories(c, familyCats);
    return { ...c, categories, category: categories[0] || '' };
  });

export const isUsed = (c) => c.status === 'used';
/** Physical voucher (paper / card). Coupons saved before this option existed are digital. */
export const isPhysical = (c) => c?.format === 'physical';
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

/**
 * What the coupon says about its expiry: inside the alert window always the days left ("עוד 37 ימים"), outside
 * it the date. (expiryLabel counts days only up to 30, so a longer window used to show a date instead.)
 */
export function expiryText(coupon, alertDays, now) {
  const d = daysLeft(coupon, now);
  if (d === null || d < 0 || d > alertDays) return expiryLabel(coupon, now);
  if (d === 0) return 'פג היום';
  if (d === 1) return 'פג מחר';
  return `עוד ${d} ימים`;
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


export function sortByExpiry(a, b) {
  if (!a.expiry && !b.expiry) return (a.title || '').localeCompare(b.title || '', 'he');
  if (!a.expiry) return 1;
  if (!b.expiry) return -1;
  return a.expiry.localeCompare(b.expiry) || (a.title || '').localeCompare(b.title || '', 'he');
}

/** Balance after undoing the most recent use: its amount comes back, but never above the face value. */
export function balanceAfterUndo(c) {
  const last = (c.usages || []).at(-1);
  return Math.min(c.value ?? 0, round2(balanceOf(c) + (Number(last?.amount) || 0)));
}

export const usedAmount = (c) => (c.usages || []).reduce((s, u) => s + (Number(u.amount) || 0), 0);

/**
 * Balance after a voucher's face value is edited: the current balance moves by the same amount. (Not "value
 * minus history": a voucher restored from the archive keeps its history but has its full balance back.)
 * A coupon that only now becomes a voucher starts with its full value.
 */
export function rebalance(newValue, coupon) {
  if (!isMoney(coupon)) return newValue;
  return Math.max(0, round2(balanceOf(coupon) + newValue - (coupon.value ?? 0)));
}

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
    productCount: active.filter((c) => c.type === 'product').length,
    balance: round2(vouchers.reduce((s, c) => s + balanceOf(c), 0)),
  };
}
