import { useEffect, useRef, useState } from 'react';

// ---------- scroll lock ----------
// iOS ignores `overflow: hidden` on body, so while a sheet/dialog is open the page is pinned with
// position:fixed and the scroll position is restored afterwards. Ref-counted for stacked overlays.
let locks = 0;
let savedY = 0;

function lock() {
  if (locks++ > 0) return;
  savedY = window.scrollY;
  const s = document.body.style;
  s.position = 'fixed';
  s.top = `-${savedY}px`;
  s.left = '0';
  s.right = '0';
  s.width = '100%';
}

function unlock() {
  if (--locks > 0) return;
  const s = document.body.style;
  s.position = '';
  s.top = '';
  s.left = '';
  s.right = '';
  s.width = '';
  window.scrollTo(0, savedY);
}

export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    lock();
    return unlock;
  }, [active]);
}

// ---------- back button closes the top overlay ----------
// One history entry stands for "something is open", however many overlays are stacked (sheet + dialog).
// Back closes the top overlay; if others remain the entry is re-added. Closing overlays in code removes
// the entry with a single history.back(), even when a dialog and its sheet close in the same moment.
const stack = [];
let hasEntry = false;
let ignoreNextPop = false;
let syncQueued = false;

function sync() {
  syncQueued = false;
  if (stack.length > 0 && !hasEntry) {
    window.history.pushState({ overlay: true }, '');
    hasEntry = true;
  } else if (stack.length === 0 && hasEntry) {
    hasEntry = false;
    ignoreNextPop = true;
    window.history.back();
  }
}

function queueSync() {
  if (syncQueued) return;
  syncQueued = true;
  setTimeout(sync, 0);
}

if (typeof window !== 'undefined') {
  // Our history entries only mean "an overlay is open"; never let the browser jump the page when they
  // are popped (it would restore the scroll position saved while the page was locked, i.e. the top).
  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  window.addEventListener('popstate', () => {
    if (ignoreNextPop) {
      ignoreNextPop = false;
      return;
    }
    if (!hasEntry) return;
    hasEntry = false;
    stack[stack.length - 1]?.close();
    queueSync();
  });
}

/** While `open`, the phone's back button (or swipe-back) calls onClose instead of leaving the page. */
export function useBackClose(open, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const entry = { close: () => closeRef.current() };
    stack.push(entry);
    queueSync();
    return () => {
      const i = stack.indexOf(entry);
      if (i !== -1) stack.splice(i, 1);
      queueSync();
    };
  }, [open]);
}

// ---------- visual viewport (keyboard-aware) ----------
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
