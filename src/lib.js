import { addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns';

export const round2 = (n) => Math.round(n * 100) / 100;

export const toISODate = (d) => format(d, 'yyyy-MM-dd');

/** Days until expiry (0 = today, negative = expired). null if no expiry. */
export function daysLeft(coupon, now = new Date()) {
  if (!coupon?.expiry) return null;
  return differenceInCalendarDays(parseISO(coupon.expiry), now);
}

export const isExpired = (c, now) => c.status === 'active' && daysLeft(c, now) !== null && daysLeft(c, now) < 0;
export const isActive = (c, now) => c.status === 'active' && !isExpired(c, now);

export function formatDate(iso) {
  if (!iso) return '';
  return format(parseISO(iso.slice(0, 10)), 'dd/MM/yyyy');
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

export const money = (n) => `₪${Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 2 })}`;

/** Short human description of a coupon's worth. */
export function valueLabel(c) {
  if (c.type === 'money') {
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

export function makeInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (const n of crypto.getRandomValues(new Uint32Array(6))) s += chars[n % chars.length];
  return s;
}

/** Quick expiry presets for the coupon form. */
export const EXPIRY_PRESETS = [
  { label: 'חודש', months: 1 },
  { label: '3 חודשים', months: 3 },
  { label: 'חצי שנה', months: 6 },
  { label: 'שנה', months: 12 },
];
export const presetDate = (months, now = new Date()) => toISODate(addMonths(now, months));

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || '';
