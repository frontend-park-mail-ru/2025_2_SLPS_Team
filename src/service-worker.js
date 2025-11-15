/* importScripts('/helpers/sw-constants.js');
importScripts('/helpers/sw-cache-helpers.js');
importScripts('/helpers/sw-idb-helpers.js');
importScripts('/helpers/sw-queue-helpers.js');

const { STATIC_CACHE, API_CACHE } = self.SW_CONSTANTS;

self.__lastAuth = null;

self.addEventListener('install', (event) => {
  event.waitUntil(self.swPrecacheStatic());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.swCleanupOldCaches());
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(self.swHandleNavigation(req));
    return;
  }

  if (url.pathname === '/api/auth/isloggedin') {
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE);

      try {
        const netRes = await fetch(req.clone(), { credentials: 'include' });
        cache.put(req, netRes.clone());

        try {
          const json = await netRes.clone().json();
          self.__lastAuth = json;
        } catch (e) {
        }

        return netRes;
      } catch (err) {

        if (self.__lastAuth) {
          return new Response(JSON.stringify(self.__lastAuth), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const cached = await cache.match(req);
        if (cached) {
          try {
            const json = await cached.clone().json();
            self.__lastAuth = json;
          } catch (e) {}
          return cached;
        }

        return new Response(JSON.stringify({
          code: 401,
          isLoggedIn: false,
          message: 'offline and no cached auth'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/api/') && req.method !== 'GET') {
    event.respondWith(self.swHandleApiMutation(req));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(self.swNetworkFirst(req, API_CACHE));
    return;
  }

  event.respondWith(self.swCacheFirst(req, STATIC_CACHE));
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-queue-sync') {
    event.waitUntil(self.swFlushQueue());
  }
});
*/