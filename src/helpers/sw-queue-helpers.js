self.__offlineQueue = self.__offlineQueue || [];

self.swHandleApiMutation = async (request) => {
  const body = await request.clone().arrayBuffer();

  self.__offlineQueue.push({
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body,
  });

  if ('sync' in self.registration) {
    await self.registration.sync.register('offline-queue-sync');
  }

  return new Response(
    JSON.stringify({ queued: true, offline: true }),
    { status: 202, headers: { 'Content-Type': 'application/json' } }
  );
};

self.swFlushQueue = async () => {
  const queue = self.__offlineQueue;
  const stillPending = [];

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
        credentials: 'include',
      });
      if (!res.ok) {
        stillPending.push(item);
      }
    } catch (err) {
      stillPending.push(item);
    }
  }

  self.__offlineQueue = stillPending;
};
