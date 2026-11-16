import { useMemo } from 'react';
import { isActive, isExpiringSoon, sortByExpiry, summarize } from '@/domain/coupon';
import { activeFilterCount, categoryCounts, filterCoupons, typeCounts, voucherBalance } from '@/domain/filters';

/** Everything the home screen shows, derived from the coupons + current search/filters. */
export function useHomeView(coupons, alertDays, query, filters) {
  const active = useMemo(() => coupons.filter((c) => isActive(c)).sort(sortByExpiry), [coupons]);
  return useMemo(() => {
    const shown = filterCoupons(active, { query, filters, alertDays });
    const filterCount = activeFilterCount(filters);
    return {
      active,
      summary: summarize(active, alertDays),
      expiring: active.filter((c) => isExpiringSoon(c, alertDays)),
      cats: categoryCounts(active),
      typeCounts: typeCounts(active),
      shown,
      shownBalance: voucherBalance(shown),
      filterCount,
      filtering: filterCount > 0 || !!query.trim(),
    };
  }, [active, alertDays, query, filters]);
}
