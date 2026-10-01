'use strict';
(() => {const K=window.KZ;if(!K)return;const H=K.HOOK, nm=K.nm;
  const RESIDENTS = [
    // ==========================================
    // 0. 風見の村 (風灯の島・ちゅうおう) 12めい
    // ==========================================
    { id: 'mob_gem_k01', r: 0, t: 'oldm', x: -6, z: 2, yaw: 1.2, nm: 'ものしりのシゲル',
      rumor: true, lines: ['このむらの にしの みさきの すぐしたに、 だれも すんでない ふるいこやが あるじゃろ？', 'むかしの 灯台しゅが、 だれにも いえない ひみつの こうかいにっしを かくしたという うわさじゃよ。'] },
    { id: 'mob_gem_k02', r: 0, t: 'woman', x: 8, z: 6, yaw: -2.1, nm: 'せんたくばあさん',
      rumor: true, lines: ['シオミのまちは はんとしまえの かじで やけたがね……', 'あのまちの がれきの したから、 よるなよるな カチャカチャと きんぞくの なる おとが きこえるらしいよ。'] },
    { id: 'mob_gem_k03', r: 0, t: 'man', x: -2, z: -16, yaw: 0.1, nm: 'きこりのトメ',
      rumor: true, lines: ['ゲンの こうぼうの うらてにな、 みょうに もりあがった つちの やまが あるんだ。', 'ゲンさんに きいても「ほるな」としか いわねえ。 むかしの たからでも うめたのかねえ。'] },
    { id: 'mob_gem_k04', r: 0, t: 'boy', x: -9, z: 12, yaw: 2.8, nm: 'かけっこタロウ',
      lines: ['ソラにいちゃん！ オイラ、 きょう ワタポコを おいかけて ころんじゃった！'] },
    { id: 'mob_gem_k05', r: 0, t: 'girl', x: 12, z: 14, yaw: -1.0, nm: 'はなつみのハナ',
      lines: ['むらの おはな、 いっぱい つんで カンムリを つくるの！'] },
    { id: 'mob_gem_k06', r: 0, t: 'woman', x: 2, z: 8, yaw: 3.1, nm: 'せわやきのフミ',
      lines: ['ソラちゃん、 ユイさんの ごはんは ちゃんと たべてるかい？', 'わかいんだから、 しっかり たべなきゃ だめだよ。'] },
    { id: 'mob_gem_k07', r: 0, t: 'man', x: -18, z: -8, yaw: 1.5, nm: 'だいくのでしゴロク',
      lines: ['ゲンおやかたの きんづちの おと、 しまじゅうに ひびいてるよ。 オイラも はやく いちにんまえに なりたいな。'] },
    { id: 'mob_gem_k08', r: 0, t: 'oldw', x: -11, z: 5, yaw: -0.5, nm: 'えんがわのヒサ',
      lines: ['ぽかぽか…… きょうも いい おてんきじゃ。 ともしびが もどって、 むらが あかるく なったねえ。'] },
    { id: 'mob_gem_k09', r: 0, t: 'man', x: 15, z: 1, yaw: -1.7, nm: 'はたけしごとのヤス',
      lines: ['このみも キノコも、 だいちの めぐみよ。 かんしゃして いただかないとな。'] },
    { id: 'mob_gem_k10', r: 0, t: 'boy', x: 6, z: -12, yaw: 0.8, nm: 'むしとりケンタ',
      lines: ['よるに ひかる チョウチョを みたんだ！ ほんとだよ！ ホシカゲの そばを とんでたんだ！'] },
    { id: 'mob_gem_k11', r: 0, t: 'girl', x: -4, z: 16, yaw: 2.5, nm: 'おませなミヨ',
      lines: ['ミオねえちゃんの うた、 だいすき。 わたしも おおきくなったら うたいてに なるの！'] },
    { id: 'mob_gem_k12', r: 0, t: 'oldm', x: 5, z: -8, yaw: -2.8, nm: 'いんきょのジンベエ',
      lines: ['カイトの ぼうずが こぶねで でていった あのよるの あらし…… わしゃ いまでも ゆめに みるよ。'] },

    // ==========================================
    // 1. しおみのまち シオミ (風灯の島・なんせい) 12めい
    // ==========================================
    { id: 'mob_gem_s01', r: 0, t: 'man', x: -116, z: 52, yaw: 0.4, nm: 'さかばかよいのサブ',
      rumor: true, lines: ['へへっ…… さかばの おくの あんがりで、 サイコロころがしてる れんちゅうが いるのさ。', 'かてば めずらしい「ふねの かぎ」が てにいるって はなしだが…… イカサマかもな。'] },
    { id: 'mob_gem_s02', r: 0, t: 'woman', x: -126, z: 68, yaw: -1.8, nm: 'やけだされのサト',
      rumor: true, lines: ['かじで やけのこった まちはずれの あのいえね…… すんでた じいさんは どこかへ きえちまったよ。', 'でもね、 えんとつの なかに きんいろの なにかを なげこむのを みた にんが いるんだってさ。'] },
    { id: 'mob_gem_s03', r: 0, t: 'oldm', x: -112, z: 72, yaw: 2.2, nm: 'ふねだいくのゲンゾウ',
      rumor: true, lines: ['リョウの ふなつききばの いたのしたにな、 むかしの みつぼうえきの ぬけあなが うまってるんじゃ。', 'まんちょうの ときだけ、 あなの おくから しおが ふきだすんじゃよ。'] },
    { id: 'mob_gem_s04', r: 0, t: 'man', x: -124, z: 58, yaw: -0.9, nm: 'さかなやのウオキチ',
      lines: ['へい いらっしゃい！ カゼヒラメの しおやきき、 たべてくかい？ うまいよ！'] },
    { id: 'mob_gem_s05', r: 0, t: 'boy', x: -118, z: 64, yaw: 1.6, nm: 'こぞうのタツ',
      lines: ['リクのにいちゃんは カッコいいんだ！ まちの おとなは わるく いうけど、 オイラは しんじてる！'] },
    { id: 'mob_gem_s06', r: 0, t: 'girl', x: -122, z: 48, yaw: 3.0, nm: 'かいひろいのアヤ',
      lines: ['はまべで ひろった さくらいろの かいがら、 きれいでしょ？ たからものなの。'] },
    { id: 'mob_gem_s07', r: 0, t: 'woman', x: -110, z: 62, yaw: -2.5, nm: 'おかみのキヨ',
      lines: ['かじの あと、 ナミちょうちょうが ひっしで まちを たてなおして くれたのさ。 あたまが あがらないよ。'] },
    { id: 'mob_gem_s08', r: 0, t: 'oldw', x: -128, z: 54, yaw: 0.8, nm: 'あみぜんいのウメ',
      lines: ['あみを あむのも ほねが おれるよ。 でも さかなが とれなきゃ めしが くえないからねえ。'] },
    { id: 'mob_gem_s09', r: 0, t: 'man', x: -114, z: 44, yaw: -1.2, nm: 'みはりばんのダイスケ',
      lines: ['灯台に ひが ともってから、 よるの みなとに ちかづく かげものが へったよ。 ありがたいね。'] },
    { id: 'mob_gem_s10', r: 0, t: 'boy', x: -126, z: 62, yaw: 2.1, nm: 'わんぱくショータ',
      lines: ['オイラも はやく おおきくなって、 やりを びゅんびゅん ふりまわしたいな！'] },
    { id: 'mob_gem_s11', r: 0, t: 'woman', x: -118, z: 74, yaw: -0.3, nm: 'やどのしたばたらきハルミ',
      lines: ['しおかぜていの おふとんは しおかぜで ちょっぴり しめってるけど、 たびの にんは ぐっすり ねむってくれるわ。'] },
    { id: 'mob_gem_s12', r: 0, t: 'oldm', x: -108, z: 56, yaw: 1.9, nm: '灯台みのロクロウ',
      lines: ['あそこの がけの 灯台…… ひざらが おきに ういてるじゃろ？ むかしの ともしびしゅの いじじゃよ。'] },

    // ==========================================
    // 2. 港町ミナト (霧の大陸・みなみ) 13めい
    // ==========================================
    { id: 'mob_gem_m01', r: 1, t: 'man', x: -10, z: 155, yaw: 1.1, nm: 'そうこばんのゴルド',
      rumor: true, lines: ['にしの ３ばんそうこには ちかづくなよ。 おもてむきは「とうかいの きけん」だが……', 'あそこ、 よなかに たいりくの やみしょうにんどもが あつまって ひみつの せりいちを ひらいてるんだ。'] },
    { id: 'mob_gem_m02', r: 1, t: 'oldw', x: 12, z: 172, yaw: -2.3, nm: 'つじうらないのババ',
      rumor: true, lines: ['ひがしの さばくの「ほしのいせき」…… あそこの さいだんの したには かくしへやが あるよ。', '「ほしのめ」を もつ ものだけが、 かべの くぼみを みぬけるのさ。'] },
    { id: 'mob_gem_m03', r: 1, t: 'man', x: 4, z: 180, yaw: 0.0, nm: 'さかばのすいかくボリス',
      rumor: true, lines: ['ヒック……！ ギルドの けいじばんの うらっがわ、 めくってみたこと あるかい？', 'けされた「うらいらい」の はりがみが、 そのまま のこってるんだぜ……！'] },
    { id: 'mob_gem_m04', r: 1, t: 'woman', x: -14, z: 168, yaw: 1.8, nm: 'にうけにんのアンナ',
      lines: ['しまからの ふね、 きょうも ぶじに ついて よかったわ。 バルドせんちょう、 たよりに してるの。'] },
    { id: 'mob_gem_m05', r: 1, t: 'boy', x: -3, z: 160, yaw: -1.0, nm: 'みなとのチビッコ トム',
      lines: ['わあ、 でっかい ふね！ ぼくも いつか そとの うみへ ぼうけんに でるんだ！'] },
    { id: 'mob_gem_m06', r: 1, t: 'girl', x: 8, z: 158, yaw: 2.7, nm: 'はなうりのリリ',
      lines: ['さばくの ほしはなは いかが？ かれない おはなだよ！'] },
    { id: 'mob_gem_m07', r: 1, t: 'man', x: -6, z: 178, yaw: -0.5, nm: 'すいふのジャック',
      lines: ['霧の大陸の まわりの うみは しおが あらいんだ。 うでの いい そうださむらいじゃなきゃ ふなぞこを するぜ。'] },
    { id: 'mob_gem_m08', r: 1, t: 'oldm', x: 15, z: 164, yaw: -2.9, nm: 'もとこうかいしセルジオ',
      lines: ['おおむかし、 この みなとから てんくうへ のぼる きょだいな クジラが いたそうな。 まさかな、 ガハハ！'] },
    { id: 'mob_gem_m09', r: 1, t: 'woman', x: 2, z: 150, yaw: 0.9, nm: 'やたいのマーサ',
      lines: ['やきたての ミナトアジ、 たべてきな！ しょうがしょうゆが ピリッと きいて さいこうだよ！'] },
    { id: 'mob_gem_m10', r: 1, t: 'man', x: -16, z: 158, yaw: 1.4, nm: 'しょうにんギルバート',
      lines: ['ほしのかけらは とぶように うれるよ。 たいりくの きぞくどもが たかねで かいとるのさ。'] },
    { id: 'mob_gem_m11', r: 1, t: 'girl', x: -8, z: 174, yaw: -1.7, nm: 'とびはこエマ',
      lines: ['ツムギおねえちゃんの けんきゅうしょ、 いつも へんな なきごえが きこえて おもしろいよ！'] },
    { id: 'mob_gem_m12', r: 1, t: 'boy', x: 10, z: 178, yaw: 3.1, nm: 'すいえいじまんレオ',
      lines: ['みなとの ていぼうから とびこむと、 かいすいが ひんやりして さいこうなんだ！'] },
    { id: 'mob_gem_m13', r: 1, t: 'oldm', x: -1, z: 185, yaw: -0.2, nm: 'いかりばんのセバス',
      lines: ['ふねが かえる ばしょが あるってのは、 いいもんだな。'] },

    // ==========================================
    // 3. オアシスのむら サラム (霧の大陸・さばく) 12めい
    // ==========================================
    { id: 'mob_gem_o01', r: 1, t: 'oldm', x: 114, z: 72, yaw: 1.0, nm: 'すなかたりのカーシム',
      rumor: true, lines: ['さばくの まんなかに、 「ながれる すなの あな」が あるんじゃ。', 'おちたら おわりと おもうじゃろ？ じつは、 ふるい おうぼの たからものこへ つながっておるのじゃよ。'] },
    { id: 'mob_gem_o02', r: 1, t: 'woman', x: 128, z: 86, yaw: -2.4, nm: 'みずくみのレイラ',
      rumor: true, lines: ['そんちょうハッサンの いえの じゅうたんの した…… おおきな てつの とびらが あるのを みちゃったの。', 'あの やさしい そんちょうが、 いったい なにを かくしているのかしら……。'] },
    { id: 'mob_gem_o03', r: 1, t: 'man', x: 108, z: 88, yaw: 0.3, nm: 'たいしょうのちょうアジズ',
      rumor: true, lines: ['すなあらしの よるにだけ、 さきゅうの むこうに あおい しんきろうの まちが うかびあがるんだ。', 'そこには「ほしくいの なみだ」と よばれる ひやくが ねむっているらしい。'] },
    { id: 'mob_gem_o04', r: 1, t: 'boy', x: 118, z: 76, yaw: -1.2, nm: 'すなすべりラシード',
      lines: ['スナワニに のって すなすべりするのが オイラの ゆめなんだ！'] },
    { id: 'mob_gem_o05', r: 1, t: 'girl', x: 122, z: 82, yaw: 2.6, nm: 'おどりこファティマ',
      lines: ['サラムの みずは あまくて つめたいの。 さばくを こえてきた たびびとは みんな ないて よろこぶわ。'] },
    { id: 'mob_gem_o06', r: 1, t: 'man', x: 112, z: 92, yaw: -0.6, nm: 'こうしんりょうやザイド',
      lines: ['クミンに コリアンダー、 さばくの スパイスは たびの つかれを ふきとばすぞ！'] },
    { id: 'mob_gem_o07', r: 1, t: 'woman', x: 130, z: 76, yaw: 1.9, nm: 'おりおんなヌール',
      lines: ['サボテンボの せんいで おった ポンチョはね、 すなも とうさないし すずしいのよ。'] },
    { id: 'mob_gem_o08', r: 1, t: 'oldw', x: 106, z: 82, yaw: -3.0, nm: 'にちよけのアスマー',
      lines: ['ひるは ひかげで じっとして、 よるに うごく。 それが さばくで ながいきする ちえさね。'] },
    { id: 'mob_gem_o09', r: 1, t: 'boy', x: 126, z: 90, yaw: 0.8, nm: 'トカゲとりハサン',
      lines: ['すなトカゲ つかまえた！ ほら、 しっぽが あおく ひかってる！'] },
    { id: 'mob_gem_o10', r: 1, t: 'man', x: 116, z: 66, yaw: -1.5, nm: 'ラクダひきタリク',
      lines: ['オアシスの みずが かれなくて ほんとうに よかった。 サナようのおかげだよ。'] },
    { id: 'mob_gem_o11', r: 1, t: 'girl', x: 110, z: 78, yaw: 2.0, nm: 'みずがめのしょうじょサミア',
      lines: ['サナさま、 いつも とおい めを して ほしを みあげていたの。 さびしそうだったな。'] },
    { id: 'mob_gem_o12', r: 1, t: 'oldm', x: 124, z: 70, yaw: -0.1, nm: 'よばんのハキム',
      lines: ['ほしが おちる おとを きいたことが あるかい？ ヒュルルル……と、 ふえのように なくのさ。'] },

    // ==========================================
    // 4. 雲の里ククル (てんくうのふしま・ちゅうおう) 13めい
    // ==========================================
    { id: 'mob_gem_c01', r: 2, t: 'oldm', x: -8, z: 66, yaw: 1.3, nm: 'くもとうじのヤクモ',
      rumor: true, lines: ['ちょうろうソヨギさまの やしきの うらの うんかい…… あそこに まぼろしの こじまが ういておる。', 'むかし、 ほししゅさまが ちじょうから ひろってきた「おもいでの ひん」が うまっておるそうじゃ。'] },
    { id: 'mob_gem_c02', r: 2, t: 'woman', x: 12, z: 76, yaw: -1.9, nm: 'かぜつむぎのシオン',
      rumor: true, lines: ['ふうりんやの おくの へやには、 どんな かぜが ふいても ならない「むおんの ふうりん」が あるわ。', 'わざわいが くるときだけ、 ちの ような おとで なりひびくんですって……。'] },
    { id: 'mob_gem_c03', r: 2, t: 'man', x: -12, z: 82, yaw: 0.2, nm: 'はねしゅのテッペイ',
      rumor: true, lines: ['きたの「星巣の塔」の ８かいの おどりばにな、 くもで かくされた ぬけあなが あるらしい。', 'ばんにんを たたかわずに やりすごせる つうろだが…… おちたら うんかいいきだぜ。'] },
    { id: 'mob_gem_c04', r: 2, t: 'boy', x: -4, z: 74, yaw: 2.4, nm: 'くもとびピコ',
      lines: ['くもわたブロックの うえで はねると、 ぽよ〜んって そらたかく とべるんだよ！'] },
    { id: 'mob_gem_c05', r: 2, t: 'girl', x: 8, z: 64, yaw: -0.8, nm: 'はねかざりのミント',
      lines: ['ハルおねえちゃんの はねかざり、 すっごく キレイ。 わたしも ほしいな。'] },
    { id: 'mob_gem_c06', r: 2, t: 'man', x: 16, z: 80, yaw: -2.7, nm: 'きりゅうのりのセツナ',
      lines: ['じょうしょうきりゅうに のるときは、 つばさを すいへいに たもつのが コツさ。 かぜと ケンカしちゃ いけない。'] },
    { id: 'mob_gem_c07', r: 2, t: 'woman', x: -6, z: 86, yaw: 1.7, nm: 'さぼうのユキナ',
      lines: ['くもちゃの おかわりは どう？ くもの すいてきで えんれた、 すっきりした おちゃよ。'] },
    { id: 'mob_gem_c08', r: 2, t: 'oldw', x: 6, z: 84, yaw: -1.1, nm: 'あみもののチヨ',
      lines: ['くもの いとは あたたかいよ。 ちじょうの にんは さむがりじゃから、 たくさん もっていきな。'] },
    { id: 'mob_gem_c09', r: 2, t: 'boy', x: -14, z: 68, yaw: 0.5, nm: 'とりつかいのポポ',
      lines: ['アマツバメに ごはん あげてたら、 てのひらに のってくれたんだ！'] },
    { id: 'mob_gem_c10', r: 2, t: 'girl', x: 14, z: 68, yaw: 2.9, nm: 'ふうしゃのルリ',
      lines: ['からからから…… ふうしゃが まわってると、 ここが いきてるって きが するの。'] },
    { id: 'mob_gem_c11', r: 2, t: 'oldm', x: -1, z: 88, yaw: 3.1, nm: 'こよみよみのゲンカン',
      lines: ['そらの うえには きせつが ない。 だから、 こころの こよみを きざんで おかんとな。'] },
    { id: 'mob_gem_c12', r: 2, t: 'man', x: 3, z: 60, yaw: -0.4, nm: 'くもきりのハヤテ',
      lines: ['ほししゅさまが くるってから、 そらの いろが かわっちまった。 ……もとに もどると いいがな。'] },
    { id: 'mob_gem_c13', r: 2, t: 'woman', x: -10, z: 72, yaw: 1.5, nm: 'すいてきあつめのサワ',
      lines: ['あさいちばんの くもの しずくはね、 おくすりの げんりょうに なるのよ。 すみきってて あまいの。'] },

    // ==========================================
    // 5. ふうしゃのしゅうらく ハヤテ (てんくうのふしま・にしこじま) 12めい
    // ==========================================
    { id: 'mob_gem_h01', r: 2, t: 'man', x: -82, z: 12, yaw: 0.7, nm: 'はぐるまこうのクロード',
      rumor: true, lines: ['おおきな ふうしゃの ました…… きその まるいしを ３つ はずすと、 ちかしつが あらわれる。', 'そこには、 てんしょくみが あばれだす まえの「ほしの きろくばん」が ねむっているらしい。'] },
    { id: 'mob_gem_h02', r: 2, t: 'oldw', x: -74, z: 24, yaw: -2.0, nm: 'かたりぶのシラハ',
      rumor: true, lines: ['にしの みさきから、 みを なげるように かっくうした ゆうしゃが おった。', 'うんかいのしたの「みえない あしば」に ちゃくちして、 でんせつの たからを てにいれたそうじゃよ。'] },
    { id: 'mob_gem_h03', r: 2, t: 'girl', x: -80, z: 28, yaw: 1.9, nm: 'みはりっこリノ',
      rumor: true, lines: ['カザミさんの いえの やねの てっぺん、 とりの すの なかにね……', 'あおく ひかる「てんぷうの いし」が かくしてあるの、 わたし みちゃった！'] },
    { id: 'mob_gem_h04', r: 2, t: 'man', x: -76, z: 14, yaw: -0.8, nm: 'ほぜんいのダン',
      lines: ['ふうしゃの ほは いのちづなだ。 ほつれが いっぽん あったら、 すぐに なおさなきゃならん。'] },
    { id: 'mob_gem_h05', r: 2, t: 'boy', x: -84, z: 22, yaw: 2.3, nm: 'たこあげカイト',
      lines: ['みてみて！ オイラの たこ、 くもの むこうまで とどきそうだよ！'] },
    { id: 'mob_gem_h06', r: 2, t: 'woman', x: -72, z: 18, yaw: -1.5, nm: 'こなひききのマリア',
      lines: ['ふうしゃの ちからで ひいた こむぎこは、 ふんわり かるいの。 パンを やくと さいこうよ。'] },
    { id: 'mob_gem_h07', r: 2, t: 'oldm', x: -86, z: 16, yaw: 0.1, nm: 'かぜよみのトオノ',
      lines: ['ハルが ちーさかった ころ、 この しゅうらくの ふうしゃを じっと みつめておったよ。'] },
    { id: 'mob_gem_h08', r: 2, t: 'boy', x: -78, z: 8, yaw: -2.8, nm: 'かけっこシロウ',
      lines: ['この しまは ちーさいから、 はしったら すぐ いっしゅう できちゃうんだ！'] },
    { id: 'mob_gem_h09', r: 2, t: 'woman', x: -82, z: 26, yaw: 1.1, nm: 'ほしにくのアン',
      lines: ['かぜに あてて つくった ほしにくだよ。 たびの ほぞんしょくに もっていきな。'] },
    { id: 'mob_gem_h10', r: 2, t: 'girl', x: -75, z: 22, yaw: -0.4, nm: 'すずならしのユナ',
      lines: ['ちりん、 ちりん…… かぜが ふくと、 とおくの だれかに こえが とどく きが するの。'] },
    { id: 'mob_gem_h11', r: 2, t: 'man', x: -85, z: 24, yaw: 2.6, nm: 'いしくのヴォン',
      lines: ['そらの うえの いしは かるい。 でも ねばりきが あって、 がんじょうな とりでが きづけるのさ。'] },
    { id: 'mob_gem_h12', r: 2, t: 'oldm', x: -70, z: 15, yaw: -1.7, nm: 'みはりあたまゴウ',
      lines: ['きたの とうから ながれてくる かげの くも…… あれが くると、 かぜが なきさけぶのさ。'] },

    // ==========================================
    // 6. アワの里 (うみのそこ・ちゅうおう) 12めい
    // ==========================================
    { id: 'mob_gem_a01', r: 3, t: 'oldm', x: -6, z: 122, yaw: 0.5, nm: 'ころうヤドカリ',
      rumor: true, lines: ['さとの ひがしの サンゴの しげみに、 きょだいな「ひらかずの オウムかい」が しずんでおる。', 'しんかいの かぎを さしこめば、 たいこの にんぎょの ざいほうが てにいるはずじゃ。'] },
    { id: 'mob_gem_a02', r: 3, t: 'woman', x: 8, z: 138, yaw: -2.2, nm: 'しんじゅとりのサン',
      rumor: true, lines: ['しんえんのみやの うらて…… かいりゅうが うずまきく われめに、 むかしの ちんぼつせんが ひっかかってるの。', 'せんちょうの ぼうれいが、 いまも きんの いかりを だきしめて ねむっているそうよ。'] },
    { id: 'mob_gem_a03', r: 3, t: 'man', x: -10, z: 136, yaw: 1.8, nm: 'あわふきのブク',
      rumor: true, lines: ['さかばの あわさけの たるそこに、 ちいさな しんじゅが かくしてあるのを みたんだ。', 'てんしゅの やつ、 きゃくが よいつぶれると ニヤニヤ かぞえてるぜ。'] },
    { id: 'mob_gem_a04', r: 3, t: 'boy', x: -2, z: 126, yaw: -0.9, nm: 'クラゲおいポック',
      lines: ['ぽよん ぽよん！ クラゲの あたまの うえで はねると、 とおくまで およげるよ！'] },
    { id: 'mob_gem_a05', r: 3, t: 'girl', x: 6, z: 124, yaw: 2.7, nm: 'かいざいくのミナモ',
      lines: ['うみの そこの かいがらはね、 みみに あてると ちじょうの かぜの おとが きこえるのよ。'] },
    { id: 'mob_gem_a06', r: 3, t: 'woman', x: -14, z: 128, yaw: -1.4, nm: 'かいそうおりのアヤメ',
      lines: ['コンブの せんいで おった ふくはね、 みずのなかでも ぜんぜん おもくならないの。'] },
    { id: 'mob_gem_a07', r: 3, t: 'man', x: 12, z: 132, yaw: 0.1, nm: 'せんつきのギル',
      lines: ['オオダコが あばれだしたら よんでくれ。 おれの せんで いちつきに してやる。'] },
    { id: 'mob_gem_a08', r: 3, t: 'oldw', x: -8, z: 142, yaw: -2.8, nm: 'しおかたりのシズ',
      lines: ['深みの王も、 むかしは まいごを たすけてくれる やさしい おうじゃったんじゃがのう。'] },
    { id: 'mob_gem_a09', r: 3, t: 'boy', x: 4, z: 140, yaw: 1.2, nm: 'かくれんぼトト',
      lines: ['サンゴの すきまに かくれてると、 おさかなたちが なかまだと おもって あつまってくるんだ！'] },
    { id: 'mob_gem_a10', r: 3, t: 'girl', x: -12, z: 134, yaw: -0.3, nm: 'アワたまつくりのネネ',
      lines: ['ぷく〜っと ふいて、 なないろの あわを つくるの。 われるとき パチンと うたうのよ。'] },
    { id: 'mob_gem_a11', r: 3, t: 'man', x: 14, z: 126, yaw: 2.0, nm: 'かいていこうさくのシン',
      lines: ['かいていの はたけで そだてる ヒジキは えいようまんてんさ。 ちじょうの にんにも くわせてやりたいね。'] },
    { id: 'mob_gem_a12', r: 3, t: 'oldm', x: 0, z: 144, yaw: -1.6, nm: 'しおみのジジ',
      lines: ['ちじょうの 灯台しゅが かえってきたか。 ……カイトよ、 むすこが こんなに りっぱに なったぞ。'] }
  ];


for(const r of RESIDENTS){r.name=r.nm; const a=r.id.startsWith('mob_gem_s')?K.shiomi:r.id.startsWith('mob_gem_o')?K.oasis:r.id.startsWith('mob_gem_h')?K.hayate:null; const old=r.id.startsWith('mob_gem_s')?[-120,60]:r.id.startsWith('mob_gem_o')?[120,60]:[-80,20]; if(a){r.x+=a.x-old[0];r.z+=a.z-old[1];}r.anchor={x:r.x,z:r.z};}
  const styles = ['#6a9a9a', '#b88952', '#ad667a', '#698bb3', '#7a925a', '#a188b3'];
  const meshes = styles.map((top, i) => World.makeMesh(World.human({ skin: '#e6c3a3', hair: i % 2 ? '#4a3540' : '#654a32', hairStyle: i % 2 ? 'bob' : 'short', top, bottom: '#46485a', eye: [.3, .3, .3] }), 32));
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
    const town = row.anchor || row, offset = RESIDENTS.indexOf(row) % 12;
    if (safe(row.x,row.z,row.r,row.id)) return {x:row.x,z:row.z};
    for (let radius = 7; radius <= 39; radius += 2) for (let k = 0; k < 36; k++) {
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
    const text = typeof row.lines === 'function' ? row.lines() : row.lines;
    if(row.rumor && K.townFeature)K.townFeature.hear(row);
    await K.say(text.map(t => K.nm(row.name,t)));
  };
  let lastRegion = -1, npcLen = -1, npcMap = new Map();
  H.init.push(registerAll);
  H.load.push(() => { registerAll(); lastRegion = -1; npcLen = -1; });
  H.frame.push(() => {
    for (const mesh of meshes) mesh.n = 0;
    if (K.phase !== 'field' || (K.B && K.B.active)) return; // 立体バトル中は 描かない
    if (lastRegion !== K.G.region) { registerRegion(K.G.region); lastRegion = K.G.region; }
    if (npcLen !== K.NPCS.length) { npcLen = K.NPCS.length; npcMap = new Map(); for (const x of K.NPCS) if (!npcMap.has(x.id)) npcMap.set(x.id, x); } // 毎フレームの 線形検索を やめる
    RESIDENTS.forEach((row, i) => {
      const n = npcMap.get(row.id);
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
