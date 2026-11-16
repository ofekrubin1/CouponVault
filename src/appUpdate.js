// Keeps the installed app current (same approach as TommyCare): when the app comes back to the screen, or every
// 10 minutes while open, it checks /version.json; if a newer version was deployed, it reloads. The iPhone
// home-screen app otherwise keeps showing the old version until it's removed and added again.
/* global __APP_BUILD__ */
const CHECK_EVERY_MS = 10 * 60_000;

export const APP_BUILD = typeof __APP_BUILD__ === 'string' ? __APP_BUILD__ : 'dev';

async function check() {
  if (import.meta.env.DEV) return;
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const { build } = await res.json();
    if (build && build !== APP_BUILD) window.location.reload();
  } catch {
    /* offline: try again later */
  }
}

export function keepAppUpdated() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  window.addEventListener('pageshow', (e) => e.persisted && check());
  setInterval(check, CHECK_EVERY_MS);
  check();
}

/** Short human label for the settings footer, e.g. "16.11 19:55". */
export function buildLabel() {
  if (APP_BUILD === 'dev') return 'dev';
  const d = new Date(APP_BUILD);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
