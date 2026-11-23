// Sharing one coupon: the text that goes with its image, and the image's file name. Pure functions.
import { balanceOf, isMoney, isPhysical } from './coupon';
import { formatDate, money } from './format';
import { displayStore, isUrl } from './links';

function worth(c) {
  if (isMoney(c)) {
    const left = balanceOf(c);
    return `יתרה: ${money(left)}${c.value && left !== c.value ? ` מתוך ${money(c.value)}` : ''}`;
  }
  if (c.type === 'percent' && c.value) return `הנחה: ${c.value}%`;
  if (c.type === 'product') return 'שובר למוצר';
  return '';
}

/** Everything someone needs to use the coupon, as a short message. */
export function couponShareText(c) {
  const lines = [
    `🎟️ ${c.title}`,
    `איפה: ${displayStore(c.store)}`,
    isUrl(c.store) ? c.store.trim() : '',
    worth(c),
    c.code ? `קוד: ${c.code}` : '',
    c.cvv ? `קוד אימות: ${c.cvv}` : '',
    c.expiry ? `בתוקף עד: ${formatDate(c.expiry)}` : 'ללא תאריך תפוגה',
    isPhysical(c) ? 'שובר פיזי (צריך להביא אותו)' : '',
    c.notes ? `הערות: ${c.notes}` : '',
  ];
  return [...lines.filter(Boolean), '', 'נשלח מ-CouponVault'].join('\n');
}

/** "שובר מתנה 200.png": the title without characters some phones refuse in file names. */
export function shareFileName(c) {
  const name = (c.title || '').replace(/[\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  return `${name || 'coupon'}.png`;
}
