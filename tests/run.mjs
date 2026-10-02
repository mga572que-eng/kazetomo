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
test('モジュールと つなぎ目（古い版の アップロードで 消えていないか）', async ({ page }) => {
  const r = await page.evaluate(() => { const K = KZ; return { miss: ['casino', 'fun', 'secrets', 'mimic', 'lhDungeon', 'townLife', 'interior', 'weather'].filter(k => !K[k]), hook: ['chestFx', 'bossIntro'].filter(k => !K.HOOK[k]), boss: K.runBattle.toString().includes('bossIntro') }; });
  ok(!r.miss.length, '読みこまれていない モジュール：' + r.miss.join(',')); ok(!r.hook.length, 'ない つなぎ目：' + r.hook.join(',')); ok(r.boss, 'runBattle が ボスの 登場演出を 呼ばない');
  // 宝箱を 本当に あけて、演出（chestfx）が 呼ばれるか
  const c = await page.evaluate(async () => { const c = KZ.REG[0].chests.find(c => !KZ.G.chests[c.id]); await KZ.travel(0, c.x, c.z + 1); const f = KZ.HOOK.chestFx; window.__cfx = 0; KZ.HOOK.chestFx = async x => { window.__cfx++; }; return c.id; }); await idle(page);
  await page.evaluate(id => { const c = KZ.REG[0].chests.find(c => c.id === id), P = KZ.player; P.x = c.x; P.z = c.z + 1.2; P.y = c.y; __dbg.sim(3); }, c);
  await page.keyboard.press('KeyE'); await idle(page); ok(await page.evaluate(() => window.__cfx > 0), '宝箱を あけても 演出（chestfx）が 呼ばれない');
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

test('戦いの 評価：S・A・B', async ({ page }) => {
  await page.evaluate(() => { const K = KZ, G = K.G; G.auto = true; G.party.forEach(m => { m.lv = 60; K.calc(m); m.hp = m.st.hp; m.mp = m.st.mp; }); window.__r = null; window.__g = G.gold; K.runBattle([{ sp: 'watapoko', lv: 2 }]).then(r => window.__r = r); });
  for (let i = 0; i < 80 && !(await page.evaluate(() => window.__r)); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
  const r = await page.evaluate(() => ({ cls: document.getElementById('brk').className, txt: document.getElementById('brk').textContent })); ok(/S|A|B/.test(r.cls), '評価が 出ない：' + JSON.stringify(r)); await idle(page);
});
test('道場の 段位', async ({ page }) => {
  await page.evaluate(async () => { const c = KZ.newTowns.towns.brave.c; await KZ.travel(1, c.x + 2, c.z + 6); const K = KZ, G = K.G; G.auto = true; G.party.forEach(m => { m.lv = 60; K.calc(m); m.hp = m.st.hp; m.mp = m.st.mp; }); }); await idle(page); await page.evaluate(() => __dbg.sim(20));
  act(page, `() => KZ.funPlus.dojo()`); await idle(page, 900);
  ok(await page.evaluate(() => (KZ.G.stat || {}).dojoWin) === 1, '段位が 上がらない');
});

test('かくし宝箱：祠と 灯台', async ({ page }) => {
  await page.evaluate(async () => { const sh = DATA.shrines.find(s => s.id === 's0'); KZ.G.shrineDone = Object.assign(KZ.G.shrineDone || {}, { s0: 1 }); await KZ.travel(0, sh.gate.x, sh.gate.z + 1); }); await idle(page);
  await page.evaluate(() => { const s = KZ.secrets.shSpot(DATA.shrines.find(s => s.id === 's0')); const P = KZ.player; P.x = s.x; P.z = s.z; P.y = s.y; });
  const g0 = await page.evaluate(() => KZ.G.gold); act(page, `() => KZ.HOOK.acts.secShrine({ sh: DATA.shrines.find(s => s.id === 's0') })`); await idle(page);
  ok(await page.evaluate(() => !!KZ.G.secret['sh:s0']), '祠の かくし宝箱が 開かない'); ok(await page.evaluate(g0 => KZ.G.gold > g0, g0), 'お金が ふえない');
  await page.evaluate(async () => { const d = KZ.lhDuns.find(d => d.r === 0); const bc = KZ.REG[0].beacons[d.i]; bc.lit = true; KZ.G.lit[d.i] = 1; await KZ.travel(0, bc.x + 2.4, bc.z + 3.6); }); await idle(page);
  act(page, `() => KZ.HOOK.acts.lhdIn(KZ.lhDuns.find(d => d.r === 0))`); await idle(page);
  const d = await page.evaluate(() => !!KZ.lhDungeon.here()); ok(d, '灯台の なかに 入れない');
  await page.evaluate(() => { const d = KZ.lhDungeon.here(); KZ.secrets.breakWall(d); const c = KZ.secrets.lhChest(d); const P = KZ.player; P.x = c.x - 1; P.z = c.z; P.y = c.y; });
  await page.evaluate(() => __dbg.sim(10)); ok(await page.evaluate(() => !KZ.blocked(KZ.player.x, KZ.player.z, KZ.player.y)), 'かくし部屋に 立てない');
  ok(await page.evaluate(() => !!KZ.secrets.broken), 'かくし部屋で 灯台を わすれる'); act(page, `() => KZ.HOOK.acts.secLh({ d: KZ.secrets.broken })`); await idle(page); ok(await page.evaluate(() => Object.keys(KZ.G.secret).length === 2), '灯台の かくし宝箱が 開かない');
});

test('ひとくいばこ：びっくり戦闘と ごほうび', async ({ page }) => {
  await page.evaluate(async () => { const c = KZ.REG[0].chests[0]; await KZ.travel(0, c.x + 1, c.z + 1); }); await idle(page);
  const s = await page.evaluate(() => { const L = KZ.mimic.spotsOf(0); return L.length ? L[0] : null; }); ok(s, 'ひとくいばこが 置かれない');
  await page.evaluate(s => { const K = KZ; K.G.auto = true; K.G.party.forEach(m => { m.lv = 45; K.calc(m); m.hp = m.st.hp; m.mp = m.st.mp; }); const P = K.player; P.x = s.x; P.z = s.z + 1.2; P.y = s.y; window.__h0 = K.G.inv.hoshikake || 0; }, s);
  const d = await page.evaluate(() => { KZ.mimic.tune(); return DATA.enemies.hitokui; }); ok(d.lv === 45 && d.hp > 1000, 'ひとくいばこの 強さが 仲間に あわない');
  act(page, `s => KZ.HOOK.acts.mimic(s)`, s); await page.waitForTimeout(500);
  for (let i = 0; i < 160 && !(await page.evaluate(id => !!(KZ.G.mimic || {})[id], s.id)); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
  await idle(page);
  ok(await page.evaluate(id => !!KZ.G.mimic[id], s.id), 'ひとくいばこを たおしても 記録されない'); ok(await page.evaluate(() => (KZ.G.inv.hoshikake || 0) > window.__h0), '星のかけらが もらえない');
});

test('最初の灯台の 案内：野原の灯台（方角の 食いちがい なし）', async ({ page }) => {
  const r = await page.evaluate(() => { const K = KZ, G = K.G, b0 = K.REG[0].beacons[0]; const save = JSON.stringify({ order: G.order, req: G.req, t0: G.trial[0] });
    G.order = 0; G.req = G.req || {}; G.req.k0 = { s: 'a', step: 0 }; G.trial[0].shards = 0; G.trial[0].got = []; const a = K.HOOK.beaconObj();
    G.trial[0].shards = 3; const b = K.HOOK.beaconObj(); const o = JSON.parse(save); G.order = o.order; G.req = o.req; G.trial[0] = o.t0;
    return { a: a && a.t, b: b && b.t, bAt: !!(b && b.p === b0), name: DATA.trials[0].name, sw: b0.x > 0 && b0.z > 0 }; });
  ok(/野原の灯台/.test(r.a), '欠片の 案内に 野原の灯台が ない：' + r.a); ok(/野原の灯台の 扉/.test(r.b) && r.bAt, '扉の 案内が 野原の灯台を さしていない：' + r.b); ok(r.name === '野原の灯台', '灯台の 名前が ちがう');
});

let fail = 0;
for (const t of T) { if (only && !t.name.includes(only)) continue; const t0 = Date.now(); let s;
  try { s = await boot(); await t.fn(s); ok(!s.errors.length, 'ページの エラー：' + s.errors.slice(0, 2).join(' / ')); console.log(`PASS  ${t.name}（${((Date.now() - t0) / 1000).toFixed(0)}秒）`); }
  catch (e) { fail++; console.log(`FAIL  ${t.name}：${e.message}`); } finally { if (s) await s.browser.close(); } }
console.log(fail ? `\n${fail}件 失敗` : '\nすべて 成功'); process.exit(fail ? 1 : 0);
