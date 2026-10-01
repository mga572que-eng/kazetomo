// 町の くらし（生活部署）— 住人が 時間で 動く・はたらく・学ぶ・買いものする・家に 帰る。町の にぎわいと 物価。
// 方針：既存の 住人（mobs.js）の 名前・台詞・役割は そのまま。位置は 時刻から 毎回 計算し、セーブには 何も 足さない。
// 設計：docs/design/town-life.md（総括プロデューサーの 品質基準つき）
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined' || !K.mobResidents) return; const H = K.HOOK, W = World;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  // ---------- 町の 設定（本編の 設定に あわせた にぎわい・物価） ----------
  const TOWNS = [
    { key: 'kazami', pre: 'k', r: 0, name: '風見の村', at: () => K.REG[0].town, pop: 40, lv: 2, price: .9, school: true, farm: true, extras: 3, note: '灯台守と 漁師の 小さな 村' },
    { key: 'shiomi', pre: 's', r: 0, name: '潮見の町 シオミ', at: () => K.shiomi, pop: 60, lv: 1, price: 1.2, school: false, farm: false, extras: 4, note: '半年前の 火事から 立ちなおり中。 物が 足りず 値が 高い' },
    { key: 'minato', pre: 'm', r: 1, name: '港町ミナト', at: () => K.REG[1].town, pop: 320, lv: 5, price: 1.1, school: true, farm: false, extras: 14, stalls: 4, note: '霧の大陸の 玄関口。 交易で にぎわう' },
    { key: 'oasis', pre: 'o', r: 1, name: 'オアシスの村 サラム', at: () => K.oasis, pop: 70, lv: 2, price: 1.25, school: false, farm: true, extras: 3, stalls: 1, note: '砂漠の 水場。 品物を 運ぶのが たいへんで 値が 高い' },
    { key: 'kukuru', pre: 'c', r: 2, name: '雲の里ククル', at: () => K.REG[2].town, pop: 110, lv: 3, price: 1.0, school: true, farm: false, extras: 6, stalls: 1, note: '雲の 上の 里。 おだやかな くらし' },
    { key: 'hayate', pre: 'h', r: 2, name: '風車の集落 ハヤテ', at: () => K.hayate, pop: 50, lv: 2, price: .95, school: false, farm: true, extras: 3, note: '風車と 畑の 集落' },
    { key: 'awa', pre: 'a', r: 3, name: 'アワの里', at: () => K.REG[3].town, pop: 130, lv: 3, price: 1.05, school: true, farm: false, extras: 6, stalls: 2, note: '泡に まもられた 海の底の 里' },
  ];
  const LV = ['', 'さびれぎみ', 'ひっそり', 'ほどほど', 'にぎやか', 'とても にぎやか'];
  const PRICE = p => p >= 1.2 ? '高い' : p > 1.04 ? 'やや 高い' : p < .93 ? '安い' : 'ふつう';
  // ---------- ふえた 町の人（通行人・郵便屋・見回り・先生・行商人） ----------
  const POOL = {
    kazami: [['mail', 'ゆうびんやの ポスト', ['てがみを とどけに きたよ！ 村は ちいさいけど、 坂が おおくて あしが パンパンさ。']], ['teacher', 'まなびやの せんせい', ['こどもたちは きょうも げんき いっぱい。 ……いっぱいすぎて こまるくらいよ。']], ['man', 'りょうしの マサ', ['あさの うみは しずかで いい。 灯が もどってから、 よるの りょうも こわくなくなった。']]],
    shiomi: [['man', 'だいくの テツ', ['やけた いえを ひとつずつ なおしてる。 まだまだ かかるが、 まちは きっと もどるさ。']], ['woman', 'ぎょうしょうの カヨ', ['ものが たりなくてね、 なんでも ちょっと たかいのよ。 ごめんなさいね。']], ['guard', 'みまわりの ジロウ', ['よるも みまわってる。 もう だれかの せいに しないで すむように な。']], ['woman', 'あらいものの ツル', ['いどの みずが つめたくて きもちいいよ。 せんたくものも すぐ かわくしね。']]],
    minato: [['mail', 'ゆうびんやの ハヤミ', ['ミナトは ひろいから、 いちにち 300つうは とどけるよ！']], ['guard', 'みなとの けいびへい', ['ふねが はいるたびに にもつを しらべる。 あやしい ものは ないか？']], ['merchant', 'こうえきしょうにん ドン', ['きりの たいりくじゅうの しなものが ここに あつまる。 みてくかい？']], ['merchant', 'くだものうりの リナ', ['あまい みつの み、 けさ ついたばかりだよ！']], ['man', 'にもつはこびの ゴウ', ['にもつ、 にもつ、 また にもつ！ ふねが くるたび おおいそがし だ。']], ['woman', 'りょうがえやの ミツ', ['いろんな くにの おかねが あつまるのさ。 かぞえるだけで ひが くれるよ。']], ['man', 'すいふの ガンジ', ['つぎの ふねは あさって でる。 それまで さかばで ひとやすみさ。']], ['woman', 'たびびとの エナ', ['ミナトは にぎやかね！ ふるさとの むらの 10ばいは ひとが いるわ。']], ['boy', 'つかいばしりの ピコ', ['しょうにんさんの おつかい！ はやく いかないと おこられちゃう！']], ['girl', 'はなうりの ルル', ['おはな いかが？ いちりん 5ゴールドだよ。']], ['teacher', 'がっこうの せんせい', ['この まちの こどもは、 よみかきも そろばんも できるのよ。']], ['oldm', 'ふなつきばの ろうじん', ['むかしは もっと ちいさな みなとだったんじゃ。 よう ここまで そだったもんじゃ。']], ['man', 'かじやの でし', ['ふねの くぎを うちつづけて うでが ぼうに なりそうだ。']], ['woman', 'おべんとううり', ['みなとの ひとは いそがしいからね。 おべんとうが よく うれるのよ。']]],
    oasis: [['merchant', 'らくだひきの サイ', ['さばくを こえて しなものを はこぶのさ。 だから すこし たかいのは かんべんな。']], ['woman', 'みずくみの ナジャ', ['いずみの みずは いのちの みず。 だいじに つかってね。']], ['guard', 'いずみの みはり', ['すなあらしの ひは だれも そとに でない。 きを つけな。']]],
    kukuru: [['mail', 'はねの ゆうびんや', ['くもの うえは かぜで とどけるのが いちばん はやいの。']], ['teacher', 'くものまなびや せんせい', ['ほしの なまえを おしえているの。 こどもたちは ハルの はなしが すきなのよ。']], ['woman', 'わたつみの ソラネ', ['くもわたを つんで ふとんに するの。 ふかふかよ。']], ['man', 'かぜよみの トキ', ['あしたは にしかぜ。 せんたくものが よく かわくぞ。']], ['girl', 'はねひろいの ミミ', ['きれいな はね、 あつめてるの！']], ['merchant', 'くもちゃの うりこ', ['くもちゃ いっぱい いかが？ からだが ふわっと かるくなるよ。']]],
    hayate: [['man', 'こなひきの ムギ', ['ふうしゃが まわれば こなが ひける。 かぜの おかげさ。']], ['woman', 'はたけの ナエ', ['くもの うえでも やさいは そだつのよ。 かぜが つよいけどね。']], ['boy', 'かざぐるまの ケン', ['かざぐるま、 だれよりも はやく まわすんだ！']]],
    awa: [['mail', 'あわの ゆうびんや', ['あわに いれて てがみを とどけるの。 ぬれないでしょ？']], ['teacher', 'さんごの まなびや せんせい', ['うえの せかいの おはなしを すると、 こどもたちの めが かがやくのよ。']], ['merchant', 'しんじゅうりの ハマ', ['しんじゅは いかが？ ちじょうの ひとには めずらしいでしょう。']], ['man', 'もりの きこりの ワカメ', ['こんぶの もりを かるのが しごと。 のびるのが はやくて こまるよ。']], ['girl', 'くらげあそびの ミズ', ['くらげ、 ぴかぴかして かわいいの！']], ['oldw', 'あわの ばあさま', ['あたしゃ いちども ちじょうに いったことが ないねえ。 いちど みてみたいもんだ。']]],
  };
  // ---------- 見た目（種類 × ポーズ＝関節で 腕と 足を ふる） ----------
  const LOOK = {
    man: [{ skin: '#e6c3a3', hair: '#654a32', top: '#6a9a9a', bottom: '#46485a', sleeve: 'rolled' }, { skin: '#d9ad86', hair: '#2e2a2a', top: '#b88952', bottom: '#4a3a30', belt: '#2a1a10' }],
    woman: [{ skin: '#f0cfb2', hair: '#4a3540', hairStyle: 'bob', top: '#ad667a', bottom: '#46485a', skirt: '#8a4a5a', apron: true }, { skin: '#e2b894', hair: '#8a5a30', hairStyle: 'bob', top: '#698bb3', bottom: '#3a3a4a', skirt: '#5a6a8a', shawl: '#f0e0c0' }],
    boy: [{ skin: '#f0cfb2', hair: '#3a2a20', top: '#e8a040', bottom: '#4a5a7a', kid: true }, { skin: '#e2b894', hair: '#5a3a20', top: '#7a925a', bottom: '#4a3a30', kid: true }],
    girl: [{ skin: '#f4d6bc', hair: '#6a3a2a', hairStyle: 'bob', top: '#f08aa0', bottom: '#5a4a6a', skirt: '#e86a8a', kid: true, flower: true }, { skin: '#f0cfb2', hair: '#2a2a3a', hairStyle: 'bob', top: '#a188b3', bottom: '#4a4a5a', skirt: '#8a6ab3', kid: true }],
    oldm: [{ skin: '#e0b896', hair: '#d8d8d8', top: '#7a6a5a', bottom: '#4a4038', beard: 'stubble' }, { skin: '#d8ae8a', hair: '#c8c8c8', top: '#5a6a7a', bottom: '#3a3a40', robe: true }],
    oldw: [{ skin: '#ecc8aa', hair: '#e0e0e0', hairStyle: 'bob', top: '#8a6a7a', bottom: '#4a4048', skirt: '#6a4a5a', shawl: '#c8a878' }, { skin: '#e6c0a0', hair: '#d0d0d0', hairStyle: 'bob', top: '#6a7a6a', bottom: '#3a4038', robe: true, apron: '#e8dcc0' }],
    mail: [{ skin: '#e8c4a0', hair: '#5a3a2a', top: '#d84a3a', bottom: '#2a3a5a', satchel: true, hat: true, accent: '#c83a2a' }],
    guard: [{ skin: '#e0b896', hair: '#3a3030', top: '#7a8aa8', bottom: '#3a3a44', pauldron: 'R', trim: '#c9ced6', spear: true }],
    merchant: [{ skin: '#d9ad86', hair: '#4a3020', top: '#c88a3a', bottom: '#5a4030', basket: true, belly: true, kerchief: true, accent: '#3a7a5a' }],
    teacher: [{ skin: '#f0cfb2', hair: '#3a2a2a', hairStyle: 'bob', top: '#4a6a5a', bottom: '#3a3a44', skirt: '#4a5a6a', glasses: true, notebook: true }],
  };
  const POSE = { stand: {}, walkA: { legL: .45, legR: -.45, armL: -.4, armR: .4 }, walkB: { legL: -.45, legR: .45, armL: .4, armR: -.4 }, work: { armR: 2.2, armL: .5 }, sit: { legL: 1.45, legR: 1.45, armL: .5, armR: .5 } };
  const PK = Object.keys(POSE);
  // 形は 使う ときに はじめて 作る（起動を 軽く する）
  const MESH = {}, built = [];
  const meshOf = (t, look, pose) => { const L = LOOK[t] || LOOK.man, li = look % L.length, k = t + li + pose; let m = MESH[k];
    if (!m) { const o = L[li]; m = MESH[k] = W.makeMesh(W.human({ ...o, spear: pose === 'work' ? false : o.spear, eye: [.3, .25, .2], pose: POSE[pose] }), 24); built.push(m); } return m; };
  // ---------- 小物：街灯・物干し・家畜・屋台・学び舎 ----------
  const { Geo, prism, ico, seg, hex, solid } = W;
  const geo = f => { const G = Geo(); f(G); return G; };
  const lampGeo = on => geo(G => { seg(G, [0, 0, 0], [0, 2.4, 0], .06, .05, 6, hex('#3a3030')); seg(G, [0, 2.35, 0], [.35, 2.45, 0], .03, .03, 4, hex('#3a3030'));
    prism(G, .16, .12, 1.95, 2.3, 6, solid(on ? [1, .82, .45] : [.75, .72, .62], on ? 1 : 0), .35, 0); prism(G, .2, .02, 2.3, 2.45, 6, hex('#2a2424'), .35, 0); });
  const clothCols = ['#f4f0e6', '#7ab0d8', '#e88a8a', '#f0d070', '#9ad08a'];
  const lineGeo = wash => geo(G => { for (const x of [-1.3, 1.3]) seg(G, [x, 0, 0], [x, 1.7, 0], .045, .04, 5, hex('#7a5a3a')); seg(G, [-1.3, 1.6, 0], [1.3, 1.6, 0], .012, .012, 3, hex('#e8e0d0'));
    if (wash) for (let k = 0; k < 4; k++) { const x = -.9 + k * .6; prism(G, .2, .2, 1.05 + (k % 2) * .15, 1.6, 4, hex(clothCols[(k + 1) % 5]), x, 0, 1, .12); } });
  const henGeo = geo(G => { ico(G, .17, [0, .2, 0], hex('#f4f0e6'), .04, 1, .85); ico(G, .1, [0, .38, .12], hex('#f4f0e6'), .02); ico(G, .045, [0, .49, .12], hex('#e03a3a'), 0); prism(G, .03, .0, .36, .36, 4, hex('#f0a020'), 0, .22, 1, 1); seg(G, [0, .37, .21], [0, .35, .27], .025, 0, 4, hex('#f0a020')); for (const sx of [-1, 1]) seg(G, [sx * .06, .08, 0], [sx * .06, 0, .02], .015, .015, 3, hex('#e0a030')); });
  const goatGeo = geo(G => { prism(G, .22, .22, .35, .7, 8, hex('#e8e0d0'), 0, 0, 1, 1.7); ico(G, .16, [0, .78, .38], hex('#e8e0d0'), .02); for (const sx of [-1, 1]) { seg(G, [sx * .07, .9, .34], [sx * .12, 1.05, .22], .03, .01, 4, hex('#8a7a6a')); for (const sz of [-1, 1]) seg(G, [sx * .12, .38, sz * .25], [sx * .12, 0, sz * .25], .04, .035, 4, hex('#d8d0c0')); } seg(G, [0, .62, .52], [0, .52, .55], .03, .01, 3, hex('#8a7a6a')); });
  const stallGeo = geo(G => { for (const [x, z] of [[-1, -.6], [1, -.6], [-1, .6], [1, .6]]) seg(G, [x, 0, z], [x, 2, z], .05, .05, 5, hex('#7a5a3a')); prism(G, 1.2, 1.2, .8, .9, 4, hex('#9a7048'), 0, 0, 1, .55);
    for (let k = 0; k < 6; k++) prism(G, .2, .2, 1.95, 2.15, 4, hex(k % 2 ? '#f4f0e6' : '#d84a3a'), -1 + k * .4, 0, 1, 3.4); for (let k = 0; k < 5; k++) ico(G, .1, [-.8 + k * .4, 1, 0], hex(['#e04a3a', '#f0c040', '#7ac04a', '#f08a3a', '#a04ac0'][k]), .05); });
  const boardGeo = geo(G => { for (const x of [-1, 1]) seg(G, [x, 0, 0], [x, 1.9, 0], .05, .05, 5, hex('#6a4a2e')); prism(G, 1.0, 1.0, .8, 1.8, 4, hex('#2e4a3a'), 0, 0, 1.05, .05); prism(G, 1.05, 1.05, 1.78, 1.86, 4, hex('#6a4a2e'), 0, 0, 1.05, .07); });
  const benchGeo = geo(G => { prism(G, .8, .8, .38, .45, 4, hex('#9a7048'), 0, 0, 1.1, .3); for (const x of [-.6, .6]) prism(G, .06, .06, 0, .4, 4, hex('#6a4a2e'), x, 0); });
  const M = { lampOn: W.makeMesh(lampGeo(true), 40), lampOff: W.makeMesh(lampGeo(false), 40), lineW: W.makeMesh(lineGeo(true), 16), line0: W.makeMesh(lineGeo(false), 16), hen: W.makeMesh(henGeo, 24), goat: W.makeMesh(goatGeo, 8), stall: W.makeMesh(stallGeo, 8), board: W.makeMesh(boardGeo, 4), bench: W.makeMesh(benchGeo, 16) };
  // ---------- 場所づくり ----------
  const thr = r => r === 2 ? 4 : .3;
  const houseHit = (r, x, z) => [...K.REG[r].houses, ...(K.extraHouses || []).filter(h => h.r === r)].some(h => Math.abs(x - h.x) < 3.6 && Math.abs(z - h.z) < 3.6);
  const okSpot = (r, x, z) => { const g = K.hAt(x, z), y = K.surfaceAt(x, z, 99); return Number.isFinite(y) && g >= thr(r) && Math.abs(y - g) < .4 && !K.blocked(x, z, y) && !houseHit(r, x, z) && [[.8, 0], [-.8, 0], [0, .8], [0, -.8]].every(([a, b]) => !K.blocked(x + a, z + b, y) && Math.abs(K.hAt(x + a, z + b) - g) < .7); };
  const near = (r, c, r0, r1, seed, n = 1, avoid = []) => { const out = []; let s = seed * 9301 + 49297; const rn = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let k = 0; k < 400 && out.length < n; k++) { const a = rn() * 6.283, d = r0 + rn() * (r1 - r0), x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d; if (okSpot(r, x, z) && ![...out, ...avoid].some(p => dist(p, { x, z }) < 2.2)) out.push({ x, z }); } return out; };
  const door = h => { if (!h.npc) return null; const dx = h.npc.x - h.x, dz = h.npc.z - h.z, L = Math.hypot(dx, dz) || 1; return { x: h.npc.x + dx / L * 1.2 + dz / L * 1.3, z: h.npc.z + dz / L * 1.2 - dx / L * 1.3 }; };
  const people = []; // { row?, npc, town, type, look, role, spots… }
  const towns = {};
  function setupTown(T) { if (towns[T.key]) return towns[T.key]; const c = T.at(); if (!c) return null; const r = T.r; const prev = W.region; W.setRegion(r);
    try {
      const S = { T, c, r, seed: T.key.length * 131 + T.r * 17 };
      const hs = [...K.REG[r].houses, ...(K.extraHouses || []).filter(h => h.r === r && !/^ruin/.test(h.id))].filter(h => dist(h, c) < 42);
      S.homes = hs.map(door).filter(p => p && okSpot(r, p.x, p.z)); if (S.homes.length < 3) S.homes.push(...near(r, c, 18, 30, S.seed + 1, 4 - S.homes.length));
      S.plaza = near(r, c, 3, 9, S.seed + 2, 6, S.homes);
      const shop = hs.filter(h => /item|weapon|sitem/.test(h.id)).map(door).filter(Boolean); S.market = shop.length ? shop : S.plaza.slice(0, 2);
      const inn = hs.filter(h => /inn/.test(h.id)).map(door).filter(Boolean); const bar = (K.townFeature && K.townFeature.bars || []).filter(b => b.r === r && dist(b, c) < 50).map(b => ({ x: b.x + 1.5, z: b.z + 1.5 }));
      S.food = [...inn, ...bar].filter(p => okSpot(r, p.x, p.z)); if (!S.food.length) S.food = S.plaza.slice(0, 1); S.bar = bar.length ? bar : S.food;
      S.lamps = near(r, c, 6, 26, S.seed + 3, Math.min(10, 4 + T.lv * 2), [...S.homes, ...S.plaza]);
      if (T.school) { const sc = near(r, c, 14, 24, S.seed + 4, 1, [...S.homes, ...S.lamps])[0]; if (sc) { S.school = sc; const a = Math.atan2(c.x - sc.x, c.z - sc.z); S.schoolYaw = a; S.seats = []; for (let i = 0; i < 6; i++) { const row = Math.floor(i / 3), col = i % 3 - 1; S.seats.push({ x: sc.x + Math.sin(a) * (2 + row * 1.3) + Math.cos(a) * col * 1.1, z: sc.z + Math.cos(a) * (2 + row * 1.3) - Math.sin(a) * col * 1.1 }); } } }
      S.stalls = T.stalls ? near(r, c, 8, 16, S.seed + 5, T.stalls, [...S.homes, ...S.lamps, ...S.plaza]) : [];
      S.lines = S.homes.slice(0, 3).map((h, i) => near(r, h, 2.5, 4.5, S.seed + 10 + i, 1, S.homes)[0]).filter(Boolean);
      S.pens = T.farm ? near(r, c, 16, 26, S.seed + 6, 2, [...S.homes, ...S.lamps]) : [];
      S.hens = S.pens.flatMap((p, i) => Array.from({ length: 3 }, (_, k) => ({ x: p.x + (k - 1) * .6, z: p.z + (i % 2 ? .4 : -.4), yaw: k * 2.1, home: p, goat: k === 0 && T.key === 'oasis' })));
      S.walk = [...S.plaza, ...S.lamps, ...S.market];
      towns[T.key] = S; return S;
    } finally { W.setRegion(prev); } }
  // ---------- 住人の 役割 ----------
  const CRAFT = /だいく|きこり|かじ|はたけ|あみ|おりて|こなひき|わた|ふねだいく|きんづち/;
  const SHOP = /や[の ]|みせ|おかみ|やど|マスター|うり|しょうにん/;
  const GUARD = /みはり|ばん|けいび|みまわり/;
  function roleOf(type, name, i) { if (type === 'mail') return 'mail'; if (type === 'guard' || GUARD.test(name)) return 'guard'; if (type === 'teacher') return 'teacher'; if (type === 'merchant') return 'shop';
    if (type === 'boy' || type === 'girl') return 'kid'; if (type === 'oldm' || type === 'oldw') return 'elder'; if (SHOP.test(name)) return 'shop'; return i % 3 === 0 ? 'barfly' : 'worker'; }
  function addPeople() { const D = K.mobResidents.data;
    for (const T of TOWNS) { const rows = D.filter(d => d.id.startsWith('mob_gem_' + T.pre)); rows.forEach((row, i) => { people.push({ row, id: row.id, town: T, type: LOOK[row.t] ? row.t : 'man', look: i % 2, role: roleOf(row.t, row.nm, i), i, work: { x: row.x, z: row.z } }); });
      (POOL[T.key] || []).slice(0, T.extras).forEach(([type, nmTxt, lines], k) => { const id = `tl_${T.key}_${k}`; const n = { id, r: T.r, nm: nmTxt, x: 0, z: 0, yaw: 0, baseYaw: 0, life: true }; n.show = () => !n.indoor && n.placed; K.NPCS.push(n);
        H.talks[id] = async () => { await K.say(lines.map(t => K.nm(nmTxt, t))); };
        people.push({ id, npc: n, town: T, type, look: k % (LOOK[type] || [0]).length, role: roleOf(type, nmTxt, k + 1), i: rows.length + k, extra: true, work: null }); }); } }
  // ---------- 1日の 予定（時刻 → 行き先と 行動） ----------
  const pick = (arr, i) => arr && arr.length ? arr[i % arr.length] : null;
  function plan(p, h, S) { const i = p.i, home = pick(S.homes, i), work = p.work || pick(S.market, i) || pick(S.plaza, i), plaza = pick(S.plaza, i + Math.floor(h / 2)), market = pick(S.market, i + 1), food = pick(S.food, i), bar = pick(S.bar, i);
    const R = p.role, night = h < 5.5 || h >= 21.5;
    if (R === 'guard') { const k = Math.floor(h * 1.5 + i) % S.walk.length; return { to: S.walk[k] || plaza, act: 'stand' }; }
    if (R === 'mail') { if (h < 8 || h >= 17) return { to: home, act: 'home' }; return { to: pick([...S.homes, ...S.market, ...S.food], Math.floor(h * 2) + i), act: 'stand' }; }
    if (R === 'teacher') { if (S.school && h >= 8 && h < 15 && !(h >= 12 && h < 13)) return { to: S.school, act: 'stand', yaw: S.schoolYaw + Math.PI }; if (h >= 15 && h < 18) return { to: market, act: 'stand' }; return { to: home, act: h < 20 ? 'stand' : 'home' }; }
    if (R === 'kid') { if (h < 6.5 || h >= 20) return { to: home, act: 'home' }; if (S.school && ((h >= 8 && h < 12) || (h >= 13 && h < 15))) return { to: S.seats[i % S.seats.length], act: 'sit', yaw: S.schoolYaw };
      if (!S.school && h >= 8 && h < 12) return { to: pick(S.market, i) || work, act: 'stand' }; if (h >= 15 && h < 18) return { to: pick(S.walk, i + Math.floor(h * 6)), act: 'stand', run: true }; return { to: home, act: 'stand' }; }
    if (R === 'elder') { if (h < 6 || h >= 20.5) return { to: home, act: 'home' }; if ((h >= 9 && h < 12) || (h >= 14 && h < 17)) return { to: pick(S.walk, i + Math.floor(h)), act: h < 12 ? 'stand' : 'sit', slow: true }; return { to: home, act: 'sit' }; }
    if (night) return { to: home, act: 'home' };
    if (R === 'shop') { if (h >= 7 && h < 20) return { to: work, act: 'stand' }; return { to: home, act: 'stand' }; }
    if (h < 7) return { to: home, act: 'stand' }; if (h < 12 || (h >= 13 && h < 17)) return { to: work, act: CRAFT.test(p.row ? p.row.nm : '') ? 'work' : 'stand' };
    if (h < 13) return { to: food, act: 'stand' }; if (h < 18.5) return { to: market, act: 'stand' };
    if (R === 'barfly' && h < 21.5) return { to: bar, act: 'stand' }; return { to: plaza || home, act: 'stand' }; }
  // ---------- 動かす ----------
  const okStep = (r, x, z, y) => K.hAt(x, z) >= thr(r) && !K.blocked(x, z, y) && Math.abs(K.surfaceAt(x, z, y + 1.1) - y) < .6;
  const npcOf = p => p.npc || (p.npc = K.NPCS.find(n => n.id === p.id));
  let profileShown = null;
  function step(p, S, h, dt, T) { const n = npcOf(p); if (!n) return; if (p.row && n.mobVisible === false) return; const P = plan(p, h, S); const to = P.to || S.c;
    if (!p.st) { p.st = { x: to.x, z: to.z }; n.x = to.x; n.z = to.z; n.placed = true; }
    const pl = K.player, far = dist(n, pl) > 70; const d = dist(n, to);
    if (far) { n.x = to.x; n.z = to.z; n.placed = true; } // 見えない ところでは 歩かせない（軽く する）
    else if (d > .35) { const sp = (P.run ? 2.4 : P.slow ? .8 : p.role === 'kid' ? 1.6 : 1.25) * dt; const y = K.surfaceAt(n.x, n.z, 99); const a0 = Math.atan2(to.x - n.x, to.z - n.z); let moved = false;
      for (const da of [0, .6, -.6, 1.2, -1.2, 1.9, -1.9]) { const a = a0 + da, nx = n.x + Math.sin(a) * Math.min(sp, d), nz = n.z + Math.cos(a) * Math.min(sp, d); if (okStep(S.r, nx, nz, y)) { n.x = nx; n.z = nz; n.yaw = a; moved = true; p.walk = (p.walk || 0) + Math.min(sp, d); break; } }
      if (p.tgt !== to) { p.tgt = to; p.tt = 0; } p.tt += dt; // 遠回りが 長すぎる ときも、見ていなければ 着いた ことに する
      p.stuck = moved ? 0 : (p.stuck || 0) + dt; if ((p.stuck > 2.5 && dist(n, pl) > 18) || (p.tt > 25 && dist(n, pl) > 12)) { n.x = to.x; n.z = to.z; p.stuck = 0; p.tt = 0; } p.moving = moved; }
    else p.moving = false;
    n.indoor = P.act === 'home' && d < 1.2; if (P.act === 'home' && far) n.indoor = true;
    if (!p.moving) n.yaw = P.yaw != null ? P.yaw : (dist(n, pl) < 5 ? Math.atan2(pl.x - n.x, pl.z - n.z) : (n.baseYaw || n.yaw || 0));
    p.pose = p.moving ? ((Math.floor((p.walk || 0) / .42) % 2) ? 'walkA' : 'walkB') : P.act === 'sit' ? 'sit' : P.act === 'work' ? ((Math.floor(T * 2.2 + p.i) % 2) ? 'work' : 'stand') : 'stand'; p.act = P.act; }
  // ---------- 毎フレーム ----------
  let ready = false;
  const lifeOn = () => K.phase === 'field' && !(K.B && K.B.active) && !(H.OPT && H.OPT.townlife === false);
  H.frame.push((dt, T) => { for (const m of built) m.n = 0; for (const k in M) M[k].n = 0;
    if (!lifeOn()) return; if (!ready) { addPeople(); ready = true; }
    const G = K.G, r = G.region, h = (G.tod * 24) % 24, night = h < 5.8 || h >= 18, pl = K.player;
    let here = null;
    for (const T0 of TOWNS) { if (T0.r !== r) continue; const c = T0.at(); if (!c || dist(c, pl) > 110) continue; const S = setupTown(T0); if (!S) continue; if (dist(c, pl) < 40) here = T0;
      for (const p of people) if (p.town === T0) step(p, S, h, Math.min(dt, .1), T);
      // 小物
      for (const L of S.lamps) { const m = night ? M.lampOn : M.lampOff; if (m.n < m.maxN) m.set(m.n++, L.x, K.surfaceAt(L.x, L.z, 99), L.z, 1, 0); }
      for (const L of S.lines) { const m = h >= 7 && h < 17 ? M.lineW : M.line0; if (m.n < m.maxN) m.set(m.n++, L.x, K.surfaceAt(L.x, L.z, 99), L.z, 1, (L.x * 7 + L.z) % 3); }
      for (const s of S.stalls) if (M.stall.n < M.stall.maxN) M.stall.set(M.stall.n++, s.x, K.surfaceAt(s.x, s.z, 99), s.z, 1, Math.atan2(S.c.x - s.x, S.c.z - s.z));
      if (S.school) { M.board.set(M.board.n++, S.school.x, K.surfaceAt(S.school.x, S.school.z, 99), S.school.z, 1, S.schoolYaw); for (const s of S.seats) if (M.bench.n < M.bench.maxN) M.bench.set(M.bench.n++, s.x, K.surfaceAt(s.x, s.z, 99) - .02, s.z, 1, S.schoolYaw + Math.PI / 2); }
      for (const e of S.hens) { if (!night) { e.yaw += (Math.sin(T * .7 + e.x) * .8) * dt; const nx = e.x + Math.sin(e.yaw) * .25 * dt, nz = e.z + Math.cos(e.yaw) * .25 * dt; if (dist({ x: nx, z: nz }, e.home) < 2.2 && okSpot(S.r, nx, nz)) { e.x = nx; e.z = nz; } else e.yaw += 2; }
        const m = e.goat ? M.goat : M.hen; if (m.n < m.maxN) m.set(m.n++, e.x, K.surfaceAt(e.x, e.z, 99) + (night ? 0 : Math.abs(Math.sin(T * 6 + e.x)) * .03), e.z, 1, e.yaw); } }
    // 住人を 描く
    for (const p of people) { if (p.town.r !== r) continue; const n = npcOf(p); if (!n || !n.placed || n.indoor || (p.row && n.mobVisible === false) || dist(n, pl) > 85) continue;
      const m = meshOf(p.type, p.look, p.pose || 'stand'); if (m.n < m.maxN) m.set(m.n++, n.x, K.surfaceAt(n.x, n.z, 99) + (p.pose === 'sit' ? -.32 : 0), n.z, 1, n.yaw || 0); }
    // 町に 入ったら ようすを 一言
    if (here && profileShown !== here.key) { profileShown = here.key; K.toast(`${here.name}　人口 およそ${here.pop}人・${LV[here.lv]}・物価 ${PRICE(here.price)}`, 2600); } else if (!here && profileShown && !TOWNS.some(t => t.key === profileShown && t.r === r && dist(t.at() || { x: 1e9, z: 1e9 }, pl) < 60)) profileShown = null;
  });
  // ---------- 物価（宿・道具屋の 買値に かける） ----------
  K.townHere = () => { const r = K.G.region, pl = K.player; return TOWNS.find(t => t.r === r && t.at() && dist(t.at(), pl) < 45) || null; };
  H.priceK = () => { const t = K.townHere(); return t ? t.price : 1; };
  K.townLife = { on: true, TOWNS, towns, people, plan, setupTown, near, okSpot };
})();
