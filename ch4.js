// ともしびアイランド — 第4章「海の底」：あわの鈴・沈んだ 灯の樹・深みの王・裏ボス・図鑑コンプ報酬
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK, R3 = K.REG[3], R0 = K.REG[0];
  const F = () => K.G.flags, who = K.who, nm = K.nm;
  const LH_BOSS = ['kaisouG', 'kaniG', 'ikaG'], LH_NAME = ['藻の灯の樹', '甲羅の灯の樹', '雷の灯の樹'];
  const lit = i => !!(K.G.lh || [])[i], litN = () => [0, 1, 2].filter(lit).length;
  const lvOf = id => DATA.bossCfg[id][0];
  H.load.push(G => { G.lh = G.lh || [0, 0, 0]; if (G.party.some(m => m.id === 'kaito')) { G.eq.kaito = G.eq.kaito || { w: 0, a: G.eq.sora ? G.eq.sora.a : 0 }; G.board.kaito = G.board.kaito || []; } });

  // ---------- 住人（海の底） ----------
  const addNpc = n => { const R = K.REG[n.r]; if (n.house) { const h = R.houses.find(h => h.id === n.house); n.x = h.npc.x; n.z = h.npc.z; n.yaw = h.yaw; } n.yaw = n.yaw || 0; n.baseYaw = n.yaw; K.NPCS.push(n); };
  addNpc({ id: 'ushio', r: 3, house: 'ushio', nm: '長老ウシオ' });
  addNpc({ id: 'inn', r: 3, house: 'inn', nm: '泡の宿の 主人' });
  addNpc({ id: 'item', r: 3, house: 'item', nm: '海の道具屋' });
  addNpc({ id: 'weapon', r: 3, house: 'weapon', nm: '海の武具屋' });
  addNpc({ id: 'kai', r: 3, x: R3.town.x - 3.5, z: R3.town.z + 6, nm: 'アワの子 カイ' });

  { const kn = K.NPCS.find(n => n.id === 'kaito' && n.r === 0); if (kn) { const s0 = kn.show; kn.show = () => (!s0 || s0()) && !K.G.party.some(m => m.id === 'kaito'); } }
  // ---------- 章の はじまり：カイトの 話 ----------
  async function ch4Intro() {
    await K.say([who('kaito', 'neutral', '{name}。 ……おまえに、まだ 言ってない ことが ある。'),
      who('kaito', 'sad', '三年前の 夜。 おれが 見たのは 師匠の 闇だけじゃない。 海の 底で、灯が ひとつずつ 消えていくのも 見たんだ。'),
      who('sora', 'surprised', '海の 底にも 灯の樹が あるの？'),
      who('kaito', 'determined', 'ああ。 沈んだ 三つの 灯の樹が、海の いきものたちの 帰り道を 照らしていた。'),
      who('sora', 'angry', '……また ひとりで 行く 気でしょ。 だまって。'),
      who('kaito', 'sad', '…………。 そのつもり だった。'), who('kaito', 'grin', '……だが やめだ。 今度は いっしょに 行こう。 村の 南の 岬で、この「あわの鈴」を 鳴らすんだ。'),
      { t: '「あわの鈴」を 手に入れた！　カイトが 仲間に くわわった！', fx: () => { K.G.inv.awanosuzu = 1; joinKaito(); Music.sfx('friend'); } }]);
    if (K.titleCard) await K.titleCard('第4章', '海の底');
    F().c4start = 1; K.save(); K.hud(); }
  function joinKaito() { const G = K.G; if (G.party.some(m => m.id === 'kaito')) return; const lv = Math.max(...G.party.map(m => m.lv));
    G.eq.kaito = G.eq.kaito || { w: 0, a: G.eq.sora ? G.eq.sora.a : 0 }; G.board.kaito = G.board.kaito || []; G.sp.kaito = G.sp.kaito || 0;
    G.party.push(K.mkHuman('kaito', lv)); if (G.team.length < 4) G.team.push('kaito'); K.fixTeam(); }
  H.talks.kaito = async n => { if (!F().c3reunion || F().c4start) return 'pass'; await ch4Intro(); };

  // ---------- 岬（もぐる 場所）と 帰りの 泡 ----------
  const cape = (() => { let best = null; for (let a = 0; a < 64; a++) { const an = a / 64 * Math.PI * 2; for (let d = 30; d < 120; d += 2) { const x = Math.cos(an) * d, z = Math.sin(an) * d; const h = K.hAt(x, z);
    if (h < 1.2) { const px = Math.cos(an) * (d - 3), pz = Math.sin(an) * (d - 3); if (K.hAt(px, pz) > 1.5 && (!best || Math.hypot(px - R0.pier.x, pz - R0.pier.z) > 25 && z > 0 && d < best.d)) best = { x: px, z: pz, d }; break; } } } return best || { x: R0.pier.x - 6, z: R0.pier.z - 10 }; })();
  K.cape = cape;
  H.target.push(cand => { const G = K.G;
    if (G.region === 0 && F().c4start && G.inv.awanosuzu) cand(cape, 'dive', cape.x, cape.z, 3.2);
    if (G.region === 3) { cand(R3.pier, 'surface', R3.pier.x, R3.pier.z, 3);
      for (const L of R3.lh) if (!lit(L.i)) cand(L, 'lh', L.x + .5, L.z + 3.5, 3.2);
      if (litN() === 3 && !F().c4done) cand(R3.palace, 'palace', R3.palace.x, R3.palace.z + 4, 4.5);
      if (F().c4done && !F().superDone) cand(R3.trench, 'abyss', R3.trench.x, R3.trench.z, 5); } });
  H.labels.dive = 'あわの鈴を 鳴らす'; H.labels.surface = '泡に のって 地上へ'; H.labels.lh = t => `${LH_NAME[t.o.i]}を しらべる`; H.labels.palace = '深淵の宮の 扉'; H.labels.abyss = '深淵を のぞきこむ';
  H.acts.dive = async () => { if (!(await K.confirm('あわの鈴を 鳴らして 海の底へ もぐる？'))) return; Music.sfx('magic');
    await K.travel(3, R3.pier.x, R3.pier.z - 4, Math.PI, { kind: 'dive', sub: '— あわの道を ぬけて —' }); if (!F().c4arrive) await arrive(); };
  H.acts.surface = async () => { if (!(await K.confirm('泡に のって 風灯の島へ もどる？'))) return; Music.sfx('magic'); await K.travel(0, cape.x, cape.z, 0, { kind: 'surface', sub: '— 泡に のって 地上へ —' }); };

  async function arrive() {
    await K.say(['——泡の 道を ぬけると、そこは 光の ゆれる 海の底だった。',
      who('sora', 'surprised', '息が できる……！ 水の中なのに！'), who('kaito', 'smile', 'あわの鈴の 加護さ。 風布は ここじゃ ひらかないが、からだが 軽い。 ジャンプで ふわっと 泳げるぞ。'),
      nm('アワの子 カイ', 'わあっ、地上の 人だ！ 長老さまー！ 長老さまー！')]);
    F().c4arrive = 1; K.save(); }

  // ---------- 会話 ----------
  H.talks.ushio = async () => { const G = K.G;
    if (!F().c4elder) { await K.say([nm('長老ウシオ', 'ようこそ、アワの里へ。 地上の 灯守りの 子よ。'),
        nm('長老ウシオ', '海の 底には 三つの 灯の樹が ある。 西の「藻の灯の樹」、東の「甲羅の灯の樹」、そして 北の「雷の灯の樹」。'),
        nm('長老ウシオ', '深みの王が 灯を 飲みこみ、番人たちは 闇に のまれてしまった。 ……わしらには、どうにも できなんだ。'),
        nm('アワの子 カイ', '……長老さま、ほんとは——'), nm('長老ウシオ', 'カイ。 おとなの 話じゃ。'),
        who('kaito', 'determined', '三つの 灯を ともせば、深淵の宮の 扉が ひらく……だったな。'),
        nm('長老ウシオ', 'さよう。 ……たのんだぞ、灯の 継ぎ手たちよ。')]); F().c4elder = 1; K.save(); return; }
    if (F().c4done) { await K.say([nm('長老ウシオ', '海の 灯は ふたたび ともった。 ……深淵の 底には まだ 古き 主が ねむっておる。 力を つけてから のぞくが よい。')]); return; }
    await K.say([nm('長老ウシオ', `灯の樹は ${litN()}/3 ともった。 ${litN() === 3 ? '北の 深淵の宮へ いそげ！' : 'のこる 灯の樹も たのんだぞ。'}`)]); };
  H.talks.kai = async () => { await K.say([nm('アワの子 カイ', F().c4done ? 'ちょうちんアンコウが 道を 照らして くれるように なったよ！ ありがとう！' : 'ねえ、地上って 空が あるんでしょ？ いつか 見に 行きたいなあ。')]); };
  H.talks.inn = async n => { if (K.G.region !== 3) return 'pass'; return K.talkInn(); };
  H.talks.item = async n => { if (K.G.region !== 3) return 'pass'; return K.shopUI('item'); };
  H.talks.weapon = async n => { if (K.G.region !== 3) return 'pass'; return K.shopUI('weapon'); };

  // ---------- 灯の樹の 番人 ----------
  H.acts.lh = async L => { const i = L.i, id = LH_BOSS[i];
    if (!F().c4elder) { await K.say(['灯の樹の 奥から、つめたい 気配が する……。（まずは アワの里の 長老に 会おう）']); return; }
    await K.say([`${LH_NAME[i]}。 灯室の 火は 消え、闇の 番人が うずくまっている。`, who('kaito', 'neutral', '……灯を 守るはずの やつが、灯を いちばん こわがってる 顔だ。')]);
    if (!(await K.confirm(`${DATA.enemies[id].name}と たたかう？（推奨Lv${lvOf(id)}）`))) return;
    const res = await K.runBattle([{ boss: id }], { boss: true, noFlee: true, song: 'seaboss' }); if (res !== 'win') return K.defeated();
    K.G.lh = K.G.lh || [0, 0, 0]; K.G.lh[i] = 1; Music.jingle('light', K.fieldSong());
    await K.say([`番人の 闇が はれ、${LH_NAME[i]}に 灯が ともった！`, who('kaito', 'smile', 'いい 灯だ。 ……海の いきものたちにも 見えてるはずだ。'),
      litN() === 3 ? '三つの 灯が 北の 深淵の宮を 照らしだした！' : `（灯の樹 ${litN()}/3）`]); K.save(); };

  // ---------- 決戦 ----------
  H.acts.palace = async () => {
    await K.say(['深淵の宮。 三つの 灯に 照らされ、とびらが ゆっくりと ひらく……']);
    if (!(await K.confirm(`深みの王と 決着を つける？（推奨Lv${lvOf('fukami')}）`))) return;
    await K.say([nm('深みの王', '……また 灯か。 灯は いつも 上から 照らすだけだ。 いちばん 深い ところまでは、とどかない。'),
      nm('深みの王', '迷って 沈んだ 小さな ものたちを、だれが 見つけた？ ……だれも。 だから 灯など、ぜんぶ 飲みこんでやる。'),
      who('kaito', 'determined', '……とどかなかったなら、とどくまで ともす。 それが 灯守りだ！'), who('sora', 'determined', '帰る 場所は、ぼくらが 照らす！ きみの ぶんも！')]);
    let res = await K.runBattle([{ boss: 'fukami' }], { boss: true, noFlee: true, song: 'seaboss' }); if (res !== 'win') return K.defeated();
    K.allMembers().forEach(m => { m.hp = m.st.hp; m.mp = m.st.mp; });
    await K.say([nm('深みの王', 'ぐ……まだだ。 深みは、底なしだ……！'), '深みの王が 泡を まとい、巨大な 姿に なった！']);
    res = await K.runBattle([{ boss: 'fukami' }], { boss: true, noFlee: true, song: 'lastboss' }); if (res !== 'win') return K.defeated();
    await K.say(['深みの王の からだが ほどけ、無数の 小さな 光の 泡に なった。',
      nm('小さな 泡', '……あたたかい。 ずっと、さむかったんだ。 だれにも 見つけて もらえなくて。'),
      who('kaito', 'sad', '……おまえも、帰る 道が わからなかったんだな。'),
      K.inParty('riku') ? who('riku', 'sad', '……わかるぜ。 おれも あの夜、サナを 置いて 逃げた。 置いていかれる さむさも、置いていく さむさも 知ってる。') : null,
      K.inParty('haru') ? who('haru', 'smile', '嵐の 夜、海に 落ちた わたしも、見つけて もらえたの。 ……だから こんどは、わたしたちが 見つける番。') : null, who('sora', 'smile', 'もう だいじょうぶ。 灯の樹が、ちゃんと 照らしてるから。'),
      '泡は 灯の樹の 光を たどって、ゆっくりと 海の 上へ のぼっていった——',
      who('kaito', 'joy', '{name}。 ……おまえは もう 立派な 灯守りだ。 父さんの ほうが 教わったよ。'),
      who('sora', 'smile', '灯は、帰る場所の しるし。 ……それと、「いってらっしゃい」の しるしでも あるんだね。'),
      who('sora', 'joy', 'いっしょに 帰ろう、父さん。 母さんが 待ってる。')]);
    F().c4done = 1; K.G.lh = [1, 1, 1]; K.save(); await K.credits(4);
    await K.say(['——クリア おめでとう！ 海の底の 深淵には、まだ 古き 主が ねむっている……。', '（図鑑を すべて うめると ごほうびが ある。 長老ウシオも、なにか 言いたげだ）']); };

  // ---------- 裏ボス：深淵の主 ----------
  H.acts.abyss = async () => {
    await K.say(['深淵の 底から、海 そのものの ような 巨大な 気配が する……']);
    if (!(await K.confirm(`深淵の主に いどむ？（推奨Lv${lvOf('shinen')}・とても つよい）`))) return;
    const res = await K.runBattle([{ boss: 'shinen' }], { boss: true, noFlee: true, song: 'lastboss' }); if (res !== 'win') return K.defeated();
    const G = K.G; F().superDone = 1; G.gold += 20000; K.gain('hoshikake', 5); K.gain('shinju', 5); Music.jingle('light', K.fieldSong());
    await K.say(['深淵の主は しずかに 目を とじ、海の 奥へ 還っていった。', nm('深淵の主', '……灯の 子らよ。 そなたらの 光、たしかに 見とどけた。'),
      '20000ゴールド・星のかけら×5・しんじゅ×5を 手に入れた！', '（称号「深淵を 越えし者」が 手に入る）']); K.save(); };

  // ---------- 図鑑コンプの ごほうび：風布・極 ----------
  let dchk = 0; H.frame.push(dt => { dchk -= dt; if (dchk > 0) return; dchk = 3; const G = K.G; if (G.flags.glider3 || !G.flags.glider) return;
    if (Object.keys(G.dex.got).length >= DATA.speciesOrder.length) { G.flags.glider3 = 1; Music.sfx('friend'); K.tip('<b>図鑑 完成！ 「風布・極」を 手に入れた</b><span>滑空しても がんばりが へらなくなった！</span>', 4000); K.save(); } });

  // ---------- 目的・クエスト・地図・音楽・演出 ----------
  H.objective.push(() => { const G = K.G; if (!F().c3done) return null;
    if (!F().c3reunion) return null;
    if (!F().c4start) return { t: '【第4章】父さん（カイト）と 話そう', p: G.region === 0 ? K.npcAt('kaito', 0) : null };
    if (!F().c4arrive) return { t: '村の 南の 岬で「あわの鈴」を 鳴らそう', p: G.region === 0 ? cape : null };
    if (G.region !== 3 && !F().c4done) return { t: '岬から 海の底へ もぐろう', p: G.region === 0 ? cape : null };
    if (F().c4done) return null;
    if (!F().c4elder) return { t: 'アワの里の 長老ウシオに 会おう', p: K.npcAt('ushio', 3) };
    if (litN() < 3) { let best = null, bd = 1e9; for (const L of R3.lh) if (!lit(L.i)) { const d = Math.hypot(L.x - K.player.x, L.z - K.player.z); if (d < bd) { bd = d; best = L; } }
      return { t: `【沈んだ灯の樹 ${litN()}/3・推奨Lv${lvOf(LH_BOSS[best.i])}】${LH_NAME[best.i]}の 番人を たおす`, p: best }; }
    return { t: `【決戦・推奨Lv${lvOf('fukami')}】北の 深淵の宮へ`, p: R3.palace }; });
  H.quest.push(() => { if (!F().c3done) return ''; const ck = v => v ? '<b class="ok">✓</b>' : '<b class="ng">□</b>';
    return `<li><b>第4章　海の底</b></li>${[['父さんの 話を 聞く', F().c4start], ['海の底へ もぐる', F().c4arrive], ['長老ウシオに 会う', F().c4elder], ...LH_NAME.map((n, i) => [n + 'に 灯を', lit(i)]), ['深みの王', F().c4done], ['（裏）深淵の主', F().superDone]].map(([t, d]) => `<li class="sub">${ck(d)} ${t}</li>`).join('')}`; });
  H.warps.push(r => r === 3 ? [{ n: 'アワの里', x: R3.town.x + 2, z: R3.town.z + 4 }, ...R3.lh.filter(L => lit(L.i)).map(L => ({ n: LH_NAME[L.i], x: L.x + .5, z: L.z + 5 }))] : r === 0 && F().c4arrive ? [{ n: '岬（もぐる 場所）', x: cape.x, z: cape.z }] : []);
  H.song.push(() => { const G = K.G; if (G.region !== 3) return null; if (Math.hypot(K.player.x - R3.town.x, K.player.z - R3.town.z) < 36) return 'seatown'; return 'sea'; });
  // 泡・灯の樹の 光・宮の 光
  const bub = []; let bT = 0;
  H.fx.push((fx, dt, T) => { const G = K.G;
    if (G.region === 0 && F().c4start && !F().c4done) fx.push({ type: 2, p: [cape.x, K.hAt(cape.x, cape.z) + 20, cape.z], size: [.8, 20], grow: 1.6, cyl: true, tint: [.5, .85, 1] });
    if (G.region !== 3) return; const P = K.player;
    bT -= dt; if (bT <= 0) { bT = .08; for (let k = 0; k < 3; k++) { const a = Math.random() * 6.28, d = 3 + Math.random() * 22; bub.push({ x: P.x + Math.cos(a) * d, z: P.z + Math.sin(a) * d, y: K.hAt(P.x + Math.cos(a) * d, P.z + Math.sin(a) * d), t: 0, s: .08 + Math.random() * .16 }); } if (bub.length > 90) bub.splice(0, bub.length - 90); }
    for (const b of bub) { b.t += dt; b.y += dt * (1.2 + b.s * 6); b.x += Math.sin(T * 2 + b.s * 40) * dt * .3; if (b.t < 7) fx.push({ type: 1, p: [b.x, b.y, b.z], size: [b.s * 2, b.s * 2], grow: .6, tint: [.8, .95, 1] }); }
    for (const L of R3.lh) { const d = Math.hypot(L.x - P.x, L.z - P.z); if (d > 200) continue; const [x, y, z] = L.fire;
      if (lit(L.i)) { fx.push({ type: 0, p: [x, y, z], size: [.9, 1.2], grow: 1.2, seed: L.i * 2.7, cyl: true }); fx.push({ type: 1, p: [x, y + .5, z], size: [8, 8], grow: 1.2 }); fx.push({ type: 2, p: [x, y + 40, z], size: [1.2, 40], grow: 2, cyl: true, tint: [1, .85, .5] }); }
      else fx.push({ type: 2, p: [x, y + 30, z], size: [.7, 30], grow: 1.3, cyl: true, tint: [.5, .3, .8] }); }
    if (litN() === 3 && !F().c4done) fx.push({ type: 2, p: [R3.palace.x, R3.palace.y + 40, R3.palace.z], size: [2, 40], grow: 2.2, cyl: true, tint: [.7, .5, 1] });
    if (F().c4done && !F().superDone) fx.push({ type: 1, p: [R3.trench.x, R3.trench.y + 1, R3.trench.z], size: [10, 10], grow: .8 + Math.sin(T) * .2, tint: [.4, .3, .9] }); });

  // ---------- 第4章から はじめる ----------
  H.startCh = H.startCh || {};
  H.startCh[4] = async () => { const G = K.G; K.setupCh3(); Object.assign(G.flags, { c3start: 1, c3arrive: 1, c3elder: 1, c3bridge: 1, c3mid: 1, c3done: 1, c3reunion: 1, glider: 1, dex: 1 }); G.wind = [1, 1, 1];
    if (!G.party.some(m => m.id === 'haru')) G.party.push(K.mkHuman('haru', 40));
    G.party.forEach(m => { m.lv = 40; m.exp = 0; G.sp[m.id] = (G.sp[m.id] || 0) + 12; }); for (const m of G.party) { for (const n of DATA.boards[m.id]) { if (n.req && !G.board[m.id].includes(n.req)) continue; if (!G.board[m.id].includes(n.id) && G.sp[m.id] >= n.cost) { G.sp[m.id] -= n.cost; G.board[m.id].push(n.id); } } K.calc(m); m.hp = m.st.hp; m.mp = m.st.mp; }
    const hi = { sora: 5, mio: 3, riku: 3, sana: 3, haru: 2 }; for (const k in hi) if (G.eq[k] && DATA.gear[k][hi[k]]) G.eq[k].w = hi[k]; for (const k in G.eq) G.eq[k].a = Math.min(DATA.armor.length - 2, 5);
    G.mons.forEach(m => { m.lv = Math.max(m.lv, 38); K.calc(m); m.hp = m.st.hp; m.mp = m.st.mp; }); G.gold = 9000; G.stamMax = 170; G.stam = 170; G.team = G.party.slice(0, 4).map(m => m.id); K.fixTeam();
    G.region = 0; World.setRegion(0); const kp = K.npcAt('kaito', 0); K.player.x = kp.x + 2; K.player.z = kp.z + 2; K.player.y = K.surfaceAt(K.player.x, K.player.z, 99); K.startField(); await K.wait(400); K.run(ch4Intro); };
  addEventListener('DOMContentLoaded', () => {}); // (タイトル ボタンは 下で 追加)
  const tm = document.getElementById('titleMenu');
  if (tm) { const b = document.createElement('button'); b.className = 't-btn'; b.type = 'button'; b.id = 'btnCh4'; b.textContent = '第4章から あそぶ'; const c3 = document.getElementById('btnCh3');
    if (c3 && c3.nextSibling) tm.insertBefore(b, c3.nextSibling); else tm.appendChild(b); b.onclick = () => { Music.sfx('ok'); K.showSlots ? K.showSlots('new', 4) : null; }; }
  const sub = document.querySelector('.logo-sub'); if (sub) { let rc = K.DEBUG ? 4 : 1; for (const k of ['kazetomo-rpg-3', 'kazetomo-rpg-3-s2', 'kazetomo-rpg-3-s3']) try { const f = ((JSON.parse(localStorage.getItem(k) || 'null') || {}).G || {}).flags || {}; rc = Math.max(rc, f.c4start ? 4 : f.c3start ? 3 : f.c2start ? 2 : 1); } catch (e) {} sub.textContent = ['第一章 ともしびの継ぎ手', '第二章 星くずの大陸', '第三章 天空の星巣', '第四章 海の底'].slice(0, rc).join(' ／ '); }
})();
