/* Service worker: chạy offline sau lần mở đầu */
const CACHE = "toan9-feynman-v1";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./assets/css/styles.css",
  "./assets/js/data.js", "./assets/js/storage.js", "./assets/js/engine.js", "./assets/js/app.js",
  "./icons/icon-192.png", "./icons/icon-512.png"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) =>
      hit ||
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => (e.request.mode === "navigate" ? caches.match("./index.html") : undefined))
    )
  );
});
