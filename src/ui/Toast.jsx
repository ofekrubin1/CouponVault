import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck, CircleAlert } from 'lucide-react';
import { cx } from './cx';

const ToastCtx = createContext(() => {});

/** toast(text, 'ok' | 'error') */
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(0);
  const show = useCallback((text, type = 'ok') => {
    clearTimeout(timer.current);
    setToast({ text, type, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), type === 'error' ? 3800 : 2400);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-6" style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}>
            <div
              key={toast.key}
              role="status"
              className={cx(
                'flex max-w-full animate-toast items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-medium text-white shadow-pop backdrop-blur-xl',
                toast.type === 'error' ? 'bg-danger/85' : 'bg-accent/90',
              )}
            >
              {toast.type === 'error' ? <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} /> : <CircleCheck className="h-4 w-4 shrink-0 text-champagne" strokeWidth={2} />}
              <span className="truncate">{toast.text}</span>
            </div>
          </div>,
          document.body,
        )}
    </ToastCtx.Provider>
  );
}
