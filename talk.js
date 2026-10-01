// ともしびアイランド — 仲間会話（いつでも 仲間に 話しかけられる）
// ・メニュー「はなす」→ 話す 相手を えらぶ（または「みんなで」）
// ・場面（町・灯台・祠・海の底・夜・戦いの あと・HPが すくない）と 物語の 進み具合で セリフを えらぶ
// ・一度 聞いた セリフは G.talkSeen に 記録し、くり返さない（ぜんぶ 聞いたら 短い 反応セリフを 順番に）
// セリフを 足すとき：下の L に { id, w: 話す人, need: [いっしょに いる 人], when: c => 条件, pri: 優先度, s: c => [セリフ] } を 足す。id は 変えない（既読の 記録に つかう）
'use strict';
(() => {
  const K = window.KZ; if (!K || !K.HOOK) return; const H = K.HOOK;
  const G = () => K.G, F = () => K.G.flags;
  const W = (id, f, t) => K.who(id, f, t), N = (n, t) => K.nm(n, t);
  const has = id => id === 'sora' || K.inParty(id);
  const d2 = (a, x, z) => a ? Math.hypot(a.x - x, a.z - z) : 1e9;

  // ---------- 場面を しらべる ----------
  let lastBattle = null;
  H.battleEnd.push(async (res, specs, opts, P) => { const hurt = (P || []).filter(m => m.st && m.hp < m.st.hp * .35).length;
    lastBattle = { res, boss: !!(opts && opts.boss) || (specs || []).some(s => s && s.boss), hurt, at: performance.now() }; });
  function ctx() { const g = G(), f = F(), p = K.player, r = g.region, R0 = K.REG[r] || {};
    const town = d2(R0.town, p.x, p.z) < 34, shiomi = r === 0 && K.shiomi && d2(K.shiomi, p.x, p.z) < 30;
    const beacon = r === 0 && (R0.beacons || []).find(b => d2(b, p.x, p.z) < 26);
    const lh = r === 3 && (R0.lh || []).find(b => d2(b, p.x, p.z) < 26);
    const shrine = (K.shrinesHere ? K.shrinesHere(r) : []).find(s => d2(s.pos, p.x, p.z) < 14) || (r === 2 && (R0.shrines || []).find(s => d2(s, p.x, p.z) < 18));
    const palace = r === 3 && d2(R0.palace, p.x, p.z) < 40, tower = r === 2 && d2(R0.tower, p.x, p.z) < 40, ruins = r === 1 && World.RUINS1 && Math.hypot(World.RUINS1[0] - p.x, World.RUINS1[1] - p.z) < 34;
    const night = World.skyInfo(g.tod).night > .5;
    const hs = g.party.filter(m => m.st); const hp = hs.length ? hs.reduce((a, m) => a + m.hp / m.st.hp, 0) / hs.length : 1;
    const lb = lastBattle && performance.now() - lastBattle.at < 90000 ? lastBattle : null;
    const ch = f.c4start ? 4 : f.c3start || f.c2done ? 3 : f.cleared ? 2 : 1;
    const place = shiomi ? 'shiomi' : town ? 'town' : beacon ? 'beacon' : lh ? 'lh' : shrine ? 'shrine' : palace ? 'palace' : tower ? 'tower' : ruins ? 'ruins' : 'field';
    return { r, f, ch, place, town, beacon, lh, shrine, night, hp, lb, sky: r === 2, sea: r === 3, swim: !!p.swim, glide: !!p.glide, mons: g.mons || [], name: g.name || 'ソラ' }; }

  // ---------- セリフ（w：話す人） ----------
  const L = [
    // ===== ミオ =====
    { id: 'mio_island_night', w: 'mio', when: c => c.r === 0 && c.night, pri: 3, s: () => [W('mio', 'worried', '……夜の 海って、黒い 布みたい。 わたし、ちょっと にがて。'), W('mio', 'smile', 'でも 灯台が 光ってると、だいじょうぶって 思えるの。 {name}が ともしたんだよ。')] },
    { id: 'mio_kaito_save', w: 'mio', when: c => c.ch === 1, pri: 2, s: () => [W('mio', 'neutral', 'ちいさい ころ、わたし 海で おぼれたの。 ひっぱりあげて くれたのが、カイトさん。'), W('mio', 'smile', 'だから {name}の お父さんは、わたしの 恩人でも あるんだよ。 ……ぜったい、また 会おうね。')] },
    { id: 'mio_voice', w: 'mio', when: c => c.ch <= 2, pri: 2, s: () => [W('mio', 'neutral', 'かげものの こえ、たまに 聞こえるの。 「さむい」とか「ひとりは いやだ」とか。'), W('mio', 'sad', 'たたかうたびに、ちょっとだけ ごめんねって 思う。 ……へん、かな。')] },
    { id: 'mio_after_hard', w: 'mio', when: c => c.lb && c.lb.hurt >= 2, pri: 6, s: () => [W('mio', 'worried', 'いまの、あぶなかったね……。 みんな、けが 見せて。'), W('mio', 'determined', '歌で なおせる ぶんは なおすから。 むりは しないって、約束して。')] },
    { id: 'mio_low_hp', w: 'mio', when: c => c.hp < .45, pri: 7, s: () => [W('mio', 'worried', '{name}、顔色が わるいよ。 一度 やすもう？'), W('mio', 'smile', '宿屋か、たき火か。 あったかい ところで ねむれば、だいたい なおるんだよ。')] },
    { id: 'mio_shiomi', w: 'mio', when: c => c.place === 'shiomi', pri: 4, s: () => [W('mio', 'sad', 'シオミの 人たち、リクの こと「疫病神」って 呼んでたんだって。'), W('mio', 'determined', 'こわいと、人は だれかの せいに したくなるの。 ……わかるけど、ゆるさない。')] },
    { id: 'mio_continent_town', w: 'mio', when: c => c.r === 1 && c.place === 'town', pri: 3, s: () => [W('mio', 'joy', 'みて みて！ 屋台に 見たこと ない 果物が ある！'), W('mio', 'grin', '……あ、ちがうよ？ 研究だよ？ 島に もって帰って 歌に するの。')] },
    { id: 'mio_sky', w: 'mio', when: c => c.sky, pri: 3, s: () => [W('mio', 'surprised', '雲の 上って、音が すくないね。 自分の 心臓の 音が 聞こえる。'), W('mio', 'smile', '……ここで 歌ったら、どこまで とどくかな。')] },
    { id: 'mio_sea', w: 'mio', when: c => c.sea, pri: 3, s: () => [W('mio', 'worried', '海の底は まっくら……と 思ってたけど、光る ものが いっぱい いるね。'), W('mio', 'smile', 'くらい ところにも、ちゃんと 灯は あるんだ。')] },
    { id: 'mio_mons', w: 'mio', when: c => c.mons.length >= 2, pri: 2, s: c => [W('mio', 'grin', `${K.nameOf(c.mons[0])}が「ごはん まだ？」って 言ってるよ。`), W('mio', 'smile', '……ほんとだよ？ わたしの 耳は うそ つかないもん。')] },
    { id: 'mio_fear_dark', w: 'mio', when: c => c.place === 'beacon' || c.place === 'lh', pri: 3, s: () => [W('mio', 'worried', '灯台の 中って、階段の 音が ひびくね……。'), W('mio', 'determined', 'だいじょうぶ。 {name}の うしろ、ちゃんと ついていく。')] },
    { id: 'mio_after_c1', w: 'mio', when: c => c.f.cleared && !c.f.c2done, pri: 2, s: () => [W('mio', 'smile', 'カイトさん、帰ってきて よかったね。'), W('mio', 'neutral', '……でも あの 夜から、{name}、ときどき とおくを 見てる。 まだ なにか、気に なってる？')] },
    // ===== リク =====
    { id: 'riku_join', w: 'riku', when: c => c.ch === 1, pri: 3, s: () => [W('riku', 'smirk', 'おい 甘ちゃん。 さっきの たたかい、目 つぶってたろ。'), W('sora', 'surprised', 'つ、つぶってないよ！'), W('riku', 'grin', '……ま、逃げなかったのは みとめてやる。')] },
    { id: 'riku_shiomi', w: 'riku', when: c => c.place === 'shiomi', pri: 6, s: () => [W('riku', 'neutral', '……この 町の 坂、石が よく 転がってたろ。'), W('riku', 'smirk', 'おれに 向かってな。 ……気に すんな。 もう 痛くねえよ。'), W('mio', 'sad', '……リク。')] },
    { id: 'riku_shiomi2', w: 'riku', when: c => c.place === 'shiomi' && c.f.cleared, pri: 4, s: () => [W('riku', 'neutral', 'リョウの やつ、頭 さげに 来やがった。'), W('riku', 'smirk', '……ゆるしたかって？ さあな。 でも、魚は うまかった。')] },
    { id: 'riku_home', w: 'riku', when: c => c.r === 0 && c.night, pri: 2, s: () => [W('riku', 'sad', 'おれの 町も、こんな 夜に 闇に 喰われた。'), W('riku', 'determined', '……だから 灯台は きらいじゃねえ。 あれが あれば、迷子が 帰ってこれる。')] },
    { id: 'riku_sana_search', w: 'riku', when: c => c.r === 1 && !c.f.c2done, pri: 5, s: () => [W('riku', 'determined', 'サナは この 大陸の どこかに いる。 星読みの 巫女なんて、目立つはずだ。'), W('riku', 'angry', '……見つけたら、二度と 手を はなさねえ。')] },
    { id: 'riku_after_sana', w: 'riku', need: ['sana'], when: c => c.f.c2done, pri: 4, s: () => [W('riku', 'smirk', 'サナの やつ、朝から おれの 槍を みがいてやがった。'), W('riku', 'neutral', '……たのんで ねえのに。 ったく。'), W('sana', 'smile', '兄さん、顔が にやけてますよ。')] },
    { id: 'riku_heights', w: 'riku', when: c => c.sky, pri: 3, s: () => [W('riku', 'grin', 'へえ、{name}。 高い ところ、にがてなんだって？'), W('sora', 'worried', 'に、にがてじゃ ないよ！ ……下を 見なければ。'), W('riku', 'smirk', '見てんじゃねえか。')] },
    { id: 'riku_low_hp', w: 'riku', when: c => c.hp < .4, pri: 6, s: () => [W('riku', 'angry', 'おい、ふらふらじゃねえか。 意地 はって 死んだら、ただの ばかだぞ。'), W('riku', 'neutral', '……おれが 言うなって？ だから 言ってんだよ。')] },
    { id: 'riku_boss_win', w: 'riku', when: c => c.lb && c.lb.boss && c.lb.res === 'win', pri: 7, s: () => [W('riku', 'grin', 'はっ、どうだ。 あんな でかぶつ、おれと {name}で 十分だ。'), W('riku', 'neutral', '……いや、みんなで、だな。 言いなおす。')] },
    { id: 'riku_flee', w: 'riku', when: c => c.lb && c.lb.res === 'flee', pri: 6, s: () => [W('riku', 'smirk', '逃げたな。'), W('riku', 'neutral', '……責めてねえよ。 生きて 帰るのも 腕の うちだ。')] },
    { id: 'riku_sea', w: 'riku', when: c => c.sea, pri: 3, s: () => [W('riku', 'worried', '……海の底か。 おれの 町を 喰った 闇も、ここから 来たのかもな。'), W('riku', 'determined', 'なら ちょうどいい。 礼を 言いに 行く。')] },
    { id: 'riku_cook', w: 'riku', when: c => c.place === 'town' && !c.night, pri: 1, s: () => [W('riku', 'neutral', '市場で 値切ってきた。 魚 三匹で 二匹ぶんだ。'), W('mio', 'surprised', 'リク、そういうの じょうずなんだ……。'), W('riku', 'smirk', 'ひとりで 生きてりゃ、いやでも うまくなる。')] },
    // ===== サナ =====
    { id: 'sana_guilt', w: 'sana', when: c => c.f.c2done && c.ch <= 3, pri: 4, s: () => [W('sana', 'sad', '星喰いに「はい」と 言ったのは、わたしです。 兄さんを たすけたくて……。'), W('sana', 'determined', 'だから こんどは、自分の 足で つぐないます。 {name}さん、つかって ください。'), W('sora', 'smile', 'つかうんじゃ ないよ。 いっしょに 行くんだよ。')] },
    { id: 'sana_stars', w: 'sana', when: c => c.night, pri: 3, s: () => [W('sana', 'smile', '今夜は 星が よく 見えます。 あれが 旅人の 星、あっちが 帰り道の 星。'), W('sana', 'neutral', '……星は うそを つきません。 読む 人が、まちがえるだけで。')] },
    { id: 'sana_desert', w: 'sana', when: c => c.r === 1 && c.place !== 'town', pri: 2, s: () => [W('sana', 'worried', '砂漠の 夜は、ひどく 冷えます。 兄さん、上着は？'), W('riku', 'neutral', '……もってる。'), W('sana', 'smile', 'うそですね。 星が そう 言ってます。')] },
    { id: 'sana_ruins', w: 'sana', when: c => c.place === 'ruins', pri: 5, s: () => [W('sana', 'sad', 'この 遺跡で、わたしは ながい 夢を 見ていました。'), W('sana', 'determined', '……もう 夢は 見ません。 目を あけて、ここに 立ちます。')] },
    { id: 'sana_sky', w: 'sana', when: c => c.sky, pri: 3, s: () => [W('sana', 'joy', '星が こんなに 近い……！ 手を のばせば、とどきそう です。'), W('sana', 'smile', '……あ、すみません。 はしゃいで しまいました。')] },
    { id: 'sana_hp', w: 'sana', when: c => c.hp < .45, pri: 6, s: () => [W('sana', 'worried', 'みなさん、つかれが 顔に 出ています。 星も 雲に かくれました。'), W('sana', 'smile', '今日は もう、やすみましょう。 明日の 星は、きっと 晴れです。')] },
    // ===== ハル =====
    { id: 'haru_memory', w: 'haru', when: c => c.sky && !c.f.c3done, pri: 4, s: () => [W('haru', 'neutral', '……なにも おぼえて ないの。 自分の ほんとの 名前も。'), W('haru', 'closed', 'でも 子守歌だけ 知ってる。 だれが 歌って くれたのかは、わからない。')] },
    { id: 'haru_wind', w: 'haru', when: c => c.sky, pri: 2, s: () => [W('haru', 'neutral', '風が 西に まがった。 雨が くる。'), W('haru', 'smile', '……雲の 上の 雨は、下に ふるだけ。 ここは ぬれない。')] },
    { id: 'haru_island', w: 'haru', when: c => c.r === 0 && c.f.c3done, pri: 5, s: () => [W('haru', 'sad', 'この 島の 風、知ってる 気が する。'), W('haru', 'closed', '……お父さんが、灯台の 上で 待ってた 風。')] },
    { id: 'haru_alone', w: 'haru', when: c => c.hp < .5, pri: 5, s: () => [W('haru', 'neutral', 'わたしは へいき。 ひとりで なんとか なる。'), W('mio', 'worried', 'ハル、それ 三回目だよ。'), W('haru', 'surprised', '……そう？'), W('haru', 'smile', 'じゃあ、すこし だけ たよる。')] },
    { id: 'haru_glide', w: 'haru', when: c => c.sky && c.f.glider2, pri: 2, s: () => [W('haru', 'grin', '{name}の 風布、さいしょより ずっと うまく なった。'), W('haru', 'smile', '落ちる まえに 風を つかむ。 それだけ。 ……かんたんでしょ？')] },
    // ===== カイト =====
    { id: 'kaito_sorry', w: 'kaito', when: c => c.ch === 4, pri: 5, s: () => [W('kaito', 'sad', '三年も 家を あけた 父親が、いまさら いっしょに 旅か。'), W('kaito', 'neutral', '……ユイには 頭が あがらん。 {name}、おまえにもだ。'), W('sora', 'smile', 'じゃあ、帰ったら いっしょに あやまろう。')] },
    { id: 'kaito_light', w: 'kaito', when: c => c.place === 'lh', pri: 6, s: () => [W('kaito', 'determined', '沈んだ 灯台にも、灯の 道は のこってる。'), W('kaito', 'smile', '灯は、帰る場所の しるしだ。 ……海の底の 連中にも、帰る 場所は あっていい。')] },
    { id: 'kaito_gen', w: 'kaito', when: c => c.r === 0, pri: 3, s: () => [W('kaito', 'neutral', '兄貴の 打った いかりは、いまでも 手に なじむ。'), W('kaito', 'grin', '……本人には 言うなよ。 調子に のる。')] },
    { id: 'kaito_teach', w: 'kaito', when: c => c.lb && c.lb.res === 'win', pri: 3, s: () => [W('kaito', 'smile', 'いい 間合いだった、{name}。 足が ふるえて なかった。'), W('sora', 'joy', 'ほんと！？'), W('kaito', 'grin', '……すこしだけ ふるえてた。')] },
    { id: 'kaito_sea', w: 'kaito', when: c => c.sea && c.night, pri: 2, s: () => [W('kaito', 'neutral', 'この 底で 三年、空の かわりに 泡を 見てた。'), W('kaito', 'sad', '……夜に なると、ユイの 薬草の においを 思いだした。')] },
    // ===== ソラ と みんな（かけあい） =====
    { id: 'all_first_talk', w: 'sora', need: ['mio'], when: () => true, pri: 9, s: () => [W('sora', 'smile', 'ねえ、ミオ。 旅って、思ってたより しずかだね。'), W('mio', 'smile', 'うん。 でも わたしは すき。 歩きながら、いろんな 話が できるから。'), '（メニューの「はなす」で、いつでも 仲間と 話せる）'] },
    { id: 'all_rain_lunch', w: 'mio', need: ['riku'], when: c => c.place === 'field' && !c.night, pri: 2, s: () => [W('mio', 'smile', 'ねえ、お昼 どうする？'), W('riku', 'neutral', '干し肉。'), W('mio', 'sad', '……昨日も 干し肉だった。'), W('riku', 'smirk', 'あしたも 干し肉だ。')] },
    { id: 'all_sleep_talk', w: 'riku', need: ['mio'], when: c => c.night, pri: 2, s: () => [W('riku', 'smirk', 'ゆうべ、甘ちゃんが ねごとで「灯台…… のぼれない……」って 言ってた。'), W('sora', 'surprised', 'い、言ってないよ！'), W('mio', 'grin', '言ってたよ。 三回。')] },
    { id: 'all_sana_riku', w: 'sana', need: ['riku'], when: c => c.f.c2done && c.place === 'town', pri: 3, s: () => [W('sana', 'smile', '兄さん、むかしは 町で いちばん 甘いもの すきでしたよね。'), W('riku', 'angry', 'よけいな こと 言うな。'), W('mio', 'joy', 'リクの すきな もの、はじめて 知った！')] },
    { id: 'all_haru_kurou', w: 'sora', need: ['haru'], when: c => c.f.c3reunion, pri: 4, s: () => [W('sora', 'neutral', 'ハル。 クロウさんと、話せた？'), W('haru', 'closed', '……まだ うまく 話せない。 四十年は、ながい。'), W('haru', 'smile', 'でも、子守歌を 歌ったら、泣いてた。 ……わたしも。')] },
    { id: 'all_kaito_riku', w: 'kaito', need: ['riku'], when: c => c.ch === 4, pri: 3, s: () => [W('kaito', 'neutral', 'リク。 {name}の そばに いて くれて、ありがとう。'), W('riku', 'surprised', '……べ、べつに。 こいつが 危なっかしいだけだ。'), W('kaito', 'grin', '知ってる。 おれの 子だからな。')] },
    // ===== 場所・場面 =====
    { id: 'pl_beacon_sora', w: 'sora', when: c => c.place === 'beacon', pri: 3, s: () => [W('sora', 'determined', 'ここの 灯台、てっぺんまで のぼるの…… ちょっと こわい。'), W('sora', 'smile', 'でも、父さんも のぼってたんだ。 ぼくだって。')] },
    { id: 'pl_shrine', w: 'sora', when: c => c.place === 'shrine', pri: 3, s: () => [W('sora', 'neutral', '祠の 試練って、力より 頭を つかうんだね。'), has('mio') ? W('mio', 'smile', '箱を おす 順番、いっしょに 考えよ。 まちがえたら「ぬけだす」で やりなおせるよ。') : null] },
    { id: 'pl_tower', w: 'sora', when: c => c.place === 'tower', pri: 4, s: () => [W('sora', 'worried', '星巣の 塔……。 下から 見ると、空に ささってる みたい。'), has('haru') ? W('haru', 'determined', 'てっぺんで 待ってる ものが いる。 風が そう 言ってる。') : null] },
    { id: 'pl_palace', w: 'sora', when: c => c.place === 'palace', pri: 4, s: () => [W('sora', 'worried', 'ここが 深淵の宮……。 しずかすぎて、耳が きーんと する。'), has('kaito') ? W('kaito', 'determined', '深みの王は、ここで 灯を 喰ってる。 三年ぶんの 借りを 返す。') : null] },
  ];
  // ---------- 仲間モンスター（種族の 口調。ミオが いれば 通訳する） ----------
  const MV = { watapoko: ['ぽこ……ぽこっ！', 'あったかい 場所が すき'], iwanoko: ['ごろ。 ごろごろ。', 'かたい 石を かじりたい'], mizumochi: ['ぷるるん！', '水たまりで はねたい'], hoshikage: ['……きらり。', '夜に なると 元気が 出る'] };
  const TYPEV = { fire: ['ぼっ！', 'もっと 燃やしたい'], water: ['ちゃぷ。', '水の においが する'], grass: ['さわさわ……', 'ひなたぼっこ したい'], earth: ['ごつん。', '地面が すき'], wind: ['ひゅるる！', 'とびまわりたい'], light: ['ぴかっ。', 'みんなを てらしたい'], dark: ['……じっ。', 'かげの 中が おちつく'], normal: ['きゅっ！', 'いっしょに いたい'] };
  function monLines(m, c) { const S = K.SPC[m.id] || {}; const v = MV[m.id] || TYPEV[S.type] || TYPEV.normal; const nmn = K.nameOf(m);
    const mood = m.hp < m.st.hp * .4 ? 'つかれて ねむい' : c.night ? (S.type === 'dark' || S.type === 'light' ? '夜は わくわくする' : 'ねむい') : (m.bond || 0) >= 80 ? `${c.name}が だいすき` : v[1];
    return [N(nmn, v[0]), has('mio') ? W('mio', 'smile', `……「${mood}」って 言ってる。`) : `${nmn}は ${c.name}の 足もとに すりよってきた。（${mood}…… みたいだ）`]; }

  // ---------- 短い 反応（ぜんぶ 聞いた あと） ----------
  const SHORT = {
    mio: [c => c.night ? 'ふわぁ……。 ねむく なってきちゃった。' : 'いい 風だね。 歌いたく なる。', c => c.hp < .6 ? 'つかれたら 言ってね。 すぐ 歌うから。' : 'つぎ、どっちに 行く？', () => 'ポケットに 木の実、入れといたよ。',
      c => c.sea ? '泡の 音って、子守歌みたい。' : c.sky ? '雲って、さわったら つめたいのかな。' : '草の においが する。 雨の あとかな。', () => '歩きながら 新しい 歌、考えてたの。 まだ ないしょ。', c => c.town ? 'お店の 人、やさしかったね。' : '鳥の こえ、聞こえる？ 「あっちに 水が ある」って。'],
    riku: [c => c.night ? '……見張りは おれが やる。 ねとけ。' : 'ぼさっと すんな。 行くぞ。', () => '槍の 手入れ、あとで する。', c => c.lb && c.lb.res === 'win' ? '……悪くねえ 動きだった。' : '腹へった。',
      c => c.town ? '人ごみは にがてだ。 さっさと 用事 すませるぞ。' : '……足音が する。 気を ぬくな。', () => '甘ちゃん、靴ひも ほどけてるぞ。', c => c.sea ? '息が できるって わかってても、落ちつかねえ。' : '風向きが いい。 今日は 進める。'],
    sana: [c => c.night ? '星が 道を 教えてくれます。' : '雲の 流れが はやいです。', () => '兄さんが 無茶を しないよう、見ていてくださいね。', () => '{name}さん、水は 足りてますか？',
      () => '旅の 日記を つけています。 今日は「みんな 元気」と 書きます。', c => c.town ? 'この 町の 星図、あとで 見せて もらいたいです。' : '足もとの 花、薬に なります。 すこし つんで いきますね。'],
    haru: [() => '風、かわった。', c => c.sky ? '雲の 上は、おちつく。' : '地面は まだ、ちょっと ゆれてる 気が する。', () => '……ん。 なんでもない。',
      c => c.night ? '夜風は、すこし さびしい におい。' : '光が まぶしい。 ……でも、きらいじゃない。', () => 'みんなの 足音、おぼえた。 目を とじても わかる。'],
    kaito: [() => '足もとに 気を つけろ。', c => c.night ? '夜の 海を 見ると、つい 灯台を さがしちまう。' : 'いい 天気だ。 船を 出したく なる。', () => '……ユイに 手紙でも 書くか。',
      () => '{name}、背が のびたな。 三年は、ながかった。', c => c.sea ? '海の底の 道は、おれが 知ってる。 ついてこい。' : '兄貴の 店に、また 顔を 出さないとな。'],
    sora: [() => 'よし、行こう！', c => c.night ? '星、きれいだな……。' : 'つぎの 灯、どこかな。', c => c.hp < .6 ? 'ちょっと 休憩、しよっか。' : 'みんなが いると、こわくないや。'],
  };
  const FACE = { mio: 'smile', riku: 'neutral', sana: 'smile', haru: 'neutral', kaito: 'neutral', sora: 'smile' };

  // ---------- えらぶ ----------
  const seen = () => { const g = G(); if (!g.talkSeen || typeof g.talkSeen !== 'object') g.talkSeen = {}; return g.talkSeen; };
  const ok = (e, c) => (!e.w || has(e.w)) && (e.need || []).every(has) && (() => { try { return e.when(c); } catch (_) { return false; } })();
  function pick(c, w) { const S = seen(); const C = L.filter(e => !S[e.id] && (!w || e.w === w || (e.need || []).includes(w)) && ok(e, c)); if (!C.length) return null;
    const top = Math.max(...C.map(e => e.pri || 0)); const T = C.filter(e => (e.pri || 0) === top); return T[Math.floor(Math.random() * T.length)]; }
  function shortOf(id, c) { const g = G(); g.talkIdx = g.talkIdx || {}; const P = SHORT[id] || SHORT.sora; const i = (g.talkIdx[id] || 0) % P.length; g.talkIdx[id] = i + 1; return [W(id, FACE[id] || 'smile', P[i](c))]; }
  const left = (c, w) => L.filter(e => !seen()[e.id] && (!w || e.w === w || (e.need || []).includes(w)) && ok(e, c)).length;
  async function talkWith(w) { const c = ctx(); let lines;
    if (w && w.startsWith && w.startsWith('m')) { const m = (G().mons || []).find(x => x.uid === w); if (m) lines = monLines(m, c); }
    if (!lines) { const e = pick(c, w); if (e) { seen()[e.id] = 1; lines = e.s(c); } else { let id = w; if (!id) { const hs = ['sora', ...G().party.filter(m => m.kind === 'human' && m.id !== 'sora').map(m => m.id)]; G().talkRot = ((G().talkRot || 0) + 1) % hs.length; id = hs[G().talkRot]; } lines = shortOf(id, c); } }
    await K.say(lines.filter(Boolean)); K.save(); }
  async function talkMenu() { const c = ctx(); const g = G();
    const hs = g.party.filter(m => m.kind === 'human' && m.id !== 'sora');
    const ms = (g.team || []).map(u => (g.mons || []).find(m => m.uid === u)).filter(Boolean);
    const items = [{ label: 'みんなで はなす', sub: left(c) ? `新しい 話 ${left(c)}` : 'いつもの 話', v: '' }, ...hs.map(m => ({ label: K.nameOf(m), sub: left(c, m.id) ? '新しい 話が ある' : '', v: m.id })), ...ms.map(m => ({ label: K.nameOf(m), sub: 'なかまの いきもの', v: m.uid }))];
    const i = await K.menu({ title: 'はなす', items }); if (i < 0) return; await talkWith(items[i].v || null); }
  H.menu.push(() => ({ label: 'はなす', sub: (() => { try { const n = left(ctx()); return n ? `仲間と 会話（新しい 話 ${n}）` : '仲間と 会話'; } catch (_) { return '仲間と 会話'; } })(), fn: talkMenu }));
  H.load.push(g => { if (!g.talkSeen || typeof g.talkSeen !== 'object') g.talkSeen = {}; });
  K.partyTalk = { L, talkWith, ctx, MV, TYPEV, SHORT };
})();
