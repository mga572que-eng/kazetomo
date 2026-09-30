// ともしびアイランド — 町と 頼まれごと：隣町シオミ・灯台の 鍵クエスト・各町の サイドクエスト
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK, B = World.Blocks;
  const G = () => K.G, who = K.who, nm = K.nm;

  // ================= 隣町「潮見の町 シオミ」（風灯の島） =================
  const R0 = K.REG[0]; World.setRegion(0);
  const shiomi = (() => { let best = null;
    const far = (x, z) => Math.hypot(x - R0.town.x, z - R0.town.z) > 85 && !R0.beacons.some(b => Math.hypot(b.x - x, b.z - z) < 42) && !(R0.shrine && Math.hypot(R0.shrine.x - x, R0.shrine.z - z) < 40)
      && !(DATA.shrines || []).some(s => s.r === 0 && s.pos && Math.hypot(s.pos.x - x, s.pos.z - z) < 36) && !(K.baseSite && Math.hypot(K.baseSite.x - x, K.baseSite.z - z) < 36) && Math.hypot(x - R0.pier.x, z - R0.pier.z) > 30;
    for (let a = 0; a < 72; a++) for (let d = 90; d < 190; d += 8) { const an = a / 72 * Math.PI * 2, x = Math.round(Math.cos(an) * d), z = Math.round(Math.sin(an) * d); const h = K.hAt(x, z); if (h < 2.5 || h > 16 || !far(x, z)) continue;
      let mn = 1e9, mx = -1e9; for (let i = -14; i <= 14; i += 4) for (let j = -14; j <= 14; j += 4) { const hh = K.hAt(x + i, z + j); mn = Math.min(mn, hh); mx = Math.max(mx, hh); } if (mn < 1.8) continue;
      const sc = mx - mn; if (!best || sc < best.sc) best = { x, z, sc }; }
    return best || { x: -120, z: 60, sc: 0 }; })();
  const SX = shiomi.x, SZ = shiomi.z; shiomi.name = '潮見の町 シオミ';
  R0.trees.forEach(t => { if (Math.hypot(t.x - SX, t.z - SZ) < 22) { t.state = 'gone'; t.t = -1e9; } }); R0.rocks.forEach(t => { if (Math.hypot(t.x - SX, t.z - SZ) < 20) { t.state = 'gone'; t.t = -1e9; } });
  R0.bushes = R0.bushes.filter(t => Math.hypot(t.x - SX, t.z - SZ) >= 18);
  const hs = [{ id: 'nami', x: SX, z: SZ - 11 }, { id: 'sinn', x: SX - 12, z: SZ - 2 }, { id: 'sitem', x: SX + 12, z: SZ - 3 }, { id: 'ryou', x: SX + 9, z: SZ + 10 }, { id: 'ruin1', x: SX - 10, z: SZ + 11 }, { id: 'ruin2', x: SX + 1, z: SZ + 15 }];
  hs.forEach((h, i) => { h.face = [SX, SZ]; K.buildHouse(h, [{ wall: 4, roof: 3, corner: 5 }, { wall: 4, roof: 8 }, { wall: 6, roof: 3 }, { wall: 0, roof: 3 }, { wall: 6, roof: 3 }, { wall: 4, roof: 3 }][i]); });
  // 焼けた 家（屋根と 壁を くずす）
  for (const h of hs.filter(h => h.id.startsWith('ruin'))) { const cx = Math.round(h.x), cz = Math.round(h.z); let fy = 1e9; const cells = [];
    B.each(0, (k) => { const [x, y, z] = k.split(',').map(Number); if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 3) cells.push([x, y, z]); });
    for (const [x, y, z] of cells) if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) fy = Math.min(fy, y + 1);
    for (const [x, y, z] of cells) { const hsh = (x * 7 + z * 13 + y * 5) & 7; if (y >= fy + 3 || (y === fy + 2 && hsh < 5) || (y === fy + 1 && hsh < 2)) B.rm(x, y, z, 0); else if (y >= fy && hsh === 7) B.set(x, y, z, 5, true, 0); } }
  for (const [x, z] of [[SX - 5, SZ + 4], [SX + 5, SZ + 4], [SX - 5, SZ - 5], [SX + 5, SZ - 5]]) { const b = Math.floor(K.hAt(x + .5, z + .5)); B.set(x, b, z, 5, true, 0); B.set(x, b + 1, z, 5, true, 0); B.set(x, b + 2, z, 2, true, 0); }
  // 井戸
  { const b = Math.floor(K.hAt(SX + .5, SZ + .5)); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) B.set(SX + dx, b, SZ + dz, 1, true, 0); shiomi.well = { x: SX + .5, z: SZ + .5 }; }
  const hp = id => hs.find(h => h.id === id).npc;
  const addNpc = n => { n.yaw = n.yaw || 0; n.baseYaw = n.yaw; K.NPCS.push(n); return n; };
  addNpc({ id: 'nami', r: 0, x: hp('nami').x, z: hp('nami').z, yaw: hs[0].yaw, nm: '町長ナミ' });
  addNpc({ id: 'inn', r: 0, x: hp('sinn').x, z: hp('sinn').z, yaw: hs[1].yaw, nm: '宿屋「しおかぜ亭」' });
  addNpc({ id: 'item', r: 0, x: hp('sitem').x, z: hp('sitem').z, yaw: hs[2].yaw, nm: 'シオミの 道具屋' });
  addNpc({ id: 'ryou', r: 0, x: hp('ryou').x, z: hp('ryou').z, yaw: hs[3].yaw, nm: '漁師リョウ' });
  addNpc({ id: 'chibi', r: 0, x: SX + 3, z: SZ + 3, nm: 'チビ', show: () => !!(q('k1b').s === 'd' || !q('k1b').s) });
  K.shiomi = shiomi;
  // 他の 町の 住人（サイドクエスト用）
  const T1 = K.REG[1].town, T2 = K.REG[2].town, T3 = K.REG[3].town;
  addNpc({ id: 'ryou', r: 1, x: T1.x + 9, z: T1.z + 12, nm: '港の 漁師ドン' });
  addNpc({ id: 'chibi', r: 1, x: T1.x - 7, z: T1.z + 6, nm: '港の 子 ルル' });
  addNpc({ id: 'nami', r: 2, x: T2.x - 8, z: T2.z + 8, nm: '雲の 織り手 ワタ' });
  World.setRegion(0);

  // ================= クエスト 定義 =================
  const LV = () => DATA.guardLv[Math.min(G().order, 4)];
  const spots = {
    forest: (() => { let p = null; for (let a = 0; a < 36 && !p; a++) { const an = a / 36 * 6.283, x = SX + Math.cos(an) * 34, z = SZ + Math.sin(an) * 34; if (K.hAt(x, z) > 2.5 && World.biomeAt(x, z) === 'forest') p = { x, z }; } return p || { x: SX + 30, z: SZ - 18 }; })(),
    dock: { x: SX + 16, z: SZ + 14 },
    hill: (() => { let p = null, best = -1; for (let k = 0; k < 400; k++) { const x = R0.town.x + (Math.sin(k * 12.9898) * 43758.5453 % 1) * 120, z = R0.town.z + (Math.sin(k * 78.233) * 12543.21 % 1) * 120; const h = K.hAt(x, z); if (h > best && h < 26 && Math.hypot(x, z) > 30) { best = h; p = { x, z }; } } return p; })(),
    desert: { x: 105, z: 40, r: 1 },
  };
  DATA.reqs = [
    // ---- 第1章：灯台の 鍵 ----
    { id: 'k0', key: 0, r: 0, giver: 'gen', town: '風見の村', title: '灯台の 鍵', steps: [{ t: 'shards', n: 3, text: '灯台の まわりの 野原で「灯の欠片」を 3つ 集める' }],
      offer: [who('gen', 'neutral', '灯台の 扉は、灯の欠片を はめないと ひらかねえ。'), who('gen', 'neutral', '欠片は 北の 灯台の まわりの 野原に 散らばってる。 光ってるから すぐ わかるさ。 3つ 集めて 持ってこい。')],
      done: [who('gen', 'grin', '……よし。 これで 鍵が 打てる。'), '「灯台の 鍵」を 手に入れた！ 灯台で 番人が まっている。'], reward: { gold: 100 } },
    { id: 'k1a', key: 1, r: 0, giver: 'nami', town: 'シオミ', title: 'こわれた 井戸', steps: [{ t: 'collect', item: 'ishi', n: 5, text: '石を 5こ 集めて 町長ナミへ（岩を 掘る）' }],
      offer: [nm('町長ナミ', 'ようこそ、潮見の町シオミへ……と 言いたいけれど、見ての とおりよ。 半年前、かげものに 町の 半分を 焼かれたの。'), nm('町長ナミ', '井戸も こわされて、水が くめない。 石を 5つ あつめて もらえないかしら。')],
      done: [nm('町長ナミ', 'ありがとう！ これで 井戸が なおせるわ。'), who('sora', 'smile', 'よかった。 ……ほかにも こまってることは？')], reward: { gold: 150, give: { mi: 3 } } },
    { id: 'k1b', key: 1, r: 0, giver: 'nami', town: 'シオミ', title: 'まいごの チビ', req: 'k1a', steps: [{ t: 'visit', spot: 'forest', text: '町の 外の 森で 迷子の チビを さがす', fight: ['watapoko', 'iwanoko'] }],
      offer: [nm('町長ナミ', 'たいへん！ チビが 森へ 行ったきり 帰ってこないの。 「リクにいちゃんを さがす」って……。'), who('sora', 'determined', 'ぼくたちが さがしてくる！')],
      visit: ['しげみの 奥で、チビが かげものに かこまれている！'],
      visitDone: [nm('チビ', 'うわーん！ ……おにいちゃん、ありがと。 リクにいちゃんがね、ひとりで 灯台へ 行っちゃったの。'), who('mio', 'worried', 'リク……？'), '（チビを 町長ナミの ところへ つれて 帰ろう）'],
      done: [nm('町長ナミ', 'チビ！ よかった……本当に ありがとう。'), nm('町長ナミ', 'リクは この町の 子よ。 家族を かげものに うばわれてから、ずっと ひとりで 戦ってる。 ……灯台で あの子に 会ったら、どうか 力に なってあげて。'), '「灯台の 鍵」を たくされた！ 灯台で 番人が まっている。'], reward: { gold: 200, give: { pan: 2 } } },
    { id: 'k2', key: 2, r: 0, giver: 'ryou', town: 'シオミ', title: '港を まもれ', steps: [{ t: 'waves', spot: 'dock', n: 3, text: 'シオミの 港で おしよせる かげものを 3回 しずめる' }],
      offer: [nm('漁師リョウ', 'おう、リクの 仲間か！ ……たのみが ある。 夜ごとに 港へ かげものの 群れが 押しよせて、船が 出せねえ。'), nm('漁師リョウ', '港の 桟橋で 群れを 追いはらって くれ！ 3回 来るはずだ。')],
      done: [nm('漁師リョウ', 'やるじゃねえか！ これで 船が 出せる。'), nm('漁師リョウ', 'これは 灯台の 鍵だ。 岩山の 灯台は 地ひびきの 番人が 守ってるって うわさだ。 気をつけな。')], reward: { gold: 300, give: { shizuku: 2 } } },
    { id: 'k3', key: 3, r: 0, giver: 'nagi', town: '風見の村', title: '月光花の 灯', steps: [{ t: 'visit', spot: 'hill', night: true, text: '夜に 島の 高い 丘で「月光花」を つむ' }],
      offer: [who('nagi', 'smile', 'ねえ {name}。 夜の 灯台の 火皿はね、月光花の 花粉で しか ひらかないの。'), who('nagi', 'determined', '島で いちばん 高い 丘に、夜だけ 咲くのよ。 つんで きてくれる？')],
      visit: ['月あかりの 下、青白く 光る 花が 咲いている……。'], visitDone: ['「月光花」を つんだ！ ナギに とどけよう。'],
      done: [who('nagi', 'joy', 'きれい……！ これで 夜の 灯台が ひらくわ。'), '夜の 灯台の 鍵を 手に入れた！（夜に 番人が あらわれる）'], reward: { gold: 350, give: { shizuku: 2 } } },
    { id: 'k4', key: 4, r: 0, giver: 'ryou', town: 'シオミ', title: '崖の 灯台への 道', steps: [{ t: 'collect', item: 'ha', n: 5, text: '葉っぱ 5こ（木を 切る）' }, { t: 'collect', item: 'shizuku', n: 1, text: '夜露の しずく 1こ' }],
      offer: [nm('漁師リョウ', '最後の 灯台は 崖の 先の 浮き足場だ。 おれの 網を 直した 帆布で、足場への 綱を 張ってやる。'), nm('漁師リョウ', '葉っぱ 5つと 夜露の しずく 1つ。 たのんだぜ。')],
      done: [nm('漁師リョウ', 'よし、綱を 張った！ 風布が あれば 滑空で、なければ ブロックの 橋で わたれ。'), '崖の 灯台の 鍵を 手に入れた！'], reward: { gold: 400, give: { ganbari: 2 } } },
    // ---- サイドクエスト ----
    { id: 's_chibi', r: 0, giver: 'chibi', town: 'シオミ', title: 'チビの いきもの図鑑', req: 'k1b', steps: [{ t: 'dex', n: 6, text: 'いきもの図鑑を 6種 うめて チビに 見せる' }],
      offer: [nm('チビ', 'ねえねえ、いきもの図鑑 もってるの？ 6しゅるい うまったら 見せて！')], done: [nm('チビ', 'すごーい！ おれいに これ あげる！')], reward: { give: { nakayoshi: 2 } } },
    { id: 's_ryou', r: 0, giver: 'ryou', town: 'シオミ', title: '大漁 祈願', req: 'k4', steps: [{ t: 'collect', item: 'sakana', n: 3, text: '魚を 3びき（釣りざおで 釣る）' }],
      offer: [nm('漁師リョウ', 'ひさしぶりに 魚が 食いてえ。 3びき 釣ってきて くれねえか？')], done: [nm('漁師リョウ', 'うまそうだ！ ほら、礼だ。')], reward: { gold: 600 } },
    { id: 's_don', r: 1, giver: 'ryou', town: '港町ミナト', title: '倉庫の かげもの', steps: [{ t: 'hunt', region: 1, n: 6, text: '霧の大陸で かげものを 6回 たおす' }],
      offer: [nm('港の 漁師ドン', '倉庫の まわりに かげものが 住みついちまった。 大陸で 6回 追いはらって くれ。')], done: [nm('港の 漁師ドン', 'たすかったぜ！')], reward: { gold: 900, give: { shizuku: 2 } } },
    { id: 's_ruru', r: 1, giver: 'chibi', town: '港町ミナト', title: '砂漠の 星砂', steps: [{ t: 'visit', spot: 'desert', text: '東の 砂漠で 星砂を ひろう', fight: ['sunawani', 'hibana'] }],
      offer: [nm('港の 子 ルル', '砂漠にはね、星の かけらが まざった 砂が あるんだって。 ほしいなあ……。')], visit: ['砂の 中で、ちいさな 星が きらめいている！ ……かげものが 気づいた！'], visitDone: ['「星砂」を ひろった！ ルルに とどけよう。'],
      done: [nm('港の 子 ルル', 'わあ、きらきら！ ありがとう！ これ、宝物の はんぶん あげる！')], reward: { give: { hoshikake: 2 } } },
    { id: 's_wata', r: 2, giver: 'nami', town: '雲の里ククル', title: '雲わたの 布', steps: [{ t: 'collect', item: 'kumowata', n: 5, text: '雲わた 5こ（空の いきもの・雲の 茂み）' }],
      offer: [nm('雲の 織り手 ワタ', '里の みんなの 冬の 布団が 足りないの。 雲わたを 5つ あつめて くれない？')], done: [nm('雲の 織り手 ワタ', 'ふかふかの 布団が できるわ！ お礼に 雲の ブロックを どうぞ。')], reward: { gold: 1500, blocks: { 11: 20 } } },
  ];
  const byId = id => DATA.reqs.find(x => x.id === id);
  const q = id => { const g = G(); g.req = g.req || {}; return g.req[id] = g.req[id] || {}; };
  const done = id => q(id).s === 'd';
  const keyDone = k => G().order > k || DATA.reqs.filter(x => x.key === k).every(x => done(x.id));
  H.load.push(g => { g.req = g.req || {}; });

  // ---- ステップ 判定 ----
  const stepOk = (Q, st) => { const s = Q.steps[st.step || 0]; if (!s) return true; const g = G();
    if (s.t === 'collect') return (g.inv[s.item] || 0) >= s.n;
    if (s.t === 'shards') return (g.trial[0].shards || 0) >= s.n;
    if (s.t === 'dex') return Object.keys(g.dex.got).length >= s.n;
    if (s.t === 'hunt') return (st.c || 0) >= s.n;
    return !!st.v; };
  const stepTxt = (Q, st) => { const s = Q.steps[st.step || 0]; if (!s) return `${Q.town}の ${giverName(Q)}に 報告`; const g = G();
    let prog = s.t === 'collect' ? `（${Math.min(g.inv[s.item] || 0, s.n)}/${s.n}）` : s.t === 'shards' ? `（${g.trial[0].shards || 0}/${s.n}）` : s.t === 'dex' ? `（${Object.keys(g.dex.got).length}/${s.n}）` : s.t === 'hunt' ? `（${st.c || 0}/${s.n}）` : s.t === 'waves' ? `（${st.w || 0}/${s.n}）` : '';
    return s.text + prog; };
  const giverNpc = Q => K.NPCS.find(n => n.id === Q.giver && n.r === Q.r);
  const giverName = Q => { const n = giverNpc(Q); return n ? (n.nm || (DATA.cast[n.id] || {}).name) : ''; };
  const avail = Q => !q(Q.id).s && (!Q.req || done(Q.req)) && (Q.key == null || (G().order === Q.key && (Q.key > 0 || G().flags.mio)));
  // 1ステップ 進める（達成なら 次へ。 全部 おわれば 報告待ち）
  function advance(Q) { const st = q(Q.id); while (st.step < Q.steps.length && stepOk(Q, st) && Q.steps[st.step].t !== 'collect') { st.step++; st.v = 0; st.w = 0; st.c = 0; } }

  // ---- 会話（依頼人） ----
  async function talkGiver(n) { const g = G(); const list = DATA.reqs.filter(Q => Q.giver === n.id && Q.r === g.region);
    // 報告
    for (const Q of list) { const st = q(Q.id); if (st.s !== 'a') continue; advance(Q);
      if (st.step >= Q.steps.length - 1 && Q.steps[Q.steps.length - 1].t === 'collect' ? Q.steps.slice(st.step).every(s => (g.inv[s.item] || 0) >= s.n) : st.step >= Q.steps.length) {
        for (const s of Q.steps) if (s.t === 'collect') g.inv[s.item] -= s.n; st.s = 'd'; const w = Q.reward || {}; const lines = [...Q.done];
        if (w.gold) { g.gold += w.gold; lines.push(`${w.gold}ゴールドを もらった！`); } for (const [k, v] of Object.entries(w.give || {})) { K.gain(k, v); lines.push(`${DATA.items[k].name}を ${v}こ もらった！`); }
        for (const [k, v] of Object.entries(w.blocks || {})) { g.blk[k] = (g.blk[k] || 0) + v; lines.push(`${DATA.blocks[k]}ブロックを ${v}こ もらった！`); }
        Music.jingle('light', K.fieldSong()); await K.say([`【依頼 達成】${Q.title}`, ...lines]); K.save(); K.hud(); return; }
      await K.say([nm(giverName(Q), `たのんだよ。 ${stepTxt(Q, st)}`)]); return; }
    // 依頼
    const Q = list.find(avail); if (Q) { const st = q(Q.id); await K.say([...Q.offer, `【依頼】${Q.title}：${stepTxt(Q, { step: 0 })}`]); st.s = 'a'; st.step = 0; advance(Q); Music.sfx('ok'); K.save(); return; }
    return 'pass'; }
  for (const id of ['nami', 'ryou', 'chibi']) H.talks[id] = async n => { const r = await talkGiver(n); if (r === 'pass') await K.say([nm(n.nm, ({ nami: 'この町を もう一度 灯で いっぱいに したいの。', ryou: '海は きびしいが、正直だ。', chibi: 'リクにいちゃん、つよいんだよ！' })[n.id])]); };
  // 既存 NPC（ゲン・ナギ）は 依頼が あるときだけ 横取り
  for (const id of ['gen', 'nagi']) { const prev = H.talks[id]; H.talks[id] = async n => { if (G().region === 0) { const list = DATA.reqs.filter(Q => Q.giver === id && Q.r === 0); if (list.some(Q => q(Q.id).s === 'a' || avail(Q))) { const r = await talkGiver(n); if (r !== 'pass') return; } } return prev ? prev(n) : 'pass'; }; }
  H.talks.inn = (prev => async n => { if (G().region === 0) return K.talkInn(); return prev ? prev(n) : 'pass'; })(H.talks.inn);
  H.talks.item = (prev => async n => { if (G().region === 0) return K.shopUI('item'); return prev ? prev(n) : 'pass'; })(H.talks.item);

  // ---- 訪問・防衛 スポット ----
  const spotOf = s => s.spot === 'desert' ? spots.desert : spots[s.spot];
  H.target.push(cand => { const g = G(); for (const Q of DATA.reqs) { const st = q(Q.id); if (st.s !== 'a' || Q.r !== g.region) continue; const s = Q.steps[st.step || 0]; if (!s || (s.t !== 'visit' && s.t !== 'waves') || st.v) continue; const p = spotOf(s); if (p) cand({ Q }, 'qspot', p.x, p.z, 3.4); } });
  H.labels.qspot = t => { const s = t.o.Q.steps[q(t.o.Q.id).step || 0]; return s.t === 'waves' ? '群れを むかえうつ' : 'しらべる'; };
  H.acts.qspot = async ({ Q }) => { const st = q(Q.id), s = Q.steps[st.step || 0];
    if (s.night && World.skyInfo(G().tod).night < .5) { const c = await K.menu({ title: 'いまは 昼。 夜にしか 見つからない ようだ。', items: [{ label: '夜まで 待つ' }, { label: 'やめておく' }] }); if (c !== 0) return; await K.fade(true); G().tod = .82; await K.wait(300); await K.fade(false); }
    if (s.t === 'waves') { if (!(await K.confirm(`かげものの 群れが せまってくる。（推奨Lv${LV()}） 迎えうつ？`))) return;
      for (let w = st.w || 0; w < s.n; w++) { await K.say([`第${w + 1}波！`]); const lv = Math.max(1, LV() - 3 + w); const pool = ['watapoko', 'iwanoko', 'mizumochi', 'hanapokke', 'tsuchimogu'];
        const res = await K.runBattle(Array.from({ length: 2 + (w > 0 ? 1 : 0) }, () => ({ sp: pool[Math.floor(K.R() * pool.length)], lv })), { noFlee: true }); if (res !== 'win') return K.defeated(); st.w = w + 1; K.save(); }
      st.v = 1; await K.say(['群れを しりぞけた！（依頼人に 報告しよう）']); advance(Q); K.save(); return; }
    if (Q.visit) await K.say(Q.visit);
    if (s.fight) { const lv = G().region === 0 ? Math.max(2, LV() - 2) : K.wildLevel(K.player.x, K.player.z); const res = await K.runBattle(s.fight.map(sp => ({ sp, lv })), { noFlee: true }); if (res !== 'win') return K.defeated(); }
    st.v = 1; if (Q.visitDone) await K.say(Q.visitDone); Music.sfx('friend'); advance(Q); K.save(); };
  H.fx.push((fx, dt, T) => { const g = G(); for (const Q of DATA.reqs) { const st = q(Q.id); if (st.s !== 'a' || Q.r !== g.region) continue; const s = Q.steps[st.step || 0]; if (!s || (s.t !== 'visit' && s.t !== 'waves') || st.v) continue; const p = spotOf(s); if (!p) continue;
    const y = K.hAt(p.x, p.z); fx.push({ type: 1, p: [p.x, y + 1.2 + Math.sin(T * 2) * .2, p.z], size: [2.2, 2.2], grow: 1.3, tint: s.t === 'waves' ? [1, .45, .35] : [.6, .9, 1] }); } });
  // ---- 討伐 カウント ----
  H.battleEnd.push(async (res, specs) => { if (res !== 'win' || specs.some(s => s.boss)) return; for (const Q of DATA.reqs) { const st = q(Q.id); if (st.s !== 'a') continue; const s = Q.steps[st.step || 0]; if (s && s.t === 'hunt' && G().region === s.region) st.c = (st.c || 0) + 1; } });

  // ---- 灯台の 門番（鍵が ないと ひらかない）と 目的 ----
  DATA.trials.forEach((T, i) => { T.text = '灯台の 奥で、闇に のまれた 番人が 灯を ふさいでいる。'; T.name = ['野原の灯台', '双塔の灯台', '岩山の灯台', '月夜の灯台', '崖の灯台'][i] || T.name; });
  H.beaconGate = b => { const k = G().order; if (keyDone(k)) return null; const Q = DATA.reqs.find(x => x.key === k && !done(x.id));
    return ['灯台の 扉は かたく 閉ざされている……。', Q ? `（${Q.town}の ${giverName(Q)}が 鍵の ことを 知っているようだ）` : '（まだ 鍵が ない）']; };
  H.beaconObj = () => { const k = G().order; if (keyDone(k)) return null; const Q = DATA.reqs.find(x => x.key === k && !done(x.id)); if (!Q) return null; const st = q(Q.id); const lv = DATA.guardLv[k];
    if (!st.s) { const n = giverNpc(Q); return { t: `【灯台 ${k}/5・推奨Lv${lv}】${Q.town}の ${giverName(Q)}に 話を 聞こう`, p: n ? { x: n.x, z: n.z } : null }; }
    advance(Q); const s = Q.steps[st.step || 0]; const fin = !s || (s.t === 'collect' ? Q.steps.slice(st.step).every(x => (G().inv[x.item] || 0) >= x.n) : stepOk(Q, st) && st.step >= Q.steps.length - 1 && (s.t !== 'visit' && s.t !== 'waves' || st.v));
    if (fin || (s && (s.t === 'visit' || s.t === 'waves') && st.v)) { const n = giverNpc(Q); return { t: `【灯台 ${k}/5】${Q.town}の ${giverName(Q)}に 報告しよう`, p: n ? { x: n.x, z: n.z } : null }; }
    const p = s && (s.t === 'visit' || s.t === 'waves') ? spotOf(s) : s && s.t === 'shards' ? (() => { const b0 = R0.beacons[0]; const got = G().trial[0].got || []; const sh = b0.shards.find((_, i) => !got.includes(i)); return sh; })() : null;
    return { t: `【灯台 ${k}/5・${Q.title}】${stepTxt(Q, st)}`, p }; };
  K.reqList = () => DATA.reqs.filter(Q => q(Q.id).s === 'a').map(Q => { const st = q(Q.id); advance(Q); const s = Q.steps[st.step || 0]; const n = giverNpc(Q);
    const ready = !s || (s.t !== 'visit' && s.t !== 'waves' ? stepOk(Q, st) : st.v); const p = ready ? (n ? { x: n.x, z: n.z } : null) : s && (s.t === 'visit' || s.t === 'waves') ? spotOf(s) : null;
    return { id: 'r' + Q.id, n: `${Q.key != null ? '【鍵】' : '【依頼】'}${Q.title}（${Q.town}）`, d: ready ? `${giverName(Q)}に 報告しよう` : stepTxt(Q, st), p, r: Q.r }; });
  // ---- 地図・ワープ・地名 ----
  H.mapMarks.push((r, pos) => { const out = []; if (r === 0) out.push(`<span class="mk town" style="${pos(SX, SZ)}">シオミ</span>`);
    for (const Q of DATA.reqs) { if (Q.r !== r) continue; const st = q(Q.id); const n = giverNpc(Q); if (n && (avail(Q) || st.s === 'a')) out.push(`<span class="mk" style="${pos(n.x, n.z)};color:#ffd24a" title="${Q.title}">${st.s === 'a' ? '？' : '！'}</span>`); } return out; });
  H.warps.push(r => r === 0 && (G().warp || G().order >= 2) ? [{ n: 'シオミ', x: SX + 1.5, z: SZ + 5 }] : []);
  K.extraAreas = [{ rg: 0, id: 'shiomi', x: SX, z: SZ, r: 26, n: '潮見の町 シオミ', s: '風灯の島' }];
  // 頭上の「！」（依頼あり）
  H.fx.push((fx, dt, T) => { const g = G(); for (const Q of DATA.reqs) { if (Q.r !== g.region || !avail(Q)) continue; const n = giverNpc(Q); if (!n || (n.show && !n.show())) continue; if (Math.hypot(n.x - K.player.x, n.z - K.player.z) > 60) continue;
    fx.push({ type: 1, p: [n.x, K.surfaceAt(n.x, n.z, 99) + 2.6 + Math.sin(T * 3) * .1, n.z], size: [.9, .9], grow: 1.2, tint: [1, .85, .2] }); } });
})();
