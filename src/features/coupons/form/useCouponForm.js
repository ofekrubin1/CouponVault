import { useState } from 'react';
import { couponFromForm, firstInvalidField, formFromCoupon, validateCouponForm } from '@/domain/couponForm';

/**
 * State of the coupon form: the values, their errors, whether anything was typed, and submitting.
 * `submit(onValid)` validates; when a field is invalid it scrolls that field into view (inside `bodyRef`) and
 * focuses it, otherwise it calls onValid with the coupon data to store.
 */
export function useCouponForm(coupon, categories, bodyRef) {
  const [f, setF] = useState(() => formFromCoupon(coupon));
  const [errors, setErrors] = useState({});
  const [initial] = useState(() => JSON.stringify(formFromCoupon(coupon)));
  // the coupon's own categories stay listed (e.g. one the family removed) so they can still be unticked
  const [ownCategories] = useState(() => formFromCoupon(coupon).categories);

  /** set('title') → an onChange handler; also clears that field's error (or `errKey`'s). */
  const set = (k, errKey = k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setF((p) => ({ ...p, [k]: v }));
    setErrors((p) => (p[errKey] ? { ...p, [errKey]: undefined } : p));
  };

  const toggleCategory = (c) => set('categories')(f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c]);

  function submit(onValid) {
    const e = validateCouponForm(f);
    setErrors(e);
    const first = firstInvalidField(e);
    if (!first) return onValid(couponFromForm(f, coupon));
    const el = bodyRef.current?.querySelector(`[data-field="${first}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el?.querySelector('input')?.focus({ preventScroll: true });
    return undefined;
  }

  return {
    f,
    set,
    errors,
    hasErrors: Object.values(errors).some(Boolean),
    unsaved: JSON.stringify(f) !== initial,
    pickable: [...new Set([...categories, ...ownCategories])],
    toggleCategory,
    submit,
  };
}
