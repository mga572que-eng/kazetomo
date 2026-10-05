// 仲間の 新しい 会話（2026-10-05）：上位職・新しい 部屋・ボスの 間・家の お使い・ふだんの 掛けあい
// ・talk.js の K.partyTalk.register に 足すだけ（既存の 会話・既読は そのまま）。新しい 過去・家族・事件は 足さない
'use strict';
(() => { const K = window.KZ; if (!K || !K.partyTalk || !K.partyTalk.register) return; const w = K.who, G = () => K.G;
  const F = () => G().flags || {}, jobLv = (id, j) => { try { const r = K.jobOf(id); return (r && r.lv && r.lv[j]) || 1; } catch (e) { return 1; } };
  const upOpen = id => (DATA.jobs || []).some(j => j.up && jobLv(id, j.up) >= 10);
  const dun = k => !!((G().bossDun || {})[k]);
  const anyDun = () => Object.keys(G().bossDun || {}).length > 0;
  const E = [
    // ---- 上位職 ----
    { id: 'cl_up_sora', c: 'sora', cond: () => upOpen('sora'), t: [w('sora', 'surprised', 'ねえ、 石像の 台座が いつもより 光ってる。 あたらしい 職業に なれるって。'), w('mio', 'smile', 'それだけ たくさん 歩いて きたんだね、 ソラ。')] },
    { id: 'cl_up_riku', c: 'riku', cond: () => upOpen('riku'), t: [w('riku', 'smirk', '上の 職業、か。 ……強く なるのに 近道は ねえってことだな。'), w('sora', 'grin', 'リクが それ 言うと 説得力 あるね。')] },
    { id: 'cl_up_sana', c: 'sana', cond: () => upOpen('sana'), t: [w('sana', 'determined', '星の 数を おぼえるのと 同じです。 一つずつ つみかさねれば、 ちゃんと 届きます。')] },
    { id: 'cl_up_haru', c: 'haru', cond: () => upOpen('haru'), t: [w('haru', 'joy', 'わあ、 あたらしい 技の 名前、 風みたいに かっこいい！ はやく ためしたいな。')] },
    { id: 'cl_auto', c: 'mio', cond: () => !!G().auto, t: [w('mio', 'smile', 'おまかせの ときは、 もう たおれそうな まものに 大きな 技を つかわないように してるの。'), w('sora', 'neutral', 'MPを むだに しないんだね。 たすかる。')] },
    // ---- 新しい 部屋 ----
    { id: 'cl_ruins_star', c: 'sana', cond: () => (F().ruinsStar || 0) >= 2, t: [w('sana', 'smile', '遺跡の 星見の台……。 むかしの 人も、 あそこから 同じ 星を 見ていたんですね。')] },
    { id: 'cl_tower_star', c: 'haru', cond: () => (F().towerStars || 0) >= 2, t: [w('haru', 'surprised', '塔の 中の 星座の 床、 ちゃんと つながったね！'), w('sana', 'smile', '線を たどると、 迷わずに すみます。 星の 道しるべ です。')] },
    { id: 'cl_palace_tide', c: 'kaito', cond: () => (F().palaceTide || 0) >= 2, t: [w('kaito', 'smile', '潮の 流れは 逆らうより、 読む ものだ。 ……よく 見きわめたな。')] },
    // ---- ボスの 間 ----
    { id: 'cl_dun_first', c: 'sora', cond: () => anyDun(), t: [w('sora', 'determined', '番人の いる 場所って、 どこも 奥に しかけが あるんだね。'), w('riku', 'smirk', '近づかせたく ねえんだろ。 ……だったら なおさら 行くしか ねえ。')] },
    { id: 'cl_dun_crumble', c: 'mio', cond: () => dun('t2') || dun('ab'), t: [w('mio', 'worried', 'くずれる 床、 ほんとに こわかった……。 一度 ふんだら もどれないんだもん。'), w('sora', 'smile', 'でも 順番を 考えたら、 ちゃんと 向こうまで 行けたよ。')] },
    { id: 'cl_dun_mirror', c: 'sana', cond: () => dun('t3') || dun('c2'), t: [w('sana', 'determined', 'かがみの しかけは、 光の 気持ちに なって 考えると わかります。'), w('haru', 'surprised', '光の 気持ち……？')] },
    { id: 'cl_dun_lever', c: 'riku', cond: () => dun('w1') || dun('c0'), t: [w('riku', 'angry', 'まんなかの レバー、 両どなりまで 動きやがる。 性格の 悪い しかけだぜ。'), w('mio', 'smile', 'でも リク、 ちゃんと 解けたじゃない。')] },
    { id: 'cl_dun_view', c: 'haru', cond: () => anyDun(), t: [w('haru', 'neutral', 'ダンジョンの 中は、 自分の 目で 見てるみたいに 近く 感じるね。'), w('sora', 'determined', 'うん。 足もとまで よく 見える。')] },
    // ---- 家の お使い・家の 人 ----
    { id: 'cl_errand', c: 'mio', cond: () => (G().errandsDone || 0) >= 1, t: [w('mio', 'joy', 'お使い、 すごく よろこんで もらえたね！'), w('sora', 'smile', '家の 人たち、 みんな それぞれ くらしが あるんだなあ。')] },
    { id: 'cl_errand3', c: 'kaito', cond: () => (G().errandsDone || 0) >= 3, t: [w('kaito', 'smile', '頼まれごとを きちんと 果たす。 灯守りの 仕事と 同じだ。')] },
    { id: 'cl_home', c: 'riku', cond: () => Object.keys(G().housesIn || {}).length >= 3, t: [w('riku', 'smirk', 'よその 家に あがりこむのも、 だいぶ 慣れたな。'), w('sora', 'grin', 'ちゃんと「おじゃまします」って 言ってるよ。')] },
    // ---- ふだんの 掛けあい ----
    { id: 'cl_pair_sm', c: 'sora', cond: (g, r) => r === 0 && F().cleared, t: [w('sora', 'smile', '村の 灯が ぜんぶ ともってから、 夜の 散歩が 楽しく なったね。'), w('mio', 'joy', 'うん！ 海の 上まで 光が とどいてるの。')] },
    { id: 'cl_pair_rk', c: 'riku', cond: (g, r) => r === 1, t: [w('riku', 'neutral', '霧の大陸は 道が 広い。 迷ったら 地図を 見ろよ、 甘ちゃん。'), w('sora', 'angry', 'もう 甘ちゃんじゃ ないってば！')] },
    { id: 'cl_pair_hs', c: 'haru', cond: (g, r) => r === 2, t: [w('haru', 'joy', '雲の 上は 風が きもちいいね！'), w('sana', 'smile', '星も 近くて、 夜は ほんとうに きれいです。')] },
    { id: 'cl_pair_ks', c: 'kaito', cond: (g, r) => r === 3, t: [w('kaito', 'neutral', '海の 底でも 灯は とどく。 ……ソラ、 足もとに 気を つけろ。'), w('sora', 'smile', 'うん、 父さんも ね。')] },
    { id: 'cl_pair_ms', c: 'mio', cond: (g, r) => r === 1 && F().c2done, t: [w('mio', 'smile', 'サナちゃん、 星の 話を もっと 聞かせて！'), w('sana', 'joy', 'はい！ きょうは 北の 空の 星座の 話を しましょう。')] },
    { id: 'cl_pair_rh', c: 'riku', cond: (g, r) => r === 2 && F().c3done, t: [w('riku', 'smirk', 'ハル、 その 扇で おれの 槍より 先に 決めるの やめろ。'), w('haru', 'grin', 'えへへ、 風の ほうが はやいんだもん。')] },
  ];
  K.partyTalk.register(E);
})();
