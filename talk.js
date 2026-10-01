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
  const has = id => K.G.team.includes(id);
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
  H.menu.push(() => ({ label: 'はなす', sub: (() => { try { const n = left(ctx()); return n ? `仲間と 会話（新しい 話 ${n}）` : '仲間と 会話'; } catch (_) { return '仲間と 会話'; } })(), fn: () => K.partyTalk.open() }));
  H.load.push(g => { if (!g.talkSeen || typeof g.talkSeen !== 'object') g.talkSeen = {}; });
  K.partyTalk = { L, talkWith, ctx, MV, TYPEV, SHORT };
})();

// 第2段階：既存の会話データ・APIを保全して追加する。
// 仲間会話。既存セーブキー・進行フラグを変更しない。検証結果は WORK_STATE.md を参照。
// ともしびアイランド — talk.js (仲間会話システム)
'use strict';
(() => {
  const K = window.KZ; if (!K) return;
  const H = K.HOOK, $ = id => document.getElementById(id);
  const G = () => K.G, F = () => K.G.flags;

  // ---------- 既読管理とセーブ初期化 ----------


  // 直前バトルの観測（30秒以内）
  let lastBattle = null;
  H.battleEnd.push((res, specs) => {
    lastBattle = { res, isBoss: specs.some(s => s.boss), t: performance.now() };
  });
  const recentBattle = () => (lastBattle && performance.now() - lastBattle.t < 30000) ? lastBattle : null;

  // ---------- 観測ヘルパー ----------
  const isNight = () => World.skyInfo(K.G.tod).night > 0.5;
  const inTown = () => {
    const r = K.REG[K.G.region];
    return r && r.town && Math.hypot(K.player.x - r.town.x, K.player.z - r.town.z) < 36;
  };
  const inBeacon = () => {
    const r = K.REG[K.G.region];
    return K.G.region === 0 && r.beacons && r.beacons.some(b => Math.hypot(b.x - K.player.x, b.z - K.player.z) < 22);
  };
  const inPalace = () => K.G.region === 3 && K.REG[3].palace && Math.hypot(K.player.x - K.REG[3].palace.x, K.player.z - K.REG[3].palace.z) < 30;
  const inTrench = () => K.G.region === 3 && K.REG[3].trench && Math.hypot(K.player.x - K.REG[3].trench.x, K.player.z - K.REG[3].trench.z) < 30;
  const inWater = () => K.player.swim || World.biomeAt(K.player.x, K.player.z) === 'shore' || K.G.region === 3;
  const isLowHp = m => m && m.hp > 0 && m.hp < m.st.hp * 0.3;

  // 隊列（G.team）に存在するか判定
  const inTeam = id => K.G.team.includes(id);
  const monInTeam = spId => K.G.team.some(ref => { const m = K.member(ref); return m && m.id === spId; });

  // ---------- 会話データビルダー ----------
  // [id, condFn, who, ex, text, partnerWho, partnerEx, partnerText, soloText]
  const TALKS = [];
  const previous = K.partyTalk;
  const addT = (id, cond, who, ex, text, pwho, pex, ptext, soloText) => {
    TALKS.push({ id: 'pt_' + id, cond, who, ex, text, pwho, pex, ptext, soloText });
  };


  addT("sora_01", () => true, "sora", "determined", "とうさんの おさがりの マフラー、 すこし しおの においが する。 これを まいてると、 まえを むけるんだ。");
  addT("sora_02", () => isNight() && K.G.region === 0 && !F().cleared, "sora", "smile", "よるの うみは くらいね。 とうだいの あかりを とりもどしたいな。");
  addT("sora_03", () => inTown() && K.G.region === 0 && isNight(), "sora", "smile", "むらの あかりを みると ほっとするよ。 かえりみちを たしかめよう。");
  addT("sora_04", () => isLowHp(K.member("sora")), "sora", "worried", "うう…… さすがに すこし からだが おもいな。 どこかで ひとやすみ したいよ。");
  addT("sora_05", () => recentBattle()?.res === "win", "sora", "joy", "みんな、 ケガは なかった？ かげものたち、 ちゃんと ひかりへ かえれたかな。");
  addT("sora_06", () => K.G.region === 1, "sora", "surprised", "たいりくの さばくは ひろいなぁ。 みわたす かぎり すなばかりで、 まいごに なりそうだよ。");
  addT("sora_07", () => K.G.region === 2, "sora", "worried", "あしの したに くもが あるなんて、 まだ しんじられないよ。 おちないように きをつけなきゃ。");
  addT("sora_08", () => K.G.region === 3, "sora", "surprised", "うみの そこなのに いきが できるなんて、 あわのすずの ちからって ほんとうに ふしぎだな。");
  addT("sora_09", () => F().cleared && K.G.region === 0, "sora", "smile", "しまの いつつの とうだいが、 いまは ぜんぶ ともってる。 もう だれも かえりみちに まよわないね。");
  addT("sora_10", () => F().c2done, "sora", "determined", "星喰いを しずめた とき、 サナの めに ひかりが もどって…… ほんとうに よかった。");
  addT("sora_11", () => F().c3done && !F().c3reunion, "sora", "smile", "星守さまも ほしを そらへ かえしてくれた。 ハル、 おとうさんに はやく あわせてあげたいな。");
  addT("sora_12", () => F().c3reunion, "sora", "smile", "ハルが おとうさんに「ただいま」って いえた。 ほんとうに よかったね。");
  addT("sora_13", () => F().c4done, "sora", "joy", "とうさんと いっしょに うみのそこの ともしびも ともせた。 かあさんの まつ いえへ、 いっしょに かえろう。");
  addT("sora_14", () => !isNight() && inTown(), "sora", "smile", "まちの ひとたちが げんきに はたらいてるのを みると、 なんだか ゆうきが わいてくるよ。");
  addT("sora_15", () => true, "sora", "neutral", "たかい ところは やっぱり すこし にがてだけど…… ぼくが よわねを はいちゃ だめだよな。");
  addT("mio_01", () => true, "mio", "smile", "この みどりの ベストはね、 かあさんの かたみなんだ。 きていると、 うたの こえが よく ひびく きが するの。");
  addT("mio_02", () => isNight(), "mio", "smile", "くらいところは すこし こわいな。 みんなの そばを あるくね。");
  addT("mio_03", () => isLowHp(K.member("mio")), "mio", "sad", "ごめんね、 {name}。 あしが ふるえちゃって…… はやく いやしのうたを うたわなきゃ。");
  addT("mio_04", () => recentBattle()?.res === "win", "mio", "joy", "ふう、 よかった！ みんなの いきが ぴったり あってたね！");
  addT("mio_05", () => inTown() && K.G.region === 0, "mio", "smile", "ナギおばさんの みのパン、 また たべたいな。 あの こんがりした においが こいしいよ。");
  addT("mio_06", () => inBeacon(), "mio", "determined", "とうだいの そばに たつと、 うみの とおくまで うたが とどく きが するの。");
  addT("mio_07", () => K.G.region === 1 && !isNight(), "mio", "smile", "すなが さらさら うごいてる。 どんな おとが するか きいてみよう。");
  addT("mio_08", () => K.G.region === 1 && isNight(), "mio", "smile", "よるの さばくは さむいけど、 ほしが すっごく おおきく みえるね。 うたってても きもちいいな。");
  addT("mio_09", () => K.G.region === 2, "mio", "joy", "くもの うえの かぜって、 すずの ような きれいな おとが するの！ きこえる、 {name}？");
  addT("mio_10", () => K.G.region === 3, "mio", "smile", "うみの なかで うたうとね、 あわが ぽこぽこ うまれて おとが まるくなるの。 おもしろいよ！");
  addT("mio_11", () => F().mio && !F().cleared, "mio", "determined", "よるに ないてる こえ…… あれは、 かなしみに のまれた ひとのこえ なの。 たすけにいこう！");
  addT("mio_12", () => F().cleared && !F().c2start, "mio", "joy", "宵の祠の やみが はれて、 あさの ひかりが まぶしかったね。 カイトさんも かえってきてくれて……！");
  addT("mio_13", () => F().c2arrive && !F().c2done, "mio", "worried", "リクの いもうとの サナちゃん、 ぶじだと いいな。 きょうだいが はなればなれなんて、 つらすぎるよ。");
  addT("mio_14", () => F().c2done && !F().c3start, "mio", "smile", "サナちゃんが なかまに くわわってくれて うれしいな。 ふたりで うたうと ハーモニーに なるの。");
  addT("mio_15", () => F().c3elder && !F().c3done, "mio", "worried", "ハルの きいた こもりうた、 なんで しまの うたと おなじ なんだろう…… きになるな。");
  addT("mio_16", () => F().c3reunion, "mio", "joy", "クロウさんの うれしそうな かお、 わすれられないな。 ハルを まってて、 ほんとうに よかったね！");
  addT("mio_17", () => F().c4start && !F().c4done, "mio", "determined", "うみの そこの とうだいも、 だれかが かえりを まっているから ともすんだよね。 わたしも うたうよ！");
  addT("mio_18", () => F().c4done, "mio", "smile", "深みの王も、 ひかりの あわに なって のぼっていったね。 あたたかい うたを うたえて よかった。");
  addT("mio_19", () => true, "mio", "neutral", "たびを つづけてるとね、 どうぐの ひとつひとつに そのにんの こころが やどる きが するんだ。");
  addT("mio_20", () => true, "mio", "grin", "{name}、 たまには たちとまって しんこきゅうしようよ。 ほら、 すー、 はー！");
  addT("mio_21", () => true, "mio", "grin", "リク、 さっきから やりの おていれ ばっかり。 ほんとは きんちょうしてるでしょ？",
    "riku", "smirk", "……うるせえ。 しおかぜで さびちまうと、 いざって ときに ささらねえんだよ。",
    "who(\"mio\",\"joy\",\"ふふ、 どうぐを たいせつに する ひとに、 わるい ひとは いないって ナギおばさんも いってたよ！\")");
  addT("mio_22", () => F().c2done, "mio", "smile", "サナちゃん、 かみかざり とっても きれいだね。",
    "sana", "smile", "ありがとうございます。 いまも たいせつに しています。 ひかりが きれいですね。",
    "who(\"mio\",\"joy\",\"へえっ！ リクったら、 サナちゃんの かみかざり、 とっても すてきだね！\")");
  addT("mio_23", () => F().c3elder, "mio", "smile", "ハル、 くもの さとの かぜの うた、 わたしにも おしえてくれる？",
    "haru", "smile", "うん、 いいよ。 かぜの おとに あわせて、 いきを ながく はくの。",
    "who(\"mio\",\"joy\",\"わあ、 すがすがしい きもちに なるね！\")");
  addT("mio_24", () => F().c4start, "mio", "smile", "カイトさん、 しおの においが むかしと まったく かわらないですね！",
    "kaito", "smile", "わはは！ まいにち しおみずを かぶってたからな。 ほねまで しおつけさ。",
    "who(\"mio\",\"smile\",\"ふふ、 たのもしい おとうさんで {name}が うらやましいな。\")");
  addT("mio_25", () => true, "mio", "determined", "カイトさんには、 おさないころ いのちを たすけてもらったの。 だから こんどは わたしが、 みんなを うたで ささえたいんだ。",
    "kaito", "joy", "ミオちゃん、 おおきくなったなぁ！ うみで おぼれかけて ないていた あのこが、 いまでは りっぱな うたいてだ。",
    "who(\"mio\",\"smile\",\"も、 もう カイトさん！ みんなの まえで いわれると、 はずかしいです……。\")");
  addT("mio_26", () => !isNight(), "mio", "joy", "おにちさまが あたたかいと、 こえが どこまでも のびていく きが するな〜♪");
  addT("mio_27", () => isNight(), "mio", "neutral", "よかぜって、 ひるまの かぜより すこし ひんやりしてて すんでいるよね。");
  addT("mio_28", () => K.G.gold > 2000, "mio", "grin", "ゴールドが たくさん あるね！ ナギおばさんに おみやげ、 なにか かっていこうよ！");
  addT("mio_29", () => isLowHp(K.member("sora")), "mio", "worried", "{name}、 ムリしないで！ わたしの てを つかんで、 すこし やすもう？");
  addT("mio_30", () => inTown() && K.G.region === 1, "mio", "surprised", "港町ミナトって、 ふねが いっぱい でいりしてて にぎやかだね！ まいごに なりそう！");
  addT("mio_31", () => inTown() && K.G.region === 2, "mio", "smile", "雲の里ククルの おいえ、 まあるくて かわいいな。 くもで できてるのかな？");
  addT("mio_32", () => inTown() && K.G.region === 3, "mio", "smile", "アワの里の シャボンたま、 われても ふわふわ つぎから つぎへと うまれてくるね。");
  addT("mio_33", () => recentBattle()?.res === "flee", "mio", "worried", "ふう、 にげきれて よかった……！ たまには にげるのも ゆうきだよね！");
  addT("mio_34", () => recentBattle()?.isBoss && recentBattle()?.res === "win", "mio", "joy", "あんなに つよい あいてだったのに、 みんなで ちからを あわせたら かてたね！");
  addT("mio_35", () => K.G.region === 0 && !isNight(), "mio", "smile", "むらの みさきに さいてる きいろい おはな、 きょうも ゆらゆら ゆれてて きれいだよ。");
  addT("mio_36", () => F().c2mid && !F().c2done, "mio", "determined", "いせきの おくから、 つめたい さけびが きこえる……。 サナちゃん、 まっててね！");
  addT("mio_37", () => F().c3bridge && !F().c3done, "mio", "joy", "にじの はしが かかった とき、 そらじゅうが うたってるみたいだったね！");
  addT("mio_38", () => F().c4elder && !F().c4done, "mio", "neutral", "しずんだ とうだいたち、 ながい あいだ くらやみの なかで さびしかっただろうな……。");
  addT("mio_39", () => true, "mio", "smile", "わたしの うたで、 きずついた いきものたちの こころが すこしでも かるくなると いいな。");
  addT("mio_40", () => true, "mio", "joy", "{name}と いっしょに たびが できて、 わたし、 ほんとうに しあわせだよ！");
  addT("riku_01", () => true, "riku", "smirk", "……はらが へったら めしを くえ。 はらペコじゃ、 やりも ふれねえからな。");
  addT("riku_02", () => K.G.region === 0 && K.shiomi && Math.hypot(K.player.x - K.shiomi.x, K.player.z - K.shiomi.z) < 30, "riku", "smile", "シオミの まちか。 ……あしを とめて まわりを みるぞ。");
  addT("riku_03", () => isLowHp(K.member("riku")), "riku", "angry", "クソッ…… かすりきずだ！ てめえらに しんぱいされるほど、 おれは ヤワじゃねえ！");
  addT("riku_04", () => recentBattle()?.res === "win", "riku", "smirk", "フン、 たあいねえな。 やりの さびにも なりゃしねえぜ。");
  addT("riku_05", () => inTown() && K.G.region === 0, "riku", "neutral", "風見の村の れんちゅうは、 おひとよしが おおすぎる。 カイトの せがれに そっくりだ。");
  addT("riku_06", () => inBeacon(), "riku", "neutral", "とうだいの てっぺんは かぜが つええな。 ふんばって ねえと ふきとばされそうだ。");
  addT("riku_07", () => K.G.region === 1 && !isNight(), "riku", "neutral", "さばくの ねっきは いきが つまるぜ。 すいとうの のこり、 ちゃんと みとけよ。");
  addT("riku_08", () => K.G.region === 1 && isNight(), "riku", "smile", "よるの だいりくは ひえるな。 むりを して あるくなよ。");
  addT("riku_09", () => K.G.region === 2, "riku", "surprised", "おいおい、 ほんとうに くもの うえに たってやがる。 あしもとが スースーして おちつかねえな。");
  addT("riku_10", () => K.G.region === 3, "riku", "neutral", "みずの なかで やりを つくと、 すいあつで うでが なまる。 いい たんれんに なるぜ。");
  addT("riku_11", () => F().cleared && !F().c2start, "riku", "smile", "あまちゃん、 宵闇の王を しずめたな。 ……ま、 すこしは みなおしてやったよ。");
  addT("riku_12", () => F().c2start && !F().c2arrive, "riku", "determined", "霧の大陸に サナが いる。 あの ほしのかみかざりを つけた いもうとを、 かならず みつけだす。");
  addT("riku_13", () => F().c2mid && !F().c2done, "riku", "angry", "いせきの おくに サナの けはいが する。 まってろよ、 すぐに ひっぱりだしてやる！");
  addT("riku_14", () => F().c2done && !F().c3start, "riku", "neutral", "サナを たすけだせたのは、 てめえらの おかげだ。 ……れいは いわねえぞ、 かりに しとく。");
  addT("riku_15", () => F().c3start && !F().c3done, "riku", "smirk", "そらの くじらに のるなんざ、 まるで おとぎはなしだな。 あきれて わらえてくるぜ。");
  addT("riku_16", () => F().c3done && !F().c3reunion, "riku", "smile", "ハルが きおくを とりもどしたか。 あとは おやじさんに かおを みせてやるだけだな。");
  addT("riku_17", () => F().c3reunion, "riku", "smirk", "クロウの じいさん、 ないてやがったな。 ……ったく、 としをとると なみだもろくて いけねえ。");
  addT("riku_18", () => F().c4start && !F().c4done, "riku", "neutral", "カイトの おやじ、 ひとりで かいていへ いくきだったんだろ。 おやこ そろって むちゃばっかしやがる。");
  addT("riku_19", () => F().c4done, "riku", "smile", "うみの そこまで ともしびが とどいたか。 これで、 うみに のまれた たましいも まよわずに すむな。");
  addT("riku_20", () => true, "riku", "neutral", "ぶきのていれを おこたるやつから さきに しぬ。 てめえの つるぎも、 ちゃんと といでおけよ。");
  addT("riku_21", () => F().c2done, "riku", "worried", "サナ、 みずは のんでるか？ つかれたら すぐ いえよ。",
    "sana", "smile", "ふふ、 だいじょうぶです、 にいさん。 こどもの ころから、 しんぱいしすぎ ですよ。",
    "who(\"riku\",\"neutral\",\"……しんぱいなんか してねえよ。 あしでまといに なられたら こまるだけだ。\")");
  addT("riku_22", () => true, "riku", "smirk", "あまちゃん、 つるぎの かまえが まだ あまいぜ。 わきが ガラあきだ。",
    "sora", "determined", "これでも ゲンおじさんに きたえてもらったんだからね！ まけないよ！",
    "who(\"riku\",\"smirk\",\"へっ、 くちだけは いっちょうまえだな。 バトルで みせてみろ。\")");
  addT("riku_23", () => F().c3elder, "riku", "neutral", "ハル、 その おうぎで やりの ほさきを あおぐな。 かぜで きっさきが ブレるだろ。",
    "haru", "grin", "ふふ、 かぜを みかたに つければ、 もっと するどく つけるのに。",
    "who(\"riku\",\"smirk\",\"チッ…… くちの へらねえ やつが ふえやがった。\")");
  addT("riku_24", () => F().c4start, "riku", "neutral", "カイトの おやじ、 その いかり、 おもたくねえのか？",
    "kaito", "smile", "おもたいから こそ、 うでっぷしが なまらねえのさ。 おまえの やりも いい こうだな。",
    "who(\"riku\",\"smile\",\"……ほんどの かじやに とくちゅうで うたせた わざものだ。 そまつには あつかわねえよ。\")");
  addT("riku_25", () => inTown() && K.G.region === 1, "riku", "neutral", "港町ミナトの ほしさかな、 しおの ききが ちょうど いい。 10ひきくらい かいだめしとくか。");
  addT("riku_26", () => isNight(), "riku", "neutral", "やえいの ときは、 ひの ばんを こうたいで やるぞ。 ゆだんした やつから かげに くわれる。");
  addT("riku_27", () => recentBattle()?.res === "flee", "riku", "neutral", "チッ…… にげるなんざ せいに あわねえが、 ぜんめつするよりは マシだ。");
  addT("riku_28", () => isLowHp(K.member("sora")), "riku", "worried", "おい あまちゃん、 ふらついてんぞ！ まえを みて あるけ、 まえを！");
  addT("riku_29", () => K.G.gold < 100, "riku", "neutral", "おいおい、 しょじきんが そこをつきかけてんぞ。 ギルドの いらいでも こなして かせぐか。");
  addT("riku_30", () => K.G.region === 1 && inTown(), "riku", "neutral", "ミナトの ギルドの けいじばん、 たまに ほねのある いらいが はってあるぜ。");
  addT("riku_31", () => K.G.region === 2 && inTown(), "riku", "smile", "くもの さとの れんちゅう、 のんびりしすぎてて どくけが ぬけるぜ。 わるい きは しねえがな。");
  addT("riku_32", () => K.G.region === 3 && inTown(), "riku", "neutral", "うみの そこの やどの ベッド、 ぷにぷにしてて こしが しずみこむな……。");
  addT("riku_33", () => true, "riku", "determined", "おれの やりは、 まもるべき ものが ある ときに いちばん つよく はしる。 ……そういう もんだ。");
  addT("riku_34", () => F().c2rumor && !F().c2mid, "riku", "angry", "サナを ひとりで いせきへ いかせた やつら…… たすけだしたら いっぱつ なぐってやる。");
  addT("riku_35", () => F().c3mid && !F().c3done, "riku", "determined", "星巣の塔の ちょうじょうか。 どんな バケモンが いようと、 つきとうすだけだ。");
  addT("riku_36", () => F().superDone, "riku", "smirk", "深淵の主を たおしちまったか。 ……おれたちも、 そうとうな めいちらずだな。");
  addT("riku_37", () => !isNight() && K.G.region === 0, "riku", "neutral", "しまの しおかぜは、 ほんどの みなとより すこし あまい においが するな。 ユイさんの スープの せいか？");
  addT("riku_38", () => true, "riku", "smile", "ソラ。 てめえの まっすぐな ところ、 きらいじゃ ねえよ。 あきれるがな。");
  addT("riku_39", () => true, "riku", "neutral", "いつでも いけるぜ。 てめえが きめろ、 リーダーだろ。");
  addT("riku_40", () => true, "riku", "smirk", "さあ、 つぎの えものは どいつだ？ やりの さびに してやるぜ。");
  addT("sana_01", () => true, "sana", "smile", "この ほしの かみかざりは、 にいさんと はなればなれに なった ときから、 ずっと たいせつに もっていたんです。");
  addT("sana_02", () => K.G.region === 1 && inTown(), "sana", "sad", "星喰いに あやつられていた ときのこと、 まだ ゆめに みます……。 つめたくて、 とても さみしい やみでした。");
  addT("sana_03", () => isLowHp(K.member("sana")), "sana", "worried", "すこし…… めまいが します。 いのりの ちからが、 よわまって しまいました……。");
  addT("sana_04", () => recentBattle()?.res === "win", "sana", "smile", "ほしの かごが、 みなさんを まもってくれましたね。 かんしゃを ささげましょう。");
  addT("sana_05", () => isNight(), "sana", "smile", "ほしの こえは、 かぜや なみの おとに よく にています。 みみを すますと…… とおい むかしの ねがいが きこえるんです。");
  addT("sana_06", () => !isNight(), "sana", "neutral", "おひるの たいようも、 とおくから みれば ひとつの おおきな ほしなのだと、 むかしの しょもつに ありました。");
  addT("sana_07", () => K.G.region === 0, "sana", "smile", "風灯の島は、 あたたかい ひかりで みちていますね。 ユイさんの てりょうり、 とても おいしかったです。");
  addT("sana_08", () => K.G.region === 1, "sana", "neutral", "さばくの すなの なかにも、 こぼれおちた ちいさな ほしのかけらが いきづいています。");
  addT("sana_09", () => K.G.region === 2, "sana", "joy", "そらの ふしまに くると、 ほしたちが ずっと ちかくで しゅんいているのが わかります！");
  addT("sana_10", () => K.G.region === 3, "sana", "surprised", "うみの そこから みあげる すいめんは、 まるで ゆらめく てんのかわのようですね……。");
  addT("sana_11", () => F().c3start && !F().c3arrive, "sana", "determined", "ほしふえの ねいろは、 きっと てんの くじらへ とどきます。 しんじて まちましょう。");
  addT("sana_12", () => F().c3arrive && !F().c3elder, "sana", "neutral", "そらの さとの みなさんも、 ほしの いへんに きづいているはずです。 あいに いきましょう。");
  addT("sana_13", () => F().c3done && !F().c3reunion, "sana", "smile", "天喰みの こころが ほどけました。 ほしぼしは もう、 くわれる きょうふから かいほうされたのです。");
  addT("sana_14", () => F().c3reunion, "sana", "joy", "ハルさんと クロウさんの きずな、 ほしの みちびきを かんじました。 ほんとうに よかったですね。");
  addT("sana_15", () => F().c4start && !F().c4done, "sana", "determined", "うみの そこの くらやみにも、 ほしの ひかりを とどけたい…… わたしも せいいっぱい、 いのります。");
  addT("sana_16", () => F().c4done, "sana", "smile", "深みの王も、 ひかりの あわと なって かえっていきましたね。 うみと そらが、 ひかりで つながりました。");
  addT("sana_17", () => true, "sana", "determined", "ほしの こえに みみを すませていると、 じぶんは ひとりじゃないんだって、 つよく おもえます。");
  addT("sana_18", () => true, "sana", "smile", "にいさんは くちが わるいですが、 ほんとうは だれよりも こころが やさしいにんなんです。");
  addT("sana_19", () => recentBattle()?.isBoss && recentBattle()?.res === "win", "sana", "joy", "おそろしい やみの けはいも、 みなさんの ともしびの まえには はれわたりましたね！");
  addT("sana_20", () => isLowHp(K.member("riku")), "sana", "worried", "にいさん！ ムリを しては いけません！ すぐに かいふくの いのりを ささげます！");
  addT("sana_21", () => true, "sana", "neutral", "ミオさんの うたを きいていると、 ほしたちが うれしそうに またたくのが わかるんです。",
    "mio", "joy", "ほんとう！？ ほしの おともだちにも、 わたしの うたが とどいてるのかな！",
    "who(\"sana\",\"smile\",\"はい。 きっと、 とても あたたかい ひかりに なって とどいていますよ。\")");
  addT("sana_22", () => true, "sana", "smile", "にいさん、 また やりの ほさきばかり みつめて…… たまには そらの ほしを みあげてみては？",
    "riku", "smirk", "あしもとが るすに なるだろ。 ほしなんか みてたら ころんじまうぜ。",
    "who(\"sana\",\"smile\",\"ふふ、 にいさんらしい こたえですね。\")");
  addT("sana_23", () => F().c3elder, "sana", "neutral", "ハルさんの まとう かぜ、 とても すきとおっていて…… とおい そらの においが します。",
    "haru", "smile", "サナの ほしの ひかと いっしょ。 ずっと むかしから しっていた ような きもち。",
    "who(\"sana\",\"joy\",\"ほしと かぜは、 そらの うえで ずっと おともだち だったのかも しれませんね。\")");
  addT("sana_24", () => F().c4start, "sana", "smile", "カイトさんの かかげる ともしび、 ふかい じあいに みちていますね。",
    "kaito", "smile", "そうかい？ おれは ただ、 まいごの ふねが しんぱいな だけさ。",
    "who(\"sana\",\"smile\",\"その おきもちこそが、 なによりの みちびきなのだと おもいます。\")");
  addT("sana_25", () => inTown() && K.G.region === 1, "sana", "smile", "ミナトの にぎやかな こえが きこえます。 ゆっくり あるきましょう。");
  addT("sana_26", () => inTown() && K.G.region === 0, "sana", "smile", "風灯の島の すなはま、 かいがらが きらきら かがやいていて とても きれいです。");
  addT("sana_27", () => isNight() && K.G.region === 2, "sana", "joy", "そらの ふしまから みる がつは、 てが とどきそうなくらい おおきくて しんぴてきですね。");
  addT("sana_28", () => inPalace(), "sana", "smile", "深淵の宮の そばは しずかですね。 あしもとを たしかめましょう。");
  addT("sana_29", () => inTrench(), "sana", "worried", "しんえんの たに…… そこしれぬ やみの おくに、 ふるき いのちの こどうが きこえます。");
  addT("sana_30", () => F().superDone, "sana", "joy", "深淵の主さまも、 わたしたちの ともしびを みとめてくださいましたね。");
  addT("sana_31", () => K.G.gold > 5000, "sana", "smile", "たくさんの めぐみが あつまりましたね。 ひつような どうぐを ととのえて おきましょう。");
  addT("sana_32", () => recentBattle()?.res === "flee", "sana", "smile", "ぶじに なんを のがれられて よかったです。 いのちあっての たびですからね。");
  addT("sana_33", () => true, "sana", "smile", "{name}さんの あゆむ みちは、 いつも あたたかい ともしびに てらされています。");
  addT("sana_34", () => true, "sana", "determined", "わたしも、 にいさんの いもうととして、 そして ほしのみことして、 ちからを つくします！");
  addT("sana_35", () => !isNight() && K.G.region === 1, "sana", "worried", "ひざしが つよいですね。 すいぶんを しっかり ほきゅうして すすみましょう。");
  addT("sana_36", () => F().c3mid && !F().c3done, "sana", "determined", "星巣の塔の うえで、 ほしたちの さけびが ひびいています。 はやく たすけなければ！");
  addT("sana_37", () => F().c4arrive && !F().c4elder, "sana", "smile", "アワの里の ちょうろうさま、 どのような ほうなのでしょうね。 はやく おあいしたいです。");
  addT("sana_38", () => true, "sana", "neutral", "ほしの うごきを みていると、 すべての であいには いみが あるのだと かんじます。");
  addT("sana_39", () => true, "sana", "joy", "こうして みなさんと かたを ならべて あるける まいにちが、 わたしの たからものです。");
  addT("sana_40", () => true, "sana", "smile", "さあ、 まいりましょう。 ほしぼしの しゅくふくが、 わたしたちと ともに ありますように。");
  addT("haru_01", () => !F().c3done, "haru", "smile", "むかしの ことは はっきり おぼえていないの。 いまの かぜを よんで すすむね。");
  addT("haru_02", () => !F().c3done, "haru", "worried", "かぜが ふくと、 むねの おくが ちくっと するの。 だれかが わたしを よんでいるような……");
  addT("haru_03", () => !F().c3done && K.G.region === 2, "haru", "neutral", "たかい ところは すき。 ちじょうの ちいさな あらそいも、 くもの うえから みおろすと しろい けむりに みえるから。");
  addT("haru_04", () => !F().c3done && K.G.region === 2 && inTown(), "haru", "smile", "くもの さとの かぜは おちつくな。 おうぎを そっと ひらいてみよう。");
  addT("haru_05", () => !F().c3done, "haru", "determined", "ほしが きえていくのは、 わたしも いや。 かぜよみの ちから、 みんなの ために つかうよ。");
  addT("haru_06", () => !F().c3done, "haru", "neutral", "かぜは みちを おしえてくれる。 じょうしょうきりゅうに のれば、 どんな たかい がけだって とびこえられるの。");
  addT("haru_07", () => !F().c3done && F().c3bridge, "haru", "joy", "みっつの しに かぜが とおって、 にじの はしが かかった！ とうへの みちが ひらいたよ！");
  addT("haru_08", () => !F().c3done && isLowHp(K.member("haru")), "haru", "worried", "いきが…… うまく すえない。 かぜが みだれているのかな……。");
  addT("haru_09", () => !F().c3done && recentBattle()?.res === "win", "haru", "smile", "ふふ、 かぜが みかたしてくれたね。 きれいに きまったよ。");
  addT("haru_10", () => !F().c3done, "haru", "neutral", "この ふるい たけの おうぎ…… なぜか ずっと てばなせなくて。 なつかしい においが するの。");
  addT("haru_11", () => F().c3done && !F().c3reunion, "haru", "sad", "星守さまが ほしを そらへ かえしてくれた とき、 ぜんぶ おもいだしたの。 ……ちじょうの ちいさな しまに、 まってくれている ひとが いる。");
  addT("haru_12", () => F().c3done && !F().c3reunion, "haru", "determined", "おとうさん…… クロウって なまえの、 とうだいしゅ。 はやく あいに いきたいな。");
  addT("haru_13", () => F().c3done && !F().c3reunion, "haru", "smile", "しじゅうねんも またせちゃったんだね。 おとうさん、 どんな かおをして むかえてくれるかな。");
  addT("haru_14", () => F().c3done && !F().c3reunion, "haru", "worried", "わたしの こと、 ちゃんと おぼえていてくれるかな…… ちょっとだけ ドキドキするよ。");
  addT("haru_15", () => F().c3done && !F().c3reunion, "haru", "joy", "ほしぞらが もどって、 よるの うんかいが とっても あかるいね。 ちじょうへの かえりみちも てらされてる！");
  addT("haru_16", () => F().c3reunion && K.G.region === 0, "haru", "smile", "{name}、 つれてきてくれて ありがとう。 風灯の島の かぜは、 すこし しおの においが して あたたかいね。",
    "sora", "joy", "うん！ おとうさんと いっしょに、 これから たくさん しまを みてまわろう！",
    "who(\"haru\",\"joy\",\"ふふ、 うん。 まだ みたことのない けしきばかりだから、 とても たのしみ。\")");
  addT("haru_17", () => F().c3reunion && K.G.region === 0, "haru", "joy", "おとうさんの ランプの ひ、 くもの うえから きれまに みえていた あのともしびと おなじ だったの！");
  addT("haru_18", () => F().c3reunion && K.G.region === 0 && inTown(), "haru", "smile", "おとうさん、 てれくさそうに わらうんだよ。 カイトさんと ならぶと、 ふたりとも そっくり！");
  addT("haru_19", () => F().c3reunion, "haru", "determined", "わたし、 もう まよわない。 おとうさんの くれた いのち、 かぜとともに たいせつに いきるよ。");
  addT("haru_20", () => F().c3reunion && isNight(), "haru", "smile", "よぞらの ほしを みあげると、 星守さまと おとうさん、 りょうほうの あたたかさを かんじるの。");
  addT("haru_21", () => F().c3reunion, "haru", "smile", "クロウの むすめとして、 そして くものさとの かぜよみとして、 みんなの たびを おいかぜで ささえるね！");
  addT("haru_22", () => true, "haru", "grin", "リク、 やりを ふるときは、 かぜに さからわずに ながれに のせると もっと するどくなるよ。",
    "riku", "smirk", "ヘッ、 かぜに あわせる なんざ せいに あわねえ。 かぜごと つきやぶるんだよ！",
    "who(\"haru\",\"smile\",\"ふふ、 まっすぐな ところが リクらしいね。\")");
  addT("haru_23", () => true, "haru", "smile", "ミオの うたごえ、 くもの うえまで とどきそうなくらい すみきっているね。",
    "mio", "joy", "ほんと！？ ハルの おうぎの パタパタって おとも、 リズムに ぴったり だよ！",
    "who(\"haru\",\"joy\",\"あは、 いっしょに えんそうしてるみたいで たのしいね。\")");
  addT("haru_24", () => F().c4start, "haru", "smile", "カイトさん、 うみの そこの かぜって、 どんな ながれを しているの？",
    "kaito", "smile", "うみの なかじゃ かぜの かわりに「しお」が ながれてるのさ。 しおを よめば スイスイ およげるぞ。",
    "who(\"haru\",\"surprised\",\"しお……！ そらの かぜと よく にてるんだね。 はやく およいでみたいな！\")");
  addT("haru_25", () => K.G.region === 3, "haru", "joy", "みずのなかを とぶように およぐの、 そらを かっくうするのと そっくりで わくわくする！");
  addT("haru_26", () => K.G.region === 1, "haru", "neutral", "霧の大陸は、 どこか あいしゅうの ある かぜが ふいているね。 だいちの きおくなのかな。");
  addT("haru_27", () => recentBattle()?.res === "win", "haru", "joy", "みんなの いきが そろって、 つむじかぜのように かなを あっとうできたね！");
  addT("haru_28", () => isLowHp(K.member("haru")), "haru", "worried", "ごめん…… かぜが やんじゃった。 すこしだけ やすませて……。");
  addT("haru_29", () => inTown() && K.G.region === 2, "haru", "smile", "くもの さとまで かえってきたね。 ここで すこし いきを ととのえよう。");
  addT("haru_30", () => F().c4done, "haru", "smile", "うみの そこの とうだいも、 すべて ともったね。 そらも うみも、 ひかりで ひとつに なったよ。");
  addT("haru_31", () => F().superDone, "haru", "joy", "深淵の主さま、 きょだいな クジラの ような やさしい けはいだったね。");
  addT("haru_32", () => K.G.flags.glider2, "haru", "joy", "風布・改、 スピードが でて きもちいいね！ かぜと ひとつに なれるよ！");
  addT("haru_33", () => !isNight(), "haru", "smile", "あおぞらの なかを とぶ とりたち、 どこへ むかうのかな。 じゆうで いいね。");
  addT("haru_34", () => isNight(), "haru", "neutral", "よかぜは つめたいけれど、 ほしの ひかりを はらんで キラキラ ひかってみえるの。");
  addT("haru_35", () => recentBattle()?.isBoss && recentBattle()?.res === "win", "haru", "determined", "つよい てきだった…… でも、 おそれずに まえへ すすむ ゆうきを おそわったよ。");
  addT("haru_36", () => inPalace(), "haru", "neutral", "きゅうでんの まわりは、 しおの ながれが ぴたりと とまって しずまりかえっているね。");
  addT("haru_37", () => inTrench(), "haru", "worried", "この ふかい たにの そこ…… この いのちの ざわめきが、 みずを つたって きこえるよ。");
  addT("haru_38", () => true, "haru", "smile", "みえなくても かぜは ふいているね。 はっぱの ゆれを みてみよう。");
  addT("haru_39", () => true, "haru", "joy", "{name}と であえて、 わたしの とまっていた じかんが うごきだしたの。 ありがとう。");
  addT("haru_40", () => true, "haru", "determined", "さあ、 いこう！ おいかぜは、 いつだって わたしたちの みかただよ！");
  addT("kaito_01", () => true, "kaito", "smile", "とうだいしゅの しごとはな、 だれも こない よるを じっと まもりつづける ことさ。 「ともしびは、 かえるばしょの しるしだ」。 わすれるなよ。");
  addT("kaito_02", () => K.G.region === 0, "kaito", "neutral", "ユイの やくそうちゃを のむと、 かえってきたんだと じっかんが わくな。 あにきの きんづちの おとも、 むかしの ままだ。");
  addT("kaito_03", () => isLowHp(K.member("kaito")), "kaito", "worried", "ぐ…… さすがに としには かてねえか。 だが、 むすこの まえで たおれるわけには いかん！");
  addT("kaito_04", () => recentBattle()?.res === "win", "kaito", "joy", "がはは！ いい れんけいだったぞ！ これなら どんな あらなみも のりこえられる！");
  addT("kaito_05", () => inTown() && K.G.region === 0, "kaito", "smile", "風見の村の みさきに たつと、 さんねんまの まよいが すうっと はれていくようだ。");
  addT("kaito_06", () => inBeacon(), "kaito", "smile", "とうだいの レンガ、 よく たしかめてみろ。 ひとつずつ ささえあっているんだ。");
  addT("kaito_07", () => K.G.region === 1, "kaito", "neutral", "霧の大陸か。 バルドの やつ、 まだ げんきに かもめまるの かじを にぎってるようで あんしんしたよ。");
  addT("kaito_08", () => K.G.region === 2, "kaito", "surprised", "くもの うえに しまが あるとは きいていたが…… じっさいに たつと きもが ひえるな！");
  addT("kaito_09", () => K.G.region === 3, "kaito", "determined", "うみのそこの とうだい…… さんねんかん、 やみの なかで ずっと きになっていたんだ。 こんどこそ ともすぞ。");
  addT("kaito_10", () => F().c4start && !F().c4arrive, "kaito", "determined", "むらの みなみの みさきで「あわのすず」を ならすんだ。 かいていへの みちが ひらくぞ。");
  addT("kaito_11", () => F().c4arrive && !F().c4elder, "kaito", "smile", "アワの里の ちょうろうウシオさんに あって、 とうだいの ことを きこう。");
  addT("kaito_12", () => F().c4elder && !F().c4done, "kaito", "determined", "しずんだ みっつの とうだい…… も、 こうら、 かみなり。 ひとつずつ ひかりを とりもどそう。");
  addT("kaito_13", () => F().c4done, "kaito", "joy", "{name}。 おまえは もう りっぱな とうだいしゅだ。 とうさんの ほうが おそわったよ。");
  addT("kaito_14", () => F().superDone, "kaito", "smile", "深淵の主も おれたちの ともしびを みとめてくれたな。");
  addT("kaito_15", () => true, "kaito", "determined", "やみの なかで たちとまっている ときも、 ソラや ユイの かおだけは いちども わすれなかったよ。");
  addT("kaito_16", () => true, "kaito", "smile", "ふなのりはな、 あらしの よるほど とおくの ともしびを さがす。 みえない ときは こころの ともしびを しんじるのさ。");
  addT("kaito_17", () => isNight(), "kaito", "neutral", "よるの うみは しずかだが、 ゆだんは きんもつだ。 くらやみの なかにこそ、 しんじつが ひそんでいる。");
  addT("kaito_18", () => !isNight(), "kaito", "joy", "あさの ひかりを あびながら のむ みずは うまいな！ さあ、 きょうも しっかり すすむぞ！");
  addT("kaito_19", () => recentBattle()?.isBoss && recentBattle()?.res === "win", "kaito", "determined", "てごわい あいてだったが、 おまえの つるぎすじ、 カイトの ちを しっかり うけついでるぜ。");
  addT("kaito_20", () => recentBattle()?.res === "flee", "kaito", "smile", "ひききわを しるのも ふなのりの てっそくだ。 いのちさえ ありゃあ、 いつでも たてなおせる！");
  addT("kaito_21", () => true, "kaito", "smile", "{name}。 マフラー、 ちゃんと やくに たっているようだな。",
    "sora", "determined", "うん！ とうさんが かえってくるまで、 ずっと これを にぎりしめてたんだ。",
    "who(\"kaito\",\"joy\",\"そうか……。 りっぱに なったな。 もう おまえが、 この しまの ともしびまもりだ。\")");
  addT("kaito_22", () => true, "kaito", "smile", "ミオちゃん、 のどの ちょうしは どうだい？ しおかぜで いためたら やくそうちゃを のみなよ。",
    "mio", "smile", "だいじょうぶです、 カイトさん！ いまは げんきに うたえますよ！",
    "who(\"kaito\",\"joy\",\"がはは！ むりは せずに こまめに やすみなよ！\")");
  addT("kaito_23", () => true, "kaito", "smile", "リク、 その やり、 かじやの あにきに いちど みせてみろ。 いい といしを もってるぞ。",
    "riku", "smirk", "ゲンのおっさんか…… むくちで ふえが、 うでは たしか だからな。 たのんでみるぜ。",
    "who(\"kaito\",\"smile\",\"てれやな だけさ。 おまえみたいな ほねのある わかものは だいこうぶつだぞ。\")");
  addT("kaito_24", () => true, "kaito", "smile", "サナちゃん。 いつも みんなを いのりで つつんでくれて ありがとうな。",
    "sana", "smile", "いいえ、 わたしこそ、 カイトさんの どっしりした そんざいに はげまされています。",
    "who(\"kaito\",\"joy\",\"そう いってもらえると、 オヤジみょうりに ことごときるよ！\")");
  addT("kaito_25", () => F().c3reunion, "kaito", "smile", "ハルちゃん、 しまの かぜは どうだい？", "haru", "joy", "しおの においが して、 あたたかいね。");
  addT("kaito_26", () => inPalace(), "kaito", "determined", "深淵の宮…… ともしびの とどかない ばしょなど、 このよに あっては ならないんだ。");
  addT("kaito_27", () => inTrench(), "kaito", "neutral", "この ふかい みぞの さき…… うみの しんぞうが みゃくうっているような いあつかんを かんじるな。");
  addT("kaito_28", () => K.G.gold > 10000, "kaito", "joy", "おおがねもちちだな！ かあさんに しられたら、 また かけいぼを つけろと いかられそうだ！");
  addT("kaito_29", () => isLowHp(K.member("sora")), "kaito", "worried", "{name}！ むちゃを するな！ とうさんの せなかに かくれていろ！");
  addT("kaito_30", () => inTown() && K.G.region === 1, "kaito", "smile", "ミナトは にぎやかだな。 ふねを みると うみの ひろさを おもうよ。");
  addT("kaito_31", () => inTown() && K.G.region === 3, "kaito", "smile", "あわの なかにも くらしが ある。 さとの ひとたちの こえを きこう。");
  addT("kaito_32", () => true, "kaito", "neutral", "うみは こうだいで、 にんげんなんて ちっぽけな そんざいだ。 だからこそ、 たすけあわなきゃ いきていけん。");
  addT("kaito_33", () => true, "kaito", "smile", "ソラ、 おまえの なかまたちは さいこうだな。 いい めを している。");
  addT("kaito_34", () => F().c4done, "kaito", "smile", "これで うみのそこの ふなじも あんたいだ。 ふなのりたちも、 まよわずに みなとへ かえれるだろう。");
  addT("kaito_35", () => K.G.region === 0 && !isNight(), "kaito", "joy", "しおかぜが ここちいいな！ あにきの こうぼうへ よって、 くわでも といでもらうか！");
  addT("kaito_36", () => true, "kaito", "determined", "いかりなげの コツはな、 わんりょくじゃねえ、 こしの ひねりと かくごだ！");
  addT("kaito_37", () => true, "kaito", "smile", "みんなで あるくと ちがう けしきが みえるな。 ひとりで あわてることは ない。");
  addT("kaito_38", () => true, "kaito", "joy", "さあ、 かじを とれ、 ソラ！ おまえが きめた ほうがくなら、 とうさんは どこへでも ついていくぞ！");
  addT("kaito_39", () => true, "kaito", "determined", "ともしびは けさせん。 この いのちが つづく かぎりな。");
  addT("kaito_40", () => true, "kaito", "smile", "よし、 いくぞ！ かえるばしょが あるから、 にんは とおくまで たびが できるんだ！");
  addT('sora_everyday_01', () => true, 'sora', 'smile', "くつの ひも、 むすびなおして おこう。");
  addT('sora_everyday_02', () => true, 'sora', 'smile', "みちの はしにも はなが あるね。");
  addT('sora_everyday_03', () => true, 'sora', 'smile', "マフラーを ととのえると きもちが おちつく。");
  addT('sora_everyday_04', () => true, 'sora', 'smile', "ぼくの はやさに むりに あわせなくて いいよ。");
  addT('sora_everyday_05', () => true, 'sora', 'smile', "ひとつずつ たしかめれば だいじょうぶ。");
  addT('sora_everyday_06', () => true, 'sora', 'smile', "あしあとを みると あるいた ぶんが わかるね。");
  addT('sora_everyday_07', () => true, 'sora', 'smile', "いきを そろえてから すすもう。");
  addT('sora_everyday_08', () => true, 'sora', 'smile', "まわりを みるために たちどまるのも いいね。");
  addT('sora_everyday_09', () => true, 'sora', 'smile', "もっている どうぐを たしかめよう。");
  addT('sora_everyday_10', () => true, 'sora', 'smile', "こまったときは ひとりで がまんしないでね。");
  addT('sora_everyday_11', () => true, 'sora', 'smile', "マフラーが かぜの むきを おしえてくれるよ。");
  addT('sora_everyday_12', () => true, 'sora', 'smile', "くつの そこに すなが ついちゃった。");
  addT('sora_everyday_13', () => true, 'sora', 'smile', "みんなの あしおと、 それぞれ ちがうんだね。");
  addT('sora_everyday_14', () => true, 'sora', 'smile', "いそぐときほど あしもとを みよう。");
  addT('sora_everyday_15', () => true, 'sora', 'smile', "ちいさな しんせつも うれしいよ。");
  addT('sora_everyday_16', () => true, 'sora', 'smile', "とおくを みたら ちかくも たしかめよう。");
  addT('sora_everyday_17', () => true, 'sora', 'smile', "おなかが へるまえに ごはんの ことを かんがえよう。");
  addT('sora_everyday_18', () => true, 'sora', 'smile', "あかりが あれば みちを たしかめやすいね。");
  addT('sora_everyday_19', () => true, 'sora', 'smile', "かばんの おもさ、 へいきかな。");
  addT('sora_everyday_20', () => true, 'sora', 'smile', "まがりみちは ゆっくり いこう。");
  addT('sora_everyday_21', () => true, 'sora', 'smile', "つかれたら こえを かけてね。");
  addT('sora_everyday_22', () => true, 'sora', 'smile', "まっすぐ すすめない みちも あるんだね。");
  addT('sora_everyday_23', () => true, 'sora', 'smile', "いまの かぜ、 すこし すずしいね。");
  addT('sora_everyday_24', () => true, 'sora', 'smile', "ぼくも みんなの てつだいが したいな。");
  addT('sora_everyday_25', () => true, 'sora', 'smile', "いつでも かえる みちを たしかめておこう。");
  addT('mio_everyday_01', () => true, 'mio', 'smile', "うたうまえに おみずを のもうっと。");
  addT('mio_everyday_02', () => true, 'mio', 'smile', "すこし あるくと こえも ほぐれるね。");
  addT('mio_everyday_03', () => true, 'mio', 'smile', "みんなの あしおとで リズムが できるよ。");
  addT('mio_everyday_04', () => true, 'mio', 'smile', "あせると いきが つづかないんだ。");
  addT('mio_everyday_05', () => true, 'mio', 'smile', "きょうの かぜは どんな おとかな。");
  addT('mio_everyday_06', () => true, 'mio', 'smile', "はなを みつけたら そっと よけて あるこう。");
  addT('mio_everyday_07', () => true, 'mio', 'smile', "ちいさく うたっても となりには とどくよ。");
  addT('mio_everyday_08', () => true, 'mio', 'smile', "のどを やすめる じかんも たいせつだね。");
  addT('mio_everyday_09', () => true, 'mio', 'smile', "わたしの ベスト、 きれいに ととのえよう。");
  addT('mio_everyday_10', () => true, 'mio', 'smile', "おしゃべりしてると みちが みじかく かんじるな。");
  addT('mio_everyday_11', () => true, 'mio', 'smile', "すぐに こたえなくても だいじょうぶだよ。");
  addT('mio_everyday_12', () => true, 'mio', 'smile', "ひといき ついてから つぎの うたに しよう。");
  addT('riku_everyday_01', () => true, 'riku', 'smile', "やりの さきに さわるなよ。");
  addT('riku_everyday_02', () => true, 'riku', 'smile', "くつに いしが はいった。 とりのぞくぞ。");
  addT('riku_everyday_03', () => true, 'riku', 'smile', "むりに はやく あるくな。");
  addT('riku_everyday_04', () => true, 'riku', 'smile', "かばんを かたむけたら ものが おちるぞ。");
  addT('riku_everyday_05', () => true, 'riku', 'smile', "しずかに あるくと まわりの おとが わかる。");
  addT('riku_everyday_06', () => true, 'riku', 'smile', "やりを ふる はばは あけておけ。");
  addT('riku_everyday_07', () => true, 'riku', 'smile', "はらが へると いらいらする。 めしを わすれるな。");
  addT('riku_everyday_08', () => true, 'riku', 'smile', "あしもとの いしは よけて あるけよ。");
  addT('riku_everyday_09', () => true, 'riku', 'smile', "おれの はやさに あわせる ひつようは ねえ。");
  addT('riku_everyday_10', () => true, 'riku', 'smile', "とまって たしかめるのも わるくねえな。");
  addT('riku_everyday_11', () => true, 'riku', 'smile', "くつの そこを みておけ。 すべるぞ。");
  addT('riku_everyday_12', () => true, 'riku', 'smile', "……つかれたなら そう いえよ。 まってやる。");
  addT('sana_everyday_01', () => true, 'sana', 'smile', "おいのりの あとに ひといき つきましょう。");
  addT('sana_everyday_02', () => true, 'sana', 'smile', "かみかざりの むきを ととのえますね。");
  addT('sana_everyday_03', () => true, 'sana', 'smile', "あしもとの ちいさな はなも きれいです。");
  addT('sana_everyday_04', () => true, 'sana', 'smile', "あわてず みちを たしかめましょう。");
  addT('sana_everyday_05', () => true, 'sana', 'smile', "かばんの くちを とじておきましょうね。");
  addT('sana_everyday_06', () => true, 'sana', 'smile', "おみずを のむ じかんも とってください。");
  addT('sana_everyday_07', () => true, 'sana', 'smile', "みなさんの はやさに あわせて あるきます。");
  addT('sana_everyday_08', () => true, 'sana', 'smile', "しずかに みみを すますと かぜが きこえます。");
  addT('sana_everyday_09', () => true, 'sana', 'smile', "むりを している かたは いませんか。");
  addT('sana_everyday_10', () => true, 'sana', 'smile', "たちどまると みえるものも ありますね。");
  addT('sana_everyday_11', () => true, 'sana', 'smile', "みじかい ことばでも おれいは とどきます。");
  addT('sana_everyday_12', () => true, 'sana', 'smile', "すこし おちついてから すすみましょう。");
  addT('haru_everyday_01', () => true, 'haru', 'smile', "おうぎを たたむと かぜも しずかになるね。");
  addT('haru_everyday_02', () => true, 'haru', 'smile', "はっぱの ゆれかたで かぜを よむの。");
  addT('haru_everyday_03', () => true, 'haru', 'smile', "かぜが とまったら ひといき つこう。");
  addT('haru_everyday_04', () => true, 'haru', 'smile', "おうぎの ふちを たしかめておくね。");
  addT('haru_everyday_05', () => true, 'haru', 'smile', "ゆっくり あるいても かぜは ついてくるよ。");
  addT('haru_everyday_06', () => true, 'haru', 'smile', "みんなの ふくが おなじ むきに ゆれてるね。");
  addT('haru_everyday_07', () => true, 'haru', 'smile', "とぶまえに おりる ばしょを みよう。");
  addT('haru_everyday_08', () => true, 'haru', 'smile', "いきが あがったら すこし まとう。");
  addT('haru_everyday_09', () => true, 'haru', 'smile', "かぜに のるときは ちからを ぬくんだよ。");
  addT('haru_everyday_10', () => true, 'haru', 'smile', "まわりの おとを かぜが はこんでくるね。");
  addT('haru_everyday_11', () => true, 'haru', 'smile', "あしもとの くさも かぜを うけているよ。");
  addT('haru_everyday_12', () => true, 'haru', 'smile', "おうぎを そっと ひらく おとが すきなの。");
  addT('kaito_everyday_01', () => true, 'kaito', 'smile', "いかりの ひもを たしかめておくぞ。");
  addT('kaito_everyday_02', () => true, 'kaito', 'smile', "おもい どうぐは おちついて あつかえ。");
  addT('kaito_everyday_03', () => true, 'kaito', 'smile', "あしばを たしかめれば こわさも へるさ。");
  addT('kaito_everyday_04', () => true, 'kaito', 'smile', "とおくの ともしびだけでなく あしもとも みろよ。");
  addT('kaito_everyday_05', () => true, 'kaito', 'smile', "おれの うしろなら かぜを よけられるぞ。");
  addT('kaito_everyday_06', () => true, 'kaito', 'smile', "くつの ひもが ゆるんでないか。");
  addT('kaito_everyday_07', () => true, 'kaito', 'smile', "いそぐときほど ひといき つけ。");
  addT('kaito_everyday_08', () => true, 'kaito', 'smile', "いかりの さきに ちかづくなよ。");
  addT('kaito_everyday_09', () => true, 'kaito', 'smile', "かえる みちを おぼえるのも たびの うちだ。");
  addT('kaito_everyday_10', () => true, 'kaito', 'smile', "つかれたら やすめ。 まだ みちは つづくぞ。");
  addT('kaito_everyday_11', () => true, 'kaito', 'smile', "どうぐを ていれすると きもちも ととのう。");
  addT('kaito_everyday_12', () => true, 'kaito', 'smile', "みんなで あるくなら はやさを あわせよう。");
  addT('sora_quest', () => Object.values(K.G.req || {}).some(q => q.s === 'a'), 'sora', 'neutral', "たのまれた ことも ひとつずつ たしかめよう。 みんなの こえを ききたいな。");
  addT('mio_quest', () => Object.values(K.G.req || {}).some(q => q.s === 'a'), 'mio', 'neutral', "おてつだいの やくそく、 わすれないように きろくを みようね。");
  addT('riku_quest', () => Object.values(K.G.req || {}).some(q => q.s === 'a'), 'riku', 'neutral', "たのまれごとが のこってるな。 きろくを みとけよ。");
  addT('sana_quest', () => Object.values(K.G.req || {}).some(q => q.s === 'a'), 'sana', 'neutral', "たのみごとの きろくを たしかめましょう。 むりのない じゅんばんで。");
  addT('haru_quest', () => Object.values(K.G.req || {}).some(q => q.s === 'a'), 'haru', 'neutral', "だれかの たのみごとも かぜに のせず おぼえておこうね。");
  addT('kaito_quest', () => Object.values(K.G.req || {}).some(q => q.s === 'a'), 'kaito', 'neutral', "たのまれたことを たしかめるぞ。 ひとりで かかえこむなよ。");
  // 46種×15本。1〜10は常時、11昼、12夜、13地域、14選択個体の低HP、15同席かけあい。
  addT('m_watapoko_01', () => true, 'watapoko', 'smile', "もふっ。 ほっぺを なでても いいよ。");
  addT('m_watapoko_02', () => true, 'watapoko', 'smile', "おなかの わたは つぶさないでね。");
  addT('m_watapoko_03', () => true, 'watapoko', 'smile', "くさの においが すると はなを うごかしちゃう。");
  addT('m_watapoko_04', () => true, 'watapoko', 'smile', "ちいさな あしでも ちゃんと ついていくよ。");
  addT('m_watapoko_05', () => true, 'watapoko', 'smile', "やわらかい ものも つよく なれるんだ。");
  addT('m_watapoko_06', () => true, 'watapoko', 'smile', "ころんでも ふわっと おきあがるよ。");
  addT('m_watapoko_07', () => true, 'watapoko', 'smile', "その マフラーに くっつくと あんしんするな。");
  addT('m_watapoko_08', () => true, 'watapoko', 'smile', "もふもふは あったかさを わけられるんだ。");
  addT('m_watapoko_09', () => true, 'watapoko', 'smile', "せかさなくても はなを ひらく くさは あるよ。");
  addT('m_watapoko_10', () => true, 'watapoko', 'smile', "ぼくの あしあと、 ちっちゃいでしょ。");
  addT('m_watapoko_11', () => !isNight(), 'watapoko', 'smile', "ひなたで わたを ふくらませよう。");
  addT('m_watapoko_12', () => isNight(), 'watapoko', 'smile', "くらいときは しろい わたを めじるしに してね。");
  addT('m_watapoko_13', () => K.G.region === 0, 'watapoko', 'smile', "しおかぜで わたが ふわふわ おどるよ。");
  addT('m_watapoko_14', () => isLowHp(selectedMember), 'watapoko', 'smile', "わたの なかまで つかれちゃった。 ひとやすみ。");
  addT('m_watapoko_15', () => true, 'watapoko', 'smile', "ミオ、 おうたに あわせて もふもふ ゆれるね。", 'mio', 'smile', "うん！ あなたの こえも ちゃんと きこえてるよ。");
  addT('m_watafuwari_01', () => true, 'watafuwari', 'smile', "ふわり。 かぜの むきが かわったね。");
  addT('m_watafuwari_02', () => true, 'watafuwari', 'smile', "おおきな わたには すきまも たいせつなの。");
  addT('m_watafuwari_03', () => true, 'watafuwari', 'smile', "ひっぱらずに そっと さわってね。");
  addT('m_watafuwari_04', () => true, 'watafuwari', 'smile', "ゆっくり うごくと かぜが よく わかるの。");
  addT('m_watafuwari_05', () => true, 'watafuwari', 'smile', "ふくらんでても あしもとは みてるよ。");
  addT('m_watafuwari_06', () => true, 'watafuwari', 'smile', "あわてた こころも ふわっと ほどきたいな。");
  addT('m_watafuwari_07', () => true, 'watafuwari', 'smile', "もふもふの かげで すこし やすむ？");
  addT('m_watafuwari_08', () => true, 'watafuwari', 'smile', "わたを ならすと きもちも ととのうね。");
  addT('m_watafuwari_09', () => true, 'watafuwari', 'smile', "おもたい くうきを かるく できたら いいな。");
  addT('m_watafuwari_10', () => true, 'watafuwari', 'smile', "そらへ のびる くさにも さわってみたい。");
  addT('m_watafuwari_11', () => !isNight(), 'watafuwari', 'smile', "おひさまを すうと ふわりが ふえるの。");
  addT('m_watafuwari_12', () => isNight(), 'watafuwari', 'smile', "よるは わたの あいだに かぜを ためよう。");
  addT('m_watafuwari_13', () => K.G.region === 2, 'watafuwari', 'smile', "くもの ちかくは ふわふわ なかまが いっぱいね。");
  addT('m_watafuwari_14', () => isLowHp(selectedMember), 'watafuwari', 'smile', "すこし しぼんじゃった。 あせらず やすもう。");
  addT('m_watafuwari_15', () => true, 'watafuwari', 'smile', "ハル、 その おうぎの かぜは やさしいね。", 'haru', 'smile', "うん、 かぜを たしかめながら いこうね。");
  addT('m_iwanoko_01', () => true, 'iwanoko', 'smile', "ころっ。 こいしの うえも へいきだぞ。");
  addT('m_iwanoko_02', () => true, 'iwanoko', 'smile', "ちいさくても いわは いわだ。");
  addT('m_iwanoko_03', () => true, 'iwanoko', 'smile', "きずが ついても すぐには くだけないぞ。");
  addT('m_iwanoko_04', () => true, 'iwanoko', 'smile', "ぬれた いしは すべりやすい。 あしを みろよ。");
  addT('m_iwanoko_05', () => true, 'iwanoko', 'smile', "おれの せなか、 なかなか かたいだろ。");
  addT('m_iwanoko_06', () => true, 'iwanoko', 'smile', "まるい いしにも かどは あるんだ。");
  addT('m_iwanoko_07', () => true, 'iwanoko', 'smile', "おもさは あしで ささえるのさ。");
  addT('m_iwanoko_08', () => true, 'iwanoko', 'smile', "どっしり たつと こわさも へるぞ。");
  addT('m_iwanoko_09', () => true, 'iwanoko', 'smile', "こつこつ すすめば みちに なる。");
  addT('m_iwanoko_10', () => true, 'iwanoko', 'smile', "いしの すきまの くさは しぶといな。");
  addT('m_iwanoko_11', () => !isNight(), 'iwanoko', 'smile', "ひなたの いわは ぽかぽかだぞ。");
  addT('m_iwanoko_12', () => isNight(), 'iwanoko', 'smile', "よるの いわは ひやっと してるな。");
  addT('m_iwanoko_13', () => K.G.region === 1, 'iwanoko', 'smile', "すなに あしを とられないように あるこう。");
  addT('m_iwanoko_14', () => isLowHp(selectedMember), 'iwanoko', 'smile', "ひびく きずだ。 すこし うごきを やめるぞ。");
  addT('m_iwanoko_15', () => true, 'iwanoko', 'smile', "リク、 その やりを いわで こすらないようにな。", 'riku', 'smile', "おう。 むりは するなよ。");
  addT('m_iwagoron_01', () => true, 'iwagoron', 'smile', "ごろん。 おれの うしろなら かぜも よけられる。");
  addT('m_iwagoron_02', () => true, 'iwagoron', 'smile', "おおきな いわほど あしばを えらぶぞ。");
  addT('m_iwagoron_03', () => true, 'iwagoron', 'smile', "ころがる ときは まわりを みるんだ。");
  addT('m_iwagoron_04', () => true, 'iwagoron', 'smile', "おもさに たよりすぎると すなに しずむな。");
  addT('m_iwagoron_05', () => true, 'iwagoron', 'smile', "しずかに たつのも ちからの つかいかただ。");
  addT('m_iwagoron_06', () => true, 'iwagoron', 'smile', "いわの もようは ひとつずつ ちがうんだぞ。");
  addT('m_iwagoron_07', () => true, 'iwagoron', 'smile', "せなかを たたけば おとも ひびく。");
  addT('m_iwagoron_08', () => true, 'iwagoron', 'smile', "せまい みちは おれが あとから いこう。");
  addT('m_iwagoron_09', () => true, 'iwagoron', 'smile', "たおれないように みんなの あしばを みるぞ。");
  addT('m_iwagoron_10', () => true, 'iwagoron', 'smile', "かたい からだでも きを つけるのは おなじだ。");
  addT('m_iwagoron_11', () => !isNight(), 'iwagoron', 'smile', "ひが あたった いわは しばらく あたたかい。");
  addT('m_iwagoron_12', () => isNight(), 'iwagoron', 'smile', "よるは ゆっくり ひえていくな。");
  addT('m_iwagoron_13', () => K.G.region === 1, 'iwagoron', 'smile', "ひろい だいちは おれでも のびのび あるける。");
  addT('m_iwagoron_14', () => isLowHp(selectedMember), 'iwagoron', 'smile', "おもい からだが もっと おもい。 やすませてくれ。");
  addT('m_iwagoron_15', () => true, 'iwagoron', 'smile', "ソラ、 おれの かげを ひとやすみに つかっていいぞ。", 'sora', 'smile', "うん！ いっしょに いこう。");
  addT('m_mizumochi_01', () => true, 'mizumochi', 'smile', "ぷるっ。 みずの たまを まるく するよ。");
  addT('m_mizumochi_02', () => true, 'mizumochi', 'smile', "ぷるぷるしても こぼれないんだ。");
  addT('m_mizumochi_03', () => true, 'mizumochi', 'smile', "あついときは そばに おいで。");
  addT('m_mizumochi_04', () => true, 'mizumochi', 'smile', "かわいた かぜは ちょっと にがて。");
  addT('m_mizumochi_05', () => true, 'mizumochi', 'smile', "はねると おなかが ぽよんと するよ。");
  addT('m_mizumochi_06', () => true, 'mizumochi', 'smile', "こいしに あたった みずは きらきらするね。");
  addT('m_mizumochi_07', () => true, 'mizumochi', 'smile', "ちいさな しずくにも そらが うつるよ。");
  addT('m_mizumochi_08', () => true, 'mizumochi', 'smile', "つめたさを すこし わけてあげる。");
  addT('m_mizumochi_09', () => true, 'mizumochi', 'smile', "はねすぎて しずくを とばさないように するね。");
  addT('m_mizumochi_10', () => true, 'mizumochi', 'smile', "おみずの においを さがしてるんだ。");
  addT('m_mizumochi_11', () => !isNight(), 'mizumochi', 'smile', "ひかりを うけると からだが すけるよ。");
  addT('m_mizumochi_12', () => isNight(), 'mizumochi', 'smile', "よるの しずくは ひんやり おいしいね。");
  addT('m_mizumochi_13', () => K.G.region === 1, 'mizumochi', 'smile', "はまの すななら やわらかく はねられる。");
  addT('m_mizumochi_14', () => isLowHp(selectedMember), 'mizumochi', 'smile', "ぷるぷるが とまらない。 やすみたいな。");
  addT('m_mizumochi_15', () => true, 'mizumochi', 'smile', "ミオ、 おうたの おとで みずが ゆれるよ。", 'mio', 'smile', "うん！ あなたの こえも ちゃんと きこえてるよ。");
  addT('m_mizudaifuku_01', () => true, 'mizudaifuku', 'smile', "ぷるるん。 この かんむり、 にあうかしら。");
  addT('m_mizudaifuku_02', () => true, 'mizudaifuku', 'smile', "ひんやりした あたまが おきにいりなの。");
  addT('m_mizudaifuku_03', () => true, 'mizudaifuku', 'smile', "しおの ながれは ゆっくり たしかめるのよ。");
  addT('m_mizudaifuku_04', () => true, 'mizudaifuku', 'smile', "まるい からだでも ちゃんと すすめるわ。");
  addT('m_mizudaifuku_05', () => true, 'mizudaifuku', 'smile', "みずを はじく おと、 すてきでしょう。");
  addT('m_mizudaifuku_06', () => true, 'mizudaifuku', 'smile', "はねた あとに のこる しずくも きれいね。");
  addT('m_mizudaifuku_07', () => true, 'mizudaifuku', 'smile', "わたしの そばは すずしいわよ。");
  addT('m_mizudaifuku_08', () => true, 'mizudaifuku', 'smile', "おおなみも ちいさな ゆれから はじまるの。");
  addT('m_mizudaifuku_09', () => true, 'mizudaifuku', 'smile', "かんむりを かたむけずに あるくのが こつよ。");
  addT('m_mizudaifuku_10', () => true, 'mizudaifuku', 'smile', "やわらかさは よわさとは ちがうわ。");
  addT('m_mizudaifuku_11', () => !isNight(), 'mizudaifuku', 'smile', "ひかりの なかで かんむりが かがやくわ。");
  addT('m_mizudaifuku_12', () => isNight(), 'mizudaifuku', 'smile', "よるは みずの おとを たのしみましょう。");
  addT('m_mizudaifuku_13', () => K.G.region === 3, 'mizudaifuku', 'smile', "うみの そこでも しおの ながれを かんじるわ。");
  addT('m_mizudaifuku_14', () => isLowHp(selectedMember), 'mizudaifuku', 'smile', "ぷるんと できないわ。 すこし やすみましょう。");
  addT('m_mizudaifuku_15', () => true, 'mizudaifuku', 'smile', "カイトさん、 いまも しおの かおりが するわね。", 'kaito', 'smile', "おう。 まわりを みながら、 いっしょに すすもう。");
  addT('m_hoshikage_01', () => true, 'hoshikage', 'smile', "ちらっ。 かげにも ひかりの ふちが あるよ。");
  addT('m_hoshikage_02', () => true, 'hoshikage', 'smile', "みえる ところだけが ぜんぶじゃ ないんだ。");
  addT('m_hoshikage_03', () => true, 'hoshikage', 'smile', "そっと あるくのが すきなんだ。");
  addT('m_hoshikage_04', () => true, 'hoshikage', 'smile', "まぶしいときは すこし かげへ いこう。");
  addT('m_hoshikage_05', () => true, 'hoshikage', 'smile', "ちいさな ひかりを みつけたよ。");
  addT('m_hoshikage_06', () => true, 'hoshikage', 'smile', "あしもとの かげも いっしょに あるいてる。");
  addT('m_hoshikage_07', () => true, 'hoshikage', 'smile', "くらさに なれたら みえるものも あるよ。");
  addT('m_hoshikage_08', () => true, 'hoshikage', 'smile', "ひかりを じゃましない ところに いるね。");
  addT('m_hoshikage_09', () => true, 'hoshikage', 'smile', "かげの ながさは すこしずつ かわるんだ。");
  addT('m_hoshikage_10', () => true, 'hoshikage', 'smile', "だまってても ここに いるよ。");
  addT('m_hoshikage_11', () => !isNight(), 'hoshikage', 'smile', "ひなたは かげが くっきりするね。");
  addT('m_hoshikage_12', () => isNight(), 'hoshikage', 'smile', "よるは ぼくの おとを たよりに してね。");
  addT('m_hoshikage_13', () => K.G.region === 2, 'hoshikage', 'smile', "くもの かげは かたちが かわって おもしろい。");
  addT('m_hoshikage_14', () => isLowHp(selectedMember), 'hoshikage', 'smile', "かげまで ちぢみそう。 やすもう。");
  addT('m_hoshikage_15', () => true, 'hoshikage', 'smile', "サナ、 ちいさな ひかりも ちゃんと みえるよ。", 'sana', 'smile', "はい。 そばに いてくださって うれしいです。");
  addT('m_hoshimikage_01', () => true, 'hoshimikage', 'smile', "すうっ。 ひかりの あいだを ぬって すすもう。");
  addT('m_hoshimikage_02', () => true, 'hoshimikage', 'smile', "かげが のびても こわがらなくて いい。");
  addT('m_hoshimikage_03', () => true, 'hoshimikage', 'smile', "うごかない かげにも かぜは とおる。");
  addT('m_hoshimikage_04', () => true, 'hoshimikage', 'smile', "よく みると くらさにも いろが ある。");
  addT('m_hoshimikage_05', () => true, 'hoshimikage', 'smile', "しずかな ばしょで まわりを みよう。");
  addT('m_hoshimikage_06', () => true, 'hoshimikage', 'smile', "ひかりの ふちに たつのが おちつくな。");
  addT('m_hoshimikage_07', () => true, 'hoshimikage', 'smile', "かげを おいかけても つかまらないぞ。");
  addT('m_hoshimikage_08', () => true, 'hoshimikage', 'smile', "まぶしさと くらさ、 どちらも たいせつだ。");
  addT('m_hoshimikage_09', () => true, 'hoshimikage', 'smile', "そばに いる。 ふりむかなくても いい。");
  addT('m_hoshimikage_10', () => true, 'hoshimikage', 'smile', "せかさずに めを なじませよう。");
  addT('m_hoshimikage_11', () => !isNight(), 'hoshimikage', 'smile', "ひるの かげは みちを かくしすぎないな。");
  addT('m_hoshimikage_12', () => isNight(), 'hoshimikage', 'smile', "よるは ほしの ひかりを さがそう。");
  addT('m_hoshimikage_13', () => K.G.region === 1, 'hoshimikage', 'smile', "すなの うえの かげは はっきりしている。");
  addT('m_hoshimikage_14', () => isLowHp(selectedMember), 'hoshimikage', 'smile', "ちからが うすれている。 あかりの そばで やすもう。");
  addT('m_hoshimikage_15', () => true, 'hoshimikage', 'smile', "リク、 かげを ふんでも やりは いたまないぞ。", 'riku', 'smile', "おう。 むりは するなよ。");
  addT('m_yorukoumori_01', () => true, 'yorukoumori', 'smile', "ぱたっ。 はねを ひろげる すきまは あるかな。");
  addT('m_yorukoumori_02', () => true, 'yorukoumori', 'smile', "さかさに なっても みちは わかるよ。");
  addT('m_yorukoumori_03', () => true, 'yorukoumori', 'smile', "おとが かえってくるのを きいてるんだ。");
  addT('m_yorukoumori_04', () => true, 'yorukoumori', 'smile', "ちいさな みみも よく はたらくぞ。");
  addT('m_yorukoumori_05', () => true, 'yorukoumori', 'smile', "とぶまえに まわりを たしかめるね。");
  addT('m_yorukoumori_06', () => true, 'yorukoumori', 'smile', "はねの うらは やわらかいんだ。");
  addT('m_yorukoumori_07', () => true, 'yorukoumori', 'smile', "おおごえだと びっくりしちゃうよ。");
  addT('m_yorukoumori_08', () => true, 'yorukoumori', 'smile', "おとが ひびく かべは ちかいね。");
  addT('m_yorukoumori_09', () => true, 'yorukoumori', 'smile', "ちょっと たかく とぶと みちが みえる。");
  addT('m_yorukoumori_10', () => true, 'yorukoumori', 'smile', "つばさを たたむと こぢんまりするよ。");
  addT('m_yorukoumori_11', () => !isNight(), 'yorukoumori', 'smile', "ひるは まぶしいから めを ほそめるんだ。");
  addT('m_yorukoumori_12', () => isNight(), 'yorukoumori', 'smile', "よるは ぼくの でばんだね。");
  addT('m_yorukoumori_13', () => K.G.region === 0, 'yorukoumori', 'smile', "いわの おとが よく かえってくる みちだ。");
  addT('m_yorukoumori_14', () => isLowHp(selectedMember), 'yorukoumori', 'smile', "はねが おもい。 すこし とまらせて。");
  addT('m_yorukoumori_15', () => true, 'yorukoumori', 'smile', "ハル、 かぜを よむと とびやすく なるね。", 'haru', 'smile', "うん、 かぜを たしかめながら いこうね。");
  addT('m_yoibasa_01', () => true, 'yoibasa', 'smile', "ばさり。 おおきな はねを ぶつけないように するぞ。");
  addT('m_yoibasa_02', () => true, 'yoibasa', 'smile', "うしろの かぜまで みみに とどく。");
  addT('m_yoibasa_03', () => true, 'yoibasa', 'smile', "しずかに とべば おとを ひろえるんだ。");
  addT('m_yoibasa_04', () => true, 'yoibasa', 'smile', "つばさを ひらくと かげが ひろいな。");
  addT('m_yoibasa_05', () => true, 'yoibasa', 'smile', "おれの とぶ たかさに むりに あわせなくて いい。");
  addT('m_yoibasa_06', () => true, 'yoibasa', 'smile', "きゅうに まがるときは こえを かけるぞ。");
  addT('m_yoibasa_07', () => true, 'yoibasa', 'smile', "はねの すきまも ていれするんだ。");
  addT('m_yoibasa_08', () => true, 'yoibasa', 'smile', "せまい ところは たたんで あるこう。");
  addT('m_yoibasa_09', () => true, 'yoibasa', 'smile', "とおい おとを きいて みちを えらぶ。");
  addT('m_yoibasa_10', () => true, 'yoibasa', 'smile', "かぜを うけすぎないのが こつだな。");
  addT('m_yoibasa_11', () => !isNight(), 'yoibasa', 'smile', "ひが まぶしくても みみは はたらく。");
  addT('m_yoibasa_12', () => isNight(), 'yoibasa', 'smile', "よるの くうきは おとが よく とおるな。");
  addT('m_yoibasa_13', () => K.G.region === 2, 'yoibasa', 'smile', "くもの あいだなら はねを のびのび ひろげられる。");
  addT('m_yoibasa_14', () => isLowHp(selectedMember), 'yoibasa', 'smile', "はばたきが にぶい。 いったん たたもう。");
  addT('m_yoibasa_15', () => true, 'yoibasa', 'smile', "ソラ、 おれの はねの したは せまいから きをつけろよ。", 'sora', 'smile', "うん！ いっしょに いこう。");
  addT('m_tsuchimogu_01', () => true, 'tsuchimogu', 'smile', "もぐっ。 あしの したの つちは どうかな。");
  addT('m_tsuchimogu_02', () => true, 'tsuchimogu', 'smile', "つめの あいだの つちも おとしておくよ。");
  addT('m_tsuchimogu_03', () => true, 'tsuchimogu', 'smile', "ほるまえに だれかの あしが ないか みるんだ。");
  addT('m_tsuchimogu_04', () => true, 'tsuchimogu', 'smile', "やわらかい つちの におい、 すきだな。");
  addT('m_tsuchimogu_05', () => true, 'tsuchimogu', 'smile', "じめんの おとを きくと おちつく。");
  addT('m_tsuchimogu_06', () => true, 'tsuchimogu', 'smile', "いしに あたったら むりに ほらないよ。");
  addT('m_tsuchimogu_07', () => true, 'tsuchimogu', 'smile', "あなを あけたら あとを たしかめるんだ。");
  addT('m_tsuchimogu_08', () => true, 'tsuchimogu', 'smile', "はなに つちが ついちゃった。");
  addT('m_tsuchimogu_09', () => true, 'tsuchimogu', 'smile', "あしもとを みるのも たびの しごとだよ。");
  addT('m_tsuchimogu_10', () => true, 'tsuchimogu', 'smile', "つちの なかにも すきまが あるんだ。");
  addT('m_tsuchimogu_11', () => !isNight(), 'tsuchimogu', 'smile', "ひなたの つちは かわきやすいね。");
  addT('m_tsuchimogu_12', () => isNight(), 'tsuchimogu', 'smile', "よるは つちが しっとりしてくる。");
  addT('m_tsuchimogu_13', () => K.G.region === 1, 'tsuchimogu', 'smile', "だいりくの つちは ばしょで いろが ちがうな。");
  addT('m_tsuchimogu_14', () => isLowHp(selectedMember), 'tsuchimogu', 'smile', "つめを うごかすのも つらい。 ひとやすみ。");
  addT('m_tsuchimogu_15', () => true, 'tsuchimogu', 'smile', "リク、 やりの さきで あなを ほらないでね。", 'riku', 'smile', "おう。 むりは するなよ。");
  addT('m_hanapokke_01', () => true, 'hanapokke', 'smile', "ぽけっ。 はなびらに かぜが さわったよ。");
  addT('m_hanapokke_02', () => true, 'hanapokke', 'smile', "はっぱを きれいに ならべよう。");
  addT('m_hanapokke_03', () => true, 'hanapokke', 'smile', "はなは むりに ひっぱらないでね。");
  addT('m_hanapokke_04', () => true, 'hanapokke', 'smile', "いい においを すこし わけるよ。");
  addT('m_hanapokke_05', () => true, 'hanapokke', 'smile', "つぼみを みてると まちたく なるね。");
  addT('m_hanapokke_06', () => true, 'hanapokke', 'smile', "はなびらの かげも やわらかいよ。");
  addT('m_hanapokke_07', () => true, 'hanapokke', 'smile', "くさの あいだに すわるのが すき。");
  addT('m_hanapokke_08', () => true, 'hanapokke', 'smile', "みずが あったら はっぱも うれしい。");
  addT('m_hanapokke_09', () => true, 'hanapokke', 'smile', "はなを むけると かぜが わかるね。");
  addT('m_hanapokke_10', () => true, 'hanapokke', 'smile', "すこしずつ ひらく じかんが たいせつ。");
  addT('m_hanapokke_11', () => !isNight(), 'hanapokke', 'smile', "ひかりで はなびらが あかるくなるよ。");
  addT('m_hanapokke_12', () => isNight(), 'hanapokke', 'smile', "よるは はなを そっと やすませよう。");
  addT('m_hanapokke_13', () => K.G.region === 0, 'hanapokke', 'smile', "しまの かぜは はなを よく ゆらすね。");
  addT('m_hanapokke_14', () => isLowHp(selectedMember), 'hanapokke', 'smile', "はっぱが しおれてきた。 やすませて。");
  addT('m_hanapokke_15', () => true, 'hanapokke', 'smile', "ミオ、 はなに むかって ちいさく うたってみて。", 'mio', 'smile', "うん！ あなたの こえも ちゃんと きこえてるよ。");
  addT('m_hanakanmuri_01', () => true, 'hanakanmuri', 'smile', "さらり。 はなの わっかを ととのえます。");
  addT('m_hanakanmuri_02', () => true, 'hanakanmuri', 'smile', "ひとつの はなだけでは わっかに ならないの。");
  addT('m_hanakanmuri_03', () => true, 'hanakanmuri', 'smile', "となりの はなと ゆずりあうのよ。");
  addT('m_hanakanmuri_04', () => true, 'hanakanmuri', 'smile', "かんむりは そっと あつかってね。");
  addT('m_hanakanmuri_05', () => true, 'hanakanmuri', 'smile', "はなびらが とんでも あわてないで。");
  addT('m_hanakanmuri_06', () => true, 'hanakanmuri', 'smile', "はっぱの みどりも すてきでしょう。");
  addT('m_hanakanmuri_07', () => true, 'hanakanmuri', 'smile', "かおりは ゆっくり たしかめてね。");
  addT('m_hanakanmuri_08', () => true, 'hanakanmuri', 'smile', "まるい わっかは みんなを つなぐの。");
  addT('m_hanakanmuri_09', () => true, 'hanakanmuri', 'smile', "きれいなものを まもるのにも ちからが いるわ。");
  addT('m_hanakanmuri_10', () => true, 'hanakanmuri', 'smile', "かぜの こえを はなで うけているの。");
  addT('m_hanakanmuri_11', () => !isNight(), 'hanakanmuri', 'smile', "ひなたでは かんむりの いろが よく みえるわ。");
  addT('m_hanakanmuri_12', () => isNight(), 'hanakanmuri', 'smile', "よるは はなの かおりが ちかくに あるわね。");
  addT('m_hanakanmuri_13', () => K.G.region === 2, 'hanakanmuri', 'smile', "くもの うえの かぜは わっかを ゆらすわ。");
  addT('m_hanakanmuri_14', () => isLowHp(selectedMember), 'hanakanmuri', 'smile', "かんむりが かたむいたわ。 やすみましょう。");
  addT('m_hanakanmuri_15', () => true, 'hanakanmuri', 'smile', "サナ、 その かみかざりと おはなの いろが あうわね。", 'sana', 'smile', "はい。 そばに いてくださって うれしいです。");
  addT('m_sunawani_01', () => true, 'sunawani', 'smile', "ぐわっ。 すなの おとを きいてるぞ。");
  addT('m_sunawani_02', () => true, 'sunawani', 'smile', "くちを とじれば すなも はいらないな。");
  addT('m_sunawani_03', () => true, 'sunawani', 'smile', "おなかを じめんに つけると ひんやりする。");
  addT('m_sunawani_04', () => true, 'sunawani', 'smile', "あわてて かむのは よくないぞ。");
  addT('m_sunawani_05', () => true, 'sunawani', 'smile', "しっぽの ぶんも みちを あけてくれ。");
  addT('m_sunawani_06', () => true, 'sunawani', 'smile', "うろこの あいだに すなが はさまるんだ。");
  addT('m_sunawani_07', () => true, 'sunawani', 'smile', "すなに のこる あとを みてみろよ。");
  addT('m_sunawani_08', () => true, 'sunawani', 'smile', "じっとしてるのも とくいなのさ。");
  addT('m_sunawani_09', () => true, 'sunawani', 'smile', "おれの うしろを とおるときは こえを かけろ。");
  addT('m_sunawani_10', () => true, 'sunawani', 'smile', "かたいものは むりに かまないぞ。");
  addT('m_sunawani_11', () => !isNight(), 'sunawani', 'smile', "ひるの すなは おなかが あついな。");
  addT('m_sunawani_12', () => isNight(), 'sunawani', 'smile', "よるは すなも ひえて あんしんだ。");
  addT('m_sunawani_13', () => K.G.region === 1, 'sunawani', 'smile', "すなが ひろいな。 のびのび あるけるぞ。");
  addT('m_sunawani_14', () => isLowHp(selectedMember), 'sunawani', 'smile', "あごにも ちからが はいらない。 やすむぞ。");
  addT('m_sunawani_15', () => true, 'sunawani', 'smile', "カイト、 いかりを すなに おとすと うまりそうだな。", 'kaito', 'smile', "おう。 まわりを みながら、 いっしょに すすもう。");
  addT('m_sunawaniking_01', () => true, 'sunawaniking', 'smile', "ぐおう。 おれの とおる はばを たしかめろ。");
  addT('m_sunawaniking_02', () => true, 'sunawaniking', 'smile', "おおきな からだほど ゆっくり まがるぞ。");
  addT('m_sunawaniking_03', () => true, 'sunawaniking', 'smile', "うろこを みがけば すなも おちる。");
  addT('m_sunawaniking_04', () => true, 'sunawaniking', 'smile', "どっしり かまえて まわりを みるんだ。");
  addT('m_sunawaniking_05', () => true, 'sunawaniking', 'smile', "つよい あごでも みずは そっと のむぞ。");
  addT('m_sunawaniking_06', () => true, 'sunawaniking', 'smile', "おれが さきに あしばを たしかめよう。");
  addT('m_sunawaniking_07', () => true, 'sunawaniking', 'smile', "しっぽを ふると すなが とぶからな。");
  addT('m_sunawaniking_08', () => true, 'sunawaniking', 'smile', "すなの ながれに さからうな。");
  addT('m_sunawaniking_09', () => true, 'sunawaniking', 'smile', "かどの ある いしは よけて あるこう。");
  addT('m_sunawaniking_10', () => true, 'sunawaniking', 'smile', "つよさは だれかを まもるために つかうぞ。");
  addT('m_sunawaniking_11', () => !isNight(), 'sunawaniking', 'smile', "ひが つよい。 うろこも あつく なってきた。");
  addT('m_sunawaniking_12', () => isNight(), 'sunawaniking', 'smile', "よるの ひろい すなちなら すごしやすい。");
  addT('m_sunawaniking_13', () => K.G.region === 1, 'sunawaniking', 'smile', "だいりくの みちなら おれの あしあとも のこるな。");
  addT('m_sunawaniking_14', () => isLowHp(selectedMember), 'sunawaniking', 'smile', "この おもさを ささえるのが つらい。 やすませろ。");
  addT('m_sunawaniking_15', () => true, 'sunawaniking', 'smile', "リク、 おれの うろこを たてに しても いいぞ。", 'riku', 'smile', "おう。 むりは するなよ。");
  addT('m_sabotenbo_01', () => true, 'sabotenbo', 'smile', "ちくっ。 とげの そばは ゆっくりね。");
  addT('m_sabotenbo_02', () => true, 'sabotenbo', 'smile', "おみずは だいじに するんだ。");
  addT('m_sabotenbo_03', () => true, 'sabotenbo', 'smile', "まるくても とげは あるよ。");
  addT('m_sabotenbo_04', () => true, 'sabotenbo', 'smile', "すなに たつと あしが おちつく。");
  addT('m_sabotenbo_05', () => true, 'sabotenbo', 'smile', "だきつく まえに とげを みてね。");
  addT('m_sabotenbo_06', () => true, 'sabotenbo', 'smile', "つよい かぜでも ふんばるよ。");
  addT('m_sabotenbo_07', () => true, 'sabotenbo', 'smile', "かわいてても あわてないのが こつ。");
  addT('m_sabotenbo_08', () => true, 'sabotenbo', 'smile', "とげの かげは ほそいね。");
  addT('m_sabotenbo_09', () => true, 'sabotenbo', 'smile', "みずを こぼさず のむのって むずかしいな。");
  addT('m_sabotenbo_10', () => true, 'sabotenbo', 'smile', "ゆっくり そだつのも わるくない。");
  addT('m_sabotenbo_11', () => !isNight(), 'sabotenbo', 'smile', "おひさまが つよくても へいきだよ。");
  addT('m_sabotenbo_12', () => isNight(), 'sabotenbo', 'smile', "よるは とげに しずくが つくかな。");
  addT('m_sabotenbo_13', () => K.G.region === 1, 'sabotenbo', 'smile', "すなの みちは ぼくに ぴったり。");
  addT('m_sabotenbo_14', () => isLowHp(selectedMember), 'sabotenbo', 'smile', "とげまで げんきが ない。 やすみたい。");
  addT('m_sabotenbo_15', () => true, 'sabotenbo', 'smile', "ソラ、 マフラーを とげに ひっかけないでね。", 'sora', 'smile', "うん！ いっしょに いこう。");
  addT('m_yukiusa_01', () => true, 'yukiusa', 'smile', "ぴょん。 ゆきみたいに やわらかく はねるよ。");
  addT('m_yukiusa_02', () => true, 'yukiusa', 'smile', "みみを たてると かぜが わかるね。");
  addT('m_yukiusa_03', () => true, 'yukiusa', 'smile', "しろい あしでも あしあとは のこるよ。");
  addT('m_yukiusa_04', () => true, 'yukiusa', 'smile', "つめたい ところも へいきなんだ。");
  addT('m_yukiusa_05', () => true, 'yukiusa', 'smile', "おはなを ひくひく してみよう。");
  addT('m_yukiusa_06', () => true, 'yukiusa', 'smile', "あたたかいものには ゆっくり ちかづくの。");
  addT('m_yukiusa_07', () => true, 'yukiusa', 'smile', "はねるまえに あしばを みるよ。");
  addT('m_yukiusa_08', () => true, 'yukiusa', 'smile', "ふわふわの けを ととのえよう。");
  addT('m_yukiusa_09', () => true, 'yukiusa', 'smile', "みみの さきまで きを くばるんだ。");
  addT('m_yukiusa_10', () => true, 'yukiusa', 'smile', "あしを そろえると ちいさく なれるよ。");
  addT('m_yukiusa_11', () => !isNight(), 'yukiusa', 'smile', "ひなたは すこし まぶしいな。");
  addT('m_yukiusa_12', () => isNight(), 'yukiusa', 'smile', "よるは みみで おとを さがすよ。");
  addT('m_yukiusa_13', () => K.G.region === 0, 'yukiusa', 'smile', "つめたい くうきなら よく はねられる。");
  addT('m_yukiusa_14', () => isLowHp(selectedMember), 'yukiusa', 'smile', "ぴょんが できない。 あしを やすめよう。");
  addT('m_yukiusa_15', () => true, 'yukiusa', 'smile', "ミオ、 みみで おうたを いっぱい きいてるよ。", 'mio', 'smile', "うん！ あなたの こえも ちゃんと きこえてるよ。");
  addT('m_yukinomiko_01', () => true, 'yukinomiko', 'smile', "さらり。 けなみを ゆきの ように ととのえます。");
  addT('m_yukinomiko_02', () => true, 'yukinomiko', 'smile', "しずかな あしどりを たいせつに しましょう。");
  addT('m_yukinomiko_03', () => true, 'yukinomiko', 'smile', "つめたさにも やさしさは あります。");
  addT('m_yukinomiko_04', () => true, 'yukinomiko', 'smile', "みみを ねかせて かぜを よけますね。");
  addT('m_yukinomiko_05', () => true, 'yukinomiko', 'smile', "あしばが すべるときは ゆっくり。");
  addT('m_yukinomiko_06', () => true, 'yukinomiko', 'smile', "しろい けにも ほこりは つきますから。");
  addT('m_yukinomiko_07', () => true, 'yukinomiko', 'smile', "こころを しずめて おとを ききましょう。");
  addT('m_yukinomiko_08', () => true, 'yukinomiko', 'smile', "ちいさな ぬくもりも わかるのです。");
  addT('m_yukinomiko_09', () => true, 'yukinomiko', 'smile', "はねる たかさより おりる ばしょが だいじ。");
  addT('m_yukinomiko_10', () => true, 'yukinomiko', 'smile', "ひやした てを あたためたいですか。");
  addT('m_yukinomiko_11', () => !isNight(), 'yukinomiko', 'smile', "ひるの ひかりは ゆきに よく あいます。");
  addT('m_yukinomiko_12', () => isNight(), 'yukinomiko', 'smile', "よるは しろい けを めじるしに してください。");
  addT('m_yukinomiko_13', () => K.G.region === 2, 'yukinomiko', 'smile', "くもの すがたに ゆきを おもいますね。");
  addT('m_yukinomiko_14', () => isLowHp(selectedMember), 'yukinomiko', 'smile', "あしが ふるえます。 ひとやすみ しましょう。");
  addT('m_yukinomiko_15', () => true, 'yukinomiko', 'smile', "サナ、 しずかな こえも よく とどきますね。", 'sana', 'smile', "はい。 そばに いてくださって うれしいです。");
  addT('m_kooridori_01', () => true, 'kooridori', 'smile', "きりっ。 はねの ひんやりを わけるよ。");
  addT('m_kooridori_02', () => true, 'kooridori', 'smile', "こおりの ような はね、 きれいだろ。");
  addT('m_kooridori_03', () => true, 'kooridori', 'smile', "はばたくと すずしい かぜが できる。");
  addT('m_kooridori_04', () => true, 'kooridori', 'smile', "つめたくても こころは げんきさ。");
  addT('m_kooridori_05', () => true, 'kooridori', 'smile', "はねを ぶつけないように たたもう。");
  addT('m_kooridori_06', () => true, 'kooridori', 'smile', "ぬれた あしばには きをつけて。");
  addT('m_kooridori_07', () => true, 'kooridori', 'smile', "ゆっくり とぶと はねが よく ひかるよ。");
  addT('m_kooridori_08', () => true, 'kooridori', 'smile', "あついときは ぼくの そばに おいで。");
  addT('m_kooridori_09', () => true, 'kooridori', 'smile', "こおりも ひかりを とおすんだ。");
  addT('m_kooridori_10', () => true, 'kooridori', 'smile', "くちばしの さきまで つめたいよ。");
  addT('m_kooridori_11', () => !isNight(), 'kooridori', 'smile', "ひるは はねの ふちが きらきらする。");
  addT('m_kooridori_12', () => isNight(), 'kooridori', 'smile', "よるは つめたい かぜが きもちいい。");
  addT('m_kooridori_13', () => K.G.region === 2, 'kooridori', 'smile', "そらの たかい ところは すずしいね。");
  addT('m_kooridori_14', () => isLowHp(selectedMember), 'kooridori', 'smile', "はねに ちからが はいらない。 やすもう。");
  addT('m_kooridori_15', () => true, 'kooridori', 'smile', "ハル、 すずしい かぜを いっしょに つくろうよ。", 'haru', 'smile', "うん、 かぜを たしかめながら いこうね。");
  addT('m_kazetaka_01', () => true, 'kazetaka', 'smile', "ひゅう。 むかいかぜでも とべるぞ。");
  addT('m_kazetaka_02', () => true, 'kazetaka', 'smile', "つばさの かたむきで かぜを つかむんだ。");
  addT('m_kazetaka_03', () => true, 'kazetaka', 'smile', "たかく とぶと みちの まがりが みえる。");
  addT('m_kazetaka_04', () => true, 'kazetaka', 'smile', "おりる ばしょを さきに きめよう。");
  addT('m_kazetaka_05', () => true, 'kazetaka', 'smile', "はねを ひらきすぎないのが こつだ。");
  addT('m_kazetaka_06', () => true, 'kazetaka', 'smile', "とおくを みても あしもとは わすれないぞ。");
  addT('m_kazetaka_07', () => true, 'kazetaka', 'smile', "かぜの あいだで ちからを ぬくんだ。");
  addT('m_kazetaka_08', () => true, 'kazetaka', 'smile', "きゅうな かぜには はねを たたもう。");
  addT('m_kazetaka_09', () => true, 'kazetaka', 'smile', "とぶ おとを きくと かぜの つよさが わかる。");
  addT('m_kazetaka_10', () => true, 'kazetaka', 'smile', "おれの めは とおくも よく みえるぞ。");
  addT('m_kazetaka_11', () => !isNight(), 'kazetaka', 'smile', "ひるは みちを みわたしやすいな。");
  addT('m_kazetaka_12', () => isNight(), 'kazetaka', 'smile', "よるは むりに たかく とばないぞ。");
  addT('m_kazetaka_13', () => K.G.region === 2, 'kazetaka', 'smile', "くもの うえは つばさの でばんだ。");
  addT('m_kazetaka_14', () => isLowHp(selectedMember), 'kazetaka', 'smile', "かぜを つかめない。 ひとやすみ する。");
  addT('m_kazetaka_15', () => true, 'kazetaka', 'smile', "ソラ、 かざぬのを ひらく ときは かぜを みろよ。", 'sora', 'smile', "うん！ いっしょに いこう。");
  addT('m_arashitaka_01', () => true, 'arashitaka', 'smile', "ごうっ。 つよい かぜも よみきるぞ。");
  addT('m_arashitaka_02', () => true, 'arashitaka', 'smile', "おおきな はねは そっと ひらくんだ。");
  addT('m_arashitaka_03', () => true, 'arashitaka', 'smile', "あらしの ような ちからも あつかいかた しだいだ。");
  addT('m_arashitaka_04', () => true, 'arashitaka', 'smile', "おれが とぶときは うしろを あけておけよ。");
  addT('m_arashitaka_05', () => true, 'arashitaka', 'smile', "ながれる くうきに からだを あわせる。");
  addT('m_arashitaka_06', () => true, 'arashitaka', 'smile', "どんな かぜにも すきまは あるぞ。");
  addT('m_arashitaka_07', () => true, 'arashitaka', 'smile', "はねの さきで かぜを たしかめよう。");
  addT('m_arashitaka_08', () => true, 'arashitaka', 'smile', "ふんばるより ながれに のるんだ。");
  addT('m_arashitaka_09', () => true, 'arashitaka', 'smile', "とぶまえの しずけさも たいせつだな。");
  addT('m_arashitaka_10', () => true, 'arashitaka', 'smile', "つよさだけで とおくへは いけないぞ。");
  addT('m_arashitaka_11', () => !isNight(), 'arashitaka', 'smile', "ひるの あたたかい かぜが のぼっていくな。");
  addT('m_arashitaka_12', () => isNight(), 'arashitaka', 'smile', "よるの かぜは ひるとは ちがうぞ。");
  addT('m_arashitaka_13', () => K.G.region === 2, 'arashitaka', 'smile', "そらの しまを むすぶ かぜが あるな。");
  addT('m_arashitaka_14', () => isLowHp(selectedMember), 'arashitaka', 'smile', "はねを ささえる ちからが たりない。 やすむぞ。");
  addT('m_arashitaka_15', () => true, 'arashitaka', 'smile', "ハル、 おれの はねにも おいかぜを たのむ。", 'haru', 'smile', "うん、 かぜを たしかめながら いこうね。");
  addT('m_morinoko_01', () => true, 'morinoko', 'smile', "こそっ。 くさの あいだから こんにちは。");
  addT('m_morinoko_02', () => true, 'morinoko', 'smile', "はっぱの したは おちつくね。");
  addT('m_morinoko_03', () => true, 'morinoko', 'smile', "きの においを たしかめてるんだ。");
  addT('m_morinoko_04', () => true, 'morinoko', 'smile', "こえだを ふまないように あるこう。");
  addT('m_morinoko_05', () => true, 'morinoko', 'smile', "もりの みどりは ひとつじゃ ないよ。");
  addT('m_morinoko_06', () => true, 'morinoko', 'smile', "ちいさな めにも みずが いるね。");
  addT('m_morinoko_07', () => true, 'morinoko', 'smile', "きの かげを ゆっくり あるきたいな。");
  addT('m_morinoko_08', () => true, 'morinoko', 'smile', "はっぱに のった しずくを みつけたよ。");
  addT('m_morinoko_09', () => true, 'morinoko', 'smile', "おちばの おとって おもしろいね。");
  addT('m_morinoko_10', () => true, 'morinoko', 'smile', "むりに くさを ぬかないで おこう。");
  addT('m_morinoko_11', () => !isNight(), 'morinoko', 'smile', "ひかりが はっぱを とおって くるよ。");
  addT('m_morinoko_12', () => isNight(), 'morinoko', 'smile', "よるの もりは おとが ふえるね。");
  addT('m_morinoko_13', () => K.G.region === 1, 'morinoko', 'smile', "だいりくにも みどりの ばしょが あるんだ。");
  addT('m_morinoko_14', () => isLowHp(selectedMember), 'morinoko', 'smile', "くさに すわって やすみたいな。");
  addT('m_morinoko_15', () => true, 'morinoko', 'smile', "ミオ、 もりの おとも うたに なるかな。", 'mio', 'smile', "うん！ あなたの こえも ちゃんと きこえてるよ。");
  addT('m_hibana_01', () => true, 'hibana', 'smile', "ぱちっ。 ちいさな ひも あついぞ。");
  addT('m_hibana_02', () => true, 'hibana', 'smile', "ひを つかう ばしょは えらぶんだ。");
  addT('m_hibana_03', () => true, 'hibana', 'smile', "かれた くさには ちかづきすぎないよ。");
  addT('m_hibana_04', () => true, 'hibana', 'smile', "ぬくもりなら すこし わけられる。");
  addT('m_hibana_05', () => true, 'hibana', 'smile', "ひの いろを じっと みてみて。");
  addT('m_hibana_06', () => true, 'hibana', 'smile', "いきおいだけで もやさないぞ。");
  addT('m_hibana_07', () => true, 'hibana', 'smile', "あかるさを つくるのも しごとなんだ。");
  addT('m_hibana_08', () => true, 'hibana', 'smile', "みずの そばでは おとなしく するよ。");
  addT('m_hibana_09', () => true, 'hibana', 'smile', "ぱちぱちの おとが げんきの しるし。");
  addT('m_hibana_10', () => true, 'hibana', 'smile', "ちいさくても あつかいには きをつけて。");
  addT('m_hibana_11', () => !isNight(), 'hibana', 'smile', "ひるでも ぼくの ひは みえるかな。");
  addT('m_hibana_12', () => isNight(), 'hibana', 'smile', "よるは あしもとの あかりに なれるよ。");
  addT('m_hibana_13', () => K.G.region === 0, 'hibana', 'smile', "しまの しおかぜは ひを ゆらすね。");
  addT('m_hibana_14', () => isLowHp(selectedMember), 'hibana', 'smile', "ひが ちいさく なってきた。 やすもう。");
  addT('m_hibana_15', () => true, 'hibana', 'smile', "カイト、 ひを まもるって むずかしいね。", 'kaito', 'smile', "おう。 まわりを みながら、 いっしょに すすもう。");
  addT('m_homura_01', () => true, 'homura', 'smile', "ぼうっ。 ひの いきおいを ととのえよう。");
  addT('m_homura_02', () => true, 'homura', 'smile', "あたためる ひと もやす ひは つかいわけるぞ。");
  addT('m_homura_03', () => true, 'homura', 'smile', "まわりの くさにも めを くばる。");
  addT('m_homura_04', () => true, 'homura', 'smile', "つよい ひほど おちついて あつかうんだ。");
  addT('m_homura_05', () => true, 'homura', 'smile', "かぜが かわれば ひも かわるぞ。");
  addT('m_homura_06', () => true, 'homura', 'smile', "あついときは すこし はなれてくれ。");
  addT('m_homura_07', () => true, 'homura', 'smile', "ひかりを まもる ちからに なりたいな。");
  addT('m_homura_08', () => true, 'homura', 'smile', "ひの おとは いきおいを おしえてくれる。");
  addT('m_homura_09', () => true, 'homura', 'smile', "かげが できるのも ひの おかげだ。");
  addT('m_homura_10', () => true, 'homura', 'smile', "もやさなくても ぬくもりは とどく。");
  addT('m_homura_11', () => !isNight(), 'homura', 'smile', "ひるは あつさに きをつけよう。");
  addT('m_homura_12', () => isNight(), 'homura', 'smile', "よるの ひは とおくからも みえるな。");
  addT('m_homura_13', () => K.G.region === 1, 'homura', 'smile', "すなの みちなら くさを もやさず すすめる。");
  addT('m_homura_14', () => isLowHp(selectedMember), 'homura', 'smile', "ほのおが ゆれている。 やすんで ととのえよう。");
  addT('m_homura_15', () => true, 'homura', 'smile', "ソラ、 あかりが いるなら こえを かけろよ。", 'sora', 'smile', "うん！ いっしょに いこう。");
  addT('m_umiushu_01', () => true, 'umiushu', 'smile', "のそっ。 うみの においが するね。");
  addT('m_umiushu_02', () => true, 'umiushu', 'smile', "おおきな からだでも ゆっくり すすむよ。");
  addT('m_umiushu_03', () => true, 'umiushu', 'smile', "しおの ながれを おなかで かんじる。");
  addT('m_umiushu_04', () => true, 'umiushu', 'smile', "せまい みちは たしかめて とおるね。");
  addT('m_umiushu_05', () => true, 'umiushu', 'smile', "まあるい あしあとが のこるよ。");
  addT('m_umiushu_06', () => true, 'umiushu', 'smile', "みずを はねさせないように あるこう。");
  addT('m_umiushu_07', () => true, 'umiushu', 'smile', "あせらないのが ぼくの こつなんだ。");
  addT('m_umiushu_08', () => true, 'umiushu', 'smile', "おなかを ひやすと おちつくね。");
  addT('m_umiushu_09', () => true, 'umiushu', 'smile', "となりの なかまの はやさに あわせるよ。");
  addT('m_umiushu_10', () => true, 'umiushu', 'smile', "うみの おとを きくと やすみたく なるな。");
  addT('m_umiushu_11', () => !isNight(), 'umiushu', 'smile', "ひなたの ぬくもりも すきだよ。");
  addT('m_umiushu_12', () => isNight(), 'umiushu', 'smile', "よるの しおかぜは すずしいね。");
  addT('m_umiushu_13', () => K.G.region === 3, 'umiushu', 'smile', "うみの そこは からだが かるく かんじる。");
  addT('m_umiushu_14', () => isLowHp(selectedMember), 'umiushu', 'smile', "のそっも できない。 ひとやすみ しよう。");
  addT('m_umiushu_15', () => true, 'umiushu', 'smile', "カイト、 うみへ いくなら ぼくも ついていくよ。", 'kaito', 'smile', "おう。 まわりを みながら、 いっしょに すすもう。");
  addT('m_ishigaki_01', () => true, 'ishigaki', 'smile', "がしっ。 おれの そばなら おちつけるぞ。");
  addT('m_ishigaki_02', () => true, 'ishigaki', 'smile', "いしの かべにも すきまは ある。");
  addT('m_ishigaki_03', () => true, 'ishigaki', 'smile', "あしばは かたさだけで えらぶなよ。");
  addT('m_ishigaki_04', () => true, 'ishigaki', 'smile', "ならんだ いしは たがいに ささえるんだ。");
  addT('m_ishigaki_05', () => true, 'ishigaki', 'smile', "おもさを わけると くずれにくいぞ。");
  addT('m_ishigaki_06', () => true, 'ishigaki', 'smile', "じっとしてても まわりは みてる。");
  addT('m_ishigaki_07', () => true, 'ishigaki', 'smile', "かべの かげを つかって やすめよ。");
  addT('m_ishigaki_08', () => true, 'ishigaki', 'smile', "いしを つむなら したから たしかめろ。");
  addT('m_ishigaki_09', () => true, 'ishigaki', 'smile', "おれの かどに ぶつからないようにな。");
  addT('m_ishigaki_10', () => true, 'ishigaki', 'smile', "まもるために たつのは とくいだ。");
  addT('m_ishigaki_11', () => !isNight(), 'ishigaki', 'smile', "ひるは かべに ひが たまるな。");
  addT('m_ishigaki_12', () => isNight(), 'ishigaki', 'smile', "よるは すこしずつ ひえていくぞ。");
  addT('m_ishigaki_13', () => K.G.region === 3, 'ishigaki', 'smile', "みずの なかでも どっしり たてるな。");
  addT('m_ishigaki_14', () => isLowHp(selectedMember), 'ishigaki', 'smile', "いしの あいだが いたむ。 やすむぞ。");
  addT('m_ishigaki_15', () => true, 'ishigaki', 'smile', "リク、 うしろを まもるなら おれに まかせろ。", 'riku', 'smile', "おう。 むりは するなよ。");
  addT('m_nijikujira_01', () => true, 'nijikujira', 'smile', "ふうっ。 ゆっくり いきを しよう。");
  addT('m_nijikujira_02', () => true, 'nijikujira', 'smile', "にじの いろは ひかりで かわるよ。");
  addT('m_nijikujira_03', () => true, 'nijikujira', 'smile', "おおきな からだには ひろい みちが いるね。");
  addT('m_nijikujira_04', () => true, 'nijikujira', 'smile', "しっぽを ふるまえに まわりを みるよ。");
  addT('m_nijikujira_05', () => true, 'nijikujira', 'smile', "みんなの はやさに あわせて すすむね。");
  addT('m_nijikujira_06', () => true, 'nijikujira', 'smile', "ながい たびも ひといきずつだよ。");
  addT('m_nijikujira_07', () => true, 'nijikujira', 'smile', "いろの さかいめも きれいなんだ。");
  addT('m_nijikujira_08', () => true, 'nijikujira', 'smile', "あわてると からだが ぶつかっちゃう。");
  addT('m_nijikujira_09', () => true, 'nijikujira', 'smile', "ひかりを うける むきを かえてみよう。");
  addT('m_nijikujira_10', () => true, 'nijikujira', 'smile', "おおきくても ちいさな おとを きくよ。");
  addT('m_nijikujira_11', () => !isNight(), 'nijikujira', 'smile', "ひるの ひかりなら いろが よく みえるね。");
  addT('m_nijikujira_12', () => isNight(), 'nijikujira', 'smile', "よるは にじも しずかな いろに なるよ。");
  addT('m_nijikujira_13', () => K.G.region === 2, 'nijikujira', 'smile', "くもの うえは ひろくて きもちいい。");
  addT('m_nijikujira_14', () => isLowHp(selectedMember), 'nijikujira', 'smile', "しっぽが おもい。 ゆっくり やすもう。");
  addT('m_nijikujira_15', () => true, 'nijikujira', 'smile', "ハル、 かぜに のると いろも ながれるね。", 'haru', 'smile', "うん、 かぜを たしかめながら いこうね。");
  addT('m_hoshikujira_01', () => true, 'hoshikujira', 'smile', "ほうっ。 ほしの ような ひかりを たしかめよう。");
  addT('m_hoshikujira_02', () => true, 'hoshikujira', 'smile', "ひとつの ひかりも みおとさないよ。");
  addT('m_hoshikujira_03', () => true, 'hoshikujira', 'smile', "おおきな せなかに かぜを うけるんだ。");
  addT('m_hoshikujira_04', () => true, 'hoshikujira', 'smile', "ゆっくり すすんでも とおくへ いける。");
  addT('m_hoshikujira_05', () => true, 'hoshikujira', 'smile', "そらを みると いきが ひろく なるね。");
  addT('m_hoshikujira_06', () => true, 'hoshikujira', 'smile', "しっぽの さきを ぶつけないように するよ。");
  addT('m_hoshikujira_07', () => true, 'hoshikujira', 'smile', "ひかりは ちかくにも とおくにも あるね。");
  addT('m_hoshikujira_08', () => true, 'hoshikujira', 'smile', "しずかな ところで いきを そろえよう。");
  addT('m_hoshikujira_09', () => true, 'hoshikujira', 'smile', "みんなの あしおとが きこえるよ。");
  addT('m_hoshikujira_10', () => true, 'hoshikujira', 'smile', "ひかりを さがす めを たいせつにね。");
  addT('m_hoshikujira_11', () => !isNight(), 'hoshikujira', 'smile', "ひるの そらにも ほしは あるんだろうね。");
  addT('m_hoshikujira_12', () => isNight(), 'hoshikujira', 'smile', "よるは ほしの あいだを みたくなる。");
  addT('m_hoshikujira_13', () => K.G.region === 2, 'hoshikujira', 'smile', "くもの うえなら そらが ちかいね。");
  addT('m_hoshikujira_14', () => isLowHp(selectedMember), 'hoshikujira', 'smile', "いきを するのも おもい。 やすませて。");
  addT('m_hoshikujira_15', () => true, 'hoshikujira', 'smile', "サナ、 その ひかりを そばで みていたいな。", 'sana', 'smile', "はい。 そばに いてくださって うれしいです。");
  addT('m_kumomo_01', () => true, 'kumomo', 'smile', "もこっ。 くもの かたちに なってみよう。");
  addT('m_kumomo_02', () => true, 'kumomo', 'smile', "ふくらんでも みちを ふさがないよ。");
  addT('m_kumomo_03', () => true, 'kumomo', 'smile', "かぜが くると ふちが ゆれるね。");
  addT('m_kumomo_04', () => true, 'kumomo', 'smile', "まあるい かたちが おきにいりなんだ。");
  addT('m_kumomo_05', () => true, 'kumomo', 'smile', "あせると もこもこが ちぢむよ。");
  addT('m_kumomo_06', () => true, 'kumomo', 'smile', "やわらかくても ながされるだけじゃ ない。");
  addT('m_kumomo_07', () => true, 'kumomo', 'smile', "はなれた くもを みるのも すき。");
  addT('m_kumomo_08', () => true, 'kumomo', 'smile', "ひかりが とおると ふちが かがやくね。");
  addT('m_kumomo_09', () => true, 'kumomo', 'smile', "すこしずつ かたちを ととのえよう。");
  addT('m_kumomo_10', () => true, 'kumomo', 'smile', "ぬれた くうきも わかるんだ。");
  addT('m_kumomo_11', () => !isNight(), 'kumomo', 'smile', "ひるは じろさが よく みえるよ。");
  addT('m_kumomo_12', () => isNight(), 'kumomo', 'smile', "よるは くもの かげが ふかくなるね。");
  addT('m_kumomo_13', () => K.G.region === 2, 'kumomo', 'smile', "そらの くもと ならんでみたいな。");
  addT('m_kumomo_14', () => isLowHp(selectedMember), 'kumomo', 'smile', "もこもこが うすい。 やすみたいよ。");
  addT('m_kumomo_15', () => true, 'kumomo', 'smile', "ソラ、 マフラーと ぼく、 どっちが ふわふわかな。", 'sora', 'smile', "うん！ いっしょに いこう。");
  addT('m_raikumo_01', () => true, 'raikumo', 'smile', "ぱりっ。 ちいさな おとが したぞ。");
  addT('m_raikumo_02', () => true, 'raikumo', 'smile', "びりびりは むやみに とばさないよ。");
  addT('m_raikumo_03', () => true, 'raikumo', 'smile', "みずの そばでは とくに きをつける。");
  addT('m_raikumo_04', () => true, 'raikumo', 'smile', "くもの ふちを きゅっと ととのえるぞ。");
  addT('m_raikumo_05', () => true, 'raikumo', 'smile', "つよい ちからほど おちついて つかうんだ。");
  addT('m_raikumo_06', () => true, 'raikumo', 'smile', "おとに びっくりしたら ごめんな。");
  addT('m_raikumo_07', () => true, 'raikumo', 'smile', "まわりを あけてから ちからを だすよ。");
  addT('m_raikumo_08', () => true, 'raikumo', 'smile', "くうきが かわったのを かんじるぞ。");
  addT('m_raikumo_09', () => true, 'raikumo', 'smile', "かみなりも ひかりの ひとつだね。");
  addT('m_raikumo_10', () => true, 'raikumo', 'smile', "びりっと するまえに こえを かける。");
  addT('m_raikumo_11', () => !isNight(), 'raikumo', 'smile', "ひるの くもは しろく みえるぞ。");
  addT('m_raikumo_12', () => isNight(), 'raikumo', 'smile', "よるなら ちいさな ひかりも めだつな。");
  addT('m_raikumo_13', () => K.G.region === 2, 'raikumo', 'smile', "くもの うえは くうきが よく ながれるね。");
  addT('m_raikumo_14', () => isLowHp(selectedMember), 'raikumo', 'smile', "びりびりが よわい。 やすんで ととのえるぞ。");
  addT('m_raikumo_15', () => true, 'raikumo', 'smile', "リク、 やりを ちかづけすぎないでくれよ。", 'riku', 'smile', "おう。 むりは するなよ。");
  addT('m_soramedaka_01', () => true, 'soramedaka', 'smile', "すいっ。 ちいさくても そらを すすむよ。");
  addT('m_soramedaka_02', () => true, 'soramedaka', 'smile', "ひれを そろえると まがりやすいね。");
  addT('m_soramedaka_03', () => true, 'soramedaka', 'smile', "ひかりを うけた からだを みて。");
  addT('m_soramedaka_04', () => true, 'soramedaka', 'smile', "かぜの すきまを すいすい ぬけるんだ。");
  addT('m_soramedaka_05', () => true, 'soramedaka', 'smile', "あわてずに ひれを うごかそう。");
  addT('m_soramedaka_06', () => true, 'soramedaka', 'smile', "ちいさな からだなら すきまも とおれる。");
  addT('m_soramedaka_07', () => true, 'soramedaka', 'smile', "たかく とぶより みんなの そばが いいな。");
  addT('m_soramedaka_08', () => true, 'soramedaka', 'smile', "かぜが とまったら ゆっくり すすむよ。");
  addT('m_soramedaka_09', () => true, 'soramedaka', 'smile', "くうきの ながれを ひれで よむんだ。");
  addT('m_soramedaka_10', () => true, 'soramedaka', 'smile', "はやく うごくと ひかりが ちらちらする。");
  addT('m_soramedaka_11', () => !isNight(), 'soramedaka', 'smile', "ひるの そらは ひろいね。");
  addT('m_soramedaka_12', () => isNight(), 'soramedaka', 'smile', "よるの ほしは みずの つぶみたい。");
  addT('m_soramedaka_13', () => K.G.region === 2, 'soramedaka', 'smile', "くもの うえを およぐのが きもちいいな。");
  addT('m_soramedaka_14', () => isLowHp(selectedMember), 'soramedaka', 'smile', "ひれが うごかない。 ひとやすみ。");
  addT('m_soramedaka_15', () => true, 'soramedaka', 'smile', "ハル、 おうぎの かぜに ちょっと のっていい？", 'haru', 'smile', "うん、 かぜを たしかめながら いこうね。");
  addT('m_soramanta_01', () => true, 'soramanta', 'smile', "すうっ。 ひろい ひれを ひらこう。");
  addT('m_soramanta_02', () => true, 'soramanta', 'smile', "くうきの ながれを ゆっくり つかむよ。");
  addT('m_soramanta_03', () => true, 'soramanta', 'smile', "ひれの したに かげが できるね。");
  addT('m_soramanta_04', () => true, 'soramanta', 'smile', "おおきく まがるときは みちを あけてね。");
  addT('m_soramanta_05', () => true, 'soramanta', 'smile', "ながれに のると ちからを ぬける。");
  addT('m_soramanta_06', () => true, 'soramanta', 'smile', "あわてず からだを かたむけよう。");
  addT('m_soramanta_07', () => true, 'soramanta', 'smile', "ひろい ばしょで すいっと すすみたいな。");
  addT('m_soramanta_08', () => true, 'soramanta', 'smile', "ひれの さきまで かぜを かんじる。");
  addT('m_soramanta_09', () => true, 'soramanta', 'smile', "おりる ときは あしばを たしかめるよ。");
  addT('m_soramanta_10', () => true, 'soramanta', 'smile', "ぼくの かげを めじるしに してね。");
  addT('m_soramanta_11', () => !isNight(), 'soramanta', 'smile', "ひなたを ひれで うけると あたたかい。");
  addT('m_soramanta_12', () => isNight(), 'soramanta', 'smile', "よるは そらの ながれが しずかだね。");
  addT('m_soramanta_13', () => K.G.region === 2, 'soramanta', 'smile', "くもの あいだに とおれる みちが あるよ。");
  addT('m_soramanta_14', () => isLowHp(selectedMember), 'soramanta', 'smile', "ひれを ささえるのが つらい。 やすもう。");
  addT('m_soramanta_15', () => true, 'soramanta', 'smile', "ソラ、 ゆっくり かぜに のるのも たのしいよ。", 'sora', 'smile', "うん！ いっしょに いこう。");
  addT('m_fuurin_01', () => true, 'fuurin', 'smile', "ちりん。 かぜが おとを つくったね。");
  addT('m_fuurin_02', () => true, 'fuurin', 'smile', "つよく ふるより そっと ゆらしてね。");
  addT('m_fuurin_03', () => true, 'fuurin', 'smile', "おとの よいんを きいてみよう。");
  addT('m_fuurin_04', () => true, 'fuurin', 'smile', "しずかな ときも だいじなんだ。");
  addT('m_fuurin_05', () => true, 'fuurin', 'smile', "かぜの むきで ひびきが かわるよ。");
  addT('m_fuurin_06', () => true, 'fuurin', 'smile', "おとが とおる ばしょを さがしてる。");
  addT('m_fuurin_07', () => true, 'fuurin', 'smile', "うしろの なかまにも おとが とどくかな。");
  addT('m_fuurin_08', () => true, 'fuurin', 'smile', "ちりんの あとに かぜを かんじるね。");
  addT('m_fuurin_09', () => true, 'fuurin', 'smile', "いそがなくても おとは のこるよ。");
  addT('m_fuurin_10', () => true, 'fuurin', 'smile', "おおごえの なかでは ちいさく ならすんだ。");
  addT('m_fuurin_11', () => !isNight(), 'fuurin', 'smile', "ひるの かぜは おとが はずむね。");
  addT('m_fuurin_12', () => isNight(), 'fuurin', 'smile', "よるは ちりんが とおくまで きこえる。");
  addT('m_fuurin_13', () => K.G.region === 2, 'fuurin', 'smile', "そらの かぜに よく ひびく おとだよ。");
  addT('m_fuurin_14', () => isLowHp(selectedMember), 'fuurin', 'smile', "ひびきが にぶい。 すこし やすませて。");
  addT('m_fuurin_15', () => true, 'fuurin', 'smile', "ミオ、 ぼくの おとに あわせて うたえるかな。", 'mio', 'smile', "うん！ あなたの こえも ちゃんと きこえてるよ。");
  addT('m_hoshikakera_01', () => true, 'hoshikakera', 'smile', "きらっ。 ちいさな ひかりを みつけてね。");
  addT('m_hoshikakera_02', () => true, 'hoshikakera', 'smile', "かけらでも ちゃんと かがやけるよ。");
  addT('m_hoshikakera_03', () => true, 'hoshikakera', 'smile', "かどを ぶつけないように するね。");
  addT('m_hoshikakera_04', () => true, 'hoshikakera', 'smile', "ひかりの むきを かえてみよう。");
  addT('m_hoshikakera_05', () => true, 'hoshikakera', 'smile', "すこしずつ ちがう いろが あるんだ。");
  addT('m_hoshikakera_06', () => true, 'hoshikakera', 'smile', "ちいさいからって みおとさないでね。");
  addT('m_hoshikakera_07', () => true, 'hoshikakera', 'smile', "かげの なかだと ひかりが わかりやすい。");
  addT('m_hoshikakera_08', () => true, 'hoshikakera', 'smile', "ころがったら おとで わかるよ。");
  addT('m_hoshikakera_09', () => true, 'hoshikakera', 'smile', "ひかりを わけても きれいだね。");
  addT('m_hoshikakera_10', () => true, 'hoshikakera', 'smile', "はなれていても ここに いるよ。");
  addT('m_hoshikakera_11', () => !isNight(), 'hoshikakera', 'smile', "ひるは おひさまと いっしょに かがやく。");
  addT('m_hoshikakera_12', () => isNight(), 'hoshikakera', 'smile', "よるは ぼくの ひかりを みてね。");
  addT('m_hoshikakera_13', () => K.G.region === 2, 'hoshikakera', 'smile', "そらに ちかいと ほしを みたくなる。");
  addT('m_hoshikakera_14', () => isLowHp(selectedMember), 'hoshikakera', 'smile', "きらっと できない。 やすもう。");
  addT('m_hoshikakera_15', () => true, 'hoshikakera', 'smile', "サナ、 ちいさな かけらも たいせつに してね。", 'sana', 'smile', "はい。 そばに いてくださって うれしいです。");
  addT('m_seishou_01', () => true, 'seishou', 'smile', "りんっ。 ひかりの めんを ととのえよう。");
  addT('m_seishou_02', () => true, 'seishou', 'smile', "とうめいでも ここに いるんだよ。");
  addT('m_seishou_03', () => true, 'seishou', 'smile', "かどの そばは きをつけてね。");
  addT('m_seishou_04', () => true, 'seishou', 'smile', "ひかりを とおすと いろが わかれる。");
  addT('m_seishou_05', () => true, 'seishou', 'smile', "まぶしすぎたら むきを かえるよ。");
  addT('m_seishou_06', () => true, 'seishou', 'smile', "しずかに たつと ひかりも おちつく。");
  addT('m_seishou_07', () => true, 'seishou', 'smile', "ちいさな きずを たしかめておこう。");
  addT('m_seishou_08', () => true, 'seishou', 'smile', "かたい からだも ていれが いるね。");
  addT('m_seishou_09', () => true, 'seishou', 'smile', "うつった そらを みてみて。");
  addT('m_seishou_10', () => true, 'seishou', 'smile', "ひかりは まっすぐだけじゃ ないんだ。");
  addT('m_seishou_11', () => !isNight(), 'seishou', 'smile', "ひるは めんが よく かがやくね。");
  addT('m_seishou_12', () => isNight(), 'seishou', 'smile', "よるは ほしの ひかりを うけよう。");
  addT('m_seishou_13', () => K.G.region === 2, 'seishou', 'smile', "くもの うえの ひかりは すきとおっている。");
  addT('m_seishou_14', () => isLowHp(selectedMember), 'seishou', 'smile', "ひかりが にぶい。 ひとやすみ したいな。");
  addT('m_seishou_15', () => true, 'seishou', 'smile', "ハル、 かぜで ほこりを そっと はらってくれる？", 'haru', 'smile', "うん、 かぜを たしかめながら いこうね。");
  addT('m_tsukimiusa_01', () => true, 'tsukimiusa', 'smile', "ぴょこ。 そらを みあげてみよう。");
  addT('m_tsukimiusa_02', () => true, 'tsukimiusa', 'smile', "みみを そろえて おとを きくね。");
  addT('m_tsukimiusa_03', () => true, 'tsukimiusa', 'smile', "まるいものを みると うれしくなる。");
  addT('m_tsukimiusa_04', () => true, 'tsukimiusa', 'smile', "はねる あしばは さきに みておくよ。");
  addT('m_tsukimiusa_05', () => true, 'tsukimiusa', 'smile', "ゆっくり みあげると くびも らくだね。");
  addT('m_tsukimiusa_06', () => true, 'tsukimiusa', 'smile', "みみの かげって ながいんだ。");
  addT('m_tsukimiusa_07', () => true, 'tsukimiusa', 'smile', "あしを とめて そらを みるのも すき。");
  addT('m_tsukimiusa_08', () => true, 'tsukimiusa', 'smile', "ちいさな はねかたで ついていくね。");
  addT('m_tsukimiusa_09', () => true, 'tsukimiusa', 'smile', "ふわふわの けを ととのえよう。");
  addT('m_tsukimiusa_10', () => true, 'tsukimiusa', 'smile', "まるい いしは つきに にているな。");
  addT('m_tsukimiusa_11', () => !isNight(), 'tsukimiusa', 'smile', "ひるの そらにも つきが みえるかな。");
  addT('m_tsukimiusa_12', () => isNight(), 'tsukimiusa', 'smile', "よるは つきを さがすのが たのしいよ。");
  addT('m_tsukimiusa_13', () => K.G.region === 2, 'tsukimiusa', 'smile', "くもの うえなら つきが ちかく みえるね。");
  addT('m_tsukimiusa_14', () => isLowHp(selectedMember), 'tsukimiusa', 'smile', "あしが おもい。 はねずに やすもう。");
  addT('m_tsukimiusa_15', () => true, 'tsukimiusa', 'smile', "ソラ、 みあげる ときは あしを とめようね。", 'sora', 'smile', "うん！ いっしょに いこう。");
  addT('m_amatsubame_01', () => true, 'amatsubame', 'smile', "ついっ。 はやい かぜを つかまえるよ。");
  addT('m_amatsubame_02', () => true, 'amatsubame', 'smile', "はねを ほそく たたむと かぜを きれる。");
  addT('m_amatsubame_03', () => true, 'amatsubame', 'smile', "はやく とんでも みんなを みてるよ。");
  addT('m_amatsubame_04', () => true, 'amatsubame', 'smile', "もどる ときは おおきく まがるんだ。");
  addT('m_amatsubame_05', () => true, 'amatsubame', 'smile', "あしばを みてから おりるね。");
  addT('m_amatsubame_06', () => true, 'amatsubame', 'smile', "はねの さきが みちを おしえてくれる。");
  addT('m_amatsubame_07', () => true, 'amatsubame', 'smile', "せまい すきまは よく たしかめるよ。");
  addT('m_amatsubame_08', () => true, 'amatsubame', 'smile', "ながい たびでも いきを ととのえる。");
  addT('m_amatsubame_09', () => true, 'amatsubame', 'smile', "はやさだけでは なかまを まもれないね。");
  addT('m_amatsubame_10', () => true, 'amatsubame', 'smile', "かぜに まかせすぎないように するよ。");
  addT('m_amatsubame_11', () => !isNight(), 'amatsubame', 'smile', "ひるは とおくの みちが みやすいね。");
  addT('m_amatsubame_12', () => isNight(), 'amatsubame', 'smile', "よるは ちかくの おとを たよりに する。");
  addT('m_amatsubame_13', () => K.G.region === 2, 'amatsubame', 'smile', "そらの しまの あいだを とんでみたいな。");
  addT('m_amatsubame_14', () => isLowHp(selectedMember), 'amatsubame', 'smile', "はねが おいつかない。 とまって やすもう。");
  addT('m_amatsubame_15', () => true, 'amatsubame', 'smile', "ハル、 おいかぜの むきを おしえてね。", 'haru', 'smile', "うん、 かぜを たしかめながら いこうね。");
  addT('m_hoshimori_01', () => true, 'hoshimori', 'smile', "ほう。 ひかりを みつめて いきを ととのえよ。");
  addT('m_hoshimori_02', () => true, 'hoshimori', 'smile', "ちいさな ともしびにも めを むけよう。");
  addT('m_hoshimori_03', () => true, 'hoshimori', 'smile', "まもるとは ただ かこむことでは ない。");
  addT('m_hoshimori_04', () => true, 'hoshimori', 'smile', "しずけさの なかで きこえる おとも ある。");
  addT('m_hoshimori_05', () => true, 'hoshimori', 'smile', "みちを えらぶ ときは うしろも みよ。");
  addT('m_hoshimori_06', () => true, 'hoshimori', 'smile', "ひかりの そばには かげも ある。");
  addT('m_hoshimori_07', () => true, 'hoshimori', 'smile', "あせらずに ひとつずつ たしかめよう。");
  addT('m_hoshimori_08', () => true, 'hoshimori', 'smile', "おおきな からだにも やすみは いる。");
  addT('m_hoshimori_09', () => true, 'hoshimori', 'smile', "だれかの ひかりを けさぬようにな。");
  addT('m_hoshimori_10', () => true, 'hoshimori', 'smile', "そばに いるものを たいせつに しよう。");
  addT('m_hoshimori_11', () => !isNight(), 'hoshimori', 'smile', "ひるの ひかりは すべてを つつむな。");
  addT('m_hoshimori_12', () => isNight(), 'hoshimori', 'smile', "よるの ほしを ひとつずつ みてみよう。");
  addT('m_hoshimori_13', () => K.G.region === 2, 'hoshimori', 'smile', "くもの うえの ひかりを かんじるな。");
  addT('m_hoshimori_14', () => isLowHp(selectedMember), 'hoshimori', 'smile', "ちからが うすい。 いまは やすもう。");
  addT('m_hoshimori_15', () => true, 'hoshimori', 'smile', "サナ、 そなたの ひかりも ここに とどいている。", 'sana', 'smile', "はい。 そばに いてくださって うれしいです。");
  addT('m_pukuawa_01', () => true, 'pukuawa', 'smile', "ぷく。 あわを まるく つくるよ。");
  addT('m_pukuawa_02', () => true, 'pukuawa', 'smile', "はじけた あわも みずに もどるんだ。");
  addT('m_pukuawa_03', () => true, 'pukuawa', 'smile', "からだを ふくらませると かるくなる。");
  addT('m_pukuawa_04', () => true, 'pukuawa', 'smile', "あわの なかに ひかりが みえるね。");
  addT('m_pukuawa_05', () => true, 'pukuawa', 'smile', "つよく つつかないでね。");
  addT('m_pukuawa_06', () => true, 'pukuawa', 'smile', "ちいさな あわが ならぶと きれいだよ。");
  addT('m_pukuawa_07', () => true, 'pukuawa', 'smile', "ゆっくり はくと まるく なるんだ。");
  addT('m_pukuawa_08', () => true, 'pukuawa', 'smile', "すいすい すすむ おとが すき。");
  addT('m_pukuawa_09', () => true, 'pukuawa', 'smile', "あわの かげは うすいね。");
  addT('m_pukuawa_10', () => true, 'pukuawa', 'smile', "おなかに ためすぎないように しよう。");
  addT('m_pukuawa_11', () => !isNight(), 'pukuawa', 'smile', "ひるの あわは にじいろだよ。");
  addT('m_pukuawa_12', () => isNight(), 'pukuawa', 'smile', "よるは あわが ほしみたいに みえる。");
  addT('m_pukuawa_13', () => K.G.region === 3, 'pukuawa', 'smile', "うみの そこは あわの でばんだね。");
  addT('m_pukuawa_14', () => isLowHp(selectedMember), 'pukuawa', 'smile', "ぷくっと できない。 すこし やすもう。");
  addT('m_pukuawa_15', () => true, 'pukuawa', 'smile', "ミオ、 おうたで あわも ふるえてるよ。", 'mio', 'smile', "うん！ あなたの こえも ちゃんと きこえてるよ。");
  addT('m_oopuku_01', () => true, 'oopuku', 'smile', "ぶくっ。 おおきく ふくらむぞアワ。");
  addT('m_oopuku_02', () => true, 'oopuku', 'smile', "おなかの みずは ゆっくり ととのえるアワ。");
  addT('m_oopuku_03', () => true, 'oopuku', 'smile', "せまい みちでは しぼむぞ。");
  addT('m_oopuku_04', () => true, 'oopuku', 'smile', "ふくらむまえに となりを みるアワ。");
  addT('m_oopuku_05', () => true, 'oopuku', 'smile', "おおきな あわは ゆっくり のぼるな。");
  addT('m_oopuku_06', () => true, 'oopuku', 'smile', "おなかを ぶつけないように すすむぞ。");
  addT('m_oopuku_07', () => true, 'oopuku', 'smile', "ちからを ぬくと うきやすいアワ。");
  addT('m_oopuku_08', () => true, 'oopuku', 'smile', "しっぽの むきで まがるんだ。");
  addT('m_oopuku_09', () => true, 'oopuku', 'smile', "おれの あわ、 まるいだろアワ。");
  addT('m_oopuku_10', () => true, 'oopuku', 'smile', "おおきくても ちいさな あわは たいせつだ。");
  addT('m_oopuku_11', () => !isNight(), 'oopuku', 'smile', "ひが あたると おなかが きらっとするアワ。");
  addT('m_oopuku_12', () => isNight(), 'oopuku', 'smile', "よるは ゆっくり あわを みるぞ。");
  addT('m_oopuku_13', () => K.G.region === 3, 'oopuku', 'smile', "うみの そこなら おもいきり ふくらめるアワ。");
  addT('m_oopuku_14', () => isLowHp(selectedMember), 'oopuku', 'smile', "ふくらむ ちからが ない。 やすむぞアワ。");
  addT('m_oopuku_15', () => true, 'oopuku', 'smile', "カイト、 その いかり、 いま はこぶのを てつだおうかアワ？", 'kaito', 'smile', "おう。 まわりを みながら、 いっしょに すすもう。");
  addT('m_hitoden_01', () => true, 'hitoden', 'smile', "ぴかっ。 ごほんの あしを そろえるよ。");
  addT('m_hitoden_02', () => true, 'hitoden', 'smile', "ほしの かたちでも うみに いるんだ。");
  addT('m_hitoden_03', () => true, 'hitoden', 'smile', "あしの さきまで きを くばるぞ。");
  addT('m_hitoden_04', () => true, 'hitoden', 'smile', "みずの ながれを からだで うける。");
  addT('m_hitoden_05', () => true, 'hitoden', 'smile', "ふりむく ときは ゆっくりね。");
  addT('m_hitoden_06', () => true, 'hitoden', 'smile', "かたちだけで つよさは きまらないよ。");
  addT('m_hitoden_07', () => true, 'hitoden', 'smile', "ぺたっと たつと おちつくな。");
  addT('m_hitoden_08', () => true, 'hitoden', 'smile', "ちいさな おとにも きをつけよう。");
  addT('m_hitoden_09', () => true, 'hitoden', 'smile', "ひかりと おとの ちがいを たしかめるぞ。");
  addT('m_hitoden_10', () => true, 'hitoden', 'smile', "あしを そろえると すすみやすいね。");
  addT('m_hitoden_11', () => !isNight(), 'hitoden', 'smile', "ひるは ほしの かたちが よく みえるよ。");
  addT('m_hitoden_12', () => isNight(), 'hitoden', 'smile', "よるは ちいさな ひかりも めだつな。");
  addT('m_hitoden_13', () => K.G.region === 3, 'hitoden', 'smile', "うみの そこの あしばを たしかめよう。");
  addT('m_hitoden_14', () => isLowHp(selectedMember), 'hitoden', 'smile', "あしが しびれる。 やすみたいな。");
  addT('m_hitoden_15', () => true, 'hitoden', 'smile', "リク、 やりの さきと ぼくの あし、 どっちも きをつけよう。", 'riku', 'smile', "おう。 むりは するなよ。");
  addT('m_takosumi_01', () => true, 'takosumi', 'smile', "ぷしゅ。 すみを とばす ばしょは えらぶタコ。");
  addT('m_takosumi_02', () => true, 'takosumi', 'smile', "うでを そろえると すっきりするタコ。");
  addT('m_takosumi_03', () => true, 'takosumi', 'smile', "すみは むやみに つかわないぞ。");
  addT('m_takosumi_04', () => true, 'takosumi', 'smile', "すきまに そっと うでを のばすタコ。");
  addT('m_takosumi_05', () => true, 'takosumi', 'smile', "みずの においを たしかめるぞ。");
  addT('m_takosumi_06', () => true, 'takosumi', 'smile', "くっつくまえに あしばを みるタコ。");
  addT('m_takosumi_07', () => true, 'takosumi', 'smile', "やわらかい うでで そっと ささえる。");
  addT('m_takosumi_08', () => true, 'takosumi', 'smile', "うでが おおいと ていれも たいへんタコ。");
  addT('m_takosumi_09', () => true, 'takosumi', 'smile', "すみの あとは みずを よごさないように する。");
  addT('m_takosumi_10', () => true, 'takosumi', 'smile', "まわりを みてから うごくタコ。");
  addT('m_takosumi_11', () => !isNight(), 'takosumi', 'smile', "ひるは すみが よく めだつな。");
  addT('m_takosumi_12', () => isNight(), 'takosumi', 'smile', "よるでも すみを つかいすぎないタコ。");
  addT('m_takosumi_13', () => K.G.region === 3, 'takosumi', 'smile', "うみの そこなら うでが のびのび うごく。");
  addT('m_takosumi_14', () => isLowHp(selectedMember), 'takosumi', 'smile', "うでが だらんと する。 やすむタコ。");
  addT('m_takosumi_15', () => true, 'takosumi', 'smile', "カイト、 いかりに うでを はさまないように するタコ。", 'kaito', 'smile', "おう。 まわりを みながら、 いっしょに すすもう。");
  addT('m_oodako_01', () => true, 'oodako', 'smile', "ぐにっ。 はっぽんの うでを ととのえるタコ。");
  addT('m_oodako_02', () => true, 'oodako', 'smile', "おおきくても そっと さわれるぞ。");
  addT('m_oodako_03', () => true, 'oodako', 'smile', "うでを のばす ときは あいての ほうを みるタコ。");
  addT('m_oodako_04', () => true, 'oodako', 'smile', "せまい ところは うでを たたもう。");
  addT('m_oodako_05', () => true, 'oodako', 'smile', "すみを はくまえに なかまを たしかめる。");
  addT('m_oodako_06', () => true, 'oodako', 'smile', "かたい いわにも ゆっくり くっつくタコ。");
  addT('m_oodako_07', () => true, 'oodako', 'smile', "はっぽん あるから ていれも ながいぞ。");
  addT('m_oodako_08', () => true, 'oodako', 'smile', "あわてると うでが からまるタコ。");
  addT('m_oodako_09', () => true, 'oodako', 'smile', "ちからを わければ そっと はこべる。");
  addT('m_oodako_10', () => true, 'oodako', 'smile', "いわかげで おちついて かんがえよう。");
  addT('m_oodako_11', () => !isNight(), 'oodako', 'smile', "ひるは うでの かげが よく みえるタコ。");
  addT('m_oodako_12', () => isNight(), 'oodako', 'smile', "よるは すみを とばさず しずかに すすむ。");
  addT('m_oodako_13', () => K.G.region === 3, 'oodako', 'smile', "うみの そこは いわかげが おちつくタコ。");
  addT('m_oodako_14', () => isLowHp(selectedMember), 'oodako', 'smile', "うでが おもい。 たたんで やすむぞ。");
  addT('m_oodako_15', () => true, 'oodako', 'smile', "カイト、 いかりを なげる まえに こえを かけてくれタコ。", 'kaito', 'smile', "おう。 まわりを みながら、 いっしょに すすもう。");
  addT('m_sangoron_01', () => true, 'sangoron', 'smile', "こつっ。 さんごの えだに きをつけてね。");
  addT('m_sangoron_02', () => true, 'sangoron', 'smile', "からだの いろを みてみて。");
  addT('m_sangoron_03', () => true, 'sangoron', 'smile', "ゆっくり あるけば えだも ぶつからない。");
  addT('m_sangoron_04', () => true, 'sangoron', 'smile', "すきまを とおる まえに はばを みるよ。");
  addT('m_sangoron_05', () => true, 'sangoron', 'smile', "かたい ところも そっと さわってね。");
  addT('m_sangoron_06', () => true, 'sangoron', 'smile', "えだの あいだを みずが とおるんだ。");
  addT('m_sangoron_07', () => true, 'sangoron', 'smile', "おなじ いろでも こいところが あるよ。");
  addT('m_sangoron_08', () => true, 'sangoron', 'smile', "あしばを たしかめて どっしり たつ。");
  addT('m_sangoron_09', () => true, 'sangoron', 'smile', "ちいさな かげにも いきものが いるかな。");
  addT('m_sangoron_10', () => true, 'sangoron', 'smile', "むりに えだを まげないようにね。");
  addT('m_sangoron_11', () => !isNight(), 'sangoron', 'smile', "ひるは からだの いろが あかるいよ。");
  addT('m_sangoron_12', () => isNight(), 'sangoron', 'smile', "よるは えだの あいだが くらく みえる。");
  addT('m_sangoron_13', () => K.G.region === 3, 'sangoron', 'smile', "うみの そこの みずは えだに なじむね。");
  addT('m_sangoron_14', () => isLowHp(selectedMember), 'sangoron', 'smile', "えだの さきまで つかれた。 やすもう。");
  addT('m_sangoron_15', () => true, 'sangoron', 'smile', "ミオ、 うたうと えだの あいだで おとが ひびくよ。", 'mio', 'smile', "うん！ あなたの こえも ちゃんと きこえてるよ。");
  addT('m_chouchinan_01', () => true, 'chouchinan', 'smile', "ぽう。 あかりを すこし ちかづけます。");
  addT('m_chouchinan_02', () => true, 'chouchinan', 'smile', "まぶしすぎない むきに しますね。");
  addT('m_chouchinan_03', () => true, 'chouchinan', 'smile', "くらい みちなら そばに きてください。");
  addT('m_chouchinan_04', () => true, 'chouchinan', 'smile', "ひかりの とどく はばを たしかめます。");
  addT('m_chouchinan_05', () => true, 'chouchinan', 'smile', "うごくと あかりも ゆれますね。");
  addT('m_chouchinan_06', () => true, 'chouchinan', 'smile', "ちいさな あかりでも あしばは みえます。");
  addT('m_chouchinan_07', () => true, 'chouchinan', 'smile', "あかりの そとにも めを むけましょう。");
  addT('m_chouchinan_08', () => true, 'chouchinan', 'smile', "しずかな みずの おとを ききます。");
  addT('m_chouchinan_09', () => true, 'chouchinan', 'smile', "ひかりを むやみに ふりまわさないように。");
  addT('m_chouchinan_10', () => true, 'chouchinan', 'smile', "そばの なかまを てらしますね。");
  addT('m_chouchinan_11', () => !isNight(), 'chouchinan', 'smile', "ひるは あかりが うすく みえます。");
  addT('m_chouchinan_12', () => isNight(), 'chouchinan', 'smile', "よるは ちいさな あかりが たよりに なりますね。");
  addT('m_chouchinan_13', () => K.G.region === 3, 'chouchinan', 'smile', "うみの そこの みちを ゆっくり てらしましょう。");
  addT('m_chouchinan_14', () => isLowHp(selectedMember), 'chouchinan', 'smile', "あかりが よわく なりました。 やすみたいです。");
  addT('m_chouchinan_15', () => true, 'chouchinan', 'smile', "カイトさん、 たがいの あかりで あしばを たしかめましょう。", 'kaito', 'smile', "おう。 まわりを みながら、 いっしょに すすもう。");
  addT('m_uminokami_01', () => true, 'uminokami', 'smile', "ゆるり。 しおの ながれを かんじよ。");
  addT('m_uminokami_02', () => true, 'uminokami', 'smile', "おおきな いのちも ひといきずつ すすむ。");
  addT('m_uminokami_03', () => true, 'uminokami', 'smile', "みずの おとに みみを すませよう。");
  addT('m_uminokami_04', () => true, 'uminokami', 'smile', "つよい ながれにも おちつける ばしょは ある。");
  addT('m_uminokami_05', () => true, 'uminokami', 'smile', "ちいさな いきものを みおとさぬようにな。");
  addT('m_uminokami_06', () => true, 'uminokami', 'smile', "あしばを たしかめてから すすもう。");
  addT('m_uminokami_07', () => true, 'uminokami', 'smile', "うみは すがたを すこしずつ かえる。");
  addT('m_uminokami_08', () => true, 'uminokami', 'smile', "ひかりの ふちにも めを むけよ。");
  addT('m_uminokami_09', () => true, 'uminokami', 'smile', "おもいきり うごく まえに なかまを みよ。");
  addT('m_uminokami_10', () => true, 'uminokami', 'smile', "しずかな こころで まわりを たしかめよう。");
  addT('m_uminokami_11', () => !isNight(), 'uminokami', 'smile', "ひるの ひかりを みずが うけているな。");
  addT('m_uminokami_12', () => isNight(), 'uminokami', 'smile', "よるの うみも いのちの おとが する。");
  addT('m_uminokami_13', () => K.G.region === 3, 'uminokami', 'smile', "うみの そこでは しおの ながれを よむが よい。");
  addT('m_uminokami_14', () => isLowHp(selectedMember), 'uminokami', 'smile', "いまは ちからを やすませよう。");
  addT('m_uminokami_15', () => true, 'uminokami', 'smile', "カイトよ、 ともしびを たいせつに する そなたの すがたを みているぞ。", 'kaito', 'smile', "おう。 まわりを みながら、 いっしょに すすもう。");
  addT('m_chouchinan_done', () => K.G.region === 3 && F().c4done, 'chouchinan', 'smile', "深みの王が ひかりの あわに なってから、 うみの そこの くらさが すこし やわらいだ きが します。");
  addT('m_uminokami_done', () => inPalace() && F().c4done, 'uminokami', 'smile', "深みの王の こころは ほどけた。 みやに あかりを もどしてくれたな。");
  addT('m_uminokami_super', () => inTrench() && F().superDone, 'uminokami', 'smile', "ふかい そこに ねむる ぬしも そなたらの 灯を みとめたな。");
  // 会話条件は現在の隊列・個体で評価する。過去の加入だけでは同席としない。
  let selectedMember = null;
  const ensureSeen = g => {
    if (!g.talkSeen || typeof g.talkSeen !== 'object' || Array.isArray(g.talkSeen)) g.talkSeen = {};
    return g.talkSeen;
  };
  H.init.push(ensureSeen);
  H.load.push(g => { ensureSeen(g); lastBattle = null; recent.clear(); });
  const recent = new Map();
  const identity = m => m.kind === 'mon' ? m.uid : m.id;
  const teammates = () => K.G.team.map(ref => K.member(ref)).filter(Boolean);
  const partnerOf = (t, m) => teammates().find(p => identity(p) !== identity(m) && p.id === t.pwho);
  const eligible = m => {
    if (!m || !K.G.team.includes(identity(m))) return [];
    selectedMember = m;
    return TALKS.filter(t => t.who === m.id && (!t.pwho || partnerOf(t, m)) && (() => { try { return t.cond(); } catch (_) { return false; } })());
  };
  const format = (id, ex, text, member) => (member ? member.kind === 'human' : ['sora', 'mio', 'riku', 'sana', 'haru', 'kaito'].includes(id))
    ? K.who(id, ex, text)
    : K.nm(member ? K.nameOf(member) : DATA.species[id].name, text);
  const finalReply = t => {
    // Geminiの構造化前の3行目をデータとして読み取る。コードは実行しない。
    if (!t.soloText) return null;
    const a = t.soloText.match(/^who\("([a-z_]+)","([a-z]+)","([^"]*)"\)$/);
    return a ? { id: a[1], ex: a[2], text: a[3] } : null;
  };
  function linesFor(t, m) {
    if (t.lines) return t.lines;
    const lines = [format(t.who, t.ex, t.text, m)];
    if (t.pwho) {
      const p = partnerOf(t, m);
      if (!p) return [];
      lines.push(format(p.id, t.pex || 'smile', t.ptext, p));
      const last = finalReply(t);
      if (last && (last.id === m.id || last.id === p.id)) lines.push(format(last.id, last.ex, last.text, last.id === m.id ? m : p));
    }
    return lines;
  }
  function choose(m) {
    const candidates = eligible(m), seen = ensureSeen(K.G);
    if (!candidates.length) return null;
    const key = identity(m), history = recent.get(key) || [];
    const unread = candidates.filter(t => !seen[t.id]);
    const pool = unread.length ? unread : candidates.filter(t => !t.pwho && !history.includes(t.id));
    // 既読後は場所に合う単独の短い反応。10件以内の繰返しを避ける。
    const options = pool.length ? pool : candidates.filter(t => !t.pwho);
    const t = options[Math.min(options.length - 1, Math.floor(K.R() * options.length))];
    if (!t) return null;
    seen[t.id] = 1;
    recent.set(key, [...history, t.id].slice(-9));
    return { id: t.id, lines: unread.length ? linesFor(t, m) : [format(m.id, t.ex, t.text.split('。')[0] + '。', m)] };
  }
  async function speak(m) {
    const result = choose(m);
    if (!result) return;
    await K.say(result.lines);
    if (!K.save()) K.toast('かいわの きろくを ほぞんできませんでした');
  }
  async function openTalkMenu() {
    const members = teammates();
    if (!members.length) return;
    const c = await K.menu({ title: 'だれと はなす？', items: members.map(m => ({ label: K.esc(K.nameOf(m)), sub: `Lv${m.lv}` })), where: 'center' });
    if (c >= 0 && members[c]) await speak(members[c]);
  }

  for (const t of TALKS) previous.L.push({ id: t.id, w: t.who, need: t.pwho ? [t.pwho] : [], when: t.cond, s: () => { const m = teammates().find(x => x.id === t.who); return m ? linesFor(t, m) : []; } });
  // 拡張用の読取・会話入口。既存APIやHOOKは差し替えない。
  K.partyTalk = { ...previous, talkWith: ref => { const m = K.member(ref); return m && speak(m); }, open: openTalkMenu, register: entries => { for (const e of entries) { if (TALKS.some(t => t.id === e.id)) continue; const actors = e.t.filter(l => l.who).map(l => l.who); const t = { id: e.id, who: e.c, ex: 'smile', text: e.t.map(l => l.t || l).join('。'), lines: e.t, cond: () => actors.every(id => K.G.team.includes(id)) && e.cond(K.G, K.G.region) }; TALKS.push(t); previous.L.push({id:t.id,w:t.who,need:actors.filter(id=>id!==t.who),when:t.cond,s:()=>t.lines}); } }, choose, eligible, linesFor, counts: () => TALKS.reduce((a, t) => { a[t.who] = (a[t.who] || 0) + 1; return a; }, {}) };
})();
