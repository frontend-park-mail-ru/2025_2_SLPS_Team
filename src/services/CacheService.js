export async function cachedFetch(url, options = {}, cacheName = "data-cache-v1") {
  let cache = null;

  try {
    cache = await caches.open(cacheName);
  } catch (err) {
    console.warn("[cachedFetch] Не удалось открыть кэш:", err);
  }

  try {
    const response = await fetch(url, options);

    if (response && response.ok && cache) {
      try {
        await cache.put(url, response.clone());
      } catch (e) {
        console.warn("[cachedFetch] Ошибка при записи в кэш:", e);
      }
    }

    return response;
  } catch (err) {
    console.warn(`[cachedFetch] Offline — используем кэш: ${url}`);

    if (cache) {
      try {
        const cached = await cache.match(url);
        if (cached) return cached;
      } catch (e) {
        console.warn("[cachedFetch] Ошибка при попытке чтения из кэша:", e);
      }
    }

    return new Response(JSON.stringify({ error: "Нет сети и нет кэша для " + url }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
}
