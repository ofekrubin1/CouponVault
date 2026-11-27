// Coupon photos: sizing rules. Pure functions (the drawing happens in services/images.js).

/** The photo's size with its long side at most `max`, same shape; smaller photos stay as they are. */
export function fitSize(w, h, max) {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

/** A landscape photo on a portrait screen is shown turned sideways, so a barcode comes out as big as it can. */
export const shouldRotate = (photo, screen) => photo.w > photo.h && screen.h > screen.w;
