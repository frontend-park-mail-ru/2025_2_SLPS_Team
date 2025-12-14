import type { SWConstants } from './sw-constants';

export async function swPrecacheStatic(constants: SWConstants): Promise<void> {
  const cache = await caches.open(constants.STATIC_CACHE);
  await cache.addAll(constants.PRECACHE_URLS);
}

export async function swCleanupOldCaches(constants: SWConstants): Promise<void> {
  const keep = [constants.STATIC_CACHE, constants.PAGES_CACHE, constants.API_CACHE];
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)));
}

export async function swHandleNavigation(
  constants: SWConstants,
  request: Request,
): Promise<Response> {
  try {
    const res = await fetch(request);
    const cache = await caches.open(constants.PAGES_CACHE);
    void cache.put(request, res.clone());
    return res;
  } catch {
    const cache = await caches.open(constants.PAGES_CACHE);
    const cached = await cache.match('/');
    return cached ?? new Response('Offline', { status: 503 });
  }
}

export async function swCacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    void cache.put(request, res.clone());
    return res;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

export async function swNetworkFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);

  try {
    const res = await fetch(request);
    void cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response('Offline', { status: 503 });
  }
}
