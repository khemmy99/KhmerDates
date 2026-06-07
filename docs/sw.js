const CACHE_NAME = 'khmer-calendar-v54';
const ASSETS = [
  './',
  './index.html',
  './css/khmer-calendar.css',
  './js/khmer-calendar.js',
  './js/chinese-calendar.js',
  './js/holidays.js',
  './js/daily-block.js',
  './js/health-tracker.js',
  './js/weather.js',
  './js/i18n.js',
  './js/khmer-calendar-ui.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './manifest.json'
];

// Install: cache all assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
//   - HTML navigation requests (index.html / "./") use NETWORK-FIRST so an APK
//     update is reflected on first launch (otherwise the cached old index.html
//     keeps showing the old version string forever).
//   - Everything else (CSS/JS/icons) uses CACHE-FIRST since those are bumped
//     when CACHE_NAME bumps.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const isHTML = req.mode === 'navigate' ||
                 (req.method === 'GET' && req.headers.get('accept') && req.headers.get('accept').includes('text/html'));

  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          // Update the cached copy in the background
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
