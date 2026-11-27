import { useMemo } from 'react';
import { isActive, isExpiringSoon, sortByExpiry, summarize } from '@/domain/coupon';
import { filterByTypes, groupByCategory, searchCoupons, typeCounts } from '@/domain/homeList';

const NO_TYPES = new Set();

/**
 * Everything the home screen shows: the summary line and the active coupons grouped by category.
 * `soonOnly`: just the ones about to expire (ignored once there are none, so the list never empties by itself).
 * `types`: just these coupon types (a Set; empty = all). Types no coupon has any more are ignored.
 */
export function useHomeView(coupons, alertDays, categories, query, soonOnly = false, types = NO_TYPES) {
  const active = useMemo(() => coupons.filter((c) => isActive(c)).sort(sortByExpiry), [coupons]);
  return useMemo(() => {
    const summary = summarize(active, alertDays);
    const soon = soonOnly && summary.expiringCount > 0;
    const counts = typeCounts(active);
    const chosen = new Set([...types].filter((t) => counts.some(([k]) => k === t)));
    const shown = searchCoupons(filterByTypes(soon ? active.filter((c) => isExpiringSoon(c, alertDays)) : active, chosen), query);
    return { active, summary, soon, typeCounts: counts, types: chosen, groups: groupByCategory(shown, categories), shownCount: shown.length };
  }, [active, alertDays, categories, query, soonOnly, types]);
}
