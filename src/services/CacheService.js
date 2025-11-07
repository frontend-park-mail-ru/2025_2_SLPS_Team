export async function cachedFetch(url, options = {}, cacheName = "data-cache-v1") {
  let cache = null;

  try {
    cache = await caches.open(cacheName);
  } catch (err) {
    console.warn("[cachedFetch] Не удалось открыть кэш:", err);
  }
  

  try {
    const response = await fetch(url, options);
    if (response && response.ok) {
      cache.put(url, response.clone());
    }
    return response;
  } catch (err) {
    console.warn(`[cachedFetch] Offline — используем кэш: ${url}`);
    const cached = await cache.match(url);
    if (cached) return cached;
    throw new Error("Нет сети и нет кэша для " + url);
  }
}
