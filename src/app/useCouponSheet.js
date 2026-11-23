import { useEffect, useState } from 'react';

/**
 * Which coupon sheet is open: null | { kind: 'detail', id } | { kind: 'form', id? }.
 * It closes by itself if its coupon disappears (deleted elsewhere). The back button is handled by the Sheet.
 */
export function useCouponSheet(coupons) {
  const [sheet, setSheet] = useState(null);

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
