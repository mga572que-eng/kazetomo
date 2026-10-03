// 灯の樹（ともしびのき）— 灯台の 全面一新 P1：見た目（docs/design/tomoshibi-tree.md）
// ・島の 灯台の 石の 塔を、根・幹・枝・葉の 傘と「灯の花」を もつ 大きな 樹に かえる（まずは 野原 1本。残りは P2 以降）
// ・ともる前：葉が くすみ、花は つぼみ／ともったあと：葉が 明るく、花が ひらいて 光る
// ・灯の 位置（b.fireAt）は 幹の わかれめ（高さ 約4）なので、いまの 光・番人・扉の 位置は そのまま
// ・幹には 見えない かべ（ブロック 19）を 置いて、通りぬけない。セーブ・ID・進行は かえない
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const W = World, H = K.HOOK;
  const TREES = [0, 1, 2, 3, 4], TS = 1.8; // TS＝大きさ（まわりの 木より ひとまわり 大きく、遠くから 目じるしに）
  const V = W.V, C = (h, e = 0) => { const n = parseInt(h.slice(1), 16); return () => [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, e]; };
  const S = (c, v = .12, e = 0) => W.shade(c, v, e);
  // ---- 樹の 形（灯の樹ごとに すこし ちがう）：0 野原・1 ふたご（二本の 幹）・2 岩山（太い 根と 岩）・3 月夜（青白い 葉）・4 崖（風に かたむく） ----
  const VAR = [
    { trunks: [[0, 0]], lean: [0, 0], dim: [.36, .45, .33], lit: [.44, .74, .38] },
    { trunks: [[-1.3, 0], [1.3, .2]], lean: [0, 0], dim: [.36, .45, .33], lit: [.46, .76, .40] },
    { trunks: [[0, 0]], lean: [0, 0], dim: [.38, .44, .34], lit: [.50, .70, .36], rocks: true, root: 1.5 },
    { trunks: [[0, 0]], lean: [0, 0], dim: [.32, .38, .46], lit: [.56, .66, .92] },
    { trunks: [[0, 0]], lean: [1.6, -.6], dim: [.38, .46, .32], lit: [.50, .74, .40], sparse: true },
  ];
  const BR = [[2.8, 7.2, .4], [-2.6, 7.6, -1.2], [.6, 8.4, 2.6], [-1, 7, -2.9], [2, 6.4, -2.4]];
  function build(v) { const o = VAR[v], body = W.Geo(), dim = W.Geo(), lit = W.Geo(), bark = S([.42, .29, .19], .14), barkD = S([.33, .22, .15], .12), rs = o.root || 1;
    for (const [tx, tz] of o.trunks) { const k = o.trunks.length > 1 ? .78 : 1, lx = o.lean[0], lz = o.lean[1];
      W.seg(body, [tx, -.6, tz], [tx + lx * .5, 4.2, tz + lz * .5], 1.25 * k, .85 * k, 9, bark);
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + .3 + tx, L = (2.6 + (i % 2) * .8) * rs; W.seg(body, [tx + Math.cos(a) * .7, .5, tz + Math.sin(a) * .7], [tx + Math.cos(a) * L, -.35, tz + Math.sin(a) * L], .55 * rs * k, .18, 6, barkD); }
      const top = [tx + lx * .5, 3.9, tz + lz * .5], br = o.sparse ? BR.slice(0, 3) : BR;
      for (const [x, y, z] of br) { const e = [tx + x * k + lx, y, tz + z * k + lz]; W.seg(body, top, e, .5 * k, .22, 6, bark); for (const [g, c] of [[dim, o.dim], [lit, o.lit]]) W.ico(g, 1.9 * k, [e[0], e[1] + .6, e[2]], S(c, .18), .25, 1, .8); }
      for (const [g, c] of [[dim, o.dim], [lit, o.lit]]) { W.ico(g, 2.4 * k, [tx + lx, 9.2, tz + lz], S(c, .18), .25, 1, .8); if (!o.sparse) W.ico(g, 1.6 * k, [tx + .8 + lx, 10.6, tz - .4 + lz], S(c, .18), .2, 1, .8); } }
    if (o.rocks) for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; W.ico(body, .8 + (i % 3) * .3, [Math.cos(a) * 3.4, .1, Math.sin(a) * 3.4], S([.55, .53, .5], .15), .3, 0, .7); }
    for (const k of [0, 1.2, -1.4]) W.ico(lit, .14, [k + o.lean[0], 8.4 + k * .5, -k * .6 + o.lean[1]], C('#ffe28a', 1), 0, 1, 1); // 灯の実
    return { body: W.makeMesh(body, 1), dim: W.makeMesh(dim, 1), lit: W.makeMesh(lit, 1) }; }
  const MV = VAR.map((_, v) => build(v));
  // ---- 灯の花（つぼみ／ひらいた 花）：灯が 樹の 上で ともる 樹だけ（ふたご・崖は 塔・浮き足場で ともる） ----
  const gBud = W.Geo(); W.ico(gBud, .55, [0, 4.6, 0], C('#b7a27a'), .1, 1, 1.3); W.ico(gBud, .25, [0, 5.2, 0], C('#d8c48a'), .1, 1, 1);
  const gBloom = W.Geo(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; W.seg(gBloom, [0, 4.4, 0], [Math.cos(a) * 1.15, 4.95, Math.sin(a) * 1.15], .42, .1, 5, C('#ffd9a0', .6)); }
  W.ico(gBloom, .5, [0, 4.75, 0], C('#fff3c4', 1), 0, 1, 1);
  const mBud = W.makeMesh(gBud, 5), mBloom = W.makeMesh(gBloom, 5), ALL = [mBud, mBloom, ...MV.flatMap(m => [m.body, m.dim, m.lit])];
  const isTree = b => TREES.includes(b.i), onTree = b => !(b.act && b.act.top); // 灯が 樹の 上で ともるか
  H.beaconScale = b => isTree(b) ? 0 : 1; // game.js：石の 塔は 描かない
  // ---- 幹の 見えない かべ ----
  let walled = false;
  function wall() { const R = K.REG[0]; if (walled || !R || !R.beacons) return; walled = true; const prev = W.region; W.setRegion(0);
    try { for (const b of R.beacons) if (isTree(b)) for (const [tx, tz] of VAR[b.i].trunks) { const cx = Math.floor(b.x + tx * TS), cz = Math.floor(b.z + tz * TS), y0 = Math.floor(b.y), rr = VAR[b.i].trunks.length > 1 ? 1.6 : 2.1;
      for (let i = -2; i <= 1; i++) for (let j = -2; j <= 1; j++) for (let y = y0; y <= y0 + 5; y++) if (Math.hypot(i + .5, j + .5) < rr && !K.blocked(cx + i + .5, cz + j + .5, y + .5)) W.Blocks.set(cx + i, y, cz + j, 19, true, 0); } }
    finally { W.setRegion(prev); } }
  H.frame.push(() => { for (const m of ALL) m.n = 0; if (K.G.region !== 0 || K.phase !== 'field' && !(K.B && K.B.active)) return; const R = K.REG[0]; if (!R || !R.beacons) return; wall();
    for (const b of R.beacons) { if (!isTree(b)) continue; const yaw = b.i * .7, m = MV[b.i], top = onTree(b);
      if (top && !b.treeFire) { b.treeFire = 1; b.fireAt = [b.x, b.y + 4.75 * TS, b.z]; } /* 灯は 花の 位置で ともる */
      m.body.set(m.body.n++, b.x, b.y, b.z, TS, yaw); const L = b.lit ? m.lit : m.dim; L.set(L.n++, b.x, b.y, b.z, TS, yaw);
      if (top) { const F = b.lit ? mBloom : mBud; F.set(F.n++, b.x, b.y, b.z, TS, yaw); } } });
  K.tomoTree = { TREES, isTree };
})();

// ---------------- 灯の樹 P3：実り（ともした 樹の まわりに 花と 実の しげみ） ----------------
// ・ともした 樹から 半径 8〜38m に 花（約60）と 灯の実の しげみ（3つ）。ともした 直後は 3秒かけて 根元から 外へ ひろがる
// ・しげみは しらべると 木の実を 1こ（ゲーム内 1日に 1回。G.treeFruit だけ 追加）。地形・道・建物は うごかさない
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const W = World, H = K.HOOK;
  const C = (c, e = 0) => () => [c[0], c[1], c[2], e];
  const FL = [[1, .62, .72], [1, .86, .42], [.72, .66, 1], [1, 1, .9], [.55, .82, 1]];
  const fGeo = col => { const g = W.Geo(); W.seg(g, [0, 0, 0], [0, .62, 0], .03, .025, 4, C([.3, .55, .25])); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; W.ico(g, .12, [Math.cos(a) * .15, .66, Math.sin(a) * .15], C(col, .35), 0, 0, .55); } W.ico(g, .08, [0, .68, 0], C([1, .9, .4], .4), 0, 0, 1); return g; }; // 草より 上に 花が 出る 高さ
  const mF = FL.map(c => W.makeMesh(fGeo(c), 90));
  const bGeo = W.Geo(); W.ico(bGeo, .7, [0, .5, 0], W.shade([.3, .55, .28], .15), .25, 1, .8); for (const [x, y, z] of [[.4, .8, .3], [-.35, .9, -.2], [.1, 1.05, -.45], [-.2, .6, .5]]) W.ico(bGeo, .12, [x, y, z], C([1, .82, .35], .9), 0, 0, 1);
  const bEmpty = W.Geo(); W.ico(bEmpty, .7, [0, .5, 0], W.shade([.3, .55, .28], .15), .25, 1, .8);
  const mBush = W.makeMesh(bGeo, 16), mBushE = W.makeMesh(bEmpty, 16);
  const rnd = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const spots = {}, litAt = {};
  function spotsOf(b) { if (spots[b.i]) return spots[b.i]; if (W.region !== 0) return null; const fl = [], bu = [];
    for (let p = 0; p < 16; p++) { const a = rnd(b.i + 'a' + p) * 6.283, d = 6 + rnd(b.i + 'd' + p) * 24, cx = b.x + Math.cos(a) * d, cz = b.z + Math.sin(a) * d, col = p % FL.length; // 花畑（16か所に かたまって 咲く）
      for (let k = 0; k < 10; k++) { const r = rnd(b.i + 'r' + p + k) * 2.4, t = rnd(b.i + 't' + p + k) * 6.283, x = cx + Math.cos(t) * r, z = cz + Math.sin(t) * r, h = K.hAt(x, z);
        if (h < .6 || Math.abs(h - b.y) > 16 || K.blocked(x, z, h + .2) || (K.road0 && K.road0.onRoad(x, z, .4))) continue; fl.push({ x, z, y: K.surfaceAt(x, z, h + 2), c: (col + (k % 3 === 0 ? 1 : 0)) % FL.length, s: .8 + rnd(b.i + 's' + p + k) * .6, d: Math.hypot(x - b.x, z - b.z) }); } }
    for (let k = 0; k < 40 && bu.length < 3; k++) { const a = k * 2.4 + b.i, d = 10 + (k % 4) * 3, x = b.x + Math.cos(a) * d, z = b.z + Math.sin(a) * d, h = K.hAt(x, z);
      if (h < .6 || Math.abs(h - b.y) > 6 || K.blocked(x, z, h + .2) || (K.road0 && K.road0.onRoad(x, z, 1))) continue; bu.push({ x, z, y: K.surfaceAt(x, z, h + 2), key: 'tb' + b.i + '_' + bu.length, d }); }
    return (spots[b.i] = { fl, bu }); }
  const day = () => Math.floor(((K.G.play || 0) / 480) + (K.G.tod || 0)); // だいたい ゲーム内の 1日
  const picked = s => ((K.G.treeFruit || {})[s.key] | 0) === day() + 1;
  H.frame.push((dt, T) => { for (const m of mF) m.n = 0; mBush.n = mBushE.n = 0; if (K.G.region !== 0 || K.phase !== 'field') return; const R = K.REG[0], pl = K.player; if (!R || !R.beacons) return;
    for (const b of R.beacons) { if (!b.lit) { litAt[b.i] = null; continue; } if (Math.hypot(b.x - pl.x, b.z - pl.z) > 110) continue; const S = spotsOf(b); if (!S) continue;
      if (litAt[b.i] == null) litAt[b.i] = b.t != null && b.t < 2 ? T : -1e9; const grow = Math.min(1, (T - litAt[b.i]) / 3) * 40; // 根元から 外へ
      for (const f of S.fl) { if (f.d - 8 > grow) continue; const m = mF[f.c]; if (m.n < m.maxN) m.set(m.n++, f.x, f.y, f.z, 1.5 * f.s * Math.min(1, (grow - f.d + 8) / 4), f.c); /* 草より 高く */ }
      for (const s of S.bu) { if (s.d - 8 > grow) continue; const m = picked(s) ? mBushE : mBush; m.set(m.n++, s.x, s.y, s.z, 1.5, s.d); } } });
  H.target.push(cand => { if (K.G.region !== 0) return; for (const b of K.REG[0].beacons || []) { if (!b.lit || !spots[b.i]) continue; for (const s of spots[b.i].bu) cand({ s }, 'treeFruit', s.x, s.z, 1.8); } });
  H.labels.treeFruit = t => picked(t.o.s) ? '灯の実の しげみ（また あした）' : '灯の実を つむ';
  H.acts.treeFruit = async ({ s }) => { if (picked(s)) { K.toast('今日は もう つんだ。 あしたには また なっている。', 1600); return; }
    const g = K.G; g.treeFruit = g.treeFruit || {}; g.treeFruit[s.key] = day() + 1; K.gain('mi', 1); try { Music.sfx('pick'); } catch (_) {} K.toast('灯の実の しげみから 木の実を つんだ！', 1600); K.hud(); K.save(); };
  H.load.push(g => { g.treeFruit = g.treeFruit || {}; });
  K.tomoTree = Object.assign(K.tomoTree || {}, { bloomSpots: spotsOf, day }); Object.defineProperty(K.tomoTree, 'bloomN', { get: () => mF.reduce((a, m) => a + m.n, 0) + mBush.n + mBushE.n });
})();
