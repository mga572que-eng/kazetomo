// お金の 流れの 試算 → docs/reports/economy.md（品質プラン 部署1）
// 使い方：node tests/economy.mjs
import { boot, ROOT } from './lib.mjs';
import fs from 'node:fs'; import path from 'node:path';
const { browser, page } = await boot();
const R = await page.evaluate(() => { const K = KZ, out = [];
  const val = (k, n) => (DATA.items[k] ? (DATA.items[k].sell || 0) : 0) * n;
  const lootV = L => (L.gold || 0) + Object.entries(L.give || {}).reduce((a, [k, v]) => a + val(k, v), 0);
  const LV = [[6, 16], [18, 28], [30, 38], [40, 47]];
  for (let r = 0; r < 4; r++) { const reg = K.REG[r] || {};
    const chests = (reg.chests || []).map(c => lootV(c.loot || {})), chestSum = chests.reduce((a, b) => a + b, 0);
    const shr = (DATA.shrines || []).filter(s => s.r === r).map(s => (s.reward.gold || 0) + Object.entries(s.reward.give || {}).reduce((a, [k, v]) => a + val(k, v), 0));
    const lh = (K.lhDuns || []).filter(d => d.r === r).map(d => lootV(d.reward || {}));
    const L = (LV[r][0] + LV[r][1]) / 2, battle = Math.round((4 + L * 2.3) * (r === 2 ? 1.8 : 1) * 2.2);
    const gear = Object.keys(DATA.gear).map(id => DATA.gear[id].filter(g => g.price && (r === 2 ? g.sky : r === 3 ? g.sea : !g.sky && !g.sea))).flat().map(g => g.price);
    const arm = DATA.armor.filter(a => a.price && (r === 2 ? a.sky : r === 3 ? a.sea : !a.sky && !a.sea && (a.r === r || (a.r == null && r === 0)))).map(a => a.price);
    const SL = K.secrets ? K.secrets.LOOT(r) : { gold: 0, give: {} }, sec = (shr.length + lh.length) * lootV(SL);
    const ML = K.mimic ? K.mimic.LOOT(r) : { gold: 0, n: 0 }, mn = K.mimic ? K.mimic.count(r) : 0, mim = mn * (ML.gold + val('hoshikake', ML.n));
    out.push({ r, sec, secN: shr.length + lh.length, mim, mn, name: ['風灯の島', '霧の大陸', '天空の浮島', '海の底'][r], chests: chests.length, chestSum, shrines: shr.length, shrineSum: shr.reduce((a, b) => a + b, 0), lh: lh.length, lhSum: lh.reduce((a, b) => a + b, 0), battle,
      gearMax: gear.length ? Math.max(...gear) : 0, gearSum: gear.reduce((a, b) => a + b, 0), armMax: arm.length ? Math.max(...arm) : 0 }); }
  return out; });
await browser.close();
const fmt = n => n.toLocaleString('ja-JP');
let md = `# お金の 流れの 試算\n\n作成：tests/economy.mjs（${new Date().toISOString().slice(0, 10)}）。**ゲームの データからの 試算**で、実際に 遊んだ 記録では ない。道具は 売値で 換算。\n\n`;
md += '| 地方 | 宝箱（数・合計） | 祠（数・合計） | 灯台の内部（数・合計） | かくし宝箱（数・合計） | ひとくいばこ（数・合計） | 戦闘1回（めやす） | 武器 いちばん高い／その地方の武器ぜんぶ | 防具 いちばん高い |\n|---|---|---|---|---|---|---|---|---|\n';
for (const x of R) md += `| ${x.name} | ${x.chests}・${fmt(x.chestSum)}G | ${x.shrines}・${fmt(x.shrineSum)}G | ${x.lh}・${fmt(x.lhSum)}G | ${x.secN}・${fmt(x.sec)}G | ${x.mn}・${fmt(x.mim)}G | ${fmt(x.battle)}G | ${fmt(x.gearMax)}G／${fmt(x.gearSum)}G | ${fmt(x.armMax)}G |\n`;
md += `\n## 読み方\n- 「寄り道の 合計（宝箱＋祠＋灯台＋かくし宝箱＋ひとくいばこ）」が その地方の 装備を 全員ぶん 買える 額を こえると、戦闘しなくても 装備が そろう（稼ぎすぎ）。めやすは 予算の 20〜75%（残りは 戦闘で かせぐ）。\n- 戦闘1回の めやす × 1時間の 戦闘回数（おおよそ 40回）で、戦闘の 収入を 比べる。\n- カジノ（期待値 0.95〜0.97）・道場（3連勝で 300＋Lv×10）・朝市・調べものは この表の 外。実際の 遊びで 記録する。\n`;
const GRP = [[[0, 1], '第1〜2章（島＋霧の大陸。武器の 店が 共通）'], [[2], '第3章（天空の浮島）'], [[3], '第4章（海の底）']];
md += `\n## 章ごとの 判定（装備の 予算＝その章の 武器を 全員ぶん＋いちばん高い 防具×4人）\n`;
for (const [rs, nm] of GRP) { const xs = R.filter(x => rs.includes(x.r)), side = xs.reduce((a, x) => a + x.chestSum + x.shrineSum + x.lhSum + x.sec + x.mim, 0), budget = xs[0].gearSum + Math.max(...xs.map(x => x.armMax)) * 4, k = side / budget;
  md += `- ${nm}：寄り道の 合計 ${fmt(side)}G ／ 予算 ${fmt(budget)}G（${Math.round(k * 100)}%）→ ${k > 1 ? '**寄り道だけで そろう（多い）**' : k > .75 ? '**多め**' : k >= .2 ? 'ちょうど（残りは 戦闘で かせぐ）' : '少なめ'}\n`; }
fs.writeFileSync(path.join(ROOT, 'docs/reports/economy.md'), md); console.log(md);
