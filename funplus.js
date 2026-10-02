// 面白さ部署 ⑤⑦（docs/design/fun-audit.md）
// ⑤ 戦いの 評価：勝ったとき S・A・B。S＝だれも ほとんど ケガを しない・すばやく 勝つ → お金 +30%、A＝ケガ 2割未満 → +10%。スタンプで 見せる
// ⑦ 道場の 段位：けいこ試合に 勝つたびに 段が 上がる（初段〜十段）。段が 上がるほど 相手が 強く、ごほうびも ふえる。3・6・10段で 特別な 品
// セーブ：G.stat.dojoWin（既存）だけ 使う。戦いの 評価は 記録しない（その場の ごほうび）
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK, G = () => K.G;
  const css = document.createElement('style'); css.textContent = `
  #brk{position:fixed;right:9%;top:16%;z-index:56;pointer-events:none;font-weight:900;font-size:clamp(54px,18vh,110px);line-height:1;color:#fff;opacity:0;transform:scale(2.4) rotate(-14deg);transition:all .32s cubic-bezier(.2,1.6,.4,1);text-shadow:0 0 0 #000}
  #brk.on{opacity:1;transform:scale(1) rotate(-10deg)}#brk small{display:block;font-size:.2em;letter-spacing:.2em;text-align:center}
  #brk.S{color:#ffd24a;text-shadow:0 0 18px #ff9a2a,0 4px 0 #6a3a00}#brk.A{color:#7ac8ff;text-shadow:0 0 14px #2a7aff,0 4px 0 #0a2a5a}#brk.B{color:#d8d8d8;text-shadow:0 4px 0 #333}`; document.head.appendChild(css);
  const st = document.createElement('div'); st.id = 'brk'; document.body.appendChild(st);
  // ---------- ⑤ 戦いの 評価 ----------
  let snap = null, was = false;
  // 戦闘画面が 出た 瞬間に 味方の HPを 記録（戦闘中は フィールドの フレームが 回らないので、画面の 表示で 知る）
  const take = () => { const B = K.B; if (B && B.P && B.P.length) snap = { t: performance.now(), hp: B.P.reduce((s, m) => s + Math.max(0, m.hp), 0), max: B.P.reduce((s, m) => s + (m.st ? m.st.hp : 0), 0), F: (B.F || []).slice() }; };
  const bt = document.getElementById('battle'); if (bt) new MutationObserver(() => { const a = !bt.hidden; if (a && !was) setTimeout(take, 0); was = a; }).observe(bt, { attributes: true, attributeFilter: ['hidden'] });
  H.battleEnd.push(async (res, specs, opts, P) => { const s = snap; snap = null; if (res !== 'win' || !s || !P) return;
    const lost = Math.max(0, s.hp - P.reduce((a, m) => a + Math.max(0, m.hp), 0)) / Math.max(1, s.max), sec = (performance.now() - s.t) / 1000 * ((G().speed) || 1);
    const rank = lost < .05 && sec < 40 ? 'S' : lost < .2 ? 'A' : 'B'; const gold = s.F.reduce((a, f) => a + (f.gold || 0), 0), bonus = Math.round(gold * (rank === 'S' ? .3 : rank === 'A' ? .1 : 0));
    if (bonus) { G().gold += bonus; K.hud(); }
    st.className = rank; st.innerHTML = `${rank}<small>${bonus ? `+${bonus}G` : 'ランク'}</small>`; void st.offsetWidth; st.classList.add('on'); try { Music.sfx(rank === 'S' ? 'crit' : 'stamp'); } catch (_) {}
    setTimeout(() => st.classList.remove('on'), 1300); });
  // ---------- ⑦ 道場の 段位 ----------
  const DAN = ['見習い', '初段', '二段', '三段', '四段', '五段', '六段', '七段', '八段', '九段', '十段'];
  const PRIZE = { 3: { give: { ganbari: 3 }, t: 'がんばり串 3こ' }, 6: { give: { hoshikake: 2 }, t: '星のかけら 2こ' }, 10: { give: { stew: 2 }, t: '星のシチュー 2こ と 称号「ブレイブ 十段」' } };
  if (DATA.titles && !DATA.titles.some(t => t.id === 't_dojo10')) DATA.titles.push({ id: 't_dojo10', name: 'ブレイブ 十段', desc: '道場で 十段に なる', ok: g => ((g.stat || {}).dojoWin || 0) >= 10 });
  const NM = (n, t) => K.nm(n, t);
  async function dojo() { const win = (G().stat || {}).dojoWin || 0, dan = Math.min(10, win), next = Math.min(10, dan + 1);
    const c = await K.menu({ title: `道場（いま：${DAN[dan]}）`, items: [{ label: dan >= 10 ? '師範と 手合わせ（十段の 腕だめし）' : `${DAN[next]}の 試験（3連戦）`, sub: `にげられない・相手の 強さ ＋${dan}` }, { label: '話を きく' }], where: 'side' });
    if (c === 1) { await K.say([NM('道場の 師範', dan >= 10 ? 'もう 教える ことは ない。 ……だが、腕は にぶらせるなよ。' : `いまは ${DAN[dan]}。 つぎは ${DAN[next]}だ。 一歩ずつ だ。`)]); return; } if (c !== 0) return;
    const lv = Math.max(...G().party.map(m => m.lv)) + dan; const pool = DATA.speciesOrder.filter(k => { const s = DATA.species[k]; return s && s.hab && !s.boss && !s.legend; });
    for (let w = 0; w < 3; w++) { await K.say([NM('道場の 師範', `${w + 1}本め！ はじめ！`)]); const res = await K.runBattle(Array.from({ length: 2 + (w > 1 ? 1 : 0) + (dan >= 6 ? 1 : 0) }, () => ({ sp: pool[Math.floor(Math.random() * pool.length)], lv: lv - 1 + w, shiny: false })), { noFlee: true });
      if (res !== 'win') { await K.say([NM('道場の 師範', 'よく やった。 また 来なさい。')]); return; } }
    const gold = 300 + lv * 10 + dan * 60; G().gold += gold; if (K.stat) K.stat('dojoWin'); const nd = Math.min(10, ((G().stat || {}).dojoWin || 0)); const L = [NM('道場の 師範', nd > dan ? `みごと！ きょうから ${DAN[nd]}だ！` : 'みごと！ 十段の 名に はじない。'), `${gold}ゴールドを 手に入れた！`];
    const p = nd > dan && PRIZE[nd]; if (p) { for (const [k, v] of Object.entries(p.give)) K.gain(k, v); L.push(`段位の あかしに ${p.t}を 手に入れた！`); }
    try { Music.jingle('levelup'); } catch (_) {} await K.say(L); K.hud(); K.save(); }
  let wired = false;
  H.frame.push(() => { if (wired || !K.townLife || !K.townLife.people.length) return; wired = true; const p = K.townLife.people.find(q => q.town.key === 'brave' && q.npc && q.npc.nm === '道場の 師範'); if (p) H.talks[p.id] = dojo; });
  K.funPlus = { dojo, DAN };
})();

// ---------------- 戦闘の 表示「2Dの 絵＋3Dの けしき」（2026-10-03） ----------------
// 2Dの 戦闘（敵の 絵・味方の 丸・数字）は そのまま。うしろの 平面の 背景の かわりに、いま いる 場所の 3Dの けしきを 映す。
// 3Dの 敵・味方の 形は 映さない（2Dの 絵と かさならないように）。設定「戦闘の 表示」で 立体（3D）・平面（2D）に もどせる。
(() => {
  const K = window.KZ; if (!K || !K.HOOK) return; const H = K.HOOK;
  const css = document.createElement('style'); css.textContent = `
  #battle.bg3d{background:linear-gradient(rgba(6,10,24,.38),rgba(6,10,24,0) 28%,rgba(6,10,24,0) 58%,rgba(6,10,24,.5))!important}
  #battle.bg3d #bStage{display:none!important}
  #battle.bg3d .foe-art{filter:drop-shadow(0 6px 4px rgba(0,0,0,.45)) drop-shadow(0 0 1px rgba(0,0,0,.6))}
  /* 2Dの 敵の HPバー：敵の 幅より みじかく、ふちを つけて 1体ずつ 分ける（ならぶと 1本に つながって 見えていた） */
  #battle:not(.b3d) .foe .bar{width:clamp(80px,20vh,130px);height:7px;border:1px solid rgba(0,0,0,.65);border-radius:4px;box-shadow:0 1px 0 rgba(255,255,255,.15)}
  #battle:not(.b3d) .foe.boss .bar{width:clamp(160px,36vh,280px)}`; document.head.appendChild(css);
  let cam = null;
  H.bgStart = opts => { if (!(H.OPT && H.OPT.mix) || !K.player || (typeof __norender !== 'undefined' && __norender)) return false; const p = K.player, y = K.cam.yaw, f = [-Math.sin(y), -Math.cos(y)];
    cam = { p: [p.x, p.y, p.z], f, boss: !!opts.boss }; document.getElementById('battle').classList.add('bg3d'); return true; };
  H.bgCam = (dt, T) => { if (!cam) return null; for (const k in K.mSp) K.mSp[k].n = 0; for (const k in K.mH) if (k !== 'statue') { K.mH[k].n = 0; if (K.poseHide) K.poseHide(k); }
    const [x, y, z] = cam.p, f = cam.f, s = Math.sin(T * .2) * .35, back = cam.boss ? 2.6 : 2.0;
    return { eye: [x - f[0] * back, y + 1.75, z - f[1] * back], tgt: [x + f[0] * 10 - f[1] * s, y + (cam.boss ? 2.2 : 1.4), z + f[1] * 10 + f[0] * s] }; };
  H.bgEnd = () => { cam = null; const b = document.getElementById('battle'); if (b) b.classList.remove('bg3d'); };
})();
