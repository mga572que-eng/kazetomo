// ともしびアイランド — creature art, "adventure bestiary" style (overrides Art.species)
// Bold dark outlines, flat colour blocks with hard cel shadows, one hard highlight, cheeky faces.
// All designs are original to this game.
'use strict';
(() => {
  if (typeof Art === 'undefined' || typeof DATA === 'undefined') return;
  let uid = 0;
  const nid = p => 'bs' + p + (++uid);

  // ---------- colour utils ----------
  const h2r = h => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const r2h = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = h2r(a), y = h2r(b); return r2h(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };
  const lum = c => { const [r, g, b] = h2r(c); return (r * .299 + g * .587 + b * .114) / 255; };
  const toHsl = c => { let [r, g, b] = h2r(c).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; };
  const fromHsl = (h, s, l) => { const f = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    if (!s) return r2h(l * 255, l * 255, l * 255); const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return r2h(f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255); };
  const vivid = c => { const [h, s, l] = toHsl(c); return s < .12 ? c : fromHsl(h, Math.min(1, s * 1.25 + .05), l); };
  const shinyC = c => { const [h, s, l] = toHsl(c); if (s < .2 || l > .93) return mix(c, '#ffb0d8', .35); let nh = (h + .42) % 1; if (nh > .03 && nh < .22 && l < .6) nh = l < .35 ? .86 : .52; return fromHsl(nh, Math.min(.9, s * 1.05), Math.max(l, .3)); };
  const shadowC = c => mix('#1e1744', '#7262c8', Math.min(1, lum(c) * 1.1));
  const shadowA = c => mix('#46309a', '#b894ff', lum(c));

  function speciesArt(sp, o = {}) {
    const S = DATA.species[sp]; if (!S) return '';
    const sh = !!o.shadow, shiny = !!o.shiny, f = new Set(S.feat || []);
    let [a, b, c] = S.col.map(vivid);
    if (shiny) { a = shinyC(a); b = shinyC(b); c = shinyC(c); }
    if (sh) { a = shadowC(a); b = shadowC(b); c = shadowA(c); }
    const OL = sh ? '#0b0716' : '#1d1420', SW = 5.5;
    const lite = mix(a, '#ffffff', .55), dk = mix(a, b, .75);
    const gold = sh ? c : '#ffcf3a', white = sh ? '#cbbcff' : '#ffffff', mouthC = sh ? '#3a0a34' : '#6a1426', tongueC = sh ? '#c060d0' : '#ff6f8a';
    const defs = [], out = [];

    // ---------- primitives ----------
    const cp = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
    const ep = (x, y, rx, ry) => `M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
    const mirror = d => d.replace(/(-?\d+\.?\d*)[ ,](-?\d+\.?\d*)/g, (m, x, y) => `${+(200 - +x).toFixed(1)} ${y}`);
    const shade = fl => mix(fl, sh ? '#08041a' : '#3a2466', sh ? .38 : .38);
    // cel-shaded part: outline under, shadow fill, clipped offset base fill on top
    const PART = (d, fl, s = 1, w = SW) => { const id = nid('p'); defs.push(`<path id="${id}" d="${d}"/><clipPath id="${id}c"><use href="#${id}"/></clipPath>`);
      return `<use href="#${id}" fill="${OL}" stroke="${OL}" stroke-width="${w * 2}" stroke-linejoin="round"/><use href="#${id}" fill="${shade(fl)}"/><g clip-path="url(#${id}c)"><use href="#${id}" fill="${fl}" transform="translate(${-8 * s} ${-10 * s})"/></g>`; };
    const FLAT = (d, fl, w = 4) => `<path d="${d}" fill="${fl}"${w ? ` stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"` : ''}/>`;
    const PAIR = (d, fl, s = 1, w = SW) => PART(d, fl, s, w) + PART(mirror(d), fl, s, w);
    const LN = (d, w = 4, col = OL) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const LIMB = (d, w, fl) => LN(d, w + SW * 2) + LN(d, w, fl);
    const HI = (x, y, rx, ry, rot = -30) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${sh ? .3 : .95}" transform="rotate(${rot} ${x} ${y})"/>`;
    const blobs = (L, fl, w = 4) => L.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry || rx}" fill="${OL}" stroke="${OL}" stroke-width="${w * 2}"/>`).join('') + L.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry || rx}" fill="${fl}"/>`).join('');
    const FOOT = (x, y, s = 1, fl = dk, claw = true) => blobs([[x - 8.5 * s, y + 1, 5.5 * s, 5 * s], [x, y + 2.5 * s, 6 * s, 5.5 * s], [x + 8.5 * s, y + 1, 5.5 * s, 5 * s], [x, y - 3 * s, 12 * s, 7.5 * s]], fl) +
      (claw ? [-8.5, 0, 8.5].map(dx => FLAT(`M${x + dx * s - 2.5 * s} ${y + 5 * s}L${x + dx * s} ${y + 10 * s}L${x + dx * s + 2.5 * s} ${y + 5 * s}Z`, white, 2)).join('') : '');
    const HAND = (x, y, s = 1, fl = a, claw = true) => blobs([[x, y, 8 * s, 7.5 * s]], fl) + (claw ? [-1, 0, 1].map(k => FLAT(`M${x + k * 5 * s - 2 * s} ${y + 5 * s}L${x + k * 6 * s} ${y + 11 * s}L${x + k * 5 * s + 2 * s} ${y + 5 * s}Z`, white, 2)).join('') : '');
    const star5 = (x, y, r, fl, w = 3.5) => { let d = ''; for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; d += (i ? 'L' : 'M') + (x + Math.cos(an) * rr).toFixed(1) + ' ' + (y + Math.sin(an) * rr).toFixed(1); } return FLAT(d + 'Z', fl, w); };
    const star4 = (x, y, r, fl = '#fff6b0', w = 2.5) => FLAT(`M${x} ${y - r}Q${x + r * .15} ${y - r * .15} ${x + r} ${y}Q${x + r * .15} ${y + r * .15} ${x} ${y + r}Q${x - r * .15} ${y + r * .15} ${x - r} ${y}Q${x - r * .15} ${y - r * .15} ${x} ${y - r}Z`, fl, w);
    const rpoly = (pts, r = 8) => { const n = pts.length; let d = ''; for (let i = 0; i < n; i++) { const p = pts[i], p0 = pts[(i + n - 1) % n], p1 = pts[(i + 1) % n];
      const v = q => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, k = Math.min(r, L / 2) / L; return [p[0] + dx * k, p[1] + dy * k]; };
      const s = v(p0), e = v(p1); d += (i ? 'L' : 'M') + s[0].toFixed(1) + ' ' + s[1].toFixed(1) + 'Q' + p[0] + ' ' + p[1] + ' ' + e[0].toFixed(1) + ' ' + e[1].toFixed(1); } return d + 'Z'; };
    const HORN = (x, y, tx, ty, w, fl) => PART(`M${x - w} ${y}Q${x - w * .6 + (tx - x) * .3} ${y + (ty - y) * .7} ${tx} ${ty}Q${x + w * .7 + (tx - x) * .5} ${y + (ty - y) * .4} ${x + w} ${y}Z`, fl, .5, 4.5);

    // ---------- faces ----------
    const EYE = (x, y, r, op = {}) => { const lx = (op.look || [0, 0])[0], ly = (op.look || [0, 0])[1]; let s = '';
      if (sh) { s += `<ellipse cx="${x}" cy="${y}" rx="${r * 1.7}" ry="${r * 1.6}" fill="#ffd23a" opacity=".3"/>` + FLAT(ep(x, y, r * .95, r * 1.05), '#ffe95a', 4.5) + FLAT(ep(x + lx * r * .2, y + ly * r * .2, r * .2, r * .62), '#ff2a7a', 0) + `<circle cx="${x - r * .35}" cy="${y - r * .45}" r="${r * .18}" fill="#fff"/>`; }
      else s += FLAT(ep(x, y, r * .92, r * 1.05), '#ffffff', 4.5) + FLAT(cp(x + lx * r * .38, y + ly * r * .38 + r * .08, r * .52), '#141018', 0) + `<circle cx="${x + lx * r * .4 - r * .16}" cy="${y + ly * r * .4 - r * .12}" r="${r * .15}" fill="#fff"/>`;
      if (op.lid) s += FLAT(`M${x - r * 1.05} ${y - r * .15}Q${x} ${y - r * .5} ${x + r * 1.05} ${y - r * .15}L${x + r * 1.05} ${y - r * 1.2}L${x - r * 1.05} ${y - r * 1.2}Z`, op.lid, 0) + LN(`M${x - r} ${y - r * .15}Q${x} ${y - r * .45} ${x + r} ${y - r * .15}`, 4.5);
      return s; };
    const BROW = (x, y, r, kind, side) => { if (!kind) return ''; const k = side; // side -1 left eye, 1 right eye
      const inner = kind === 'angry' ? r * .75 : kind === 'up' ? r * 1.5 : (side < 0 ? r * 1.5 : r * .75), outer = kind === 'angry' ? r * 1.45 : kind === 'up' ? r * 1.2 : (side < 0 ? r * 1.25 : r * 1.35);
      return LN(`M${x + k * r * 1.05} ${y - outer}L${x - k * r * .6} ${y - inner}`, Math.max(4, r * .5)); };
    const EYES = (x, y, dx, r, op = {}) => EYE(x - dx, y, r, op) + EYE(x + dx, y, r, op) + BROW(x - dx, y, r, op.brow, -1) + BROW(x + dx, y, r, op.brow, 1);
    const MOUTH = (x, y, w, type = 'grin') => { let s = '';
      const open = `M${x - w} ${y}Q${x} ${y + w * .3} ${x + w} ${y}Q${x + w * .85} ${y + w * 1.05} ${x} ${y + w * 1.05}Q${x - w * .85} ${y + w * 1.05} ${x - w} ${y}Z`;
      if (type === 'fang') return LN(`M${x - w} ${y}Q${x} ${y + w * .7} ${x + w} ${y - w * .15}`, 4.5) + FLAT(`M${x + w * .2} ${y + w * .3}L${x + w * .38} ${y + w * .78}L${x + w * .56} ${y + w * .22}Z`, white, 2.5);
      if (type === 'buck') return FLAT(`M${x - w * .7} ${y}Q${x} ${y + w * 1.1} ${x + w * .7} ${y}Z`, mouthC, 4) + FLAT(`M${x - w * .32} ${y + w * .05}h${w * .62}v${w * .45}h${-w * .62}Z`, white, 2.5) + LN(`M${x} ${y + w * .05}v${w * .45}`, 2);
      if (type === 'tusk') return LN(`M${x - w} ${y + w * .2}Q${x} ${y - w * .15} ${x + w} ${y + w * .2}`, 5) + FLAT(`M${x - w * .75} ${y + w * .15}L${x - w * .6} ${y - w * .55}L${x - w * .4} ${y + w * .1}Z`, white, 3) + FLAT(`M${x + w * .75} ${y + w * .15}L${x + w * .6} ${y - w * .55}L${x + w * .4} ${y + w * .1}Z`, white, 3);
      s += FLAT(open, mouthC, 4.5);
      s += `<ellipse cx="${x}" cy="${y + w * .78}" rx="${w * .48}" ry="${w * .22}" fill="${tongueC}"/>`;
      if (type === 'toothy') { let t = `M${x - w * .8} ${y + w * .1}`; for (let i = 0; i < 5; i++) { const x0 = x - w * .8 + i * w * .32; t += `L${x0 + w * .16} ${y + w * .38}L${x0 + w * .32} ${y + w * .12}`; } s += FLAT(t + 'Z', white, 2.2); }
      else s += FLAT(`M${x - w * .72} ${y + w * .1}L${x - w * .56} ${y + w * .52}L${x - w * .38} ${y + w * .16}Z`, white, 2.2) + FLAT(`M${x + w * .72} ${y + w * .1}L${x + w * .56} ${y + w * .52}L${x + w * .38} ${y + w * .16}Z`, white, 2.2);
      if (type === 'tongue') s += FLAT(`M${x + w * .05} ${y + w * .75}C${x + w * .05} ${y + w * 1.75} ${x + w * .72} ${y + w * 1.8} ${x + w * .72} ${y + w * .7}Z`, tongueC, 4) + LN(`M${x + w * .38} ${y + w * .95}v${w * .4}`, 2.5, shade(tongueC));
      return s; };
    const cloud = L => L.map(([x, y, r]) => cp(x, y, r)).join('');

    const evo = (S.size || 1) > 1.2;
    const id = sp;
    const BOSS = sh && ['oodako', 'sangoron', 'chouchinan', 'oopuku', 'uminokami'].includes(id);
    const bm = m => BOSS ? 'toothy' : m, bb = x => BOSS ? 'angry' : x;
    // ================= species =================
    if (id === 'watapoko' || id === 'watafuwari') {
      const E = evo;
      if (E) out.push(PART(cloud([[30, 92, 18], [20, 72, 14], [42, 66, 14], [14, 96, 11]]), lite, .6), PART(cloud([[170, 92, 18], [180, 72, 14], [158, 66, 14], [186, 96, 11]]), lite, .6));
      out.push(FOOT(74, 178, .9, mix(b, '#6a4a30', .55)), FOOT(126, 178, .9, mix(b, '#6a4a30', .55)));
      out.push(PART(cloud([[100, 122, 50], [56, 116, 26], [144, 116, 26], [70, 86, 26], [130, 86, 26], [100, 74, 30], [64, 146, 24], [136, 146, 24], [100, 152, 32]]), a));
      out.push(HI(68, 78, 12, 7));
      const fc = mix(b, '#c8905a', .5);
      out.push(PART(ep(60, 106, 15, 7), fc, .4), PART(ep(140, 106, 15, 7), fc, .4));
      out.push(LIMB(E ? 'M82 84 C70 60 44 62 44 80 C44 92 58 94 60 84' : 'M84 86 C74 70 56 72 56 84 C56 92 66 92 66 86', E ? 11 : 9, c), LIMB(mirror(E ? 'M82 84 C70 60 44 62 44 80 C44 92 58 94 60 84' : 'M84 86 C74 70 56 72 56 84 C56 92 66 92 66 86'), E ? 11 : 9, c));
      if (E) out.push(...[0, 72, 144, 216, 288].map(r => `<ellipse cx="${100 + Math.cos((r - 90) / 57.3) * 8}" cy="${58 + Math.sin((r - 90) / 57.3) * 8}" rx="6" ry="7" fill="${white}" stroke="${OL}" stroke-width="3.5" transform="rotate(${r} ${100 + Math.cos((r - 90) / 57.3) * 8} ${58 + Math.sin((r - 90) / 57.3) * 8})"/>`), FLAT(cp(100, 58, 5), gold, 3));
      out.push(PART(ep(100, 116, 30, 27), fc, .6), HI(88, 100, 6, 3.5));
      out.push(EYES(100, 110, 13, 9.5, { look: [.3, .1], brow: E ? 'mis' : null }), FLAT(ep(100, 124, 5, 3.5), '#3a2420', 0), MOUTH(100, 129, 9, E ? 'tongue' : 'fang'));
    }
    else if (id === 'iwanoko') {
      out.push(LIMB('M150 140 C168 132 176 116 170 102', 10, a), PART(ep(170, 98, 10, 8), c, .5));
      out.push(LIMB('M140 152 L144 172', 16, dk), FOOT(146, 178, .85));
      out.push(PART(ep(120, 140, 44, 30), a));
      out.push(PART(rpoly([[92, 116], [104, 96], [124, 100], [120, 118]], 7), c, .5), PART(rpoly([[120, 114], [132, 92], [152, 100], [148, 120]], 7), c, .5), PART(rpoly([[146, 124], [158, 108], [170, 118], [160, 132]], 6), c, .5));
      out.push(LIMB('M96 154 L92 172', 16, a), FOOT(90, 178, .85, a));
      out.push(PART(rpoly([[46, 84], [42, 50], [72, 74]], 8), dk, .5), PART(rpoly([[88, 74], [104, 48], [108, 86]], 8), dk, .5));
      out.push(PART(cp(74, 106, 36), a), PART(ep(62, 126, 22, 14), lite, .5), HI(56, 86, 9, 5));
      out.push(FLAT(ep(46, 120, 6, 4.5), OL, 0), EYES(74, 102, 14, 10, { look: [-.4, 0] }), MOUTH(64, 132, 10, 'tongue'));
    }
    else if (id === 'iwagoron') {
      out.push(LIMB('M78 160 L74 176', 24, dk), LIMB('M122 160 L126 176', 24, dk), FOOT(72, 180, 1.2), FOOT(128, 180, 1.2));
      out.push(PART(rpoly([[100, 44], [150, 56], [172, 100], [162, 150], [130, 170], [70, 170], [38, 150], [28, 100], [50, 56]], 22), a));
      out.push(PART(ep(50, 64, 22, 15), c, .6), PART(ep(150, 64, 22, 15), c, .6), HI(44, 58, 8, 4), HI(60, 92, 10, 6));
      out.push(LIMB('M42 100 C24 120 20 146 26 160', 24, a), LIMB(mirror('M42 100 C24 120 20 146 26 160'), 24, a), PART(cp(26, 166, 18), dk, .6), PART(cp(174, 166, 18), dk, .6));
      out.push(LN('M28 156 v10 M20 160 v8 M172 156 v10 M180 160 v8', 3));
      out.push(PART(ep(100, 84, 32, 24), mix(a, b, .5), .6), HORN(90, 64, 84, 44, 7, c), HORN(110, 64, 116, 44, 7, c));
      out.push(`<circle cx="100" cy="134" r="22" fill="#ffb347" opacity="${sh ? .25 : .35}"/>`, PART(cp(100, 134, 12), sh ? '#ff5fd0' : '#ffb347', .4), HI(96, 130, 4, 2.5), LN('M86 122 l-10 -8 M114 122 l10 -8 M100 148 v10', 3.5, sh ? '#ff5fd0' : '#ff9a2a'));
      out.push(EYES(100, 82, 13, 8, { brow: 'angry' }), MOUTH(100, 100, 13, 'tusk'));
    }
    else if (id === 'mizumochi' || id === 'mizudaifuku') {
      const E = evo, fin = mix(a, c, .45);
      out.push(LIMB('M140 164 C160 166 170 152 168 138', 12, b), PART('M168 140 C156 122 164 110 174 112 C176 98 194 100 192 116 C190 128 180 136 168 140 Z', fin, .5));
      out.push(FOOT(80, 180, .9, fin), FOOT(120, 180, .9, fin));
      out.push(PAIR('M50 100 C30 84 16 90 14 106 C26 106 30 114 44 120 Z', fin, .5), LN('M24 98 L40 108 M22 110 L40 114', 2.5), LN(mirror('M24 98 L40 108 M22 110 L40 114'), 2.5));
      out.push(PART(E ? 'M76 70 C66 44 84 20 110 22 C132 24 140 44 128 56 C120 62 110 54 116 46 C104 42 96 52 100 64 C92 52 82 56 84 70 Z' : 'M84 68 C78 46 96 30 118 34 C136 38 138 56 124 62 C116 66 108 58 114 52 C102 50 96 58 100 68 Z', lite, .5));
      out.push(PART(E ? 'M100 58 C150 58 166 98 164 132 C162 166 138 184 100 184 C62 184 38 166 36 132 C34 98 50 58 100 58 Z' : 'M100 62 C138 62 154 96 152 130 C150 164 130 182 100 182 C70 182 50 164 48 130 C46 96 62 62 100 62 Z', a));
      out.push(PART(ep(100, 148, E ? 38 : 30, E ? 30 : 26), lite, .6), HI(70, 80, 11, 6), HI(78, 96, 4, 3));
      out.push(LIMB('M52 128 C40 138 36 150 40 160', 12, fin), LIMB(mirror('M52 128 C40 138 36 150 40 160'), 12, fin));
      if (E) out.push(PART('M112 50 L118 22 L126 44 L136 24 L140 50 Q126 56 112 50 Z', sh ? c : '#ff8fa8', .4), FLAT(cp(126, 50, 5), white, 3));
      out.push(EYES(100, 102, 20, 12, { look: [.2, .1], brow: E ? 'angry' : 'up' }), MOUTH(100, 124, E ? 16 : 14, E ? 'tusk' : 'tongue'));
      if (E) out.push(MOUTH(100, 124, 10, 'fang'));
    }
    else if (id === 'hoshikage' || id === 'hoshimikage') {
      const E = evo;
      if (E) out.push(PAIR('M70 120 C44 100 22 104 10 90 C12 110 22 118 16 130 C30 130 34 140 30 152 C46 146 58 146 66 140 Z', mix(a, c, .35), .6), LN('M64 124 L20 100 M60 134 L24 128', 2.5), LN(mirror('M64 124 L20 100 M60 134 L24 128'), 2.5));
      out.push(LIMB('M116 164 C146 176 170 160 162 132', 7, a), star5(162, 126, 10, c));
      out.push(LIMB('M90 160 L88 174', 12, dk), LIMB('M110 160 L112 174', 12, dk), FOOT(86, 180, .75, dk), FOOT(114, 180, .75, dk));
      out.push(PART(ep(100, 148, 26, 24), a), PART(ep(100, 154, 15, 14), mix(a, '#ffffff', .3), .4));
      out.push(PAIR(E ? 'M66 84 C40 70 26 40 30 18 C50 30 70 50 82 70 Z' : 'M64 88 C44 72 32 50 34 30 C52 40 70 58 80 74 Z', a, .6), FLAT(mirror(E ? 'M66 80 C46 66 36 44 36 28 C52 40 66 56 74 70 Z' : 'M64 82 C50 70 40 54 40 40 C54 50 66 62 72 74 Z'), c, 0), FLAT(E ? 'M66 80 C46 66 36 44 36 28 C52 40 66 56 74 70 Z' : 'M64 82 C50 70 40 54 40 40 C54 50 66 62 72 74 Z', c, 0));
      out.push(PART(cp(100, 100, 42), a), HI(76, 76, 10, 6));
      if (E) out.push(HORN(86, 62, 78, 40, 6, c), HORN(114, 62, 122, 40, 6, c));
      out.push(star5(100, 70, 8, c, 3), LIMB('M76 144 L64 150', 8, a), LIMB('M124 144 L136 150', 8, a), HAND(62, 152, .7, a), HAND(138, 152, .7, a));
      out.push(EYES(100, 102, 17, 12, { look: [.35, .1], brow: 'mis' }), MOUTH(100, 124, 11, E ? 'grin' : 'fang'));
      out.push(star4(40, 150, 5, c, 2), star4(166, 60, 6, c, 2));
    }
    else if (id === 'yorukoumori' || id === 'yoibasa') {
      const E = evo, s = E ? 1.15 : 1;
      out.push(PAIR(`M76 118 C56 ${96 - 8 * s} ${30 - 10 * s} ${82 - 10 * s} ${10 - 6 * s} ${86 - 8 * s} C18 98 16 110 10 120 C22 118 30 126 28 138 C40 132 50 138 54 150 C62 138 70 132 80 132 Z`, b, .6), LN('M74 122 L22 94 M72 128 L30 132 M76 132 L54 146', 2.5), LN(mirror('M74 122 L22 94 M72 128 L30 132 M76 132 L54 146'), 2.5));
      out.push(LIMB('M116 166 C140 180 160 170 160 150', 5, dk), E ? PART('M160 150 L150 138 L160 124 L170 138 Z', c, .4) : PART('M152 146 C160 136 172 138 174 146 C168 144 160 146 156 152 Z', c, .4));
      out.push(LIMB('M90 164 L88 176', 10, dk), LIMB('M110 164 L112 176', 10, dk), FOOT(86, 181, .7, dk), FOOT(114, 181, .7, dk));
      out.push(PART(ep(100, 148, 28, 26), a), PART('M78 130 L86 144 L92 134 L100 148 L108 134 L114 144 L122 130 C116 122 84 122 78 130 Z', c, .4));
      out.push(PAIR('M70 88 C56 66 54 40 62 26 C78 36 90 58 92 76 Z', a, .6), FLAT('M70 80 C62 64 62 48 66 38 C76 48 84 62 84 74 Z', mix(c, a, .3), 0), FLAT(mirror('M70 80 C62 64 62 48 66 38 C76 48 84 62 84 74 Z'), mix(c, a, .3), 0));
      if (E) out.push(HORN(88, 70, 76, 44, 6, sh ? c : '#ffe0f0'), HORN(112, 70, 124, 44, 6, sh ? c : '#ffe0f0'));
      out.push(PART(ep(100, 102, 38, 32), a), PART(ep(100, 116, 16, 11), mix(a, '#ffffff', .25), .4), HI(76, 82, 9, 5), FLAT(ep(100, 110, 5, 3.5), OL, 0));
      out.push(EYES(100, 96, 17, 11, { look: [-.3, 0], brow: E ? 'angry' : 'mis' }), MOUTH(100, 118, 10, E ? 'grin' : 'fang'));
    }
    else if (id === 'tsuchimogu') {
      out.push(FOOT(78, 180, 1, c), FOOT(122, 180, 1, c));
      out.push(PART(ep(100, 128, 52, 52), a), PART(ep(100, 146, 32, 30), mix(a, c, .5), .6), HI(66, 92, 10, 6));
      out.push(LN('M92 78 C88 64 96 60 100 68 C102 58 112 60 108 74', 5), LN('M50 90 L150 90', 7, '#3a2a24'), PART(cp(82, 88, 13), sh ? c : '#9fe0ff', .4), PART(cp(118, 88, 13), sh ? c : '#9fe0ff', .4), HI(78, 84, 4, 3), HI(114, 84, 4, 3));
      out.push(PART('M52 128 C34 120 22 138 28 154 C34 166 52 166 60 154 Z', c, .5), FLAT('M26 146 L14 146 L24 152 Z M28 156 L18 162 L30 162 Z M36 162 L32 172 L42 166 Z', white, 2.5));
      out.push(PART(mirror('M52 128 C34 120 22 138 28 154 C34 166 52 166 60 154 Z'), c, .5), PART(rpoly([[160, 124], [172, 132], [166, 146], [154, 140]], 3), sh ? c : '#5fd8ff', .3));
      out.push(EYES(100, 108, 18, 8.5, { look: [0, .1] }), PART(ep(100, 122, 11, 8), sh ? c : '#ff8aa0', .3), HI(96, 119, 3, 2), MOUTH(100, 132, 10, 'buck'));
    }
    else if (id === 'hanapokke' || id === 'hanakanmuri') {
      const E = evo;
      if (E) out.push(...Array.from({ length: 10 }, (_, i) => { const an = i / 10 * 6.283 - 1.57, x = 100 + Math.cos(an) * 54, y = 100 + Math.sin(an) * 50; return PART(ep(+x.toFixed(1), +y.toFixed(1), 18, 11).replace(/^/, ''), c, .3).replace(/<use href="(#[^"]+)"/g, `<use href="$1" transform="rotate(${(an * 57.3).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"`); }));
      out.push(LIMB('M84 170 L76 182 M84 170 L86 184 M84 170 L94 182', 5, dk), LIMB('M116 170 L106 182 M116 170 L114 184 M116 170 L124 182', 5, dk));
      if (!E) out.push(LIMB('M100 62 C100 46 108 38 118 40 C124 42 122 50 116 50', 5, mix(c, a, .7)), PART('M100 60 C88 58 76 48 78 36 C92 34 102 46 100 60 Z', mix(a, '#ffffff', .2), .4));
      out.push(PART(E ? 'M100 52 C140 52 154 92 152 126 C150 160 130 176 100 176 C70 176 50 160 48 126 C46 92 60 52 100 52 Z' : 'M100 60 C134 60 148 96 146 128 C144 160 126 176 100 176 C74 176 56 160 54 128 C52 96 66 60 100 60 Z', a), HI(72, 80, 10, 6));
      if (!E) out.push(PART('M100 128 C122 134 128 160 100 172 C72 160 78 134 100 128 Z', c, .4), LN('M100 134 C94 146 94 160 100 170', 2.5));
      out.push(PART('M60 138 C40 132 34 152 46 162 C60 170 82 160 86 150 Z', mix(b, a, .3), .4), PART(mirror('M60 138 C40 132 34 152 46 162 C60 170 82 160 86 150 Z'), mix(b, a, .3), .4));
      if (E) { out.push(LIMB('M50 150 C30 150 20 130 30 116', 6, mix(b, a, .3)), LIMB(mirror('M50 150 C30 150 20 130 30 116'), 6, mix(b, a, .3)), PART(ep(100, 150, 22, 16), mix(c, '#ffffff', .3), .4));
        out.push(...[[70, 54, 0], [100, 44, 1], [130, 54, 0]].map(([x, y, m]) => [0, 72, 144, 216, 288].map(r => `<ellipse cx="${(x + Math.cos((r - 90) / 57.3) * (m ? 9 : 7)).toFixed(1)}" cy="${(y + Math.sin((r - 90) / 57.3) * (m ? 9 : 7)).toFixed(1)}" rx="${m ? 7 : 5.5}" ry="${m ? 8 : 6.5}" fill="${sh ? c : m ? '#ffffff' : '#ffe0ec'}" stroke="${OL}" stroke-width="3.5" transform="rotate(${r} ${(x + Math.cos((r - 90) / 57.3) * (m ? 9 : 7)).toFixed(1)} ${(y + Math.sin((r - 90) / 57.3) * (m ? 9 : 7)).toFixed(1)})"/>`).join('') + FLAT(cp(x, y, m ? 5 : 4), gold, 3))); }
      out.push(EYES(100, E ? 96 : 100, 18, 11, { look: [.2, 0], brow: E ? 'mis' : null }), MOUTH(100, E ? 118 : 120, 11, E ? 'tongue' : 'grin'));
    }
    else if (id === 'sunawani' || id === 'sunawaniking') {
      const E = evo;
      out.push(PART('M140 152 C170 152 192 130 192 100 C182 118 166 130 140 134 Z', a, .6));
      out.push(...[[150, 128], [166, 118], [180, 104]].map(([x, y]) => PART(`M${x - 7} ${y + 4}Q${x} ${y - 14} ${x + 7} ${y + 2}Z`, c, .3, 4)));
      out.push(FOOT(146, 180, .9), LIMB('M142 154 L146 172', 16, dk));
      out.push(...[[100, 114], [120, 110], [140, 116]].map(([x, y]) => PART(`M${x - 10} ${y + 8}Q${x} ${y - (E ? 22 : 14)} ${x + 10} ${y + 6}Z`, c, .3, 4.5)));
      out.push(PART(ep(122, 144, 44, 28), a), PART(ep(120, 160, 30, 10), lite, .3));
      out.push(LIMB('M96 156 L90 172', 16, a), FOOT(88, 180, .9, a));
      out.push(PART(cloud([[82, 104, 32], [66, 74, 15], [96, 72, 15]]) + ep(46, 120, 36, 16), a), PART(ep(44, 128, 30, 8), lite, .3), HI(62, 88, 8, 5));
      out.push(FLAT(ep(18, 114, 3.5, 2.5), OL, 0), FLAT(ep(28, 112, 3.5, 2.5), OL, 0));
      out.push(FLAT('M12 124 Q46 138 88 124 Q60 140 40 138 Q20 136 12 124 Z', mouthC, 4), FLAT('M18 126 L22 132 L26 128 L30 134 L34 129 L38 135 L42 130 L46 135 L50 130 L54 134 L58 129 L62 133 L66 128 L70 131 L74 127 Z', white, 2));
      out.push(EYE(66, 72, 10, { look: [-.4, 0] }), EYE(96, 70, 10, { look: [-.4, 0] }), BROW(66, 72, 10, E ? 'angry' : 'mis', -1), BROW(96, 70, 10, E ? 'angry' : 'mis', 1));
      if (E) out.push(PART('M60 58 C58 34 74 24 82 24 C92 24 106 34 102 58 C90 52 72 52 60 58 Z', sh ? c : '#fff0d0', .4), LN('M64 48 Q82 38 100 48', 3), PART(cp(82, 50, 7), sh ? '#ff7fe0' : '#34c0e0', .3), PART('M96 30 C104 12 122 12 126 20 C114 22 106 28 102 38 Z', sh ? c : '#ff6a4a', .3), FLAT('M110 150 L118 138 L126 150 Z', gold, 3));
    }
    else if (id === 'sabotenbo') {
      out.push(FOOT(80, 182, .8, dk), FOOT(120, 182, .8, dk));
      out.push(PART('M64 150 L64 78 C64 42 136 42 136 78 L136 150 Z', a));
      out.push(PART('M66 118 C44 120 34 106 34 90 C34 80 50 78 52 90 C52 98 58 102 66 102 Z', a, .5), PART('M134 108 C156 110 166 96 166 82 C166 72 150 70 148 80 C148 88 142 92 134 92 Z', a, .5), HI(78, 64, 6, 10, 0));
      out.push(...[[76, 80], [126, 74], [74, 132], [126, 134], [42, 92], [158, 82], [100, 140]].map(([x, y]) => LN(`M${x - 4} ${y - 4}l4 4l4 -4`, 2.5, white)));
      out.push(PART('M52 142 L148 142 L140 180 L60 180 Z', sh ? mix(c, '#35275f', .3) : '#e8764a', .6), `<rect x="46" y="134" width="108" height="18" rx="5" fill="${sh ? mix(c, '#35275f', .2) : '#f29a62'}" stroke="${OL}" stroke-width="${SW}"/>`, LN('M70 162 h60', 3, sh ? '#20164a' : '#b8502a'));
      out.push(...[0, 72, 144, 216, 288].map(r => `<ellipse cx="${(100 + Math.cos((r - 90) / 57.3) * 9).toFixed(1)}" cy="${(40 + Math.sin((r - 90) / 57.3) * 9).toFixed(1)}" rx="7" ry="8" fill="${c}" stroke="${OL}" stroke-width="3.5" transform="rotate(${r} ${(100 + Math.cos((r - 90) / 57.3) * 9).toFixed(1)} ${(40 + Math.sin((r - 90) / 57.3) * 9).toFixed(1)})"/>`), FLAT(cp(100, 40, 5), sh ? '#fff' : '#ff6a3a', 3));
      out.push(EYES(100, 86, 16, 10, { look: [.3, 0], brow: 'mis' }), MOUTH(100, 106, 12, 'grin'));
    }
    else if (id === 'yukiusa' || id === 'yukinomiko' || id === 'tsukimiusa') {
      const E = id === 'yukinomiko', moon = id === 'tsukimiusa';
      const ear = E ? 'M78 70 C62 48 58 14 70 4 C84 8 90 44 90 66 Z' : 'M78 72 C64 52 62 22 72 12 C86 16 90 46 90 68 Z';
      const inn = E ? 'M80 62 C70 44 68 22 72 14 C80 20 84 42 84 60 Z' : 'M80 64 C72 50 70 30 74 22 C82 26 84 46 84 62 Z';
      out.push(PAIR(ear, a, .5), FLAT(inn, c, 0), FLAT(mirror(inn), c, 0));
      if (moon) out.push(FLAT(cp(72, 14, 7), gold, 3.5), FLAT(cp(128, 14, 7), gold, 3.5), PART('M100 2 C88 4 82 16 88 26 C92 18 100 14 110 16 C106 10 104 6 100 2 Z', gold, .3));
      if (E) out.push(PART('M100 44 L106 60 L100 66 L94 60 Z', sh ? c : '#dff4ff', .3), PART('M84 52 L90 64 L84 68 L78 62 Z', sh ? c : '#dff4ff', .3), PART('M116 52 L122 62 L116 68 L110 64 Z', sh ? c : '#dff4ff', .3));
      out.push(PART(cp(150, 150, 13), white, .4));
      out.push(FOOT(76, 180, 1.1, a), FOOT(124, 180, 1.1, a));
      out.push(PART(ep(100, 148, 34, 30), a), PART(ep(100, 154, 20, 18), lite, .4));
      if (moon) out.push(LIMB('M140 150 L150 108', 6, sh ? c : '#b07a44'), PART(rpoly([[132, 90], [168, 90], [168, 112], [132, 112]], 5), sh ? c : '#d9a06a', .4));
      if (E) out.push(LIMB('M58 150 L46 104', 5, sh ? c : '#bfe6ff'), PART(rpoly([[46, 84], [54, 100], [46, 110], [38, 100]], 3), sh ? c : '#dff4ff', .3));
      out.push(PART(E ? 'M56 128 L64 140 L70 130 L78 144 L86 132 L94 146 L100 134 L106 146 L114 132 L122 144 L130 130 L136 140 L144 128 C130 118 70 118 56 128 Z' : 'M60 128 L68 138 L76 130 L84 140 L92 132 L100 142 L108 132 L116 140 L124 130 L132 138 L140 128 C126 120 74 120 60 128 Z', E ? c : mix(a, c, moon ? .5 : .3), .4));
      out.push(PART(ep(100, 100, 40, 34), a), HI(76, 80, 9, 5));
      out.push(PART('M60 104 L50 110 L62 114 L52 122 L66 120 Z', a, .3), PART(mirror('M60 104 L50 110 L62 114 L52 122 L66 120 Z'), a, .3));
      out.push(HAND(70, 150, .7, a, false), HAND(130, 150, .7, a, false));
      out.push(EYES(100, 98, 17, 11, { look: [0, .15], brow: E ? 'mis' : null }), FLAT(ep(100, 112, 4, 3), sh ? c : '#ff7a9a', 2.5), MOUTH(100, 118, 9, E ? 'fang' : 'buck'));
      if (!E && !moon) out.push(star4(42, 70, 6, '#e8f8ff', 2.5), star4(160, 56, 5, '#e8f8ff', 2.5));
    }
    else if (S.arch === 'bird') {
      const E = evo, beakC = sh ? c : '#ffb020';
      const bw = { kooridori: 0, kazetaka: 1, arashitaka: 1.25, amatsubame: 0, hoshimori: 1.1 }[id] || 1;
      if (id === 'hoshimori') out.push(...[[0, 150, 190, 118], [10, 140, 186, 86], [20, 128, 170, 56]].map(([i, y0, x1, y1]) => PART(`M130 ${y0} C150 ${y0 + 8} ${x1 - 10} ${y1 + 30} ${x1} ${y1} C${x1 + 4} ${y1 + 26} 160 ${y0 + 22} 128 ${y0 + 16} Z`, mix(a, c, .3), .4)), star5(190, 114, 7, gold), star5(186, 82, 7, gold), star5(170, 52, 7, gold));
      if (id === 'amatsubame') out.push(PART('M118 154 L172 190 L150 158 L186 170 L136 138 Z', dk, .4));
      if (id === 'kazetaka' || id === 'arashitaka') out.push(PART('M124 158 L160 176 L150 164 L172 166 L140 146 Z', dk, .4));
      // wings (raised, 3 feather fingers)
      const wing = id === 'amatsubame' ? 'M62 110 C40 96 18 104 4 124 C24 122 38 124 50 132 C40 136 30 146 26 158 C44 150 58 146 66 136 Z'
        : `M60 108 C${44 - 10 * bw} ${90 - 16 * bw} ${22 - 14 * bw} ${80 - 16 * bw} ${12 - 8 * bw} ${76 - 10 * bw} C${20 - 6 * bw} ${92 - 6 * bw} 24 100 20 106 C30 104 30 112 26 118 C36 116 38 124 36 130 C46 128 56 134 62 140 Z`;
      out.push(PAIR(wing, dk, .5));
      out.push(LIMB('M88 160 L86 176', 6, beakC), LIMB('M112 160 L114 176', 6, beakC), FOOT(86, 180, .8, beakC), FOOT(114, 180, .8, beakC));
      out.push(PART(ep(100, 118, 46, 50), a), PART(ep(100, 138, 30, 28), id === 'amatsubame' || id === 'kooridori' ? white : mix(c, '#ffffff', .2), .5), HI(74, 86, 10, 6));
      if (id === 'kooridori') out.push(PART(rpoly([[92, 72], [78, 40], [92, 34], [98, 68]], 4), mix(c, '#bfe6ff', .4), .3), PART(rpoly([[100, 70], [102, 26], [114, 34], [108, 70]], 4), mix(c, '#bfe6ff', .3), .3), PART(rpoly([[108, 72], [128, 46], [134, 58], [114, 74]], 4), mix(c, '#bfe6ff', .4), .3));
      else if (id === 'hoshimori') out.push(PART('M94 72 C86 50 90 32 100 20 C110 32 114 50 106 72 Z', mix(a, c, .35), .4));
      else if (id === 'amatsubame') out.push(PART('M92 72 C90 58 98 50 110 50 C104 58 106 64 110 72 Z', dk, .3));
      else out.push(PART(`M90 74 C${80 - 8 * bw} ${52 - 10 * bw} 90 ${34 - 10 * bw} 104 ${26 - 10 * bw} C100 38 104 46 110 50 C114 ${36 - 8 * bw} ${128 + 8 * bw} ${28 - 8 * bw} ${140 + 8 * bw} ${32 - 6 * bw} C128 40 122 52 118 74 Z`, E ? c : dk, .4));
      if (id === 'arashitaka') out.push(LN('M68 80 Q100 66 132 80', 12), LN('M68 80 Q100 66 132 80', 6, gold), PART(cp(100, 72, 6), sh ? '#ff7fe0' : '#7fd8ff', .3));
      if (id === 'hoshimori') { out.push(`<ellipse cx="100" cy="16" rx="30" ry="8" fill="none" stroke="${OL}" stroke-width="11"/><ellipse cx="100" cy="16" rx="30" ry="8" fill="none" stroke="${gold}" stroke-width="5"/>`, PART('M76 80 L80 64 L90 72 L100 56 L110 72 L120 64 L124 80 Q100 72 76 80 Z', gold, .3)); }
      const ey = 100;
      out.push(EYES(100, ey, 17, 11, { look: [0, .1], brow: E || id === 'kazetaka' ? 'angry' : id === 'amatsubame' ? 'mis' : null }));
      out.push(PART(`M88 ${ey + 14} Q100 ${ey + 6} 112 ${ey + 14} Q106 ${ey + 22} 100 ${ey + 30} Q94 ${ey + 22} 88 ${ey + 14} Z`, beakC, .3), FLAT(`M92 ${ey + 20} Q100 ${ey + 24} 108 ${ey + 20} Q104 ${ey + 34} 100 ${ey + 36} Q96 ${ey + 34} 92 ${ey + 20} Z`, shade(beakC), 3.5), `<ellipse cx="100" cy="${ey + 27}" rx="4" ry="3" fill="${tongueC}"/>`);
      if (id === 'kooridori') out.push(star4(30, 50, 7, '#e8f8ff', 3), star4(172, 60, 5, '#e8f8ff', 2.5));
      if (id === 'kazetaka' || id === 'arashitaka') out.push(LN('M150 150 q10 -8 20 -2 M22 160 q10 -6 18 0', 3.5, sh ? c : '#ffffff'));
    }
    else if (id === 'morinoko') {
      out.push(LIMB('M142 110 L150 180', 6, sh ? c : '#8a5a30'), PART('M150 104 C140 92 150 80 160 86 C166 76 178 84 170 96 C176 104 166 112 158 108 Z', c, .3));
      out.push(FOOT(84, 180, .75, dk), FOOT(116, 180, .75, dk), LIMB('M90 164 L86 174', 10, dk), LIMB('M110 164 L114 174', 10, dk));
      out.push(PART('M100 118 C124 118 140 150 132 168 C120 176 80 176 68 168 C60 150 76 118 100 118 Z', mix(c, a, .4)), LN('M100 124 L100 170 M84 140 L100 152 M116 140 L100 152', 3));
      out.push(PART(cp(100, 100, 36), sh ? a : '#ffe2c0', .6));
      out.push(PART('M52 92 C50 60 80 20 128 18 C124 30 140 36 156 36 C146 50 150 70 150 92 C130 76 74 76 52 92 Z', a), LN('M58 86 C84 64 120 50 150 38', 3.5), LN('M86 72 L78 56 M110 62 L106 44 M130 54 L134 40', 3), HI(80, 50, 10, 5));
      out.push(LIMB('M122 134 L140 124', 8, sh ? a : '#ffe2c0'), HAND(142, 122, .6, sh ? a : '#ffe2c0', false));
      out.push(EYES(100, 106, 15, 10, { look: [.4, 0], lid: sh ? a : '#ffe2c0' }), MOUTH(100, 122, 10, 'toothy'));
    }
    else if (id === 'hibana' || id === 'homura') {
      const E = evo, fl2 = mix(a, c, .5);
      out.push(LIMB('M118 164 C140 174 156 164 156 146', 7, a), PART('M156 150 C146 142 148 128 156 118 C158 128 168 132 166 144 C164 150 160 152 156 150 Z', c, .3));
      out.push(PART(E ? 'M44 110 C26 84 38 50 52 36 C54 52 62 58 70 60 C66 38 80 14 102 2 C98 22 104 36 116 44 C118 28 132 16 148 12 C140 30 146 44 156 52 C168 70 166 96 156 110 Z' : 'M58 100 C44 80 52 56 62 46 C64 58 70 62 78 64 C74 44 86 26 104 16 C100 32 106 42 116 48 C118 36 128 28 140 26 C134 42 140 54 146 62 C152 76 150 90 142 100 Z', fl2));
      out.push(FLAT(E ? 'M70 90 C60 72 68 56 76 50 C78 62 86 64 92 64 C90 46 98 30 110 24 C108 40 114 50 124 54 C128 44 136 38 142 38 C140 52 146 62 148 72 C150 82 146 90 140 94 Z' : 'M78 90 C70 76 76 64 82 60 C84 68 90 70 94 70 C92 56 100 44 110 40 C108 52 114 58 122 62 C126 54 132 50 136 50 C134 60 138 68 138 76 C138 84 134 90 128 92 Z', sh ? mix(c, '#fff', .2) : c, 0));
      if (E) out.push(HORN(72, 80, 54, 50, 7, sh ? c : '#fff0c0'), HORN(128, 80, 146, 50, 7, sh ? c : '#fff0c0'));
      out.push(FOOT(84, 180, E ? .95 : .8, dk), FOOT(116, 180, E ? .95 : .8, dk), LIMB('M88 160 L86 174', E ? 14 : 10, dk), LIMB('M112 160 L114 174', E ? 14 : 10, dk));
      out.push(PART(ep(100, 146, E ? 34 : 26, E ? 28 : 22), a), PART(E ? 'M86 134 C90 124 96 128 100 118 C104 128 110 124 114 134 C114 150 86 150 86 134 Z' : ep(100, 150, 12, 12), c, .3));
      out.push(PART(E ? ep(100, 102, 44, 38) : cp(100, 104, 38), a), HI(74, 86, 9, 5));
      if (E) out.push(LIMB('M68 134 C52 138 46 124 44 116', 11, a), LIMB(mirror('M68 134 C52 138 46 124 44 116'), 11, a), HAND(44, 112, .8, a), HAND(156, 112, .8, a));
      else out.push(LIMB('M78 146 L64 152', 8, a), LIMB('M122 146 L136 152', 8, a), HAND(62, 154, .6, a), HAND(138, 154, .6, a));
      out.push(EYES(100, 102, 16, 11, { look: [.2, 0], brow: E ? 'angry' : 'mis' }), MOUTH(100, 122, E ? 13 : 11, E ? 'toothy' : 'tongue'));
    }
    else if (id === 'umiushu') {
      out.push(...[40, 64, 88, 112, 136, 160].map((x, i) => PART(ep(x, 170 - (i % 2) * 2, 14, 10), c, .3, 4.5)));
      out.push(PART('M20 150 C20 118 52 98 92 98 C136 98 170 116 182 146 C188 164 172 176 140 176 L44 176 C28 176 20 166 20 150 Z', a), HI(52, 116, 12, 6));
      out.push(...[[72, 150, 6], [130, 120, 7], [150, 150, 5], [108, 158, 4], [96, 116, 4.5], [160, 130, 4]].map(([x, y, r]) => FLAT(cp(x, y, r), c, 0)));
      out.push(LIMB('M52 104 C48 86 42 76 36 70', 7, c), LIMB('M72 100 C72 82 70 70 66 62', 7, c), PART(cp(35, 68, 7), c, .3), PART(cp(66, 60, 7), c, .3));
      out.push(...[-60, -30, 0, 30, 60].map(r => { const x = 150 + Math.sin(r / 57.3) * 12, y = 98 - Math.cos(r / 57.3) * 12; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="12" fill="${mix(c, '#ffffff', .25)}" stroke="${OL}" stroke-width="4" transform="rotate(${r} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }));
      out.push(EYES(62, 128, 15, 10, { look: [-.3, 0], brow: 'up' }), MOUTH(58, 146, 10, 'grin'));
    }
    else if (id === 'ishigaki') {
      const moss = sh ? c : '#6fbf4a', core = sh ? '#ff6fe0' : '#7fe6ff';
      out.push(FOOT(74, 182, 1, dk), FOOT(126, 182, 1, dk));
      out.push(PART(rpoly([[56, 150], [144, 150], [150, 176], [50, 176]], 6), dk, .5), PART(rpoly([[80, 130], [120, 130], [120, 152], [80, 152]], 4), a, .4));
      out.push(LIMB('M50 98 C34 108 30 124 36 136', 14, a), LIMB(mirror('M50 98 C34 108 30 124 36 136'), 14, a), PART(cp(36, 140, 11), dk, .4), PART(cp(164, 140, 11), dk, .4));
      out.push(PART(rpoly([[48, 70], [152, 70], [148, 132], [52, 132]], 10), a), HI(62, 80, 8, 5));
      out.push(`<rect x="66" y="108" width="68" height="18" rx="6" fill="${core}" opacity=".35"/>`, FLAT('M70 110 L130 110 L126 124 L74 124 Z', mouthC, 4), FLAT('M74 110 L78 118 L84 110 L90 118 L96 110 L102 118 L108 110 L114 118 L120 110 L126 118 L130 110 Z', core, 2));
      out.push(PART('M22 70 C50 54 74 40 100 30 C126 40 150 54 178 70 C180 76 172 80 166 76 L34 76 C28 80 20 76 22 70 Z', b));
      out.push(PART('M46 62 C62 50 80 40 100 34 C120 40 138 50 154 62 C144 70 136 62 128 68 C120 60 112 70 104 64 C96 70 88 60 80 68 C72 62 62 70 56 64 C52 68 44 66 46 62 Z', moss, .3));
      out.push(PART(cp(100, 24, 8), dk, .3), LIMB('M120 44 L122 34', 3, moss), PART('M122 34 C118 26 110 26 108 30 C114 36 120 36 122 34 Z', moss, .2), FLAT(cp(134, 50, 4), sh ? c : '#ffb3cf', 2.5));
      out.push(EYES(100, 92, 20, 10, { look: [0, 0], brow: 'angry' }));
    }
    else if (id === 'nijikujira' || id === 'hoshikujira') {
      const E = id === 'hoshikujira';
      if (!E && !sh) out.push(...['#ff8a8a', '#ffc46a', '#fff08a', '#8fe08a', '#8ac4ff'].map((col, i) => LN(`M${34 + i * 7} 66 C${54 + i * 5} ${14 + i * 6} ${130 - i * 5} ${14 + i * 6} ${150 - i * 7} 66`, 5.5, col)));
      out.push(PART('M60 60 C52 48 40 44 34 34 C44 36 52 40 58 46 C58 34 62 24 66 18 C68 30 66 40 64 48 C72 40 82 36 90 36 C82 44 70 50 62 60 Z', sh ? c : E ? '#fff3b0' : '#dff6ff', .3));
      if (E) out.push(star4(40, 22, 6, c, 3), star4(88, 20, 5, c, 3));
      out.push(PART('M146 112 C156 96 158 78 152 62 C164 66 170 74 172 84 C178 74 186 72 190 76 C186 94 174 110 158 124 Z', dk, .5));
      out.push(PART('M14 124 C14 88 48 66 92 66 C134 66 160 88 164 118 C168 150 144 176 96 178 C46 180 14 160 14 124 Z', a), PART('M22 146 C40 172 120 180 158 150 C150 170 124 180 96 178 C54 180 30 168 22 146 Z', lite, .4), LN('M50 164 q40 10 80 0 M62 172 q30 6 56 0', 2.5), HI(52, 84, 14, 7));
      out.push(PART('M104 148 C112 170 132 178 146 172 C140 160 128 148 116 142 Z', dk, .4));
      if (E) out.push(...[[42, 110], [130, 96], [120, 130], [148, 118], [90, 88]].map(([x, y], i) => star4(x, y, i % 2 ? 4.5 : 6, c, 0)), star5(96, 56, 12, gold), star5(72, 64, 8, gold), star5(122, 64, 8, gold));
      out.push(FLAT('M18 132 Q50 150 92 138 Q72 158 46 154 Q24 150 18 132 Z', mouthC, 4), FLAT('M40 146 L44 152 L48 147 Z M72 146 L76 152 L80 146 Z', white, 2), `<ellipse cx="58" cy="152" rx="10" ry="3.5" fill="${tongueC}"/>`);
      out.push(EYE(52, 110, 12, { look: [-.3, 0] }), EYE(88, 106, 11, { look: [-.3, 0] }), BROW(52, 110, 12, E ? 'angry' : null, -1), BROW(88, 106, 11, E ? 'angry' : null, 1));
    }
    else if (id === 'kumomo' || id === 'raikumo') {
      const E = evo;
      out.push(FOOT(80, 180, .9, dk), FOOT(120, 180, .9, dk), LIMB('M84 160 L82 174', 12, dk), LIMB('M116 160 L118 174', 12, dk));
      if (E) out.push(PART('M152 136 L180 128 L166 146 L192 142 L160 178 L168 156 L146 160 Z', c, .4), HORN(76, 60, 62, 30, 8, c), HORN(124, 60, 138, 30, 8, c));
      if (!E) out.push(`<ellipse cx="100" cy="30" rx="26" ry="7" fill="none" stroke="${OL}" stroke-width="11"/><ellipse cx="100" cy="30" rx="26" ry="7" fill="none" stroke="${sh ? c : '#bfe0ff'}" stroke-width="5"/>`);
      out.push(PART(cloud([[100, 112, 48], [58, 116, 28], [142, 116, 28], [70, 82, 26], [130, 82, 26], [100, 68, 30], [72, 142, 26], [128, 142, 26], [100, 150, 28]]), a), HI(72, 70, 12, 7));
      out.push(LIMB('M54 128 C40 132 34 124 32 116', 9, a), LIMB(mirror('M54 128 C40 132 34 124 32 116'), 9, a), HAND(30, 112, .65, a, E), HAND(170, 112, .65, a, E));
      if (E) out.push(PART('M96 30 L84 52 L96 52 L86 74 L112 46 L100 46 L108 30 Z', c, .3));
      else out.push(PART('M166 150 C166 142 172 136 174 132 C176 136 182 142 182 150 C182 156 166 156 166 150 Z', sh ? c : '#bfe0ff', .3));
      out.push(EYES(100, 106, 18, 11, { look: [.2, .1], brow: E ? 'angry' : null }), MOUTH(100, 126, 12, E ? 'toothy' : 'tongue'));
    }
    else if (id === 'soramedaka') {
      const fin = mix(c, a, .45);
      out.push(PART('M146 116 C164 96 176 84 190 80 C186 102 186 128 192 150 C176 142 162 134 146 128 Z', fin, .4), PART('M76 78 C80 46 110 30 136 38 C124 50 122 62 122 78 Z', fin, .4));
      out.push(PART('M22 116 C22 86 56 70 94 72 C132 74 156 94 156 120 C156 148 128 166 92 166 C54 166 22 148 22 116 Z', a), PART('M30 134 C50 158 120 164 150 136 C142 156 120 166 92 166 C60 166 38 154 30 134 Z', lite, .4), HI(56, 88, 12, 6));
      out.push(PART('M90 120 C84 150 100 168 126 160 C118 146 108 130 98 118 Z', fin, .4), LN('M98 128 L112 156 M94 132 L100 158', 2.5));
      out.push(EYE(54, 106, 14, { look: [-.35, 0], brow: null }), FLAT('M20 122 Q34 134 46 124 Q40 140 30 138 Q22 134 20 122 Z', mouthC, 3.5), FLAT('M26 126 L30 131 L33 127 Z', white, 1.5));
      out.push(LN('M170 50 q8 -6 16 0 M8 160 q10 -6 20 0', 3, sh ? c : '#ffffff'), FLAT(cp(164, 36, 5), '#ffffff', 2.5));
    }
    else if (id === 'soramanta') {
      out.push(LIMB('M100 164 C104 180 128 190 150 180', 5, dk), PART('M146 172 L162 176 L150 186 Z', c, .2, 3.5));
      out.push(PART(cloud([[80, 66, 14], [100, 58, 18], [120, 64, 14]]), sh ? c : '#ffffff', .3), star5(100, 40, 9, gold));
      out.push(PART('M100 72 C130 72 150 86 166 98 C182 108 190 120 182 128 C166 130 150 140 136 156 C124 170 76 170 64 156 C50 140 34 130 18 128 C10 120 18 108 34 98 C50 86 70 72 100 72 Z', a), HI(62, 96, 16, 6, -20));
      out.push(PAIR('M78 84 C66 80 60 66 66 58 C76 60 84 70 86 82 Z', dk, .3));
      out.push(EYES(100, 104, 26, 11, { look: [0, .1], brow: 'mis' }), FLAT('M70 124 Q100 148 130 124 Q100 136 70 124 Z', mouthC, 4), `<ellipse cx="100" cy="134" rx="10" ry="3" fill="${tongueC}"/>`);
    }
    else if (id === 'fuurin') {
      out.push(LN('M100 40 L100 8', 3.5), `<ellipse cx="100" cy="20" rx="24" ry="6" fill="none" stroke="${OL}" stroke-width="10"/><ellipse cx="100" cy="20" rx="24" ry="6" fill="none" stroke="${sh ? c : '#ffe38a'}" stroke-width="4.5"/>`);
      out.push(LN('M100 150 L100 162', 3), PART(rpoly([[86, 160], [114, 160], [118, 190], [82, 190]], 3), sh ? c : '#ff8fb0', .3), LN('M90 172 h20', 2.5));
      out.push(PAIR('M58 66 C44 52 50 34 66 36 C76 38 78 52 74 60 Z', a, .4));
      out.push(FOOT(70, 170, .6, dk), FOOT(130, 170, .6, dk));
      out.push(PART('M34 146 C30 82 62 44 100 44 C138 44 170 82 166 146 C156 154 146 144 133 154 C122 144 111 154 100 146 C89 154 78 144 67 154 C54 144 44 154 34 146 Z', a), HI(62, 70, 12, 7), HI(146, 110, 3, 12, 0));
      out.push(...[[50, 124], [150, 124], [140, 70]].map(([x, y]) => [0, 72, 144, 216, 288].map(r => `<ellipse cx="${(x + Math.cos(r / 57.3) * 5).toFixed(1)}" cy="${(y + Math.sin(r / 57.3) * 5).toFixed(1)}" rx="4" ry="3" fill="${c}" transform="rotate(${r} ${(x + Math.cos(r / 57.3) * 5).toFixed(1)} ${(y + Math.sin(r / 57.3) * 5).toFixed(1)})"/>`).join('') + `<circle cx="${x}" cy="${y}" r="2.5" fill="#fff"/>`));
      out.push(LIMB('M40 120 L24 110', 7, a), LIMB('M160 120 L176 110', 7, a), HAND(22, 108, .55, a, false), HAND(178, 108, .55, a, false));
      out.push(EYES(100, 94, 22, 12, { look: [0, .1], brow: 'up' }), MOUTH(100, 116, 14, 'grin'), PART(cp(100, 138, 7), sh ? c : '#ffe36a', .3));
    }
    else if (id === 'hoshikakera' || id === 'seishou') {
      const E = evo, core = sh ? '#ff6fe0' : '#ffe36a', cry = mix(a, '#ffffff', .35);
      if (f.has('halo')) out.push(`<ellipse cx="100" cy="14" rx="30" ry="8" fill="none" stroke="${OL}" stroke-width="11"/><ellipse cx="100" cy="14" rx="30" ry="8" fill="none" stroke="${sh ? c : '#fff3a0'}" stroke-width="5"/>`);
      out.push(LIMB('M84 158 L80 172', E ? 18 : 12, dk), LIMB('M116 158 L120 172', E ? 18 : 12, dk), FOOT(78, 179, E ? 1.1 : .85, dk), FOOT(122, 179, E ? 1.1 : .85, dk));
      if (E) out.push(PART(rpoly([[62, 64], [66, 26], [84, 50]], 4), cry, .3), PART(rpoly([[84, 50], [100, 14], [116, 50]], 4), cry, .3), PART(rpoly([[116, 50], [134, 26], [138, 64]], 4), cry, .3));
      else out.push(PART(rpoly([[86, 64], [94, 36], [104, 60]], 4), cry, .3), PART(rpoly([[104, 60], [118, 42], [118, 68]], 4), cry, .3));
      const body = E ? [[100, 46], [150, 60], [170, 104], [150, 160], [100, 172], [50, 160], [30, 104], [50, 60]] : [[100, 54], [140, 68], [154, 108], [138, 156], [100, 166], [62, 156], [46, 108], [60, 68]];
      out.push(PART(rpoly(body, 12), a), FLAT(rpoly(E ? [[100, 54], [140, 68], [100, 84], [60, 68]] : [[100, 62], [132, 74], [100, 86], [68, 74]], 5), cry, 0), LN(E ? 'M40 104 L60 68 M160 104 L140 68' : 'M54 108 L66 74 M146 108 L134 74', 2.5), HI(72, 76, 8, 5));
      if (E) out.push(PART(rpoly([[30, 80], [60, 72], [58, 108], [30, 110]], 6), cry, .4), PART(rpoly([[170, 80], [140, 72], [142, 108], [170, 110]], 6), cry, .4));
      out.push(LIMB(E ? 'M40 108 C24 124 20 140 26 150' : 'M52 116 C38 124 34 136 38 146', E ? 16 : 10, dk), LIMB(mirror(E ? 'M40 108 C24 124 20 140 26 150' : 'M52 116 C38 124 34 136 38 146'), E ? 16 : 10, dk), HAND(E ? 26 : 38, E ? 156 : 150, E ? 1.1 : .7, cry), HAND(E ? 174 : 162, E ? 156 : 150, E ? 1.1 : .7, cry));
      out.push(`<circle cx="100" cy="140" r="${E ? 22 : 16}" fill="${core}" opacity=".35"/>`, star5(100, 140, E ? 14 : 11, core, 3.5));
      out.push(EYES(100, 102, E ? 22 : 18, E ? 11 : 10, { look: [.2, 0], brow: E ? 'angry' : 'mis' }), MOUTH(100, 118, E ? 12 : 10, E ? 'toothy' : 'grin'));
    }
    else if (id === 'pukuawa' || id === 'oopuku') {
      const E = evo, fin = mix(a, c, .4);
      out.push(PART('M146 110 C162 94 176 90 190 92 C184 110 184 130 190 148 C176 148 160 140 146 128 Z', fin, .4));
      out.push(...Array.from({ length: 12 }, (_, i) => { const an = i / 12 * 6.283 - 1.57 + .26, R = 54, L = E ? 24 : 14, x = 100 + Math.cos(an) * R, y = 112 + Math.sin(an) * R, px = -Math.sin(an) * 7, py = Math.cos(an) * 7, tx = 100 + Math.cos(an) * (R + L), ty = 112 + Math.sin(an) * (R + L);
        return FLAT(`M${(x + px).toFixed(1)} ${(y + py).toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}L${(x - px).toFixed(1)} ${(y - py).toFixed(1)}Z`, mix(a, '#ffffff', .35), 4.5); }));
      if (E) out.push(LIMB('M100 60 L100 30 M100 44 L84 30 M100 40 L116 24 M84 30 L78 16 M116 24 L126 14', 8, sh ? c : '#ff7a8a'), ...[[100, 28], [78, 14], [126, 12], [84, 30]].map(([x, y]) => PART(cp(x, y, 5), sh ? c : '#ffb0b8', .2, 4)));
      out.push(PART(cp(100, 112, 56), a), PART(ep(100, 138, 38, 24), mix(c, '#ffffff', .3), .5), HI(72, 80, 12, 7));
      out.push(...[[76, 72], [124, 70], [140, 92], [60, 96], [100, 64]].map(([x, y]) => FLAT(cp(x, y, 4), b, 0)));
      out.push(PAIR('M48 118 C34 108 22 114 24 128 C32 128 38 130 46 136 Z', fin, .3));
      out.push(EYES(100, 104, 22, 13, { look: [.25, .1], brow: bb(E ? 'angry' : 'up') }), MOUTH(100, 128, E ? 14 : 11, bm(E ? 'toothy' : 'buck')));
      out.push(...[[30, 62, 7], [42, 40, 4.5], [170, 46, 6], [178, 28, 3.5]].map(([x, y, r]) => FLAT(cp(x, y, r), sh ? 'none' : '#ffffff', 3) + (sh ? '' : `<circle cx="${x - r * .35}" cy="${y - r * .35}" r="${r * .3}" fill="${OL}" opacity=".0"/>`)));
    }
    else if (id === 'hitoden') {
      out.push(`<circle cx="100" cy="110" r="66" fill="${c}" opacity="${sh ? .12 : .25}"/>`);
      out.push(`<ellipse cx="100" cy="16" rx="26" ry="7" fill="none" stroke="${OL}" stroke-width="10"/><ellipse cx="100" cy="16" rx="26" ry="7" fill="none" stroke="${sh ? c : '#fff3a0'}" stroke-width="4.5"/>`);
      const pts = Array.from({ length: 10 }, (_, i) => { const an = -Math.PI / 2 + i * Math.PI / 5, R = i % 2 ? 38 : 80; return [+(100 + Math.cos(an) * R).toFixed(1), +(112 + Math.sin(an) * R * (i === 4 || i === 6 ? .92 : 1)).toFixed(1)]; });
      out.push(PART(rpoly(pts, 13), a), HI(90, 52, 5, 9, 10));
      out.push(...[[100, 50], [100, 66], [50, 94], [64, 100], [150, 94], [136, 100], [70, 160], [78, 146], [130, 160], [122, 146]].map(([x, y]) => FLAT(cp(x, y, 3.5), c, 0)));
      out.push(EYES(100, 108, 16, 11, { look: [.3, 0], brow: 'mis' }), MOUTH(100, 126, 10, 'fang'));
      out.push(star4(30, 40, 7, sh ? c : '#fff6c0', 2.5), star4(172, 170, 6, sh ? c : '#fff6c0', 2.5));
    }
    else if (id === 'takosumi' || id === 'oodako') {
      const E = evo, ink = sh ? '#0e0a20' : '#2a2438';
      const tent = (x, k) => { const d = x < 100 ? -1 : 1, s = (E ? 1.4 : 1) * k; return `M${x} 138 C${x + d * 8 * s} 166 ${x + d * 30 * s} 172 ${x + d * 34 * s} 158 C${x + d * 36 * s} 150 ${x + d * 28 * s} 147 ${x + d * 23 * s} 153`; };
      out.push(...[[66, 1], [80, .7], [92, .45], [108, .45], [120, .7], [134, 1]].map(([x, k]) => LIMB(tent(x, k), E ? 16 : 12, a)));
      out.push(...[[48, 162], [152, 162], [70, 172], [130, 172]].map(([x, y]) => FLAT(cp(x, y, 2.8), c, 0)));
      if (E) { out.push(LIMB('M142 116 C176 108 180 64 152 50', 13, a), LIMB('M58 120 C30 124 20 108 26 94', 13, a), PART(cp(26, 90, 10), gold, .3), LN('M22 90 h8', 3)); }
      else out.push(LIMB('M58 122 C36 116 30 98 40 84', 11, a), LIMB('M40 84 L30 54', 5, sh ? c : '#b07a44'), PART('M30 54 C22 46 24 34 30 28 C36 36 38 46 30 54 Z', ink, .2, 4));
      out.push(PAIR('M48 86 C30 76 20 82 20 96 C28 96 36 100 44 106 Z', dk, .4));
      out.push(PART(E ? 'M100 22 C150 22 168 62 166 98 C164 130 138 148 100 148 C62 148 36 130 34 98 C32 62 50 22 100 22 Z' : 'M100 34 C140 34 158 66 156 100 C154 130 132 146 100 146 C68 146 46 130 44 100 C42 66 60 34 100 34 Z', a), HI(70, E ? 46 : 56, 11, 7));
      out.push(...[[124, 56], [138, 76], [66, 70], [112, 42]].map(([x, y], i) => FLAT(cp(x, y, i % 2 ? 4 : 5.5), c, 0)));
      if (E) out.push(HORN(72, 36, 58, 14, 8, sh ? c : '#ffd0e8'), HORN(128, 36, 142, 14, 8, sh ? c : '#ffd0e8'));
      else out.push(PART('M60 52 C62 28 122 20 144 38 C152 46 146 54 138 52 C118 44 88 44 66 58 Z', ink, .3), FLAT(cp(104, 28, 4), ink, 3));
      out.push(EYES(100, 100, 19, 12, { look: [.3, .1], brow: bb(E ? 'angry' : 'mis') }), MOUTH(100, 122, E ? 13 : 10, bm(E ? 'toothy' : 'fang')));
      if (!E) out.push(FLAT('M150 178 C144 170 150 162 158 166 C166 160 174 170 166 176 C170 184 156 186 150 178 Z', ink, 0), FLAT(cp(172, 160, 3), ink, 0));
    }
    else if (id === 'sangoron') {
      const coral = sh ? c : mix(a, '#ffffff', .2), pearl = sh ? '#ff6fe0' : '#fffaf0';
      const fish = (x, y, col, d = 1) => FLAT(`M${x} ${y}m${-9 * d} 0c0 -5 ${4 * d} -7 ${9 * d} -7c${6 * d} 0 ${9 * d} 4 ${9 * d} 7c0 3 ${-3 * d} 7 ${-9 * d} 7c${-5 * d} 0 ${-9 * d} -2 ${-9 * d} -7z`, col, 3) + FLAT(`M${x - 8 * d} ${y}l${-9 * d} -6v12z`, col, 3) + `<circle cx="${x + 4 * d}" cy="${y - 1}" r="1.8" fill="${OL}"/>`;
      out.push(LIMB('M70 64 C60 44 46 36 40 22 M60 46 C50 44 42 48 36 44 M128 64 C140 44 152 34 160 20 M142 44 C152 42 160 46 166 42 M100 50 L100 26', 10, coral), ...[[40, 20], [34, 44], [160, 18], [168, 42], [100, 24]].map(([x, y]) => PART(cp(x, y, 6), coral, .2, 4)));
      out.push(fish(150, 58, sh ? c : '#ffd23a', 1), fish(52, 36, sh ? c : '#5fd8ff', -1), fish(120, 18, sh ? c : '#ffb0e0', 1));
      out.push(LIMB('M78 160 L74 176', 22, dk), LIMB('M122 160 L126 176', 22, dk), FOOT(72, 180, 1.1), FOOT(128, 180, 1.1));
      out.push(PART(rpoly([[100, 50], [148, 62], [166, 104], [156, 150], [128, 168], [72, 168], [44, 150], [34, 104], [52, 62]], 24), a), HI(64, 76, 10, 6));
      out.push(...[[66, 128], [138, 130], [76, 150], [126, 152], [58, 104], [144, 106], [100, 158]].map(([x, y]) => FLAT(cp(x, y, 4), b, 2.5)));
      out.push(LIMB('M46 100 C30 110 24 124 28 136', 18, a), LIMB(mirror('M46 100 C30 110 24 124 28 136'), 18, a));
      const claw = 'M30 124 C10 126 4 150 18 164 C22 154 28 150 38 150 C34 160 38 168 48 168 C58 152 52 130 30 124 Z';
      out.push(PART(claw, dk, .5), PART(mirror(claw), dk, .5));
      out.push(`<circle cx="100" cy="132" r="20" fill="${pearl}" opacity=".3"/>`, PART(cp(100, 132, 11), pearl, .3), HI(96, 128, 4, 2.5));
      out.push(EYES(100, 88, 16, 10, { brow: 'angry' }), MOUTH(100, 106, 13, bm('tusk')));
    }
    else if (id === 'chouchinan') {
      const lure = sh ? '#ffe95a' : c;
      out.push(`<circle cx="44" cy="30" r="24" fill="${lure}" opacity=".35"/>`, LIMB('M94 66 C94 32 72 18 52 26', 5, dk), PART(cp(44, 30, 12), lure, .3), HI(40, 26, 4, 3));
      out.push(PART('M150 110 C166 92 180 86 192 88 C186 106 186 128 192 146 C178 144 164 136 150 124 Z', dk, .4), PART('M100 66 L110 44 L118 62 L128 46 L136 68 Z', dk, .3));
      out.push(PART('M22 118 C22 80 58 62 96 64 C134 66 158 88 158 116 C158 150 130 170 90 170 C52 170 22 152 22 118 Z', a), HI(62, 80, 12, 6));
      out.push(PART('M118 128 C132 132 144 148 140 160 C128 156 118 146 112 136 Z', dk, .3));
      out.push(FLAT('M18 112 Q58 124 100 114 Q92 164 54 162 Q22 156 18 112 Z', mouthC, 4.5), `<ellipse cx="60" cy="152" rx="16" ry="5" fill="${tongueC}"/>`);
      let t = ''; for (let i = 0; i < 7; i++) { const x = 26 + i * 11; t += FLAT(`M${x} ${116 + i * .4}L${x + 4} ${132}L${x + 8} ${117 + i * .2}Z`, white, 2); }
      for (let i = 0; i < 5; i++) { const x = 34 + i * 12; t += FLAT(`M${x} ${158 - Math.abs(i - 2) * 1.5}L${x + 4} ${142}L${x + 8} ${158 - Math.abs(i - 2) * 1.5}Z`, white, 2); }
      out.push(t, ...[[112, 90], [128, 104], [100, 106], [138, 88]].map(([x, y]) => FLAT(cp(x, y, 3.2), lure, 0)));
      out.push(EYE(72, 90, 14, { look: [-.4, 0] }), BROW(72, 90, 14, bb('up'), 1));
    }
    else if (id === 'uminokami') {
      out.push(`<circle cx="84" cy="70" r="46" fill="none" stroke="${OL}" stroke-width="12"/><circle cx="84" cy="70" r="46" fill="none" stroke="${gold}" stroke-width="6"/>`, ...[0, 60, 120, 180, 240, 300].map(r => star4(84 + Math.cos(r / 57.3) * 46, 70 + Math.sin(r / 57.3) * 46, 5, gold, 2)));
      const coil = 'M76 112 C40 136 52 178 108 174 C160 170 182 138 164 108 C152 90 128 96 132 116';
      out.push(...[[62, 148, -40], [96, 172, 10], [150, 158, 50], [172, 118, 100]].map(([x, y, r]) => PART(`M${x - 9} ${y}L${x} ${y - 18}L${x + 9} ${y}Z`, mix(a, b, .6), .3, 4.5).replace(/<use href="(#[^"]+)"/g, `<use href="$1" transform="rotate(${r} ${x} ${y})"`)));
      out.push(LIMB(coil, 30, a), LN(coil, 9, mix(a, '#ffffff', .6)), PART('M132 116 C120 104 124 90 134 86 C134 96 142 100 150 98 C146 108 140 116 132 116 Z', mix(a, b, .5), .3));
      out.push(PART('M120 48 C146 28 172 26 192 36 C172 44 162 54 152 70 C144 60 132 56 120 60 Z', mix(a, b, .5), .4), PART('M50 50 C34 30 18 24 6 30 C20 38 28 50 34 64 Z', mix(a, b, .5), .4));
      out.push(PART('M40 72 C40 42 64 28 90 30 C120 32 138 52 136 76 C134 104 112 120 86 120 C58 120 40 102 40 72 Z', a), PART('M46 96 C56 116 116 120 130 96 C124 116 106 122 86 122 C66 122 52 114 46 96 Z', mix(c, '#ffffff', .4), .3), HI(62, 46, 11, 6));
      out.push(PART('M72 34 L68 14 L82 28 Z', gold, .2, 4), PART('M88 30 L92 8 L100 30 Z', gold, .2, 4), PART('M108 34 L116 16 L118 38 Z', gold, .2, 4), PART(cp(90, 32, 6), sh ? '#ff7fe0' : '#bff0ff', .2, 3.5));
      out.push(LN('M46 96 C28 100 16 114 20 130', 3.5, gold), LN('M120 104 C136 112 144 128 140 142', 3.5, gold));
      out.push(EYES(86, 72, 20, 11, { look: [-.1, .1], brow: 'angry' }), MOUTH(86, 98, 13, bm('fang')));
    }
    else { // safety fallback: generic imp
      out.push(FOOT(84, 180, .8), FOOT(116, 180, .8), PART(cp(100, 110, 50), a), EYES(100, 104, 18, 11), MOUTH(100, 126, 11, 'grin'));
    }

    // ---------- assemble ----------
    let pre = '';
    const big = (S.size || 1);
    const sc = { uminokami: .9, oodako: .96, oopuku: .97 }[id] || Math.min(1.04, .9 + (big - 1) * .3);
    if (S.legend && !sh) { pre += `<circle cx="100" cy="106" r="96" fill="url(#${uid}la)"/>`; defs.push(`<radialGradient id="${uid}la"><stop offset="0" stop-color="#fff3b0" stop-opacity=".8"/><stop offset=".6" stop-color="#ffd36a" stop-opacity=".25"/><stop offset="1" stop-color="#ffd36a" stop-opacity="0"/></radialGradient>`); }
    if (sh) { pre += `<circle cx="100" cy="110" r="94" fill="url(#${uid}la)"/>`; defs.push(`<radialGradient id="${uid}la"><stop offset="0" stop-color="#7a3ae0" stop-opacity="${BOSS ? .8 : .5}"/><stop offset=".7" stop-color="#3a1a80" stop-opacity=".2"/><stop offset="1" stop-color="#3a1a80" stop-opacity="0"/></radialGradient>`); }
    pre += `<ellipse cx="100" cy="190" rx="${48 * sc}" ry="6.5" fill="#1d1420" opacity="${sh ? .45 : .22}"/>`;
    let post = '';
    if (sh) post += ['M22 150c-12-6-10-22 2-22c-5 5-2 11 5 10', 'M178 120c12-6 10-22-2-22c5 5 2 11-5 10', 'M40 52c-8-10 0-22 12-18c-7 3-7 10-1 12'].map(d => `<path d="${d}" fill="none" stroke="#7a4ae0" stroke-width="5" stroke-linecap="round" opacity=".8"/>`).join('') + `<circle cx="30" cy="100" r="3.5" fill="#b58cff"/><circle cx="170" cy="160" r="3" fill="#b58cff"/><circle cx="160" cy="40" r="2.5" fill="#ff7fe0"/>`;
    if (shiny) post += star4(166, 30, 13, '#fff3a0', 3) + star4(30, 60, 8, '#ffffff', 2.5) + star4(174, 150, 6, '#ffe38a', 2.5);
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs.join('')}</defs>${pre}<g transform="translate(100 190) scale(${sc.toFixed(3)}) translate(-100 -190)">${out.join('')}</g>${post}</svg>`;
  }
  Art.species = speciesArt;
})();
