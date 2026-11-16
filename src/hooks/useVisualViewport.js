import { useEffect, useState } from 'react';

const readViewport = () => {
  const v = window.visualViewport;
  return v ? { height: v.height, offsetTop: v.offsetTop } : { height: window.innerHeight, offsetTop: 0 };
};

/** Height/offset of the part of the screen not covered by the on-screen keyboard. */
export function useVisualViewport() {
  const [vp, setVp] = useState(readViewport);
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return undefined;
    let raf = 0;
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setVp(readViewport()));
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
