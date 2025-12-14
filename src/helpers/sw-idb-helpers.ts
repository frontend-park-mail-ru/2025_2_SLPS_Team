const DB_NAME = 'offline-requests';
const STORE_NAME = 'queue';

export type OfflineQueuedRequest = {
  url: string;
  method: string;
  headers: [string, string][];
  body: ArrayBuffer;
};

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export function swOpenDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function swStoreRequest(data: OfflineQueuedRequest): Promise<void> {
  const db = await swOpenDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add(data);
  await txDone(tx);
}

export async function swGetAllRequests(): Promise<OfflineQueuedRequest[]> {
  const db = await swOpenDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => resolve((req.result ?? []) as OfflineQueuedRequest[]);
    req.onerror = () => reject(req.error);
  });
}

export async function swClearRequests(): Promise<void> {
  const db = await swOpenDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
  await txDone(tx);
}
