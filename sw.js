const SW_VERSION = 1;
const CACHE_NAME = `OFFLINE_VERSION_${SW_VERSION}`;

const URL_TO_CACHE = ['index.html', 'manifest.json', 'script.js', 'style.css', 'logo192.png', 'favicon.ico', 'http://localhost:1337/games', '/'];
// const URL_TO_CACHE = ['index.html', 'manifest.json', 'script.js', 'style.css', 'logo192.png', 'favicon.ico', 'https://gamblr-api.herokuapp.com/games', '/'];

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

self.addEventListener('fetch', function (event) {
  if (!(event.request.url.indexOf('http') === 0)) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        var fetchPromise = fetch(event.request)
          .then(function (networkResponse) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
        return response || fetchPromise;
      })
    })
  );
});


// self.addEventListener("fetch", (event) => {
//   console.log("[ServiceWorker] fetch event " + event.request.url);

//   // self.clients.matchAll().then((clients) => {
//   //   clients.forEach((client) => {
//   //     client.postMessage(
//   //       `Hi ${client.id} you are loading the path ${event.request.url}`
//   //     );
//   //   });
//   // });

//   event.respondWith(
//     (async () => {
//       try {
//         const networkRequest = await fetch(event.request);
//         return networkRequest;
//       } catch (error) {
//         console.log(
//           "[ServiceWorker] Fetch failed; returning offline page instead."
//         );

//         const cache = await caches.open(CACHE_NAME);
//         const cachedResponse = await cache.match(event.request);
//         console.log(cachedResponse);
//         return cachedResponse;
//       }
//     })()
//   );
//self.skipWaiting();
// });

self.addEventListener("message", function (event) {
  console.log("Service worker received message:", event.data);
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
  // if (event.data === "cacheCurrentGames") {
  //   event.waitUntil(
  //     (async () => {
  //       const cache = await caches.open(CACHE_NAME);
  //       await cache.addAll(URL_TO_CACHE);
  //       console.log("Offline page cached again");
  //     })()
  //   );
  // }
});
