// ともしびアイランド — chibi portrait redesign (overrides Art.portrait; Art.P untouched)
'use strict';
(() => {
  if (typeof Art === 'undefined') return;
  const base = Art.portrait;
  let uid = 0;
  const EXPR = new Set(['smile', 'neutral', 'sad', 'angry', 'surprised', 'worried', 'determined', 'grin', 'joy', 'smirk', 'closed']);
  const hx = c => { c = c.slice(1); if (c.length === 3) c = c.replace(/./g, x => x + x); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); };
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const r1 = n => Math.round(n * 10) / 10;
  // soft tufts: pts from current point, alternating notch / tip
  const tufts = pts => { let d = ''; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    d += y1 > y0 ? ` Q${r1(x0 + (x1 - x0) * .8)} ${r1(y0 + (y1 - y0) * .3)} ${x1} ${y1}` : ` Q${r1(x0 + (x1 - x0) * .15)} ${r1(y0 + (y1 - y0) * .75)} ${x1} ${y1}`; } return d; };
  const star = (x, y, r, f, o = 1) => `<path d="M${x} ${y - r}Q${x + r * .18} ${y - r * .18} ${x + r} ${y}Q${x + r * .18} ${y + r * .18} ${x} ${y + r}Q${x - r * .18} ${y + r * .18} ${x - r} ${y}Q${x - r * .18} ${y - r * .18} ${x} ${y - r}Z" fill="${f}" opacity="${o}"/>`;
  const star5 = (x, y, r, f, st) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .48 : r; d += (i ? 'L' : 'M') + r1(x + Math.cos(a) * q) + ' ' + r1(y + Math.sin(a) * q); }
    return `<path d="${d}Z" fill="${f}" stroke="${st}" stroke-width="1.6" stroke-linejoin="round"/>`; };
  const P = (d, f, st, w = 2.2, x = '') => `<path d="${d}" fill="${f}"${st ? ` stroke="${st}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"` : ''}${x}/>`;
  const S = (d, st, w = 2.2, x = '') => `<path d="${d}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${x}/>`;
  const TORSO = 'M40 204 C42 176 64 159 100 159 C136 159 158 176 160 204 Z';
  const FACE = 'M57 98 C57 66 76 50 100 50 C124 50 143 66 143 98 C143 118 137 131 126 141 C117 149 108 155 100 155 C92 155 83 149 74 141 C63 131 57 118 57 98 Z';
  const CAP = (l, t, r, y) => `M${l} ${y} C${l - 10} 62 ${100 - 34} ${t} 100 ${t} C${134} ${t} ${r + 10} 62 ${r} ${y}`;
  const beardRing = (outer, my) => `${outer} M100 ${my - 8} C92 ${my - 8} 88 ${my - 3} 88 ${my + 1} C88 ${my + 6} 94 ${my + 9} 100 ${my + 9} C106 ${my + 9} 112 ${my + 6} 112 ${my + 1} C112 ${my - 3} 108 ${my - 8} 100 ${my - 8} Z`;
  const TYPES = {
    kid: { dx: 20, cy: 110, rx: 10.5, ry: 9.6, lw: 4.2, bl: 0, bw: 5 },
    adult: { dx: 20, cy: 109, rx: 10, ry: 8.2, lw: 4, bl: 0, bw: 5.4 },
    elder: { dx: 20, cy: 111, rx: 6.6, ry: 6.4, lw: 3.2, bl: 0, bw: 5, bean: true },
  };

  // ---------------- cast ----------------
  const C = {
    sora: { t: 'kid', bl: .22, skin: '#fde2cb', line: '#5a3424', hair: ['#a0643a', '#77462a', '#d49a62'], eye: '#3f8ad6', disc: ['#ffe0a8', '#f0a040'],
      back: 'M46 124 L32 112 L42 100 L24 84 L46 74 L30 50 L58 54 L54 28 L80 40 L88 12 L102 32 L120 12 L124 38 L148 26 L144 54 L172 48 L156 74 L178 82 L160 100 L170 112 L154 124 Z',
      front: CAP(50, 32, 150, 118) + tufts([[150, 118], [144, 90], [136, 102], [127, 76], [116, 98], [104, 74], [92, 98], [81, 76], [70, 100], [62, 86], [50, 118]]) + ' Z M100 34 C94 20 100 8 116 10 C106 16 104 24 110 34 Z',
            body: () => P(TORSO, '#3a6cb0', '#1f3a66') + S('M60 186 L66 204 M140 186 L134 204', '#2c5490', 3) +
        `<g transform="translate(56 188)"><circle r="15" fill="#ffd36a" opacity=".35"/>${P('M-7 -7 h14 v14 a3 3 0 0 1 -3 3 h-8 a3 3 0 0 1 -3 -3 Z', '#ffd36a', '#6a3a1a', 2)}${S('M-5 -7 Q0 -14 5 -7', '#6a3a1a', 2)}${P('M0 -3 q-3.5 4.5 0 8 q3.5 -3.5 0 -8z', '#ff8a3a')}</g>` +
        P('M62 160 C68 148 132 148 138 160 C142 173 128 182 100 182 C72 182 58 173 62 160 Z', '#f59c38', '#8a4a14') + S('M72 166 Q100 176 128 166', '#d8791e', 3) +
        P('M114 174 C124 182 132 194 130 206 L112 206 C114 196 112 188 104 180 Z', '#e8862a', '#8a4a14') + S('M113 188 L128 186 M115 197 L130 196', '#ffd08a', 2.6) },
    mio: { t: 'kid', bl: .28, lash: 1, skin: '#fee4d0', line: '#6a3020', hair: ['#f08452', '#c65e38', '#ffc08e'], eye: '#27a386', disc: ['#c6f4e6', '#3fb3a0'],
      back: 'M42 118 C34 62 62 30 100 30 C138 30 166 62 158 118 C162 148 166 170 170 198 C154 206 138 200 132 186 L68 186 C62 200 46 206 30 198 C34 170 38 148 42 118 Z',
      front: CAP(50, 34, 150, 118) + ' C152 136 150 152 142 166 C138 146 138 124 138 100' + tufts([[138, 100], [134, 82], [126, 96], [115, 70], [102, 94], [92, 72], [80, 95], [72, 80], [64, 100]]) + ' C62 122 62 146 58 166 C50 152 48 134 50 118 Z',
      hl: 'M62 72 Q100 46 138 72',
      over: () => `<g transform="translate(141 64)">${P('M4 6 C12 6 16 12 16 16 C10 16 6 12 4 6Z', '#57b87a', '#2a6a40', 1.4)}${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-6.5" rx="5" ry="6.5" transform="rotate(${a})" fill="#fff" stroke="#d09a86" stroke-width="1.3"/>`).join('')}<circle r="3.6" fill="#f5c14a"/></g>`,
      body: () => P(TORSO, '#fbf6ec', '#b8a888') + P('M42 204 C44 182 60 169 84 166 L92 184 L78 204 Z M158 204 C156 182 140 169 116 166 L108 184 L122 204 Z', '#35a595', '#1a5a50') +
        P('M100 171 L89 164 L89 178 Z M100 171 L111 164 L111 178 Z', '#f58a78', '#a04a3a', 1.6) + '<circle cx="100" cy="171" r="3" fill="#e06a5a"/>' },
    riku: { t: 'kid', skin: '#f3cfae', line: '#1e2430', hair: ['#34486a', '#24324c', '#6886b4'], eye: '#d9962c', disc: ['#ffc6b6', '#d0504a'], sharp: 1,
      back: 'M46 118 C38 92 40 70 48 58 L38 50 L56 50 C62 38 72 30 84 28 L88 14 L100 26 C116 24 132 32 142 44 L160 40 L152 56 C162 72 162 94 154 118 Z',
      front: 'M52 116 C44 76 62 38 100 38 C138 38 156 76 148 116' + tufts([[148, 116], [144, 88], [137, 102], [128, 84], [118, 99], [108, 82], [96, 100], [86, 84], [74, 99], [64, 86], [52, 116]]) + ' Z',
      hl: 'M64 60 Q100 38 136 60',
      behind: S('M146 206 L184 106', '#7a5a3a', 6) + P('M184 92 L193 104 L187 116 L178 106 Z', '#e4ebf2', '#5a6068', 2) + P('M178 110 l10 4 l-2 4 l-10 -4z', '#c83a35'),
      face: () => S('M126 122 l9 -5', '#c8786a', 2),
      over: () => P('M146 82 C158 72 170 74 178 84 C168 90 156 90 148 90 Z', '#c83a35', '#6a1a18') + P('M146 88 C158 96 164 108 162 120 C154 112 150 102 144 94 Z', '#a82e2a', '#6a1a18') +
        P('M52 86 C66 60 134 60 148 86 L148 96 C132 74 68 74 52 96 Z', '#dc4540', '#6a1a18') + S('M60 84 C76 68 124 68 140 84', '#ff9a8a', 1.6, ' opacity=".8"') + '<circle cx="147" cy="88" r="5" fill="#b8322e" stroke="#6a1a18" stroke-width="1.8"/>',
      body: () => P(TORSO, '#3e3e50', '#16161e') + P('M80 160 L120 160 L124 174 C112 180 88 180 76 174 Z', '#2a2a36', '#101014') + P('M34 204 C34 182 46 170 66 166 L76 182 L58 204 Z', '#9aa0aa', '#4a4f58') + S('M44 186 L60 180', '#c4c8d0', 2) },
    sana: { t: 'kid', bl: .2, lash: 1, skin: '#fbe3d2', line: '#1c2438', hair: ['#35486e', '#243252', '#7390c8'], eye: '#6a86e6', disc: ['#d2dcff', '#5a6fc8'],
      back: 'M44 118 C36 62 64 32 100 32 C136 32 164 62 156 118 L158 152 C150 160 142 158 138 150 L62 150 C58 158 50 160 42 152 Z M136 52 C170 44 188 82 182 126 C178 158 170 182 156 202 C152 178 156 152 152 126 C150 100 146 80 132 66 Z',
      front: CAP(50, 34, 150, 118) + ' C152 134 150 150 146 160 C140 144 138 124 138 104' + tufts([[138, 104], [134, 86], [126, 95], [118, 78], [110, 95], [100, 79], [90, 95], [82, 78], [74, 95], [66, 86], [62, 104]]) + ' C62 124 60 144 54 160 C50 150 48 134 50 118 Z',
      hl: 'M62 70 Q100 46 138 70',
      over: () => P('M134 48 l10 -6 l2 10 z', '#3a4c8f', '#1a2450', 1.6) + star5(66, 62, 10, '#ffd35a', '#a0761a') + '<circle cx="62" cy="76" r="2.4" fill="#ffe8a0"/><circle cx="58" cy="84" r="2" fill="#ffe8a0"/>',
      body: () => P(TORSO, '#f8f5ee', '#a8a090') + P('M42 204 C44 186 56 173 70 168 L68 204 Z M158 204 C156 186 144 173 130 168 L132 204 Z', '#3a4c8f', '#1a2450') +
        P('M84 165 L100 190 L116 165 L123 168 L100 204 L77 168 Z', '#2f3f7a', '#1a2450', 1.8) + star5(100, 192, 5, '#ffd35a', '#a0761a') },
    haru: { t: 'kid', bl: .2, lash: 1, skin: '#fde6d6', line: '#35607e', hair: ['#a6d2ec', '#78aed2', '#f2fbff'], eye: '#2a9cc8', disc: ['#e0f6ff', '#6fc0e0'], rim: '#ffffff',
      back: 'M46 120 C34 92 40 62 58 48 C64 34 82 26 100 30 C118 26 136 34 142 48 C160 62 166 92 154 120 C150 130 144 132 138 128 L62 128 C56 132 50 130 46 120 Z',
      front: CAP(50, 36, 150, 120) + tufts([[150, 120], [146, 100], [141, 112], [136, 84], [126, 97], [118, 74], [106, 93], [96, 75], [86, 95], [78, 77], [70, 98], [62, 92], [56, 112], [50, 120]]) + ' Z',
      hl: 'M64 84 Q100 62 136 84',
      over: () => P('M150 66 C166 46 176 26 170 10 C158 22 150 42 145 60 Z', '#ffffff', '#8fb8d4', 1.8) + S('M148 62 Q158 40 168 16', '#b8d8ec', 1.4) +
        P('M52 74 C66 56 134 56 148 74 L148 81 C134 64 66 64 52 81 Z', '#8a6040', '#4a2e1a', 1.8) +
        [80, 120].map(x => `<circle cx="${x}" cy="58" r="11" fill="#ffc85a" stroke="#6a4a2e" stroke-width="3.4"/><circle cx="${x - 3.5}" cy="54.5" r="3.4" fill="#fff" opacity=".9"/>`).join(''),
      body: () => P(TORSO, '#92d2ea', '#3a6a88') + P('M100 165 L68 183 L100 204 L132 183 Z', '#f8cc56', '#a07a1a', 2) + S('M100 166 L100 204 M68 183 L132 183', '#c89a2a', 1.4) + '<circle cx="100" cy="171" r="4.5" fill="#fff" stroke="#a07a1a" stroke-width="1.5"/>' },
    kaito: { t: 'adult', skin: '#f1c7a2', line: '#3a2418', hair: ['#4a3322', '#33231a', '#7a5a40'], eye: '#3c78a0', disc: ['#c8ece4', '#3f8a8a'], bw: 5,
      back: 'M48 116 C40 72 62 40 100 40 C138 40 160 72 152 116 Z',
      front: CAP(52, 40, 148, 112) + tufts([[148, 112], [144, 88], [137, 97], [131, 70], [116, 86], [104, 62], [88, 80], [80, 68], [66, 88], [58, 96], [52, 112]]) + ' Z',
      hl: 'M68 62 Q100 46 132 62',
      face: s => P('M68 128 C74 146 88 151 100 151 C112 151 126 146 132 128 C126 140 114 145 100 145 C86 145 74 140 68 128 Z', '#6a6a8a', 0, 0, ' opacity=".22"') + '',
      body: () => P(TORSO, '#327a7e', '#18393c') + P('M70 168 C74 154 90 156 100 166 C110 156 126 154 130 168 L124 182 C114 175 86 175 76 182 Z', '#276266', '#18393c') +
        [184, 196].map(y => `<circle cx="100" cy="${y}" r="3.4" fill="#f0c850" stroke="#8a6a1a" stroke-width="1.2"/>`).join('') + P('M62 188 l5 -10 l5 10 z', '#f0c850', '#8a6a1a', 1.2) },
    yui: { t: 'adult', lash: 1, skin: '#fde2cf', line: '#4a2a1c', hair: ['#80543a', '#5e3c28', '#b8865e'], eye: '#8a5a38', disc: ['#e6f4d2', '#8cb07a'],
      back: 'M46 118 C38 70 62 38 100 38 C138 38 162 70 154 118 L150 138 L50 138 Z',
      front: CAP(52, 40, 148, 118) + tufts([[148, 118], [142, 88], [133, 95], [122, 70], [108, 90], [97, 66], [82, 88], [71, 78], [61, 98], [52, 118]]) + ' Z',
      hl: 'M66 66 Q100 46 134 66',
      over: h => [0, 1, 2, 3, 4].map(i => `<ellipse cx="${148 + i * 2}" cy="${138 + i * 13}" rx="${10 - i * .8}" ry="8.5" fill="${i % 2 ? h[1] : h[0]}" stroke="#4a2a1c" stroke-width="2"/>`).join('') +
        P('M146 196 l-8 8 l16 0 z', '#8cc06a', '#3a5a2a', 1.6) + S('M124 72 L148 56', '#c9a064', 4) + '<circle cx="149" cy="55" r="5" fill="#e85a5a" stroke="#8a2a2a" stroke-width="1.5"/>',
      body: () => P(TORSO, '#86a874', '#3a4a30') + P('M58 204 C60 186 74 177 100 177 C126 177 140 186 142 204 Z', '#f6ecd6', '#b8a888') + S('M84 167 Q100 177 116 167', '#f6ecd6', 3.4) + S('M70 186 Q100 180 130 186', '#e2d4b4', 1.6) },
    gen: { t: 'adult', skin: '#e9b58c', line: '#2a1c12', hair: ['#3d3935', '#2a2622', '#6a645c'], eye: '#5a4230', disc: ['#f6dcb8', '#b07a4a'], bw: 5.4, my: 5,
      back: 'M50 112 C44 74 66 46 100 46 C134 46 156 74 150 112 Z',
      front: 'M54 108 C50 84 56 70 66 64 L134 64 C144 70 150 84 146 108 C142 98 138 94 134 92 L66 92 C62 94 58 98 54 108 Z',
      noHl: 1,
      beard: h => P(beardRing('M60 114 C60 150 80 172 100 172 C120 172 140 150 140 114 C134 128 126 136 116 138 L84 138 C74 136 66 128 60 114 Z', 140), h[0], '#1a1410', 2.2, ' fill-rule="evenodd"'),
      mus: h => P('M84 135 C88 128 97 129 100 132.5 C103 129 112 128 116 135 C110 138 104 137 100 135.5 C96 137 90 138 84 135 Z', h[0], '#1a1410', 1.6),
      over: () => P('M52 88 C64 62 136 62 148 88 L148 98 C136 76 64 76 52 98 Z', '#f4efe4', '#8a826a') + S('M58 86 C74 70 126 70 142 86', '#6a8ab8', 2.4, ' stroke-dasharray="5 5"') +
        P('M52 86 C42 80 32 84 28 94 C38 96 46 94 53 91 Z M51 92 C42 98 38 106 40 116 C46 110 50 102 55 96 Z', '#f4efe4', '#8a826a', 1.8) +
        [85, 115].map(x => `<circle cx="${x}" cy="56" r="10" fill="#9fd0ff" stroke="#3a2a1a" stroke-width="3.4"/><path d="M${x - 5} 53 l4 -4" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`).join('') + S('M95 56 L105 56', '#3a2a1a', 3.4),
      body: () => P('M34 204 C36 178 62 163 100 163 C138 163 164 178 166 204 Z', '#efe8da', '#8a826a') + P('M64 204 L67 170 L133 170 L136 204 Z', '#7a5232', '#3a2412') + S('M67 172 L58 164 M133 172 L142 164', '#5a3a22', 3) +
        S('M146 200 L170 162', '#7a5634', 6) + P('M160 150 L182 164 L176 172 L154 158 Z', '#8a8f98', '#3a3a44', 2) },
    nagi: { t: 'adult', lash: 1, skin: '#fbd7b6', line: '#4a1e0c', hair: ['#b05a32', '#86401f', '#e08a5a'], eye: '#6a9a3a', disc: ['#ffe4c0', '#f0903c'], bl: .2, freckles: 1,
      back: 'M48 118 C40 76 60 48 100 48 C140 48 160 76 152 118 C156 128 150 136 142 134 L58 134 C50 136 44 128 48 118 Z',
      front: 'M54 112 C50 92 54 80 60 76 L140 76 C146 80 150 92 146 112' + tufts([[146, 112], [140, 90], [132, 98], [124, 84], [114, 96], [104, 84], [94, 96], [84, 84], [74, 96], [64, 88], [54, 112]]) + ' Z',
      noHl: 1,
      over: () => P('M100 40 C88 16 70 12 66 22 C72 32 86 38 100 40 Z M100 40 C112 16 130 12 134 22 C128 32 114 38 100 40 Z', '#e0504a', '#7a2020') +
        P('M56 86 C54 52 76 38 100 38 C124 38 146 52 144 86 C124 74 76 74 56 86 Z', '#e8564e', '#7a2020') + '<circle cx="100" cy="40" r="5.5" fill="#c83e38" stroke="#7a2020" stroke-width="1.8"/>' +
        `<g fill="#fff" opacity=".9">${[[76, 60], [92, 50], [110, 50], [126, 60], [84, 72], [102, 64], [118, 72], [66, 74], [134, 74], [80, 26], [120, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.8"/>`).join('')}</g>` +
        '<circle cx="57" cy="126" r="3.4" fill="#f5c64e" stroke="#8a6a1a" stroke-width="1"/><circle cx="143" cy="126" r="3.4" fill="#f5c64e" stroke="#8a6a1a" stroke-width="1"/>',
      body: () => P(TORSO, '#f39a44', '#8a4a14') + P('M70 204 L73 173 C86 178 114 178 127 173 L130 204 Z', '#fffaf0', '#b8a888') + S('M78 176 L74 166 M122 176 L126 166', '#fffaf0', 3) },
    tsumugi: { t: 'kid', bl: .25, skin: '#feeadb', line: '#3a3a1e', hair: ['#94c96c', '#6ca44a', '#d4f2a8'], eye: '#b0702a', disc: ['#e6f8c8', '#7cbc5c'],
      back: 'M46 118 C38 66 64 36 100 36 C136 36 162 66 154 118 Z M54 116 C32 122 26 150 30 176 C34 190 42 197 50 200 C48 180 52 160 64 138 Z M146 116 C168 122 174 150 170 176 C166 190 158 197 150 200 C152 180 148 160 136 138 Z',
      front: CAP(50, 38, 150, 118) + tufts([[150, 118], [145, 94], [139, 100], [132, 84], [123, 96], [114, 84], [105, 96], [96, 84], [87, 96], [78, 84], [69, 96], [62, 90], [56, 106], [50, 118]]) + ' Z M104 40 C102 28 108 20 118 20 C118 30 112 36 104 40 Z M102 40 C96 32 90 32 84 34 C88 40 96 42 102 40 Z',
      hl: 'M64 70 Q100 48 136 70',
      over: () => '<circle cx="56" cy="124" r="6" fill="#ff9ec4" stroke="#b0507a" stroke-width="1.8"/><circle cx="144" cy="124" r="6" fill="#ff9ec4" stroke="#b0507a" stroke-width="1.8"/>',
      glass: () => [79, 121].map(x => `<circle cx="${x}" cy="112" r="17" fill="#e8f6ff" fill-opacity=".14" stroke="#8a5a2a" stroke-width="2.5"/><path d="M${x - 11} ${104} l6 -6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>`).join('') + S('M96.5 109 Q100 106 103.5 109', '#8a5a2a', 3),
      body: () => P('M34 206 C36 180 62 164 100 164 C138 164 164 180 166 206 Z', '#fcfcf6', '#a0a090') + P('M84 164 L100 184 L116 164 Z', '#e8f0d8', '#a0a090', 1.6) +
        P('M96 168 L104 168 L107 190 L100 199 L93 190 Z', '#5aa84a', '#2a5a1a', 1.6) + S('M84 164 L92 204 M116 164 L108 204', '#c8c8bc', 2.4) + P('M122 184 h18 v14 h-18z', '#f4e6c0', '#a09060', 1.6) },
    baldo: { t: 'elder', skin: '#e8ac80', line: '#2a1a10', hair: ['#f4f2ee', '#d8d4cc', '#ffffff'], eye: '#3a5a8a', disc: ['#c8dcf4', '#4a6a98'], my: 6, bw: 5, brow: '#cfc8bc',
      back: 'M50 118 C44 90 50 72 60 64 L140 64 C150 72 156 90 150 118 Z',
      front: '', sh: 'M40 70 C60 58 140 58 160 70 L160 84 C130 78 70 78 40 84 Z',
      beard: h => P(beardRing('M58 110 C54 140 68 166 86 172 C92 180 108 180 114 172 C132 166 146 140 142 110 C138 126 130 136 120 138 L80 138 C70 136 62 126 58 110 Z', 142), h[0], '#9a948a', 2.2, ' fill-rule="evenodd"') +
        [[70, 158], [84, 170], [116, 170], [130, 158]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${h[0]}"/>`).join('') + S('M72 152 q4 6 10 6 M118 158 q6 0 10 -6', '#c8c2b8', 1.8),
      mus: h => P('M80 137 C85 127 97 128 100 133 C103 128 115 127 120 137 C113 142 106 140 100 137 C94 140 87 142 80 137 Z', h[0], '#9a948a', 1.8),
      over: () => P('M62 66 C60 32 140 32 138 66 Z', '#2a3a58', '#0e1624') + P('M64 58 C88 52 112 52 136 58 L137 65 C112 59 88 59 63 65 Z', '#e8bc4a', '#8a6a1a', 1.4) +
        P('M22 76 C54 52 146 52 178 76 C150 70 128 82 100 82 C72 82 50 70 22 76 Z', '#1f2c44', '#0e1624') + P('M130 54 C148 30 168 24 178 30 C166 34 152 44 136 58 Z', '#ffffff', '#9aa4b0', 1.6) +
        `<g transform="translate(100 44)" fill="none" stroke="#f0c850" stroke-width="2.4" stroke-linecap="round"><circle cy="-6" r="2.4"/><path d="M0 -3 V7 M-6 3 Q0 10 6 3 M-4 -1 H4"/></g>`,
      body: () => P(TORSO, '#26364f', '#0e1624') + P('M86 165 L100 186 L114 165 Z', '#f4f0e6', '#9a948a', 1.6) + [182, 194].map(y => `<circle cx="88" cy="${y}" r="3" fill="#f0c850"/><circle cx="112" cy="${y}" r="3" fill="#f0c850"/>`).join('') + S('M50 180 Q60 172 72 172', '#f0c850', 3) },
    soyogi: { t: 'elder', lash: 1, skin: '#f4dfcc', line: '#5a4a5a', hair: ['#f6f6fb', '#dcdcea', '#ffffff'], eye: '#6a7ab0', disc: ['#f4f0ff', '#b8a8e0'], brow: '#b8b4c8', my: 1,
      behind: S('M172 56 L172 206', '#8a6a45', 5) + [-9, 0, 9].map(dx => S(`M${172 + dx} 60 L${172 + dx} ${80 + Math.abs(dx)}`, '#bfe8ff', 2.6) + `<circle cx="${172 + dx}" cy="${83 + Math.abs(dx)}" r="3.2" fill="#dff6ff" stroke="#7aa8c8" stroke-width="1"/>`).join('') + S('M160 60 Q172 52 184 60', '#8a6a45', 3),
      back: [[100, 36, 19], [80, 42, 13], [120, 42, 13], [56, 104, 18], [144, 104, 18], [60, 76, 20], [140, 76, 20], [100, 60, 36], [60, 128, 12], [140, 128, 12]].map(([x, y, r]) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0Z`).join(' '),
      front: CAP(54, 46, 146, 112) + tufts([[146, 112], [140, 88], [132, 80], [120, 72], [110, 78], [100, 70], [90, 78], [80, 72], [68, 80], [60, 88], [54, 112]]) + ' Z',
      hl: 'M68 60 Q100 44 132 60',
      over: () => P('M112 28 C122 18 134 16 140 20 C132 24 124 30 116 36 Z', '#8fb8f0', '#4a6a9a', 1.4) + '<circle cx="112" cy="34" r="3" fill="#f0c850"/>',
      face: s => S('M62 124 q3 4 7 4 M138 124 q-3 4 -7 4', s, 1.6, ' opacity=".7"'),
      body: () => P(TORSO, '#ece6f6', '#8a80a8') + P('M84 165 L100 184 L116 165 Z', '#d2c8ea', '#8a80a8', 1.6) + S('M74 172 Q100 188 126 172', '#8a6a4a', 1.6) +
        `<g fill="#fff" stroke="#8fa8d8" stroke-width="1.2">${[82, 94, 106, 118].map(x => `<path d="M${x} ${178 + (Math.abs(x - 100) < 10 ? 4 : 0)} c-4 8 -1 16 2 18 c3 -6 3 -12 -2 -18z"/>`).join('')}</g>` },
    yomi: { t: 'kid', lash: 2, skin: '#f1eaf8', line: '#2a2040', hair: ['#e4dff2', '#b3aad0', '#ffffff'], eye: '#ffc94a', eyeDark: '#8a4a10', disc: ['#9c7ee0', '#261a44'], blushC: '#c8a0e8', bl: 0,
      lidMap: { smile: 'melan', neutral: 'melan', closed: 'closed', joy: 'joy' }, mouthMap: { smile: 'soft', grin: 'smirk' }, rim: '#d8c8ff', sk2: '#d6c6ea',
      behind: '<circle cx="100" cy="104" r="80" fill="#8b6cd8" opacity=".22"/><circle cx="100" cy="104" r="62" fill="#b89aff" opacity=".14"/>',
      back: 'M40 118 C30 56 62 24 100 24 C138 24 170 56 160 118 C164 150 172 180 184 206 L16 206 C28 180 36 150 40 118 Z',
      front: CAP(50, 34, 150, 118) + ' C154 140 152 162 146 180 C140 158 138 132 136 108 C132 90 120 80 104 76 C112 84 114 92 112 98 C108 86 102 80 100 66 C98 80 92 86 88 98 C86 92 88 84 96 76 C80 80 68 90 64 108 C62 132 60 158 54 180 C48 162 46 140 50 118 Z',
      hl: 'M62 72 Q100 48 138 72',
      face: () => P('M73 131 q-2.6 4.4 0 7 q2.6 -2.6 0 -7z', '#8b6cd8'),
      over: () => P('M66 50 L62 26 L80 40 L90 18 L100 36 L110 18 L120 40 L138 26 L134 50 C118 43 82 43 66 50 Z', '#2a2040', '#9a7ae8', 1.8) +
        [[62, 26], [90, 18], [110, 18], [138, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#c8a8ff"/>`).join('') + '<circle cx="100" cy="42" r="9" fill="#b58cff" opacity=".35"/><circle cx="100" cy="42" r="4.5" fill="#b58cff" stroke="#fff" stroke-width="1.2"/>',
      body: () => P('M28 206 C30 176 62 160 100 160 C138 160 170 176 172 206 Z', '#271e3c', '#0e0a18') + P('M56 176 L72 136 L92 166 Z M144 176 L128 136 L108 166 Z', '#3c2e5e', '#9a7ae8', 1.6) +
        '<circle cx="100" cy="176" r="6" fill="#b58cff" stroke="#e8dcff" stroke-width="1.6"/>' + `<g transform="translate(152 188)" opacity=".8">${P('M-7 -8 h14 v16 a3 3 0 0 1 -3 3 h-8 a3 3 0 0 1 -3 -3 Z', '#4a3c66', '#1a1428', 2)}${S('M-5 -8 Q0 -15 5 -8', '#1a1428', 2)}</g>` },
    kurou: { t: 'elder', skin: '#f0e0cc', line: '#3a3040', hair: ['#eceaf0', '#c9c4d4', '#ffffff'], eye: '#5a6a9a', disc: ['#ddd2f4', '#6d57a0'], my: 5, brow: '#b8b2c4',
      back: 'M46 120 C38 70 62 40 100 40 C138 40 162 70 154 120 L156 160 C146 166 138 162 136 152 L64 152 C62 162 54 166 44 160 Z',
      front: CAP(52, 46, 148, 114) + tufts([[148, 114], [142, 90], [133, 80], [121, 74], [112, 82], [104, 70], [92, 79], [80, 72], [68, 82], [58, 96], [52, 114]]) + ' Z M110 48 C120 62 122 78 116 88 C112 76 108 62 102 50 Z',
      hl: 'M68 62 Q100 46 132 62',
      beard: h => P(beardRing('M64 120 C64 150 82 170 100 170 C118 170 136 150 136 120 C130 132 124 138 116 140 L84 140 C76 138 70 132 64 120 Z', 141), h[0], '#9a94a8', 2, ' fill-rule="evenodd"'),
      mus: h => P('M83 136 C88 128 97 129 100 132.5 C103 129 112 128 117 136 C110 140 104 139 100 136 C96 139 90 140 83 136 Z', h[0], '#9a94a8', 1.6),
      glass: () => [80, 120].map(x => `<circle cx="${x}" cy="113" r="11.5" fill="#fff" fill-opacity=".12" stroke="#6a5a4a" stroke-width="2.6"/>`).join('') + S('M91.5 111 Q100 108 108.5 111', '#6a5a4a', 2.6),
      body: () => P(TORSO, '#4a5068', '#1e2230') + P('M84 165 L100 184 L116 165 Z', '#353a4e', '#1e2230', 1.6) +
        `<g transform="translate(152 186)"><circle r="16" fill="#b58cff" opacity=".35"/>${P('M-8 -9 h16 v17 a3 3 0 0 1 -3 3 h-10 a3 3 0 0 1 -3 -3 Z', '#c8a8ff', '#3a2a5a', 2)}${S('M-6 -9 Q0 -17 6 -9', '#3a2a5a', 2)}${P('M0 -5 q-4 5 0 9 q4 -4 0 -9z', '#fff')}</g>` },
    hoshimori: { t: 'kid', lash: 1, skin: '#443586', line: '#150d2e', hair: ['#c9b8ff', '#9a86e0', '#ffffff'], eye: '#ffd760', eyeDark: '#8a4a10', disc: ['#e8dcff', '#3b2566'], brow: '#d8ccff', bl: .3, blushC: '#ff9ed0',
      faceD: 'M44 118 C44 78 70 58 100 58 C130 58 156 78 156 118 C156 156 130 176 100 176 C70 176 44 156 44 118 Z', noBody: 1, rim: '#b89aff', sk2: '#34286c',
      behind: P('M54 120 C22 96 4 128 8 176 C22 162 34 160 50 164 C40 150 44 136 54 120 Z M146 120 C178 96 196 128 192 176 C178 162 166 160 150 164 C160 150 156 136 146 120 Z', '#3a2c70', '#150d2e') +
        S('M18 140 Q30 136 44 142 M14 158 Q28 152 44 156 M182 140 Q170 136 156 142 M186 158 Q172 152 156 156', '#6a58b0', 2.4) +
        '<ellipse cx="100" cy="40" rx="30" ry="8" fill="none" stroke="#ffe38a" stroke-width="3.4" opacity=".9"/>' +
        P('M100 62 C92 44 96 28 104 20 C110 34 108 50 100 62 Z M92 64 C80 52 72 50 64 52 C70 60 80 66 92 64 Z M108 64 C120 52 128 50 136 52 C130 60 120 66 108 64 Z', '#c9b8ff', '#150d2e'),
      back: '', front: '',
      face: () => '<ellipse cx="100" cy="156" rx="30" ry="16" fill="#6a58b8" opacity=".7"/>' + [[70, 80, 3], [132, 84, 3.4], [60, 140, 2.6], [142, 144, 2.6], [86, 164, 2.4], [116, 166, 2.8]].map(([x, y, r]) => star(x, y, r * 1.4, '#ffe38a', .9)).join('') +
        P('M86 64 L90 54 L96 60 L100 50 L104 60 L110 54 L114 64 Z', '#ffe38a', '#8a6a1a', 1.4),
      mouthFn: ex => /joy|grin|surprised/.test(ex) ? P('M93 132 L107 132 L100 138 Z', '#ffcf5a', '#8a5a14', 1.6) + P('M95 140 L105 140 L100 146 Z', '#f0b040', '#8a5a14', 1.6) + '<path d="M94 134 L106 134 L104 139 L96 139Z" fill="#6a1a2a"/>'
        : P(ex === 'sad' || ex === 'worried' || ex === 'angry' ? 'M93 136 L107 136 L100 143 Z' : 'M93 133 L107 133 L100 142 Z', '#ffcf5a', '#8a5a14', 1.6) },
    shopW: { t: 'adult', skin: '#e2a57c', line: '#2a1208', hair: ['#9a4a30', '#723420', '#cc7454'], eye: '#6a4a2c', disc: ['#ecdccc', '#7a6a62'], bw: 5.4, my: 4,
      back: 'M50 112 C44 74 66 44 100 44 C134 44 156 74 150 112 Z',
      front: 'M54 108 C48 76 66 48 100 48 C134 48 152 76 146 108' + tufts([[146, 108], [140, 86], [132, 92], [126, 80], [116, 88], [108, 78], [98, 88], [88, 78], [78, 88], [70, 82], [62, 94], [54, 108]]) + ' Z',
      noHl: 1,
      face: () => '<ellipse cx="130" cy="131" rx="6" ry="3.4" fill="#5a4a44" opacity=".3"/>',
      beard: h => P(beardRing('M66 124 C66 152 84 170 100 170 C116 170 134 152 134 124 C128 134 122 139 114 140 L86 140 C78 139 72 134 66 124 Z', 139), h[0], '#2a1208', 2, ' fill-rule="evenodd"'),
      over: () => P('M54 86 C68 64 132 64 146 86 L146 95 C132 75 68 75 54 95 Z', '#4a4a56', '#1a1a22') + P('M146 88 l12 -4 l-2 12 z', '#4a4a56', '#1a1a22', 1.6),
      body: () => P('M34 204 C36 178 62 163 100 163 C138 163 164 178 166 204 Z', '#6a6a76', '#2a2a32') + P('M62 204 L66 172 L134 172 L138 204 Z', '#7a4a2a', '#3a2010') +
        S('M148 204 L172 164', '#6a4a2e', 6) + P('M160 150 L186 164 L180 174 L154 160 Z', '#9aa0a8', '#3a3a44', 2) },
    shopI: { t: 'adult', lash: 1, skin: '#f6d2b0', line: '#2a1a14', hair: ['#34302e', '#1e1a18', '#6a6460'], eye: '#3a8050', disc: ['#dcf2dc', '#5a9a6a'],
      back: 'M46 118 C38 72 62 42 100 42 C138 42 162 72 154 118 C156 136 148 146 138 142 L62 142 C52 146 44 136 46 118 Z',
      front: CAP(50, 46, 150, 118) + tufts([[150, 118], [146, 96], [139, 101], [134, 80], [122, 94], [112, 78], [100, 92], [90, 78], [78, 92], [68, 82], [60, 100], [54, 104], [50, 118]]) + ' Z',
      noHl: 1,
      over: () => P('M54 82 C54 46 76 34 100 34 C124 34 146 46 146 82 C126 70 74 70 54 82 Z', '#f2e2a8', '#9a8a50') + `<g fill="#7ab87a">${[[78, 56], [98, 46], [118, 54], [88, 68], [110, 66], [132, 70], [66, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g>` +
        P('M54 76 C44 76 38 84 38 94 C46 92 52 88 56 82 Z', '#f2e2a8', '#9a8a50', 1.8),
      body: () => P(TORSO, '#4f8a62', '#1e3a26') + P('M62 204 L66 175 L134 175 L138 204 Z', '#fbf4e4', '#b8a888') + S('M72 176 L78 166 M128 176 L122 166', '#fbf4e4', 3) +
        '<circle cx="150" cy="190" r="10" fill="#e85050" stroke="#7a1a1a" stroke-width="2"/><path d="M150 180 q2 -5 6 -6" stroke="#5a3a1a" stroke-width="2" fill="none"/><circle cx="166" cy="194" r="9" fill="#f5a040" stroke="#8a4a10" stroke-width="2"/>' },
  };

  // ---------------- expressions ----------------
  const LID = { smile: [3, -27, -5], neutral: [3, -26, -5], grin: [3, -27, -5], sad: [-10, -18, -2], worried: [-8, -21, -2], angry: [-2, -13, -14], determined: [-1, -22, -10],
    smirk: [-5, -11, -5], surprised: [3, -35, 0], melan: [-6, -12, -4] };
  const LOW = { smile: [14, 8, 14], grin: [8, -3, 8], angry: [12, 6, 12], determined: [13, 7, 13], smirk: [12, 6, 12], melan: [13, 8, 13] };
  const BR = { smile: [0, 1, -3], neutral: [0, 0, -2], grin: [-1, 0, -3], joy: [-3, -2, -3], sad: [-6, 3, -1], worried: [-5, 2, -1], angry: [5, -4, 0], determined: [4, -3, -1],
    surprised: [-8, -6, -3], smirk: [0, 0, -2], closed: [1, 1, -1], melan: [-3, 2, -1] };

  function eyes(c, T, ex, id, skin) {
    const line = mix(c.line, '#140a08', .3); const { dx, cy, lw } = T; let { rx, ry } = T; const out = [];
    const lx = c.lidMap && c.lidMap[ex] || ex;
    if (lx === 'joy' || lx === 'closed') {
      for (const s of [-1, 1]) { const x = 100 + s * dx;
        out.push(lx === 'joy' ? S(`M${x - rx} ${cy + 3} Q${x} ${r1(cy - ry * 1.25)} ${x + rx} ${cy + 3}`, line, lw + .4) : S(`M${x - rx} ${cy - 1} Q${x} ${r1(cy + ry * .95)} ${x + rx} ${cy - 1}`, line, lw));
        if (c.lash) out.push(S(lx === 'joy' ? `M${x + s * rx} ${cy + 3} l${s * 4} 1` : `M${x + s * rx} ${cy - 1} l${s * 4} -2`, line, 2)); }
      return out.join('');
    }
    const sur = lx === 'surprised'; if (sur) { ry *= 1.1; rx *= 1.04; }
    const k = ry / 13.5 * 1.25, u = LID[lx] || LID.smile, lo = LOW[lx];
    const irx = T.bean ? rx : sur ? rx * .42 : rx * .66, iry = T.bean ? ry : sur ? ry * .5 : ry * 1.02;
    const def = `<clipPath id="${id}c"><ellipse rx="${rx}" ry="${ry}"/></clipPath>`;
    out.push(`<defs>${def}<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.eyeDark || mix(c.eye, '#10081a', .55)}"/><stop offset=".55" stop-color="${c.eye}"/><stop offset="1" stop-color="${mix(c.eye, '#ffffff', .45)}"/></linearGradient></defs>`);
    const pup = mix(c.eye, '#0c0610', .78);
    for (const s of [-1, 1]) {
      const x = 100 + s * dx; const yi = r1(u[0] * k), yc = r1(u[1] * k), yo = r1(u[2] * k), E = rx + 1;
      let g = `<g transform="translate(${x} ${cy}) scale(${s} 1)"><g clip-path="url(#${id}c)">`;
      g += `<ellipse rx="${rx}" ry="${ry}" fill="#fffdf8"/>`;
      const icy = T.bean ? 0 : r1(ry * .1);
      g += `<ellipse cy="${icy}" rx="${r1(irx)}" ry="${r1(iry)}" fill="url(#${id}g)" stroke="${mix(c.eye, '#10081a', .6)}" stroke-width="1.1"/>`;
      g += `<ellipse cy="${r1(icy + iry * .08)}" rx="${r1(irx * .46)}" ry="${r1(iry * .5)}" fill="${pup}"/>`;
      g += `<circle cx="${r1(s * irx * .3)}" cy="${r1(icy - iry * .3)}" r="${r1(sur ? 1.4 : 2)}" fill="#fff"/>`;
      if (lx === 'sad') g += S(`M${r1(-irx * .6)} ${r1(icy + iry * .62)} Q0 ${r1(icy + iry * .95)} ${r1(irx * .6)} ${r1(icy + iry * .62)}`, '#fff', 1.4, ' opacity=".85"');
      g += `<path d="M${-E - 3} ${r1(-ry - 12)} L${-E - 3} ${yi} L${-E} ${yi} Q0 ${yc} ${E} ${yo} L${E + 3} ${yo} L${E + 3} ${r1(-ry - 12)} Z" fill="${skin}"/>`;
      if (lo) g += `<path d="M${-E - 3} ${r1(ry + 12)} L${-E - 3} ${r1(lo[0] * k)} L${-E} ${r1(lo[0] * k)} Q0 ${r1(lo[1] * k)} ${E} ${r1(lo[2] * k)} L${E + 3} ${r1(lo[2] * k)} L${E + 3} ${r1(ry + 12)} Z" fill="${skin}"/>`;
      g += `</g>`;
      g += S(`M${-E} ${yi} Q0 ${yc} ${E} ${yo}`, line, lw);
      g += P(`M${E - 3} ${yo - 1.5} L${E + (c.lash ? 6 : 3.5)} ${yo - (c.lash ? 5 : 2.5)} L${E} ${yo + 2} Z`, line, line, 1.4) + (c.lash > 1 ? S(`M${E - 4} ${yo - 3} q3 -3 4 -8`, line, 2) : '');
      if (lo && (lx === 'grin' || lx === 'angry')) g += S(`M${-E + 2} ${r1(lo[0] * k)} Q0 ${r1(lo[1] * k)} ${E - 2} ${r1(lo[2] * k)}`, line, 1.6, ' opacity=".6"');
      else if (!T.bean) g += S(`M${r1(-rx * .2)} ${r1(ry * .98)} Q${r1(rx * .6)} ${r1(ry * .95)} ${r1(rx * 1.02)} ${r1(ry * .2)}`, line, 1.6, ' opacity=".8"');
      out.push(g + '</g>');
    }
    return out.join('');
  }
  function brows(c, T, ex) {
    const col = c.brow || mix(c.hair[0], c.line, .5); const w = c.bw || T.bw; const out = [];
    const b = BR[(c.lidMap && c.lidMap[ex]) || ex] || BR.smile;
    for (const s of [-1, 1]) {
      const cx = 100 + s * T.dx, by = T.cy - T.ry - (T.bean ? 10 : 8) + (c.sharp ? 1 : 0); const lift = ex === 'smirk' && s > 0 ? -4 : 0;
      const ix = cx - s * 9, iy = by + b[0] * 1.35 + lift + 1, ox = cx + s * 11, oy = by + b[1] * 1.35 + lift - 1.5 + (c.sharp ? -1.5 : 0), my = by + (b[0] + b[1]) * .675 + b[2] * .6 + lift - 1;
      out.push(S(`M${ox} ${r1(oy)} Q${cx} ${r1(2 * my - (iy + oy) / 2)} ${ix} ${r1(iy)}`, col, w));
    }
    return out.join('');
  }
  function mouth(c, ex, my) {
    const d = mix(c.line, '#6a1a18', .25), t = '#e0706a', y = 136 + my, M = (s) => s.replace(/Y(-?[\d.]+)/g, (_, n) => r1(y + +n));
    switch (ex) {
      case 'joy': return P(M('M89 Y-4 Q100 Y14 111 Y-4 Q100 Y-1 89 Y-4 Z'), d, d, 1.6) + P(M('M94 Y5 Q100 Y11 106 Y5 Q100 Y2 94 Y5 Z'), t);
      case 'grin': return P(M('M88 Y-4 Q100 Y12 112 Y-4 Q100 Y-1 88 Y-4 Z'), d, d, 1.6) + P(M('M90 Y-3.4 Q100 Y-0.4 110 Y-3.4 L109 Y-1 Q100 Y1.6 91 Y-1 Z'), '#fff') + P(M('M95 Y5 Q100 Y9 105 Y5 Q100 Y3 95 Y5 Z'), t);
      case 'sad': return S(M('M93 Y4 Q100 Y-3 107 Y4'), d, 2.6);
      case 'worried': return S(M('M91 Y2 Q94.5 Y-2 98 Y1 Q101.5 Y4 105 Y1 Q107 Y-1 109 Y1'), d, 2.3);
      case 'angry': return P(M('M92 Y3 Q100 Y-5 108 Y3 Q100 Y5 92 Y3 Z'), d, d, 1.8);
      case 'surprised': return `<ellipse cx="100" cy="${y + 2}" rx="4.8" ry="6" fill="${d}"/><ellipse cx="100" cy="${y + 5}" rx="3" ry="2" fill="${t}"/>`;
      case 'determined': return S(M('M91 Y-1 Q100 Y5 109 Y-2'), d, 2.8) + S(M('M109 Y-2 l2 -1.5'), d, 2);
      case 'smirk': return S(M('M92 Y1 Q102 Y4 109 Y-4'), d, 2.6);
      case 'neutral': return S(M('M94 Y0 Q100 Y2.5 106 Y0'), d, 2.4);
      case 'closed': return S(M('M95 Y1 Q100 Y3 105 Y1'), d, 2.2);
      case 'soft': return S(M('M94 Y0 Q100 Y4 106 Y0'), d, 2.4);
      default: return P(M('M92 Y-3 Q100 Y9 108 Y-3 Q100 Y-1 92 Y-3 Z'), d, d, 1.6) + P(M('M95.5 Y3.5 Q100 Y7.5 104.5 Y3.5 Q100 Y1.8 95.5 Y3.5 Z'), t);
    }
  }
  function fx(c, T, ex, who) {
    const L = c.line;
    switch (ex) {
      case 'sad': { const x = 100 - T.dx - T.rx + 1, y = T.cy + T.ry * .55; return P(`M${x} ${y} C${x - 3.5} ${y + 6} ${x - 3.5} ${y + 11} ${x} ${y + 11} C${x + 3.5} ${y + 11} ${x + 3.5} ${y + 6} ${x} ${y} Z`, '#a8e0ff', '#4a8ac0', 1.4) + `<circle cx="${x - 1}" cy="${y + 7.5}" r="1.3" fill="#fff"/>`; }
      case 'worried': return P('M152 86 C147 94 146 100 152 102 C158 100 157 94 152 86 Z', '#bfe8ff', '#4a8ac0', 1.6) + '<circle cx="150.5" cy="97" r="1.5" fill="#fff"/>';
      case 'angry': return who === 'yomi' ? '' : `<g transform="translate(146 64)">${S('M-8 -2.5 Q-2.5 -2.5 -2.5 -8 M2.5 -8 Q2.5 -2.5 8 -2.5 M8 2.5 Q2.5 2.5 2.5 8 M-2.5 8 Q-2.5 2.5 -8 2.5', '#ff4a55', 3.4)}</g>`;
      case 'surprised': return S('M150 50 l6 -9 M160 62 l10 -4 M140 42 l1 -10', '#fff6c8', 3.4) + S('M150 50 l6 -9 M160 62 l10 -4 M140 42 l1 -10', L, 1, ' opacity=".35"');
      case 'joy': return star(156, 70, 8, '#fff3a0') + star(46, 80, 6, '#fff3a0') + star(162, 90, 4, '#ffffff', .9);
      case 'grin': return star(156, 72, 7, '#fff3a0');
      case 'determined': return star(146, 60, 5, '#fff3a0', .9);
    }
    return '';
  }

  function draw(who, ex) {
    const c0 = C[who]; const c = Object.assign({}, c0, { line: mix(c0.line, '#0a0706', .6) }); const T = Object.assign({}, TYPES[c.t]); const I = 'af' + (++uid);
    const h = c.hair, line = c.line, skin = c.skin, sk2 = c.sk2 || mix(skin, '#b0504a', .26), my = c.my || 0;
    const HT = c.noBody ? '' : ' transform="translate(100 66) scale(.84) translate(-100 -66)"';
    const faceD = c.faceD || FACE; const bl = c.bl != null ? c.bl : T.bl;
    let s = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="${I}d" cx="50%" cy="40%" r="62%"><stop offset="0" stop-color="${c.disc[0]}"/><stop offset="1" stop-color="${c.disc[1]}"/></radialGradient>` +
      `<clipPath id="${I}o"><circle cx="100" cy="100" r="98"/></clipPath><clipPath id="${I}f"><path d="${faceD}"/></clipPath>` +
      (c.back ? `<clipPath id="${I}b"><path d="${c.back}"/></clipPath>` : '') + (c.front ? `<path id="${I}h" d="${c.front}"/><clipPath id="${I}k"><use href="#${I}h"/></clipPath>` : '') + `</defs>`;
    s += `<circle cx="100" cy="100" r="98" fill="url(#${I}d)"/><circle cx="100" cy="100" r="92" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>` +
      `<circle cx="36" cy="58" r="3" fill="#fff" opacity=".5"/><circle cx="166" cy="140" r="2.4" fill="#fff" opacity=".45"/><circle cx="160" cy="44" r="2" fill="#fff" opacity=".5"/>`;
    s += `<g clip-path="url(#${I}o)"><g${HT}>`;
    if (c.behind) s += c.behind;
    if (c.back) s += `<g clip-path="url(#${I}b)">` + P(c.back, h[1], 0) + `<path d="${c.back}" transform="translate(4 -3)" fill="${mix(h[1], h[0], .55)}"/></g>` + P(c.back, 'none', line, 3.4);
    s += '</g>';
    if (!c.noBody) {
      s += P('M87 118 L86 158 L114 158 L113 118 Z', skin, line, 2.8) + P('M87 124 L113 124 L113 140 L100 150 L87 136 Z', sk2);
      s += `<g transform="translate(100 150) scale(1.42 1.25) translate(-100 -159)">${c.body(h)}<clipPath id="${I}t"><path d="${TORSO}"/></clipPath><path d="M20 150 L76 150 C66 166 62 184 64 210 L20 210 Z" fill="#0a0612" opacity=".2" clip-path="url(#${I}t)"/></g>`;
    }
    s += `<g${HT}>`;
    if (!c.noBody) s += `<ellipse cx="57" cy="112" rx="5.5" ry="9" fill="${skin}" stroke="${line}" stroke-width="2.8"/><ellipse cx="143" cy="112" rx="5.5" ry="9" fill="${skin}" stroke="${line}" stroke-width="2.8"/>`;
    // face: crisp cel shadow on the left + hard shadow under hair
    s += `<g clip-path="url(#${I}f)"><rect width="200" height="200" fill="${sk2}"/><path d="${faceD}" transform="translate(6 -3)" fill="${skin}"/>`;
    if (c.front || c.sh) s += c.sh ? P(c.sh, sk2, 0, 0, ' transform="translate(0 8)"') : `<use href="#${I}h" transform="translate(-2 7)" fill="${sk2}"/>`;
    s += `</g><path d="${faceD}" fill="none" stroke="${line}" stroke-width="3.4"/>`;
    if (c.face) s += c.face(sk2);
    if (c.freckles) s += `<g fill="#b86b46" opacity=".55">${[[71, 124], [76, 128], [67, 129], [129, 124], [124, 128], [133, 129]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3"/>`).join('')}</g>`;
    // blush
    const bc = c.blushC || '#ff8a96', bo = Math.min(.8, bl * (ex === 'joy' || ex === 'grin' || ex === 'angry' ? 1.35 : ex === 'sad' ? .8 : 1));
    if (bo > 0) s += `<ellipse cx="${100 - T.dx - 4}" cy="${T.cy + 15}" rx="9" ry="5" fill="${bc}" opacity="${r1(bo * 100) / 100}"/><ellipse cx="${100 + T.dx + 4}" cy="${T.cy + 15}" rx="9" ry="5" fill="${bc}" opacity="${r1(bo * 100) / 100}"/>`;
    if (c.beard) s += c.beard(h);
    s += eyes(c, T, ex, I + 'e', skin);
    if (!c.faceD) s += P('M101 114 L96 126 L102 126 Z', sk2) + S('M96 126 L101.5 126.5', line, 2);
    s += c.mouthFn ? c.mouthFn(ex) : mouth(c, c.mouthMap && c.mouthMap[ex] || ex, my);
    if (c.mus) s += c.mus(h);
    if (c.glass) s += c.glass();
    if (c.front) {
      s += `<g clip-path="url(#${I}k)"><rect width="200" height="200" fill="${h[1]}"/><use href="#${I}h" transform="translate(4 -4)" fill="${h[0]}"/>`;
      if (c.strands) s += S(c.strands, h[1], 2.2);
      if (!c.noHl) s += S(c.hl || 'M62 72 Q100 48 138 72', h[2], 4.5, ' stroke-dasharray="3 9 12 7 5 200" opacity=".95"');
      s += `</g><use href="#${I}h" fill="none" stroke="${line}" stroke-width="3.4" stroke-linejoin="round"/>`;
    }
    s += brows(c, T, ex);
    if (c.over) s += c.over(h);
    s += fx(c, T, ex, who);
    return s + '</g></g></svg>';
  }

  Art.portrait = function (who, expr = 'smile') {
    if (!C[who]) return base(who, expr);
    return draw(who, EXPR.has(expr) ? expr : 'smile');
  };
  Art.faceKeys = Object.keys(C);
})();
