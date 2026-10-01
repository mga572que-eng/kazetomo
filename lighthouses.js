// 灯台ダンジョン（任意）— 灯を ともした 灯台の「内部の回廊」。3つの しかけを こえて 最上階の 火皿へ。
// 方針：本編の進行（灯台の試練・点火）は変えない。点火ずみの 灯台から 入れる 寄り道。セーブは G.lhDun のみ追加。
// 設計：docs/design/lighthouses.md（Gemini 提案）を、回廊型（カメラが 見失わない 屋根なし・横並び）に 落としこんだもの。
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const H = K.HOOK, B = World.Blocks;
  // 回廊の 置き場所：島から 遠い 海の 上空（下は 海なので 敵は わかない）
  const DUNS = [
    { i: 0, r: 0, name: '野原の灯台・内部', x: 228, z: 228, y: 70,
      hint: ['【灯台の内部：野原の灯台】', '一の間「導きの飛び石」：光る 足場が あらわれる 間に わたれ。', '二の間「おもしの感圧板」：おもしを スイッチへ おせ。', '三の間「灯火の欠片」：段を のぼって 3つの 欠片に ふれよ。'],
      reward: { gold: 600, give: { shizuku: 2, pan: 2 } } },
  ];
  // 形：x は -6〜6、z は 0（入口）→ -44（火皿）。各間の 床の 高さ：一 0・二 2・三 4
    const T = { floor: 1, wall: 6, lamp: 2, glass: 7, push: 12, plate: 13, plateOn: 14, door: 4, goal: 7, step: 0 };
  const done = d => !!((K.G.lhDun || {})[d.i]);
  const st = {}; // 実行中の 状態（セーブしない）
  const S = (d, a, h, b, t) => B.set(d.x + a, d.y + h, d.z + b, t, true, d.r);
  const Rm = (d, a, h, b) => B.rm(d.x + a, d.y + h, d.z + b, d.r);
  const Get = (d, a, h, b) => B.get(d.x + a, d.y + h, d.z + b);
  const fhOf = b => b >= -13 ? 0 : b >= -27 ? 2 : 4; // 床の 高さ（一 0・二 2・三 4）
  function build(d) {
    World.setRegion(d.r);
    // 床と 外壁（高さ 6。のぼれない）
    for (let a = -7; a <= 7; a++) for (let b = 1; b >= -45; b--) {
      const fh = fhOf(b);
      for (let h = -1; h <= fh; h++) S(d, a, h, b, T.floor);
      const edge = Math.abs(a) === 7 || b === 1 || b === -45;
      if (edge) for (let h = fh + 1; h <= fh + (fh === 4 ? 9 : 6); h++) S(d, a, h, b, (h - fh) === 3 && (a + b) % 4 === 0 ? T.lamp : T.wall);
    }
    // 間の しきり（扉つき）
    const P = d.parts = { pit: [], hop: [], plates: [[-4, -24], [4, -24]], movs: [[-3, -19], [3, -20]], door1: [], door2: [], door3: [], shards: [], goal: [0, -42] };
    const wallAt = (b, hNext, door) => { for (let a = -6; a <= 6; a++) for (let h = 1; h <= hNext + 5; h++) { if (Math.abs(a) <= 1 && h > hNext && h <= hNext + 3) { door.push([a, h, b]); S(d, a, h, b, T.door); } else if (h > hNext || Math.abs(a) > 1) S(d, a, h, b, T.wall); }
      for (let a = -1; a <= 1; a++) for (let h = 1; h <= hNext; h++) S(d, a, h, b, T.floor); };
    // 段差（一→二、二→三）：扉の 手前に 1段ずつの 階段
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
    // 三の間：段の 上の 欠片 3つ（自動で 1段ずつ 上がれる 高さ）
    const stairs = [[-5, -32, 1], [-5, -33, 2], [-5, -34, 3], [5, -36, 1], [5, -37, 2], [5, -38, 3], [5, -39, 4], [0, -34, 1], [0, -35, 2]];
    for (const [a, b, n] of stairs) for (let h = 1; h <= n; h++) S(d, a, 4 + h, b, T.floor);
    P.shards = [[-5, -34, 4 + 3 + 1], [5, -39, 4 + 4 + 1], [0, -35, 4 + 2 + 1]];
    // 火皿の 前の 扉（欠片 3つで ひらく）
    for (let a = -2; a <= 2; a++) for (let h = 5; h <= 8; h++) { S(d, a, h, -40, T.door); P.door3.push([a, h, -40]); }
    for (let a = -6; a <= 6; a++) if (Math.abs(a) > 2) for (let h = 5; h <= 8; h++) S(d, a, h, -40, T.wall);
    S(d, 0, 5, -42, T.goal); S(d, -1, 5, -42, T.wall); S(d, 1, 5, -42, T.wall);
    d.gate = { x: d.x + .5, z: d.z + .5, y: d.y + 1 }; d.goalP = { x: d.x + .5, z: d.z - 41.5, y: d.y + 5 };
    World.setRegion(0);
  }
  for (const d of DUNS) build(d);
  const inD = (d, p = K.player) => K.G.region === d.r && Math.abs(p.x - d.x - .5) < 8 && p.z < d.z + 2.5 && p.z > d.z - 46 && p.y > d.y - 6 && p.y < d.y + 20;
  const here = () => DUNS.find(d => inD(d));
  K.extraAreas = K.extraAreas || []; for (const d of DUNS) K.extraAreas.push({ rg: d.r, id: 'lhd' + d.i, x: d.x, z: d.z - 22, r: 30, n: d.name, s: '灯台の 内部（寄り道）' });
  const prevNoClimb = H.noClimb; H.noClimb = () => !!here() || !!(prevNoClimb && prevNoClimb());
  function reset(d) { const P = d.parts; for (const [a, h, b] of [...P.door1, ...P.door2, ...P.door3]) S(d, a, h, b, T.door);
    for (let a = -6; a <= 6; a++) for (let b = -15; b >= -27; b--) if (Get(d, a, 3, b) === T.push) Rm(d, a, 3, b);
    for (const [a, b] of P.movs) S(d, a, 3, b, T.push); st[d.i] = {}; }
  const open = (d, list, msg) => { for (const [a, h, b] of list) Rm(d, a, h, b); Music.sfx('place'); K.toast(msg, 1600); };
  // 入る・出る
  async function enter(d) { const p = K.player; reset(d); st[d.i].back = { x: p.x, z: p.z };
    await K.fade(true); p.x = d.gate.x; p.z = d.gate.z - 1; p.y = d.gate.y + .05; p.vx = p.vz = p.vy = 0; K.trail.length = 0; K.enemies = []; K.cam.yaw = Math.PI; p.yaw = Math.PI; await K.wait(200); await K.fade(false);
    await K.say(d.hint); }
  async function leave(d) { const s = st[d.i] || {}; const b = K.REG[d.r].beacons[d.i]; const x = s.back ? s.back.x : b.x + 3, z = s.back ? s.back.z : b.z + 3; await K.warpTo(x, z); }
  // 押しブロック
  let cd = 0;
  H.push.push((nx, nz, py, wx, wz, dt) => { cd -= dt; const d = here(); if (!d || cd > 0) return; let dx = 0, dz = 0; if (Math.abs(wx) > Math.abs(wz)) dx = Math.sign(wx); else dz = Math.sign(wz); if (!dx && !dz) return;
    const ix = Math.floor(nx + dx * .36), iz = Math.floor(nz + dz * .36), iy = Math.floor(py + .1); if (B.get(ix, iy, iz) !== T.push) return;
    const tx = ix + dx, tz = iz + dz; if (B.has(tx, iy, tz) || !B.has(tx, iy - 1, tz)) return; B.move(ix, iy, iz, tx, iy, tz); cd = .35; Music.sfx('mine'); });
  // 毎フレーム：飛び石・スイッチ・欠片
  H.frame.push((dt, Tm) => { const d = here(); if (!d) return; const s = st[d.i] = st[d.i] || {}, P = d.parts, p = K.player;
    // 一の間：1.4秒ごとに 組 0 / 1 が 入れかわる（組 2 は いつも 出ている 休み石）
    const ph = Math.floor(Tm / 1.4) % 2; if (s.ph !== ph) { s.ph = ph; for (const [a, b, g] of P.hop) { const on = g === 2 || g === ph; for (let w = -1; w <= 1; w++) on ? S(d, a + w, 0, b, T.glass) : (Get(d, a + w, 0, b) === T.glass && Rm(d, a + w, 0, b)); } }
    if (!s.o1 && p.z < d.z - 9.2 && p.y > d.y + .5) { s.o1 = 1; open(d, P.door1, '一の間を こえた！ 奥の 扉が ひらいた。'); }
    // 二の間
    if (s.o1 && !s.o2) { let all = true; for (const [a, b] of P.plates) { const on = Get(d, a, 3, b) === T.push; const t = on ? T.plateOn : T.plate; if (Get(d, a, 2, b) !== t) S(d, a, 2, b, t); all = all && on; } if (all) { s.o2 = 1; open(d, P.door2, 'カチリ…… 二の間の 扉が ひらいた！'); } }
    if (!s.o2 && p.z < d.z - 28.5) { s.o2 = 1; s.o1 = 1; for (const [a, h, b] of P.door2) Rm(d, a, h, b); } // 再開時に 閉じこめない
    // 三の間
    s.got = s.got || []; P.shards.forEach(([a, b, h], k) => { if (s.got.includes(k)) return; if (Math.hypot(p.x - (d.x + a + .5), p.z - (d.z + b + .5)) < 1.1 && Math.abs(p.y - (d.y + h)) < 1.3) { s.got.push(k); Music.sfx('pick'); K.toast(`灯火の欠片 ${s.got.length}/3`, 1100); if (s.got.length === 3) open(d, P.door3, '欠片が 光の 道に なった！ 火皿の 間が ひらいた！'); } });
  });
  H.fx.push((fx, dt, Tm) => { for (const d of DUNS) { if (K.G.region !== d.r) continue; const b = K.REG[d.r].beacons[d.i]; const s = st[d.i] || {};
      if (b && b.lit && !done(d) && Math.hypot(b.x - K.player.x, b.z - K.player.z) < 60) fx.push({ type: 1, p: [b.x + 2.4, b.y + 1.2, b.z + 2.4], size: [1.2, 1.2], grow: 1, tint: [.6, .9, 1] });
      if (!inD(d)) continue; d.parts.shards.forEach(([a, bb, h], k) => { if (!(s.got || []).includes(k)) fx.push({ type: 1, p: [d.x + a + .5, d.y + h + .6, d.z + bb + .5], size: [.7, .7], grow: 1.2, tint: [1, .85, .4], seed: k }); });
      if ((s.got || []).length === 3 || done(d)) fx.push({ type: 0, p: [d.goalP.x, d.goalP.y + 1.6, d.goalP.z], size: [.6, .9], grow: 1, cyl: true, tint: [1, .7, .3] }); } });
  // しらべる
  H.target.push(cand => { for (const d of DUNS) { if (K.G.region !== d.r) continue; const b = K.REG[d.r].beacons[d.i];
      if (b && b.lit && !inD(d)) cand(d, 'lhdIn', b.x + 2.4, b.z + 2.4, 2.2);
      if (inD(d)) { cand(d, 'lhdOut', d.gate.x, d.gate.z, 2.2); if (Math.abs(K.player.y - d.goalP.y) < 2.5) cand(d, 'lhdGoal', d.goalP.x, d.goalP.z + 1, 2.4); } } });
  H.labels.lhdIn = t => done(t.o) ? `${t.o.name}へ（クリア）` : `灯台の 内部へ 入る`; H.labels.lhdOut = '灯台の 外へ 出る'; H.labels.lhdGoal = '最上階の 火皿を しらべる';
  H.acts.lhdIn = async d => { if (!(await K.confirm(done(d) ? `${d.name}へ 入りますか？（クリアずみ）` : '灯台の 足もとに 小さな 扉が ある。 中へ 入りますか？（寄り道・いつでも 出られる）'))) return; await enter(d); };
  H.acts.lhdOut = async d => { const c = await K.menu({ title: d.name, items: [{ label: '外へ 出る' }, { label: 'しかけを リセット' }, { label: 'やめる' }] }); if (c === 0) await leave(d); else if (c === 1) { reset(d); K.toast('しかけを もとに もどした', 1200); } };
  H.acts.lhdGoal = async d => { const s = st[d.i] || {}; if ((s.got || []).length < 3 && !done(d)) { await K.say(['火皿は まだ 冷たい。 欠片の 光が 足りない。']); return; }
    if (done(d)) { await K.say(['最上階の 火皿が、海を やさしく 照らしている。']); return; }
    const G = K.G; G.lhDun = G.lhDun || {}; G.lhDun[d.i] = 1; const w = d.reward, L = [`${d.name}の 最上階に たどりついた！`, '火皿の 灯が、ひときわ 明るく なった。'];
    if (w.gold) { G.gold += w.gold; L.push(`${w.gold}ゴールドを 手に入れた！`); } for (const [k, v] of Object.entries(w.give || {})) { K.gain(k, v); L.push(`${DATA.items[k].name}を ${v}こ 手に入れた！`); }
    Music.jingle('light', K.fieldSong()); await K.say(L); K.save(); K.hud(); if (await K.confirm('外へ 出ますか？')) await leave(d); };
  H.load.push(G => { G.lhDun = G.lhDun || {}; });
  // 回廊の 中で ロードしたら、灯台の 足もとへ もどす（しかけは セーブしない ため）
  let checked = false; H.frame.push(() => { if (checked || K.phase !== 'field') return; checked = true; const d = here(); if (d) { const b = K.REG[d.r].beacons[d.i]; const p = K.player; p.x = b.x + 3; p.z = b.z + 3; p.y = K.surfaceAt(p.x, p.z, 99); K.trail.length = 0; } });
  H.mapMarks.push((r, pos) => DUNS.filter(d => d.r === r && K.REG[r].beacons[d.i] && K.REG[r].beacons[d.i].lit).map(d => { const b = K.REG[r].beacons[d.i]; return `<span class="mk${done(d) ? ' lit' : ''}" style="${pos(b.x + 6, b.z + 6)}" title="${d.name}">${done(d) ? '✦' : '▣'}</span>`; }));
  K.lhDuns = DUNS; K.lhSt = st;
})();
