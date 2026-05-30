const CACHE_NAME = 'luquita-v7';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-512.png',
  '/logo-192.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/losroques4.jpg',
  '/roquesnoche.jpg'
];

// Dominios externos que NUNCA se cachean (APIs en tiempo real)
const NEVER_CACHE = [
  've.dolarapi.com',
  'api.allorigins.win',
  'api.counterapi.dev',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // ❌ Nunca cachear APIs externas ni recursos de terceros
  if (NEVER_CACHE.some(domain => url.hostname.includes(domain))) {
    e.respondWith(fetch(e.request));
    return;
  }

  // ❌ Nunca cachear peticiones que no sean GET
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  // ✅ Para assets propios: network-first con fallback a caché
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
