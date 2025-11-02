/**
 * Offline Storage for Clock Entries
 * Uses IndexedDB to store clock-in/out entries when internet is unavailable
 * Automatically syncs when connection is restored
 */

const DB_NAME = 'digiget-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_clock_entries';

interface PendingClockEntry {
  id: string;
  employee_id: string;
  shop_id: string;
  action: 'clock_in' | 'clock_out';
  timestamp: string;
  method: 'nfc' | 'qr_code' | 'shop_tablet' | 'gps';
  latitude?: number | null;
  longitude?: number | null;
  device_fingerprint?: string | null;
  verification_method?: string;
  nfc_tag_id?: string | null;
  clock_entry_id?: string; // For clock-out, link to clock-in entry
  synced: boolean;
  retry_count: number;
  last_retry?: string;
  created_at: string;
}

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initOfflineStorage(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });

        // Create indexes for faster queries
        objectStore.createIndex('employee_id', 'employee_id', { unique: false });
        objectStore.createIndex('shop_id', 'shop_id', { unique: false });
        objectStore.createIndex('synced', 'synced', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Check if we have a database connection
 */
function ensureDB(): IDBDatabase {
  if (!db) {
    throw new Error('IndexedDB not initialized. Call initOfflineStorage() first.');
  }
  return db;
}

/**
 * Store a clock entry offline
 */
export async function storeOfflineClockEntry(
  employeeId: string,
  shopId: string,
  action: 'clock_in' | 'clock_out',
  method: 'nfc' | 'qr_code' | 'shop_tablet' | 'gps',
  options?: {
    latitude?: number | null;
    longitude?: number | null;
    device_fingerprint?: string | null;
    verification_method?: string;
    nfc_tag_id?: string | null;
    clock_entry_id?: string;
  }
): Promise<string> {
  const database = ensureDB();

  const entry: PendingClockEntry = {
    id: crypto.randomUUID(),
    employee_id: employeeId,
    shop_id: shopId,
    action,
    timestamp: new Date().toISOString(),
    method,
    latitude: options?.latitude ?? null,
    longitude: options?.longitude ?? null,
    device_fingerprint: options?.device_fingerprint ?? null,
    verification_method: options?.verification_method ?? null,
    nfc_tag_id: options?.nfc_tag_id ?? null,
    clock_entry_id: options?.clock_entry_id,
    synced: false,
    retry_count: 0,
    created_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(entry);

    request.onsuccess = () => {
      console.log('Stored offline clock entry:', entry.id);
      resolve(entry.id);
    };

    request.onerror = () => {
      console.error('Failed to store offline clock entry:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all pending (unsynced) clock entries
 */
export async function getPendingClockEntries(): Promise<PendingClockEntry[]> {
  const database = ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    
    // Use IDBKeyRange.only() to query for false values
    const keyRange = IDBKeyRange.only(false);
    const request = index.getAll(keyRange);

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      console.error('Failed to get pending entries:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Mark a clock entry as synced
 */
export async function markEntrySynced(entryId: string): Promise<void> {
  const database = ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(entryId);

    getRequest.onsuccess = () => {
      const entry = getRequest.result;
      if (!entry) {
        reject(new Error('Entry not found'));
        return;
      }

      entry.synced = true;
      const updateRequest = store.put(entry);

      updateRequest.onsuccess = () => {
        console.log('Marked entry as synced:', entryId);
        resolve();
      };

      updateRequest.onerror = () => {
        reject(updateRequest.error);
      };
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
}

/**
 * Increment retry count for an entry
 */
export async function incrementRetryCount(entryId: string): Promise<void> {
  const database = ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(entryId);

    getRequest.onsuccess = () => {
      const entry = getRequest.result;
      if (!entry) {
        reject(new Error('Entry not found'));
        return;
      }

      entry.retry_count = (entry.retry_count || 0) + 1;
      entry.last_retry = new Date().toISOString();
      const updateRequest = store.put(entry);

      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Get the last clock-in entry for an employee (for offline clock-out matching)
 */
export async function getLastClockInEntry(
  employeeId: string,
  shopId: string
): Promise<PendingClockEntry | null> {
  const database = ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('employee_id');
    const request = index.getAll(employeeId);

    request.onsuccess = () => {
      const entries = request.result || [];
      // Find the most recent clock-in entry that hasn't been clocked out
      const clockInEntries = entries
        .filter(
          (e) =>
            e.action === 'clock_in' &&
            e.shop_id === shopId &&
            !entries.some(
              (out) =>
                out.action === 'clock_out' &&
                out.clock_entry_id === e.id &&
                out.synced
            )
        )
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      resolve(clockInEntries[0] || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Delete a synced entry (cleanup)
 */
export async function deleteSyncedEntry(entryId: string): Promise<void> {
  const database = ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(entryId);

    request.onsuccess = () => {
      console.log('Deleted synced entry:', entryId);
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Get count of pending entries
 */
export async function getPendingCount(): Promise<number> {
  const database = ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    
    // Use IDBKeyRange.only() to count false values
    const keyRange = IDBKeyRange.only(false);
    const countRequest = index.count(keyRange);

    countRequest.onsuccess = () => {
      resolve(countRequest.result);
    };

    countRequest.onerror = () => {
      reject(countRequest.error);
    };
  });
}

/**
 * Clear all synced entries (cleanup old data)
 */
export async function clearSyncedEntries(): Promise<void> {
  const database = ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    
    // Use IDBKeyRange.only() to query for true values
    const keyRange = IDBKeyRange.only(true);
    const request = index.getAll(keyRange);

    request.onsuccess = () => {
      const syncedEntries = request.result || [];
      let deleted = 0;

      if (syncedEntries.length === 0) {
        resolve();
        return;
      }

      syncedEntries.forEach((entry) => {
        const deleteRequest = store.delete(entry.id);
        deleteRequest.onsuccess = () => {
          deleted++;
          if (deleted === syncedEntries.length) {
            console.log(`Cleaned up ${deleted} synced entries`);
            resolve();
          }
        };
        deleteRequest.onerror = () => {
          reject(deleteRequest.error);
        };
      });
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

