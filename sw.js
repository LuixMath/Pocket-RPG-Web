const CACHE = 'pokemon-veyra-v16';
const ASSETS = [
  './', './index.html', './styles.css', './src/data.js', './src/game.js', './manifest.webmanifest',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/apple-touch-icon.png', './assets/icons/maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(res => {
    const clone = res.clone();
    if (new URL(event.request.url).origin === location.origin) caches.open(CACHE).then(cache => cache.put(event.request, clone));
    return res;
  }).catch(() => hit)));
});
