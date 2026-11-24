/* Service worker của workout-app — sinh bởi scripts/build-sw.ts, không sửa public/sw.js trực tiếp. */
const VERSION = "__VERSION__";
const CACHE = `workout-app-${VERSION}`;
const PAGES = __PAGES__;
const ASSETS = __ASSETS__;
const STATIC_PREFIXES = ["/_next/static/", "/media/", "/icons/"];

async function cacheQuietly(cache, url) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    // Lưu bản sao: nơi gọi còn cần đọc nội dung response (lấy danh sách tài nguyên).
    if (res.ok) await cache.put(url, res.clone());
    return res;
  } catch {
    return undefined;
  }
}

// Cài đặt: lưu sẵn mọi trang, các tệp JS/CSS mà trang tham chiếu, hình minh họa và icon,
// để lần mở sau dùng được hoàn toàn khi không có mạng (NFR-OFF-01).
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const assets = new Set(ASSETS);
      for (const page of PAGES) {
        const res = await cacheQuietly(cache, page);
        if (!res?.ok) continue;
        const html = await res.clone().text();
        for (const match of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) assets.add(match[0]);
      }
      await Promise.all([...assets].map((url) => cacheQuietly(cache, url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("workout-app-") && k !== CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Tệp có hash / tĩnh: lấy từ cache trước.
  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) (await caches.open(CACHE)).put(request, res.clone());
        return res;
      })(),
    );
    return;
  }

  // Trang: lấy từ mạng trước để luôn mới, mất mạng thì dùng bản đã lưu.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(url.pathname, res.clone());
          return res;
        } catch {
          return (
            (await cache.match(url.pathname)) ??
            (await cache.match(url.pathname.replace(/\/$/, ""))) ??
            (await cache.match("/")) ??
            Response.error()
          );
        }
      })(),
    );
  }
  // Yêu cầu khác (VD: dữ liệu RSC khi chuyển trang phía client): để trình duyệt tự xử lý.
  // Khi mất mạng, Next.js sẽ chuyển sang tải cả trang và được nhánh "navigate" ở trên phục vụ.
});
