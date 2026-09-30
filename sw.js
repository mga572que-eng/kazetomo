// ともしびアイランド service worker — ネット優先（つねに最新）、オフライン時は キャッシュで 遊べる
const CACHE = 'kazetomo-20260930063017';
const CORE = ['./', './index.html', './music.js', './art.js', './art_mon.js', './art_face.js', './data.js', './world.js', './game.js', './settings.js', './life.js', './shrines.js', './base.js', './ch4.js', './jobs.js', './ux.js', './pwa.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).catch(() => {})); });
self.addEventListener('activate', e => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('/version.json')) return; // 常に ネット
  e.respondWith((async () => {
    try { const res = await fetch(req, { cache: 'no-cache' }); if (res && res.ok && (url.origin === location.origin || url.host.includes('fonts.g'))) { const c = await caches.open(CACHE); c.put(req, res.clone()); } return res; }
    catch (err) { const hit = await caches.match(req, { ignoreSearch: true }); if (hit) return hit; if (req.mode === 'navigate') { const idx = await caches.match('./index.html'); if (idx) return idx; } throw err; }
  })());
});
