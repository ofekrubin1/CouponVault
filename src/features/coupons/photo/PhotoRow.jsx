import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useStoredPhoto } from './usePhoto';
import { PhotoViewer } from './PhotoViewer';

/** On the coupon screen, under the code: a slim row with the voucher photo; a tap shows it full screen. */
export function PhotoRow({ familyId, coupon }) {
  const photo = useStoredPhoto(familyId, coupon);
  const [open, setOpen] = useState(false);
  if (!coupon.hasPhoto) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => photo && setOpen(true)}
        disabled={!photo}
        className="glass-card flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-right"
        data-testid="photo-row"
      >
        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-navy/5">{photo && <img src={photo.url} alt="" className="h-full w-full object-cover" />}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">תמונת השובר</span>
          <span className="block text-[11px] font-light text-mute/55">{photo ? 'הקשה להגדלה, להצגה בקופה' : 'טוען…'}</span>
        </span>
        <ChevronLeft className="h-4 w-4 text-mute/40" strokeWidth={1.75} />
      </button>
      {open && photo && <PhotoViewer photo={photo} onClose={() => setOpen(false)} />}
    </>
  );
}
