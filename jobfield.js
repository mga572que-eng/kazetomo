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
  H.calc.push((m, st, mul, pas, extra) => { if (m.kind !== 'human') return; const r = G().job && G().job[m.id]; if (r && r.cur === 'touzoku' && !extra.includes('j_nusumu')) extra.push('j_nusumu'); });
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
