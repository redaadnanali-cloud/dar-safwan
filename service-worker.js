/* Dar Safwan — Service Worker (offline support) */
var CACHE = "dar-safwan-v1";
var CORE = [
  "./dar-safwan.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // نتجاهل فشل أي مورد مفرد حتى لا يفشل التثبيت كله
      return Promise.allSettled(CORE.map(function (u) { return c.add(u); }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // ملفات الصوت الخارجية: الشبكة أولاً، دون تخزين (كبيرة الحجم)
  if (/\.mp3($|\?)/.test(url.pathname)) return;

  // صفحات HTML: الشبكة أولاً مع رجوع للكاش عند انقطاع الإنترنت
  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match("./dar-safwan.html"); });
      })
    );
    return;
  }

  // باقي الموارد: الكاش أولاً ثم الشبكة (stale-while-revalidate مبسّط)
  e.respondWith(
    caches.match(req).then(function (cached) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || net;
    })
  );
});
