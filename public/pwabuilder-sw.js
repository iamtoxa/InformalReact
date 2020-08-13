// // This is the "Offline copy of assets" service worker

// // const CACHE = "pwabuilder-offline";

// // importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

// // self.addEventListener("message", (event) => {
// //   if (event.data && event.data.type === "SKIP_WAITING") {
// //     self.skipWaiting();
// //   }
// // });

// // workbox.routing.registerRoute(
// //   new RegExp('/*'),
// //   new workbox.strategies.StaleWhileRevalidate({
// //     cacheName: CACHE
// //   })
// // );


// // This is the "serving cached media" service worker

// const CACHE = "pwabuilder-offline";

// importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

// self.addEventListener("message", (event) => {
//   if (event.data && event.data.type === "SKIP_WAITING") {
//     self.skipWaiting();
//   }
// });

// // workbox.loadModule('workbox-cacheable-response');

// // workbox.routing.registerRoute(
// //   /.*\.(gif|css|jpg|png|jpeg|svg)/,
// //   new workbox.strategies.CacheFirst({
// //     cacheName: CACHE,
// //     plugins: [
// //       new workbox.cacheableResponse.CacheableResponsePlugin({statuses: [200]})
// //     ],
// //   }),
// // );




// self.addEventListener('install', async (event) => {
//   var offlineRequest = new Request('/offline.html');
//   event.waitUntil(
//     fetch(offlineRequest).then(function(response) {
//       return caches.open('offline').then(function(cache) {
//         console.log('[oninstall] Cached offline page', response.url);
//         return cache.put(offlineRequest, response);
//       });
//     })
//   );
// });

// self.addEventListener('fetch', function(event) {
//   var request = event.request;
//   if (request.method === 'GET') {
//     event.respondWith(
//       fetch(request).catch(function(error) {
//         console.error(
//           '[onfetch] Failed. Serving cached offline fallback ' +
//           error
//         );
//         return caches.open('offline').then(function(cache) {
//           return cache.match('/offline.html');
//         });
//       })
//     );
//   }
// });



importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

const CACHE = "pwabuilder-page";

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = "/offline.html";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(offlineFallbackPage))
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;

        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {

        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});


workbox.loadModule('workbox-cacheable-response');

workbox.routing.registerRoute(
  /.*\.(jpeg|png|jpg|css|js|gif)/,
  new workbox.strategies.CacheFirst({
    cacheName: CACHE,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({statuses: [200]}),
    ],
  }),
);