// The coupon form's model: initial values, validation and conversion to a stored coupon. Pure functions.
import { couponCategories, isPhysical, rebalance } from './coupon';
import { hasValue, NO_CATEGORY } from './constants';

/** Field order, so the form can jump to the first invalid one. */
export const FIELD_ORDER = ['title', 'store', 'category', 'value', 'code', 'cvv'];

/** A verification code (like a credit card's CVV): exactly 3 digits. */
export const isCvv = (s) => /^\d{3}$/.test(s);

export const formFromCoupon = (coupon) => ({
  title: coupon?.title || '',
  store: coupon?.store || '',
  categories: coupon ? [...couponCategories(coupon)] : [],
  addingCategory: false,
  newCategory: '',
  type: coupon?.type || 'money',
  format: coupon && isPhysical(coupon) ? 'physical' : 'digital',
  value: coupon?.value ?? '',
  expiry: coupon?.expiry || '',
  code: coupon?.code || '',
  hasCvv: !!coupon?.cvv,
  cvv: coupon?.cvv || '',
  source: coupon?.source || '',
  notes: coupon?.notes || '',
});

/**
 * { field: message } for every invalid field (empty = valid). Where to use it is optional (the form asks before
 * saving without it); the code is optional when a photo of the voucher is attached (`hasPhoto`).
 */
export function validateCouponForm(f, { hasPhoto = false } = {}) {
  const e = {};
  if (!f.title.trim()) e.title = 'חסר שם לקופון';
  if (f.addingCategory && !f.newCategory.trim()) e.category = 'חסר שם לקטגוריה החדשה';
  if (f.addingCategory && f.newCategory.trim() === NO_CATEGORY) e.category = 'השם הזה שמור. בחרו שם אחר';
  const v = f.value === '' ? null : Number(f.value);
  if (f.type === 'money' && !(v > 0)) e.value = 'בשובר כספי צריך סכום. שובר למוצר? בחרו "מוצר"';
  if (f.type === 'percent' && v != null && !(v > 0 && v <= 100)) e.value = 'אחוז בין 1 ל-100';
  if (!f.code.trim() && !hasPhoto) e.code = 'חסר קוד / מספר שובר. או שצרפו תמונה של השובר';
  if (f.hasCvv && f.cvv.trim() && !isCvv(f.cvv.trim())) e.cvv = 'קוד אימות הוא 3 ספרות';
  return e;
}

export const firstInvalidField = (errors) => FIELD_ORDER.find((k) => errors[k]);

/** All categories the form resolves to (selected + the new one), without duplicates. */
export function formCategories(f) {
  const extra = f.addingCategory ? f.newCategory.trim() : '';
  return [...new Set([...f.categories, ...(extra ? [extra] : [])])];
}

/**
 * Stored coupon fields from a valid form. `category` keeps the first one for older app versions.
 * When editing a voucher that was partly used, the balance is recalculated from the new face value.
 */
export function couponFromForm(f, existing = null) {
  const value = !hasValue(f.type) || f.value === '' ? null : Number(f.value);
  const categories = formCategories(f);
  const data = {
    title: f.title.trim(),
    store: f.store.trim(),
    categories,
    category: categories[0] || '',
    type: f.type,
    format: f.format === 'physical' ? 'physical' : 'digital',
    value,
    expiry: f.expiry || null,
    code: f.code.trim(),
    cvv: f.hasCvv && isCvv(f.cvv.trim()) ? f.cvv.trim() : '',
    source: f.source.trim(),
    notes: f.notes.trim(),
  };
  if (existing) data.balance = data.type === 'money' ? rebalance(value, existing) : null;
  return data;
}
