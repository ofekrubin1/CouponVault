import { useEffect, useRef } from 'react';

const SNAP = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 0.55; // px/ms

/**
 * Pull a bottom sheet down to dismiss it, like iOS: from the handle/header, or from anywhere in the content
 * while it's scrolled to the top (e.g. the coupon card). Pulling up / scrolling down stays a normal scroll.
 * Moves the DOM directly (no React re-render per frame). Touch for phones, mouse on the handle for desktop.
 */
export function useSheetDrag(sheetRef, bodyRef, handleRef, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const sheet = sheetRef.current;
    const body = bodyRef.current;
    const handle = handleRef.current;
    if (!sheet || !body) return undefined;

    const move = (y, animate) => {
      sheet.style.transition = animate ? SNAP : 'none';
      sheet.style.transform = y > 0 ? `translate3d(0,${y}px,0)` : '';
    };
    const finish = (dy, velocity) => {
      if (dy > CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) {
        move(sheet.offsetHeight, true);
        setTimeout(() => closeRef.current(), 220);
      } else move(0, true);
    };

    // ---- touch (phones) ----
    let t = null;
    const onTouchStart = (e) => {
      if (e.touches.length !== 1 || e.target.closest('input, textarea, select, [data-no-drag]')) {
        t = null;
        return;
      }
      const p = e.touches[0];
      const inBody = body.contains(e.target);
      t = { x: p.clientX, y: p.clientY, lastY: p.clientY, lastT: performance.now(), v: 0, dy: 0, eligible: !inBody || body.scrollTop <= 0, mode: null };
    };
    const onTouchMove = (e) => {
      if (!t || !t.eligible) return;
      const p = e.touches[0];
      const dy = p.clientY - t.y;
      if (!t.mode) {
        if (Math.abs(dy) < 6 && Math.abs(p.clientX - t.x) < 6) return;
        // only a downward, mostly vertical pull with the content at its top drags the sheet
        t.mode = dy > 0 && Math.abs(dy) > Math.abs(p.clientX - t.x) && body.scrollTop <= 0 ? 'drag' : 'scroll';
      }
      if (t.mode !== 'drag') return;
      e.preventDefault();
      const now = performance.now();
      t.v = (p.clientY - t.lastY) / Math.max(1, now - t.lastT);
      t.lastY = p.clientY;
      t.lastT = now;
      t.dy = Math.max(0, dy);
      move(t.dy, false);
    };
    const onTouchEnd = () => {
      if (t?.mode === 'drag') finish(t.dy, t.v);
      t = null;
    };

    // ---- mouse on the handle (desktop) ----
    const onMouseDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button > 0 || e.target.closest('button')) return;
      e.preventDefault();
      const y0 = e.clientY;
      let dy = 0;
      const mm = (ev) => {
        dy = Math.max(0, ev.clientY - y0);
        move(dy, false);
      };
      const up = () => {
        window.removeEventListener('pointermove', mm);
        window.removeEventListener('pointerup', up);
        finish(dy, 0);
      };
      window.addEventListener('pointermove', mm);
      window.addEventListener('pointerup', up);
    };

    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove', onTouchMove, { passive: false });
    sheet.addEventListener('touchend', onTouchEnd);
    sheet.addEventListener('touchcancel', onTouchEnd);
    handle?.addEventListener('pointerdown', onMouseDown);
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart);
      sheet.removeEventListener('touchmove', onTouchMove);
      sheet.removeEventListener('touchend', onTouchEnd);
      sheet.removeEventListener('touchcancel', onTouchEnd);
      handle?.removeEventListener('pointerdown', onMouseDown);
    };
  }, [sheetRef, bodyRef, handleRef]);
}
