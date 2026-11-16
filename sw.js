// 离线缓存（Service Worker）
// 策略：同源文件“先用缓存、同时后台更新”(stale-while-revalidate)。
//   - 第二次打开几乎瞬间加载，断网也能玩（游戏本身是纯前端，存档在浏览器里）；
//   - 更新了游戏文件后，用户会在下一次打开时拿到新版（同一次加载里的文件互相一致）。
// 想强制所有人立刻换新：改一下下面的 VERSION。
const VERSION = "v0.11";
const CACHE = "chi-" + VERSION;
const CORE = ["./", "index.html", "style.css", "i18n.js", "data/game.js", "data/ja.js", "worldmap.js", "game.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u =>
    fetch(u, { cache: "reload" }).then(r => r.ok && c.put(u, r)).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("chi-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    return (await fresh) || new Response("", { status: 504 });
  }));
});
