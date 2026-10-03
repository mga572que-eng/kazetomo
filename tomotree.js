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
