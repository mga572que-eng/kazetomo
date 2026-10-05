// ボスの 間を ダンジョンに（docs/design/boss-dungeons.md）
// ・番人や ボスと 戦う 場所は、屋根の ある ダンジョンの 奥。入口（灯の樹・祠・さんごの樹 など）で しらべると 中へ
// ・中は 一人称。手前の「しかけの 間」を とくと 扉が ひらき、奥の「番人の 間」の 封印で 戦う（話・ほうび・進行は もとの まま）
// ・しかけは 場所ごとに ちがう：おもし・はやて・くずれる床・光の かがみ・ひかりの 石盤・灯の 順・星おぼえ・潮・レバー・星座の 床
// ・部屋は 地方ごとに 1つ（遠くの 空の 上）を 入るたびに 組みなおす。記録は G.bossDun（しかけを といた 場所）だけ
// ・ほかに：屋根の ある 本編ダンジョン（遺跡・塔・宮・祠・新しい 部屋・樹の 中）も 中は 一人称（HOOK.fpv）。塔の 頂に 屋根
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const H = K.HOOK, W = World, B = W.Blocks, R = Math.random;
  const G = () => K.G;
  const C = (h, e = 0) => { const n = parseInt(h.slice(1), 16); return () => [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, e]; };
  // ---------- 場所 ----------
  const SITES = {
    t0: { name: '野原の 根の間', gim: ['push'] }, t1: { name: 'ふたごの 根の間', gim: ['timed'] }, t2: { name: '岩山の 根の間', gim: ['crumble'] },
    t3: { name: '月夜の 根の間', gim: ['mirror'] }, t4: { name: '崖の 根の間', gim: ['lights'] }, yoi: { name: '宵の祠の 奥', gim: ['braziers', 'memory'] },
    w0: { name: 'つむじの 間', gim: ['currents'] }, w1: { name: 'くもの 間', gim: ['levers'] }, w2: { name: 'ほしの 間', gim: ['stars'] }, tgate: { name: '星晶の 間', gim: ['memory', 'timed'] },
    c0: { name: '藻の 間', gim: ['currents', 'levers'] }, c1: { name: '甲羅の 間', gim: ['push', 'timed'] }, c2: { name: '雷の 間', gim: ['mirror', 'lights'] }, ab: { name: '深淵の 間', gim: ['crumble', 'stars'] },
  };
  const siteOf = (kind, i) => kind === 'tree' ? 't' + i : kind === 'wind' ? 'w' + i : kind === 'coral' ? 'c' + i : kind;
  // 部屋の 原点（地方ごと）。床ブロックの 高さ Y、立つ 高さ Y+1
  const ORG = [{ x: 214, z: 214, y: 120 }, { x: 214, z: 214, y: 120 }, { x: 214, z: 214, y: 120 }, { x: 214, z: 214, y: 120 }];
  let cur = null; // { site, r, O, back:{x,z,y,yaw}, gims:[], open, fighting, kind, i, obj, cells:[] }
  const done = s => !!((G().bossDun || {})[s]);
  // ---------- 部屋を つくる・こわす ----------
  function put(c, x, y, z, t) { B.set(x, y, z, t, true, c.r); c.cells.push([x, y, z]); }
  function build(c) { const { x: X, z: Z, y: Y } = c.O, prev = W.region; W.setRegion(c.r);
    const S = (i, h, j, t) => put(c, X + i, Y + h, Z + j, t);
    // 手前：しかけの 間（i 0..20, j 0..20）
    for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) { S(i, 0, j, (i + j) & 1 ? 6 : 1); S(i, 9, j, i % 5 === 0 && j % 5 === 0 ? 7 : 6);
      if (i === 0 || i === 20 || j === 0 || j === 20) for (let h = 1; h <= 8; h++) { if (j === 0 && i >= 9 && i <= 11 && h <= 3) continue; S(i, h, j, h === 4 && (i + j) % 5 === 0 ? 2 : (i === 0 || i === 20) && (j === 0 || j === 20) ? 5 : 6); } }
    // 奥：番人の 間（i 3..17, j -16..0）
    for (let i = 3; i <= 17; i++) for (let j = -16; j < 0; j++) { S(i, 0, j, Math.hypot(i - 10, j + 8) < 3 ? 7 : 4); S(i, 11, j, 6);
      if (i === 3 || i === 17 || j === -16) for (let h = 1; h <= 10; h++) S(i, h, j, h === 5 && (i + j) % 4 === 0 ? 2 : 6); }
    for (const [i, j] of [[5, -14], [15, -14], [5, -3], [15, -3]]) for (let h = 1; h <= 10; h++) S(i, h, j, h % 3 === 0 ? 2 : 5); // 柱
    // 扉（しかけを とくまで しめる）
    c.door = []; for (let i = 9; i <= 11; i++) for (let h = 1; h <= 3; h++) { c.door.push([X + i, Y + h, Z]); if (!c.open) S(i, h, 0, 8); }
    for (const g of c.gims) g.build && g.build();
    W.setRegion(prev); }
  function tear(c) { const prev = W.region; W.setRegion(c.r); for (const [x, y, z] of c.cells) B.rm(x, y, z, c.r); W.setRegion(prev); c.cells = []; }
  function openDoor(c) { if (c.open) return; c.open = true; const prev = W.region; W.setRegion(c.r); for (const [x, y, z] of c.door) B.rm(x, y, z, c.r); W.setRegion(prev);
    const g = G(); g.bossDun = g.bossDun || {}; g.bossDun[c.site] = 1; try { Music.sfx('magic'); } catch (e) {} K.toast('ゴゴゴ……　奥の 扉が ひらいた！', 2000); K.save(); }
  // ---------- しかけ（area：i0..i1, j0..j1 の マス） ----------
  const MK = {};
  const plate = (c, i, j, on) => { const x = c.O.x + i, y = c.O.y, z = c.O.z + j, t = on ? 14 : 13; if (B.get(x, y, z) !== t) B.set(x, y, z, t, true, c.r); };
  const pc = c => { const P = K.player; return { i: Math.floor(P.x) - c.O.x, j: Math.floor(P.z) - c.O.z, onF: Math.abs(P.y - (c.O.y + 1)) < .6, P }; };
  // 1) おもし：箱を 2つ スイッチへ
  MK.push = (c, a) => { const w = a.i1 - a.i0, P1 = [a.i0 + 2, a.j0 + 1], P2 = [a.i1 - 2, a.j0 + 1], B1 = [a.i0 + 3, a.j0 + 5], B2 = [a.i1 - 3, a.j0 + 7];
    const blocks0 = [B1, B2], pil = [[a.i0 + 2, a.j0 + 3], [a.i1 - 2, a.j0 + 4], [a.i0 + 2 + (w >> 1), a.j0 + 4]];
    return { tip: '箱を おして、2つの スイッチの 上へ。', build() { for (const [i, j] of [P1, P2]) put(c, c.O.x + i, c.O.y, c.O.z + j, 13); for (const [i, j] of blocks0) put(c, c.O.x + i, c.O.y + 1, c.O.z + j, 12); for (const [i, j] of pil) for (let h = 1; h <= 2; h++) put(c, c.O.x + i, c.O.y + h, c.O.z + j, 5); },
      solved() { let all = true; for (const [i, j] of [P1, P2]) { const on = B.get(c.O.x + i, c.O.y + 1, c.O.z + j) === 12; plate(c, i, j, on); all = all && on; } return all; },
      reset() { for (let i = a.i0; i <= a.i1; i++) for (let j = a.j0; j <= a.j1; j++) if (B.get(c.O.x + i, c.O.y + 1, c.O.z + j) === 12) B.rm(c.O.x + i, c.O.y + 1, c.O.z + j, c.r); for (const [i, j] of blocks0) put(c, c.O.x + i, c.O.y + 1, c.O.z + j, 12); } }; };
  // 2) はやて：3つの スイッチを 10びょう いないに
  MK.timed = (c, a) => { const P = [[a.i0 + 1, a.j0 + 1], [a.i1 - 1, a.j0 + 2], [(a.i0 + a.i1) >> 1, a.j1 - 1]], s = { hit: {}, t0: 0 };
    return { tip: '3つの スイッチを 10びょう いないに ふめ。', build() { for (const [i, j] of P) put(c, c.O.x + i, c.O.y, c.O.z + j, 13); },
      frame(dt, T) { const p = pc(c); P.forEach(([i, j], k) => { if (p.onF && p.i === i && p.j === j && !s.hit[k]) { if (!s.t0) { s.t0 = T; K.toast('スタート！ 10びょう！', 900); } s.hit[k] = 1; try { Music.sfx('pick'); } catch (e) {} } plate(c, i, j, !!s.hit[k]); });
        if (s.t0 && T - s.t0 > 10 && Object.keys(s.hit).length < 3) { s.hit = {}; s.t0 = 0; try { Music.sfx('cancel'); } catch (e) {} K.toast('時間ぎれ……　もう一度！', 1200); } },
      solved() { return Object.keys(s.hit).length >= 3; }, reset() { s.hit = {}; s.t0 = 0; } }; };
  // 3) くずれる床：すべての 床を いちどずつ ふんで 向こうへ（ふんだ 床は はなれると くずれる）
  MK.crumble = (c, a) => { const j0 = a.j0 + 4, rows = 4, s = { gone: new Set(), last: null, done: false }, gl = ((a.i0 + a.i1) >> 1) - 3, gr = gl + 6;
    const tiles = []; for (let i = gl; i <= gr; i++) for (let j = j0; j < j0 + rows; j++) tiles.push([i, j]);
    const key = (i, j) => i + ',' + j, isT = (i, j) => i >= gl && i <= gr && j >= j0 && j < j0 + rows;
    const fill = () => { for (const [i, j] of tiles) { B.set(c.O.x + i, c.O.y, c.O.z + j, 9, true, c.r); } };
    return { tip: 'ひびの ある 床は 一度 ふむと くずれる。 ぜんぶ ふんで 向こうがわへ。', build() { for (const [i, j] of tiles) { put(c, c.O.x + i, c.O.y, c.O.z + j, 9); put(c, c.O.x + i, c.O.y - 3, c.O.z + j, 6); } for (let i = a.i0; i <= a.i1; i++) if (i < gl || i > gr) for (let j = j0 - 1; j <= j0 + rows; j++) for (let h = 1; h <= 3; h++) put(c, c.O.x + i, c.O.y + h, c.O.z + j, 6); },
      frame() { if (s.done) return; const p = pc(c); const here = isT(p.i, p.j) && p.P.y > c.O.y + .4 ? key(p.i, p.j) : null;
        if (p.P.y < c.O.y - .5) { s.gone.clear(); s.last = null; fill(); K.toast('くずれた……　はじめから', 1400); try { Music.sfx('cancel'); } catch (e) {} Object.assign(p.P, { x: c.O.x + 10.5, z: c.O.z + 17.5, y: c.O.y + 1, vy: 0 }); return; }
        if (s.last && s.last !== here) { const [i, j] = s.last.split(',').map(Number); s.gone.add(s.last); B.rm(c.O.x + i, c.O.y, c.O.z + j, c.r); try { Music.sfx('mine'); } catch (e) {} }
        s.last = here; if (s.gone.size === tiles.length && p.j < j0 && p.onF) { s.done = true; fill(); for (const [i, j] of tiles) B.set(c.O.x + i, c.O.y, c.O.z + j, 1, true, c.r); } },
      solved() { return s.done; }, reset() { s.gone.clear(); s.last = null; s.done = false; fill(); } }; };
  // 4) 光の かがみ（A：(dx,dz)→(dz,dx)、B：(dx,dz)→(-dz,-dx)）
  MK.mirror = (c, a) => { const ox = a.i0 + ((a.i1 - a.i0 - 8) >> 1), oz = a.j0 + 2, M = [{ a: 2, b: 1, ans: 0, s: 1 }, { a: 2, b: 6, ans: 0, s: 1 }, { a: 7, b: 6, ans: 1, s: 0 }, { a: 7, b: 3, ans: 1, s: 0 }, { a: 5, b: 8, ans: null, s: 0 }];
    const SRC = [-1, 1], GOAL = [8, 3], s0 = M.map(m => m.s); let hit = false;
    const trace = () => { const cells = []; let x = SRC[0], z = SRC[1], dx = 1, dz = 0; for (let k = 0; k < 80; k++) { x += dx; z += dz; if (x < 0 || z < 0 || x > 8 || z > 8) return { cells, hit: false };
        if (x === GOAL[0] && z === GOAL[1]) { cells.push([x, z]); return { cells, hit: true }; } const m = M.find(q => q.a === x && q.b === z); if (m) [dx, dz] = m.s === 0 ? [dz, dx] : [-dz, -dx]; cells.push([x, z]); } return { cells, hit: false }; };
    return { tip: 'かがみを しらべて 向きを かえ、光を 結晶へ。', build() { for (const m of M) for (let h = 1; h <= 2; h++) put(c, c.O.x + ox + m.a, c.O.y + h, c.O.z + oz + m.b, 19); for (let h = 1; h <= 2; h++) put(c, c.O.x + ox + GOAL[0], c.O.y + h, c.O.z + oz + GOAL[1], 19); },
      frame() { hit = trace().hit; }, solved() { return hit; }, reset() { M.forEach((m, k) => m.s = s0[k]); },
      cand(cand) { for (const [k, m] of M.entries()) cand({ c, k }, 'bdMirror', c.O.x + ox + m.a + .5, c.O.z + oz + m.b + .5, 1.6); },
      toggle(k) { M[k].s ^= 1; }, draw(D, T) { const BY = c.O.y + 1.2; for (const m of M) D.mir(c.O.x + ox + m.a + .5, c.O.y + 1, c.O.z + oz + m.b + .5, m.s === 0 ? -Math.PI / 4 : Math.PI / 4);
        D.glow(c.O.x + ox + GOAL[0] + .5, c.O.y + 1.6, c.O.z + oz + GOAL[1] + .5, hit); D.src(c.O.x + ox + SRC[0] + 1, BY, c.O.z + oz + SRC[1] + .5);
        let px = ox + SRC[0] + .5, pz = oz + SRC[1] + .5; for (const [x, z] of trace().cells) { D.beam(c.O.x + px, BY, c.O.z + pz, c.O.x + ox + x + .5, c.O.z + oz + z + .5); px = ox + x + .5; pz = oz + z + .5; } } }; };
  // 5) ひかりの 石盤：ふむと 自分と となりが 入れかわる。ぜんぶ 光らせる
  MK.lights = (c, a) => { const cx = (a.i0 + a.i1) >> 1, cz = (a.j0 + a.j1) >> 1, P = []; for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) P.push([cx + u * 2, cz + v * 2]);
    const st = P.map(() => true); const press = k => { const [i, j] = P[k]; P.forEach(([x, z], q) => { if ((x === i && Math.abs(z - j) <= 2) || (z === j && Math.abs(x - i) <= 2)) st[q] = !st[q]; }); };
    const scr = () => { st.fill(true); for (const k of [0, 4, 7]) press(k); }; scr(); let last = -1;
    return { tip: '石盤を ふむと、そこと となりの 光が 入れかわる。 9まい ぜんぶ 光らせよう。', build() { P.forEach(([i, j], k) => put(c, c.O.x + i, c.O.y, c.O.z + j, st[k] ? 14 : 13)); },
      frame() { const p = pc(c); const k = P.findIndex(([i, j]) => p.onF && p.i === i && p.j === j); if (k >= 0 && k !== last) { press(k); try { Music.sfx('pick'); } catch (e) {} } last = k; P.forEach(([i, j], q) => plate(c, i, j, st[q])); },
      solved() { return st.every(Boolean); }, reset() { scr(); last = -1; } }; };
  // 6) 灯の 順：ひくい 台から たかい 台へ 火を ともす
  MK.braziers = (c, a) => { const L = [[a.i0 + 1, a.j0 + 2, 3], [a.i1 - 1, a.j0 + 3, 1], [a.i0 + 2, a.j1 - 2, 4], [a.i1 - 2, a.j1 - 1, 2]], s = { lit: [] };
    const order = L.map((b, k) => [b[2], k]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    return { tip: '石版：「灯は ひくき 台から、たかき 台へ」', build() { for (const [i, j, h] of L) { for (let k = 1; k <= h; k++) put(c, c.O.x + i, c.O.y + k, c.O.z + j, 5); put(c, c.O.x + i, c.O.y + h + 1, c.O.z + j, 1); } },
      cand(cand) { L.forEach(([i, j], k) => { if (!s.lit.includes(k)) cand({ c, k }, 'bdBraz', c.O.x + i + .5, c.O.z + j + .5, 2); }); },
      light(k) { if (order[s.lit.length] === k) { s.lit.push(k); try { Music.sfx('magic'); } catch (e) {} } else { s.lit = []; try { Music.sfx('cancel'); } catch (e) {} K.toast('火が ゆらいで、すべて 消えてしまった……', 1500); } },
      fx(fx) { s.lit.forEach(k => { const [i, j, h] = L[k]; fx.push({ type: 0, p: [c.O.x + i + .5, c.O.y + h + 2.1, c.O.z + j + .5], size: [.5, .7], grow: 1, cyl: true, seed: k }); }); },
      solved() { return s.lit.length === L.length; }, reset() { s.lit = []; } }; };
  // 7) 星おぼえ：光った じゅんばんに ふむ
  MK.memory = (c, a) => { const cx = (a.i0 + a.i1) >> 1, cz = (a.j0 + a.j1) >> 1, P = [[cx - 2, cz - 2], [cx + 2, cz - 2], [cx - 2, cz + 2], [cx + 2, cz + 2]], s = { seq: null, show: 0, step: 0, last: -1, ok: false };
    return { tip: '光った 石の じゅんばんを おぼえて、同じ じゅんに ふめ。', build() { for (const [i, j] of P) put(c, c.O.x + i, c.O.y, c.O.z + j, 13); },
      frame(dt, T) { if (s.ok) { P.forEach(([i, j]) => plate(c, i, j, true)); return; } const p = pc(c), near = Math.abs(p.i - cx) < 5 && Math.abs(p.j - cz) < 5;
        if (!s.seq) { s.seq = [0, 1, 2, 3].sort(() => R() - .5).concat([Math.floor(R() * 4)]); s.show = 0; }
        if (!s.show && near) s.show = T + .8; if (!s.show) return;
        if (T < s.show + s.seq.length * .9) { const k = Math.floor((T - s.show) / .9); P.forEach(([i, j], q) => plate(c, i, j, k >= 0 && s.seq[k] === q && (T - s.show) % .9 < .6)); return; }
        const k = P.findIndex(([i, j]) => p.onF && p.i === i && p.j === j); P.forEach(([i, j], q) => plate(c, i, j, q === k));
        if (k >= 0 && k !== s.last) { if (s.seq[s.step] === k) { s.step++; try { Music.sfx('pick'); } catch (e) {} if (s.step >= s.seq.length) s.ok = true; } else { try { Music.sfx('cancel'); } catch (e) {} K.toast('ちがう……　光を もう一度 見よう', 1300); s.show = T + 1.2; s.step = 0; } }
        s.last = k; },
      solved() { return s.ok; }, reset() { s.seq = null; s.show = 0; s.step = 0; s.ok = false; } }; };
  // 8) レバー：3本の レバーで 壁の 灯を 石版と 同じ もようにする（となりも うごく）
  MK.levers = (c, a) => { const cx = (a.i0 + a.i1) >> 1, j = a.j0 + 3, Lv = [[cx - 3, j], [cx, j], [cx + 3, j]], want = [0, 1, 0], st = [0, 0, 0];
    const flip = k => { for (const q of [k - 1, k, k + 1]) if (q >= 0 && q < 3 && (q === k || k === 1)) st[q] ^= 1; };
    return { tip: '石版の 灯の もよう「○ ● ○」と 同じに なるよう レバーを たおせ。（まんなかの レバーは 両どなりも うごかす）', build() { for (const [i, jj] of Lv) put(c, c.O.x + i, c.O.y + 1, c.O.z + jj, 19); },
      cand(cand) { Lv.forEach(([i, jj], k) => cand({ c, k }, 'bdLever', c.O.x + i + .5, c.O.z + jj + .5, 1.6)); }, pull(k) { flip(k); try { Music.sfx('mine'); } catch (e) {} },
      draw(D) { Lv.forEach(([i, jj], k) => { D.lever(c.O.x + i + .5, c.O.y + 1, c.O.z + jj + .5, st[k]); D.lamp(c.O.x + i + .5, c.O.y + 3.2, c.O.z + jj + .5, st[k]); D.lamp(c.O.x + i + .5, c.O.y + 5.2, c.O.z + a.j0 + .6, want[k], true); }); },
      solved() { return st.every((v, k) => v === want[k]); }, reset() { st.fill(0); } }; };
  // 9) 潮（風）の 流れ：のると 矢印の 向きへ 運ばれる（9×13）
  const CUR = ['...#G.<..', '.^.>vv#^.', '.^.#vv#^.', '.^.#vv#^.', '.^.#vv#^.', '.^.#vv#^.', '.^.#vv#^.', '.^.#vv#^.', '.^.#vv#^.', '.^.#vv#^.', '.^.#..#^.', '.^.<..#^.', '...#S.>^.'];
  const DIR = { '>': [1, 0], '<': [-1, 0], '^': [0, -1], v: [0, 1] };
  MK.currents = (c, a) => { const ox = a.i0 + ((a.i1 - a.i0 - 8) >> 1), oz = a.j0 + 1, at = (i, j) => (CUR[j] || '')[i] || '#'; let reached = false;
    return { tip: '青い 床に のると 矢印の 向きへ 運ばれる。 一方通行を 見きわめて、光の 台へ。',
      build() { for (let j = 0; j < 13; j++) for (let i = 0; i < 9; i++) { const ch = at(i, j); if (ch === '#') for (let h = 1; h <= 3; h++) put(c, c.O.x + ox + i, c.O.y + h, c.O.z + oz + j, 6); else if (DIR[ch]) put(c, c.O.x + ox + i, c.O.y, c.O.z + oz + j, 7); }
        for (let i = -1; i <= 9; i++) for (let h = 1; h <= 3; h++) { put(c, c.O.x + ox + i, c.O.y + h, c.O.z + oz - 1, 6); if (i < 3 || i > 5) put(c, c.O.x + ox + i, c.O.y + h, c.O.z + oz + 13, 6); }
        for (let j = -1; j <= 13; j++) for (let h = 1; h <= 3; h++) { put(c, c.O.x + ox - 1, c.O.y + h, c.O.z + oz + j, 6); put(c, c.O.x + ox + 9, c.O.y + h, c.O.z + oz + j, 6); } },
      frame(dt) { const P = K.player; if (P.y > c.O.y + 3.6) return; const i = Math.floor(P.x) - c.O.x - ox, j = Math.floor(P.z) - c.O.z - oz; if (at(i, j) === 'G' && Math.abs(P.y - c.O.y - 1) < .6) reached = true;
        const d = DIR[at(i, j)]; if (!d) return; const step = Math.min(dt, .05) * 7, mx = c.O.x + ox + i + .5, mz = c.O.z + oz + j + .5, wall = at(i + d[0], j + d[1]) === '#';
        if (d[0]) { let nx = P.x + d[0] * step; if (wall && (nx - mx) * d[0] > 0) nx = mx; P.x = nx; P.z += (mz - P.z) * Math.min(1, dt * 8); } else { let nz = P.z + d[1] * step; if (wall && (nz - mz) * d[1] > 0) nz = mz; P.z = nz; P.x += (mx - P.x) * Math.min(1, dt * 8); } },
      draw(D, T) { for (let j = 0; j < 13; j++) for (let i = 0; i < 9; i++) { const d = DIR[at(i, j)]; if (d) D.arrow(c.O.x + ox + i + .5, c.O.y + 1.08, c.O.z + oz + j + .5, d, T); } D.glow(c.O.x + ox + 4.5, c.O.y + 1.2, c.O.z + oz + .5, reached); },
      solved() { return reached; }, reset() { reached = false; } }; };
  // 10) 星座の 床：線で つながる 順に ふむ（はじまりは 大きい 星）
  MK.stars = (c, a) => { const cx = (a.i0 + a.i1) >> 1, cz = (a.j0 + a.j1) >> 1, S0 = [[-3, 2], [-2, -1], [0, -3], [2, -1], [3, 2], [0, 1]], D0 = [[-1, 3], [2, 3], [-3, -3]];
    const ST = S0.map(([u, v]) => [cx + u, cz + v]), DC = D0.map(([u, v]) => [cx + u, cz + v]); const s = { step: 0, last: null };
    return { tip: '星を 線の とおりに たどれ。 はじまりは いちばん 大きい 星。', build() { for (const [i, j] of [...ST, ...DC]) put(c, c.O.x + i, c.O.y, c.O.z + j, 13); },
      frame() { const p = pc(c); if (s.step >= ST.length) return; const k = p.onF ? p.i + ',' + p.j : null; if (k === s.last) return; s.last = k; if (!k) return;
        const si = ST.findIndex(([i, j]) => i === p.i && j === p.j), di = DC.findIndex(([i, j]) => i === p.i && j === p.j);
        if (di >= 0 || (si >= 0 && si > s.step) || (si >= 0 && si < s.step - 1 && false)) { s.step = 0; ST.forEach(([i, j]) => plate(c, i, j, false)); try { Music.sfx('cancel'); } catch (e) {} K.toast('ちがう 星だ……　はじめから', 1300); return; }
        if (si === s.step) { plate(c, ...ST[si], true); s.step++; try { Music.sfx('pick'); } catch (e) {} } },
      draw(D, T) { ST.forEach(([i, j], k) => D.star(c.O.x + i + .5, c.O.y + 1.35, c.O.z + j + .5, k < s.step, k === 0)); DC.forEach(([i, j]) => D.star(c.O.x + i + .5, c.O.y + 1.35, c.O.z + j + .5, false, false, .8));
        for (let k = 0; k + 1 < ST.length; k++) D.dots(c.O.x + ST[k][0] + .5, c.O.z + ST[k][1] + .5, c.O.x + ST[k + 1][0] + .5, c.O.z + ST[k + 1][1] + .5, c.O.y + 1.06); },
      solved() { return s.step >= ST.length; }, reset() { s.step = 0; s.last = null; } }; };
  // ---------- 見た目 ----------
  const gMir = W.Geo(); W.prism(gMir, .42, .48, 0, .35, 8, C('#6b6458')); W.prism(gMir, .74, .74, .66, 1.8, 10, C('#9a7a44'), 0, 0, 1, .05); W.prism(gMir, .66, .66, .74, 1.72, 10, C('#dff1ff', .7), 0, 0, 1, .09);
  const gDot = W.Geo(); W.ico(gDot, .07, [0, 0, 0], C('#ffe08a', .9), 0, 0, 1); const gDotB = W.Geo(); W.ico(gDotB, .06, [0, 0, 0], C('#7fb0ff', .6), 0, 0, 1);
  const gGlowOn = W.Geo(); W.ico(gGlowOn, .45, [0, 0, 0], C('#fff2b0', 1), .15, 1, 1.4); const gGlowOff = W.Geo(); W.ico(gGlowOff, .4, [0, 0, 0], C('#7a86a8', .3), .15, 1, 1.4);
  const gArr = W.Geo(); W.seg(gArr, [-.28, 0, -.12], [0, 0, .16], .05, .05, 4, C('#7fe8ff', .65)); W.seg(gArr, [.28, 0, -.12], [0, 0, .16], .05, .05, 4, C('#7fe8ff', .65));
  const gStar = W.Geo(); W.ico(gStar, .26, [0, 0, 0], C('#6fa0ff', .62), 0, 1, 1); const gStarOn = W.Geo(); W.ico(gStarOn, .32, [0, 0, 0], C('#ffc832', .7), 0, 1, 1);
  const gLev = W.Geo(); W.prism(gLev, .3, .35, 0, .4, 6, C('#6b6458')); W.seg(gLev, [0, .4, 0], [0, 1.3, .4], .06, .05, 5, C('#c8a060'));
  const gLevOn = W.Geo(); W.prism(gLevOn, .3, .35, 0, .4, 6, C('#6b6458')); W.seg(gLevOn, [0, .4, 0], [0, 1.3, -.4], .06, .05, 5, C('#ffd060', .6));
  const gLamp = W.Geo(); W.ico(gLamp, .22, [0, 0, 0], C('#ffd060', 1), 0, 1, 1); const gLampOff = W.Geo(); W.ico(gLampOff, .2, [0, 0, 0], C('#4a4a5a'), 0, 1, 1);
  const gSeal = W.Geo(); W.prism(gSeal, 1.2, 1.4, 0, .5, 10, C('#4a4a6a')); W.ico(gSeal, .6, [0, 1.5, 0], C('#b58cff', .8), .1, 1, 1.4);
  const ME = { mir: W.makeMesh(gMir, 12), dot: W.makeMesh(gDot, 300), dotB: W.makeMesh(gDotB, 160), on: W.makeMesh(gGlowOn, 6), off: W.makeMesh(gGlowOff, 6), arr: W.makeMesh(gArr, 120),
    star: W.makeMesh(gStar, 20), starOn: W.makeMesh(gStarOn, 20), lev: W.makeMesh(gLev, 6), levOn: W.makeMesh(gLevOn, 6), lamp: W.makeMesh(gLamp, 20), lampOff: W.makeMesh(gLampOff, 20), seal: W.makeMesh(gSeal, 1) };
  const put1 = (m, x, y, z, s = 1, yaw = 0) => { if (m.n < m.maxN) m.set(m.n++, x, y, z, s, yaw); };
  const D = { mir: (x, y, z, yaw) => put1(ME.mir, x, y, z, 1, yaw), glow: (x, y, z, on) => put1(on ? ME.on : ME.off, x, y, z), src: (x, y, z) => put1(ME.on, x, y, z, .7),
    beam: (x0, y, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / .25)); for (let k = 0; k < n; k++) put1(ME.dot, x0 + (x1 - x0) * k / n, y, z0 + (z1 - z0) * k / n, 1); },
    arrow: (x, y, z, d, T) => { for (const o of [0, .5]) { const f = ((T * 1.2 + o) % 1) - .5; put1(ME.arr, x + d[0] * f * .8, y, z + d[1] * f * .8, 1, Math.atan2(d[0], d[1])); } },
    star: (x, y, z, on, big, s = 1) => put1(on ? ME.starOn : ME.star, x, y, z, (big ? 1.6 : 1) * s), dots: (x0, z0, x1, z1, y) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / .45); for (let k = 1; k < n; k++) put1(ME.dotB, x0 + (x1 - x0) * k / n, y, z0 + (z1 - z0) * k / n); },
    lever: (x, y, z, on) => put1(on ? ME.levOn : ME.lev, x, y, z), lamp: (x, y, z, on) => put1(on ? ME.lamp : ME.lampOff, x, y, z) };
  // ---------- 入る・出る ----------
  const inside = () => !!cur && G().region === cur.r && Math.abs(K.player.x - cur.O.x - 10) < 12 && K.player.z > cur.O.z - 17.5 && K.player.z < cur.O.z + 21.5 && K.player.y > cur.O.y - 4 && K.player.y < cur.O.y + 12;
  async function enter(site, kind, i, obj) { const r = G().region, O = ORG[r], P = K.player, S = SITES[site]; if (!S) return false;
    if (cur) { tear(cur); cur = null; }
    const c = { site, r, O, kind, i, obj, back: { x: P.x, z: P.z, y: P.y, yaw: P.yaw, cyaw: K.cam.yaw }, cells: [], open: done(site), fighting: false };
    const areas = S.gim.length === 1 ? [{ i0: 1, i1: 19, j0: 2, j1: 16 }] : [{ i0: 1, i1: 9, j0: 2, j1: 16 }, { i0: 11, i1: 19, j0: 2, j1: 16 }];
    c.gims = S.gim.map((g, k) => MK[g](c, areas[k])); c.solvedN = 0;
    await K.fade(true); build(c); cur = c; Object.assign(P, { x: O.x + 10.5, z: O.z + 18.5, y: O.y + 1.02, vx: 0, vy: 0, vz: 0 }); P.yaw = Math.PI; K.cam.yaw = Math.PI; K.cam.pitch = .3; K.trail.length = 0; K.enemies = [];
    await K.wait(200); await K.fade(false);
    await K.say([`【${S.name}】`, c.open ? '奥の 扉は ひらいている。 番人の 気配が する……' : c.gims.map(g => g.tip).join(' ／ '), '（入口の 足もとで「外へ 出る」）']); return true; }
  async function leave(silent) { const c = cur; if (!c) return; const P = K.player; await K.fade(true); tear(c); cur = null; Object.assign(P, { x: c.back.x, z: c.back.z, vx: 0, vy: 0, vz: 0 }); P.y = K.surfaceAt(P.x, P.z, c.back.y + 2); P.yaw = c.back.yaw; K.cam.yaw = c.back.cyaw; K.trail.length = 0; await K.wait(150); await K.fade(false); }
  // 進行の つなぎ目（game.js：bossGate / bossDone）
  H.bossGate = async (kind, i, obj, atTop) => { const site = siteOf(kind, i); if (!SITES[site]) return false; if (cur && cur.site === site && cur.fighting) return false;
    if (cur && cur.site === site) return false;
    const msg = { tree: '灯の樹の 根元に、地下へ つづく 扉が あらわれた。 番人の 気配は その 奥から……', wind: '祠の 奥に、さらに 深い 間への 扉が ある。 番人は その 奥だ。', yoi: '宵の祠の 奥へ、闇が 吸いこまれていく……', tgate: '塔の 扉の 前に、星晶の 光で できた 入口が ひらいている。 番人は その 奥だ。', coral: 'さんごの 樹の 根元が ひらき、奥へ つづいている。 番人は その 奥に いる。', ab: '深淵の 底へ、石の 階段が つづいている……' }[kind] || '奥へ つづく 扉が ある。';
    await K.say([msg]); if (!(await K.confirm(`${SITES[site].name}へ 入る？`))) return true; await enter(site, kind, i, obj); if (cur) cur.atTop = atTop; return true; };
  H.bossDone = async (kind, i, obj) => { const site = siteOf(kind, i); if (!cur || cur.site !== site || !cur.fighting) return false; const cur0 = cur; cur.fighting = false; await leave();
    const top = cur0.atTop; if (kind === 'tree' && K.beaconEvent) await K.beaconEvent(obj, top); if (kind === 'wind' && K.windEvent) await K.windEvent(obj); return true; };
  // 封印で 戦う
  async function fight() { const c = cur; if (!c) return; if (!(await K.confirm('番人の 封印に ふれる？（戦いに なる）'))) return; c.fighting = true;
    try { if (c.kind === 'tree') await K.beaconEvent(c.obj, c.atTop); else if (c.kind === 'wind') await K.windEvent(c.obj); else if (c.kind === 'yoi') await K.shrineEvent(); else if (c.kind === 'tgate') await window.__bdTower(); else if (c.kind === 'coral') await ORIG.lh(c.obj); else if (c.kind === 'ab') await ORIG.abyss(c.obj); }
    finally { if (cur === c && c.fighting) { c.fighting = false; if (inside()) await leave(); } } }
  // ch4 の 番人（さんごの樹）と 裏ボス：もとの 処理を つつむ
  const ORIG = { lh: H.acts.lh, abyss: H.acts.abyss };
  if (ORIG.lh) H.acts.lh = async L => { if ((G().lh || [])[L.i] || !(G().flags || {}).c4elder) return ORIG.lh(L); if (cur && cur.fighting) return ORIG.lh(L); await H.bossGate('coral', L.i, L); };
  if (ORIG.abyss) H.acts.abyss = async o => { if ((G().flags || {}).superDone || (cur && cur.fighting)) return ORIG.abyss(o); await H.bossGate('ab', 0, o); };
  // 塔の 番人（game.js の towerGateEvent は bossGate／bossDone で つながる。中の 戦いは 同じ 関数を もう一度 よぶ）
  window.__bdTower = async () => { if (K.towerGateEvent) return K.towerGateEvent(); };
  // ---------- 毎フレーム ----------
  H.frame.push((dt, T) => { for (const k in ME) ME[k].n = 0; const c = cur; if (!c) return;
    if (G().region !== c.r || (!inside() && !c.fighting && K.phase === 'field' && !K.busy)) { tear(c); cur = null; return; } // 負けて 宿へ・ワープ など
    if (K.phase !== 'field' || (K.B && K.B.active)) return; K.enemies = [];
    if (!c.open) { let all = true; for (const g of c.gims) { g.frame && g.frame(dt, T); all = all && g.solved(); } if (all) openDoor(c); }
    for (const g of c.gims) g.draw && g.draw(D, T);
    put1(ME.seal, c.O.x + 10.5, c.O.y + 1, c.O.z - 7.5, 1, T * .3); });
  H.fx.push(fx => { const c = cur; if (!c || G().region !== c.r) return; for (const g of c.gims) g.fx && g.fx(fx); fx.push({ type: 1, p: [c.O.x + 10.5, c.O.y + 1.4, c.O.z - 7.5], size: [2, 2], grow: 1, tint: [.8, .6, 1] }); });
  // ---------- しらべる ----------
  H.target.push(cand => { const c = cur; if (!c || !inside()) return; cand({ c }, 'bdExit', c.O.x + 10.5, c.O.z + 19.4, 1.4); cand({ c }, 'bdSeal', c.O.x + 10.5, c.O.z - 7.5, 2.6);
    cand({ c }, 'bdTablet', c.O.x + 3.5, c.O.z + 18.5, 1.6); if (!c.open) for (const g of c.gims) g.cand && g.cand(cand); });
  H.labels.bdExit = '外へ 出る'; H.labels.bdSeal = '番人の 封印'; H.labels.bdTablet = 'しかけの 石版'; H.labels.bdMirror = 'かがみを まわす'; H.labels.bdBraz = '火を ともす'; H.labels.bdLever = 'レバーを たおす';
  H.acts.bdExit = async () => { await leave(); };
  H.acts.bdSeal = async () => { if (!cur.open) { await K.say(['封印は 扉の 向こうだ。']); return; } await fight(); };
  H.acts.bdTablet = async () => { const c = cur; await K.say([`【${SITES[c.site].name}】`, ...c.gims.map(g => g.tip)]); if (c.open) return; const ch = await K.menu({ title: 'しかけの 石版', items: [{ label: 'がんばる' }, { label: 'しかけを もとに もどす' }] }); if (ch === 1) { const prev = W.region; W.setRegion(c.r); for (const g of c.gims) g.reset && g.reset(); W.setRegion(prev); K.toast('しかけを もとに もどした', 1200); } };
  H.acts.bdMirror = async ({ c, k }) => { const g = c.gims.find(x => x.toggle); if (g) { g.toggle(k); try { Music.sfx('mine'); } catch (e) {} } };
  H.acts.bdBraz = async ({ c, k }) => { const g = c.gims.find(x => x.light); if (g) g.light(k); };
  H.acts.bdLever = async ({ c, k }) => { const g = c.gims.find(x => x.pull); if (g) g.pull(k); };
  // おもしの 箱を おす（祠と 同じ しくみ。このダンジョンの 中だけ）
  let pushCd = 0;
  H.push.push((nx, nz, py, wx, wz, dt) => { pushCd -= dt; if (!cur || !inside() || pushCd > 0) return; let dx = 0, dz = 0; if (Math.abs(wx) > Math.abs(wz)) dx = Math.sign(wx); else dz = Math.sign(wz); if (!dx && !dz) return;
    const ix = Math.floor(nx + dx * .36), iz = Math.floor(nz + dz * .36), iy = Math.floor(py + .1); if (B.get(ix, iy, iz) !== 12) return; const tx = ix + dx, tz = iz + dz; if (B.has(tx, iy, tz) || !B.has(tx, iy - 1, tz)) return;
    B.move(ix, iy, iz, tx, iy, tz); pushCd = .35; try { Music.sfx('mine'); } catch (e) {} });
  const prevNC = H.noClimb; H.noClimb = () => inside() || !!(prevNC && prevNC());
  // ---------- 一人称（屋根の ある 本編ダンジョンの 中） ----------
  H.fpv = H.fpv || [];
  const P = () => K.player, rg = () => G().region;
  H.fpv.push(() => inside());
  H.fpv.push(() => { if (rg() !== 1) return false; const a = K.REG[1].ruinsRoof; if (!a) return false; const p = P(); return p.x > a.x && p.x < a.x + a.size && p.z > a.z && p.z < a.z + a.size && p.y < a.y; });
  H.fpv.push(() => { if (rg() !== 3) return false; const a = K.REG[3].palaceRoof; if (!a) return false; const p = P(); return Math.hypot(p.x - a.x - .5, p.z - a.z - .5) < 14.5 && p.y < a.y; });
  H.fpv.push(() => { if (rg() !== 2) return false; const t = K.REG[2].tower; if (!t) return false; const p = P(); return Math.abs(p.x - t.x) < 4.6 && Math.abs(p.z - t.z) < 4.6 && p.y < t.top + 8; });
  H.fpv.push(() => { const p = P(); return (DATA.shrines || []).some(s => s.r === rg() && s.pos && Math.abs(p.x - s.pos.x - .5) < 6.6 && Math.abs(p.z - s.pos.z - .5) < 6.6 && p.y < (s.ceiling || 1e9) && p.y > s.pos.y - 2); });
  H.fpv.push(() => { const M = K.mainFloors || {}, p = P(); if (M.ruins && rg() === 1) { const q = M.ruins.room; if (p.x > q.x0 && p.x < q.x1 + 1 && p.z > q.z0 && p.z < q.z1 + 1 && Math.abs(p.y - q.y) < 2) return true; } return !!(M.palace && M.palace.inRoom && M.palace.inRoom()); });
  H.fpv.push(() => !!(K.lhDungeon && K.lhDungeon.here && K.lhDungeon.here()));
  // ---------- 塔の 頂に 屋根（星を 見る ガラスの 天井） ----------
  { const t = K.REG[2] && K.REG[2].tower; if (t) { const prev = W.region; W.setRegion(2); const X = Math.floor(t.x), Z = Math.floor(t.z);
      for (let a = -5; a <= 5; a++) for (let b = -5; b <= 5; b++) { const edge = Math.max(Math.abs(a), Math.abs(b)) === 5; if (edge) for (let y = t.top + 2; y <= t.top + 7; y++) { if (y <= t.top + 4 && (a === 0 || b === 0)) continue; B.set(X + a, y, Z + b, y === t.top + 5 && (a + b) % 2 === 0 ? 2 : 6, true, 2); }
        B.set(X + a, t.top + 8, Z + b, Math.max(Math.abs(a), Math.abs(b)) <= 3 ? 7 : 6, true, 2); }
      W.setRegion(prev); } }
  H.load.push(g => { if (g.bossDun && typeof g.bossDun !== 'object') g.bossDun = {}; if (cur) { tear(cur); cur = null; } });
  K.bossDun = { SITES, enter, leave, get cur() { return cur; }, inside, MK };
})();
