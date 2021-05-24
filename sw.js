const SW_VERSION = 7;
const CACHE_NAME = `OFFLINE_VERSION_${SW_VERSION}`;
const URL_TO_CACHE = ['index.html'];

self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] install event");
  //self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await cache.addAll(URL_TO_CACHE);
      console.log("Offline page cached");
    })()
  );
});

self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] activate event");
  //self.skipWaiting();

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            caches.delete(cacheName);
          } else {
            return null;
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  console.log("[ServiceWorker] fetch event" + event.request.url);

  // self.clients.matchAll().then((clients) => {
  //   clients.forEach((client) => {
  //     client.postMessage(
  //       `Hi ${client.id} you are loading the path ${event.request.url}`
  //     );
  //   });
  // });

  event.respondWith(
    (async () => {
      try {
        const networkRequest = await fetch(event.request);
        console.log('#############', event.request.url);
        return networkRequest;
      } catch (error) {
        console.log(
          "[ServiceWorker] Fetch failed; returning offline page instead."
        );

        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.matchAll(URL_TO_CACHE);
        return cachedResponse;
      }
    })()
  );
  //self.skipWaiting();
});

self.addEventListener("message", function (event) {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
