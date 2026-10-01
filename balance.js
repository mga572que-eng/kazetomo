// ともしびアイランド — v11 そうび袋・防具の 種類・店の 品ぞろえ・売却（K.bal）
// ・武器は キャラ専用（どの 職業でも そうびできる。職業との 相性は jobs.js の K.weaponAff）
// ・防具は 種類（ふく／けいそう／じゅうそう／ローブ）で 職業ごとに そうびできる ものが ちがう。「旅の服」系の ふくは 全職業 OK
// ・買った そうびは 袋（G.bag）に 入る。いらなくなった ものは 定価の 4割で 売れる（そうび中の ものは 売れない）
// セーブ互換：G.eq[id].w / .a は これまでどおり 配列の 番号。DATA.gear / DATA.armor は 後ろに 足すだけ（番号は 変えない）
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK;
  const G = () => K.G; const HUMANS = ['sora', 'mio', 'riku', 'sana', 'haru', 'kaito'];
  const SELL = .4;

  // ---------- 防具の 種類 ----------
  const CAT = { cloth: 'ふく', light: 'けいそう', heavy: 'じゅうそう', robe: 'ローブ' };
  const CAT_ICON = { cloth: '👕', light: '🦺', heavy: '🛡', robe: '🧥' };
  DATA.armorBase = DATA.armorBase || DATA.armor.length; // ここまでが 鍛冶（ゲンの工房）で 打てる 順番の 防具
  const BASE_TY = ['cloth', 'light', 'heavy', 'light', 'robe', 'robe', 'light'];
  DATA.armor.forEach((a, i) => { if (!a.ty) a.ty = BASE_TY[i] || 'light'; });
  // 地域ごとの 防具（同じ 値段なら じゅうそう＞けいそう＞ローブ＞ふく。ローブは 魔法職、じゅうそうは 前衛 向け）
  const ADD_ARMOR = [
    { name: '旅人の マント', def: 10, price: 500, ty: 'cloth', r: 1, note: 'どの 職業でも 着られる' },
    { name: '鉄の よろい', def: 17, price: 1000, ty: 'heavy', r: 1 },
    { name: '魔導士の ローブ', def: 12, price: 750, ty: 'robe', r: 1, note: '魔法職 向け' },
    { name: '砂漠の ポンチョ', def: 17, price: 1800, ty: 'cloth', r: 1, note: 'どの 職業でも 着られる' },
    { name: '獣皮の よろい', def: 23, price: 2400, ty: 'light', r: 1 },
    { name: '鋼鉄の 重よろい', def: 28, price: 3000, ty: 'heavy', r: 1 },
    { name: '雲の シャツ', def: 23, price: 3200, ty: 'cloth', r: 2, sky: true, note: 'どの 職業でも 着られる' },
    { name: '雲糸の 胴衣', def: 31, price: 4200, ty: 'light', r: 2, sky: true },
    { name: '天崖の 甲冑', def: 37, price: 5200, ty: 'heavy', r: 2, sky: true },
    { name: '泡の 潜水衣', def: 27, price: 5400, ty: 'cloth', r: 3, sea: true, note: 'どの 職業でも 着られる' },
    { name: '潮衣の 羽織', def: 32, price: 7000, ty: 'robe', r: 3, sea: true },
    { name: '海神の 重甲', def: 43, price: 8800, ty: 'heavy', r: 3, sea: true },
  ];
  for (const a of ADD_ARMOR) if (!DATA.armor.some(x => x.name === a.name)) DATA.armor.push({ ...a, add: true });
  // 職業ごとの 防具（見習いと 勇灯は ぜんぶ）。ふくは 全職業
  const JOB_A = { minarai: ['cloth', 'light', 'heavy', 'robe'], senshi: ['cloth', 'light', 'heavy'], mahou: ['cloth', 'robe'], souryo: ['cloth', 'robe'],
    touzoku: ['cloth', 'light'], butouka: ['cloth', 'light'], shounin: ['cloth', 'light', 'robe'], kariudo: ['cloth', 'light'], ginyuu: ['cloth', 'light', 'robe'], yuutou: ['cloth', 'light', 'heavy', 'robe'] };
  for (const j of DATA.jobs || []) j.eqA = JOB_A[j.id] || ['cloth', 'light', 'heavy', 'robe'];
  const jobOf = m => (G().job && G().job[m.id] && G().job[m.id].cur) || 'minarai';
  const canWear = (m, ai, jid) => { const a = DATA.armor[ai]; if (!a) return false; if (!HUMANS.includes(m.id)) return true; return (JOB_A[jid || jobOf(m)] || JOB_A.minarai).includes(a.ty); };

  // ---------- 袋（G.bag） ----------
  const bag = () => { const g = G(); if (!g.bag || typeof g.bag !== 'object') g.bag = {}; const b = g.bag; if (!b.w || typeof b.w !== 'object') b.w = {}; if (!b.a || typeof b.a !== 'object') b.a = {};
    for (const id of HUMANS) if (!Array.isArray(b.w[id])) b.w[id] = []; return b; };
  const addW = (id, i) => { if (i > 0 && DATA.gear[id] && DATA.gear[id][i]) bag().w[id].push(i); };
  const addA = i => { if (i > 0 && DATA.armor[i]) { const b = bag(); b.a[i] = (b.a[i] || 0) + 1; } };
  const takeW = (id, i) => { const L = bag().w[id], k = L.indexOf(i); if (k < 0) return false; L.splice(k, 1); return true; };
  const takeA = i => { const b = bag(); if (!(b.a[i] > 0)) return false; if (--b.a[i] <= 0) delete b.a[i]; return true; };
  const valW = (id, i) => { const g = DATA.gear[id][i]; return g ? (g.price || Math.round(g.atk * 30)) : 0; };
  const valA = i => { const a = DATA.armor[i]; return a ? (a.price || Math.round(a.def * 30)) : 0; };
  const rate = () => (K.jobPerk && K.jobPerk('shounin') ? .5 : SELL); // 商人が 仲間に いると 5割で 売れる
  const sellW = (id, i) => Math.floor(valW(id, i) * rate()), sellA = i => Math.floor(valA(i) * rate());
  // 鍛冶で 打った 段（ゲンの工房の 防具の 進み具合）
  const armTier = () => { const g = G(); let t = g.armTier || 0; for (const id of HUMANS) { const a = g.eq[id] && g.eq[id].a; if (a != null && a < DATA.armorBase) t = Math.max(t, a); } return t; };

  // 袋の 外で そうびが かわった とき（ゲンの工房で 打った 等）、外した ものを 袋へ
  let last = null;
  const snap = () => { const g = G(); last = {}; for (const id of HUMANS) if (g.eq[id]) last[id] = { w: g.eq[id].w, a: g.eq[id].a }; };
  const watch = () => { const g = G(); if (!g || !g.eq) return; if (!last) { snap(); return; }
    for (const id of HUMANS) { const e = g.eq[id], l = last[id]; if (!e) continue; if (!l) { last[id] = { w: e.w, a: e.a }; continue; }
      if (e.w !== l.w) { addW(id, l.w); takeW(id, e.w); }
      if (e.a !== l.a) { addA(l.a); takeA(e.a); if (e.a < DATA.armorBase) g.armTier = Math.max(g.armTier || 0, e.a); }
      l.w = e.w; l.a = e.a; } };
  const equipW = (m, i) => { const e = G().eq[m.id]; if (e.w === i) return; if (!takeW(m.id, i)) return false; addW(m.id, e.w); e.w = i; snap(); recalc(m); return true; };
  const equipA = (m, i) => { const e = G().eq[m.id]; if (e.a === i) return; if (i !== 0 && !takeA(i)) return false; addA(e.a); e.a = i; if (i < DATA.armorBase) G().armTier = Math.max(G().armTier || 0, i); snap(); recalc(m); return true; };
  const recalc = m => { if (!m || !m.st) return; const hr = m.st.hp ? m.hp / m.st.hp : 1; K.calc(m); m.hp = Math.max(m.hp > 0 ? 1 : 0, Math.min(m.st.hp, Math.round(m.st.hp * hr))); m.mp = Math.min(m.mp, m.st.mp); };
  // 職業に 合う いちばん 強い 防具（袋＋いま 着ている もの＋旅の服）
  const bestA = (m, jid) => { const b = bag(); const cand = [0, G().eq[m.id].a, ...Object.keys(b.a).map(Number)]; return cand.filter(i => canWear(m, i, jid)).sort((x, y) => DATA.armor[y].def - DATA.armor[x].def)[0] || 0; };

  // ---------- 能力計算：武器（職業との 相性）＋防具 ----------
  H.gearFlat = (m, st, e0) => { const e = m.__eq || e0 || { w: 0, a: 0 }; const L = DATA.gear[m.id] || []; const w = L[e.w] || L[0] || { atk: 0 };
    const aff = K.weaponAff ? K.weaponAff(m) : 1; st.atk += Math.round(w.atk * aff); st.def += (DATA.armor[e.a] || DATA.armor[0]).def; };

  // ---------- 転職の ときの 防具 ----------
  const refitEq = (m, jid) => { const e = G().eq[m.id]; return canWear(m, e.a, jid) ? { w: e.w, a: e.a } : { w: e.w, a: bestA(m, jid) }; };
  const refitPlan = (m, jid) => { const e = G().eq[m.id]; if (canWear(m, e.a, jid)) return []; const n = refitEq(m, jid).a;
    return [`${DATA.armor[e.a].name}（${CAT[DATA.armor[e.a].ty]}）は 着られない → ${DATA.armor[n].name}`]; };
  const refit = m => { const e = G().eq[m.id]; if (canWear(m, e.a)) return []; const old = DATA.armor[e.a].name, n = bestA(m); equipA(m, n); return [`${old}を 袋に しまい、${DATA.armor[n].name}を 着た`]; };
  const catNames = L => (L || []).filter(c => CAT[c]).map(c => CAT[c]).join('・') || '—';

  // ---------- セーブ ----------
  H.load.push(g => { bag(); if (g.armTier == null) { g.armTier = 0; for (const id of HUMANS) { const a = g.eq && g.eq[id] && g.eq[id].a; if (a != null && a < DATA.armorBase) g.armTier = Math.max(g.armTier, a); } }
    for (const id of HUMANS) if (g.eq && g.eq[id] && !DATA.armor[g.eq[id].a]) g.eq[id].a = 0; last = null; });
  H.init.push(g => { g.bag = { w: {}, a: {} }; g.armTier = 0; last = null; });
  H.frame.push(() => { try { watch(); } catch (e) {} });

  // ---------- 見た目 ----------
  const css = document.createElement('style');
  css.textContent = `.balp .shop-body{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .balp .slist,.balp .sdet{max-height:calc(var(--app-h,100vh) - 150px)}
  .balp .ty{font-size:11px;color:var(--muted);margin-left:6px}
  .balp .srow.eqd{box-shadow:inset 3px 0 0 var(--gold)}
  .balp .who{display:grid;grid-template-columns:24px 1fr auto;gap:6px;align-items:center;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:13px}
  .balp .who .fc{width:24px;height:24px;border-radius:50%;overflow:hidden;background:#1c2744}.balp .who .fc svg{width:100%;height:100%;transform:scale(1.3) translateY(6%)}
  .balp .who button{background:var(--gold);color:#241a08;border:0;border-radius:6px;padding:4px 10px;font-size:12px;font-family:var(--ui);cursor:pointer;min-height:32px}
  .balp .who button:disabled{opacity:.4}.balp .no{color:#f08a6a;font-size:12px}.balp .up{color:#8fe06a}.balp .dn{color:#f08a6a}
  .balp .hint{font-size:12px;color:var(--muted);margin:4px 0}
  @media (max-height:430px){.balp .slist,.balp .sdet{max-height:calc(var(--app-h,100vh) - 128px)}}
  @media (max-width:520px){.balp .shop-body{grid-template-columns:1fr}}`;
  document.head.appendChild(css);
  const face = m => `<span class="fc">${Art.portrait(m.id, 'smile')}</span>`;
  const humans = () => G().party.filter(m => HUMANS.includes(m.id));
  const atkWith = (m, i) => { const c = { ...m, __eq: { w: i, a: G().eq[m.id].a } }; K.calc(c); return c.st.atk; };
  const defWith = (m, i) => { const c = { ...m, __eq: { w: G().eq[m.id].w, a: i } }; K.calc(c); return c.st.def; };
  const delta = (a, b) => { const d = b - a; return `<b class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${b}${d ? `（${d > 0 ? '▲' : '▼'}${Math.abs(d)}）` : ''}</b>`; };

  // ---------- 店 ----------
  const SAY = { weapon: ['いらっしゃい！ いい品が そろってるよ。', '雲の上の 鍛冶は 軽くて 強いのさ。', '潮に さびない 武器だよ。'], armor: ['よろいは 命を まもる。 職業に 合う ものを えらびな。', '雲の 糸で 織った 防具だよ。', '人魚の 鱗は かるくて じょうぶさ。'] };
  function shop(kind) { return new Promise(res => {
    const reg = G().region; const sky = reg === 2, sea = reg === 3;
    const title = kind === 'armor' ? (sea ? '海の防具屋' : sky ? '空の防具屋' : '防具屋') : (sea ? '海の武器屋' : sky ? '空の武器屋' : '武器屋');
    let tab = 'buy', sel = 0, armed = null, line = SAY[kind][sea ? 2 : sky ? 1 : 0];
    const el = document.createElement('div'); el.className = 'win panel shop balp'; const M = { el, panel: true, items: [], res };
    const close = () => { K.closeMenu(M, -1); K.hud(); K.save(); };
    const here = x => !!x.sky === sky && !!x.sea === sea && (reg !== 0 || x.r === 0);
    const rows = () => { const out = [];
      if (tab === 'buy' && kind === 'weapon') for (const m of humans()) DATA.gear[m.id].forEach((g, i) => { if (g.price && here(g)) out.push({ t: 'w', m, i, name: g.name, sub: K.nameOf(m), price: g.price, icon: '⚔', own: G().eq[m.id].w === i || bag().w[m.id].includes(i) }); });
      if (tab === 'buy' && kind === 'armor') DATA.armor.forEach((a, i) => { if (a.price && here(a)) out.push({ t: 'a', i, name: a.name, sub: `${CAT[a.ty]}・ぼうぎょ ${a.def}`, price: a.price, icon: CAT_ICON[a.ty] }); });
      if (tab === 'sell') { const b = bag();
        for (const id of HUMANS) for (const i of [...new Set(b.w[id])]) { const n = b.w[id].filter(x => x === i).length; out.push({ t: 'sw', id, i, name: DATA.gear[id][i].name, sub: `${K.nameOf(G().party.find(m => m.id === id) || { id, kind: 'human' })}の 武器${n > 1 ? ` ×${n}` : ''}`, price: sellW(id, i), icon: '⚔' }); }
        for (const [k, n] of Object.entries(b.a)) { const i = +k, a = DATA.armor[i]; if (a && n > 0) out.push({ t: 'sa', i, name: a.name, sub: `${CAT[a.ty]}・ぼうぎょ ${a.def}${n > 1 ? ` ×${n}` : ''}`, price: sellA(i), icon: CAT_ICON[a.ty] }); } }
      return out; };
    const detail = o => {
      if (!o) return `<div class="sdet"><p class="st-eq">${tab === 'sell' ? '売れる そうびが ない。（そうび中の ものは 売れない。外すには メニューの「そうび」）' : '品物が ない。'}</p></div>`;
      if (o.t === 'w') { const m = o.m, cur = DATA.gear[m.id][G().eq[m.id].w], a0 = m.st.atk, a1 = atkWith(m, o.i), aff = K.weaponAff ? K.weaponAff(m) : 1;
        return `<div class="sdet"><h4>${o.icon} ${o.name}</h4><div>${K.esc(K.nameOf(m))} せんようの 武器（こうげき ${DATA.gear[m.id][o.i].atk}）</div>
          <div class="who">${face(m)}<span>こうげき ${a0} → ${delta(a0, a1)}</span><span></span></div>
          <div class="hint">いま：${cur.name}${aff !== 1 ? `　職業の 相性 ×${aff}` : ''}${G().eq[m.id].w ? `　古い 武器は 袋に 入り、${sellW(m.id, G().eq[m.id].w)}Gで 売れる` : ''}</div>
          ${o.own ? '<div class="eq">もう もっている</div>' : `<button class="buy" data-buy="1" ${G().gold < o.price ? 'disabled' : ''}>${armed === 'buy' ? (atkWith(m, o.i) > a0 ? '本当に 買う？（そのまま そうび）' : '本当に 買う？（袋へ）') : `買う ${o.price}G`}</button>`}</div>`; }
      if (o.t === 'a') { const a = DATA.armor[o.i];
        const list = humans().map((m, pi) => { const ok = canWear(m, o.i), d0 = m.st.def, d1 = defWith(m, o.i), same = G().eq[m.id].a === o.i;
          return `<div class="who">${face(m)}<span>${K.esc(K.nameOf(m))}　${ok ? `ぼうぎょ ${d0} → ${delta(d0, d1)}` : `<span class="no">${(DATA.jobs.find(j => j.id === jobOf(m)) || {}).name || ''}は 着られない</span>`}</span>${same ? '<span class="eq">そうび中</span>' : `<button data-one="${pi}" ${!ok || G().gold < o.price ? 'disabled' : ''}>${armed === 'one' + pi ? '本当に？' : `${o.price}G`}</button>`}</div>`; }).join('');
        return `<div class="sdet"><h4>${o.icon} ${o.name}</h4><div>${CAT[a.ty]}・ぼうぎょ ${a.def}${a.note ? `　<small>${a.note}</small>` : ''}</div>${list}<div class="hint">買うと その人が そのまま 着る。外した 防具は 袋に 入り、売ることも できる。</div></div>`; }
      return `<div class="sdet"><h4>${o.icon} ${o.name}</h4><div>${o.sub}</div><div class="hint">定価の ${Math.round(rate() * 10)}割で 買いとる。${rate() > SELL ? '（商人の おかげ）' : ''}</div><button class="buy" data-buy="1">${armed === 'buy' ? '本当に 売る？' : `売る +${o.price}G`}</button></div>`; };
    const paint = () => { const R0 = rows(); sel = Math.min(sel, Math.max(0, R0.length - 1)); const o = R0[sel];
      el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button><div class="shop-top"><div class="shop-face">${Art.portrait('shopW', armed ? 'grin' : 'smile')}</div><div><b>${title}</b><div class="shop-say">「${line}」</div></div><div class="shop-gold">${G().gold} G</div></div>
        <div class="tabs"><button class="tab${tab === 'buy' ? ' on' : ''}" data-tab="buy">かう</button><button class="tab${tab === 'sell' ? ' on' : ''}" data-tab="sell">うる</button></div>
        <div class="shop-body"><div class="slist">${R0.map((r, i) => `<button class="srow${i === sel ? ' on' : ''}${r.own ? ' dis' : ''}" data-i="${i}"><span class="ic" style="font-size:18px">${r.icon}</span><span>${r.name}<small>${K.esc(r.sub)}</small></span><span class="pr">${tab === 'sell' ? '+' : ''}${r.price}G</span></button>`).join('') || '<p class="st-eq">なし</p>'}</div>${detail(o)}</div>`;
      el.querySelector('.m-x').onclick = () => { Music.sfx('cancel'); close(); };
      el.querySelectorAll('.tab').forEach(b => b.onclick = () => { tab = b.dataset.tab; sel = 0; armed = null; Music.sfx('cursor'); paint(); });
      el.querySelectorAll('.srow').forEach(b => b.onclick = () => { sel = +b.dataset.i; armed = null; Music.sfx('cursor'); paint(); });
      const bb = el.querySelector('[data-buy]'); if (bb) bb.onclick = () => act(o);
      el.querySelectorAll('[data-one]').forEach(b => b.onclick = () => { const pi = +b.dataset.one; if (armed !== 'one' + pi) { armed = 'one' + pi; Music.sfx('cursor'); paint(); return; } armed = null;
        const m = humans()[pi]; if (G().gold < o.price || !canWear(m, o.i)) return; G().gold -= o.price; addA(o.i); equipA(m, o.i); line = `${K.esc(K.nameOf(m))}に ${o.name}だね。 まいど！`; Music.sfx('buy'); paint(); K.hud(); K.save(); });
      const on = el.querySelector('.srow.on'); on && on.scrollIntoView && on.scrollIntoView({ block: 'nearest' }); };
    const act = o => { if (!o) return; if (armed !== 'buy') { armed = 'buy'; Music.sfx('cursor'); paint(); return; } armed = null;
      if (o.t === 'w') { if (G().gold < o.price || o.own) return; G().gold -= o.price; addW(o.m.id, o.i); const better = atkWith(o.m, o.i) > o.m.st.atk; if (better) equipW(o.m, o.i); line = better ? `${o.name}、${K.esc(K.nameOf(o.m))}に ぴったりだ！` : `${o.name}は 袋に 入れておいたよ。`; Music.sfx('buy'); }
      else if (o.t === 'sw') { if (!takeW(o.id, o.i)) return; G().gold += o.price; line = 'まいど。 大事に つかわれてたね。'; Music.sfx('buy'); }
      else if (o.t === 'sa') { if (!takeA(o.i)) return; G().gold += o.price; line = 'まいど。 手入れが いいね。'; Music.sfx('buy'); }
      paint(); K.hud(); K.save(); };
    snap(); paint(); document.getElementById('ui').appendChild(el); K.MENUS.push(M); }); }
  const prevShop = H.shopUI; H.shopUI = (kind, o) => kind === 'weapon' || kind === 'armor' ? shop(kind) : (prevShop ? prevShop(kind, o) : K.shopUI0(kind));

  // ---------- メニュー：そうび（袋から つけかえ） ----------
  function equipUI() { return new Promise(res => {
    const hs = humans(); if (!hs.length) { res(-1); return; } let mi = 0, armed = null;
    const el = document.createElement('div'); el.className = 'win panel shop balp'; const M = { el, panel: true, items: [], res };
    const paint = () => { const m = hs[mi], e = G().eq[m.id], b = bag(); const jn = (DATA.jobs.find(j => j.id === jobOf(m)) || {}).name || '';
      const ws = [e.w, ...[...new Set(b.w[m.id])].filter(i => i !== e.w)].map(i => ({ i, g: DATA.gear[m.id][i] })).filter(x => x.g);
      const as = [...new Set([e.a, 0, ...Object.keys(b.a).map(Number)])].filter(i => DATA.armor[i]).sort((x, y) => DATA.armor[y].def - DATA.armor[x].def);
      const wRow = x => { const on = x.i === e.w, a1 = atkWith(m, x.i); return `<div class="who"><span class="ic">⚔</span><span>${x.g.name}　<small>こうげき ${m.st.atk} → ${delta(m.st.atk, a1)}</small></span>${on ? '<span class="eq">そうび中</span>' : `<button data-w="${x.i}">${armed === 'w' + x.i ? '本当に？' : 'そうび'}</button>`}</div>`; };
      const aRow = i => { const a = DATA.armor[i], on = i === e.a, ok = canWear(m, i), d1 = defWith(m, i), n = i === 0 ? '' : on ? '' : ` ×${b.a[i] || 0}`;
        return `<div class="who"><span class="ic">${CAT_ICON[a.ty]}</span><span>${a.name}<small class="ty">${CAT[a.ty]}${n}</small>　${ok ? `<small>ぼうぎょ ${m.st.def} → ${delta(m.st.def, d1)}</small>` : `<span class="no">${jn}は 着られない</span>`}</span>${on ? '<span class="eq">そうび中</span>' : `<button data-a="${i}" ${ok ? '' : 'disabled'}>${armed === 'a' + i ? '本当に？' : 'そうび'}</button>`}</div>`; };
      el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button><h3>そうび <small>袋の 中から つけかえる（外した ものは 袋へ）</small></h3>
        <div class="tabs">${hs.map((p, i) => `<button class="tab${i === mi ? ' on' : ''}" data-m="${i}">${K.esc(K.nameOf(p))}</button>`).join('')}</div>
        <div class="hint">${K.esc(K.nameOf(m))}：${jn}　着られる 防具：${catNames(JOB_A[jobOf(m)])}</div>
        <div class="shop-body"><div class="sdet"><b>武器</b>${ws.map(wRow).join('')}</div><div class="sdet"><b>防具</b>${as.map(aRow).join('')}</div></div>`;
      el.querySelector('.m-x').onclick = () => { Music.sfx('cancel'); K.closeMenu(M, -1); K.hud(); K.save(); };
      el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mi = +b.dataset.m; armed = null; Music.sfx('cursor'); paint(); });
      el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { const i = +b.dataset.w; if (armed !== 'w' + i) { armed = 'w' + i; Music.sfx('cursor'); paint(); return; } armed = null; equipW(hs[mi], i); Music.sfx('ok'); paint(); });
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const i = +b.dataset.a; if (armed !== 'a' + i) { armed = 'a' + i; Music.sfx('cursor'); paint(); return; } armed = null; if (canWear(hs[mi], i)) equipA(hs[mi], i); Music.sfx('ok'); paint(); }); };
    snap(); paint(); document.getElementById('ui').appendChild(el); K.MENUS.push(M); }); }
  H.menu.push(() => ({ label: 'そうび', sub: '武器・防具の つけかえ', fn: equipUI }));

  K.bal = { refit, refitPlan, refitEq, catNames, canWear, bag, sellW, sellA, armTier, equipUI, CAT };
})();
