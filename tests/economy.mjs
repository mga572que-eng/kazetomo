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
    const arm = DATA.armor.filter(a => a.price && (a.r === r || (a.r == null && r === 0))).map(a => a.price);
    out.push({ r, name: ['風灯の島', '霧の大陸', '天空の浮島', '海の底'][r], chests: chests.length, chestSum, shrines: shr.length, shrineSum: shr.reduce((a, b) => a + b, 0), lh: lh.length, lhSum: lh.reduce((a, b) => a + b, 0), battle,
      gearMax: gear.length ? Math.max(...gear) : 0, gearSum: gear.reduce((a, b) => a + b, 0), armMax: arm.length ? Math.max(...arm) : 0 }); }
  return out; });
await browser.close();
const fmt = n => n.toLocaleString('ja-JP');
let md = `# お金の 流れの 試算\n\n作成：tests/economy.mjs（${new Date().toISOString().slice(0, 10)}）。**ゲームの データからの 試算**で、実際に 遊んだ 記録では ない。道具は 売値で 換算。\n\n`;
md += '| 地方 | 宝箱（数・合計） | 祠（数・合計） | 灯台の内部（数・合計） | 戦闘1回（めやす） | 武器 いちばん高い／その地方の武器ぜんぶ | 防具 いちばん高い |\n|---|---|---|---|---|---|---|\n';
for (const x of R) md += `| ${x.name} | ${x.chests}・${fmt(x.chestSum)}G | ${x.shrines}・${fmt(x.shrineSum)}G | ${x.lh}・${fmt(x.lhSum)}G | ${fmt(x.battle)}G | ${fmt(x.gearMax)}G／${fmt(x.gearSum)}G | ${fmt(x.armMax)}G |\n`;
md += `\n## 読み方\n- 「寄り道の 合計（宝箱＋祠＋灯台）」が その地方の 装備を 全員ぶん 買える 額を こえると、戦闘しなくても 装備が そろう（稼ぎすぎ）。\n- 戦闘1回の めやす × 1時間の 戦闘回数（おおよそ 40回）で、戦闘の 収入を 比べる。\n- カジノ（期待値 0.95〜0.97）・道場（3連勝で 300＋Lv×10）・朝市・調べものは この表の 外。実際の 遊びで 記録する。\n`;
for (const x of R) { const side = x.chestSum + x.shrineSum + x.lhSum; md += `- ${x.name}：寄り道の 合計 ${fmt(side)}G ／ 武器を 全員ぶん ${fmt(x.gearSum)}G → ${side > x.gearSum ? '**寄り道だけで そろう（多い）**' : 'ちょうど〜少なめ'}\n`; }
fs.writeFileSync(path.join(ROOT, 'docs/reports/economy.md'), md); console.log(md);
