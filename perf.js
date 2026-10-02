// 重さの 計測 — 品質プラン B（docs/plan/quality-plan.md）
// ・アドレスの 最後に #perf を つけて 開くと、左上に fps・ブロック数・描画の 呼び出し数・町の 人数を 出す
// ・場所（町・フィールド・戦闘・家の中）ごとに 平均と いちばん 低い fps を 記録 → メニュー「重さの きろく」で 表に して 見られる（iPhone テスト用）
// セーブには 何も 足さない（記録は 開いている 間だけ。sessionStorage に 写しを のこす）
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK;
  const on = /perf/.test(location.hash) || (() => { try { return sessionStorage.getItem('kz-perf') === '1'; } catch (_) { return false; } })();
  if (!on) return; try { sessionStorage.setItem('kz-perf', '1'); } catch (_) {}
  const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:6px;top:6px;z-index:80;font:11px/1.3 monospace;color:#9f9;background:rgba(0,0,0,.55);padding:3px 6px;border-radius:6px;pointer-events:none;white-space:pre';
  document.body.appendChild(box);
  const LOG = {}; let fr = 0, acc = 0, last = performance.now(), cur = 0;
  const area = () => { const g = K.G; if (!g) return '—'; if (K.B && K.B.active) return '戦闘'; if (K.interior && K.interior.cur) return '家の中';
    if (K.townHere) { const t = K.townHere(); if (t) return t.name; } return ['風灯の島', '霧の大陸', '天空の浮島', '海の底'][g.region] + '（外）'; };
  H.frame.push(() => { fr++; const t = performance.now(); acc += t - last; last = t; if (acc < 500) return; cur = fr * 1000 / acc; fr = 0; acc = 0;
    const s = World.stats ? World.stats() : {}; const a = area(); const L = LOG[a] = LOG[a] || { n: 0, sum: 0, min: 999 }; L.n++; L.sum += cur; L.min = Math.min(L.min, cur);
    const ppl = K.townLife ? K.townLife.people.filter(p => p.npc && p.npc.placed && !p.npc.indoor && p.town.r === (K.G && K.G.region)).length : 0;
    box.textContent = `${cur.toFixed(0)} fps  ${a}\nブロック ${s.blocks}  描画 ${s.calls}回/${s.inst}体  人 ${ppl}`; box.style.color = cur < 20 ? '#f88' : cur < 30 ? '#ff8' : '#9f9';
    try { sessionStorage.setItem('kz-perf-log', JSON.stringify(LOG)); } catch (_) {} });
  const report = () => Object.entries(LOG).map(([a, L]) => ({ a, avg: Math.round(L.sum / L.n), min: Math.round(L.min), n: L.n })).sort((x, y) => x.avg - y.avg);
  H.menu.push(() => ({ label: '重さの きろく', sub: '場所ごとの fps（#perf）', fn: async () => { const R = report();
    await K.panel(`<h3>重さの きろく</h3><p style="font-size:.85em;opacity:.8">20 未満は 赤、30 未満は 黄。この 表を スクショして 送ってください。</p><table style="margin:0 auto;font-size:.9em">${R.map(r => `<tr><td style="padding:2px 10px;text-align:left">${r.a}</td><td style="padding:2px 10px;color:${r.avg < 20 ? '#f88' : r.avg < 30 ? '#ff8' : '#9f9'}">平均 ${r.avg}</td><td style="padding:2px 10px">最低 ${r.min}</td></tr>`).join('')}</table>`); } }));
  K.perf = { report, LOG };
})();
