import { differenceInCalendarDays, parseISO, format } from 'date-fns';

/** Days until expiry (0 = today, negative = expired). null if no expiry. */
export function daysLeft(coupon) {
  if (!coupon.expiry) return null;
  return differenceInCalendarDays(parseISO(coupon.expiry), new Date());
}

export const isExpired = (c) => c.status === 'active' && daysLeft(c) !== null && daysLeft(c) < 0;
export const isActive = (c) => c.status === 'active' && !isExpired(c);

export function formatDate(iso) {
  if (!iso) return '';
  return format(parseISO(iso), 'dd/MM/yyyy');
}

export function expiryLabel(coupon) {
  const d = daysLeft(coupon);
  if (d === null) return 'ללא תוקף';
  if (d < 0) return `פג ב-${formatDate(coupon.expiry)}`;
  if (d === 0) return 'פג היום!';
  if (d === 1) return 'פג מחר';
  if (d <= 30) return `עוד ${d} ימים`;
  return `עד ${formatDate(coupon.expiry)}`;
}

/** 'red' | 'orange' | null: urgency colour for an active coupon. */
export function urgency(coupon, alertDays) {
  const d = daysLeft(coupon);
  if (d === null || d < 0) return null;
  if (d <= 3) return 'red';
  if (d <= alertDays) return 'orange';
  return null;
}

export const money = (n) =>
  `${Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 2 })}₪`;

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
  return a.expiry.localeCompare(b.expiry);
}

export function makeInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (const n of crypto.getRandomValues(new Uint32Array(6))) s += chars[n % chars.length];
  return s;
}
