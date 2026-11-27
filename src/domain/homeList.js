// The home screen's list: search, and coupons grouped by category like a notepad. Pure functions.
import { COUPON_TYPES, GENERAL_CATEGORY, NO_CATEGORY } from './constants';
import { couponCategories } from './coupon';

const SEARCH_FIELDS = ['title', 'store', 'source', 'notes', 'code'];

export function matchesSearch(c, query) {
  const s = query.trim().toLowerCase();
  if (!s) return true;
  return SEARCH_FIELDS.some((k) => c[k] && String(c[k]).toLowerCase().includes(s)) || couponCategories(c).some((x) => x.toLowerCase().includes(s));
}

/** [[type, count], ...] in the form's order, only the types the coupons have (for the filter menu). */
export function typeCounts(coupons) {
  const n = {};
  for (const c of coupons) n[c.type] = (n[c.type] || 0) + 1;
  return COUPON_TYPES.filter((t) => n[t.key]).map((t) => [t.key, n[t.key]]);
}

/** Coupons of any of the chosen types; with none chosen, all of them. */
export const filterByTypes = (coupons, types) => (types.size ? coupons.filter((c) => types.has(c.type)) : coupons);

export const searchCoupons = (coupons, query = '') => coupons.filter((c) => matchesSearch(c, query));

/**
 * [{ category, items }]: each coupon once, under its first category (NO_CATEGORY when it has none).
 * Groups follow `order` (the family's categories), then categories it doesn't list (A→Z), then כללי, then
 * no category. Coupons keep their order inside a group.
 */
export function groupByCategory(coupons, order = []) {
  const groups = new Map();
  for (const c of coupons) {
    const k = couponCategories(c)[0] || NO_CATEGORY;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  const rank = (k) => (k === NO_CATEGORY ? 3 : k === GENERAL_CATEGORY ? 2 : order.includes(k) ? 0 : 1);
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || (rank(a) === 0 ? order.indexOf(a) - order.indexOf(b) : a.localeCompare(b, 'he')))
    .map(([category, items]) => ({ category, items }));
}
