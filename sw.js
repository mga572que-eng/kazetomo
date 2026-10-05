// ともしびアイランド service worker
//  ・ページ（index.html）：ネット優先（3秒で あきらめて キャッシュ）→ 新しい版を すぐ 拾える
//  ・同じ場所の JS/画像など：stale-while-revalidate（キャッシュで 即起動、裏で 更新）。?v=ビルド番号 が 変われば 別URLなので 新版は 取り直し
//  ・version.json：つねに ネット（pwa.js の 版チェック用）
//  ・Googleフォント：stale-while-revalidate（オフラインでは 端末フォントに フォールバック）
const CACHE = 'kazetomo-20261005182611';
const CORE = ['./', './index.html', './music.js', './art.js', './art_mon.js', './art_face.js', './data.js', './world.js', './game.js', './settings.js', './life.js', './shrines.js', './base.js', './ch4.js', './jobs.js', './quests.js', './deco.js', './ux.js', './onboard.js', './unstuck.js', './names.js', './balance.js', './battle3d.js', './talk.js', './mobs.js', './town.js', './monplus.js', './gemini-talk.js', './jobfield.js', './lighthouses.js', './townlife.js', './interiors.js', './newtowns.js', './recipes.js', './payoff.js', './titles2.js', './weather.js', './townbuildings.js', './fieldexplore.js', './fieldtravel.js', './adventurelife.js', './casino.js', './chestfx.js', './bossfx.js', './dungeonfx.js', './funplus.js', './secrets.js', './mimic.js', './tomotree.js', './mainfloors.js', './perf.js', './pwa.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))); });
self.addEventListener('activate', e => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()); });
const okRes = r => r && (r.ok || r.type === 'opaque');
async function put(req, res) { try { const c = await caches.open(CACHE); const u = new URL(req.url);
  if (u.origin === location.origin && u.search) for (const k of await c.keys()) { const ku = new URL(k.url); if (ku.pathname === u.pathname && ku.search !== u.search) c.delete(k); } // 古い ?v= を 掃除
  await c.put(req, res); } catch (e) {} }
async function networkFirst(req, ms) { const net = fetch(req, { cache: 'no-cache' }).then(res => { if (okRes(res)) put(req, res.clone()); return res; });
  const timeout = new Promise(r => setTimeout(r, ms, null));
  try { const res = await Promise.race([net, timeout]); if (res) return res; } catch (e) {}
  const hit = await caches.match(req, { ignoreSearch: true }) || await caches.match('./index.html'); if (hit) return hit; return net; }
async function staleWhileRevalidate(e, req) { const hit = await caches.match(req);
  const net = fetch(req).then(res => { if (okRes(res)) put(req, res.clone()); return res; }).catch(() => null);
  if (hit) { e.waitUntil(net); return hit; }
  const res = await net; if (res) return res; const loose = await caches.match(req, { ignoreSearch: true }); if (loose) return loose; return Response.error(); }
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('/version.json')) return; // 常に ネット
  if (req.mode === 'navigate' || (url.origin === location.origin && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')))) { e.respondWith(networkFirst(req, 3000)); return; }
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.host)) { e.respondWith(staleWhileRevalidate(e, req)); return; }
});
