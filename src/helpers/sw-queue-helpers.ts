import type { OfflineQueuedRequest } from './sw-idb-helpers';
import { swStoreRequest, swGetAllRequests, swClearRequests } from './sw-idb-helpers';

type SWGlobal = ServiceWorkerGlobalScope & {
  registration: ServiceWorkerRegistration;
};

function headersFromEntries(entries: [string, string][]): Headers {
  const h = new Headers();
  for (const [k, v] of entries) h.append(k, v);
  return h;
}

export async function swHandleApiMutation(self: SWGlobal, request: Request): Promise<Response> {
  const body = await request.clone().arrayBuffer();

  const record: OfflineQueuedRequest = {
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body,
  };

  await swStoreRequest(record);

  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register('offline-queue-sync');
    } catch {
    }
  }

  return new Response(JSON.stringify({ queued: true, offline: true }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function swFlushQueue(): Promise<void> {
  const queue = await swGetAllRequests();
  if (queue.length === 0) return;

  const stillPending: OfflineQueuedRequest[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: headersFromEntries(item.headers),
        body: item.body,
        credentials: 'include',
      });

      if (!res.ok) stillPending.push(item);
    } catch {
      stillPending.push(item);
    }
  }

  await swClearRequests();
  for (const item of stillPending) await swStoreRequest(item);
}
