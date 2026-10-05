// 家の 中の くらし：住人が いて、ヒントや 島の ようすを 話す・おすそわけを くれる・お使いを たのむ（docs/design/home-life.md）
// ・interiors.js の 部屋（K.interior）を そのまま つかう。interiors.js は 変えない
// ・住人は 時刻で 居場所が かわる（朝は 台所・昼は 仕事・夕方は くつろぎ・夜は ねている）
// ・新しい 記録は G.homeGift（おすそわけを もらった 日）と G.errands（お使い）だけ。旧セーブは 未設定＝最初から
'use strict';
(() => {
  const K = window.KZ; if (!K || !K.interior || typeof World === 'undefined') return; const H = K.HOOK, W = World, I = K.interior, B = W.Blocks;
  const G = () => K.G, R = Math.random;
  // 家の 種類ごとの 住人（新しい 家族や 過去は 足さない。役目だけ）
  const ROLE = { home: ['るすばんの 人', 0], smith: ['かじやの 見習い', 1], cook: ['台所の 手伝い', 0], mayor: ['役場の 書記', 1], fisher: ['あみ なおしの 人', 1], scholar: ['書生', 1],
    elder: ['お世話がかり', 0], mystic: ['見習いの うらない師', 0], mill: ['粉ひきの 手伝い', 1], farm: ['畑の 手伝い', 0] };
  const LOOKS = [{ skin: '#f0cfb2', hair: '#5a3a2a', hairStyle: 'bob', top: '#c97a5a', bottom: '#4a4050', skirt: '#8a5a4a', apron: true },
    { skin: '#e2b894', hair: '#3a2a20', top: '#6a8a6a', bottom: '#46404a', sleeve: 'rolled' }];
  const MESH = LOOKS.map(o => W.makeMesh(W.human(o), 1));
  const day = () => Math.floor(((G().play || 0) / 480) + (G().tod || 0)); // 灯の樹の 実りと 同じ 1日
  const hour = () => ((G().tod || 0) % 1) * 24;
  const sleeping = () => { const h = hour(); return h >= 22 || h < 6; };
  const keyOf = c => `${c.r}:${c.h.id}`;
  const ROOM = () => I.ROOM[G().region];
  // 居場所（部屋の 中の マス。家具の 見えない かべを さける）
  const SPOTS = [[-2, -3], [3, -1], [-3, 2], [2, 3], [0, -4], [-4, -1]];
  const placeOf = c => { const R0 = ROOM(), h = hour(), pref = h >= 22 || h < 6 ? 3 : h < 11 ? 0 : h < 17 ? 1 : 2;
    for (let k = 0; k < SPOTS.length; k++) { const [a, b] = SPOTS[(pref + k) % SPOTS.length], x = R0.x + a + .5, z = R0.z + b + .5;
      if (B.get(Math.floor(x), R0.y + 1, Math.floor(z)) !== 19 && B.get(Math.floor(x), R0.y + 2, Math.floor(z)) !== 19) return { x, z, y: R0.y + 1 }; }
    return { x: R0.x + .5, z: R0.z - 2.5, y: R0.y + 1 }; };
  const resident = () => { const c = I.cur; if (!c) return null; const [nm, look] = ROLE[c.kind] || ROLE.home; return { c, nm, look, ...placeOf(c) }; };
  // ---- 見た目 ----
  H.frame.push(() => { for (const m of MESH) m.n = 0; const c = I.cur; if (!c || K.phase !== 'field' || (K.B && K.B.active) || G().region !== c.r) return; const r = resident(); if (!r) return;
    const p = K.player, near = Math.hypot(p.x - r.x, p.z - r.z) < 5, yaw = near && !sleeping() ? Math.atan2(p.x - r.x, p.z - r.z) : (r.look ? 1.2 : -2);
    const m = MESH[r.look % MESH.length]; m.set(m.n++, r.x, r.y - (sleeping() ? .45 : 0), r.z, 1, yaw); });
  // ---- 話の 中身 ----
  const flags = () => G().flags || {};
  const litN = () => (G().lit || []).filter(Boolean).length;
  function news() { const F = flags(), L = [];
    if (!F.cleared) L.push(litN() ? `灯の樹が ${litN()}本 ともったって？ 村の 夜が すこし 明るく なった 気が するよ。` : '島の 灯の樹が くすんでから、まものが あらっぽく なったんだって。 夜道は 気をつけてね。');
    else if (!F.c2done) L.push('霧の大陸の ミナモ港は いつも 船で いっぱい。 東の 砂漠には「星の遺跡」が あるらしいよ。', '砂漠の 遺跡の 上に、星を ながめる 部屋が あるって 話、知ってる？');
    else if (!F.c3done) L.push('空の 島へ わたった 人が いるって うわさだよ。 雲の 上にも 里が あるんだって。', '空の 塔の 中ほどに、星座が きざまれた 床が あるとか。');
    else if (!F.c4done) L.push('海の 底に 泡の 里が あるって、本当かな。 宮の 屋上には ふしぎな 潮の 流れが あるんだって。', 'さいきん 海の 色が ふかく なった 気が する。 なにか おこってるのかも。');
    else L.push('島じゅうの 灯が もどって、市場も にぎやかに なったね。 ありがとう。', '旅の 人が ふえたよ。 上位の 職業に ついた 人も いるんだって。');
    L.push(['雨の 日は 釣りが よく つれる……と おじいちゃんが 言ってた。', 'てんしょくの ぞうは、町の 石像の そばに あるよ。', '家の タンスや 樽は、しらべると なにか 入ってる ことが あるよ。'][day() % 3]);
    return L; }
  // 役目ごとの ひとこと（日で かわる）
  const SAY = { home: ['家の しごとは おわりが ないけど、 灯が ともってると がんばれるの。', '外は 寒くない？ あったかくして 行ってね。'],
    smith: ['いい 武器は いい 手入れから。 刃こぼれしたら 見せにおいで。', '火の 色で 鉄の 温度が わかるんだ。 まだ 修行中だけどね。'],
    cook: ['きょうの なべは 木の実と キノコ。 においで わかった？', '料理は 火かげんが いのち。 灯と 同じだね。'],
    mayor: ['町の 記録を つけてるんだ。 あなたたちの ことも 書いて おくよ。', 'お使いの 話、 町の みんなが よろこんでたよ。'],
    fisher: ['あみの やぶれは 早めに なおすのが コツ。 大物は のがさないよ。', '雨の 日の 前は、 魚が 浅い ところに よって くるんだ。'],
    scholar: ['本で 読んだ 星座と、 空の 星を くらべるのが 楽しいんだ。', '古い 字は むずかしいけど、 少しずつ 読めるように なってきた。'],
    elder: ['お年よりの 話は 長いけど、 ためになる ことも 多いのよ。', 'ゆっくりで いいの。 灯は にげないから。'],
    mystic: ['うらないに よると…… きょうは 寄り道が 吉、だって。', '星の ならびが 少し かわった。 あなたたちの せいかもね。'],
    mill: ['風車が まわると 粉が ひける。 風さまさまだよ。', '粉まみれで ごめんね。 パンは おいしく できるから！'],
    farm: ['畑の 土は 正直だよ。 手を かけたぶん、 ちゃんと こたえて くれる。', 'まものが おとなしく なって、 畑が あらされなく なったの。'] };
  const sayOf = c => { const L = SAY[c.kind] || SAY.home; return L[(day() + c.h.id.length) % L.length]; };
  function hint() { const o = K.objective && K.objective(); return o && o.t ? `いまは「${o.t.replace(/【[^】]*】/g, '')}」の ところ？ 地図の 目じるしを たよりに 行ってみて。` : 'つぎに どこへ 行くか まよったら、メニューの 地図を 見てみて。'; }
  // ---- おすそわけ（1日1回・1けん ずつ） ----
  const GIFT = [[['mi', 2], ['pan', 1], ['kinoko', 2]], [['pan', 1], ['suna', 2], ['shizuku', 1]], [['kumowata', 2], ['pan', 1], ['shizuku', 1]], [['shizuku', 1], ['pan', 1], ['ganbari', 1]]];
  const giftReady = c => ((G().homeGift || {})[keyOf(c)] | 0) !== day() + 1;
  function gift(c) { const g = G(); g.homeGift = g.homeGift || {}; g.homeGift[keyOf(c)] = day() + 1; const L = (GIFT[c.r] || GIFT[0]).filter(([k]) => DATA.items[k]); const [k, n] = L[(day() + c.h.id.length) % L.length]; K.gain(k, n); return `${DATA.items[k].name}を ${n}こ もらった！`; }
  // ---- お使い（1けんに 1つ。とどけると つぎは あした） ----
  const WANT = [['maki', 'ishi', 'kinoko', 'mi', 'ha'], ['suna', 'ishi', 'mi', 'kinoko'], ['kumowata', 'mi', 'kinoko', 'ha'], ['shinju', 'mi', 'ishi']];
  const errands = () => { const g = G(); if (!g.errands || typeof g.errands !== 'object') g.errands = {}; return g.errands; };
  function errandOf(c) { const E = errands(), k = keyOf(c); let e = E[k]; if (e && e.st === 'done' && (e.next | 0) > day()) return e;
    if (!e || e.st === 'done') { const L = (WANT[c.r] || WANT[0]).filter(x => DATA.items[x]); const n0 = (e && e.n0) || 0; const it = L[(n0 + c.h.id.length) % L.length], n = 3 + (n0 % 3) * 2;
      e = E[k] = { it, n, st: 'new', n0 }; }
    return e; }
  const rewardOf = (c, e) => ({ gold: e.n * 30 * (1 + c.r), item: ['shizuku', 'ganbari', 'pan'][(e.n0 || 0) % 3] });
  async function talk() { const r = resident(); if (!r) return; const c = r.c, NM = t => K.nm(r.nm, t);
    if (sleeping()) { await K.say(['……すう……すう……。', `（${r.nm}は ねむっている。 朝に また 来よう）`]); return; }
    const e = errandOf(c), ready = giftReady(c);
    const items = [{ label: 'はなしを きく' }, { label: ready ? 'おすそわけ？' : 'おすそわけ（また あした）', disabled: !ready },
      { label: e.st === 'open' ? `お使い：${DATA.items[e.it].name}を ${e.n}こ` : e.st === 'done' ? 'お使い（また あした）' : 'お使いを きく', disabled: e.st === 'done' }, { label: 'さようなら' }];
    const ch = await K.menu({ title: r.nm, items });
    if (ch === 0) { const L = news(); await K.say([NM(hint()), NM(L[0]), NM(sayOf(c)), ...(L[1] ? [NM(L[1])] : [])]); return; }
    if (ch === 1 && ready) { const t = gift(c); try { Music.sfx('pick'); } catch (_) {} await K.say([NM('よかったら これ、もっていって。'), t]); K.save(); K.hud(); return; }
    if (ch === 2) { const nmI = DATA.items[e.it].name, rw = rewardOf(c, e), have = (G().inv[e.it] || 0);
      if (e.st === 'new') { if (await K.confirm(`${r.nm}：「${nmI}を ${e.n}こ あつめて きて くれない？」（おれい ${rw.gold}G と ${DATA.items[rw.item].name}）`)) { e.st = 'open'; await K.say([NM('ありがとう！ たすかるよ。 いそがなくて いいからね。')]); K.save(); } return; }
      if (e.st === 'open') { if (have < e.n) { await K.say([NM(`${nmI}は ${e.n}こ ほしいんだ。（いま ${have}こ）`), '（フィールドで あつめて もってこよう）']); return; }
        G().inv[e.it] -= e.n; G().gold += rw.gold; K.gain(rw.item, 1); e.st = 'done'; e.next = day() + 1; e.n0 = (e.n0 || 0) + 1; G().errandsDone = (G().errandsDone || 0) + 1;
        try { Music.sfx('buy'); } catch (_) {} await K.say([NM(`${nmI}、たしかに！ ほんとうに ありがとう。`), `${rw.gold}ゴールドと ${DATA.items[rw.item].name}を もらった！`]); K.save(); K.hud(); return; } } }
  // ---- しらべる ----
  H.target.push(cand => { const r = resident(); if (!r || G().region !== r.c.r) return; cand(r, 'hmTalk', r.x, r.z, 1.9); });
  H.labels.hmTalk = t => sleeping() ? `${t.o.nm}（ねている）` : `${t.o.nm}と 話す`;
  H.acts.hmTalk = async () => { await talk(); };
  H.quest.push(() => { const E = errands(), open = Object.values(E).filter(e => e && e.st === 'open'); return open.length ? `<li>家の お使い：${open.map(e => `${DATA.items[e.it] ? DATA.items[e.it].name : e.it}×${e.n}`).join('・')}</li>` : ''; });
  H.load.push(g => { if (g.homeGift && typeof g.homeGift !== 'object') g.homeGift = {}; if (g.errands && typeof g.errands !== 'object') g.errands = {}; });
  K.homeLife = { resident, news, hint, errandOf, giftReady, gift, sleeping, day };
})();
