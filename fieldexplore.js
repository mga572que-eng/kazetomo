// フィールドの寄り道。章進行と既存の地形・目的地は変更しない。
'use strict';
(() => {
  const K = window.KZ; if (!K || typeof World === 'undefined') return;
  const W = World, B = W.Blocks, H = K.HOOK;
  const specs = [
    ['かぜの いしもん', 'arch', 'いしの あいだから、 まちの やねが ちいさく みえる。', 'しずく'],
    ['みはらしの こしかけ', 'camp', 'ひとやすみすると、 くさの ゆれる おとが きこえる。', 'パン'],
    ['みさきの みちしるべ', 'tower', 'たかい いしの うえで、 ランタンが ひかっている。', 'しずく'],
    ['すなの いしもん', 'arch', 'いしもんの かげは、 ひなたより すこし すずしい。', 'しずく'],
    ['たびの やすみば', 'camp', 'みなとへ もどるか、 もうすこし さきへ いくか。 ここで きめよう。', 'パン'],
    ['ほしの いしならべ', 'ring', 'まるく ならんだ いし。 すきまから そらを のぞいてみる。', 'しずく'],
    ['くもの いしもん', 'arch', 'くもの あいまに、 とおい しまが ちらりと みえる。', 'しずく'],
    ['かぜまちの やすみば', 'camp', 'かぜが ふくたび、 ランタンの ひが ゆれる。', 'パン'],
    ['そらの みちしるべ', 'tower', 'いしの かげが、 くもに ながく のびている。', 'しずく'],
    ['あわの いしもん', 'arch', 'あわが いしもんを とおりぬけて、 うえへ のぼっていく。', 'しずく'],
    ['しんかいの やすみば', 'camp', 'みずの おとは しずかだ。 あしを とめて まわりを みてみよう。', 'パン'],
    ['ひかりの いしならべ', 'ring', 'ちいさな ひかりが、 いしの まわりを ゆっくり めぐっている。', 'しずく'],
  ];
  const sites = [], trails = [];
  const init = g => { g.fieldExplore ||= {}; };
  init(K.G); H.load.push(init); H.init.push(init);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  function avoid(r, x, z) {
    const p = { x, z }, R = K.REG[r];
    const objects = [...(R.houses || []), ...(R.beacons || []), ...(R.lh || []), ...(K.extraHouses || []).filter(h => h.r === r), ...(K.NPCS || []).filter(n => n.r === r), ...(K.townLife?.TOWNS || []).filter(t => t.r === r).map(t => t.at()), ...(DATA.shrines || []).filter(s => s.r === r).map(s => s.pos), ...Object.values(R).filter(o => o && Number.isFinite(o.x) && Number.isFinite(o.z))];
    if (objects.some(o => o && dist(p, o) < 10)) return true;
    if ([...(R.trees || []), ...(R.rocks || [])].some(o => o.state !== 'gone' && dist(p, o) < 6)) return true;
    if ((K.extraAreas || []).some(a => a.rg === r && /^(lhd|room|interior)/.test(a.id || '') && dist(p, a) < (a.r || 20) + 8)) return true;
    return sites.some(s => s.r === r && dist(p, s) < 24);
  }
  function suitable(r, x, z) {
    if (Math.abs(x) > 210 || Math.abs(z) > 210 || avoid(r, x, z)) return false;
    const h = K.hAt(x, z), min = r === 2 ? 8 : r === 3 ? -30 : 1;
    if (!Number.isFinite(h) || h < min) return false;
    for (let dx = -4; dx <= 4; dx += 2) for (let dz = -4; dz <= 4; dz += 2) {
      const y = K.hAt(x + dx, z + dz);
      if (Math.abs(y - h) > 1.8 || K.blocked(x + dx, z + dz, y)) return false;
      for (let dy = 0; dy <= 7; dy++) if (B.has(x + dx, Math.floor(y) + dy, z + dz)) return false;
    }
    return true;
  }
  const original = W.region;
  for (let r = 0; r < 4; r++) {
    W.setRegion(r); const town = K.REG[r].town;
    const anchors = r === 0 ? K.REG[0].beacons : r === 3 ? K.REG[3].lh : r === 2 ? [K.hayate, K.REG[2].town] : [K.oasis, ...(K.townLife?.TOWNS || []).filter(t => t.r === r && t.key !== 'minato').map(t => t.at())];
    for (let i = 0; i < 3; i++) {
      const anchor = anchors[i % anchors.length] || town;
      const base = { x: town.x * .55 + anchor.x * .45, z: town.z * .55 + anchor.z * .45 };
      let chosen;
      // 決定的な配置。旧セーブを読み込んでも場所が変わらない。
      for (let j = 0; j < 220 && !chosen; j++) {
        const a = (j * 2.399963 + i * 2.1), d = 12 + Math.floor(j / 16) * 5;
        const x = Math.round(base.x + Math.cos(a) * d), z = Math.round(base.z + Math.sin(a) * d);
        if (suitable(r, x, z)) chosen = { x, z };
      }
      if (!chosen) continue; const [name, kind, text, item] = specs[r * 3 + i];
      const s = { id: `field_r${r}_${i}`, r, ...chosen, name, kind, text, item: item === 'パン' ? 'pan' : 'shizuku' };
      s.y = K.hAt(s.x, s.z); sites.push(s);
      const put = (x, h, z, t) => { const X = s.x + x, Z = s.z + z, Y = Math.floor(K.hAt(X + .5, Z + .5)) + h - 1;
        if (!B.has(X, Y, Z)) B.set(X, Y, Z, t, true, r);
      };
      const stone = r === 0 ? 6 : r === 1 ? 9 : r === 2 ? 4 : 6;
      if (kind === 'arch') {
        for (const x of [-3, 3]) for (let y = 1; y <= 5; y++) for (const z of [0, 1]) put(x, y, z, stone);
        for (let x = -3; x <= 3; x++) for (const z of [0, 1]) put(x, 6, z, stone);
        put(-3, 7, 0, 2); put(3, 7, 0, 2);
      } else if (kind === 'tower') {
        for (let y = 1; y <= 8; y++) { put(-3, y, 0, stone); if (y < 4) put(-4, y, 0, stone); }
        put(-3, 9, 0, 2); put(3, 1, 0, stone); put(3, 2, 0, 2);
      } else if (kind === 'ring') {
        for (const [x, z] of [[-3, -2], [0, -3], [3, -2], [3, 2], [0, 3], [-3, 2]]) { put(x, 1, z, stone); put(x, 2, z, 2); }
      } else {
        for (const x of [-3, 3]) { put(x, 1, 0, 0); put(x, 1, 1, 0); put(x, 1, 2, 0); }
        put(-3, 2, 3, 5); put(-3, 3, 3, 2);
      }
      // 小道は歩ける近距離だけ。崖や水面を越える道は描かない。
      for (let k = 1; k <= 10; k++) {
        const x = s.x + (town.x - s.x) / Math.hypot(town.x - s.x, town.z - s.z) * k * 2.2;
        const z = s.z + (town.z - s.z) / Math.hypot(town.x - s.x, town.z - s.z) * k * 2.2, y = K.hAt(x, z);
        if (Math.abs(y - K.hAt(x - (x - s.x) / k, z - (z - s.z) / k)) > .9 || y < (r === 2 ? 8 : r === 3 ? -30 : 1) || K.blocked(x, z, y)) break;
        trails.push({ r, x, z, y });
      }
    }
  }
  W.setRegion(original);
  let trailMesh;
  if (W.makeMesh && W.Geo) { const g = W.Geo(); W.ico(g, .25, [0, .04, 0], W.solid([.7, .65, .5]), 0, 0, .25); trailMesh = W.makeMesh(g, 40); }
  H.frame.push(() => { if (!trailMesh) return; trailMesh.n = 0; for (const p of trails) if (p.r === K.region && dist(p, K.player) < 75 && trailMesh.n < trailMesh.maxN) trailMesh.set(trailMesh.n++, p.x, p.y + .02, p.z, 1, 0); });
  H.fx.push((fx, dt, time) => { for (const s of sites) if (s.r === K.G.region && dist(s, K.player) < 35 && !K.G.fieldExplore?.[s.id]) fx.push({ type: 1, p: [s.x + .5, s.y + 1.1 + Math.sin(time) * .15, s.z + .5], size: [.45, .45], grow: 1, tint: [.8, 1, .55] }); });
  H.target.push(cand => { for (const s of sites) if (s.r === K.G.region && Math.abs(K.player.y - s.y) < 3) cand(s, 'fieldDiscover', s.x + .5, s.z + .5, 2.4); });
  H.labels.fieldDiscover = t => `${t.o.name}を しらべる`;
  H.acts.fieldDiscover = async s => {
    if (!sites.includes(s) || K.G.region !== s.r) return; init(K.G);
    if (K.G.fieldExplore[s.id]) { await K.say([s.text, 'ここは もう たんさくずみだ。']); return; }
    K.G.fieldExplore[s.id] = 1; K.G.gold += 60; K.gain(s.item, 1);
    const lines = [`【${s.name}を みつけた！】`, s.text, `ちいさな はこに、 60ゴールドと ${DATA.items[s.item].name}が はいっていた。`];
    const group = sites.filter(a => a.r === s.r), count = group.filter(a => K.G.fieldExplore[a.id]).length;
    if (count === 3 && group.length === 3) { K.G.gold += 180; lines.push('この ちいきの よりみちを 3つ みつけた！', 'たんさくの ごほうび：180ゴールド。'); }
    else lines.push(`この ちいきの よりみち ${count}/${group.length}`);
    await K.say(lines); K.save(); K.hud();
  };
  H.menu.push(() => ({ label: 'たんさく帳', sub: `よりみち ${sites.filter(s => K.G.fieldExplore?.[s.id]).length}/${sites.length}`, fn: async () => {
    const list = sites.filter(s => s.r === K.G.region), seen = list.filter(s => K.G.fieldExplore?.[s.id]);
    await K.say([`【この ちいきの よりみち ${seen.length}/${list.length}】`, ...list.map(s => K.G.fieldExplore?.[s.id] ? `✓ ${s.name}` : '？ まだ みつけていない ばしょ'), 'まちの そとで、 いしもんや ランタンを さがしてみよう。']);
  } }));
  H.mapMarks.push((r, pos) => sites.filter(s => s.r === r && K.G.fieldExplore?.[s.id]).map(s => `<span class="mk lit" style="${pos(s.x, s.z)}" title="${s.name}">★</span>`));
  K.fieldExplore = { sites, trails };
})();
