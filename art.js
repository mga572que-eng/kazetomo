// 風灯の島 — original character portraits & monster art (SVG, drawn in code)
'use strict';
const Art = (() => {
  let uid = 0;
  const id = p => p + (++uid);

  // ---------- portraits ----------
  const FACE = 'M66 92 C66 128 84 150 100 152 C116 150 134 128 134 92 C134 62 118 50 100 50 C82 50 66 62 66 92 Z';
  const FACES = { round: 'M64 94 C64 132 82 150 100 150 C118 150 136 132 136 94 C136 62 118 50 100 50 C82 50 64 62 64 94 Z',
    sharp: 'M67 90 C67 120 88 150 100 156 C112 150 133 120 133 90 C133 60 118 48 100 48 C82 48 67 60 67 90 Z',
    square: 'M63 90 L64 128 C70 146 86 152 100 152 C114 152 130 146 136 128 L137 90 C137 60 118 48 100 48 C82 48 63 60 63 90 Z',
    long: 'M68 88 C68 128 86 160 100 162 C114 160 132 128 132 88 C132 58 118 44 100 44 C82 44 68 58 68 88 Z',
    chubby: 'M62 96 C60 134 82 152 100 152 C118 152 140 134 138 96 C138 62 118 50 100 50 C82 50 62 62 62 96 Z' };
  const P = {
    sora: { skin: '#f6d7bd', hair: '#5a3a22', hairHi: '#8a5a35', eye: '#3f7fc4', eyeShape: 'round', brow: 'soft',
      back: 'M60 100 C52 60 70 34 100 32 C132 32 150 58 140 100 C136 80 130 70 124 66 L76 66 C70 72 64 82 60 100 Z',
      front: ['M62 96 C60 60 78 40 100 38 C124 38 142 56 138 96 L132 76 L126 88 L120 68 L112 82 L104 62 L96 80 L88 62 L82 84 L74 70 L68 88 Z',
        'M72 54 L64 30 L86 44 L92 18 L104 40 L117 20 L119 44 L138 34 L128 58 Z'],
      body: (c) => `<path d="M34 200 C38 170 66 158 88 156 L112 156 C134 158 162 170 166 200 Z" fill="#3f6fa8"/>
        <path d="M82 156 C88 170 112 170 118 156 L126 160 C118 180 82 180 74 160 Z" fill="#e3a23a"/>
        <path d="M118 162 C130 172 136 186 132 200 L120 200 C124 186 120 174 112 166 Z" fill="#d38f2c"/>
        <path d="M58 176 L64 200" stroke="#2e5484" stroke-width="3"/>` },
    mio: { skin: '#f9dcc6', hair: '#c96f4a', hairHi: '#eea27c', eye: '#2f9a7d', eyeShape: 'round', brow: 'soft', lash: true,
      back: 'M58 100 C50 56 72 30 100 30 C128 30 150 56 142 100 L152 180 C140 192 126 188 120 168 L80 168 C74 188 60 192 48 180 Z',
      front: ['M62 100 C58 56 80 40 100 40 C124 40 142 58 138 100 C134 84 128 74 118 68 C112 80 104 84 94 80 C98 74 100 68 98 62 C88 76 76 82 66 84 C64 90 63 95 62 100 Z',
        'M64 92 C60 120 62 140 68 158 C74 140 75 118 72 96 Z', 'M136 92 C140 120 138 140 132 158 C126 140 125 118 128 96 Z'],
      extra: `<g transform="translate(128 58)"><circle r="5" cx="0" cy="-6" fill="#fff"/><circle r="5" cx="6" cy="0" fill="#fff"/><circle r="5" cx="0" cy="6" fill="#fff"/><circle r="5" cx="-6" cy="0" fill="#fff"/><circle r="3.5" fill="#f2b84b"/></g>`,
      body: () => `<path d="M36 200 C40 172 66 160 88 158 L112 158 C134 160 160 172 164 200 Z" fill="#fbf7ef"/>
        <path d="M50 200 C52 180 66 168 84 164 L92 200 Z M150 200 C148 180 134 168 116 164 L108 200 Z" fill="#3c9a8f"/>
        <path d="M92 158 L100 172 L108 158" fill="none" stroke="#e39a7a" stroke-width="3" stroke-linejoin="round"/>` },
    riku: { skin: '#e9c2a0', hair: '#2d3a4a', hairHi: '#50657d', eye: '#c98a2c', eyeShape: 'sharp', brow: 'sharp',
      back: 'M60 98 C54 58 72 36 100 34 C130 34 148 58 140 98 Z',
      front: ['M62 94 C58 54 84 38 106 38 C132 40 146 60 138 96 L132 74 L124 90 L118 70 L108 86 L102 66 L92 84 L86 62 L76 80 L70 60 Z',
        'M72 62 C82 82 86 100 84 114 C78 102 72 94 66 92 Z'],
      extra: `<path d="M64 70 C80 62 120 62 136 70 L136 79 C120 71 80 71 64 79 Z" fill="#b23a35"/><path d="M134 72 L152 80 L146 86 L136 78 Z M134 76 L150 94 L142 96 L134 80 Z" fill="#9b2f2b"/>
        <path d="M118 128 L126 122" stroke="#c4917a" stroke-width="2" stroke-linecap="round"/>`,
      body: () => `<path d="M34 200 C38 170 66 158 88 156 L112 156 C134 158 162 170 166 200 Z" fill="#5b4636"/>
        <path d="M34 200 C36 178 50 166 70 162 L80 176 L60 200 Z" fill="#7a8a96"/><path d="M88 156 L100 176 L112 156" fill="#3f3027"/>
        <path d="M120 164 L170 120" stroke="#a88b5e" stroke-width="5"/><path d="M166 112 L178 106 L172 120 Z" fill="#c9ced6"/>` },
    kaito: { skin: '#e3b894', hair: '#3b2a1e', hairHi: '#634631', eye: '#3a6a8a', eyeShape: 'adult', brow: 'thick', age: 'adult',
      back: 'M62 96 C58 58 76 40 100 40 C126 40 142 58 138 96 C134 76 126 66 100 64 C76 66 66 76 62 96 Z',
      front: ['M64 90 C64 60 82 46 102 46 C124 46 138 60 136 88 C128 72 118 64 104 66 C96 70 84 72 72 74 C68 78 66 84 64 90 Z'],
      extra: `<path d="M74 122 C78 142 92 150 100 150 C108 150 122 142 126 122 C122 136 110 142 100 142 C90 142 78 136 74 122 Z" fill="#3b2a1e" opacity=".35"/>`,
      body: () => `<path d="M32 200 C36 170 66 156 88 154 L112 154 C134 156 164 170 168 200 Z" fill="#2e4a6b"/>
        <path d="M84 154 L100 182 L116 154 L124 158 L100 196 L76 158 Z" fill="#23394f"/><circle cx="100" cy="186" r="3" fill="#d8b24a"/><circle cx="100" cy="198" r="3" fill="#d8b24a"/>
        <path d="M60 170 L72 164" stroke="#d8b24a" stroke-width="3"/>` },
    yui: { skin: '#f5d6c0', hair: '#6b4430', hairHi: '#946447', eye: '#7a5a3a', eyeShape: 'soft', brow: 'soft', lash: true, age: 'adult',
      back: 'M60 100 C54 58 74 38 100 38 C128 38 146 58 140 100 L140 120 L60 120 Z',
      front: ['M62 98 C60 60 80 44 100 44 C120 44 140 60 138 98 C132 74 118 60 100 58 C82 60 68 74 62 98 Z',
        'M132 96 C150 116 152 146 142 176 C134 170 130 150 132 130 C130 118 128 106 132 96 Z'],
      extra: `<g fill="#5a3827"><circle cx="140" cy="140" r="3"/><circle cx="143" cy="152" r="3"/><circle cx="142" cy="164" r="3"/></g><circle cx="141" cy="178" r="4" fill="#7f9c6e"/>`,
      body: () => `<path d="M36 200 C40 172 66 160 88 158 L112 158 C134 160 160 172 164 200 Z" fill="#7f9c6e"/>
        <path d="M70 200 L74 172 C86 176 114 176 126 172 L130 200 Z" fill="#f4ecdb"/><path d="M88 158 C92 166 108 166 112 158" fill="none" stroke="#f4ecdb" stroke-width="3"/>` },
    gen: { skin: '#d9a77f', hair: '#3a3632', hairHi: '#5b5650', eye: '#4d3b2c', eyeShape: 'adult', brow: 'thick', age: 'adult', wide: 1.08,
      back: 'M64 90 C62 60 78 46 100 46 C122 46 138 60 136 90 C130 70 118 62 100 62 C82 62 70 70 64 90 Z',
      front: [],
      extra: `<path d="M64 76 C74 64 126 64 136 76 L136 86 C124 74 76 74 64 86 Z" fill="#eee8dc"/><path d="M134 78 L150 72 L146 84 Z M134 82 L148 92 L138 92 Z" fill="#ddd5c6"/>
        <path d="M70 116 C72 150 90 162 100 162 C110 162 128 150 130 116 C122 132 112 138 100 138 C88 138 78 132 70 116 Z" fill="#3a3632"/>
        <path d="M86 132 C92 128 108 128 114 132 C108 136 92 136 86 132 Z" fill="#3a3632"/>`,
      body: () => `<path d="M28 200 C32 168 64 154 88 152 L112 152 C136 154 168 168 172 200 Z" fill="#efe8da"/>
        <path d="M44 200 C46 180 60 166 80 160 L86 200 Z M156 200 C154 180 140 166 120 160 L114 200 Z" fill="#8a5a34"/>` },
    nagi: { skin: '#f1c9a8', hair: '#a0522d', hairHi: '#c8764b', eye: '#6a8a3a', eyeShape: 'soft', brow: 'soft', lash: true, age: 'adult', freckles: true,
      back: 'M60 104 C52 60 74 38 100 38 C128 38 150 60 140 104 C146 120 138 134 128 132 C132 118 130 110 128 104 L72 104 C70 110 68 118 72 132 C62 134 54 120 60 104 Z',
      front: ['M64 90 C70 76 80 78 86 72 C92 78 100 74 106 72 C112 78 122 74 128 76 C132 80 136 84 136 90 C132 82 120 80 100 80 C82 80 70 82 64 90 Z'],
      extra: `<path d="M60 78 C62 46 80 34 100 34 C122 34 138 46 140 78 C120 68 80 68 60 78 Z" fill="#d9534f"/>
        <g fill="#fff" opacity=".85"><circle cx="80" cy="54" r="2.4"/><circle cx="96" cy="46" r="2.4"/><circle cx="112" cy="52" r="2.4"/><circle cx="126" cy="62" r="2.4"/><circle cx="88" cy="66" r="2.4"/><circle cx="104" cy="62" r="2.4"/></g>
        <path d="M136 70 L152 62 L150 74 Z M136 72 L150 84 L140 84 Z" fill="#c24440"/><circle cx="66" cy="112" r="3" fill="#f2c14e"/><circle cx="134" cy="112" r="3" fill="#f2c14e"/>`,
      body: () => `<path d="M34 200 C38 172 66 160 88 158 L112 158 C134 160 162 172 166 200 Z" fill="#e08a3c"/>
        <path d="M72 200 L76 170 C88 176 112 176 124 170 L128 200 Z" fill="#fbf6ec"/>` },
    yomi: { skin: '#dcd6ea', hair: '#b9b3d4', hairHi: '#e6e2f4', eye: '#ffd36a', eyeShape: 'sharp', brow: 'sharp', glow: true,
      back: 'M54 104 C44 54 72 28 100 28 C130 28 156 54 146 104 L164 200 L36 200 Z',
      front: ['M62 98 C58 58 80 40 100 40 C122 40 142 58 138 98 C134 80 126 68 116 62 C112 76 106 86 100 90 C96 80 92 70 86 62 C76 70 68 82 62 98 Z'],
      extra: `<path d="M66 50 L58 14 L78 38 L84 6 L96 34 L100 0 L104 34 L116 6 L122 38 L142 14 L134 50 C120 40 80 40 66 50 Z" fill="#241c33" stroke="#8b6cd8" stroke-width="1.5"/>
        <circle cx="100" cy="30" r="4" fill="#8b6cd8"/>`,
      aura: true,
      body: () => `<path d="M26 200 C30 166 62 150 86 148 L114 148 C138 150 170 166 174 200 Z" fill="#1c1726"/>
        <path d="M62 150 L82 118 L96 150 Z M138 150 L118 118 L104 150 Z" fill="#2b2240"/><path d="M92 150 L100 170 L108 150" fill="#8b6cd8"/>` },
    kurou: { skin: '#e8dccb', hair: '#e7e3ea', hairHi: '#ffffff', eye: '#6f7fa6', eyeShape: 'adult', brow: 'soft', age: 'elder',
      back: 'M58 100 C50 58 74 34 100 34 C128 34 150 58 142 100 L150 170 L50 170 Z',
      front: ['M62 96 C60 60 80 44 100 44 C120 44 140 60 138 96 C132 76 120 64 100 62 C82 64 68 76 62 96 Z'],
      extra: `<path d="M76 124 C80 150 92 162 100 162 C108 162 120 150 124 124 C116 136 108 140 100 140 C92 140 84 136 76 124 Z" fill="#e7e3ea"/>`,
      body: () => `<path d="M30 200 C34 168 64 154 88 152 L112 152 C136 154 166 168 170 200 Z" fill="#454a5e"/><path d="M84 152 L100 176 L116 152" fill="#353a4c"/>` },
    sana: { skin: '#f1d3bd', hair: '#2d3a4a', hairHi: '#55698a', eye: '#6a7fd8', eyeShape: 'soft', brow: 'soft', lash: true,
      back: 'M58 100 C50 56 72 32 100 32 C128 32 150 56 142 100 L146 150 C136 160 124 156 120 140 L80 140 C76 156 64 160 54 150 Z',
      front: ['M132 58 C170 70 178 130 162 188 C150 170 146 130 136 96 Z', 'M62 98 C58 58 80 42 100 42 C122 42 142 58 138 98 C134 80 126 70 114 66 C108 76 100 80 90 80 C94 74 96 68 94 64 C84 74 72 80 66 84 Z',
        'M64 92 C60 118 62 136 68 150 C73 134 74 116 71 96 Z'],
      extra: `<path d="M72 50 l4 9 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1 z" fill="#f3c15a" stroke="#fff3c4" stroke-width="1"/><path d="M78 72 L70 92 M82 72 L84 94" stroke="#6a7fd8" stroke-width="2.5"/>`,
      body: () => `<path d="M36 200 C40 172 66 160 88 158 L112 158 C134 160 160 172 164 200 Z" fill="#f7f4ee"/>
        <path d="M86 158 L100 188 L114 158 L120 160 L100 200 L80 160 Z" fill="#2f3f7a"/><path d="M40 200 C44 184 56 174 70 168 L66 200 Z M160 200 C156 184 144 174 130 168 L134 200 Z" fill="#2f3f7a"/>` },
    tsumugi: { skin: '#fadfca', hair: '#8fbf6a', hairHi: '#c4e8a0', eye: '#8a5a2a', eyeShape: 'round', brow: 'soft',
      back: 'M60 100 C54 58 74 38 100 38 C126 38 146 58 140 100 Z',
      front: ['M64 72 C36 82 30 132 42 164 C52 144 58 112 68 90 Z', 'M136 72 C164 82 170 132 158 164 C148 144 142 112 132 90 Z',
        'M62 96 C60 58 80 42 100 42 C120 42 140 58 138 96 L132 84 L124 90 L118 80 L110 88 L100 78 L90 88 L82 80 L76 90 L68 84 Z'],
      extra: `<circle cx="66" cy="72" r="5" fill="#ff9ec4"/><circle cx="134" cy="72" r="5" fill="#ff9ec4"/>
        <circle cx="83" cy="103" r="14" fill="#fff" fill-opacity=".12" stroke="#5a4a3a" stroke-width="3"/><circle cx="117" cy="103" r="14" fill="#fff" fill-opacity=".12" stroke="#5a4a3a" stroke-width="3"/><path d="M97 102 L103 102" stroke="#5a4a3a" stroke-width="3"/>`,
      body: () => `<path d="M34 200 C38 170 66 158 88 156 L112 156 C134 158 162 170 166 200 Z" fill="#fbfbf6"/>
        <path d="M88 156 L100 184 L112 156 Z" fill="#6aa84f"/><path d="M84 156 L94 200 M116 156 L106 200" stroke="#dcdcd2" stroke-width="3"/><rect x="120" y="176" width="16" height="12" rx="2" fill="#e8e0c8"/>` },
    baldo: { skin: '#d99a6c', hair: '#eeeae2', hairHi: '#ffffff', eye: '#3a5a7a', eyeShape: 'adult', brow: 'thick', age: 'adult', wide: 1.06,
      back: 'M64 98 C60 72 70 58 100 56 C130 58 140 72 136 98 Z',
      front: [],
      extra: `<path d="M66 110 C66 150 86 170 100 170 C114 170 134 150 134 110 C124 128 112 134 100 134 C88 134 76 128 66 110 Z" fill="#eeeae2"/>
        <path d="M82 124 C90 116 110 116 118 124 C110 130 90 130 82 124 Z" fill="#f8f6f0"/>
        <path d="M66 62 C66 30 134 30 134 62 Z" fill="#23324a"/><path d="M36 68 C70 54 130 54 164 68 C140 76 60 76 36 68 Z" fill="#1b2638"/>
        <path d="M68 58 C90 54 110 54 132 58 L132 64 C110 60 90 60 68 64 Z" fill="#d8b24a"/><path d="M100 36 L100 50 M94 44 C94 50 106 50 106 44" stroke="#d8b24a" stroke-width="2.5" fill="none"/>`,
      body: () => `<path d="M28 200 C32 168 64 154 88 152 L112 152 C136 154 168 168 172 200 Z" fill="#23324a"/>
        <path d="M84 152 L100 180 L116 152 L124 156 L100 196 L76 156 Z" fill="#1b2638"/><circle cx="100" cy="186" r="3" fill="#d8b24a"/><circle cx="92" cy="196" r="3" fill="#d8b24a"/><circle cx="108" cy="196" r="3" fill="#d8b24a"/>` },
  };

  function eyes(p, expr) {
    const out = []; const sh = p.eyeShape; const dark = '#2a1d17';
    for (const s of [-1, 1]) {
      const x = 100 + s * 17, y = 102;
      if (expr === 'joy') { out.push(`<path d="M${x - 9} ${y + 2} Q${x} ${y - 8} ${x + 9} ${y + 2}" fill="none" stroke="${dark}" stroke-width="3.2" stroke-linecap="round"/>`); continue; }
      if (expr === 'closed') { out.push(`<path d="M${x - 9} ${y} Q${x} ${y + 5} ${x + 9} ${y}" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`); continue; }
      let rx = 9, ry = 11, ir = 7, iry = 9;
      if (sh === 'sharp') { ry = 7.5; iry = 7; ir = 6; }
      if (sh === 'soft') { ry = 9.5; iry = 8.5; }
      if (sh === 'adult') { rx = 8; ry = 7.5; ir = 5.5; iry = 6.5; }
      if (p.age === 'elder') { ry = 5.5; iry = 5; ir = 5; }
      const gid = id('ir');
      out.push(`<defs><radialGradient id="${gid}" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="${p.eye}" stop-opacity="1"/><stop offset="1" stop-color="${p.glow ? '#8b5a00' : '#1d2230'}"/></radialGradient></defs>`);
      out.push(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fffdf9"/>`);
      out.push(`<ellipse cx="${x + s * .5}" cy="${y + 1}" rx="${ir}" ry="${iry}" fill="url(#${gid})"/>`);
      out.push(`<ellipse cx="${x + s * .5}" cy="${y + 1.5}" rx="${ir * .45}" ry="${iry * .5}" fill="${p.glow ? '#fff3c4' : '#120e10'}"/>`);
      if (!p.glow) { out.push(`<circle cx="${x - 2.5}" cy="${y - 3.5}" r="${ir * .36}" fill="#fff"/><circle cx="${x + 3}" cy="${y + 3.5}" r="1.3" fill="#fff" opacity=".9"/>`); }
      else out.push(`<ellipse cx="${x}" cy="${y}" rx="${rx + 4}" ry="${ry + 3}" fill="#ffd36a" opacity=".18"/>`);
      const lw = sh === 'adult' ? 2.6 : 3.4;
      const tilt = sh === 'sharp' ? (s < 0 ? 3 : -3) : 0;
      out.push(`<path d="M${x - rx - 1} ${y - ry * .45 + (s < 0 ? tilt : -tilt)} Q${x} ${y - ry - 3} ${x + rx + 1} ${y - ry * .45 - (s < 0 ? tilt : -tilt)}" fill="none" stroke="${dark}" stroke-width="${lw}" stroke-linecap="round"/>`);
      if (p.lash) out.push(`<path d="M${x + s * (rx + 1)} ${y - ry * .45} l${s * 4} -3" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>`);
      if (p.age === 'elder' || p.age === 'adult') out.push(`<path d="M${x - 6} ${y + ry + 3} Q${x} ${y + ry + 5} ${x + 6} ${y + ry + 3}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1.5"/>`);
    }
    return out.join('');
  }
  function brows(p, expr) {
    const c = p.hair; const w = p.brow === 'thick' ? 4.5 : p.brow === 'sharp' ? 3.2 : 2.6; const out = [];
    for (const s of [-1, 1]) {
      const x = 100 + s * 17; let y = 86, a = 0;
      if (expr === 'angry' || expr === 'determined') a = 4; if (expr === 'sad' || expr === 'worried') a = -4; if (expr === 'surprised') y -= 4;
      if (p.brow === 'sharp') a += 2;
      out.push(`<path d="M${x - s * 10} ${y + (s < 0 ? -a : -a) * -1 * 0} Q${x} ${y - 4} ${x + s * 9} ${y + a * .9}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" transform="rotate(${s * a * 1.4} ${x} ${y})"/>`);
    }
    return out.join('');
  }
  function mouth(expr, p) {
    const d = '#6b2f28';
    switch (expr) {
      case 'grin': case 'joy': return `<path d="M88 124 Q100 140 112 124 Z" fill="${d}"/><path d="M92 131 Q100 136 108 131 Q100 134 92 131 Z" fill="#e7837a"/>`;
      case 'sad': return `<path d="M91 130 Q100 124 109 130" fill="none" stroke="${d}" stroke-width="2.6" stroke-linecap="round"/>`;
      case 'worried': return `<path d="M93 129 Q100 126 107 129" fill="none" stroke="${d}" stroke-width="2.4" stroke-linecap="round"/>`;
      case 'angry': return `<path d="M90 130 Q100 124 110 130 Q100 128 90 130 Z" fill="${d}" stroke="${d}" stroke-width="2"/>`;
      case 'surprised': return `<ellipse cx="100" cy="129" rx="5" ry="6.5" fill="${d}"/>`;
      case 'determined': return `<path d="M91 128 L109 127" stroke="${d}" stroke-width="2.6" stroke-linecap="round"/>`;
      case 'smirk': return `<path d="M91 128 Q103 131 110 123" fill="none" stroke="${d}" stroke-width="2.6" stroke-linecap="round"/>`;
      case 'neutral': case 'closed': return `<path d="M93 128 Q100 130 107 128" fill="none" stroke="${d}" stroke-width="2.4" stroke-linecap="round"/>`;
      default: return `<path d="M90 125 Q100 134 110 125" fill="none" stroke="${d}" stroke-width="2.8" stroke-linecap="round"/>`;
    }
  }
  function portrait(who, expr = 'smile') {
    const p = P[who]; if (!p) return '';
    const shadeId = id('sh'), hairId = id('hg'), auraId = id('au');
    const wide = p.wide || 1;
    let s = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
      <linearGradient id="${hairId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.hairHi}"/><stop offset=".55" stop-color="${p.hair}"/></linearGradient>
      <radialGradient id="${auraId}" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#8b6cd8" stop-opacity=".55"/><stop offset="1" stop-color="#1c1726" stop-opacity="0"/></radialGradient>
      <linearGradient id="${shadeId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".14"/><stop offset=".35" stop-color="#000" stop-opacity="0"/></linearGradient></defs>`;
    if (p.bg) s += `<circle cx="100" cy="96" r="94" fill="${p.bg}" opacity=".28"/><circle cx="100" cy="96" r="94" fill="none" stroke="${p.bg}" stroke-opacity=".45" stroke-width="3"/>`;
    if (p.aura) s += `<circle cx="100" cy="100" r="100" fill="url(#${auraId})"/>`;
    if (p.behind) s += p.behind;
    const hl = p.line || '#2a1d17';
    s += `<path d="${p.back}" fill="url(#${hairId})" stroke="${hl}" stroke-width="2" stroke-linejoin="round"/>`;
    s += p.body(expr);
    s += `<path d="M90 136 L90 160 C96 164 104 164 110 160 L110 136 Z" fill="${p.skin}"/><path d="M90 146 C96 152 104 152 110 146 L110 138 L90 138 Z" fill="#000" opacity=".1"/>`;
    s += `<g transform="translate(100 100) scale(${wide} 1) translate(-100 -100)">`;
    s += `<ellipse cx="64" cy="102" rx="6" ry="9" fill="${p.skin}"/><ellipse cx="136" cy="102" rx="6" ry="9" fill="${p.skin}"/>`;
    const FP = FACES[p.face] || FACE;
    s += `<path d="${FP}" fill="${p.skin}" stroke="${p.skinLine || '#b07a5a'}" stroke-width="1.8"/><path d="${FP}" fill="url(#${shadeId})"/>`;
    s += `<path d="M68 96 C68 126 84 148 100 150 C90 138 83 120 84 98 C85 80 90 66 98 56 C82 60 68 74 68 96 Z" fill="#6a3a3a" opacity=".07"/>`;
    if (p.age === 'elder') s += `<path d="M76 88 Q82 86 86 88 M114 88 Q118 86 124 88 M84 132 Q86 138 90 140 M116 132 Q114 138 110 140" fill="none" stroke="#000" stroke-opacity=".13" stroke-width="1.4"/>`;
    s += `</g>`;
    s += eyes(p, expr) + brows(p, expr);
    s += `<path d="M100 110 C99 114 98 116 101 117" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.6" stroke-linecap="round"/>`;
    s += mouth(expr, p);
    if (expr !== 'angry') s += `<ellipse cx="80" cy="120" rx="7" ry="3.4" fill="#f08a8a" opacity="${p.age ? .18 : .35}"/><ellipse cx="120" cy="120" rx="7" ry="3.4" fill="#f08a8a" opacity="${p.age ? .18 : .35}"/>`;
    if (p.freckles) s += `<g fill="#b86b46" opacity=".5"><circle cx="78" cy="114" r="1.1"/><circle cx="83" cy="117" r="1.1"/><circle cx="75" cy="118" r="1.1"/><circle cx="122" cy="114" r="1.1"/><circle cx="117" cy="117" r="1.1"/><circle cx="125" cy="118" r="1.1"/></g>`;
    if (expr === 'sad' && who !== 'yomi') s += `<path d="M84 114 C82 120 84 124 86 122 C88 120 86 116 84 114 Z" fill="#9fd3f0" opacity=".85"/>`;
    for (const f of p.front) s += `<path d="${f}" fill="url(#${hairId})" stroke="${hl}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += `<path d="M76 60 C88 50 112 50 124 60" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/><path d="M134 70 C142 84 142 100 138 112" fill="none" stroke="${p.rim || '#fff6d0'}" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>`;
    if (p.extra) s += p.extra;
    return s + `</svg>`;
  }

  // ---------- monsters ----------
  function palette(shadow, normal) { return shadow ? { a: '#4a3b63', b: '#2c2340', c: '#6d57a0', eye: '#ff6fb0', glow: true } : normal; }
  function eyesM(x1, x2, y, r, pal, happy) {
    if (pal.glow) return [x1, x2].map(x => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .55}" fill="${pal.eye}"/><ellipse cx="${x}" cy="${y}" rx="${r * 1.8}" ry="${r}" fill="${pal.eye}" opacity=".25"/>`).join('');
    if (happy) return [x1, x2].map(x => `<path d="M${x - r} ${y + 1} Q${x} ${y - r * 1.2} ${x + r} ${y + 1}" fill="none" stroke="#2a1d17" stroke-width="3" stroke-linecap="round"/>`).join('');
    return [x1, x2].map(x => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.25}" fill="#241a18"/><circle cx="${x - r * .35}" cy="${y - r * .45}" r="${r * .38}" fill="#fff"/>`).join('');
  }
  const shadowAura = (cx, cy, r) => { const g = id('sa'); return `<defs><radialGradient id="${g}"><stop offset="0" stop-color="#7b4fd0" stop-opacity=".45"/><stop offset="1" stop-color="#7b4fd0" stop-opacity="0"/></radialGradient></defs><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * .9}" fill="url(#${g})"/>`; };
  const M = {
    watapoko(sh) { const p = palette(sh, { a: '#fbf7ee', b: '#e3d8c4', c: '#fff', eye: '#241a18' });
      return `${sh ? shadowAura(100, 120, 90) : ''}<ellipse cx="100" cy="186" rx="44" ry="7" fill="#000" opacity=".18"/>
        <path d="M86 176 l-4 10 h12 z M114 176 l4 10 h-12 z" fill="${sh ? '#1c1528' : '#9a7a55'}"/>
        ${[[100, 130, 48], [66, 120, 28], [134, 120, 28], [78, 92, 26], [122, 92, 26], [100, 82, 28]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.b}"/>`).join('')}
        ${[[100, 126, 44], [70, 116, 24], [130, 116, 24], [80, 90, 22], [120, 90, 22], [100, 80, 24]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.a}"/>`).join('')}
        <path d="M100 58 C98 46 100 40 104 36 C110 40 110 50 100 58 Z" fill="${sh ? '#3a2c52' : '#7fb35a'}"/><path d="M100 58 C94 50 86 50 82 52 C86 58 94 60 100 58 Z" fill="${sh ? '#3a2c52' : '#94c46a'}"/>
        ${eyesM(86, 114, 122, 6, p)}${sh ? `<path d="M92 142 L100 138 L108 142" fill="none" stroke="${p.eye}" stroke-width="2.5"/>` : `<path d="M94 138 Q100 144 106 138" fill="none" stroke="#6b2f28" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="76" cy="136" rx="7" ry="4" fill="#f4a0a0" opacity=".6"/><ellipse cx="124" cy="136" rx="7" ry="4" fill="#f4a0a0" opacity=".6"/>`}`; },
    iwanoko(sh) { const p = palette(sh, { a: '#c9a57c', b: '#a8835b', c: '#8d9096', eye: '#241a18' });
      return `${sh ? shadowAura(100, 130, 90) : ''}<ellipse cx="100" cy="188" rx="58" ry="8" fill="#000" opacity=".18"/>
        ${[[64, 168], [84, 172], [116, 172], [136, 168]].map(([x, y]) => `<rect x="${x - 8}" y="${y - 14}" width="16" height="20" rx="6" fill="${p.b}"/>`).join('')}
        <ellipse cx="100" cy="140" rx="54" ry="36" fill="${p.a}"/>
        ${[[76, 106], [100, 98], [124, 106]].map(([x, y]) => `<path d="M${x - 16} ${y + 14} L${x - 4} ${y - 14} L${x + 14} ${y - 6} L${x + 16} ${y + 14} Z" fill="${sh ? '#3b3350' : p.c}" stroke="${sh ? '#1c1528' : '#6c6f75'}" stroke-width="2"/>`).join('')}
        <ellipse cx="146" cy="136" rx="30" ry="26" fill="${p.a}"/><path d="M160 116 L170 100 L174 120 Z" fill="${p.b}"/>
        <ellipse cx="170" cy="146" rx="9" ry="7" fill="${sh ? '#1c1528' : '#5b3f2a'}"/>${eyesM(142, 160, 132, 5, p)}`; },
    mizumochi(sh) { const p = palette(sh, { a: '#8fd3e6', b: '#5fb2cf', c: '#e9fbff', eye: '#241a18' }); const g = id('mz');
      return `${sh ? shadowAura(100, 130, 90) : ''}<defs><radialGradient id="${g}" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="${p.c}"/><stop offset=".45" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></radialGradient></defs>
        <ellipse cx="100" cy="186" rx="56" ry="8" fill="#000" opacity=".18"/>
        <path d="M58 104 L50 70 L80 92 Z M142 104 L150 70 L120 92 Z" fill="${p.b}"/>
        <path d="M40 150 C40 100 70 84 100 84 C130 84 160 100 160 150 C160 176 136 184 100 184 C64 184 40 176 40 150 Z" fill="url(#${g})"/>
        <ellipse cx="80" cy="108" rx="16" ry="9" fill="#fff" opacity="${sh ? .15 : .55}" transform="rotate(-20 80 108)"/>
        ${eyesM(84, 116, 138, 6, p)}${sh ? '' : `<path d="M96 154 Q100 158 104 154" fill="none" stroke="#2a4a5a" stroke-width="2.5" stroke-linecap="round"/>`}`; },
    hoshikage(sh) { const p = palette(sh, { a: '#2e3a78', b: '#1b2250', c: '#ffe38a', eye: '#fff' });
      const stars = [[70, 90], [130, 84], [84, 136], [120, 140], [100, 70], [58, 124], [142, 120]];
      return `${shadowAura(100, 120, 96)}<path d="M100 60 C140 60 158 92 152 126 C148 150 128 170 100 176 C112 184 116 192 108 196 C90 188 70 170 58 150 C44 126 56 60 100 60 Z" fill="${p.a}"/>
        <path d="M70 72 L58 44 L86 64 Z M130 72 L142 44 L114 64 Z" fill="${p.b}"/>
        ${stars.map(([x, y]) => `<path d="M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z" fill="${sh ? '#b58cff' : p.c}"/>`).join('')}
        ${sh ? eyesM(86, 114, 112, 7, { eye: '#ff6fb0', glow: true }) : `<ellipse cx="86" cy="112" rx="7" ry="9" fill="#fff"/><ellipse cx="114" cy="112" rx="7" ry="9" fill="#fff"/><circle cx="86" cy="114" r="4" fill="#1b2250"/><circle cx="114" cy="114" r="4" fill="#1b2250"/>`}`; },
    koumori() { return `${shadowAura(100, 110, 90)}<path d="M100 96 C80 60 40 60 14 80 C30 86 34 100 30 112 C44 104 56 110 60 120 C70 110 84 110 100 120 C116 110 130 110 140 120 C144 110 156 104 170 112 C166 100 170 86 186 80 C160 60 120 60 100 96 Z" fill="#2c2340"/>
        <ellipse cx="100" cy="114" rx="26" ry="24" fill="#3d3057"/><path d="M82 96 L76 74 L92 90 Z M118 96 L124 74 L108 90 Z" fill="#3d3057"/>
        ${eyesM(90, 110, 110, 5, { eye: '#ff6fb0', glow: true })}<path d="M94 124 L96 130 L98 124 M102 124 L104 130 L106 124" fill="#fff"/>`; },
    tsutakage() { return `${shadowAura(100, 110, 100)}<ellipse cx="100" cy="190" rx="70" ry="9" fill="#000" opacity=".25"/>
        ${[[-60, 30], [-30, 20], [30, 20], [60, 30]].map(([dx, h]) => `<path d="M${100 + dx} 190 C${100 + dx * 1.3} ${150 - h} ${100 + dx * .6} ${110 - h} ${100 + dx * .3} ${80 - h}" fill="none" stroke="#3a4a2f" stroke-width="12" stroke-linecap="round"/>`).join('')}
        <path d="M100 40 C150 40 170 90 160 130 C150 170 120 188 100 188 C80 188 50 170 40 130 C30 90 50 40 100 40 Z" fill="#2f3d28"/>
        ${[[60, 70], [140, 70], [150, 130], [50, 130], [100, 44]].map(([x, y]) => `<path d="M${x} ${y} c-10 -12 -2 -22 8 -18 c4 8 -2 16 -8 18z" fill="#56733f"/>`).join('')}
        <circle cx="100" cy="112" r="30" fill="#1a1426"/><circle cx="100" cy="112" r="20" fill="#ff6fb0"/><ellipse cx="100" cy="112" rx="6" ry="16" fill="#1a1426"/><circle cx="92" cy="104" r="4" fill="#fff" opacity=".7"/>`; },
    iwaoni() { return `${shadowAura(100, 110, 100)}<ellipse cx="100" cy="192" rx="80" ry="8" fill="#000" opacity=".25"/>
        <path d="M40 190 L50 140 L30 110 L50 70 L80 50 L120 50 L150 70 L170 110 L150 140 L160 190 Z" fill="#5d5a66" stroke="#2f2c38" stroke-width="3"/>
        <path d="M60 80 L90 70 L86 100 Z M110 70 L140 80 L114 100 Z M70 150 L100 130 L130 150 L100 170 Z" fill="#4a4754"/>
        <path d="M70 52 L60 20 L86 46 Z M130 52 L140 20 L114 46 Z" fill="#8a7fa8"/>
        ${eyesM(82, 118, 96, 9, { eye: '#ff8a4a', glow: true })}<path d="M78 126 L90 120 L100 126 L110 120 L122 126" fill="none" stroke="#ff8a4a" stroke-width="3"/>
        <path d="M30 110 L10 150 L30 160 L40 140 Z M170 110 L190 150 L170 160 L160 140 Z" fill="#5d5a66" stroke="#2f2c38" stroke-width="3"/>`; },
    umikage() { return `${shadowAura(100, 100, 100)}<path d="M0 170 C30 150 50 190 80 170 C110 150 130 190 160 170 C180 158 190 166 200 170 L200 200 L0 200 Z" fill="#1d3550" opacity=".85"/>
        <path d="M70 180 C60 120 70 70 110 50 C150 34 176 60 168 90 C162 110 140 112 128 104 C120 120 118 150 124 180 Z" fill="#26324f"/>
        <path d="M110 50 L100 22 L122 44 L126 16 L136 42 L150 24 L148 50" fill="#3d5a8a"/>
        <path d="M168 90 C176 96 176 104 166 108 L138 108 C148 104 158 100 168 90 Z" fill="#1a2238"/>
        ${eyesM(140, 158, 72, 6, { eye: '#6ff0ff', glow: true })}<path d="M140 108 L144 116 L148 108 M152 108 L156 116 L160 108" fill="#e9f4ff"/>`; },
    tobaridori() { return `${shadowAura(100, 100, 110)}<path d="M100 90 C70 40 20 40 0 60 C20 70 18 90 10 110 C30 100 40 110 44 124 C56 110 70 116 80 128 C86 112 94 104 100 104 C106 104 114 112 120 128 C130 116 144 110 156 124 C160 110 170 100 190 110 C182 90 180 70 200 60 C180 40 130 40 100 90 Z" fill="#221a36"/>
        ${[30, 60, 140, 170].map(x => `<path d="M${x} ${x < 100 ? 70 : 70} l4 8 l-8 0 z" fill="#b58cff" opacity=".7"/>`).join('')}
        <ellipse cx="100" cy="116" rx="26" ry="36" fill="#2f2548"/><circle cx="100" cy="80" r="20" fill="#2f2548"/><path d="M100 86 L94 100 L106 100 Z" fill="#d9b44a"/>
        <path d="M90 62 L84 40 L98 58 Z M110 62 L116 40 L102 58 Z" fill="#3f3260"/>${eyesM(92, 108, 78, 4, { eye: '#b58cff', glow: true })}`; },
    yomikage() { const g = id('yk'); return `${shadowAura(100, 100, 110)}<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2140"/><stop offset="1" stop-color="#0d0a14"/></linearGradient></defs>
        <path d="M100 40 C140 40 150 80 156 120 C162 160 178 180 186 196 L14 196 C22 180 38 160 44 120 C50 80 60 40 100 40 Z" fill="url(#${g})"/>
        <path d="M100 44 C124 44 132 64 132 84 C132 106 118 118 100 118 C82 118 68 106 68 84 C68 64 76 44 100 44 Z" fill="#e8e2f2"/>
        <path d="M72 80 L128 80 L128 88 C118 96 82 96 72 88 Z" fill="#1c1726"/>${eyesM(88, 112, 86, 5, { eye: '#ffd36a', glow: true })}
        <path d="M78 46 L70 16 L88 38 L94 8 L100 36 L106 8 L112 38 L130 16 L122 46 Z" fill="#241c33" stroke="#8b6cd8" stroke-width="1.5"/>
        <path d="M150 120 L150 150" stroke="#8a7a5a" stroke-width="3"/><path d="M140 150 L160 150 L158 176 L142 176 Z" fill="#3a3346" stroke="#8a7a5a" stroke-width="2"/><path d="M146 156 L154 156 L154 170 L146 170 Z" fill="#120e18"/>`; },
    yoiyami() { const g = id('yy'); return `<defs><radialGradient id="${g}" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#3b2566"/><stop offset=".6" stop-color="#150f22"/><stop offset="1" stop-color="#150f22" stop-opacity="0"/></radialGradient></defs>
        <circle cx="100" cy="100" r="100" fill="url(#${g})"/>
        ${Array.from({ length: 26 }, (_, i) => { const a = i * 2.4, r = 30 + (i * 37) % 60; return `<circle cx="${100 + Math.cos(a) * r}" cy="${100 + Math.sin(a) * r * .8}" r="${1 + (i % 3)}" fill="#e7d9ff" opacity=".8"/>`; }).join('')}
        <path d="M100 30 C150 30 176 80 170 130 C166 160 150 186 130 196 L70 196 C50 186 34 160 30 130 C24 80 50 30 100 30 Z" fill="#0d0a14" opacity=".92"/>
        <path d="M60 40 L48 0 L76 30 L86 -4 L96 28 L100 -8 L104 28 L114 -4 L124 30 L152 0 L140 40 Z" fill="#241c33" stroke="#b58cff" stroke-width="2"/>
        ${[[76, 90], [124, 90], [100, 70], [62, 128], [138, 128], [100, 120]].map(([x, y], i) => eyesM(x, x, y, i === 5 ? 9 : 5, { eye: i === 5 ? '#ffd36a' : '#ff6fb0', glow: true })).join('')}
        <path d="M80 150 Q100 166 120 150" fill="none" stroke="#ffd36a" stroke-width="3" opacity=".8"/>`; },
  };
  // ---- generic species art (28 species) ----
  function speciesArt(sp, o = {}) {
    const S = DATA.species[sp]; if (!S) return '';
    const sh = !!o.shadow; const f = new Set(S.feat || []);
    const p = sh ? { a: '#4a3b63', b: '#2c2340', c: '#7b5fb8', eye: '#ff6fb0', glow: true } : { a: S.col[0], b: S.col[1], c: S.col[2], eye: '#241a18' };
    const E = (x1, x2, y, r) => eyesM(x1, x2, y, r, p);
    const cheeks = (x1, x2, y) => sh ? '' : `<ellipse cx="${x1}" cy="${y}" rx="7" ry="4" fill="#f4a0a0" opacity=".5"/><ellipse cx="${x2}" cy="${y}" rx="7" ry="4" fill="#f4a0a0" opacity=".5"/>`;
    const smile = (x, y) => sh ? `<path d="M${x - 7} ${y + 2} L${x} ${y - 2} L${x + 7} ${y + 2}" fill="none" stroke="${p.eye}" stroke-width="2.5"/>` : `<path d="M${x - 6} ${y} Q${x} ${y + 6} ${x + 6} ${y}" fill="none" stroke="#5a2a24" stroke-width="2.5" stroke-linecap="round"/>`;
    const crown = (x, y, s = 1) => `<path d="M${x - 18 * s} ${y} L${x - 20 * s} ${y - 18 * s} L${x - 9 * s} ${y - 9 * s} L${x} ${y - 22 * s} L${x + 9 * s} ${y - 9 * s} L${x + 20 * s} ${y - 18 * s} L${x + 18 * s} ${y} Z" fill="${sh ? '#6d57a0' : '#f3c15a'}" stroke="${sh ? '#2c2340' : '#b8862a'}" stroke-width="2"/>`;
    const horns = (x1, x2, y) => `<path d="M${x1} ${y} L${x1 - 10} ${y - 26} L${x1 + 8} ${y - 6} Z M${x2} ${y} L${x2 + 10} ${y - 26} L${x2 - 8} ${y - 6} Z" fill="${sh ? '#1c1528' : p.c}"/>`;
    const starsF = (pts) => pts.map(([x, y]) => `<path d="M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z" fill="${sh ? '#b58cff' : p.c}"/>`).join('');
    const gid = id('sg');
    let out = `<defs><radialGradient id="${gid}" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="${p.c}" stop-opacity=".55"/><stop offset=".4" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></radialGradient></defs>`;
    if (sh || S.type === 'light' || S.legend) out += shadowAura(100, 120, 92);
    out += `<ellipse cx="100" cy="188" rx="50" ry="7" fill="#000" opacity=".2"/>`;
    const A = S.arch;
    if (A === 'fluff') {
      if (f.has('wings')) out += `<ellipse cx="44" cy="104" rx="30" ry="16" fill="${p.b}" transform="rotate(-25 44 104)"/><ellipse cx="156" cy="104" rx="30" ry="16" fill="${p.b}" transform="rotate(25 156 104)"/>`;
      out += `<path d="M86 176 l-4 10 h12 z M114 176 l4 10 h-12 z" fill="${sh ? '#1c1528' : '#9a7a55'}"/>`;
      out += [[100, 130, 48], [66, 120, 28], [134, 120, 28], [78, 92, 26], [122, 92, 26], [100, 82, 28]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.b}"/>`).join('');
      out += [[100, 126, 44], [70, 116, 24], [130, 116, 24], [80, 90, 22], [120, 90, 22], [100, 80, 24]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.a}"/>`).join('');
      if (f.has('sprout')) out += `<path d="M100 58 C98 46 100 40 104 36 C110 40 110 50 100 58 Z" fill="${sh ? '#3a2c52' : p.c}"/><path d="M100 58 C94 50 86 50 82 52 C86 58 94 60 100 58 Z" fill="${sh ? '#3a2c52' : p.c}"/>`;
      if (f.has('horns')) out += horns(76, 124, 80);
      out += E(86, 114, 122, 6) + smile(100, 138) + cheeks(76, 124, 136);
      if (f.has('crown')) out += crown(100, 62);
      if (f.has('bolt')) out += `<path d="M156 34 L142 64 L156 64 L140 98" fill="none" stroke="${sh ? '#b58cff' : '#ffe36a'}" stroke-width="5" stroke-linejoin="round"/><path d="M44 44 L36 62 L46 62 L38 80" fill="none" stroke="${sh ? '#b58cff' : '#ffe36a'}" stroke-width="3.5" stroke-linejoin="round"/>`;
    } else if (A === 'blob') {
      if (f.has('ears')) out += `<path d="M58 104 L50 70 L80 92 Z M142 104 L150 70 L120 92 Z" fill="${p.b}"/>`;
      if (f.has('frills')) out += [50, 76, 100, 124, 150].map((x, i) => `<ellipse cx="${x}" cy="${88 + Math.abs(i - 2) * 8}" rx="12" ry="18" fill="${p.c}" opacity=".9" transform="rotate(${(i - 2) * 22} ${x} ${88 + Math.abs(i - 2) * 8})"/>`).join('');
      out += `<path d="M40 150 C40 100 70 84 100 84 C130 84 160 100 160 150 C160 176 136 184 100 184 C64 184 40 176 40 150 Z" fill="url(#${gid})"/>`;
      out += `<ellipse cx="80" cy="108" rx="16" ry="9" fill="#fff" opacity="${sh ? .12 : .5}" transform="rotate(-20 80 108)"/>`;
      out += E(84, 116, 138, 6) + smile(100, 154) + cheeks(72, 128, 152);
      if (f.has('crown')) out += crown(100, 90);
    } else if (A === 'quad') {
      out += `<path d="M44 150 C30 146 26 132 34 124" fill="none" stroke="${p.b}" stroke-width="8" stroke-linecap="round"/>`;
      out += [[64, 168], [84, 172], [116, 172], [136, 168]].map(([x, y]) => `<rect x="${x - 8}" y="${y - 16}" width="16" height="22" rx="7" fill="${p.b}"/>`).join('');
      if (f.has('claws')) out += [[64, 184], [84, 188], [116, 188], [136, 184]].map(([x, y]) => `<path d="M${x - 6} ${y} l3 5 l3 -5 l3 5 l3 -5" stroke="#f4ecdb" stroke-width="2" fill="none"/>`).join('');
      out += `<ellipse cx="96" cy="140" rx="54" ry="34" fill="url(#${gid})"/><ellipse cx="96" cy="156" rx="34" ry="14" fill="${sh ? p.b : p.c}" opacity=".45"/>`;
      if (f.has('plates')) out += [[70, 108], [94, 100], [118, 108]].map(([x, y]) => `<path d="M${x - 16} ${y + 14} L${x - 4} ${y - 14} L${x + 14} ${y - 6} L${x + 16} ${y + 14} Z" fill="${sh ? '#3b3350' : p.c}" stroke="${sh ? '#1c1528' : '#6c6f75'}" stroke-width="2"/>`).join('');
      if (f.has('spikes')) out += [60, 80, 100, 120].map(x => `<path d="M${x - 9} 112 L${x} 90 L${x + 9} 112 Z" fill="${p.b}"/>`).join('');
      const hx = f.has('snout') ? 146 : 148, hy = 122;
      if (f.has('longears')) out += `<ellipse cx="${hx - 12}" cy="72" rx="9" ry="30" fill="${p.a}" transform="rotate(-10 ${hx - 12} 72)"/><ellipse cx="${hx + 14}" cy="72" rx="9" ry="30" fill="${p.a}" transform="rotate(12 ${hx + 14} 72)"/><ellipse cx="${hx - 12}" cy="74" rx="4" ry="20" fill="#f4b0c0" opacity="${sh ? 0 : .7}" transform="rotate(-10 ${hx - 12} 74)"/>`;
      else if (!f.has('snout')) out += `<path d="M${hx - 20} 104 L${hx - 14} 84 L${hx - 4} 100 Z M${hx + 20} 104 L${hx + 14} 84 L${hx + 4} 100 Z" fill="${p.b}"/>`;
      if (f.has('snout')) out += `<ellipse cx="${hx + 10}" cy="${hy + 6}" rx="42" ry="20" fill="${p.a}"/><path d="M${hx - 10} ${hy + 16} l5 6 l5 -6 l5 6 l5 -6 l5 6 l5 -6" stroke="#fff" stroke-width="2" fill="none"/>` + E(hx - 12, hx + 6, hy - 6, 5);
      else out += `<ellipse cx="${hx}" cy="${hy}" rx="30" ry="27" fill="${p.a}"/>` + E(hx - 11, hx + 11, hy - 2, 5) + smile(hx, hy + 12) + cheeks(hx - 20, hx + 20, hy + 10);
      if (f.has('nose')) out += `<circle cx="${hx}" cy="${hy + 6}" r="6" fill="#f08aa0"/>`;
      if (f.has('crown')) out += crown(hx, hy - 24, .9);
    } else if (A === 'bird') {
      const bat = f.has('bat');
      if (bat) out += `<path d="M100 110 C80 70 40 70 12 92 C28 96 32 110 28 122 C42 114 54 120 58 130 C70 120 84 120 100 130 C116 120 130 120 142 130 C146 120 158 114 172 122 C168 110 172 96 188 92 C160 70 120 70 100 110 Z" fill="${p.b}"/>`;
      else out += `<path d="M76 110 C50 90 22 96 10 116 C34 118 50 128 70 140 Z M124 110 C150 90 178 96 190 116 C166 118 150 128 130 140 Z" fill="${p.b}"/><path d="M86 176 L100 192 L114 176 Z" fill="${p.b}"/>`;
      out += `<ellipse cx="100" cy="134" rx="34" ry="40" fill="url(#${gid})"/><ellipse cx="100" cy="146" rx="20" ry="24" fill="${sh ? p.b : p.c}" opacity=".5"/>`;
      out += `<circle cx="100" cy="88" r="26" fill="${p.a}"/>`;
      if (f.has('crest')) out += `<path d="M92 66 C88 46 96 38 100 34 C102 46 106 50 112 44 C112 56 108 62 106 66 Z" fill="${p.c}"/>`;
      if (f.has('horns')) out += horns(84, 116, 70);
      out += E(89, 111, 86, 5);
      out += bat ? `<path d="M94 100 L96 106 L98 100 M102 100 L104 106 L106 100" fill="#fff"/>` : `<path d="M94 96 L106 96 L100 108 Z" fill="${sh ? '#1c1528' : '#e0a030'}"/>`;
      if (f.has('crown')) out += crown(100, 64, .8);
    } else if (A === 'sprite') {
      if (f.has('wings')) out += `<path d="M70 110 C40 80 20 100 24 126 C40 118 56 122 70 128 Z M130 110 C160 80 180 100 176 126 C160 118 144 122 130 128 Z" fill="${p.c}" opacity=".7"/>`;
      if (f.has('flame')) out += `<path d="M100 20 C112 44 132 50 128 80 L72 80 C68 56 86 50 100 20 Z" fill="${p.c}"/><path d="M100 40 C108 56 118 60 114 80 L86 80 C84 64 94 58 100 40 Z" fill="#fff" opacity=".6"/>`;
      out += `<path d="M100 60 C140 60 156 92 150 126 C146 150 128 166 102 172 C112 180 114 190 106 194 C90 186 70 168 58 148 C44 124 56 60 100 60 Z" fill="url(#${gid})"/>`;
      if (f.has('ears')) out += `<path d="M70 72 L58 44 L86 64 Z M130 72 L142 44 L114 64 Z" fill="${p.b}"/>`;
      if (f.has('horns')) out += horns(80, 120, 70);
      if (f.has('leaf')) out += `<path d="M100 62 C84 40 104 26 120 30 C118 48 112 56 100 62 Z" fill="${p.c}"/><path d="M100 62 L114 36" stroke="${p.b}" stroke-width="2"/>`;
      if (f.has('stars')) out += starsF([[66, 96], [136, 90], [80, 146], [126, 140], [58, 126]]);
      out += E(86, 114, 112, 7) + smile(100, 132) + cheeks(74, 126, 128);
    } else if (A === 'golem') {
      out += `<rect x="40" y="96" width="26" height="60" rx="8" fill="${p.b}"/><rect x="134" y="96" width="26" height="60" rx="8" fill="${p.b}"/>`;
      out += `<rect x="66" y="150" width="24" height="34" rx="6" fill="${p.b}"/><rect x="110" y="150" width="24" height="34" rx="6" fill="${p.b}"/>`;
      out += `<rect x="58" y="84" width="84" height="80" rx="16" fill="url(#${gid})" stroke="${p.b}" stroke-width="3"/><rect x="72" y="42" width="56" height="48" rx="12" fill="${p.a}" stroke="${p.b}" stroke-width="3"/>`;
      if (f.has('moss') && !sh) out += `<path d="M58 100 C70 92 84 98 92 90 C96 100 80 104 58 108 Z M72 48 C84 42 100 48 112 42 C112 52 90 54 72 56 Z" fill="#6f9a4f"/>`;
      if (f.has('core')) out += `<circle cx="100" cy="124" r="14" fill="${sh ? '#ff6fb0' : p.c}"/><circle cx="100" cy="124" r="24" fill="${sh ? '#ff6fb0' : p.c}" opacity=".25"/>`;
      out += E(88, 112, 66, 5);
      if (f.has('crown')) out += crown(100, 44, .9);
    } else if (A === 'plant') {
      if (f.has('cactus')) {
        out += `<rect x="72" y="70" width="56" height="110" rx="28" fill="url(#${gid})"/><path d="M72 120 C50 120 48 100 50 86 C58 86 62 96 72 104 Z M128 110 C150 110 152 90 150 76 C142 76 138 86 128 94 Z" fill="${p.a}"/>`;
        out += [[84, 90], [116, 96], [90, 140], [112, 150], [100, 118]].map(([x, y]) => `<path d="M${x} ${y} l-4 -3 M${x} ${y} l4 -3" stroke="${sh ? '#1c1528' : '#e8f0c8'}" stroke-width="1.5"/>`).join('');
        out += `<circle cx="100" cy="66" r="10" fill="${p.c}"/>` + E(88, 112, 112, 5) + smile(100, 128);
      } else {
        out += `<path d="M60 170 C54 150 70 136 100 136 C130 136 146 150 140 170 C136 186 64 186 60 170 Z" fill="${p.b}"/>`;
        out += `<path d="M100 140 C60 136 44 110 52 90 C70 96 86 110 100 140 Z M100 140 C140 136 156 110 148 90 C130 96 114 110 100 140 Z" fill="${p.a}"/>`;
        out += `<ellipse cx="100" cy="112" rx="34" ry="32" fill="url(#${gid})"/>`;
        if (f.has('bud')) out += `<path d="M100 44 C120 56 118 80 100 84 C82 80 80 56 100 44 Z" fill="${p.c}"/><path d="M100 84 L100 80" stroke="${p.b}" stroke-width="3"/>`;
        if (f.has('petals')) out += Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.283; return `<ellipse cx="${100 + Math.cos(a) * 40}" cy="${112 + Math.sin(a) * 36}" rx="14" ry="9" fill="${p.c}" transform="rotate(${a * 57.3} ${100 + Math.cos(a) * 40} ${112 + Math.sin(a) * 36})"/>`; }).join('') + `<ellipse cx="100" cy="112" rx="30" ry="28" fill="${p.a}"/>`;
        out += E(88, 112, 110, 5) + smile(100, 124) + cheeks(80, 120, 122);
        if (f.has('crown')) out += crown(100, 82, .8);
      }
    } else if (A === 'fish') {
      out += `<path d="M20 110 C8 90 12 70 26 78 C34 90 36 100 40 110 C36 120 34 130 26 142 C12 150 8 130 20 110 Z" fill="${p.b}"/>`;
      out += `<path d="M36 110 C50 70 110 58 150 70 C180 80 192 100 186 124 C178 154 130 166 90 160 C60 156 40 136 36 110 Z" fill="url(#${gid})"/>`;
      out += `<path d="M60 136 C90 160 150 160 180 128 C150 146 100 150 60 136 Z" fill="${sh ? p.b : p.c}" opacity=".7"/>`;
      out += `<path d="M110 140 C104 160 112 170 126 170 C124 158 124 150 120 142 Z" fill="${p.b}"/>`;
      if (f.has('rainbow') && !sh) out += ['#ff7a7a', '#ffc46a', '#fff38a', '#8fe08a', '#8ac4ff'].map((c, i) => `<path d="M${70 + i * 6} 70 C${90 + i * 4} ${40 + i * 4} ${130 - i * 4} ${40 + i * 4} ${150 - i * 6} 70" fill="none" stroke="${c}" stroke-width="4" opacity=".75"/>`).join('');
      if (f.has('stars')) out += starsF([[80, 90], [110, 80], [140, 94], [96, 120]]);
      if (f.has('fins')) out += `<path d="M84 74 C96 26 132 24 146 70 C124 60 104 62 84 74 Z" fill="${p.c}" opacity=".9"/><path d="M104 132 C86 172 62 186 36 182 C58 166 74 150 92 132 Z M132 134 C140 168 160 184 184 186 C168 168 156 150 146 132 Z" fill="${p.b}" opacity=".9"/>`;
      if (f.has('crown')) out += crown(130, 70, .8);
      out += (p.glow ? eyesM(160, 160, 104, 6, p) : `<ellipse cx="160" cy="104" rx="6" ry="8" fill="#241a18"/><circle cx="158" cy="101" r="2.4" fill="#fff"/>`) + (sh ? '' : `<path d="M166 124 Q172 128 178 122" fill="none" stroke="#2a4a5a" stroke-width="2.5"/>`);
    }
    if (f.has('halo')) { const hp = { fluff: [100, 48], blob: [100, 68], quad: [148, 62], bird: [100, 50], sprite: [100, 46], golem: [100, 28], plant: [100, 40], fish: [140, 56] }[A] || [100, 40];
      out += `<ellipse cx="${hp[0]}" cy="${hp[1]}" rx="24" ry="6.5" fill="none" stroke="${sh ? '#b58cff' : '#ffe38a'}" stroke-width="4.5" opacity=".95"/><ellipse cx="${hp[0]}" cy="${hp[1]}" rx="30" ry="10" fill="none" stroke="${sh ? '#b58cff' : '#fff6c9'}" stroke-width="2" opacity=".35"/>`; }
    let svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"${o.shiny ? ' style="filter:hue-rotate(150deg) saturate(1.2)"' : ''}>${out}</svg>`;
    if (o.shiny) svg = `<div class="shiny-wrap">${svg}<span class="shiny-sp">✦</span><span class="shiny-sp s2">✧</span></div>`;
    return svg;
  }
  M.hoshikui = () => { const g = id('hk'); return `<defs><radialGradient id="${g}" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="#050308"/><stop offset=".7" stop-color="#1a1030"/><stop offset="1" stop-color="#3b2566"/></radialGradient></defs>
    ${shadowAura(100, 100, 110)}<path d="M100 22 C160 22 192 70 186 120 C180 170 140 196 100 196 C60 196 20 170 14 120 C8 70 40 22 100 22 Z" fill="url(#${g})"/>
    <path d="M40 120 C60 150 140 150 160 120 C150 170 50 170 40 120 Z" fill="#050308"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${50 + i * 12} ${126 + (i % 2) * 4} l6 14 l6 -14 z" fill="#e7d9ff"/>`).join('')}
    ${Array.from({ length: 20 }, (_, i) => `<circle cx="${60 + (i * 37) % 80}" cy="${136 + (i * 13) % 14}" r="${1 + i % 2}" fill="#ffe38a"/>`).join('')}
    ${eyesM(66, 134, 84, 10, { eye: '#ffd36a', glow: true })}${eyesM(84, 116, 60, 5, { eye: '#ff6fb0', glow: true })}
    ${[[30, 40], [170, 40], [100, 8]].map(([x, y]) => `<path d="M${x} ${y} L${x + 30} ${y + 36}" stroke="#ffe38a" stroke-width="3" opacity=".7"/><circle cx="${x}" cy="${y}" r="5" fill="#fff6c9"/>`).join('')}`; };

  Object.assign(M, {
    tsumuji() { return `${shadowAura(100, 105, 100)}
      ${[0, 1, 2].map(i => `<path d="M${30 + i * 8} ${160 - i * 20} C70 ${190 - i * 30} 150 ${180 - i * 30} ${170 - i * 6} ${140 - i * 24}" fill="none" stroke="#9fe0d0" stroke-width="${6 - i * 1.5}" stroke-linecap="round" opacity="${.7 - i * .15}"/>`).join('')}
      <path d="M100 96 C70 50 30 40 6 58 C30 64 36 80 30 98 C50 88 66 96 74 110 Z M100 96 C130 50 170 40 194 58 C170 64 164 80 170 98 C150 88 134 96 126 110 Z" fill="#2f5a66"/>
      <path d="M100 96 C80 60 50 56 30 64 M100 96 C120 60 150 56 170 64" stroke="#6fc8c0" stroke-width="3" fill="none"/>
      <ellipse cx="100" cy="116" rx="26" ry="34" fill="#23444e"/><circle cx="100" cy="80" r="20" fill="#2c5560"/>
      <path d="M100 86 L94 98 L106 98 Z" fill="#e0c060"/><path d="M92 62 C86 44 96 36 100 30 C104 40 110 44 116 40 C112 52 108 58 106 64 Z" fill="#9fe0d0"/>
      ${eyesM(92, 108, 78, 4, { eye: '#6ff0e0', glow: true })}<path d="M86 148 L80 172 M114 148 L120 172" stroke="#e0c060" stroke-width="4" stroke-linecap="round"/>`; },
    kumokurage() { return `${shadowAura(100, 100, 100)}
      ${[-40, -22, -6, 10, 26, 42].map(dx => `<path d="M${100 + dx} 118 C${90 + dx} 140 ${110 + dx} 160 ${96 + dx} 190" fill="none" stroke="#8f86c8" stroke-width="5" stroke-linecap="round"/><circle cx="${96 + dx}" cy="190" r="4" fill="#ffe36a"/>`).join('')}
      ${[[100, 80, 46], [62, 96, 28], [138, 96, 28], [78, 64, 26], [122, 64, 26]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#5c5890"/>`).join('')}
      ${[[100, 76, 40], [64, 92, 22], [136, 92, 22], [80, 62, 20], [120, 62, 20]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7a74b4"/>`).join('')}
      <path d="M52 110 C80 124 120 124 148 110 C140 118 120 124 100 124 C80 124 60 118 52 110 Z" fill="#3f3a70"/>
      ${eyesM(86, 114, 96, 6, { eye: '#ff6fb0', glow: true })}<path d="M150 30 L140 52 L150 52 L138 76" fill="none" stroke="#ffe36a" stroke-width="3"/>`; },
    hoshigarasu() { const g = id('hg'); return `${shadowAura(100, 100, 110)}<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2450"/><stop offset="1" stop-color="#0c0a18"/></linearGradient></defs>
      <path d="M100 100 C76 52 30 36 2 50 C26 60 30 78 22 96 C40 90 52 98 58 110 C68 102 80 104 92 114 Z M100 100 C124 52 170 36 198 50 C174 60 170 78 178 96 C160 90 148 98 142 110 C132 102 120 104 108 114 Z" fill="url(#${g})"/>
      ${[[30, 58], [52, 70], [40, 88], [70, 82], [148, 58], [130, 72], [160, 88], [128, 88]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#fff6c9"/>`).join('')}
      <path d="M30 58 L52 70 L40 88 M52 70 L70 82 M148 58 L130 72 L160 88 M130 72 L128 88" stroke="#b58cff" stroke-width="1" opacity=".7"/>
      <ellipse cx="100" cy="124" rx="24" ry="36" fill="#1a1630"/><circle cx="100" cy="84" r="19" fill="#1f1a38"/>
      <path d="M104 88 L128 96 L104 98 Z" fill="#6d57a0"/>${eyesM(94, 108, 82, 4, { eye: '#ffd36a', glow: true })}<path d="M86 156 L80 180 L100 170 L120 180 L114 156" fill="#1a1630"/>`; },
    amahami() { const g = id('am'); return `<defs><radialGradient id="${g}" cx="50%" cy="50%" r="65%"><stop offset="0" stop-color="#241a44"/><stop offset=".7" stop-color="#0a0714"/><stop offset="1" stop-color="#3b2566"/></radialGradient></defs>${shadowAura(100, 100, 110)}
      <path d="M10 150 C30 110 20 70 50 50 C80 30 130 28 160 48 C190 68 196 110 180 140 C168 164 140 176 120 170 C140 150 138 120 116 110 C94 100 70 118 72 140 C74 160 50 178 10 150 Z" fill="url(#${g})"/>
      ${Array.from({ length: 30 }, (_, i) => `<circle cx="${40 + (i * 47) % 130}" cy="${50 + (i * 29) % 100}" r="${.8 + (i % 3) * .7}" fill="#e7d9ff" opacity=".85"/>`).join('')}
      <path d="M60 52 L44 14 L72 42 Z M140 50 L156 12 L130 40 Z M100 34 L100 0 L112 32 Z" fill="#1c1430" stroke="#b58cff" stroke-width="1.5"/>
      <path d="M76 96 C90 120 150 120 164 92 C154 136 88 136 76 96 Z" fill="#050308"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${84 + i * 10} ${104 + (i % 2) * 3} l5 12 l5 -12 z" fill="#e7d9ff"/>`).join('')}
      ${eyesM(92, 146, 72, 9, { eye: '#ffd36a', glow: true })}${eyesM(118, 118, 56, 5, { eye: '#ff6fb0', glow: true })}`; },
    hoshimoriB() { const g = id('hm'); return `<defs><radialGradient id="${g}" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".5" stop-color="#c9b8ff"/><stop offset="1" stop-color="#3b2566"/></radialGradient></defs>
      <circle cx="100" cy="100" r="98" fill="#3b2566" opacity=".35"/><ellipse cx="100" cy="30" rx="34" ry="8" fill="none" stroke="#ffe38a" stroke-width="4"/>
      <path d="M100 100 C70 40 20 30 0 60 C24 66 26 86 18 104 C40 96 54 106 60 120 C72 110 86 112 96 124 Z M100 100 C130 40 180 30 200 60 C176 66 174 86 182 104 C160 96 146 106 140 120 C128 110 114 112 104 124 Z" fill="url(#${g})"/>
      ${[30, 50, 70, 130, 150, 170].map((x, i) => `<path d="M${x} ${70 + (i % 3) * 8} l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z" fill="#fff6c9"/>`).join('')}
      <ellipse cx="100" cy="128" rx="24" ry="38" fill="#e8e0ff"/><circle cx="100" cy="82" r="20" fill="#f4f0ff"/>
      <path d="M92 60 C88 40 96 32 100 24 C104 34 108 40 114 36 C112 48 108 56 106 62 Z" fill="#ffe38a"/>
      <path d="M86 110 L96 124 L88 140 L100 154 M116 112 L106 130 L114 146" stroke="#2a1d44" stroke-width="3" fill="none" opacity=".75"/>
      <path d="M100 88 L94 100 L106 100 Z" fill="#e0a030"/>${eyesM(92, 108, 80, 4, { eye: '#b58cff', glow: true })}<path d="M84 162 L76 190 L100 178 L124 190 L116 162" fill="#c9b8ff"/>`; },
  });
  Object.assign(P, {
    haru: { skin: '#f7dcc8', hair: '#a9cde3', hairHi: '#eef8ff', eye: '#2f9cc0', eyeShape: 'soft', brow: 'soft', lash: true,
      back: 'M60 100 C52 58 72 34 100 34 C128 34 148 58 140 100 C142 118 138 132 130 140 L70 140 C62 132 58 118 60 100 Z',
      front: ['M62 96 C58 58 80 42 102 42 C124 42 142 58 138 96 C132 82 124 72 112 66 C104 78 90 86 72 88 C68 90 64 93 62 96 Z',
        'M64 92 C60 112 62 128 70 140 C72 124 72 108 70 96 Z', 'M136 92 C140 112 138 128 130 140 C128 124 128 108 130 96 Z'],
      extra: `<path d="M66 66 C50 52 44 34 50 20 C60 32 68 48 70 64 Z" fill="#fff" stroke="#cfe3f0" stroke-width="1.5"/><path d="M68 62 L54 28" stroke="#9fc4dc" stroke-width="1.2"/><circle cx="70" cy="68" r="4" fill="#3fa8c8"/>`,
      body: () => `<path d="M30 200 C34 168 64 152 88 150 L112 150 C136 152 166 168 170 200 Z" fill="#8fcfe6"/><path d="M84 152 C88 168 112 168 116 152 L122 156 C116 178 84 178 78 156 Z" fill="#f4f1e8"/>
        <path d="M40 200 C44 180 58 166 76 160 L70 200 Z M160 200 C156 180 142 166 124 160 L130 200 Z" fill="#6fb6d2"/><circle cx="100" cy="176" r="4" fill="#f3c15a"/>` },
    soyogi: { skin: '#ecd9c4', hair: '#eeeef4', hairHi: '#ffffff', eye: '#7a8aa6', eyeShape: 'adult', brow: 'soft', age: 'elder',
      back: 'M58 100 C50 60 74 40 100 40 C126 40 150 60 142 100 L142 112 L58 112 Z',
      front: ['M62 96 C60 62 80 48 100 48 C120 48 140 62 138 96 C130 76 118 66 100 64 C82 66 70 76 62 96 Z'],
      extra: `<ellipse cx="100" cy="34" rx="22" ry="17" fill="#f4f4f8"/><path d="M84 30 C92 24 108 24 116 30" stroke="#dcdce6" stroke-width="2" fill="none"/><path d="M118 24 L142 8" stroke="#c9a064" stroke-width="3"/><circle cx="142" cy="8" r="3" fill="#7f9cd8"/>`,
      body: () => `<path d="M30 200 C34 168 64 154 88 152 L112 152 C136 154 166 168 170 200 Z" fill="#e8e2f4"/><path d="M84 152 L100 176 L116 152" fill="#cfc6e6"/>
        <path d="M78 166 Q100 178 122 166" fill="none" stroke="#8a6a4a" stroke-width="1.5"/><g fill="#fff" stroke="#9fb4d8" stroke-width="1">${[80, 92, 108, 120].map(x => `<path d="M${x} 170 C${x - 4} 180 ${x} 190 ${x + 2} 192 C${x + 4} 184 ${x + 4} 176 ${x} 170 Z"/>`).join('')}</g>` },
  });

  // ---- v5 キャラクター再デザイン（シルエットと 小物で 個性を出す） ----
  const RD = {
    sora: { face: 'round', bg: '#f0a040', line: '#3a2214', rim: '#ffd9a0',
      behind: `<path d="M150 168 C168 150 186 150 196 136 C190 160 176 176 150 184 Z" fill="#e8962e" stroke="#8a4a14" stroke-width="2"/><path d="M146 176 C166 170 180 176 192 170 C182 186 166 192 146 190 Z" fill="#d07a1e"/>`,
      body: () => `<path d="M34 200 C38 170 66 158 88 156 L112 156 C134 158 162 170 166 200 Z" fill="#2e4f8a" stroke="#1a2c50" stroke-width="2"/>
        <path d="M76 154 C86 168 114 168 124 154 L132 160 C122 182 78 182 68 160 Z" fill="#e8962e" stroke="#8a4a14" stroke-width="2"/><path d="M118 166 C130 176 134 190 130 200 L118 200 C120 188 116 176 110 170 Z" fill="#d07a1e"/>
        <g transform="translate(48 172)"><rect x="-8" y="-2" width="16" height="20" rx="4" fill="#ffcf6a" stroke="#5a3a22" stroke-width="2"/><circle cx="0" cy="8" r="10" fill="#ffd36a" opacity=".35"/><path d="M-6 -2 C-6 -8 6 -8 6 -2" fill="none" stroke="#5a3a22" stroke-width="2"/></g>` },
    mio: { face: 'round', bg: '#2f9a8a', line: '#6a2a18', rim: '#ffe0c8',
      behind: `<path d="M40 150 C30 110 44 70 72 56 L128 56 C156 70 170 110 160 150 L150 200 L50 200 Z" fill="#2f9a8a" stroke="#1a5a50" stroke-width="2"/>`,
      body: () => `<path d="M36 200 C40 172 66 160 88 158 L112 158 C134 160 160 172 164 200 Z" fill="#f7f2e6" stroke="#b8a888" stroke-width="2"/>
        <path d="M48 200 C50 176 64 162 86 158 L90 176 L70 200 Z M152 200 C150 176 136 162 114 158 L110 176 L130 200 Z" fill="#2f9a8a" stroke="#1a5a50" stroke-width="2"/><path d="M92 160 L100 174 L108 160" fill="none" stroke="#e39a7a" stroke-width="3"/>
        <path d="M150 196 C160 170 176 162 186 170 C178 176 172 186 170 198" fill="none" stroke="#f3c15a" stroke-width="4"/>` },
    riku: { face: 'sharp', bg: '#c23a35', line: '#101826', rim: '#ffb0a0',
      body: () => `<path d="M34 200 C38 170 66 158 88 156 L112 156 C134 158 162 170 166 200 Z" fill="#34343e" stroke="#15151c" stroke-width="2"/>
        <path d="M78 150 L122 150 L126 170 C114 176 86 176 74 170 Z" fill="#22222a" stroke="#101014" stroke-width="2"/><path d="M30 196 C32 170 46 160 64 158 L74 178 L56 200 Z" fill="#8a8f98" stroke="#4a4f58" stroke-width="2"/>
        <path d="M122 166 L172 118" stroke="#8a6a45" stroke-width="5"/><path d="M168 110 L182 102 L176 118 Z" fill="#dfe6ee" stroke="#6a7078" stroke-width="1.5"/>` },
    sana: { face: 'sharp', bg: '#4a5fb0', line: '#101828', rim: '#d8e0ff',
      behind: `<path d="M44 60 C60 20 140 20 156 60 L170 200 L30 200 Z" fill="#2f3f7a" stroke="#1a2450" stroke-width="2"/>${[[56, 110], [148, 96], [60, 164], [144, 150], [100, 26]].map(([x, y]) => `<path d="M${x} ${y - 6} l2 4 l4 1 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -1 z" fill="#ffe38a"/>`).join('')}` },
    haru: { face: 'sharp', bg: '#6fc0e0', line: '#3a6a88', rim: '#ffffff',
      back: 'M50 104 C38 84 44 58 62 46 C66 30 86 22 100 28 C114 20 136 28 140 46 C158 56 164 84 150 104 C156 120 146 136 132 134 C126 140 74 140 68 134 C54 136 44 120 50 104 Z',
      extra: `<path d="M60 64 C74 52 126 52 140 64 L140 72 C126 62 74 62 60 72 Z" fill="#6a4a2e" stroke="#3a2a1a" stroke-width="1.5"/><circle cx="84" cy="60" r="11" fill="#ffc85a" stroke="#6a4a2e" stroke-width="3"/><circle cx="116" cy="60" r="11" fill="#ffc85a" stroke="#6a4a2e" stroke-width="3"/><circle cx="81" cy="57" r="3" fill="#fff"/><circle cx="113" cy="57" r="3" fill="#fff"/>
        <path d="M150 58 C166 40 172 22 166 10 C156 22 150 38 146 54 Z" fill="#fff" stroke="#9fc4dc" stroke-width="1.5"/>`,
      body: () => `<path d="M30 200 C34 168 64 152 88 150 L112 150 C136 152 166 168 170 200 Z" fill="#8fcfe6" stroke="#3a6a88" stroke-width="2"/><path d="M100 152 L60 178 L100 200 L140 178 Z" fill="#f6c64a" stroke="#a07a1a" stroke-width="2"/><path d="M100 152 L100 200 M60 178 L140 178" stroke="#a07a1a" stroke-width="1.5"/><circle cx="100" cy="164" r="4" fill="#fff"/>` },
    kaito: { face: 'square', bg: '#2f6f73', line: '#1e140c',
      body: () => `<path d="M32 200 C36 170 66 156 88 154 L112 154 C134 156 164 170 168 200 Z" fill="#2f6f73" stroke="#18393c" stroke-width="2"/><path d="M84 154 L100 182 L116 154 L124 158 L100 196 L76 158 Z" fill="#23394f"/>
        ${[168, 180, 192].map(y => `<circle cx="112" cy="${y}" r="3" fill="#d8b24a"/>`).join('')}<path d="M40 190 L64 176" stroke="#d8b24a" stroke-width="7" stroke-linecap="round"/><circle cx="40" cy="190" r="4" fill="#9fd0ff"/>` },
    yui: { face: 'round', bg: '#7f9c6e', line: '#3a2418',
      extra: `<path d="M132 96 C150 116 152 146 142 176" fill="none" stroke="#5a3827" stroke-width="10" stroke-linecap="round" stroke-dasharray="8 3"/><path d="M130 80 L150 64" stroke="#c9a064" stroke-width="4" stroke-linecap="round"/><circle cx="150" cy="64" r="4" fill="#e05050"/>`,
      body: () => `<path d="M36 200 C40 172 66 160 88 158 L112 158 C134 160 160 172 164 200 Z" fill="#6f8f5e" stroke="#3a4a30" stroke-width="2"/><path d="M40 196 C44 170 66 156 100 156 C134 156 156 170 160 196 C140 184 120 180 100 180 C80 180 60 184 40 196 Z" fill="#efe4cc" stroke="#b8a888" stroke-width="2"/>
        ${[60, 80, 100, 120, 140].map(x => `<path d="M${x} ${180 - Math.abs(x - 100) * .15} l4 6 l4 -6" stroke="#c8b898" fill="none"/>`).join('')}` },
    gen: { face: 'square', bg: '#8a5a34', line: '#1a140e',
      extra: `<path d="M64 76 C74 64 126 64 136 76 L136 86 C124 74 76 74 64 86 Z" fill="#eee8dc"/><g stroke="#3a2a1a" stroke-width="3"><circle cx="84" cy="66" r="10" fill="#9fd0ff"/><circle cx="116" cy="66" r="10" fill="#9fd0ff"/></g><path d="M94 66 L106 66" stroke="#3a2a1a" stroke-width="3"/>
        <path d="M70 116 C72 150 90 162 100 162 C110 162 128 150 130 116 C122 132 112 138 100 138 C88 138 78 132 70 116 Z" fill="#3a3632"/><path d="M86 132 C92 128 108 128 114 132 C108 136 92 136 86 132 Z" fill="#3a3632"/>`,
      body: () => `<path d="M24 200 C28 166 62 152 88 150 L112 150 C138 152 172 166 176 200 Z" fill="#efe8da" stroke="#8a826a" stroke-width="2"/><path d="M62 200 L66 162 L134 162 L138 200 Z" fill="#7a5232" stroke="#3a2412" stroke-width="2"/>
        <path d="M150 170 L168 150" stroke="#6a4a2e" stroke-width="5"/><rect x="160" y="138" width="22" height="12" rx="2" fill="#8a8f98" transform="rotate(-48 171 144)"/>` },
    nagi: { face: 'chubby', bg: '#e8862c', line: '#4a1e0c',
      extra: `<path d="M60 78 C62 46 80 34 100 34 C122 34 138 46 140 78 C120 68 80 68 60 78 Z" fill="#d9534f" stroke="#7a2020" stroke-width="2"/><g fill="#fff" opacity=".85"><circle cx="80" cy="54" r="2.4"/><circle cx="96" cy="46" r="2.4"/><circle cx="112" cy="52" r="2.4"/><circle cx="126" cy="62" r="2.4"/><circle cx="88" cy="66" r="2.4"/></g>
        <path d="M100 36 C90 14 78 10 72 18 C78 26 88 32 100 36 Z M100 36 C110 14 122 10 128 18 C122 26 112 32 100 36 Z" fill="#d9534f" stroke="#7a2020" stroke-width="2"/><circle cx="66" cy="112" r="3" fill="#f2c14e"/><circle cx="134" cy="112" r="3" fill="#f2c14e"/>` },
    kurou: { face: 'long', bg: '#6d57a0', line: '#2a2436',
      extra: `<path d="M76 124 C80 150 92 162 100 162 C108 162 120 150 124 124 C116 136 108 140 100 140 C92 140 84 136 76 124 Z" fill="#e7e3ea"/><path d="M112 50 C120 70 122 96 116 118 C112 96 108 72 104 52 Z" fill="#1e1b2a"/>`,
      body: () => `<path d="M26 200 C30 166 62 150 88 148 L112 148 C138 150 170 166 174 200 Z" fill="#3e4256"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${30 + i * 18} ${166 - Math.sin(i / 8 * 3.14) * 16} l8 34 l8 -30 z" fill="#1e1b2a"/>`).join('')}<path d="M84 150 L100 176 L116 150" fill="#2a2e40"/>
        <g transform="translate(156 178)"><rect x="-8" y="-4" width="16" height="20" rx="4" fill="#b58cff" stroke="#3a2a5a" stroke-width="2"/><circle cx="0" cy="6" r="12" fill="#b58cff" opacity=".35"/></g>` },
    tsumugi: { face: 'round', bg: '#6aa84f', line: '#2a3a1a',
      extra: `<circle cx="66" cy="72" r="5" fill="#ff9ec4"/><circle cx="134" cy="72" r="5" fill="#ff9ec4"/><circle cx="72" cy="46" r="16" fill="#8fbf6a" stroke="#2a3a1a" stroke-width="1.8"/><circle cx="128" cy="46" r="16" fill="#8fbf6a" stroke="#2a3a1a" stroke-width="1.8"/>
        <circle cx="83" cy="103" r="15" fill="#fff" fill-opacity=".14" stroke="#5a4a3a" stroke-width="3.5"/><circle cx="117" cy="103" r="15" fill="#fff" fill-opacity=".14" stroke="#5a4a3a" stroke-width="3.5"/><path d="M98 102 L102 102" stroke="#5a4a3a" stroke-width="3"/>
        <path d="M112 44 C112 34 118 30 124 30 C124 38 120 42 112 44 Z M112 44 C106 36 100 36 96 38 C100 44 106 46 112 44 Z" fill="#5a9a3a"/>` },
    baldo: { face: 'square', bg: '#23324a', line: '#1a1008',
      extra: `<path d="M66 110 C66 150 86 170 100 170 C114 170 134 150 134 110 C124 128 112 134 100 134 C88 134 76 128 66 110 Z" fill="#eeeae2"/><path d="M82 124 C90 116 110 116 118 124 C110 130 90 130 82 124 Z" fill="#f8f6f0"/>
        <path d="M22 70 C60 40 140 40 178 70 C150 60 130 76 100 76 C70 76 50 60 22 70 Z" fill="#1b2638" stroke="#0a1018" stroke-width="2"/><path d="M60 58 C80 30 120 30 140 58 Z" fill="#23324a" stroke="#0a1018" stroke-width="2"/><path d="M130 42 C150 22 168 20 176 26 C164 30 150 36 136 48 Z" fill="#fff" stroke="#bbb"/><circle cx="100" cy="50" r="5" fill="#d8b24a"/>` },
    soyogi: { face: 'round', bg: '#b8a8e0', line: '#6a6a88',
      behind: `${[[40, 120, 34], [160, 120, 34], [30, 170, 30], [170, 170, 30], [60, 196, 26], [140, 196, 26]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f4f4fa" stroke="#c8c8dc" stroke-width="2"/>`).join('')}` ,
      extra: `<ellipse cx="100" cy="34" rx="30" ry="22" fill="#f4f4f8" stroke="#c8c8dc" stroke-width="2"/><ellipse cx="74" cy="42" rx="16" ry="12" fill="#f4f4f8"/><ellipse cx="126" cy="42" rx="16" ry="12" fill="#f4f4f8"/>
        <path d="M168 60 L168 200" stroke="#8a6a45" stroke-width="4"/>${[-8, 0, 8].map(dx => `<path d="M${168 + dx} 64 L${168 + dx} ${84 + Math.abs(dx)}" stroke="#bfe8ff" stroke-width="3"/><circle cx="${168 + dx}" cy="${86 + Math.abs(dx)}" r="3" fill="#dff6ff"/>`).join('')}` },
  };
  for (const [k, v] of Object.entries(RD)) if (P[k]) Object.assign(P[k], v);
  P.yomi.face = 'long'; P.yomi.bg = '#3b2566'; P.yomi.line = '#2a2436';
  // お店の 人（立ち絵）
  Object.assign(P, {
    shopW: { skin: '#d49a74', hair: '#8a3a2a', hairHi: '#c0604a', eye: '#4d3b2c', eyeShape: 'adult', brow: 'thick', age: 'adult', face: 'square', bg: '#5a5a62', line: '#2a1208',
      back: 'M64 92 C60 58 80 40 100 40 C120 40 140 58 136 92 L130 70 L120 80 L112 64 L102 76 L92 62 L84 78 L74 66 Z', front: [],
      extra: `<path d="M70 116 C72 150 90 164 100 164 C110 164 128 150 130 116 C122 132 112 138 100 138 C88 138 78 132 70 116 Z" fill="#8a3a2a"/><path d="M66 72 C80 64 120 64 134 72 L134 80 C120 72 80 72 66 80 Z" fill="#3a3a44"/>`,
      body: () => `<path d="M26 200 C30 166 62 152 88 150 L112 150 C138 152 170 166 174 200 Z" fill="#5a5a62"/><path d="M60 200 L64 160 L136 160 L140 200 Z" fill="#5a3a22"/><path d="M150 176 L176 140" stroke="#6a4a2e" stroke-width="6"/><rect x="164" y="124" width="26" height="14" rx="2" fill="#9aa0a8" transform="rotate(-54 177 131)"/>` },
    shopI: { skin: '#e8c4a0', hair: '#2a2a2a', hairHi: '#5a5a5a', eye: '#3a5a3a', eyeShape: 'soft', brow: 'soft', lash: true, face: 'round', bg: '#4a7a5a', line: '#1a1a1a',
      back: 'M58 102 C50 58 74 36 100 36 C128 36 150 58 142 102 L148 140 C138 150 126 146 124 132 L76 132 C74 146 62 150 52 140 Z',
      front: ['M62 96 C58 58 80 42 100 42 C122 42 142 58 138 96 C128 78 112 70 100 70 C86 70 72 78 62 96 Z'],
      extra: `<path d="M62 70 C80 60 120 60 138 70 L138 78 C120 68 80 68 62 78 Z" fill="#e8d8a0"/>`,
      body: () => `<path d="M34 200 C38 170 66 158 88 156 L112 156 C134 158 162 170 166 200 Z" fill="#4a7a5a"/><path d="M60 200 L64 168 L136 168 L140 200 Z" fill="#f4ecdb"/><circle cx="150" cy="182" r="10" fill="#e05050"/><circle cx="162" cy="188" r="9" fill="#f0a040"/>` },
  });
  function monster(kind, shadow) { const f = M[kind]; if (!f) return ''; return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${f(shadow)}</svg>`; }
  return { portrait, monster, species: speciesArt, P };
})();
