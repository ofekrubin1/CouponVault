// Home-screen search + filters (category "tags", type, expiring soon). Pure functions.
import { NO_CATEGORY } from './constants';
import { balanceOf, couponCategories, isExpiringSoon, isMoney } from './coupon';
import { round2 } from './format';

export const EMPTY_FILTERS = Object.freeze({ cats: new Set(), types: new Set(), soon: false });

/** Filter keys of a coupon's categories (NO_CATEGORY when it has none). */
export const categoryKeys = (c) => {
  const cats = couponCategories(c);
  return cats.length ? cats : [NO_CATEGORY];
};

export const toggleIn = (set, v) => {
  const n = new Set(set);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
};

export const activeFilterCount = (f) => f.cats.size + f.types.size + (f.soon ? 1 : 0);

/** [[category, count], ...] most used first. */
export function categoryCounts(coupons) {
  const m = new Map();
  for (const c of coupons) for (const k of categoryKeys(c)) m.set(k, (m.get(k) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'he'));
}

export const typeCounts = (coupons) => coupons.reduce((acc, c) => ({ ...acc, [c.type]: (acc[c.type] || 0) + 1 }), {});

const SEARCH_FIELDS = ['title', 'store', 'source', 'notes', 'code'];

export function matchesSearch(c, query) {
  const s = query.trim().toLowerCase();
  if (!s) return true;
  return SEARCH_FIELDS.some((k) => c[k] && String(c[k]).toLowerCase().includes(s)) || couponCategories(c).some((x) => x.toLowerCase().includes(s));
}

export function filterCoupons(coupons, { query = '', filters = EMPTY_FILTERS, alertDays, now } = {}) {
  return coupons.filter((c) => {
    if (filters.cats.size && !categoryKeys(c).some((k) => filters.cats.has(k))) return false;
    if (filters.types.size && !filters.types.has(c.type)) return false;
    if (filters.soon && !isExpiringSoon(c, alertDays, now)) return false;
    return matchesSearch(c, query);
  });
}

export const voucherBalance = (coupons) => round2(coupons.filter(isMoney).reduce((s, c) => s + balanceOf(c), 0));
