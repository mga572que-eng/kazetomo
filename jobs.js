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
  const JOB = Object.fromEntries(DATA.jobs.map(j => [j.id, j]));
  const LOOT = [['mi', 30], ['shizuku', 18], ['pan', 12], ['kinoko', 12], ['dokukeshi', 8], ['nakayoshi', 4], ['hoshikake', 2]];

  // ---------- 状態 ----------
  const G = () => K.G;
  const lvFromJp = jp => { let l = 1; while (l < MAXLV && jp >= NEED[l + 1]) l++; return l; };
  function rec(id, lv0) { const g = G(); if (!g.job || typeof g.job !== 'object') g.job = {};
    let r = g.job[id]; if (!r || typeof r !== 'object') { const m = (g.party || []).find(x => x.id === id); const jp0 = Math.min(NEED[MAXLV], Math.floor((lv0 || (m && m.lv) || 1) * 1.5));
      r = g.job[id] = { cur: 'minarai', lv: { minarai: lvFromJp(jp0) }, jp: { minarai: jp0 } }; }
    if (!r.lv) r.lv = {}; if (!r.jp) r.jp = {}; if (!JOB[r.cur]) r.cur = 'minarai'; return r; }
  const jlv = (r, j) => r.lv[j] || 1;
  const mastered = r => DATA.jobs.filter(j => !j.adv && jlv(r, j.id) >= MAXLV).length;
  const unlocked = (r, j) => !j.adv || mastered(r) >= j.adv;
  const learnedOf = r => { const out = []; for (const j of DATA.jobs) for (const [l, s] of j.sk) if (jlv(r, j.id) >= l && DATA.skills[s] && !out.includes(s)) out.push(s); return out; };
  const open = () => !!G().flags.cleared;

  // ---------- 能力計算（スキルボードの あとに 加算） ----------
  H.calc.push((m, st, mul, pas, extra) => { if (!HUMANS.includes(m.id)) return; const r = rec(m.id, m.lv), j = JOB[r.cur];
    for (const [k, v] of Object.entries(j.mul)) mul[k] = (mul[k] || 0) + v;
    for (const [k, v] of Object.entries(j.pas)) pas[k] = (pas[k] || 0) + v;
    for (const jj of DATA.jobs) if (jlv(r, jj.id) >= MAXLV) for (const [k, v] of Object.entries(jj.mb)) { if (k in mul) mul[k] += v; else pas[k] = (pas[k] || 0) + v; }
    const base = (DATA.party[m.id].skills || []).filter(([, l]) => l <= m.lv).map(([s]) => s);
    for (const s of learnedOf(r)) if (!extra.includes(s) && !base.includes(s)) extra.push(s); });

  // ---------- セーブ移行 ----------
  const fixAll = g => { if (!g.job || typeof g.job !== 'object') g.job = {};
    for (const m of g.party || []) { if (!HUMANS.includes(m.id)) continue; const r = rec(m.id);
      for (const k of Object.keys(r.jp)) { if (!JOB[k]) { delete r.jp[k]; delete r.lv[k]; continue; } r.jp[k] = Math.max(0, Math.min(NEED[MAXLV], +r.jp[k] || 0)); r.lv[k] = lvFromJp(r.jp[k]); }
      if (!unlocked(r, JOB[r.cur])) r.cur = 'minarai';
      if (m.st) { const hr = m.st.hp ? m.hp / m.st.hp : 1, mr = m.st.mp ? m.mp / m.st.mp : 1; K.calc(m); m.hp = Math.max(m.hp > 0 ? 1 : 0, Math.min(m.st.hp, Math.round(m.st.hp * hr))); m.mp = Math.min(m.st.mp, Math.round(m.st.mp * mr)); } } };
  H.load.push(fixAll);
  H.init.push(g => { g.job = {}; });

  // ---------- 転職 ----------
  function changeJob(m, id) { const r = rec(m.id); if (r.cur === id || !JOB[id] || !unlocked(r, JOB[id])) return false;
    const hr = m.st.hp ? m.hp / m.st.hp : 1, mr = m.st.mp ? m.mp / m.st.mp : 1;
    r.cur = id; if (r.jp[id] == null) { r.jp[id] = 0; r.lv[id] = 1; }
    K.calc(m); m.hp = Math.max(1, Math.min(m.st.hp, Math.round(m.st.hp * hr))); m.mp = Math.min(m.st.mp, Math.round(m.st.mp * mr)); return true; }
  const preview = (m, id) => { const r = rec(m.id), was = r.cur; r.cur = id; const c = { ...m }; K.calc(c); r.cur = was; return c; };

  // ---------- JP：たたかいの あと ----------
  H.battleEnd.push(async (result, specs, opts, P) => { if (result !== 'win' || !open()) return;
    const boss = !!(opts && opts.boss) || (specs || []).some(s => s && s.boss);
    const gain = 1 + Math.min(3, (specs || []).length) + (boss ? 10 : 0);
    const lines = []; let up = false, loot = false;
    for (const m of P || []) { if (m.kind !== 'human' || !HUMANS.includes(m.id)) continue; const r = rec(m.id), id = r.cur, j = JOB[id];
      const l0 = jlv(r, id); r.jp[id] = Math.min(NEED[MAXLV], (r.jp[id] || 0) + gain); const l1 = lvFromJp(r.jp[id]); r.lv[id] = l1;
      if (l1 > l0) { up = true; const was = m.skills.slice(), hr = m.hp / m.st.hp, mr = m.st.mp ? m.mp / m.st.mp : 1; K.calc(m); m.hp = Math.max(1, Math.round(m.st.hp * hr)); m.mp = Math.round(m.st.mp * mr);
        const neu = m.skills.filter(s => !was.includes(s)).map(s => DATA.skills[s].name);
        lines.push(`${K.esc(K.nameOf(m))}：${j.name} Lv${l1}${l1 >= MAXLV ? '（マスター！）' : ''}${neu.length ? `　<b>新しい技：${neu.join('・')}</b>` : ''}`);
        if (l1 >= MAXLV && JOB.yuutou && mastered(r) === JOB.yuutou.adv && jlv(r, 'yuutou') < 2) lines.push(`${K.esc(K.nameOf(m))}は「勇灯」に 転職 できるように なった！`); }
      if (j.loot && !loot && R() < j.loot) { loot = true; let t = R() * LOOT.reduce((a, x) => a + x[1], 0); let it = 'mi'; for (const [k, w] of LOOT) if ((t -= w) < 0) { it = k; break; }
        if (DATA.items[it]) { K.gain(it); lines.push(`${K.esc(K.nameOf(m))}は ${DATA.items[it].name}を 見つけた！（盗賊）`); } } }
    if (up) { try { Music.sfx('friend'); } catch (e) {} }
    if (lines.length) K.tip(`<b>${up ? '職業レベルが あがった！' : 'たたかいの 戦利品'}</b><span>${lines.join('<br>')}</span>`);
    if (up) K.tip('<b>職業（ジョブ）</b><span>メニューの「しょくぎょう」で 職業レベルと 技を 見られる。 転職は 町の 石像の そばで。 覚えた 技は 転職しても のこる。</span>', 'jobHelp'); });

  // ---------- 見た目（スタイル） ----------
  const css = document.createElement('style');
  css.textContent = `.jobp{width:min(900px,calc(var(--app-w,100vw) - 24px));padding:10px 14px;background:rgba(12,18,40,.985)}
  .jobp h3{margin:0 0 4px;font-size:17px}.jobp h3 small{font-size:12px;color:var(--muted)}
  .jobp .tabs .tab .fc{display:inline-block;width:18px;height:18px;border-radius:50%;overflow:hidden;vertical-align:-4px;margin-right:4px;background:#1c2744}.jobp .tabs .tab .fc svg{width:100%;height:100%;transform:scale(1.3) translateY(6%)}
  .jobp .shop-body{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}
  .jobp .slist,.jobp .sdet{max-height:calc(var(--app-h,100vh) - 128px)}
  .jrow{grid-template-columns:22px 1fr auto;padding:3px 8px;line-height:1.35}.jrow .ji{font-size:15px;text-align:center;color:var(--gold)}.jrow .xp{margin:1px 0 0;height:4px}.jrow small{display:inline;margin-left:6px}
  .jobp .sdet h4{flex-wrap:wrap}.jobp .sdet h4 .buy{margin-left:auto;padding:4px 14px;font-size:14px}.jobp .sdet h4 .eq,.jobp .sdet h4 .jlock{margin-left:auto;font-size:12px}
  .jrow .now{font-size:11px;color:#241a08;background:var(--gold);border-radius:4px;padding:0 5px;margin-left:4px}
  .jst{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:12px}.jst td{padding:0 6px 0 0;white-space:nowrap}.jst td:first-child{color:var(--muted)}
  .jsk{list-style:none;margin:0;padding:0;display:grid;gap:1px;font-size:12px}.jsk li{display:grid;grid-template-columns:40px 1fr;gap:6px}.jsk .l{color:var(--muted)}.jsk .have{color:#8fe06a}.jsk .nx{color:#ffe9b8}.jsk small{color:var(--muted)}
  .jeff{font-size:12px;color:#ffe9b8}.jlock{font-size:12px;color:#f08a6a}
  .jcols{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:start}
  @media (max-height:430px){.jobp{padding:6px 10px}.jobp h3{font-size:15px;margin:0}.jobp .tabs{margin:2px 0 4px}.jobp .tab{padding:2px 8px;font-size:12px}.jobp .slist,.jobp .sdet{max-height:calc(var(--app-h,100vh) - 96px)}.jrow{padding:2px 6px}.jobp .sdet h4 .buy{padding:3px 12px;font-size:13px}.jobp .sdet{gap:3px}.jobp .buy{padding:5px 14px;font-size:14px}}
  @media (max-width:520px){.jobp .shop-body{grid-template-columns:1fr}.jcols{grid-template-columns:1fr}}`;
  document.head.appendChild(css);

  // ---------- 画面 ----------
  const SN = { hp: 'HP', mp: 'MP', atk: 'こうげき', def: 'ぼうぎょ', spd: 'すばやさ' };
  const PN = { crit: '会心', regen: '毎ターン回復', mpSave: '消費MP', healUp: '回復量', aura: '味方全員 毎ターン回復', first: '先制' };
  const pct = v => `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}%`;
  const effTxt = j => [...Object.entries(j.mul).map(([k, v]) => `${SN[k]}${pct(v)}`), ...Object.entries(j.pas).map(([k, v]) => k === 'mpSave' ? `${PN[k]}${pct(-v)}` : `${PN[k]}${pct(v)}`)].join('　') || '補正なし（バランス型）';
  const mbTxt = j => Object.entries(j.mb).map(([k, v]) => `${SN[k] || PN[k]}${pct(v)}`).join('・');
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
      const own = learnedOf(r);
      const skl = j.sk.map(([l, s]) => { const S = DATA.skills[s], have = lvj >= l, nx = !have && j.sk.find(([ll]) => lvj < ll)[0] === l;
        return `<li><span class="l">Lv${l}</span><span class="${have ? 'have' : nx ? 'nx' : 'eq'}">${have ? '✓ ' : nx ? '▶ ' : ''}${S.name}<small>　MP${S.mp}　${S.desc || ''}</small></span></li>`; }).join('');
      const others = own.filter(s => !j.sk.some(([, x]) => x === s)).map(s => DATA.skills[s].name);
      const lockTxt = !ok ? `🔒 ほかの 職業を ${j.adv}つ マスター（Lv${MAXLV}）すると 就ける（いま ${mastered(r)}/${j.adv}）` : '';
      const btn = isCur ? '<span class="eq">いまの 職業</span>' : !ok ? `<span class="jlock">🔒 ${j.adv}職 マスターで 解放（${mastered(r)}/${j.adv}）</span>`
        : !open() ? '<span class="jlock">第1章クリアで 転職 できる</span>'
        : !canChange() ? '<span class="eq">転職は 町の 石像の そばで</span>'
        : `<button class="buy" data-go="1">${armed ? `本当に ${j.name}に 転職する？` : `${j.name}に 転職する`}</button>`;
      el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button>
        <h3>しょくぎょう <small>${line || (canChange() ? '転職の 石像：職業を えらんで 転職できる（覚えた 技は のこる）' : '職業レベルは たたかいに 勝つと あがる')}</small></h3>
        <div class="tabs">${party.map((p, i) => `<button class="tab${i === mi ? ' on' : ''}" data-m="${i}">${face(p)}${K.esc(K.nameOf(p))}</button>`).join('')}</div>
        <div class="shop-body"><div class="slist">${DATA.jobs.map((jj, i) => { const l = jlv(r, jj.id), u = unlocked(r, jj), c = r.cur === jj.id;
          return `<button class="srow jrow${i === sel ? ' on' : ''}${u ? '' : ' dis'}" data-i="${i}"><span class="ji">${u ? jj.icon : '🔒'}</span><span>${jj.name}${c ? '<i class="now">いま</i>' : ''}<small>${u ? (l >= MAXLV ? '★マスター' : `JP ${r.jp[jj.id] || 0}/${NEED[l + 1]}`) : `${jj.adv}職 マスターで 解放`}</small><div class="xp"><i style="width:${bar(jj)}%"></i></div></span><span class="pr">Lv${l}</span></button>`; }).join('')}</div>
        <div class="sdet"><h4>${j.icon} ${j.name}　<small class="xpn">Lv${lvj}${lvj >= MAXLV ? '（マスター）' : `　つぎまで ${NEED[lvj + 1] - jp}JP`}</small>${btn}</h4>
          <div>${j.desc}</div>${!ok ? `<div class="jlock">${lockTxt}</div>` : ''}<div class="jeff">職業の 効果：${effTxt(j)}</div><div class="st-eq" style="margin-top:0">マスター特典（ずっと）：${mbTxt(j)}${lvj >= MAXLV ? ' ✓' : ''}</div>
          <div class="jcols"><div><div class="cmp-row">${face(m)}<span>${K.esc(K.nameOf(m))}　Lv${m.lv}<br><small class="xpn">いま：${JOB[r.cur].name} Lv${jlv(r, r.cur)}</small></span><span></span></div><table class="jst">${stRows}</table></div>
          <div><ul class="jsk">${skl}</ul>${others.length ? `<div class="st-eq" style="margin-top:4px">ほかの 職業で 覚えた 技：${others.join('・')}</div>` : ''}</div></div>
          </div></div>`;
      el.querySelector('.m-x').onclick = () => { Music.sfx('cancel'); close(); };
      el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mi = +b.dataset.m; sel = -1; armed = false; line = ''; Music.sfx('cursor'); paint(); });
      el.querySelectorAll('.jrow').forEach(b => b.onclick = () => { const i = +b.dataset.i; if (i === sel && !armed) { const go = el.querySelector('[data-go]'); if (go) { go.click(); return; } } sel = i; armed = false; Music.sfx('cursor'); paint(); });
      const go = el.querySelector('[data-go]'); if (go) go.onclick = () => { if (!armed) { armed = true; Music.sfx('cursor'); paint(); return; } armed = false;
        if (changeJob(m, j.id)) { Music.sfx('friend'); line = `${K.esc(K.nameOf(m))}は ${j.name}に 転職した！`; K.toast(`${K.esc(K.nameOf(m))}は ${j.name}に なった！`, 1500); K.save(); } paint(); K.hud(); };
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
