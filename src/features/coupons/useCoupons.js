import { useEffect, useState } from 'react';
import { watchCoupons } from '@/data';

/**
 * Live coupons of a family; null while loading. Listens only once the server knows the family (`ready`):
 * a listener attached to a family that exists only locally is rejected by the rules.
 */
export function useCoupons(familyId, ready) {
  const [coupons, setCoupons] = useState(null);
  useEffect(() => {
    if (!ready) {
      setCoupons([]);
      return undefined;
    }
    return watchCoupons(familyId, setCoupons, (e) => console.error(e));
  }, [familyId, ready]);
  return coupons;
}
