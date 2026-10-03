// 灯台ダンジョン（任意）— 灯を ともした 灯台の「なかの回廊」。3つの しかけを こえて いちばん うえの ひざらへ。
// 方針：本編の進行（灯台の試練・点火）は変えない。点火ずみの 灯台から 入れる 寄り道。セーブは G.lhDun と帰還先 G.lhDunExit を追加。
// 設計：docs/design/lighthouses.md。高い天井の3つの間と、さいごの4階ひざら。保存キー・既存の3しかけは維持。
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const H = K.HOOK, B = World.Blocks;
  // 回廊の 置き場所：島から 遠い 海の 上空（下は 海なので 敵は わかない）
  const DUNS = [
    { i: 0, r: 0, name: '野原の灯台・なか', x: 228, z: 228, y: 70,
      hint: ['【灯台のなか：野原の灯台】', '一の間「ひかる あしば」：光る 足場が あらわれる 間に わたれ。', '二の間「おもしのスイッチ」：おもしを スイッチへ おせ。', '三の間「ひかりの かけら」：段を のぼって 3つの かけらに ふれよ。'],
      reward: { gold: 600, give: { shizuku: 2, pan: 2 } } },
  ];
  const themes = [
    [0, 1, 'ふたつのとうの灯台', 'bridge', ['ひだり', 'みぎ', 'まんなか'], [0, 2, 1], 'はしの はぐるまを、ひだり → まんなか → みぎ の じゅんで まわそう。'],
    [0, 2, 'いわやまの灯台', 'rock', ['ひだりの ひび', 'まんなかの ひび', 'みぎの ひび'], [2, 1, 0], 'かべの ひびを、みぎ → まんなか → ひだり の じゅんで しらべよう。'],
    [0, 3, 'つきよの灯台', 'mirror', ['ひだりの かがみ', 'まんなかの かがみ', 'みぎの かがみ'], [0, 1, 2, 1], 'つきの ひかりを、ひだり → まんなか → みぎ → まんなか と つなごう。'],
    [0, 4, 'がけの灯台', 'wind', ['にしかぜ', 'うわむき', 'ひがしかぜ'], [0, 2, 1], 'かぜの むきを、にし → ひがし → うえ と かえよう。'],
    [3, 0, 'も の灯台', 'kelp', ['ひだりの こんぶ', 'まんなかの こんぶ', 'みぎの こんぶ'], [1, 0, 2], 'こんぶを、まんなか → ひだり → みぎ と ほどいて みずを とおそう。'],
    [3, 1, 'こうらの灯台', 'shell', ['ひだりへ まわす', 'まっすぐ', 'みぎへ まわす'], [2, 0, 1], 'かじを、みぎ → ひだり → まっすぐ と まわそう。'],
    [3, 2, 'かみなりの灯台', 'charge', ['みずを とめる', 'でんきを つなぐ', 'ぼうへ ながす'], [0, 1, 2], 'みずを とめる → でんきを つなぐ → ぼうへ ながす。 じゅんばんを まもろう。'],
  ];
  for (const [r, i, name, theme, controls, sequence, clue] of themes) DUNS.push({
    r, i, name, theme, controls, sequence, clue, x: 228, z: 228, y: 70,
    hint: [`【${name}の なか】`, 'ひかる あしばで あなを わたろう。', clue, 'さいごに 3つの ひかりを あつめよう。'],
    reward: { gold: r === 3 ? 1000 : 450 /* 島は 第1章の 寄り道なので ひかえめ（docs/reports/economy.md） */, give: { shizuku: 2, pan: 2 } }
  });
  const key = d => d.r === 0 ? d.i : `sea${d.i}`;
  const source = d => (d.r === 0 ? K.REG[0].beacons : K.REG[3].lh)[d.i];
  const lit = d => !!(d.r === 0 ? source(d)?.lit : K.G.lh?.[d.i]);
  // 同じ地域の回廊を使い回す。8基ぶんのブロックを常駐させない。
  const active = {}, owned = {};
  // 形：x は -6〜6、z は 0（入口）→ -44（ひざら）。各間の 床の 高さ：一 0・二 2・三 4
    const T = { floor: 1, wall: 6, lamp: 2, glass: 7, push: 12, plate: 13, plateOn: 14, door: 4, goal: 7, step: 0 };
  const done = d => !!((K.G.lhDun || {})[key(d)]);
  const st = {}; // 実行中の 状態（セーブしない）
  const S = (d, a, h, b, t) => { const x = d.x + a, y = d.y + h, z = d.z + b;
    if (B.has(x, y, z) && !B.isProt(x, y, z)) return;
    (owned[d.r] ||= new Set()).add(`${x},${y},${z}`);
    const skin = { bridge: [6, 0], rock: [1, 6], mirror: [4, 7], wind: [4, 0], kelp: [8, 6], shell: [4, 6], charge: [6, 1] }[d.theme];
    if (skin && t === T.wall) t = skin[0]; else if (skin && t === T.floor) t = skin[1];
    B.set(x, y, z, t, true, d.r); };
  const Rm = (d, a, h, b) => { if (B.isProt(d.x + a, d.y + h, d.z + b)) B.rm(d.x + a, d.y + h, d.z + b, d.r); };
  const Get = (d, a, h, b) => B.get(d.x + a, d.y + h, d.z + b);
  const fhOf = b => b >= -13 ? 0 : b >= -27 ? 2 : 4; // 床の 高さ（一 0・二 2・三 4）
  function build(d) {
    const oldRegion = World.region;
    World.setRegion(d.r);
    for (const cell of owned[d.r] || []) { const [x, y, z] = cell.split(',').map(Number); if (B.isProt(x, y, z)) B.rm(x, y, z, d.r); }
    owned[d.r] = new Set(); active[d.r] = d;
    // 床と 外壁（高さ 6。のぼれない）
    for (let a = -7; a <= 7; a++) for (let b = 1; b >= -45; b--) {
      const fh = fhOf(b);
      for (let h = -1; h <= fh; h++) S(d, a, h, b, T.floor);
      const edge = Math.abs(a) === 7 || b === 1 || b === -45;
      if (edge) for (let h = fh + 1; h <= fh + (fh === 4 ? 9 : 6); h++) S(d, a, h, b, (h - fh) === 3 && (a + b) % 4 === 0 ? T.lamp : T.wall);
    }
    // 石の天井とひさし。第三人称カメラと最高の足場の上に6m以上の余白を残す。
    // 屋根は保護ブロックなので外からも実在し、掘ったり登ったりしてしかけを飛ばせない。
    d.architecture = { floors: 4, roof: [], bounds: { x: d.x, z: d.z, y: d.y } };
    for (let b = 2; b >= -46; b--) {
      const roofH = b >= -28 ? 13 : 16;
      for (let a = -8; a <= 8; a++) { S(d, a, roofH, b, T.wall); d.architecture.roof.push([d.x + a, d.y + roofH, d.z + b]); }
      // 太いリブと高窓のある外壁。柱は通路の外側、動く足場や押しブロックには触れない。
      for (const a of [-7, 7]) for (let h = fhOf(b) + 1; h < roofH; h++) {
        S(d, a, h, b, h >= roofH - 3 && b % 6 >= -1 ? T.glass : T.wall);
      }
      if (b === 1 || b === -45) for (let a = -6; a <= 6; a++) for (let h = fhOf(b) + 1; h < roofH; h++) S(d, a, h, b, h === roofH - 2 && Math.abs(a) <= 1 ? T.glass : T.wall);
      if (b % 6 === 0) for (const a of [-8, 8]) for (let h = 0; h <= roofH; h++) S(d, a, h, b, T.wall);
    }
    // 高い天井へ切り替わる面も閉じ、段差のすきまから空が見えないようにする。
    for (let a = -7; a <= 7; a++) for (let h = 14; h <= 15; h++) S(d, a, h, -28, T.wall);
    // 間の しきり（とびらつき）
    const P = d.parts = { pit: [], hop: [], plates: [[-4, -24], [4, -24]], movs: [[-3, -19], [3, -20]], door1: [], door2: [], door3: [], shards: [], goal: [0, -42] };
    const wallAt = (b, hNext, door) => { for (let a = -6; a <= 6; a++) for (let h = 1; h < 13; h++) { if (Math.abs(a) <= 1 && h > hNext && h <= hNext + 3) { door.push([a, h, b]); S(d, a, h, b, T.door); } else if (h > hNext || Math.abs(a) > 1) S(d, a, h, b, T.wall); }
      for (let a = -1; a <= 1; a++) for (let h = 1; h <= hNext; h++) S(d, a, h, b, T.floor); };
    // 段差（一→二、二→三）：とびらの 手前に 1段ずつの 階段
    for (let a = -1; a <= 1; a++) { S(d, a, 1, -13, T.floor); S(d, a, 3, -27, T.floor); }
    wallAt(-14, 2, P.door1); wallAt(-28, 4, P.door2);
    // 一の間：幅 5 の 落とし穴（深さ 3）。光る 飛び石が 交互に あらわれる。落ちたら 手前の 階段で もどる
    for (let a = -7; a <= 7; a++) for (let b = -4; b >= -10; b--) for (let h = -4; h <= 0; h++) S(d, a, h, b, T.floor); // 穴の 外がわを ふさぐ
    for (let a = -6; a <= 6; a++) for (let b = -5; b >= -9; b--) { for (let h = -3; h <= 0; h++) Rm(d, a, h, b); P.pit.push([a, b]); }
    for (let k = 0; k <= 3; k++) for (let h = -3; h <= -3 + k; h++) S(d, -6, h, -8 + k, T.floor); // もどり階段（左はし・入口がわへ）
    P.hop = [[0, -6, 0], [0, -8, 1], [2, -7, 2], [-2, -7, 2]]; // [a,b,組]
    // 二の間：おもし 2つを スイッチ 2つへ
    for (const [a, b] of P.plates) S(d, a, 2, b, T.plate);
    for (const [a, b] of P.movs) S(d, a, 3, b, T.push);
    // 三の間：段の 上の かけら 3つ（自動で 1段ずつ 上がれる 高さ）
    const stairs = [[-5, -32, 1], [-5, -33, 2], [-5, -34, 3], [5, -36, 1], [5, -37, 2], [5, -38, 3], [5, -39, 4], [0, -34, 1], [0, -35, 2]];
    for (const [a, b, n] of stairs) for (let h = 1; h <= n; h++) S(d, a, 4 + h, b, T.floor);
    P.shards = [[-5, -34, 4 + 3 + 1], [5, -39, 4 + 4 + 1], [0, -35, 4 + 2 + 1]];
    // ひざらの 前の とびら（かけら 3つで ひらく）
    for (let a = -2; a <= 2; a++) for (let h = 5; h <= 8; h++) { S(d, a, h, -40, T.door); P.door3.push([a, h, -40]); }
    for (let a = -6; a <= 6; a++) for (let h = 5; h <= 15; h++) if (Math.abs(a) > 2 || h >= 9) S(d, a, h, -40, T.wall);
    // 第4階：かけらの扉の先だけにある上り階段と、ひざらの台。
    // 1段1m。既存の判定（3しかけ完了）と報酬はそのまま、追加の保存フラグはない。
    for (let b = -41; b >= -44; b--) for (let a = -1; a <= 1; a++) for (let h = 5; h <= -b - 36; h++) S(d, a, h, b, T.floor);
    // ひざらの床も同じ高さ。最後だけ2mの段差にして歩行を止めない。
    S(d, 0, 8, -44, T.goal); S(d, -1, 8, -44, T.lamp); S(d, 1, 8, -44, T.lamp);
    d.gate = { x: d.x + .5, z: d.z + .5, y: d.y + 1 }; d.goalP = { x: d.x + .5, z: d.z - 43.5, y: d.y + 9 };
    if (d.theme) {
      for (const [a, b] of P.movs) Rm(d, a, 3, b);
      P.controls = [[-4, -19], [0, -21], [4, -19]];
      P.controls.forEach(([a, b], i) => S(d, a, 3, b, [2, 7, 10][i]));
    }
    World.setRegion(oldRegion);
  }
  build(DUNS[0]);
  const inD = (d, p = K.player) => K.G.region === d.r && Math.abs(p.x - d.x - .5) < 8 && p.z < d.z + 2.5 && p.z > d.z - 46 && p.y > d.y - 6 && p.y < d.y + 20;
  const here = () => { const d = active[K.G.region]; return d && inD(d) ? d : null; };
  const floorOf = (d, p = K.player) => p.z <= d.z - 41 && p.y >= d.y + 8.6 ? 4 : p.z < d.z - 28 ? 3 : p.z < d.z - 14 ? 2 : 1;
  const progress = d => { const s = st[key(d)] || {}; return `${floorOf(d)}かい / ${!s.o1 ? 'ひかる あしばを わたる' : !s.o2 ? d.theme ? `しかけ ${s.sequence || 0}/${d.sequence.length}` : 'おもしを 2つ おす' : (s.got || []).length < 3 ? `かけら ${(s.got || []).length}/3` : '4かいの ひざらへ'}`; };
  const previousTrack = H.track;
  H.track = (...args) => { const d = here(); return d ? { t: `${d.name}・${progress(d)}`, p: null, detail: 'ヒントは メニューから' } : previousTrack ? previousTrack(...args) : null; };
  K.extraAreas = K.extraAreas || []; for (const r of [0, 3]) K.extraAreas.push({ rg: r, id: 'lhdroom' + r, x: 228, z: 206, r: 30, n: '灯台の なか', s: '灯台の なか（寄り道）' });
  const prevNoClimb = H.noClimb; H.noClimb = () => !!here() || !!(prevNoClimb && prevNoClimb());
  function reset(d) { build(d); const P = d.parts; for (const [a, h, b] of [...P.door1, ...P.door2, ...P.door3]) S(d, a, h, b, T.door);
    for (let a = -6; a <= 6; a++) for (let b = -15; b >= -27; b--) if (Get(d, a, 3, b) === T.push) Rm(d, a, 3, b);
    if (!d.theme) for (const [a, b] of P.movs) S(d, a, 3, b, T.push); st[key(d)] = {}; }
  const open = (d, list, msg) => { for (const [a, h, b] of list) Rm(d, a, h, b); Music.sfx('place'); K.toast(msg, 1600); };
  // 入る・出る
  async function enter(d) { if (K.G.region !== d.r || !lit(d)) return; checked = true; const p = K.player; reset(d); st[key(d)].back = { x: p.x, z: p.z }; K.G.lhDunExit = { r: d.r, i: d.i };
    await K.fade(true); p.x = d.gate.x; p.z = d.gate.z - 1; p.y = d.gate.y + .05; p.vx = p.vz = p.vy = 0; K.trail.length = 0; K.enemies = []; K.cam.yaw = Math.PI; p.yaw = Math.PI; await K.wait(200); await K.fade(false);
    await K.say(d.hint); }
  async function leave(d) { const s = st[key(d)] || {}; const b = source(d); const x = s.back ? s.back.x : b.x + 3, z = s.back ? s.back.z : b.z + 3; await K.warpTo(x, z); }
  // 押しブロック
  let cd = 0;
  H.push.push((nx, nz, py, wx, wz, dt) => { cd -= dt; const d = here(); if (!d || cd > 0) return; let dx = 0, dz = 0; if (Math.abs(wx) > Math.abs(wz)) dx = Math.sign(wx); else dz = Math.sign(wz); if (!dx && !dz) return;
    const ix = Math.floor(nx + dx * .36), iz = Math.floor(nz + dz * .36), iy = Math.floor(py + .1); if (B.get(ix, iy, iz) !== T.push) return;
    const tx = ix + dx, tz = iz + dz; if (B.has(tx, iy, tz) || !B.has(tx, iy - 1, tz)) return; B.move(ix, iy, iz, tx, iy, tz); cd = .35; Music.sfx('mine'); });
  // 毎フレーム：飛び石・スイッチ・かけら
  H.frame.push((dt, Tm) => { const d = here(); if (!d) return; const s = st[key(d)] = st[key(d)] || {}, P = d.parts, p = K.player;
    // 一の間：1.4秒ごとに 組 0 / 1 が 入れかわる（組 2 は いつも 出ている 休み石）
    const ph = Math.floor(Tm / (d.theme === 'wind' ? 2.2 : d.theme === 'mirror' ? 1.8 : 1.4)) % 2; if (s.ph !== ph) { s.ph = ph; for (const [a, b, g] of P.hop) { const on = g === 2 || g === ph; for (let w = -1; w <= 1; w++) on ? S(d, a + w, 0, b, T.glass) : (Get(d, a + w, 0, b) === T.glass && Rm(d, a + w, 0, b)); } }
    if (!s.o1 && p.z < d.z - 9.2 && p.y > d.y + .5) { s.o1 = 1; open(d, P.door1, '一の間を こえた！ 奥の とびらが ひらいた。'); }
    // 二の間
    if (!d.theme && s.o1 && !s.o2) { let all = true; for (const [a, b] of P.plates) { const on = Get(d, a, 3, b) === T.push; const t = on ? T.plateOn : T.plate; if (Get(d, a, 2, b) !== t) S(d, a, 2, b, t); all = all && on; } if (all) { s.o2 = 1; open(d, P.door2, 'カチリ…… 二の間の とびらが ひらいた！'); } }

    // 三の間
    s.got = s.got || []; P.shards.forEach(([a, b, h], k) => { if (!s.o2 || s.got.includes(k)) return; if (Math.hypot(p.x - (d.x + a + .5), p.z - (d.z + b + .5)) < 1.1 && Math.abs(p.y - (d.y + h)) < 1.3) { s.got.push(k); Music.sfx('pick'); K.toast(`ひかりの かけら ${s.got.length}/3`, 1100); if (s.got.length === 3) open(d, P.door3, 'かけらが 光の 道に なった！ ひざらの 間が ひらいた！'); } });
  });
  H.fx.push((fx, dt, Tm) => { for (const d of DUNS) { if (K.G.region !== d.r) continue; const b = source(d); const s = st[key(d)] || {};
      if (b && lit(d) && !done(d) && Math.hypot(b.x - K.player.x, b.z - K.player.z) < 60) fx.push({ type: 1, p: [b.x + 2.4, b.y + 1.2, b.z + 2.4], size: [1.2, 1.2], grow: 1, tint: [.6, .9, 1] });
      if (here() !== d) continue; d.parts.shards.forEach(([a, bb, h], k) => { if (!(s.got || []).includes(k)) fx.push({ type: 1, p: [d.x + a + .5, d.y + h + .6, d.z + bb + .5], size: [.7, .7], grow: 1.2, tint: [1, .85, .4], seed: k }); });
      if ((s.got || []).length === 3 || done(d)) fx.push({ type: 0, p: [d.goalP.x, d.goalP.y + 1.6, d.goalP.z], size: [.6, .9], grow: 1, cyl: true, tint: [1, .7, .3] }); } });
  // しらべる
  H.target.push(cand => { for (const d of DUNS) { if (K.G.region !== d.r) continue; const b = source(d);
      if (b && lit(d) && !here()) cand(d, 'lhdIn', b.x + 2.4, b.z + 2.4, 2.2);
      if (here() === d) { if (d.theme && st[key(d)]?.o1 && !st[key(d)]?.o2) d.parts.controls.forEach(([a, b], j) => cand({ d, j }, 'lhdControl', d.x + a + .5, d.z + b + .5, 2.2)); cand(d, 'lhdOut', d.gate.x, d.gate.z, 2.2); if (Math.abs(K.player.y - d.goalP.y) < 2.5) cand(d, 'lhdGoal', d.goalP.x, d.goalP.z + 1, 2.4); } } });
  H.labels.lhdControl = t => t.o.d.controls[t.o.j];
  H.acts.lhdControl = async ({ d, j }) => {
    if (here() !== d || !st[key(d)]?.o1 || st[key(d)].o2) return;
    const s = st[key(d)], n = s.sequence || 0;
    if (j !== d.sequence[n]) { s.sequence = 0; K.toast('じゅんばんが ちがう。 はじめから やりなおそう。', 1800); return; }
    s.sequence = n + 1; Music.sfx('place');
    if (s.sequence === d.sequence.length) { s.o2 = 1; open(d, d.parts.door2, 'しかけが とけた！ おくの とびらが ひらいた。'); }
    else K.toast(`ひかりが つながった ${s.sequence}/${d.sequence.length}`, 1300);
  };
  H.labels.lhdIn = t => done(t.o) ? `${t.o.name}へ（クリア）` : `灯台の なかへ 入る`; H.labels.lhdOut = '灯台の 外へ 出る'; H.labels.lhdGoal = 'いちばん うえの ひざらを しらべる';
  H.acts.lhdIn = async d => { if (!(await K.confirm(done(d) ? `${d.name}へ 入りますか？（クリアずみ）` : '灯台の 足もとに 小さな とびらが ある。 中へ 入りますか？（寄り道・いつでも 出られる）'))) return; await enter(d); };
  H.acts.lhdOut = async d => { const c = await K.menu({ title: d.name, items: [{ label: '外へ 出る' }, { label: 'しかけを リセット' }, { label: 'やめる' }] }); if (c === 0) await leave(d); else if (c === 1) { const back = st[key(d)]?.back; reset(d); st[key(d)].back = back; K.player.x = d.gate.x; K.player.z = d.gate.z - 1; K.player.y = d.gate.y + .05; K.player.vx = K.player.vy = K.player.vz = 0; K.toast('しかけを もとに もどした', 1200); } };
  H.menu.push(() => { const d = here(); return d ? { label: '灯台の しかけ', sub: 'ヒント・やりなおし・そとへ', fn: async () => {
    const c = await K.menu({ title: `${d.name}・${floorOf(d)}かい`, items: [{ label: 'ヒントを よむ', sub: progress(d) }, { label: 'やりなおす・そとへ' }, { label: 'やめる' }] });
    if (c === 0) await K.say(d.hint); else if (c === 1) { await H.acts.lhdOut(d); return 'close'; }
  } } : null; });
  H.acts.lhdGoal = async d => { const s = st[key(d)] || {}; if ((!s.o1 || !s.o2 || (s.got || []).length < 3) && !done(d)) { await K.say(['ひざらは まだ 冷たい。 かけらの 光が 足りない。']); return; }
    if (done(d)) { await K.say(['いちばん うえの ひざらが、海を やさしく 照らしている。']); return; }
    const G = K.G; G.lhDun = G.lhDun || {}; G.lhDun[key(d)] = 1; const w = d.reward, L = [`${d.name}の いちばん うえに たどりついた！`, 'ひざらの 灯が、ひときわ 明るく なった。'];
    if (w.gold) { G.gold += w.gold; L.push(`${w.gold}ゴールドを 手に入れた！`); } for (const [k, v] of Object.entries(w.give || {})) { K.gain(k, v); L.push(`${DATA.items[k].name}を ${v}こ 手に入れた！`); }
    Music.jingle('light', K.fieldSong()); await K.say(L); K.save(); K.hud(); if (await K.confirm('外へ 出ますか？')) await leave(d); };
  H.load.push(G => { G.lhDun = G.lhDun || {}; checked = false; });
  // 回廊の 中で ロードしたら、灯台の 足もとへ もどす（しかけは セーブしない ため）
  let checked = false; H.frame.push(() => {
    if (checked || K.phase !== 'field') return; checked = true;
    const r = K.G.region, p = K.player;
    if (![0, 3].includes(r) || !inD({ r, x: 228, z: 228, y: 70 }, p)) return;
    const e = K.G.lhDunExit, d = DUNS.find(d => d.r === r && d.i === (e?.r === r ? e.i : 0)) || DUNS.find(d => d.r === r);
    const b = source(d); if (!b) return;
    p.x = b.x + 3; p.z = b.z + 3; p.y = K.surfaceAt(p.x, p.z, 99); p.vx = p.vy = p.vz = 0; K.trail.length = 0;
  });
  H.mapMarks.push((r, pos) => DUNS.filter(d => d.r === r && source(d) && lit(d)).map(d => { const b = source(d); return `<span class="mk${done(d) ? ' lit' : ''}" style="${pos(b.x + 6, b.z + 6)}" title="${d.name}">${done(d) ? '✦' : '▣'}</span>`; }));
  K.lhDuns = DUNS; K.lhSt = st; K.lhDungeon = { here, enter, leave, reset, key, source, lit, floorOf, progress };
})();
