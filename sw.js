// ============================================================
// FILE: sw.js — Service Worker (Offline Engine)
// VERSION: 1.0.0
// ============================================================

const CACHE_NAME    = "pharmaos-v1.0.0";
const OFFLINE_URLS  = [
  "/pharmaos/",
  "/pharmaos/index.html",
  "/pharmaos/manifest.json"
];

// Install — cache core files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache, fallback to network
self.addEventListener("fetch", event => {
  // Skip GAS API calls — always go to network
  if (event.request.url.includes("script.google.com")) return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => caches.match("/pharmaos/index.html"))
  );
});
