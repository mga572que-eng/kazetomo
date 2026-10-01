'use strict';
(() => { const K = window.KZ; if (!K?.partyTalk?.register) return; const who = K.who;
const entries = [
/* ==========================================================================
     ついかかいわデータ (talk.js はいれつ L についかするようそ)
     ========================================================================== */

  // ---------------- ミオ (mio) ----------------
  { id: 'tk_mio_add_01', c: 'mio', cond: (G, r) => r === 0 && !G.flags.cleared,
    t: [who('mio', 'smile', 'ソラ、 つかれたら いつでも おしえてね。 わたし、 いつでも うたうから！'), who('sora', 'smile', 'うん、 ミオの うたを きくと げんきが でるよ。')] },
  { id: 'tk_mio_add_02', c: 'mio', cond: (G, r) => r === 0 && World.skyInfo(G.tod).night > .5,
    t: [who('mio', 'worried', 'よるの うみって…… なんだか ぜんぶ のみこまれそうで、 ちょっと こわいな。'), who('sora', 'determined', 'ぼくが そばに いるよ。 ランタンの ともしびも あるしね。')] },
  { id: 'tk_mio_add_03', c: 'mio', cond: (G, r) => r === 0 && G.order === 1,
    t: [who('mio', 'neutral', 'ひとつめの 灯台に ひが ともったね。 しまの いきものたちも、 ほっとした かおを してるよ。')] },
  { id: 'tk_mio_add_04', c: 'mio', cond: (G, r) => r === 0 && G.order === 3,
    t: [who('mio', 'smile', 'リクって、 くちは ぶっきらぼうだけど…… ほんとは すごく やさしいよね。'), who('sora', 'grin', 'うん。 いまも まわりを ちゃんと みてくれてるしね。')] },
  { id: 'tk_mio_add_05', c: 'mio', cond: (G, r) => r === 0 && G.order >= 4,
    t: [who('mio', 'determined', 'カイトさんの てがみ…… おとうさんの あたたかい ての ひらを おもいだすね。')] },
  { id: 'tk_mio_add_06', c: 'mio', cond: (G, r) => r === 0 && G.flags.cleared && !G.flags.c2start,
    t: [who('mio', 'joy', 'よるが あけたね、 ソラ！ そらが こんなに あおいなんて、 わすれかけてたよ。')] },
  { id: 'tk_mio_add_07', c: 'mio', cond: (G, r) => r === 1 && Math.hypot(K.player.x - K.REG[1].town.x, K.player.z - K.REG[1].town.z) < 30,
    t: [who('mio', 'surprised', '港町ミナトって、 すごい にぎやか！ みたことのない くだものがいっぱい ならんでるよ。')] },
  { id: 'tk_mio_add_08', c: 'mio', cond: (G, r) => r === 1 && World.biomeAt(K.player.x, K.player.z) === 'desert',
    t: [who('mio', 'worried', 'くつのなかに すなが いっって チクチクするの……。 ソラは へいき？'), who('sora', 'smile', 'ぼくも さっきから ずっと すなと たたかってるよ。')] },
  { id: 'tk_mio_add_09', c: 'mio', cond: (G, r) => r === 1 && World.biomeAt(K.player.x, K.player.z) === 'snow',
    t: [who('mio', 'joy', 'ふわぁ…… ゆき！ いきが まっしろだよ。 ソラ、 あったかい スープが のみたいね。')] },
  { id: 'tk_mio_add_10', c: 'mio', cond: (G, r) => r === 1 && G.flags.c2mid,
    t: [who('mio', 'sad', 'サナちゃん…… ずっと ひとりで、 くらい いせきのなかで まってたんだね。 はやく あいたいな。')] },
  { id: 'tk_mio_add_11', c: 'mio', cond: (G, r) => r === 1 && G.flags.c2done,
    t: [who('mio', 'smile', 'サナちゃんが わらってくれて、 ほんとうに よかった。 リクも うれしなき してたしね。')] },
  { id: 'tk_mio_add_12', c: 'mio', cond: (G, r) => r === 2,
    t: [who('mio', 'surprised', 'くもが あしもとに あるなんて……！ なんだか ゆめの なかを あるいてるみたい。')] },
  { id: 'tk_mio_add_13', c: 'mio', cond: (G, r) => r === 2 && G.flags.glider,
    t: [who('mio', 'joy', 'ふうぷで とぶとき、 かぜが うたってくれるの。 「もっと とおくへ おいで」って！')] },
  { id: 'tk_mio_add_14', c: 'mio', cond: (G, r) => r === 2 && G.flags.c3reunion,
    t: [who('mio', 'joy', 'ハルちゃんが おとうさんと あえたとき…… わたし、 なみだが ぜんぜん とまらなかったよ。')] },
  { id: 'tk_mio_add_15', c: 'mio', cond: (G, r) => r === 3,
    t: [who('mio', 'surprised', 'あわの すずの ちからって ふしぎ。 うみの そこなのに、 おさかなたちの こえが はっきり きこえるの。')] },
  { id: 'tk_mio_add_16', c: 'mio', cond: (G, r) => r === 3 && G.flags.c4done,
    t: [who('mio', 'smile', 'うみの そこにも ともしびが ともったね。 これで まよこに なる おさかなは いないよ。')] },
  { id: 'tk_mio_add_17', c: 'mio', cond: (G, r) => G.gold > 10000,
    t: [who('mio', 'grin', 'おさいふが ずっしり おもいよ！ こんど ナギおばさんに パイを 10こ やいてもらおうよ！')] },
  { id: 'tk_mio_add_18', c: 'mio', cond: (G, r) => G.mons.length >= 10,
    t: [who('mio', 'joy', 'ぼくじょうが すごくにぎやかだね！ みんな ソラのことが だいすきなんだよ。')] },
  { id: 'tk_mio_add_19', c: 'mio', cond: (G, r) => G.party.some(m => m.hp < m.st.hp * 0.35),
    t: [who('mio', 'worried', 'みんな ケガは だいじょうぶ……？ むりしないで、 ひとやすみ しよう？')] },
  { id: 'tk_mio_add_20', c: 'mio', cond: (G, r) => G.inv.mi >= 20,
    t: [who('mio', 'smile', 'このみが いっぱい！ これ、 ほして ジャムに すると おいしいんだよ。')] },

  // ---------------- リク (riku) ----------------
  { id: 'tk_riku_add_01', c: 'riku', cond: (G, r) => r === 0 && !G.flags.cleared,
    t: [who('riku', 'smirk', 'おい かんちゃん。 あしもと フラついてんぞ。 ちゃんと めし くっってんのか？'), who('sora', 'angry', 'フラついてないよ！ まだまだ あるけるし！')] },
  { id: 'tk_riku_add_02', c: 'riku', cond: (G, r) => r === 0 && World.skyInfo(G.tod).night > .5,
    t: [who('riku', 'neutral', 'よみちは かげものの なわばりだ。 やりの とどく はんいから はなれるなよ。')] },
  { id: 'tk_riku_add_03', c: 'riku', cond: (G, r) => r === 0 && G.order >= 3,
    t: [who('riku', 'neutral', '……おまえの おやじさん、 カイトって いったな。 しまじゅうから たよりに されてた わけだ。')] },
  { id: 'tk_riku_add_04', c: 'riku', cond: (G, r) => r === 0 && G.flags.cleared,
    t: [who('riku', 'grin', 'へっ、 よいやみのおうも たいしたこと なかったな。 ……ま、 おまえが あきらめなかった おかげだがな。')] },
  { id: 'tk_riku_add_05', c: 'riku', cond: (G, r) => r === 1 && Math.hypot(K.player.x - K.REG[1].town.x, K.player.z - K.REG[1].town.z) < 30,
    t: [who('riku', 'neutral', 'ミナトの みなとか。 むかし、 サナと ふたりで ふねを みあげたことが ある。 ……あいつは ほしばっかり みてたがな。')] },
  { id: 'tk_riku_add_06', c: 'riku', cond: (G, r) => r === 1 && World.biomeAt(K.player.x, K.player.z) === 'desert',
    t: [who('riku', 'smirk', 'さばくじゃ みずの ざんりょうを つねに きにしとけ。 ……ほら、 たおれそうなら やりの がらに つかまれ。')] },
  { id: 'tk_riku_add_07', c: 'riku', cond: (G, r) => r === 1 && G.flags.c2mid,
    t: [who('riku', 'determined', 'サナ…… まってろ。 こんどこそ、 おれが おまえを つれもどす！')] },
  { id: 'tk_riku_add_08', c: 'riku', cond: (G, r) => r === 1 && G.flags.c2done,
    t: [who('riku', 'smile', 'サナの やつ、 むかしより がんこに なったな。 ……だれの えいきょうだか。'), who('sora', 'grin', 'リクそっくりだよ。')] },
  { id: 'tk_riku_add_09', c: 'riku', cond: (G, r) => r === 2,
    t: [who('riku', 'worried', 'たかえな…… おい、 おちたら ひとたまりも ねえぞ。 あしもと よく みて あるけよ。'), who('sora', 'grin', 'リク、 もしかして たかいとこ こわい？'), who('riku', 'angry', 'ば、 ばかいえ！ けいかいしてんだよ！')] },
  { id: 'tk_riku_add_10', c: 'riku', cond: (G, r) => r === 2 && G.flags.c3elder,
    t: [who('riku', 'neutral', 'ハルの おうぎさばき、 なかなかだ。 かぜを よむ やつと くむと、 やりの のびが ちがう。')] },
  { id: 'tk_riku_add_11', c: 'riku', cond: (G, r) => r === 3,
    t: [who('riku', 'surprised', 'すいあつで やりが おもく かんじるかとおもったが…… ふしぎと ふりやすいな。 カイトさんの いかりほどじゃ ねえが。')] },
  { id: 'tk_riku_add_12', c: 'riku', cond: (G, r) => r === 3 && G.flags.c4done,
    t: [who('riku', 'smile', 'うみの そこまで 灯台を たてちまうんだから、 おやこそろって とんでもねえ ともしびまもりだな。')] },
  { id: 'tk_riku_add_13', c: 'riku', cond: (G, r) => G.bountyDone >= 10,
    t: [who('riku', 'grin', 'ギルドの いらいも いたに ついてきたな。 しょうきんかせぎでも やってけそうだぜ、 おれたち。')] },
  { id: 'tk_riku_add_14', c: 'riku', cond: (G, r) => G.inv.sakana >= 5,
    t: [who('riku', 'smile', 'さかなが あんじゃねえか。 しおやききに して くれよ。 かんぶつも いいな……。')] },
  { id: 'tk_riku_add_15', c: 'riku', cond: (G, r) => G.eq.riku && G.eq.riku.w >= 3,
    t: [who('riku', 'determined', 'いい やりだ。 ふるたびに てのひらに なじむ。 ゲンさんの うでは ほんものだな。')] },

  // ---------------- サナ (sana) ----------------
  { id: 'tk_sana_add_01', c: 'sana', cond: (G, r) => r === 1 && G.flags.c2done,
    t: [who('sana', 'smile', '{name}さん、 あにが いつも らんぼうな ことばづかいをして ごめんなさい。'), who('sora', 'smile', 'ううん！ リクの ことばには いつも たすけられてるよ。')] },
  { id: 'tk_sana_add_02', c: 'sana', cond: (G, r) => World.skyInfo(G.tod).night > .5,
    t: [who('sana', 'smile', 'ほしたちが うたっています。 「こんやの かぜは、 たびびとを いえへ おくる かぜだよ」って。')] },
  { id: 'tk_sana_add_03', c: 'sana', cond: (G, r) => r === 1 && World.biomeAt(K.player.x, K.player.z) === 'desert',
    t: [who('sana', 'neutral', 'さばくの すなは、 ほしの おちた かけら。 だから よるに なると つめたく ひかるんです。')] },
  { id: 'tk_sana_add_04', c: 'sana', cond: (G, r) => r === 0,
    t: [who('sana', 'joy', '風見の村って、 なんて あたたかい ばしょでしょう。 ユイさんの スープ、 とても おいしかったです。')] },
  { id: 'tk_sana_add_05', c: 'sana', cond: (G, r) => r === 2,
    t: [who('sana', 'surprised', 'こんなに ちかくで ほしを かんじられるなんて……！ そらの うえは、 ほしの ゆりかごですね。')] },
  { id: 'tk_sana_add_06', c: 'sana', cond: (G, r) => r === 2 && G.flags.c3elder,
    t: [who('sana', 'worried', 'ハルさんの ひとみの おくに、 とても ふかい いのりを かんじます。 わすれていても、 こころは おぼえていたのですね。')] },
  { id: 'tk_sana_add_07', c: 'sana', cond: (G, r) => r === 3,
    t: [who('sana', 'neutral', 'ふかい うみの そこにも、 そらと おなじ せいざが みえます。 ひかる さかなたちが つくる、 もうひとつの ほしぞらです。')] },
  { id: 'tk_sana_add_08', c: 'sana', cond: (G, r) => G.seeds >= 4,
    t: [who('sana', 'smile', 'ひかりのたねが たまっていますね。 せきぞうへ ささげに いきませんか？')] },
  { id: 'tk_sana_add_09', c: 'sana', cond: (G, r) => G.inv.shizuku >= 10,
    t: [who('sana', 'smile', 'よつゆのしずくは、 ほしの なみだ。 くすりにも つえの きょうかにも つかえる たいせつな ものです。')] },
  { id: 'tk_sana_add_10', c: 'sana', cond: (G, r) => G.flags.c3done && !G.flags.c4start,
    t: [who('sana', 'joy', 'そらの ほしが ぜんぶ もどりました。 にいさん、 みて！ こきょうの まちの うえにも、 あの ほしが かがやいています！')] },

  // ---------------- ハル (haru) ----------------
  { id: 'tk_haru_add_01', c: 'haru', cond: (G, r) => r === 2 && !G.flags.c3done,
    t: [who('haru', 'neutral', 'そらの かぜは きまぐれ。 でも、 ちゃんと みみを すませば、 どこへ ふきたいか おしえてくれるの。')] },
  { id: 'tk_haru_add_02', c: 'haru', cond: (G, r) => r === 2 && G.flags.glider2,
    t: [who('haru', 'smile', '「ふうぷ・かい」、 じょうずに つかいこなせてるね。 {name}は かぜと なかよくなるのが はやい。')] },
  { id: 'tk_haru_add_03', c: 'haru', cond: (G, r) => r === 2 && World.skyInfo(G.tod).night > .5,
    t: [who('haru', 'neutral', 'くもの うえの よるは しずか。 しずかすぎて、 むかしの だれかの よびごえが きこえそうになるの。')] },
  { id: 'tk_haru_add_04', c: 'haru', cond: (G, r) => r === 0 && G.flags.c3reunion,
    t: [who('haru', 'joy', 'おとうさんの ランタン、 いつも ピカピカに みがいてあるの。 まってて くれたんだね。')] },
  { id: 'tk_haru_add_05', c: 'haru', cond: (G, r) => r === 0 && G.flags.c3reunion,
    t: [who('haru', 'smile', '風見の村の かぜは、 しおと きのにおいが する。 これが…… ふるさとの においなんだね。')] },
  { id: 'tk_haru_add_06', c: 'haru', cond: (G, r) => r === 1,
    t: [who('haru', 'surprised', 'さばくの かぜは あつくて おもいね！ そらの あがとは ぜんぜん ちがうから、 おもしろい。')] },
  { id: 'tk_haru_add_07', c: 'haru', cond: (G, r) => r === 3,
    t: [who('haru', 'neutral', 'うみのなかにも「ちょうりゅう」という かぜが ふいてる。 さからわずに のれば、 すいすい すすめるよ。')] },
  { id: 'tk_haru_add_08', c: 'haru', cond: (G, r) => G.baseLv >= 3,
    t: [who('haru', 'joy', 'わがいえの かぜとおし、 すごく いいね。 まどの そばに ふうりんを つけても いい？')] },
  { id: 'tk_haru_add_09', c: 'haru', cond: (G, r) => G.inv.kumowata >= 10,
    t: [who('haru', 'smile', 'くもわたを こんなに あつめたの？ これで ふかふかの ベッドが つくれるね。')] },
  { id: 'tk_haru_add_10', c: 'haru', cond: (G, r) => G.flags.c4done,
    t: [who('haru', 'smile', 'そらも うみも、 つながってたんだね。 かぜが ともしびを はこんで、 ほしが みちを てらす。 ぜんぶ ひとつなんだ。')] },

  // ---------------- カイト (kaito) ----------------
  { id: 'tk_kaito_add_01', c: 'kaito', cond: (G, r) => r === 0 && G.flags.cleared && !G.flags.c4start,
    t: [who('kaito', 'smile', '{name}。 おまえの つるぎを みてると、 ユイの きのつよさと おれの がんこさが まるごと つまってるのが わかるよ。')] },
  { id: 'tk_kaito_add_02', c: 'kaito', cond: (G, r) => r === 3,
    t: [who('kaito', 'determined', 'うみの そこにも 灯台が ある。 あかりを ともして、 みんなの みちしるべに しよう。')] },
  { id: 'tk_kaito_add_03', c: 'kaito', cond: (G, r) => r === 3 && G.flags.c4elder,
    t: [who('kaito', 'neutral', 'ウシオの じいさん、 むかしから こごとばっかり だったが…… まちを まもる おもいは ほんものだ。')] },
  { id: 'tk_kaito_add_04', c: 'kaito', cond: (G, r) => r === 3 && World.skyInfo(G.tod).night > .5,
    t: [who('kaito', 'smile', 'よるの かいていの しずけさは かくべつだな。 ……ほら、 ちょうちんアンコウが 灯台の まねをして およいでるぞ。')] },
  { id: 'tk_kaito_add_05', c: 'kaito', cond: (G, r) => r === 3 && G.flags.c4done,
    t: [who('kaito', 'joy', 'ハッハ！ おやこで 深みの王と たたかいぬいたな！ ゲンあにきに じまんしてやるか。')] },
  { id: 'tk_kaito_add_06', c: 'kaito', cond: (G, r) => r === 1,
    t: [who('kaito', 'smile', '霧の大陸か。 バルドの ふねで なんども わたったよ。 港町ミナトの うおいちばは いまも かっきが あるか？')] },
  { id: 'tk_kaito_add_07', c: 'kaito', cond: (G, r) => r === 2,
    t: [who('kaito', 'surprised', 'くもの うえに まちが あるとは きいていたが…… じっさいに たつと あしが すくむな！ おい {name}、 ひっぱるなよ！')] },
  { id: 'tk_kaito_add_08', c: 'kaito', cond: (G, r) => G.gold >= 30000,
    t: [who('kaito', 'grin', 'たいした もんだ、 こんなに かせぐなんて！ むかしの おれの ぜんざいさんより ずっと おおいぞ。')] },
  { id: 'tk_kaito_add_09', c: 'kaito', cond: (G, r) => G.bountyDone >= 20,
    t: [who('kaito', 'smile', 'りっぱな ぼうけんしゃだな、 {name}。 だが な、 むちゃだけは するな。 かあさんが まいにち まどべで まってるんだからな。')] },
  { id: 'tk_kaito_add_10', c: 'kaito', cond: (G, r) => G.inv.shinju >= 3,
    t: [who('kaito', 'smile', 'きれいな しんじゅだな。 ユイに もちかえって やったら どうだ？ きっと よろこぶぞ。')] }
];
K.partyTalk.register(entries);
/* ==========================================================================
     なかまモンスターのくちょう・かいわボイス (talk.js の MV オブジェクト)
     ========================================================================== */
  const voices = {
    // ---- わたげ・こがたくさタイプ ----
    watapoko: (b) => b >= 80 ? ['ぽこ〜！ {name}の そば、 いちばん あったかいぽこ！', 'ぎゅ〜って して ほしいぽこ♥']
      : b >= 40 ? ['ぽこぽこ！ きょうも いっしょに おさんぽぽこ？', 'かぜが ふくと、 ふわりと とんじゃいそうぽこ〜。']
      : ['ぽこ？ まだ ちょっと きんちょうするぽこ……。', 'なでて くれるの、 うれしいぽこ。'],
    watafuwari: (b) => b >= 80 ? ['ふわり〜！ そらの はてまで {name}を のせて とんでいくふわり！', 'だいすきふわり〜♥']
      : ['ふわり、 かぜが おいしいね。', 'くもと いっしょに たびするの、 だいすきふわり。'],
    hanapokke: (b) => b >= 60 ? ['ポッケの おはな、 {name}に あげるはな！ きれいでしょう？', 'おにちさま ぽかぽかで ごきげんはな〜♪']
      : ['あたまの つぼみ、 はやく さかないかなはな。', 'おみず ちょうだいはな〜。'],
    hanakanmuri: (b) => ['じょおうの はなかんむり、 きらきらさいてるわ。', '{name}の あたまにも、 ちいさな はなを のせてあげるね。'],

    // ---- がんせき・どっしりタイプ ----
    iwanoko: (b) => b >= 80 ? ['ゴロ〜ン！ {name}、 おれの せなかに じょうっかって いいゴロ！', 'いわより かたい きずなゴロ！']
      : ['せなかの いし、 きのうより ひとつ ふえたゴロ。', 'かたい いわを かじると おちつくゴロ。'],
    iwagoron: (b) => ['ズズズ…… じめんが ゆれるのは、 おれが あるいているからだゴロ。', '{name}の まえは、 おれの いわたてが まもるゴロ！'],
    tsuchimogu: (b) => ['モグモグ！ つちの なかに きらきらひかる こいしを みつけたモグ！', '{name}に プレゼントするモグ！'],
    ishigaki: (b) => ['…………ガキ。', 'せんねんの ねむりより、 {name}との たびが、 たのしい……ガキ。'],

    // ---- みず・ぷるぷる・さかなタイプ ----
    mizumochi: (b) => b >= 80 ? ['ぷるる〜ん♥ {name}、 ひんやりして きもちいいもち？', 'ずっと ぷるぷる いっしょに いるもち！']
      : ['もちもち、 みずでっぽうの れんしゅうちゅうもち。', 'かわいちゃうのは にがてもち〜。'],
    mizudaifuku: (b) => ['おおきく なっても、 こころは ぷるぷるだいふくもち。', 'しおの みちひき、 おはらで わかるもちよ〜。'],
    umiushu: (b) => ['ひらひら〜♪ なみの リズムに あわせて ダンスうしゅ！', '{name}も いっしょに おどるうしゅ？'],
    pukuawa: (b) => ['ぷくく〜！ おどろくと ぷくっと まんまるに ふくらむぷく！', 'つついちゃ だめぷくよ〜！'],
    oopuku: (b) => ['ぷくおお〜ん！ うみの あわを ぜんぶ あつめたら、 こんなに おおきくなったぷく！'],
    soramedaka: (b) => ['すいすい〜！ かぜの ながれに のって そらを およぐすい！', 'くもの なみしぶき、 きれいすいね！'],
    soramanta: (b) => ['ふわり、 ゆったり。 せなかに のって おひるねして いいマンタよ。'],
    chouchinan: (b) => ['ぴかり！ まっあんな みちも、 ぼくの ちょうちんが あれば まよわないアン！'],
    nijikujira: (b) => ['ブォォォン……。 あめあがりの にじを くぐって、 どこまでも およごう。'],
    hoshikujira: (b) => ['ブォォォン……。 ほしの うみは ひろい。 だが、 そなたの ともしびほど あたたかい ひかりは ない。'],

    // ---- ほのお・げんきタイプ ----
    hibana: (b) => b >= 60 ? ['パチパチ！ {name}、 おれの ひばな、 あったかいだろバチ！', 'さむかったら いつでも ひを つけてやるバチ！']
      : ['メラメラ！ ちーさくたって まけないバチよ！', 'よるの さばくは おれの でばんバチ！'],
    homura: (b) => ['ボォォッ！ たぎる ほのお！ なかまの ためなら、 どこまでも もえあがるぜ！'],

    // ---- とり・つばさ・かぜタイプ ----
    yorukoumori: (b) => ['キキッ！ まぶしい ひるは にがてだが…… {name}が よぶなら おきるバサ！'],
    yoibasa: (b) => ['バサリ……。 しょうの つきよ、 おれの つばさで やみを きりさいてやろう。'],
    kazetaka: (b) => ['ピィィーッ！ かぜが よんでいる！ はるかな たいりくを みわたすのだ！'],
    arashitaka: (b) => ['ひと はばたきで あらしを こえる。 ともよ、 ついてこられるか！'],
    amatsubame: (b) => ['ツバッ！ そらを すべる スピードなら、 だれにも まけないツバ！'],
    kumomo: (b) => ['もくもく〜。 なでられると、 あめを ふらせたくなっちゃうクモ〜。'],
    raikumo: (b) => ['ゴロゴロ！ おこってないゴロ、 ただ うれしくて かみなりが なっちゃうゴロ！'],
    fuurin: (b) => ['ちりん……♪ いいかぜが ふいたちりん。 すやすや ねむくなっちゃうちりん……。'],

    // ---- ほし・ひかり・せいれいタイプ ----
    hoshikage: (b) => b >= 80 ? ['きらきら……。 {name}は、 わたしの いちばんほし……。', 'ずっと、 あしもとを てらしているよ。']
      : ['よぞらの ほしと、 おしゃべり していたの。', 'やみの なかでこそ、 ひかりは よく みえるよ。'],
    hoshimikage: (b) => ['ぎんがの またたき。 まよえる たびびとを、 まあるい ひかりで つつみこもう。'],
    morinoko: (b) => ['もりもり！ もりの このはが ささやいてるもり！ 「いいたびに なるよ」って！'],
    tsukimiusa: (b) => ['ピョン！ みみの さきに おがつさまの ひかりを いっぱい ためこんだツキ！'],
    hoshikakera: (b) => ['カチリ…… カチリ……。 かけた ほしの かけら。 {name}が ひろってくれた。'],
    seishou: (b) => ['ショウ……。 せんねんの こどくは おわった。 これからは、 まもるべき ともしびの ために たつ。'],
    hoshimori: (b) => ['ほしを かぞえる てを とめて、 そなたの あゆみを みまもろう。 ……ひかりあれ。'],

    // ---- こせいは・さばく・しんかい ----
    sunawani: (b) => ['ガハハ！ すなのなかは ごくらくワニ！ たまに すなごと のみこんじまうがな！'],
    sunawaniking: (b) => ['フン！ さばくの おうたる おれに のれるえいよ、 かみしめるが よいワニ！'],
    sabotenbo: (b) => ['トゲトゲ〜。 さわると いたそう？ じつは ふにゃふにゃ なんだトゲ〜。'],
    yukiusa: (b) => ['ぴょん！ ゆきの おとは しんしん……。 みみを すますと、 はるの あしおとが するぴょん！'],
    yukinomiko: (b) => ['みこ……。 こおりつく ふゆを こえて、 あなたの こころに はなを さかせましょう。'],
    hitoden: (b) => ['ピカッ！ ヒトデだって ほしなんだヒト！ うみの そこから そらへ ウィンクするヒト！'],
    takosumi: (b) => ['チュウ！ すみで {name}の にがおえを かいてあげたタコ！ ……かっこいいタコ？'],
    oodako: (b) => ['グハハ！ かいていの たからばこなら はちほんうでの おれに まかせとけタコ！'],
    sangoron: (b) => ['サンゴ……。 ちいさな さかなたちが、 おれの えだで こもりうたを うたっているサンゴ。'],
    uminokami: (b) => ['たいこの しおさいよ……。 にんの こよ、 ふかき やみを てらす とうかの ゆうき、 みごとであったぞ。']
  };
voices.kooridori = () => ['ひやりと した かぜが きもちいいピイ。', 'こおりの はねを ひらいて、 みちを たしかめるピイ。'];
K.monVoice = Object.assign(K.monVoice || {}, voices); Object.assign(K.partyTalk.MV, voices);
for (const [id, fn] of Object.entries(voices)) {
 const m={bond:0}; for(const bond of [0,40,80]) fn(bond).forEach((text,i)=>K.partyTalk.register([{id:'gm_voice_'+id+'_'+bond+'_'+i,c:id,cond:()=>{const mon=K.G.team.map(K.member).find(x=>x?.kind==='mon'&&x.id===id);return mon&&(mon.bond||0)>=bond&& (bond===80||(mon.bond||0)<(bond===0?40:80));},t:[K.nm(DATA.species[id].name,text)]}]));
}
})();
