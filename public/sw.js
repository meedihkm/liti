// Service Worker — PWA Borboleta
// Stratégies de cache simples sans bibliothèque externe

const CACHE_VERSION = "v2"; // Incrémenter à chaque changement de code
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const ASSETS_CACHE = `assets-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Toutes les versions de cache utilisées
const CURRENT_CACHES = [SHELL_CACHE, ASSETS_CACHE, API_CACHE];

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

// Activation : nettoyage des anciens caches + prise de contrôle immédiate
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate - purging old caches");
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        // Supprimer tous les caches qui ne sont pas dans la liste actuelle
        const deletePromises = keys
          .filter((key) => !CURRENT_CACHES.includes(key))
          .map((key) => {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          });
        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log("[SW] Claiming clients for immediate control");
        return self.clients.claim();
      })
  );
});

// Fetch : stratégies de cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas cacher :
  // - TOUTES les routes /api/* (surtout /api/admin/*)
  // - Mutations (POST/PUT/PATCH/DELETE)
  // - Réponses avec Set-Cookie (authentifiées)
  if (url.pathname.startsWith("/api/") || request.method !== "GET") {
    return event.respondWith(fetch(request));
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
