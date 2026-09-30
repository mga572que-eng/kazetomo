// 風灯の島 — わが家（拠点づくり）：家具・拠点レベル・住人・花だん
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK, B = World.Blocks, R = Math.random;
  // ---------- レシピ ----------
  DATA.recipes.push(
    { out: 15, n: 1, need: { maki: 5, ha: 3 } }, { out: 16, n: 1, need: { maki: 4, ishi: 2 } },
    { out: 17, n: 1, need: { ishi: 5, maki: 1 } }, { out: 18, n: 1, need: { ha: 2, suna: 1, mi: 1 } });
  const ADV = [ // 作業台で だけ つくれる
    { out: 2, n: 4, need: { maki: 2, ishi: 2 } }, { out: 6, n: 6, need: { ishi: 4 } }, { out: 7, n: 4, need: { suna: 3 } },
    { out: 10, n: 4, need: { hoshikake: 1 } }, { out: 11, n: 6, need: { kumowata: 1 } }, { out: 3, n: 6, need: { ishi: 2, maki: 2 } }];
  DATA.baseLevels = [
    { lv: 1, text: 'ブロック 10こ', ok: c => c.n >= 10, perk: '地図の ワープ先に「わが家」' },
    { lv: 2, text: 'ブロック 30こ ＋ ベッド', ok: c => c.n >= 30 && c.t[15], perk: 'いきものが 1ぴき すみつく' },
    { lv: 3, text: 'ブロック 60こ ＋ 作業台 ＋ かまど', ok: c => c.n >= 60 && c.t[16] && c.t[17], perk: '住人 2ひき・作業台の 上級レシピ' },
    { lv: 4, text: 'ブロック 100こ ＋ 花だん ＋ 屋根 8こ', ok: c => c.n >= 100 && c.t[18] && (c.t[3] || 0) >= 8, perk: '住人 3びき・おみやげが ふえる' },
    { lv: 5, text: 'ブロック 160こ ＋ ランタン 4こ ＋ ガラス 4こ', ok: c => c.n >= 160 && (c.t[2] || 0) >= 4 && (c.t[7] || 0) >= 4, perk: '称号「建築家」・花だんの 実りが 2ばい' },
  ];
  const HALF = 8; // 17×17 の 区画
  // ---------- 区画の 場所（村の 近くの 平らな 土地） ----------
  const reg0 = K.REG[0]; let site = null;
  (() => { World.setRegion(0); let s = 4242; const rn = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; let best = null;
    const far = (x, z) => !(reg0.beacons || []).some(b => Math.hypot(b.x - x, b.z - z) < 26) && !(reg0.shrine && Math.hypot(reg0.shrine.x - x, reg0.shrine.z - z) < 30)
      && !DATA.shrines.some(o => o.r === 0 && o.pos && Math.hypot(o.pos.x - x, o.pos.z - z) < 30) && !(reg0.pier && Math.hypot(reg0.pier.x - x, reg0.pier.z - z) < 20);
    for (let k = 0; k < 3000; k++) { const a = rn() * 6.283, d = 26 + rn() * 34; const x = Math.round(reg0.town.x + Math.cos(a) * d), z = Math.round(reg0.town.z + Math.sin(a) * d);
      const h = K.hAt(x, z); if (h < 1.5 || h > 24 || !far(x, z)) continue; let mn = 1e9, mx = -1e9;
      for (let i = -HALF; i <= HALF; i += 2) for (let j = -HALF; j <= HALF; j += 2) { const hh = K.hAt(x + i, z + j); mn = Math.min(mn, hh); mx = Math.max(mx, hh); }
      if (mn < 1) continue; const sc = mx - mn + d * .01; if (!best || sc < best.sc) best = { x, z, sc, y: Math.floor(K.hAt(x, z)) }; if (mx - mn < .8) break; }
    site = best;
    // 四すみの 柱と ランタン、立て札の 柱
    for (const [a, b] of [[-HALF, -HALF], [HALF, -HALF], [-HALF, HALF], [HALF, HALF]]) { const x = site.x + a, z = site.z + b, g = Math.floor(K.hAt(x + .5, z + .5));
      B.set(x, g, z, 5, true, 0); B.set(x, g + 1, z, 5, true, 0); B.set(x, g + 2, z, 2, true, 0); }
    const sx = site.x, sz = site.z + HALF + 2, sg = Math.floor(K.hAt(sx + .5, sz + .5)); B.set(sx, sg, sz, 5, true, 0); B.set(sx, sg + 1, sz, 0, true, 0);
    site.sign = { x: sx + .5, z: sz + .5 }; World.setRegion(0); })();
  const inPlot = (x, z) => site && Math.abs(x - site.x - .5) <= HALF + .5 && Math.abs(z - site.z - .5) <= HALF + .5;
  K.baseSite = site;
  // ---------- 数える ----------
  let cnt = { n: 0, t: {} };
  function count() { const c = { n: 0, t: {} }; B.each(0, (k, t, prot) => { if (prot) return; const [x, , z] = k.split(',').map(Number); if (Math.abs(x - site.x) <= HALF && Math.abs(z - site.z) <= HALF) { c.n++; c.t[t] = (c.t[t] || 0) + 1; } }); return c; }
  const lvOf = c => { let lv = 0; for (const L of DATA.baseLevels) if (L.ok(c)) lv = L.lv; else break; return lv; };
  const residentsMax = lv => lv >= 4 ? 3 : lv >= 3 ? 2 : lv >= 2 ? 1 : 0;
  let chk = 0;
  H.frame.push(dt => { chk -= dt; if (chk > 0 || K.G.region !== 0 || K.phase !== 'field') return; chk = 2; const G = K.G;
    cnt = count(); const lv = lvOf(cnt); const old = G.baseLv || 0;
    if (lv > old) { G.baseLv = lv; const L = DATA.baseLevels[lv - 1]; Music.sfx('friend'); K.tip(`<b>わが家が レベル${lv}に なった！</b><span>${L.perk}</span>`, 3200); fixResidents(); K.save(); }
    if (inPlot(K.player.x, K.player.z)) visit(); });
  // ---------- 住人 ----------
  function fixResidents() { const G = K.G; G.residents = (G.residents || []).filter(u => G.mons.some(m => m.uid === u && !G.team.includes(u))); const max = residentsMax(G.baseLv || 0);
    if (G.residents.length < max) for (const m of G.mons) { if (G.residents.length >= max) break; if (!G.team.includes(m.uid) && !G.residents.includes(m.uid)) G.residents.push(m.uid); }
    G.residents.length = Math.min(G.residents.length, max); }
  const walkers = {};
  H.actors.push((put, T, dt) => { const G = K.G; if (G.region !== 0 || !site || !G.residents || !G.residents.length) return; if (Math.hypot(K.player.x - site.x, K.player.z - site.z) > 90) return;
    G.residents.forEach((u, i) => { const m = G.mons.find(x => x.uid === u); if (!m) return; const w = walkers[u] = walkers[u] || { x: site.x + (i - 1) * 2, z: site.z + 2, tx: site.x, tz: site.z, t: 0, yaw: 0 };
      w.t -= dt; if (w.t <= 0) { w.tx = site.x + .5 + (R() - .5) * (HALF * 1.6); w.tz = site.z + .5 + (R() - .5) * (HALF * 1.6); w.t = 2 + R() * 4; }
      const dx = w.tx - w.x, dz = w.tz - w.z, d = Math.hypot(dx, dz); if (d > .2) { const sp = Math.min(d, 1.3 * dt); w.x += dx / d * sp; w.z += dz / d * sp; w.yaw = Math.atan2(dx, dz); }
      const S = K.SPC[m.id], y = K.surfaceAt(w.x, w.z, 40); put(m.id, w.x, y + (S.arch === 'sprite' || S.arch === 'bird' ? .5 + Math.sin(T * 2 + i) * .15 : Math.abs(Math.sin(T * 4 + i)) * .1), w.z, (S.size || 1) * .85, w.yaw + (m.shiny ? 100 : 0)); }); });
  const GIFT = [['mi', 30], ['ha', 20], ['kinoko', 16], ['ishi', 12], ['maki', 12], ['shizuku', 6], ['nakayoshi', 3], ['hoshikake', 1]];
  const pick = () => { let t = R() * GIFT.reduce((a, g) => a + g[1], 0); for (const [k, w] of GIFT) if ((t -= w) < 0) return k; return 'mi'; };
  function visit() { const G = K.G; if (!G.residents || !G.residents.length || K.busy) return; if (G.play - (G.baseGiftT || 0) < 300) return; G.baseGiftT = G.play;
    const lines = []; for (const u of G.residents) { const m = G.mons.find(x => x.uid === u); if (!m) continue; const k = pick(), n = (G.baseLv >= 4 ? 2 : 1); K.gain(k, n); m.bond = Math.min(100, (m.bond || 0) + 1); lines.push(`${K.nameOf(m)}：${DATA.items[k].name}×${n}`); }
    if (lines.length) { Music.sfx('friend'); K.tip(`<b>住人から おみやげ！</b><span>${lines.join('　')}</span>`, 3200); } }
  // ---------- しらべる：立て札・家具 ----------
  const near = [];
  H.target.push(cand => { const G = K.G; if (G.region !== 0 || !site) return; cand(site, 'basesign', site.sign.x, site.sign.z, 2.6);
    if (!inPlot(K.player.x, K.player.z)) return; const px = Math.floor(K.player.x), pz = Math.floor(K.player.z), py = Math.floor(K.player.y);
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (let h = -1; h <= 1; h++) { const t = B.get(px + a, py + h, pz + b); if (t >= 15 && t <= 18 && !B.isProt(px + a, py + h, pz + b)) cand({ t, k: `${px + a},${py + h},${pz + b}` }, 'furn', px + a + .5, pz + b + .5, 1.9); } });
  H.labels.basesign = () => 'わが家の 立て札'; H.labels.furn = t => ({ 15: 'ベッドで やすむ', 16: '作業台を つかう', 17: 'かまどで 料理', 18: '花だんを 見る' })[t.o.t];
  H.acts.basesign = async () => { const G = K.G; cnt = count(); const lv = G.baseLv || 0; const nx = DATA.baseLevels[lv];
    const rs = (G.residents || []).map(u => G.mons.find(m => m.uid === u)).filter(Boolean);
    const c = await K.menu({ title: `わが家　レベル${lv}`, items: [{ label: 'わが家の ようす', sub: nx ? `つぎ：${nx.text}` : '最高レベル！' }, { label: '住人を えらぶ', sub: rs.length ? rs.map(K.nameOf).join('・') : (residentsMax(lv) ? 'まだ いない' : 'レベル2から'), disabled: !residentsMax(lv) }, { label: 'たてかた の こつ' }] });
    if (c === 0) await K.panel(`<h3>わが家　レベル${lv}</h3><p class="q-now">置いた ブロック ${cnt.n}こ　／　家具：${[15, 16, 17, 18].filter(t => cnt.t[t]).map(t => DATA.blocks[t]).join('・') || 'なし'}</p>
      <ul class="ql">${DATA.baseLevels.map(L => `<li>${lv >= L.lv ? '<b class="ok">✓</b>' : '<b class="ng">□</b>'} Lv${L.lv}：${L.text}<br><span class="st-eq">→ ${L.perk}</span></li>`).join('')}</ul>
      <p class="st-eq">四すみの ランタンの 内がわに 置いた ブロックが 数えられる。</p>`, 'wide');
    if (c === 1) { const pool = G.mons.filter(m => !G.team.includes(m.uid)); if (!pool.length) { await K.say(['たいれつに いない いきものが いない。 牧場の なかまを ふやそう。']); return; }
      const max = residentsMax(lv); G.residents = []; for (let n = 0; n < max; n++) { const left = pool.filter(m => !G.residents.includes(m.uid)); if (!left.length) break;
        const i = await K.menu({ title: `住人 ${n + 1}/${max}`, items: [...left.map(m => ({ label: K.nameOf(m), sub: `Lv${m.lv}` })), { label: 'ここまで' }], where: 'side' }); if (i < 0 || i >= left.length) break; G.residents.push(left[i].uid); }
      K.toast('住人が きまった！', 1200); K.save(); }
    if (c === 2) await K.say(['「つくる」モード（Bキー / 🔨）で ブロックを 置こう。', 'クラフトで ベッド・作業台・かまど・花だんも つくれる。', 'ベッドは タダで ぐっすり、作業台では 上級レシピ、かまどで 料理、花だんは ときどき 実りを くれる。']); };
  H.acts.furn = async ({ t, k }) => { const G = K.G;
    if (t === 15) { await K.say(['ふかふかの ベッドで ひとやすみ……']); await K.fade(true); await K.rest(0); await K.wait(500); await K.fade(false); await K.say(['みんな 元気いっぱいに なった！']); return; }
    if (t === 16) { if ((G.baseLv || 0) < 3) { await K.say(['作業台：わが家が レベル3に なると 上級レシピが つかえる。', 'いまは ふつうの クラフトが できる。']); return K.craftMenu(); }
      while (true) { const can = r => Object.entries(r.need).every(([q, v]) => (G.inv[q] || 0) >= v);
        const i = await K.menu({ title: '作業台（上級レシピ）', items: [...ADV.map(r => ({ label: `${DATA.blocks[r.out]} ×${r.n}`, sub: Object.entries(r.need).map(([q, v]) => `${DATA.items[q].name}${v}（${G.inv[q] || 0}）`).join(' '), disabled: !can(r) })), { label: 'ふつうの クラフト' }], where: 'side' });
        if (i < 0) return; if (i === ADV.length) return K.craftMenu(); const r = ADV[i]; for (const [q, v] of Object.entries(r.need)) G.inv[q] -= v; G.blk[r.out] = (G.blk[r.out] || 0) + r.n; Music.sfx('place'); K.hud(); K.toast(`${DATA.blocks[r.out]}ブロックを ${r.n}こ つくった`, 1200); } }
    if (t === 17) return K.cookMenu();
    if (t === 18) { G.flowerT = G.flowerT || {}; const wait = 240 - (G.play - (G.flowerT[k] || -1e9)); if (wait > 0) { await K.say([`花だん：つぼみが ふくらんでいる。（あと ${Math.ceil(wait / 60)}分くらい）`]); return; }
      G.flowerT[k] = G.play; const n = (G.baseLv || 0) >= 5 ? 2 : 1; const got = []; for (let i = 0; i < n; i++) { const it = R() < .08 ? 'nakayoshi' : ['mi', 'ha', 'kinoko'][Math.floor(R() * 3)]; const q = it === 'nakayoshi' ? 1 : 2; K.gain(it, q); got.push(`${DATA.items[it].name}×${q}`); }
      Music.sfx('pick'); await K.say([`花だんで ${got.join('、')}を しゅうかくした！`]); } };
  // ---------- 地図・ワープ・クエスト ----------
  H.mapMarks.push((r, pos) => r === 0 && site ? [`<span class="mk" style="${pos(site.x, site.z)}" title="わが家">🏠</span>`] : []);
  H.warps.push(r => r === 0 && site && (K.G.baseLv || 0) >= 1 ? [{ n: 'わが家', x: site.sign.x, z: site.sign.z + 1.5 }] : []);
  H.quest.push(() => `<li>わが家 レベル ${K.G.baseLv || 0}/5${K.G.baseLv >= 5 ? '（完成！）' : `（つぎ：${DATA.baseLevels[K.G.baseLv || 0].text}）`}</li>`);
  // （建設予定地の 光は 撤去：立て札に 近づくと 説明が 出る）
  H.load.push(G => { G.baseLv = G.baseLv || 0; G.residents = G.residents || []; G.flowerT = G.flowerT || {}; });
})();
