import { useEffect, useRef, useState } from 'react';
import { Camera, LoaderCircle, X } from 'lucide-react';
import { useToast } from '@/ui';
import { compressPhoto } from '@/services/images';
import { useStoredPhoto } from './usePhoto';

/**
 * The form's photo: { preview, change, pick, remove, busy }. `change` is what saving should do with it:
 * { set: photo } for a new one, { remove: true } to drop the stored one, undefined for no change.
 */
export function usePhotoField(familyId, coupon) {
  const toast = useToast();
  const stored = useStoredPhoto(familyId, coupon);
  const [picked, setPicked] = useState(null); // { photo, url }
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => () => picked && URL.revokeObjectURL(picked.url), [picked]);

  async function pick(file) {
    if (!file) return;
    setBusy(true);
    try {
      const photo = await compressPhoto(file);
      setPicked({ photo, url: URL.createObjectURL(new Blob([photo.bytes], { type: photo.type })) });
      setRemoved(false);
    } catch (e) {
      console.error('[photo]', e);
      toast('לא הצלחנו לקרוא את התמונה. נסו תמונה אחרת', 'error');
    } finally {
      setBusy(false);
    }
  }
  const remove = () => {
    setPicked(null);
    setRemoved(true);
  };

  const preview = picked?.url || (!removed && stored?.url) || null;
  const change = picked ? { set: picked.photo } : removed && coupon?.hasPhoto ? { remove: true } : undefined;
  return { preview, change, pick, remove, busy };
}

/** Beside the code field: a small camera button; once a photo is attached, its thumbnail with ✕ to remove. */
export function PhotoButton({ field }) {
  const input = useRef(null);
  const box = 'mt-[22px] h-[46px] w-[46px] shrink-0 rounded-[12px] border border-white/80 shadow-btn2';
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="photo-input"
        onChange={(e) => {
          field.pick(e.target.files?.[0]);
          e.target.value = ''; // the same photo can be picked again
        }}
      />
      {field.preview ? (
        <div className={`relative ${box}`}>
          <button type="button" onClick={() => input.current?.click()} className="h-full w-full overflow-hidden rounded-[12px]" aria-label="החלפת תמונת השובר">
            <img src={field.preview} alt="תמונת השובר" className="h-full w-full object-cover" data-testid="photo-thumb" />
          </button>
          <button type="button" onClick={field.remove} className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-mute shadow" aria-label="הסרת התמונה">
            <X className="h-3 w-3" strokeWidth={2.4} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={field.busy}
          className={`flex items-center justify-center bg-white/70 text-navy/50 ${box}`}
          aria-label="צירוף תמונה של השובר"
        >
          {field.busy ? <LoaderCircle className="h-[18px] w-[18px] animate-spin" strokeWidth={1.6} /> : <Camera className="h-[18px] w-[18px]" strokeWidth={1.6} />}
        </button>
      )}
    </>
  );
}
