// ============================================================
// FILE: sw.js — Service Worker (Auto-Update Engine)
// VERSION: 2.0.0
// ============================================================

const CACHE_NAME   = "pharmaos-v2.0.0";
const OFFLINE_URLS = [
  "/pharmaos/",
  "/pharmaos/manifest.json"
];

// Install — cache core shell, activate immediately
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate — delete old caches, take control immediately
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - GAS API calls → always network (never cache API responses)
// - index.html / navigation → network-first, fallback to cache (so updates show immediately when online)
// - other static assets → cache-first
self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.url.includes("script.google.com")) {
    return; // let it go straight to network
  }

  const isNavigation = req.mode === "navigate" ||
    (req.method === "GET" && req.headers.get("accept")?.includes("text/html"));

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then(c => c || caches.match("/pharmaos/")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});

// Listen for skip-waiting message from the page (used for manual update prompt)
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
