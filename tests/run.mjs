// 回帰テスト（前に 動いた 機能が こわれて いないか）。使い方：npm run test（tests/README.md）
import { boot, idle, act } from './lib.mjs';
const T = [], only = process.argv[2];
const test = (name, fn, opts) => T.push({ name, fn, opts });
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
  act(page, `() => KZ.HOOK.acts.inEnter(KZ.interior.houses(0)[0])`); await idle(page); ok(await page.evaluate(() => !!KZ.interior.cur), '家に 入れない'); ok(await page.evaluate(() => !!(KZ.HOOK.noClimb && KZ.HOOK.noClimb())), '家の 中で かべを 登れて しまう');
  const before = await page.evaluate(() => Object.keys(KZ.G.searched || {}).length); act(page, `() => KZ.interior.search(KZ.interior.cur.props.find(q => q.kind && q.kind !== 'garden'))`); await idle(page);
  ok(await page.evaluate(() => Object.keys(KZ.G.searched || {}).length) === before + 1, 'しらべた 記録が ふえない');
  act(page, `() => KZ.interior.leave()`); await idle(page); ok(await page.evaluate(() => !KZ.interior.cur), '外へ 出られない'); ok(await page.evaluate(() => !(KZ.HOOK.noClimb && KZ.HOOK.noClimb())), '外に 出ても 登れない まま');
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
  ok(/野原の灯の樹/.test(r.a), '欠片の 案内に 野原の灯の樹が ない：' + r.a); ok(/野原の灯の樹の 扉/.test(r.b) && r.bAt, '扉の 案内が 野原の灯の樹を さしていない：' + r.b); ok(r.name === '野原の灯の樹', '灯台の 名前が ちがう');
});

test('風見の村→野原の灯台の 道：歩ける・木が ない・道しるべ', async ({ page }) => {
  await page.evaluate(async () => { const p = KZ.road0.pts(); await KZ.travel(0, p[1][0] - 3, p[1][1] - 4); }); await idle(page);
  const r = await page.evaluate(() => { const S = KZ.road0.segs(); let bad = 0, step = 0, prev = null; for (const s of S) for (let i = 0; i <= 40; i++) { const t = i / 40, x = s[0] + (s[2] - s[0]) * t, z = s[1] + (s[3] - s[1]) * t, h = KZ.surfaceAt(x, z, 99); if (KZ.blocked(x, z, h + .1)) bad++; if (h - KZ.hAt(x, z) < .05) step = Math.max(step, 1 - World.nAt(x, z)[1]); prev = h; }
    const trees = [...KZ.REG[0].trees, ...KZ.REG[0].rocks].filter(t => t.state === 'ok' && KZ.road0.onRoad(t.x, t.z, 1)).length; return { n: S.length, bad, step, trees }; });
  ok(r.n === 3, '道の 本数が ちがう：' + r.n); ok(!r.bad, `道の 上で ぶつかる 場所が ${r.bad}か所`); ok(r.step < .38, '道が 急すぎて すべる（法線y ' + (1 - r.step).toFixed(2) + '。すべるのは 0.56 未満）'); ok(!r.trees, `道の 上に 木・岩が ${r.trees}本`);
  await page.evaluate(() => { const s = KZ.road0.signAt(), P = KZ.player; P.x = s.x - 1; P.z = s.z - 1; P.y = KZ.surfaceAt(P.x, P.z, 99); __dbg.sim(3); });
  ok(await page.evaluate(() => document.getElementById('btnActLabel').textContent) === '道しるべを 読む', '道しるべを 読めない');
  act(page, `() => KZ.HOOK.acts.road0Sign()`); await idle(page);
});

test('最初の町：家の 入口の 名前札', async ({ page }) => {
  await page.evaluate(async () => { KZ.G.tod = .45; await KZ.travel(0, 2, 2); }); await idle(page);
  const names = await page.evaluate(() => { const out = new Set(); for (const [x, z, tx, tz] of [[2, 2, 3, 15], [2, 2, 13, -9], [2, 2, -14, -6], [3, 4, 3, 15]]) { const P = KZ.player; P.x = x; P.z = z; P.y = KZ.surfaceAt(x, z, 99); KZ.cam.yaw = Math.atan2(x - tx, z - tz); __dbg.sim(4); document.querySelectorAll('.doorTag').forEach(e => { if (!e.hidden) out.add(e.textContent); }); } return [...out]; });
  ok(names.some(t => /かざみ亭/.test(t)) && names.some(t => /工房/.test(t)) && names.some(t => /ソラの 家/.test(t)), '名前札が 出ない：' + names.join(','));
  await page.evaluate(() => { window.__r = null; KZ.runBattle([{ sp: 'watapoko', lv: 1 }]).then(r => window.__r = r); }); await page.waitForTimeout(1500);
  ok(await page.evaluate(() => [...document.querySelectorAll('.doorTag')].every(e => e.hidden)), '戦闘中に 名前札が 出ている');
  await page.evaluate(() => { KZ.G.auto = true; }); for (let i = 0; i < 80 && !(await page.evaluate(() => window.__r)); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(200); } await idle(page);
}, { render: true }); // 画面への 投影が いるので 描画あり

test('シオミの 港への 道が 上限で 切れない', async ({ page }) => {
  await page.evaluate(async () => { window.__paths = null; const o = World.setPaths; World.setPaths = (r, l) => { if (r === 0) window.__paths = l; return o(r, l); }; const S = KZ.shiomi; await KZ.travel(0, S.x + 3, S.z + 3); }); await idle(page); await page.evaluate(() => __dbg.sim(3));
  const r = await page.evaluate(() => { const L = window.__paths || [], S = KZ.shiomi; return { n: L.length, harbor: L.slice(0, 8).some(s => Math.hypot(s[2] - S.x, s[3] - S.z) > 40), road: KZ.road0 ? L.slice(8).length : -1 }; });
  ok(r.harbor, 'シオミの 港への 道が 表示の 8本に 入っていない'); ok(r.n <= 12, '道が 上限12本を こえる：' + r.n); ok(r.road === 3, '風見の村の 道が 消えた');
});

test('道の 見晴らし：灯台を 向く・ごほうびは 1回だけ', async ({ page }) => {
  await page.evaluate(async () => { const v = KZ.road0.viewAt(); KZ.G.flags.road0View = 0; await KZ.travel(0, v.x - 1, v.z + 1); }); await idle(page);
  ok(await page.evaluate(() => { const v = KZ.road0.viewAt(), P = KZ.player; P.x = v.x - 1; P.z = v.z + 1; P.y = KZ.surfaceAt(P.x, P.z, 99); __dbg.sim(3); return document.getElementById('btnActLabel').textContent; }) === 'あたりを 見わたす', '見晴らしを しらべられない');
  const m0 = await page.evaluate(() => KZ.G.inv.mi || 0);
  act(page, `() => KZ.HOOK.acts.road0View()`); await idle(page);
  const r = await page.evaluate(m0 => { const b = KZ.REG[0].beacons[0], P = KZ.player, want = Math.atan2(b.x - P.x, b.z - P.z), d = Math.abs(((KZ.cam.yaw - want) % 6.283 + 9.42) % 6.283 - 3.14); return { got: (KZ.G.inv.mi || 0) - m0, flag: KZ.G.flags.road0View, d }; }, m0); // cam.yaw は 見る 方向（画面への 投影で 確認ずみ）
  ok(r.got === 2 && r.flag === 1, '1回めの ごほうびが ちがう：' + r.got); ok(r.d < .3, 'カメラが 灯台を 向いていない');
  const m1 = await page.evaluate(() => KZ.G.inv.mi || 0); act(page, `() => KZ.HOOK.acts.road0View()`); await idle(page);
  ok(await page.evaluate(m1 => (KZ.G.inv.mi || 0) === m1, m1), '2回めも ごほうびが でる');
});

test('最初の町：入口の 目じるし（食堂・工房・家）と 通り道', async ({ page }) => {
  await page.evaluate(async () => { await KZ.travel(0, 2, 2); }); await idle(page);
  const r = await page.evaluate(() => KZ.road0.fronts().map(f => { dx = Math.sin(f.yaw), dz = Math.cos(f.yaw), x = f.dx + dx * 1.2, z = f.dz + dz * 1.2; return [f.k, KZ.blocked(x, z, KZ.surfaceAt(x, z, 99) + .1)]; }));
  ok(r.length === 5 && ['cook', 'smith', 'home', 'inn', 'shop'].every(k => r.some(([kk]) => kk === k)), '目じるしが 5軒に ない：' + JSON.stringify(r)); ok(r.every(([, b]) => !b), '入口の 前が ふさがれている');
});

test('戦闘：2Dの 絵＋3Dの けしき（標準）・HPバーが 1体ずつ 分かれる', async ({ page }) => {
  await page.evaluate(async () => { await KZ.travel(0, 30, 40); }); await idle(page);
  await page.evaluate(() => { KZ.G.auto = false; window.__r = null; KZ.runBattle([{ sp: 'watapoko', lv: 3 }, { sp: 'iwanoko', lv: 3 }, { sp: 'mizumochi', lv: 3 }]).then(r => window.__r = r); });
  await page.waitForSelector('#bCmd .m-battle:not(.one) .m-item', { timeout: 90000 }); await page.waitForTimeout(3500);
  const r = await page.evaluate(() => { const b = document.getElementById('battle'), bars = [...document.querySelectorAll('.foe .bar')].map(e => e.getBoundingClientRect()).sort((a, c) => a.left - c.left);
    return { mix: KZ.HOOK.OPT.mix, bg: b.classList.contains('bg3d'), shown: !b.hidden, stage: !!KZ.B.stage, d3: !!KZ.B.d3, gaps: bars.slice(1).map((q, i) => q.left - bars[i].right) }; });
  ok(r.mix && r.bg && r.shown && !r.stage && !r.d3, '2D＋3Dの けしきに なっていない：' + JSON.stringify(r)); ok(r.gaps.length === 2 && r.gaps.every(g => g >= 8), 'HPバーが つながっている：' + r.gaps);
  await page.evaluate(() => { KZ.G.auto = true; }); for (let i = 0; i < 80 && !(await page.evaluate(() => window.__r)); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); } await idle(page);
  ok(await page.evaluate(() => !document.getElementById('battle').classList.contains('bg3d')), '戦闘の あとに 3Dの けしきの 設定が のこる');
}, { render: true });

test('灯の樹：島の 5本が 樹に なる・幹は 通りぬけない・灯は 花の 位置', async ({ page }) => {
  await page.evaluate(async () => { const b = KZ.REG[0].beacons[0]; await KZ.travel(0, b.x - 12, b.z - 12); }); await idle(page); await page.evaluate(() => __dbg.sim(3));
  const r = await page.evaluate(() => { const B = KZ.REG[0].beacons, b = B[0]; return { trees: B.map(x => KZ.tomoTree.isTree(x) && KZ.HOOK.beaconScale(x) === 0), wall: KZ.blocked(b.x, b.z, b.y + 1), fire: b.fireAt[1] - b.y, top: [1, 4].map(i => B[i].act.top && Math.hypot(B[i].fireAt[0] - B[i].x, B[i].fireAt[2] - B[i].z) > 2) }; });
  ok(r.trees.every(Boolean), '島の 5本が 樹に なっていない：' + JSON.stringify(r.trees)); ok(r.top.every(Boolean), 'ふたご・崖の 灯が 塔・浮き足場に ない'); ok(r.wall, '幹を 通りぬけられる'); ok(r.fire > 7, '灯の 位置が 花の 高さに ない：' + r.fire);
});

let fail = 0;
for (const t of T) { if (only && !t.name.includes(only)) continue; const t0 = Date.now(); let s;
  try { s = await boot(t.opts); await t.fn(s); ok(!s.errors.length, 'ページの エラー：' + s.errors.slice(0, 2).join(' / ')); console.log(`PASS  ${t.name}（${((Date.now() - t0) / 1000).toFixed(0)}秒）`); }
  catch (e) { fail++; console.log(`FAIL  ${t.name}：${e.message}`); } finally { if (s) await s.browser.close(); } }
console.log(fail ? `\n${fail}件 失敗` : '\nすべて 成功'); process.exit(fail ? 1 : 0);
