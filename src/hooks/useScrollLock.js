import { useEffect } from 'react';

// iOS ignores `overflow: hidden` on body, so while a sheet/dialog is open the page is pinned with
// position:fixed and the scroll position is restored afterwards. Ref-counted for stacked overlays.
let locks = 0;
let savedY = 0;

function lock() {
  if (locks++ > 0) return;
  savedY = window.scrollY;
  Object.assign(document.body.style, { position: 'fixed', top: `-${savedY}px`, left: '0', right: '0', width: '100%' });
}

function unlock() {
  if (--locks > 0) return;
  Object.assign(document.body.style, { position: '', top: '', left: '', right: '', width: '' });
  window.scrollTo(0, savedY);
}

export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    lock();
    return unlock;
  }, [active]);
}
