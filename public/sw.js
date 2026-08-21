// First Pacific Bank - Workbox Service Worker for Offline Banking Access
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log('🛡️ [Service Worker] Workbox loaded successfully.');

  // Force immediate activation and control of all open clients
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  // Set up custom cache names
  const CACHE_PREFIX = 'first-paba';
  const PAGES_CACHE = `${CACHE_PREFIX}-pages`;
  const ASSETS_CACHE = `${CACHE_PREFIX}-assets`;
  const IMAGES_CACHE = `${CACHE_PREFIX}-images`;
  const API_CACHE = `${CACHE_PREFIX}-api`;

  // 1. Pages/HTML: Network First to guarantee latest layout with Cache fallback
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: PAGES_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
        }),
      ],
    })
  );

  // 2. JS, CSS, and Web Workers: Stale-While-Revalidate for ultra-fast startup
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'worker',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: ASSETS_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // 3. Images: Cache First since bank logos and graphic assets rarely change
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: IMAGES_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 4. API Requests and Firebase Handshakes: Network First with offline fallback
  // This caches any dynamic balance or transaction details fetched from endpoints or third parties
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/') || url.hostname.includes('firebaseapp.com') || url.hostname.includes('googleapis.com'),
    new workbox.strategies.NetworkFirst({
      cacheName: API_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // Keep dynamic balance/transactions for 7 days offline
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // Background sync or manual offline balance store backup
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'OFFLINE_STATE_SYNC') {
      console.log('🛡️ [Service Worker] Received background bank state synchronization payload.');
    }
  });

} else {
  console.error('🛡️ [Service Worker] Workbox failed to initialize from CDN.');
}
