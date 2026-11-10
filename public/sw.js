// Service Worker — PWA Taqendurt
// Stratégies de cache simples sans bibliothèque externe

const CACHE_VERSION = "taqendurt-v1";
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const ASSETS_CACHE = `assets-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Fichiers à précacher (shell de l'application)
const SHELL_FILES = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
];

// Installation : précache du shell
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("taqendurt-") && !key.includes(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch : stratégies de cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas cacher :
  // - Routes admin
  // - Mutations (POST/PUT/PATCH/DELETE)
  // - /api/orders, /api/track (données sensibles)
  // - Réponses avec Set-Cookie (authentifiées)
  if (
    url.pathname.startsWith("/api/admin") ||
    url.pathname === "/api/orders" ||
    url.pathname === "/api/track" ||
    request.method !== "GET"
  ) {
    return event.respondWith(fetch(request));
  }

  // API publique : stale-while-revalidate
  if (url.pathname.startsWith("/api/")) {
    return event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((response) => {
          // Ne cacher que les réponses OK sans authentification
          if (response.ok && !response.headers.has("set-cookie")) {
            cache.put(request, response.clone());
          }
          return response;
        });
        return cached || fetchPromise;
      })
    );
  }

  // Assets (images, fonts, etc.) : cache-first
  if (
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/uploads/") ||
    url.pathname.startsWith("/_next/static/") ||
    /\.(jpg|jpeg|png|webp|avif|gif|svg|woff2|woff)$/.test(url.pathname)
  ) {
    return event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
    );
  }

  // Shell et pages : network-first avec fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // Page hors-ligne de secours
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Hors ligne", {
            status: 503,
            statusText: "Service Unavailable",
          });
        })
      )
  );
});

// Message : skip waiting (mise à jour immédiate)
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
