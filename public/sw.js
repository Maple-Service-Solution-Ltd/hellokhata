// Service Worker for HelloKhata OS
// Enables offline-first functionality with background sync

const CACHE_NAME = 'hellokhata-v1';
const SYNC_QUEUE_NAME = 'sync-queue';

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

// API patterns to cache
const CACHE_PATTERNS = [
  { url: '/api/dashboard', strategy: 'networkFirst', maxAge: 30000 },
  { url: '/api/sales', strategy: 'networkFirst', maxAge: 60000 },
  { url: '/api/items', strategy: 'networkFirst', maxAge: 30000 },
  { url: '/api/parties', strategy: 'networkFirst', maxAge: 30000 },
  { url: '/api/accounts', strategy: 'networkFirst', maxAge: 60000 },
  { url: '/api/branches', strategy: 'cacheFirst', maxAge: 300000 },
];

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Take control of all pages
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // Queue non-GET requests for background sync when offline
    if (!navigator.onLine) {
      event.respondWith(queueRequest(request));
      return;
    }
    return;
  }
  
  // Find matching cache pattern
  const pattern = CACHE_PATTERNS.find(p => url.pathname.startsWith(p.url));
  
  if (pattern) {
    if (pattern.strategy === 'cacheFirst') {
      event.respondWith(cacheFirst(request, pattern.maxAge));
    } else {
      event.respondWith(networkFirst(request, pattern.maxAge));
    }
    return;
  }
  
  // Default: network first for API, cache first for static
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, 30000));
  } else {
    event.respondWith(cacheFirst(request, 86400000)); // 24 hours for static
  }
});

// Network first strategy
async function networkFirst(request: Request, maxAge: number = 30000): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cache is fresh
      const cacheDate = cachedResponse.headers.get('sw-cache-date');
      if (cacheDate) {
        const age = Date.now() - parseInt(cacheDate);
        if (age < maxAge) {
          return cachedResponse;
        }
      }
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'Data not available offline' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Cache first strategy
async function cacheFirst(request: Request, maxAge: number = 300000): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    const cacheDate = cachedResponse.headers.get('sw-cache-date');
    if (cacheDate) {
      const age = Date.now() - parseInt(cacheDate);
      if (age < maxAge) {
        return cachedResponse;
      }
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Add cache date header
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cache-date', Date.now().toString());
      
      const responseToCache = new Response(await networkResponse.clone().blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });
      
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'Data not available offline' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Queue request for background sync
async function queueRequest(request: Request): Promise<Response> {
  const clone = request.clone();
  const body = await clone.text();
  
  const queueItem = {
    id: Date.now().toString(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    timestamp: Date.now(),
    retries: 0,
  };
  
  // Store in IndexedDB
  await storeInQueue(queueItem);
  
  // Register for background sync
  // @ts-ignore - ServiceWorkerRegistration type issue
  self.registration.sync?.register('sync-queue');
  
  return new Response(
    JSON.stringify({
      success: true,
      queued: true,
      message: 'Request queued for sync',
      id: queueItem.id,
    }),
    {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Store in IndexedDB queue
async function storeInQueue(item: unknown): Promise<void> {
  // This would use IndexedDB to store the queue
  // For now, we'll use localStorage via a message to the main thread
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'QUEUE_REQUEST',
      data: item,
    });
  });
}

// Background sync event
self.addEventListener('sync', (event: SyncEvent) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === SYNC_QUEUE_NAME) {
    event.waitUntil(processSyncQueue());
  }
});

// Process queued requests
async function processSyncQueue(): Promise<void> {
  // Request main thread to send queued items
  const clients = await self.clients.matchAll();
  
  clients.forEach((client) => {
    client.postMessage({
      type: 'PROCESS_SYNC_QUEUE',
    });
  });
}

// Message event - handle messages from main thread
self.addEventListener('message', (event: MessageEvent) => {
  console.log('[SW] Message received:', event.data?.type);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'SEND_QUEUED_REQUEST') {
    processQueuedItem(event.data.data);
  }
});

// Process a single queued item
async function processQueuedItem(item: {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}): Promise<void> {
  try {
    const response = await fetch(item.url, {
      method: item.method,
      headers: item.headers,
      body: item.body,
    });
    
    if (response.ok) {
      // Notify main thread of success
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_SUCCESS',
          id: item.id,
        });
      });
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('[SW] Sync failed for item:', item.id, error);
    
    // Notify main thread of failure
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_FAILED',
        id: item.id,
        error: String(error),
      });
    });
  }
}

// Type declarations for service worker
declare const self: ServiceWorkerGlobalScope;

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

interface SyncEvent extends ExtendableEvent {
  tag: string;
}

interface ServiceWorkerGlobalScope {
  addEventListener(type: string, listener: (event: unknown) => void): void;
  clients: Clients;
  registration: ServiceWorkerRegistration;
  skipWaiting(): void;
}

interface Clients {
  claim(): void;
  matchAll(): Promise<Client[]>;
}

interface Client {
  postMessage(message: unknown): void;
}
