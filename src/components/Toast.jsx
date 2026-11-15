import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const show = useCallback((text) => {
    setMsg(text);
    clearTimeout(window.__toastT);
    window.__toastT = setTimeout(() => setMsg(null), 2200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div className="animate-fade fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="rounded-full bg-slate-900/90 px-4 py-2 text-sm text-white shadow-lg">{msg}</div>
        </div>
      )}
    </ToastCtx.Provider>
  );
}
