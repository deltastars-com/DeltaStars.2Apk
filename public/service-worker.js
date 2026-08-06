// ================================================================
// service-worker.js - PWA Offline-First Engine & Intelligent Caching
// شركة نجوم دلتا للتجارة (Delta Stars Trading Co.)
// ================================================================

const CACHE_VERSION = 'v13-delta-stars-pristine-assets';
const CACHE_STATIC_NAME = `delta-stars-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC_NAME = `delta-stars-dynamic-${CACHE_VERSION}`;
const CACHE_IMAGES_NAME = `delta-stars-images-${CACHE_VERSION}`;
const CACHE_API_NAME = `delta-stars-api-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/site.webmanifest',
  '/official_logo.png',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/splash_official_banner.jpg',
  '/favicon.svg',
  '/offline.html',
  '/version.json'
];

// Install: Pre-cache app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      console.log('📦 [Service Worker] Pre-caching critical application shell...');
      return Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

// Activate: Delete obsolete caches automatically
self.addEventListener('activate', (event) => {
  const currentCaches = [
    CACHE_STATIC_NAME,
    CACHE_DYNAMIC_NAME,
    CACHE_IMAGES_NAME,
    CACHE_API_NAME
  ];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log('🗑️ [Service Worker] Removing obsolete cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Message handling for instant SW updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Main Fetch Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navigation Requests (App Shell HTML): Network-First, fallback to Cache / offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_STATIC_NAME).then((cache) => cache.put('/', responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/').then((cachedResponse) => {
            return cachedResponse || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // 2. API Endpoints / Product Data: Network-First with Cache Fallback for offline catalog browsing
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_API_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({ offline: true, message: 'محتوى مخزن مؤقتاً أثناء انقطاع الاتصال' }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // 3. Images (Unsplash, local PNG/JPG/SVG/WEBP): Cache-First / Stale-While-Revalidate
  const isImage = 
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i) ||
    url.hostname.includes('unsplash.com');

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_IMAGES_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Static Assets & Fonts (JS, CSS, WebFonts): Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.includes('/assets/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('unpkg.com');

  if (isStaticAsset || url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_DYNAMIC_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
