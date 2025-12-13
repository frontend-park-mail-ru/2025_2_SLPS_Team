import { initSwConstants } from './helpers/sw-constants';
import { swPrecacheStatic, swCleanupOldCaches, swHandleNavigation, swCacheFirst, swNetworkFirst } from './helpers/sw-cache-helpers';
import { swHandleApiMutation, swFlushQueue } from './helpers/sw-queue-helpers';

type SWAuthSnapshot = unknown;

type SWGlobal = ServiceWorkerGlobalScope & {
  SW_CONSTANTS?: ReturnType<typeof initSwConstants>;
  __lastAuth?: SWAuthSnapshot | null;
};

const selfSW = self as unknown as SWGlobal;
const constants = initSwConstants(selfSW);

selfSW.__lastAuth = null;

selfSW.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(swPrecacheStatic(constants));
  void selfSW.skipWaiting();
});

selfSW.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(swCleanupOldCaches(constants));
  void selfSW.clients.claim();
});

selfSW.addEventListener('fetch', (event: FetchEvent) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(swHandleNavigation(constants, req));
    return;
  }

  if (url.pathname === '/api/auth/isloggedin') {
    event.respondWith((async () => {
      const cache = await caches.open(constants.API_CACHE);

      try {
        const netRes = await fetch(req.clone(), { credentials: 'include' });
        void cache.put(req, netRes.clone());

        try {
          const json = (await netRes.clone().json()) as SWAuthSnapshot;
          selfSW.__lastAuth = json;
        } catch {
        }

        return netRes;
      } catch {
        if (selfSW.__lastAuth) {
          return new Response(JSON.stringify(selfSW.__lastAuth), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const cached = await cache.match(req);
        if (cached) {
          try {
            const json = (await cached.clone().json()) as SWAuthSnapshot;
            selfSW.__lastAuth = json;
          } catch {
          }
          return cached;
        }

        return new Response(JSON.stringify({
          code: 401,
          isLoggedIn: false,
          message: 'offline and no cached auth',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/api/') && req.method !== 'GET') {
    event.respondWith(swHandleApiMutation(selfSW, req));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(swNetworkFirst(req, constants.API_CACHE));
    return;
  }

  event.respondWith(swCacheFirst(req, constants.STATIC_CACHE));
});

selfSW.addEventListener('sync', (event: Event) => {
  const e = event as Event & {
    tag?: string;
    waitUntil?: (promise: Promise<unknown>) => void;
  };

  if (e.tag === 'offline-queue-sync' && e.waitUntil) {
    e.waitUntil(swFlushQueue());
  }
});