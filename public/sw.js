const CACHE_NAME = 'habit-tracker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/icon-192x192.png'
];

// Install Event: Cache the App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Fetch Event: Serve from cache if offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});