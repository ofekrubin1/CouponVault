// Keeps CouponVault usable without signal: the app's own files are saved on the device, so it opens offline.
// (The coupons themselves are kept by Firestore's offline cache; this only covers the page, code and images.)
//
// - The page (navigations): network first, so an online phone always gets the latest version; the saved copy
//   only when there's no connection (or it hangs for 4s).
// - Built files (/assets/*, their names change with every version) and images (/brands/*, icons): saved copy
//   first, else fetched and saved. Files of older versions are removed when a newer page arrives.
// - Everything else (Firebase, Google, version.json) passes straight through.
const CACHE = 'cv-app-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/icon.svg'];
const NAV_TIMEOUT_MS = 4000;

/** The /assets/* files a page refers to. */
const assetsOf = (html) => [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);

/** Save the page and the files it needs; drop saved files of older versions. */
async function saveVersion(html) {
  const cache = await caches.open(CACHE);
  const wanted = assetsOf(html);
  await Promise.all(wanted.map((url) => cache.match(url).then((hit) => hit || cache.add(url).catch(() => null))));
  for (const req of await cache.keys()) {
    const path = new URL(req.url).pathname;
    if (path.startsWith('/assets/') && !wanted.includes(path)) await cache.delete(req);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(SHELL);
      const page = await cache.match('/');
      if (page) await saveVersion(await page.clone().text());
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim(); // control the page that installed us, so it works offline right away
    })(),
  );
});

const withTimeout = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

async function page(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await withTimeout(fetch(request), NAV_TIMEOUT_MS);
    if (res.ok) {
      const copy = res.clone();
      copy.text().then(async (html) => {
        await cache.put('/', new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
        await saveVersion(html);
      });
    }
    return res;
  } catch {
    return (await cache.match('/')) || Response.error();
  }
}

async function savedFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Firebase, Google: untouched
  if (request.mode === 'navigate') {
    event.respondWith(page(request));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/brands/') || SHELL.includes(url.pathname)) {
    event.respondWith(savedFirst(request));
  }
});
