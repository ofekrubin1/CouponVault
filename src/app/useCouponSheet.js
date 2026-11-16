import { useEffect, useState } from 'react';
import { useBackClose } from '@/hooks/useBackClose';

/**
 * Which coupon sheet is open: null | { kind: 'detail', id } | { kind: 'form', id? }.
 * The phone's back button closes it, and it closes by itself if its coupon disappears (deleted elsewhere).
 */
export function useCouponSheet(coupons) {
  const [sheet, setSheet] = useState(null);
  useBackClose(!!sheet, () => setSheet(null));

  const current = sheet?.id ? coupons?.find((c) => c.id === sheet.id) : null;
  useEffect(() => {
    if (sheet?.id && coupons && !current) setSheet(null);
  }, [sheet, coupons, current]);

  return {
    sheet,
    current,
    openDetail: (c) => setSheet({ kind: 'detail', id: c.id }),
    openNew: () => setSheet({ kind: 'form' }),
    openEdit: (c) => setSheet({ kind: 'form', id: c.id }),
    close: () => setSheet(null),
  };
}
