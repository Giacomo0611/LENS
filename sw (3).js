// 極簡 Service Worker：快取「應用程式外殼」讓頁面可以離線開啟（相機/鏡頭資料仍需連線才會更新）。
// 這不是為了做複雜的離線功能，只是滿足 Android「加入主畫面」需要 Service Worker 的門檻，
// 並讓已經開過一次的頁面，之後在訊號不好的地方也能先看到介面。
const CACHE_NAME = "lens-workbench-shell-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // API 一律直接連網路，不快取，確保型號資料庫永遠是最新的
  if (req.url.includes("/api/")) return;

  event.respondWith(
    fetch(req)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
  );
});
