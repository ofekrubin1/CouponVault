// Swipe a row sideways to reveal an action behind it (either direction; one open row at a time).
// The drag moves the DOM directly once per animation frame, without a React re-render per move, so it tracks
// the finger smoothly; past the open point it resists, and a quick flick opens/closes even when short.
import { useCallback, useEffect, useRef, useState } from 'react';

const SNAP = 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1)';
const OPEN_EVENT = 'cv-swipe-open';

/**
 * @param id       row id (opening one row closes the others)
 * @param width    how far the row slides open (px)
 * @param enabled
 * Returns refs for the moving element and the revealed actions, pointer/click handlers, and `open`/`close`.
 */
export function useSwipeToReveal(id, width, enabled = true) {
  const [open, setOpen] = useState(false);
  const off = useRef(0);
  const swiped = useRef(false);
  const stop = useRef(null);
  const slider = useRef(null);
  const actions = useRef(null);

  const rubber = useCallback((x) => {
    const a = Math.abs(x);
    return a <= width ? x : Math.sign(x) * (width + (a - width) * 0.35);
  }, [width]);

  const paint = useCallback(
    (x, animate) => {
      const el = slider.current;
      if (!el) return;
      el.style.transition = animate ? SNAP : 'none';
      el.style.transform = x ? `translate3d(${x}px,0,0)` : '';
      const a = actions.current;
      if (a) {
        const k = Math.min(1, Math.abs(x) / width);
        a.style.opacity = String(k);
        a.style.justifyContent = x > 0 ? 'flex-end' : 'flex-start'; // RTL: flex-start = right
        a.style.transition = animate ? 'opacity 0.25s ease' : 'none';
        if (a.firstElementChild) a.firstElementChild.style.transform = `scale(${0.6 + 0.4 * k})`;
      }
    },
    [width],
  );

  const settle = useCallback(
    (x) => {
      off.current = x;
      paint(x, true);
      setOpen(x !== 0);
      if (x) window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
    },
    [paint, id],
  );
  const close = useCallback(() => settle(0), [settle]);

  useEffect(() => {
    const onOtherOpened = (e) => e.detail !== id && off.current && close();
    window.addEventListener(OPEN_EVENT, onOtherOpened);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOtherOpened);
      stop.current?.();
    };
  }, [id, close]);

  // Horizontal drags swipe; vertical ones are left to the page (the row has touch-action: pan-y).
  const onPointerDown = (e) => {
    if (!enabled || e.button > 0) return;
    const sx = e.clientX;
    const sy = e.clientY;
    const base = off.current;
    let mode = null;
    let raf = 0;
    let last = base;
    let lastX = sx;
    let lastT = performance.now();
    let velocity = 0;
    swiped.current = false;

    const move = (ev) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!mode) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        mode = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'h' : 'v';
        if (mode === 'h') swiped.current = true;
      }
      if (mode !== 'h') return;
      const now = performance.now();
      velocity = (ev.clientX - lastX) / Math.max(1, now - lastT);
      lastX = ev.clientX;
      lastT = now;
      last = rubber(base + dx);
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          paint(last, false);
        });
      }
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      cancelAnimationFrame(raf);
      stop.current = null;
      if (mode !== 'h') return;
      let target;
      if (Math.abs(velocity) > 0.45) target = Math.sign(velocity) === Math.sign(last) || !base ? Math.sign(velocity) * width : 0;
      // a slow drag opens past ~a thumb's width, however wide the revealed actions are (so it feels the same)
      else target = Math.abs(last) > Math.min(width * 0.5, 32) ? Math.sign(last) * width : 0;
      if (base && target && Math.sign(target) !== Math.sign(base)) target = 0;
      settle(target);
    };
    stop.current = end;
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  /** Wrap the row's click: ignore the click that ends a swipe; a tap on an open row closes it. */
  const guardClick = (onClick) => () => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if (off.current) close();
    else onClick?.();
  };

  return { open, close, slider, actions, onPointerDown, guardClick };
}
