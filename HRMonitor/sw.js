importScripts('./version.js');

const CACHE_NAME = `hr-monitor-cache-${APP_VERSION}`;
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './version.js',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Outfit:wght@300;500;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  const isAppShellAsset = ['index.html', 'app.js', 'style.css', 'manifest.json'].some(asset => url.pathname.endsWith(asset)) || url.pathname.endsWith('/');

  if (isAppShellAsset) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request).then(response => response || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(response => response || fetch(request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }

        return Promise.resolve(false);
      }));
    }).then(() => self.clients.claim())
  );
});
