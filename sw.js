const CACHE_NAME = "pokemon-veyra-rpg-v1-4-presentation";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./src/data.js",
  "./src/game.js",
  "./manifest.webmanifest",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png",
  "./assets/sprites/hero.gif",
  "./assets/sprites/npc.png",
  "./assets/sprites/professor.png",
  "./assets/sprites/mom.png",
  "./assets/sprites/rival.png",
  "./assets/sprites/nurse.png",
  "./assets/sprites/shopkeeper.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          if (response.ok || response.type === "opaque") cache.put(request, copy);
        });
        return response;
      }).catch(() => {
        if (request.mode === "navigate") return caches.match("./index.html");
        return new Response("Offline", { status: 503, statusText: "Offline" });
      });
    })
  );
});
