// Adapted from serviceworker used in wittr project: https://github.com/jakearchibald/wittr

const VERSION_NUMBER = 1;
const cacheName = `restaurants-review-app-v${VERSION_NUMBER}`;

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll([
        '/',
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/css/styles.css',
        '/data/restaurants.json',
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || maybeSaveResponse(event.request);
    })
  );
});

function maybeSaveResponse(request) {
  return fetch(request).then(function(networkResponse) {
    const requestedURL = new URL(request.url);
    const homeURL = new URL(location);

    // Save anything we're serving locally; don't cache any external calls
    if (requestedURL.origin === homeURL.origin) {
      const clone = networkResponse.clone();
      caches.open(cacheName).then(function(cache) {
        cache.put(requestedURL, clone);
      });
    }

    return networkResponse;
  });
}
