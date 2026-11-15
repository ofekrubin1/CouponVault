import { useEffect } from 'react';
import { X } from 'lucide-react';

/** Slide-up panel over the current screen. Back-button handling lives in App. */
export default function BottomSheet({ title, onClose, children, footer }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="animate-fade absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="animate-sheet relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100" aria-label="סגור">
            <X size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && (
          <div
            className="border-t border-slate-100 px-5 pt-3"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
