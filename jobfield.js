// ともしびアイランド — 職業の 支援行動（部署6）と その 監視
// ・盗賊：戦闘の わざ「ぬすむ」（MP0）。敵1体に 弱い 攻撃＋ 道具を ぬすむ。 1体から 1回だけ・1回の 戦闘で 成功は 3回まで
// ・ボスからは 低い 確率で、ボスごとに 1回だけ「星のかけら」
// ・監視：G.jobLog に 試行・成功・入手を 記録（乱用や バランス崩れを あとで 確認できる）
'use strict';
(() => {
  const K = window.KZ; if (!K || !K.HOOK) return; const H = K.HOOK, G = () => K.G;
  const MAX_PER_BATTLE = 3;
  DATA.skills.j_nusumu = { name: 'ぬすむ', mp: 0, tg: 'enemy', power: .5, steal: true, verb: 'しかけた', fx: 'slash', desc: '敵1体に 弱い 攻撃＋ 道具を ぬすむ（1体から 1回・1回の 戦闘で 3回まで）' };
  // 地域ごとの ぬすめる 物（重み）。 ふつうに 買える 物が 中心、めずらしい 物は すこし
  const TABLE = [
    [['mi', 40], ['kinoko', 22], ['pan', 14], ['dokukeshi', 12], ['shizuku', 8], ['hoshikake', 2]],
    [['mi', 28], ['suna', 18], ['pan', 18], ['dokukeshi', 14], ['shizuku', 14], ['ganbari', 5], ['hoshikake', 3]],
    [['kumowata', 30], ['pan', 20], ['shizuku', 20], ['ganbari', 12], ['hane', 10], ['nakayoshi', 5], ['hoshikake', 3]],
    [['shinju', 18], ['pan', 22], ['shizuku', 24], ['ganbari', 14], ['dokukeshi', 12], ['nakayoshi', 6], ['hoshikake', 4]],
  ];
  const pick = L => { const T = L.filter(([k]) => DATA.items[k]); let t = Math.random() * T.reduce((a, x) => a + x[1], 0); for (const [k, w] of T) if ((t -= w) < 0) return k; return T[0][0]; };
  const log = () => { const g = G(); if (!g.jobLog || typeof g.jobLog !== 'object') g.jobLog = { steal: { try: 0, ok: 0, items: {} }, bossSteal: {} }; return g.jobLog; };
  let okThisBattle = 0;
  // 盗賊の あいだ「ぬすむ」を つかえる（職業ツリーとは 別。転職すると 消える）
  H.calc.push((m, st, mul, pas, extra) => { if (m.kind !== 'human') return; const r = G().job && G().job[m.id]; if (r && (r.cur === 'touzoku' || r.cur === 'shinobi') && !extra.includes('j_nusumu')) extra.push('j_nusumu'); });
  H.steal = async (a, t, bmsg, U) => { const L = log(); L.steal.try++;
    if (t.hp <= 0) { await bmsg('しかし あいては もう たおれていた。', 250); return; }
    if (t.stolen) { await bmsg(`${t.name}は もう なにも もっていない！`, 300); return; }
    if (okThisBattle >= MAX_PER_BATTLE) { await bmsg('これ以上は ぬすめそうに ない……。', 300); return; }
    const spd = (a.st && a.st.spd) || 10, tsp = t.spd || 10; let rate = Math.max(.25, Math.min(.85, .5 + (spd - tsp) / 120)); if (t.boss) rate *= .5;
    if (Math.random() >= rate) { await bmsg(`${t.name}から ぬすめなかった！`, 300); return; }
    let k; if (t.boss) { const b = t.bid || t.name; if (L.bossSteal[b]) { await bmsg(`${t.name}は もう なにも もっていない！`, 300); t.stolen = true; return; } L.bossSteal[b] = 1; k = 'hoshikake'; }
    else k = pick(TABLE[G().region] || TABLE[0]);
    t.stolen = true; okThisBattle++; L.steal.ok++; L.steal.items[k] = (L.steal.items[k] || 0) + 1; K.gain(k, 1); try { Music.sfx('pick'); } catch (e) {}
    await bmsg(`${K.nameOf(a)}は ${t.name}から ${DATA.items[k].name}を ぬすんだ！`, 400); };
  H.battleEnd.push(() => { okThisBattle = 0; });
  H.load.push(g => { if (g.jobLog && typeof g.jobLog !== 'object') g.jobLog = null; log(); });
  K.jobField = { log, TABLE, MAX_PER_BATTLE };
})();

// ---------- 職業の 支援（パーティの だれかが その 職業なら 効く） ----------
(() => {
  const K = window.KZ; if (!K || !K.HOOK) return; const H = K.HOOK, G = () => K.G;
  const PERK = {
    minarai: '地図に まだ 開けていない 宝箱が 出る', senshi: '岩を 少ない 回数で こわせる', mahou: '夜の 灯りが 広くなる', souryo: '歩くと 少しずつ HPが 回復',
    touzoku: '戦闘で「ぬすむ」・ときどき 戦利品', butouka: 'ともしびの 回復が はやい', ginyuu: '敵に 追いかけられにくい', yuutou: '歩くと 少し 回復・戦いの 稼ぎ +10%',
    shounin: '売値が 5割に・戦いの 稼ぎ +25%', kariudo: '採取で 1つ 多く 手に入る' };
  for (const j of DATA.jobs || []) { const pk = PERK[j.id] || PERK[j.up]; if (pk && !j.desc.includes('【仲間に いると】')) j.desc += `　【仲間に いると】${pk}`; }
  const jobPerk = id => { const g = G(); if (!g || !g.party || !g.job) return false; return g.party.some(m => { if (m.kind !== 'human' || !g.job[m.id]) return false; const c = g.job[m.id].cur, j = (DATA.jobs || []).find(x => x.id === c); return c === id || !!(j && j.up === id); }); }; // 上位職は もとの 職業の 支援も もつ
  K.jobPerk = jobPerk; K.jobPerkText = PERK;
  // 歩くと 回復（4m ごとに 僧侶 2%・勇灯 1%）・ともしび（武闘家）
  let walkAcc = 0, lastX = null, lastZ = null, wasBattle = false, g0 = 0;
  H.frame.push(dt => { const g = G(), P = K.player; if (!g || !P) return;
    // 戦いの 稼ぎ（開始時の 所持金を おぼえる）
    if (K.B && K.B.active && !wasBattle) { wasBattle = true; g0 = g.gold; g.goldSpentB = 0; } else if (!(K.B && K.B.active)) wasBattle = false;
    if (K.phase !== 'field' || K.busy || (K.B && K.B.active)) { lastX = null; return; }
    if (jobPerk('butouka') && g.stam < g.stamMax) g.stam = Math.min(g.stamMax, g.stam + dt * 8);
    const moved = lastX == null ? 0 : Math.hypot(P.x - lastX, P.z - lastZ); lastX = P.x; lastZ = P.z;
    const rate = jobPerk('souryo') ? .02 : jobPerk('yuutou') ? .01 : 0; if (!rate || moved > 3) return; // ワープ等の 大きな 移動は 数えない
    walkAcc += moved; if (walkAcc < 4) return; walkAcc = 0;
    for (const m of K.allMembers()) if (m.hp > 0 && m.st && m.hp < m.st.hp) m.hp = Math.min(m.st.hp, m.hp + Math.max(1, Math.round(m.st.hp * rate))); });
  H.battleEnd.push(result => { const g = G(); if (result !== 'win' || !g) return; const earned = g.gold - g0 + (g.goldSpentB || 0); g.goldSpentB = 0; if (earned <= 0) return;
    const r = jobPerk('shounin') ? .25 : jobPerk('yuutou') ? .1 : 0; if (!r) return; const b = Math.max(1, Math.round(earned * r)); g.gold += b;
    const L = K.jobField.log(); L.gold = (L.gold || 0) + b; K.toast(`${jobPerk('shounin') ? '商人' : '勇灯'}の おかげで ＋${b}G`, 1400); K.hud(); });
  // 採取 +1（狩人）：フィールドで 素材を 拾ったとき
  const GATHER = ['maki', 'ishi', 'ha', 'kinoko', 'mi', 'suna', 'kumowata'];
  let adding = false;
  H.gain.push((k, n) => { if (adding || !GATHER.includes(k) || K.phase !== 'field' || K.busy || K.MENUS.length || (K.B && K.B.active) || !jobPerk('kariudo')) return;
    adding = true; try { G().inv[k] = (G().inv[k] || 0) + 1; const L = K.jobField.log(); L.gather = (L.gather || 0) + 1; } finally { adding = false; } });
  // 地図に 宝箱（見習い）
  H.mapMarks.push((r, pos) => { if (!jobPerk('minarai')) return []; const R = K.REG[r]; if (!R || !R.chests) return [];
    return R.chests.filter(c => !G().chests[c.id]).map(c => `<span class="mk" style="${pos(c.x, c.z)}" title="宝箱">🎁</span>`); });
})();
