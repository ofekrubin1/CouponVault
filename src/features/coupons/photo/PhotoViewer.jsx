import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sun, X } from 'lucide-react';
import { shouldRotate } from '@/domain/photo';
import { useBackClose } from '@/hooks/useBackClose';
import { useScrollLock } from '@/hooks/useScrollLock';

const screenSize = () => ({ w: window.innerWidth, h: window.innerHeight });

/**
 * The photo full screen on white, as large as it gets, for the scanner at the till. A landscape photo on a
 * portrait screen turns sideways to use the whole height. ✕ or the back button closes it.
 */
export function PhotoViewer({ photo, onClose }) {
  useScrollLock();
  useBackClose(true, onClose);
  const [screen, setScreen] = useState(screenSize);
  useEffect(() => {
    const onResize = () => setScreen(screenSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const rotate = shouldRotate(photo, screen);
  const room = { w: screen.w - 24, h: screen.h - 110 }; // around it: the bar at the top and a margin
  const style = rotate
    ? { maxWidth: room.h, maxHeight: room.w, transform: 'rotate(90deg)' }
    : { maxWidth: room.w, maxHeight: room.h };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex animate-fade flex-col bg-white" role="dialog" aria-label="תמונת השובר" data-testid="photo-viewer">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}>
        <span className="flex items-center gap-1.5 text-[12px] font-light text-mute/60">
          <Sun className="h-4 w-4" strokeWidth={1.6} /> כדאי להגביר את בהירות המסך
        </span>
        <button type="button" onClick={onClose} className="rounded-full bg-navy/5 p-2 text-navy/70" aria-label="סגירה">
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <img src={photo.url} alt="תמונת השובר" className="rounded-[6px] object-contain" style={style} data-rotated={rotate || undefined} />
      </div>
    </div>,
    document.body,
  );
}
