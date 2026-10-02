// ともしびアイランド — 地域の かざり（描画専用のインスタンスメッシュ）
// 海の底：魚の群れ・泡の柱・サンゴ・大きな貝・コンブ・ちょうちん魚 ／ 雲の里ククル：屋根の 雲わた・風鈴・のぼり・風車 ／ シオミ：桟橋・小舟・土の道
'use strict';
(() => {
  const K = window.KZ; if (!K || !World.makeMesh || !World.Geo) return;
  const W = World, V = W.V, Geo = W.Geo, prism = W.prism, ico = W.ico, seg = W.seg, solid = W.solid, shade = W.shade;
  let sd = 5150; const rn = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
  const tri = (G, a, b, c, col) => { const n = V.norm(V.cross(V.sub(b, a), V.sub(c, a))); for (const v of [a, b, c]) { G.p.push(...v); G.n.push(...n); G.c.push(...col); } };
  const quad = (G, a, b, c, d, col) => { tri(G, a, b, c, col); tri(G, a, c, d, col); };
  const hsh = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };

  // ---------------- 形 ----------------
  function fishGeo(body, belly, fin) { const G = Geo(); // +z が 頭
    seg(G, [0, 0, -.28], [0, 0, .02], .03, .13, 6, solid(body)); seg(G, [0, 0, .02], [0, 0, .3], .13, .02, 6, solid(belly));
    tri(G, [0, 0, -.26], [0, .15, -.46], [0, -.15, -.46], fin); tri(G, [0, .1, .02], [0, .2, -.12], [0, .08, -.16], fin);
    for (const sx of [-1, 1]) { const e = [sx * .085, .04, .19]; ico(G, .025, e, solid([.05, .05, .08], .3), 0, 0); } return G; }
  const lanternFishGeo = () => { const G = Geo(); seg(G, [0, 0, -.35], [0, 0, .05], .04, .2, 6, solid([.12, .16, .26])); seg(G, [0, 0, .05], [0, -.02, .34], .2, .06, 6, solid([.16, .2, .32]));
    tri(G, [0, 0, -.32], [0, .2, -.58], [0, -.2, -.58], [.2, .3, .5, .3]); seg(G, [0, .16, .18], [0, .45, .42], .015, .012, 3, solid([.3, .35, .45]));
    ico(G, .09, [0, .47, .46], solid([1, .85, .4], 1), 0, 1, 1); ico(G, .035, [.1, .05, .28], solid([.9, 1, .9], 1), 0, 0); ico(G, .035, [-.1, .05, .28], solid([.9, 1, .9], 1), 0, 0); return G; };
  const bubbleGeo = () => { const G = Geo(); ico(G, .1, [0, 0, 0], solid([.78, .95, 1], .45), 0, 1, 1); return G; };
  function coralGeo(kind) { const G = Geo(); const cols = kind ? [[.66, .38, .9], [.85, .5, 1]] : [[1, .45, .45], [1, .66, .32]];
    ico(G, .5, [0, .15, 0], shade([.55, .5, .45], .1), .3, 0, .5);
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + rn(), r = .15 + rn() * .3, h = .9 + rn() * 1.1, c = solid(cols[i % 2], .25);
      const b = [Math.cos(a) * r, .2, Math.sin(a) * r], t = [Math.cos(a) * (r + .4), h, Math.sin(a) * (r + .4)]; seg(G, b, t, .09, .05, 5, c);
      ico(G, .1, t, c, 0, 0); const m = V.scale(V.add(b, t), .5); seg(G, m, V.add(m, [Math.cos(a + 1) * .3, .45, Math.sin(a + 1) * .3]), .06, .03, 4, c); } return G; }
  function shellGeo() { const G = Geo(); const hinge = [0, .12, -.8], n = 9, rib = shade([1, .82, .74], .06);
    for (let i = 0; i < n; i++) { const a0 = -1.2 + i / n * 2.4, a1 = -1.2 + (i + 1) / n * 2.4, up = k => .55 + .5 * Math.cos(k * 1.3);
      const P = (a, r) => [Math.sin(a) * r, .12 + up(a) * r * .9, -.8 + Math.cos(a) * r], c = i % 2 ? [1, .86, .8, .1] : [.98, .72, .7, .1];
      tri(G, hinge, P(a0, 1.7), P(a1, 1.7), c); seg(G, hinge, P(a0, 1.72), .03, .05, 4, rib); }
    for (let i = 0; i < n; i++) { const a0 = -1.2 + i / n * 2.4, a1 = -1.2 + (i + 1) / n * 2.4; tri(G, hinge, [Math.sin(a1) * 1.7, .05, -.8 + Math.cos(a1) * 1.7], [Math.sin(a0) * 1.7, .05, -.8 + Math.cos(a0) * 1.7], [.9, .7, .64, 0]); }
    ico(G, .22, [0, .35, .25], solid([1, .97, .92], .8), 0, 1, 1); return G; }
  function kelpGeo() { const G = Geo(); let p = [0, 0, 0]; const c = shade([.22, .42, .2], .12);
    for (let i = 0; i < 7; i++) { const q = [Math.sin(i * 1.3) * .25, p[1] + .9, Math.cos(i * 1.7) * .2]; seg(G, p, q, .07, .06, 4, c);
      const s = i % 2 ? 1 : -1; tri(G, q, V.add(q, [s * .55, -.35, .1]), V.add(q, [s * .15, -.7, 0]), [.35, .55, .22, 0]); p = q; }
    ico(G, .14, p, solid([.5, .6, .25]), .2, 0); return G; }
  function puffGeo() { const G = Geo(); const w = shade([.99, .98, 1], .03, .35);
    [[0, .5, 0, .62], [-.55, .35, .1, .45], [.55, .35, -.05, .48], [.1, .38, .5, .42], [-.1, .4, -.5, .44], [.2, .95, 0, .4]].forEach(([x, y, z, r]) => ico(G, r, [x, y, z], w, .12, 1, .85)); return G; }
  function chimeGeo() { const G = Geo(); // 上端 y=0 から 下へ
    seg(G, [0, 0, 0], [0, -.3, 0], .012, .012, 3, solid([.3, .25, .2])); prism(G, .16, .12, -.38, -.3, 8, solid([.95, .8, .4], .3));
    for (let k = 0; k < 4; k++) { const a = k / 4 * 6.283; seg(G, [Math.cos(a) * .1, -.4, Math.sin(a) * .1], [Math.cos(a) * .1, -.75 - k * .06, Math.sin(a) * .1], .025, .025, 5, solid([.6, .95, 1], .55)); }
    seg(G, [0, -.4, 0], [0, -1.05, 0], .006, .006, 3, solid([.9, .9, .9])); quad(G, [-.07, -1.05, 0], [.07, -1.05, 0], [.07, -1.3, 0], [-.07, -1.3, 0], [.8, 1, .95, .4]); return G; }
  function bannerGeo(c1, c2) { const G = Geo(); seg(G, [0, 0, 0], [0, 4.6, 0], .06, .045, 6, solid([.55, .4, .25])); ico(G, .1, [0, 4.65, 0], solid([1, .85, .4], .5), 0, 0);
    seg(G, [0, 4.35, 0], [.95, 4.35, 0], .02, .02, 3, solid([.55, .4, .25]));
    for (let k = 0; k < 5; k++) { const y0 = 4.35 - k * .36, y1 = y0 - .36; quad(G, [.05, y0, 0], [.95, y0, 0], [.95, y1, 0], [.05, y1, 0], k % 2 ? c2 : c1); }
    tri(G, [.05, 2.55, 0], [.95, 2.55, 0], [.5, 2.2, 0], c1); return G; }
  function millBaseGeo() { const G = Geo(); prism(G, 1.5, 1.1, 0, 5.2, 8, shade([.9, .88, .82], .06)); prism(G, 1.35, .2, 5.2, 6.3, 8, shade([.3, .6, .75], .06));
    prism(G, .35, .35, 0, 1.6, 4, solid([.45, .3, .2]), 0, 1.45, 1, .3); ico(G, .7, [0, 6.35, 0], shade([.99, .98, 1], .03, .35), .15, 1, .6); return G; }
  function millRotorGeo() { const G = Geo(); seg(G, [0, 4.4, 0], [0, 8.6, 0], .08, .06, 6, solid([.5, .36, .22]));
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283, d = [Math.cos(a), 0, Math.sin(a)], t = [-Math.sin(a), 0, Math.cos(a)];
      seg(G, [0, 8.2, 0], [d[0] * 2.6, 8.2, d[2] * 2.6], .04, .03, 4, solid([.5, .36, .22])); seg(G, [0, 4.9, 0], [d[0] * 2.6, 4.9, d[2] * 2.6], .04, .03, 4, solid([.5, .36, .22]));
      const c = k % 2 ? [1, 1, .97, .25] : [.55, .85, .95, .25], P = (r, y, s) => [d[0] * r + t[0] * s, y, d[2] * r + t[2] * s];
      quad(G, P(.5, 8.1, 0), P(2.5, 8.1, 0), P(2.5, 5.0, .55), P(.5, 5.0, .55), c); } return G; }
  function boatGeo() { const G = Geo(); prism(G, .55, .8, -.25, .35, 8, shade([.55, .36, .2], .08), 0, 0, 1, 2.6); prism(G, .72, .72, .35, .42, 8, shade([.7, .5, .3], .06), 0, 0, 1, 2.45);
    prism(G, .5, .5, -.05, .05, 4, solid([.4, .28, .16]), 0, 0, 1.1, .12); seg(G, [.2, .4, -.3], [.9, .1, -.9], .025, .025, 3, solid([.6, .45, .3])); return G; }
  const postGeo = () => { const G = Geo(); prism(G, .13, .12, -2.5, 1.35, 6, shade([.42, .3, .18], .08)); prism(G, .17, .17, 1.2, 1.3, 6, solid([.8, .75, .6])); return G; };

  const M = (G, n, o) => W.makeMesh(G, n, o);
  const m = {
    fishA: M(fishGeo([.42, .6, .82], [.85, .92, .96], [.5, .75, .95, .1]), 60, { cast: false }), fishB: M(fishGeo([1, .66, .25], [1, .9, .7], [1, .5, .3, .2]), 48, { cast: false }),
    lfish: M(lanternFishGeo(), 10, { cast: false }), bubble: M(bubbleGeo(), 72, { cast: false }), coralA: M(coralGeo(0), 12), coralB: M(coralGeo(1), 10), shell: M(shellGeo(), 5), kelp: M(kelpGeo(), 22, { sway: 1 }),
    puff: M(puffGeo(), 14), chime: M(chimeGeo(), 8, { cast: false }), banA: M(bannerGeo([.3, .75, .85, .2], [1, 1, .96, .2]), 4, { sway: 1 }), banB: M(bannerGeo([1, .78, .35, .2], [1, 1, .96, .2]), 4, { sway: 1 }),
    mill: M(millBaseGeo(), 1), rotor: M(millRotorGeo(), 1), boat: M(boatGeo(), 3), post: M(postGeo(), 10),
  };
  const all = Object.values(m);

  // ---------------- 配置（その地域の 高さマップが 有効な ときに 一度だけ） ----------------
  const P = [null, null, null, null];
  const topAt = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z); let y = Math.floor(K.hAt(x, z)) + 20; for (; y > -40; y--) if (W.Blocks.has(ix, y, iz)) return y + 1; return K.hAt(x, z); };
  const freeSpot = (R, list, x, z, rr) => !(R.houses || []).some(h => Math.hypot(h.x - x, h.z - z) < 5.8) && !list.some(p => Math.hypot(p[0] - x, p[1] - z) < rr)
    && !['statue', 'fire', 'board'].some(k => R[k] && Math.hypot(R[k].x - x, R[k].z - z) < 3) && !W.Blocks.has(Math.floor(x), Math.floor(K.hAt(x, z)) + 1, Math.floor(z));
  function ring(R, n, r0, r1, rr, avoid) { const out = [], T = R.town; for (let k = 0; k < 400 && out.length < n; k++) { const a = rn() * 6.283, d = r0 + rn() * (r1 - r0), x = T.x + Math.cos(a) * d, z = T.z + Math.sin(a) * d;
    if (avoid && avoid(x, z)) continue; if (freeSpot(R, out, x, z, rr)) out.push([x, z, K.hAt(x, z), rn() * 6.283, .8 + rn() * .5]); } return out; }
  function place3() { const R = K.REG[3], T = R.town, road = (x, z) => Math.abs(x - T.x) < 3.5 && z > T.z;
    const o = { coral: ring(R, 20, 17, 38, 3.2, road), shell: ring(R, 5, 20, 36, 6, road), kelp: ring(R, 14, 18, 40, 2.2, road) };
    for (const L of R.lh || []) for (let k = 0; k < 2; k++) { const a = rn() * 6.283, x = L.x + Math.cos(a) * 7, z = L.z + Math.sin(a) * 7; o.kelp.push([x, z, K.hAt(x, z), rn() * 6, 1]); }
    o.vents = ring(R, 5, 14, 30, 6, road).concat((R.lh || []).map(L => [L.x + 4, L.z + 3, K.hAt(L.x + 4, L.z + 3)]));
    o.schools = [[T.x, T.z, 13, 0], [T.x + 30, T.z - 40, 11, 1], ...(R.lh || []).map((L, i) => [L.x, L.z, 10, i % 2]), [W.PALACE3[0], W.PALACE3[1] + 30, 14, 1]].map(([x, z, r, kind], i) => ({ x, z, r, kind, ph: i * 1.7, sp: .12 + .05 * (i % 3) }));
    o.lamps = [[T.x - 7, T.z + 7], [T.x + 7, T.z + 7], [T.x - 7, T.z - 8], [T.x + 7, T.z - 8], [T.x - 4, T.z + 5], [T.x + 4, T.z + 3]]; return o; }
  function place2() { const R = K.REG[2], T = R.town, o = { roofs: [], chimes: [], banners: [] };
    for (const h of R.houses || []) { const cx = Math.round(h.x), cz = Math.round(h.z), top = topAt(cx + .5, cz + .5); o.roofs.push([cx + .5, top - .35, cz + .5, 1.15, hsh(cx, cz) * 6]);
      o.roofs.push([cx + .5 + 2.1, top - 2.4, cz + .5 - 1.2, .75, 1], [cx + .5 - 1.6, top - 2.4, cz + .5 + 2, .7, 2]);
      const dx = Math.sign(T.x - cx) || 1, dz = Math.sign(T.z - cz) || 1; o.chimes.push([cx + .5 + dx * 3.2, top - 4, cz + .5 + dz * 3.2], [cx + .5 - dx * 3.2, top - 4, cz + .5 + dz * 3.2]); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + .39, x = T.x + Math.cos(a) * 9.5, z = T.z + Math.sin(a) * 9.5; if (freeSpot(R, o.banners, x, z, 3)) o.banners.push([x, z, K.hAt(x, z), -a]); }
    let best = null; for (let k = 0; k < 36; k++) { const a = k / 36 * 6.283; for (const d of [24, 28, 32]) { const x = T.x + Math.cos(a) * d, z = T.z + Math.sin(a) * d, h = K.hAt(x, z); let lo = 1e9; for (const [i, j] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) lo = Math.min(lo, K.hAt(x + i, z + j));
      if (lo < 8 || Math.abs(z - (R.pier ? R.pier.z : 1e9)) < 8 && Math.abs(x - T.x) < 5 || !freeSpot(R, [], x, z, 0)) continue; const sc = h - lo + Math.abs(a - 5.5) * .3; if (!best || sc < best.sc) best = { x, z, y: lo, sc }; } }
    o.mill = best; return o; }
  function place0() { const S = K.shiomi; if (!S) return { none: 1 }; const o = { boats: [], posts: [] };
    let best = null; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { for (let d = 10; d < 160; d++) { if (K.hAt(S.x + dx * d, S.z + dz * d) < -.4) { if (!best || d < best.d) best = { d, dx, dz }; break; } } }
    const segs = [[S.x, S.z, S.x, S.z, 3.2]];
    K.NPCS.filter(n => n.r === 0 && Math.hypot(n.x - S.x, n.z - S.z) < 20 && n.id !== 'chibi').forEach(n => segs.push([S.x, S.z, n.x, n.z, .85]));
    if (best) { const { d, dx, dz } = best, px = -dz, pz = dx; let sx = Math.round(S.x + dx * (d - 5)), sz = Math.round(S.z + dz * (d - 5));
      for (let i = 0; i < 16; i++) { const cx = sx + dx * i, cz = sz + dz * i; for (let w = -1; w <= 1; w++) { const x = cx + px * w, z = cz + pz * w, t = Math.floor(K.hAt(x + .5, z + .5)); if (t > 1) continue; W.Blocks.set(x, Math.max(0, Math.min(t, 1)), z, 0, true, 0); }
        if (i % 4 === 3) for (const w of [-1.55, 1.55]) o.posts.push([cx + .5 + px * w, cz + .5 + pz * w, 0]); }
      const ex = sx + dx * 15 + .5, ez = sz + dz * 15 + .5, yaw = Math.atan2(dx, dz);
      o.boats.push([ex + px * 3.2 - dx * 3, ez + pz * 3.2 - dz * 3, yaw + .15], [ex - px * 3.4 - dx * 6, ez - pz * 3.4 - dz * 6, yaw - .2], [ex + px * 2.5 + dx * 4, ez + pz * 2.5 + dz * 4, yaw + 1.2]);
      segs.push([S.x, S.z, sx + .5 - dx * 1, sz + .5 - dz * 1, 1.05]); }
    W.setPaths(0, [...segs.slice(0, 8), ...(K.road0 ? K.road0.segs() : [])]); return o; } // シオミは これまでどおり 先頭8本、残りに 風見の村→野原の灯台の 道
  const PLACE = [place0, null, place2, place3];

  // ---------------- 毎フレーム ----------------
  K.HOOK.frame.push((dt, T) => {
    for (const x of all) x.n = 0;
    const r = K.region; if (W.region !== r || !PLACE[r]) return; if (!P[r]) P[r] = PLACE[r]();
    const o = P[r], pl = K.player, near = (x, z, d) => Math.abs(x - pl.x) < d && Math.abs(z - pl.z) < d; const add = (mm, x, y, z, s, yaw) => { if (mm.n < mm.maxN) mm.set(mm.n++, x, y, z, s, yaw); };
    if (r === 3) {
      o.coral.forEach((c, i) => add(i % 2 ? m.coralB : m.coralA, c[0], c[2] - .1, c[1], c[4] * 1.1, c[3]));
      o.shell.forEach(c => add(m.shell, c[0], c[2] - .05, c[1], c[4] * 1.2, c[3]));
      o.kelp.forEach(c => add(m.kelp, c[0], c[2] - .1, c[1], c[4], c[3]));
      for (const v of o.vents) { if (!near(v[0], v[1], 120)) continue; for (let k = 0; k < 8; k++) { const f = (T * .22 + k / 8 + v[0] * .01) % 1; add(m.bubble, v[0] + Math.sin(T * 2 + k * 1.9) * .25 * f, v[2] + .3 + f * 11, v[1] + Math.cos(T * 1.7 + k) * .25 * f, .5 + f * 1.1, 0); } }
      for (const sc of o.schools) { if (!near(sc.x, sc.z, 130)) continue; const a = T * sc.sp + sc.ph, cx = sc.x + Math.cos(a) * sc.r, cz = sc.z + Math.sin(a) * sc.r, cy = K.hAt(cx, cz) + 4.5 + Math.sin(T * .4 + sc.ph) * 1.2;
        const yaw = Math.atan2(-Math.sin(a), Math.cos(a)), mm = sc.kind ? m.fishB : m.fishA;
        for (let i = 0; i < 12; i++) { const u = i * 2.39996, rr = .5 + (i % 4) * .45, w = Math.sin(T * 2.6 + i) * .25;
          add(mm, cx + Math.cos(u) * rr + w, cy + Math.sin(u * 1.7) * .8, cz + Math.sin(u) * rr, .9 + (i % 3) * .15, yaw + Math.sin(T * 3 + i) * .18); } }
      o.lamps.forEach((l, i) => { const a = T * .5 + i * 1.3; add(m.lfish, l[0] + Math.cos(a) * 2.2, K.hAt(l[0], l[1]) + 3.2 + Math.sin(T + i) * .4, l[1] + Math.sin(a) * 2.2, 1.1, Math.atan2(-Math.sin(a), Math.cos(a))); });
    } else if (r === 2) {
      o.roofs.forEach(c => add(m.puff, c[0], c[1] + Math.sin(T * .6 + c[4]) * .06, c[2], c[3], c[4]));
      o.chimes.forEach((c, i) => add(m.chime, c[0], c[1], c[2], 1, Math.sin(T * 1.3 + i) * .6));
      o.banners.forEach((b, i) => add(i % 2 ? m.banB : m.banA, b[0], b[2] - .05, b[1], 1, b[3]));
      if (o.mill) { add(m.mill, o.mill.x, o.mill.y - .2, o.mill.z, 1, 0); add(m.rotor, o.mill.x, o.mill.y - .2, o.mill.z, 1, T * .7); }
    } else if (r === 0 && !o.none) {
      o.boats.forEach((b, i) => add(m.boat, b[0], -.12 + Math.sin(T * .9 + i * 2) * .07, b[1], 1, b[2] + Math.sin(T * .5 + i) * .05));
      o.posts.forEach(p => add(m.post, p[0], 0, p[1], 1, 0));
    }
  });
})();

// ---------------- 風見の村 → 野原の灯台の 道（品質の基準区間） ----------------
// 道を 1本（地形シェーダの 道）＋ 分かれ道の 道しるべ ＋ 灯の 石（2つ）。道ぞいの 木と 岩は 消して 灯台への 見通しを つくる。
// 灯台・村の 位置、セーブ、進行は かえない（木は 他の 町と 同じく state='gone'。保存されない）。
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const W = World, H = K.HOOK;
  let P = null, cleared = false;
  function pts() { if (P) return P; const R = K.REG && K.REG[0], T = R && R.town, b = R && R.beacons && R.beacons[0]; if (!T || !b) return null;
    const dx = b.x - T.x, dz = b.z - T.z, L = Math.hypot(dx, dz); if (L < 30) return null; const px = -dz / L, pz = dx / L;
    const at = (t, off) => [T.x + dx * t + px * off, T.z + dz * t + pz * off];
    return (P = [at(10 / L, 0), at(.33, 4), at(.62, -3), at(1 - 8 / L, 0)]); }
  const segs = () => { const p = pts(); if (!p) return []; const o = []; for (let i = 0; i < p.length - 1; i++) o.push([p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], 1.1]); return o; };
  const dSeg = (x, z, s) => { const ax = s[2] - s[0], az = s[3] - s[1], t = Math.max(0, Math.min(1, ((x - s[0]) * ax + (z - s[1]) * az) / (ax * ax + az * az || 1))); return Math.hypot(x - s[0] - ax * t, z - s[1] - az * t); };
  const onRoad = (x, z, w = 0) => segs().some(s => dSeg(x, z, s) < 1.1 + w);
  // 形：道しるべ（柱と 矢じるしの 板）、灯の 石
  const sg = W.Geo(); W.prism(sg, .08, .08, 0, 1.7, 4, W.hex('#6a4a2e')); W.prism(sg, .55, .55, 1.28, 1.5, 4, W.hex('#d8b47a'), .32, 0, 1, .18); W.prism(sg, .42, .42, .98, 1.16, 4, W.hex('#b8925a'), -.24, 0, 1, .18);
  const lg = W.Geo(); W.prism(lg, .26, .18, 0, .75, 6, W.shade([.62, .6, .56], .08)); W.ico(lg, .13, [0, .88, 0], W.solid([1, .86, .5], 1), 0, 1, 1);
  const mSign = W.makeMesh(sg, 1), mLamp = W.makeMesh(lg, 2);
  function clear() { const R = K.REG && K.REG[0]; if (!R || !R.trees || !R.trees.length || !pts()) return; cleared = true; for (const t of [...R.trees, ...(R.rocks || [])]) if (onRoad(t.x, t.z, 1.6)) { t.state = 'gone'; t.t = -1e9; } }
  clear(); // 起動時に 1回（quests.js の シオミと 同じ やり方）
  const signAt = () => { const p = pts(); return p && { x: p[1][0] + 1.6, z: p[1][1] + 1.6 }; };
  H.frame.push(() => { mSign.n = 0; mLamp.n = 0; if (K.phase !== 'field' || K.G.region !== 0) return; const p = pts(); if (!p) return; const R = K.REG[0], pl = K.player;
    if (!cleared) clear();
    if (Math.hypot(pl.x - p[2][0], pl.z - p[2][1]) > 160) return; const b = R.beacons[0], s = signAt();
    mSign.set(0, s.x, K.hAt(s.x, s.z) - .05, s.z, 1.4, Math.atan2(b.z - s.z, b.x - s.x) * -1); mSign.n = 1;
    [p[2], [(p[2][0] + p[3][0]) / 2, (p[2][1] + p[3][1]) / 2]].forEach(([x, z], i) => { const ox = x + 1.7, oz = z - 1.7; mLamp.set(i, ox, K.hAt(ox, oz) - .05, oz, 1, 0); }); mLamp.n = 2; });
  H.target.push(cand => { if (K.G.region !== 0) return; const s = signAt(); if (s) cand({}, 'road0Sign', s.x, s.z, 2); });
  H.labels.road0Sign = '道しるべを 読む';
  // 見晴らし（小さな 発見）：丘の 上の 灯の石で あたりを 見わたすと、カメラが 灯台を 向き、仲間が 反応する。はじめての 1回だけ 木の実を 2つ（既存の 道具・少しだけ）
  const viewAt = () => { const p = pts(); return p && { x: p[2][0] + 1.7, z: p[2][1] - 1.7 }; };
  H.target.push(cand => { if (K.G.region !== 0) return; const v = viewAt(); if (v) cand({}, 'road0View', v.x, v.z, 2); });
  H.labels.road0View = 'あたりを 見わたす';
  H.acts.road0View = async () => { const g = K.G, b = K.REG[0].beacons[0], pl = K.player, first = !(g.flags && g.flags.road0View);
    if (K.cam) K.cam.yaw = Math.atan2(pl.x - b.x, pl.z - b.z);
    const L = ['丘の 上から、野原の灯台が よく 見える。', b.lit ? '灯台の てっぺんで、灯が ゆれている。' : '灯台の てっぺんは、まだ 暗い。'];
    const mio = K.inParty && K.inParty('mio'); if (mio && K.who) L.push(K.who('mio', 'smile', b.lit ? 'ここから 見ると、灯って ほんとに 遠くまで とどくんだね。' : 'あそこまで あと すこし！ 道を たどって いこう。'));
    if (first) { g.flags = g.flags || {}; g.flags.road0View = 1; K.gain('mi', 2); L.push('灯の石の かげに 木の実が 2つ おちていた！'); }
    await K.say(L); if (first) { K.hud(); K.save(); } };
  H.acts.road0Sign = async () => { const b = K.REG[0].beacons[0], s = signAt(), d = Math.round(Math.hypot(b.x - s.x, b.z - s.z));
    await K.say([`道しるべ：「→ 野原の灯台（${d}m）　← 風見の村」`, b.lit ? '灯台の 灯が、ここからでも 見える。' : 'この道を まっすぐ 行けば、灯台の ふもとに 出る。']); };
  // ---------- 風見の村：入口の 目じるし（屋外の 小物だけ。家の 形・中は さわらない） ----------
  // 食堂＝のれんと ちょうちん、工房＝金床と 金づちの 看板、家＝ポストと 植木ばち。入口の わき（外がわ 0.9m・横 1.4m）に 置き、通り道は ふさがない
  const FG = { cook: W.Geo(), smith: W.Geo(), home: W.Geo() };
  W.prism(FG.cook, .62, .62, 2.05, 2.75, 4, W.hex('#2c3e78'), 0, 0, 1.15, .06); W.prism(FG.cook, .08, .08, 0, 2.2, 4, W.hex('#5a3a22'), 1.25, 0); W.ico(FG.cook, .2, [1.25, 2.35, 0], W.solid([1, .55, .3], .9), 0, 1, 1.3);
  W.prism(FG.smith, .3, .22, 0, .45, 4, W.hex('#4a4a52'), 1.3, 0); W.prism(FG.smith, .34, .34, .45, .62, 4, W.hex('#6a6a74'), 1.3, 0, 1.4, .7); W.prism(FG.smith, .06, .06, 0, 2.1, 4, W.hex('#5a3a22'), -1.3, 0); W.prism(FG.smith, .36, .36, 1.6, 2.0, 4, W.hex('#9aa0a8'), -1.3, 0, 1.2, .15);
  W.prism(FG.home, .06, .06, 0, 1.0, 4, W.hex('#5a3a22'), 1.3, 0); W.prism(FG.home, .2, .2, 1.0, 1.28, 4, W.hex('#c0392b'), 1.3, 0, 1.3, .9); W.prism(FG.home, .22, .26, 0, .38, 6, W.hex('#b0643a'), -1.3, 0); W.ico(FG.home, .26, [-1.3, .6, 0], W.solid([.95, .55, .7], .15), .2, 1, 1);
  // シオミの 店：宿＝両わきの ちょうちんと 寝床の 看板、道具屋＝店先の 樽・木箱・ふくろ（訳ありの 家 s_pawn には つけない）
  FG.inn = W.Geo(); for (const sx of [-1.35, 1.35]) { W.prism(FG.inn, .07, .07, 0, 2.1, 4, W.hex('#5a3a22'), sx, 0); W.ico(FG.inn, .2, [sx, 2.25, 0], W.solid([1, .6, .32], .9), 0, 1, 1.3); }
  W.prism(FG.inn, .55, .55, 2.15, 2.6, 4, W.hex('#2f5d8a'), 0, 0, 1.2, .07); W.prism(FG.inn, .3, .3, 2.27, 2.42, 4, W.hex('#f4f0e6'), 0, .05, 1.3, .06);
  FG.shop = W.Geo(); W.prism(FG.shop, .26, .3, 0, .6, 8, W.hex('#8a5a2a'), 1.3, 0); W.prism(FG.shop, .3, .3, 0, .45, 4, W.hex('#a67a44'), 1.35, .55, 1, 1);
  W.ico(FG.shop, .28, [-1.3, .26, 0], W.solid([.85, .76, .55], .1), .25, 1, .85); W.ico(FG.shop, .14, [1.3, .7, 0], W.solid([.85, .3, .25], .2), .1, 1, 1);
  const mFront = { cook: W.makeMesh(FG.cook, 2), smith: W.makeMesh(FG.smith, 2), home: W.makeMesh(FG.home, 2), inn: W.makeMesh(FG.inn, 2), shop: W.makeMesh(FG.shop, 2) };
  const FRONT = { nagi: 'cook', gen: 'smith', yui: 'home', sinn: 'inn', sitem: 'shop' };
  const doorAt = h => { const dx = Math.sin(h.yaw), dz = Math.cos(h.yaw); return h.npc ? { x: h.npc.x - dx * 1.6, z: h.npc.z - dz * 1.6 } : { x: h.x + dx * 4.1, z: h.z + dz * 4.1 }; }; // 店番が 戸口に いない 店は 家の 中心から 4.1m（村の 3軒と 同じ 奥行き）
  const fronts = () => [...(K.REG[0].houses || []), ...(K.extraHouses || []).filter(h => h.r === 0)].filter(h => FRONT[h.id] && h.yaw != null).map(h => { const dx = Math.sin(h.yaw), dz = Math.cos(h.yaw), d = doorAt(h); return { id: h.id, k: FRONT[h.id], x: d.x + dx * .9, z: d.z + dz * .9, dx: d.x, dz: d.z, yaw: h.yaw }; });
  H.frame.push(() => { for (const k in mFront) mFront[k].n = 0; if (K.phase !== 'field' || K.G.region !== 0 || (K.interior && K.interior.cur)) return; const pl = K.player;
    for (const f of fronts()) { if (Math.hypot(f.x - pl.x, f.z - pl.z) > 70) continue; const m = mFront[f.k]; m.set(m.n++, f.x, K.hAt(f.x, f.z) - .02, f.z, 1, f.yaw); } });
  K.road0 = { pts, segs, onRoad, signAt, viewAt, fronts, get drawn() { return mSign.n + mLamp.n; } };
})();
