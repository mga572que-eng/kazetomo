// ダンジョンの 区切りと ごほうびの 演出 — 面白さ部署 ④（docs/design/fun-audit.md）
// ・入口で 名前と ひとことの 見出し（試練の祠・灯の樹の 内部）
// ・入ってから 頂上／証の台までの 時間を はかり、金・銀・銅の メダル。いちばんの 記録を のこす
// ・クリアの とき、宝箱と 同じ「光の 演出」で メダルを 見せる
// セーブ：G.records（祠・灯の樹ごとの いちばんの 時間と メダル）だけ 追加。中身・進行は かえない
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK, G = () => K.G;
  const SH = { push: '力より 知恵を', brazier: '灯は 小さき ものから', dash: '風より はやく', climb: '自分の 手で きずけ', combat: '心を しずめて たたかえ', rings: '空の 輪を くぐれ', memory: '光を おぼえよ' };
  const css = document.createElement('style'); css.textContent = `
  #dgx{position:fixed;left:0;right:0;top:22%;z-index:56;text-align:center;pointer-events:none;opacity:0;transition:opacity .5s}
  #dgx.on{opacity:1}#dgx .k{font-size:clamp(12px,2.6vh,16px);letter-spacing:.4em;color:#bfe4ff;text-shadow:0 0 10px #2a6aff}
  #dgx .n{font-size:clamp(24px,7vh,44px);font-weight:900;color:#fff;letter-spacing:.12em;text-shadow:0 0 16px #4a9aff,0 2px 0 #000;margin:4px 0}
  #dgx .e{font-size:clamp(12px,2.8vh,17px);color:#e8f4ff;letter-spacing:.25em;opacity:.9}
  #dgx .ln{width:min(60vw,420px);height:2px;margin:6px auto;background:linear-gradient(90deg,transparent,#7ac8ff,transparent)}`; document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'dgx'; document.body.appendChild(el);
  const now = () => (G().play || 0);
  async function title(kind, name, epi) { el.innerHTML = `<div class="k">${kind}</div><div class="ln"></div><div class="n">${name}</div><div class="e">${epi || ''}</div><div class="ln"></div>`; el.classList.add('on'); try { Music.sfx('sparkle'); } catch (_) {} await new Promise(r => setTimeout(r, 1900)); el.classList.remove('on'); }
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const medalOf = (s, par) => s <= par[0] ? ['金', 'legend'] : s <= par[1] ? ['銀', 'rare'] : ['銅', 'common'];
  const timers = {};
  async function finish(id, name, par) { const t0 = timers[id]; if (t0 == null) return; const s = Math.max(1, now() - t0); delete timers[id]; const g = G(); g.records = g.records || {}; const prev = g.records[id];
    const [m, r] = medalOf(s, par); const best = !prev || s < prev.t; if (best) g.records[id] = { t: Math.round(s), m };
    if (K.fun && K.fun.reveal) await K.fun.reveal(r, `${m}メダル！ ${fmt(s)}`, best && prev ? `記録 更新（前は ${fmt(prev.t)}）` : `${name}（金 ${fmt(par[0])}／銀 ${fmt(par[1])} まで）`);
    K.save(); }
  // 試練の祠
  const PAR_SH = [60, 150];
  const pg = H.acts.shgate; if (pg) H.acts.shgate = async sh => { const first = !((G().shrineDone || {})[sh.id]) && timers['sh:' + sh.id] == null; if (first) { await title('試練の祠', sh.name, SH[sh.kind] || ''); timers['sh:' + sh.id] = now(); } return pg(sh); };
  const pgo = H.acts.shgoal; if (pgo) H.acts.shgoal = async sh => { const was = !!((G().shrineDone || {})[sh.id]); await pgo(sh); if (!was && (G().shrineDone || {})[sh.id]) await finish('sh:' + sh.id, sh.name, PAR_SH); };
  // 灯の樹の 内部
  const PAR_LH = [120, 240];
  const lhKey = d => 'lh:' + (d.key || d.id || d.i || d.name);
  const snap = () => JSON.stringify(G().lhDun || {});
  const pin = H.acts.lhdIn; if (pin) H.acts.lhdIn = async d => { const p = K.player, x0 = p.x, z0 = p.z; await pin(d); const moved = Math.hypot(p.x - x0, p.z - z0) > 20; // 「入る」を えらんで 中へ うつった ときだけ
    if (d && moved) { timers[lhKey(d)] = now(); await title('灯の樹の 内部', d.name || '灯の樹', '光を 頂へ'); } };
  const pgl = H.acts.lhdGoal; if (pgl) H.acts.lhdGoal = async d => { const s0 = snap(); await pgl(d); if (snap() !== s0) await finish(lhKey(d), d.name || '灯の樹', PAR_LH); };
  H.load.push(g => { g.records = g.records || {}; for (const k in timers) delete timers[k]; });
  K.dungeonFx = { title, finish, timers };
})();
