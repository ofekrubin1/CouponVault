// Turning a picked photo into a small JPEG to store with the coupon.
import { fitSize } from '@/domain/photo';

const MAX_SIDE = 1600; // enough for a barcode to scan from the screen
const TARGET = 300 * 1024; // aim; the server refuses anything over 700KB

const toBlob = (canvas, q) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));

/** A picked image file → { bytes: Uint8Array, type, w, h } as a JPEG of about 150–300KB (upright per its EXIF). */
export async function compressPhoto(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  let { w, h } = fitSize(bitmap.width, bitmap.height, MAX_SIDE);
  let blob;
  for (let attempt = 0; attempt < 5; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // transparent PNGs get a white background, like paper
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    blob = await toBlob(canvas, 0.8);
    if (blob && blob.size <= TARGET) break;
    ({ w, h } = fitSize(w, h, Math.round(Math.max(w, h) * 0.8))); // still big: smaller and try again
  }
  bitmap.close?.();
  return { bytes: new Uint8Array(await blob.arrayBuffer()), type: 'image/jpeg', w, h };
}
