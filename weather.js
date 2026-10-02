// 天気（雨・霧）— 地方ごとに 4分ごと（ゲーム内 半日）に かわる。セーブには 何も 足さない（あそんだ 時間から 決まる）
// ・雨：画面に 雨すじ・すこし 暗く。町の 人は 半分が 雨宿り（宿・酒場の 軒下）、のこりは 傘を さして 歩く。子どもは 家へ。花だんは 雨で 水やり ずみに なる
// ・霧：白く かすむ（空の 島で 多い）
// ・海の底は 天気なし。砂漠の 上では 雨が ふらない
// ・設定 HOOK.OPT.weather === false で 止まる
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK;
  const RATE = [{ rain: .2, fog: .08 }, { rain: .16, fog: .06 }, { rain: .06, fog: .22 }, { rain: 0, fog: 0 }];
  const hash = n => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
  const slot = () => Math.floor(((K.G && K.G.play) || 0) / 240);
  function kind(r, s = slot()) { if (H.OPT && H.OPT.weather === false) return 'clear'; const R = RATE[r] || RATE[0], v = hash(s * 7 + r * 131 + 3); return v < R.rain ? 'rain' : v < R.rain + R.fog ? 'fog' : 'clear'; }
  const desert = () => { try { return World.biomeAt(K.player.x, K.player.z) === 'desert'; } catch (_) { return false; } };
  const now = (r = K.G ? K.G.region : 0) => { const k = kind(r); return k === 'rain' && r === K.G.region && desert() ? 'clear' : k; };
  // 画面の 雨と 霧（CSS だけ・軽い）
  const css = document.createElement('style'); css.textContent = `
    #wx{position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;transition:opacity 2.5s}
    #wx.rain{opacity:1;background:linear-gradient(rgba(40,55,75,.28),rgba(40,55,75,.18))}
    #wx.rain::before{content:'';position:absolute;inset:-50% 0 0 0;background-image:repeating-linear-gradient(100deg,rgba(210,225,255,.0) 0 18px,rgba(210,225,255,.28) 18px 19px,rgba(210,225,255,0) 19px 46px);background-size:100% 160px;animation:wxr .45s linear infinite}
    #wx.rain::after{content:'';position:absolute;inset:-50% 0 0 0;background-image:repeating-linear-gradient(97deg,rgba(220,235,255,0) 0 31px,rgba(220,235,255,.2) 31px 32px,rgba(220,235,255,0) 32px 70px);background-size:100% 230px;animation:wxr .7s linear infinite}
    #wx.fog{opacity:1;background:radial-gradient(ellipse at 50% 60%,rgba(235,240,245,.08),rgba(235,240,245,.55))}
    @keyframes wxr{from{transform:translateY(0)}to{transform:translateY(50%)}}
    body:not(.infield) #wx,body.inbattle #wx{opacity:0!important}`; document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'wx'; document.body.appendChild(el);
  let last = null;
  H.frame.push(() => { if (K.phase !== 'field' || !K.G) return; const r = K.G.region, w = now(r);
    const calm = H.OPT && H.OPT.calm; el.className = w === 'clear' ? '' : w + (calm ? ' calm' : '');
    if (last !== null && w !== last) K.toast(w === 'rain' ? '☔ 雨が ふってきた' : w === 'fog' ? '🌫 霧が 出てきた' : last === 'rain' ? '☀ 雨が やんだ' : '☀ 霧が はれた', 1600);
    last = w;
    // 雨の 地方にある 屋外花だんだけ。時刻0も 有効な 水やり記録。
    if (w === 'rain' && K.interior && K.townLife) {
      K.G.garden = K.G.garden || {};
      for (const t of K.townLife.TOWNS) {
        if (t.r !== r) continue;
        for (const o of K.interior.outside[t.key] || []) {
          if (o.kind !== 'garden') continue;
          const s = K.G.garden[o.key];
          if (!s || !Number.isFinite(s.w)) K.G.garden[o.key] = { w: K.G.play || 0 };
        }
      }
    } }); // 雨は 花だんに 水やり（つぎに さく）
  // 雨の日の セリフ（G-F で ふやす）。町の key ごとに 配列。住人に 話しかけた とき 雨なら 半分くらい これを 言う
  // 雨の日の セリフ（Gemini G-F → Claude が 照合。docs/design/town-life.md 6章）
  const LINES = {"kazami": ["あめの おとは、 やねを たたく こもりうたみたい", "はたけの やさいが、 ごくごく 水を のんでるよ", "あめあがりには、 きれいな にじが かかるんだ", "ぬれた くさむらには、 ワタポコが あつまるのさ", "きょうは おせんたくも おやすみ。 おうちで のんびり", "みさきの あめは、 うみと そらを ひとつに するね"], "shiomi": ["やけた つちの においを、 あめが ながしてくれるよ", "あめの ひは、 いえの たてなおしも ひとやすみさ", "はいが ながれて、 まちが すこし きれいになったね", "あめの ひの つりは、 すずしくて よく つれるんだ", "あまもりする 屋根を、 いそいで なおさなきゃ！", "あめが ふれば、 もう かじの しんぱいは ないね"], "minato": ["あめで でせんが のびたから、 さかばは おおにぎわいさ", "いしだたみに あかりが うつって、 なんだか ロマンチック", "たいせつな にもつに、 あまよけの シートを かけなきゃ", "あめの うみは けむって、 ふねの かじ取りが たいへんだ", "こんな ひは、 あったかい さかなじるが いちばんだね", "みなとの カモメたちも、 のきしたで あまやどり中さ"], "oasis": ["あめだ！ あめが ふったぞ！ さばくの めぐみだ！", "水がめを ぜんぶ 出せ！ いっぱいに ためるんだ！", "すなの うえに あめが しみこんで、 あまい においがする", "めずらしい あめだ。 こんやは おまつりに しよう！", "サボテンたちが、 うれしそうに うでを のばしてるよ", "あめを みられるなんて、 あんたは ラッキーな たびびとだ"], "kukuru": ["雲の うえでも あめは ふるの。 しっとり ふわふわよ", "あめを すった 雲わたは、 いつもより ちょっぴり おもい", "しずくを ふくんだ ふうりんが、 とくべつな 音で なったわ", "あめの ひの 雲ちゃは、 こくが あって おいしいの", "あま雲が ちかすぎて、 てを のばせば つかめそうだよ", "あめの ひは、 とりたちも 雲の すみかで あまやどり"], "hayate": ["あめの ひの かぜは、 ひんやりして 肌に きもちいいね", "ふうしゃの はねが、 あめ粒を まきちらして まわってるよ", "あめと かぜが つよいから、 とばされないように 気をつけて", "雨水で ひいた こむぎこは、 しっとり もちもちさ", "たこあげは できないけど、 水たまりで あそぶのも すき！", "あめの おとと ふうしゃの おとが、 がっそう してるみたい"], "royal": ["せかいかいぎの ぎいんたちも、 あめ宿りしながら 議論中さ", "きぬの かさを さした きぞくたちが、 おしろへ むかうよ", "えいへいさん、 あめの なかも ピシッと たってて えらいね", "おしろの 屋根に あたる あめの おと、 すてきだな", "かいぎの ひが あめだと、 なんだか おちついて 話せるね", "王都の おおどおりの 水たまりに、 おしろが うつってるよ"], "lucky": ["あめが ふってきた！ カジノの なかで あそんで いこう！", "あめの ひは、 スロットの すずの おとが よく ひびくね", "ぬれた いしだたみに、 にじいろの かざりが うつってるよ", "やねの ない カジノも、 あめの 日は ちょっぴり すずしいね", "あめの ひの ダイス勝負は、 いつもと ちがう 目が でるかも", "あめ宿りついでに、 ひとあそび していかないかい？"], "brave": ["あめの ひは どうじょうで、 からだを きたえる チャンスだ", "ぬれた つるぎや よろいは、 ちゃんと ふいて さびどめさ", "あめの たびだちも わるくない。 こころが 引きしまるよ", "ぬかるんだ どうじょうの にわを、 ならして おかなきゃ", "あめが あがったら、 すぐ ぼうけんに でられるように じゅんび！", "あめの ひの けいこは、 あしが すべるから 気をつけろよ"]};
  // 住人に 話しかけた とき、雨なら 半分くらい 雨の 日の セリフ（店番・王さまなど 決まった 用事の ある 人は そのまま）
  let wrapped = false;
  H.frame.push(() => { if (wrapped || !K.townLife || !K.townLife.people.length) return; wrapped = true;
    for (const p of K.townLife.people) { if (p.role === 'fixed') continue; const id = p.id, prev = H.talks[id]; if (!prev) continue;
      H.talks[id] = async (...a) => { const L = LINES[p.town.key]; if (L && L.length && now(p.town.r) === 'rain' && Math.random() < .5) { const n = p.npc || {}; await K.say([K.nm(n.nm || (p.row && p.row.nm) || '町の 人', L[Math.floor(Math.random() * L.length)])]); return; } return prev(...a); }; } });
  K.weather = { now, kind, rain: r => now(r) === 'rain', fog: r => now(r) === 'fog', LINES };
})();
