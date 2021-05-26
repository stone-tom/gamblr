const SW_VERSION = 1;
const CACHE_NAME = `OFFLINE_VERSION_${SW_VERSION}`;

// const URL_TO_CACHE = ['index.html', 'manifest.json', 'script.js', 'style.css', 'logo192.png', 'favicon.ico', 'http://localhost:1337/games', '/'];
const URL_TO_CACHE = ['index.html', 'manifest.json', 'script.js', 'style.css', 'logo192.png', 'favicon.ico', 'https://gamblr-api.herokuapp.com/games', '/'];

self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] install event");
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
  if ((event.request.method === 'POST')) return;
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

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'Gamblr Notification';
  const options = {
    body: event.data.text(),
    icon: 'images/icon.png',
    badge: 'images/badge.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('https://fh-salzburg.ac.at')
  );
});

self.addEventListener("message", function (event) {
  console.log("Service worker received message:", event.data);
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
