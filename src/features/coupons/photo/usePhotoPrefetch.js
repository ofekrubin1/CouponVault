import { useEffect, useRef } from 'react';
import { prefetchPhoto } from '@/data';
import { isActive } from '@/domain/coupon';

/**
 * While online, downloads the photos of active coupons onto the device in the background (one at a time,
 * once each), so every photo shows at the till even without signal.
 */
export function usePhotoPrefetch(familyId, coupons) {
  const done = useRef(new Set());
  useEffect(() => {
    if (!coupons) return undefined;
    let stop = false;
    const run = async () => {
      if (!navigator.onLine) return;
      for (const c of coupons) {
        if (stop) return;
        if (!c.hasPhoto || !isActive(c) || done.current.has(c.id)) continue;
        if (await prefetchPhoto(familyId, c.id)) done.current.add(c.id);
      }
    };
    const timer = setTimeout(run, 1500); // after the screen has settled
    window.addEventListener('online', run);
    return () => {
      stop = true;
      clearTimeout(timer);
      window.removeEventListener('online', run);
    };
  }, [familyId, coupons]);
}
