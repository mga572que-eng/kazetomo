// ともしびアイランド — v13 立体バトル（フィールドの 3D の上で たたかう・行動する 人に カメラが 寄る）
// しくみ：味方は フィールドと 同じ 3Dキャラ、敵は 3Dモンスター（3Dの 形が ない ボスは いまの 絵を 立体の 位置に 立てる）。
// 2Dの 演出（数字・照準・武器の 軌跡・リング）は 「目印の 要素」を 毎フレーム 3Dの 位置へ うごかして そのまま つかう。
// せってい「戦闘の 表示」で 平面（これまでの 2D）に もどせる。
'use strict';
(() => {
  const K = window.KZ; if (!K || !K.HOOK) return; const H = K.HOOK, B = K.B; if (!B) return;
  const $ = id => document.getElementById(id);
  const V3 = (x, y, z) => [x, y, z], lerp = (a, b, t) => a + (b - a) * t;
  let A = null; // 闘技場 { c, f:[前], r:[右], y }
  const S = new Map(); // 戦う 者 → 位置・動きの 状態
  let eye = null, tgt = null, goal = null, goalT = 0, introT = 0;
  const on = () => K.HOOK.OPT.b3d !== false;

  const groundY = (x, z) => { const y = K.surfaceAt(x, z, A.y + 2.5); return Math.abs(y - A.y) > 2.6 || !isFinite(y) ? A.y : y; };
  const at = (base, df, dr) => [base[0] + A.f[0] * df + A.r[0] * dr, base[2] + A.f[1] * df + A.r[1] * dr];
  const yawTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
  const spcOf = x => x.foe ? (x.sp ? K.SPC[x.sp] : (x.d && x.d.spArt && K.SPC[x.d.spArt]) || null) : x.kind === 'mon' ? K.SPC[x.id] : null;
  const meshOf = x => { if (!x.foe && x.kind === 'human') return K.mH[x.id] ? { h: K.mH[x.id] } : null; const sp = x.foe ? (x.sp || (x.d && x.d.spArt)) : x.id; return sp && K.mSp[sp] ? { m: K.mSp[sp], sp } : null; };
  const sizeOf = x => { const s = spcOf(x); const base = s ? (s.size || 1) : 1; return x.foe ? (x.boss ? 2.6 : 1.6) * base : x.kind === 'human' ? 1 : base * .95; };
  const tall = x => x.kind === 'human' && !x.foe ? 1.7 : 1.3 * sizeOf(x);

  // 闘技場の 向き：建物（ブロック）・急な 坂・水を さけ、いまの カメラの 向きに 近い ものを えらぶ
  function pickYaw(p) { let best = K.cam.yaw, bs = -1e9;
    for (let k = 0; k < 16; k++) { const yaw = K.cam.yaw + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 8; const f = [Math.sin(yaw), Math.cos(yaw)], r = [f[1], -f[0]]; let s = -Math.ceil(k / 2) * .4;
      for (let df = -7; df <= 7; df += 1.75) for (let dr = -4.5; dr <= 4.5; dr += 1.5) { const x = p.x + f[0] * df + r[0] * dr, z = p.z + f[1] * df + r[1] * dr;
        const g = K.surfaceAt(x, z, p.y + 2.5); if (K.blocked(x, z, p.y + .2) || K.blocked(x, z, p.y + 1.2)) s -= 3; if (!isFinite(g) || Math.abs(g - p.y) > 1.6) s -= 1.5; if (K.G.region !== 3 && K.hAt(x, z) < -.3) s -= 1; }
      if (s > bs) { bs = s; best = yaw; } }
    return best; }
  // ---------- 開始：闘技場を きめて 並べる ----------
  H.b3dStart = (opts, P, F) => { if (!on() || !K.player) return false;
    const p = K.player; const yaw = pickYaw(p); const f = [Math.sin(yaw), Math.cos(yaw)], r = [f[1], -f[0]];
    A = { c: [p.x, p.y, p.z], f, r, y: p.y, boss: !!opts.boss }; S.clear();
    const spread = (n, w) => i => (i - (n - 1) / 2) * w;
    const pr = spread(P.length, 1.45), fr = spread(F.length, opts.boss ? 3.2 : 2.3);
    P.forEach((m, i) => { const [x, z] = at(A.c, -1.6 - (i % 2) * .5, pr(i)); S.set(m, { bx: x, bz: z, by: groundY(x, z), ox: 0, oz: 0, oy: 0, t0: Math.random() * 6, ev: {} }); });
    F.forEach((m, i) => { const d = opts.boss ? 4.8 : 3.0 + (i % 2) * .6; const [x, z] = at(A.c, d, fr(i)); S.set(m, { bx: x, bz: z, by: groundY(x, z), ox: 0, oz: 0, oy: 0, t0: Math.random() * 6, ev: {}, gone: 0 }); });
    // 最初の カット：敵を 横から なめる → いつもの 位置へ
    const fc = center(F); eye = [fc[0] - f[0] * 3 + r[0] * 6, A.y + 2.4, fc[2] - f[1] * 3 + r[1] * 6]; tgt = [fc[0], A.y + 1.1, fc[2]]; introT = 1.4; goal = null;
    $('battle').classList.add('b3d'); document.body.classList.add('b3d-on'); return true; };
  H.b3dEnd = () => { A = null; S.clear(); const b = $('battle'); b.classList.remove('b3d'); document.body.classList.remove('b3d-on'); resetDom(); };
  const center = L => { let x = 0, z = 0, n = 0; for (const m of L) { const s = S.get(m); if (!s || s.gone >= 1) continue; x += s.bx; z += s.bz; n++; } return n ? [x / n, A.y, z / n] : A.c; };

  // ---------- カメラ ----------
  const home = T => { const pc = center(B.P || []), fc = center(B.F || []); const mid = [(pc[0] + fc[0]) / 2, A.y, (pc[2] + fc[2]) / 2]; const sw = Math.sin(T * .18) * 1.2;
    const bk = A.boss ? 4.2 : 3.2; return { e: [pc[0] - A.f[0] * bk + A.r[0] * (3 + sw), A.y + (A.boss ? 2.8 : 2.3), pc[2] - A.f[1] * bk + A.r[1] * (3 + sw)], t: [fc[0] - A.f[0] * .6, A.y + (A.boss ? 1.6 : 1), fc[2] - A.f[1] * .6] }; };
  const shot = (x, s) => { const st = S.get(x); if (!st) return null; const px = st.bx + st.ox, pz = st.bz + st.oz, py = st.by + st.oy, h = tall(x);
    if (!x.foe && s < 1.07) // 味方の 行動：正面 ななめから 顔を とらえる
      return { e: [px + A.f[0] * 3 + A.r[0] * 1.5, py + 1.5, pz + A.f[1] * 3 + A.r[1] * 1.5], t: [px, py + h * .62, pz] };
    if (x.foe && s < 1.07) { const k = x.boss ? 2.2 : 1; // 敵の 行動：味方の うしろから 敵を 見上げる
      return { e: [px - A.f[0] * (4.2 + 2 * k) - A.r[0] * 1.8, py + 1.4 + .4 * k, pz - A.f[1] * (4.2 + 2 * k) - A.r[1] * 1.8], t: [px, py + h * .55, pz] }; }
    if (x.foe) { const k = x.boss ? 2.2 : 1; // ねらわれた 敵：攻撃する 側の 肩ごし
      return { e: [px - A.f[0] * (3.4 + 1.8 * k) + A.r[0] * 1.3, py + 1.6 + .3 * k, pz - A.f[1] * (3.4 + 1.8 * k) + A.r[1] * 1.3], t: [px, py + h * .5, pz] }; }
    return { e: [px + A.f[0] * 3.6 - A.r[0] * 1.8, py + 1.8, pz + A.f[1] * 3.6 - A.r[1] * 1.8], t: [px, py + .9, pz] }; }; // ねらわれた 味方
  const who = el => { if (!el) return null; const fo = el.closest && el.closest('.foe'), al = el.closest && (el.closest('.al') || el.closest('.pc'));
    if (fo && fo.id) return (B.F || [])[+fo.id.slice(3)]; if (al && al.id) return (B.P || [])[+al.id.slice(2)]; return null; };
  H.b3dCam = (el, s = 1.06) => { if (!A) return; const x = who(el); goal = x ? shot(x, s) : null; goalT = 0; };

  // ---------- 毎フレーム：3Dの 位置・動き・目印 ----------
  const cls = (el, c) => !!(el && el.classList.contains(c));
  const edge = (st, k, now) => { const was = st.ev[k]; st.ev[k] = now; return now && !was; };
  function animate(x, st, el, dt, T) { const foeSide = x.foe ? -1 : 1, fw = A.f; // 前（相手の 方）
    const actor = cls(el, 'actor'), strike = cls(el, 'strike') || cls(el, 'lunge'), hurt = cls(el, 'hurt') || cls(el, 'hitw'), down = x.hp <= 0;
    if (edge(st, 'strike', strike)) st.lt = 0; if (edge(st, 'hurt', hurt)) st.ht = 0;
    let df = actor ? .9 : 0; // 行動者は 一歩 前へ
    if (st.lt != null) { st.lt += dt; const k = st.lt / .5; if (k >= 1) st.lt = null; else df += Math.sin(Math.min(1, k) * Math.PI) * 1.9; } // つっこんで もどる
    let shake = 0; if (st.ht != null) { st.ht += dt; const k = st.ht / .4; if (k >= 1) st.ht = null; else { df -= Math.sin(k * Math.PI) * .45; shake = Math.sin(st.ht * 70) * .08 * (1 - k); } }
    const tx = df * fw[0] * foeSide + shake * A.r[0], tz = df * fw[1] * foeSide + shake * A.r[1];
    st.ox = lerp(st.ox, tx, Math.min(1, dt * 14)); st.oz = lerp(st.oz, tz, Math.min(1, dt * 14));
    const sp = spcOf(x), fly = sp && (sp.arch === 'sprite' || sp.arch === 'bird' || sp.arch === 'fish');
    const bob = down ? 0 : fly ? .55 + Math.sin(T * 2.2 + st.t0) * .18 : x.kind === 'human' && !x.foe ? Math.abs(Math.sin(T * 2.4 + st.t0)) * .04 : Math.abs(Math.sin(T * 3 + st.t0)) * .1;
    st.oy = lerp(st.oy, (down ? -.55 : 0) + bob + (actor && !x.foe ? .08 : 0), Math.min(1, dt * 10));
    if (x.foe && down) st.gone = Math.min(1, (st.gone || 0) + dt * 1.6); }
  H.b3dFrame = (dt, T) => { if (!A) return null; const P = B.P || [], F = B.F || [];
    for (const k in K.mSp) K.mSp[k].n = 0; for (const k in K.mH) if (k !== 'statue') K.mH[k].n = 0;
    const fc = center(F), pc = center(P);
    const put = (x, el) => { const st = S.get(x); if (!st) return; animate(x, st, el, dt, T); const me = meshOf(x); const px = st.bx + st.ox, pz = st.bz + st.oz, py = st.by + st.oy;
      const c = x.foe ? pc : fc; const yaw = yawTo(px, pz, c[0], c[2]); const sc = sizeOf(x) * (x.foe ? 1 - (st.gone || 0) : 1);
      st.mesh = !!me && sc > .02; if (me && sc > .02) { if (me.h) { me.h.set(0, px, py, pz, sc, yaw); me.h.n = 1; }
        else if (me.m.n < 14) { const legend = sp => K.SPC[sp] && K.SPC[sp].legend; const neg = x.foe && !x.boss && !legend(me.sp) ? -1 : 1; me.m.set(me.m.n++, px, py, pz, neg * sc, yaw + (x.shiny ? 100 : 0)); } }
      st.sx = px; st.sy = py; st.sz = pz; };
    P.forEach((m, i) => put(m, $('al' + i))); F.forEach((m, i) => put(m, $('foe' + i)));
    // カメラ
    if (introT > 0) { introT -= dt; const h = home(T); const k = Math.min(1, dt * 1.8); eye = eye.map((v, i) => lerp(v, h.e[i], k)); tgt = tgt.map((v, i) => lerp(v, h.t[i], k)); }
    else { goalT += dt; const g = goal || home(T); const k = Math.min(1, dt * (goal ? 7 : 3)); eye = eye.map((v, i) => lerp(v, g.e[i], k)); tgt = tgt.map((v, i) => lerp(v, g.t[i], k)); }
    eye[1] = Math.max(eye[1], K.hAt(eye[0], eye[2]) + .8, K.G.region === 2 ? -24 : -60);
    return { eye, tgt }; };
  // 目印（2D演出の 位置）を 3Dの 位置へ：レンダーの あと（VPが 新しい）に うごかす
  H.b3dAnchors = () => { if (!A) return; const P = B.P || [], F = B.F || [];
    const place = (x, el, art, isFoe) => { const st = S.get(x); if (!st || !el || st.sx == null) return; const h = tall(x);
      const a = World.project([st.sx, st.sy + h * .5, st.sz]), b = World.project([st.sx, st.sy + h, st.sz]); if (!a || !b) { el.style.visibility = 'hidden'; return; }
      el.style.visibility = ''; const px = Math.max(36, Math.min(260, Math.abs(a[1] - b[1]) * 2.1));
      el.style.setProperty('--sx', a[0].toFixed(1) + 'px'); el.style.setProperty('--sy', a[1].toFixed(1) + 'px'); el.style.setProperty('--fw', px.toFixed(0) + 'px');
      el.classList.toggle('m3', !!st.mesh); };
    P.forEach((m, i) => place(m, $('al' + i), null, false)); F.forEach((m, i) => place(m, $('foe' + i), null, true)); };
  const resetDom = () => document.querySelectorAll('#battle .al, #battle .foe').forEach(e => { ['--sx', '--sy', '--fw'].forEach(k => e.style.removeProperty(k)); e.style.visibility = ''; e.classList.remove('m3'); });

  // ---------- 見た目 ----------
  const css = document.createElement('style');
  css.textContent = `#battle.b3d{background:transparent!important}
  #battle.b3d #bStage{display:none}
  #battle.b3d::before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 50% 60%,transparent 55%,rgba(0,0,0,.42));}
  #battle.b3d .al{position:fixed;left:var(--sx,-200px);top:var(--sy,-200px);bottom:auto;width:var(--fw,60px);height:var(--fw,60px);translate:-50% -50%;transform:none!important;transition:none}
  #battle.b3d .al .al-art,#battle.b3d .al .al-wpn,#battle.b3d .al .al-shadow{opacity:0!important}
  #battle.b3d .al .al-body{animation:none}
  #battle.b3d .al.guard .al-body::before,#battle.b3d .al.tgt .al-body::after{opacity:1}
  #battle.b3d #bFoes{display:block;padding:0;scale:1!important;translate:none!important}
  #battle.b3d #bAllies{scale:1!important;translate:none!important}
  #battle.b3d .foe{position:fixed;left:var(--sx,-300px);top:var(--sy,-300px);translate:-50% calc(var(--fw,120px) / -2);transition:none}
  #battle.b3d .foe .foe-art{width:var(--fw,120px)!important;height:var(--fw,120px)!important}
  #battle.b3d .foe.m3 .foe-art{opacity:0}
  #battle.b3d .foe.m3 .foe-shadow{display:none}
  #battle.b3d.spot .foe:not(.actor):not(.tgt) .foe-art{filter:none}
  #battle.b3d .foe:not(.m3) .foe-art{filter:drop-shadow(0 10px 6px rgba(0,0,0,.45))}
  body.b3d-on #bFlash.go{animation:flash3d calc(.34s / var(--bs,1))}
  @keyframes flash3d{0%{opacity:.3}100%{opacity:0}}`;
  document.head.appendChild(css);
})();
