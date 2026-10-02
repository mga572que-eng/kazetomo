// ひとくいばこ — 面白さ部署 ⑥（docs/design/fun-audit.md）
// ・野外の 宝箱の いくつかの となりに「もう1つの 宝箱」。見た目は 同じだが、ときどき カタッと ゆれる（気づける ヒント）
// ・あけると ひとくいばこ！ びっくり戦闘（にげられる）。勝つと 星のかけらと お金（とくべつな 光の 演出）
// ・にげる／負けると 宝箱は のこる（あとで 再挑戦できる）。3体 たおすと 称号「ひとくいばこ ハンター」
// セーブ：G.mimic（たおした ひとくいばこ）だけ 追加。本物の 宝箱・中身は かえない
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined' || typeof DATA === 'undefined') return; const H = K.HOOK, W = World, G = () => K.G;
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; };
  // ---------- 3Dの 形（前が +z）：木の 箱・ひらいた ふた・歯・舌・光る 目 ----------
  function geo() { const Gm = W.Geo(), V = W.V;
    const tri = (a, b, c, col, ctr) => { let n = V.norm(V.cross(V.sub(b, a), V.sub(c, a))); const m = V.scale(V.add(V.add(a, b), c), 1 / 3); if (V.dot(n, V.sub(m, ctr)) < 0) n = V.scale(n, -1); for (const v of [a, b, c]) { Gm.p.push(...v); Gm.n.push(...n); Gm.c.push(...col); } };
    const box = (x0, x1, y0, y1, z0, z1, col, rot) => { const P = (x, y, z) => rot ? rot([x, y, z]) : [x, y, z];
      const v = [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0), P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)];
      const ctr = V.scale(v.reduce((s, p) => V.add(s, p), [0, 0, 0]), 1 / 8);
      for (const [a, b, c, d] of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]]) { tri(v[a], v[b], v[c], col, ctr); tri(v[a], v[c], v[d], col, ctr); } };
    const C = (h, e = 0) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255, e]; };
    const wood = C('#8a5226'), woodD = C('#6a3a18'), gold = C('#f2c24a'), red = C('#4a0c18'), white = C('#fff8ee'), pink = C('#ff6f8a'), eye = C('#ffe060', 1);
    // 箱
    box(-.45, .45, 0, .4, -.3, .3, wood); for (const x of [-.3, .3]) box(x - .035, x + .035, -.005, .405, -.315, .315, gold);
    box(-.39, .39, .36, .42, -.25, .25, red); // 口の 中
    for (let i = 0; i < 6; i++) { const x = -.32 + i * .128; W.seg(Gm, [x, .4, .26], [x, .52, .27], .045, .004, 4, white); } // 下の 歯
    // ふた（うしろの ちょうつがいで 60度 ひらく）
    const a = 1.05, ca = Math.cos(a), sa = Math.sin(a), rot = ([x, y, z]) => { const yy = y, zz = z + .3; return [x, .4 + yy * ca + zz * sa, -.3 + (-yy * sa + zz * ca)]; };
    box(-.47, .47, 0, .2, -.3, .32, wood, rot); box(-.42, .42, -.03, .005, -.26, .28, red, rot); box(-.05, .05, .02, .14, .32, .36, gold, rot);
    for (const x of [-.3, .3]) box(x - .035, x + .035, -.005, .205, -.31, .33, woodD, rot);
    for (let i = 0; i < 5; i++) { const x = -.28 + i * .14, p = rot([x, 0, .28]), q = rot([x, -.12, .27]); W.seg(Gm, p, q, .045, .004, 4, white); } // 上の 歯
    for (const sx of [-1, 1]) W.ico(Gm, .055, rot([sx * .16, -.04, -.12]), () => eye, 0, 1, 1); // 光る 目
    W.seg(Gm, [0, .42, 0], [0, .44, .3], .1, .085, 6, pink); W.seg(Gm, [0, .44, .3], [0, .3, .46], .085, .06, 6, pink); // 舌
    return Gm; }
  const mFoe = W.makeMesh(geo(), 4), mFake = W.makeMesh(W.propGeo('chest'), 8);
  K.mSp.hitokui = mFoe; // 戦闘の 3D（battle3d.js の meshOf は x.d.spArt で さがす）
  // ---------- 2Dの 絵（3Dを 使わない 設定の とき） ----------
  const SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#1d1420" stroke-width="5" stroke-linejoin="round">
    <path d="M40 110 L160 110 L160 178 L40 178 Z" fill="#9a5a28"/><path d="M60 110 L60 178 M140 110 L140 178" stroke="#f2c24a" stroke-width="9"/>
    <path d="M48 112 L152 112 L146 128 L54 128 Z" fill="#4a0c18"/>
    <path d="M36 108 C40 60 60 30 100 26 C140 30 160 60 164 108 L150 100 C146 70 128 50 100 48 C72 50 54 70 50 100 Z" fill="#9a5a28"/>
    <path d="M52 100 C56 70 74 54 100 52 C126 54 144 70 148 100 Z" fill="#4a0c18"/>
    ${[60, 76, 92, 108, 124, 140].map(x => `<path d="M${x - 6} 112 L${x} 98 L${x + 6} 112 Z" fill="#fff8ee" stroke-width="3"/>`).join('')}
    ${[66, 84, 100, 116, 134].map(x => `<path d="M${x - 6} 98 L${x} 112 L${x + 6} 98 Z" fill="#fff8ee" stroke-width="3"/>`).join('')}
    <path d="M92 124 C88 150 110 168 124 158 C130 150 118 140 112 124 Z" fill="#ff6f8a"/></g>
    <circle cx="82" cy="74" r="8" fill="#ffe060"/><circle cx="118" cy="74" r="8" fill="#ffe060"/><circle cx="82" cy="74" r="3" fill="#3a0a10"/><circle cx="118" cy="74" r="3" fill="#3a0a10"/></svg>`;
  const prevSp = Art.species; Art.species = (sp, o) => sp === 'hitokui' ? SVG : prevSp(sp, o);
  // ---------- 敵の データ（強さは いまの 仲間の レベルに 合わせる） ----------
  DATA.skills.marunomi_e = DATA.skills.marunomi_e || { name: 'まるのみ', tg: 'one', power: 1.7 };
  DATA.enemies.hitokui = { name: 'ひとくいばこ', spArt: 'hitokui', type: 'dark', hp: 200, atk: 20, def: 12, spd: 12, exp: 150, gold: 0, boss: true, acts: [['atk', .5], ['marunomi_e', .3], ['nemurigumo', .2]] };
  function tune() { const ps = (K.battleParty && K.battleParty()) || []; const lv = Math.max(1, ...ps.map(m => m.lv || 1)); const d = DATA.enemies.hitokui;
    Object.assign(d, { lv, hp: Math.round(22 * lv + 60), atk: Math.round(lv + 10), def: Math.round(lv * .8 + 6), spd: Math.round(lv * .6 + 8), exp: Math.round(14 * lv + 40) }); return d; }
  // ---------- 置き場所：本物の 宝箱の となり（地方ごとに 3つまで） ----------
  const spots = {}; const got = id => !!((G().mimic || {})[id]);
  function spotsOf(r) { if (spots[r]) return spots[r]; const R = K.REG && K.REG[r]; if (!R || !R.chests || W.region !== r) return [];
    const out = []; for (const c of R.chests) { if (out.length >= 3 || c.y == null || hash('mm' + c.id) >= .4) continue;
      for (let k = 0; k < 8; k++) { const an = hash(c.id) * 6.28 + k * Math.PI / 4, x = c.x + Math.sin(an) * 2.6, z = c.z + Math.cos(an) * 2.6, y = W.surfaceAt(x, z, c.y + 2);
        if (Math.abs(y - c.y) < .45 && !(K.blocked && K.blocked(x, z, y + .1))) { out.push({ id: 'mm:' + r + ':' + c.id, r, x, y, z, ph: hash(c.id + 'p') * 6 }); break; } } }
    return (spots[r] = out); }
  const LOOT = r => ({ gold: [150, 500, 900, 1300][r] || 150, n: r >= 2 ? 3 : r === 1 ? 2 : 1 }); // docs/reports/economy.md
  // ---------- 描く（ときどき カタッと ゆれる） ----------
  H.frame.push((dt, T) => { mFake.n = 0; if (K.phase !== 'field') return; const r = G().region, p = K.player; let n = 0;
    for (const s of spotsOf(r)) { if (got(s.id) || n >= 8 || Math.hypot(s.x - p.x, s.z - p.z) > 90) continue; const k = (T + s.ph) % 7, jig = k < .35 ? Math.sin(k * 60) : 0;
      mFake.set(n++, s.x, s.y + Math.abs(jig) * .07, s.z, 1, jig * .08); }
    mFake.n = n; });
  H.target.push(cand => { const r = G().region; for (const s of spotsOf(r)) if (!got(s.id)) cand(s, 'mimic', s.x, s.z, 2.2); });
  H.labels.mimic = '宝箱を あける';
  // ---------- びっくり → 戦闘 ----------
  const css = document.createElement('style'); css.textContent = `#mmfx{position:fixed;inset:0;z-index:57;pointer-events:none;background:radial-gradient(circle,rgba(255,40,40,0) 30%,rgba(160,0,20,.75));opacity:0}#mmfx.on{animation:mmf .9s ease-out}@keyframes mmf{0%{opacity:0}15%{opacity:1}100%{opacity:0}}body.calm-fx #mmfx.on{animation-duration:.3s}`; document.head.appendChild(css);
  const fx = document.createElement('div'); fx.id = 'mmfx'; document.body.appendChild(fx);
  const sfx = s => { try { Music.sfx(s); } catch (_) {} };
  H.acts.mimic = async s => { if (got(s.id)) return; sfx('cursor'); await K.say(['宝箱に 手を かけた……']);
    fx.classList.remove('on'); void fx.offsetWidth; fx.classList.add('on'); sfx('crit');
    await K.say(['ガタガタッ！！ 宝箱が 大きな 口を あけた！', 'ひとくいばこが あらわれた！']);
    tune(); const res = await K.runBattle([{ boss: 'hitokui' }], { noFlee: false });
    if (res === 'flee') { await K.say(['ひとくいばこは もとの 場所で じっと している……']); return; }
    if (res !== 'win') return K.defeated();
    const g = G(); g.mimic = g.mimic || {}; g.mimic[s.id] = 1; const L = LOOT(s.r);
    if (K.fun && K.fun.reveal) await K.fun.reveal('legend', `星のかけら ×${L.n}`, 'ひとくいばこの おなかの 中から');
    g.gold += L.gold; K.gain('hoshikake', L.n);
    await K.say([`ひとくいばこの 中から ${L.gold}ゴールドと 星のかけら ${L.n}こが でてきた！`, `（ひとくいばこを たおした数：${Object.keys(g.mimic).length}）`]); K.hud(); K.save(); };
  if (DATA.titles && !DATA.titles.some(t => t.id === 't_mimic3')) DATA.titles.push({ id: 't_mimic3', name: 'ひとくいばこ ハンター', desc: 'ひとくいばこを 3体 たおす', ok: g => Object.keys(g.mimic || {}).length >= 3 });
  H.load.push(g => { g.mimic = g.mimic || {}; });
  K.mimic = { hash, count: r => Math.min(3, ((K.REG[r] || {}).chests || []).filter(c => hash('mm' + c.id) < .4).length), spotsOf, tune, LOOT, get spots() { return spots; } };
})();
