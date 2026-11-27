import { useMemo } from 'react';
import { isActive, isExpiringSoon, sortByExpiry, summarize } from '@/domain/coupon';
import { categoryCounts, filterByCategories, groupByCategory, searchCoupons } from '@/domain/homeList';

const NONE = new Set();

/**
 * Everything the home screen shows: the summary line and the active coupons grouped by category.
 * `soonOnly`: just the ones about to expire (ignored once there are none, so the list never empties by itself).
 * `cats`: just these categories (a Set; empty = all). Categories with no active coupons any more are ignored.
 */
export function useHomeView(coupons, alertDays, categories, query, soonOnly = false, cats = NONE) {
  const active = useMemo(() => coupons.filter((c) => isActive(c)).sort(sortByExpiry), [coupons]);
  return useMemo(() => {
    const summary = summarize(active, alertDays);
    const soon = soonOnly && summary.expiringCount > 0;
    const counts = categoryCounts(active, categories);
    const chosen = new Set([...cats].filter((k) => counts.some(([c]) => c === k)));
    const shown = searchCoupons(filterByCategories(soon ? active.filter((c) => isExpiringSoon(c, alertDays)) : active, chosen), query);
    return { active, summary, soon, categoryCounts: counts, cats: chosen, groups: groupByCategory(shown, categories), shownCount: shown.length };
  }, [active, alertDays, categories, query, soonOnly, cats]);
}
