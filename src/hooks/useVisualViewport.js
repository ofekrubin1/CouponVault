import { useEffect, useState } from 'react';

// The keyboard counts as open when it takes more than this many px of the screen.
const KEYBOARD_MIN = 120;

const read = () => {
  const v = window.visualViewport;
  if (!v) return { keyboard: false, height: window.innerHeight, offsetTop: 0 };
  return { keyboard: window.innerHeight - v.height > KEYBOARD_MIN, height: v.height, offsetTop: Math.max(0, v.offsetTop) };
};

/**
 * The part of the screen not covered by the on-screen keyboard: { keyboard, height, offsetTop }.
 * Only meaningful while `keyboard` is true — iOS also moves the visual viewport during the page's elastic
 * bounce, and following that would make sheets jump the wrong way while scrolling.
 * While a finger is down on a text field (selecting text / dragging the cursor) iOS nudges the viewport;
 * moving the sheet then would pull the field from under the finger and cancel the gesture, so updates wait
 * until the finger lifts (opening / closing the keyboard still applies at once).
 */
export function useVisualViewport() {
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return undefined;
    let raf = 0;
    let fieldTouch = false;
    let pending = false;
    const apply = () => {
      const next = read();
      // without a keyboard nothing to follow: skip re-renders caused by bounce scrolling
      setVp((prev) => (!next.keyboard && !prev.keyboard ? prev : fieldTouch && next.keyboard === prev.keyboard ? ((pending = true), prev) : next));
    };
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    const onTouchStart = (e) => {
      fieldTouch = !!e.target.closest?.('input, textarea');
    };
    const onTouchEnd = () => {
      if (!fieldTouch) return;
      fieldTouch = false;
      if (pending) {
        pending = false;
        onChange();
      }
    };
    v.addEventListener('resize', onChange);
    v.addEventListener('scroll', onChange);
    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    document.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener('resize', onChange);
      v.removeEventListener('scroll', onChange);
      document.removeEventListener('touchstart', onTouchStart, { capture: true });
      document.removeEventListener('touchend', onTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
  }, []);
  return vp;
}
