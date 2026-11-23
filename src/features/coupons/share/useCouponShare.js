import { useEffect, useState } from 'react';
import { useToast } from '@/ui';
import { couponShareText, shareFileName } from '@/domain/share';
import { shareFile } from '@/services/files';
import { renderCouponImage } from './couponImage';

/** What the image shows; it's drawn again only when one of these changes. */
const imageKey = (c) => JSON.stringify([c.title, c.store, c.type, c.value, c.balance, c.code, c.cvv, c.expiry, c.format]);

/**
 * Shares a coupon as an image + its details as text. The image is drawn as soon as the coupon opens, because
 * phones only open the share sheet straight after a tap (no time to draw then). `ready` is false until it is.
 * `enabled: false` puts off drawing (e.g. a list row draws only once it's swiped open).
 */
export function useCouponShare(coupon, enabled = true) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const key = imageKey(coupon);

  useEffect(() => {
    let live = true;
    setFile(null);
    if (!enabled) return undefined;
    renderCouponImage(coupon)
      .then((blob) => live && setFile(new File([blob], shareFileName(coupon), { type: 'image/png' })))
      .catch((e) => console.error('[coupon image]', e));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  async function share() {
    if (!file) return;
    try {
      const r = await shareFile(file, { title: coupon.title, text: couponShareText(coupon) });
      if (r === 'saved') toast('תמונת הקופון נשמרה');
    } catch (e) {
      console.error('[share coupon]', e);
      toast('השיתוף נכשל. נסו שוב', 'error');
    }
  }

  return { ready: !!file, share };
}
