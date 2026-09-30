// ともしびアイランド — はさまり 救出（うごけなく なったら 自動で ぬけだす）＋ メニューの「ぬけだす」
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK, B = World.Blocks;
  const blocked = (x, z, y) => { for (const [ox, oz] of [[-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]]) { const cx = Math.floor(x + ox), cz = Math.floor(z + oz); for (let iy = Math.floor(y + .05); iy <= Math.floor(y + 1.7); iy++) if (B.has(cx, iy, cz)) return true; } return false; };
  function freeSpot(P) { for (let r = .7; r <= 6; r += .45) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r; const y = K.surfaceAt(x, z, P.y + 2.5);
      if (y - P.y > 3.2 || y < K.hAt(x, z) - .1) continue; if (!blocked(x, z, y) && !blocked(x, z, y + .3)) return { x, z, y }; } return null; }
  function rescue(msg) { const P = K.player; const s = freeSpot(P) || (P.safe && { x: P.safe.x, z: P.safe.z, y: K.surfaceAt(P.safe.x, P.safe.z, 99) }); if (!s) return false;
    P.x = s.x; P.z = s.z; P.y = s.y + .05; P.vx = P.vz = P.vy = 0; if (msg) K.toast(msg, 1400); return true; }
  K.rescue = rescue;
  let stuckT = 0, lx = 0, lz = 0, ly = 0;
  H.frame.push(dt => { const P = K.player; if (K.phase !== 'field' || K.busy || K.G.build) { stuckT = 0; return; }
    const want = Math.hypot(P.vx, P.vz), moved = Math.hypot(P.x - lx, P.z - lz) + Math.abs(P.y - ly); lx = P.x; lz = P.z; ly = P.y;
    const inside = blocked(P.x, P.z, P.y + .1);
    const wedged = want > 1.2 && moved < .01 * Math.max(1, dt * 60) && [[.55, 0], [-.55, 0], [0, .55], [0, -.55]].filter(([a, b]) => blocked(P.x + a, P.z + b, P.y) && blocked(P.x + a, P.z + b, P.y + 1.05)).length >= 3;
    if (inside) stuckT += dt * 2; else if (wedged) stuckT += dt; else stuckT = Math.max(0, stuckT - dt * 2);
    if (stuckT > 1.6) { stuckT = 0; rescue('はさまっていたので ぬけだした'); } });
  H.menu.push(() => ({ label: 'ぬけだす', sub: 'うごけない とき', fn: async () => { if (!rescue('ちかくの 安全な 場所へ ぬけだした')) K.toast('いまは その ひつようは ない', 1200); } }));
})();
