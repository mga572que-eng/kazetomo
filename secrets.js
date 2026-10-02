// ダンジョンの かくし部屋 — 面白さ部署 ④の つづき（docs/design/fun-audit.md）
// ・試練の祠：クリアすると、祠の 奥の すみの 柱の 上に 宝箱が 見える（壁を のぼって 取る。クリア前は のぼれない）
// ・灯台の なか：一の間の 右の 壁に「ひび」。おすと くずれて、小さな かくし部屋と 宝箱
// ・宝箱は 宝箱の 演出（光）で 開く。中身は 星のかけらと お金（地方で ふえる）
// セーブ：G.secret（開けた かくし宝箱）だけ 追加
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return; const H = K.HOOK, W = World, B = W.Blocks, G = () => K.G;
  const mChest = W.makeMesh(W.propGeo('chest'), 16);
  const got = id => !!((G().secret || {})[id]);
  const dist3 = (p, x, y, z) => Math.hypot(p.x - x, p.z - z) + Math.abs(p.y - y) * .6;
  const LOOT = r => ({ gold: [300, 600, 900, 1200][r] || 300, give: { hoshikake: r >= 2 ? 2 : 1 } });
  async function open(id, r, where) { const g = G(); g.secret = g.secret || {}; if (g.secret[id]) return; g.secret[id] = 1; const L = LOOT(r);
    if (K.fun && K.fun.reveal) await K.fun.reveal('rare', `星のかけら ×${L.give.hoshikake}`, `${where}の かくし宝箱`);
    g.gold += L.gold; for (const [k, v] of Object.entries(L.give)) K.gain(k, v);
    await K.say(['かくし宝箱を 見つけた！', `${L.gold}ゴールドと 星のかけら ${L.give.hoshikake}こを 手に入れた！`, `（かくし宝箱 ${Object.keys(g.secret).length}こめ）`]); K.hud(); K.save(); }
  // ---------- 試練の祠：奥の すみの 柱の 上 ----------
  const shSpot = sh => sh.pos ? { x: sh.pos.x - 7 + .5, y: sh.pos.y + 5, z: sh.pos.z - 7 + .5 } : null;
  const shDone = sh => !!((G().shrineDone || {})[sh.id]);
  // ---------- 灯台の なか：一の間の 右の 壁の ひび ----------
  const LH = () => K.lhDungeon; let broken = null; // いま くずれて いる 回廊（入りなおすと 壁は もどる）
  const crack = d => ({ x: d.x + 6.6, y: d.y + 1, z: d.z - 11.5 });
  const lhChest = d => ({ x: d.x + 9 + .5, y: d.y + 1, z: d.z - 12 + .5 });
  const lhId = d => 'lh:' + (LH() && LH().key ? LH().key(d) : d.name);
  // かくし部屋は 回廊の 外がわ（右）に あるので、くずした 回廊の かくし部屋の 中も「いま いる 灯台」とみなす
  const inAlcove = (d, p = K.player) => d && G().region === d.r && p.x > d.x + 7 && p.x < d.x + 11 && p.z > d.z - 14.5 && p.z < d.z - 9.5 && Math.abs(p.y - d.y - 1) < 3;
  const cur = () => { const d = LH() && LH().here && LH().here(); return d || (inAlcove(broken) ? broken : null); };
  function breakWall(d) { const r = d.r, prev = W.region; W.setRegion(r); try { const S = (a, h, b, t) => B.set(d.x + a, d.y + h, d.z + b, t, true, r);
      for (let h = 1; h <= 2; h++) B.rm(d.x + 7, d.y + h, d.z - 12, r);
      for (let a = 8; a <= 10; a++) for (let b = -14; b <= -10; b++) { S(a, -1, b, 1); S(a, 0, b, 6); S(a, 3, b, 6); const wall = a === 10 || b === -14 || b === -10; for (let h = 1; h <= 2; h++) if (wall) S(a, h, b, a === 10 && b === -12 && h === 2 ? 2 : 6); else B.rm(d.x + a, d.y + h, d.z + b, r); }
    } finally { W.setRegion(prev); } broken = d; try { Music.sfx('stamp'); } catch (_) {} }
  // ---------- 描く・しらべる ----------
  H.frame.push((dt, T) => { mChest.n = 0; if (K.phase !== 'field') return; const r = G().region, p = K.player; let n = 0;
    for (const sh of DATA.shrines || []) { if (sh.r !== r || !shDone(sh) || got('sh:' + sh.id)) continue; const s = shSpot(sh); if (!s || Math.hypot(s.x - p.x, s.z - p.z) > 90) continue; if (n < 16) mChest.set(n++, s.x, s.y, s.z, 1, Math.PI / 4); }
    const d = cur(); if (d && broken === d && !got(lhId(d))) { const c = lhChest(d); mChest.set(n++, c.x, c.y, c.z, 1, -Math.PI / 2); }
    if (!d) broken = null; // 回廊を 出たら わすれる（入りなおすと 壁は もどる）
    mChest.n = n; });
  H.target.push(cand => { const r = G().region, p = K.player;
    for (const sh of DATA.shrines || []) { if (sh.r !== r || !shDone(sh) || got('sh:' + sh.id)) continue; const s = shSpot(sh); if (s && dist3(p, s.x, s.y, s.z) < 2.2) cand({ sh }, 'secShrine', s.x, s.z, 2); }
    const d = cur(); if (!d) return;
    if (broken !== d) { const c = crack(d); if (dist3(p, c.x, c.y, c.z) < 2) cand({ d }, 'secCrack', c.x, c.z, 1.8); }
    else if (!got(lhId(d))) { const c = lhChest(d); if (dist3(p, c.x, c.y, c.z) < 2.2) cand({ d }, 'secLh', c.x, c.z, 2); } });
  H.labels.secShrine = 'かくし宝箱を あける'; H.labels.secLh = 'かくし宝箱を あける'; H.labels.secCrack = 'かべの ひびを しらべる';
  H.acts.secShrine = async ({ sh }) => open('sh:' + sh.id, sh.r, sh.name);
  H.acts.secLh = async ({ d }) => open(lhId(d), d.r, d.name);
  H.acts.secCrack = async ({ d }) => { await K.say(['かべに ほそい ひびが 入っている。 ……風が すこし ぬけてくる。']); if (!(await K.confirm('おして みる？'))) return; breakWall(d); await K.say(['ガラガラ……！ かべが くずれて、小さな へやが あらわれた！']); };
  if (DATA.titles && !DATA.titles.some(t => t.id === 't_secret5')) DATA.titles.push({ id: 't_secret5', name: 'ひみつの 発見者', desc: 'かくし宝箱を 5こ 見つける', ok: g => Object.keys(g.secret || {}).length >= 5 });
  H.load.push(g => { g.secret = g.secret || {}; broken = null; });
  K.secrets = { open, shSpot, crack, lhChest, breakWall, get broken() { return broken; } };
})();
