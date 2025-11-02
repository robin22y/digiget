const CACHE_NAME = 'digiget-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome extensions and other non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone response (can only be consumed once)
          const responseToCache = response.clone();

          // Cache successful responses
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Network failed, show offline page
          return caches.match(OFFLINE_URL);
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-clock-ins') {
    event.waitUntil(syncClockIns());
  }
  if (event.tag === 'sync-customer-checkins') {
    event.waitUntil(syncCustomerCheckins());
  }
});

// Sync clock entries from IndexedDB
async function syncClockIns() {
  console.log('Background sync: Syncing clock entries...');
  
  try {
    // Import sync function (Note: This runs in service worker context)
    // Since we can't import ES modules directly in service worker,
    // we'll need to make a fetch request to a sync endpoint or use IndexedDB directly
    
    // Open IndexedDB
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('digiget-offline', 1);
      
      request.onsuccess = async () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('pending_clock_entries')) {
          console.log('No offline storage found');
          resolve();
          return;
        }
        
        const transaction = db.transaction(['pending_clock_entries'], 'readonly');
        const store = transaction.objectStore('pending_clock_entries');
        const index = store.index('synced');
        
        // Use IDBKeyRange.only() to query for false values
        const keyRange = IDBKeyRange.only(false);
        const getAllRequest = index.getAll(keyRange);
        
        getAllRequest.onsuccess = async () => {
          const pending = getAllRequest.result || [];
          console.log(`Found ${pending.length} pending clock entries to sync`);
          
          // Notify the main app to sync
          // The main app will handle the actual sync using the offlineSync service
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_PENDING_ENTRIES',
              count: pending.length
            });
          });
          
          resolve();
        };
        
        getAllRequest.onerror = () => {
          console.error('Error reading pending entries:', getAllRequest.error);
          reject(getAllRequest.error);
        };
      };
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Promise.resolve(); // Don't fail the sync event
  }
}

async function syncCustomerCheckins() {
  // Placeholder for customer check-ins sync
  console.log('Syncing customer check-ins...');
}

