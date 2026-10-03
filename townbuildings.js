// 町ごとの外観。入口・住人・建物ID・室内・セーブには変更を加えない。
'use strict';
(() => {
  const K = window.KZ; if (!K?.townLife || typeof World === 'undefined') return;
  const B = World.Blocks;
  const profiles = {
    kazami: { wall: 4, roof: 3, form: 'gable', axis: 0 },
    shiomi: { wall: 0, roof: 3, form: 'patch', axis: 0 },
    minato: { wall: 6, roof: 3, form: 'gable', axis: 1 },
    oasis: { wall: 9, roof: 4, form: 'terrace' },
    kukuru: { wall: 4, roof: 7, form: 'dome' },
    hayate: { wall: 0, roof: 8, form: 'gable', axis: 0 },
    awa: { wall: 6, roof: 7, form: 'shell' },
    royal: { wall: 6, roof: 10, form: 'crown' },
    lucky: { wall: 4, roof: 10, form: 'stripe' },
    brave: { wall: 6, roof: 1, form: 'battlement' }
  };
  const buildings = [];
  function restyle(h, town) {
    const profile = profiles[town.key]; if (!profile || !h.npc || /^ruin/.test(h.id || '')) return;
    const cx = Math.round(h.x), cz = Math.round(h.z); let base = Infinity;
    for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) base = Math.min(base, Math.floor(K.hAt(cx + x + .5, cz + z + .5)));
    const fy = base + 1;
    const put = (x, y, z, type) => { const X = cx + x, Z = cz + z;
      // 保存済みのプレイヤーブロックを上書きしない。
      if (B.has(X, y, Z) && !B.isProt(X, y, Z)) return;
      B.set(X, y, Z, type, true, town.r);
    };
    // 元の屋根だけを外す。窓・戸口・隣の建物は触らない。
    for (let k = 0; k < 5; k++) { const hf = 4 - k;
      for (let x = -hf; x <= hf; x++) for (let z = -hf; z <= hf; z++) {
        if (k < 4 && Math.abs(x) < hf && Math.abs(z) < hf) continue;
        if (B.isProt(cx + x, fy + 3 + k, cz + z)) B.rm(cx + x, fy + 3 + k, cz + z, town.r);
      }
    }
    for (let k = 0; k < 3; k++) for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
      if (Math.abs(x) !== 3 && Math.abs(z) !== 3) continue;
      // 存在しない戸口は埋めず、窓の高さはそのまま。
      if (k === 1 || !B.has(cx + x, fy + k, cz + z) || !B.isProt(cx + x, fy + k, cz + z)) continue;
      put(x, fy + k, z, town.key === 'shiomi' && (x + z + k) % 3 === 0 ? 6 : profile.wall);
    }
    for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
      const u = profile.axis ? z : x, edge = Math.max(Math.abs(x), Math.abs(z));
      let height = 0, type = profile.roof;
      switch (profile.form) {
        case 'gable': height = 4 - Math.abs(u); break;
        case 'patch': height = 4 - Math.abs(x); type = (x + z) % 3 === 0 ? 0 : 3; break;
        case 'terrace': height = edge === 4 ? 1 : 0; break;
        case 'dome': height = Math.max(0, 4 - Math.ceil(Math.hypot(x, z))); break;
        case 'shell': height = Math.max(0, 4 - Math.abs(x) - Math.floor(Math.abs(z) / 2)); type = z % 2 ? 7 : 4; break;
        case 'crown': height = edge === 4 ? ((x + z) % 2 === 0 ? 2 : 1) : 0; break;
        case 'stripe': height = 4 - Math.abs(z); type = x % 2 ? 3 : 10; break;
        case 'battlement': height = edge === 4 && (x + z) % 2 === 0 ? 1 : 0; break;
      }
      // 閉じた屋根にし、室内へ雨が抜ける穴を作らない。
      for (let y = 0; y <= height; y++) put(x, fy + 3 + y, z, type);
    }
    // 閉屋根の軒を木の縁でそろえ、壁との境目を見分けやすくする。
    for (let a = -4; a <= 4; a++) {
      put(a, fy + 3, -4, 5); put(a, fy + 3, 4, 5);
      put(-4, fy + 3, a, 5); put(4, fy + 3, a, 5);
    }
    if (profile.form === 'gable' || profile.form === 'patch' || profile.form === 'stripe') {
      const axis = profile.form === 'stripe' ? 1 : profile.axis;
      for (let a = -4; a <= 4; a++) put(axis ? a : 0, fy + 7, axis ? 0 : a, 5);
    }
    if (town.key === 'hayate') { // 風車の町の小さな風見
      for (let y = 0; y < 3; y++) put(0, fy + 7 + y, 0, 5);
      for (let a = -1; a <= 1; a++) { put(a, fy + 8, 0, 0); put(0, fy + 8 + a, 0, 0); }
    }
    buildings.push({ id: h.id, town: town.key, r: town.r, form: profile.form, roofClosed: true, npc: { ...h.npc } });
  }
  const originalRegion = World.region;
  for (let r = 0; r < K.REG.length; r++) {
    World.setRegion(r);
    const towns = K.townLife.TOWNS.filter(t => t.r === r && profiles[t.key] && t.at());
    const homes = [...(K.REG[r].houses || []), ...(K.extraHouses || []).filter(h => h.r === r)];
    for (const h of new Set(homes)) {
      const town = towns.slice().sort((a, b) => Math.hypot(h.x - a.at().x, h.z - a.at().z) - Math.hypot(h.x - b.at().x, h.z - b.at().z))[0];
      if (town && Math.hypot(h.x - town.at().x, h.z - town.at().z) < 65) restyle(h, town);
    }
  }
  World.setRegion(originalRegion);
  K.townBuildings = { profiles, buildings };
})();
