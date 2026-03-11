const PRECACHE = "otpremnice-precache-v7";
const RUNTIME = "otpremnice-runtime-v7";

// POPIS DATOTEKA KOJE ŽELIMO UVIJEK IMATI SPREMNE (CACHE)
const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "logo.png.png",
  "icon.ico",
  "artikli.csv",
  "kupci.csv"
];

// INSTALL – pohranjujemo osnovne datoteke u cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE – brišemo stare cache-eve
self.addEventListener("activate", (event) => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// FETCH – preuzimanje resursa (najvažniji dio za offline)
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ako nije GET zahtjev, preskoči
  if (request.method !== "GET") return;

  // Strategija: prvo pokušaj iz cachea, ako nema, onda s interneta
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Ako imamo u cacheu, vrati to
        return cachedResponse;
      }

      // Ako nema u cacheu, idi na internet
      return fetch(request).then((networkResponse) => {
        // Spremi samo validne odgovore (status 200)
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(RUNTIME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Ako nema interneta, a nema ni u cacheu, vrati fallback (opcionalno)
        if (request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
