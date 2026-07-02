// خدمة العامل (Service Worker) — دار سفوان القرآنية
// يتيح تثبيت الموقع كتطبيق (PWA) والوصول الأساسي دون إنترنت
const CACHE_NAME = "dar-safwan-v1";
const ASSETS_TO_CACHE = [
  "./dar-safwan.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS_TO_CACHE).catch(function () {
        // تجاهل فشل تخزين أي ملف بدون كسر التنصيب
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  // تجاهل الطلبات لخوادم خارجية (خطوط، مكتبات CDN) واتركها تُجلب من الشبكة مباشرة
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request)
        .then(function (response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match("./dar-safwan.html");
        });
    })
  );
});
