import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBackClose } from '@/hooks/useBackClose';
import { useScrollLock } from '@/hooks/useScrollLock';
import { cx } from './cx';

const ConfirmCtx = createContext(async () => false);

/** const ok = await confirm({ title, message, confirmText, danger }) */
export const useConfirm = () => useContext(ConfirmCtx);

function ConfirmDialog({ title, message, confirmText = 'אישור', cancelText = 'ביטול', danger, onDone }) {
  useScrollLock();
  useBackClose(true, () => onDone(false));
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
      <div className="absolute inset-0 animate-fade bg-navy/30 backdrop-blur-[4px]" onClick={() => onDone(false)} />
      <div role="alertdialog" aria-modal="true" aria-label={title} className="glass-strong relative w-full max-w-sm animate-pop rounded-[24px] p-6 shadow-pop">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {message && <p className="mt-2 text-sm font-light leading-relaxed text-mute/80">{message}</p>}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => onDone(true)}
            className={cx('flex-1 rounded-[14px] py-3 text-sm font-medium text-white', danger ? 'bg-danger shadow-danger' : 'glass-navy')}
          >
            {confirmText}
          </button>
          <button type="button" onClick={() => onDone(false)} className="flex-1 rounded-[14px] border border-white/70 bg-white/60 py-3 text-sm font-medium text-mute">
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
