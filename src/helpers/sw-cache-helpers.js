self.swPrecacheStatic = async () => {
  const { STATIC_CACHE, PRECACHE_URLS } = self.SW_CONSTANTS;
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(PRECACHE_URLS);
};

self.swCleanupOldCaches = async () => {
  const { STATIC_CACHE, PAGES_CACHE, API_CACHE } = self.SW_CONSTANTS;
  const keep = [STATIC_CACHE, PAGES_CACHE, API_CACHE];

  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => !keep.includes(key))
      .map((key) => caches.delete(key))
  );
};

self.swHandleNavigation = async (request) => {
  const { PAGES_CACHE } = self.SW_CONSTANTS;
  try {
    const res = await fetch(request);
    const cache = await caches.open(PAGES_CACHE);
    cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cache = await caches.open(PAGES_CACHE);
    const cached = await cache.match('/');
    return cached || new Response('Offline', { status: 503 });
  }
};

self.swCacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    cache.put(request, res.clone());
    return res;
  } catch (err) {
    return new Response('Offline', { status: 503 });
  }
};

self.swNetworkFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
};
