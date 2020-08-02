// This is the "Offline copy of assets" service worker

// const CACHE = "pwabuilder-offline";

// importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

// self.addEventListener("message", (event) => {
//   if (event.data && event.data.type === "SKIP_WAITING") {
//     self.skipWaiting();
//   }
// });

// workbox.routing.registerRoute(
//   new RegExp('/*'),
//   new workbox.strategies.StaleWhileRevalidate({
//     cacheName: CACHE
//   })
// );


// This is the "serving cached media" service worker

const CACHE = "pwabuilder-offline";

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// workbox.loadModule('workbox-cacheable-response');

// workbox.routing.registerRoute(
//   /.*\.(gif|css|jpg|png|jpeg|svg)/,
//   new workbox.strategies.CacheFirst({
//     cacheName: CACHE,
//     plugins: [
//       new workbox.cacheableResponse.CacheableResponsePlugin({statuses: [200]})
//     ],
//   }),
// );




self.addEventListener('install', async (event) => {
  var offlineRequest = new Request('/offline.html');
  event.waitUntil(
    fetch(offlineRequest).then(function(response) {
      return caches.open('offline').then(function(cache) {
        console.log('[oninstall] Cached offline page', response.url);
        return cache.put(offlineRequest, response);
      });
    })
  );
});

self.addEventListener('fetch', function(event) {
  var request = event.request;
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request).catch(function(error) {
        console.error(
          '[onfetch] Failed. Serving cached offline fallback ' +
          error
        );
        return caches.open('offline').then(function(cache) {
          return cache.match('/offline.html');
        });
      })
    );
  }
});


