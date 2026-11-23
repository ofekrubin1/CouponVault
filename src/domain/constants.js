// Domain constants: plain data only (no React, no icons). Display details live in features/coupons/categoryStyle.js.

export const DEFAULT_CATEGORIES = ['כללי', 'אוכל', 'סופרמרקט', 'ביגוד'];
/** The catch-all category: its group comes last on the home screen. */
export const GENERAL_CATEGORY = 'כללי';

/** Built-in categories of earlier versions → the one they now belong to (applied when reading a coupon). */
export const LEGACY_CATEGORIES = {
  מסעדות: 'אוכל',
  אופנה: 'ביגוד',
  אחר: 'כללי',
  אלקטרוניקה: 'כללי',
  בית: 'כללי',
  'פנאי ובילוי': 'כללי',
  טיפוח: 'כללי',
};

/** Filter key for coupons without a category. */
export const NO_CATEGORY = 'ללא קטגוריה';

export const COUPON_TYPES = [
  { key: 'money', label: 'שובר כספי', short: 'כספי' },
  { key: 'percent', label: 'הנחה באחוזים', short: 'אחוזים' },
  // a voucher for a specific item (e.g. a McRoyal meal): no amount, used once
  { key: 'product', label: 'שובר למוצר', short: 'מוצר' },
  { key: 'other', label: 'אחר', short: 'אחר' },
];
/** Is the coupon a code on the phone, or a paper/plastic card you have to bring along. */
export const COUPON_FORMATS = [
  { key: 'digital', label: 'דיגיטלי' },
  { key: 'physical', label: 'פיזי' },
];
export const DEFAULT_FORMAT = 'digital';

/** Types that carry a number (an amount or a percentage). */
export const hasValue = (type) => type === 'money' || type === 'percent';

export const couponTypeLabel = (key) => COUPON_TYPES.find((t) => t.key === key)?.label ?? key;

export const DEFAULT_ALERT_DAYS = 14;
export const ALERT_DAY_OPTIONS = [7, 14, 30, 60];

export const INVITE_CODE_LENGTH = 6;
