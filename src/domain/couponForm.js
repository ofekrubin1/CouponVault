// The coupon form's model: initial values, validation and conversion to a stored coupon. Pure functions.
import { rebalance } from './coupon';

/** Marker for "add a new category" in the category picker. */
export const NEW_CATEGORY = '__new__';

/** Field order, so the form can jump to the first invalid one. */
export const FIELD_ORDER = ['title', 'store', 'category', 'value'];

export const formFromCoupon = (coupon) => ({
  title: coupon?.title || '',
  store: coupon?.store || '',
  category: coupon?.category || '',
  newCategory: '',
  type: coupon?.type || 'money',
  value: coupon?.value ?? '',
  expiry: coupon?.expiry || '',
  code: coupon?.code || '',
  source: coupon?.source || '',
  notes: coupon?.notes || '',
});

/** { field: message } for every invalid field (empty = valid). */
export function validateCouponForm(f) {
  const e = {};
  if (!f.title.trim()) e.title = 'חסר שם לקופון';
  if (!f.store.trim()) e.store = 'חסר איפה אפשר לממש';
  if (f.category === NEW_CATEGORY && !f.newCategory.trim()) e.category = 'חסר שם לקטגוריה החדשה';
  const v = f.value === '' ? null : Number(f.value);
  if (f.type === 'money' && !(v > 0)) e.value = 'בשובר כספי צריך להזין סכום';
  if (f.type === 'percent' && v != null && !(v > 0 && v <= 100)) e.value = 'אחוז בין 1 ל-100';
  return e;
}

export const firstInvalidField = (errors) => FIELD_ORDER.find((k) => errors[k]);

/** The category the form resolves to ('' for none). */
export const formCategory = (f) => (f.category === NEW_CATEGORY ? f.newCategory.trim() : f.category);

/**
 * Stored coupon fields from a valid form. When editing a voucher that was partly used, the balance is
 * recalculated from the new face value.
 */
export function couponFromForm(f, existing = null) {
  const value = f.type === 'other' || f.value === '' ? null : Number(f.value);
  const data = {
    title: f.title.trim(),
    store: f.store.trim(),
    category: formCategory(f),
    type: f.type,
    value,
    expiry: f.expiry || null,
    code: f.code.trim(),
    source: f.source.trim(),
    notes: f.notes.trim(),
  };
  if (existing) data.balance = data.type === 'money' ? rebalance(value, existing) : null;
  return data;
}
