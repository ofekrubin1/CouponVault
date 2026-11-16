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
 */
export function useVisualViewport() {
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return undefined;
    let raf = 0;
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = read();
        // without a keyboard nothing to follow: skip re-renders caused by bounce scrolling
        setVp((prev) => (!next.keyboard && !prev.keyboard ? prev : next));
      });
    };
    v.addEventListener('resize', onChange);
    v.addEventListener('scroll', onChange);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener('resize', onChange);
      v.removeEventListener('scroll', onChange);
    };
  }, []);
  return vp;
}
