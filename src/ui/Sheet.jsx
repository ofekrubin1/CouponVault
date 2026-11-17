import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useVisualViewport } from '@/hooks/useVisualViewport';
import { useSheetDrag } from '@/hooks/useSheetDrag';

/**
 * Scroll the sheet (only the sheet, never the page) so the field is visible, when it's hidden. A field already
 * in view is left alone: moving it would shift the text under a finger that is selecting / moving the cursor.
 */
function reveal(body, el) {
  const b = body.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const margin = 24;
  if (r.top >= b.top + margin && r.bottom <= b.bottom - margin) return;
  body.scrollBy({ top: r.top + r.height / 2 - (b.top + b.height / 2), behavior: 'smooth' });
}

/** Keep the focused field visible above the keyboard. */
function useFocusedFieldVisible(bodyRef, keyboard) {
  const focused = useRef(null);
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return undefined;
    const onFocus = (e) => {
      if (!e.target.matches('input, textarea, select')) return;
      focused.current = e.target;
      // the keyboard animates in for ~300ms; scroll after it settles
      setTimeout(() => focused.current === e.target && reveal(body, e.target), 320);
    };
    const onBlur = () => {
      focused.current = null;
    };
    body.addEventListener('focusin', onFocus);
    body.addEventListener('focusout', onBlur);
    return () => {
      body.removeEventListener('focusin', onFocus);
      body.removeEventListener('focusout', onBlur);
    };
  }, [bodyRef]);
  useEffect(() => {
    if (keyboard && focused.current && bodyRef.current) reveal(bodyRef.current, focused.current);
  }, [keyboard, bodyRef]);
}

/**
 * Bottom sheet over the current screen.
 * - With the keyboard open it shrinks to the visible area, so the footer stays above the keyboard and the
 *   focused field is scrolled into view. Without a keyboard it's simply pinned to the screen.
 * - Locks the page behind it (iOS-safe); scrolling stays inside the sheet.
 * - Pull down to dismiss: from the handle, or from the content when it's at the top.
 * The back button is handled by the caller (useBackClose).
 */
export function Sheet({ title, onClose, children, footer, actions, label, tall = false }) {
  useScrollLock();
  const vp = useVisualViewport();
  const sheet = useRef(null);
  const body = useRef(null);
  const handle = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useSheetDrag(sheet, body, handle, () => closeRef.current());
  useFocusedFieldVisible(body, vp.keyboard);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !document.querySelector('[role="alertdialog"]') && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const frame = vp.keyboard ? { top: vp.offsetTop, height: vp.height } : { top: 0, bottom: 0 };

  return createPortal(
    <div className="fixed inset-x-0 z-50 flex items-end justify-center" style={frame}>
      <div className="absolute inset-0 animate-fade bg-navy/25 backdrop-blur-[3px]" onClick={onClose} />
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-label={label || title}
        className="glass-strong relative flex w-full max-w-lg animate-sheet flex-col rounded-t-[28px] shadow-sheet"
        style={{
          maxHeight: vp.keyboard ? '100%' : 'calc(100% - 16px)',
          height: tall && !vp.keyboard ? 'calc(100% - max(16px, env(safe-area-inset-top) + 8px))' : undefined,
        }}
      >
        <div ref={handle} className="shrink-0 cursor-grab touch-none select-none">
          <div className="flex justify-center pb-1 pt-2">
            <span className="h-1.5 w-10 rounded-full bg-navy/15" />
          </div>
          <div className="flex items-center gap-2 border-b border-navy/[0.06] px-5 pb-2 pt-0.5">
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{title}</h2>
            {actions}
            <button type="button" onClick={onClose} className="glass-card rounded-full p-2 text-navy/60 transition-colors" aria-label="סגור">
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div ref={body} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-3 pt-4">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-navy/[0.06] px-5 pt-3" style={{ paddingBottom: vp.keyboard ? '10px' : 'max(14px, env(safe-area-inset-bottom))' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
