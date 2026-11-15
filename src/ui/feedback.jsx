import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck, CircleAlert } from 'lucide-react';
import { useBackClose, useScrollLock } from '../hooks/overlay';
import { setErrorReporter } from '../data';
import { cx } from './primitives';

// ---------- toast ----------
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(0);
  const show = useCallback((text, type = 'ok') => {
    clearTimeout(timer.current);
    setToast({ text, type, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), type === 'error' ? 3800 : 2400);
  }, []);

  // Writes run in the background; if the server rejects one, say so.
  useEffect(() => setErrorReporter((msg) => show(msg, 'error')), [show]);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-6"
            style={{ bottom: 'calc(5.75rem + env(safe-area-inset-bottom))' }}
          >
            <div
              key={toast.key}
              role="status"
              className={cx(
                'flex max-w-full animate-toast items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-pop',
                toast.type === 'error' ? 'bg-danger' : 'bg-navy',
              )}
            >
              {toast.type === 'error' ? (
                <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
              ) : (
                <CircleCheck className="h-4 w-4 shrink-0 text-gold" strokeWidth={2} />
              )}
              <span className="truncate">{toast.text}</span>
            </div>
          </div>,
          document.body,
        )}
    </ToastCtx.Provider>
  );
}

// ---------- confirm dialog ----------
const ConfirmCtx = createContext(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

function ConfirmDialog({ title, message, confirmText = 'אישור', cancelText = 'ביטול', danger, onDone }) {
  useScrollLock();
  useBackClose(true, () => onDone(false));
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
      <div className="absolute inset-0 animate-fade bg-navy/40 backdrop-blur-[2px]" onClick={() => onDone(false)} />
      <div role="alertdialog" aria-modal="true" aria-label={title} className="relative w-full max-w-sm animate-pop rounded-[18px] bg-white p-6 shadow-pop">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {message && <p className="mt-2 text-sm font-light leading-relaxed text-mute/80">{message}</p>}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => onDone(true)}
            className={cx(
              'flex-1 rounded-[11px] py-3 text-sm font-medium text-white',
              danger ? 'bg-danger shadow-danger' : 'border border-gold/30 bg-navy shadow-btn',
            )}
          >
            {confirmText}
          </button>
          <button type="button" onClick={() => onDone(false)} className="flex-1 rounded-[11px] bg-canvas py-3 text-sm font-medium text-mute">
            {cancelText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setState({ ...opts, resolve })), []);
  const done = (value) => {
    state?.resolve(value);
    setState(null);
  };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && <ConfirmDialog {...state} onDone={done} />}
    </ConfirmCtx.Provider>
  );
}
