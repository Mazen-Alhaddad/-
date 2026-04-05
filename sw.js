/* ══════════════════════════════════════════
   Squares Board — Service Worker v1
══════════════════════════════════════════ */
const CACHE = 'periodic-table-v2';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap'
];

/* ── Install: pre-cache core assets ── */
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: clean old caches ── */
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first, fallback to network ── */
self.addEventListener('fetch', evt => {
  // Skip non-GET and chrome-extension requests
  if (evt.request.method !== 'GET') return;
  if (evt.request.url.startsWith('chrome-extension://')) return;

  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;

      return fetch(evt.request)
        .then(response => {
          // Cache successful responses (not opaque for cross-origin)
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => {
              // Only cache same-origin and CORS-enabled responses
              if (response.type === 'basic' || response.type === 'cors') {
                cache.put(evt.request, clone);
              }
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: serve index.html for navigation
          if (evt.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
