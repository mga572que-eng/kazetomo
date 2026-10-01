// ともしびアイランド — さかば・わけありいえ・かくしアイテム (town.js)
// さかばでのかけこと（ちろちろダイス）・じょうほうや・わけありいえのけんちくとなぞ・かくちのかくしたんさくスポット
'use strict';
(() => {
  const K = window.KZ; if (!K || !World.makeMesh || !World.Blocks) return;
  const H = K.HOOK, B = World.Blocks, G = () => K.G, who = K.who, nm = K.nm;

  // ---------------- 1. セーブデータのしょきかとごかんせいかくほ ----------------
  const initialize = g => {
    g.town = g.town || {};
    g.town.hidden = g.town.hidden || {}; // かくしアイテムかいしゅうフラグ { 'r0_chimney': 1, ... }
    g.town.rumors = g.town.rumors || {}; // こうにゅうずみみじょうほうフラグ
    g.town.diceWins = g.town.diceWins || 0; // ダイスしょうりすう
    g.town.unlocked = g.town.unlocked || {};
    g.flags.tw_heard = g.flags.tw_heard || {};
    g.flags.tw_hid = g.flags.tw_hid || [];
  };
  H.load.push(initialize); H.init.push(initialize); initialize(G());
  DATA.items.sakana ||= {name:'さかな',sell:8,heal:15,battle:'heal',cat:'food',desc:'HPを 15 かいふく'};
  DATA.items.esa ||= {name:'まきえ',price:40,sell:16,battle:'friend',desc:'いきものと なかよくなる えさ'};

  // ---------------- 2. わけありいえのけんちく ----------------
  // quests.js の mkTown とどうよう、World.setRegion できりかえてから K.buildHouse をよび、0 にもどす
  const BUILD_HOUSES = [
    // ちいき0 (風灯の島): にしみさきのふるいあきや
    { r: 0, h: { id: 'k_cape', x: -62, z: 24, face: [-58, 24] }, style: { wall: 1, roof: 3, corner: 6 } },
    // ちいき0 (シオミ): やけあとのおく・もとしちやのかくしきんここや
    { r: 0, h: { id: 's_pawn', x: -136, z: 46, face: [-130, 46] }, style: { wall: 6, roof: 8, corner: 5 } },
    // ちいき1 (港町ミナト): ３ばんそうこ（ひみつのせりいち）
    { r: 1, h: { id: 'm_wh3', x: -28, z: 148, face: [-20, 148] }, style: { wall: 6, roof: 8, corner: 6 } },
    // ちいき1 (サラム): すなにうもれたふるいおかねもちのかん
    { r: 1, h: { id: 'o_mansion', x: 138, z: 62, face: [130, 62] }, style: { wall: 9, roof: 3, corner: 4 } },
    // ちいき2 (雲の里ククル): ふうりんどうの「ひらかずのはなれ」
    { r: 2, h: { id: 'c_annex', x: 22, z: 88, face: [16, 88] }, style: { wall: 4, roof: 7, corner: 10 } },
    // ちいき3 (アワの里): しんかいのまきがいくら
    { r: 3, h: { id: 'a_vault', x: -24, z: 142, face: [-16, 142] }, style: { wall: 6, roof: 7, corner: 10 } }
  ];

  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const clearPlot=(x,z,r)=>{
    if(K.REG[r].houses.some(h=>Math.hypot(h.x-x,h.z-z)<9))return false;
    const h=K.hAt(x,z);if(h<(r===2?4:1))return false;
    for(let dx=-4;dx<=4;dx+=2)for(let dz=-4;dz<=4;dz+=2)
      if(Math.abs(K.hAt(x+dx,z+dz)-h)>1 || K.blocked(x+dx,z+dz,h))return false;
    return true;
  };
  for(const b of BUILD_HOUSES){
    const old=World.region;World.setRegion(b.r);
    const anchor=b.h.id==='s_pawn'?K.shiomi:b.h.id==='o_mansion'?K.oasis:K.REG[b.r].town;
    let found=null;
    for(let rad=32;rad<=55&&!found;rad+=3)for(let i=0;i<48&&!found;i++){
      const angle=i*Math.PI/24,x=Math.round(anchor.x+Math.cos(angle)*rad),z=Math.round(anchor.z+Math.sin(angle)*rad);
      if(clearPlot(x,z,b.r))found={x,z};
    }
    if(found){Object.assign(b.h,found);b.h.face=[anchor.x,anchor.z];K.buildHouse(b.h,b.style);K.REG[b.r].houses.push(b.h);b.visible=true;}
    World.setRegion(old);
  }

  // ---------------- 3. かくしたんさくスポット・ギミックていぎ ----------------
  // かくちのツボ・タル・えんとつ・かべのすきまなどからはっけんできるかくしアイテム
  const HIDDEN_SPOTS = [
    // 風見の村・みさき
    { id: 'k_chimney', r: 0, x: -14, z: -3, y: 5.5, n: 'ユイのいえのえんとつ',
      act: async () => {
        K.gain('mi', 5); G().gold += 120;
        await K.say(['えんとつの すきまに、 むかし ソラが かくした こぶくろが あった！', 'このみ 5こ と 120ゴールドを てにいれた！']);
      } },
    { id: 'k_backyard', r: 0, x: 13, z: -5, y: 3.5, n: 'ゲンのこうぼうのうらにわ',
      act: async () => {
        K.gain('ishi', 5); K.gain('hoshikake', 1);
        await K.say(['もりあがった つちの したから、 ゲンが たいせつに していた こうせきが みつかった！', 'いし 5こ と ほしのかけら 1こを てにいれた！']);
      } },
    { id: 'k_cape_log', r: 0, x: -62, z: 24, y: 3.0, n: 'みさきのあきやのつくえ',
      act: async () => {
        K.gain('shizuku', 3); G().gold += 300;
        await K.say(['つくえの ひきだしの おくに、 ふるびた こうかいにっしの きれはしが はさまっていた。',
          '『……ほしが おちた よる、 ししょうの ひとみから ひかりが きえた。 わたしは かいていへ むかう。 カイト』',
          'よつゆのしずく 3こ と 300ゴールドを てにいれた！']);
      } },

    // シオミ
    { id: 's_burnt_pot', r: 0, x: -136, z: 46, y: 3.0, n: 'しちやのやけあとのきんこ',
      act: async () => {
        G().gold += 800; K.gain('nakayoshi', 2);
        await K.say(['すすだらけの てつの とびらを こじひらけた！', '800ゴールド と なかよしのみ 2こを てにいれた！']);
      } },
    { id: 's_dock_hole', r: 0, x: -110, z: 74, y: 1.2, n: 'さんばしのぬけあな',
      act: async () => {
        K.gain('sakana', 4); K.gain('esa', 3);
        await K.say(['まんちょうで うちあげられた みつゆたるを ひきあげた！', 'さかな 4こ と まきえ 3こを てにいれた！']);
      } },

    // 港町ミナト
    { id: 'm_wh3_box', r: 1, x: -28, z: 148, y: 2.5, n: '３ばんそうこのかくしきばこ',
      act: async () => {
        G().gold += 1500; K.gain('hoshikake', 2);
        await K.say(['くろい ぬので おおわれた きばこの ふういんを といた！', 'やみいちの うれのこり、 1500ゴールド と ほしのかけら 2こを てにいれた！']);
      } },
    { id: 'm_board_back', r: 1, x: K.REG[1].town.x + 2, z: K.REG[1].town.z - 16, y: 3.0, n: 'ギルドけいじばんのうら',
      act: async () => {
        K.gain('ganbari', 3);
        await K.say(['けいじばんの うらがわに、 やぶられた とくべついらいしょが はりついていた！',
          '『きんきゅうてはい：さばくの きょだいスナワニに うばわれた ほきゅうかん』',
          'がんばりくし 3こを てにいれた！']);
      } },

    // サラム
    { id: 'o_mansion_pot', r: 1, x: 138, z: 62, y: 3.5, n: 'おかねもちのつぼ',
      act: async () => {
        G().gold += 2000; K.gain('pan', 4);
        await K.say(['すなを かぶった きんの つぼから、 おかねもちの いさんが でてきた！', '2000ゴールド と みのパン 4こを てにいれた！']);
      } },
    { id: 'o_hassan_rug', r: 1, x: 120, z: 70, y: 2.0, n: 'そんちょうたくのじゅうたんのした',
      act: async () => {
        K.gain('hoshikake', 3);
        await K.say(['じゅうたんを めくると、 てつの とびらの すきまに ほしのかけらが はさまっていた！', 'ほしのかけら 3こを てにいれた！']);
      } },

    // 雲の里ククル
    { id: 'c_annex_chime', r: 2, x: 22, z: 88, y: 3.5, n: 'むおんのふうりん',
      act: async () => {
        K.gain('kumowata', 8); K.gain('stew', 1);
        await K.say(['ひらかずの はなれの のきさきで、 しずまりかえった ふうりんを ならした。',
          'カラン…… と すんだ おとが なり、 くもの しずくが こぼれおちた！',
          'くもわた 8こ と ほしのシチュー 1こを てにいれた！']);
      } },

    // アワの里
    { id: 'a_vault_shell', r: 3, x: -24, z: 142, y: 2.5, n: 'ひらかずのオウムかい',
      act: async () => {
        K.gain('shinju', 3); G().gold += 3500;
        await K.say(['かたく とざされていた オウムかいが、 しおの ひかりを うけて ひらいた！', 'しんじゅ 3こ と 3500ゴールドを てにいれた！']);
      } }
  ];

  // ---------------- 4. さかばのきのう（じょうほうや・かけことダイス） ----------------

  // さかばマスターのきほんメニュー
  async function barMenu(townName, rumors) {
    while (true) {
      const g = G();
      const i = await K.menu({
        title: `さかば「${townName}」`,
        items: [
          { label: 'かけこと：ちろちろダイス', sub: 'ゾロめ 2.5ばい・どうてんは おやの かち' },
          { label: 'じょうほうや：うわさを かう', sub: 'かくしようそ・おたからの ヒント' },
          { label: 'ひとやすみ', sub: '10G・HPぜんかい' }
        ],
        where: 'side'
      });
      if (i < 0) return;
      if (i === 0) await playDice();
      if (i === 1) await buyRumors(townName, rumors);
      if (i === 2) {
        if (g.gold < 10) { await K.say([nm('さかばのマスター', 'おだいが たりないよ。 みずなら タダだけどね。')]); continue; }
        g.gold -= 10;
        K.allMembers().forEach(m => { m.hp = m.st.hp; });
        Music.sfx('heal');
        K.toast('あわだつ かじつみずで HPが ぜんかいした！', 1500);
        K.hud(); K.save();
      }
    }
  }

  // かけこと：ちろちろダイス（2このサイコロしょうぶ）
  async function playDice() {
    while (true) {
      const g = G();
      const BETS = [10, 50, 200, 500];
      const items = BETS.map(b => ({ label: `${b} G かける`, disabled: g.gold < b }));
      const c = await K.menu({ title: 'ちろちろダイス：いくら かける？', items, where: 'side' });
      if (c < 0) return;
      const bet = BETS[c];
      g.gold -= bet;
      K.hud();

      // えんしゅつとロール
      Music.sfx('mine');
      await K.say([nm('どうもとのサイコロふり', `ほい、 ${bet}ゴールド はりね！ いざ しょうぶ！`)]);

      const roll2 = () => [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
      const pDice = roll2(), dDice = roll2();
      const pSum = pDice[0] + pDice[1], dSum = dDice[0] + dDice[1];
      const pZoro = pDice[0] === pDice[1], dZoro = dDice[0] === dDice[1];

      await K.say([
        nm('どうもとのサイコロふり', `あんたの でめ：【 ${pDice[0]} 】【 ${pDice[1]} 】（けい ${pSum}）${pZoro ? ' ゾロめだ！' : ''}`),
        nm('どうもとのサイコロふり', `どうもとの でめ：【 ${dDice[0]} 】【 ${dDice[1]} 】（けい ${dSum}）${dZoro ? ' ゾロめ！' : ''}`)
      ]);

      let win = false, mul = 2;
      // 配当（v14）：ゾロめ ×2.5・ふつう ×2・どうてんは おやの かち（期待値 −1.9%。旧：ゾロめ×3・どうてん返金で +15% の 抜け道）
      const ZM = 2.5;
      if (pZoro && !dZoro) { win = true; mul = ZM; }
      else if (!pZoro && dZoro) { win = false; }
      else if (pSum > dSum) { win = true; mul = pZoro ? ZM : 2; }
      else if (pSum === dSum) {
        Music.sfx('cancel');
        await K.say([nm('どうもとのサイコロふり', 'どうてん！ どうてんは おやの かちだよ。 わるいね！')]);
        K.hud(); K.save();
        continue;
      }

      if (win) {
        const prize = Math.floor(bet * mul);
        g.gold += prize;
        g.town.diceWins = (g.town.diceWins || 0) + 1;
        Music.sfx('friend');
        await K.say([
          nm('どうもとのサイコロふり', `あんたの かちだ！ ${mul > 2 ? 'ゾロめばいつけ！ ' : ''}${prize}ゴールド もっていきな！`),
          g.town.diceWins === 5 ? nm('どうもとのサイコロふり', 'おいおい、 5かいも かつなんて スジが いいじゃねえか。 これを もっていきな！') : null
        ].filter(Boolean));
        if (g.town.diceWins === 5 && !g.town.dicePrize) {
          g.town.dicePrize = 1;
          K.gain('hoshikake', 2);
          await K.say(['ほしのかけら 2こを てにいれた！']);
        }
      } else {
        Music.sfx('cancel');
        await K.say([nm('どうもとのサイコロふり', 'へへっ、 どうもとの かちだ！ また ちょうせんしな！')]);
      }
      K.hud();
      K.save();
    }
  }

  // じょうほうや（ちいきのかくしようそのヒントをうる）
  async function buyRumors(townName, list) {
    const g = G();
    while (true) {
      const items = list.map(r => {
        const bought = !!g.town.rumors[r.id];
        return {
          label: (bought ? '✓ ' : '') + r.title,
          sub: bought ? 'きいた うわさ' : `${r.price} G`,
          disabled: !bought && g.gold < r.price
        };
      });
      const c = await K.menu({ title: `${townName}の じょうほうや`, items, where: 'side' });
      if (c < 0) return;
      const r = list[c];
      if (!g.town.rumors[r.id]) {
        g.gold -= r.price;
        g.town.rumors[r.id] = 1;
        K.hud();
        K.save();
      }
      Music.sfx('ok');
      await K.say([nm('じょうほうや', r.text)]);
    }
  }

  // ---------------- 5. かくちょうのさかば・じょうほうやのデータ ----------------
  const BAR_RUMORS = {
    shiomi: [
      { id: 'rm_s1', title: 'やけあとの ひみつきんこ', price: 50,
        text: 'かじで やけた しちやの あとちな…… えんとつと くずれた かべの すきまに、 がんじょうな きんこが はさまっておる。 800ゴールドは ねむっとるぞ。' },
      { id: 'rm_s2', title: 'まんちょうの みつゆたる', price: 100,
        text: 'リョウの ふなつききばの さんばしの いたのした、 まんちょうの ときだけ さかなの つまった たるが ひっかかる。 まきえも てにいるぜ。' },
      { id: 'rm_s3', title: 'みさきの かくれいえ', price: 150,
        text: 'にしの みさきに たつ こやは、 むかし カイトが つかっていた ひみつの かんそくじょさ。 ひきだしを しらべりゃ、 こうかいにっしの きれはしが あるはずだ。' }
    ],
    minato: [
      { id: 'rm_m1', title: '３ばんそうこの やみいち', price: 100,
        text: 'にしの ３ばんそうこの おくの くずれた はこ…… どけると ほしのかけらと たいきんが かくされてる。 みまわりが いない すきに さがすこったな。' },
      { id: 'rm_m2', title: 'けいじばんの うらメニュー', price: 150,
        text: 'ギルドの けいじばんの うらがわを はがしてみな。 はきされた とくべつはいきゅうの がんばりくしが かくしてあるのさ。' },
      { id: 'rm_m3', title: 'サラムの おかねもちの つぼ', price: 200,
        text: 'ひがしの さばくの オアシス「サラム」にな、 すなに はんぶん うもれた おかねもちの やしきが ある。 きんの つぼに たいきんが のこされたままだ。' }
    ],
    kukuru: [
      { id: 'rm_c1', title: 'むおんの ふうりんの ひみつ', price: 150,
        text: 'ふうりんやの おくの はなれの のきさき…… ならない ふうりんを ゆらすと、 くもわたと てんじょうの シチューが こぼれおちてくるよ。' },
      { id: 'rm_c2', title: 'ふうしゃのしたの はぐるましつ', price: 200,
        text: 'にしの こじまハヤテの おおかぜくるま…… きその まるいしの したに ふるい はぐるましつが ある。 むかしの ほしの きろくばんが ねむっているらしい。' },
      { id: 'rm_c3', title: 'ソヨギやしきの まぼろしの ふしま', price: 300,
        text: 'ちょうろうやしきの うらの うんかいを よく みてごらん。 ふうぷで かっくうした さきに、 たからの ねむる ちいさな ふしまが かくされているぞ。' }
    ],
    awa: [
      { id: 'rm_a1', title: 'ひらかずの オウムかい', price: 200,
        text: 'さとの ひがしの サンゴの しげみに しずむ きょだいな オウムかい…… しおの みちひきの しゅんかんに、 なかから おおつぶの しんじゅが こぼれでる。' },
      { id: 'rm_a2', title: 'しんえんの ぼうれいふね', price: 300,
        text: 'きたの しんえんのみやの さけめ…… むかし しずんだ ふねの せんちょうしつに、 きんの いかりが いまも ねむっている。' },
      { id: 'rm_a3', title: 'しんかいさかばの たるそこ', price: 250,
        text: 'ここの さかばの あわさけの たるそこにな、 てんしゅが きゃくから くすねた しんじゅが かくしてあるのさ。 しらべてみな。' }
    ]
  };

  // ---------------- 6. NPCとターゲットはんていのとうごう ----------------

  // さかばマスター・じょうほうや NPC
  const BAR_NPCS = [
    { id: 'bar_shiomi', r: 0, x: -116, z: 56, nm: 'さかば「しおさい」マスター', fn: () => barMenu('しおさい', BAR_RUMORS.shiomi) },
    { id: 'bar_minato', r: 1, x: -8, z: 165, nm: 'さかば「なみしぶき」マスター', fn: () => barMenu('なみしぶき', BAR_RUMORS.minato) },
    { id: 'bar_kukuru', r: 2, x: 2, z: 76, nm: 'うんじょうさかば「てんしゅ」マスター', fn: () => barMenu('てんしゅ', BAR_RUMORS.kukuru) },
    { id: 'bar_awa', r: 3, x: 4, z: 132, nm: 'かいていさかば「うずしお」マスター', fn: () => barMenu('うずしお', BAR_RUMORS.awa) }
  ];

  const remap=(o)=>{
    let anchor=null,old=null;
    if(o.id.startsWith('s_')||o.id==='bar_shiomi'){anchor=K.shiomi;old=[-120,60];}
    if(o.id.startsWith('o_')){anchor=K.oasis;old=[120,60];}
    if(anchor){o.x+=anchor.x-old[0];o.z+=anchor.z-old[1];}
    return o;
  };
  HIDDEN_SPOTS.forEach(remap);BAR_NPCS.forEach(remap);
  // Extra caches complete the minimum five exploration sites in every main town.
  for(let r=0;r<4;r++)for(let i=0;i<5;i++){
    const t=K.REG[r].town;HIDDEN_SPOTS.push({id:'tw_cache_'+r+'_'+i,r,x:t.x+Math.cos(i*1.2)*18,z:t.z+Math.sin(i*1.2)*18,n:'ふるい たる',act:async()=>{K.gain(['mi','ishi','maki','pan','shizuku'][i],1);await K.say(['たるの なかに つかえる ものが あった。']);}});
  }
  function place(o,r){
    const old=World.region;World.setRegion(r);try{
      for(let d=0;d<32;d+=2)for(let i=0;i<24;i++){
        const x=o.x+Math.cos(i*Math.PI/12)*d,z=o.z+Math.sin(i*Math.PI/12)*d,y=K.surfaceAt(x,z,99),h=K.hAt(x,z);
        if(h<(r===2?4:.3)||Math.abs(y-h)>.5||K.blocked(x,z,y)||K.NPCS.some(n=>n.r===r&&Math.hypot(n.x-x,n.z-z)<3))continue;
        Object.assign(o,{x,z,y});return true;
      }
      return false;
    }finally{World.setRegion(old);}
  }
  for(const spot of HIDDEN_SPOTS){const h=BUILD_HOUSES.find(b=>spot.id.startsWith(b.h.id));if(h?.visible){spot.x=h.h.npc.x;spot.z=h.h.npc.z;}spot.visible=place(spot,spot.r);}
  const barMesh=World.makeMesh(World.human({skin:'#d9bb98',hair:'#493828',top:'#70473d',bottom:'#303d49'}),8);
  H.frame.push(()=>{barMesh.n=0;if(K.phase!=='field'||(K.B&&K.B.active))return;for(const n of BAR_NPCS)if(n.r===G().region&&n.visible&&distance(n,K.player)<75)barMesh.set(barMesh.n++,n.x,K.surfaceAt(n.x,n.z,99),n.z,1,n.yaw||0);});
  for (const n of BAR_NPCS) { n.visible=place(n,n.r);if(!n.visible)continue;
    n.yaw = 0; n.baseYaw = 0;
    K.NPCS.push(n);
  }

  // しらべるターゲットはんてい
  H.target.push((cand, r) => {
    if (K.phase !== 'field') return;
    const px = K.player.x, pz = K.player.z, py = K.player.y;

    // さかばNPC
    for (const b of BAR_NPCS) {
      if (b.visible && b.r === r && Math.hypot(b.x - px, b.z - pz) < 3.2) {
        cand(b, 'bar_npc', b.x, b.z, 2.5);
      }
    }

    // かくしスポット（みかいしゅうのもの）
    const found = G().town && G().town.hidden ? G().town.hidden : {};
    for (const s of HIDDEN_SPOTS) {
      if (s.visible && s.r === r && !found[s.id] && Math.hypot(s.x - px, s.z - pz) < 2.8 && Math.abs(py - s.y) < 2.5) {
        cand(s, 'hidden_spot', s.x, s.z, 2.4);
      }
    }
  });

  H.labels.bar_npc = t => `${t.o.nm}と はなす`;
  H.labels.hidden_spot = t => `${t.o.n}を しらべる`;

  H.acts.bar_npc = async n => {
    n.yaw = Math.atan2(K.player.x - n.x, K.player.z - n.z);
    Music.sfx('cursor');
    await n.fn();
  };

  H.acts.hidden_spot = async s => {
    const g = G();
    g.town = g.town || {};
    g.town.hidden = g.town.hidden || {};
    initialize(g);if(g.town.hidden[s.id])return;g.town.hidden[s.id] = 1;
    if(!g.flags.tw_hid.includes(s.id))g.flags.tw_hid.push(s.id);
    Music.sfx('friend');
    await s.act();
    K.save();
    K.hud();
  };

  H.target.push((cand,r)=>{for(const b of BUILD_HOUSES)if(b.visible&&b.r===r)cand(b,'tw_house',b.h.npc.x,b.h.npc.z,3);});
  H.labels.tw_house=()=> 'わけありの いえを しらべる';
  H.acts.tw_house=async b=>{
    initialize(G());const f=G().flags,key='tw_'+b.h.id,heard=Object.keys(f.tw_heard).filter(id=>f.tw_heard[id]===b.r).length;
    f[key]=Math.max(f[key]||0,1);
    if(heard<3)await K.say(['ここには だれかの ひみつが ありそうだ。','まちの ひとから うわさを 3つ あつめよう。']);
    else {f[key]=3;G().town.unlocked[b.h.id]=1;await K.say([K.nm('いえの もちぬし','うわさを きいて きたんだね。 この いえに のこした ものを、ずっと だれにも はなせなかった。'), 'ひみつの いえの はなしを きいた。 ほんぺんの ものがたりは まだ つづいている。']);}
    K.save();
  };
  K.townFeature={houses:BUILD_HOUSES,spots:HIDDEN_SPOTS,bars:BAR_NPCS,initialize,playDice,barMenu,hear:row=>{initialize(G());G().flags.tw_heard[row.id]=row.r;K.save();}};
})();