const CACHE = "turkey-travel-planner-v4";
const ASSETS = ["./", "./index.html", "./styles.css", "./map-panel.css", "./transport-links.css", "./time-note.css", "./name-display.css", "./app.js", "./data/trip-data.js", "./manifest.webmanifest"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))));
