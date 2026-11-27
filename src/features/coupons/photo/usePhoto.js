import { useEffect, useState } from 'react';
import { loadPhoto } from '@/data';

/** The coupon's stored photo as { url, w, h } (null when it has none or while loading). Frees the URL afterwards. */
export function useStoredPhoto(familyId, coupon) {
  const [photo, setPhoto] = useState(null);
  const id = coupon?.id;
  const has = !!coupon?.hasPhoto;
  useEffect(() => {
    if (!id || !has) {
      setPhoto(null);
      return undefined;
    }
    let url = null;
    let live = true;
    loadPhoto(familyId, id)
      .then((p) => {
        if (!live || !p) return;
        url = URL.createObjectURL(p.blob);
        setPhoto({ url, w: p.w, h: p.h });
      })
      .catch((e) => console.error('[photo]', e));
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [familyId, id, has]);
  return photo;
}
