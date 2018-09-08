// Adapted from serviceworker used in wittr project: https://github.com/jakearchibald/wittr

const VERSION_NUMBER = 1;
const cacheName = `restaurants-review-app-v${VERSION_NUMBER}`;
const imgCacheName = `restaurants-review-app-images-v${VERSION_NUMBER}`;

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll([
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/css/styles.css',
        '/data/restaurants.json',
        '/index.html',
        '/restaurant.html',
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.endsWith('.jpg')) {
    event.respondWith(servePhoto(event.request, requestUrl));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});


function servePhoto(request, url) {
  return caches.open(imgCacheName).then(function(cache) {
    return cache.match(url).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(url, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}