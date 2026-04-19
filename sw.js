const CACHE_NAME = 'khmer-calendar-v3';
const ASSETS = [
  './',
  './index.html',
  './css/khmer-calendar.css',
  './js/khmer-calendar.js',
  './js/chinese-calendar.js',
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

// Fetch: cache-first strategy
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
