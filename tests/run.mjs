// 回帰テスト（前に 動いた 機能が こわれて いないか）。使い方：npm run test（tests/README.md）
import { boot, idle, act } from './lib.mjs';
const T = [], only = process.argv[2];
const test = (name, fn) => T.push({ name, fn });
const ok = (c, m) => { if (!c) throw new Error(m); };

test('起動・メニュー・戦闘・セーブ', async ({ page }) => {
  const m = await page.evaluate(() => KZ.HOOK.menu.map(f => { try { const r = f(); return r && r.label; } catch (e) { return 'ERR:' + e.message; } }).filter(Boolean));
  ok(!m.some(x => /^ERR/.test(x)), 'メニューの 項目で エラー：' + m.filter(x => /^ERR/.test(x)).join(','));
  await page.evaluate(() => { KZ.G.auto = true; window.__r = null; KZ.runBattle([{ sp: 'watapoko', lv: 3 }]).then(r => window.__r = r); });
  for (let i = 0; i < 80 && !(await page.evaluate(() => window.__r)); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
  ok(await page.evaluate(() => window.__r) === 'win', '戦闘に 勝てない'); await idle(page);
  const k = await page.evaluate(() => { KZ.save(); const key = Object.keys(localStorage).find(k => /^kazetomo-rpg-3/.test(k)); return key && Object.keys(JSON.parse(localStorage.getItem(key)).G).length; }); ok(k > 30, 'セーブが 空');
});
test('町のくらし：昼と夜', async ({ page }) => {
  await page.evaluate(async () => { const t = KZ.REG[0].town; await KZ.travel(0, t.x + 2, t.z + 6); KZ.G.tod = 23 / 24; }); await idle(page); await page.evaluate(() => __dbg.sim(1500));
  const r = await page.evaluate(() => { const P = KZ.townLife.people.filter(q => q.town.key === 'kazami'); return { n: P.length, inside: P.filter(q => q.npc && q.npc.indoor).length }; });
  ok(r.n >= 10 && r.inside >= r.n * .6, `夜に 家へ 帰らない（${r.inside}/${r.n}）`);
});
test('家の中：入る・しらべる・外へ', async ({ page }) => {
  await page.evaluate(async () => { const t = KZ.REG[0].town; await KZ.travel(0, t.x + 2, t.z + 4); KZ.G.tod = .45; }); await idle(page);
  act(page, `() => KZ.HOOK.acts.inEnter(KZ.interior.houses(0)[0])`); await idle(page); ok(await page.evaluate(() => !!KZ.interior.cur), '家に 入れない');
  const before = await page.evaluate(() => Object.keys(KZ.G.searched || {}).length); act(page, `() => KZ.interior.search(KZ.interior.cur.props.find(q => q.kind && q.kind !== 'garden'))`); await idle(page);
  ok(await page.evaluate(() => Object.keys(KZ.G.searched || {}).length) === before + 1, 'しらべた 記録が ふえない');
  act(page, `() => KZ.interior.leave()`); await idle(page); ok(await page.evaluate(() => !KZ.interior.cur), '外へ 出られない');
});
test('カジノ：コイン・スロット', async ({ page }) => {
  await page.evaluate(() => { KZ.casino.C().coin = 50; }); act(page, `() => KZ.casino.slot()`); await page.waitForTimeout(500);
  await page.click('#b1'); for (let i = 0; i < 3; i++) { await page.waitForTimeout(450); await page.click('#stop').catch(() => {}); } await page.waitForTimeout(1500);
  const c = await page.evaluate(() => KZ.casino.C().coin); ok(c >= 49 || c === 49, 'コインが 減らない／へんな 値：' + c); await page.click('#quit'); await idle(page);
});
test('宝箱の 演出の 格', async ({ page }) => {
  const g = await page.evaluate(() => [KZ.fun.gradeOf({ gold: 100 })[0], KZ.fun.gradeOf({ give: { hoshikake: 1 } })[0], KZ.fun.gradeOf({ gear: ['sora', 4] })[0]]);
  ok(g.join() === 'common,rare,legend', '格の 判定：' + g.join());
});
test('ボス：登場・怒り・勝利', async ({ page }) => {
  await page.evaluate(() => { const K = KZ, G = K.G; G.auto = true; G.party.forEach(m => { m.lv = 45; K.calc(m); m.hp = m.st.hp; m.mp = m.st.mp; }); window.__r = null; K.runBattle([{ boss: 'tsutakage' }], { boss: true }).then(r => window.__r = r); });
  await page.waitForTimeout(4000); await page.evaluate(() => { const f = KZ.B.F[0]; f.hp = Math.round(f.max * .4); }); await page.waitForTimeout(800);
  ok(await page.evaluate(() => KZ.B.F[0].rage === 1), '怒りに ならない');
  for (let i = 0; i < 100 && !(await page.evaluate(() => window.__r)); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); } ok(await page.evaluate(() => window.__r) === 'win', 'ボスに 勝てない'); await idle(page);
});
test('祠：見出しと メダル', async ({ page }) => {
  await page.evaluate(async () => { const sh = DATA.shrines.find(s => s.id === 's0'); await KZ.travel(0, sh.gate.x, sh.gate.z + 1); }); await idle(page);
  act(page, `() => KZ.HOOK.acts.shgate(DATA.shrines.find(s => s.id === 's0'))`); await idle(page); await page.evaluate(() => { KZ.G.play += 50; KZ.shrineSt.s0 = { open: true }; });
  act(page, `() => KZ.HOOK.acts.shgoal(DATA.shrines.find(s => s.id === 's0'))`); await idle(page); ok(await page.evaluate(() => !!(KZ.G.records || {})['sh:s0']), 'メダルの 記録が ない');
});
test('雨：割合と 雨宿り', async ({ page }) => {
  const r = await page.evaluate(() => { let rain = 0; for (let s = 0; s < 500; s++) if (KZ.weather.kind(0, s) === 'rain') rain++; return { rain, sea: [...Array(100)].filter((_, s) => KZ.weather.kind(3, s) !== 'clear').length }; });
  ok(r.rain > 50 && r.rain < 160 && r.sea === 0, `雨の 割合：${JSON.stringify(r)}`);
});

let fail = 0;
for (const t of T) { if (only && !t.name.includes(only)) continue; const t0 = Date.now(); let s;
  try { s = await boot(); await t.fn(s); ok(!s.errors.length, 'ページの エラー：' + s.errors.slice(0, 2).join(' / ')); console.log(`PASS  ${t.name}（${((Date.now() - t0) / 1000).toFixed(0)}秒）`); }
  catch (e) { fail++; console.log(`FAIL  ${t.name}：${e.message}`); } finally { if (s) await s.browser.close(); } }
console.log(fail ? `\n${fail}件 失敗` : '\nすべて 成功'); process.exit(fail ? 1 : 0);
