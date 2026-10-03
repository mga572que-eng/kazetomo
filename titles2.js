// 称号の 追加（新しい 遊び：しらべもの・花・家・新しい町・道場・灯の樹・伏線・カジノ）
// 中身：Gemini（AI Studio・G-D）→ Claude が 照合（docs/design/titles2.md）。判定は 既存の 称号の しくみ（life.js の DATA.titles）に のせる
// セーブ：G.stat（花・スロット・ハイ＆ロー・道場の 回数）と G.housesIn（入った 家）だけ 追加
'use strict';
(() => {
  const K = window.KZ; if (!K || !DATA.titles) return; const H = K.HOOK;
  const T = [{"id": "t_searched20", "name": "すみの たんけんたい", "desc": "タンスや ツボを 20か所 しらべる", "cond": {"key": "searched", "op": ">=", "n": 20}}, {"id": "t_searched50", "name": "おたから みっけ", "desc": "タンスや ツボを 50か所 しらべる", "cond": {"key": "searched", "op": ">=", "n": 50}}, {"id": "t_harvest30", "name": "みどりの 手", "desc": "花や やくそうを 30かい つみとる", "cond": {"key": "harvest", "op": ">=", "n": 30}}, {"id": "t_houses15", "name": "ご近所めぐり", "desc": "まちの いえに 15けん 入る", "cond": {"key": "houses", "op": ">=", "n": 15}}, {"id": "t_town_royal", "name": "おしろの おきゃく", "desc": "王都 ルミナリアを おとずれる", "cond": {"key": "town", "op": "has", "v": "royal"}}, {"id": "t_town_all", "name": "みつ星の たびびと", "desc": "３つの 新しい まちを すべて おとずれる", "cond": {"key": "town", "op": "all"}}, {"id": "t_dojowin5", "name": "けいこ生", "desc": "道場の けいこ試合で 5かい かつ", "cond": {"key": "dojoWin", "op": ">=", "n": 5}}, {"id": "t_dojowin15", "name": "いっぽんの こころ", "desc": "道場の けいこ試合で 15かい かつ", "cond": {"key": "dojoWin", "op": ">=", "n": 15}}, {"id": "t_lhdun1", "name": "らせんかいだん", "desc": "灯の樹の なかを 1かしょ こえる", "cond": {"key": "lhDun", "op": ">=", "n": 1}}, {"id": "t_payoff3", "name": "きおくの かけら", "desc": "ふくせんの 場面を 3つ 見る", "cond": {"key": "payoff", "op": ">=", "n": 3}}, {"id": "t_payoff5", "name": "つむがれた 糸", "desc": "すべての ふくせんの 場面を 見とどける", "cond": {"key": "payoff", "op": ">=", "n": 5}}, {"id": "t_hilostreak3", "name": "カードの よみて", "desc": "ハイ＆ローで 3れんしょうする", "cond": {"key": "hiloStreak", "op": ">=", "n": 3}}, {"id": "t_dicewin5", "name": "ころころフレンズ", "desc": "ダイスで 5かい かつ", "cond": {"key": "diceWin", "op": ">=", "n": 5}}, {"id": "t_slotwin10", "name": "絵あわせの えがお", "desc": "スロットで 10かい あたりを 出す", "cond": {"key": "slotWin", "op": ">=", "n": 10}}];
  const NT = ['royal', 'lucky', 'brave'];
  const val = (G, key) => { const s = G.stat || {}; switch (key) {
    case 'searched': return Object.keys(G.searched || {}).length; case 'houses': return Object.keys(G.housesIn || {}).length;
    case 'payoff': return Object.keys(G.flags || {}).filter(k => k.startsWith('fs_fs_') && G.flags[k]).length; case 'lhDun': return Object.keys(G.lhDun || {}).length;
    case 'diceWin': return (G.town && G.town.diceWins) || 0; case 'gold': return G.gold || 0; default: return s[key] || 0; } };
  const ok = c => G => c.key === 'town' ? (c.op === 'all' ? NT.every(k => G.flags && G.flags['nt_' + k]) : !!(G.flags && G.flags['nt_' + c.v])) : val(G, c.key) >= c.n;
  for (const t of T) if (!DATA.titles.some(x => x.id === t.id)) DATA.titles.push({ id: t.id, name: t.name, desc: t.desc, ok: ok(t.cond) });
  K.stat = (key, d = 1, mode) => { const G = K.G; G.stat = G.stat || {}; if (mode === 'max') G.stat[key] = Math.max(G.stat[key] || 0, d); else G.stat[key] = (G.stat[key] || 0) + d; };
  H.load.push(G => { G.stat = G.stat || {}; G.housesIn = G.housesIn || {}; });
})();
