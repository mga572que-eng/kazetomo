// 本編の 新しい 階：星の遺跡 2階「星見の間」と 光の かがみの 謎（docs/design/main-floors.md）
// ・遺跡の 北の 外がわに 石段 → 屋根の 上に 2階の 部屋。迷路・祭壇・中ボス・宝箱の 位置と 進行は かえない
// ・謎：西の かべの 星の 石から 光が のびる。かがみ（5まい）を まわして、光を 東の 星の 結晶へ とどける
// ・とどくと 南の ガラスの 扉が きえ、バルコニーの「星見の台」で ほうび（1回だけ）
// ・新しい 記録は G.flags.ruinsStar（1＝扉が ひらいた・2＝ほうびを うけとった）だけ。旧セーブは 未設定＝最初から
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const W = World, H = K.HOOK, B = W.Blocks;
  const R1 = K.REG[1], rf = R1 && R1.ruinsRoof; if (!rf) return;
  const C = (h, e = 0) => { const n = parseInt(h.slice(1), 16); return () => [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, e]; };
  const ox = rf.x, oz = rf.z, RY = rf.y, base = RY - 11, FY = RY + 1; // FY＝2階の 床の 高さ（屋根の 上）
  const X0 = ox + 8, X1 = ox + 26, Z0 = oz + 8, Z1 = oz + 26, IX = ox + 9, IZ = oz + 9, N = 17; // 部屋（内がわ 17×17）
  const S = (x, y, z, t) => B.set(x, y, z, t, true, 1);
  // ---- 石段（北の 外がわ、東へ のぼる）と 踊り場 ----
  W.setRegion(1);
  for (let k = 0; k <= 11; k++) for (const z of [oz - 1, oz - 2]) for (let y = base; y <= base + k; y++) S(ox + 4 + k, y, z, y === base + k ? 1 : 6); // 1段目は 地面から 半分
  for (let x = ox + 16; x <= ox + 18; x++) for (const z of [oz - 1, oz - 2]) for (let y = base; y <= RY; y++) S(x, y, z, y === RY ? 1 : 6);
  for (let x = ox + 16; x <= ox + 18; x++) B.rm(x, FY, oz, 1); // 屋根の ふちの かざりを どける
  for (const z of [oz - 3]) for (const x of [ox + 3]) for (let y = base + 1; y <= base + 3; y++) S(x, y, z, y === base + 3 ? 2 : 6); // 石段の 目じるしの 灯
  (R1.trees || []).forEach(t => { if (t.x > ox + 2 && t.x < ox + 21 && t.z > oz - 6 && t.z < oz) t.state = 'gone', t.t = -1e9; });
  (R1.rocks || []).forEach(t => { if (t.x > ox + 2 && t.x < ox + 21 && t.z > oz - 6 && t.z < oz) t.state = 'gone', t.t = -1e9; });
  // ---- 2階の 部屋（かべ 8段・天井） ----
  const DOOR_N = [ox + 16, ox + 17, ox + 18], starDoor = [];
  for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
    const edge = x === X0 || x === X1 || z === Z0 || z === Z1;
    if (edge) for (let h = 0; h < 8; h++) { const y = FY + h;
      if (z === Z0 && DOOR_N.includes(x) && h < 3) continue; // 北の 入口
      if (z === Z1 && DOOR_N.includes(x) && h < 3) { S(x, y, z, 7); starDoor.push([x, y, z]); continue; } // 星の 扉（ガラス）
      S(x, y, z, h === 5 && (x + z) % 4 === 0 ? 7 : (x === X0 || x === X1) && (z === Z0 || z === Z1) ? 1 : 6); }
    S(x, FY + 8, z, (x - X0) % 6 === 3 && (z - Z0) % 6 === 3 ? 7 : 6);
  }
  for (const x of [ox + 15, ox + 19]) for (const z of [Z0 - 1, Z1 + 1]) for (let h = 0; h < 4; h++) S(x, FY + h, z, h === 3 ? 2 : 6); // 入口の 柱と 灯
  for (const z of [oz - 1, oz - 2]) S(ox + 19, FY, z, 6); for (let x = ox + 4; x <= ox + 19; x++) { const t = Math.min(base + x - ox - 3, FY); for (let y = base; y <= t; y++) S(x, y, oz - 3, 6); } S(ox + 19, FY + 1, oz - 3, 2); // 石段の かべと 踊り場の てすり・灯
  for (let x = ox + 13; x <= ox + 21; x++) S(x, FY, Z1 + 6, 6); for (let z = Z1 + 1; z <= Z1 + 6; z++) { S(ox + 13, FY, z, 6); S(ox + 21, FY, z, 6); } // バルコニーの てすり
  // 星見の台（南の バルコニー）
  const DAIS = { x: ox + 17.5, z: Z1 + 3.5, y: FY + 1 }; S(ox + 17, FY, Z1 + 3, 6); S(ox + 16, FY, Z1 + 3, 1); S(ox + 18, FY, Z1 + 3, 1);
  W.setRegion(0);
  // ---- 謎：光の かがみ（a＝東へ、b＝南へ。0〜16） ----
  // A：(dx,dz)→(dz,dx)  B：(dx,dz)→(-dz,-dx)。こたえ：A A B B（5まい目は まよわせ）
  const MIR = [{ a: 4, b: 4, ans: 0, s0: 1 }, { a: 4, b: 10, ans: 0, s0: 1 }, { a: 12, b: 10, ans: 1, s0: 0 }, { a: 12, b: 2, ans: 1, s0: 0 }, { a: 12, b: 14, ans: null, s0: 0 }];
  const SRC = { a: -1, b: 4, dx: 1, dz: 0 }, GOAL = { a: 16, b: 2 };
  const wx = a => IX + a, wz = b => IZ + b;
  W.setRegion(1); for (const m of MIR) for (let h = 0; h < 2; h++) S(wx(m.a), FY + h, wz(m.b), 19); for (let h = 0; h < 2; h++) S(wx(GOAL.a), FY + h, wz(GOAL.b), 19); W.setRegion(0);
  const st = { s: MIR.map(m => m.s0) }; // かがみの 向き（セーブしない。とけたら こたえに そろえる）
  const flag = () => (K.G.flags || {}).ruinsStar || 0;
  function trace() { const cells = []; let a = SRC.a, b = SRC.b, dx = SRC.dx, dz = SRC.dz; let from = [-dx, -dz];
    for (let step = 0; step < 120; step++) { a += dx; b += dz; if (a < 0 || b < 0 || a >= N || b >= N) { cells.push({ a, b, from, to: null, wall: true }); return { cells, hit: false }; }
      const mi = MIR.findIndex(m => m.a === a && m.b === b); const cin = from;
      if (a === GOAL.a && b === GOAL.b) { cells.push({ a, b, from: cin, to: null }); return { cells, hit: true }; }
      if (mi >= 0) { [dx, dz] = st.s[mi] === 0 ? [dz, dx] : [-dz, -dx]; }
      cells.push({ a, b, from: cin, to: [dx, dz], mi }); from = [-dx, -dz]; }
    return { cells, hit: false }; }
  let beam = trace();
  const inRoom = () => K.G.region === 1 && K.player.x > X0 - 1 && K.player.x < X1 + 2 && K.player.z > Z0 - 2 && K.player.z < Z1 + 6 && K.player.y > FY - 2;
  function syncDoor() { const open = flag() >= 1, has = B.get(...starDoor[0]) === 7; /* 遺跡の 地方に いる ときだけ 呼ぶ */
    if (open && has) for (const [x, y, z] of starDoor) B.rm(x, y, z, 1); else if (!open && !has) for (const [x, y, z] of starDoor) B.set(x, y, z, 7, true, 1); }
  function solve() { const G = K.G; G.flags = G.flags || {}; if (!G.flags.ruinsStar) G.flags.ruinsStar = 1; if (G.region === 1) syncDoor(); Music.sfx('magic'); K.toast('光が 星の 結晶に とどいた！　南の ガラスの 扉が きえていく……', 2400); K.save(); }
  // ---- 見た目 ----
  const gMir = W.Geo(); W.prism(gMir, .42, .48, 0, .35, 8, C('#6b6458')); W.prism(gMir, .08, .08, .35, .7, 6, C('#8a7a5a'));
  W.prism(gMir, .74, .74, .66, 1.8, 10, C('#9a7a44'), 0, 0, 1, .05); W.prism(gMir, .66, .66, .74, 1.72, 10, C('#dff1ff', .7), 0, 0, 1, .09); // 金の ふちと 光る 鏡面
  const gHalf = W.Geo(); W.seg(gHalf, [0, 0, 0], [0, 0, .52], .07, .07, 6, C('#ffe9a8', 1)); W.seg(gHalf, [0, 0, 0], [0, 0, .52], .16, .16, 6, C('#ffd060', .62));
  const gSrc = W.Geo(); W.ico(gSrc, .45, [0, 0, 0], C('#bfe0ff', 1), .1, 1, 1.3);
  const gGoalDim = W.Geo(); W.prism(gGoalDim, .45, .5, 0, .4, 8, C('#6b6458')); W.ico(gGoalDim, .5, [0, 1.1, 0], C('#7a86a8', .3), .15, 1, 1.5);
  const gGoalLit = W.Geo(); W.prism(gGoalLit, .45, .5, 0, .4, 8, C('#6b6458')); W.ico(gGoalLit, .55, [0, 1.1, 0], C('#fff2b0', 1), .15, 1, 1.5);
  const gDais = W.Geo(); W.ico(gDais, .35, [0, .6, 0], C('#ffe6a0', 1), .1, 1, 1);
  const mMir = W.makeMesh(gMir, MIR.length), mHalf = W.makeMesh(gHalf, 260), mSrc = W.makeMesh(gSrc, 1), mGD = W.makeMesh(gGoalDim, 1), mGL = W.makeMesh(gGoalLit, 1), mDais = W.makeMesh(gDais, 1);
  const ALL = [mMir, mHalf, mSrc, mGD, mGL, mDais];
  const yawOf = (dx, dz) => Math.atan2(dx, dz); const BY = FY + 1.2;
  H.frame.push((dt, T) => { for (const m of ALL) m.n = 0; if (K.G.region !== 1 || K.phase !== 'field') return;
    if (Math.hypot(K.player.x - (ox + 17), K.player.z - (oz + 17)) > 90) return; syncDoor();
    if (flag() >= 1) st.s = MIR.map(m => m.ans == null ? m.s0 : m.ans);
    beam = trace(); const hit = beam.hit || flag() >= 1;
    MIR.forEach((m, i) => mMir.set(mMir.n++, wx(m.a) + .5, FY, wz(m.b) + .5, 1, st.s[i] === 0 ? -Math.PI / 4 : Math.PI / 4 /* 板は ローカルの x：A＝(1,1)向き */));
    mSrc.set(mSrc.n++, wx(SRC.a) + .95, BY, wz(SRC.b) + .5, 1 + Math.sin(T * 3) * .06, T);
    (hit ? mGL : mGD).set(0, wx(GOAL.a) + .5, FY, wz(GOAL.b) + .5, 1, T * .5); (hit ? mGL : mGD).n = 1;
    if (flag() < 2) mDais.set(mDais.n++, DAIS.x, FY + 1 + Math.sin(T * 2) * .1, DAIS.z, flag() >= 1 ? 1 : .5, T);
    const fl = 1 + Math.sin(T * 9) * .05; mHalf.set(mHalf.n++, wx(SRC.a) + .5, BY, wz(SRC.b) + .5, fl, yawOf(SRC.dx, SRC.dz));
    for (const c of beam.cells) { if (mHalf.n >= mHalf.maxN - 2) break; const x = wx(c.a) + .5, z = wz(c.b) + .5; if (c.wall) { mHalf.set(mHalf.n++, x, BY, z, fl, yawOf(c.from[0], c.from[1])); continue; }
      mHalf.set(mHalf.n++, x, BY, z, fl, yawOf(c.from[0], c.from[1])); if (c.to) mHalf.set(mHalf.n++, x, BY, z, fl, yawOf(c.to[0], c.to[1])); }
    if (beam.hit && flag() < 1) solve(); });
  // ---- しらべる ----
  H.target.push(cand => { if (!inRoom()) return; if (flag() < 1) MIR.forEach((m, i) => cand({ i }, 'ruMirror', wx(m.a) + .5, wz(m.b) + .5, 1.7));
    cand({}, 'ruStone', wx(SRC.a) + 1.2, wz(SRC.b) + .5, 1.6); if (Math.abs(K.player.y - FY) < 2.5) cand({}, 'ruDais', DAIS.x, DAIS.z, 2.2); });
  H.labels.ruMirror = 'かがみを まわす'; H.labels.ruStone = '星の 石を しらべる'; H.labels.ruDais = t => flag() >= 2 ? '星見の台（夜空を ながめる）' : '星見の台を しらべる';
  H.acts.ruMirror = async ({ i }) => { if (flag() >= 1) return; st.s[i] ^= 1; Music.sfx('mine'); };
  H.acts.ruStone = async () => { if (flag() >= 1) { await K.say(['星の 石：光は もう 結晶に とどいている。']); return; }
    await K.say(['【星見の間】', '石版：「星の 光を 東の 結晶へ。 かがみは 光を 直角に まげる」', '（かがみの 前で しらべると、向きが かわる）']);
    const c = await K.menu({ title: '星の 石', items: [{ label: 'がんばる' }, { label: 'かがみを もとに もどす' }] }); if (c === 1) { st.s = MIR.map(m => m.s0); K.toast('かがみを もとの 向きに もどした', 1200); } };
  H.acts.ruDais = async () => { const G = K.G; G.flags = G.flags || {};
    if (flag() < 1) { await K.say(['星見の台は くらく、ガラスの 扉の 向こうに ある。']); return; }
    if (flag() >= 2) { await K.say(['星見の台から 空を 見あげた。 星が 手に とどきそうなほど 近い。']); return; }
    G.flags.ruinsStar = 2; G.gold += 1500; K.gain('hoshikake', 3); K.gain('shizuku', 2); Music.jingle('light', K.fieldSong());
    await K.say(['星見の台に 手を おくと、台の 上の 光が ふわりと ほどけた。', '1500ゴールドを 手に入れた！', '星のかけらを 3こ 手に入れた！', '夜露のしずくを 2こ 手に入れた！']); K.save(); K.hud(); };
  // ---- 地図・クエスト ----
  H.mapMarks.push((r, pos) => r === 1 ? [`<span class="mk${flag() >= 2 ? ' lit' : ''}" style="${pos(ox + 17, oz - 2)}" title="星見の間（遺跡の 2階）">${flag() >= 2 ? '✦' : '◈'}</span>`] : []);
  H.quest.push(() => K.G.flags && K.G.flags.c2rumor ? `<li>星の遺跡 2階「星見の間」${flag() >= 2 ? '（クリア）' : '：北の 石段から 屋根の 上へ'}</li>` : '');
  K.mainFloors = { ruins: { room: { x0: X0, x1: X1, z0: Z0, z1: Z1, y: FY }, stairs: { x: ox + 4.5, z: oz - 1.5 }, landing: { x: ox + 17.5, z: oz - 1.5, y: FY }, dais: DAIS, mirrors: MIR, st, trace: () => trace(), wx, wz, starDoor, door: { x: ox + 17.5, z: Z0 + .5 } } };
})();

// ===== 2件目：星巣の塔「星座の間」と 星座の 床の 謎 =====
// ・塔の 中の 階段の 13段目の 高さに 床（7×7）を 張る。階段・屋上の 祭壇・中ボス・第3章の 流れは そのまま
// ・床の 星の 石を、星座の 線で つながる 順に ふむ。はじまりは いちばん 明るい 星。線の ない 星や 順の ちがう 星を ふむと やりなおし
// ・とけると 床の 真ん中に 光の 台が あらわれ、ほうび（1回だけ）。記録は G.flags.towerStars（1＝とけた・2＝ほうびずみ）だけ
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const W = World, H = K.HOOK, B = W.Blocks;
  const R2 = K.REG[2], tw = R2 && R2.tower; if (!tw) return;
  const C = (h, e = 0) => { const n = parseInt(h.slice(1), 16); return () => [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, e]; };
  const WX = Math.floor(tw.x), WZ = Math.floor(tw.z), PY = tw.base + 12, FY = PY + 1; // 床の ブロックの 高さ・立つ 高さ
  const STARS = [[-3, -3], [-1, -2], [1, -3], [3, -1], [2, 1], [0, 2], [-2, 3]], DECOY = [[-2, 0], [3, 3], [-3, 1]];
  const key = (a, b) => a + ',' + b, starAt = new Map(STARS.map((s, i) => [key(...s), i])), decoyAt = new Set(DECOY.map(d => key(...d)));
  W.setRegion(2);
  for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { const k = key(a, b); B.set(WX + a, PY, WZ + b, starAt.has(k) || decoyAt.has(k) ? 13 : (a + b) & 1 ? 6 : 1, true, 2); } // くらい 石の 床で 星を 目立たせる
  for (const [a, b] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) for (let h = 1; h <= 2; h++) B.set(WX + a, PY - h, WZ + b, 6, true, 2); // 床の 下の 支え（見た目）
  W.setRegion(0);
  const flag = () => (K.G.flags || {}).towerStars || 0;
  const st = { step: 0, last: null };
  const onFloor = () => K.G.region === 2 && Math.abs(K.player.y - FY) < .6 && Math.abs(K.player.x - tw.x) < 3.6 && Math.abs(K.player.z - tw.z) < 3.6;
  const cellOf = () => [Math.floor(K.player.x) - WX, Math.floor(K.player.z) - WZ];
  function setTile(a, b, on) { const t = on ? 14 : 13; if (B.get(WX + a, PY, WZ + b) !== t) B.set(WX + a, PY, WZ + b, t, true, 2); }
  function resetStars(msg) { st.step = 0; STARS.forEach(s => setTile(...s, false)); if (msg) { Music.sfx('cancel'); K.toast(msg, 1500); } }
  function solve() { const G = K.G; G.flags = G.flags || {}; if (!G.flags.towerStars) G.flags.towerStars = 1; Music.sfx('magic'); K.toast('星座が ひとつに つながった！　床の 真ん中に 光の 台が あらわれた', 2400); K.save(); }
  // ---- 見た目：星（明るい星は 大きく）・星座の 線（点線）・光の 台 ----
  const gStar = W.Geo(); W.ico(gStar, .26, [0, 0, 0], C('#6fa0ff', .62), 0, 1, 1); const gStarOn = W.Geo(); W.ico(gStarOn, .32, [0, 0, 0], C('#ffc832', .7), 0, 1, 1);
  const gDot = W.Geo(); W.ico(gDot, .08, [0, 0, 0], C('#5f90ff', .6), 0, 0, 1); const gPed = W.Geo(); W.prism(gPed, .45, .5, 0, .8, 8, C('#8a8fa8')); W.ico(gPed, .35, [0, 1.25, 0], C('#fff2b0', 1), .1, 1, 1);
  const mStar = W.makeMesh(gStar, STARS.length + DECOY.length), mOn = W.makeMesh(gStarOn, STARS.length), mDot = W.makeMesh(gDot, 120), mPed = W.makeMesh(gPed, 1);
  const P = ([a, b]) => [WX + a + .5, WZ + b + .5];
  H.frame.push((dt, T) => { for (const m of [mStar, mOn, mDot, mPed]) m.n = 0; if (K.G.region !== 2 || K.phase !== 'field') return;
    if (Math.hypot(K.player.x - tw.x, K.player.z - tw.z) > 60) return; const done = flag() >= 1;
    STARS.forEach((s, i) => { const [x, z] = P(s), lit = done || i < st.step, big = i === 0 ? 1.7 : 1; (lit ? mOn : mStar).set((lit ? mOn : mStar).n++, x, FY + .35 + Math.sin(T * 2 + i) * .05, z, big, T); });
    DECOY.forEach(d => { const [x, z] = P(d); mStar.set(mStar.n++, x, FY + .35, z, .8, 0); });
    for (let i = 0; i + 1 < STARS.length; i++) { const [x0, z0] = P(STARS[i]), [x1, z1] = P(STARS[i + 1]), L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / .45);
      for (let k = 1; k < n && mDot.n < mDot.maxN; k++) mDot.set(mDot.n++, x0 + (x1 - x0) * k / n, FY + .06, z0 + (z1 - z0) * k / n, done || i < st.step - 1 ? 1.5 : 1, 0); }
    if (done && flag() < 2) mPed.set(mPed.n++, tw.x, FY, tw.z, 1, T);
    if (done) { STARS.forEach(s => setTile(...s, true)); return; }
    if (!onFloor()) { st.last = null; return; } const [a, b] = cellOf(), k = key(a, b); if (k === st.last) return; st.last = k;
    if (decoyAt.has(k)) return resetStars('線の ない 星だ……　はじめから');
    if (!starAt.has(k)) return; const i = starAt.get(k); if (i < st.step) return;
    if (i !== st.step) return resetStars(st.step === 0 ? 'いちばん 明るい 星から はじめよう' : '順が ちがう……　はじめから');
    setTile(a, b, true); st.step++; Music.sfx('pick'); if (st.step >= STARS.length) solve(); });
  // ---- しらべる ----
  const TAB = { x: tw.x - 3.3, z: tw.z + 3.3 };
  H.target.push(cand => { if (K.G.region !== 2 || Math.abs(K.player.y - FY) > 2.5 || Math.hypot(K.player.x - tw.x, K.player.z - tw.z) > 6) return;
    cand({}, 'twTablet', TAB.x, TAB.z, 1.6); if (flag() === 1) cand({}, 'twPed', tw.x, tw.z, 1.8); });
  H.labels.twTablet = '星座の 石版を しらべる'; H.labels.twPed = '光の 台を しらべる';
  H.acts.twTablet = async () => { if (flag() >= 1) { await K.say(['星座の 石版：床の 星は みんな つながっている。']); return; }
    await K.say(['【星座の間】', '石版：「星を 線の とおりに たどれ。 はじまりは いちばん 明るい 星」', '（線の ない 星を ふむと、はじめから）']);
    const c = await K.menu({ title: '星座の 石版', items: [{ label: 'がんばる' }, { label: '星を もとに もどす' }] }); if (c === 1) resetStars(); };
  H.acts.twPed = async () => { const G = K.G; if (flag() !== 1) return; G.flags.towerStars = 2; G.gold += 2500; K.gain('stew', 1); K.gain('shizuku', 3); Music.jingle('light', K.fieldSong());
    await K.say(['光の 台に ふれると、星の 光が しずかに ほどけた。', '2500ゴールドを 手に入れた！', `${DATA.items.stew.name}を 1こ 手に入れた！`, '夜露のしずくを 3こ 手に入れた！']); K.save(); K.hud(); };
  H.mapMarks.push((r, pos) => r === 2 && K.G.flags && K.G.flags.c3bridge ? [`<span class="mk${flag() >= 2 ? ' lit' : ''}" style="${pos(tw.x + 7, tw.z)}" title="星座の間（塔の 中ほど）">${flag() >= 2 ? '✦' : '◈'}</span>`] : []);
  H.quest.push(() => K.G.flags && K.G.flags.c3bridge ? `<li>星巣の塔「星座の間」${flag() >= 2 ? '（クリア）' : '：塔の 階段の 中ほど'}</li>` : '');
  K.mainFloors = K.mainFloors || {}; K.mainFloors.tower = { WX, WZ, PY, FY, stars: STARS, decoys: DECOY, st, tablet: TAB, reset: () => resetStars() };
})();
