const STATIC_CACHE = "scholaops-static-v2";
const RUNTIME_CACHE = "scholaops-runtime-v1";
const DASHBOARD_CACHE = "scholaops-dashboard-v1";

const STATIC_URLS = [
  "/",
  "/privacy",
  "/terms",
  "/offline",
  "/favicon.ico",
  "/icons/favicon-16.png",
  "/icons/favicon-32.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-icon-192.png",
  "/icons/maskable-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              ![STATIC_CACHE, RUNTIME_CACHE, DASHBOARD_CACHE].includes(key),
          )
          .map((key) => caches.delete(key)),
      )
    ),
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/") ||
    /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const cacheName = url.pathname.startsWith("/dashboard")
            ? DASHBOARD_CACHE
            : RUNTIME_CACHE;
          caches.open(cacheName).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const offline = await caches.match("/offline");
          return offline || Response.error();
        }),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, res.clone()));
            return res;
          })
          .catch(() => cached);

        return cached || networkFetch;
      }),
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req)),
  );
});
