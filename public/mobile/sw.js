const CACHE = "vpe-mobile-shell-v1";
const OFFLINE_URL = "/mobile/offline.html";
const SHELL_ASSETS = [
  "/mobile/",
  "/mobile/index.html",
  "/mobile/mobile.css",
  "/mobile/offline.html",
  "/js/client_logic_full.js",
  "/js/action-buttons.js",
  "/js/section-visibility.js",
  "/js/version-chooser.js",
  "/mobile/js/mobile-shell.js",
  "/config/style-presets.json",
  "/config/prompt-templates.json",
  "/config/engine-capabilities.json",
  "/config/taxonomy-rules.json",
  "/config/ui-buttons.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return caches.match(OFFLINE_URL);
    })
  );
});
