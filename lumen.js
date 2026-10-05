// ともしびの 移動（2026-10-06：ともしびゲージの 抜本的な 作りなおし。docs/design/lumen.md）
// ・ゲージは「ともしび」。走る・登る・ふわりで へり、灯りの そば（ランタン・ともした 灯の樹・町・たき火）で 一気に 満ちる。ほかは ゆっくり
// ・灯の実：崖や 空に うかぶ 光の 玉。ふれると ともしびが 半分 もどる（しばらくで また なる）
// ・風の道：空の 島どうしと 風の羽を つなぐ 光の 流れ。ふれると 運ばれる（ともしびを 使わない）。風の羽は 道の 上に ある
// ・記録は 増やさない（G.stam／G.stamMax の まま）
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const H = K.HOOK, W = World, B = W.Blocks, G = () => K.G;
  const P = () => K.player, rg = () => G().region;
  // ---------- 灯りの そば ----------
  let litCache = { t: -1, v: 0 };
  function lightNear() { const p = P(), r = rg(), R0 = K.REG[r]; if (!R0) return 0;
    if (R0.town && Math.hypot(p.x - R0.town.x, p.z - R0.town.z) < 30) return 1;
    if (R0.fire && Math.hypot(p.x - R0.fire.x, p.z - R0.fire.z) < 6) return 1;
    if (r === 0 && (R0.beacons || []).some(b => b.lit && Math.hypot(p.x - b.x, p.z - b.z) < 12)) return 1;
    if (r === 3 && (G().lh || []).some((v, i) => v && R0.lh && R0.lh[i] && Math.hypot(p.x - R0.lh[i].x, p.z - R0.lh[i].z) < 12)) return 1;
    const x0 = Math.floor(p.x), y0 = Math.floor(p.y), z0 = Math.floor(p.z); // ランタン（ブロック 2）
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) for (let dy = -1; dy <= 3; dy++) if (B.get(x0 + dx, y0 + dy, z0 + dz) === 2) return 1;
    return 0; }
  H.lightRegen = () => { const T = performance.now(); if (T - litCache.t > 250) litCache = { t: T, v: lightNear() }; return litCache.v ? 70 : 0; };
  K.lumen = { lightNear };
  // ---------- 灯の実 ----------
  const ORBS = [[], [], [], []];
  const SEED = r => { let s = 1234 + r * 977; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  for (let r = 0; r < 4; r++) { if (r === 3) continue; W.setRegion(r); const R0 = K.REG[r], rn = SEED(r), L = ORBS[r];
    if (r === 2) { for (const u of R0.updrafts || []) L.push({ x: u.x, z: u.z, y: u.top - 2 }); }
    // 高くて 急な ところ（崖の 上・山の 中腹）
    for (let k = 0; k < 6000 && L.length < (r === 2 ? 30 : 22); k++) { const x = (rn() - .5) * 460, z = (rn() - .5) * 460, h = K.hAt(x, z); if (r !== 2 && h < 14) continue; if (r === 2 && h < 8) continue;
      const sl = Math.abs(K.hAt(x + 3, z) - K.hAt(x - 3, z)) + Math.abs(K.hAt(x, z + 3) - K.hAt(x, z - 3)); if (sl < (r === 2 ? 6 : 5)) continue;
      if (L.some(o => Math.hypot(o.x - x, o.z - z) < 30)) continue; L.push({ x, z, y: h + 2.2 }); } }
  W.setRegion(0);
  const taken = {}; // key → 再び なる 時刻
  const gO = W.Geo(); W.ico(gO, .32, [0, 0, 0], () => [1, .86, .45, 1], .05, 1, 1); W.ico(gO, .55, [0, 0, 0], () => [1, .75, .3, .55], .05, 1, 1);
  const mO = W.makeMesh(gO, 40);
  // ---------- 風の道（空の 島） ----------
  const PATHS = [];
  { const R2 = K.REG[2], I = W.ISL2; if (R2 && I) {
      const S1 = I[2], fe = R2.feathers || []; // 風の羽の 輪：島の ふち → 3まいの 羽 → 島の ふちへ
      const edgeAt = (A, ang, out = 4, up = 2) => ({ x: A.x + Math.cos(ang) * (A.r + out), z: A.z + Math.sin(ang) * (A.r + out), y: A.h + up });
      if (fe.length) { const pts = [edgeAt(S1, 60 * Math.PI / 180, 2, 3)]; for (const f of fe) pts.push({ x: f.x, z: f.z, y: f.y + .3 }); pts.push(edgeAt(S1, 240 * Math.PI / 180, 2, 3)); PATHS.push({ id: 'feather', pts }); }
      // 島と 島：上昇気流の ある ふちどうしを 弧で つなぐ（行きも 帰りも）
      const pairs = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 8], [3, 6], [1, 5]];
      for (const [a, b] of pairs) { const A = I[a], Bi = I[b]; if (!A || !Bi) continue; const ang = Math.atan2(Bi.z - A.z, Bi.x - A.x), p0 = edgeAt(A, ang, 3, 2), p1 = edgeAt(Bi, ang + Math.PI, 3, 3);
        const mid = { x: (p0.x + p1.x) / 2, z: (p0.z + p1.z) / 2, y: Math.max(p0.y, p1.y) + 10 }; PATHS.push({ id: `i${a}-${b}`, pts: [p0, mid, p1] }); PATHS.push({ id: `i${b}-${a}`, pts: [p1, mid, p0] }); } } }
  // 道の 点を 細かく（1.5m ごと）
  for (const pa of PATHS) { const out = []; for (let k = 0; k + 1 < pa.pts.length; k++) { const a = pa.pts[k], b = pa.pts[k + 1], L = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z), n = Math.max(1, Math.ceil(L / 1.5));
      for (let i = 0; i < n; i++) { const t = i / n, s = Math.sin(t * Math.PI) * (k === 0 || k === pa.pts.length - 2 ? 0 : 0); out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t + s, z: a.z + (b.z - a.z) * t }); } }
    out.push(pa.pts[pa.pts.length - 1]); pa.d = out; }
  let ride = null; // { pa, i, f }
  const SPEED = 12;
  H.windRide = (dt, wx, wz, im) => { if (rg() !== 2 || !G().flags) return null; const p = P();
    if (!ride) { for (const pa of PATHS) { for (let i = 0; i < pa.d.length - 2; i++) { const q = pa.d[i]; if (Math.abs(q.x - p.x) < 3 && Math.abs(q.z - p.z) < 3 && Math.abs(q.y - p.y) < 3.2) { ride = { pa, i, f: 0 }; try { Music.sfx('wind'); } catch (e) {} K.toast('風の道に のった！', 900); break; } } if (ride) break; } }
    if (!ride) return null;
    let { pa, i, f } = ride; f += SPEED * dt / 1.5; while (f >= 1 && i < pa.d.length - 1) { f -= 1; i++; }
    if (i >= pa.d.length - 1) { ride = null; return null; } ride.i = i; ride.f = f;
    const a = pa.d[i], b = pa.d[i + 1], x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f, z = a.z + (b.z - a.z) * f, L = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    // 入力で すこし 横へ ずれられる（道の 上は ゆるく 中心へ）
    return { x: x + (p.x - x) * .0, y, z, vx: (b.x - a.x) / L * SPEED, vy: (b.y - a.y) / 1.5 * SPEED * .5, vz: (b.z - a.z) / L * SPEED }; };
  // ---------- 毎フレーム：灯の実を 拾う・描く ----------
  H.frame.push((dt, T) => { mO.n = 0; const r = rg(); if (K.phase !== 'field') return; const p = P(), now = performance.now();
    if (ride && (r !== 2 || p.ground)) ride = null;
    (ORBS[r] || []).forEach((o, k) => { const key = r + ':' + k; if ((taken[key] || 0) > now) return; if (Math.hypot(o.x - p.x, o.z - p.z) > 90) return;
      if (mO.n < mO.maxN) mO.set(mO.n++, o.x, o.y + Math.sin(T * 2 + k) * .25, o.z, 1, T);
      if (Math.hypot(o.x - p.x, o.y - (p.y + 1), o.z - p.z) < 2) { taken[key] = now + 90000; const g = G(); g.stam = Math.min(g.stamMax, g.stam + g.stamMax * .5); p.tired = false; try { Music.sfx('pick'); } catch (e) {} K.toast('灯の実：ともしびが もどった！', 900); } }); });
  // 風の道の 光
  H.fx.push((fx, dt, T) => { if (rg() !== 2) return; const p = P();
    for (const pa of PATHS) for (let i = 0; i < pa.d.length; i += 2) { const q = pa.d[i]; if (Math.abs(q.x - p.x) > 70 || Math.abs(q.z - p.z) > 70) continue; const ph = (T * 2 - i * .2) % 1; fx.push({ type: 1, p: [q.x, q.y + .3, q.z], size: [.9 + (ph < .3 ? .6 : 0), .9], grow: 1, tint: [.75, .95, 1] }); } });
  K.lumen.paths = PATHS; K.lumen.orbs = ORBS; K.lumen.riding = () => !!ride;
})();
