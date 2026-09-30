// ともしびアイランド — はさまり 救出（うごけなく なったら 自動で ぬけだす）＋ メニューの「ぬけだす」
// 判定は game.js の 当たり判定（K.blocked / K.footAt）と 同じ ものを つかう（食いちがうと 誤作動する）
'use strict';
(() => {
  const K = window.KZ; if (!K || !K.blocked) return; const H = K.HOOK;
  const bl = (x, z, y) => K.blocked(x, z, y);
  const DIRS = []; for (let k = 0; k < 8; k++) DIRS.push([Math.sin(k * Math.PI / 4), Math.cos(k * Math.PI / 4)]);
  // その場から うごけるか：8方向の どれかへ すこし 進める、または 1段 のぼれる
  function canMove(x, z, y) { for (const [a, b] of DIRS) { const nx = x + a * .25, nz = z + b * .25; if (!bl(nx, nz, y)) return true;
      if (!bl(nx, nz, y + 1.05) && !bl(x, z, y + 1.05) && K.footAt(nx, nz, y + 1.1) - y <= 1.06) return true; } return false; }
  const stuckAt = P => bl(P.x, P.z, P.y) || !canMove(P.x, P.z, P.y);
  const shrineOf = (x, z) => (K.shrinesHere ? K.shrinesHere(K.G.region) : []).find(s => Math.abs(x - s.pos.x - .5) < 7.4 && Math.abs(z - s.pos.z - .5) < 7.4) || null;
  // 近くの 安全な 足場（同じ 高さ ±1.1・祠の かべの 内外を こえない・そこから また うごける）
  function freeSpot(P) { const sh = shrineOf(P.x, P.z);
    for (let r = .45; r <= 6; r += .35) { let best = null;
      for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, x = P.x + Math.sin(a) * r, z = P.z + Math.cos(a) * r; if (shrineOf(x, z) !== sh) continue;
        const y = K.footAt(x, z, P.y + 1.2); if (y - P.y > 1.1 || P.y - y > 3 || y < K.hAt(x, z) - .1) continue;
        if (bl(x, z, y) || !canMove(x, z, y)) continue; const sc = Math.abs(y - P.y); if (!best || sc < best.sc) best = { x, z, y, sc }; }
      if (best) return best; }
    return null; }
  const hist = []; // すこし 前に いた 安全な 場所（4m おき・10こ）
  function place(P, s, msg) { P.x = s.x; P.z = s.z; P.y = s.y + .02; P.vx = P.vz = P.vy = 0; P.glide = false; P.stag = 0; P.fallTop = P.y; if (msg) K.toast(msg, 1500); return true; }
  function fallback(P) { const g = hist.filter(h => h.r === K.G.region).pop() || (P.safe && { x: P.safe.x, z: P.safe.z, y: K.footAt(P.safe.x, P.safe.z, 99) }) || { x: K.REG[K.G.region].town.x + 2, z: K.REG[K.G.region].town.z + 4, y: K.footAt(K.REG[K.G.region].town.x + 2, K.REG[K.G.region].town.z + 4, 99) }; return g; }
  function rescue(msg) { const P = K.player; if (K.depen && bl(P.x, P.z, P.y) && K.depen(P) && canMove(P.x, P.z, P.y)) { if (msg) K.toast(msg, 1500); return true; }
    return place(P, freeSpot(P) || fallback(P), msg); }
  K.rescue = rescue; K.stuckAt = stuckAt;
  let stuckT = 0, histT = 0;
  H.frame.push(dt => { const P = K.player; if (window.__noRescue || K.phase !== 'field' || K.busy || K.G.build) { stuckT = 0; return; }
    histT -= dt; if (histT <= 0) { histT = .5; if (P.ground && !P.swim && !stuckAt(P)) { const l = hist[hist.length - 1]; if (!l || l.r !== K.G.region || Math.hypot(l.x - P.x, l.z - P.z) > 4) { hist.push({ x: P.x, y: P.y, z: P.z, r: K.G.region }); if (hist.length > 10) hist.shift(); } } }
    if (bl(P.x, P.z, P.y)) stuckT += dt * 2; else if (P.ground && !canMove(P.x, P.z, P.y)) stuckT += dt; else stuckT = Math.max(0, stuckT - dt * 2);
    if (stuckT > 1.2) { stuckT = 0; rescue('はさまっていたので ぬけだした'); } });
  H.menu.push(() => ({ label: 'ぬけだす', sub: 'うごけない とき', fn: async () => { const P = K.player;
    if (stuckAt(P)) { rescue('ちかくの 安全な 場所へ ぬけだした'); return; }
    const sh = shrineOf(P.x, P.z); if (sh && !(K.G.shrineDone || {})[sh.id]) { if (await K.confirm('祠の 入口へ もどる？')) place(P, { x: sh.gate.x, z: sh.gate.z + 1.5, y: K.footAt(sh.gate.x, sh.gate.z + 1.5, sh.pos.y + 2) }, '祠の 入口へ もどった'); return; }
    const far = hist.filter(h => h.r === K.G.region && Math.hypot(h.x - P.x, h.z - P.z) > 5).pop();
    if (!far) { K.toast('いまは その ひつようは ない', 1200); return; }
    if (await K.confirm('すこし 前に いた 安全な 場所へ もどる？')) place(P, far, 'すこし 前の 場所へ もどった'); } }));
})();
