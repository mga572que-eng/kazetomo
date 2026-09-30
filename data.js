// 風灯の島 — characters, stats, skills, enemies, story text
'use strict';
const DATA = {
  cast: {
    sora: { name: 'ソラ', role: '主人公', age: 16, title: '灯守りの家の子',
      look: '栗色のツンツン頭に、父のおさがりの橙色のマフラー。腰には小さな灯の短剣。',
      body: 'まっすぐで お人よし。こわがりだけれど、だれかが 困っていると 考えるより先に 体が動く。高いところが 苦手（灯台守の 家なのに）。',
      past: '三年前、父カイトが 夜の海へ 消えた日から、毎晩 岬で 消えた灯台を 見上げている。',
      like: '夕焼け／母のスープ／ワタポコの もふもふ', line: '「灯は、帰る場所の しるしなんだ。父さんが そう言ってた」' },
    mio: { name: 'ミオ', role: 'ヒロイン', age: 16, title: '村の歌い手',
      look: '夕焼け色の 長い髪に、白い花の髪飾り。緑のベストは 母の形見。',
      body: '明るくて おしゃべり。いきものの「こえ」が きこえる ふしぎな子。そのぶん、だれかの 悲しみにも 気づいてしまう。実は 暗闇が こわい。',
      past: '幼いころ 海で 溺れかけたところを、ソラの父カイトに 助けられた。その恩を、ずっと 返したいと 思っている。',
      like: '歌／ナギの 木の実パイ／星', line: '「きこえるの。灯台の ほうで、だれかが 泣いてる」' },
    riku: { name: 'リク', role: '仲間', age: 17, title: '流れ者の槍使い',
      look: '紺の髪に 赤いバンダナ。頬の傷と、使いこんだ 長槍。',
      body: '口が悪く ひねくれ者。でも 一度 決めたことは 曲げない。ソラを「甘ちゃん」と 呼ぶ。',
      past: '本土の 港町の生まれ。ある夜、町の灯が すべて 喰われ、家族と 離ればなれに なった。闇の王を 追って 島へ 渡ってきた。',
      like: '干し魚／静かな 夜明け', line: '「火をつけりゃ、あいつが 来る。……それでも やるのか？」' },
    kaito: { name: 'カイト', role: '父', age: 42, title: '島いちばんの灯台守',
      look: '紺の 灯台守の外套に 金のボタン。無精ひげ。',
      body: '厳しくて、でも 笑うと 子どもみたいな人。口ぐせは「灯は、帰る場所の しるしだ」。',
      past: '三年前「海の向こうで 光が 喰われている」と 言い残し、小舟で 夜の海へ。五つの灯台に、ソラへの 手紙を 隠していった。',
      like: '妻の いれる 薬草茶／星を 読むこと', line: '「待っている。おまえなら、きっと ここまで 来る」' },
    yui: { name: 'ユイ', role: '母', age: 40, title: '村の薬師',
      look: '栗色の 三つ編みを 肩に流し、若草色の服に 生成りの前掛け。',
      body: 'おっとりして見えて、芯は だれより 強い。夫の帰りを 信じて、毎晩 窓辺に ランプを 置く。',
      past: '島の外から 嫁いできた。カイトが 消えた夜も、泣かずに 村じゅうの けが人を 手当てした。',
      like: '薬草畑／家族の ごはん', line: '「ごはんは 冷めないうちにね。……いってらっしゃい」' },
    gen: { name: 'ゲン', role: 'おじ', age: 46, title: '大工・鍛冶屋',
      look: '手ぬぐいの 鉢巻きに 黒いひげ。腕は 丸太のよう。',
      body: '無口で ぶっきらぼう。照れると 金づちを 鳴らす。村の家は ほとんど 彼が ひとつずつ 積んで 建てた。',
      past: 'カイトの兄。弟が 夜の海へ出るのを 止められなかったことを、今も 悔やんでいる。',
      like: '木の香り／ナギの 小言（本人は 否定）', line: '「……持ってこい。材料さえ ありゃ、なんだって 作ってやる」' },
    nagi: { name: 'ナギ', role: 'おば', age: 44, title: '食堂「かざみ亭」のおかみ',
      look: '水玉の 赤いバンダナに、そばかす。橙の 服に 真っ白な 前掛け。',
      body: '陽気で おせっかいで、村いちばんの 情報通。ソラを 実の子のように かわいがる。',
      past: 'ゲンの妻。子どもは いないが、村の子は みんな 彼女の パイで 育った。',
      like: 'うわさ話／大鍋料理／ゲンの 寝顔（内緒）', line: '「腹が へっては 冒険は できないよ！」' },
    yomi: { name: 'ヨミカゲ', role: 'ラスボス', age: '？', title: '宵闇の王',
      look: '白銀の髪に 闇の王冠。消えた ランタンを 手に さげている。',
      body: '島の 五つの灯を 喰らい、永遠の 夜で 島を 閉ざそうとする者。その声は、いつも どこか 悲しげ。',
      past: '正体は かつての 灯台守 クロウ。カイトの 師匠。四十年前の 嵐の夜、灯が 消えていたせいで、娘ハルを 海で 失った。「灯があるから 人は 海へ出る。ならば 永遠の夜で、だれも 旅立たせない」——悲しみが 闇を まとい、王となった。',
      like: '——', line: '「灯を ともして 何になる。灯があるから、人は 帰ってこない」' },
  },
  party: {
    sora: { base: { hp: 36, mp: 10, atk: 12, def: 8, spd: 10 }, grow: { hp: 7, mp: 2, atk: 3, def: 2, spd: 1 }, skills: [['tomoshi', 1], ['mamori', 4], ['issen', 8]] },
    mio: { base: { hp: 28, mp: 18, atk: 7, def: 6, spd: 11 }, grow: { hp: 5, mp: 4, atk: 1.5, def: 1.5, spd: 1.2 }, skills: [['iyashi', 1], ['nemuri', 3], ['kiyome', 6]] },
    riku: { base: { hp: 44, mp: 8, atk: 16, def: 10, spd: 13 }, grow: { hp: 8, mp: 1.5, atk: 3.5, def: 2, spd: 1.3 }, skills: [['tsuranuki', 1], ['kazaguruma', 5]] },
    watapoko: { base: { hp: 30, mp: 12, atk: 7, def: 7, spd: 8 }, grow: { hp: 6, mp: 2, atk: 1.5, def: 2, spd: 1 }, skills: [['fuwafuwa', 1]] },
    iwanoko: { base: { hp: 40, mp: 6, atk: 13, def: 12, spd: 5 }, grow: { hp: 8, mp: 1, atk: 3, def: 3, spd: .6 }, skills: [['iwaotoshi', 1]] },
    mizumochi: { base: { hp: 32, mp: 10, atk: 10, def: 8, spd: 10 }, grow: { hp: 6, mp: 2, atk: 2.2, def: 2, spd: 1.1 }, skills: [['mizudeppou', 1]] },
    hoshikage: { base: { hp: 30, mp: 16, atk: 11, def: 7, spd: 14 }, grow: { hp: 5, mp: 3, atk: 2.4, def: 1.5, spd: 1.4 }, skills: [['matataki', 1]] },
  },
  friendInfo: {
    watapoko: { name: 'ワタポコ', desc: '草原に すむ わたげの いきもの。風が ふくと ふわりと 浮かぶ。なかまを いやす。' },
    iwanoko: { name: 'イワノコ', desc: '岩場に すむ。背中の 石は 大人になるほど 増える。力もち。' },
    mizumochi: { name: 'ミズモチ', desc: '浜辺で はねる ひんやりした いきもの。水の たまを とばす。' },
    hoshikage: { name: 'ホシカゲ', desc: '夜にだけ あらわれる。星の かけらを まとい、まわりを 照らす。' },
  },
  skills: {
    tomoshi: { type: 'fire', name: 'ともしび斬り', mp: 3, tg: 'enemy', power: 1.7, verb: 'はなった', fx: 'fire' },
    mamori: { name: 'まもりの灯', mp: 4, tg: 'party', buff: 'def', verb: 'となえた', fx: 'light' },
    issen: { type: 'light', name: 'ひかりの一閃', mp: 8, tg: 'enemies', power: 1.35, verb: 'はなった', fx: 'light' },
    iyashi: { name: 'いやしの歌', mp: 5, tg: 'party', heal: 18, healPct: .22, verb: 'うたった', fx: 'heal' },
    nemuri: { name: 'ねむりの歌', mp: 3, tg: 'enemy', sleep: .65, verb: 'うたった', fx: 'song' },
    kiyome: { type: 'light', name: 'きよめの歌', mp: 6, tg: 'enemy', power: 1.9, magic: true, verb: 'うたった', fx: 'light' },
    tsuranuki: { name: 'つらぬき', mp: 4, tg: 'enemy', power: 2.1, verb: 'はなった', fx: 'slash' },
    kazaguruma: { type: 'wind', name: 'かざぐるま', mp: 6, tg: 'enemies', power: 1.15, verb: 'はなった', fx: 'slash' },
    fuwafuwa: { name: 'ふわふわ', mp: 3, tg: 'ally', heal: 32, verb: 'つかった', fx: 'heal' },
    iwaotoshi: { type: 'earth', name: 'いわおとし', mp: 3, tg: 'enemy', power: 1.7, verb: 'はなった', fx: 'rock' },
    mizudeppou: { type: 'water', name: 'みずでっぽう', mp: 3, tg: 'enemy', power: 1.6, verb: 'はなった', fx: 'water' },
    matataki: { type: 'light', name: 'ほしのまたたき', mp: 5, tg: 'enemies', power: 1.15, magic: true, verb: 'はなった', fx: 'light' },
    // enemy skills
    karami: { name: 'からみつく つる', tg: 'one', power: 1.35, slow: true },
    jinarashi: { name: 'じならし', tg: 'all', power: .9 },
    tsunami: { name: 'くろい つなみ', tg: 'all', power: 1.0 },
    tobari: { name: 'よるの とばり', tg: 'all', power: .85 },
    yaminohonoo: { name: 'やみの ほのお', tg: 'one', power: 1.8 },
    tomoshikui: { name: 'ともしびくい', tg: 'all', drain: 8 },
    tokoyo: { name: 'とこよの やみ', tg: 'all', power: 1.2 },
    nageki: { name: 'なげきの こえ', tg: 'all', sleep: .3 },
    e_mizu: { name: 'みずでっぽう', tg: 'one', power: 1.4 },
    e_hoshi: { name: 'ほしのまたたき', tg: 'all', power: .8 },
  },
  items: {
    mi: { name: '木の実', heal: 25, desc: 'HPを 25 かいふく' },
    pan: { name: '実のパン', heal: 80, desc: 'HPを 80 かいふく（ナギの お手製）' },
    shizuku: { name: '夜露のしずく', mp: 15, desc: 'MPを 15 かいふく' },
    maki: { name: '薪', mat: true, desc: '灯台に 火を ともすのに 3つ いる。ブロックにも なる' },
    ishi: { name: '石', mat: true, desc: 'ゲンに 渡すと 武具になる。ブロックにも なる' },
  },
  weapons: [{ name: '灯の短剣', atk: 0 }, { name: '石の剣', atk: 7, cost: { ishi: 5, maki: 3 } }, { name: '灯の剣', atk: 16, cost: { ishi: 10, maki: 6, shizuku: 2 } }],
  armors: [{ name: '旅の服', def: 0 }, { name: '木の胸当て', def: 4, cost: { maki: 5, ishi: 2 } }, { name: '石の よろい', def: 9, cost: { ishi: 12, maki: 4 } }],
  enemies: {
    kage_wata: { name: 'かげワタポコ', art: ['watapoko', 1], hp: 16, atk: 9, def: 3, spd: 7, exp: 6, drop: [['mi', .4]], join: 'watapoko', joinRate: .3 },
    kage_iwa: { name: 'かげイワノコ', art: ['iwanoko', 1], hp: 24, atk: 11, def: 9, spd: 4, exp: 9, drop: [['ishi', .5]], join: 'iwanoko', joinRate: .28 },
    kage_mizu: { name: 'かげミズモチ', art: ['mizumochi', 1], hp: 20, atk: 10, def: 5, spd: 9, exp: 8, drop: [['mi', .3]], join: 'mizumochi', joinRate: .3, acts: [['atk', .7], ['e_mizu', .3]] },
    koumori: { name: 'ヨルコウモリ', art: ['koumori', 1], hp: 17, atk: 12, def: 4, spd: 15, exp: 10, drop: [['shizuku', .3]] },
    kage_hoshi: { name: 'かげホシカゲ', art: ['hoshikage', 1], hp: 28, atk: 13, def: 7, spd: 12, exp: 16, drop: [['shizuku', .5]], join: 'hoshikage', joinRate: .35, acts: [['atk', .6], ['e_hoshi', .4]] },
    tsutakage: { name: 'ツタカゲ', art: ['tsutakage', 1], hp: 110, atk: 15, def: 8, spd: 6, exp: 70, boss: true, acts: [['atk', .6], ['karami', .4]] },
    rikuDuel: { name: 'リク', portrait: 'riku', hp: 130, atk: 19, def: 11, spd: 14, exp: 100, boss: true, acts: [['atk', .65], ['tsuranuki_e', .35]] },
    iwaoni: { name: 'イワオニ', art: ['iwaoni', 1], hp: 210, atk: 25, def: 18, spd: 5, exp: 160, boss: true, acts: [['atk', .6], ['jinarashi', .4]] },
    umikage: { name: 'ウミカゲ', art: ['umikage', 1], hp: 250, atk: 27, def: 15, spd: 12, exp: 210, boss: true, acts: [['atk', .55], ['tsunami', .45]] },
    tobaridori: { name: 'トバリドリ', art: ['tobaridori', 1], hp: 300, atk: 30, def: 17, spd: 18, exp: 280, boss: true, acts: [['atk', .5], ['tobari', .5]] },
    yomikage: { name: 'ヨミカゲ', art: ['yomikage', 1], hp: 380, atk: 33, def: 20, spd: 16, exp: 0, boss: true, acts: [['atk', .4], ['yaminohonoo', .35], ['tomoshikui', .25]] },
    yoiyami: { name: '宵闇の王', art: ['yoiyami', 1], hp: 560, atk: 37, def: 22, spd: 18, exp: 0, boss: true, twice: true, acts: [['atk', .35], ['tokoyo', .35], ['nageki', .3]] },
  },
  guards: ['tsutakage', 'rikuDuel', 'iwaoni', 'umikage', 'tobaridori'],
  letters: [
    ['ソラへ。この手紙を 読んでいるなら、おまえは 最初の 灯を ともしたんだな。……えらいぞ。', '灯は、帰る場所の しるしだ。船乗りにとっても、いきものにとっても、そして 父さんにとっても。'],
    ['海の向こうで、光が 喰われている。黒い霧の中に、見覚えのある 背中を 見た。', 'まさか……師匠？'],
    ['クロウ師匠は、四十年前の 嵐の夜に、娘のハルを 失った。あの夜、灯台の火は 消えていた。', '師匠は ずっと、自分を 責めていたんだ。'],
    ['父さんは 闇の中で、師匠と 話し続けている。悲しみは、力ずくでは 晴れない。', 'だが ひとりで 抱えるには、夜は 長すぎる。'],
    ['五つの灯が そろえば、道が 見える。ソラ、母さんを たのむ。', '……いや、おまえなら きっと ここまで 来てしまうな。待っている。'],
  ],
};
DATA.skills.tsuranuki_e = { name: 'つらぬき', tg: 'one', power: 1.8 };

// ======================= 第2章 & やりこみ =======================
Object.assign(DATA.cast, {
  sana: { name: 'サナ', role: '仲間', age: 15, title: 'リクの妹・星読みの巫女',
    look: '兄と同じ 紺の 長い髪を ひとつに 結び、星の 髪飾り。白と 藍の 巫女装束。',
    body: 'おだやかで 芯が強い。兄とは 正反対の ていねいな 話し方。星の「こえ」を 聴く 力を 持つ。',
    past: '港町が 夜に 喰われた 日、星の 光に 導かれて 大陸へ。星喰いに 力を 利用され、遺跡の 奥で 眠らされていた。',
    like: '星空／兄の へたな 口笛', line: '「兄さん……ずっと、星に 祈っていました」' },
  tsumugi: { name: 'ツムギ', role: '研究者', age: 13, title: 'いきもの研究家の見習い',
    look: 'ふたつ結びの 若草色の髪に、大きな 丸メガネ。ぶかぶかの 白衣。',
    body: '好奇心の かたまり。いきものの 話に なると 止まらない。人見知りだが、いきもの相手なら 物おじしない。',
    past: '祖母は 大陸じゅうを 歩いた 伝説の 研究家。その 未完の 図鑑を 完成させるのが 夢。',
    like: '観察ノート／甘いもの／ワタポコ（最推し）', line: '「その子、まだ 図鑑に のってないよ！ ねえ、見せて 見せて！」' },
  baldo: { name: 'バルド', role: '船長', age: 58, title: '「かもめ丸」の船長',
    look: '白い ひげに 潮焼けした 肌、つばの広い 帽子。',
    body: '豪快で 涙もろい。海の男の 心得を 語りだすと 長い。',
    past: 'クロウと カイトの 古い 友人。四十年前の 嵐の夜、クロウの 娘を 助けられなかった 船に 乗っていた。',
    like: '潮風／ナギの 魚料理', line: '「海は 怖え。だから 灯が いる。……さあ、乗りな！」' },
});
DATA.party.sana = { base: { hp: 34, mp: 22, atk: 11, def: 8, spd: 15 }, grow: { hp: 6, mp: 4, atk: 2.2, def: 1.6, spd: 1.5 }, skills: [['hoshiyomi', 1], ['inori', 1], ['hoshifuri', 16]] };

DATA.types = { normal: 'ノーマル', fire: 'ほのお', water: 'みず', grass: 'くさ', earth: 'だいち', wind: 'かぜ', light: 'ひかり', dark: 'やみ' };
DATA.typeCol = { normal: '#c8c2b0', fire: '#ff8a4a', water: '#5fb2f0', grass: '#6fcf6a', earth: '#c9a064', wind: '#9fe0d0', light: '#ffe38a', dark: '#a07ad8' };
DATA.strong = { fire: ['grass'], water: ['fire', 'earth'], grass: ['water', 'earth'], earth: ['fire', 'wind'], wind: ['grass'], light: ['dark'], dark: ['light'] };
DATA.typeMul = (atk, def) => { if (!atk || !def) return 1; if ((DATA.strong[atk] || []).includes(def)) return 1.5; if ((DATA.strong[def] || []).includes(atk) && atk !== 'light' && atk !== 'dark') return .67; return 1; };

Object.assign(DATA.skills, {
  taiatari: { type: 'normal', name: 'たいあたり', mp: 1, tg: 'enemy', power: 1.3, verb: 'くりだした', fx: 'slash' },
  hinoko: { type: 'fire', name: 'ひのこ', mp: 3, tg: 'enemy', power: 1.55, magic: true, verb: 'はなった', fx: 'fire' },
  honoo: { type: 'fire', name: 'ほのおのうず', mp: 6, tg: 'enemies', power: 1.2, magic: true, verb: 'はなった', fx: 'fire' },
  mizu: { type: 'water', name: 'みずでっぽう', mp: 3, tg: 'enemy', power: 1.55, verb: 'はなった', fx: 'water' },
  nami: { type: 'water', name: 'おおなみ', mp: 6, tg: 'enemies', power: 1.2, magic: true, verb: 'よびおこした', fx: 'water' },
  happa: { type: 'grass', name: 'はっぱカッター', mp: 3, tg: 'enemy', power: 1.5, verb: 'はなった', fx: 'slash' },
  tsuta: { type: 'grass', name: 'つたしばり', mp: 4, tg: 'enemy', power: 1.35, slow: true, verb: 'はなった', fx: 'slash' },
  iwa: { type: 'earth', name: 'いわおとし', mp: 3, tg: 'enemy', power: 1.65, verb: 'はなった', fx: 'rock' },
  jishin: { type: 'earth', name: 'じひびき', mp: 7, tg: 'enemies', power: 1.2, verb: 'おこした', fx: 'rock' },
  kaze: { type: 'wind', name: 'かまいたち', mp: 3, tg: 'enemy', power: 1.5, verb: 'はなった', fx: 'slash' },
  arashi: { type: 'wind', name: 'あらし', mp: 7, tg: 'enemies', power: 1.25, magic: true, verb: 'よびおこした', fx: 'slash' },
  yami: { type: 'dark', name: 'かげうち', mp: 4, tg: 'enemy', power: 1.6, verb: 'はなった', fx: 'dark' },
  ginga: { type: 'light', name: 'ぎんがのひかり', mp: 9, tg: 'enemies', power: 1.45, magic: true, verb: 'はなった', fx: 'light' },
  iyashikaze: { name: 'いやしのかぜ', mp: 6, tg: 'party', heal: 20, healPct: .12, verb: 'ふかせた', fx: 'heal' },
  hoshiyomi: { type: 'light', name: 'ほしよみ', mp: 5, tg: 'enemy', power: 1.8, magic: true, verb: 'となえた', fx: 'light' },
  inori: { name: '星のいのり', mp: 7, tg: 'party', heal: 26, healPct: .18, verb: 'ささげた', fx: 'heal' },
  hoshifuri: { type: 'light', name: 'ほしふり', mp: 10, tg: 'enemies', power: 1.45, magic: true, verb: 'となえた', fx: 'light' },
  // enemy
  jishin_e: { type: 'earth', name: 'じひびき', tg: 'all', power: 1.0 },
  hoshi_e: { type: 'light', name: 'ほしの いかり', tg: 'all', power: .95 },
  ryuusei: { type: 'light', name: 'りゅうせいぐん', tg: 'all', power: 1.25 },
});

// ---- いきもの 28種 ----
// arch: fluff blob quad bird sprite golem plant fish / hab: r(region, -1=both) b(biomes) t(day/night/any) w(weight)
const SP = (o) => o;
DATA.species = {
  watapoko: SP({ no: 1, name: 'ワタポコ', arch: 'fluff', col: ['#fbf7ee', '#e3d8c4', '#7fb35a'], feat: ['sprout'], type: 'grass', hab: { r: 0, b: ['grass', 'forest'], t: 'any', w: 10 }, base: [30, 12, 7, 7, 8], grow: [6, 2, 1.5, 2, 1], sk: [['taiatari', 1], ['fuwafuwa', 3], ['iyashikaze', 10]], evo: { to: 'watafuwari', lv: 14 }, desc: '草原に すむ わたげの いきもの。風が ふくと ふわりと 浮かぶ。' }),
  watafuwari: SP({ no: 2, name: 'ワタフワリ', arch: 'fluff', col: ['#fff8f0', '#e9dcc8', '#8fcf6a'], feat: ['sprout', 'wings'], size: 1.35, type: 'grass', base: [46, 22, 11, 12, 12], grow: [7, 3, 2, 2.2, 1.4], sk: [['fuwafuwa', 1], ['iyashikaze', 1], ['kaze', 16], ['happa', 20]], desc: 'ワタポコが 育った すがた。雲に まぎれて 空を 旅する。' }),
  iwanoko: SP({ no: 3, name: 'イワノコ', arch: 'quad', col: ['#c9a57c', '#a8835b', '#8d9096'], feat: ['plates'], type: 'earth', hab: { r: 0, b: ['rock'], t: 'any', w: 10 }, base: [40, 6, 13, 12, 5], grow: [8, 1, 3, 3, .6], sk: [['taiatari', 1], ['iwa', 4], ['jishin', 15]], evo: { to: 'iwagoron', lv: 16 }, desc: '岩場に すむ。背中の 石は 大人に なるほど 増える。' }),
  iwagoron: SP({ no: 4, name: 'イワゴロン', arch: 'golem', col: ['#9a8f82', '#6b6862', '#c9a57c'], feat: ['core'], size: 1.35, type: 'earth', base: [60, 10, 19, 20, 5], grow: [10, 1.2, 3.6, 3.8, .6], sk: [['iwa', 1], ['jishin', 1]], desc: '岩を まとった 大きな すがた。一歩ごとに 地面が ゆれる。' }),
  mizumochi: SP({ no: 5, name: 'ミズモチ', arch: 'blob', col: ['#8fd3e6', '#5fb2cf', '#e9fbff'], feat: ['ears'], type: 'water', hab: { r: 0, b: ['shore'], t: 'any', w: 10 }, base: [32, 10, 10, 8, 10], grow: [6, 2, 2.2, 2, 1.1], sk: [['taiatari', 1], ['mizu', 3], ['nami', 14]], evo: { to: 'mizudaifuku', lv: 15 }, desc: '浜辺で はねる ひんやりした いきもの。水の たまを とばす。' }),
  mizudaifuku: SP({ no: 6, name: 'ミズダイフク', arch: 'blob', col: ['#a6e0f2', '#4f9fc4', '#f4fdff'], feat: ['ears', 'crown'], size: 1.4, type: 'water', base: [52, 18, 15, 13, 11], grow: [9, 2.5, 2.8, 2.6, 1.1], sk: [['mizu', 1], ['nami', 1], ['iyashikaze', 18]], desc: '浜の 主。潮の 満ち引きを 知っている らしい。' }),
  hoshikage: SP({ no: 7, name: 'ホシカゲ', arch: 'sprite', col: ['#2e3a78', '#1b2250', '#ffe38a'], feat: ['stars', 'ears'], type: 'light', hab: { r: 0, b: ['grass', 'forest', 'rock'], t: 'night', w: 4 }, base: [30, 16, 11, 7, 14], grow: [5, 3, 2.4, 1.5, 1.4], sk: [['matataki', 1], ['yami', 6]], evo: { to: 'hoshimikage', lv: 18 }, desc: '夜にだけ あらわれる。星の かけらを まとい、まわりを 照らす。' }),
  hoshimikage: SP({ no: 8, name: 'ホシミカゲ', arch: 'sprite', col: ['#3a3f9a', '#20245e', '#fff0a8'], feat: ['stars', 'ears', 'wings'], size: 1.35, type: 'light', base: [44, 26, 16, 11, 17], grow: [7, 4, 3, 2, 1.6], sk: [['matataki', 1], ['ginga', 18]], desc: '夜空の 番人。その 光は 迷子を 家へ みちびく。' }),
  yorukoumori: SP({ no: 9, name: 'ヨルコウモリ', arch: 'bird', col: ['#3d3057', '#2c2340', '#ff6fb0'], feat: ['bat'], type: 'dark', hab: { r: -1, b: ['grass', 'forest', 'rock', 'desert', 'ruins'], t: 'night', w: 8 }, base: [28, 8, 12, 5, 15], grow: [5, 1.5, 2.6, 1.3, 1.6], sk: [['taiatari', 1], ['yami', 5]], evo: { to: 'yoibasa', lv: 16 }, desc: '暗がりを 好む。人なつっこいが、光には まぶしそうに する。' }),
  yoibasa: SP({ no: 10, name: 'ヨイバサ', arch: 'bird', col: ['#4a3570', '#2a1d44', '#ff8ad0'], feat: ['bat', 'horns'], size: 1.4, type: 'dark', base: [42, 14, 17, 9, 18], grow: [7, 2, 3.2, 1.8, 1.8], sk: [['yami', 1], ['kaze', 16]], desc: '宵の 空を 支配する。つばさで 月を かくすと いわれる。' }),
  tsuchimogu: SP({ no: 11, name: 'ツチモグ', arch: 'quad', col: ['#8a6a4a', '#6a4f36', '#f0c0a0'], feat: ['claws', 'nose'], type: 'earth', hab: { r: 0, b: ['forest'], t: 'any', w: 5 }, base: [36, 8, 12, 10, 7], grow: [7, 1.5, 2.6, 2.2, .9], sk: [['taiatari', 1], ['iwa', 6], ['jishin', 18]], desc: '森の 土の中で くらす。宝物を 見つけるのが 得意。' }),
  hanapokke: SP({ no: 12, name: 'ハナポッケ', arch: 'plant', col: ['#7fbf5a', '#5a9a3f', '#ff9ec4'], feat: ['bud'], type: 'grass', hab: { r: 0, b: ['grass'], t: 'day', w: 5 }, base: [30, 14, 9, 8, 9], grow: [6, 2.5, 2, 1.8, 1], sk: [['happa', 1], ['tsuta', 6]], evo: { to: 'hanakanmuri', lv: 14 }, desc: 'つぼみを かかえて 歩く。晴れた 日は ごきげん。' }),
  hanakanmuri: SP({ no: 13, name: 'ハナカンムリ', arch: 'plant', col: ['#8fd06a', '#5f9f45', '#ff7fb0'], feat: ['petals', 'crown'], size: 1.35, type: 'grass', base: [46, 24, 14, 12, 11], grow: [8, 3.5, 2.8, 2.4, 1.2], sk: [['happa', 1], ['tsuta', 1], ['iyashikaze', 16]], desc: '花の 冠を もつ 草原の 女王。' }),
  sunawani: SP({ no: 14, name: 'スナワニ', arch: 'quad', col: ['#d6b36b', '#b08a48', '#f7e2a8'], feat: ['spikes', 'snout'], type: 'earth', hab: { r: 1, b: ['desert'], t: 'any', w: 10 }, base: [40, 8, 15, 12, 8], grow: [8, 1.5, 3, 2.6, 1], sk: [['taiatari', 1], ['iwa', 1], ['jishin', 20]], evo: { to: 'sunawaniking', lv: 22 }, desc: '砂の中を 泳ぐ。目だけ 出して 旅人を 観察している。' }),
  sunawaniking: SP({ no: 15, name: 'スナワニキング', arch: 'quad', col: ['#e0bf70', '#a07a36', '#fff0b8'], feat: ['spikes', 'snout', 'crown'], size: 1.5, type: 'earth', base: [62, 12, 22, 18, 10], grow: [10, 2, 3.8, 3.2, 1.1], sk: [['iwa', 1], ['jishin', 1]], desc: '砂漠の 王。その 背に 乗れば 砂嵐も こわくない。' }),
  sabotenbo: SP({ no: 16, name: 'サボテンボ', arch: 'plant', col: ['#5aa65a', '#3f7f45', '#ffd36a'], feat: ['cactus'], type: 'grass', hab: { r: 1, b: ['desert'], t: 'any', w: 5 }, base: [36, 12, 13, 12, 6], grow: [7, 2, 2.6, 2.6, .8], sk: [['happa', 1], ['tsuta', 1]], desc: 'とげとげ だけど、さわると ふにゃっと やわらかい。' }),
  yukiusa: SP({ no: 17, name: 'ユキウサ', arch: 'quad', col: ['#f4f7ff', '#d0dcef', '#9fc8ff'], feat: ['longears'], type: 'water', hab: { r: 1, b: ['snow'], t: 'any', w: 10 }, base: [30, 14, 10, 8, 14], grow: [6, 2.5, 2.2, 1.6, 1.5], sk: [['taiatari', 1], ['mizu', 1], ['nami', 16]], evo: { to: 'yukinomiko', lv: 20 }, desc: '雪原を 跳ねまわる。耳で 雪の 音を 聴く。' }),
  yukinomiko: SP({ no: 18, name: 'ユキノミコ', arch: 'quad', col: ['#ffffff', '#cfe0ff', '#b8a8ff'], feat: ['longears', 'crown'], size: 1.35, type: 'light', base: [46, 26, 15, 12, 18], grow: [8, 3.6, 2.8, 2.2, 1.7], sk: [['mizu', 1], ['matataki', 1], ['iyashikaze', 20]], desc: '雪山に 春を 呼ぶと いわれる 神聖な いきもの。' }),
  kooridori: SP({ no: 19, name: 'コオリドリ', arch: 'bird', col: ['#bfe6ff', '#86c0e8', '#ffffff'], feat: ['crest'], type: 'water', hab: { r: 1, b: ['snow'], t: 'any', w: 5 }, base: [32, 14, 13, 8, 15], grow: [6, 2.2, 2.7, 1.6, 1.6], sk: [['kaze', 1], ['mizu', 1]], desc: 'はばたくと 小さな 雪が 舞う。' }),
  kazetaka: SP({ no: 20, name: 'カゼタカ', arch: 'bird', col: ['#b08a5a', '#7a5a38', '#f0e0c0'], feat: ['crest'], type: 'wind', hab: { r: 1, b: ['grass', 'forest'], t: 'day', w: 10 }, base: [30, 10, 13, 7, 16], grow: [6, 2, 2.8, 1.4, 1.7], sk: [['taiatari', 1], ['kaze', 1], ['arashi', 18]], evo: { to: 'arashitaka', lv: 24 }, desc: '風に のって 大陸を わたる。' }),
  arashitaka: SP({ no: 21, name: 'アラシタカ', arch: 'bird', col: ['#6a7f9a', '#3f4f66', '#e0f0ff'], feat: ['crest', 'crown'], size: 1.45, type: 'wind', base: [48, 16, 20, 12, 21], grow: [8, 2.4, 3.6, 2, 2], sk: [['kaze', 1], ['arashi', 1]], desc: 'ひと はばたきで 嵐を おこす 空の 王者。' }),
  morinoko: SP({ no: 22, name: 'モリノコ', arch: 'sprite', col: ['#6fbf6f', '#3f8f4f', '#e8ffb0'], feat: ['leaf'], type: 'grass', hab: { r: 1, b: ['forest'], t: 'any', w: 6 }, base: [30, 18, 10, 8, 13], grow: [5.5, 3, 2.2, 1.6, 1.4], sk: [['happa', 1], ['iyashikaze', 8]], desc: '森の 精。迷子を 見つけると 道を 教えてくれる。' }),
  hibana: SP({ no: 23, name: 'ヒバナ', arch: 'sprite', col: ['#ff9a4a', '#e0582a', '#ffe070'], feat: ['flame'], type: 'fire', hab: { r: 1, b: ['desert', 'ruins'], t: 'night', w: 6 }, base: [28, 16, 13, 6, 14], grow: [5, 2.6, 2.8, 1.3, 1.5], sk: [['hinoko', 1], ['honoo', 15]], evo: { to: 'homura', lv: 22 }, desc: '砂漠の 夜に ゆらめく 小さな 火。' }),
  homura: SP({ no: 24, name: 'ホムラ', arch: 'sprite', col: ['#ff6a3a', '#c0341a', '#fff0a0'], feat: ['flame', 'horns'], size: 1.4, type: 'fire', base: [44, 24, 20, 10, 17], grow: [7, 3.4, 3.6, 1.8, 1.7], sk: [['hinoko', 1], ['honoo', 1]], desc: '燃えさかる たましい。仲間の ためなら どこまでも 熱くなる。' }),
  umiushu: SP({ no: 25, name: 'ウミウシュ', arch: 'blob', col: ['#c49aff', '#8f5fd6', '#ffd0f0'], feat: ['frills'], type: 'water', hab: { r: 1, b: ['shore'], t: 'any', w: 8 }, base: [34, 14, 11, 10, 8], grow: [7, 2.2, 2.2, 2.2, .9], sk: [['mizu', 1], ['nami', 14]], desc: '波うちぎわで ひらひら 踊る。' }),
  ishigaki: SP({ no: 26, name: 'イシガキ', arch: 'golem', col: ['#9a8f7a', '#6f6656', '#8fe0ff'], feat: ['core', 'moss'], type: 'earth', hab: { r: 1, b: ['ruins'], t: 'any', w: 10 }, base: [48, 8, 16, 18, 4], grow: [9, 1.2, 3, 3.4, .5], sk: [['iwa', 1], ['jishin', 12]], desc: '遺跡を 守る 石の 番人。千年 動かないことも ある。' }),
  nijikujira: SP({ no: 27, name: 'ニジクジラ', arch: 'fish', col: ['#8fd0ff', '#5f9fd6', '#ffffff'], feat: ['rainbow'], size: 1.3, type: 'water', hab: { r: 1, b: ['shore'], t: 'day', w: .7 }, rare: true, base: [60, 20, 15, 14, 9], grow: [10, 3, 2.8, 2.6, 1], sk: [['mizu', 1], ['nami', 1], ['iyashikaze', 1]], desc: '雨あがりに 浜へ あらわれる まぼろしの くじら。' }),
  hoshikujira: SP({ no: 28, name: 'ホシクジラ', arch: 'fish', col: ['#2a2f6a', '#1a1d44', '#ffe38a'], feat: ['stars', 'crown'], size: 1.6, type: 'light', legend: true, base: [80, 30, 22, 20, 14], grow: [11, 4, 4, 3.4, 1.5], sk: [['matataki', 1], ['ginga', 1], ['nami', 1]], desc: '星の 海を 泳ぐ 伝説の いきもの。星喰いが 消えた 夜にだけ、遺跡の 空に あらわれる。' }),
};
DATA.speciesOrder = Object.keys(DATA.species).sort((a, b) => DATA.species[a].no - DATA.species[b].no);
DATA.friendInfo = new Proxy({}, { get: (_, k) => DATA.species[k] ? { name: DATA.species[k].name, desc: DATA.species[k].desc } : undefined });

Object.assign(DATA.enemies, {
  ishigakiG: { name: 'イシガキの番人', spArt: 'ishigaki', type: 'earth', hp: 460, atk: 34, def: 26, spd: 6, exp: 420, gold: 300, boss: true, acts: [['atk', .6], ['jishin_e', .4]] },
  sanaShadow: { name: 'サナ', portrait: 'sana', type: 'light', hp: 520, atk: 31, def: 20, spd: 20, exp: 480, gold: 0, boss: true, acts: [['atk', .4], ['hoshi_e', .35], ['nageki', .25]] },
  hoshikui: { name: '星喰い', art: ['hoshikui', 1], type: 'dark', hp: 980, atk: 42, def: 26, spd: 18, exp: 1400, gold: 1000, boss: true, twice: true, acts: [['atk', .35], ['ryuusei', .35], ['tomoshikui', .15], ['nageki', .15]] },
});

Object.assign(DATA.items, {
  mi: { name: '木の実', heal: 25, price: 10, sell: 4, desc: 'HPを 25 かいふく' },
  pan: { name: '実のパン', heal: 80, price: 40, sell: 15, desc: 'HPを 80 かいふく' },
  shizuku: { name: '夜露のしずく', mp: 15, price: 60, sell: 20, desc: 'MPを 15 かいふく' },
  nakayoshi: { name: 'なかよしの実', battle: 'friend', price: 80, sell: 25, desc: 'せんとうで つかうと、いきものが なかまに なりやすくなる' },
  hane: { name: '帰りの羽', warp: true, price: 30, sell: 10, desc: 'いまいる 地方の 町へ 一瞬で もどる' },
  maki: { name: '薪', mat: true, sell: 3, desc: '木を 切ると 手に入る。クラフトの 材料' },
  ishi: { name: '石', mat: true, sell: 4, desc: '岩を 掘ると 手に入る。クラフトの 材料' },
  suna: { name: '砂', mat: true, sell: 3, desc: '砂地を 掘ると 手に入る。ガラスの 材料' },
  ha: { name: '葉っぱ', mat: true, sell: 2, desc: '木を 切ると ときどき 手に入る' },
  hoshikake: { name: '星のかけら', mat: true, sell: 120, desc: '遺跡で 見つかる きらめく かけら。高く 売れる' },
});

DATA.gear = {
  sora: [{ name: '灯の短剣', atk: 0 }, { name: '石の剣', atk: 7, cost: { ishi: 5, maki: 3 } }, { name: '灯の剣', atk: 16, cost: { ishi: 10, maki: 6, shizuku: 2 } }, { name: 'はがねの剣', atk: 24, price: 900 }, { name: '星鉄の剣', atk: 34, price: 2600 }],
  mio: [{ name: '木の竪琴', atk: 0 }, { name: '銀の竪琴', atk: 8, price: 420 }, { name: '星の竪琴', atk: 18, price: 1800 }],
  riku: [{ name: '古びた槍', atk: 0 }, { name: '鋼の槍', atk: 10, price: 700 }, { name: '嵐の槍', atk: 22, price: 2200 }],
  sana: [{ name: '星の杖', atk: 0 }, { name: '月の杖', atk: 12, price: 1500 }],
};
DATA.armor = [{ name: '旅の服', def: 0 }, { name: '木の胸当て', def: 4 }, { name: '石の よろい', def: 9 }, { name: '鎖かたびら', def: 14, price: 800 }, { name: '星織りの衣', def: 21, price: 2400 }];

DATA.blocks = ['板', '石', 'ランタン', '屋根', 'しっくい', '丸太', '石レンガ', 'ガラス', '葉っぱ', '砂', '虹'];
DATA.recipes = [
  { out: 0, n: 4, need: { maki: 2 } }, { out: 5, n: 1, need: { maki: 2 } }, { out: 1, n: 1, need: { ishi: 1 } }, { out: 6, n: 2, need: { ishi: 2 } },
  { out: 7, n: 1, need: { suna: 2 } }, { out: 2, n: 1, need: { maki: 1, ishi: 1 } }, { out: 3, n: 2, need: { ishi: 1, maki: 1 } }, { out: 4, n: 2, need: { suna: 1, ishi: 1 } },
  { out: 8, n: 2, need: { ha: 2 } }, { out: 9, n: 1, need: { suna: 1 } },
];
DATA.dexRewards = [
  { n: 5, text: 'なかよしの実 ×3', give: { nakayoshi: 3 } }, { n: 10, text: '500ゴールド', gold: 500 }, { n: 15, text: '星のかけら ×3', give: { hoshikake: 3 } },
  { n: 20, text: '2000ゴールド', gold: 2000 }, { n: 28, text: '虹ブロック ×20 と 称号「いきもの博士」', blocks: { 10: 20 }, title: 'いきもの博士' },
];
DATA.letters2 = [];

Object.assign(DATA.items, {
  kinoko: { name: 'キノコ', mat: true, sell: 3, desc: '森で とれる。料理の 材料' },
  yakimi: { name: '焼き木の実', heal: 60, price: 0, sell: 12, desc: 'HPを 60 かいふく（料理）' },
  kinojiru: { name: 'きのこ汁', heal: 130, sell: 25, desc: 'HPを 130 かいふく（料理）' },
  ganbari: { name: 'がんばり串', stam: true, sell: 20, desc: 'がんばりゲージを 全回復（料理）' },
  stew: { name: '星のシチュー', healAll: true, sell: 80, desc: 'みんなの HPと MPを 全回復（料理）' },
});
DATA.cook = [
  { out: 'yakimi', need: { mi: 2 } }, { out: 'kinojiru', need: { kinoko: 2, mi: 1 } },
  { out: 'ganbari', need: { kinoko: 1, mi: 1, ha: 1 } }, { out: 'stew', need: { hoshikake: 1, kinoko: 2, mi: 2 } },
];

// ======================= v4: 成長・目標・素材の説明 =======================
// 人間キャラの技は「スキルボード」で覚える（初期技のみ Lv1）
DATA.party.sora.skills = [['tomoshi', 1]];
DATA.party.mio.skills = [['iyashi', 1]];
DATA.party.riku.skills = [['tsuranuki', 1]];
DATA.party.sana.skills = [['hoshiyomi', 1], ['inori', 1]];
Object.assign(DATA.skills, {
  kenbu: { type: 'fire', name: 'ともしびの剣舞', mp: 10, tg: 'enemies', power: 1.55, verb: 'はなった', fx: 'fire' },
  hagemashi: { name: 'はげましの歌', mp: 6, tg: 'party', buff: 'atk', verb: 'うたった', fx: 'song' },
  hoshiuta: { type: 'light', name: '星の歌', mp: 9, tg: 'enemies', power: 1.35, magic: true, verb: 'うたった', fx: 'light' },
  ranbu: { type: 'wind', name: '嵐の槍', mp: 9, tg: 'enemy', power: 2.9, verb: 'はなった', fx: 'slash' },
  seiun: { type: 'light', name: '星雲のいのり', mp: 12, tg: 'party', heal: 45, healPct: .3, verb: 'ささげた', fx: 'heal' },
});
const desc = (s) => s; // readability helper
Object.assign(DATA.skills.tomoshi, { desc: '敵1体に ほのおの 斬撃（草に つよい）' });
Object.assign(DATA.skills.mamori, { desc: '3ターン 味方全員の ぼうぎょ ×1.5' });
Object.assign(DATA.skills.issen, { desc: '敵全体に ひかりの 斬撃（闇に つよい）' });
Object.assign(DATA.skills.kenbu, { desc: '敵全体に 強力な ほのおの 斬撃' });
Object.assign(DATA.skills.iyashi, { desc: '味方全員の HPを かいふく' });
Object.assign(DATA.skills.nemuri, { desc: '敵1体を 2〜3ターン ねむらせる（ボスには きかない）' });
Object.assign(DATA.skills.kiyome, { desc: '敵1体に ひかりの 魔法（かげものに 大ダメージ）' });
Object.assign(DATA.skills.hagemashi, { desc: '3ターン 味方全員の こうげき ×1.4' });
Object.assign(DATA.skills.hoshiuta, { desc: '敵全体に ひかりの 魔法' });
Object.assign(DATA.skills.tsuranuki, { desc: '敵1体に 強烈な 一突き' });
Object.assign(DATA.skills.kazaguruma, { desc: '敵全体を かぜの 槍で なぎはらう' });
Object.assign(DATA.skills.ranbu, { desc: '敵1体に かぜの 大技（大ダメージ）' });
Object.assign(DATA.skills.hoshiyomi, { desc: '敵1体に ひかりの 魔法' });
Object.assign(DATA.skills.inori, { desc: '味方全員の HPを かいふく' });
Object.assign(DATA.skills.hoshifuri, { desc: '敵全体に ひかりの 魔法' });
Object.assign(DATA.skills.seiun, { desc: '味方全員の HPを 大きく かいふく' });
for (const [k, s] of Object.entries(DATA.skills)) if (!s.desc) {
  s.desc = s.heal ? (s.tg === 'party' ? '味方全員を かいふく' : '味方1体を かいふく') : s.power ? `${s.tg === 'enemies' ? '敵全体' : '敵1体'}に ${s.type && s.type !== 'normal' ? DATA.types[s.type] + 'の ' : ''}${s.magic ? '魔法' : 'こうげき'}` : s.sleep ? '敵を ねむらせる' : '';
}

// スキルボード（レベルアップで SP を得て 解放する）
DATA.boards = {
  sora: [
    { id: 'a1', name: '剣の心得', desc: 'こうげき +10%', cost: 1, eff: { atk: .1 } },
    { id: 'a2', name: '旅人の体', desc: '最大HP +12%', cost: 1, eff: { hp: .12 } },
    { id: 'a3', name: 'まもりの灯', desc: '技：3ターン 味方の ぼうぎょ ×1.5', cost: 2, skill: 'mamori', req: 'a2' },
    { id: 'a4', name: '見切り', desc: '会心の 確率 アップ', cost: 2, eff: { crit: .06 }, req: 'a1' },
    { id: 'a5', name: 'ひかりの一閃', desc: '技：敵全体に ひかりの 斬撃', cost: 3, skill: 'issen', req: 'a4' },
    { id: 'a6', name: '灯の守り手', desc: 'ぼうぎょ +15%', cost: 2, eff: { def: .15 }, req: 'a3' },
    { id: 'a7', name: '不屈', desc: '毎ターン HP 4% 回復', cost: 3, eff: { regen: .04 }, req: 'a6' },
    { id: 'a8', name: 'ともしびの剣舞', desc: '技：敵全体に 強力な ほのお', cost: 4, skill: 'kenbu', req: 'a5' } ],
  mio: [
    { id: 'b1', name: '歌声', desc: '最大MP +15%', cost: 1, eff: { mp: .15 } },
    { id: 'b2', name: 'ねむりの歌', desc: '技：敵1体を ねむらせる', cost: 1, skill: 'nemuri' },
    { id: 'b3', name: '癒し手', desc: '回復量 +25%', cost: 2, eff: { healUp: .25 }, req: 'b1' },
    { id: 'b4', name: 'きよめの歌', desc: '技：ひかりの 魔法（かげものに 大ダメージ）', cost: 2, skill: 'kiyome', req: 'b2' },
    { id: 'b5', name: 'はげましの歌', desc: '技：3ターン 味方の こうげき ×1.4', cost: 3, skill: 'hagemashi', req: 'b3' },
    { id: 'b6', name: '息つぎ上手', desc: '消費MP −25%', cost: 2, eff: { mpSave: .25 }, req: 'b3' },
    { id: 'b7', name: '星の歌', desc: '技：敵全体に ひかりの 魔法', cost: 3, skill: 'hoshiuta', req: 'b4' },
    { id: 'b8', name: '慈愛', desc: '毎ターン 味方全員の HP 3% 回復', cost: 4, eff: { aura: .03 }, req: 'b5' } ],
  riku: [
    { id: 'c1', name: '槍術', desc: 'こうげき +12%', cost: 1, eff: { atk: .12 } },
    { id: 'c2', name: '身軽', desc: 'すばやさ +15%', cost: 1, eff: { spd: .15 } },
    { id: 'c3', name: 'かざぐるま', desc: '技：敵全体を なぎはらう', cost: 2, skill: 'kazaguruma', req: 'c1' },
    { id: 'c4', name: '鋭い目', desc: '会心の 確率 大アップ', cost: 2, eff: { crit: .08 }, req: 'c2' },
    { id: 'c5', name: '鉄壁', desc: 'ぼうぎょ +15%', cost: 2, eff: { def: .15 }, req: 'c1' },
    { id: 'c6', name: '先陣', desc: 'かならず 先に 行動する', cost: 3, eff: { first: 1 }, req: 'c4' },
    { id: 'c7', name: '嵐の槍', desc: '技：敵1体に 大ダメージ', cost: 3, skill: 'ranbu', req: 'c3' },
    { id: 'c8', name: '歴戦', desc: 'こうげき +15% / HP +10%', cost: 4, eff: { atk: .15, hp: .1 }, req: 'c7' } ],
  sana: [
    { id: 'd1', name: '星読み', desc: '最大MP +15%', cost: 1, eff: { mp: .15 } },
    { id: 'd2', name: '星の加護', desc: 'ぼうぎょ +12%', cost: 1, eff: { def: .12 } },
    { id: 'd3', name: 'ほしふり', desc: '技：敵全体に ひかりの 魔法', cost: 2, skill: 'hoshifuri', req: 'd1' },
    { id: 'd4', name: '祈りの力', desc: '回復量 +25%', cost: 2, eff: { healUp: .25 }, req: 'd2' },
    { id: 'd5', name: '月光', desc: '毎ターン HP 4% 回復', cost: 2, eff: { regen: .04 }, req: 'd4' },
    { id: 'd6', name: '集中', desc: '会心の 確率 アップ', cost: 2, eff: { crit: .06 }, req: 'd3' },
    { id: 'd7', name: '星雲のいのり', desc: '技：味方全員を 大きく かいふく', cost: 3, skill: 'seiun', req: 'd4' },
    { id: 'd8', name: '星の巫女', desc: 'こうげき・ぼうぎょ +12%', cost: 4, eff: { atk: .12, def: .12 }, req: 'd6' } ],
};

// アイテムの 入手先と 使いみち
const IM = (k, o) => Object.assign(DATA.items[k], o);
IM('mi', { cat: 'heal', src: '草むらの しげみ（Eで つむ）・道具屋', use: 'HP回復／料理／ナギの パン' });
IM('pan', { cat: 'heal', src: 'ナギの かざみ亭（木の実3）・道具屋', use: 'HP回復' });
IM('shizuku', { cat: 'heal', src: '夜の いきもの・道具屋', use: 'MP回復／灯の剣の 材料' });
IM('nakayoshi', { cat: 'heal', src: '道具屋・依頼の ごほうび', use: 'せんとう中に つかうと いきものが なかまに なりやすい' });
IM('hane', { cat: 'heal', src: '道具屋', use: 'いまの 地方の 町へ ワープ' });
IM('maki', { cat: 'mat', src: '木を 切る（Eを 3回）', use: '灯台の 燃料／クラフト（板・丸太）／ゲンの 武具' });
IM('ishi', { cat: 'mat', src: '岩を 掘る（Eを 3回）', use: 'クラフト（石・石レンガ）／ゲンの 武具' });
IM('suna', { cat: 'mat', src: '砂浜や 砂漠で Eを 押す', use: 'クラフト（ガラス・しっくい・砂）' });
IM('ha', { cat: 'mat', src: '木を 切ると ときどき', use: '灯台の 燃料／クラフト（葉っぱ）／がんばり串' });
IM('kinoko', { cat: 'mat', src: '森の 木の根もと', use: '料理（きのこ汁・がんばり串・シチュー）' });
IM('hoshikake', { cat: 'mat', src: '大陸の 岩・遺跡・光の いきもの', use: '高く 売れる／星のシチュー' });
IM('yakimi', { cat: 'food', src: 'たき火で 料理', use: 'HP 60 回復' });
IM('kinojiru', { cat: 'food', src: 'たき火で 料理', use: 'HP 130 回復' });
IM('ganbari', { cat: 'food', src: 'たき火で 料理', use: 'がんばりゲージ 全回復（登る前に）' });
IM('stew', { cat: 'food', src: 'たき火で 料理', use: '全員 HP・MP 全回復' });
DATA.itemCats = { heal: 'かいふく・べんり', food: '料理', mat: '素材' };

// 灯台の試練（場所ごとに ちがう）と 燃料
DATA.trials = [
  { name: '灯の欠片', text: '灯台の まわりに 散らばった「灯の欠片」を 3つ 集める', fuel: { maki: 3 } },
  { name: '天をつく塔', text: '灯台の 横の 塔の てっぺんへ 登る（がんばり・ブロックで 足場）', fuel: { maki: 3, ishi: 2 } },
  { name: '三連戦', text: 'おしよせる かげものを 3回 しずめる', fuel: { maki: 4 } },
  { name: '夜の灯', text: '夜にだけ 火皿が ひらく（「夜まで 待つ」も できる）', fuel: { maki: 2, shizuku: 1 } },
  { name: '風の足場', text: '崖の 先の 浮き足場へ わたる（滑空・ブロックで 橋）', fuel: { maki: 3, ha: 2 } },
];
DATA.beaconRewards = [
  { text: '灯台と 村の あいだを ワープ できるように なった！（地図から）／がんばりの 上限 +20', kind: 'warp' },
  { text: 'スキルポイント +2', kind: 'sp' },
  { text: '父の「風布」を 手に入れた！（空中で もう一度 ジャンプで 滑空）', kind: 'glider' },
  { text: '灯の加護：みんなの 最大HP +10%', kind: 'hp' },
  { text: '島じゅうの 灯が つながった……', kind: 'none' },
];
DATA.guardLv = [4, 7, 10, 13, 16];
DATA.bossLv = { yomikage: 18, yoiyami: 19, ishigakiG: 24, sanaShadow: 27, hoshikui: 28 };
DATA.ranks = [
  { r: 'E', pts: 0 }, { r: 'D', pts: 30, reward: { gold: 150 } }, { r: 'C', pts: 80, reward: { gold: 400, give: { nakayoshi: 2 } } },
  { r: 'B', pts: 160, reward: { gold: 900, give: { ganbari: 3 } } }, { r: 'A', pts: 280, reward: { gold: 2000, give: { stew: 2 } } }, { r: 'S', pts: 450, reward: { gold: 5000, blocks: { 10: 30 } } },
];
// ボスの 強さは 推奨レベルから 計算（戦闘シミュレーションで 調整ずみ：推奨Lvで 5〜8ターン・勝率80〜98%）
DATA.bossCfg = { tsutakage: [4, 3.4, 1.1, 1], rikuDuel: [7, 3.6, 1.12, 1], iwaoni: [10, 9, 1.4, 1.2], umikage: [13, 9, 1.28, 1], tobaridori: [16, 10, 1.5, 1],
  yomikage: [18, 10, 1.45, 1], yoiyami: [19, 7, .98, 1], ishigakiG: [24, 9.5, 1.45, 1.3], sanaShadow: [27, 9, 1.45, 1], hoshikui: [28, 7.5, .98, 1] };
for (const [id, [L, H, A, D]] of Object.entries(DATA.bossCfg)) { const d = DATA.enemies[id]; d.lv = L; d.hp = Math.round(H * (30 + 14 * L)); d.atk = Math.round(A * (8 + 3.2 * L)); d.def = Math.round(D * (6 + 2.4 * L)); d.spd = Math.round(6 + 1.1 * L); d.exp = Math.round((30 + L * 12) * (d.twice ? 2 : 1.3)); d.gold = Math.round(20 + L * 12); }
DATA.guardLv = [4, 7, 10, 13, 16];

// ======================= 第3章　天空の星巣 =======================
Object.assign(DATA.cast, {
  haru: { name: 'ハル', role: '仲間', age: '16？', title: '雲の里の風読み',
    look: '空色の 短い髪に 白い 羽飾り。風を はらむ 水色の 外套と、古い 竹の 扇。',
    body: '物静かで 観察ずき。風の 道が 目に 見える。人に 頼るのが へたで、なんでも ひとりで 抱えこむ。',
    past: '四十年前の 嵐の 夜、海に 落ちた ところを 星の 光に すくわれ、空の 里で 目を さました。それより 前の 記憶は ない。空では 時が ゆっくり ながれるため、いまも 少女の すがたの まま。',
    like: '風の 音／雲の 上の 夕焼け／なぜか 知っている 子守歌', line: '「風が 言ってる。……あなたたちは、帰る 場所を 持ってるんだね」' },
  soyogi: { name: 'ソヨギ', role: '長老', age: 88, title: '雲の里ククルの長老',
    look: '雲のような 白い 髪を 高く 結い、鳥の 羽の 首飾り。',
    body: 'のんびりした 口調だが、空の 歴史を だれより よく 知る。ハルの 育ての 親。',
    past: '若いころ、星守に 仕えた 最後の 巫女。星守が 変わってしまった 夜を、その目で 見ている。',
    like: 'ひなたぼっこ／ハルの いれる 雲茶', line: '「風は 見えずとも、たしかに 吹いておる。 灯も また 同じじゃ」' },
  hoshimori: { name: '星守', role: 'ラスボス', age: '？', title: '天喰み（あまはみ）',
    look: '星空を 閉じこめた、巨大な 翼の 影。',
    body: '空の 星を 守ってきた 番人。燃えつきて 消える 星を 見送りつづけ、心が 凍りついた。',
    past: '「消えるくらいなら、喰らって わが身に しまおう」——守りたい 気持ちが ゆがみ、天喰みと なった。地上に 落ちた その かけらが、星喰い。',
    like: '——', line: '「消えるものを、なぜ 追う。 しまっておけば、二度と 失わない」' },
});
DATA.party.haru = { base: { hp: 34, mp: 22, atk: 13, def: 8, spd: 17 }, grow: { hp: 6.2, mp: 3.6, atk: 2.7, def: 1.7, spd: 1.6 }, skills: [['kazeyomi', 1], ['oikaze', 1]] };
Object.assign(DATA.skills, {
  kazeyomi: { type: 'wind', name: 'かぜよみ', mp: 5, tg: 'enemy', power: 1.8, magic: true, verb: 'はなった', fx: 'slash', desc: '敵1体に かぜの 魔法（草に つよい）' },
  oikaze: { name: 'おいかぜ', mp: 6, tg: 'party', buff: 'spd', verb: 'ふかせた', fx: 'heal', desc: '3ターン 味方全員の すばやさ ×1.5' },
  tatsumaki: { type: 'wind', name: 'たつまき', mp: 9, tg: 'enemies', power: 1.4, magic: true, verb: 'よびおこした', fx: 'slash', desc: '敵全体に かぜの 魔法' },
  soyokaze: { name: 'そよかぜの舞', mp: 7, tg: 'party', heal: 24, healPct: .16, verb: 'まった', fx: 'heal', desc: '味方全員の HPを かいふく' },
  amatsukaze: { type: 'wind', name: 'あまつかぜ', mp: 14, tg: 'enemies', power: 1.75, magic: true, verb: 'よびおこした', fx: 'slash', desc: '敵全体に 天の 風（大ダメージ）' },
  inazuma: { type: 'wind', name: 'いなずま', mp: 8, tg: 'enemies', power: 1.35, magic: true, verb: 'おとした', fx: 'light', desc: '敵全体に かみなり' },
  // enemy
  arashi_e: { type: 'wind', name: 'あらしの つばさ', tg: 'all', power: 1.0 },
  shibire: { type: 'water', name: 'しびれ しょくしゅ', tg: 'one', power: 1.45, slow: true },
  nemurigumo: { name: 'ねむりの 雲', tg: 'all', sleep: .3 },
  yami_e: { type: 'dark', name: 'やみの はばたき', tg: 'all', power: .95 },
  tenkui: { type: 'dark', name: '天喰らい', tg: 'all', power: 1.1, drain: 10 },
});
DATA.boards.haru = [
  { id: 'e1', name: '風の目', desc: '会心の 確率 アップ', cost: 1, eff: { crit: .06 } },
  { id: 'e2', name: '身のこなし', desc: 'すばやさ +15%', cost: 1, eff: { spd: .15 } },
  { id: 'e3', name: 'たつまき', desc: '技：敵全体に かぜの 魔法', cost: 2, skill: 'tatsumaki', req: 'e1' },
  { id: 'e4', name: 'そよかぜの舞', desc: '技：味方全員の HPを かいふく', cost: 2, skill: 'soyokaze', req: 'e2' },
  { id: 'e5', name: '疾風', desc: 'かならず 先に 行動する', cost: 3, eff: { first: 1 }, req: 'e4' },
  { id: 'e6', name: '風切り', desc: 'こうげき +12%', cost: 2, eff: { atk: .12 }, req: 'e3' },
  { id: 'e7', name: 'あまつかぜ', desc: '技：敵全体に 天の 風（大ダメージ）', cost: 4, skill: 'amatsukaze', req: 'e6' },
  { id: 'e8', name: '天翔', desc: 'こうげき・HP +12%', cost: 4, eff: { atk: .12, hp: .12 }, req: 'e5' } ];

// ---- 空の いきもの（No.29〜38） ----
Object.assign(DATA.species, {
  kumomo: SP({ no: 29, name: 'クモモ', arch: 'fluff', col: ['#f6f8ff', '#cdd6f0', '#9fc8ff'], feat: ['halo'], type: 'wind', hab: { r: 2, b: ['grass', 'forest'], t: 'any', w: 10 }, base: [42, 16, 13, 12, 13], grow: [7, 2.5, 2.6, 2.3, 1.5], sk: [['kaze', 1], ['iyashikaze', 1], ['arashi', 32]], evo: { to: 'raikumo', lv: 34 }, desc: '空の 草原を ただよう ちぎれ雲。なでると しっとり つめたい。' }),
  raikumo: SP({ no: 30, name: 'ライクモ', arch: 'fluff', col: ['#77809a', '#4a5068', '#ffe36a'], feat: ['horns', 'bolt'], size: 1.4, type: 'wind', base: [58, 24, 20, 16, 15], grow: [9, 3, 3.6, 2.8, 1.6], sk: [['kaze', 1], ['inazuma', 1], ['arashi', 1]], desc: 'おこると ゴロゴロ 鳴る 雷雲。でも 雨を ふらせて 草原を 育てる。' }),
  soramedaka: SP({ no: 31, name: 'ソラメダカ', arch: 'fish', col: ['#c8ecff', '#7fb8e0', '#fff6c8'], feat: ['fins'], type: 'wind', hab: { r: 2, b: ['grass', 'forest'], t: 'day', w: 8 }, base: [40, 16, 15, 11, 17], grow: [7, 2.4, 2.9, 2, 1.8], sk: [['kaze', 1], ['mizu', 1], ['nami', 32]], evo: { to: 'soramanta', lv: 35 }, desc: '風の 流れを 泳ぐ 小さな さかな。群れで 虹を つくる。' }),
  soramanta: SP({ no: 32, name: 'ソラマンタ', arch: 'fish', col: ['#5a7fc8', '#2f4f8f', '#e8f4ff'], feat: ['fins', 'crown'], size: 1.5, type: 'wind', base: [60, 24, 22, 16, 19], grow: [9.5, 3, 3.8, 2.8, 1.9], sk: [['kaze', 1], ['arashi', 1], ['nami', 1]], desc: '雲海の 上を ゆうゆうと すべる 空の 主。背中で ひるねが できる。' }),
  fuurin: SP({ no: 33, name: 'フウリン', arch: 'sprite', col: ['#eafcff', '#9fe0e8', '#ff8fb0'], feat: ['halo', 'ears'], type: 'wind', hab: { r: 2, b: ['forest'], t: 'day', w: 6 }, base: [38, 24, 14, 10, 18], grow: [6, 3.6, 2.8, 1.8, 1.8], sk: [['kaze', 1], ['iyashikaze', 1], ['arashi', 34]], desc: '風が ふくと ちりん と 鳴る。その 音を 聴くと 眠くなる。' }),
  hoshikakera: SP({ no: 34, name: 'ホシカケラ', arch: 'golem', col: ['#bab2ea', '#7a70c0', '#fff0a0'], feat: ['core'], type: 'light', hab: { r: 2, b: ['crystal'], t: 'any', w: 10 }, base: [52, 12, 17, 20, 6], grow: [9, 1.6, 3.2, 3.6, .7], sk: [['iwa', 1], ['matataki', 1], ['jishin', 32]], evo: { to: 'seishou', lv: 36 }, desc: '空から 落ちた 星の かけらに 心が やどった。夜は ほんのり 光る。' }),
  seishou: SP({ no: 35, name: 'セイショウ', arch: 'golem', col: ['#dcd4ff', '#8f80e0', '#ffffff'], feat: ['core', 'crown', 'halo'], size: 1.4, type: 'light', base: [72, 18, 23, 26, 7], grow: [11, 2, 4, 4.2, .7], sk: [['iwa', 1], ['ginga', 1], ['jishin', 1]], desc: '星晶の 巨人。星巣の 塔を 千年 守りつづけてきた。' }),
  tsukimiusa: SP({ no: 36, name: 'ツキミウサ', arch: 'quad', col: ['#fff8e8', '#e8d8b8', '#ffe38a'], feat: ['longears', 'halo'], type: 'light', hab: { r: 2, b: ['grass', 'rock'], t: 'night', w: 6 }, base: [40, 22, 15, 11, 18], grow: [7, 3.4, 2.8, 2, 1.8], sk: [['matataki', 1], ['iyashikaze', 1], ['ginga', 34]], desc: '月の 夜にだけ 雲の 上で 跳ねる。耳の 先に 月の 光を ためている。' }),
  amatsubame: SP({ no: 37, name: 'アマツバメ', arch: 'bird', col: ['#3f5a9a', '#22305a', '#ffffff'], feat: ['crest'], type: 'wind', hab: { r: 2, b: ['rock', 'grass'], t: 'day', w: 8 }, base: [38, 14, 17, 9, 21], grow: [6.5, 2.2, 3.2, 1.7, 2.1], sk: [['kaze', 1], ['taiatari', 1], ['arashi', 32]], desc: '一生の ほとんどを 空で すごす。地面に おりるのは 恋を するときだけ。' }),
  hoshimori: SP({ no: 38, name: 'ホシモリ', arch: 'bird', col: ['#f4f0ff', '#b8a8f0', '#ffe38a'], feat: ['crest', 'halo', 'crown'], size: 1.7, type: 'light', legend: true, base: [90, 34, 26, 22, 18], grow: [12, 4.4, 4.4, 3.6, 1.8], sk: [['ginga', 1], ['arashi', 1], ['iyashikaze', 1]], desc: '星を 守る 空の 番人。心を 取りもどしてからは、夜ごと 塔の 上で 星を 数えている。' }),
});
DATA.speciesOrder = Object.keys(DATA.species).sort((a, b) => DATA.species[a].no - DATA.species[b].no);

Object.assign(DATA.enemies, {
  tsumujikaze: { name: 'ツムジカゼ', art: ['tsumuji', 1], type: 'wind', boss: true, acts: [['atk', .55], ['arashi_e', .45]] },
  kumokurage: { name: 'クモクラゲ', art: ['kumokurage', 1], type: 'water', boss: true, acts: [['atk', .5], ['shibire', .3], ['nemurigumo', .2]] },
  hoshigarasu: { name: 'ホシガラス', art: ['hoshigarasu', 1], type: 'dark', boss: true, acts: [['atk', .45], ['yami_e', .35], ['yaminohonoo', .2]] },
  seishouG: { name: '星晶の番人', spArt: 'seishou', type: 'light', boss: true, acts: [['atk', .6], ['hoshi_e', .4]] },
  amahami: { name: '天喰み', art: ['amahami', 1], type: 'dark', boss: true, acts: [['atk', .35], ['tenkui', .35], ['ryuusei', .3]] },
  hoshimoriB: { name: '星守（まよい星）', art: ['hoshimoriB', 1], type: 'light', boss: true, twice: true, acts: [['atk', .35], ['ryuusei', .3], ['arashi_e', .2], ['nageki', .15]] },
});
Object.assign(DATA.bossCfg, { tsumujikaze: [30, 9.5, 1.45, 1], kumokurage: [32, 10.5, 1.5, 1], hoshigarasu: [34, 10, 1.5, 1], seishouG: [36, 9.5, 1.45, 1.3], amahami: [38, 8.8, 1.4, 1], hoshimoriB: [39, 6.6, .98, 1] });
for (const id of ['tsumujikaze', 'kumokurage', 'hoshigarasu', 'seishouG', 'amahami', 'hoshimoriB']) { const [L, H, A, D] = DATA.bossCfg[id]; const d = DATA.enemies[id]; d.lv = L; d.hp = Math.round(H * (30 + 14 * L)); d.atk = Math.round(A * (8 + 3.2 * L)); d.def = Math.round(D * (6 + 2.4 * L)); d.spd = Math.round(6 + 1.1 * L); d.exp = Math.round((30 + L * 12) * (d.twice ? 2 : 1.3) * 3); d.gold = Math.round(20 + L * 16); }

// 空の 素材・装備
Object.assign(DATA.items, {
  kumowata: { name: '雲わた', mat: true, sell: 6, cat: 'mat', desc: '空の いきものが 落とす ふわふわの わた', src: '空の いきもの（かぜタイプ）・空の宝箱', use: 'クラフト（雲ブロック）' },
});
DATA.items.ganbari.price = 90;
DATA.blocks.push('雲');
DATA.blocks[12] = 'おもし'; DATA.blocks[13] = 'スイッチ'; DATA.blocks[14] = 'スイッチ'; DATA.blocks[15] = 'ベッド'; DATA.blocks[16] = '作業台'; DATA.blocks[17] = 'かまど'; DATA.blocks[18] = '花だん';
DATA.recipes.push({ out: 11, n: 4, need: { kumowata: 2 } });
DATA.gear.sora.push({ name: '天空の剣', atk: 46, price: 5200, sky: true });
DATA.gear.mio.push({ name: '天の竪琴', atk: 28, price: 4400, sky: true });
DATA.gear.riku.push({ name: '天槍ソラガケ', atk: 34, price: 4800, sky: true });
DATA.gear.sana.push({ name: '星守の杖', atk: 24, price: 4200, sky: true });
DATA.gear.haru = [{ name: '風読みの扇', atk: 0 }, { name: '空色の扇', atk: 16, price: 2600, sky: true }, { name: '天風の扇', atk: 28, price: 4800, sky: true }];
DATA.armor.push({ name: '天の羽衣', def: 28, price: 4200, sky: true });

// 風の祠の 試練
DATA.windTrials = [
  { name: 'ツムジの祠', where: '東の 島', text: '祠は 天を つく 岩山の 頂。 光る 風の 柱「上昇気流」に 乗って、空へ 舞いあがろう（ジャンプ→滑空）' },
  { name: 'ミズカガミの祠', where: '南西の 島', text: '島の まわりの 空に 浮かぶ「風の羽」を 3つ 集める（上昇気流で 高さを かせいで 滑空）' },
  { name: 'ホシミの祠', where: '西の 島', text: '夜にだけ 祠が ひらく。 おそいくる「星の嵐」を 3回 しのぎきれ' },
];
DATA.windRewards = [
  { text: '「風布・改」を 手に入れた！ 滑空が 速くなり、がんばりの 消費が 半分に', kind: 'glider2' },
  { text: 'がんばりの 上限 +30 ／ スキルポイント +2（全員）', kind: 'stam' },
  { text: 'スキルポイント +3（全員）', kind: 'sp' },
];
DATA.haruMem = [
  ['……ちいさな 灯台の 下。 だれかが、わたしに 歌を 教えてくれた。', '大きな 手。 煙草と、潮の におい……。'],
  ['嵐の 夜。 灯台の 灯が、消えていた。', '冷たい 海の 中で、大きな 星の 光が わたしを すくいあげた……。'],
  ['「ハル」って 呼ぶ こえ。 何度も、何度も。', '……おとう、さん……？'],
];
DATA.dexRewards.push({ n: 33, text: '雲わた ×10 と 星のシチュー ×2', give: { kumowata: 10, stew: 2 } }, { n: 38, text: '8000ゴールド と 称号「空の博士」', gold: 8000, title: '空の博士' });
DATA.ranks.push({ r: 'SS', pts: 720, reward: { gold: 10000, blocks: { 10: 60, 11: 60 } } });

// ======================= v6: バトルの 深み =======================
// 状態異常（どく・やけど・まひ）
DATA.ailName = { poison: 'どく', burn: 'やけど', para: 'まひ' };
DATA.ailIcon = { poison: '☠', burn: '🔥', para: '⚡' };
const AIL = (k, ail) => { if (DATA.skills[k]) DATA.skills[k].ail = ail; };
AIL('hinoko', ['burn', .25]); AIL('honoo', ['burn', .15]); AIL('tomoshi', ['burn', .15]); AIL('kenbu', ['burn', .2]); AIL('inazuma', ['para', .25]);
AIL('yaminohonoo', ['burn', .35]); AIL('shibire', ['para', .5]); AIL('karami', ['para', .2]); AIL('tsuta', ['para', .25]);
Object.assign(DATA.skills, {
  dokugiri: { type: 'dark', name: 'どくぎり', tg: 'all', power: .6, ail: ['poison', .45] },
  dokubari: { type: 'grass', name: 'どくばり', mp: 4, tg: 'enemy', power: 1.2, ail: ['poison', .6], verb: 'はなった', fx: 'leaf', desc: '敵1体に くさの こうげき（どくに することが ある）' },
  raijin: { type: 'wind', name: 'らいじん', tg: 'all', power: .9, ail: ['para', .25] },
  // ため攻撃（予告のあと 全体に 大ダメージ）
  daijishin: { type: 'earth', name: 'だいじしん', tg: 'all', power: 1.9 },
  eiennoyoru: { type: 'dark', name: 'えいえんの よる', tg: 'all', power: 1.8 },
  hoshinotaki: { type: 'light', name: 'ほしの たき', tg: 'all', power: 1.8 },
  daitatsumaki: { type: 'wind', name: 'だいたつまき', tg: 'all', power: 1.75, ail: ['para', .2] },
  tenkuiX: { type: 'dark', name: '天喰らい・深淵', tg: 'all', power: 1.9, drain: 15 },
  seikou: { type: 'light', name: '星の 咆哮', tg: 'all', power: 1.75 },
  oonami: { type: 'water', name: 'おおつなみ', tg: 'all', power: 1.8 },
});
for (const k of ['inori', 'seiun', 'soyokaze', 'iyashikaze']) if (DATA.skills[k]) DATA.skills[k].cure = true;

DATA.species.sabotenbo.sk.push(['dokubari', 8]); DATA.species.hanapokke.sk.push(['dokubari', 10]); DATA.species.tsuchimogu.sk.push(['dokubari', 12]);
Object.assign(DATA.items, {
  dokukeshi: { name: 'どくけし草', cure: true, battle: 'cure', price: 20, sell: 6, cat: 'heal', desc: '状態異常（どく・やけど・まひ・ねむり）を なおす', src: '道具屋・しげみ', use: 'バトル中・フィールドで つかう' },
});
// ボスの ため攻撃
const CHG = (id, sk) => { const d = DATA.enemies[id]; if (!d) return; d.charge = sk; const a = d.acts.find(x => x[0] === 'atk'); if (a) a[1] = Math.max(.1, a[1] - .15); d.acts.push(['charge', .15]); };
CHG('iwaoni', 'daijishin'); CHG('yoiyami', 'eiennoyoru'); CHG('ishigakiG', 'daijishin'); CHG('hoshikui', 'hoshinotaki'); CHG('tsumujikaze', 'daitatsumaki');
CHG('hoshigarasu', 'eiennoyoru'); CHG('amahami', 'tenkuiX'); CHG('hoshimoriB', 'seikou');
DATA.enemies.kumokurage.acts.push(['dokugiri', .15]);
// 連携技（ふたりの 行動を つかう）
DATA.combos = [
  { id: 'cb_tomoshiuta', a: 'sora', b: 'mio', name: 'ともしびの歌', mp: 8, tg: 'enemies', power: 2.3, type: 'fire', magic: true, fx: 'fire', desc: 'ソラ＋ミオ：敵全体に ほのおと 歌の 大技' },
  { id: 'cb_juji', a: 'sora', b: 'riku', name: '十字斬り', mp: 8, tg: 'enemy', power: 4.6, type: 'normal', fx: 'slash', desc: 'ソラ＋リク：敵1体に 強烈な 二連撃' },
  { id: 'cb_seisou', a: 'riku', b: 'sana', name: '星槍', mp: 9, tg: 'enemy', power: 4.2, type: 'light', fx: 'light', desc: 'リク＋サナ：星を まとった 一突き（闇に つよい）' },
  { id: 'cb_inori', a: 'mio', b: 'sana', name: '星と灯のいのり', mp: 10, tg: 'party', heal: 60, healPct: .45, cure: true, buff: 'def', fx: 'heal', desc: 'ミオ＋サナ：全員を 大回復＋状態異常を なおし まもりを あげる' },
  { id: 'cb_fuutou', a: 'haru', b: 'sora', name: '風灯', mp: 9, tg: 'enemies', power: 2.1, type: 'wind', magic: true, buff: 'spd', fx: 'wind', desc: 'ハル＋ソラ：敵全体に 風と 灯＋すばやさ アップ' },
  { id: 'cb_soyouta', a: 'haru', b: 'mio', name: 'そよ風の歌', mp: 8, tg: 'party', heal: 40, healPct: .35, cure: true, buff: 'atk', fx: 'song', desc: 'ハル＋ミオ：全員を 回復・状態異常を なおし こうげき アップ' },
];
for (const c of DATA.combos) DATA.skills[c.id] = { ...c, mp: 0, verb: 'くりだした' };

// ================= 第4章：海の底 =================
Object.assign(DATA.items, {
  shinju: { name: 'しんじゅ', mat: true, sell: 120, desc: '海の底で とれる 光る 玉。 高く うれる' },
  awanosuzu: { name: 'あわの鈴', key: true, desc: '鳴らすと 泡の 道が ひらき、海の底へ もぐれる' },
});
Object.assign(DATA.skills, {
  // カイト（灯台守）
  toudai: { type: 'light', name: '灯台の光', mp: 5, tg: 'enemy', power: 1.8, magic: true, verb: 'てらした', fx: 'light', desc: '敵1体に ひかりの 魔法' },
  ikari: { type: 'water', name: 'いかり投げ', mp: 4, tg: 'enemy', power: 1.9, verb: 'なげた', fx: 'water', desc: '敵1体に みずの 大ダメージ' },
  shiosai: { name: 'しおさいの守り', mp: 6, tg: 'party', buff: 'def', verb: 'となえた', fx: 'heal', desc: '3ターン 味方全員の ぼうぎょ ×1.5' },
  oonamigiri: { type: 'water', name: '大波斬り', mp: 10, tg: 'enemies', power: 1.55, verb: 'はなった', fx: 'water', desc: '敵全体に みずの 大ダメージ' },
  tomoshibi: { type: 'light', name: '導きの灯', mp: 14, tg: 'enemies', power: 1.8, magic: true, verb: 'ともした', fx: 'light', desc: '敵全体に ひかりの 大魔法' },
  // 海の いきもの・番人
  sumi: { type: 'dark', name: 'すみはき', mp: 4, tg: 'enemy', power: 1.4, slow: true, verb: 'はいた', fx: 'dark' },
  awadama: { type: 'water', name: 'あわだま', mp: 3, tg: 'enemy', power: 1.55, verb: 'はなった', fx: 'water' },
  sango: { type: 'earth', name: 'さんごの槍', mp: 5, tg: 'enemy', power: 1.8, verb: 'つきだした', fx: 'rock' },
  chouchin: { type: 'light', name: 'ちょうちんの光', mp: 6, tg: 'enemies', power: 1.25, magic: true, verb: 'てらした', fx: 'light' },
  uzushio: { type: 'water', name: 'うずしお', mp: 9, tg: 'enemies', power: 1.4, magic: true, verb: 'よびおこした', fx: 'water' },
  shimetsuke: { name: 'しめつけ', tg: 'one', power: 1.5, slow: true },
  hasami: { name: 'きょだいばさみ', tg: 'one', power: 2.0 },
  denkou: { type: 'light', name: 'でんこう', tg: 'all', power: 1.05, ail: ['para', .25] },
  kurasumi: { type: 'dark', name: 'やみの すみ', tg: 'all', power: 1.0, ail: ['poison', .3] },
  fukamikui: { type: 'dark', name: '深み喰らい', tg: 'all', power: 1.95, drain: 20 },
  shinkai: { type: 'water', name: '深海の 圧', tg: 'all', power: 2.05 },
  kaiko: { type: 'water', name: '大渦の 咆哮', tg: 'all', power: 1.9 },
});
Object.assign(DATA.species, {
  pukuawa: SP({ no: 39, name: 'プクアワ', arch: 'fish', col: ['#9fe6ff', '#4fa8d8', '#fff2a0'], feat: ['fins'], type: 'water', hab: { r: 3, b: ['sand', 'kelp'], t: 'any', w: 10 }, base: [50, 18, 18, 14, 16], grow: [8, 2.6, 3, 2.4, 1.6], sk: [['awadama', 1], ['mizu', 1], ['nami', 42]], evo: { to: 'oopuku', lv: 44 }, desc: 'おどろくと ぷくっと ふくらむ。 中身は ほとんど 泡。' }),
  oopuku: SP({ no: 40, name: 'オオプクアワ', arch: 'fish', col: ['#6fcaf0', '#2f78b0', '#ffe070'], feat: ['fins', 'crown'], size: 1.5, type: 'water', base: [72, 24, 24, 20, 17], grow: [10.5, 3, 3.8, 3.2, 1.6], sk: [['awadama', 1], ['nami', 1], ['uzushio', 1]], desc: '海の 泡を あつめて 巨大化した。 ふくらむと 船より 大きい。' }),
  hitoden: SP({ no: 41, name: 'ヒトデン', arch: 'sprite', col: ['#ffb070', '#e07040', '#fff6d0'], feat: ['halo'], type: 'light', hab: { r: 3, b: ['coral', 'sand'], t: 'night', w: 7 }, base: [46, 24, 16, 14, 18], grow: [7, 3.4, 2.8, 2.2, 1.8], sk: [['matataki', 1], ['iyashikaze', 1], ['ginga', 44]], desc: '夜に なると 星のように 光る ヒトデ。 空の 星と 話せるらしい。' }),
  takosumi: SP({ no: 42, name: 'タコスミ', arch: 'sprite', col: ['#c07ad8', '#7a3a98', '#ffe0f0'], feat: ['ears'], type: 'dark', hab: { r: 3, b: ['kelp', 'rock'], t: 'any', w: 9 }, base: [52, 20, 20, 14, 17], grow: [8, 2.8, 3.4, 2.4, 1.7], sk: [['sumi', 1], ['yami', 1], ['uzushio', 43]], evo: { to: 'oodako', lv: 45 }, desc: 'すみで 絵を かくのが とくい。 たいてい 自分の 顔。' }),
  oodako: SP({ no: 43, name: 'オオダコ', arch: 'sprite', col: ['#a04ac0', '#5a1a78', '#ffd0e8'], feat: ['ears', 'horns'], size: 1.5, type: 'dark', base: [78, 26, 27, 20, 18], grow: [11, 3.2, 4.2, 3.2, 1.7], sk: [['sumi', 1], ['yami', 1], ['uzushio', 1]], desc: '八本の 腕で 沈んだ 宝を あつめる。 一本は いつも 頭を かいている。' }),
  sangoron: SP({ no: 44, name: 'サンゴロン', arch: 'golem', col: ['#ff8a8a', '#c04a5a', '#fff0d0'], feat: ['core'], size: 1.3, type: 'earth', hab: { r: 3, b: ['coral'], t: 'any', w: 8 }, base: [70, 12, 22, 26, 8], grow: [11, 1.6, 3.8, 4.2, .8], sk: [['sango', 1], ['iwa', 1], ['jishin', 44]], desc: 'さんごが 千年 かけて 立ちあがった。 せなかに 小魚が すんでいる。' }),
  chouchinan: SP({ no: 45, name: 'チョウチンアン', arch: 'fish', col: ['#3a4a78', '#1a2244', '#fff0a0'], feat: ['fins', 'halo'], type: 'light', hab: { r: 3, b: ['trench', 'rock'], t: 'any', w: 7 }, base: [56, 26, 22, 16, 15], grow: [8.5, 3.6, 3.6, 2.6, 1.5], sk: [['chouchin', 1], ['awadama', 1], ['ginga', 46]], desc: '深い 海の 道しるべ。 ちょうちんの 光で 迷子を 家へ 送りとどける。' }),
  uminokami: SP({ no: 46, name: 'ウミノカミ', arch: 'fish', col: ['#e8f8ff', '#6ab8e8', '#ffe38a'], feat: ['fins', 'halo', 'crown'], size: 1.9, type: 'water', legend: true, hab: { r: 3, b: ['trench'], t: 'night', w: 1 }, base: [100, 36, 30, 26, 20], grow: [13, 4.6, 4.8, 4, 1.9], sk: [['uzushio', 1], ['ginga', 1], ['iyashikaze', 1]], desc: '海の 灯を 見守る 神さま。 千年に 一度だけ 深淵から 顔を 出す。' }),
});
DATA.speciesOrder = Object.keys(DATA.species).sort((a, b) => DATA.species[a].no - DATA.species[b].no);
Object.assign(DATA.enemies, {
  kaisouG: { name: '藻の番人モズク', spArt: 'oodako', type: 'grass', boss: true, acts: [['atk', .45], ['shimetsuke', .3], ['kurasumi', .25]] },
  kaniG: { name: '甲羅の番人ガンザ', spArt: 'sangoron', type: 'earth', boss: true, acts: [['atk', .45], ['hasami', .35], ['jinarashi', .2]] },
  ikaG: { name: '雷の番人イカヅチ', spArt: 'chouchinan', type: 'light', boss: true, acts: [['atk', .4], ['denkou', .35], ['uzushio', .25]] },
  fukami: { name: '深みの王', spArt: 'oopuku', type: 'dark', boss: true, twice: true, acts: [['atk', .35], ['kurasumi', .25], ['uzushio', .2], ['denkou', .2]] },
  shinen: { name: '深淵の主', spArt: 'uminokami', type: 'dark', boss: true, twice: true, acts: [['atk', .3], ['fukamikui', .2], ['kurasumi', .2], ['denkou', .15], ['uzushio', .15]] },
});
Object.assign(DATA.bossCfg, { kaisouG: [41, 8.5, 1.35, 1.05], kaniG: [43, 9, 1.38, 1.2], ikaG: [45, 8.5, 1.4, 1], fukami: [47, 6.4, .98, 1.05], shinen: [55, 8.4, 1.08, 1.15] });
for (const id of ['kaisouG', 'kaniG', 'ikaG', 'fukami', 'shinen']) { const [L, H, A, D] = DATA.bossCfg[id]; const d = DATA.enemies[id]; d.lv = L; d.hp = Math.round(H * (30 + 14 * L)); d.atk = Math.round(A * (8 + 3.2 * L)); d.def = Math.round(D * (6 + 2.4 * L)); d.spd = Math.round(6 + 1.1 * L); d.exp = Math.round((30 + L * 12) * (d.twice ? 2 : 1.3) * 3); d.gold = Math.round(L * 60); }
CHG('kaniG', 'daijishin'); CHG('ikaG', 'kaiko'); CHG('fukami', 'shinkai'); CHG('shinen', 'fukamikui');
// 海の 装備
DATA.gear.sora.push({ name: '潮騒の剣', atk: 58, price: 8800, sea: true });
DATA.gear.mio.push({ name: '真珠の竪琴', atk: 36, price: 7600, sea: true });
DATA.gear.riku.push({ name: '海槍ワダツミ', atk: 44, price: 8200, sea: true });
DATA.gear.sana.push({ name: '潮見の杖', atk: 32, price: 7200, sea: true });
DATA.gear.haru.push({ name: '潮風の扇', atk: 36, price: 7800, sea: true });
DATA.gear.kaito = [{ name: '灯台守の いかり', atk: 30 }, { name: '深海の いかり', atk: 46, price: 8400, sea: true }];
DATA.armor.push({ name: '人魚の鱗よろい', def: 36, price: 7400, sea: true });
// カイト（父・灯台守）
DATA.party.kaito = { base: { hp: 46, mp: 18, atk: 16, def: 12, spd: 12 }, grow: { hp: 7.4, mp: 2.8, atk: 2.9, def: 2.2, spd: 1.3 }, skills: [['toudai', 1], ['ikari', 1], ['shiosai', 1]] };
DATA.boards.kaito = [
  { id: 'k1', name: '灯台守の腕', desc: 'こうげき +10%', cost: 1, eff: { atk: .1 } },
  { id: 'k2', name: '海の男', desc: 'HP +12%', cost: 1, eff: { hp: .12 } },
  { id: 'k3', name: '大波斬り', desc: '技：敵全体に みずの 大ダメージ', cost: 2, skill: 'oonamigiri', req: 'k1' },
  { id: 'k4', name: '父の背中', desc: 'ぼうぎょ +15%', cost: 2, eff: { def: .15 }, req: 'k2' },
  { id: 'k5', name: '見張り', desc: '会心の 確率 アップ', cost: 2, eff: { crit: .06 }, req: 'k3' },
  { id: 'k6', name: 'ふんばり', desc: 'HP・ぼうぎょ +10%', cost: 3, eff: { hp: .1, def: .1 }, req: 'k4' },
  { id: 'k7', name: '導きの灯', desc: '技：敵全体に ひかりの 大魔法', cost: 4, skill: 'tomoshibi', req: 'k5' },
  { id: 'k8', name: '灯台の誇り', desc: 'こうげき・HP +12%', cost: 4, eff: { atk: .12, hp: .12 }, req: 'k6' } ];
DATA.combos.push({ id: 'cb_oyako', a: 'kaito', b: 'sora', name: '親子の灯', mp: 12, tg: 'enemies', power: 2.3, type: 'light', magic: true, buff: 'def', fx: 'light', desc: 'カイト＋ソラ：敵全体に 光の 大ダメージ＋みんなの ぼうぎょ アップ' });
DATA.skills.cb_oyako = { ...DATA.combos[DATA.combos.length - 1], mp: 0, verb: 'くりだした' };
