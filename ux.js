// ともしびアイランド — 遊びやすさ：地名表示・素材ヒント・セーブ表示・工房（キャラ別）・防具屋・ミニマップ・ストーリー＆クエスト
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK; const $ = id => document.getElementById(id);
  const G = () => K.G, F = () => K.G.flags;
  const css = document.createElement('style');
  css.textContent = `
  #areaBn{position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);z-index:34;text-align:center;pointer-events:none;opacity:0;transition:opacity .7s, transform .7s}
  #areaBn.on{opacity:1;transform:translate(-50%,-56%)}
  #areaBn b{display:block;font-family:"Mochiy Pop One",var(--display);font-size:clamp(26px,7vh,46px);font-weight:400;color:#fff6d8;letter-spacing:.14em;text-shadow:0 3px 0 rgba(40,20,10,.8),0 0 24px rgba(0,0,0,.6)}
  #areaBn i{display:block;font-style:normal;font-family:var(--pixel);font-size:clamp(11px,2.6vh,15px);color:var(--gold);letter-spacing:.3em;margin-top:6px;text-shadow:0 2px 6px rgba(0,0,0,.8)}
  #areaBn:before,#areaBn:after{content:"";display:block;height:2px;width:min(60vw,420px);margin:8px auto;background:linear-gradient(90deg,transparent,rgba(243,193,90,.9),transparent)}
  #matHint{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom,0px));transform:translate(-50%,8px);z-index:33;background:rgba(12,18,40,.9);border:1px solid rgba(243,193,90,.55);border-radius:10px;padding:6px 12px;font-size:13px;color:#f4f0e6;opacity:0;transition:opacity .35s,transform .35s;pointer-events:none;max-width:min(560px,80vw);text-align:center;line-height:1.5}
  #matHint.on{opacity:1;transform:translate(-50%,0)} #matHint em{font-style:normal;color:var(--gold)} #matHint .ok{color:#8fe06a}
  #saveChip{position:fixed;left:calc(14px + env(safe-area-inset-left,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:61;background:rgba(12,18,40,.88);border:1px solid rgba(143,224,106,.6);color:#bff0a8;border-radius:999px;padding:4px 12px;font-family:var(--pixel);font-size:12px;opacity:0;transition:opacity .4s;pointer-events:none}
  #saveChip.on{opacity:1}
  #mmap{position:absolute;right:calc(14px + env(safe-area-inset-right,0px));top:calc(56px + env(safe-area-inset-top,0px));width:clamp(92px,24vh,132px);height:clamp(92px,24vh,132px);border-radius:50%;pointer-events:auto;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.45);border:2px solid rgba(244,240,230,.75);background:#0b1016}
  .qtabs{display:flex;gap:6px;margin:4px 0 10px;flex-wrap:wrap;padding-right:48px}.qtabs button{min-height:44px;border:1px solid rgba(244,240,230,.3);background:transparent;border-radius:999px;padding:5px 16px;font-family:var(--pixel);font-size:13px;color:#f4f0e6;cursor:pointer}.qtabs button.on{background:var(--gold);color:#1a1208;border-color:var(--gold)}
  .qrow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;background:var(--card);border:1px solid var(--card-line);border-radius:var(--r2);padding:7px 8px 7px 12px;margin-bottom:6px;font-size:14px;line-height:1.45}
  .qrow small{display:block;color:var(--muted);font-size:12px;margin-top:2px}.qrow.tr{border-color:var(--gold);background:rgba(243,193,90,.08)}
  .qrow button{border:1px solid var(--gold);background:transparent;color:var(--gold);border-radius:999px;padding:5px 16px;font-family:var(--pixel);font-size:13px;min-height:44px;min-width:88px;white-space:nowrap;cursor:pointer}.qrow.tr button{background:var(--gold);color:#241a08}
  .story p{line-height:1.8;font-size:14px;margin:0 0 10px}.story h4{margin:10px 0 4px;color:var(--gold);font-family:var(--pixel);font-weight:400}
  .forge .qrow .cmp{font-family:var(--pixel);font-size:13px}.forge .fg-up{color:#8fe06a;display:inline}.forge .fg-ng{color:#e8857a;display:inline}.forge .cmp{display:inline}`;
  document.head.appendChild(css);
  const mk = (id, tag = 'div') => { const e = document.createElement(tag); e.id = id; document.body.appendChild(e); return e; };
  const bn = mk('areaBn'), hint = mk('matHint'), chip = mk('saveChip');

  // ---------- 1. 地名を 画面の まんなかに ----------
  function areas() { const r = K.REG[G().region], out = [], rg = G().region;
    out.push({ id: 't' + rg, x: r.town.x, z: r.town.z, r: 30, n: K.townName(rg), s: K.regionName(rg) });
    if (rg === 0) { r.beacons.forEach(b => out.push({ id: 'b' + b.i, x: b.x, z: b.z, r: 15, n: DATA.trials[b.i].name, s: b.lit ? '灯が ともっている' : 'ボスが まちうける 灯台' })); if (G().order >= 5 && r.shrine) out.push({ id: 'sh', x: r.shrine.x, z: r.shrine.z, r: 16, n: '宵の祠', s: '風灯の島' }); if (K.baseSite) out.push({ id: 'base', x: K.baseSite.x, z: K.baseSite.z, r: 11, n: 'わが家', s: G().baseLv ? `レベル${G().baseLv}` : '建設予定地（立て札を しらべよう）' }); }
    if (rg === 1) out.push({ id: 'ru', x: World.RUINS1[0], z: World.RUINS1[1], r: 34, n: '星の遺跡', s: '霧の大陸' });
    if (rg === 2) { (r.shrines || []).forEach(sh => out.push({ id: 'w' + sh.i, x: sh.x, z: sh.z, r: 14, n: DATA.windTrials[sh.i].name, s: '風の祠' })); if (r.tower) out.push({ id: 'tw', x: r.tower.x, z: r.tower.z, r: 30, n: '星巣の塔', s: '天空の浮島' }); }
    if (rg === 3) { (r.lh || []).forEach(L => out.push({ id: 'l' + L.i, x: L.x, z: L.z, r: 16, n: ['藻の灯台', '甲羅の灯台', '雷の灯台'][L.i], s: 'ボスが まちうける 沈んだ灯台' })); if (r.palace) out.push({ id: 'pl', x: r.palace.x, z: r.palace.z, r: 24, n: '深淵の宮', s: '海の底' }); if (r.trench) out.push({ id: 'tr', x: r.trench.x, z: r.trench.z, r: 30, n: '深淵の谷', s: '海の底' }); }
    for (const a of K.extraAreas || []) if (a.rg === rg) out.push(a);
    for (const sh of DATA.shrines || []) if (sh.r === rg && sh.pos) out.push({ id: 's' + sh.id, x: sh.pos.x, z: sh.pos.z, r: 10, n: sh.name, s: '試練の祠' });
    return out; }
  let cur = null, lastRg = -1, bnT = 0, aT = 0;
  function banner(n, s) { bn.innerHTML = `<b>${n}</b><i>${s || ''}</i>`; bn.classList.add('on'); clearTimeout(bnT); bnT = setTimeout(() => bn.classList.remove('on'), 2600); Music.sfx('swoosh'); }
  H.frame.push(dt => { if (K.phase !== 'field') return; aT -= dt; if (aT > 0) return; aT = .25; const P = K.player;
    if (G().region !== lastRg) { lastRg = G().region; cur = null; if (K.busy) { lastRg = -1; return; } banner(K.regionName(G().region), '—'); aT = 3; return; }
    const A = areas(); const inA = A.find(a => Math.hypot(P.x - a.x, P.z - a.z) < a.r);
    if (cur && !inA) { const c = A.find(a => a.id === cur); if (!c || Math.hypot(P.x - c.x, P.z - c.z) > c.r * 1.3) cur = null; }
    if (inA && inA.id !== cur && !K.busy) { cur = inA.id; banner(inA.n, inA.s); } });

  // ---------- 2. 素材の 使いみち ----------
  const FORGE_TIER = g => g.cost || (g.price ? (() => { const p = g.price, c = { ishi: Math.ceil(p / 350) + 2, maki: Math.ceil(p / 700) + 1 }; if (p >= 1500) c.shizuku = 2; if (p >= 3500) c.hoshikake = 1 + (p >= 7000 ? 1 : 0); if (g.sky) c.kumowata = 3; if (g.sea) c.shinju = 2; return c; })() : null);
  const forgeable = g => !(g.sky && !F().c3arrive) && !(g.sea && !F().c4arrive);
  function things() { const out = [], inv = G().inv;
    for (const r of DATA.recipes) out.push({ name: `${DATA.blocks[r.out]}ブロック×${r.n}`, need: r.need, where: 'クラフト' });
    for (const c of DATA.cook || []) if (DATA.items[c.out]) out.push({ name: DATA.items[c.out].name, need: c.need, where: '料理' });
    for (const m of G().party) if (m.kind === 'human') { const e = G().eq[m.id] || { w: 0 }; const L = DATA.gear[m.id] || []; for (let i = e.w + 1; i < Math.min(L.length, e.w + 3); i++) { const g = L[i]; const c = FORGE_TIER(g); if (c && forgeable(g)) out.push({ name: `${g.name}（${K.nameOf(m)}）`, need: c, where: 'ゲンの工房' }); } }
    return out.map(t => ({ ...t, miss: Object.entries(t.need).reduce((a, [k, v]) => a + Math.max(0, v - (inv[k] || 0)), 0) })); }
  let hT = 0, hq = {};
  H.gain.push((k, n) => { const it = DATA.items[k]; if (!it || !it.mat || K.phase !== 'field') return; hq[k] = (hq[k] || 0) + n; clearTimeout(hT); hT = setTimeout(() => {
      const ks = Object.keys(hq); hq = {}; const T = things(); const lines = [];
      for (const q of ks) { const rel = T.filter(t => q in t.need); const pri = t => (t.where === 'クラフト' ? 1 : 0); const ready = rel.filter(t => t.miss === 0).sort((a, b) => pri(a) - pri(b)); const near = rel.filter(t => t.miss > 0).sort((a, b) => pri(a) - pri(b) || a.miss - b.miss)[0];
        let s = `${DATA.items[q].name}（もち ${G().inv[q] || 0}）`; if (ready.length && !(pri(ready[0]) && near && near.miss <= 3)) s += `　<span class="ok">▶ ${ready[0].name}が つくれる！（${ready[0].where}）</span>`; else if (near) s += `　▶ あと<em>${near.miss}こ</em>で「${near.name}」（${near.where}）`; else s += `　${DATA.items[q].use || ''}`; lines.push(s); }
      hint.innerHTML = lines.slice(0, 2).join('<br>'); hint.classList.add('on'); clearTimeout(hint.t); hint.t = setTimeout(() => hint.classList.remove('on'), 3200); }, 350); });

  // ---------- 3. セーブ表示と 節目の オートセーブ ----------
  let sv = 0; H.saved.push(() => { const now = performance.now(); if (now - sv < 6000) return; sv = now; chip.textContent = '💾 セーブしました'; chip.classList.add('on'); clearTimeout(chip.t); chip.t = setTimeout(() => chip.classList.remove('on'), 1800); });
  H.battleEnd.push(async (res, specs) => { if (res === 'win' && specs.some(s => s.boss)) setTimeout(() => { if (!K.busy) K.save(); }, 300); });
  let lastLv = 0; H.frame.push(() => { if (K.phase !== 'field') return; const lv = G().party.reduce((a, m) => a + m.lv, 0); if (lastLv && lv > lastLv && !K.busy) K.save(); lastLv = lv; });

  // ---------- 4. ゲンの工房：キャラごとに 武器を つくる（比較つき） ----------
  const costTxt = c => Object.entries(c).map(([k, v]) => { const h = G().inv[k] || 0; return `<span class="${h >= v ? '' : 'fg-ng'}">${DATA.items[k].name}${h}/${v}</span>`; }).join(' ');
  const can = c => Object.entries(c).every(([k, v]) => (G().inv[k] || 0) >= v);
  async function forgeUI() { return new Promise(res => {
    const el = document.createElement('div'); el.className = 'win panel wide forge'; const M = { el, panel: true, items: [], res };
    let who = G().party.find(m => m.kind === 'human').id;
    const paint = () => { const hs = G().party.filter(m => m.kind === 'human'); const m = hs.find(x => x.id === who) || hs[0]; const e = G().eq[m.id]; const L = DATA.gear[m.id]; const curW = L[e.w];
      const rows = []; for (let i = e.w + 1; i < L.length; i++) { const g = L[i]; const c = FORGE_TIER(g); if (!c) continue; const lock = !forgeable(g); const d = g.atk - curW.atk;
        rows.push(`<div class="qrow"><div><b>${g.name}</b>　<span class="cmp">こうげき ${curW.atk} → <span class="fg-up">${g.atk}（+${d}）</span></span><small>${lock ? (g.sea ? '海の底で 材料の ありかを 知ってから' : '空へ 行ってから') : costTxt(c)}</small></div><button type="button" data-i="${i}" ${lock || !can(c) ? 'disabled style="opacity:.4"' : ''}>つくる</button></div>`); }
      const ha = G().eq.sora.a; const aNext = DATA.armor[ha + 1]; const aC = aNext ? (aNext.cost || FORGE_TIER(aNext)) : null; const aLock = aNext && !forgeable(aNext);
      el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button><h3>ゲンの工房 <small class="st-eq">材料で 武器・防具を 打つ</small></h3>
        <div class="qtabs">${hs.map(x => `<button type="button" data-w="${x.id}" class="${x.id === m.id ? 'on' : ''}">${K.nameOf(x)}</button>`).join('')}</div>
        <p class="st-eq">いまの ぶき：<b>${curW.name}</b>（こうげき ${curW.atk}）　${K.nameOf(m)}の こうげき ${m.st.atk}</p>
        ${rows.length ? rows.join('') : '<p class="st-eq">これ以上 打てる ぶきは ない。</p>'}
        <h4 style="margin:10px 0 6px;color:var(--gold);font-weight:400">防具（全員ぶん）</h4>
        ${aNext ? `<div class="qrow"><div><b>${aNext.name}</b>　<span class="cmp">ぼうぎょ ${DATA.armor[ha].def} → <span class="fg-up">${aNext.def}（+${aNext.def - DATA.armor[ha].def}）</span></span><small>${aLock ? 'まだ 材料が わからない' : costTxt(aC)}</small></div><button type="button" data-a="1" ${aLock || !can(aC) ? 'disabled style="opacity:.4"' : ''}>つくる</button></div>` : '<p class="st-eq">最高の 防具を そうび中。</p>'}`;
      el.querySelector('.m-x').onclick = () => { Music.sfx('cancel'); K.closeMenu(M, -1); };
      el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { who = b.dataset.w; Music.sfx('cursor'); paint(); });
      el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const i = +b.dataset.i, g = L[i], c = FORGE_TIER(g); if (!can(c)) return; for (const [k, v] of Object.entries(c)) G().inv[k] -= v; e.w = i; const r = m.hp / m.st.hp; K.calc(m); m.hp = Math.round(m.st.hp * r); Music.sfx('place'); K.toast(`${g.name}を つくった！<br><span style="font-size:.6em">${K.nameOf(m)}の こうげき ${m.st.atk}</span>`, 1800); K.save(); paint(); });
      const ab = el.querySelector('[data-a]'); if (ab) ab.onclick = () => { if (!can(aC)) return; for (const [k, v] of Object.entries(aC)) G().inv[k] -= v; for (const k in G().eq) if (G().eq[k].a < ha + 1) G().eq[k].a = ha + 1; G().party.forEach(x => { const r = x.hp / x.st.hp; K.calc(x); x.hp = Math.round(x.st.hp * r); }); Music.sfx('place'); K.toast(`${aNext.name}を みんなに つくった！`, 1800); K.save(); paint(); }; };
    paint(); $('ui').appendChild(el); K.MENUS.push(M); }); }
  K.forgeUI = forgeUI;
  const prevGen = H.talks.gen;
  H.talks.gen = async n => { if (prevGen) { const r = await prevGen(n); if (r !== 'pass') return; } if (!F().metGen) return 'pass'; const c = await K.menu({ title: 'ゲンの工房', items: [{ label: 'ぶき・ぼうぐを つくる', sub: 'キャラごと・いまと 比較' }, { label: 'はなす' }] });
    if (c === 0) return forgeUI(); if (c === 1) return 'pass'; };

  // ---------- 5. 防具屋を 武器屋の となりに ----------
  for (const r of [1, 2, 3]) { const R = K.REG[r]; const h = R.houses && R.houses.find(h => h.id === 'weapon'); if (!h || !h.npc) continue;
    const n = { id: 'armor', r, x: h.npc.x + 2.4, z: h.npc.z + .6, yaw: h.yaw || 0, nm: r === 3 ? '海の防具屋' : r === 2 ? '空の防具屋' : '防具屋' }; n.baseYaw = n.yaw; K.NPCS.push(n); }
  H.talks.armor = async () => K.shopUI('armor');

  // ---------- 6. ミニマップ（方角つき） ----------
  const mm = document.createElement('canvas'); mm.id = 'mmap'; mm.width = mm.height = 200; mm.setAttribute('aria-label', 'ミニマップ（タップで 地図）');
  const hud = $('hud'); if (hud) hud.appendChild(mm);
  mm.addEventListener('click', e => { e.stopPropagation(); if (K.phase === 'field' && !K.busy) K.run(K.mapPanel); });
  const imgs = {}; const mapImg = rg => { if (imgs[rg]) return imgs[rg]; const i = new Image(); i.src = K.mapImage(); imgs[rg] = i; return i; };
  let mT = 0;
  H.frame.push(dt => { mT -= dt; if (mT > 0 || K.phase !== 'field' || hud.hidden) return; mT = .1; const c = mm.getContext('2d'), S = 200, P = K.player, rg = G().region; const img = mapImg(rg);
    const yaw = K.cam2.yaw; const zoom = 2.6; const ppu = 180 / 540 * zoom; // 地図1ワールド単位あたりの px（画像 180px=540）
    const th = yaw - Math.PI, cs = Math.cos(th), sn = Math.sin(th), rot = (x, z) => [x * cs - z * sn, x * sn + z * cs];
    c.save(); c.clearRect(0, 0, S, S); c.beginPath(); c.arc(100, 100, 98, 0, 7); c.clip(); c.fillStyle = '#0b1016'; c.fillRect(0, 0, S, S);
    c.translate(100, 100); c.rotate(th); if (img.complete) { const ix = (P.x / 540 + .5) * 180, iz = (P.z / 540 + .5) * 180; c.imageSmoothingEnabled = true; c.drawImage(img, -ix * zoom, -iz * zoom, 180 * zoom, 180 * zoom); }
    const dot = (x, z, col, r = 4) => { c.beginPath(); c.arc((x - P.x) * ppu, (z - P.z) * ppu, r, 0, 7); c.fillStyle = col; c.fill(); };
    for (const e of K.enemies) if (Math.hypot(e.x - P.x, e.z - P.z) < 60) dot(e.x, e.z, e.legend ? '#ffd24a' : '#ff5b5b', 3.2);
    for (const n of K.NPCS) if (n.r === rg && (!n.show || n.show()) && Math.hypot(n.x - P.x, n.z - P.z) < 70) dot(n.x, n.z, '#8fd8ff', 3);
    const ob = (H.track && H.track()) || K.objective(); if (ob && ob.p) { const dx = (ob.p.x - P.x) * ppu, dz = (ob.p.z - P.z) * ppu, d = Math.hypot(dx, dz), mx = 86; const k = d > mx ? mx / d : 1;
      c.save(); c.translate(dx * k, dz * k); c.rotate(-th); c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffd24a'; c.strokeStyle = '#3a2208'; c.lineWidth = 4; c.strokeText('★', 0, 0); c.fillText('★', 0, 0); c.restore(); }
    c.restore();
    { const [vx, vy] = rot(Math.sin(P.yaw), Math.cos(P.yaw)); c.save(); c.translate(100, 100); c.rotate(Math.atan2(vy, vx) + Math.PI / 2); c.beginPath(); c.moveTo(0, -11); c.lineTo(8, 9); c.lineTo(0, 4); c.lineTo(-8, 9); c.closePath(); c.fillStyle = '#fff'; c.strokeStyle = '#1a1208'; c.lineWidth = 3; c.stroke(); c.fill(); c.restore(); }
    c.save(); c.translate(100, 100); c.font = 'bold 20px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const [t, dx, dz, col] of [['北', 0, -1, '#ff6b5b'], ['東', 1, 0, '#f4f0e6'], ['南', 0, 1, '#f4f0e6'], ['西', -1, 0, '#f4f0e6']]) { const [x, y] = rot(dx * 82, dz * 82);
      c.fillStyle = 'rgba(10,14,24,.75)'; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill(); c.fillStyle = col; c.fillText(t, x, y + 1); }
    c.restore(); c.beginPath(); c.arc(100, 100, 98, 0, 7); c.strokeStyle = 'rgba(244,240,230,.8)'; c.lineWidth = 3; c.stroke(); });

  // ---------- 7. ストーリー と クエスト（メニューから・追跡できる） ----------
  const CH = [
    { k: 'cleared', t: '第1章　ともしびの継ぎ手', s: '三年前、灯台守の 父カイトは 夜の海へ 消えた。 {name}は 幼なじみの ミオ、槍使いの リクと 島の 五つの 灯台に 火を ともし、宵の祠で 影の王を しずめた。' },
    { k: 'c2done', t: '第2章　星くずの大陸', s: '船乗りバルドの 船で 霧の大陸へ。 港町ミナトで 星読みの サナ、学者の ツムギと 出会い、星の遺跡の 祭壇で 星を 食らう 影を うちはらった。' },
    { k: 'c3done', t: '第3章　天空の星巣', s: '星笛に よばれた くじらに のって 天空の浮島へ。 風読みの ハルと 三つの 風の祠を ひらき、星巣の塔の 頂で 天喰みを たおした。 そして 島で、ついに 父と 再会した。' },
    { k: 'c4done', t: '第4章　海の底', s: '父から 託された「あわの鈴」で 海の底へ。 アワの里の 長老ウシオに たのまれ、沈んだ 三つの 灯台に 灯を ともし、深淵の宮で 深みの王を 光へ かえした。' } ];
  function quests() { const Q = [], g = G();
    Q.push({ id: 'main', n: 'メインストーリー', d: K.objective().t, p: K.objective().p });
    if (K.reqList) Q.push(...K.reqList());
    for (const sh of DATA.shrines || []) if (sh.pos && !(g.shrineDone || {})[sh.id]) Q.push({ id: 's' + sh.id, n: `試練の祠：${sh.name}`, d: `${K.regionName(sh.r)}　${sh.hint}`, p: { x: sh.gate.x, z: sh.gate.z }, r: sh.r });
    if (K.baseSite && (g.baseLv || 0) < 5) Q.push({ id: 'base', n: `わが家づくり（Lv${g.baseLv || 0}/5）`, d: `${K.regionName(0)}　${(DATA.baseLevels[g.baseLv || 0] || {}).text || ''}`, p: K.baseSite.sign, r: 0 });
    for (const b of g.bounties || []) Q.push({ id: 'q' + (b.id || b.text), n: `ギルドの依頼`, d: b.text + (b.n ? `（${b.c || 0}/${b.n}）` : ''), p: null });
    if (F().c4done && !F().superDone && K.REG[3].trench) Q.push({ id: 'abyss', n: '（裏）深淵の主', d: '海の底の 深淵の谷で', p: K.REG[3].trench, r: 3 });
    return Q; }
  H.track = () => { const t = G().track; if (!t || t === 'main') return null; const q = quests().find(q => q.id === t); if (!q) { G().track = null; return null; } if (q.r != null && q.r !== G().region) return { t: `【追跡】${q.n}（${K.regionName(q.r)}へ）`, p: null }; return { t: `【追跡】${q.n}`, p: q.p }; };
  async function storyUI() { return new Promise(res => { const el = document.createElement('div'); el.className = 'win panel wide'; const M = { el, panel: true, items: [], res }; let tab = 'q';
    const paint = () => { const Q = quests(); const tr = G().track || 'main';
      const body = tab === 'q' ? Q.map(q => `<div class="qrow ${tr === q.id ? 'tr' : ''}"><div><b>${q.n}</b><small>${q.d}</small></div>${q.p || q.r != null ? `<button type="button" data-t="${q.id}">${tr === q.id ? '追跡中' : '追跡する'}</button>` : ''}</div>`).join('')
        : `<div class="story">${CH.map((c, i) => (i === 0 || F()[CH[i - 1].k]) ? `<h4>${c.t}${F()[c.k] ? '　✓' : '　（いま ここ）'}</h4><p>${F()[c.k] ? c.s.replace(/{name}/g, K.esc(G().name)) : 'いまの 目的：' + K.objective().t}</p>` : '').join('')}</div>`;
      el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button><h3>ストーリーと クエスト</h3><div class="qtabs"><button type="button" data-tab="q" class="${tab === 'q' ? 'on' : ''}">クエスト（追跡）</button><button type="button" data-tab="s" class="${tab === 's' ? 'on' : ''}">これまでの あらすじ</button><button type="button" data-tab="l">くわしい 一覧</button></div>${body}`;
      el.querySelector('.m-x').onclick = () => { Music.sfx('cancel'); K.closeMenu(M, -1); };
      el.querySelectorAll('[data-tab]').forEach(b => b.onclick = async () => { if (b.dataset.tab === 'l') { K.closeMenu(M, -1); await K.questLog(); return; } tab = b.dataset.tab; Music.sfx('cursor'); paint(); });
      el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { G().track = b.dataset.t; Music.sfx('ok'); K.toast(b.dataset.t === 'main' ? 'メインストーリーを 追跡' : '追跡を 切りかえた', 1000); paint(); }); };
    paint(); $('ui').appendChild(el); K.MENUS.push(M); }); }
  K.storyUI = storyUI;
  H.menu.push(() => ({ label: 'ストーリー／クエスト', sub: '追跡・あらすじ', fn: storyUI }));
  $('obj') && $('obj').addEventListener('click', () => { if (K.phase === 'field' && !K.busy) K.run(storyUI); });

  // ---------- 8. わが家の 立て札 ヒント ----------
  let bh = false; H.frame.push(() => { if (bh || G().region !== 0 || !K.baseSite || K.busy) return; if (Math.hypot(K.player.x - K.baseSite.x, K.player.z - K.baseSite.z) < 12) { bh = true; if (!G().baseLv) K.tip('<b>わが家の 建設予定地</b><span>ここに ブロックや 家具を 置くと「わが家」が 育つ。 立て札を しらべると くわしく わかる。</span>', 4200); } });
  // ---------- 9. しらべるボタン：ラベルを 丸ボタンに おさめる（空白で 2行・長い語は 文字を 縮める） ----------
  const actL = $('btnActLabel'); let actT = '';
  if (actL) { const fit = () => { const t = actL.textContent.trim(); if (t === actT) return; actT = t; const w = Math.max(1, ...t.split(/\s+/).map(x => [...x].length));
      actL.parentElement.style.setProperty('--fit', Math.max(.7, Math.min(1, 4.6 / w)).toFixed(2)); };
    new MutationObserver(fit).observe(actL, { childList: true, characterData: true, subtree: true }); fit(); }
})();
