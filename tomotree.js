// 灯の樹（ともしびのき）— 灯台の 全面一新 P1：見た目（docs/design/tomoshibi-tree.md）
// ・島の 灯台の 石の 塔を、根・幹・枝・葉の 傘と「灯の花」を もつ 大きな 樹に かえる（まずは 野原 1本。残りは P2 以降）
// ・ともる前：葉が くすみ、花は つぼみ／ともったあと：葉が 明るく、花が ひらいて 光る
// ・灯の 位置（b.fireAt）は 幹の わかれめ（高さ 約4）なので、いまの 光・番人・扉の 位置は そのまま
// ・幹には 見えない かべ（ブロック 19）を 置いて、通りぬけない。セーブ・ID・進行は かえない
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const W = World, H = K.HOOK;
  const TREES = [0], TS = 1.8; // TS＝大きさ（まわりの 木より ひとまわり 大きく、遠くから 目じるしに） // 灯の樹に した 灯台（REG[0].beacons の 番号）。P2 以降で ふやす
  const V = W.V, C = (h, e = 0) => { const n = parseInt(h.slice(1), 16); return () => [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, e]; };
  const S = (c, v = .12, e = 0) => W.shade(c, v, e);
  // ---- 幹・根・枝（ともる前後で 共通） ----
  const body = W.Geo(), bark = S([.42, .29, .19], .14), barkD = S([.33, .22, .15], .12);
  W.seg(body, [0, -.6, 0], [0, 4.2, 0], 1.25, .85, 9, bark);
  for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + .3, L = 2.6 + (k % 2) * .8; W.seg(body, [Math.cos(a) * .7, .5, Math.sin(a) * .7], [Math.cos(a) * L, -.35, Math.sin(a) * L], .55, .18, 6, barkD); }
  const BR = [[2.8, 7.2, .4], [-2.6, 7.6, -1.2], [.6, 8.4, 2.6], [-1, 7, -2.9], [2, 6.4, -2.4]];
  for (const [x, y, z] of BR) W.seg(body, [0, 3.9, 0], [x, y, z], .5, .22, 6, bark);
  // ---- 葉の 傘（くすみ／明るい） ----
  const leaves = col => { const g = W.Geo(); for (const [x, y, z] of BR) W.ico(g, 1.9, [x, y + .6, z], S(col, .18), .25, 1, .8); W.ico(g, 2.4, [0, 9.2, 0], S(col, .18), .25, 1, .8); W.ico(g, 1.6, [.8, 10.6, -.4], S(col, .18), .2, 1, .8); return g; };
  const gDim = leaves([.36, .45, .33]), gLit = leaves([.44, .74, .38]);
  // ---- 灯の花（つぼみ／ひらいた 花） ----
  const gBud = W.Geo(); W.ico(gBud, .55, [0, 4.6, 0], C('#b7a27a'), .1, 1, 1.3); W.ico(gBud, .25, [0, 5.2, 0], C('#d8c48a'), .1, 1, 1);
  const gBloom = W.Geo(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; W.seg(gBloom, [0, 4.4, 0], [Math.cos(a) * 1.15, 4.95, Math.sin(a) * 1.15], .42, .1, 5, C('#ffd9a0', .6)); }
  W.ico(gBloom, .5, [0, 4.75, 0], C('#fff3c4', 1), 0, 1, 1); W.ico(gBloom, .14, [.9, 9.6, .6], C('#ffe28a', 1), 0, 1, 1); W.ico(gBloom, .14, [-1.4, 8.4, -.8], C('#ffe28a', 1), 0, 1, 1); W.ico(gBloom, .14, [1.6, 7.6, -1.8], C('#ffe28a', 1), 0, 1, 1);
  const N = 5, mBody = W.makeMesh(body, N), mDim = W.makeMesh(gDim, N), mLit = W.makeMesh(gLit, N), mBud = W.makeMesh(gBud, N), mBloom = W.makeMesh(gBloom, N);
  const isTree = b => TREES.includes(b.i);
  H.beaconScale = b => isTree(b) ? 0 : 1; // game.js：石の 塔は 描かない
  // ---- 幹の 見えない かべ ----
  let walled = false;
  function wall() { const R = K.REG[0]; if (walled || !R || !R.beacons) return; walled = true; const prev = W.region; W.setRegion(0);
    try { for (const b of R.beacons) if (isTree(b)) { const cx = Math.floor(b.x), cz = Math.floor(b.z), y0 = Math.floor(b.y); for (let i = -2; i <= 1; i++) for (let j = -2; j <= 1; j++) for (let y = y0; y <= y0 + 5; y++) if (Math.hypot(i + .5, j + .5) < 2.1) if (!K.blocked(cx + i + .5, cz + j + .5, y + .5)) W.Blocks.set(cx + i, y, cz + j, 19, true, 0); } }
    finally { W.setRegion(prev); } }
  H.frame.push(() => { for (const m of [mBody, mDim, mLit, mBud, mBloom]) m.n = 0; if (K.G.region !== 0 || K.phase !== 'field' && !(K.B && K.B.active)) return; const R = K.REG[0]; if (!R || !R.beacons) return; wall();
    for (const b of R.beacons) { if (!isTree(b)) continue; const yaw = b.i * .7; if (!b.treeFire) { b.treeFire = 1; b.fireAt = [b.x, b.y + 4.75 * TS, b.z]; } /* 灯は 花の 位置で ともる */ mBody.set(mBody.n++, b.x, b.y, b.z, TS, yaw); const L = b.lit ? mLit : mDim; L.set(L.n++, b.x, b.y, b.z, TS, yaw); const F = b.lit ? mBloom : mBud; F.set(F.n++, b.x, b.y, b.z, TS, yaw); } });
  K.tomoTree = { TREES, isTree };
})();
