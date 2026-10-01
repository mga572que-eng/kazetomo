// 新しい 町（町の くらし 第3段）— 霧の大陸に 3つ：王都ルミナリア（城と 世界会議）・黄金の都ラッキーナ（カジノ）・はじまりの町ブレイブ（勇者の 町）
// 方針：本編の 進行・セーブの 形は かえない（寄り道の 町）。新しい 過去・家族は つくらない。世界会議の 話題は、すでに 起きた 本編の 出来事だけ（章の フラグで 切りかえ）。
// セーブ：G.flags.nt_<町>（おとずれた 町＝地図の ワープ）だけ 追加
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined' || !K.townLife) return; const H = K.HOOK, W = World, B = W.Blocks, nm = K.nm;
  const R = 1; // 霧の大陸
  const F = () => K.G.flags, G = () => K.G;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  // ---------- 場所さがし（平らで、ほかの 町・遺跡から はなれた ところ） ----------
  function findFlat(want, rad, span, biome) { let best = null;
    for (let x = want.x - rad; x <= want.x + rad; x += 4) for (let z = want.z - rad; z <= want.z + rad; z += 4) {
      if (Math.max(Math.abs(x), Math.abs(z)) > 236 - span) continue; const bi = W.biomeAt(x, z); if (biome && bi !== biome) continue; if (!biome && bi === 'desert') continue;
      let mn = 1e9, mx = -1e9; for (let i = -span; i <= span; i += 4) for (let j = -span; j <= span; j += 4) { const h = K.hAt(x + i, z + j); mn = Math.min(mn, h); mx = Math.max(mx, h); }
      if (mn < 2) continue; const sc = mx - mn + dist({ x, z }, want) * .02; if (!best || sc < best.sc) best = { x: Math.round(x), z: Math.round(z), sc }; }
    return best || want; }
  function clearAround(c, rad) { const RG = K.REG[R]; RG.trees.forEach(t => { if (dist(t, c) < rad) { t.state = 'gone'; t.t = -1e9; } }); RG.rocks.forEach(t => { if (dist(t, c) < rad) { t.state = 'gone'; t.t = -1e9; } }); RG.bushes = RG.bushes.filter(t => dist(t, c) >= rad - 2); }
  const S = (x, y, z, t) => B.set(x, y, z, t, true, R);
  // 土台：範囲の いちばん 低い 地面に そろえて 敷く
  function pad(x0, z0, x1, z1, t = 6) { let base = 1e9; for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) base = Math.min(base, Math.floor(K.hAt(x + .5, z + .5)));
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const g = Math.floor(K.hAt(x + .5, z + .5)); for (let y = Math.min(g, base); y <= base; y++) S(x, y, z, y === base ? t : 1); } return base + 1; }
  // 家（既存の buildHouse を つかう）
  const homes = [];
  function house(id, x, z, face, style) { const h = { id, x, z, face }; K.buildHouse(h, style); h.r = R; (K.extraHouses = K.extraHouses || []).push(h); homes.push(h); return h; }
  // ---------- 1. 王都ルミナリア（城・城下町・世界会議） ----------
  const towns = {};
  function buildRoyal() { const c = findFlat({ x: -150, z: -20 }, 40, 22); clearAround(c, 36); const cx = c.x, cz = c.z;
    // 城（町の 北がわ）。外壁・四すみの 塔・天守。中庭に 王座と 世界会議の 円卓
    const X0 = cx - 12, X1 = cx + 12, Z0 = cz - 30, Z1 = cz - 14; const fy = pad(X0, Z0, X1, Z1, 6);
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) { const edge = x === X0 || x === X1 || z === Z0 || z === Z1; if (!edge) continue; const gate = z === Z1 && Math.abs(x - cx) <= 1;
      for (let h = 0; h < 4; h++) if (!(gate && h < 3)) S(x, fy + h, z, 6); if ((x + z) % 2 === 0) S(x, fy + 4, z, 6); if (!gate && h3lamp(x, z)) S(x, fy + 2, z, 2); }
    function h3lamp(x, z) { return (z === Z1 && (x === cx - 3 || x === cx + 3)); }
    for (const [tx, tz] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { if (!a && !b) continue; for (let h = 0; h < 7; h++) S(tx + a, fy + h, tz + b, h === 4 && (a === 0 || b === 0) ? 2 : 6); } for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) S(tx + a, fy + 7, tz + b, 3); S(tx, fy + 8, tz, 10); }
    // 天守
    const K0 = cx - 5, K1 = cx + 5, Q0 = Z0 + 2, Q1 = Z0 + 8;
    for (let x = K0; x <= K1; x++) for (let z = Q0; z <= Q1; z++) { const edge = x === K0 || x === K1 || z === Q0 || z === Q1; if (!edge) continue; const door = z === Q1 && x === cx; for (let h = 0; h < 6; h++) if (!(door && h < 2)) S(x, fy + h, z, h === 2 && (x - cx) % 3 === 0 && !door ? 2 : 4); }
    for (let k = 0; k < 4; k++) for (let x = K0 - 1 + k; x <= K1 + 1 - k; x++) for (let z = Q0 - 1 + k; z <= Q1 + 1 - k; z++) { if (k < 3 && x > K0 - 1 + k && x < K1 + 1 - k && z > Q0 - 1 + k && z < Q1 + 1 - k) continue; S(x, fy + 6 + k, z, 3); }
    // 王座（天守の 前）と 円卓
    S(cx, fy, Q1 + 2, 5); S(cx, fy + 1, Q1 + 2, 10); S(cx - 1, fy, Q1 + 2, 5); S(cx + 1, fy, Q1 + 2, 5);
    const TX = cx + 6; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 0; b++) S(TX + a, fy, Z1 - 4 + b, 16); // 世界会議の 円卓（中庭の 東）
    // 城下町：広場の まわりに 家（宿・道具・武器・防具・民家）
    const P = [[-14, -6], [14, -6], [-16, 6], [16, 6], [-8, 16], [8, 16], [-20, 18], [20, 18], [0, 24], [-24, -2]];
    const ids = ['rt_inn', 'rt_item', 'rt_weapon', 'rt_armor', 'rt_h1', 'rt_h2', 'rt_h3', 'rt_h4', 'rt_h5', 'rt_h6'];
    const styles = [{ wall: 4, roof: 3, corner: 5 }, { wall: 6, roof: 8 }, { wall: 6, roof: 3 }, { wall: 4, roof: 8 }, { wall: 4, roof: 3 }, { wall: 0, roof: 3 }, { wall: 4, roof: 8 }, { wall: 6, roof: 3 }, { wall: 4, roof: 3, corner: 6 }, { wall: 0, roof: 8 }];
    const hs = P.map(([a, b], i) => house(ids[i], cx + a, cz + b, [cx, cz], styles[i]));
    for (const id of ['rt_h1', 'rt_h2', 'rt_h3', 'rt_h4']) if (K.interior) { K.interior.KIND[id] = ['home', 'cook', 'scholar', 'home'][['rt_h1', 'rt_h2', 'rt_h3', 'rt_h4'].indexOf(id)]; K.interior.NAMEH[id] = ['城下の 家', 'パン屋の 家', '学者の 家', '騎士の 家'][['rt_h1', 'rt_h2', 'rt_h3', 'rt_h4'].indexOf(id)]; }
    towns.royal = { c, fy, cx, cz, throne: { x: cx + .5, z: Q1 + 3.4 }, table: { x: TX + .5, z: Z1 - 4 }, gate: { x: cx + .5, z: Z1 + 1.6 }, hs }; }
  // ---------- 2. 黄金の都ラッキーナ（砂漠の カジノ） ----------
  function buildCasino() { const c = findFlat({ x: 175, z: 120 }, 40, 18, 'desert'); clearAround(c, 30); const cx = c.x, cz = c.z;
    // カジノ（屋根なしの 大広間。夜に 光る 虹の かざり）
    const X0 = cx - 7, X1 = cx + 7, Z0 = cz - 22, Z1 = cz - 10; const fy = pad(X0, Z0, X1, Z1, 6);
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) { const edge = x === X0 || x === X1 || z === Z0 || z === Z1; if (!edge) continue; const door = z === Z1 && Math.abs(x - cx) <= 1;
      for (let h = 0; h < 4; h++) if (!(door && h < 3)) S(x, fy + h, z, h === 3 ? 10 : (x + z) % 4 === 0 && h === 1 ? 2 : 4); }
    for (let a = -3; a <= 3; a++) S(cx + a, fy + 4, Z1, 10); // 看板
    for (const [a, b] of [[-4, -8], [0, -8], [4, -8]]) { S(cx + a, fy, cz + b - 10 + 4, 16); } // 台（ディーラーの 前）
    // 劇場（広場の 東）：舞台と 背景
    const tx = cx + 14, tz = cz - 2; const ty = pad(tx - 4, tz - 3, tx + 4, tz + 1, 0);
    for (let a = -4; a <= 4; a++) { S(tx + a, ty, tz - 3, 7); for (let h = 1; h <= 4; h++) S(tx + a, ty - 1 + h, tz - 3, h === 4 ? 10 : 4); }
    const P = [[-14, -4], [-16, 8], [-6, 14], [6, 16], [16, 10], [-24, 2]]; const ids = ['lk_inn', 'lk_item', 'lk_h1', 'lk_h2', 'lk_h3', 'lk_h4'];
    const styles = [{ wall: 9, roof: 3, corner: 4 }, { wall: 9, roof: 9 }, { wall: 4, roof: 9 }, { wall: 9, roof: 3 }, { wall: 4, roof: 9 }, { wall: 9, roof: 9 }];
    const hs = P.map(([a, b], i) => house(ids[i], cx + a, cz + b, [cx, cz], styles[i]));
    if (K.interior) { K.interior.KIND.lk_h1 = 'home'; K.interior.NAMEH.lk_h1 = '大金持ちの 屋敷'; K.interior.KIND.lk_h2 = 'cook'; K.interior.NAMEH.lk_h2 = '食堂の 家'; }
    towns.lucky = { c, fy, cx, cz, hall: { x: cx + .5, z: cz - 16 }, dice: { x: cx - 3.5, z: cz - 14.6 }, slot: { x: cx + .5, z: cz - 14.6 }, hilo: { x: cx + 4.5, z: cz - 14.6 }, boss: { x: cx + .5, z: cz - 20 }, stage: { x: tx + .5, z: tz - 1 }, hs }; }
  // ---------- 3. はじまりの町ブレイブ（勇者の 町） ----------
  function buildBrave() { const c = findFlat({ x: -185, z: 105 }, 40, 18); clearAround(c, 30); const cx = c.x, cz = c.z;
    // 勇者の 像（広場の 中央）
    const by = pad(cx - 2, cz - 2, cx + 2, cz + 2, 6); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) S(cx + a, by, cz + b, 1);
    S(cx, by + 1, cz, 1); S(cx, by + 2, cz, 4); S(cx, by + 3, cz, 4); S(cx - 1, by + 3, cz, 4); S(cx + 1, by + 3, cz, 4); S(cx, by + 4, cz, 4); S(cx + 1, by + 4, cz, 7); S(cx + 1, by + 5, cz, 7); S(cx + 1, by + 6, cz, 10);
    // 道場（さくで かこんだ 庭）
    const dx = cx - 2, dz = cz - 22; const dy = pad(dx - 6, dz - 5, dx + 6, dz + 5, 0);
    for (let a = -6; a <= 6; a++) for (let b = -5; b <= 5; b++) { const edge = Math.abs(a) === 6 || Math.abs(b) === 5; if (edge && !(b === 5 && Math.abs(a) <= 1)) S(dx + a, dy, dz + b, 5); }
    for (const [a, b] of [[-3, -2], [3, -2], [0, -3]]) { S(dx + a, dy, dz + b, 5); S(dx + a, dy + 1, dz + b, 0); } // わら人形の 台
    const P = [[-14, -6], [14, -6], [-16, 8], [16, 8], [-6, 16], [8, 16]]; const ids = ['bv_inn', 'bv_weapon', 'bv_h1', 'bv_h2', 'bv_h3', 'bv_h4'];
    const styles = [{ wall: 4, roof: 3, corner: 5 }, { wall: 6, roof: 3 }, { wall: 0, roof: 8 }, { wall: 4, roof: 3 }, { wall: 4, roof: 8 }, { wall: 0, roof: 3 }];
    const hs = P.map(([a, b], i) => house(ids[i], cx + a, cz + b, [cx, cz], styles[i]));
    if (K.interior) { K.interior.KIND.bv_h1 = 'smith'; K.interior.NAMEH.bv_h1 = '鍛冶見習いの 家'; K.interior.KIND.bv_h2 = 'home'; K.interior.NAMEH.bv_h2 = '冒険者の 下宿'; }
    towns.brave = { c, fy: by, cx, cz, statue: { x: cx + .5, z: cz + 2.8 }, dojo: { x: dx + .5, z: dz + 3.5 }, hs }; }
  const prev = W.region; W.setRegion(R); try { buildRoyal(); buildCasino(); buildBrave(); } finally { W.setRegion(prev); }
  // ---------- 遊び：カジノ ----------
  const NM = (n, t) => nm(n, t), pay = n => { G().gold += n; K.hud(); };
  async function slot() { const SYM = [['🍒', 5, 5], ['🔔', 4, 10], ['⭐', 3, 20], ['灯', 2, 50], ['7', 1, 150]], TOT = 15; // [絵, 重み, 3つ そろいの 倍率]（2つ 🍒 は 1.2倍・期待値 およそ 0.96）
    const spin = () => { let v = Math.random() * TOT; for (const s of SYM) { if ((v -= s[1]) < 0) return s; } return SYM[0]; };
    while (true) { const BETS = [10, 50, 100]; const c = await K.menu({ title: 'スロット：いくら かける？', items: BETS.map(b => ({ label: `${b}G`, disabled: G().gold < b })), where: 'side' }); if (c < 0) return;
      const bet = BETS[c]; G().gold -= bet; K.hud(); Music.sfx('mine'); const r = [spin(), spin(), spin()]; let mul = 0;
      if (r[0] === r[1] && r[1] === r[2]) mul = r[0][2]; else if (r.filter(s => s[0] === '🍒').length === 2) mul = 1.2;
      const won = Math.floor(bet * mul); if (won) pay(won); await K.say([NM('スロットの 係', `【 ${r.map(s => s[0]).join(' ｜ ')} 】`), won ? NM('スロットの 係', `${mul >= 50 ? 'だいあたり〜！！' : 'あたり！'} ${won}ゴールド！`) : NM('スロットの 係', 'ざんねん！ また どうぞ。')]); if (mul >= 50) Music.jingle('levelup'); K.save(); } }
  async function hilo() { // 倍率は 当たる 確率に あわせて（期待値 0.95）。同じ 数は 負け
    while (true) { const BETS = [10, 50, 100]; const c = await K.menu({ title: 'ハイ＆ロー：いくら かける？', items: BETS.map(b => ({ label: `${b}G`, disabled: G().gold < b })), where: 'side' }); if (c < 0) return;
      const bet = BETS[c]; G().gold -= bet; K.hud(); const a = 1 + Math.floor(Math.random() * 13), hiN = 13 - a, loN = a - 1; const mHi = hiN ? Math.floor(95 * 13 / hiN) / 100 : 0, mLo = loN ? Math.floor(95 * 13 / loN) / 100 : 0;
      const ch = await K.menu({ title: `カードは【 ${a} 】。 つぎは？`, items: [{ label: `ハイ（${a}より 大きい）`, sub: hiN ? `×${mHi}` : 'ありえない', disabled: !hiN }, { label: `ロー（${a}より 小さい）`, sub: loN ? `×${mLo}` : 'ありえない', disabled: !loN }], where: 'side' });
      if (ch < 0) { pay(bet); return; } const b2 = 1 + Math.floor(Math.random() * 13), win = ch === 0 ? b2 > a : b2 < a, got = win ? Math.floor(bet * (ch === 0 ? mHi : mLo)) : 0; if (got) pay(got);
      await K.say([NM('カードの ディーラー', `つぎの カードは【 ${b2} 】！`), win ? NM('カードの ディーラー', `おみごと！ ${got}ゴールド！`) : NM('カードの ディーラー', b2 === a ? 'おなじ 数…… こちらの かちです。' : 'のこねん！')]); K.save(); } }
  async function show() { const g = G(); const cost = 30; const c = await K.menu({ title: '劇場「すなの ほし」', items: [{ label: `ショーを みる`, sub: `${cost}G・HPと MPが ぜんかい` }], where: 'side' }); if (c !== 0) return;
    if (g.gold < cost) { await K.say([NM('劇場の 座長', 'おや、おだいが たりないようだ。')]); return; } g.gold -= cost; K.allMembers().forEach(m => { m.hp = m.st.hp; m.mp = m.st.mp; }); Music.jingle('light');
    await K.say(['ランプの 光の 下で、踊り子たちが くるくる まわる。', '砂の 上の 小さな 星空みたいな ショーだった。', '（HPと MPが ぜんかいした）']); K.hud(); K.save(); }
  const diceFn = async () => { if (K.townFeature && K.townFeature.playDice) await K.townFeature.playDice(); };
  // ---------- 道場：けいこ試合 ----------
  async function dojo() { const c = await K.menu({ title: '道場', items: [{ label: 'けいこ試合（3連戦）', sub: 'にげられない・かつと お金' }, { label: '話を きく' }], where: 'side' });
    if (c === 1) { await K.say([NM('道場の 師範', '勇者は 生まれつきの ものでは ない。 毎日 少しずつ、強く なるのだ。')]); return; } if (c !== 0) return;
    const lv = Math.max(...G().party.map(m => m.lv)); const pool = DATA.speciesOrder.filter(k => { const s = DATA.species[k]; return s && s.hab && !s.boss && !s.legend; });
    for (let w = 0; w < 3; w++) { await K.say([NM('道場の 師範', `${w + 1}本め！ はじめ！`)]); const res = await K.runBattle(Array.from({ length: 2 + (w > 1 ? 1 : 0) }, () => ({ sp: pool[Math.floor(Math.random() * pool.length)], lv: lv - 1 + w, shiny: false })), { noFlee: true }); if (res !== 'win') { await K.say([NM('道場の 師範', 'よく やった。 また 来なさい。')]); return; } }
    const gold = 300 + lv * 10; pay(gold); Music.jingle('levelup'); await K.say([NM('道場の 師範', `みごと！ 3本 とった。 ……これは 道場からの お礼だ。`), `${gold}ゴールドを 手に入れた！`]); K.save(); }
  // ---------- 世界会議（本編で 起きた ことだけを 話題に） ----------
  const council = who => () => { const f = F(); const topic = f.c4done ? 'sea' : f.c3done ? 'sky' : f.c2done ? 'stars' : 'start';
    const T = { start: ['霧の 大陸の 星が、すこしずつ 消えていると いう 知らせが あります。', 'まずは 原因を しらべねば。'], stars: ['星喰いが しずまったと 聞きました。 星の 遺跡の 巫女も 無事だとか。', '空の 向こうに、まだ なにか あると いう 声も ありますな。'],
      sky: ['夜空いっぱいに、星が よみがえった。 わが国でも 祭りに なりました。', '天空の 浮島から 来た 人の 話も、会議で 聞きたいものだ。'], sea: ['海の 灯も ともったそうだ。 船乗りたちが 帰り道に まよわなく なった。', 'これで 島・大陸・空・海が、灯で つながったわけだ。'] }[topic];
    return K.say(T.map(t => NM(who, t))); };
  // ---------- 町の 設定と 人（町の くらし に 登録） ----------
  const at = (t, k) => () => ({ x: towns[t][k].x, z: towns[t][k].z });
  const doorAt = (t, i) => () => { const h = towns[t].hs[i]; return h.npc ? { x: h.npc.x, z: h.npc.z } : { x: h.x, z: h.z + 3 }; };
  const off = (t, k, dx, dz) => () => ({ x: towns[t][k].x + dx, z: towns[t][k].z + dz });
  const TL = K.townLife;
  TL.TOWNS.push(
    { key: 'royal', pre: '_', r: R, name: '王都 ルミナリア', at: () => towns.royal.c, pop: 800, lv: 5, price: 1.15, school: true, farm: false, stalls: 6, note: '城の ある 大きな 都。 世界会議が ひらかれている',
      pool: [['king', '王さま', async () => { await K.say([NM('王さま', 'よくぞ 来た、旅の 者。 ルミナリアは 大陸 いちばんの 都じゃ。'), NM('王さま', F().c2done ? '星の 異変を しずめたのは そなたたちか。 礼を 言うぞ。' : 'いま 世界会議で、星の 異変を 話しあっておる。 ゆっくり して いくがよい。')]); }, { at: at('royal', 'throne'), yaw: 0 }],
        ['noble', '大臣', ['王さまは 会議の あいまに、こうして 民の 話を きいて おられるのです。'], { at: off('royal', 'throne', 1.6, .4), yaw: 0 }],
        ['noble', '霧の大陸の 代表', council('霧の大陸の 代表'), { at: off('royal', 'table', -2.6, 0), yaw: Math.PI / 2 }], ['noble', '北の 山の国の 代表', council('北の 山の国の 代表'), { at: off('royal', 'table', 2.6, 0), yaw: -Math.PI / 2 }],
        ['merchant', '港の 商人組合の 長', council('港の 商人組合の 長'), { at: off('royal', 'table', 0, -1.8), yaw: 0 }], ['noble', '砂の国の 代表', council('砂の国の 代表'), { at: off('royal', 'table', 0, 1.8), yaw: Math.PI }],
        ['guard', '城門の 兵', ['ここは 王都ルミナリアの 城。 王さまは 中庭に おられる。'], { at: off('royal', 'gate', -2, 0), yaw: 0 }], ['guard', '城門の 兵', ['世界会議の 最中だ。 しずかに たのむぞ。'], { at: off('royal', 'gate', 2, 0), yaw: 0 }],
        ['woman', '宿屋の 女将', async () => K.talkInn(), { at: doorAt('royal', 0) }], ['man', '道具屋', async () => K.shopUI('item'), { at: doorAt('royal', 1) }], ['man', '武器屋', async () => K.shopUI('weapon'), { at: doorAt('royal', 2) }], ['man', '防具屋', async () => K.shopUI('armor'), { at: doorAt('royal', 3) }],
        ['mail', '王都の ゆうびんや', ['王都は 道が まっすぐで くばりやすいの！']], ['teacher', '王立学校の 先生', ['この 都の 子は、文字も 歴史も しっかり 学ぶのよ。']], ['knight', '騎士見習い', ['いつか 王さまを まもる 騎士に なるんだ！']], ['woman', '貴婦人', ['港町は にぎやかだけど、すこし 品が ないわねえ。 ……あら、聞こえた？']],
        ['man', 'パン屋', ['王都の パンは 大陸 いちばん！ 朝 いちばんに 焼くんだ。']], ['performer', '吟遊詩人', ['旅の 話を 歌に しているの。 あなたの 話も、いつか 歌に させてね。']], ['boy', '城下の 子', ['お城の 塔の てっぺん、のぼって みたいなあ！']], ['girl', '城下の 子', ['王さまって、本当に ひげが ながいんだよ！']],
        ['man', '城下の 職人', ['会議の 客が 多くて、しごとが ひっきりなしさ。']], ['oldm', '物知りの 老人', ['むかしは この 都も 小さな 村だった。 人が 集まれば、町は 育つのじゃ。']], ['woman', '花売り', ['お城に かざる 花を そだてて いるの。']], ['man', '見物の 旅人', ['世界会議を ひと目 見ようと 来たんだが、門の 中までは 入れて もらえなくてね。']]] },
    { key: 'lucky', pre: '_', r: R, name: '黄金の都 ラッキーナ', at: () => towns.lucky.c, pop: 400, lv: 4, price: 1.3, school: false, farm: false, stalls: 3, note: 'カジノの 都。 夜が いちばん 明るい',
      pool: [['dealer', 'カジノの 支配人', async () => { await K.say([NM('カジノの 支配人', 'ようこそ、黄金の 都へ！ ダイス・スロット・ハイ＆ロー、どれでも どうぞ。'), NM('カジノの 支配人', '……ただし、かけるのは なくしても いい お金だけに してくださいね。')]); }, { at: at('lucky', 'boss'), yaw: 0 }],
        ['dealer', 'ダイスの ディーラー', diceFn, { at: at('lucky', 'dice'), yaw: 0 }], ['dealer', 'スロットの 係', slot, { at: at('lucky', 'slot'), yaw: 0 }], ['dealer', 'カードの ディーラー', hilo, { at: at('lucky', 'hilo'), yaw: 0 }],
        ['performer', '劇場の 座長', show, { at: at('lucky', 'stage'), yaw: 0 }], ['woman', '宿屋の 女主人', async () => K.talkInn(), { at: doorAt('lucky', 0) }], ['man', '道具屋', async () => K.shopUI('item'), { at: doorAt('lucky', 1) }],
        ['guard', 'カジノの 用心棒', ['いかさまは ゆるさねえ。 ……おまえは だいじょうぶそうだな。']], ['man', '負けこんだ 男', ['あと 1回…… あと 1回 かてば、ぜんぶ とりもどせるんだ……。', '……となりの やつが 大あたりした とき、正直 くやしくて ねむれなかったよ。']], ['noble', '大金持ち', ['わたしの 屋敷を 見たかね？ この 町で いちばん 大きいのだよ。 ……となりの 屋敷より、ほんの すこしだけ な。']],
        ['woman', '旅行者', ['夜の ラッキーナは 宝石箱みたい！ 砂漠を こえて 来た かいが あったわ。']], ['performer', '踊り子', ['夜の ショー、見に きてね！']], ['man', '水売り', ['砂漠の 町じゃ、水が いちばん 高いのさ。']], ['boy', '靴みがきの 子', ['お客さん、靴が 砂だらけだよ！']], ['oldw', 'うらないの 老婆', ['……あんたの 運は、カジノでは なく 旅の 先に あるね。']]] },
    { key: 'brave', pre: '_', r: R, name: 'はじまりの町 ブレイブ', at: () => towns.brave.c, pop: 150, lv: 3, price: 1.0, school: true, farm: true, stalls: 1, note: '勇者に あこがれる 若者が 集まる 修行の 町',
      pool: [['monk', '道場の 師範', dojo, { at: at('brave', 'dojo'), yaw: 0 }], ['man', '宿屋の 主人', async () => K.talkInn(), { at: doorAt('brave', 0) }], ['man', '武器屋', async () => K.shopUI('weapon'), { at: doorAt('brave', 1) }],
        ['knight', '修行中の 戦士', ['毎朝 像に あいさつ してから 素振り 千回！ 勇者への 道は 遠いぜ。']], ['woman', '魔法使いの 卵', ['火の 呪文、まだ 指先から ポッと 出るだけなの……。']], ['man', '旅の 冒険者', ['この 町で 仲間を さがしてるんだ。 ……え、もう 仲間が いるのか。 いいなあ。']],
        ['boy', '勇者ごっこの 子', ['ぼくが 勇者！ きみは まものの 役ね！']], ['girl', '勇者ごっこの 子', ['ずるい！ こんどは わたしが 勇者！']], ['oldm', '像の 番人', ['むかし むかし、名も のこさず 去った 旅人が いた。 人びとは その人を「はじまりの 勇者」と よんだ。', 'だれでも、最初の 一歩を ふみだせば 勇者に なれる。 この 町は、そう 信じとる。']],
        ['teacher', '道場の 若先生', ['子どもたちには、まず 礼から 教えているの。']], ['mail', 'ブレイブの ゆうびんや', ['冒険者あての 手紙が 多くてね。 返事を くれない 人ばかりさ！']]] },
  );
  // 見た目（王さま・貴族・ディーラー・芸人・騎士・師範）
  Object.assign(TL.LOOK, {
    king: [{ skin: '#e8c4a0', hair: '#e8e8e8', top: '#b83a4a', bottom: '#3a2a4a', robe: true, cape: '#c83a4a', beard: 'big', beardCol: '#f0f0f0', hat: true, accent: '#f3c15a', trim: '#f3c15a', epaulet: true }],
    noble: [{ skin: '#ecc8aa', hair: '#5a3a2a', top: '#5a4a8a', bottom: '#2a2a3a', robe: true, collar: '#f0e8d0', accent: '#d8b040' }, { skin: '#f0cfb2', hair: '#8a5a30', hairStyle: 'bob', top: '#3a6a5a', bottom: '#2a3a3a', robe: true, shawl: '#e8d8a0' }],
    dealer: [{ skin: '#e8c4a0', hair: '#2a2a2a', top: '#2a2a3a', bottom: '#1a1a24', collar: '#f4f0e6', accent: '#c83a3a' }],
    performer: [{ skin: '#f0cfb2', hair: '#c83a5a', hairStyle: 'bob', top: '#f0a030', bottom: '#8a3a6a', skirt: '#e86a8a', scarf: true, accent: '#f3c15a', flower: true }],
    knight: [{ skin: '#e6c3a3', hair: '#7a4a2a', top: '#8a9ab8', bottom: '#3a3a4a', pauldron: 'R', cape: '#3a5aa8', sword: true, trim: '#c9ced6' }],
    monk: [{ skin: '#d9ad86', hair: '#3a3a3a', top: '#f4ecdb', bottom: '#2a2a3a', belt: '#2a2a3a', beard: 'stubble' }],
  });
  // ---------- おとずれた 町・地図・ワープ・旗 ----------
  const NT = [['royal', '王都 ルミナリア', '霧の大陸・北の 都'], ['lucky', '黄金の都 ラッキーナ', '霧の大陸・砂漠の カジノ'], ['brave', 'はじまりの町 ブレイブ', '霧の大陸・西の 修行の 町']];
  K.extraAreas = K.extraAreas || []; for (const [k, n, s] of NT) K.extraAreas.push({ rg: R, id: 'nt_' + k, x: towns[k].c.x, z: towns[k].c.z, r: 30, n, s });
  H.frame.push(() => { const g = G(); if (!g || g.region !== R || K.phase !== 'field') return; const p = K.player;
    for (const [k] of NT) { const c = towns[k].c, d = dist(c, p); if (d < 30 && !g.flags['nt_' + k]) { g.flags['nt_' + k] = 1; K.save(); } }
    if (K.enemies && K.enemies.length && K.enemies.some(e => NT.some(([k]) => dist(towns[k].c, e) < 36))) K.enemies = K.enemies.filter(e => !NT.some(([k]) => dist(towns[k].c, e) < 36)); }); // 町の 中には 魔物を 入れない
  H.warps.push(r => r === R ? NT.filter(([k]) => G().flags['nt_' + k]).map(([k, n]) => ({ n, x: towns[k].c.x + 2, z: towns[k].c.z + 6 })) : []);
  H.mapMarks.push((r, pos) => r === R ? NT.map(([k, n]) => `<span class="mk${G().flags['nt_' + k] ? ' lit' : ''}" style="${pos(towns[k].c.x, towns[k].c.z)}" title="${n}">${k === 'royal' ? '🏰' : k === 'lucky' ? '🎰' : '⚔'}</span>`) : []);
  // 勇者の 像
  H.target.push(cand => { if (G().region === R && dist(towns.brave.statue, K.player) < 4) cand(towns.brave.statue, 'ntStatue', towns.brave.statue.x, towns.brave.statue.z, 2); });
  H.labels.ntStatue = '像を しらべる'; H.acts.ntStatue = async () => K.say(['「はじまりの 勇者」の 像。 台座に 文字が きざまれている。', '「勇気とは、こわくても 一歩 ふみだすこと」']);
  K.newTowns = { towns, NT };
})();
