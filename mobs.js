// 町の住人48人。うわさは未回収の伏線で、既存進行フラグは書き換えない。
'use strict';
(() => {
  const K = window.KZ; if (!K || K.mobResidents) return;
  const H = K.HOOK;
  const RESIDENTS = [
  {
    "id": "mob_0_01",
    "r": 0,
    "name": "ナオ",
    "job": "あみなおし",
    "relation": "トモの あに",
    "catchphrase": "こつこつだよ",
    "lines": [
      "あみの やぶれを なおしてる。 トモと つかう あみだからね。",
      "よるは あみを たたんで やすむよ。 こつこつも やすみが だいじさ。",
      "おひるの ひかりなら あみの あなが よく みえるよ。"
    ],
    "rumorId": "mob_rumor_0_01",
    "rumor": "まどの そばに、 ちいさな ふるい むすびめが あるんだって。 なにの しるしだろう。",
    "houseIndex": 0
  },
  {
    "id": "mob_0_02",
    "r": 0,
    "name": "トモ",
    "job": "あみほし",
    "relation": "ナオの おとうと",
    "catchphrase": "よく かわかそう",
    "lines": [
      "ナオに なおしてもらった あみを ほすんだ。 しおが のこると いたむからね。",
      "あみを しまったよ。 あしたも よく かわかそう。",
      "かぜが かわったら あみの むきも かえるよ。"
    ],
    "rumorId": "mob_rumor_0_02",
    "rumor": "とびらの よこに けずれた あとが あるって きいたよ。 くらしの あとなら おもしろいね。",
    "houseIndex": 1
  },
  {
    "id": "mob_0_03",
    "r": 0,
    "name": "サヨ",
    "job": "パンやき",
    "relation": "マキの となり",
    "catchphrase": "あついうちにね",
    "lines": [
      "パンが やけたよ。 となりの マキにも おすそわけ。 あついうちにね。",
      "かまを たしかめてから ねるの。 あしたの こなも よういしたよ。",
      "こなを まぜるときは ゆっくり。 あわてると とんじゃうから。"
    ],
    "rumorId": "mob_rumor_0_03",
    "rumor": "やねの かざりが ひとつだけ ちがうって うわさだよ。 どうしてだろうね。",
    "houseIndex": 2
  },
  {
    "id": "mob_0_04",
    "r": 0,
    "name": "マキ",
    "job": "かごあみ",
    "relation": "サヨの となり",
    "catchphrase": "ひとめずつ",
    "lines": [
      "サヨの パンを いれる かごを あんでるの。 ひとめずつ、 しっかりね。",
      "よるは てを やすめるよ。 あみめは あしたの ひかりで たしかめよう。",
      "かごの そこが たいせつなの。 ここが ゆるいと パンが おちるでしょう。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_0_05",
    "r": 0,
    "name": "イサ",
    "job": "つりどうぐなおし",
    "relation": "ユズの いとこ",
    "catchphrase": "むすびめを みろ",
    "lines": [
      "ユズの つりいとを たしかめてる。 むすびめを みろ、 そこが だいじだ。",
      "つりばりを しまったか みておけよ。 くらいところで ふむと あぶない。",
      "みじかい いとでも むすびかたを ていねいに するんだ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_0_06",
    "r": 0,
    "name": "ユズ",
    "job": "さかなはこび",
    "relation": "イサの いとこ",
    "catchphrase": "いそぎすぎない",
    "lines": [
      "イサに どうぐを みてもらったよ。 さかなは はこぶ ときも たいせつにね。",
      "はこを あらって しまうよ。 しおの においが てに のこってる。",
      "おもい はこは ふたりで はこぶの。 いそぎすぎないのが こつ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_0_07",
    "r": 0,
    "name": "フミ",
    "job": "ふくつくり",
    "relation": "ヒナの はは",
    "catchphrase": "ぬいめを そろえて",
    "lines": [
      "ヒナと ふくの ぬいめを みてるの。 ぬいめを そろえて、 あわてずにね。",
      "はりを しまったよ。 かずも たしかめないと ねむれないの。",
      "ふくを はおったら うでを うごかしてみて。 きつくないかしら。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_0_08",
    "r": 0,
    "name": "ヒナ",
    "job": "ふくたたみ",
    "relation": "フミの こ",
    "catchphrase": "はんぶんこ",
    "lines": [
      "かあさんの つくった ふくを たたむよ。 はんぶんこ、 また はんぶんこ。",
      "ふくを しまって ねる したく。 あしたは どの いろに しようかな。",
      "ひもを むすべるように なったよ。 すぐ ほどけないか みてるの。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_0_09",
    "r": 0,
    "name": "ロク",
    "job": "みちそうじ",
    "relation": "セトの となり",
    "catchphrase": "あしもとから",
    "lines": [
      "みちの こいしを よけるんだ。 セトも とおるからな。 あしもとから きれいにするぞ。",
      "そうじは ここまで。 よるは くらい ところを むりに あるかないようにな。",
      "はっぱを あつめたら かぜに とばされないように するぞ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_0_10",
    "r": 0,
    "name": "セト",
    "job": "ランプみがき",
    "relation": "ロクの となり",
    "catchphrase": "そっと みがく",
    "lines": [
      "ランプを そっと みがくんだ。 ロクの みちも てらせるようにな。",
      "まどの ランプを たしかめてる。 くらいときほど ちいさな あかりが だいじさ。",
      "ガラスは むりに こすらず ゆっくり みがくんだ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_0_11",
    "r": 0,
    "name": "アオ",
    "job": "かいがらひろい",
    "relation": "エナの ともだち",
    "catchphrase": "いろを みて",
    "lines": [
      "エナと かいがらの いろを みてるの。 あなを あけずに ならべるだけでも きれいね。",
      "かいがらを しまったよ。 よるの はまには ひとりで いかないの。",
      "ちいさな かいがらは もとに もどすの。 いきものが いるかも しれないもの。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_0_12",
    "r": 0,
    "name": "エナ",
    "job": "かいがらかざり",
    "relation": "アオの ともだち",
    "catchphrase": "ならべてみよう",
    "lines": [
      "アオが みせてくれた かいがらを ならべてみよう。 いろが つながると うれしいね。",
      "かざりを そっと おいたよ。 ねるまえに ひもも たしかめるんだ。",
      "ひもを むすぶ ばしょを かえると かざりの かたむきも かわるよ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_1_01",
    "r": 1,
    "name": "コウ",
    "job": "にもつはこび",
    "relation": "ミツの あに",
    "catchphrase": "ふたりで もとう",
    "lines": [
      "ミツと はこを はこんでる。 おもい ものは ふたりで もとう。",
      "はこは つみすぎず しまったよ。 あしたも みちを あけておくんだ。",
      "にもつの なまえを たしかめてから はこぶよ。"
    ],
    "rumorId": "mob_rumor_1_01",
    "rumor": "まどの わくに ちいさな やじるしが あるって うわさだ。 むかしの しるしかな。",
    "houseIndex": 0
  },
  {
    "id": "mob_1_02",
    "r": 1,
    "name": "ミツ",
    "job": "にもつきろく",
    "relation": "コウの おとうと",
    "catchphrase": "かずを みよう",
    "lines": [
      "コウが はこぶ はこの かずを みよう。 ひとつずつ きろくしてるんだ。",
      "きろくと はこの かずが あったよ。 やっと ゆっくり できるね。",
      "かきまちがえたら かくさず なおすんだ。 そのほうが あとで らくさ。"
    ],
    "rumorId": "mob_rumor_1_02",
    "rumor": "とびらの ふちに かわった もようが あるって。 だれかに きいてみたいね。",
    "houseIndex": 1
  },
  {
    "id": "mob_1_03",
    "r": 1,
    "name": "タエ",
    "job": "ぬのうり",
    "relation": "オリの となり",
    "catchphrase": "さわってみて",
    "lines": [
      "ぬのを さわってみて。 となりの オリも つかってくれるの。",
      "ぬのを しまう ときは しわを のばすよ。 あしたも きれいに みせたいもの。",
      "おひるの ひかりだと いろの ちがいが わかるでしょう。"
    ],
    "rumorId": "mob_rumor_1_03",
    "rumor": "やねの かざりが ふねに にているって きいたの。 どんな わけが あるのかしら。",
    "houseIndex": 2
  },
  {
    "id": "mob_1_04",
    "r": 1,
    "name": "オリ",
    "job": "ふくなおし",
    "relation": "タエの となり",
    "catchphrase": "ほどいてからね",
    "lines": [
      "タエの ぬので ふくを なおすの。 きつい ぬいめは ほどいてからね。",
      "はりと いとを しまうよ。 よるは てを やすませるの。",
      "ちいさな やぶれを はやめに なおすと ながく きられるわ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_1_05",
    "r": 1,
    "name": "ダイ",
    "job": "つぼうり",
    "relation": "モモの おじ",
    "catchphrase": "そこを たしかめろ",
    "lines": [
      "モモと つぼを ならべてる。 そこを たしかめろ、 かたむかないかが だいじだ。",
      "つぼを かべぎわに しまったぞ。 とおりみちは あけておこう。",
      "つぼを もつなら したを ささえろよ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_1_06",
    "r": 1,
    "name": "モモ",
    "job": "つぼみがき",
    "relation": "ダイの めい",
    "catchphrase": "そっと ふくよ",
    "lines": [
      "おじさんの つぼを そっと ふくよ。 ぴかっと すると うれしいの。",
      "つぼを ならべおわったよ。 よるは ぶつけないように あるこうね。",
      "この つぼ、 あたたかい いろだね。 ひかりで かわって みえるよ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_1_07",
    "r": 1,
    "name": "ジン",
    "job": "ふねひもなおし",
    "relation": "ケイの ともだち",
    "catchphrase": "ひもは だいじだ",
    "lines": [
      "ケイと ふねの ひもを みてる。 ひもは だいじだ、 ほどけたら こまるからな。",
      "よるの ひもも たしかめたぞ。 かぜが つよいときは むりするなよ。",
      "ひもを ひっぱるまえに むすびめを みておくんだ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_1_08",
    "r": 1,
    "name": "ケイ",
    "job": "ふねそうじ",
    "relation": "ジンの ともだち",
    "catchphrase": "ぬれてるぞ",
    "lines": [
      "ふねを そうじしてる。 ジンにも ぬれてるぞって こえを かけるんだ。",
      "みずを ふいて しまったよ。 あしもとが すべらないようにな。",
      "そうじの ばけつは みちの はしへ おいておくぞ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_1_09",
    "r": 1,
    "name": "ルカ",
    "job": "みずはこび",
    "relation": "ネリの あね",
    "catchphrase": "こぼさずにね",
    "lines": [
      "ネリと みずを はこぶの。 こぼさずにね、 ゆっくり あるこう。",
      "みずがめの ふたを とじたよ。 あしたの ぶんも たしかめたの。",
      "みずを のむ ばしょを きれいにしておくね。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_1_10",
    "r": 1,
    "name": "ネリ",
    "job": "みずがめばん",
    "relation": "ルカの いもうと",
    "catchphrase": "ふたを とじよう",
    "lines": [
      "ルカが はこんだ みずを しまうよ。 ふたを とじよう、 すなが はいらないように。",
      "ふたは ちゃんと とじてるよ。 よるの かぜでも あんしん。",
      "みずがめの はしを ふくと のみやすくなるね。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_1_11",
    "r": 1,
    "name": "ホウ",
    "job": "ちずうり",
    "relation": "シズの となり",
    "catchphrase": "むきを みよう",
    "lines": [
      "シズと ちずを ならべてる。 むきを みよう、 さかさだと まよっちゃうぞ。",
      "ちずを まるめて しまったよ。 よるの みちには あかりも もっていこう。",
      "いま いる ばしょが わかれば つぎの みちを えらべるね。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_1_12",
    "r": 1,
    "name": "シズ",
    "job": "てがみかき",
    "relation": "ホウの となり",
    "catchphrase": "ゆっくり かこう",
    "lines": [
      "ホウの ちずを みて てがみの いきさきを たしかめるの。 ゆっくり かこうね。",
      "てがみを しまったよ。 あした もういちど よんでから わたすの。",
      "ながい ことばでなくても きもちが とどくと いいな。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_2_01",
    "r": 2,
    "name": "ソノ",
    "job": "くもぬのあみ",
    "relation": "ユラの はは",
    "catchphrase": "ふわりとね",
    "lines": [
      "ユラと ぬのを あむの。 ふわりとね、 ひっぱりすぎないのが こつよ。",
      "ぬのを たたんで しまったよ。 よるの かぜに とばされないようにね。",
      "いとを そろえると あみめも きれいに なるわ。"
    ],
    "rumorId": "mob_rumor_2_01",
    "rumor": "まどの そばの ひもが ひとつだけ ながいって うわさだよ。 かぜを よんでいるのかな。",
    "houseIndex": 0
  },
  {
    "id": "mob_2_02",
    "r": 2,
    "name": "ユラ",
    "job": "いとまき",
    "relation": "ソノの こ",
    "catchphrase": "くるくるね",
    "lines": [
      "かあさんの いとを まいてるよ。 くるくるね、 からまらないように。",
      "いとを しまったよ。 あしたは もっと きれいに まけるかな。",
      "いとの さきを わかるように しておくんだ。"
    ],
    "rumorId": "mob_rumor_2_02",
    "rumor": "とびらの もようが くもの かたちに にているって。 なにの しるしだろう。",
    "houseIndex": 1
  },
  {
    "id": "mob_2_03",
    "r": 2,
    "name": "フウ",
    "job": "かぜぐるまみがき",
    "relation": "リンの あね",
    "catchphrase": "かぜを みよう",
    "lines": [
      "リンと かぜぐるまを みてるの。 かぜを みよう、 うごきかたが かわるから。",
      "よるの かぜも ゆっくり まわしてるね。 はねには さわらず みるの。",
      "はねの ほこりを とると かるく まわるわ。"
    ],
    "rumorId": "mob_rumor_2_03",
    "rumor": "やねの かざりに おとが ひびくって きいたよ。 どんな おとか きになるね。",
    "houseIndex": 2
  },
  {
    "id": "mob_2_04",
    "r": 2,
    "name": "リン",
    "job": "かざりひもあみ",
    "relation": "フウの いもうと",
    "catchphrase": "むすんでみよう",
    "lines": [
      "フウの かぜぐるまに あう ひもを あんでるよ。 むすんでみよう、 ほどけないかな。",
      "かざりの ひもを しまったよ。 よるは いろを えらぶのが むずかしいね。",
      "ひもを ながくしすぎると からまるから きをつけるの。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_2_05",
    "r": 2,
    "name": "チセ",
    "job": "そらのみちはかり",
    "relation": "トワの ともだち",
    "catchphrase": "はしを みて",
    "lines": [
      "トワと みちの はしを みてるの。 あぶない ところへ ちかづきすぎないでね。",
      "よるは はしが みえにくいよ。 あかりの ある みちを とおろう。",
      "みちを はかる ときは あしを とめるの。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_2_06",
    "r": 2,
    "name": "トワ",
    "job": "みちしるべなおし",
    "relation": "チセの ともだち",
    "catchphrase": "こちらだよ",
    "lines": [
      "チセが はかった みちに しるしを つけるよ。 こちらだよって つたえたいんだ。",
      "しるしが かぜで たおれてないか みてるよ。",
      "しるしの むきは よく たしかめるんだ。 まちがえると まよっちゃうから。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_2_07",
    "r": 2,
    "name": "ハコ",
    "job": "かごなおし",
    "relation": "ミネの となり",
    "catchphrase": "そこからね",
    "lines": [
      "ミネの かごを なおしてるの。 そこからね、 いちばん ちからが かかるから。",
      "かごを しまって やすむよ。 ていれした ぶん ながく つかえるね。",
      "かごの もちてを ひっぱって たしかめるの。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_2_08",
    "r": 2,
    "name": "ミネ",
    "job": "くものみはこび",
    "relation": "ハコの となり",
    "catchphrase": "つぶさないでね",
    "lines": [
      "ハコの かごで みを はこんでる。 つぶさないでね、 したから ささえて。",
      "かごを あけて かずを みたよ。 あしたの ごはんも あんしんだね。",
      "みを つみすぎないように してるんだ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_2_09",
    "r": 2,
    "name": "スイ",
    "job": "すずみがき",
    "relation": "ナナの あに",
    "catchphrase": "おとを きこう",
    "lines": [
      "ナナと すずを みがいてるよ。 おとを きこう、 みがくと ひびきが かわるかな。",
      "よるは すずを ならしすぎないよ。 ねている ひとも いるからね。",
      "すずを つるす ひもも たしかめるんだ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_2_10",
    "r": 2,
    "name": "ナナ",
    "job": "すずひもつくり",
    "relation": "スイの いもうと",
    "catchphrase": "そっと つるそう",
    "lines": [
      "スイの すずに ひもを つけるの。 そっと つるそう、 おとを じゃましないように。",
      "すずの ひもを しまったよ。 あしたも ちりんって きこえると いいな。",
      "ひもが みじかいと すずも ゆれにくいね。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_2_11",
    "r": 2,
    "name": "ユノ",
    "job": "あたたかいのみものや",
    "relation": "レイの ともだち",
    "catchphrase": "ひといき どうぞ",
    "lines": [
      "レイと のみものを よういしてるの。 ひといき どうぞ、 あついから ゆっくりね。",
      "よるは からだを あたためたいね。 かっぷを そっと もって。",
      "のみものを こぼしたら すぐ ふくの。 すべると こまるもの。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_2_12",
    "r": 2,
    "name": "レイ",
    "job": "かっぷあらい",
    "relation": "ユノの ともだち",
    "catchphrase": "きれいにね",
    "lines": [
      "ユノの かっぷを あらうよ。 きれいにね、 のみものも おいしくなるから。",
      "かっぷを ふいて しまったよ。 あしたの ぶんも ならべたんだ。",
      "かっぷの ふちを たしかめてる。 かけてないかな。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_3_01",
    "r": 3,
    "name": "シオ",
    "job": "あわかごつくり",
    "relation": "ナミルの あに",
    "catchphrase": "まるく しよう",
    "lines": [
      "ナミルと あわの かごを つくってる。 まるく しよう、 ものが はみでないように。",
      "あわの かたちを たしかめて しまったよ。 あしたも つかえるかな。",
      "かごの したを そっと ささえるんだ。"
    ],
    "rumorId": "mob_rumor_3_01",
    "rumor": "まどの そばの かいがらが ひとつだけ うらがえしだって。 しるしなのかな。",
    "houseIndex": 0
  },
  {
    "id": "mob_3_02",
    "r": 3,
    "name": "ナミル",
    "job": "あわかごはこび",
    "relation": "シオの おとうと",
    "catchphrase": "ゆっくり うこう",
    "lines": [
      "シオの かごを はこぶよ。 ゆっくり うこう、 ながれに まかせすぎないで。",
      "かごを しまったよ。 よるは あかりの そばで たしかめるんだ。",
      "かごに ものを いれすぎると かたむくね。"
    ],
    "rumorId": "mob_rumor_3_02",
    "rumor": "とびらの ふちに あわみたいな もようが あるって うわさよ。 どんな わけが あるのかしら。",
    "houseIndex": 1
  },
  {
    "id": "mob_3_03",
    "r": 3,
    "name": "カナ",
    "job": "かいがらみがき",
    "relation": "ルリの あね",
    "catchphrase": "ひかりを みて",
    "lines": [
      "ルリと かいがらを みがくの。 ひかりを みて、 いろが かわるでしょう。",
      "かいがらを ならべて しまったよ。 あかりに うつる いろも すてきね。",
      "むりに こすらず やわらかい ぬので ふくの。"
    ],
    "rumorId": "mob_rumor_3_03",
    "rumor": "やねの かざりに ちいさな あなが あるって。 みずの ながれに かかわるのかな。",
    "houseIndex": 2
  },
  {
    "id": "mob_3_04",
    "r": 3,
    "name": "ルリ",
    "job": "かいがらならべ",
    "relation": "カナの いもうと",
    "catchphrase": "おなじじゃ ないね",
    "lines": [
      "カナが みがいた かいがらを ならべるよ。 おなじじゃ ないね、 ひとつずつ ちがうの。",
      "かいがらを かたづけたよ。 くらいときは ゆっくり あるくの。",
      "まるい かいがらは ころがらないように おくんだ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_3_05",
    "r": 3,
    "name": "モズ",
    "job": "うみくさひもあみ",
    "relation": "フネの となり",
    "catchphrase": "からめないでね",
    "lines": [
      "フネの ために うみくさの ひもを あんでる。 からめないでね、 さきを そろえよう。",
      "ひもを まるめて しまったよ。 ながれで ほどけないか みてるの。",
      "ながさを そろえると つかいやすいね。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_3_06",
    "r": 3,
    "name": "フネ",
    "job": "どうぐむすび",
    "relation": "モズの となり",
    "catchphrase": "ほどけないかな",
    "lines": [
      "モズの ひもで どうぐを むすぶよ。 ほどけないかな、 ひっぱって たしかめるんだ。",
      "どうぐを つないで しまったよ。 ながされないようにね。",
      "むすびめを おおきく しすぎると とおりにくいね。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_3_07",
    "r": 3,
    "name": "アミル",
    "job": "みずのみちはかり",
    "relation": "トコの ともだち",
    "catchphrase": "ながれを みよう",
    "lines": [
      "トコと みずの ながれを みてるの。 ながれを みよう、 みちが かわって みえるから。",
      "よるは あかりの とどく みちを えらぶよ。",
      "いそいで およぐより あしばを たしかめるのが だいじね。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_3_08",
    "r": 3,
    "name": "トコ",
    "job": "みちあかりみがき",
    "relation": "アミルの ともだち",
    "catchphrase": "あしもとだよ",
    "lines": [
      "アミルの とおる みちを てらすよ。 あしもとだよ、 こいしが あるからね。",
      "あかりを たしかめてるんだ。 よるは とくに だいじだからね。",
      "ひかりを むける かくどで みちの みえかたが かわるよ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_3_09",
    "r": 3,
    "name": "ヒスイ",
    "job": "うみのぬのなおし",
    "relation": "サイの はは",
    "catchphrase": "やわらかくね",
    "lines": [
      "サイと ぬのを ととのえるの。 やわらかくね、 ひっぱりすぎないで。",
      "ぬのを しまったよ。 あしたも きれいに つかいたいね。",
      "ぬいめを みると なおす ばしょが わかるわ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_3_10",
    "r": 3,
    "name": "サイ",
    "job": "ぬのたたみ",
    "relation": "ヒスイの こ",
    "catchphrase": "かどを そろえて",
    "lines": [
      "かあさんの ぬのを たたむよ。 かどを そろえて、 ほら ちいさくなる。",
      "ぬのを しまったよ。 あしたも てつだうんだ。",
      "ぬのの いろを ならべると うみみたいだね。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_3_11",
    "r": 3,
    "name": "オト",
    "job": "かいのおとしらべ",
    "relation": "マユの ともだち",
    "catchphrase": "きいてみよう",
    "lines": [
      "マユと かいの おとを きいてる。 きいてみよう、 かたちで かわるかな。",
      "よるは ちいさな おとで ためすよ。 ねている ひとも いるからね。",
      "かいを たたきすぎないように してるんだ。"
    ],
    "rumor": ""
  },
  {
    "id": "mob_3_12",
    "r": 3,
    "name": "マユ",
    "job": "かいかざりつくり",
    "relation": "オトの ともだち",
    "catchphrase": "ひびきが ちがうね",
    "lines": [
      "オトの かいを ならべるの。 ひびきが ちがうね、 いろだけじゃ ないんだ。",
      "かざりを しまって やすむよ。 あした また おとを ききたいな。",
      "かざりの ひもも たしかめよう。 はずれたら こまるもの。"
    ],
    "rumor": ""
  }
];
  /* うわさ一覧（いずれも噂であり事実やクエスト完了を断定しない）：
     mob_rumor_0_01 ナオ / 風見の村 / 家0 / 窓の結び目
     mob_rumor_0_02 トモ / 風見の村 / 家1 / 扉の削れ跡
     mob_rumor_0_03 サヨ / 風見の村 / 家2 / 異なる屋根飾り
     mob_rumor_1_01 コウ / ミナト / 家0 / 窓の矢印
     mob_rumor_1_02 ミツ / ミナト / 家1 / 扉の模様
     mob_rumor_1_03 タエ / ミナト / 家2 / 船に似た屋根飾り
     mob_rumor_2_01 ソノ / ククル / 家0 / 長い窓の紐
     mob_rumor_2_02 ユラ / ククル / 家1 / 雲に似た扉模様
     mob_rumor_2_03 フウ / ククル / 家2 / 響く屋根飾り
     mob_rumor_3_01 シオ / アワの里 / 家0 / 裏返しの貝
     mob_rumor_3_02 ナミル / アワの里 / 家1 / 泡に似た扉模様
     mob_rumor_3_03 カナ / アワの里 / 家2 / 飾りの小穴
     家番号は既存REG[r].housesの順序。houseIdは登録時に実IDを記録する。
     追加住人同士の関係のみを新設し、既存キャラの過去は追加しない。 */
  const styles = ['#6a9a9a', '#b88952', '#ad667a', '#698bb3', '#7a925a', '#a188b3'];
  const meshes = styles.map((top, i) => World.makeMesh(World.human({ skin: '#e6c3a3', hair: i % 2 ? '#4a3540' : '#654a32', hairStyle: i % 2 ? 'bob' : 'short', top, bottom: '#46485a', eye: [.3, .3, .3] }), 12));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  function safe(x, z, r, id) {
    const ground = K.hAt(x, z), y = K.surfaceAt(x, z, 99);
    if (!Number.isFinite(y) || ground < (r === 2 ? 4 : .3) || Math.abs(y - ground) > .4 || K.blocked(x, z, y)) return false;
    const rg = K.REG[r];
    if (rg.houses.some(h => (h.npc && dist({ x, z }, h.npc) < 2.5) || Math.abs(x - h.x) < 3.8 && Math.abs(z - h.z) < 3.8)) return false;
    if (K.NPCS.some(n => n.r === r && n.id !== id && dist({ x, z }, n) < 3)) return false;
    if ((rg.trees || []).some(t => dist({ x, z }, t) < 1.5) || (rg.rocks || []).some(t => dist({ x, z }, t) < 2)) return false;
    return [[.7, 0], [-.7, 0], [0, .7], [0, -.7]].every(([dx, dz]) => !K.blocked(x + dx, z + dz, y) && Math.abs(K.hAt(x + dx, z + dz) - ground) < .6);
  }
  function findSpot(row) {
    const town = K.REG[row.r].town, offset = RESIDENTS.indexOf(row) % 12;
    for (let radius = 7; radius <= 29; radius += 2) for (let k = 0; k < 36; k++) {
      const angle = (k + offset * 3) * Math.PI / 18, x = town.x + Math.cos(angle) * radius, z = town.z + Math.sin(angle) * radius;
      if (safe(x, z, row.r, row.id)) return { x, z };
    }
    return null;
  }
  function registerRegion(r) {
    const original = World.region;
    World.setRegion(r);
    try {
      for (const row of RESIDENTS.filter(d => d.r === r)) {
        let npc = K.NPCS.find(n => n.id === row.id);
        if (npc && safe(npc.x, npc.z, r, row.id)) { npc.mobVisible = true; continue; }
        const pos = findSpot(row);
        if (!pos) { if (npc) npc.mobVisible = false; continue; }
        if (!npc) { npc = { id: row.id, r, nm: row.name, yaw: 0, baseYaw: 0, mobVisible: true }; npc.show = () => npc.mobVisible; K.NPCS.push(npc); }
        Object.assign(npc, pos, { mobVisible: true });
        if (row.rumor) row.houseId = K.REG[r].houses[row.houseIndex]?.id || null;
      }
    } finally { World.setRegion(original); }
  }
  function registerAll() { for (let r = 0; r < 4; r++) registerRegion(r); }
  for (const row of RESIDENTS) H.talks[row.id] = async () => {
    const sky = World.skyInfo(K.G.tod), noon = K.G.tod >= .38 && K.G.tod < .62;
    const text = row.lines[sky.night > .5 ? 1 : noon ? 2 : 0];
    const lines = [K.nm(row.name, `${row.job}の ${row.name}だよ。 ${row.relation}と くらしているんだ。`), K.nm(row.name, text)];
    if (row.rumor && row.houseId) {
      const house = K.REG[row.r].houses.find(h => h.id === row.houseId);
      const compass = house ? `${house.x < K.REG[row.r].town.x ? 'にし' : 'ひがし'}がわの いえ` : '町の いえ';
      lines.push(K.nm(row.name, `${compass}の うわさだけど…… ${row.rumor}`));
    } else {
      const other = RESIDENTS.find(d => d.r === row.r && d.id !== row.id && row.relation.includes(d.name));
      if (other) lines.push(K.nm(row.name, `${other.name}も ${other.job}を がんばっているよ。 こえを かけてみてね。`));
    }
    await K.say(lines);
  };
  let lastRegion = -1;
  H.init.push(registerAll);
  H.load.push(() => { registerAll(); lastRegion = -1; });
  H.frame.push(() => {
    for (const mesh of meshes) mesh.n = 0;
    if (K.phase !== 'field') return;
    if (lastRegion !== K.G.region) { registerRegion(K.G.region); lastRegion = K.G.region; }
    RESIDENTS.forEach((row, i) => {
      const n = K.NPCS.find(n => n.id === row.id);
      if (!n || row.r !== K.G.region || !n.mobVisible || dist(n, K.player) > 85) return;
      const mesh = meshes[i % meshes.length], y = K.surfaceAt(n.x, n.z, 99);
      if (K.blocked(n.x, n.z, y)) { n.mobVisible = false; return; }
      const yaw = dist(n, K.player) < 6 ? Math.atan2(K.player.x - n.x, K.player.z - n.z) : n.baseYaw;
      if (mesh.n < mesh.maxN) mesh.set(mesh.n++, n.x, y, n.z, 1, yaw);
    });
  });
  K.mobResidents = { data: RESIDENTS, register: registerAll, safe, meshes };
  registerAll();
})();
