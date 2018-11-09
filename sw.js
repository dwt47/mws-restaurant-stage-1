// Adapted from serviceworker used in wittr project: https://github.com/jakearchibald/wittr
importScripts('/js/idb.js');
importScripts('/js/dbhelper.js');

const VERSION_NUMBER = 1;
const cacheName = `restaurants-review-app-v${VERSION_NUMBER}`;
const dbName = 'restaurants-review-db';
const idbStoreName = 'restaurants-review-store';


self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll([
        '/',
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/css/styles.css',
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method === 'POST') {
    queueRequest(event.request);
    return;
  }

  if (event.request.url === DBHelper.RESTAURANTS_URL) {
    event.respondWith(getRestaurants(event.request.url));
  } else if (event.request.url.startsWith(DBHelper.REVIEWS_URL)) {
    event.respondWith(getReviews(event.request.url));
  } else {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || maybeSaveResponse(event.request);
      })
    );
  }

});

let queue = [];

function queueRequest(request) {
  fetch(request.clone()).catch(e => {
    queue.push(request.clone());
  });
}

setInterval(() => {
  let _queue = queue;
  queue = [];
  _queue.forEach(queueRequest);
}, 5000);

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

// IndexedDB-releated stuff
// Adapted from readme https://github.com/jakearchibald/idb#readme
const dbPromise = idb.open(dbName, 1, db => {
  switch (db.oldVersion) {
    case 0:
      db.createObjectStore(idbStoreName);
  }
});

function saveRestaurants(restaurants) {
  return dbPromise.then(db => {
    const tx = db.transaction(idbStoreName, 'readwrite');
    tx.objectStore(idbStoreName).put(restaurants, 'restaurants');
    return tx.complete;
  });
}

// Attempt to fetch the restaurants from API
// But if there's an error and we have a backup copy use that instead
function getRestaurants(url) {
  return dbPromise.then(db => {
    const tx = db.transaction(idbStoreName);
    const store = tx.objectStore(idbStoreName);

    return store.get('restaurants').then(dbResult => {
      const fetchPromise = fetch(url).then(response => {
        const clone = response.clone();
        clone.json().then(saveRestaurants)

        return response;
      });

      // can't do anything if we don't have a db backup
      if (!dbResult) {
        return fetchPromise;
      }

      // if we have a backup, use it in case fetch fails
      return fetchPromise.catch(e => {
        console.log('Fetch failed: ', e);
        return new Response(JSON.stringify(dbResult));
      });
    });
  });
}

function saveReviews(reviews) {
  return dbPromise.then(db => {
    const tx = db.transaction(idbStoreName, 'readwrite');
    tx.objectStore(idbStoreName).put(reviews, 'reviews');
    return tx.complete;
  });
}

// Attempt to fetch the reviews from API
// But if there's an error and we have a backup copy use that instead
function getReviews(url) {

  return dbPromise.then(db => {
    const tx = db.transaction(idbStoreName);
    const store = tx.objectStore(idbStoreName);

    return store.get('reviews').then(dbResult => {
      const fetchPromise = fetch(url).then(response => {
        const clone = response.clone();
        clone.json().then(saveReviews)

        return response;
      });

      // can't do anything if we don't have a db backup
      if (!dbResult) {
        return fetchPromise;
      }

      // if we have a backup, use it in case fetch fails
      return fetchPromise.catch(e => {
        console.log('Fetch failed: ', e);
        return new Response(JSON.stringify(dbResult));
      });
    });
  });
}