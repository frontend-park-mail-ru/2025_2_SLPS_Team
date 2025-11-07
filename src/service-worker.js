/*const CACHE_NAME = "social-app-cache-v1"; //v2

const URLS_TO_CACHE = [
  "/",
  "/profile",
  "/friends",
  "/messanger",
  "/community",
  "/bundle.js",
  "/styles/main.css",
  "/favicon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.url.includes("/api/") || request.url.startsWith("ws://")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          return response;
        })
        .catch(async () => {
          console.warn("[SW] Network failed, serving fallback for:", request.url);

          if (request.mode === "navigate") {
            const offlinePage = await caches.match("/");
            if (offlinePage) return offlinePage;
            return new Response("Вы офлайн. Подключитесь к сети и обновите страницу.", {
              headers: { "Content-Type": "text/html; charset=utf-8" },
            });
          }

          return new Response("", { status: 408, statusText: "Offline" });
        });
    })
  );
});*/
