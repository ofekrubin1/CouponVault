// Domain constants: plain data only (no React, no icons). Display details live in features/coupons/categoryStyle.js.

export const DEFAULT_CATEGORIES = ['מסעדות', 'סופרמרקט', 'אופנה', 'אלקטרוניקה', 'בית', 'פנאי ובילוי', 'טיפוח', 'אחר'];

/** Filter key for coupons without a category. */
export const NO_CATEGORY = 'ללא קטגוריה';

export const COUPON_TYPES = [
  { key: 'money', label: 'שובר כספי' },
  { key: 'percent', label: 'הנחה באחוזים' },
  { key: 'other', label: 'אחר' },
];
export const couponTypeLabel = (key) => COUPON_TYPES.find((t) => t.key === key)?.label ?? key;

export const DEFAULT_ALERT_DAYS = 14;
export const ALERT_DAY_OPTIONS = [7, 14, 30, 60];

/** Quick expiry presets for the coupon form. */
export const EXPIRY_PRESETS = [
  { label: 'חודש', months: 1 },
  { label: '3 חודשים', months: 3 },
  { label: 'חצי שנה', months: 6 },
  { label: 'שנה', months: 12 },
];

export const INVITE_CODE_LENGTH = 6;
