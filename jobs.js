// ともしびアイランド — 職業・転職（ジョブ）：職業レベル・JP・職業技・石像で 転職
// 人間の 仲間（sora/mio/riku/sana/haru/kaito）に「職業」の 層を くわえる。スキルボードとは 独立。
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK, R = Math.random;
  const HUMANS = ['sora', 'mio', 'riku', 'sana', 'haru', 'kaito'];
  const MAXLV = 10;
  // 職業レベル n に 必要な JP（累計）
  const NEED = [0, 0, 4, 10, 18, 28, 40, 55, 72, 92, 115];

  // ---------- 職業の 技 ----------
  Object.assign(DATA.skills, {
    // 見習い灯守
    j_hibana: { type: 'fire', name: '火花打ち', mp: 2, tg: 'enemy', power: 1.6, verb: 'はなった', fx: 'fire', desc: '敵1体に 小さな ほのおの 一撃' },
    j_hotaru: { name: 'ほたる火', mp: 3, tg: 'ally', heal: 30, healPct: .1, verb: 'ともした', fx: 'heal', desc: '味方1人の HPを かいふく' },
    j_akari: { type: 'light', name: 'あかりの輪', mp: 7, tg: 'enemies', power: 1.25, verb: 'ひろげた', fx: 'light', desc: '敵全体に ひかりの 輪（闇に つよい）' },
    j_tomoshiuchi: { type: 'light', name: '灯守の一撃', mp: 8, tg: 'enemy', power: 2.6, verb: 'はなった', fx: 'light', desc: '敵1体に ひかりの 強打' },
    // 戦士
    j_kabuto: { name: 'かぶと割り', mp: 4, tg: 'enemy', power: 2.0, verb: 'はなった', fx: 'slash', desc: '敵1体に 重い 一撃' },
    j_otakebi: { name: 'おたけび', mp: 5, tg: 'party', buff: 'atk', verb: 'あげた', fx: 'song', desc: '3ターン 味方全員の こうげき ×1.4' },
    j_nagi: { name: 'なぎはらい', mp: 6, tg: 'enemies', power: 1.3, verb: 'はなった', fx: 'slash', desc: '敵全体を なぎはらう' },
    j_teppeki: { name: '鉄壁の陣', mp: 5, tg: 'party', buff: 'def', verb: 'くんだ', fx: 'light', desc: '3ターン 味方全員の ぼうぎょ ×1.5' },
    j_gekiretsu: { name: '激烈斬', mp: 10, tg: 'enemy', power: 3.1, verb: 'はなった', fx: 'slash', desc: '敵1体に 渾身の 大ダメージ' },
    // 魔法使い
    j_hinotama: { type: 'fire', name: 'ひのたま', mp: 4, tg: 'enemy', power: 1.9, magic: true, ail: ['burn', .2], verb: 'となえた', fx: 'fire', desc: '敵1体に ほのおの 魔法（やけど）' },
    j_mizutsubute: { type: 'water', name: 'みずつぶて', mp: 7, tg: 'enemies', power: 1.25, magic: true, verb: 'となえた', fx: 'water', desc: '敵全体に みずの 魔法' },
    j_raiun: { type: 'wind', name: 'らいうん', mp: 9, tg: 'enemies', power: 1.4, magic: true, ail: ['para', .2], verb: 'よびよせた', fx: 'light', desc: '敵全体に かみなりの 魔法（まひ）' },
    j_gouka: { type: 'fire', name: 'ごうかの渦', mp: 13, tg: 'enemies', power: 1.75, magic: true, ail: ['burn', .2], verb: 'となえた', fx: 'fire', desc: '敵全体に はげしい ほのお' },
    j_hoshikuzu: { type: 'light', name: 'ほしくずの雨', mp: 18, tg: 'enemies', power: 2.0, magic: true, verb: 'ふらせた', fx: 'light', desc: '敵全体に ひかりの 大魔法' },
    // 僧侶
    j_iyashite: { name: 'いやしの手', mp: 4, tg: 'ally', heal: 40, healPct: .2, verb: 'かざした', fx: 'heal', desc: '味方1人の HPを 大きく かいふく' },
    j_kiyokaze: { name: 'きよらかな風', mp: 4, tg: 'party', heal: 10, cure: true, verb: 'ふかせた', fx: 'heal', desc: '味方全員の 状態異常を なおす' },
    j_megumi: { name: 'めぐみの雨', mp: 11, tg: 'party', heal: 40, healPct: .3, cure: true, verb: 'ふらせた', fx: 'heal', desc: '味方全員を 大回復＋状態異常を なおす' },
    j_seika: { type: 'light', name: '聖なる灯火', mp: 12, tg: 'enemies', power: 1.6, magic: true, verb: 'ともした', fx: 'light', desc: '敵全体に ひかりの 魔法' },
    // 盗賊
    j_kagenui: { name: 'かげぬい', mp: 3, tg: 'enemy', power: 1.4, slow: true, verb: 'はなった', fx: 'slash', desc: '敵1体に こうげき＋うごきを にぶらせる' },
    j_hayabusa: { type: 'wind', name: 'はやぶさ斬り', mp: 6, tg: 'enemy', power: 2.4, verb: 'はなった', fx: 'slash', desc: '敵1体に 目にも とまらぬ 二連撃' },
    j_yamiuchi: { type: 'dark', name: '闇討ち', mp: 9, tg: 'enemy', power: 3.2, verb: 'しかけた', fx: 'dark', desc: '敵1体に 闇からの 大ダメージ' },
    // 武闘家
    j_seiken: { name: 'せいけん突き', mp: 3, tg: 'enemy', power: 1.9, verb: 'くりだした', fx: 'slash', desc: '敵1体に まっすぐな 正拳' },
    j_renkyaku: { type: 'earth', name: '大地の連脚', mp: 5, tg: 'enemy', power: 2.3, verb: 'くりだした', fx: 'rock', desc: '敵1体に つちの 連続げり' },
    j_kikou: { name: '気功', mp: 5, tg: 'ally', heal: 50, healPct: .25, verb: 'ねった', fx: 'heal', desc: '味方1人の HPを 大きく かいふく' },
    j_senpuu: { type: 'wind', name: 'せんぷう脚', mp: 8, tg: 'enemies', power: 1.45, verb: 'くりだした', fx: 'slash', desc: '敵全体に かぜの 回しげり' },
    j_touken: { type: 'fire', name: '灯拳・極', mp: 11, tg: 'enemy', power: 3.4, ail: ['burn', .2], verb: 'たたきこんだ', fx: 'fire', desc: '敵1体に 灯を こめた 必殺の 拳' },
    // 吟遊詩人
    j_komori: { name: 'こもりうた', mp: 4, tg: 'enemy', sleep: .8, verb: 'うたった', fx: 'song', desc: '敵1体を ねむらせる（ボスには きかない）' },
    j_nagiuta: { name: 'なぎの歌', mp: 9, tg: 'party', heal: 30, healPct: .2, cure: true, verb: 'うたった', fx: 'song', desc: '味方全員を かいふく＋状態異常を なおす' },
    j_gassou: { type: 'light', name: '星灯の大合唱', mp: 15, tg: 'enemies', power: 1.7, magic: true, buff: 'atk', verb: 'かなでた', fx: 'song', desc: '敵全体に ひかりの 歌＋味方の こうげき アップ' },
    // 勇灯
    j_yuuki: { name: '勇気の灯', mp: 10, tg: 'party', heal: 30, healPct: .15, buff: 'atk', verb: 'かかげた', fx: 'heal', desc: '味方全員を かいふく＋こうげき アップ' },
    j_raikou: { type: 'wind', name: '雷光斬', mp: 8, tg: 'enemy', power: 2.6, ail: ['para', .25], verb: 'はなった', fx: 'light', desc: '敵1体に いなずまの 斬撃（まひ）' },
    j_hikaritate: { name: 'ひかりの盾', mp: 8, tg: 'party', buff: 'def', cure: true, verb: 'かかげた', fx: 'light', desc: '味方の ぼうぎょ アップ＋状態異常を なおす' },
    j_tenkuu: { type: 'light', name: '天空の灯剣', mp: 14, tg: 'enemies', power: 1.9, verb: 'ふりおろした', fx: 'light', desc: '敵全体に 天の ひかりの 剣' },
    j_gokui: { type: 'light', name: '灯火の極み', mp: 16, tg: 'enemy', power: 4.0, verb: 'はなった', fx: 'light', desc: '敵1体に 灯の すべてを こめた 一撃' },
  });
  // v9：名前の 系統（data.js の 文法）に そろえる（キーは そのまま）
  Object.assign(DATA.skillNames = DATA.skillNames || {}, {
    j_hibana: 'ホムラ打ち', j_hotaru: 'ヌクミ', j_akari: 'アカリの舞', j_tomoshiuchi: '大アカリ打ち', j_otakebi: 'フルイビ', j_teppeki: 'マモリビ',
    j_hinotama: 'ホムラ', j_mizutsubute: 'ミナモの輪', j_raiun: 'カザネの輪・マヒ', j_gouka: '大ホムラの輪', j_hoshikuzu: '極アカリの輪',
    j_iyashite: '大ヌクミ', j_kiyokaze: 'キヨメ', j_megumi: '大ヌクミの輪・キヨメ', j_seika: '大アカリの輪',
    j_kagenui: 'シガラミ斬り', j_hayabusa: '大カザネ斬り', j_yamiuchi: '極カゲリ斬り',
    j_renkyaku: '大イワネ蹴り', j_kikou: '大ヌクミ', j_senpuu: 'カザネの舞', j_touken: '極ホムラ拳',
    j_komori: '大マドロミ', j_nagiuta: 'ヌクミの輪・キヨメ', j_gassou: '大アカリの輪・フルイビ',
    j_yuuki: 'ヌクミの輪・フルイビ', j_raikou: '大カザネ斬り・マヒ', j_hikaritate: 'マモリビ・キヨメ', j_tenkuu: '大アカリの舞', j_gokui: '極アカリ斬り' });
  delete DATA.skills.j_kiyokaze.heal;
  for (const k of Object.keys(DATA.skills)) if (k.startsWith('j_')) { const s = DATA.skills[k]; if (DATA.skillNames[k]) s.name = DATA.skillNames[k]; if (DATA.skillDesc) s.desc = DATA.skillDesc(s); }

  // ---------- 職業 ----------
  // mul：その職業の あいだ だけ 効く 能力補正 ／ pas：その職業の あいだ だけ 効く とくせい
  // mb：マスター（Lv10）で ずっと 効く ボーナス ／ sk：[職業Lv, 技]（覚えた 技は 転職しても のこる）
  DATA.jobs = [
    { id: 'minarai', name: '見習い灯守', icon: '🕯', desc: 'すべての 灯守が はじめに 就く 職業。 くせが なく、どんな 場面でも たよれる。',
      mul: {}, pas: {}, mb: { hp: .03 }, sk: [[2, 'j_hibana'], [4, 'j_hotaru'], [6, 'mamori'], [8, 'j_akari'], [10, 'j_tomoshiuchi']] },
    { id: 'senshi', name: '戦士', icon: '⚔', desc: '重い 武器と かたい からだで 前に 立つ。 すばやさと MPは ひかえめ。',
      mul: { hp: .15, atk: .15, def: .1, mp: -.2, spd: -.1 }, pas: { crit: .02 }, mb: { atk: .03 }, sk: [[2, 'j_kabuto'], [4, 'j_otakebi'], [6, 'j_nagi'], [8, 'j_teppeki'], [10, 'j_gekiretsu']] },
    { id: 'mahou', name: '魔法使い', icon: '✦', desc: 'ほのお・みず・かみなりの 魔法を あやつる。 からだは よわいが MPが おおい。',
      mul: { mp: .3, hp: -.1, def: -.1 }, pas: { mpSave: .1 }, mb: { mp: .05 }, sk: [[2, 'j_hinotama'], [4, 'j_mizutsubute'], [6, 'j_raiun'], [8, 'j_gouka'], [10, 'j_hoshikuzu']] },
    { id: 'souryo', name: '僧侶', icon: '✚', desc: 'いやしと きよめの 祈りで 仲間を まもる。 回復量が ふえる。',
      mul: { mp: .2, def: .05, atk: -.1 }, pas: { healUp: .2 }, mb: { healUp: .05 }, sk: [[2, 'j_iyashite'], [4, 'j_kiyokaze'], [6, 'mamori'], [8, 'j_megumi'], [10, 'j_seika']] },
    { id: 'touzoku', name: '盗賊', icon: '🗝', desc: 'すばやく 急所を ねらう。 たたかいの あと、ときどき 戦利品を 見つける。',
      mul: { spd: .25, atk: .05, hp: -.05, def: -.05 }, pas: { crit: .08 }, mb: { spd: .03 }, loot: .3, sk: [[2, 'j_kagenui'], [4, 'dokubari'], [6, 'j_hayabusa'], [8, 'oikaze'], [10, 'j_yamiuchi']] },
    { id: 'butouka', name: '武闘家', icon: '✊', desc: '素手で 戦う 達人。 こうげきと 会心が たかいが MPは すくない。',
      mul: { atk: .2, spd: .15, mp: -.3, def: -.05 }, pas: { crit: .1 }, mb: { crit: .02 }, sk: [[2, 'j_seiken'], [4, 'j_renkyaku'], [6, 'j_kikou'], [8, 'j_senpuu'], [10, 'j_touken']] },
    { id: 'ginyuu', name: '吟遊詩人', icon: '♪', desc: '歌で 仲間を ささえる 旅の 楽士。 毎ターン 味方全員が すこし 回復する。',
      mul: { mp: .15, spd: .1, atk: -.05 }, pas: { aura: .02 }, mb: { regen: .01 }, sk: [[2, 'hagemashi'], [4, 'j_komori'], [6, 'oikaze'], [8, 'j_nagiuta'], [10, 'j_gassou']] },
    { id: 'yuutou', name: '勇灯', icon: '☀', desc: '二つの 職業を きわめた 者だけが 就ける、灯の 勇者。 すべてが たかい。', adv: 2,
      mul: { hp: .15, mp: .1, atk: .15, def: .1, spd: .1 }, pas: { crit: .04, regen: .02 }, mb: { hp: .05, atk: .05 }, sk: [[2, 'j_yuuki'], [4, 'j_raikou'], [6, 'j_hikaritate'], [8, 'j_tenkuu'], [10, 'j_gokui']] },
  ];
  DATA.jobs.find(j => j.id === 'souryo').sk = [[2, 'j_iyashite'], [4, 'j_kiyokaze'], [6, 'i_kaeribi'], [8, 'j_megumi'], [10, 'j_seika']];
  // ---------- v9：職業ツリー（SPで 覚える・転職で 返金）と そうびの 種類 ----------
  // 技マス：職業Lv 2/4/6/8/10 で ひらき、1/2/2/3/4 SP。 能力マス：職業Lv3（1SP）・Lv7（2SP）
  const PASS = {
    minarai: [['灯守の体', '最大HP +6%', { hp: .06 }], ['灯守の技', 'こうげき・ぼうぎょ +4%', { atk: .04, def: .04 }]],
    senshi: [['頑丈', '最大HP +8%', { hp: .08 }], ['豪腕', '会心の 確率 アップ', { crit: .04 }]],
    mahou: [['魔力', '最大MP +10%', { mp: .1 }], ['詠唱短縮', '消費MP −10%', { mpSave: .1 }]],
    souryo: [['祈り', '回復量 +10%', { healUp: .1 }], ['加護', '毎ターン HP 2% 回復', { regen: .02 }]],
    touzoku: [['身軽', 'すばやさ +6%', { spd: .06 }], ['急所', '会心の 確率 アップ', { crit: .04 }]],
    butouka: [['鍛錬', 'こうげき +5%', { atk: .05 }], ['見切り', '会心の 確率 アップ', { crit: .04 }]],
    ginyuu: [['肺活量', '最大MP +8%', { mp: .08 }], ['伴奏', '味方全員 毎ターン HP 1% 回復', { aura: .01 }]],
    yuutou: [['勇者の体', '最大HP +5%', { hp: .05 }], ['勇者の技', 'こうげき +5%', { atk: .05 }]],
  };
  const SKC = { 2: 1, 4: 2, 6: 2, 8: 3, 10: 4 };
  // eqW / eqA：その 職業の あいだ 装備できる 種類（キャラ固有の 種類に 足される）
  const EQ = {
    minarai: [['sword', 'dagger', 'staff'], ['cloth', 'light', 'shield']], senshi: [['sword', 'spear', 'axe', 'mace'], ['light', 'heavy', 'shield']],
    mahou: [['staff'], ['cloth', 'robe']], souryo: [['staff', 'mace'], ['cloth', 'robe', 'shield']], touzoku: [['dagger', 'bow'], ['cloth', 'light']],
    butouka: [['fist'], ['cloth', 'light']], ginyuu: [['harp', 'fan', 'bow'], ['cloth', 'light', 'robe']], yuutou: [['sword', 'spear', 'axe', 'mace', 'staff', 'dagger'], ['light', 'heavy', 'robe', 'shield']] };
  const WPN = { minarai: 'sword', senshi: 'sword', mahou: 'staff', souryo: 'staff', touzoku: 'dagger', butouka: 'fist', ginyuu: 'harp', yuutou: 'sword' };
  for (const j of DATA.jobs) { const P = PASS[j.id] || [];
    j.tree = [...j.sk.map(([l, s], i) => ({ id: `${j.id}_${i}`, jl: l, cost: SKC[l] || 2, skill: s })), ...P.map(([name, desc, eff], i) => ({ id: `${j.id}_p${i}`, jl: i ? 7 : 3, cost: i ? 2 : 1, name, desc, eff }))].sort((a, b) => a.jl - b.jl);
    j.eqW = (EQ[j.id] || [[], []])[0]; j.eqA = (EQ[j.id] || [[], []])[1]; j.wpn = WPN[j.id]; }
  const JOB = Object.fromEntries(DATA.jobs.map(j => [j.id, j]));
  const nodeName = n => n.skill ? DATA.skills[n.skill].name : n.name, nodeDesc = n => n.skill ? DATA.skills[n.skill].desc : n.desc;
  const treeCost = (r, jid) => ((r.tree && r.tree[jid]) || []).reduce((a, id) => { const n = JOB[jid] && JOB[jid].tree.find(x => x.id === id); return a + (n ? n.cost : 0); }, 0);
  const SP_MASTER = 2; // マスター時の ボーナスSP
  const jobSp = r => DATA.jobs.reduce((a, j) => a + Math.max(0, (r.lv[j.id] || 1) - 1) + ((r.lv[j.id] || 1) >= MAXLV ? SP_MASTER : 0), 0);
  // 転職の 手数料（章ごと）
  const chap = () => { const F = G().flags; return F.c3done ? 4 : F.c2done ? 3 : F.cleared ? 2 : 1; };
  const FEE = [0, 0, 150, 500, 1200];
  const feeOf = (r, id) => id === 'minarai' ? Math.round(FEE[chap()] / 3) : FEE[chap()];
  const LOOT = [['mi', 30], ['shizuku', 18], ['pan', 12], ['kinoko', 12], ['dokukeshi', 8], ['nakayoshi', 4], ['hoshikake', 2]];

  // ---------- 状態 ----------
  const G = () => K.G;
  const lvFromJp = jp => { let l = 1; while (l < MAXLV && jp >= NEED[l + 1]) l++; return l; };
  function rec(id, lv0) { const g = G(); if (!g.job || typeof g.job !== 'object') g.job = {};
    let r = g.job[id]; if (!r || typeof r !== 'object') { const m = (g.party || []).find(x => x.id === id); const jp0 = Math.min(NEED[MAXLV], Math.floor((lv0 || (m && m.lv) || 1) * 1.5));
      r = g.job[id] = { cur: 'minarai', lv: { minarai: lvFromJp(jp0) }, jp: { minarai: jp0 } }; }
    if (!r.lv) r.lv = {}; if (!r.jp) r.jp = {}; if (!r.tree || typeof r.tree !== 'object') r.tree = {}; if (!JOB[r.cur]) r.cur = 'minarai'; return r; }
  const jlv = (r, j) => r.lv[j] || 1;
  const mastered = r => DATA.jobs.filter(j => !j.adv && jlv(r, j.id) >= MAXLV).length;
  const unlocked = (r, j) => !j.adv || mastered(r) >= j.adv;
  // いまの 職業ツリーで SPを 払って 覚えた マス（転職すると 返金されて 消える）
  const ownNodes = r => ((r.tree && r.tree[r.cur]) || []).map(id => JOB[r.cur].tree.find(n => n.id === id)).filter(Boolean);
  const learnedOf = r => ownNodes(r).filter(n => n.skill && DATA.skills[n.skill]).map(n => n.skill);
  const open = () => !!G().flags.cleared;
  const innateOf = m => (DATA.party[m.id].skills || []).filter(([, l]) => l <= m.lv).map(([s]) => s);
  // マスを 覚えられるか（理由つき）
  function canBuy(m, n) { const r = rec(m.id), own = (r.tree[r.cur] || []);
    if (!open()) return [false, '第1章クリアで 解放'];
    if (own.includes(n.id)) return [false, '習得ずみ'];
    if (n.skill && innateOf(m).includes(n.skill)) return [false, 'キャラ固有わざで 習得ずみ'];
    if (jlv(r, r.cur) < n.jl) return [false, `職業Lv${n.jl}で ひらく`];
    if ((G().sp[m.id] || 0) < n.cost) return [false, `SPが たりない（${n.cost}SP）`];
    return [true, `${n.cost}SPで 覚える`]; }
  function buyNode(m, n) { const [ok] = canBuy(m, n); if (!ok) return false; const r = rec(m.id), g = G();
    g.sp[m.id] -= n.cost; (r.tree[r.cur] = r.tree[r.cur] || []).push(n.id);
    const hr = m.st.hp ? m.hp / m.st.hp : 1; K.calc(m); m.hp = Math.max(1, Math.round(m.st.hp * hr)); m.mp = Math.min(m.mp, m.st.mp); return true; }

  // ---------- 能力計算（スキルボードの あとに 加算） ----------
  H.calc.push((m, st, mul, pas, extra) => { if (!HUMANS.includes(m.id)) return; const r = rec(m.id, m.lv), j = JOB[r.cur];
    for (const [k, v] of Object.entries(j.mul)) mul[k] = (mul[k] || 0) + v;
    for (const [k, v] of Object.entries(j.pas)) pas[k] = (pas[k] || 0) + v;
    for (const jj of DATA.jobs) if (jlv(r, jj.id) >= MAXLV) for (const [k, v] of Object.entries(jj.mb)) { if (k in mul) mul[k] += v; else pas[k] = (pas[k] || 0) + v; }
    for (const n of ownNodes(r)) for (const [k, v] of Object.entries(n.eff || {})) { if (k in mul) mul[k] += v; else pas[k] = (pas[k] || 0) + v; }
    const base = innateOf(m);
    for (const s of learnedOf(r)) if (!extra.includes(s) && !base.includes(s)) extra.push(s); });

  // ---------- セーブ移行 ----------
  // v9：職業Lvで もらえる SP を さかのぼって 付与（spGot で 二重付与を ふせぐ）。 旧版で 自動習得していた 職業技は、いまの 職業の ツリーを その SPで 自動で 覚えなおす
  const grantJobSp = (g, id, r) => { const want = jobSp(r), got = r.spGot || 0; if (want > got) { g.sp[id] = (g.sp[id] || 0) + (want - got); r.spGot = want; return want - got; } return 0; };
  const fixAll = g => { if (!g.job || typeof g.job !== 'object') g.job = {}; if (!g.sp) g.sp = {};
    for (const m of g.party || []) { if (!HUMANS.includes(m.id)) continue; const r = rec(m.id);
      for (const k of Object.keys(r.jp)) { if (!JOB[k]) { delete r.jp[k]; delete r.lv[k]; continue; } r.jp[k] = Math.max(0, Math.min(NEED[MAXLV], +r.jp[k] || 0)); r.lv[k] = lvFromJp(r.jp[k]); }
      if (!unlocked(r, JOB[r.cur])) r.cur = 'minarai';
      for (const k of Object.keys(r.tree)) { if (!JOB[k] || k !== r.cur) { const c = treeCost(r, k); if (c) g.sp[m.id] = (g.sp[m.id] || 0) + c; delete r.tree[k]; continue; } r.tree[k] = [...new Set(r.tree[k])].filter(id => JOB[k].tree.some(n => n.id === id)); }
      grantJobSp(g, m.id, r);
      if (!r.treeV) { r.treeV = 1; if (m.st) K.calc(m); for (const n of JOB[r.cur].tree) { if (!n.skill) continue; if (canBuy(m, n)[0]) buyNode(m, n); } }
      if (m.st) { const hr = m.st.hp ? m.hp / m.st.hp : 1, mr = m.st.mp ? m.mp / m.st.mp : 1; K.calc(m); m.hp = Math.max(m.hp > 0 ? 1 : 0, Math.min(m.st.hp, Math.round(m.st.hp * hr))); m.mp = Math.min(m.st.mp, Math.round(m.st.mp * mr)); } } };
  H.load.push(fixAll);
  H.init.push(g => { g.job = {}; });

  // ---------- 転職（ツリーの SPは 全額 返金／もとの 能力値は そのまま） ----------
  // plan：転職の 前に 見せる 内容（返金SP・手数料・わすれる技・そうびの 変化）
  function planChange(m, id) { const r = rec(m.id), was = r.cur; const refund = treeCost(r, was);
    const lost = learnedOf(r).filter(s => !innateOf(m).includes(s)).map(s => DATA.skills[s].name);
    const eq = K.bal && K.bal.refitPlan ? K.bal.refitPlan(m, id) : [];
    return { refund, fee: feeOf(r, id), lost, eq }; }
  function changeJob(m, id, o = {}) { const r = rec(m.id); if (r.cur === id || !JOB[id] || !unlocked(r, JOB[id])) return false;
    const p = planChange(m, id); if (!o.free && (G().gold || 0) < p.fee) return false;
    const hr = m.st.hp ? m.hp / m.st.hp : 1, mr = m.st.mp ? m.mp / m.st.mp : 1;
    if (!o.free) G().gold -= p.fee;
    if (p.refund) G().sp[m.id] = (G().sp[m.id] || 0) + p.refund; r.tree[r.cur] = []; delete r.tree[r.cur];
    r.cur = id; if (r.jp[id] == null) { r.jp[id] = 0; r.lv[id] = 1; }
    const msgs = K.bal && K.bal.refit ? K.bal.refit(m) : [];
    K.calc(m); m.hp = Math.max(1, Math.min(m.st.hp, Math.round(m.st.hp * hr))); m.mp = Math.min(m.st.mp, Math.round(m.st.mp * mr)); return { ...p, msgs }; }
  const preview = (m, id) => { const r = rec(m.id), was = r.cur, t = r.tree[was]; r.cur = id; r.tree[was] = []; const c = { ...m, __eq: K.bal && K.bal.refitEq ? K.bal.refitEq(m, id) : null }; K.calc(c); r.cur = was; r.tree[was] = t; return c; };

  // ---------- JP：たたかいの あと ----------
  H.battleEnd.push(async (result, specs, opts, P) => { if (result !== 'win' || !open()) return;
    const boss = !!(opts && opts.boss) || (specs || []).some(s => s && s.boss);
    const gain = 1 + Math.min(3, (specs || []).length) + (boss ? 10 : 0);
    const lines = []; let up = false, loot = false;
    for (const m of P || []) { if (m.kind !== 'human' || !HUMANS.includes(m.id)) continue; const r = rec(m.id), id = r.cur, j = JOB[id];
      const l0 = jlv(r, id); r.jp[id] = Math.min(NEED[MAXLV], (r.jp[id] || 0) + gain); const l1 = lvFromJp(r.jp[id]); r.lv[id] = l1;
      if (l1 > l0) { up = true; const hr = m.hp / m.st.hp, mr = m.st.mp ? m.mp / m.st.mp : 1; const spg = grantJobSp(G(), m.id, r); K.calc(m); m.hp = Math.max(1, Math.round(m.st.hp * hr)); m.mp = Math.round(m.st.mp * mr);
        const opened = j.tree.filter(n => n.jl > l0 && n.jl <= l1).map(nodeName);
        lines.push(`${K.esc(K.nameOf(m))}：${j.name} Lv${l1}${l1 >= MAXLV ? '（マスター！）' : ''}　<b>SP +${spg}</b>${opened.length ? `　ツリーで ひらいた：${opened.join('・')}` : ''}`);
        if (l1 >= MAXLV && JOB.yuutou && mastered(r) === JOB.yuutou.adv && jlv(r, 'yuutou') < 2) lines.push(`${K.esc(K.nameOf(m))}は「勇灯」に 転職 できるように なった！`); }
      if (j.loot && !loot && R() < j.loot) { loot = true; let t = R() * LOOT.reduce((a, x) => a + x[1], 0); let it = 'mi'; for (const [k, w] of LOOT) if ((t -= w) < 0) { it = k; break; }
        if (DATA.items[it]) { K.gain(it); lines.push(`${K.esc(K.nameOf(m))}は ${DATA.items[it].name}を 見つけた！（盗賊）`); } } }
    if (up) { try { Music.sfx('friend'); } catch (e) {} }
    if (lines.length) K.tip(`<b>${up ? '職業レベルが あがった！' : 'たたかいの 戦利品'}</b><span>${lines.join('<br>')}</span>`);
    if (up) K.tip('<b>職業ツリー</b><span>職業Lvが あがると SPが もらえ、ツリーの マスが ひらく。 メニューの「スキル」か「しょくぎょう」で SPを ふって 技を 覚えよう。 転職すると その 職業に ふった SPは ぜんぶ もどる。</span>', 'jobHelp2'); });

  // ---------- 見た目（スタイル） ----------
  const css = document.createElement('style');
  css.textContent = `.jobp{width:min(900px,calc(var(--app-w,100vw) - 24px));padding:10px 14px;background:rgba(12,18,40,.985)}
  .jobp h3{margin:0 0 4px;font-size:17px}.jobp h3 small{font-size:12px;color:var(--muted)}
  .jobp .tabs .tab .fc{display:inline-block;width:18px;height:18px;border-radius:50%;overflow:hidden;vertical-align:-4px;margin-right:4px;background:#1c2744}.jobp .tabs .tab .fc svg{width:100%;height:100%;transform:scale(1.3) translateY(6%)}
  .jobp .shop-body{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}
  .jobp .slist,.jobp .sdet{max-height:calc(var(--app-h,100vh) - 128px)}
  .jrow{grid-template-columns:22px 1fr auto;padding:3px 8px;line-height:1.35}.jrow .ji{font-size:15px;text-align:center;color:var(--gold)}.jrow .xp{margin:1px 0 0;height:4px}.jrow small{display:inline;margin-left:6px}
  .jobp .sdet h4{flex-wrap:wrap}.jobp .sdet h4 .buy{margin-left:auto;padding:4px 14px;font-size:14px}.jobp .sdet h4 .eq,.jobp .sdet h4 .jlock{margin-left:auto;font-size:12px}
  .jrow .now{font-size:12px;color:#241a08;background:var(--gold);border-radius:4px;padding:0 5px;margin-left:4px}
  .jst{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:12px}.jst td{padding:0 6px 0 0;white-space:nowrap}.jst td:first-child{color:var(--muted)}
  .jsk{list-style:none;margin:0;padding:0;display:grid;gap:1px;font-size:12px}.jsk li{display:grid;grid-template-columns:40px 1fr;gap:6px}.jsk .l{color:var(--muted)}.jsk .have{color:#8fe06a}.jsk .nx{color:#ffe9b8}.jsk small{color:var(--muted)}
  .jeff{font-size:12px;color:#ffe9b8}.jlock{font-size:12px;color:#f08a6a}
  .jcols{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:start}
  .jtree li{grid-template-columns:34px 1fr auto;align-items:center;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.06)}.jtree li.own{background:rgba(143,224,106,.07)}
  .jtree .ns{display:flex;gap:6px;align-items:center;white-space:nowrap}.jtree .nc{color:var(--gold)}
  .nbuy{background:var(--gold);color:#241a08;border:0;border-radius:6px;padding:2px 10px;font-size:12px;font-family:var(--ui);cursor:pointer}
  .jplan{font-size:12px;background:rgba(243,193,90,.1);border:1px solid var(--gold-line);border-radius:8px;padding:4px 8px;line-height:1.5}.jplan em{font-style:normal}.jplan .up{color:#8fe06a}.jplan .dn{color:#f08a6a}.jplan small{color:var(--muted)}
  .skp .sdet{gap:4px}.skp .sec{font-size:13px;color:var(--gold);margin:6px 0 2px}.skp .srow small{display:block}
  @media (max-height:430px){.jobp{padding:6px 10px}.jobp h3{font-size:15px;margin:0}.jobp .tabs{margin:2px 0 4px}.jobp .tab{padding:2px 10px;font-size:12px}.jobp .slist,.jobp .sdet{max-height:calc(var(--app-h,100vh) - 120px)}.jrow{padding:2px 6px}.jobp .sdet h4 .buy{padding:3px 12px;font-size:13px}.jobp .sdet{gap:3px}.jobp .buy{padding:5px 14px;font-size:14px}}
  @media (max-width:520px){.jobp .shop-body{grid-template-columns:1fr}.jcols{grid-template-columns:1fr}}`;
  document.head.appendChild(css);

  // ---------- 画面 ----------
  const SN = { hp: 'HP', mp: 'MP', atk: 'こうげき', def: 'ぼうぎょ', spd: 'すばやさ' };
  const PN = { crit: '会心', regen: '毎ターン回復', mpSave: '消費MP', healUp: '回復量', aura: '味方全員 毎ターン回復', first: '先制' };
  const pct = v => `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}%`;
  const effTxt = j => [...Object.entries(j.mul).map(([k, v]) => `${SN[k]}${pct(v)}`), ...Object.entries(j.pas).map(([k, v]) => k === 'mpSave' ? `${PN[k]}${pct(-v)}` : `${PN[k]}${pct(v)}`)].join('　') || '補正なし（バランス型）';
  const mbTxt = j => Object.entries(j.mb).map(([k, v]) => `${SN[k] || PN[k]}${pct(v)}`).join('・');
  // 職業ツリーの 一覧（いまの 職業なら 覚える ボタンつき）
  function treeHtml(m, j, isCur, ownIds) { const r = rec(m.id), lvj = jlv(r, j.id);
    return j.tree.map(n => { const have = isCur && ownIds.includes(n.id), inn = n.skill && innateOf(m).includes(n.skill); const S = n.skill && DATA.skills[n.skill];
      const [ok, why] = isCur ? canBuy(m, n) : [false, lvj >= n.jl ? '転職で ひらく' : `職業Lv${n.jl}`];
      const lbl = `${n.cost}SP`; const st = have ? '<b class="have">✓ 習得</b>' : inn ? '<small>固有わざで 習得ずみ</small>' : ok ? `<button class="nbuy" data-node="${n.id}" data-lbl="${lbl}">${lbl}</button>` : `<small class="${lvj >= n.jl ? '' : 'jlock'}">${why}</small>`;
      return `<li class="${have ? 'own' : ''}"><span class="l">Lv${n.jl}</span><span><span class="${have ? 'have' : ok ? 'nx' : ''}">${n.skill ? '⚔' : '◆'} ${nodeName(n)}</span>${S ? `<small>　MP${S.mp}</small>` : ''}<small>　${nodeDesc(n)}</small></span><span class="ns">${st}${have || inn ? '' : `<small class="nc">${n.cost}SP</small>`}</span></li>`; }).join(''); }
  const nearStatue = () => { const s = K.REG[G().region] && K.REG[G().region].statue; return !!s && Math.hypot(K.player.x - s.x, K.player.z - s.z) < 9; };

  function jobUI(o = {}) { return new Promise(res => {
    const g = G(); const party = g.party.filter(m => HUMANS.includes(m.id)); if (!party.length) { res(-1); return; }
    let mi = Math.max(0, party.findIndex(m => m.id === o.member)), sel = -1, armed = false, line = '';
    const canChange = () => open() && (o.change || nearStatue());
    const el = document.createElement('div'); el.className = 'win panel shop jobp';
    const M = { el, panel: true, items: [], res }; const close = () => { K.closeMenu(M, -1); K.hud(); };
    const face = m => `<span class="fc">${Art.portrait(m.id, 'smile')}</span>`;
    const paint = () => { const m = party[mi], r = rec(m.id); if (sel < 0) sel = DATA.jobs.findIndex(j => j.id === r.cur); const j = DATA.jobs[sel], lvj = jlv(r, j.id), jp = r.jp[j.id] || 0;
      const ok = unlocked(r, j), isCur = r.cur === j.id;
      const bar = (jj) => { const l = jlv(r, jj.id), p = r.jp[jj.id] || 0; return l >= MAXLV ? 100 : Math.max(0, Math.min(100, (p - NEED[l]) / (NEED[l + 1] - NEED[l]) * 100)); };
      const after = isCur || !ok ? null : preview(m, j.id);
      const stRows = ['hp', 'mp', 'atk', 'def', 'spd'].map(k => { const a = m.st[k], b = after ? after.st[k] : a, d = b - a;
        return `<tr><td>${SN[k]}</td><td>${a}</td>${after ? `<td>→</td><td class="${d > 0 ? 'up' : d < 0 ? 'dn' : 'eq'}">${b}　${d > 0 ? '▲' + d : d < 0 ? '▼' + (-d) : '±0'}</td>` : '<td></td><td></td>'}</tr>`; }).join('');
      const ownIds = (r.tree[r.cur] || []);
      const skl = treeHtml(m, j, isCur, ownIds);
      const plan = !isCur && ok ? planChange(m, j.id) : null;
      const lockTxt = !ok ? `🔒 ほかの 職業を ${j.adv}つ マスター（Lv${MAXLV}）すると 就ける（いま ${mastered(r)}/${j.adv}）` : '';
      const poor = plan && (g.gold || 0) < plan.fee;
      const btn = isCur ? '<span class="eq">いまの 職業</span>' : !ok ? `<span class="jlock">🔒 ${j.adv}職 マスターで 解放（${mastered(r)}/${j.adv}）</span>`
        : !open() ? '<span class="jlock">第1章クリアで 転職 できる</span>'
        : !canChange() ? '<span class="eq">転職は 町の 石像の そばで</span>'
        : `<button class="buy" data-go="1" ${poor ? 'disabled' : ''}>${armed ? `本当に ${j.name}に 転職する？` : `${j.name}に 転職（${plan.fee}G）`}</button>`;
      const planHtml = plan ? `<div class="jplan"><b>転職すると</b>：SP <em class="up">+${plan.refund} もどる</em>（${JOB[r.cur].name}ツリー）　手数料 <em class="${poor ? 'dn' : ''}">${plan.fee}G</em>${plan.lost.length ? `<br>わすれる 技：${plan.lost.join('・')}` : ''}${plan.eq.length ? `<br>そうび：${plan.eq.join('／')}` : ''}<br><small>もとの 能力値・固有わざ・個性ボードは そのまま。 ${j.name}の ツリーは SPで 覚えなおす。</small></div>` : '';
      const eqCats = `<div class="st-eq" style="margin-top:0">そうび：${(K.bal ? K.bal.catNames(j.eqW) : j.eqW.join('・'))}／${(K.bal ? K.bal.catNames(j.eqA) : j.eqA.join('・'))}（＋キャラ固有）</div>`;
      el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button>
        <h3>しょくぎょう <small>${line || (canChange() ? '転職の 石像：職業を えらんで 転職できる（覚えた 技は のこる）' : '職業レベルは たたかいに 勝つと あがる')}</small></h3>
        <div class="tabs">${party.map((p, i) => `<button class="tab${i === mi ? ' on' : ''}" data-m="${i}">${face(p)}${K.esc(K.nameOf(p))}</button>`).join('')}</div>
        <div class="shop-body"><div class="slist">${DATA.jobs.map((jj, i) => { const l = jlv(r, jj.id), u = unlocked(r, jj), c = r.cur === jj.id;
          return `<button class="srow jrow${i === sel ? ' on' : ''}${u ? '' : ' dis'}" data-i="${i}"><span class="ji">${u ? jj.icon : '🔒'}</span><span>${jj.name}${c ? '<i class="now">いま</i>' : ''}<small>${u ? (l >= MAXLV ? '★マスター' : `JP ${r.jp[jj.id] || 0}/${NEED[l + 1]}`) : `${jj.adv}職 マスターで 解放`}</small><div class="xp"><i style="width:${bar(jj)}%"></i></div></span><span class="pr">Lv${l}</span></button>`; }).join('')}</div>
        <div class="sdet"><h4>${j.icon} ${j.name}　<small class="xpn">Lv${lvj}${lvj >= MAXLV ? '（マスター）' : `　つぎまで ${NEED[lvj + 1] - jp}JP`}</small>${btn}</h4>
          <div>${j.desc}</div>${!ok ? `<div class="jlock">${lockTxt}</div>` : ''}<div class="jeff">職業の 効果：${effTxt(j)}</div><div class="st-eq" style="margin-top:0">マスター特典（ずっと）：${mbTxt(j)}${lvj >= MAXLV ? ' ✓' : ''}</div>${eqCats}${planHtml}
          <div class="jcols"><div><div class="cmp-row">${face(m)}<span>${K.esc(K.nameOf(m))}　Lv${m.lv}<br><small class="xpn">いま：${JOB[r.cur].name} Lv${jlv(r, r.cur)}　SP ${g.sp[m.id] || 0}</small></span><span></span></div><table class="jst">${stRows}</table></div>
          <div><div class="st-eq" style="margin:0 0 2px">${isCur ? `職業ツリー（SPで 覚える・のこり <b>${g.sp[m.id] || 0}</b>SP）` : '職業ツリー（転職すると SPで 覚えられる）'}</div><ul class="jsk jtree">${skl}</ul></div></div>
          </div></div>`;
      el.querySelector('.m-x').onclick = () => { Music.sfx('cancel'); close(); };
      el.querySelectorAll('[data-node]').forEach(b => b.onclick = () => { const n = j.tree.find(x => x.id === b.dataset.node); if (!n) return;
        if (b.dataset.arm !== '1') { el.querySelectorAll('[data-node]').forEach(x => { x.dataset.arm = ''; x.textContent = x.dataset.lbl; }); b.dataset.arm = '1'; b.textContent = `${n.cost}SPで 覚える？`; Music.sfx('cursor'); return; }
        if (buyNode(m, n)) { Music.sfx('friend'); line = `${K.esc(K.nameOf(m))}は ${nodeName(n)}を 覚えた！`; K.save(); } paint(); K.hud(); });
      el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mi = +b.dataset.m; sel = -1; armed = false; line = ''; Music.sfx('cursor'); paint(); });
      el.querySelectorAll('.jrow').forEach(b => b.onclick = () => { const i = +b.dataset.i; if (i === sel && !armed) { const go = el.querySelector('[data-go]'); if (go) { go.click(); return; } } sel = i; armed = false; Music.sfx('cursor'); paint(); });
      const go = el.querySelector('[data-go]'); if (go) go.onclick = () => { if (!armed) { armed = true; Music.sfx('cursor'); paint(); return; } armed = false;
        const rs = changeJob(m, j.id); if (rs) { Music.sfx('friend'); line = `${K.esc(K.nameOf(m))}は ${j.name}に 転職した！${rs.refund ? `（SP +${rs.refund} もどった）` : ''}${rs.msgs && rs.msgs.length ? '　' + rs.msgs.join('／') : ''}`; K.toast(`${K.esc(K.nameOf(m))}は ${j.name}に なった！${rs.refund ? `<br><span style="font-size:.6em">SP +${rs.refund} もどった</span>` : ''}`, 1600); K.save(); } paint(); K.hud(); };
      const on = el.querySelector('.jrow.on'); on && on.scrollIntoView && on.scrollIntoView({ block: 'nearest' }); };
    M.key = e => { if (e.repeat) return; const k = e.code, n = DATA.jobs.length;
      if (['Escape', 'Backspace', 'KeyX'].includes(k)) { e.preventDefault(); if (armed) { armed = false; paint(); return; } Music.sfx('cancel'); close(); return; }
      if (k === 'ArrowDown' || k === 'KeyS') { e.preventDefault(); sel = (sel + 1) % n; armed = false; Music.sfx('cursor'); paint(); }
      else if (k === 'ArrowUp' || k === 'KeyW') { e.preventDefault(); sel = (sel + n - 1) % n; armed = false; Music.sfx('cursor'); paint(); }
      else if (k === 'ArrowRight' || k === 'KeyD' || k === 'Tab') { e.preventDefault(); mi = (mi + 1) % party.length; sel = -1; armed = false; line = ''; Music.sfx('cursor'); paint(); }
      else if (k === 'ArrowLeft' || k === 'KeyA') { e.preventDefault(); mi = (mi + party.length - 1) % party.length; sel = -1; armed = false; line = ''; Music.sfx('cursor'); paint(); }
      else if (['Enter', 'Space', 'KeyE', 'NumpadEnter'].includes(k)) { e.preventDefault(); const b = el.querySelector('[data-go]'); if (b) b.click(); } };
    paint(); K.$('ui').appendChild(el); K.MENUS.push(M); }); }
  K.jobUI = jobUI; K.changeJob = changeJob; K.jobOf = id => rec(id);
  K.jobTree = { canBuy, buyNode, planChange, treeCost, feeOf, ownNodes: id => ownNodes(rec(id)) };

  // ---------- スキル画面（固有わざ・個性ボード・職業ツリー を ひとつに） ----------
  function skillUI(o = {}) { return new Promise(res => {
    const g = G(); const party = g.party.filter(m => HUMANS.includes(m.id)); if (!party.length) { res(-1); return; }
    let mi = Math.max(0, party.findIndex(m => m.id === o.member)), line = '';
    const el = document.createElement('div'); el.className = 'win panel shop jobp skp';
    const M = { el, panel: true, items: [], res }; const close = () => { K.closeMenu(M, -1); K.hud(); };
    const face = m => `<span class="fc">${Art.portrait(m.id, 'smile')}</span>`;
    const paint = () => { const m = party[mi], r = rec(m.id), sp = g.sp[m.id] || 0, j = JOB[r.cur];
      const inn = (DATA.innate[m.id] || DATA.party[m.id].skills || []).map(([s, l]) => { const S = DATA.skills[s], have = m.lv >= l;
        return `<li class="${have ? 'own' : ''}"><span class="l">Lv${l}</span><span><span class="${have ? 'have' : ''}">${have ? '✓ ' : ''}${S.name}</span><small>　MP${S.mp}　${S.desc}</small></span><span class="ns">${have ? '' : '<small>🔒</small>'}</span></li>`; }).join('');
      const B = DATA.boards[m.id] || [], own = g.board[m.id] = g.board[m.id] || [];
      const brd = B.map(n => { const have = own.includes(n.id), lock = n.req && !own.includes(n.req), ok = !have && !lock && sp >= n.cost;
        return `<li class="${have ? 'own' : ''}"><span class="l">${n.cost}SP</span><span><span class="${have ? 'have' : ok ? 'nx' : ''}">◆ ${n.name}</span><small>　${n.desc}</small></span><span class="ns">${have ? '<b class="have">✓</b>' : lock ? `<small>🔒「${B.find(x => x.id === n.req).name}」の あと</small>` : ok ? `<button class="nbuy" data-bd="${n.id}" data-lbl="${n.cost}SP">${n.cost}SP</button>` : '<small class="jlock">SP不足</small>'}</span></li>`; }).join('');
      const tr = open() ? treeHtml(m, j, true, r.tree[r.cur] || []) : '<li><span></span><span class="st-eq">第1章クリアで 職業ツリーが ひらく</span></li>';
      el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button>
        <h3>スキル <small>${line || 'SPは レベル・職業レベルで ふえる。 個性ボードは ずっと のこり、職業ツリーは 転職で 返金される'}</small></h3>
        <div class="tabs">${party.map((p, i) => `<button class="tab${i === mi ? ' on' : ''}" data-m="${i}">${face(p)}${K.esc(K.nameOf(p))}${(g.sp[p.id] || 0) ? ` <b style="color:var(--gold)">${g.sp[p.id]}</b>` : ''}</button>`).join('')}</div>
        <div class="shop-body"><div class="slist"><div class="sec">固有わざ（レベルで 覚える）</div><ul class="jsk jtree">${inn}</ul></div>
        <div class="sdet"><h4>${face(m)} ${K.esc(K.nameOf(m))}　<small class="xpn">Lv${m.lv}　のこり <b>${sp}</b>SP</small></h4>
          <div class="sec">個性ボード（${own.length}/${B.length}・返金なし）</div><ul class="jsk jtree">${brd}</ul>
          <div class="sec">職業ツリー：${j.icon} ${j.name} Lv${jlv(r, r.cur)}（転職で 全額 返金）</div><ul class="jsk jtree">${tr}</ul></div></div>`;
      el.querySelector('.m-x').onclick = () => { Music.sfx('cancel'); close(); };
      el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mi = +b.dataset.m; line = ''; Music.sfx('cursor'); paint(); });
      const arm = b => { if (b.dataset.arm === '1') return true; el.querySelectorAll('.nbuy').forEach(x => { x.dataset.arm = ''; x.textContent = x.dataset.lbl; }); b.dataset.arm = '1'; b.textContent = '覚える？'; Music.sfx('cursor'); return false; };
      el.querySelectorAll('[data-bd]').forEach(b => b.onclick = () => { if (!arm(b)) return; const n = B.find(x => x.id === b.dataset.bd); if (!n || own.includes(n.id) || (g.sp[m.id] || 0) < n.cost) return;
        g.sp[m.id] -= n.cost; own.push(n.id); const hr = m.hp / m.st.hp; K.calc(m); m.hp = Math.max(1, Math.round(m.st.hp * hr)); m.mp = Math.min(m.mp, m.st.mp); Music.sfx('friend'); line = `${K.esc(K.nameOf(m))}は ${n.name}を 覚えた！`; K.save(); paint(); K.hud(); });
      el.querySelectorAll('[data-node]').forEach(b => b.onclick = () => { if (!arm(b)) return; const n = j.tree.find(x => x.id === b.dataset.node); if (n && buyNode(m, n)) { Music.sfx('friend'); line = `${K.esc(K.nameOf(m))}は ${nodeName(n)}を 覚えた！`; K.save(); } paint(); K.hud(); }); };
    M.key = e => { if (e.repeat) return; const k = e.code;
      if (['Escape', 'Backspace', 'KeyX'].includes(k)) { e.preventDefault(); Music.sfx('cancel'); close(); return; }
      if (k === 'ArrowRight' || k === 'KeyD' || k === 'Tab') { e.preventDefault(); mi = (mi + 1) % party.length; line = ''; Music.sfx('cursor'); paint(); }
      else if (k === 'ArrowLeft' || k === 'KeyA') { e.preventDefault(); mi = (mi + party.length - 1) % party.length; line = ''; Music.sfx('cursor'); paint(); } };
    paint(); K.$('ui').appendChild(el); K.MENUS.push(M); }); }
  K.skillUI = skillUI; H.skillUI = skillUI;

  // ---------- メニュー ----------
  H.menu.push(() => { const s = G().party.find(m => m.id === 'sora'); const r = s ? rec('sora') : null;
    return { label: 'しょくぎょう', sub: !open() ? '第1章クリアで 解放' : r ? `${JOB[r.cur].name} Lv${jlv(r, r.cur)}` : '',
      fn: async () => { if (!open()) { await K.panel('<h3>しょくぎょう</h3><p>第1章を クリアすると、町の 石像で「転職」が できるように なる。</p><p class="st-eq">職業ごとに 能力が かわり、職業レベルを あげると 技を 覚える。 覚えた 技は 転職しても わすれない。</p>'); return; }
        await jobUI({}); } }; });

  // ---------- 転職の 石像（町の 石像の そば） ----------
  const spotOf = r => { const R0 = K.REG[r]; if (!R0 || !R0.statue) return null; const s = R0.statue, t = R0.town || { x: 0, z: 0 };
    let dx = t.x - s.x, dz = t.z - s.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d; return { x: s.x + dx * 2.4 - dz * .8, z: s.z + dz * 2.4 + dx * .8, r }; };
  const SPOT = [0, 1, 2, 3].map(spotOf);
  H.target.push(cand => { const s = SPOT[G().region]; if (s) cand(s, 'jobstatue', s.x, s.z, 1.9); });
  H.labels.jobstatue = () => '転職の 石像';
  H.acts.jobstatue = async () => {
    if (!open()) { await K.say(['石像の 台座に、古い 文字が きざまれている。', '「灯の 道を ひとつ 越えし 者、ここで あらたな 道を えらべ」', '（第1章を クリアすると 転職 できるように なる）']); return; }
    const g = G(); if (!g.tips.jobIntro) { g.tips.jobIntro = 1;
      await K.say(['石像の 台座が、あたたかく 光っている……。', '【転職】 仲間の 職業を かえられる。 職業ごとに 能力と 覚える 技が ちがう。',
        '職業レベルは たたかいに 勝つと もらえる JPで あがる（ボスは たくさん）。', '覚えた 技は 転職しても のこる。 二つの 職業を マスターすると……？']); }
    await jobUI({ change: true }); K.save(); };
  H.fx.push((fx) => { if (!open()) return; const s = SPOT[G().region]; if (!s || Math.hypot(K.player.x - s.x, K.player.z - s.z) > 60) return;
    const y = K.surfaceAt(s.x, s.z, 99); fx.push({ type: 1, p: [s.x, y + .4, s.z], size: [1.6, 1.6], grow: 1.2, tint: [1, .85, .5] }); });
  H.quest.push(() => { if (!open()) return ''; const s = G().party.find(m => m.id === 'sora'); if (!s) return ''; const r = rec('sora'); return `<li>職業：${K.esc(K.nameOf(s))}は ${JOB[r.cur].name} Lv${jlv(r, r.cur)}（マスター ${mastered(r)}）</li>`; });
})();
