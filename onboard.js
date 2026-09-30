// ともしびアイランド — はじめの 5分：タッチ操作の ガイド・最初の 戦闘・タイトルの 章ボタン・目的チップの 2行化
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK; const G = () => K.G;
  const COARSE = matchMedia('(pointer:coarse)').matches;
  // ---- 最小限の CSS（見た目の 本番は index.html 側で 上書きされる前提） ----
  const css = document.createElement('style'); css.textContent = `
#obj .obj-main{display:inline;font-weight:inherit}#obj .obj-meta{display:block;font-size:.72em;opacity:.72;font-weight:400;margin-top:1px;overflow:hidden;text-overflow:ellipsis}
.ob-hint{position:fixed;z-index:30;pointer-events:none;color:#fff;font:600 13px/1.3 var(--pixel,sans-serif);text-shadow:0 1px 3px #000;display:grid;justify-items:center;gap:8px;opacity:0;transition:opacity .5s}
.ob-hint.on{opacity:1}.ob-hint b{background:rgba(10,16,36,.72);border:1px solid rgba(255,255,255,.28);border-radius:14px;padding:5px 12px;font-weight:600;white-space:nowrap}
.ob-ring{width:96px;height:96px;border-radius:50%;border:2px dashed rgba(255,255,255,.55);background:rgba(255,255,255,.06);position:relative}
.ob-ring i{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;background:rgba(255,255,255,.55);animation:obKnob 2.2s ease-in-out infinite}
@keyframes obKnob{0%,100%{transform:translate(0,0)}25%{transform:translate(0,-26px)}50%{transform:translate(24px,0)}75%{transform:translate(-24px,6px)}}
.ob-swipe{width:120px;height:60px;position:relative}.ob-swipe i{position:absolute;top:18px;left:10px;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.6);box-shadow:0 0 0 6px rgba(255,255,255,.15);animation:obSwipe 1.8s ease-in-out infinite}
@keyframes obSwipe{0%{transform:translateX(0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(80px);opacity:0}}
.ob-act b{background:var(--flame,#f3a54a);color:#2a1406;border:0;animation:obPulse 1s ease-in-out infinite}
.ob-act::after{content:'';width:0;height:0;border:9px solid transparent;border-top-color:var(--flame,#f3a54a);position:absolute;right:30px;bottom:-16px}
@keyframes obPulse{50%{transform:scale(1.08)}}
body.modal .ob-hint,body.inbattle .ob-hint{opacity:0!important}
@media (pointer:coarse){.keys-hint{display:none!important}}`;
  document.head.appendChild(css);

  // ---- タイトル：到達した 章だけ「第N章から」を 出す ----
  const reached = () => { let m = 1; for (const k of ['kazetomo-rpg-3', 'kazetomo-rpg-3-s2', 'kazetomo-rpg-3-s3']) try { const f = ((JSON.parse(localStorage.getItem(k) || 'null') || {}).G || {}).flags || {}; m = Math.max(m, f.c4start ? 4 : f.c3start ? 3 : f.c2start ? 2 : 1); } catch (e) {} return m; };
  function titleButtons() { const rc = K.DEBUG ? 4 : reached(); [2, 3, 4].forEach(n => { const b = document.getElementById('btnCh' + n); if (b) { b.hidden = n > rc; b.style.display = n > rc ? 'none' : ''; } }); }
  titleButtons(); const sp = document.getElementById('splash'); if (sp) sp.addEventListener('click', () => setTimeout(titleButtons, 0));

  // ---- タッチ操作の はじめての ガイド ----
  const mk = (cls, html) => { const d = document.createElement('div'); d.className = 'ob-hint ' + cls; d.innerHTML = html; document.body.appendChild(d); return d; };
  let hMove = null, hLook = null, hAct = null, spawn = null, inAt0 = null;
  const tips = () => (G().tips = G().tips || {});
  const done = (k, el) => { tips()[k] = 1; if (el) { el.classList.remove('on'); setTimeout(() => el.remove(), 600); } };
  function placeMove() { const left = K.HOOK.OPT.lefty; hMove.style.left = left ? '' : 'calc(14vw - 48px)'; hMove.style.right = left ? 'calc(14vw - 48px)' : ''; hMove.style.bottom = '22vh'; }
  function placeLook() { const left = K.HOOK.OPT.lefty; hLook.style.left = left ? 'calc(22vw)' : ''; hLook.style.right = left ? '' : 'calc(24vw)'; hLook.style.top = '34vh'; }
  function placeAct() { const b = document.getElementById('btnAct'); if (!b) return; const r = b.getBoundingClientRect(); if (!r.width) return; hAct.style.left = ''; hAct.style.right = Math.max(8, innerWidth - r.right) + 'px'; hAct.style.top = Math.max(4, r.top - 44) + 'px'; }
  const bAct = document.getElementById('btnAct'); if (bAct) bAct.addEventListener('pointerdown', () => { if (hAct && K.phase === 'field') { done('obAct', hAct); hAct = null; } }, true);
  let actT = 0, lookT = 0, rc0 = 0;
  H.frame.push((dt, T, r, md) => {
    const g = G(); if (!g || K.phase !== 'field') return; const t = tips(); const P = K.player;
    if (COARSE) {
      // 同時に 出すのは 1つだけ（しらべる ＞ いどう ＞ 視点）。 つくるモード・会話中は 全部 かくす。 名札（#tlabel）が 出ている間は いどう/視点を かくす
      const free = md === 'field' && !document.body.classList.contains('building'); const tl = document.getElementById('tlabel'); const lab = !!(tl && !tl.hidden);
      const ready = bAct && bAct.classList.contains('ready');
      if (!t.obMove && !hMove && free) { hMove = mk('ob-move', '<div class="ob-ring"><i></i></div><b>ドラッグで いどう</b>'); placeMove(); spawn = { x: P.x, z: P.z }; }
      if (hMove && spawn && Math.hypot(P.x - spawn.x, P.z - spawn.z) > 2.5) { done('obMove', hMove); hMove = null; }
      if (!t.obLook && !hLook && free && t.obMove) { hLook = mk('ob-look', '<div class="ob-swipe"><i></i></div><b>ドラッグで 視点</b>'); placeLook(); inAt0 = K.cam.inAt || 0; lookT = 0; rc0 = K.cam.rcN || 0; }
      if (hLook) { if (free) lookT += dt; if ((K.cam.inAt || 0) !== inAt0 || lookT > 20 || (K.cam.rcN || 0) - rc0 > 1) { done('obLook', hLook); hLook = null; } }
      if (!t.obAct && !hAct && free && ready) { hAct = mk('ob-act', '<b>ここを タップで しらべる</b>'); placeAct(); }
      if (hAct) { actT -= dt; if (actT <= 0) { actT = .3; placeAct(); } if (md === 'busy' && !K.MENUS.length) { done('obAct', hAct); hAct = null; } }
      const show = !free ? null : hAct && ready ? hAct : lab ? null : hMove || hLook;
      for (const h of [hMove, hLook, hAct]) if (h) h.classList.toggle('on', h === show);
    }
    // ---- 最初の 戦闘：ユイの 家 → ゲンの 工房の 道に 弱い いきもの 1匹 ----
    const F = g.flags;
    if (g.region === 0 && F.metYui && !F.metGen && !F.tut1 && md === 'field') {
      let e = K.enemies.find(x => x.tut);
      if (!e && !tutSpawned) { const p = tutSpot(); if (p) { tutSpawned = true; e = { x: p.x, z: p.z, y: K.hAt(p.x, p.z), hx: p.x, hz: p.z, yaw: 0, tut: true, group: [{ sp: 'watapoko', lv: 1, shiny: false }], tx: p.x, tz: p.z, wt: 99 }; K.enemies = [...K.enemies, e]; } }
      if (e) { e.wt = 99; e.tx = e.hx; e.tz = e.hz; // うろつかず 道の 上で 待つ
        const d = Math.hypot(P.x - e.x, P.z - e.z); if (d < 14) K.tip('<b>かげものだ！</b><span>ふれると バトル。「たたかう」→ 技を えらんで こうげき。 HPが へったら「どうぐ」で 回復。</span>', 'tutFoe'); }
      else if (tutSpawned && !(document.body.classList.contains('inbattle'))) { F.tut1 = 1; K.tip('<b>はじめての 勝利！</b><span>勝つと 経験値と お金が もらえる。 ユイの 家で「やすむ」と 全回復＋記録。</span>', 'tutWin'); }
    }
  });
  let tutSpawned = false;
  function tutSpot() { const a = K.npcAt('yui', 0), b = K.npcAt('gen', 0); if (!a || !b) return null;
    for (const u of [.6, .55, .65, .5, .7, .45]) for (const off of [0, 2, -2, 4, -4]) { const L = Math.hypot(b.x - a.x, b.z - a.z) || 1, nx = -(b.z - a.z) / L, nz = (b.x - a.x) / L;
      const x = a.x + (b.x - a.x) * u + nx * off, z = a.z + (b.z - a.z) * u + nz * off, h = K.hAt(x, z); let blk = false;
      for (let y = Math.floor(h); y <= Math.floor(h) + 2; y++) for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (K.Blocks.has(Math.floor(x) + dx, y, Math.floor(z) + dz)) blk = true;
      if (!blk && h > .3 && Math.hypot(x - K.player.x, z - K.player.z) > 9) return { x, z }; }
    return null; }
  H.load.push(() => { tutSpawned = false; });
})();
