const DB_NAME = 'offline-requests';
const STORE_NAME = 'queue';

self.swOpenDB = function swOpenDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
};

self.swStoreRequest = async function swStoreRequest(data) {
  const db = await self.swOpenDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add(data);
  return tx.complete;
};

self.swGetAllRequests = async function swGetAllRequests() {
  const db = await self.swOpenDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
};

self.swClearRequests = async function swClearRequests() {
  const db = await self.swOpenDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
  return tx.complete;
};
