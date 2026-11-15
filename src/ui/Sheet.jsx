import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useScrollLock, useVisualViewport } from '../hooks/overlay';

/**
 * Bottom sheet over the current screen.
 * - Follows the visual viewport, so with the iOS keyboard open the footer stays above the keyboard.
 * - Locks the page behind it (iOS-safe) and keeps scroll inside the sheet (overscroll-contain).
 * - Drag the handle/header down to dismiss. The back button is handled by the caller (useBackClose).
 */
export default function Sheet({ title, onClose, children, footer, actions, label }) {
  useScrollLock();
  const vp = useVisualViewport();
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  // The live distance is kept in a ref: pointerup can arrive before React re-renders the last move.
  const dist = useRef(0);
  const endDrag = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => () => endDrag.current?.(true), []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !document.querySelector('[role="alertdialog"]') && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Drag the handle/header down to dismiss. Moves are tracked on the window (not pointer capture) and the
  // press's default action is cancelled, so a drag never turns into a text selection.
  const onPointerDown = (e) => {
    if (e.button > 0 || e.target.closest('button')) return;
    e.preventDefault();
    const startY = e.clientY;
    dist.current = 0;
    setDragging(true);
    const move = (ev) => {
      dist.current = Math.max(0, ev.clientY - startY);
      setDrag(dist.current);
    };
    const up = (unmounting) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      endDrag.current = null;
      if (unmounting === true) return;
      setDragging(false);
      if (dist.current > 110) closeRef.current();
      else setDrag(0);
      dist.current = 0;
    };
    const onUp = () => up(false);
    endDrag.current = up;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  return createPortal(
    <div className="fixed inset-x-0 z-50 flex items-end justify-center" style={{ top: vp.offsetTop, height: vp.height }}>
      <div className="absolute inset-0 animate-fade bg-navy/30" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label || title}
        className="relative flex w-full max-w-lg animate-sheet flex-col rounded-t-[22px] bg-white shadow-sheet"
        style={{
          maxHeight: 'calc(100% - 16px)',
          transform: drag ? `translateY(${drag}px)` : undefined,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <div className="shrink-0 cursor-grab touch-none select-none" onPointerDown={onPointerDown}>
          <div className="flex justify-center pb-1 pt-2.5">
            <span className="h-1 w-10 rounded-full bg-line" />
          </div>
          <div className="flex items-center gap-2 border-b border-canvas px-5 pb-3 pt-1">
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{title}</h2>
            {actions}
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] bg-navy/5 p-2 text-navy/60 transition-colors hover:bg-navy/10"
              aria-label="סגור"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-canvas bg-white px-5 pt-3" style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
