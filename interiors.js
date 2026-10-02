// 家の中・しらべもの・花の 水やり（町の くらし 第2段）
// ・家に 入れる：台所・かまど・洗濯おけ・寝床・タンス・本棚・樽・ツボ。住む人の 仕事で 中身が かわる（かじや・漁師・料理・学者・長老・粉ひき・農家）
// ・タンス／樽／ツボ／木箱／本棚などを しらべると、道具・お金・ときどき 防具や 武器（武器と 防具は そうびの 袋へ）
// ・町の 花だんと 家の 植木ばちに 水を やると、しばらくして 花が さき、つみとれる（何度でも）
// セーブ：G.searched（しらべた 場所）・G.garden（花の ようす）だけ 追加。家の 中の 部屋は 地方ごとに 1つを 使いまわし、家具は 入るたびに 置きなおす
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const H = K.HOOK, W = World, B = W.Blocks;
  const { Geo, prism, ico, seg, hex, solid } = W;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const G = () => K.G;
  // ---------- 新しい 道具 ----------
  if (!DATA.items.hana) DATA.items.hana = { name: 'お花', mat: true, cat: 'mat', sell: 8, desc: '町の 花だんで そだてた 花。 売ると すこし お金に なる' };
  // ---------- 家具の 形 ----------
  const geo = f => { const g = Geo(); f(g); return g; };
  const WOOD = hex('#9a6a40'), DARK = hex('#6a4528'), IRON = hex('#5a5a62');
  // 軸に そろった 箱（hw,hd＝幅・奥行きの 半分）。4角柱を 45度 まわして つくる
  const box = (g, hw, hd, y0, y1, col, x = 0, z = 0) => { const i0 = g.p.length; prism(g, Math.SQRT1_2, Math.SQRT1_2, y0, y1, 4, col); for (let i = i0; i < g.p.length; i += 3) { const px = g.p[i], pz = g.p[i + 2], nx = g.n[i], nz = g.n[i + 2]; g.p[i] = (px - pz) * Math.SQRT1_2 * 2 * hw + x; g.p[i + 2] = (px + pz) * Math.SQRT1_2 * 2 * hd + z; g.n[i] = (nx - nz) * Math.SQRT1_2; g.n[i + 2] = (nx + nz) * Math.SQRT1_2; } };
  const SHAPES = {
    tansu: g => { box(g, .45, .25, 0, 1.3, WOOD); box(g, .47, .27, 1.3, 1.36, DARK); for (let k = 0; k < 3; k++) { box(g, .42, .02, .1 + k * .4, .45 + k * .4, hex('#b07a4a'), 0, .25); for (const x of [-.18, .18]) ico(g, .03, [x, .28 + k * .4, .28], hex('#f3c15a'), 0); } },
    shelf: g => { for (const x of [-.62, .62]) prism(g, .06, .06, 0, 1.9, 4, DARK, x, 0, 1, 4); for (let k = 0; k < 4; k++) { seg(g, [-.62, .05 + k * .48, 0], [.62, .05 + k * .48, 0], .05, .05, 4, WOOD);
      for (let j = 0; j < 7; j++) prism(g, .055, .055, .1 + k * .48, .38 + k * .48 - (j % 3) * .03, 4, hex(['#b84a3a', '#3a6aa8', '#4a8a4a', '#d8a83a', '#7a4a8a', '#c86a3a', '#3a3a5a'][(j + k) % 7]), -.45 + j * .15, .05, 1, 3.5); } },
    barrel: g => { prism(g, .34, .4, 0, .45, 10, WOOD); prism(g, .4, .34, .45, .9, 10, WOOD); for (const y of [.15, .45, .75]) prism(g, .42, .42, y, y + .05, 10, IRON); prism(g, .33, .33, .9, .92, 10, DARK); },
    pot: g => { ico(g, .3, [0, .3, 0], hex('#b8754a'), .02, 1, 1); prism(g, .16, .2, .52, .68, 8, hex('#a8653a')); prism(g, .2, .2, .66, .7, 8, hex('#8a5030')); },
    crate: g => { box(g, .35, .35, 0, .7, WOOD); for (const y of [.02, .64]) box(g, .37, .37, y, y + .05, DARK); seg(g, [-.3, .05, .36], [.3, .66, .36], .03, .03, 3, DARK); },
    table: g => { box(g, .7, .45, .7, .78, WOOD); for (const [x, z] of [[-.6, -.36], [.6, -.36], [-.6, .36], [.6, .36]]) prism(g, .05, .05, 0, .72, 4, DARK, x, z); ico(g, .1, [.2, .86, 0], hex('#f0e8d0'), 0); ico(g, .07, [-.25, .84, .1], hex('#e04a3a'), 0); },
    chair: g => { box(g, .2, .2, .4, .46, WOOD); for (const [x, z] of [[-.17, -.17], [.17, -.17], [-.17, .17], [.17, .17]]) prism(g, .03, .03, 0, .42, 4, DARK, x, z); box(g, .2, .03, .46, 1, WOOD, 0, -.18); },
    tub: g => { prism(g, .45, .5, 0, .4, 12, hex('#b08050')); prism(g, .42, .42, .32, .36, 12, hex('#9ad0f0')); box(g, .12, .02, .2, .75, hex('#c8a070'), .3, 0); for (let k = 0; k < 5; k++) box(g, .11, .01, .3 + k * .08, .32 + k * .08, hex('#8a6040'), .3, .025); ico(g, .1, [-.15, .4, .1], hex('#f4f0e6'), .05); },
    rack: g => { for (const x of [-.6, .6]) seg(g, [x, 0, 0], [x, 1.2, 0], .03, .03, 4, DARK); seg(g, [-.6, 1.15, 0], [.6, 1.15, 0], .02, .02, 4, DARK); for (let k = 0; k < 3; k++) prism(g, .15, .15, .7, 1.15, 4, hex(['#f4f0e6', '#7ab0d8', '#e8c060'][k]), -.35 + k * .35, 0, 1, .15); },
    counter: g => { box(g, .45, .45, 0, .9, hex('#c8b090')); box(g, .5, .5, .9, .98, hex('#8a6a50')); prism(g, .15, .15, .98, 1.12, 8, IRON, -.2, -.1); prism(g, .17, .12, 1.12, 1.2, 8, IRON, -.2, -.1); ico(g, .09, [.2, 1.05, .1], hex('#e8a040'), .05); ico(g, .07, [.25, 1.04, -.2], hex('#7ac04a'), .05); box(g, .3, .15, .99, 1.0, hex('#d8e8f0'), 0, .3); },
    rug: g => { box(g, 1.3, .9, .01, .03, hex('#b84a4a')); box(g, 1.1, .72, .02, .04, hex('#e8c070')); box(g, .9, .55, .03, .05, hex('#b84a4a')); },
    anvil: g => { box(g, .2, .2, 0, .4, DARK); box(g, .35, .18, .4, .6, IRON); seg(g, [.3, .55, 0], [.55, .52, 0], .08, .02, 6, IRON); seg(g, [-.1, .7, .1], [.15, .9, .2], .025, .025, 4, DARK); box(g, .1, .06, .88, .96, IRON, .17, .21); },
    net: g => { for (let i = 0; i <= 8; i++) { seg(g, [-.8 + i * .2, 0, 0], [-.8 + i * .2, 1.2, 0], .008, .008, 3, hex('#c8b890')); } for (let j = 0; j <= 6; j++) seg(g, [-.8, j * .2, 0], [.8, j * .2, 0], .008, .008, 3, hex('#c8b890')); for (let k = 0; k < 4; k++) ico(g, .07, [-.6 + k * .4, .3 + (k % 2) * .5, .02], hex('#e8e0d0'), .02); seg(g, [-.5, 1.4, .05], [.5, 1.4, .05], .02, .02, 3, DARK); for (let k = 0; k < 3; k++) seg(g, [-.3 + k * .3, 1.38, .05], [-.3 + k * .3, 1.0, .08], .05, .02, 5, hex('#a8b8c8')); },
    sack: g => { ico(g, .32, [0, .3, 0], hex('#d8c098'), .05, 1, 1.1); prism(g, .1, .15, .6, .72, 6, hex('#c8b088')); },
    cat: g => { ico(g, .2, [0, .18, 0], hex('#e8a050'), .02, 1, .8); ico(g, .14, [0, .32, .2], hex('#e8a050'), .02); for (const sx of [-1, 1]) prism(g, .05, 0, .4, .52, 3, hex('#e8a050'), sx * .08, .2); seg(g, [0, .2, -.2], [0, .45, -.35], .04, .03, 4, hex('#e8a050')); for (const sx of [-1, 1]) ico(g, .025, [sx * .05, .34, .33], solid([.1, .1, .1]), 0); },
    bed: g => { box(g, .45, .9, 0, .45, WOOD); box(g, .42, .86, .45, .6, hex('#f4f0e6')); box(g, .44, .55, .55, .68, hex('#6a8ac8'), 0, .3); box(g, .32, .17, .6, .75, hex('#f8f8f0'), 0, -.62); box(g, .45, .05, .45, 1.1, DARK, 0, -.88); },
    stove: g => { box(g, .45, .45, 0, .9, hex('#7a7068')); box(g, .22, .03, .2, .55, solid([1, .55, .2], 1), 0, .46); prism(g, .12, .1, .9, 2.3, 6, hex('#5a5048'), 0, -.2); prism(g, .2, .2, .9, 1.05, 10, IRON, 0, .1); },
    loom: g => { for (const x of [-.6, .6]) seg(g, [x, 0, 0], [x, 1.5, 0], .04, .04, 4, WOOD); seg(g, [-.6, 1.4, 0], [.6, 1.4, 0], .04, .04, 4, WOOD); box(g, .5, .01, .4, 1.3, hex('#e8e0f0')); seg(g, [-.6, .8, .2], [.6, .8, .2], .05, .05, 6, WOOD); },
    crystal: g => { box(g, .3, .3, 0, .7, hex('#3a3050')); ico(g, .22, [0, .95, 0], solid([.6, .7, 1], .8), .05); },
  };
  const flower = st => g => { box(g, .7, .3, 0, .35, hex('#a86a40')); box(g, .65, .26, .33, .37, hex(st === 0 ? '#8a6a48' : '#4a3424'));
    for (let k = 0; k < 5; k++) { const x = -.5 + k * .25; seg(g, [x, .35, 0], [x, st === 2 ? .7 : .48, 0], .015, .01, 3, hex('#4a9a3a')); if (st === 2) for (let j = 0; j < 5; j++) { const a = j / 5 * 6.283; ico(g, .05, [x + Math.cos(a) * .05, .72, Math.sin(a) * .05], hex(['#f06a8a', '#f0c040', '#ffffff', '#b07ae0', '#f08a40'][k]), 0); } else ico(g, .04, [x, .5, 0], hex('#6ac04a'), 0); }
    if (st === 1) for (let k = 0; k < 4; k++) ico(g, .03, [-.4 + k * .27, .4, .15], solid([.6, .85, 1], .6), 0); };
  for (let s = 0; s < 3; s++) SHAPES['flower' + s] = flower(s);
  const MESH = {}; const meshOf = k => MESH[k] || (MESH[k] = W.makeMesh(geo(SHAPES[k]), 24));
  // ---------- しらべた ときの 中身 ----------
  const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const CAP = [500, 2700, 5300, 8000] /* 地方ごとの 上限（店で 売っている 品だけ。ゲンの 工房で 打つ 品は 出ない） */, GOLD = [25, 70, 130, 200];
  const NAME = { tansu: 'タンス', shelf: '本棚', barrel: '樽', pot: 'ツボ', crate: '木箱', counter: '台所', tub: '洗濯おけ', sack: 'ふくろ', stove: 'かまど', bed: 'ベッド' };
  const POOL = {
    tansu: [['hane', 1], ['nakayoshi', 1], ['gold', 1], ['shizuku', 1]], barrel: [['mi', 3], ['pan', 1], ['shizuku', 1], ['kinoko', 2], ['gold', 1]],
    pot: [['gold', 1], ['dokukeshi', 2], ['mi', 2], ['shizuku', 1], ['hoshikake', 1, .1]], crate: [['ishi', 3], ['maki', 3], ['pan', 1], ['gold', 1]],
    counter: [['pan', 2], ['yakimi', 2], ['kinojiru', 1], ['stew', 1, .12]], tub: [['gold', 1]], sack: [['mi', 4], ['kinoko', 2], ['pan', 1]], stove: [['yakimi', 2], ['pan', 1]], bed: [['gold', 1], ['hane', 1]],
  };
  const BOOKS = ['「灯台守の こころえ」……灯は 帰る 場所の しるし。 いってらっしゃいの しるしでも ある。', '「いきもの図鑑の つけかた」……よく 見て、よく 書く。 それが いちばん。', '「星の よみかた」……夜空の 星は、ずっと むかしの 光だと いう。',
    '「風の ことわざ集」……むかい風は、たこを いちばん 高く あげる。', '「おいしい 料理」……木の実は 焼くと あまく なる。', '「船乗りの 日記」……霧の 大陸の 港は、いつも 人で いっぱいだ。'];
  const bag = () => K.bal && K.bal.bag ? K.bal.bag() : null;
  const HUM = ['sora', 'mio', 'riku', 'sana', 'haru', 'kaito'];
  function armorLoot(r, key, cloth) { const b = bag(); if (!b) return null; const cand = DATA.armor.map((a, i) => ({ a, i })).filter(({ a, i }) => i > 0 && a.price > 0 && a.price <= CAP[r] && (a.r == null || a.r <= r) && (!cloth || ['cloth', 'light', 'robe'].includes(a.ty)) && !(a.sky && r !== 2) && !(a.sea && r !== 3));
    if (!cand.length) return null; cand.sort((x, y) => (y.a.price || 0) - (x.a.price || 0)); const top = cand.slice(0, 3), p = top[Math.floor(hash(key + 'a') * top.length)]; b.a[p.i] = (b.a[p.i] || 0) + 1; return `${p.a.name}を 手に入れた！（そうびの 袋へ）`; }
  function weaponLoot(r, key) { const b = bag(); if (!b) return null; const party = G().party.filter(m => HUM.includes(m.id)); const order = party.map((m, k) => party[(k + Math.floor(hash(key + 'w') * party.length)) % party.length]);
    for (const m of order) { const L = DATA.gear[m.id] || [], cur = G().eq[m.id].w; const owned = new Set([cur, ...(b.w[m.id] || [])]); const nx = L.findIndex((g, i) => i > cur && !owned.has(i) && g.price > 0 && g.price <= CAP[r] && !(g.sky && r !== 2) && !(g.sea && r !== 3));
      if (nx > 0) { b.w[m.id].push(nx); return `${K.nameOf ? K.nameOf(m) : m.id}の 武器「${L[nx].name}」を 手に入れた！（そうびの 袋へ）`; } } return null; }
  function loot(spot) { const g = G(), r = g.region, key = spot.key, kind = spot.kind, h = hash(key), out = [];
    if (kind === 'shelf') { out.push('本を 1さつ ひらいた。', BOOKS[Math.floor(h * BOOKS.length)]); if (h < .3) { K.gain('shizuku', 1); out.push(`${DATA.items.shizuku.name}が はさまっていた！`); } return out; }
    if (spot.weapon) { const s = weaponLoot(r, key); if (s) return [s]; }
    if (kind === 'tansu' && h < .35) { const s = armorLoot(r, key, true); if (s) return [s]; }
    if (kind === 'crate' && spot.smith && h < .6) { const s = weaponLoot(r, key); if (s) return [s]; }
    const pool = (POOL[kind] || POOL.pot).filter(([, , p]) => !p || hash(key + 'r') < p); const [it, n0] = pool[Math.floor(hash(key + 'p') * pool.length)] || ['gold', 1];
    if (it === 'gold' || !DATA.items[it]) { const v = Math.round(GOLD[r] * (.5 + hash(key + 'g'))); g.gold += v; out.push(kind === 'tub' ? `洗濯物の ポケットから ${v}ゴールドが でてきた！` : `${v}ゴールドを 見つけた！`); }
    else { const n = Math.max(1, Math.round(n0 * (.6 + hash(key + 'n') * .8))); K.gain(it, n); out.push(`${DATA.items[it].name}を ${n}こ 見つけた！`); }
    return out; }
  const searched = key => !!((G().searched || {})[key]);
  async function search(spot) { const g = G(); g.searched = g.searched || {}; const nm = NAME[spot.kind] || 'もの';
    if (searched(spot.key)) { await K.say([`${nm}を しらべた。 ……もう なにも ない。`]); return; }
    g.searched[spot.key] = 1; Music.sfx('pick'); const L = loot(spot); const eq = L.find(s => /そうびの 袋へ/.test(s)); // 武器・防具は 宝箱と 同じ 演出
    if (eq && K.fun && K.fun.reveal) await K.fun.reveal('legend', eq.replace(/を 手に入れた！.*$/, '').replace(/^.*「|」$/g, ''), `${nm}の 中から`); await K.say([`${nm}を しらべた！`, ...L]); K.hud(); K.save(); }
  // ---------- 花の 水やり・つみとり ----------
  const BLOOM = 45; // 水を やってから さくまで（秒）
  const gstate = id => { const g = G(); g.garden = g.garden || {}; const s = g.garden[id]; if (!s || !Number.isFinite(s.w)) return 0; return (g.play || 0) - s.w >= BLOOM ? 2 : 1; };
  async function garden(spot) { const g = G(); g.garden = g.garden || {}; const st = gstate(spot.key);
    if (st === 0) { g.garden[spot.key] = { w: g.play || 0 }; Music.sfx('heal'); K.toast('じょうろで 水を やった。 しばらく したら さきそうだ', 1800); K.save(); return; }
    if (st === 1) { K.toast('土が しっとり している。 もうすこし まとう', 1400); return; }
    delete g.garden[spot.key]; if (K.stat) K.stat('harvest'); const herb = spot.herb; const it = herb ? 'dokukeshi' : 'hana', n = 1 + (hash(spot.key + (g.play | 0)) < .4 ? 1 : 0); K.gain(it, n); Music.sfx('pick');
    const L = [`${herb ? '薬草' : '花'}を つみとった！ ${DATA.items[it].name}を ${n}こ 手に入れた！`]; if (!herb && hash(spot.key + 'm' + (g.play | 0)) < .25) { K.gain('mi', 1); L.push('木の実も 1こ なっていた！'); }
    await K.say(L); K.hud(); K.save(); }
  // ---------- 家の 中（地方ごとに 1部屋を 使いまわす） ----------
  const ROOM = [{ x: -262, z: -262, y: 92 }, { x: -262, z: -262, y: 92 }, { x: -262, z: -262, y: 92 }, { x: -262, z: -262, y: 92 }];
  const KIND = { yui: 'home', gen: 'smith', nagi: 'cook', nami: 'mayor', ryou: 'fisher', lab: 'scholar', soyogi: 'elder', ushio: 'elder', oelder: 'elder', ourana: 'mystic', hmill: 'mill', hhome: 'farm' };
  const NAMEH = { yui: 'ソラの 家', gen: 'ゲンの 工房', nagi: 'かざみ亭', nami: '町長ナミの 家', ryou: '漁師リョウの 家', lab: '研究所', soyogi: '長老ソヨギの 家', ushio: '長老ウシオの 家', oelder: '村長ハッサンの 家', ourana: '星占いウララの 家', hmill: '風車小屋', hhome: 'ハヤテの 家' };
  const SKIP = /^(ruin|inn|sinn|oinn|item|sitem|weapon|guild)/;
  const houses = r => [...K.REG[r].houses, ...(K.extraHouses || []).filter(h => h.r === r)].filter(h => h.npc && KIND[h.id] && !SKIP.test(h.id));
  const doorOf = h => { const dx = Math.sin(h.yaw), dz = Math.cos(h.yaw); return { x: h.npc.x - dx * 1.6, z: h.npc.z - dz * 1.6, out: { x: h.npc.x + dx * .4, z: h.npc.z + dz * .4 } }; };
  // 家具の 配置（部屋の 中の 座標 a,b：-4〜4。入口は b=+5、奥の 壁が b=-5）
  const BASE = [['bed', -3.5, -4, 0, 'bed'], ['tansu', -1.2, -4.3, 0, 'tansu'], ['shelf', 1, -4.4, 0, 'shelf'], ['counter', 4.1, -2.4, -Math.PI / 2, 'counter'], ['stove', 4, -4.1, 0, 'stove'], ['table', 0, -1, 0], ['chair', -.9, -1, Math.PI / 2], ['chair', .9, -1, -Math.PI / 2], ['rug', 0, 1.5, 0],
    ['barrel', 4, 1.2, 0, 'barrel'], ['pot', 3.9, 3.9, 0, 'pot'], ['pot', 3, 4, 0, 'pot'], ['tub', -3.8, 3.6, 0, 'tub'], ['rack', -4.3, 1.2, Math.PI / 2], ['flower0', -2.2, 4.2, 0, 'garden']];
  const EXTRA = {
    home: [['cat', 2, .5, 2.3]], smith: [['anvil', 2, -2.2, 0], ['crate', -3.8, -1.5, 0, 'crate', { smith: true, weapon: true }], ['crate', -3.8, -.6, 0, 'crate', { smith: true }]],
    cook: [['counter', 4.1, -.6, -Math.PI / 2, 'counter'], ['barrel', 3.2, 1.2, 0, 'barrel'], ['sack', 2.3, 4, 0, 'sack']], mayor: [['shelf', 2.6, -4.4, 0, 'shelf'], ['crate', -3.8, -1.5, 0, 'crate']],
    fisher: [['net', 0, -4.45, 0], ['barrel', 3.2, 1.2, 0, 'barrel'], ['crate', -3.8, -1.5, 0, 'crate']], scholar: [['shelf', 2.6, -4.4, 0, 'shelf'], ['shelf', -3.8, -1.6, Math.PI / 2, 'shelf'], ['crystal', 2.2, .5, 0]],
    elder: [['cat', 2, .5, 2.3], ['shelf', 2.6, -4.4, 0, 'shelf']], mystic: [['crystal', 0, -2.6, 0], ['shelf', 2.6, -4.4, 0, 'shelf']],
    mill: [['sack', -3.8, -1.5, 0, 'sack'], ['sack', -3.8, -.4, 0, 'sack'], ['sack', 2.3, 4, 0, 'sack'], ['loom', 2, -2.4, 0]], farm: [['sack', -3.8, -1.5, 0, 'sack'], ['flower0', -1, 4.2, 0, 'garden', { herb: true }]],
  };
  const FLOOR = { home: 0, smith: 1, cook: 0, mayor: 0, fisher: 0, scholar: 6, elder: 0, mystic: 6, mill: 0, farm: 0 }, WALL = { home: 4, smith: 6, cook: 4, mayor: 4, fisher: 5, scholar: 4, elder: 4, mystic: 6, mill: 5, farm: 5 };
  function buildShell(r) { const R0 = ROOM[r], prev = W.region; W.setRegion(r);
    for (let a = -9; a <= 9; a++) for (let b = -9; b <= 9; b++) { B.set(R0.x + a, R0.y - 1, R0.z + b, 1, true, r); B.set(R0.x + a, R0.y, R0.z + b, 0, true, r); }
    W.setRegion(prev); }
  function dressShell(r, kind) { const R0 = ROOM[r], prev = W.region; W.setRegion(r); const S = (a, h, b, t) => B.set(R0.x + a, R0.y + h, R0.z + b, t, true, r);
    for (let a = -8; a <= 8; a++) for (let b = -8; b <= 8; b++) { S(a, 0, b, FLOOR[kind] ?? 0); for (let h = 1; h <= 4; h++) B.rm(R0.x + a, R0.y + h, R0.z + b, r); }
    for (let a = -8; a <= 8; a++) for (let b = -8; b <= 8; b++) { if (Math.abs(a) < 10 && Math.abs(b) < 8) continue; for (let h = 1; h <= (b === 8 && Math.abs(a) < 8 ? 1 : 3); h++) { /* 入口がわの 壁は 低く（カメラから 中が 見える） */ const win = h === 2 && ((Math.abs(a) === 8 && (b === -2 || b === 2)) || (b === -8 && (a === -3 || a === 3))); S(a, h, b, Math.abs(a) === 8 && Math.abs(b) === 8 ? 5 : win ? 2 : (WALL[kind] ?? 4)); } }
    for (let a = -7; a <= 7; a++) for (let h = a === 0 ? 1 : 2; h <= 3; h++) S(a, h, 8, 19); // 戸口と 低い 壁の 上（見えない 壁：外は 空なので）
    W.setRegion(prev); }
  let cur = null; // { r, h, kind, props: [{k,x,z,yaw,kind,key,...}], back, pitch }
  function furnish(r, h) { const R0 = ROOM[r], kind = KIND[h.id] || 'home', list = [...BASE, ...(EXTRA[kind] || [])];
    const used = new Set(); const props = []; for (const [k, a, b, yaw, sk, opt] of list) { const key = `${a.toFixed(1)},${b.toFixed(1)}`; if (used.has(key)) continue; used.add(key);
      const p = { k, x: R0.x + a * 1.6 + .5, z: R0.z + b * 1.6 + .5, yaw: yaw || 0, kind: sk || null, ...(opt || {}) }; if (sk) p.key = `${r}:${h.id}:${sk}:${a},${b}`; props.push(p); }
    // 当たり判定（見えない ブロック）
    const prev = W.region; W.setRegion(r); for (const p of props) if (!['rug', 'net', 'cat', 'flower0'].includes(p.k)) { const cells = [[Math.floor(p.x), Math.floor(p.z)]]; if (p.k === 'bed') cells.push([Math.floor(p.x), Math.floor(p.z + .6)]);
      for (const [cx, cz] of cells) for (let h = 1; h <= 2; h++) B.set(cx, R0.y + h, cz, 19, true, r); } W.setRegion(prev);
    return props; }
  async function enter(h) { const r = G().region, d = doorOf(h); dressShell(r, KIND[h.id] || 'home'); const props = furnish(r, h); const R0 = ROOM[r];
    const nc = { r, h, kind: KIND[h.id] || 'home', props, back: d.out, pitch: K.cam.pitch };
    await K.fade(true); cur = nc; const p = K.player; p.x = R0.x + .5; p.z = R0.z + 6.5; p.y = R0.y + 1.02; p.vx = p.vy = p.vz = 0; K.trail.length = 0; K.enemies = []; K.cam.yaw = Math.PI; p.yaw = Math.PI; K.cam.pitch = Math.max(K.cam.pitch, .62); await K.wait(150); await K.fade(false);
    const g = K.G; g.housesIn = g.housesIn || {}; g.housesIn[`${r}:${h.id}`] = 1; K.toast(`${NAMEH[h.id] || '家'}に おじゃました`, 1500); }
  async function leave() { if (!cur) return; const c = cur; await K.fade(true); const p = K.player; p.x = c.back.x; p.z = c.back.z; p.y = K.surfaceAt(p.x, p.z, 99); p.vx = p.vy = p.vz = 0; K.trail.length = 0; K.cam.pitch = c.pitch; p.yaw = c.h.yaw; K.cam.yaw = c.h.yaw; cur = null; await K.wait(150); await K.fade(false); }
  const inRoom = () => cur && G().region === cur.r && Math.abs(K.player.x - ROOM[cur.r].x - .5) < 10 && Math.abs(K.player.z - ROOM[cur.r].z - .5) < 10 && K.player.y > ROOM[cur.r].y - 3;
  // ---------- 町の 外の しらべもの（樽・ツボ・木箱）と 花だん ----------
  const outside = {}; // town.key -> [{k,x,z,yaw,kind,key}]
  function outdoor(T) { if (outside[T.key]) return outside[T.key]; const TL = K.townLife; if (!TL) return []; const S = TL.setupTown(T); if (!S) return []; const r = T.r, prev = W.region; W.setRegion(r);
    try { const avoid = [...S.homes, ...S.lamps, ...S.plaza, ...S.lines, ...S.stalls, ...(S.seats || []), ...S.pens]; const L = [];
      const nC = 3 + T.lv, nF = 2 + Math.ceil(T.lv / 2);
      S.homes.forEach((hm, i) => { const sp = TL.near(r, hm, 1.6, 3.2, 70 + i * 7 + T.key.length, 2, [...avoid, ...L]); sp.forEach((p, j) => L.push({ k: (i + j) % 3 === 0 ? 'crate' : (i + j) % 2 ? 'barrel' : 'pot', x: p.x, z: p.z, yaw: (i * 1.7 + j) % 6.28 })); });
      const more = TL.near(r, S.c, 8, 22, 90 + T.key.length, Math.max(0, nC - L.length), [...avoid, ...L]); more.forEach((p, j) => L.push({ k: j % 2 ? 'pot' : 'barrel', x: p.x, z: p.z, yaw: j }));
      L.splice(nC + 2); L.forEach((o, j) => { o.kind = o.k; o.key = `o:${T.key}:${o.k}${j}`; if (o.k === 'crate' && j === 0 && T.lv >= 2) o.weapon = true; });
      const fl = TL.near(r, S.c, 5, 14, 120 + T.key.length, nF, [...avoid, ...L]); fl.forEach((p, j) => L.push({ k: 'flower', x: p.x, z: p.z, yaw: Math.atan2(S.c.x - p.x, S.c.z - p.z), kind: 'garden', key: `g:${T.key}:${j}`, herb: j === nF - 1 && T.farm }));
      // 当たり判定
      for (const o of L) { o.y = K.surfaceAt(o.x, o.z, 99); if (o.k !== 'flower') { const iy = Math.floor(o.y + .7); B.set(Math.floor(o.x), iy, Math.floor(o.z), 19, true, r); B.set(Math.floor(o.x), iy + 1, Math.floor(o.z), 19, true, r); } }
      return (outside[T.key] = L); } finally { W.setRegion(prev); } }
  // ---------- 毎フレーム ----------
  for (let r = 0; r < 4; r++) buildShell(r);
  let checked = false;
  H.frame.push((dt, T) => { for (const k in MESH) MESH[k].n = 0; if (K.phase !== 'field' || (K.B && K.B.active)) return; const g = G(), r = g.region, pl = K.player;
    if (!checked) { checked = true; const R0 = ROOM[r]; if (Math.abs(pl.x - R0.x) < 10 && Math.abs(pl.z - R0.z) < 10 && pl.y > R0.y - 3) { const t = K.REG[r].town; pl.x = t.x + 2; pl.z = t.z + 4; pl.y = K.surfaceAt(pl.x, pl.z, 99); K.trail.length = 0; } }
    const draw = (k, x, y, z, yaw) => { const m = meshOf(k); if (m.n < m.maxN) m.set(m.n++, x, y, z, 1, yaw); };
    if (cur && inRoom()) { K.enemies = []; const y0 = ROOM[r].y + 1; for (const p of cur.props) { let k = p.k; if (k === 'flower0' && p.key) k = 'flower' + gstate(p.key); let x = p.x, z = p.z, yaw = p.yaw;
        if (k === 'cat') { yaw = p.yaw + Math.sin(T * .4) * .8; x += Math.sin(T * .3) * .4; } draw(k, x, y0 + (['net'].includes(k) ? .9 : 0), z, yaw); } return; }
    if (cur && !inRoom()) { if (K.cam.pitch > cur.pitch) K.cam.pitch = cur.pitch; cur = null; }
    if (!K.townLife) return; for (const T0 of K.townLife.TOWNS) { if (T0.r !== r) continue; const c = T0.at(); if (!c || dist(c, pl) > 90) continue;
      for (const o of outdoor(T0)) draw(o.k === 'flower' ? 'flower' + gstate(o.key) : o.k, o.x, o.y, o.z, o.yaw); } });
  // ---------- しらべる ----------
  H.target.push(cand => { const g = G(), r = g.region, pl = K.player;
    if (cur && inRoom()) { const R0 = ROOM[r]; cand({ exit: 1 }, 'inExit', R0.x + .5, R0.z + 7.6, 1.4); for (const p of cur.props) if (p.kind) cand(p, p.kind === 'garden' ? 'garden' : 'inSearch', p.x, p.z, 1.5); return; }
    for (const h of houses(r)) { if (dist(h, pl) > 8) continue; const d = doorOf(h); cand(h, 'inEnter', d.x, d.z, 1.3); }
    if (K.townLife) for (const T0 of K.townLife.TOWNS) { if (T0.r !== r || !outside[T0.key]) continue; for (const o of outside[T0.key]) if (dist(o, pl) < 3) cand(o, o.kind === 'garden' ? 'garden' : 'inSearch', o.x, o.z, 1.6); } });
  H.labels.inEnter = t => `${NAMEH[t.o.id] || '家'}に 入る`; H.labels.inExit = '外へ 出る';
  H.labels.inSearch = t => `${NAME[t.o.kind] || 'もの'}を しらべる${searched(t.o.key) ? '（しらべた）' : ''}`;
  H.labels.garden = t => ['花に 水を やる', '花が そだっている', '花を つみとる'][gstate(t.o.key)];
  H.acts.inEnter = async h => enter(h); H.acts.inExit = async () => leave(); H.acts.inSearch = async o => search(o); H.acts.garden = async o => garden(o);
  H.load.push(g => { g.searched = g.searched || {}; g.garden = g.garden || {}; cur = null; checked = false; });
  K.interior = { KIND, NAMEH, houses, enter, leave, get cur() { return cur; }, outdoor, outside, search, garden, gstate, ROOM };
})();
