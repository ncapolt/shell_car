const CACHE_NAME = 'shell-car-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
//   '/icons/icon-192x192.png',
//   '/icons/icon-512x512.png',
  // Agregar más recursos que se necesiten cachear
];

// Exctend the type of the event to include the waitUntil method

type ExtendableEvent = Event & {
  waitUntil(fn: Promise<any>): void;
  respondWith(fn: Promise<Response>): void;
  request: Request;
};

self.addEventListener("install", (event: Event) => {
  (event as ExtendableEvent).waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache
        .addAll(urlsToCache.map((url) => new Request(url, { cache: "reload" })))
        .catch((error) => {
          console.error("Failed to cache:", error);
        });
    }),
  );
});

self.addEventListener('fetch', (event) => {
  (event as ExtendableEvent).respondWith(
    caches.match((event as ExtendableEvent).request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch((event as ExtendableEvent).request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  (event as ExtendableEvent).waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
