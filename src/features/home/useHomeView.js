import { useMemo } from 'react';
import { isActive, isExpiringSoon, sortByExpiry, summarize } from '@/domain/coupon';
import { groupByCategory, searchCoupons } from '@/domain/homeList';

/**
 * Everything the home screen shows: the summary line and the active coupons grouped by category.
 * `soonOnly`: just the ones about to expire (ignored once there are none, so the list never empties by itself).
 */
export function useHomeView(coupons, alertDays, categories, query, soonOnly = false) {
  const active = useMemo(() => coupons.filter((c) => isActive(c)).sort(sortByExpiry), [coupons]);
  return useMemo(() => {
    const summary = summarize(active, alertDays);
    const soon = soonOnly && summary.expiringCount > 0;
    const shown = searchCoupons(soon ? active.filter((c) => isExpiringSoon(c, alertDays)) : active, query);
    return { active, summary, soon, groups: groupByCategory(shown, categories), shownCount: shown.length };
  }, [active, alertDays, categories, query, soonOnly]);
}
