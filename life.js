// 風灯の島 — 釣り・魚図鑑・料理図鑑・称号
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK, $ = id => document.getElementById(id), R = Math.random;
  // ---------------- data ----------------
  DATA.fish = [
    { id: 'kohadai', name: 'コハダイ', r: 0, t: 'any', w: 10, size: [18, 34], diff: 1, desc: '島の 浜で いちばん よく つれる。塩焼きが うまい。' },
    { id: 'toudaisaba', name: 'トウダイサバ', r: 0, t: 'day', w: 6, size: [26, 48], diff: 2, desc: '灯の樹の 光を 目印に 群れで 泳ぐ。' },
    { id: 'umihotaru', name: 'ウミホタルウオ', r: 0, t: 'night', w: 5, size: [10, 22], diff: 2, desc: '夜の 海で 青く 光る。灯守りの 守り神とも。' },
    { id: 'kazehirame', name: 'カゼヒラメ', r: 0, t: 'any', w: 1.5, size: [40, 80], diff: 3, desc: '砂に まぎれて 風の 音を 聴いている。' },
    { id: 'minatoaji', name: 'ミナトアジ', r: 1, t: 'any', w: 10, size: [16, 30], diff: 1, desc: '港町ミナトの 名物。朝市に 山ほど ならぶ。' },
    { id: 'yukimasu', name: 'ユキマス', r: 1, t: 'any', w: 5, size: [30, 60], diff: 2, desc: '冷たい 水を 好む 銀色の マス。' },
    { id: 'suname', name: 'スナメ', r: 1, t: 'day', w: 5, size: [20, 40], diff: 2, desc: '砂漠の 浜辺で 砂ごと 泳ぐ ふしぎな 魚。' },
    { id: 'hoshigarei', name: 'ホシガレイ', r: 1, t: 'night', w: 1.5, size: [45, 90], diff: 3, desc: '背中に 星座の もよう。星が 落ちた 夜に よく つれる。' },
    { id: 'kumouo', name: 'クモウオ', r: 2, t: 'any', w: 10, size: [14, 28], diff: 1, desc: '雲海を 泳ぐ ふわふわの 魚。焼くと 綿あめの 香り。' },
    { id: 'nijitobi', name: 'ニジトビウオ', r: 2, t: 'day', w: 4, size: [25, 45], diff: 2, desc: '雲から 雲へ 虹を かけて とぶ。' },
    { id: 'tsukiuo', name: 'ツキウオ', r: 2, t: 'night', w: 2, size: [30, 55], diff: 3, desc: '月の 光を 食べて 育つ。' },
    { id: 'uminonushi', name: 'ウミノヌシ', r: 0, t: 'night', w: .5, size: [150, 240], diff: 4, bait: true, desc: '島の 伝説。灯の樹の 灯が すべて ともった 夜、姿を 見せる。' },
  ];
  Object.assign(DATA.items, {
    tsurizao: { name: 'つりざお', key: true, price: 300, sell: 0, cat: 'heal', desc: '水辺で「つりを する」が できる', src: '道具屋・バルド船長', use: '浜辺や 雲海の ふちで つり' },
    esa: { name: 'まきえ', price: 30, sell: 5, cat: 'heal', desc: 'つれる 確率と 大物率が あがる（1回で 消費）', src: '道具屋', use: 'つりの ときに 自動で つかう' },
    sakana: { name: 'さかな', mat: true, sell: 8, cat: 'mat', desc: 'つった 魚の 身。料理の 材料', src: 'つり', use: '料理（焼き魚・魚じる・海鮮丼）' },
    nushiuroko: { name: 'ヌシの うろこ', mat: true, sell: 3000, cat: 'mat', desc: '虹色に かがやく 伝説の うろこ', src: 'ウミノヌシ', use: '高く 売れる' },
    yakizakana: { name: '焼き魚', heal: 90, sell: 15, cat: 'food', desc: 'HPを 90 かいふく（料理）', src: 'たき火で 料理', use: 'HP回復' },
    sakanajiru: { name: '魚じる', heal: 220, sell: 40, cat: 'food', desc: 'HPを 220 かいふく（料理）', src: 'たき火で 料理', use: 'HP回復' },
    kaisendon: { name: '星の海鮮丼', healAll: true, sell: 120, cat: 'food', desc: 'みんなの HPと MPを 全回復（料理）', src: 'たき火で 料理', use: '全回復' },
  });
  DATA.cook.push({ out: 'yakizakana', need: { sakana: 1 } }, { out: 'sakanajiru', need: { sakana: 2, kinoko: 1 } }, { out: 'kaisendon', need: { sakana: 3, hoshikake: 1, mi: 1 } });
  H.icons = Object.assign(H.icons || {}, { tsurizao: ['feather', '#c9a064'], esa: ['fruit', '#c07a5a'], sakana: ['feather', '#9fd0ff'], nushiuroko: ['star', '#9ff0ff'], yakizakana: ['bowl', '#d08a4a'], sakanajiru: ['bowl', '#e0c090'], kaisendon: ['bowl', '#ff9a7a'] });
  H.shopExtra = r => r === 2 ? ['esa'] : ['tsurizao', 'esa'];
  // ---------------- fishing ----------------
  const waterAhead = () => { const p = K.player, fx = Math.sin(p.yaw), fz = Math.cos(p.yaw); const r = K.G.region;
    for (const d of [2.2, 3.2, 4.2]) { const h = K.hAt(p.x + fx * d, p.z + fz * d); if (r === 2 ? h < -18 : h < -.8) return true; } return false; };
  const inside = () => !!((K.interior && K.interior.cur) || (K.lhDungeon && K.lhDungeon.here && K.lhDungeon.here())); // 家の 中・樹の 中では 釣りを しない
  H.target.push((cand) => { const G = K.G; if (!(G.inv.tsurizao > 0) || G.region === 3 || !K.player.ground || K.player.swim || inside()) return; if (G.region !== 2 && K.hAt(K.player.x, K.player.z) < -.2) return;
    if (waterAhead()) { const p = K.player; cand({ fish: true, y: p.y }, 'fish', p.x + Math.sin(p.yaw) * .01, p.z + Math.cos(p.yaw) * .01, 5); } });
  H.labels.fish = 'つりを する';
  function pickFish(big) { const G = K.G, night = World.skyInfo(G.tod).night > .5;
    const pool = DATA.fish.filter(f => f.r === G.region && (f.t === 'any' || (f.t === 'night') === night) && (!f.bait || (big && G.order >= 5)));
    let s = pool.reduce((a, f) => a + f.w * (big && f.diff >= 3 ? 2.5 : 1), 0) * R(); for (const f of pool) { s -= f.w * (big && f.diff >= 3 ? 2.5 : 1); if (s <= 0) return f; } return pool[0]; }
  function fishUI() { let el = $('fishUI'); if (!el) { el = document.createElement('div'); el.id = 'fishUI'; document.body.appendChild(el); } return el; }
  async function fishing() {
    const G = K.G; const bait = (G.inv.esa || 0) > 0; if (bait) G.inv.esa--; const f = pickFish(bait);
    if (!f) { await K.say(['……ここでは なにも つれそうに ない。']); return; }
    const el = fishUI(); el.hidden = false; el.className = 'wait'; Music.sfx('wind');
    el.innerHTML = `<div class="fu-box"><div class="fu-t">${bait ? 'まきえを まいた！ ' : ''}うきを 見つめている……</div><div class="fu-float">◉</div><div class="fu-h">アタリが きたら すぐ タップ！（Space/E）</div></div>`;
    let down = false, pressed = false; const onDown = e => { if (e.type === 'keydown' && !['Space', 'KeyE', 'Enter'].includes(e.code)) return; if (e.repeat) return; down = true; pressed = true; e.preventDefault && e.preventDefault(); };
    const onUp = e => { if (e.type === 'keyup' && !['Space', 'KeyE', 'Enter'].includes(e.code)) return; down = false; };
    el.addEventListener('pointerdown', onDown); addEventListener('pointerup', onUp); addEventListener('keydown', onDown, true); addEventListener('keyup', onUp, true);
    const clean = () => { el.removeEventListener('pointerdown', onDown); removeEventListener('pointerup', onUp); removeEventListener('keydown', onDown, true); removeEventListener('keyup', onUp, true); el.hidden = true; };
    // 待ち（早押しは 逃げられる）
    const waitT = 1400 + R() * 3600; const t0 = performance.now(); pressed = false;
    while (performance.now() - t0 < waitT) { await K.wait(50); if (pressed) { clean(); await K.say(['あわてて ひいたら、魚が 逃げてしまった……']); return; } }
    el.className = 'bite'; el.querySelector('.fu-t').textContent = '！！ アタリだ！'; Music.sfx('encounter'); pressed = false;
    const t1 = performance.now(); while (performance.now() - t1 < 900 && !pressed) await K.wait(20);
    if (!pressed) { clean(); await K.say(['……のがした。 魚は 深く もぐっていった。']); return; }
    // 引き（長押しで 巻く／テンションが 満タンで 糸が 切れる）
    el.className = 'reel'; const diff = f.diff; let prog = 25, ten = 20, pull = 0, t = 0;
    el.innerHTML = `<div class="fu-box"><div class="fu-t">${diff >= 3 ? '大物の 手ごたえ！ ' : ''}長押しで 巻く・はなすと ゆるむ</div><div class="fu-bar prog"><i></i></div><div class="fu-bar ten"><i></i><span>テンション</span></div><div class="fu-fish">🐟</div></div>`;
    const pi = el.querySelector('.prog i'), ti = el.querySelector('.ten i'), fe = el.querySelector('.fu-fish');
    let result = null; let last = performance.now();
    while (!result) { await K.wait(16); const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
      pull = Math.max(0, Math.sin(t * (1.3 + diff * .45)) * .6 + Math.sin(t * 3.7 + diff) * .4) * (.5 + diff * .35);
      if (down) { prog += (26 - pull * 16) * dt; ten += (30 + pull * 38) * dt; } else { prog -= (6 + pull * 10) * dt; ten -= 42 * dt; }
      ten = Math.max(0, ten); pi.style.width = Math.max(0, Math.min(100, prog)) + '%'; ti.style.width = Math.min(100, ten) + '%'; ti.parentElement.classList.toggle('hot', ten > 75);
      fe.style.left = Math.max(0, Math.min(100, prog)) + '%'; fe.style.transform = `translate(-50%,${Math.sin(t * 12) * pull * 6}px)`;
      if (prog >= 100) result = 'catch'; else if (prog <= 0) result = 'escape'; else if (ten >= 100) result = 'snap'; }
    clean();
    if (result !== 'catch') { Music.sfx('cancel'); await K.say([result === 'snap' ? 'プツン！ 糸が 切れてしまった……（テンションに 注意）' : '魚に 逃げられてしまった……']); return; }
    const size = Math.round(f.size[0] + (f.size[1] - f.size[0]) * Math.pow(R(), bait ? .7 : 1.2)); G.fishdex = G.fishdex || {}; const rec = G.fishdex[f.id]; const isNew = !rec, isBig = rec && size > rec;
    G.fishStock=G.fishStock||{};G.fishStock[f.id]=(G.fishStock[f.id]||0)+1; G.fishdex[f.id] = Math.max(size, rec || 0); const n = size > (f.size[0] + f.size[1]) / 2 ? 2 : 1; K.gain('sakana', n); if (f.id === 'uminonushi') K.gain('nushiuroko', 1);
    Music.jingle('levelup', K.fieldSong()); K.floatText([K.player.x, K.player.y + 2, K.player.z], `${f.name} ${size}cm`);
    await K.say([`${f.name}を つりあげた！（${size}cm）${isNew ? '　【魚図鑑に 登録】' : isBig ? '　【自己ベスト更新！】' : ''}`, f.desc, `さかな を ${n}こ 手に入れた。`]);
    const got = Object.keys(G.fishdex).length; const rw = FISH_RW.find(x => x.n === got && !(G.fishRw || {})[x.n]);
    if (rw) { G.fishRw = G.fishRw || {}; G.fishRw[rw.n] = 1; if (rw.gold) G.gold += rw.gold; if (rw.give) for (const [k, v] of Object.entries(rw.give)) K.gain(k, v); await K.say([`【魚図鑑 ${got}種】ごほうび：${rw.text}`]); }
    K.save(); K.hud(); }
  const FISH_RW = [{ n: 4, text: 'まきえ ×5', give: { esa: 5 } }, { n: 8, text: '3000ゴールド', gold: 3000 }, { n: 12, text: '10000ゴールド', gold: 10000 }, { n:24,text:'15000ゴールド と 称号「釣り名人」',gold:15000 }];
  H.acts.fish = () => fishing();
  // バルド船長が つりざおを くれる
  H.talks.baldo = async () => { const G = K.G; if (G.flags.c2arrive && !(G.inv.tsurizao > 0) && !G.flags.rodGiven) { G.flags.rodGiven = 1; G.inv.tsurizao = 1;
      await K.say([K.who('baldo', 'grin', 'おう、{name}！ 海の 男の 相棒を やろう。 こいつで 浜から 糸を たらしてみな！'), '「つりざお」を もらった！（水辺で「つりを する」）', K.who('baldo', 'neutral', 'まきえを つかえば 大物も くる。 ……島の ヌシは、灯が ぜんぶ ともった 夜に 出るって 話だ。')]); K.save(); return; }
    return 'pass'; };
  // ---------------- 図鑑UI ----------------
  function fishBook() { const G = K.G, dx = G.fishdex || {};
    const rows = DATA.fish.map(f => `<div class="fb-row${dx[f.id] ? ' got' : ''}"><b>${dx[f.id] ? f.name : '？？？'}</b><span>${K.regionName(f.r)}・${{ any: 'いつでも', day: '昼', night: '夜' }[f.t]}${f.bait ? '・まきえ' : ''}</span><span>${dx[f.id] ? `最大 ${dx[f.id]}cm` : '—'}</span><small>${dx[f.id] ? f.desc : ''}</small></div>`).join('');
    return K.panel(`<h3>魚図鑑　<small>${Object.keys(dx).length} / ${DATA.fish.length}</small></h3><div class="fbook">${rows}</div><p class="st-eq">4・8・12・24種で ごほうび。つりざおは 道具屋か バルド船長から。</p>`, 'wide'); }
  function cookBook() { const G = K.G, ck = G.cooked || {};
    const rows = DATA.cook.map(c => `<div class="fb-row${ck[c.out] ? ' got' : ''}"><b>${ck[c.out] ? DATA.items[c.out].name : '？？？'}</b><span>${Object.entries(c.need).map(([k, v]) => `${DATA.items[k].name}${v}`).join('＋')}</span><span>${ck[c.out] ? `${ck[c.out]}回` : '—'}</span><small>${ck[c.out] ? DATA.items[c.out].desc : 'たき火で ためしてみよう'}</small></div>`).join('');
    return K.panel(`<h3>料理図鑑　<small>${Object.keys(ck).length} / ${DATA.cook.length}</small></h3><div class="fbook">${rows}</div>`, 'wide'); }
  // ---------------- 称号 ----------------
  DATA.titles = [
    { id: 'tomori', name: '灯守り', desc: '第1章を クリア', ok: G => G.flags.cleared },
    { id: 'tairiku', name: '大陸の 冒険者', desc: '第2章を クリア', ok: G => G.flags.c2done },
    { id: 'sora', name: '空の 旅人', desc: '第3章を クリア', ok: G => G.flags.c3done },
    { id: 'umi', name: '海の 灯', desc: '第4章を クリア', ok: G => G.flags.c4done },
    { id: 'hakase', name: 'いきもの博士', desc: '図鑑の なかま 28種', ok: G => Object.keys(G.dex.got).length >= 28 },
    { id: 'sorahakase', name: '空の博士', desc: '図鑑の なかま 38種', ok: G => Object.keys(G.dex.got).length >= 38 },
    { id: 'kanzen', name: 'いきもの大全', desc: '図鑑を すべて うめる', ok: G => Object.keys(G.dex.got).length >= DATA.speciesOrder.length },
    { id: 'tsuri', name: '釣り名人', desc: '魚を すべて つる', ok: G => Object.keys(G.fishdex || {}).length >= DATA.fish.length },
    { id: 'nushi', name: 'ヌシを 釣りし者', desc: 'ウミノヌシを つる', ok: G => (G.fishdex || {}).uminonushi },
    { id: 'chef', name: '料理人', desc: '料理を すべて つくる', ok: G => Object.keys(G.cooked || {}).length >= DATA.cook.length },
    { id: 'hokora', name: '祠の 達人', desc: '試練の祠を すべて クリア', ok: G => DATA.shrines && Object.keys(G.shrineDone || {}).length >= DATA.shrines.length },
    { id: 'kenchiku', name: '建築家', desc: '拠点レベル 5', ok: G => (G.baseLv || 0) >= 5 },
    { id: 'kanemochi', name: 'お金もち', desc: '50000ゴールドを もつ', ok: G => G.gold >= 50000 },
    { id: 'shiny', name: '色ちがい ハンター', desc: '色ちがいを なかまに', ok: G => G.mons.some(m => m.shiny) },
    { id: 'kizuna', name: 'きずなの 友', desc: 'なつき 100 の いきもの', ok: G => G.mons.some(m => (m.bond || 0) >= 100) },
    { id: 'shinen', name: '深淵を 越えし者', desc: '裏ボスを たおす', ok: G => G.flags.superDone },
  ];
  let tchk = 0;
  H.frame.push(dt => { tchk -= dt; if (tchk > 0) return; tchk = 3; const G = K.G; G.titles = G.titles || {};
    for (const t of DATA.titles) if (!G.titles[t.id] && t.ok(G)) { G.titles[t.id] = 1; Music.sfx('friend'); K.tip(`<b>称号を 手に入れた：「${t.name}」</b><span>${t.desc}（メニューの「きろく帳」で つけかえ）</span>`); } });
  async function titleMenu() { const G = K.G; G.titles = G.titles || {};
    while (true) { const i = await K.menu({ title: `称号（${Object.keys(G.titles).length}/${DATA.titles.length}）　いま：${G.title || 'なし'}`, items: DATA.titles.map(t => ({ label: (G.titles[t.id] ? '' : '🔒 ') + (G.titles[t.id] ? t.name : '？？？'), sub: t.desc, disabled: !G.titles[t.id] })), where: 'side' });
      if (i < 0) return; G.title = DATA.titles[i].name; Music.sfx('ok'); K.toast(`称号「${G.title}」を つけた`, 1200); } }
  async function logBook() { while (true) { const i = await K.menu({ title: 'きろく帳', items: [{ label: '魚図鑑', sub: `${Object.keys(K.G.fishdex || {}).length}/${DATA.fish.length}` }, { label: '料理図鑑', sub: `${Object.keys(K.G.cooked || {}).length}/${DATA.cook.length}` }, { label: '称号', sub: `${Object.keys(K.G.titles || {}).length}/${DATA.titles.length}` }], where: 'side' });
    if (i < 0) return; if (i === 0) await fishBook(); if (i === 1) await cookBook(); if (i === 2) await titleMenu(); } }
  H.menu.push(() => ({ label: 'きろく帳', sub: '魚・料理・称号', fn: logBook }));
  K.fishing = fishing;
})();
