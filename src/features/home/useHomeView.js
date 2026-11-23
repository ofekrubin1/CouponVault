import { useMemo } from 'react';
import { isActive, sortByExpiry, summarize } from '@/domain/coupon';
import { groupByCategory, searchCoupons } from '@/domain/homeList';

/** Everything the home screen shows: the summary line and the active coupons grouped by category. */
export function useHomeView(coupons, alertDays, categories, query) {
  const active = useMemo(() => coupons.filter((c) => isActive(c)).sort(sortByExpiry), [coupons]);
  return useMemo(() => {
    const shown = searchCoupons(active, query);
    return {
      active,
      summary: summarize(active, alertDays),
      groups: groupByCategory(shown, categories),
      shownCount: shown.length,
    };
  }, [active, alertDays, categories, query]);
}
