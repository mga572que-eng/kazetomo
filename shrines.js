// 風灯の島 — 試練の祠（謎解き）
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK, R = Math.random, B = World.Blocks;
  DATA.shrines = [
    { id: 's0', r: 0, kind: 'push', name: 'おもしの祠', hint: 'おもしブロックを スイッチの 上へ おして、扉を ひらけ。', reward: { gold: 400, give: { pan: 2 } } },
    { id: 's1', r: 0, kind: 'brazier', name: '灯の順の祠', hint: '石版：「灯は ちいさき ものから、たかき ものへ」', reward: { gold: 500, give: { shizuku: 2 } } },
    { id: 's2', r: 1, kind: 'dash', name: '疾風の祠', hint: '3つの スイッチを 15びょう いないに ふめ。 はしれ！', reward: { gold: 900, give: { ganbari: 2 } } },
    { id: 's3', r: 1, kind: 'climb', name: '築きの祠', hint: 'この 祠では かべを のぼれない。 ブロックで 足場を きずき、高い 台へ。', reward: { gold: 900, blocks: { 0: 20, 6: 10 } } },
    { id: 's4', r: 1, kind: 'combat', name: '力の祠', hint: '祠の 番人たちを 3回 しずめよ。', reward: { gold: 1200, give: { hoshikake: 2 } } },
    { id: 's5', r: 2, kind: 'rings', name: '天輪の祠', hint: '空に うかぶ 光の輪を じゅんばんに くぐれ（45びょう）。', reward: { gold: 1500, give: { kumowata: 6 } } },
    { id: 's6', r: 2, kind: 'memory', name: '星おぼえの祠', hint: '光った スイッチの じゅんばんを おぼえて、同じ じゅんに ふめ。', reward: { gold: 1500, give: { stew: 1 } } },
  ];
  const SHOU = [{ text: 'がんばりの 上限 +10', f: G => { G.stamMax += 10; G.stam = G.stamMax; } }, { text: 'みんなの 最大HP +4', f: G => { G.hpBonus = (G.hpBonus || 0) + 4; G.party.forEach(m => { K.calc(m); m.hp = m.st.hp; }); } }];
  // ---------- 配置（地形が 平らで 施設から はなれた 場所） ----------
  function place(sh) { World.setRegion(sh.r); const reg = K.REG[sh.r]; const rn = (() => { let s = 777 + sh.id.charCodeAt(1) * 131; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
    const far = (x, z) => Math.hypot(x - reg.town.x, z - reg.town.z) > 55 && (!reg.pier || Math.hypot(x - reg.pier.x, z - reg.pier.z) > 30) && !(reg.beacons || []).some(b => Math.hypot(b.x - x, b.z - z) < 30)
      && !(reg.shrines || []).some(b => Math.hypot(b.x - x, b.z - z) < 40) && !(reg.tower && Math.hypot(reg.tower.x - x, reg.tower.z - z) < 90) && !DATA.shrines.some(o => o !== sh && o.r === sh.r && o.pos && Math.hypot(o.pos.x - x, o.pos.z - z) < 60)
      && !(sh.r === 1 && Math.hypot(x - World.RUINS1[0], z - World.RUINS1[1]) < 50);
    let best = null;
    for (let k = 0; k < 4000; k++) { const x = Math.round((rn() - .5) * 420), z = Math.round((rn() - .5) * 420); const h = K.hAt(x, z); if (h < (sh.r === 2 ? 8 : 4) || h > 30 || !far(x, z)) continue;
      let mn = 1e9, mx = -1e9; for (let a = -8; a <= 8; a += 2) for (let b = -8; b <= 8; b += 2) { const hh = K.hAt(x + a, z + b); mn = Math.min(mn, hh); mx = Math.max(mx, hh); }
      const sc = mx - mn; if (mn < (sh.r === 2 ? 6 : 2.5)) continue; if (!best || sc < best.sc) best = { x, z, sc, y: Math.ceil(mx) }; if (sc < 1.2) break; }
    sh.pos = best; build(sh, reg); }
  function build(sh, reg) { const { x: cx, z: cz, y } = sh.pos; const r = sh.r; const S = (a, h, b, t) => B.set(cx + a, y + h, cz + b, t, true, r);
    reg.trees.forEach(t => { if (Math.hypot(t.x - cx, t.z - cz) < 11) t.state = 'gone', t.t = -1e9; }); reg.rocks.forEach(t => { if (Math.hypot(t.x - cx, t.z - cz) < 11) t.state = 'gone', t.t = -1e9; });
    reg.bushes = reg.bushes.filter(t => Math.hypot(t.x - cx, t.z - cz) >= 10);
    if (reg.shrooms) reg.shrooms = reg.shrooms.filter(t => Math.hypot(t.x - cx, t.z - cz) >= 11); // キノコも どける（証の台より キノコが 先に えらばれていた）
    for (let a = -7; a <= 7; a++) for (let b = -7; b <= 7; b++) { const g0 = Math.floor(K.hAt(cx + a + .5, cz + b + .5)) - y - 1; for (let h = Math.min(-1, g0); h <= 0; h++) S(a, h, b, h === 0 ? ((a + b) & 1 ? 6 : 1) : 1);
      for (let h = 1; h <= 8; h++) B.rm(cx + a, y + h, cz + b, r);
      const edge = Math.abs(a) === 7 || Math.abs(b) === 7; if (edge && !(b === 7 && Math.abs(a) <= 1)) { for (let h = 1; h <= 4; h++) S(a, h, b, (Math.abs(a) === 7 && Math.abs(b) === 7) ? 5 : 6); if ((a + b) % 3 === 0) S(a, 5, b, 6); } }
    for (let h = 1; h <= 5; h++) { S(-2, h, 7, 6); S(2, h, 7, 6); } for (let a = -2; a <= 2; a++) S(a, 6, 7, 10); S(-2, 6, 8, 2); S(2, 6, 8, 2);
    for (let a = -1; a <= 1; a++) for (let k = 1; k <= 8; k++) { const top = -k; const g0 = Math.floor(K.hAt(cx + a + .5, cz + 7 + k + .5)) - y; if (g0 > top) break; for (let h = g0 - 1; h <= top; h++) S(a, h, 7 + k, 1); } // 入口の 石段
    sh.gate = { x: cx + .5, z: cz + 9.5, y: y + 1 }; sh.goal = { x: cx + .5, z: cz - 5.5, y: y + 1 };
    S(0, 1, -6, 7); S(-1, 1, -6, 6); S(1, 1, -6, 6); // 証の台（奥）
    const P = sh.parts = { plates: [], movs: [], door: [], braz: [], rings: [] };
    if (sh.kind === 'push') { P.plates = [[-4, -3], [4, -3]]; P.movs = [[-4, 1], [2, 0]]; P.door = []; for (let a = -1; a <= 1; a++) for (let h = 1; h <= 3; h++) P.door.push([a, h, -4]); }
    if (sh.kind === 'dash') { P.plates = [[-5, -5], [5, -4], [0, 4]]; P.door = []; for (let a = -1; a <= 1; a++) for (let h = 1; h <= 3; h++) P.door.push([a, h, -4]); }
    if (sh.kind === 'memory') { P.plates = [[-3, -1], [3, -1], [-3, 3], [3, 3]]; P.door = []; for (let a = -1; a <= 1; a++) for (let h = 1; h <= 3; h++) P.door.push([a, h, -4]); }
    if (sh.kind === 'brazier') { P.braz = [[-5, 0, 3], [5, 0, 1], [-5, -3, 4], [5, -3, 2]]; for (const [a, b, hgt] of P.braz) { for (let h = 1; h <= hgt; h++) S(a, h, b, 5); S(a, hgt + 1, b, 1); } P.door = []; for (let a = -1; a <= 1; a++) for (let h = 1; h <= 3; h++) P.door.push([a, h, -4]); S(0, 1, 5, 1); }
    if (sh.kind === 'climb') { sh.goal.y = y + 13; for (let a = -1; a <= 1; a++) for (let b = -6; b <= -4; b++) for (let h = 1; h <= 12; h++) S(a, h, b, 6); for (const [a, b, hh] of [[-4, 2, 3], [-4, -2, 6], [0, -2, 9]]) for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let h = 1; h <= hh; h++) S(a + i, h, b + j, (h === hh) ? 0 : 6);
      for (let a = -1; a <= 1; a++) for (let b = -6; b <= -4; b++) S(a, 12, b, 0); S(0, 13, -6, 7); sh.goal = { x: cx + .5, z: cz - 5.5, y: y + 13 }; }
    if (sh.kind === 'rings') { for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + .4, d = 22 + (k % 2) * 8; P.rings.push([Math.cos(a) * d, 8 + k * 2.2, Math.sin(a) * d]); } }
    for (const [a, b] of P.plates) S(a, 0, b, 13);
    for (const [a, b] of P.movs) S(a, 1, b, 12);
    for (const [a, h, b] of P.door) S(a, h, b, 6);
    if (P.door.length) for (let a = -6; a <= 6; a++) if (Math.abs(a) > 1) for (let h = 1; h <= 3; h++) S(a, h, -4, 6);
    if (sh.kind !== 'climb') S(0, 1, -6, 7);
    // Flight/building trials need taller halls; leave the existing gate and all parts intact.
    const ceiling = sh.kind === 'climb' ? 19 : sh.kind === 'rings' ? 25 : 10;
    for (let a = -7; a <= 7; a++) for (let b = -7; b <= 7; b++) {
      const edge = Math.abs(a) === 7 || Math.abs(b) === 7;
      if (edge) for (let h = 5; h < ceiling; h++) {
        if (b === 7 && Math.abs(a) <= 1 && h < 7) continue;
        S(a, h, b, h === ceiling - 3 && (a + b) % 3 === 0 ? 7 : 6);
      }
      S(a, ceiling, b, Math.abs(a) <= 1 && Math.abs(b) <= 1 ? 7 : 6);
    }
    for (const a of [-7, 7]) for (const b of [-7, 7]) S(a, ceiling + 1, b, 8);
    S(-2, 4, 8, 2); S(2, 4, 8, 2);
    sh.ceiling = y + ceiling;

  }
  for (const sh of DATA.shrines) place(sh);
  World.setRegion(0);
  // ---------- 状態 ----------
  const st = {}; // 実行中の 試練
  const done = sh => (K.G.shrineDone || {})[sh.id];
  const inSh = (sh, x, z) => sh.pos && Math.abs(x - sh.pos.x - .5) < 7.2 && Math.abs(z - sh.pos.z - .5) < 7.2;
  const here = () => DATA.shrines.find(sh => sh.r === K.G.region && inSh(sh, K.player.x, K.player.z));
  const cellOf = (sh, a, b, h = 0) => [sh.pos.x + a, sh.pos.y + h, sh.pos.z + b];
  function openDoor(sh) { for (const [a, h, b] of sh.parts.door) B.rm(sh.pos.x + a, sh.pos.y + h, sh.pos.z + b, sh.r); Music.sfx('place'); K.toast('ゴゴゴ……　奥の 扉が ひらいた！', 1800); st[sh.id] = { ...(st[sh.id] || {}), open: true }; }
  function resetShrine(sh) { const reg = K.REG[sh.r]; // 押しブロックを もとの 位置へ
    for (let a = -6; a <= 6; a++) for (let b = -6; b <= 6; b++) if (B.get(sh.pos.x + a, sh.pos.y + 1, sh.pos.z + b) === 12) B.rm(sh.pos.x + a, sh.pos.y + 1, sh.pos.z + b, sh.r);
    for (const [a, b] of sh.parts.movs) B.set(sh.pos.x + a, sh.pos.y + 1, sh.pos.z + b, 12, true, sh.r);
    for (const [a, h, b] of sh.parts.door) B.set(sh.pos.x + a, sh.pos.y + h, sh.pos.z + b, 6, true, sh.r); st[sh.id] = {}; }
  // 押しブロック
  let pushCd = 0;
  H.push.push((nx, nz, py, wx, wz, dt) => { pushCd -= dt; const sh = here(); if (!sh || sh.kind !== 'push' || pushCd > 0) return;
    let dx = 0, dz = 0; if (Math.abs(wx) > Math.abs(wz)) dx = Math.sign(wx); else dz = Math.sign(wz); if (!dx && !dz) return;
    const ix = Math.floor(nx + dx * .36), iz = Math.floor(nz + dz * .36), iy = Math.floor(py + .1); if (B.get(ix, iy, iz) !== 12) return;
    const tx = ix + dx, tz = iz + dz; if (B.has(tx, iy, tz) || !B.has(tx, iy - 1, tz)) return;
    B.move(ix, iy, iz, tx, iy, tz); pushCd = .35; Music.sfx('mine'); });
  H.noStep = (x, z, y) => { const iy = Math.floor(y + .65); for (const [ox, oz] of [[-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]]) if (B.get(Math.floor(x + ox), iy, Math.floor(z + oz)) === 12) return true; return false; };
  H.noClimb = () => { const p = K.player; const sh = DATA.shrines.find(s => s.r === K.G.region && s.pos && Math.abs(p.x - s.pos.x - .5) < 8.6 && Math.abs(p.z - s.pos.z - .5) < 8.6); return !!(sh && !done(sh)); };
  // フレーム：スイッチ判定など
  let flash = null;
  H.frame.push((dt, T) => { const sh = here(); if (!sh || done(sh)) return; const s = st[sh.id] = st[sh.id] || {}; const p = K.player;
    if (sh.parts.door.length && !s.open && p.z < sh.pos.z - 4 && p.y < sh.pos.y + 4) { for (const [a, h, b] of sh.parts.door) B.rm(sh.pos.x + a, sh.pos.y + h, sh.pos.z + b, sh.r); s.open = true; } // 再開時に 閉じこめない
    const onPlate = (a, b) => { const [x, y, z] = cellOf(sh, a, b); return (B.get(x, y + 1, z) === 12) || (Math.floor(p.x) === x && Math.floor(p.z) === z && Math.abs(p.y - (y + 1)) < .6); };
    const setPlate = (a, b, on) => { const [x, y, z] = cellOf(sh, a, b); const t = on ? 14 : 13; if (B.get(x, y, z) !== t) B.set(x, y, z, t, true, sh.r); };
    if (sh.kind === 'push' && !s.open) { let all = true; for (const [a, b] of sh.parts.plates) { const on = onPlate(a, b) && B.get(...(() => { const c = cellOf(sh, a, b); return [c[0], c[1] + 1, c[2]]; })()) === 12; setPlate(a, b, on); all = all && on; } if (all) openDoor(sh); }
    if (sh.kind === 'dash' && !s.open) { s.hit = s.hit || {}; sh.parts.plates.forEach(([a, b], i) => { if (onPlate(a, b) && !s.hit[i]) { if (!s.t0) { s.t0 = T; K.toast('スタート！ 15びょう！', 900); } s.hit[i] = 1; Music.sfx('pick'); } setPlate(a, b, !!s.hit[i]); });
      if (s.t0 && T - s.t0 > 15 && Object.keys(s.hit).length < 3) { s.hit = {}; s.t0 = 0; Music.sfx('cancel'); K.toast('時間ぎれ……　もう一度！', 1200); }
      if (Object.keys(s.hit).length >= 3) openDoor(sh); }
    if (sh.kind === 'memory' && !s.open) { if (!s.seq) { s.seq = [0, 1, 2, 3].sort(() => R() - .5).concat([Math.floor(R() * 4)]); s.show = T + 1; s.step = 0; }
      const showing = T < s.show + s.seq.length * .9; if (showing) { const k = Math.floor((T - s.show) / .9); sh.parts.plates.forEach(([a, b], i) => setPlate(a, b, k >= 0 && s.seq[k] === i && (T - s.show) % .9 < .6)); }
      else { let pressed = -1; sh.parts.plates.forEach(([a, b], i) => { const on = onPlate(a, b); if (on && s.last !== i) pressed = i; setPlate(a, b, on); if (on) s.cur = i; }); if (!sh.parts.plates.some(([a, b]) => onPlate(a, b))) s.last = -1; else if (pressed >= 0) s.last = pressed;
        if (pressed >= 0) { if (s.seq[s.step] === pressed) { s.step++; Music.sfx('pick'); if (s.step >= s.seq.length) openDoor(sh); } else { Music.sfx('cancel'); K.toast('ちがう……　光を もう一度 見よう', 1200); s.show = T + 1.5; s.step = 0; } } } }
  });
  // リングの 判定は 祠の 外（空中）でも 行う
  H.frame.push((dt, T) => { for (const sh of DATA.shrines) { if (sh.kind !== 'rings' || sh.r !== K.G.region || done(sh)) continue; const s = st[sh.id]; if (!s || !s.run) continue;
      const rg = sh.parts.rings[s.k]; if (!rg) continue; const [x, y, z] = [sh.pos.x + rg[0], sh.pos.y + rg[1], sh.pos.z + rg[2]]; if (Math.hypot(K.player.x - x, K.player.y - y, K.player.z - z) < 3.2) { s.k++; Music.sfx('friend'); if (s.k >= sh.parts.rings.length) { s.run = false; openDoor(sh); } }
      if (T - s.t0 > 45 && s.run) { s.run = false; s.k = 0; Music.sfx('cancel'); K.toast('時間ぎれ……　入口で もう一度', 1400); } } });
  H.fx.push((fx, dt, T) => { for (const sh of DATA.shrines) { if (sh.r !== K.G.region || !sh.pos) continue; const d = Math.hypot(sh.pos.x - K.player.x, sh.pos.z - K.player.z); if (d > 160) continue;
      if (!done(sh)) fx.push({ type: 2, p: [sh.gate.x, sh.pos.y + 30, sh.gate.z], size: [1, 30], grow: 2.2, cyl: true, tint: [.5, .9, 1] });
      else fx.push({ type: 1, p: [sh.goal.x, sh.goal.y + 1.2, sh.goal.z], size: [2, 2], grow: 1, tint: [1, .9, .5] });
      const s = st[sh.id]; if (sh.kind === 'rings' && !done(sh)) sh.parts.rings.forEach((rg, k) => { const cur = s && s.run && s.k === k, past = s && s.run && k < s.k; if (past) return;
        fx.push({ type: 3, p: [sh.pos.x + rg[0], sh.pos.y + rg[1], sh.pos.z + rg[2]], size: [2.6, 2.6], grow: cur ? 1.4 : .5, tint: cur ? [1, .85, .3] : [.6, .9, 1], seed: k }); });
      if (sh.kind === 'brazier' && d < 30) sh.parts.braz.forEach(([a, b, hgt], i) => { if ((st[sh.id] || {}).lit && st[sh.id].lit.includes(i)) fx.push({ type: 0, p: [sh.pos.x + a + .5, sh.pos.y + hgt + 2.1, sh.pos.z + b + .5], size: [.5, .7], grow: 1, cyl: true, seed: i }); }); } });
  // ---------- しらべる ----------
  H.target.push(cand => { const G = K.G; for (const sh of DATA.shrines) { if (sh.r !== G.region || !sh.pos) continue;
      cand(sh, 'shgate', sh.gate.x, sh.gate.z, 3); if (!done(sh) && Math.abs(K.player.y - sh.goal.y) < 2.5) cand(sh, 'shgoal', sh.goal.x, sh.goal.z, 2.6);
      if (sh.kind === 'brazier' && !done(sh)) sh.parts.braz.forEach(([a, b, hgt], i) => cand({ sh, i }, 'brazier', sh.pos.x + a + .5, sh.pos.z + b + .5, 2)); } });
  H.labels.shgate = t => done(t.o) ? `${t.o.name}（クリア）` : `${t.o.name}を しらべる`; H.labels.shgoal = '証の台を しらべる'; H.labels.brazier = '火を ともす';
  H.acts.shgate = async sh => { if (done(sh)) { await K.say([`${sh.name}：試練は もう こえた。 祠の 奥で 証が やさしく 光っている。`]); return; }
    await K.say([`【試練の祠：${sh.name}】`, sh.hint]);
    if (sh.kind === 'climb' && !(st[sh.id] || {}).given) { st[sh.id] = { ...(st[sh.id] || {}), given: 1 }; K.G.blk[0] = (K.G.blk[0] || 0) + 16; K.G.mat = 0; K.hud(); await K.say(['祠の 精から 板ブロックを 16こ あずかった。（「つくる」で 置ける。 1段ずつの 階段に しよう）']); }
    if (sh.kind === 'rings') { st[sh.id] = { run: true, k: 0, t0: performance.now() / 1000 }; await K.say(['光の輪が かがやきだした！ 金色の 輪から じゅんに くぐれ！']); st[sh.id].t0 = frameT(); return; }
    if (sh.kind === 'combat') { if (!(await K.confirm('祠の 番人と たたかう？（3連戦・にげられない）'))) return; const lv = Math.max(...K.G.party.map(m => m.lv)); const pool = DATA.speciesOrder.filter(k => DATA.species[k].hab && !DATA.species[k].rare && !DATA.species[k].legend);
      for (let w = 0; w < 3; w++) { await K.say([`番人 ${w + 1}/3！`]); const res = await K.runBattle(Array.from({ length: 2 + w }, () => ({ sp: pool[Math.floor(R() * pool.length)], lv: lv - 1 + w, shiny: false })), { noFlee: true }); if (res !== 'win') return K.defeated(); }
      openDoor(sh); return; }
    if (['push', 'memory'].includes(sh.kind) && (st[sh.id] || {}).open !== true) { const c = await K.menu({ title: sh.name, items: [{ label: 'がんばる' }, { label: 'しかけを リセット' }] }); if (c === 1) { resetShrine(sh); K.toast('しかけを もとに もどした', 1200); } } };
  let _T = 0; H.frame.push((dt, T) => { _T = T; }); const frameT = () => _T;
  H.acts.brazier = async ({ sh, i }) => { const s = st[sh.id] = st[sh.id] || {}; s.lit = s.lit || []; if (s.lit.includes(i)) return;
    const order = sh.parts.braz.map((b, k) => [b[2], k]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    if (order[s.lit.length] === i) { s.lit.push(i); Music.sfx('magic'); if (s.lit.length === order.length) openDoor(sh); }
    else { s.lit = []; Music.sfx('cancel'); await K.say(['火が ゆらいで、すべての 火皿が 消えてしまった……']); } };
  H.acts.shgoal = async sh => { if (!(st[sh.id] || {}).open && sh.kind !== 'climb') { await K.say(['証の台は まだ 光を おびていない。']); return; }
    const G = K.G; G.shrineDone = G.shrineDone || {}; G.shrineDone[sh.id] = 1; const n = Object.keys(G.shrineDone).length; const w = sh.reward; const lines = [`${sh.name}の 試練を こえた！`, '「試練の証」が 光と なって からだに とけこんだ——'];
    const sb = SHOU[(n - 1) % 2]; sb.f(G); lines.push(`【証の力】${sb.text}`);
    if (w.gold) { G.gold += w.gold; lines.push(`${w.gold}ゴールドを 手に入れた！`); } if (w.give) for (const [k, v] of Object.entries(w.give)) { K.gain(k, v); lines.push(`${DATA.items[k].name}を ${v}こ 手に入れた！`); }
    if (w.blocks) for (const [k, v] of Object.entries(w.blocks)) { G.blk[k] = (G.blk[k] || 0) + v; lines.push(`${DATA.blocks[k]}ブロックを ${v}こ 手に入れた！`); }
    Music.jingle('light', K.fieldSong()); await K.say([...lines, `（試練の祠 ${n}/${DATA.shrines.length}）`]); K.save(); K.hud(); };
  // 地図と クエストへ
  K.shrinesHere = r => DATA.shrines.filter(s => s.r === r && s.pos);
  K.shrineDoneFn = done; K.shrineSt = st;
  H.load.push(G => { G.shrineDone = G.shrineDone || {}; });
  H.mapMarks.push((r, pos) => DATA.shrines.filter(s => s.r === r && s.pos).map(s => `<span class="mk${done(s) ? ' lit' : ''}" style="${pos(s.pos.x, s.pos.z)}" title="${s.name}">${done(s) ? '✦' : '◈'}</span>`));
  H.warps.push(r => DATA.shrines.filter(s => s.r === r && s.pos && done(s)).map(s => ({ n: s.name, x: s.gate.x, z: s.gate.z + 1.5 })));
  H.quest.push(() => { const n = Object.keys(K.G.shrineDone || {}).length; const here = DATA.shrines.filter(s => s.r === K.G.region && !done(s)).map(s => s.name); return `<li>試練の祠 ${n}/${DATA.shrines.length}${here.length ? `（この地方：${here.join('・')}）` : ''}</li>`; });
})();
