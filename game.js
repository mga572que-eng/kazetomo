// 風灯の島 — game logic v3 (第1章＋第2章：大陸・図鑑・クラフト・料理・探索)
'use strict';
(() => {
const COARSE = matchMedia('(pointer:coarse)').matches;
const DEBUG = location.hash === '#debug';
const cv = document.getElementById('game');
if (!World.init(cv, COARSE || DEBUG)) { document.getElementById('fallback').hidden = false; return; }
const { hAt, nAt, surfaceAt, Blocks, V, clamp, lerp, smooth } = World;
const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const R = Math.random;
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const SPC = DATA.species;
// 拡張用フック（settings.js / fishing.js / shrines.js / base.js / ch4.js などが使う）
const HOOK = { frame: [], fx: [], target: [], objective: [], menu: [], load: [], init: [], song: [], push: [], battleEnd: [], mapMarks: [], quest: [], warps: [], actors: [], calc: [], gain: [], saved: [], labels: {}, acts: {}, talks: {}, OPT: { text: 1, look: 1, calm: false, lefty: false } };

// ================= helpers for building =================
function buildHouse(h, style = {}) {
  const cx = Math.round(h.x), cz = Math.round(h.z); let base = 1e9; const wallT = style.wall ?? 4, roofT = style.roof ?? 3, cornerT = style.corner ?? 5;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) base = Math.min(base, Math.floor(hAt(cx + dx + .5, cz + dz + .5)));
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const t = Math.floor(hAt(cx + dx + .5, cz + dz + .5)); for (let y = Math.min(t, base); y <= base; y++) Blocks.set(cx + dx, y, cz + dz, 1, true); }
  const fy = base + 1; const tx = h.face ? h.face[0] : 0, tz = h.face ? h.face[1] : 0; const ddx = tx - cx, ddz = tz - cz; let door;
  if (Math.abs(ddx) > Math.abs(ddz)) door = [cx + 2 * Math.sign(ddx), cz]; else door = [cx, cz + 2 * Math.sign(ddz)];
  for (let k = 0; k < 3; k++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (Math.abs(dx) < 2 && Math.abs(dz) < 2) continue; const x = cx + dx, z = cz + dz;
    if (x === door[0] && z === door[1] && k < 2) continue;
    const corner = Math.abs(dx) === 2 && Math.abs(dz) === 2; const mid = (dx === 0 || dz === 0);
    Blocks.set(x, fy + k, z, corner ? cornerT : (k === 1 && mid) ? (style.window ?? 2) : wallT, true); }
  for (let k = 0; k < 4; k++) { const hf = 3 - k; for (let dx = -hf; dx <= hf; dx++) for (let dz = -hf; dz <= hf; dz++) { if (k < 3 && Math.abs(dx) < hf && Math.abs(dz) < hf) continue; Blocks.set(cx + dx, fy + 3 + k, cz + dz, roofT, true); } }
  const dir = [Math.sign(door[0] - cx), Math.sign(door[1] - cz)];
  h.npc = { x: door[0] + .5 + dir[0] * 1.6, z: door[1] + .5 + dir[1] * 1.6 }; h.yaw = Math.atan2(dir[0], dir[1]);
}
function buildPier(x0, z0, dirZ, len) { for (let i = 0; i < len; i++) for (let w = -1; w <= 1; w++) { const x = x0 + w, z = z0 + i * dirZ; const t = Math.floor(hAt(x + .5, z + .5));
    Blocks.set(x, Math.max(0, Math.min(t, 1)), z, 0, true); if (t < 0 && w !== 0 && i % 4 === 0) for (let y = Math.max(t, -3); y < 0; y++) Blocks.set(x, y, z, 5, true); } }
const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// ================= region 0: 風灯の島 =================
const REG = [{}, {}, {}, {}];
{
  const r = REG[0]; World.setRegion(0);
  r.beacons = [];
  for (let s = 0; s < 5; s++) { let best = null;
    for (let a = s * 72 + 8; a < (s + 1) * 72 - 8; a += 3) for (let rr = 70; rr < 215; rr += 5) { const x = Math.cos(a * Math.PI / 180) * rr, z = Math.sin(a * Math.PI / 180) * rr, h = hAt(x, z); if (h > 2.5 && (!best || h > best.h)) best = { x, z, h }; }
    if (!best) { const a = (s * 72 + 36) * Math.PI / 180; best = { x: Math.cos(a) * 80, z: Math.sin(a) * 80, h: Math.max(1, hAt(Math.cos(a) * 80, Math.sin(a) * 80)) }; }
    r.beacons.push({ i: s, x: best.x, z: best.z, y: best.h - .25, lit: false, guard: false, t: 0 }); }
  let sh = null; for (let x = -250; x <= 250; x += 4) for (let z = -250; z <= 250; z += 4) { const h = hAt(x, z); if (Math.hypot(x, z) > 60 && r.beacons.every(b => Math.hypot(b.x - x, b.z - z) > 35) && (!sh || h > sh.h)) sh = { x, z, h }; }
  sh.y = sh.h; r.shrine = sh;
  r.houses = [{ id: 'yui', x: -14, z: -6, face: [0, 0] }, { id: 'gen', x: 13, z: -9, face: [0, 0] }, { id: 'nagi', x: 3, z: 15, face: [0, 0] }]; r.houses.forEach(h => buildHouse(h));
  for (const [x, z] of [[-6, 6], [6, 6], [-6, -6], [7, 3]]) { const b = Math.floor(hAt(x + .5, z + .5)); Blocks.set(x, b, z, 5, true); Blocks.set(x, b + 1, z, 5, true); Blocks.set(x, b + 2, z, 2, true); }
  let pz = 20; while (pz < 250 && hAt(4.5, pz) > .15) pz += 1; r.pier = { x: 4.5, z: pz + 5 }; buildPier(4, pz - 3, 1, 12); r.ship = { x: 4.5, z: pz + 13, yaw: 0 };
  r.town = { x: 0, z: 0 }; r.home = r.houses[0];
  r.statue = { x: -4, z: 9 }; r.fire = { x: 5, z: -2 };
  // ---- 灯台の試練の しかけ ----
  const tr = rng(4242);
  r.beacons.forEach(b => { b.fireAt = [b.x, b.y + 4.05, b.z]; b.act = { x: b.x, z: b.z, y: b.y }; });
  { const b = r.beacons[0]; b.shards = []; for (let k = 0; k < 3; k++) { const a = k * 2.1 + tr() * 1.2, d = 11 + tr() * 12; const x = b.x + Math.cos(a) * d, z = b.z + Math.sin(a) * d; b.shards.push({ x, z, y: hAt(x, z) }); } }
  { const b = r.beacons[1]; const l = Math.hypot(b.x, b.z) || 1; const dx = -b.x / l, dz = -b.z / l; const cx = Math.round(b.x + dx * 5), cz = Math.round(b.z + dz * 5);
    let base = 1e9; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) base = Math.min(base, Math.floor(hAt(cx + i + .5, cz + j + .5)));
    const top = base + 10; for (let y = base; y < top; y++) for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) Blocks.set(cx + i, y, cz + j, (y + i + j) % 5 === 0 ? 1 : 6, true);
    Blocks.set(cx, top, cz, 2, true); b.act = { x: cx + .5, z: cz + .5, y: top, top: true }; b.fireAt = [cx + .5, top + 1.3, cz + .5]; }
  { const b = r.beacons[4]; const l = Math.hypot(b.x, b.z) || 1; const dx = b.x / l, dz = b.z / l; let d = 13, px, pz; const py = Math.floor(b.y) + 1;
    for (; d < 26; d++) { px = Math.round(b.x + dx * d); pz = Math.round(b.z + dz * d); if (hAt(px, pz) < py - 2.5) break; }
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) Blocks.set(px + i, py, pz + j, 0, true); Blocks.set(px, py + 1, pz, 2, true);
    b.act = { x: px + .5, z: pz + .5, y: py + 1, top: true }; b.fireAt = [px + .5, py + 2.4, pz + .5]; }
}
// ================= region 1: 霧の大陸 =================
{
  const r = REG[1]; World.setRegion(1);
  const [TX, TZ] = World.TOWN1;
  r.town = { x: TX, z: TZ };
  r.houses = [{ id: 'inn', x: TX - 13, z: TZ - 4 }, { id: 'item', x: TX - 7, z: TZ - 14 }, { id: 'weapon', x: TX + 8, z: TZ - 13 }, { id: 'lab', x: TX + 14, z: TZ - 2 }, { id: 'guild', x: TX - 2, z: TZ - 21 }];
  r.houses.forEach((h, i) => { h.face = [TX, TZ]; buildHouse(h, i % 2 ? { wall: 6, roof: 3 } : { wall: 4, roof: 3 }); });
  for (const [x, z] of [[TX - 5, TZ + 5], [TX + 5, TZ + 5], [TX - 5, TZ - 6], [TX + 5, TZ - 6]]) { const b = Math.floor(hAt(x + .5, z + .5)); Blocks.set(x, b, z, 6, true); Blocks.set(x, b + 1, z, 6, true); Blocks.set(x, b + 2, z, 2, true); }
  let pz = TZ + 10; while (pz < 262 && hAt(6.5, pz) > .15) pz += 1; r.pier = { x: 6.5, z: pz + 5 }; buildPier(6, pz - 3, 1, 12); r.ship = { x: 6.5, z: pz + 13, yaw: 0 };
  r.board = { x: TX + 2, z: TZ - 16 }; r.statue = { x: TX, z: TZ + 4 }; r.fire = { x: TX - 4, z: TZ + 1 };
  r.home = r.houses[0];
  const [RX, RZ] = World.RUINS1; const CW = 11, CS = 3; const ox = RX - 17, oz = RZ - 17; const rr = rng(77);
  const vis = Array.from({ length: CW }, () => Array(CW).fill(false)); const open = new Set(); const key = (a, b, c, d) => `${a},${b}|${c},${d}`;
  const st = [[0, 5]]; vis[0][5] = true;
  while (st.length) { const [cx, cz] = st[st.length - 1]; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [cx + dx, cz + dz]).filter(([x, z]) => x >= 0 && z >= 0 && x < CW && z < CW && !vis[x][z]);
    if (!nb.length) { st.pop(); continue; } const [nx, nz] = nb[Math.floor(rr() * nb.length)]; vis[nx][nz] = true; open.add(key(cx, cz, nx, nz)); open.add(key(nx, nz, cx, cz)); st.push([nx, nz]); }
  for (let k = 0; k < 10; k++) { const cx = 1 + Math.floor(rr() * (CW - 2)), cz = 1 + Math.floor(rr() * (CW - 2)); open.add(key(cx, cz, cx + 1, cz)); open.add(key(cx + 1, cz, cx, cz)); }
  const base = Math.floor(hAt(RX, RZ)); const G1 = CW * CS + 1;
  for (let i = 0; i < G1; i++) for (let j = 0; j < G1; j++) {
    const onX = i % CS === 0, onZ = j % CS === 0; if (!onX && !onZ) continue;
    let wall = true;
    if (onX && !onZ) { const cx = i / CS, cz = Math.floor(j / CS); if (cx > 0 && cx < CW && open.has(key(cx - 1, cz, cx, cz))) wall = false; if (cx === 0 && cz === 5) wall = false; }
    if (onZ && !onX) { const cz = j / CS, cx = Math.floor(i / CS); if (cz > 0 && cz < CW && open.has(key(cx, cz - 1, cx, cz))) wall = false; }
    if (!wall) continue; const hgt = (i * 7 + j * 13) % 11 === 0 ? 2 : 3;
    for (let y = 0; y < hgt; y++) Blocks.set(ox + i, base + y, oz + j, (i + j + y) % 9 === 0 ? 8 : 6, true); }
  const cellW = (cx, cz) => ({ x: ox + cx * CS + 2, z: oz + cz * CS + 2 });
  const dist = Array.from({ length: CW }, () => Array(CW).fill(-1)); dist[0][5] = 0; const q = [[0, 5]]; let far = [0, 5];
  while (q.length) { const [cx, cz] = q.shift(); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, nz = cz + dz; if (nx < 0 || nz < 0 || nx >= CW || nz >= CW || dist[nx][nz] >= 0 || !open.has(key(cx, cz, nx, nz))) continue; dist[nx][nz] = dist[cx][cz] + 1; q.push([nx, nz]); if (dist[nx][nz] > dist[far[0]][far[1]]) far = [nx, nz]; } }
  r.altar = { ...cellW(far[0], far[1]), y: base };
  let mid = null; for (let x = 0; x < CW; x++) for (let z = 0; z < CW; z++) if (!mid && dist[x][z] === Math.floor(dist[far[0]][far[1]] / 2)) mid = [x, z];
  r.midboss = { ...cellW(mid[0], mid[1]), y: base };
  const ends = []; for (let x = 0; x < CW; x++) for (let z = 0; z < CW; z++) { const deg = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => open.has(key(x, z, x + dx, z + dz))).length; if (deg === 1 && !(x === far[0] && z === far[1]) && !(x === 0 && z === 5)) ends.push([x, z, dist[x][z]]); }
  ends.sort((a, b) => b[2] - a[2]);
  const loot = [{ gear: ['sora', 4] }, { gold: 800 }, { give: { hoshikake: 2 } }, { give: { nakayoshi: 3 } }, { gear: ['mio', 2] }, { give: { shizuku: 3 } }];
  r.chests = ends.slice(0, 6).map(([x, z], i) => ({ id: 'r' + i, ...cellW(x, z), loot: loot[i] }));
  r.ruinsEntrance = { x: ox - 2, z: oz + 5 * CS + 2 };
}
// ================= region 2: 天空の浮島 =================
{
  const r = REG[2]; World.setRegion(2); const [TX, TZ] = World.TOWN2; r.town = { x: TX, z: TZ };
  r.houses = [{ id: 'soyogi', x: TX - 1, z: TZ - 17 }, { id: 'inn', x: TX - 15, z: TZ - 3 }, { id: 'item', x: TX + 14, z: TZ - 5 }, { id: 'weapon', x: TX + 10, z: TZ + 12 }];
  r.houses.forEach((h, i) => { h.face = [TX, TZ]; buildHouse(h, [{ wall: 4, roof: 7, corner: 5 }, { wall: 4, roof: 3 }, { wall: 4, roof: 8 }, { wall: 6, roof: 8 }][i]); });
  for (const [x, z] of [[TX - 6, TZ + 6], [TX + 6, TZ + 6], [TX - 6, TZ - 7], [TX + 6, TZ - 7]]) { const b = Math.floor(hAt(x + .5, z + .5)); Blocks.set(x, b, z, 5, true); Blocks.set(x, b + 1, z, 11, true); Blocks.set(x, b + 2, z, 2, true); }
  let dz = TZ + 20; while (dz < TZ + 95 && hAt(TX + .5, dz + .5) > 7) dz++;
  const dy = Math.floor(hAt(TX + .5, dz - 5.5));
  for (let i = -6; i < 8; i++) for (let w = -1; w <= 1; w++) Blocks.set(TX + w, dy, dz + i, 0, true);
  Blocks.set(TX - 2, dy, dz + 7, 5, true); Blocks.set(TX - 2, dy + 1, dz + 7, 2, true); Blocks.set(TX + 2, dy, dz + 7, 5, true); Blocks.set(TX + 2, dy + 1, dz + 7, 2, true);
  r.pier = { x: TX + .5, z: dz + 4 }; r.whale = { x: TX + .5, z: dz + 17, y: dy + 2 }; r.ship = { x: 0, z: 9999, yaw: 0 };
  r.statue = { x: TX - 4, z: TZ + 5 }; r.fire = { x: TX + 4, z: TZ + 2 }; r.board = { x: TX + 3, z: TZ - 11 }; r.home = r.houses[1];
  // 風の祠
  const shrineAt = (i, x, z) => { const cx = Math.round(x), cz = Math.round(z); let base = 1e9;
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) base = Math.min(base, Math.floor(hAt(cx + a + .5, cz + b + .5)));
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { Blocks.set(cx + a, base, cz + b, (a + b) % 2 ? 6 : 1, true);
      if (Math.abs(a) === 2 && Math.abs(b) === 2) for (let y = 1; y <= 3; y++) Blocks.set(cx + a, base + y, cz + b, 6, true);
      Blocks.set(cx + a, base + 4, cz + b, a === 0 && b === 0 ? 2 : (Math.abs(a) === 2 || Math.abs(b) === 2) ? 11 : 7, true); }
    return { i, x: cx + .5, z: cz + .5, y: base + 1 }; };
  r.shrines = [shrineAt(0, 182, 14), shrineAt(1, -125, 168), shrineAt(2, -182, -35)];
  // 上昇気流
  const I = World.ISL2, edge = (A, B) => { const d = Math.hypot(B.x - A.x, B.z - A.z), ux = (B.x - A.x) / d, uz = (B.z - A.z) / d; let k = 0; while (k < A.r * 1.5 && hAt(A.x + ux * k, A.z + uz * k) > 3) k++;
    return { x: A.x + ux * (k - 7), z: A.z + uz * (k - 7), top: Math.max(A.h, B.h) + 28, r: 3.4 }; };
  r.updrafts = [edge(I[0], I[1]), edge(I[1], I[0]), edge(I[0], I[2]), edge(I[2], I[0]), edge(I[0], I[3]), edge(I[3], I[0]), edge(I[0], I[4]), edge(I[4], I[0]), edge(I[0], I[8]), edge(I[3], I[6]), edge(I[1], I[5])];
  { const [sx, sz, sh] = I[1].spire; const d = Math.hypot(I[1].x - sx, I[1].z - sz); r.updrafts.push({ x: sx + (I[1].x - sx) / d * 13, z: sz + (I[1].z - sz) / d * 13, top: sh + 12, r: 3.6, spire: true }); }
  // 風の羽（ミズカガミ）
  const S1 = I[2]; r.feathers = [90, 150, 210].map(a => { const t = a * Math.PI / 180, x = S1.x + Math.cos(t) * (S1.r + 17), z = S1.z + Math.sin(t) * (S1.r + 17); const y = S1.h + 13;
    r.updrafts.push({ x, z, top: y + 1.5, r: 3.4 }); return { x, z, y }; });
  // 星巣の塔
  const [WX, WZ] = World.TOWER2; const wb = Math.floor(hAt(WX + .5, WZ + .5)); const TOP = wb + 26; r.tower = { x: WX + .5, z: WZ + .5, base: wb, top: TOP };
  const ring = []; for (let k = -4; k < 4; k++) ring.push([k, 4]); for (let k = 4; k > -4; k--) ring.push([4, k]); for (let k = 4; k > -4; k--) ring.push([k, -4]); for (let k = -4; k < 4; k++) ring.push([-4, k]);
  const stairs = []; for (let k = 0; k < TOP - wb; k++) { const [a, b] = ring[(k + 5) % ring.length]; stairs.push([a, b, wb + 1 + k]); }
  const hole = new Set(stairs.slice(-4).map(([a, b]) => a + ',' + b));
  for (let y = wb; y <= TOP + 1; y++) for (let a = -5; a <= 5; a++) for (let b = -5; b <= 5; b++) { const rg = Math.max(Math.abs(a), Math.abs(b)); const X = WX + a, Z = WZ + b;
    if (y === wb) { Blocks.set(X, y, Z, 6, true); continue; }
    if (rg === 5) { if (b === 5 && Math.abs(a) <= 1 && y <= wb + 3) continue; if (y === TOP + 1) { if ((a + b) % 2 === 0) Blocks.set(X, y, Z, 10, true); continue; }
      Blocks.set(X, y, Z, (y % 5 === 2 && (a === 0 || b === 0)) ? 7 : (Math.abs(a) === 5 && Math.abs(b) === 5) ? 1 : 6, true); continue; }
    if (y === TOP && !hole.has(a + ',' + b)) Blocks.set(X, y, Z, rg <= 1 ? 10 : 11, true); }
  for (const [a, b, y] of stairs) Blocks.set(WX + a, y, WZ + b, 11, true);
  for (const [a, b] of [[-1, 6], [1, 6]]) for (let y = wb + 1; y <= wb + 3; y++) Blocks.set(WX + a, y, WZ + b, y === wb + 3 ? 2 : 6, true);
  r.altar = { x: WX + .5, z: WZ + .5, y: TOP + 1 }; r.midboss = { x: WX + .5, z: WZ + 8.5, y: Math.floor(hAt(WX + .5, WZ + 8.5)) };
  // 虹の橋（第3章：三つの祠のあと）
  let z1 = TZ; while (hAt(TX + .5, z1 - .5) > 5) z1--; let z2 = WZ; while (hAt(WX + .5, z2 + .5) > 5) z2++;
  const y1 = Math.floor(hAt(TX + .5, z1 + 3)), y2 = Math.floor(hAt(WX + .5, z2 - 3)); r.bridgePlan = [];
  for (let z = z1 + 3; z >= z2 - 3; z--) { const t = (z1 + 3 - z) / (z1 - z2 + 6); const y = Math.round(lerp(y1, y2, t)); for (let a = -1; a <= 1; a++) r.bridgePlan.push([TX + a, y, z, 10]);
    r.bridgePlan.push([TX - 2, y, z, 11], [TX + 2, y, z, 11]); if (z % 10 === 0) r.bridgePlan.push([TX - 2, y + 1, z, 2], [TX + 2, y + 1, z, 2]); }
  r.bridgeUD = { x: TX + .5, z: z1 + 6 };
  // 空に 浮かぶ 岩（かざり）
  const rr = rng(909); r.skyRocks = [];
  for (let k = 0; k < 400 && r.skyRocks.length < 34; k++) { const x = (rr() - .5) * 900, z = (rr() - .5) * 900; if (I.some(A => Math.hypot(A.x - x, A.z - z) < A.r + 26)) continue;
    r.skyRocks.push({ x, z, y: -6 + rr() * 80, s: 1.6 + rr() * 4.5, r: rr() * 6.28, ph: rr() * 6.28 }); }
}
// ================= region 3: 海の底 =================
{
  const r = REG[3]; World.setRegion(3); const [TX, TZ] = World.TOWN3; r.town = { x: TX, z: TZ };
  r.houses = [{ id: 'ushio', x: TX, z: TZ - 16 }, { id: 'inn', x: TX - 15, z: TZ - 2 }, { id: 'item', x: TX + 15, z: TZ - 4 }, { id: 'weapon', x: TX + 11, z: TZ + 12 }];
  r.houses.forEach((h, i) => { h.face = [TX, TZ]; buildHouse(h, [{ wall: 6, roof: 7, corner: 10 }, { wall: 4, roof: 7 }, { wall: 6, roof: 7 }, { wall: 1, roof: 7 }][i]); });
  for (const [x, z] of [[TX - 7, TZ + 7], [TX + 7, TZ + 7], [TX - 7, TZ - 8], [TX + 7, TZ - 8]]) { const b = Math.floor(hAt(x + .5, z + .5)); Blocks.set(x, b, z, 6, true); Blocks.set(x, b + 1, z, 7, true); Blocks.set(x, b + 2, z, 2, true); }
  r.pier = { x: TX + .5, z: TZ + 24 }; r.ship = { x: 0, z: 9999, yaw: 0 };
  r.statue = { x: TX - 4, z: TZ + 5 }; r.fire = { x: TX + 4, z: TZ + 3 }; r.board = { x: TX + 3, z: TZ - 9 }; r.home = r.houses[1];
  r.lh = World.LH3.map(([x, z], i) => ({ i, x, z, y: hAt(x, z) }));
  // 沈んだ 灯台（石レンガの 塔・ガラスの 灯室）
  for (const L of r.lh) { const b = Math.floor(L.y); for (let y = b; y < b + 9; y++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const e = Math.abs(dx) === 2 || Math.abs(dz) === 2; if (!e || (y === b + 1 && dz === 2 && Math.abs(dx) < 1)) continue; if ((y + dx * 3 + dz * 5 + L.i) % 7 === 0 && y > b + 2) continue; Blocks.set(Math.floor(L.x) + dx, y, Math.floor(L.z) + dz, 6, true); }
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) Blocks.set(Math.floor(L.x) + dx, b + 9, Math.floor(L.z) + dz, 1, true);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) Blocks.set(Math.floor(L.x) + dx, b + 10, Math.floor(L.z) + dz, 7, true); L.fire = [L.x + .5, b + 10.6, L.z + .5]; L.top = b + 10; }
  const [PX, PZ] = World.PALACE3; r.palace = { x: PX, z: PZ, y: hAt(PX, PZ) };
  { const b = Math.floor(r.palace.y); for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2; const x = Math.round(PX + Math.cos(an) * 14), z = Math.round(PZ + Math.sin(an) * 14); if (Math.abs(an - Math.PI / 2) < .3) continue; for (let y = b; y < b + 7 + (a % 2) * 2; y++) Blocks.set(x, y, z, a % 2 ? 6 : 4, true); Blocks.set(x, b + 7 + (a % 2) * 2, z, 7, true); } }
  const [RX, RZ] = World.TRENCH3; r.trench = { x: RX, z: RZ, y: hAt(RX, RZ) };
}
let bridgeBuilt = false;
function buildBridge() { if (bridgeBuilt) return; bridgeBuilt = true; for (const [x, y, z, t] of REG[2].bridgePlan) Blocks.set(x, y, z, t, true, 2); }
function scatter(regionIdx) {
  const r = REG[regionIdx]; World.setRegion(regionIdx); const rn = rng(1000 + regionIdx * 17); const W = World.rnd;
  const avoid = (x, z, d) => Math.hypot(x - r.town.x, z - r.town.z) < 30 || (r.beacons || []).some(b => Math.hypot(b.x - x, b.z - z) < d) || (r.shrine && Math.hypot(r.shrine.x - x, r.shrine.z - z) < 14)
    || (regionIdx === 3 && (r.lh.some(L => Math.hypot(L.x - x, L.z - z) < 14) || Math.hypot(x - r.palace.x, z - r.palace.z) < 24))
    || (regionIdx === 1 && Math.hypot(x - World.RUINS1[0], z - World.RUINS1[1]) < 30) || Math.hypot(x - r.pier.x, z - r.pier.z) < 12
    || (regionIdx === 2 && (r.shrines.some(s => Math.hypot(s.x - x, s.z - z) < 12) || Math.hypot(x - r.tower.x, z - r.tower.z) < 20 || Math.hypot(x - r.tower.x, z - r.tower.z + 9) < 10 || r.updrafts.some(u => Math.hypot(u.x - x, u.z - z) < 6)));
  r.trees = []; r.rocks = []; r.bushes = []; r.shrooms = []; r.seeds = [];
  const TMAX = COARSE ? 340 : 480;
  for (let k = 0; k < 14000 && r.trees.length < TMAX; k++) { const x = (W() - .5) * 500, z = (W() - .5) * 500, h = hAt(x, z); const b = World.biomeAt(x, z);
    if (h < 2.2 || h > 36 || nAt(x, z)[1] < .84 || avoid(x, z, 9)) continue;
    const dens = regionIdx === 0 ? World.fbm(x * .012 + 40, z * .012 + 40, 3) > .52 : b === 'forest' ? W() < .9 : b === 'grass' ? W() < .12 : b === 'snow' ? W() < .15 : false;
    if (!dens) continue; r.trees.push({ x, z, y: h - .15, s: .75 + W() * .8, r: W() * 6.28, hits: 0, state: 'ok', t: 0, shake: 0 }); }
  for (let k = 0; k < 8000 && r.rocks.length < 180; k++) { const x = (W() - .5) * 500, z = (W() - .5) * 500, h = hAt(x, z);
    if (h < 1.5 || h > 52 || avoid(x, z, 8)) continue; if (nAt(x, z)[1] > .92 && W() < .7) continue;
    r.rocks.push({ x, z, y: h - .2, s: .6 + W() * .8, r: W() * 6.28, hits: 0, state: 'ok', t: 0, shake: 0 }); }
  for (let k = 0; k < 8000 && r.bushes.length < 130; k++) { const x = (W() - .5) * 480, z = (W() - .5) * 480, h = hAt(x, z); const b = World.biomeAt(x, z);
    if (h < 2 || h > 24 || nAt(x, z)[1] < .88 || avoid(x, z, 6) || b === 'desert' || b === 'snow') continue; r.bushes.push({ x, z, y: h - .05, s: .8 + W() * .5, r: W() * 6.28, has: true, t: 0 }); }
  const near = regionIdx === 2 ? [[-22, 96], [22, 100], [-28, 50]] : regionIdx ? [[20, 150], [-22, 180], [26, 185]] : [[20, 8], [-18, 12], [-4, -24], [24, -20]];
  for (const [x, z] of near) r.bushes.push({ x, z, y: hAt(x, z) - .05, s: 1, r: 0, has: true, t: 0 });
  for (let k = 0; k < 6000 && r.shrooms.length < 70 && r.trees.length; k++) { const t = r.trees[Math.floor(W() * r.trees.length)]; const a = W() * 6.28, x = t.x + Math.cos(a) * 1.6, z = t.z + Math.sin(a) * 1.6;
    r.shrooms.push({ x, z, y: hAt(x, z), s: .8 + W() * .5, r: W() * 6.28, has: true, t: 0 }); }
  for (let k = 0; k < 20000 && r.seeds.length < 30; k++) { const x = (rn() - .5) * 480, z = (rn() - .5) * 480, h = hAt(x, z); if (h < 3 || avoid(x, z, 6)) continue;
    const peak = [[6, 0], [-6, 0], [0, 6], [0, -6]].every(([dx, dz]) => hAt(x + dx, z + dz) < h - .4);
    if (!peak && rn() > .03) continue; if (r.seeds.some(s => Math.hypot(s.x - x, s.z - z) < 25)) continue; r.seeds.push({ id: regionIdx + ':' + r.seeds.length, x, z, y: h }); }
  r.chests = r.chests || [];
  const extra = regionIdx === 3 ? [{ gold: 2500 }, { give: { shinju: 2 } }, { give: { stew: 2 } }, { give: { hoshikake: 3 } }, { gold: 4000 }, { give: { shinju: 3 } }] : regionIdx === 2 ? [{ gear: ['haru', 1] }, { gold: 1200 }, { give: { kumowata: 6 } }, { give: { stew: 1 } }, { give: { hoshikake: 3 } }, { gold: 2000 }] : regionIdx ? [{ gold: 300 }, { give: { pan: 3 } }, { gear: ['riku', 2] }, { give: { hoshikake: 1 } }, { gold: 500 }, { give: { ganbari: 2 } }] : [{ gold: 120 }, { give: { shizuku: 2 } }, { give: { nakayoshi: 2 } }, { gold: 200 }];
  let ci = 0; for (let k = 0; k < 8000 && ci < extra.length; k++) { const x = (rn() - .5) * 460, z = (rn() - .5) * 460, h = hAt(x, z); if (h < 6 || avoid(x, z, 12) || nAt(x, z)[1] < .7) continue;
    if (r.chests.some(c => Math.hypot(c.x - x, c.z - z) < 60)) continue; r.chests.push({ id: 'h' + regionIdx + '_' + ci, x, z, loot: extra[ci] }); ci++; }
  r.chests.forEach(c => { c.y = surfaceAt(c.x, c.z, 99); });
}
scatter(3); scatter(2); scatter(1); scatter(0);
World.setRegion(0);

// ================= meshes =================
const { Geo, prism, ico, shade, solid, hex } = World;
const maxOf = k => Math.max(REG[0][k].length, REG[1][k].length, REG[2][k].length, REG[3][k].length, 1);
const treeGeo = Geo(); prism(treeGeo, .2, .13, -.2, 1.9, 6, shade([.36, .25, .16], .2));
ico(treeGeo, 1.15, [0, 2.35, 0], shade([.28, .49, .19], .28), .28); ico(treeGeo, .95, [.55, 2.9, .25], shade([.34, .56, .22], .28), .28); ico(treeGeo, .8, [-.35, 3.35, -.2], shade([.40, .62, .25], .28), .3);
const mTree = World.makeMesh(treeGeo, maxOf('trees'), { sway: 1 });
const rockGeo = Geo(); ico(rockGeo, .9, [0, .5, 0], shade([.52, .51, .49], .18), .45, 1, .75); ico(rockGeo, .5, [.6, .3, .3], shade([.47, .46, .44], .18), .4, 0, .8);
const mRock = World.makeMesh(rockGeo, maxOf('rocks'));
const bushGeo = Geo(); ico(bushGeo, .6, [0, .4, 0], shade([.22, .42, .17], .25), .35, 1, .75); ico(bushGeo, .45, [.4, .35, .2], shade([.26, .46, .19], .25), .35, 0, .8);
const mBush = World.makeMesh(bushGeo, maxOf('bushes'));
const berryGeo = Geo(); for (const [x, y, z] of [[.2, .7, .4], [-.3, .6, .35], [.45, .45, .45], [-.1, .8, -.3], [.35, .6, -.3], [-.45, .45, .1]]) ico(berryGeo, .08, [x, y, z], solid([.86, .18, .22]), 0, 0);
const mBerry = World.makeMesh(berryGeo, maxOf('bushes'), { cast: false });
const shroomGeo = Geo(); prism(shroomGeo, .06, .05, 0, .2, 6, solid([.95, .92, .85])); ico(shroomGeo, .14, [0, .22, 0], shade([.8, .25, .18], .1), 0, 1, .55); prism(shroomGeo, .04, .03, 0, .14, 6, solid([.95, .92, .85]), .15, .08); ico(shroomGeo, .09, [.15, .15, .08], shade([.75, .5, .25], .1), 0, 0, .55);
const mShroom = World.makeMesh(shroomGeo, maxOf('shrooms'), { cast: false });
const seedGeo = Geo(); ico(seedGeo, .16, [0, .5, 0], solid([.7, 1, .5], 1), 0, 1, 1.3); prism(seedGeo, .5, .45, -.1, .12, 7, shade([.55, .55, .52], .15));
const mSeed = World.makeMesh(seedGeo, 30, { cast: false });
const shardGeo = Geo(); ico(shardGeo, .22, [0, .6, 0], solid([1, .78, .32], 1), .2, 0, 1.6);
const mShard = World.makeMesh(shardGeo, 3, { cast: false });
const bGeo = Geo(); prism(bGeo, 1.7, 1.55, -.8, .35, 8, shade([.50, .49, .46], .18)); prism(bGeo, .85, .66, .35, 3.5, 8, shade([.60, .58, .54], .16));
prism(bGeo, .95, .95, 3.35, 3.55, 8, shade([.46, .44, .41], .1)); prism(bGeo, .45, 1.15, 3.55, 4.1, 10, shade([.20, .19, .19], .15));
const mBeacon = World.makeMesh(bGeo, 5);
const shrineGeo = Geo(); prism(shrineGeo, 3, 2.8, -.8, .3, 10, shade([.35, .33, .40], .15));
for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; prism(shrineGeo, .35, .28, .3, 3.2, 6, shade([.42, .40, .48], .15), Math.cos(a) * 2.3, Math.sin(a) * 2.3); }
const mShrine = World.makeMesh(shrineGeo, 1);
const mShip = World.makeMesh(World.propGeo('ship'), 1), mChest = World.makeMesh(World.propGeo('chest'), 16), mBoard = World.makeMesh(World.propGeo('board'), 1), mAltar = World.makeMesh(World.propGeo('altar'), 1);
const fireGeo = Geo(); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; prism(fireGeo, .07, .07, 0, .5, 5, hex('#5a3a22'), Math.cos(a) * .25, Math.sin(a) * .25); } prism(fireGeo, .6, .6, -.05, .05, 8, shade([.45, .44, .42], .2));
const mFire = World.makeMesh(fireGeo, 1);
// 風布（パラフォイル）：アーチ状の セル・上下面・空気取り入れ口・ライン。 バンク角ごとに 焼きこむ
const GL_ROLLS = [-.62, -.46, -.3, -.15, 0, .15, .3, .46, .62];
function gliderGeoFor(roll) { const g = Geo(); const piv = [0, 1.25, 0], cr = Math.cos(roll), sr = Math.sin(roll);
  const X = v => { const x = v[0] - piv[0], y = v[1] - piv[1]; return [x * cr - y * sr + piv[0], x * sr + y * cr + piv[1], v[2]]; };
  const tri = (a, b, c, col) => { a = X(a); b = X(b); c = X(c); const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]; const l = Math.hypot(...n) || 1; n = n.map(q => q / l); if (n[1] < 0) n = n.map(q => -q);
    for (const v of [a, b, c]) { g.p.push(...v); g.n.push(...n); g.c.push(...col); } };
  const quad = (a, b, c, d, col) => { tri(a, b, c, col); tri(a, c, d, col); };
  const N = 13, R0 = 3.1, A = .78, cy = 1.1; // セル数・アーチ半径・半開き角
  const colA = [1, .5, .12, 0], colB = [1, .93, .78, 0], colC = [.2, .55, .95, 0], colD = [1, .8, .18, 0], under = [.8, .45, .2, 0], inlet = [.22, .14, .12, 0];
  const chord = t => 1.35 - t * t * .5; // 翼端ほど 細い
  const P = (t, z, off) => { const ang = t * A, r = R0 + off; return [Math.sin(ang) * r * 1.08, cy + Math.cos(ang) * r * .78, z]; };
  for (let i = 0; i < N; i++) { const t0 = i / N * 2 - 1, t1 = (i + 1) / N * 2 - 1, tm = (t0 + t1) / 2; const col = i === (N >> 1) ? colD : (i === 1 || i === N - 2) ? colC : i % 2 ? colA : colB;
    const c0 = chord(t0), c1 = chord(t1); const f0 = c0 * .55, b0 = -c0 * .45, f1 = c1 * .55, b1 = -c1 * .45;
    // 上面（前縁が ふくらむ）
    const segs = [[1, .0], [.72, .16], [.35, .2], [0, .14], [-.45, .04]];
    for (let k = 0; k < segs.length - 1; k++) { const [za, ha] = segs[k], [zb, hb] = segs[k + 1];
      quad(P(t0, za > 0 ? za * f0 : -za * b0, ha), P(t1, za > 0 ? za * f1 : -za * b1, ha), P(t1, zb > 0 ? zb * f1 : -zb * b1, hb), P(t0, zb > 0 ? zb * f0 : -zb * b0, hb), col); }
    // 下面
    quad(P(t0, f0 * .92, -.02), P(t1, f1 * .92, -.02), P(t1, b1, 0), P(t0, b0, 0), under);
    // 前縁の 取り入れ口（くらい）
    quad(P(t0, f0, 0), P(t1, f1, 0), P(t1, f1 * .92, -.02), P(t0, f0 * .92, -.02), inlet);
    // リブ（セルの しきり）
    tri(P(t0, f0 * .9, .12), P(t0, b0, .02), P(t0, f0 * .3, .18), [.55, .38, .26, 0]); }
  // ライン：翼下面から ハーネス（肩）へ
  const line = (a, b) => { const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = .018; const s = [w, 0, 0], col = [.35, .3, .28, 0];
    quad(a, [a[0] + s[0], a[1], a[2] + .01], [b[0] + s[0], b[1], b[2] + .01], b, col); };
  for (const t of [-.92, -.6, -.3, .3, .6, .92]) for (const z of [.5, -.25]) line(P(t, z * chord(t), -.03), [t < 0 ? -.2 : .2, 1.35, .05]);
  // ブレークコード（持ち手）
  for (const sx of [-1, 1]) { const q = [sx * .28, 1.3, -.05]; quad(q, [q[0] + .05, q[1], q[2]], [q[0] + .05, q[1] - .18, q[2]], [q[0], q[1] - .18, q[2]], [.95, .45, .3, 0]); }
  return g; }
const mGliders = GL_ROLLS.map(r => World.makeMesh(gliderGeoFor(r), 1, { cast: true }));
const mGlider = { set(i, x, y, z, s, yaw, roll = 0) { let k = 0, bd = 9; GL_ROLLS.forEach((r, j) => { const d = Math.abs(r - roll); if (d < bd) { bd = d; k = j; } }); mGliders.forEach((m, j) => { m.n = 0; }); mGliders[k].set(0, x, y, z, s, yaw); mGliders[k].n = 1; }, set n(v) { if (!v) mGliders.forEach(m => m.n = 0); }, get n() { return mGliders.some(m => m.n) ? 1 : 0; } };
const skyRockGeo = Geo(); prism(skyRockGeo, .05, 1.7, -3.2, 0, 7, shade([.66, .62, .55], .16)); prism(skyRockGeo, 1.75, 1.65, 0, .28, 7, shade([.36, .56, .24], .12));
ico(skyRockGeo, .5, [.5, .6, .3], shade([.3, .5, .2], .2), .3, 0, .9); prism(skyRockGeo, .08, .06, .28, 1.1, 5, hex('#6a4a2e'), -.6, -.3); ico(skyRockGeo, .45, [-.6, 1.3, -.3], shade([.34, .56, .22], .2), .3, 0, 1);
const mSkyRock = World.makeMesh(skyRockGeo, REG[2].skyRocks.length);
const featherGeo = Geo(); ico(featherGeo, .28, [0, .6, 0], solid([.92, 1, .98], 1), .1, 0, 2.4); prism(featherGeo, .03, .02, 0, .5, 4, solid([.7, .9, 1], 1));
const mFeather = World.makeMesh(featherGeo, 3, { cast: false });
const mWhale = World.makeMesh(World.speciesGeo(SPC.hoshikujira), 1);

const HUMANS = {
  sora: { skin: '#f6d7bd', hair: '#6a3f22', hairStyle: 'spiky', eye: [.2, .42, .72], top: '#2e4f8a', bottom: '#3d3a4a', accent: '#e8962e', scarf: true, sword: true, lantern: true, belt: '#6a4428', boot: '#5a3a22' },
  mio: { skin: '#f9dcc6', hair: '#d9774f', hairStyle: 'twin', eye: [.16, .56, .46], top: '#f7f2e6', skirt: '#f7f2e6', bottom: '#f4ecdb', cape: '#2f9a8a', capeLen: .78, flower: true, harp: true, trim: '#f3c15a', boot: '#8a5a3a' },
  riku: { skin: '#e9c2a0', hair: '#26344a', hairStyle: 'spiky', eye: [.75, .5, .15], top: '#34343e', bottom: '#2a2830', accent: '#c23a35', band: true, bandTail: true, pauldron: 'L', collar: '#22222a', spear: true, boot: '#2a2220' },
  sana: { skin: '#f1d3bd', hair: '#1d2438', hairStyle: 'veil', veil: '#2f3f7a', eye: [.4, .48, .85], top: '#f7f4ee', bottom: '#2f3f7a', robe: true, tubes: true, staff: true, trim: '#f3c15a' },
  haru: { skin: '#f7dcc8', hair: '#bfe0f2', hairStyle: 'cloud', eye: [.18, .6, .75], top: '#8fcfe6', bottom: '#f4f1e8', skirt: '#f6c64a', goggles: true, kite: true, fan: true, feather: true, boot: '#6a8aa6' },
  yui: { skin: '#f5d6c0', hair: '#6b4430', hairStyle: 'braid', eye: [.45, .32, .2], top: '#6f8f5e', robe: true, apron: true, shawl: '#efe4cc', ladle: true },
  gen: { skin: '#d9a77f', hair: '#3a3632', hairStyle: 'short', eye: [.3, .22, .15], top: '#efe8da', bottom: '#4a4036', wide: 1.3, apron: '#7a5232', band: true, accent: '#f4f0e6', goggles: true, beard: 'big', hammers: true, sleeve: 'rolled', boot: '#3a2a1e' },
  nagi: { skin: '#f1c9a8', hair: '#a0522d', hairStyle: 'bob', eye: [.35, .5, .2], top: '#e8862c', robe: true, apron: true, kerchief: true, accent: '#d9534f', sleeve: 'rolled', basket: true },
  kaito: { skin: '#e3b894', hair: '#3b2a1e', hairStyle: 'short', eye: [.22, .42, .55], top: '#2f6f73', bottom: '#23394f', cape: '#23394f', capeLen: .7, buttons: true, spyglass: true, beard: 'stubble', trim: '#d8b24a', tall: 1.05 },
  kurou: { skin: '#e8dccb', hair: '#eeeaf2', hairStyle: 'long', lock: '#1e1b2a', eye: [.45, .5, .7], top: '#3e4256', robe: true, mantle: true, lantern: true, lanternCol: [.72, .5, 1], tall: 1.12, wide: .88, beard: 'big' },
  tsumugi: { skin: '#fadfca', hair: '#8fbf6a', hairStyle: 'buns', eye: [.5, .35, .2], top: '#fbfbf6', bottom: '#6aa84f', robe: true, kid: true, glasses: true, satchel: true, notebook: true },
  baldo: { skin: '#d99a6c', hair: '#eeeae2', hairStyle: 'short', eye: [.25, .38, .5], top: '#23324a', bottom: '#1b2638', belly: true, wide: 1.25, beard: 'big', hat: 'bicorne', accent: '#1b2638', epaulet: true, trim: '#d8b24a' },
  oinn: { skin: '#b8845c', hair: '#1a1a22', hairStyle: 'bob', top: '#e8d8b0', bottom: '#8a5a3a', skirt: '#c8784a', shawl: '#3a8a8a' },
  nami: { skin: '#e2b894', hair: '#5a3a2a', hairStyle: 'bob', eye: [.35, .25, .15], top: '#c8584a', bottom: '#4a3a3a', skirt: '#8a4a3a', shawl: '#f0e0c0', accent: '#f3c15a' },
  ryou: { skin: '#c48a64', hair: '#2a2a30', hairStyle: 'short', eye: [.2, .2, .2], top: '#3a6a8a', bottom: '#2a3a4a', sleeve: 'rolled', beard: 'stubble', wide: 1.15 },
  chibi: { skin: '#f0cfa8', hair: '#d8783a', hairStyle: 'twin', eye: [.3, .5, .3], top: '#f0c040', bottom: '#4a6aa8', kid: true, scale: .8 },
  ushio: { skin: '#d8b89a', hair: '#9fd8d0', hairStyle: 'long', eye: [.2, .5, .55], top: '#3a8a9a', robe: true, beard: 'big', scale: 1, shawl: '#e8f4f0', accent: '#f3c15a' },
  kai: { skin: '#e8c8a8', hair: '#3a6a8a', hairStyle: 'bob', eye: [.25, .45, .6], top: '#5ab0c0', bottom: '#2a4a5a', kid: true, accent: '#ffe08a' },
  soyogi: { skin: '#ecd9c4', hair: '#f6f6fb', hairStyle: 'floor', eye: [.45, .5, .65], top: '#e8e2f4', robe: true, kid: true, scale: .95, chime: true, stoop: true, shawl: '#b8a8e0' },
  inn: { skin: '#f0cfae', hair: '#6a4a3a', hairStyle: 'bun', top: '#b5654a', robe: true, apron: true },
  item: { skin: '#e8c4a0', hair: '#2a2a2a', hairStyle: 'short', top: '#4a7a5a', bottom: '#3a3a44', band: true, accent: '#e8d8a0', satchel: true },
  armor: { skin: '#e8c4a0', hair: '#4a4a58', hairStyle: 'bob', top: '#7a8aa8', bottom: '#3a3a44', pauldron: 'R', trim: '#c9ced6', accent: '#c9ced6' },
  weapon: { skin: '#d49a74', hair: '#8a3a2a', hairStyle: 'spiky', top: '#5a5a62', bottom: '#3a3a44', beard: 'big', wide: 1.2, apron: '#5a3a22', hammers: true, sleeve: 'rolled' },
  guild: { skin: '#f6d9c4', hair: '#e6c46a', hairStyle: 'pony', top: '#6a4a8a', robe: true, flower: true },
  statue: { stone: true, skin: '#9a968e', hair: '#8a867e', hairStyle: 'short', top: '#9a968e', bottom: '#8a867e', robe: true, hat: true, accent: '#8a867e', boot: '#8a867e', eye: [.55, .53, .5] },
};
const mH = {}; for (const k in HUMANS) mH[k] = World.makeMesh(World.human(HUMANS[k]), 1);
const mSp = {}; for (const k of DATA.speciesOrder) mSp[k] = World.makeMesh(World.speciesGeo(SPC[k]), 14);
const mGuard = World.makeMesh(World.shadowGeo('guardian'), 6);
const mKing = World.makeMesh(World.shadowGeo('king'), 1);

// ================= state =================
const need = lv => Math.round(10 * Math.pow(lv, 1.5));
const spFor = lv => (lv - 1) + Math.floor(lv / 5);
let uidN = 1;
let G = { v: 3, name: 'ソラ', region: 0, party: [], mons: [], team: [], inv: { mi: 3, pan: 0, shizuku: 0, maki: 0, ishi: 0, suna: 0, ha: 0, nakayoshi: 0, hane: 0, hoshikake: 0, kinoko: 0, yakimi: 0, kinojiru: 0, ganbari: 0, stew: 0 },
  blk: {}, gold: 50, eq: { sora: { w: 0, a: 0 }, mio: { w: 0, a: 0 }, riku: { w: 0, a: 0 }, sana: { w: 0, a: 0 }, haru: { w: 0, a: 0 }, kaito: { w: 0, a: 0 } }, flags: {}, met: { sora: true }, order: 0, tod: .3, play: 0,
  dex: { seen: {}, got: {} }, stam: 100, stamMax: 100, hpBonus: 0, seeds: 0, seedGot: {}, chests: {}, bounties: [], bountyDone: 0, rewards: {}, mat: 0, lit: [0, 0, 0, 0, 0], guard: [0, 0, 0, 0, 0], placed: [[], [], [], []], pos: null, wtrial: [{}, {}, {}], wind: [0, 0, 0],
  sp: { sora: 0, mio: 0, riku: 0, sana: 0, haru: 0, kaito: 0 }, board: { sora: [], mio: [], riku: [], sana: [], haru: [], kaito: [] }, hpPct: 0, trial: [{}, {}, {}, {}, {}], itemSeen: {}, tips: {}, speed: 1, auto: false, rankClaimed: {}, bosses: 0 };
const HUMAN_IDS = ['sora', 'mio', 'riku', 'sana', 'haru', 'kaito'];
function calc(m) {
  const st = {};
  if (m.kind === 'human') { const d = DATA.party[m.id]; for (const k of ['hp', 'mp', 'atk', 'def', 'spd']) st[k] = d.base[k] + d.grow[k] * (m.lv - 1);
    const pas = { crit: 0, regen: 0, mpSave: 0, healUp: 0, aura: 0, first: 0 }; const mul = { hp: G.hpPct || 0, mp: 0, atk: 0, def: 0, spd: 0 };
    const owned = (G.board && G.board[m.id]) || []; const extra = [];
    for (const n of DATA.boards[m.id] || []) if (owned.includes(n.id)) { if (n.skill) extra.push(n.skill); for (const [k, v] of Object.entries(n.eff || {})) { if (k in mul) mul[k] += v; else pas[k] += v; } }
    for (const f of HOOK.calc) f(m, st, mul, pas, extra);
    for (const k in mul) st[k] = st[k] * (1 + mul[k]);
    const e = G.eq[m.id] || { w: 0, a: 0 }; if (HOOK.gearFlat) HOOK.gearFlat(m, st, e); else { st.atk += (DATA.gear[m.id][e.w] || { atk: 0 }).atk; st.def += DATA.armor[e.a].def; } st.hp += G.hpBonus;
    for (const k in st) st[k] = Math.round(st[k]);
    m.skills = [...d.skills.filter(([, l]) => l <= m.lv).map(([s]) => s), ...extra]; m.type = null; m.pas = pas; }
  else { const S = SPC[m.id]; const iv = m.iv || {}; ['hp', 'mp', 'atk', 'def', 'spd'].forEach((k, i) => st[k] = Math.round((S.base[i] + S.grow[i] * (m.lv - 1)) * (1 + (iv[k] ?? 8) / 100)));
    m.skills = [...S.sk.filter(([, l]) => l <= m.lv).map(([s]) => s), ...(m.extra || []).filter(s => DATA.skills[s])]; m.skills = m.skills.filter((s, i) => m.skills.indexOf(s) === i);
    m.type = S.type; m.pas = { crit: (m.bond || 0) >= 80 ? .05 : 0, regen: 0, mpSave: 0, healUp: 0, aura: 0, first: 0 };
    const mul = { hp: 0, mp: 0, atk: 0, def: 0, spd: 0 }, extra = [];
    for (const f of HOOK.calc) f(m, st, mul, m.pas, extra);
    for (const k in mul) st[k] = Math.round(st[k] * (1 + mul[k]));
    m.skills = [...new Set([...m.skills, ...extra.filter(k => DATA.skills[k])])]; }
  m.st = st; return m; }
function mkHuman(id, lv) { const m = { id, lv, exp: 0, kind: 'human' }; G.sp[id] = (G.sp[id] || 0) + spFor(lv); calc(m); m.hp = m.st.hp; m.mp = m.st.mp; return m; }
const rollIv = shiny => { const o = {}; for (const k of ['hp', 'mp', 'atk', 'def', 'spd']) o[k] = Math.min(15, Math.floor(R() * 16) + (shiny ? 5 : 0)); return o; };
const ivSum = m => Object.values(m.iv || {}).reduce((a, b) => a + b, 0) || 40;
const ivGrade = m => { const t = ivSum(m); return t >= 62 ? 'S' : t >= 48 ? 'A' : t >= 32 ? 'B' : 'C'; };
function mkMon(id, lv, shiny) { const m = { uid: 'm' + (uidN++), id, lv, exp: 0, kind: 'mon', shiny: !!shiny, iv: rollIv(shiny), bond: 0, extra: [] }; calc(m); m.hp = m.st.hp; m.mp = m.st.mp; return m; }
const nameOf = m => m.kind === 'human' ? (m.id === 'sora' ? G.name : DATA.cast[m.id].name) : SPC[m.id].name + (m.shiny ? '★' : '');
const inParty = id => G.party.some(m => m.id === id);
function member(ref) { return G.party.find(m => m.id === ref) || G.mons.find(m => m.uid === ref); }
function fixTeam() { G.team = G.team.filter(r => member(r)); G.team = G.team.filter((r, i) => G.team.indexOf(r) === i); if (!G.team.includes('sora')) G.team.unshift('sora');
  for (const m of G.party) if (G.team.length < 4 && !G.team.includes(m.id)) G.team.push(m.id);
  if (G.team.length < 4 && !G.team.some(r => r[0] === 'm' && r !== 'mio')) { const m = G.mons[0]; if (m) G.team.push(m.uid); }
  G.team = G.team.slice(0, 4); }
function battleParty() { fixTeam(); return G.team.map(member).filter(Boolean); }
function allMembers() { return [...G.party, ...G.mons]; }
G.party.push(mkHuman('sora', 1)); fixTeam();
const REGr = () => REG[G.region];

// ================= save =================
let SLOT = 1; const OLD_KEY = 'kazetomo-rpg-1'; const keyOf = n => n === 1 ? 'kazetomo-rpg-3' : 'kazetomo-rpg-3-s' + n;
function slotInfo(n) { try { const raw = localStorage.getItem(keyOf(n)) || (n === 1 && localStorage.getItem(OLD_KEY)); if (!raw) return null; const d = JSON.parse(raw), g = d.G || {}; const F = g.flags || {};
  const ch = F.c4done ? '第4章クリア' : F.c3done ? (F.c4start ? '第4章' : '第3章クリア') : F.c2done ? '第3章' : F.cleared ? '第2章' : '第1章';
  const lv = Math.max(1, ...((g.party || d.party || []).map(m => m.lv || 1))); const t = Math.floor((g.play || 0) / 60); return { name: g.name || d.name || 'ソラ', ch, lv, time: `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` }; } catch (e) { return null; } }
function save() { try { const gp = player.ground && !player.swim && !player.glide && !blocked(player.x, player.z, player.y) ? player : (player.good && player.good.r === G.region ? player.good : player); G.pos = { x: gp.x, z: gp.z, y: gp.y }; // 空中・水中・めりこみ中は 直前の 安全な 足場を 記録 G.placed = [Blocks.placed(0), Blocks.placed(1), Blocks.placed(2), Blocks.placed(3)]; G.lit = REG[0].beacons.map(b => b.lit ? 1 : 0); G.guard = REG[0].beacons.map(b => b.guard ? 1 : 0);
  localStorage.setItem(keyOf(SLOT), JSON.stringify({ G, uidN })); for (const f of HOOK.saved) try { f(); } catch (e) {} return true; } catch (e) { return false; } }
function hasSave() { return [1, 2, 3].some(n => slotInfo(n)); }
function load() { try {
  let raw = localStorage.getItem(keyOf(SLOT));
  if (raw) { const d = JSON.parse(raw); const inv = Object.assign({}, G.inv, d.G.inv); const def = { sp: G.sp, board: G.board, trial: G.trial, itemSeen: G.itemSeen, tips: G.tips, rankClaimed: G.rankClaimed, wtrial: G.wtrial, wind: G.wind }; G = Object.assign(G, def, d.G); G.inv = inv; G.sp = Object.assign({}, def.sp, d.G.sp); G.board = Object.assign({}, def.board, d.G.board); /* 旧セーブに 後から 加わった 仲間の キーを 補う */ uidN = d.uidN || 100; }
  else { raw = SLOT === 1 && localStorage.getItem(OLD_KEY); if (!raw) return false; const o = JSON.parse(raw);
    G.name = o.name; G.party = o.party.map(m => ({ ...m, kind: 'human' })); G.mons = Object.values(o.friends || {}).map(f => ({ ...f, uid: 'm' + (uidN++), kind: 'mon' }));
    Object.assign(G.inv, o.inv); G.flags = o.flags || {}; G.met = o.met || G.met; G.order = o.order || 0; G.tod = o.tod || .3; G.pos = o.pos;
    G.eq.sora.w = o.equip ? o.equip.w : 0; for (const k of HUMAN_IDS) G.eq[k].a = o.equip ? o.equip.a : 0; G.lit = o.lit || G.lit; G.guard = o.guard || G.guard; G.placed = [o.placed || [], []];
    G.mons.forEach(m => { G.dex.got[m.id] = 1; G.dex.seen[m.id] = 1; }); G.team = []; }
  G.party.forEach(calc); G.mons.forEach(calc); fixTeam();
  REG[0].beacons.forEach((b, i) => { b.lit = !!G.lit[i]; b.guard = !!G.guard[i]; });
  Blocks.load(G.placed[0] || [], 0); Blocks.load(G.placed[1] || [], 1); Blocks.load(G.placed[2] || [], 2); Blocks.load(G.placed[3] || [], 3);
  G.mons.forEach(m => { if (!m.iv) m.iv = { hp: 8, mp: 8, atk: 8, def: 8, spd: 8 }; if (m.bond == null) m.bond = 20; if (!m.extra) m.extra = []; calc(m); });
  for (const f of HOOK.load) f(G);
  for (const k of HUMAN_IDS) if (!G.eq[k]) G.eq[k] = { w: 0, a: 0 }; if (!G.wind) G.wind = [0, 0, 0]; if (G.wind.every(Boolean)) G.flags.c3bridge = true; if (G.flags.c3bridge) buildBridge(); G.build = false; if (G.flags.c3done && G.flags.c3reunion === undefined && G.region === 0) G.flags.c3reunion = true;
  return true; } catch (e) { console.error(e); return false; } }

// ================= player =================
const player = { x: REG[0].home.npc.x * .6, z: REG[0].home.npc.z * .6, y: 0, vx: 0, vz: 0, vy: 0, yaw: 0, ground: true, phase: 0, climb: false, glide: false, swim: false, tired: false, safe: null };
player.y = hAt(player.x, player.z);
const cam = { yaw: 0, pitch: .3, dist: COARSE ? 7.2 : 8.5 };
const trail = []; let trailAcc = 0;
const NPCS = [
  { id: 'yui', r: 0, house: 'yui' }, { id: 'gen', r: 0, house: 'gen' }, { id: 'nagi', r: 0, house: 'nagi' }, { id: 'mio', r: 0, x: 1.5, z: 2.5 },
  { id: 'kurou', r: 0, x: -2, z: 5, show: () => G.flags.cleared }, { id: 'kaito', r: 0, x: -10, z: -2, show: () => G.flags.cleared },
  { id: 'baldo', r: 0, at: 'pier', show: () => G.flags.c2start },
  { id: 'inn', r: 1, house: 'inn', nm: '宿屋の おかみ' }, { id: 'item', r: 1, house: 'item', nm: '道具屋' }, { id: 'weapon', r: 1, house: 'weapon', nm: '武器と防具の店' },
  { id: 'tsumugi', r: 1, house: 'lab' }, { id: 'guild', r: 1, house: 'guild', nm: 'ギルドの 受付' }, { id: 'baldo', r: 1, at: 'pier' },
  { id: 'soyogi', r: 2, house: 'soyogi' }, { id: 'inn', r: 2, house: 'inn', nm: '雲の宿の 主人' }, { id: 'item', r: 2, house: 'item', nm: '空の道具屋' }, { id: 'weapon', r: 2, house: 'weapon', nm: '空の武具屋' },
  { id: 'haru', r: 2, x: World.TOWN2[0] + 3.5, z: World.TOWN2[1] - 9, show: () => !G.party.some(m => m.id === 'haru') },
].map(n => { const R0 = REG[n.r]; if (n.house) { const h = R0.houses.find(h => h.id === n.house); n.x = h.npc.x; n.z = h.npc.z; n.yaw = h.yaw; }
  if (n.at === 'pier') { n.x = R0.pier.x + 1.8; n.z = R0.pier.z - 3; n.yaw = Math.PI; } n.yaw = n.yaw || 0; n.baseYaw = n.yaw; return n; });
const npcNow = () => NPCS.filter(n => n.r === G.region && (!n.show || n.show()) && !(n.id === 'mio' && G.flags.mio));
const gh0 = () => surfaceAt(player.x, player.z, player.y);
let goodT = 0; let enemies = [], spawnT = 0, cool = 0, barrierT = 0, hudT = 0, dustT = 0, glideT = 0; const puffs = [], streaks = []; const hsp0 = () => Math.hypot(player.vx, player.vz);

// ================= input =================
const keys = new Set();
const stick = { id: null, x: 0, y: 0, ox: 0, oy: 0 }, look = { id: null, x: 0, y: 0 };
let jumpReq = false;
const stickEl = $('stick'), knob = $('knob');
cv.addEventListener('pointerdown', e => {
  if (mode() !== 'field') return;
  if (e.pointerType !== 'mouse' && (HOOK.OPT.lefty ? e.clientX > innerWidth * .58 : e.clientX < innerWidth * .42) && stick.id === null) {
    stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY; stick.x = stick.y = 0;
    stickEl.hidden = false; stickEl.style.left = e.clientX + 'px'; stickEl.style.top = e.clientY + 'px'; knob.style.transform = 'translate(-50%,-50%)';
  } else if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; }
  else if (e.pointerType !== 'mouse' && !pinch.on) { pinch.on = true; pinch.b = e.pointerId; pinch.bx = e.clientX; pinch.by = e.clientY; pinch.d0 = Math.max(20, Math.hypot(e.clientX - look.x, e.clientY - look.y)); pinch.dist0 = cam.dist; }
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
});
const pinch = { on: false, b: null, bx: 0, by: 0, d0: 1, dist0: 7 };
cv.addEventListener('pointermove', e => {
  if (e.pointerId === stick.id) { let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy; const m = Math.hypot(dx, dy), Rr = 50; if (m > Rr) { dx *= Rr / m; dy *= Rr / m; }
    stick.x = dx / Rr; stick.y = dy / Rr; knob.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`; }
  else if (pinch.on && (e.pointerId === look.id || e.pointerId === pinch.b)) { if (e.pointerId === look.id) { look.x = e.clientX; look.y = e.clientY; } else { pinch.bx = e.clientX; pinch.by = e.clientY; }
    const d = Math.max(20, Math.hypot(pinch.bx - look.x, pinch.by - look.y)); cam.dist = clamp(pinch.dist0 * pinch.d0 / d, 4, 14); cam.inAt = performance.now(); }
  else if (e.pointerId === look.id) { cam.inAt = performance.now(); const k =(e.pointerType === 'mouse' ? .005 : .0065) * HOOK.OPT.look; cam.yaw -= (e.clientX - look.x) * k; cam.pitch = clamp(cam.pitch + (e.clientY - look.y) * k, -.3, 1.2); look.x = e.clientX; look.y = e.clientY; }
});
const pup = e => { if (e.pointerId === stick.id) { stick.id = null; stick.x = stick.y = 0; stickEl.hidden = true; } if (pinch.on && (e.pointerId === look.id || e.pointerId === pinch.b)) { if (e.pointerId === look.id) { look.id = pinch.b; look.x = pinch.bx; look.y = pinch.by; } pinch.on = false; pinch.b = null; return; } if (e.pointerId === look.id) look.id = null; };
cv.addEventListener('pointerup', pup); cv.addEventListener('pointercancel', pup);
cv.addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * .01, 4, 16); cam.inAt = performance.now(); e.preventDefault(); }, { passive: false });
cv.addEventListener('contextmenu', e => e.preventDefault());
function releaseInputs() { keys.clear(); stick.id = null; stick.x = stick.y = 0; stickEl.hidden = true; look.id = null; pinch.on = false; pinch.b = null; }
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (MENUS.length) { menuKey(e); return; }
  if (D.active) { if (['Space', 'Enter', 'KeyE', 'NumpadEnter'].includes(e.code)) { e.preventDefault(); dlgAdvance(e.repeat); } return; }
  if (B.active) { if (['Space', 'Enter', 'KeyE'].includes(e.code)) bSkip = true; return; }
  if (mode() !== 'field') return;
  keys.add(e.code);
  if (e.code === 'Space') { if (!e.repeat) jumpReq = true; e.preventDefault(); }
  if (e.code === 'KeyE' || e.code === 'Enter') act();
  if (e.code === 'Escape' || e.code === 'Tab' || e.code === 'KeyM') { e.preventDefault(); openMenu(); }
  if (e.code === 'KeyB') toggleBuild();
  if (e.code === 'KeyF') place();
  if (e.code === 'KeyR') breakBlock();
  if (e.code === 'KeyQ') cycleMat();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
const tapBtn = (id, fn) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
tapBtn('btnAct', () => act()); tapBtn('btnMenu', () => { if (mode() === 'field') openMenu(); }); tapBtn('btnJump', () => { jumpReq = true; });
tapBtn('btnBuild', () => toggleBuild()); tapBtn('btnPlace', () => place()); tapBtn('btnBreak', () => breakBlock()); tapBtn('btnMat', () => cycleMat());
$('btnMute').addEventListener('click', () => { const m = Music.toggleMute(); $('btnMute').textContent = m ? '♪ OFF' : '♪ ON'; });

// ================= modes =================
let phase = 'splash', busy = false;
function mode() { if (phase !== 'field') return phase; if (B.active) return 'battle'; if (D.active || MENUS.length || busy) return 'busy'; return 'field'; }
async function run(fn) { if (busy || (DEBUG && window.__noEvents)) return; busy = true; releaseInputs(); try { await fn(); } catch (e) { console.error(e); } finally { busy = false; } }

// ================= dialogue =================
const D = { active: false, q: [], full: '', shown: 0, res: null };
const dlgEl = $('dlg'), dlgName = $('dlgName'), dlgText = $('dlgText'), dlgFace = $('dlgFace'), dlgMore = $('dlgMore');
dlgEl.addEventListener('pointerdown', e => { e.preventDefault(); dlgAdvance(); });
function say(lines) { return new Promise(res => { D.q = lines.filter(Boolean); D.res = res; D.active = true; dlgEl.hidden = false; nextLine(); }); }
function nextLine() {
  const L = D.q.shift();
  if (!L) { D.active = false; dlgEl.hidden = true; const r = D.res; D.res = null; r && r(); return; }
  const o = typeof L === 'string' ? { t: L } : L; if (o.fx) o.fx();
  D.full = o.t.replace(/{name}/g, G.name); D.shown = 0; D.doneAt = 0; D.imp = !!o.imp || /もらった|くわわった|なかまに|手に入れた|覚えた|おぼえた|【/.test(D.full);
  if (o.who) { const c = DATA.cast[o.who]; dlgName.textContent = o.who === 'sora' ? G.name : o.who === 'kurou' ? 'クロウ' : c.name; dlgName.hidden = false;
    dlgFace.innerHTML = Art.portrait(o.who, o.ex || 'smile'); dlgFace.hidden = false; const pc = Art.P[o.who] && Art.P[o.who].bg; dlgName.style.setProperty('--nc', pc ? pc + 'aa' : '');
    dlgFace.classList.remove('pop'); void dlgFace.offsetWidth; dlgFace.classList.add('pop'); if (!G.met[o.who]) G.met[o.who] = true; dlgEl.classList.remove('narr'); }
  else if (o.nm) { dlgName.textContent = o.nm; dlgName.hidden = false; dlgName.style.setProperty('--nc', ''); dlgFace.hidden = true; dlgEl.classList.add('narr'); }
  else { dlgName.hidden = true; dlgFace.hidden = true; dlgEl.classList.add('narr'); }
  dlgText.textContent = ''; dlgMore.hidden = true;
}
// 行が 出しきられてから 150ms（大事な 行は 320ms・キーリピート無効）は 送らない ＝ 連打で 入手/加入を 読みとばさない
function dlgAdvance(rep) { if (!D.active) return; const now = performance.now(); if (D.shown < D.full.length) { D.shown = D.full.length; D.doneAt = now; return; }
  if ((rep && D.imp) || now - (D.doneAt || 0) < (D.imp ? 320 : 150)) return; Music.sfx('cursor'); nextLine(); }
function dlgUpdate(dt) { if (!D.active) return; if (D.shown < D.full.length) { const before = Math.floor(D.shown); D.shown = Math.min(D.full.length, D.shown + dt * 42 * HOOK.OPT.text); if (D.shown >= D.full.length) D.doneAt = performance.now();
    if (Math.floor(D.shown) !== before && Math.floor(D.shown) % 2 === 0) Music.sfx('blip'); }
  dlgText.textContent = D.full.slice(0, Math.floor(D.shown)); dlgMore.hidden = D.shown < D.full.length; }
const who = (w, ex, t) => ({ who: w, ex, t });
const nm = (n, t) => ({ nm: n, t });

// ================= menus =================
const MENUS = [];
function menu({ title, items, where = 'center', cancel = true, cols = 0, cls = '', sel = -1 }) { // cols/cls/sel：タイル型メニュー用（矢印キーの 列数・追加クラス・初期カーソル）
  return new Promise(res => {
    const host = where === 'battle' ? $('bCmd') : $('ui');
    const el = document.createElement('div'); el.className = 'win menu m-' + where + (items.some(i => i.hint) ? ' one' : '') + (cls ? ' ' + cls : '');
    el.innerHTML = (title ? `<div class="m-title"><span>${title}</span>${cancel ? '<button class="m-x" type="button" aria-label="もどる">✕</button>' : ''}</div>` : '') + '<div class="m-list"></div>';
    const list = el.querySelector('.m-list');
    const M = { el, items, sel: sel >= 0 && items[sel] && !items[sel].disabled ? sel : Math.max(0, items.findIndex(i => !i.disabled)), res, cancel, cols };
    items.forEach((it, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'm-item' + (it.disabled ? ' dis' : '') + (it.cls ? ' ' + it.cls : '');
      b.innerHTML = `<span class="m-cur">▶</span><span class="m-l">${it.label}</span>${it.sub != null ? `<span class="m-s">${it.sub}</span>` : ''}${it.hint ? `<span class="m-h">${it.hint}</span>` : ''}`;
      b.addEventListener('click', () => { if (it.disabled) { Music.sfx('cancel'); return; } M.sel = i; paint(M); Music.sfx('ok'); closeMenu(M, i); });
      list.appendChild(b); });
    if (!title && cancel) { const x = document.createElement('button'); x.type = 'button'; x.className = 'm-x solo'; x.textContent = '✕'; x.setAttribute('aria-label', 'もどる'); el.appendChild(x); }
    el.querySelectorAll('.m-x').forEach(x => x.addEventListener('click', () => { Music.sfx('cancel'); closeMenu(M, -1); }));
    host.appendChild(el); MENUS.push(M); paint(M);
  });
}
function paint(M) { M.el.querySelectorAll('.m-item').forEach((b, i) => b.classList.toggle('on', i === M.sel)); const on = M.el.querySelectorAll('.m-item')[M.sel]; on && on.scrollIntoView && on.scrollIntoView({ block: 'nearest' }); }
function closeMenu(M, v) { M.el.remove(); MENUS.splice(MENUS.indexOf(M), 1); M.res(v); }
function menuKey(e) { const M = MENUS[MENUS.length - 1]; if (!M) return; if (M.key) { M.key(e); return; }
  if (M.panel) { if (['Escape', 'Enter', 'Space', 'KeyE', 'Backspace'].includes(e.code)) { e.preventDefault(); Music.sfx('cancel'); closeMenu(M, -1); } return; }
  const n = M.items.length; const step = d => { let i = M.sel; for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (!M.items[i].disabled) break; } M.sel = i; Music.sfx('cursor'); paint(M); };
  const cols = M.cols || (M.el.classList.contains('m-battle') && !M.el.classList.contains('one') ? 2 : 1);
  if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); step(cols); }
  else if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); step(-cols); }
  else if (cols > 1 && (e.code === 'ArrowRight' || e.code === 'KeyD')) { e.preventDefault(); step(1); }
  else if (cols > 1 && (e.code === 'ArrowLeft' || e.code === 'KeyA')) { e.preventDefault(); step(-1); }
  else if (['Enter', 'Space', 'KeyE', 'NumpadEnter'].includes(e.code)) { e.preventDefault(); if (e.repeat) return; if (M.items[M.sel] && !M.items[M.sel].disabled) { Music.sfx('ok'); closeMenu(M, M.sel); } }
  else if (['Escape', 'Backspace', 'KeyX'].includes(e.code) && M.cancel) { e.preventDefault(); Music.sfx('cancel'); closeMenu(M, -1); } }
function panel(html, cls = '') { return new Promise(res => {
  const el = document.createElement('div'); el.className = 'win panel ' + cls; el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button>${html}`;
  const M = { el, panel: true, items: [], res }; el.querySelector('.m-x').addEventListener('click', () => { Music.sfx('cancel'); closeMenu(M, -1); });
  $('ui').appendChild(el); MENUS.push(M); }); }
async function confirm(q) { if (q) await say([q]); return (await menu({ items: [{ label: 'はい' }, { label: 'いいえ' }], where: 'yn', cancel: true })) === 0; }

// ================= HUD =================
const toastEl = $('toast'); let toastT;
function toast(msg, ms = 2600) { toastEl.innerHTML = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), ms); }
function floatText(p, text) { const s = World.project(p); if (!s) return; const d = document.createElement('div'); d.className = 'float'; d.textContent = text; d.style.left = s[0] + 'px'; d.style.top = s[1] + 'px'; $('ui').appendChild(d); setTimeout(() => d.remove(), 1400); }
function hud() {
  const inv = G.inv; if (phase === 'field') checkRank();
  $('inv').innerHTML = `<span><b>${G.gold}</b>G</span><span class="mat">薪 <b>${inv.maki}</b></span><span class="mat">石 <b>${inv.ishi}</b></span><span class="mat">雲 <b>${inv.kumowata || 0}</b></span>`;
  const P = battleParty(), key = P.map(m => (m.uid || m.id) + m.lv + ':' + m.hp + '/' + m.st.hp).join('|');
  if (key !== hud.key) { hud.key = key; $('pmini').innerHTML = P.map(m => { const f = m.hp / m.st.hp; if (!hud.face) hud.face = {}; const fk = (m.uid || m.id) + (m.shiny ? '*' : '') + m.id;
    if (!hud.face[fk]) hud.face[fk] = m.kind === 'human' ? Art.portrait(m.id, 'smile') : Art.species(m.id, { shiny: m.shiny });
    return `<div class="pm2${m.hp <= 0 ? ' ko' : f < .3 ? ' low' : ''}" title="${esc(nameOf(m))} HP ${m.hp}/${m.st.hp}"><div class="f">${hud.face[fk]}</div><span class="lv">${m.lv}</span><span class="hb"><i style="width:${Math.round(f * 100)}%"></i></span></div>`; }).join(''); }
  $('hud').querySelector('.keys-hint').classList.toggle('gone', G.play > 75);
  $('btnMat').textContent = (DATA.blocks[G.mat] || '') + (G.blk[G.mat] ? `${G.blk[G.mat]}` : '');
}
function stamHud() { const s = $('stam'); const f = G.stam / G.stamMax; s.style.setProperty('--f', f.toFixed(3)); s.classList.toggle('low', f < .25 || player.tired); s.classList.toggle('full', f >= .999 && !player.climb && !player.glide);
  if (phase === 'field') { const p = World.project([player.x, player.y + 1.7, player.z]); if (p) { s.style.left = Math.round(p[0] + 26) + 'px'; s.style.top = Math.round(p[1] - 30) + 'px'; } } }

// ================= tips / item gain =================
// ヒントは 1件ずつ 順番に。地名バナー（ux.js #areaBn）や 暗転中は 待ってから 出す。tip(html, key) / tip(html, ms)
const tipQ = []; let tipBusy = false, tipCur = '';
function tip(html, key, ms) { if (typeof key === 'number') { ms = key; key = null; } if (key) { if (G.tips[key]) return; G.tips[key] = 1; }
  if (html === tipCur || tipQ.some(q => q.h === html)) return; if (tipQ.length >= 6) tipQ.shift(); tipQ.push({ h: html, ms }); if (!tipBusy) nextTip(); }
function tipBlocked() { const bn = document.getElementById('areaBn'); return !$('battle').hidden || document.body.classList.contains('inbattle') || (bn && bn.classList.contains('on')) || $('fade').classList.contains('on') || $('swipe').classList.contains('go'); }
function nextTip() { const el = $('tip'); if (!tipQ.length) { tipBusy = false; tipCur = ''; el.classList.remove('on'); return; } tipBusy = true;
  if (tipBlocked()) { setTimeout(nextTip, 250); return; }
  const q = tipQ.shift(); tipCur = q.h; el.innerHTML = q.h; el.classList.add('on');
  const len = el.textContent.length, dur = q.ms || Math.max(3600, Math.min(7000, 2600 + len * 45)) * (tipQ.length > 1 ? .75 : 1);
  setTimeout(() => { el.classList.remove('on'); tipCur = ''; setTimeout(nextTip, 400); }, dur); }
function gain(k, n = 1) { G.inv[k] = (G.inv[k] || 0) + n; for (const f of HOOK.gain) try { f(k, n); } catch (e) {} if (!G.itemSeen[k]) { G.itemSeen[k] = 1; const it = DATA.items[k]; tip(`<b>はじめて 手に入れた：${it.name}</b><span>入手：${it.src || '—'}</span><span>使いみち：${it.use || it.desc}</span>`); } }

// ================= objectives =================
// 目的チップ：行動を 先に、【…】の 章・推奨Lvなどは 2行目へ（.obj-main / .obj-meta）
function objHTML(t) { t = String(t || ''); let meta = ''; const m = t.match(/^\s*【([^】]*)】\s*(.*)$/); if (m) { meta = m[1]; t = m[2] || m[1]; if (!m[2]) meta = ''; }
  return `<b class="obj-main">${esc(t)}</b>${meta ? `<small class="obj-meta">${esc(meta)}</small>` : ''}`; }
function npcAt(id, r) { const n = NPCS.find(n => n.id === id && n.r === r); return n ? { x: n.x, z: n.z } : null; }
function objective() {
  const F = G.flags, r0 = REG[0], r1 = REG[1];
  if (!F.metYui) return { t: '母さん（ユイ）と 話そう', p: npcAt('yui', 0) };
  if (!F.metGen) return { t: 'おじの ゲンの 工房へ いこう', p: npcAt('gen', 0) };
  if (!F.mio) return { t: '広場の ミオに 声を かけよう', p: npcAt('mio', 0) };
  if (G.order < 5) { if (G.region !== 0) return { t: '風灯の島へ もどろう', p: npcAt('baldo', 1) };
    if (HOOK.beaconObj) { const o = HOOK.beaconObj(); if (o) return o; }
    let best = null, bd = 1e9; for (const b of r0.beacons) if (!b.lit) { const d = Math.hypot(b.x - player.x, b.z - player.z); if (d < bd) { bd = d; best = b; } }
    const T = DATA.trials[best.i], st = G.trial[best.i]; const lv = DATA.guardLv[G.order];
    let step; if (!st.seen) step = `「${T.name}」の 番人を たおす`; else if (!HOOK.beaconGate && !trialDone(best)) step = best.i === 0 ? `灯の欠片を 集める ${st.shards || 0}/3` : `群れを しずめる ${st.waves || 0}/3`;
    else if (!best.guard) step = best.i === 3 ? '夜に 灯台の 番人と たたかう' : best.act.top ? `${best.i === 1 ? '塔の てっぺん' : '浮き足場'}で 番人と たたかう` : '灯台の 番人と たたかう';
    else if (!HOOK.beaconGate && !fuelOk(best)) step = `燃料を 集める（${fuelTxt(best)}）`; else step = best.act.top ? `${best.i === 1 ? '塔の てっぺん' : '浮き足場'}で 火を ともす` : '火を ともす';
    return { t: `【灯台 ${G.order}/5・推奨Lv${lv}】${step}`, p: best.act.top && st.seen ? best.act : best }; }
  if (!F.cleared) return { t: `【決戦・推奨Lv${DATA.bossCfg.yomikage[0]}】島で いちばん 高い 場所、宵の祠へ`, p: r0.shrine };
  if (!F.c2start) return { t: '【第2章】広場の クロウと 話そう', p: npcAt('kurou', 0) };
  if (!F.c2done && (!F.c2arrive || G.region !== 1)) { if (G.region === 0) return { t: '桟橋の バルド船長の 船で 霧の大陸へ', p: npcAt('baldo', 0) }; }
  if (G.region === 1 && !F.dex) return { t: '港町ミナトの 研究所で ツムギに 会おう', p: npcAt('tsumugi', 1) };
  if (G.region === 1 && !F.c2rumor) return { t: 'ギルドで 情報を 集めよう', p: npcAt('guild', 1) };
  if (G.region === 1 && F.c2rumor && !F.c2mid && HOOK.obj2) { const o = HOOK.obj2(); if (o) return o; }
  if (!F.c2done) { if (G.region !== 1) return { t: '霧の大陸へ もどろう', p: npcAt('baldo', 0) }; return { t: F.c2mid ? `【推奨Lv${DATA.bossCfg.sanaShadow[0]}】遺跡の 奥の 祭壇へ` : `【推奨Lv${DATA.bossCfg.ishigakiG[0]}】東の 砂漠の「星の遺跡」の 奥へ`, p: F.c2mid ? r1.altar : r1.midboss }; }
  const r2 = REG[2];
  if (!F.c3start) return G.region === 1 ? { t: '【第3章】港町ミナトの 研究所で ツムギに 会おう', p: npcAt('tsumugi', 1) } : { t: '【第3章】霧の大陸の ツムギが 呼んでいる（バルド船長の 船へ）', p: npcAt('baldo', 0) };
  if (!F.c3arrive || (!F.c3done && G.region !== 2)) { if (G.region === 0) return { t: '霧の大陸へ わたろう（バルド船長の 船）', p: npcAt('baldo', 0) };
    if (G.region === 1) return { t: F.c3arrive ? '星の遺跡の 祭壇で 星笛を ふいて 空へ もどろう' : '星の遺跡の 祭壇で 星笛を ふこう（夜に ひびく）', p: r1.altar }; }
  if (!F.c3done) {
    if (!F.c3elder) return { t: '雲の里ククルの 長老ソヨギに 会おう', p: npcAt('soyogi', 2) };
    if (!F.c3bridge && HOOK.obj3) { const o = HOOK.obj3(); if (o) return o; }
    if (!F.c3bridge) { const nd = G.wind.filter(Boolean).length; let best = null, bd = 1e9; for (const sh of r2.shrines) if (!G.wind[sh.i]) { const d = Math.hypot(sh.x - player.x, sh.z - player.z); if (d < bd) { bd = d; best = sh; } }
      if (!best) { G.flags.c3bridge = true; buildBridge(); return { t: '虹の橋を わたり、北の「星巣の塔」へ', p: r2.midboss }; }
      const i = best.i, T = DATA.windTrials[i], st = G.wtrial[i], lv = DATA.bossCfg[WIND_BOSS[i]][0]; let step, p = best;
      if (!st.seen) step = `${T.where}の「${T.name}」へ`;
      else if (i === 1 && (st.got || []).length < 3) { step = `風の羽を 集める ${(st.got || []).length}/3`; const f = r2.feathers.find((_, k) => !(st.got || []).includes(k)); if (f) p = f; }
      else if (i === 2 && (st.waves || 0) < 3) step = '夜に 祠で 星の嵐を しのぐ';
      else if (!st.guard) step = i === 0 ? '岩山の 頂の 祠で 番人と たたかう' : '祠の 番人と たたかう'; else step = '祠に 風を 通す';
      if (i === 0 && !st.seen) step += '（上昇気流で 頂へ）';
      return { t: `【風の祠 ${nd}/3・推奨Lv${lv}】${step}`, p }; }
    if (!F.c3mid) return { t: `【推奨Lv${DATA.bossCfg.seishouG[0]}】虹の橋を わたり、北の「星巣の塔」へ`, p: r2.midboss };
    return { t: `【決戦・推奨Lv${DATA.bossCfg.amahami[0]}】塔の 中の らせん階段で 頂へ`, p: r2.altar }; }
  for (const f of HOOK.objective) { const o = f(); if (o) return o; }
  const got = Object.keys(G.dex.got).length;
  return { t: `自由に 旅しよう（図鑑 ${got}/${DEX_N}・ひかりの種 ${Object.keys(G.seedGot).length}/${SEED_N()}）`, p: null };
}
const WIND_BOSS = ['tsumujikaze', 'kumokurage', 'hoshigarasu'];
const DEX_N = DATA.speciesOrder.length;
const SEED_N = () => REG.reduce((a, r) => a + r.seeds.length, 0);
const REGION_NAME = ['風灯の島', '霧の大陸', '天空の浮島', '海の底'], TOWN_NAME = ['風見の村', '港町ミナト', '雲の里ククル', 'アワの里'];

// ================= interaction =================
let target = null, sandCd = 0;
function onSand() { const b = World.biomeAt(player.x, player.z); const h = hAt(player.x, player.z); return player.ground && (b === 'desert' || (b === 'shore' && h > .3)) && player.y - h < .3; }
function findTarget() {
  const r = REGr(); const px = player.x, pz = player.z, fx = Math.sin(player.yaw), fz = Math.cos(player.yaw); let best = null, bs = 1e9;
  const cand = (o, type, x, z, rng) => { if (Math.abs(x - px) > rng + 1 || Math.abs(z - pz) > rng + 1) return; const dx = x - px, dz = z - pz, d = Math.hypot(dx, dz); if (d > rng) return; const f = (dx * fx + dz * fz) / (d || 1); const sc = d - f * 1.3; if (sc < bs) { bs = sc; best = { o, type, x, z }; } };
  for (const n of npcNow()) cand(n, 'npc', n.x, n.z, 3);
  for (const t of r.trees) if (t.state === 'ok') cand(t, 'tree', t.x, t.z, 2.2 + t.s * .3);
  for (const k of r.rocks) if (k.state === 'ok') cand(k, 'rock', k.x, k.z, 1.9 + k.s * .8);
  for (const b of r.bushes) if (b.has) cand(b, 'bush', b.x, b.z, 2);
  for (const s of r.shrooms) if (s.has) cand(s, 'shroom', s.x, s.z, 1.6);
  for (const c of r.chests) if (!G.chests[c.id]) cand(c, 'chest', c.x, c.z, 2.2);
  cand(r.statue, 'statue', r.statue.x, r.statue.z, 2.6); cand(r.fire, 'fire', r.fire.x, r.fire.z, 2.6); if (r.board) cand(r.board, 'board', r.board.x, r.board.z, 2.6);
  if (G.region === 0) { for (const b of r.beacons) if (!b.lit) { cand(b, 'beacon', b.x, b.z, 4.4); if (b.act.top && Math.abs(player.y - b.act.y) < 2.5) { const bs0 = bs; cand(b, 'beacontop', b.act.x, b.act.z, 2.6); } } if (G.order >= 5 && !G.flags.cleared) cand(r.shrine, 'shrine', r.shrine.x, r.shrine.z, 6); }
  if (G.region === 1) { if (!G.flags.c2mid && G.flags.c2rumor) cand(r.midboss, 'midboss', r.midboss.x, r.midboss.z, 4.5); if (G.flags.c2mid && !G.flags.c2done) cand(r.altar, 'altar', r.altar.x, r.altar.z, 4); }
  if (G.region === 1 && G.flags.c3start) cand(r.altar, 'flute', r.altar.x, r.altar.z, 4);
  if (G.region === 2) { for (const sh of r.shrines) if (!G.wind[sh.i] && Math.abs(player.y - sh.y) < 4) cand(sh, 'wshrine', sh.x, sh.z, 3.6);
    if (G.flags.c3arrive) cand(r.whale, 'whale', r.pier.x, r.pier.z, 3.2);
    if (G.flags.c3bridge && !G.flags.c3mid) cand(r.midboss, 'midboss3', r.midboss.x, r.midboss.z, 4.5);
    if (G.flags.c3mid && !G.flags.c3done && Math.abs(player.y - r.altar.y) < 3) cand(r.altar, 'altar3', r.altar.x, r.altar.z, 4); }
  for (const f of HOOK.target) f(cand, r);
  if (!best && onSand()) best = { type: 'sand', x: px, z: pz, o: { y: player.y } };
  return best;
}
function actLabel(t) { if (!t) return ''; switch (t.type) {
  case 'npc': return `${t.o.nm || (DATA.cast[t.o.id] || {}).name || "ひと"}と はなす`; case 'tree': return '木を 切る'; case 'rock': return '石を 掘る'; case 'bush': return '実を つむ'; case 'shroom': return 'キノコを とる';
  case 'chest': return '宝箱を あける'; case 'statue': return '石像を しらべる'; case 'fire': return '料理する'; case 'board': return '依頼を 見る'; case 'sand': return '砂を 掘る';
  case 'beacon': case 'beacontop': return (t.o.act.top && t.type === 'beacon') ? '灯台を しらべる' : fuelOk(t.o) && t.o.guard ? '火を ともす' : '灯台を しらべる'; case 'shrine': return '祠へ すすむ';
  case 'midboss': return '奥へ すすむ'; case 'altar': return '祭壇へ すすむ'; case 'flute': return '星笛を ふく'; case 'wshrine': return '祠を しらべる';
  case 'whale': return 'ホシクジラに 乗る'; case 'midboss3': return '塔へ 入る'; case 'altar3': return '頂へ すすむ'; } const hl = HOOK.labels[t.type]; return hl ? (typeof hl === 'function' ? hl(t) : hl) : ''; }
function act() {
  if (mode() !== 'field') { if (D.active) dlgAdvance(); return; }
  const t = target; if (!t) return;
  if (t.type === 'npc') return run(() => talk(t.o));
  if (t.type === 'tree') { t.o.hits++; t.o.shake = 1; Music.sfx('chop');
    if (t.o.hits >= 3) { t.o.state = 'fall'; t.o.t = 0; t.o.hits = 0; gain('maki', 2); let msg = '薪 +2'; if (R() < .5) { gain('ha'); msg += '  葉っぱ +1'; } floatText([t.o.x, t.o.y + 2.5, t.o.z], msg); } else floatText([t.o.x, t.o.y + 2, t.o.z], '●'.repeat(t.o.hits) + '○'.repeat(3 - t.o.hits)); return; }
  if (t.type === 'rock') { t.o.hits++; t.o.shake = 1; Music.sfx('mine'); const iw = G.mons.some(m => SPC[m.id].type === 'earth'); const needH = iw ? 2 : 3;
    if (t.o.hits >= needH) { t.o.state = 'fall'; t.o.t = 0; t.o.hits = 0; const g = iw ? 3 : 2; gain('ishi', g); let msg = `石 +${g}`; if (G.region === 1 && R() < .08) { gain('hoshikake'); msg += '  星のかけら！'; } floatText([t.o.x, t.o.y + 1.6, t.o.z], msg); } else floatText([t.o.x, t.o.y + 1.4, t.o.z], '●'.repeat(t.o.hits) + '○'.repeat(needH - t.o.hits)); return; }
  if (t.type === 'bush') { t.o.has = false; t.o.t = 0; gain('mi', 2); Music.sfx('pick'); floatText([t.o.x, t.o.y + 1.2, t.o.z], '木の実 +2'); return; }
  if (t.type === 'shroom') { t.o.has = false; t.o.t = 0; gain('kinoko'); Music.sfx('pick'); floatText([t.o.x, t.o.y + .8, t.o.z], 'キノコ +1'); return; }
  if (t.type === 'sand') { if (sandCd > 0) return; sandCd = .45; gain('suna'); Music.sfx('mine'); floatText([player.x, player.y + 1, player.z], '砂 +1'); return; }
  if (t.type === 'chest') return run(() => openChest(t.o));
  if (t.type === 'statue') return run(statueEvent);
  if (t.type === 'fire') return run(cookMenu);
  if (t.type === 'board') return run(bountyBoard);
  if (t.type === 'beacon' || t.type === 'beacontop') return run(() => beaconEvent(t.o, t.type === 'beacontop'));
  if (t.type === 'shrine') return run(() => shrineEvent());
  if (t.type === 'midboss') return run(midbossEvent);
  if (t.type === 'altar') return run(altarEvent);
  if (t.type === 'flute') return run(fluteEvent);
  if (t.type === 'wshrine') return run(() => windEvent(t.o));
  if (t.type === 'whale') return run(whaleEvent);
  if (t.type === 'midboss3') return run(towerGateEvent);
  if (t.type === 'altar3') return run(finalEvent3);
  if (HOOK.acts[t.type]) { const fn = HOOK.acts[t.type]; if (fn.instant) return fn(t.o, t); return run(() => fn(t.o, t)); }
}
async function openChest(c) {
  G.chests[c.id] = 1; Music.sfx('friend'); const L = c.loot; const lines = ['宝箱を あけた！'];
  if (L.gold) { G.gold += L.gold; lines.push(`${L.gold}ゴールドを 手に入れた！`); }
  if (L.give) for (const [k, v] of Object.entries(L.give)) { gain(k, v); lines.push(`${DATA.items[k].name}を ${v}こ 手に入れた！`); }
  if (L.gear && HOOK.giveGear) lines.push(...HOOK.giveGear(L.gear));
  else if (L.gear) { const [id, i] = L.gear; const g = DATA.gear[id][i]; lines.push(`${g.name}を 手に入れた！`);
    if ((G.eq[id].w || 0) < i) { G.eq[id].w = i; allMembers().forEach(calc); lines.push(`（${id === 'sora' ? G.name : DATA.cast[id].name}の ぶきに なった）`); } }
  await say(lines); hud(); save(); }

// build mode
function toggleBuild() { if (mode() !== 'field') return; G.build = !G.build; document.body.classList.toggle('building', !!G.build); if (G.build && !G.blk[G.mat]) cycleMat(true);
  toast(G.build ? 'つくるモード：クラフトで 作った ブロックを 置ける' : 'つくるモード おわり', 1800); hud(); }
function cycleMat(silent) { const have = DATA.blocks.map((_, i) => i).filter(i => G.blk[i] > 0); if (!have.length) { if (!silent) toast('ブロックが ない<br><span style="font-size:.6em">メニューの「クラフト」で 作ろう</span>', 2000); return; }
  const i = have.indexOf(G.mat); G.mat = have[(i + 1) % have.length]; hud(); }
function buildCell() { const fx = player.x + Math.sin(player.yaw) * 1.5, fz = player.z + Math.cos(player.yaw) * 1.5; const ix = Math.floor(fx), iz = Math.floor(fz);
  const base = surfaceAt(fx, fz, player.y + 2.5); let iy = Math.floor(base + .001); while (Blocks.has(ix, iy, iz)) iy++; return [ix, iy, iz]; }
function place() { if (mode() !== 'field' || !G.build) return; const [x, y, z] = buildCell();
  if (y > player.y + 3) { toast('そこには 届かない', 1200); return; }
  if (x === Math.floor(player.x) && z === Math.floor(player.z) && y >= Math.floor(player.y) - 1 && y <= Math.floor(player.y + 1.7)) return;
  if (!(G.blk[G.mat] > 0)) { toast(`${DATA.blocks[G.mat]}ブロックが ない`, 1200); return; }
  G.blk[G.mat]--; Blocks.set(x, y, z, G.mat); Music.sfx('place'); hud(); }
function breakBlock() { if (mode() !== 'field' || !G.build) return; const fx = player.x + Math.sin(player.yaw) * 1.5, fz = player.z + Math.cos(player.yaw) * 1.5; const ix = Math.floor(fx), iz = Math.floor(fz);
  for (let iy = Math.floor(player.y + 2.2); iy >= Math.floor(player.y - 1.2); iy--) { if (!Blocks.has(ix, iy, iz)) continue;
    const t = Blocks.del(ix, iy, iz); if (t == null) { toast('この 建物は こわせない', 1200); return; } G.blk[t] = (G.blk[t] || 0) + 1; Music.sfx('mine'); hud(); return; } }

// ================= 依頼 =================
function regionSpecies(r) { return DATA.speciesOrder.filter(k => SPC[k].hab && (SPC[k].hab.r === r || SPC[k].hab.r === -1)); }
function newBounty() {
  const r = R(); const pool = regionSpecies(G.region === 2 ? 2 : 1).filter(k => !SPC[k].rare && !SPC[k].legend);
  if (r < .35) { const n = [5, 8, 12][Math.floor(R() * 3)]; return { kind: 'hunt', n, c: 0, text: `かげものを ${n}体 しずめる`, gold: n * 22 }; }
  if (r < .6) { const sp = pool[Math.floor(R() * pool.length)]; const n = 2 + Math.floor(R() * 2); return { kind: 'huntSp', sp, n, c: 0, text: `かげ${SPC[sp].name}を ${n}体 しずめる`, gold: 90 * n }; }
  if (r < .82) { const it = ['maki', 'ishi', 'suna', 'kinoko', 'mi'][Math.floor(R() * 5)]; const n = 5 + Math.floor(R() * 6); return { kind: 'give', it, n, text: `${DATA.items[it].name}を ${n}こ とどける`, gold: n * 14 }; }
  const cand = pool.filter(k => !G.dex.got[k]); const sp = cand.length ? cand[Math.floor(R() * cand.length)] : pool[0];
  return { kind: 'friend', sp, text: `${SPC[sp].name}を なかまにする`, gold: 260, give: { nakayoshi: 1 } };
}
function quest(sp) { for (const b of G.bounties) { if (b.kind === 'hunt') b.c = Math.min(b.n, b.c + 1); if (b.kind === 'huntSp' && sp === b.sp) b.c = Math.min(b.n, b.c + 1); } }
const bDone = b => b.kind === 'give' ? (G.inv[b.it] || 0) >= b.n : b.kind === 'friend' ? !!G.dex.got[b.sp] : b.c >= b.n;
async function bountyBoard() {
  while (G.bounties.length < 3) G.bounties.push(newBounty());
  while (true) {
    const i = await menu({ title: `ギルドの 依頼（達成 ${G.bountyDone}）`, items: G.bounties.map(b => ({ label: (bDone(b) ? '★ ' : '') + b.text, sub: `${b.gold}G${b.kind === 'hunt' || b.kind === 'huntSp' ? ` ${b.c}/${b.n}` : ''}` })), where: 'side' });
    if (i < 0) return; const b = G.bounties[i];
    if (!bDone(b)) { await say([nm('ギルドの 受付', 'まだ 達成して いないみたい。 がんばってね！')]); continue; }
    if (b.kind === 'give') G.inv[b.it] -= b.n; G.gold += b.gold; if (b.give) for (const [k, v] of Object.entries(b.give)) G.inv[k] += v; G.bountyDone++;
    Music.jingle('levelup', fieldSong()); await say([nm('ギルドの 受付', `依頼 達成！ ほうしゅうの ${b.gold}ゴールドよ。`), G.bountyDone % 5 === 0 ? nm('ギルドの 受付', `これで ${G.bountyDone}件め！ あなた、ギルドの 有名人よ。`) : null]);
    G.bounties[i] = newBounty(); hud(); save(); }
}

// ================= 料理 / 石像 =================
async function cookMenu() {
  while (true) {
    const i = await menu({ title: 'たき火で 料理', items: DATA.cook.map(c => ({ label: DATA.items[c.out].name, sub: Object.entries(c.need).map(([k, v]) => `${DATA.items[k].name}${v}`).join(' '), disabled: !Object.entries(c.need).every(([k, v]) => (G.inv[k] || 0) >= v) })), where: 'side' });
    if (i < 0) return; const c = DATA.cook[i]; for (const [k, v] of Object.entries(c.need)) G.inv[k] -= v; gain(c.out); Music.sfx('heal'); G.cooked = G.cooked || {}; if (!G.cooked[c.out]) toast(`あたらしい 料理を おぼえた！`, 1200); G.cooked[c.out] = (G.cooked[c.out] || 0) + 1;
    toast(`${DATA.items[c.out].name}が できた！`, 1400); hud(); }
}
async function statueEvent() {
  await say(['古い 石像が、やさしく 光っている。', `（ひかりの種 ${G.seeds}こ を もっている。 4こ ささげると 力を さずかる）`]);
  if (G.seeds < 4) return;
  const c = await menu({ title: 'ひかりの種を 4こ ささげる', items: [{ label: 'がんばりの 力', sub: `がんばり ${G.stamMax}→${Math.min(300, G.stamMax + 20)}`, disabled: G.stamMax >= 300 }, { label: 'いのちの 力', sub: 'みんなの 最大HP +6' }] });
  if (c < 0) return; G.seeds -= 4; if (c === 0) { G.stamMax = Math.min(300, G.stamMax + 20); G.stam = G.stamMax; } else { G.hpBonus += 6; G.party.forEach(m => { calc(m); m.hp = m.st.hp; }); }
  Music.jingle('levelup', fieldSong()); await say([c === 0 ? 'がんばりの 上限が あがった！' : 'みんなの いのちが 強くなった！']); hud(); save(); }

// ================= story & NPCs =================
async function talk(n) {
  n.yaw = Math.atan2(player.x - n.x, player.z - n.z);
  if (HOOK.talks[n.id]) { const r = await HOOK.talks[n.id](n); if (r !== 'pass') return; }
  const f = { yui: talkYui, gen: talkGen, nagi: talkNagi, mio: talkMio, kurou: talkKurou, kaito: talkKaito, baldo: talkBaldo, inn: talkInn, item: talkItem, weapon: talkWeapon, tsumugi: talkTsumugi, guild: talkGuild, soyogi: talkSoyogi, haru: talkHaruNpc }[n.id];
  if (f) return f(n);
}
async function rest(cost) {
  if (cost && G.gold < cost) { await say([nm('宿屋の おかみ', 'お金が たりないみたいだね……。')]); return; }
  G.gold -= cost || 0; Music.jingle('inn', fieldSong()); allMembers().forEach(m => { m.hp = m.st.hp; m.mp = m.st.mp; }); G.stam = G.stamMax;
  const n = World.skyInfo(G.tod).night; if (n > .4) G.tod = .27; hud(); save();
  await say([n > .4 ? '……朝に なった。 みんな 元気いっぱいだ！（記録も のこした）' : '……ひとやすみした。 みんな 元気いっぱいだ！（記録も のこした）']); }
async function talkYui() {
  const F = G.flags;
  if (!F.metYui) {
    await say([who('yui', 'smile', 'おはよう、{name}。 ……また 岬で 夜あかし？ 髪が 潮で ごわごわよ。'), who('sora', 'worried', '……今日も、ひとつも ついてなかった。'),
      who('sora', 'determined', 'でも 北の 灯台の てっぺんで、なにか 光ったんだ。 ほんとだよ！ ぼく、見てくる。'),
      who('yui', 'sad', '……止めても 行く 顔ね。 あの人と おんなじ。'), who('yui', 'determined', 'あの人、「灯台に 置いてきた ものが ある」って 言っていたわ。 ゲン兄さんの 工房で したくを しておいで。'),
      who('yui', 'smile', 'つかれたら いつでも 帰っておいで。 ごはんと おふとんは、ここに ある。')]); F.metYui = true; save(); return; }
  const c = await menu({ title: 'ユイ', items: [{ label: 'やすむ', sub: '全回復＋記録' }, { label: 'はなす' }] });
  if (c === 0) await rest(0);
  else if (c === 1) await say([G.order < 5 ? who('yui', 'smile', 'むちゃだけは しないでね。 帰る場所は ここよ。') : !F.cleared ? who('yui', 'worried', 'この 空……。 {name}、 あなたの 帰る場所は ここよ。')
    : !F.c2done ? who('yui', 'smile', '大陸へ 行くのね。 ……お父さんと 同じ 顔を してる。 いってらっしゃい。') : who('yui', 'joy', 'サナちゃんも 連れて 帰ってきたのね。 今夜は ごちそうよ！')]);
}
async function talkGen(n) {
  const F = G.flags;
  if (!F.metGen) {
    await say([who('gen', 'neutral', '……来たか、{name}。 ユイから 聞いた。'), who('sora', 'worried', '……止めないの？'),
      who('gen', 'sad', '止めて 聞く 血すじじゃねえ。 ……カイトも そうだった。'),
      who('gen', 'neutral', '灯台には かげものが 巣くってる。 木を 切りゃ 薪、岩を 割りゃ 石だ。 材料さえ ありゃ、武器でも 防具でも 打ってやる。')]); F.metGen = true;
    // 灯台の 鍵（k0）の 依頼を その場で 受ける（おつかいの 往復を 1回 へらす）
    if (HOOK.talks.gen && n) await HOOK.talks.gen(n);
    await say([who('gen', 'neutral', '……それと、広場の ミオが おまえを 探してたぞ。')]); save(); return; }
  if (HOOK.genTalk) return HOOK.genTalk(n); // v9：店・鍛冶は balance.js（K.bal）が あつかう
  const w = DATA.gear.sora[G.eq.sora.w + 1], ha = G.eq.sora.a;
  const aNext = ha < 2 ? DATA.armor[ha + 1] : null; const aCost = [null, { maki: 5, ishi: 2 }, { ishi: 12, maki: 4 }][ha + 1];
  const costTxt = c => Object.entries(c).map(([k, v]) => `${DATA.items[k].name}${v}`).join(' '); const can = c => c && Object.entries(c).every(([k, v]) => (G.inv[k] || 0) >= v);
  const c = await menu({ title: 'ゲンの工房', items: [
    { label: w && w.cost ? `${w.name}を つくる` : 'ぶき：ここでは これ以上 作れない', sub: w && w.cost ? costTxt(w.cost) : '', disabled: !w || !w.cost || !can(w.cost) },
    { label: aNext ? `${aNext.name}を つくる（全員）` : 'ぼうぐ：ここでは これ以上 作れない', sub: aNext ? costTxt(aCost) : '', disabled: !aNext || !can(aCost) }, { label: 'はなす' }] });
  const pay = cst => Object.entries(cst).forEach(([k, v]) => G.inv[k] -= v);
  if (c === 0) { pay(w.cost); G.eq.sora.w++; allMembers().forEach(calc); Music.sfx('place'); await say([who('gen', 'grin', `……よし。 ${w.name}だ。`), `${G.name}は ${w.name}を そうびした！`]); }
  else if (c === 1) { pay(aCost); HUMAN_IDS.forEach(k => { if (G.eq[k].a < ha + 1) G.eq[k].a = ha + 1; }); G.party.forEach(m => { const r = m.hp / m.st.hp; calc(m); m.hp = Math.round(m.st.hp * r); }); Music.sfx('place'); await say([who('gen', 'neutral', `${aNext.name}だ。 仲間の ぶんも ある。`)]); }
  else if (c === 2) await say([!F.cleared ? who('gen', 'sad', '……あの夜、カイトに「行くなら 二度と 帰ってくるな」と 言っちまった。 だから おまえの 武器は、おれが 打つ。') : who('gen', 'smile', '大陸の 港町には、もっと いい 武器屋が あるらしいぞ。 金を ためな。')]);
}
async function talkNagi() {
  const F = G.flags;
  if (!F.metNagi) { F.metNagi = true; G.inv.pan += 2;
    await say([who('nagi', 'grin', 'あら {name}！ 旅に 出るんだって？ 村じゅう その 話で もちきりだよ。'),
      who('nagi', 'sad', '……「カイトの 子まで 海に とられる」なんて 言う 人も いるけどさ。 あたしは 言わせとく。'),
      who('nagi', 'smile', 'ほら、焼きたての 実のパン。 腹が へっては 冒険は できないよ！'), '実のパンを 2つ もらった！',
      who('sora', 'joy', 'まだ あったかい……！ ナギおばさん、ありがと！')]); return; }
  const c = await menu({ title: 'かざみ亭', items: [{ label: 'パンを やいてもらう', sub: '木の実3 → 実のパン1', disabled: G.inv.mi < 3 }, { label: 'はなす' }] });
  if (c === 0) { G.inv.mi -= 3; G.inv.pan++; Music.sfx('pick'); await say([who('nagi', 'grin', 'はい、おまちどう！'), '実のパンを 1つ もらった！']); }
  else if (c === 1) await say([!F.cleared ? who('nagi', 'sad', 'シオミの 町にね、「疫病神」って 呼ばれてる 槍使いの 子が いるんだって。 リクとか いったね。 ……ひどい 話さ。') : who('nagi', 'grin', '大陸の 料理も 気になるねえ。 おいしいもの 見つけたら 教えておくれ！')]);
}
async function talkMio() {
  const F = G.flags;
  if (!F.metYui) { await say([who('mio', 'smile', '{name}、 おはよう！ 先に ユイさんに 顔を 見せてきなよ。')]); return; }
  await say([who('mio', 'grin', '{name}！ 旅に 出るって ほんと？ わたしも 行く！'), who('sora', 'surprised', 'ええっ？ まだ なにも 言ってないよ！'),
    who('mio', 'worried', '……あのね。 夜に なると きこえるの。 灯台の ほうから、だれかが 泣いてる こえ。'),
    who('mio', 'determined', 'カイトさんには 海で 命を 助けてもらった。 こんどは わたしの 番。'),
    { t: 'ミオが なかまに くわわった！', fx: () => { F.mio = true; G.party.push(mkHuman('mio', G.party[0].lv)); fixTeam(); Music.sfx('friend'); } },
    who('mio', 'smile', 'かげものって、ほんとは こわがってる だけ なの。 しずめて あげれば、もとの いきものに もどるんだよ。'),
    who('sora', 'smile', 'じゃあ これは、やっつける 旅じゃなくて……いやす 旅だね。')]); save();
}
async function talkKurou() {
  if (!G.flags.c2start) {
    await say([who('kurou', 'neutral', '{name}。 ……少し、いいか。 宴は にがてでな。'),
      who('kurou', 'sad', 'わたしが 闇に 堕ちた 夜、北の 海に 星が ひとつ 落ちた。 あの 光に ふれてから、悲しみが 止まらなく なった。'),
      who('kurou', 'determined', '霧の大陸では、いまも 星が 落ちつづけている。 ……わたしの 闇は、なにか 大きな ものの「かけら」に すぎなかった。'),
      inParty('riku') ? who('riku', 'surprised', '霧の大陸……？ サナが……妹が 最後に 見えたのも、その 方角だ。') : null,
      who('sora', 'determined', 'じゃあ、その「なにか」に 会いに 行こう。 リクの 妹さんも さがして！'),
      who('kurou', 'smile', '……カイトに 似てきたな。 桟橋に 古い 友の 船が 来ている。 バルドという 男だ。'),
]); G.flags.c2start = true; await titleCard('第2章', '星くずの大陸'); save(); return; }
  await say([G.flags.c3done ? who('kurou', 'joy', 'ハルが 帰ってきた。 ……灯を ともしつづけて、よかった。 ありがとう、{name}。') : who('kurou', 'smile', 'ハルが 好きだった 歌を、ミオが 歌ってくれた。 ……ありがとう。')]);
}
async function talkKaito() { await say([who('kaito', 'smile', G.flags.c2done ? '星喰いを しずめたか。 ……おまえは もう、立派な 灯守りだ。' : '灯は、帰る場所の しるしだ。 大陸でも 忘れるなよ、{name}。')]); }
async function talkBaldo() {
  if (!G.flags.c2arrive) {
    await say([who('baldo', 'grin', 'がっはっは！ おめえが カイトの せがれか！ 目もとが そっくりだ！'),
      who('baldo', 'neutral', 'クロウから 話は 聞いた。 霧の大陸へ 渡りてえんだな。'), who('baldo', 'sad', '……四十年前の あの 嵐の夜、おれも 海に いた。 ハル嬢ちゃんを 救えなかった。'),
      who('baldo', 'determined', 'だからよ。 今度は 間に合わせる。 さあ、乗りな！')]);
    if (!(await confirm('かもめ丸に 乗りますか？'))) return;
    await sail(1); G.flags.c2arrive = true;
    await say([who('baldo', 'grin', '着いたぞ！ ここが 霧の大陸の 玄関口、港町ミナトだ！'), who('sora', 'surprised', 'ひ、人が いっぱい……！ 島の 何倍 いるんだろう。'),
      who('baldo', 'neutral', '大陸の いきものは 島より 手ごわい。 まずは 武器屋で 装備を ととのえな。 研究所の ちびっこにも 会ってみるといい。')]); save(); return; }
  const dest = G.region === 0 ? 1 : 0;
  if (await confirm(`${dest ? '霧の大陸' : '風灯の島'}へ 船を 出すか？`)) await sail(dest);
}
async function sail(dest) {
  await fade(true);
  G.region = dest; World.setRegion(dest); enemies = []; const r = REGr();
  player.x = r.pier.x; player.z = r.pier.z - 8; player.y = surfaceAt(player.x, player.z, 99); player.vx = player.vz = player.vy = 0; trail.length = 0; cam.yaw = Math.PI; player.yaw = Math.PI;
  await cinematic('sail', REGION_NAME[dest], dest ? '— かもめ丸の 船旅 —' : '— 帰りの 船旅 —');
  Music.play(fieldSong(), { restart: true }); await wait(250); await fade(false); save(); }
async function talkInn() { const sky = G.region === 2, sea = G.region === 3, cost = sea ? 60 : sky ? 40 : 20; const c = await menu({ title: sea ? '泡の宿「あぶく亭」' : sky ? '雲の宿「ふわり亭」' : '宿屋「うみねこ亭」', items: [{ label: 'とまる', sub: `${cost}G・全回復＋記録`, disabled: G.gold < cost }, { label: 'はなす' }] });
  if (c === 0) await rest(cost); else if (c === 1) await say([sky ? nm('雲の宿の 主人', '雲わたの 布団は ふかふかだよ。 ……星が 減ってから、夜が さびしくてねえ。') : nm('宿屋の おかみ', '最近は 夜に なると 空が ざわつくのよ。 星が 東の 砂漠へ 落ちていくの。')]); }
// ================= ショップ UI（v5） =================
const ICON = (() => { const w = (b) => `<svg viewBox="0 0 32 32" class="ic" aria-hidden="true">${b}</svg>`;
  const I = {
    sword: c => w(`<path d="M22 3 L29 3 L29 10 L13 26 L9 22 Z" fill="${c}" stroke="#fff" stroke-width="1"/><path d="M6 19 L13 26 M4 24 L8 28" stroke="#8a5a2a" stroke-width="3" stroke-linecap="round"/><circle cx="5" cy="27" r="2" fill="#f3c15a"/>`),
    harp: c => w(`<path d="M8 28 C4 16 8 6 18 4 C26 3 28 10 24 14 C20 18 16 20 16 28 Z" fill="none" stroke="${c}" stroke-width="3"/><path d="M11 25 L19 7 M14 25 L21 10 M8 22 L16 6" stroke="#fff" stroke-width="1"/>`),
    spear: c => w(`<path d="M5 27 L22 10" stroke="#8a5a2a" stroke-width="3" stroke-linecap="round"/><path d="M20 12 L24 4 L29 3 L28 8 L20 12 Z" fill="${c}" stroke="#fff"/>`),
    staff: c => w(`<path d="M8 28 L20 10" stroke="#8a5a2a" stroke-width="3" stroke-linecap="round"/><path d="M22 3 l2 5 l5 1 l-4 3 l1 5 l-4 -3 l-4 3 l1 -5 l-4 -3 l5 -1 z" fill="${c}"/>`),
    fan: c => w(`<path d="M16 28 L3 12 C8 4 24 4 29 12 Z" fill="${c}" stroke="#fff"/><path d="M16 28 L9 7 M16 28 L16 5 M16 28 L23 7" stroke="#fff" stroke-width="1"/>`),
    armor: c => w(`<path d="M8 5 L13 7 L16 9 L19 7 L24 5 L29 11 L25 14 L25 28 L7 28 L7 14 L3 11 Z" fill="${c}" stroke="#fff"/><path d="M16 9 L16 28" stroke="rgba(0,0,0,.3)"/>`),
    potion: c => w(`<path d="M13 3 H19 V9 C25 11 27 16 26 21 C25 27 20 29 16 29 C12 29 7 27 6 21 C5 16 7 11 13 9 Z" fill="${c}" stroke="#fff"/><ellipse cx="12" cy="17" rx="2" ry="4" fill="#fff" opacity=".5"/>`),
    fruit: c => w(`<circle cx="16" cy="19" r="9" fill="${c}" stroke="#fff"/><path d="M16 10 C16 6 18 4 21 4" stroke="#5a8a3a" stroke-width="2" fill="none"/><ellipse cx="13" cy="16" rx="2" ry="3" fill="#fff" opacity=".5"/>`),
    bread: c => w(`<path d="M4 20 C4 10 28 10 28 20 L28 25 L4 25 Z" fill="${c}" stroke="#fff"/><path d="M11 14 L13 19 M16 13 L17 19 M21 14 L20 19" stroke="#8a5a2a" stroke-width="1.5"/>`),
    feather: c => w(`<path d="M6 28 C8 14 18 4 28 4 C26 14 18 22 6 28 Z" fill="${c}" stroke="#fff"/><path d="M6 28 L24 8" stroke="#9fb4d8"/>`),
    rock: c => w(`<path d="M5 24 L9 11 L19 6 L27 14 L26 25 Z" fill="${c}" stroke="#fff"/>`),
    log: c => w(`<rect x="4" y="11" width="24" height="11" rx="5" fill="${c}" stroke="#fff"/><ellipse cx="25" cy="16.5" rx="3" ry="5" fill="#d8b884"/>`),
    star: c => w(`<path d="M16 3 l3.6 8 l8.4 .8 l-6.4 5.6 l2 8.4 l-7.6 -4.6 l-7.6 4.6 l2 -8.4 l-6.4 -5.6 l8.4 -.8 z" fill="${c}" stroke="#fff"/>`),
    cloud: c => w(`<path d="M8 24 C3 24 3 17 8 16 C8 10 16 8 18 13 C21 9 28 12 26 18 C30 19 29 24 25 24 Z" fill="${c}" stroke="#9fb4d8"/>`),
    bowl: c => w(`<path d="M4 15 H28 C28 23 22 28 16 28 C10 28 4 23 4 15 Z" fill="${c}" stroke="#fff"/><path d="M10 11 C10 8 12 8 12 5 M16 11 C16 8 18 8 18 5 M22 11 C22 8 24 8 24 5" stroke="#fff" fill="none" opacity=".7"/>`),
  };
  const map = { mi: ['fruit', '#e05050'], pan: ['bread', '#d8a060'], shizuku: ['potion', '#6fb2f0'], nakayoshi: ['fruit', '#ff8ac4'], hane: ['feather', '#f4f0e6'], maki: ['log', '#8a5a34'], ishi: ['rock', '#9a968e'], suna: ['rock', '#e0c890'],
    ha: ['feather', '#6fbf5a'], hoshikake: ['star', '#ffe38a'], kinoko: ['fruit', '#c0553a'], yakimi: ['fruit', '#b06030'], kinojiru: ['bowl', '#c08a50'], ganbari: ['bowl', '#8fe06a'], stew: ['bowl', '#f3c15a'], kumowata: ['cloud', '#ffffff'], dokukeshi: ['feather', '#8fe06a'], ...(HOOK.icons || {}) };
  const wep = { sora: 'sword', mio: 'harp', riku: 'spear', sana: 'staff', haru: 'fan', kaito: 'spear' };
  return { item: k => { const [f, c] = map[k] || (HOOK.icons || {})[k] || ['star', '#ccc']; return I[f](c); }, gear: (id, tier) => I[wep[id] || 'sword'](['#c9ced6', '#d8b884', '#f3c15a', '#9fd0ff', '#ffe38a', '#c9b8ff'][Math.min(tier, 5)]), armor: tier => I.armor(['#8a7a60', '#a07a50', '#9a968e', '#b8c0d0', '#c9b8ff', '#ffffff'][Math.min(tier, 5)]) }; })();
const KEEPER = { weapon: ['weapon', '武器と防具の店', 'いらっしゃい！ いい品が そろってるよ。'], item: ['item', '道具屋', 'まいど！ 旅の 備えは 万全かい？'] };
// v9：店は balance.js の HOOK.shopUI(kind, { town }) へ（町ごとの 品ぞろえ・そうび袋・売買・鍛冶）。 下は 旧版の フォールバック
function shopUI(kind, o) { return HOOK.shopUI ? HOOK.shopUI(kind, o || {}) : shopUI0(kind); }
function shopUI0(kind) {
  return new Promise(res => {
    const sky = G.region === 2, sea = G.region === 3; const shopName = kind === 'armor' ? (sea ? '海の防具屋' : sky ? '空の防具屋' : '防具屋') : kind === 'weapon' ? (sea ? '海の武器屋' : sky ? '空の武器屋' : '武器屋') : (sea ? '海の道具屋' : sky ? '空の道具屋' : '道具屋');
    const tabs = kind === 'weapon' ? [['w', 'ぶき'], ['s', 'うる']] : kind === 'armor' ? [['a', 'ぼうぐ'], ['s', 'うる']] : [['i', 'かう'], ['s', 'うる']];
    let tab = tabs[0][0], sel = 0, qty = 1, armed = null, line = kind === 'armor' ? (sea ? '人魚の 鱗は かるくて じょうぶさ。' : sky ? '雲の 糸で 織った 防具だよ。' : 'よろいは 命を まもる。 仲間の ぶんも 忘れずに！') : kind === 'weapon' ? (sky ? '雲の上の 鍛冶は 軽くて 強いのさ。' : 'いらっしゃい！ いい品が そろってるよ。') : (sky ? '空の 旅には がんばり串が 欠かせないよ。' : 'まいど！ 旅の 備えは 万全かい？');
    const el = document.createElement('div'); el.className = 'win panel shop';
    const M = { el, panel: true, items: [], res }; const close = () => { closeMenu(M, -1); hud(); };
    const nameM = m => esc(nameOf(m)); const face = m => `<span class="fc">${Art.portrait(m.id, 'smile')}</span>`;
    const rows = () => {
      if (tab === 'w') { const out = []; for (const m of G.party) DATA.gear[m.id].forEach((g, i) => { if (g.price && !!g.sky === sky && !!g.sea === sea) out.push({ t: 'w', m, i, g, name: g.name, price: g.price, sub: nameOf(m), icon: ICON.gear(m.id, i), dis: G.eq[m.id].w >= i }); }); return out; }
      if (tab === 'a') return DATA.armor.map((a, i) => ({ t: 'a', i, a, name: a.name, price: a.price, sub: `ぼうぎょ ${a.def}`, icon: ICON.armor(i), dis: G.party.every(m => G.eq[m.id].a >= i) })).filter(o => o.price && !!o.a.sky === sky && !!o.a.sea === sea);
      if (tab === 'i') { const ids = (sea ? ['pan', 'shizuku', 'nakayoshi', 'hane', 'ganbari', 'dokukeshi'] : sky ? ['pan', 'shizuku', 'nakayoshi', 'hane', 'ganbari', 'dokukeshi'] : ['mi', 'pan', 'shizuku', 'nakayoshi', 'hane', 'ganbari', 'dokukeshi']).concat(HOOK.shopExtra ? HOOK.shopExtra(G.region) : []); return ids.map(k => ({ t: 'i', k, name: DATA.items[k].name, price: DATA.items[k].price, sub: `もち ${G.inv[k] || 0}`, icon: ICON.item(k) })); }
      return Object.keys(DATA.items).filter(k => (G.inv[k] || 0) > 0 && DATA.items[k].sell).map(k => ({ t: 's', k, name: DATA.items[k].name, price: DATA.items[k].sell, sub: `もち ${G.inv[k]}${DATA.items[k].mat ? '・素材' : ''}`, icon: ICON.item(k) })); };
    const detail = o => {
      if (!o) return `<div class="sdet"><p class="st-eq">${tab === 's' ? 'うれる ものが ない。' : '品物が ない。'}</p></div>`;
      if (o.t === 'w') { const m = o.m, cur = DATA.gear[m.id][G.eq[m.id].w], diff = o.g.atk - cur.atk; const trade = Math.floor((G.eq[m.id].paid || 0) * .5);
        return `<div class="sdet"><h4>${o.icon}${o.name}</h4><div>${nameM(m)} せんよう の ぶき</div>
          <div class="cmp"><div class="cmp-row">${face(m)}<span>こうげき ${m.st.atk}</span><b class="${diff > 0 ? 'up' : diff < 0 ? 'dn' : 'eq'}">→ ${m.st.atk + diff}　${diff > 0 ? '▲' + diff : diff < 0 ? '▼' + (-diff) : '±0'}</b></div></div>
          <div class="st-eq">いまの ぶき：${cur.name}${trade ? `（下取り ${trade}G）` : ''}</div>${o.dis ? '<div class="eq">もう もっている（または 上位を そうび中）</div>' : `<button class="buy" data-buy="1" ${G.gold + trade < o.price ? 'disabled' : ''}>${armed === 'buy' ? '本当に 買う？（そうびする）' : `買う ${o.price}G`}</button>`}</div>`; }
      if (o.t === 'a') { const rowsP = G.party.map(m => { const cur = DATA.armor[G.eq[m.id].a], d = o.a.def - cur.def; return `<div class="cmp-row">${face(m)}<span>${nameM(m)}　ぼうぎょ ${m.st.def}</span>${G.eq[m.id].a >= o.i ? '<b class="eq">そうびずみ</b>' : `<b class="${d > 0 ? 'up' : 'dn'}">→ ${m.st.def + d}　▲${d}</b>`}</div>`; }).join('');
        const need = G.party.filter(m => G.eq[m.id].a < o.i).length, tot = Math.round(o.price * need * (need > 1 ? .9 : 1));
        const one = armed && armed.startsWith('one') ? +armed.slice(3) : -1;
        const rowsQ = G.party.map((m, pi) => { const cur = DATA.armor[G.eq[m.id].a], d = o.a.def - cur.def; return `<div class="cmp-row">${face(m)}<span>${nameM(m)}　ぼうぎょ ${m.st.def}${G.eq[m.id].a >= o.i ? '' : `<b class="up"> → ${m.st.def + d} ▲${d}</b>`}</span>${G.eq[m.id].a >= o.i ? '<b class="eq">そうびずみ</b>' : `<button class="buy" style="padding:3px 10px;font-size:12px" data-one="${pi}" ${G.gold < o.price ? 'disabled' : ''}>${one === pi ? '本当に？' : o.price + 'G'}</button>`}</div>`; }).join('');
        return `<div class="sdet"><h4>${o.icon}${o.name}</h4><div class="cmp">${rowsQ}</div>${need > 1 ? `<button class="buy" data-buy="1" ${G.gold < tot ? 'disabled' : ''}>${armed === 'buy' ? '本当に 買う？' : `${need}人ぶん まとめて ${tot}G（1割引）`}</button>` : need ? '' : '<div class="eq">みんな そうびずみ</div>'}</div>`; }
      const it = DATA.items[o.k]; const max = o.t === 'i' ? Math.max(1, Math.min(99, Math.floor(G.gold / o.price))) : G.inv[o.k]; qty = Math.min(Math.max(1, qty), max);
      return `<div class="sdet"><h4>${o.icon}${it.name}</h4><div>${it.desc}</div><div class="st-eq">入手：${it.src || '—'}<br>使いみち：${it.use || '—'}</div><div>もっている：${G.inv[o.k] || 0}こ</div>
        <div class="qty"><button data-q="-10">«</button><button data-q="-1">−</button><b>×${qty}</b><button data-q="1">＋</button><button data-q="10">»</button><span class="pr">${o.t === 'i' ? '' : '+'}${o.price * qty}G</span></div>
        <button class="buy" data-buy="1" ${o.t === 'i' && G.gold < o.price * qty ? 'disabled' : ''}>${armed === 'buy' ? (o.t === 's' ? '本当に 売る？' : '本当に 買う？') : o.t === 's' ? '売る' : '買う'}</button></div>`; };
    const paint = () => { const R0 = rows(); sel = Math.min(sel, Math.max(0, R0.length - 1)); const o = R0[sel];
      el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button><div class="shop-top"><div class="shop-face">${Art.portrait(kind === 'weapon' ? 'shopW' : 'shopI', armed ? 'grin' : 'smile')}</div><div><b>${shopName}</b><div class="shop-say">「${line}」</div></div><div class="shop-gold">${G.gold} G</div></div>
        <div class="tabs">${tabs.map(([k, n]) => `<button class="tab${k === tab ? ' on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
        <div class="shop-body"><div class="slist">${R0.map((r, i) => `<button class="srow${i === sel ? ' on' : ''}${r.dis ? ' dis' : ''}" data-i="${i}">${r.icon}<span>${r.name}<small>${esc(r.sub)}</small></span><span class="pr">${r.price}G</span></button>`).join('') || '<p class="st-eq">なし</p>'}</div>${detail(o)}</div>`;
      el.querySelector('.m-x').onclick = () => { Music.sfx('cancel'); close(); };
      el.querySelectorAll('.tab').forEach(b => b.onclick = () => { tab = b.dataset.tab; sel = 0; qty = 1; armed = null; Music.sfx('cursor'); paint(); });
      el.querySelectorAll('.srow').forEach(b => b.onclick = () => { sel = +b.dataset.i; qty = 1; armed = null; Music.sfx('cursor'); paint(); });
      el.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { qty += +b.dataset.q; armed = null; Music.sfx('cursor'); paint(); });
      const bb = el.querySelector('[data-buy]'); if (bb) bb.onclick = () => act(o);
      el.querySelectorAll('[data-one]').forEach(b => b.onclick = () => { const pi = +b.dataset.one; if (armed !== 'one' + pi) { armed = 'one' + pi; Music.sfx('cursor'); paint(); return; } armed = null;
        const m = G.party[pi]; if (G.gold < o.price || G.eq[m.id].a >= o.i) return; G.gold -= o.price; const r = m.hp / m.st.hp; G.eq[m.id].a = o.i; calc(m); m.hp = Math.round(m.st.hp * r); line = `${esc(nameOf(m))}に ${o.name}だね。 まいど！`; Music.sfx('buy'); paint(); hud(); save(); });
      const on = el.querySelector('.srow.on'); on && on.scrollIntoView && on.scrollIntoView({ block: 'nearest' }); };
    const act = o => { if (!o) return; if (armed !== 'buy') { armed = 'buy'; Music.sfx('cursor'); paint(); return; } armed = null;
      if (o.t === 'w') { const m = o.m, trade = Math.floor((G.eq[m.id].paid || 0) * .5); if (G.gold + trade < o.price) return; G.gold -= o.price - trade; G.eq[m.id].w = o.i; G.eq[m.id].paid = o.price; calc(m); line = `${o.name}だね。 ${esc(nameOf(m))}に よく にあうよ！${trade ? `（下取り ${trade}G）` : ''}`; Music.sfx('buy'); }
      else if (o.t === 'a') { const who2 = G.party.filter(m => G.eq[m.id].a < o.i); const tot = Math.round(o.price * who2.length * (who2.length > 1 ? .9 : 1)); if (G.gold < tot) return; G.gold -= tot; who2.forEach(m => { const r = m.hp / m.st.hp; G.eq[m.id].a = o.i; calc(m); m.hp = Math.round(m.st.hp * r); }); line = `まいど！ ${who2.length}人ぶんの ${o.name}だ。`; Music.sfx('buy'); }
      else if (o.t === 'i') { if (G.gold < o.price * qty) return; G.gold -= o.price * qty; gain(o.k, qty); line = `${DATA.items[o.k].name}を ${qty}こ だね。 まいど！`; Music.sfx('buy'); }
      else { qty = Math.min(qty, G.inv[o.k] || 0); if (qty <= 0) return; G.inv[o.k] -= qty; G.gold += o.price * qty; line = `${DATA.items[o.k].name}を ${qty}こ、たしかに。`; Music.sfx('pick'); }
      qty = 1; paint(); hud(); save(); };
    M.key = e => { if (e.repeat) return; const R0 = rows(); const k = e.code;
      if (['Escape', 'Backspace', 'KeyX'].includes(k)) { e.preventDefault(); Music.sfx('cancel'); close(); return; }
      if (k === 'ArrowDown' || k === 'KeyS') { sel = Math.min(R0.length - 1, sel + 1); qty = 1; armed = null; Music.sfx('cursor'); paint(); }
      else if (k === 'ArrowUp' || k === 'KeyW') { sel = Math.max(0, sel - 1); qty = 1; armed = null; Music.sfx('cursor'); paint(); }
      else if (k === 'ArrowRight' || k === 'KeyD') { if (R0[sel] && (R0[sel].t === 'i' || R0[sel].t === 's')) { qty++; armed = null; paint(); } else { const ti = tabs.findIndex(t => t[0] === tab); tab = tabs[(ti + 1) % tabs.length][0]; sel = 0; armed = null; paint(); } }
      else if (k === 'ArrowLeft' || k === 'KeyA') { if (R0[sel] && (R0[sel].t === 'i' || R0[sel].t === 's') && qty > 1) { qty--; armed = null; paint(); } else { const ti = tabs.findIndex(t => t[0] === tab); tab = tabs[(ti + tabs.length - 1) % tabs.length][0]; sel = 0; armed = null; paint(); } }
      else if (k === 'Tab') { e.preventDefault(); const ti = tabs.findIndex(t => t[0] === tab); tab = tabs[(ti + 1) % tabs.length][0]; sel = 0; armed = null; paint(); }
      else if (['Enter', 'Space', 'KeyE'].includes(k)) { e.preventDefault(); const b = el.querySelector('[data-buy]') || el.querySelector('[data-one]:not([disabled])'); if (b && !b.disabled) b.click(); } };
    paint(); $('ui').appendChild(el); MENUS.push(M); }); }
async function talkItem() { await shopUI('item'); }
async function talkWeapon() { await shopUI('weapon'); }
async function talkTsumugi() {
  const F = G.flags;
  if (!F.dex) {
    await say([who('tsumugi', 'surprised', 'わっ！ お、お客さん……？ ……あっ！！ その子！！'),
      G.mons[0] ? who('tsumugi', 'grin', `${SPC[G.mons[0].id].name}だ！ 島の いきものだよね！？ 本物 はじめて 見た！`) : who('tsumugi', 'grin', '島から 来たの！？ 島の いきもの、見たこと ある？'),
      who('tsumugi', 'smile', 'わたし、ツムギ。 いきもの研究家の……見習い。 おばあちゃんの 図鑑、とちゅうで 止まったままなの。'),
      who('tsumugi', 'worried', '町の 大人は「かげものの 図鑑なんて、だれが 買うんだ」って 笑うけど……。'),
      who('sora', 'smile', 'ぼくは 読みたいな。 かげものが もとに もどった あとの 顔、ぜんぶ 見てみたい。'),
      who('tsumugi', 'joy', '……！ じゃあ、手伝って！ 島と 大陸には 28種の いきものが いるって、おばあちゃんの ノートに あるの。'),
      { t: '「いきもの図鑑」を もらった！', fx: () => { F.dex = true; Music.sfx('friend'); } },
      who('tsumugi', 'grin', '夜にしか 出ない子、育つと すがたが 変わる子、ごくたまに 色が ちがう子も いるんだって。 見つけたら ぜったい 教えてね！'),
      F.glider ? who('tsumugi', 'surprised', 'あっ、その 風布……！ おばあちゃんが 作ってた ものと 同じ 織りかただ。 大事に してね！')
        : who('tsumugi', 'smile', 'あと、これ。 おばあちゃんの 形見の「風布」。 とびあがって、空中で もう一回 ジャンプ！ 風に のって すべれるよ。'),
      F.glider ? null : { t: '「風布」を 手に入れた！', fx: () => { F.glider = true; Music.sfx('friend'); } }]); save(); return; }
  if (F.c2done && !F.c3start) {
    await say([who('tsumugi', 'surprised', 'あっ、{name}！ たいへん たいへん！ おばあちゃんの ノートの 最後の ページ、やっと 読めたの！'),
      who('tsumugi', 'determined', '「星の遺跡の 祭壇で 星笛を ふけば、星の くじらが 空の 島へ はこんでくれる」……だって！'),
      inParty('sana') ? who('sana', 'worried', 'やっぱり……。 星の こえが 言っているんです。 空の 上で、星が ひとつずつ 消えている、と。') : null,
      who('sora', 'surprised', 'そういえば 最近、夜空の 星が 少ない 気が する……。'),
      inParty('riku') ? who('riku', 'determined', '星喰いは「かけら」だった。 本体は 空の 上って わけか。') : null,
      who('tsumugi', 'smile', 'はい、これ。 おばあちゃんが 遺した「星笛」。 わたしは 図鑑の 仕事が あるから ここで 待ってるね。'),
      { t: '「星笛」を 手に入れた！', fx: () => { F.c3start = true; Music.sfx('friend'); } },
      who('tsumugi', 'grin', '空の いきもの、ぜったい 見せてね！ 図鑑は 38種まで ふえたんだから！'),
]); await titleCard('第3章', '天空の星巣'); save(); return; }
  if (G.mons.length >= 2 && F.c2done && !talkTsumugi.skip) { const c = await menu({ title: 'ツムギの 研究所', items: [{ label: '図鑑の ほうこく' }, { label: 'わざの 継承', sub: '星のかけら2・500G' }] }); if (c < 0) return; if (c === 1) { await inheritMenu(); return; } }
  const got = Object.keys(G.dex.got).length, seen = Object.keys(G.dex.seen).length;
  const pend = DATA.dexRewards.filter(r => got >= r.n && !G.rewards[r.n]);
  if (pend.length) { for (const r of pend) { G.rewards[r.n] = 1; if (r.gold) G.gold += r.gold; if (r.give) for (const [k, v] of Object.entries(r.give)) G.inv[k] = (G.inv[k] || 0) + v; if (r.blocks) for (const [k, v] of Object.entries(r.blocks)) G.blk[k] = (G.blk[k] || 0) + v; if (r.title) G.title = r.title; }
    Music.jingle('levelup', fieldSong()); await say([who('tsumugi', 'joy', `すごい！ なかまに した いきもの ${got}種！`), ...pend.map(r => `ごほうび：${r.text}を もらった！`)]); hud(); save(); return; }
  const nx = DATA.dexRewards.find(r => got < r.n);
  await say([who('tsumugi', 'smile', `図鑑は いま、見つけた ${seen}種・なかま ${got}種。${nx ? ` あと ${nx.n - got}種 なかまに したら、ごほうびが あるよ！` : ' ぜんぶ そろったね！ おばあちゃん、きっと よろこんでる。'}`),
    G.flags.c2done && !G.dex.got.hoshikujira ? who('tsumugi', 'worried', 'ねえ、知ってる？ 星喰いが いなくなった 夜から、遺跡の 空に 大きな くじらが 泳ぐんだって……。') : null]);
}
async function inheritMenu() {
  if (!G.tips.inherit) { G.tips.inherit = 1; await say([who('tsumugi', 'determined', 'いきもの どうしで わざを 教えあうの！ 教える子は そのまま。 おぼえる子は 最大2つまで 継承わざを もてるよ。')]); }
  const pick = async (title, list) => { const i = await menu({ title, items: list.map(m => ({ label: nameOf(m), sub: `Lv${m.lv} ${DATA.types[SPC[m.id].type]} 継承${(m.extra || []).length}/2` })), where: 'side' }); return i < 0 ? null : list[i]; };
  const tgt = await pick('おぼえる子を えらぶ', G.mons); if (!tgt) return;
  const donors = G.mons.filter(d => d !== tgt); const dn = await pick('教える子を えらぶ', donors); if (!dn) return;
  const cand = dn.skills.filter(s => !tgt.skills.includes(s) && DATA.skills[s] && !DATA.skills[s].id);
  if (!cand.length) { await say([who('tsumugi', 'worried', 'あたらしく 教えられる わざが ないみたい。')]); return; }
  const j = await menu({ title: `${nameOf(dn)} → ${nameOf(tgt)}`, items: cand.map(s => ({ label: DATA.skills[s].name, sub: DATA.skills[s].type ? DATA.types[DATA.skills[s].type] : '', hint: DATA.skills[s].desc, disabled: (G.inv.hoshikake || 0) < 2 || G.gold < 500 })), where: 'side' }); if (j < 0) return;
  tgt.extra = tgt.extra || []; if (tgt.extra.length >= 2) { const k = await menu({ title: 'わすれさせる 継承わざ', items: tgt.extra.map(s => ({ label: DATA.skills[s].name })) }); if (k < 0) return; tgt.extra.splice(k, 1); }
  G.inv.hoshikake -= 2; G.gold -= 500; tgt.extra.push(cand[j]); calc(tgt); Music.jingle('levelup', fieldSong());
  await say([who('tsumugi', 'joy', `やった！ ${nameOf(tgt)}が ${DATA.skills[cand[j]].name}を おぼえたよ！`)]); hud(); save(); }
async function talkGuild() {
  const F = G.flags;
  if (!F.c2rumor) {
    await say([nm('ギルドの 受付', 'ようこそ、冒険者ギルドへ！ 依頼は 掲示板で 受けてね。 かげものを しずめたり、素材を とどけたりで お金に なるわ。'),
      nm('ギルドの 受付', '……え、星の 話？ ええ、東の 砂漠の「星の遺跡」に 星が 落ちつづけてるの。 おかげで 港は 星のかけら 売りで 大もうけ。 ……ここだけの 話、ちょっと 品が ないわよね。'),
      nm('ギルドの 受付', '紺色の 髪の 女の子が、ひとりで 遺跡へ 入っていくのを 見たって 人が いたわ。 星の 髪飾りを つけた子。'),
      inParty('riku') ? who('riku', 'surprised', '……星の 髪飾り。 サナだ。 まちがいねえ。') : null,
      inParty('riku') ? who('riku', 'determined', '{name}、 悪いが 急ぐぞ。') : who('sora', 'determined', '東の 砂漠……行ってみよう。'), { t: '町の 東、砂漠の 空に、細い 光の 柱が 立ちのぼっている。 あれが 星の遺跡だ。', fx: () => { F.c2rumor = true; } }]); save(); return; }
  await bountyBoard();
}

// ---- chapter 1 ----
const fuelOf = b => DATA.trials[b.i].fuel;
const fuelOk = b => Object.entries(fuelOf(b)).every(([k, v]) => (G.inv[k] || 0) >= v);
const fuelTxt = b => Object.entries(fuelOf(b)).map(([k, v]) => `${DATA.items[k].name} ${Math.min(G.inv[k] || 0, v)}/${v}`).join('・');
function trialDone(b) { const st = G.trial[b.i]; return b.i === 0 ? (st.shards || 0) >= 3 : b.i === 2 ? (st.waves || 0) >= 3 : true; }
async function beaconEvent(b, atTop) {
  if (!G.flags.metGen) { await say(['灯台の 足もとに、黒い 気配が うずまいている。', who('sora', 'worried', '……まずは 村で じゅんびを しよう。')]); return; }
  const T = DATA.trials[b.i], st = G.trial[b.i];
  if (HOOK.beaconGate) { const g = HOOK.beaconGate(b); if (g) { await say(g); return; } }
  if (!st.seen) { st.seen = 1; await say([`【灯台の試練　${T.name}】`, T.text, `（火を ともす 燃料：${fuelTxt(b)}）`]); }
  if (b.act.top && !atTop) { await say([b.i === 1 ? '火皿は 灯台ではなく、となりの 高い 塔の てっぺんに ある。 がんばりゲージが あれば 壁を よじ登れる。 ブロックで 階段を 作っても いい。'
    : '火皿は 崖の 先に 浮かぶ 足場の 上だ。 風布で 滑空するか、ブロックで 橋を かけよう。']); return; }
  if (!HOOK.beaconGate && b.i === 0 && (st.shards || 0) < 3) { await say([`灯の欠片が 足りない（${st.shards || 0}/3）。 灯台の まわりで 光っている 欠片を さがそう。`]); return; }
  if (!HOOK.beaconGate && b.i === 2 && (st.waves || 0) < 3) {
    if (!(await confirm(`かげものの 群れが せまってくる。（推奨Lv${DATA.guardLv[G.order]}） 迎えうつ？`))) return;
    for (let w = st.waves || 0; w < 3; w++) {
      await say([`第${w + 1}波！`]); const lv = Math.max(1, DATA.guardLv[G.order] - 3 + w);
      const pool = ['watapoko', 'iwanoko', 'mizumochi', 'hanapokke', 'tsuchimogu']; const n = 2 + (w > 0 ? 1 : 0);
      const res = await runBattle(Array.from({ length: n }, () => ({ sp: pool[Math.floor(R() * pool.length)], lv, shiny: R() < 1 / 64 })), { noFlee: true });
      if (res !== 'win') return defeated(); st.waves = w + 1; save(); }
    await say(['群れを しりぞけた！']); }
  if (b.i === 3 && !b.guard && World.skyInfo(G.tod).night < .5) {
    const c = await menu({ title: '火皿は かたく 閉じている。 夜にしか ひらかないようだ。', items: [{ label: '夜まで 待つ' }, { label: 'やめておく' }] });
    if (c !== 0) return; await fade(true); G.tod = .82; await wait(300); await fade(false); await say(['……夜に なった。 火皿が ゆっくりと ひらいていく。']); }
  if (!b.guard) {
    const gi = G.order, gid = DATA.guards[gi]; const pre = [`（推奨Lv${DATA.guardLv[gi]}）`];
    if (gi === 0) pre.push('とつぜん、灯台の 足もとから 黒い つるが のびてきた！', inParty('mio') ? who('mio', 'worried', 'この子……灯を こわがってる。 でも、とめなきゃ！') : null, who('sora', 'determined', 'だいじょうぶ、こわくないよ。 ……ぼくも ちょっと こわいけど！'));
    if (gi === 1) pre.push(who('riku', 'angry', '待て。 その灯台に 火を つけるな。'), who('sora', 'surprised', 'き、きみが リク？ シオミの ナミさんが 心配してたよ。'), who('riku', 'smirk', '……あの町が？ おれに 石を 投げた 町が、心配ねえ。'),
      who('riku', 'angry', '灯を ともせば、あいつが 気づく。 おれの 故郷は、それで 一晩で 喰われた。'), who('sora', 'determined', 'でも 灯が なかったら、だれも 帰ってこられない！'), who('riku', 'determined', '……口じゃ わからねえか。 かかってこい、甘ちゃん。'));
    if (gi === 2) pre.push('地ひびきと ともに、岩の かたまりが 立ちあがった！', inParty('riku') ? who('riku', 'smirk', 'でけえな。 ……おい 甘ちゃん、足 ふるえてるぞ。') : null, who('sora', 'determined', 'む、武者ぶるいだよ！'));
    if (gi === 3) pre.push('海が 黒く ふくらみ、なにかが 顔を 出した！', inParty('mio') ? who('mio', 'sad', 'この子の こえ……さみしい、って。') : null, who('sora', 'determined', 'さみしいなら、なおさら 灯が いるよ。'));
    if (gi === 4) pre.push('空が 裂け、夜の とばりが 鳥の かたちに なった！', who('sora', 'determined', 'これが 最後の 灯台だ。 みんな、いくよ！'));
    await say(pre);
    const res = await runBattle([{ boss: gid }], { boss: true, noFlee: true });
    if (res !== 'win') return defeated();
    b.guard = true;
    if (gi === 1) await say([who('riku', 'sad', '……ちっ。 まっすぐな 剣だ。 ばかみたいに。'), who('sora', 'smile', 'よく 言われる。 ……いっしょに 行こうよ。 きみの 故郷の 灯も、きっと また ともせる。'),
      who('riku', 'smirk', '……リクだ。 勘違いすんなよ。 闇の王を 追うのに 都合が いいだけだ。'), { t: 'リクが なかまに くわわった！', fx: () => { G.party.push(mkHuman('riku', Math.max(G.party[0].lv, 6))); fixTeam(); Music.sfx('friend'); } }]);
    else await say([`${DATA.enemies[gid].name}の かげが はれて、光の 粒に なって 消えていった。`]);
    save();
  }
  if (!HOOK.beaconGate && !fuelOk(b)) { await say([`火皿は 冷えきっている。 燃料が 足りない。`, `（必要：${fuelTxt(b)}）`, '（木を 切ると 薪と 葉っぱ、岩を 掘ると 石、夜の いきものから 夜露の しずくが 手に入る）']); return; }
  if (HOOK.beaconGate) { if (!(await confirm('灯台に 火を ともしますか？'))) return; }
  else { if (!(await confirm(`燃料（${Object.entries(fuelOf(b)).map(([k, v]) => DATA.items[k].name + v).join('・')}）を つかって 火を ともしますか？`))) return;
    for (const [k, v] of Object.entries(fuelOf(b))) G.inv[k] -= v; }
  b.lit = true; b.t = 0; const k = G.order; G.order++;
  Music.jingle('light', fieldSong()); allMembers().forEach(m => { m.hp = m.st.hp; m.mp = m.st.mp; });
  await wait(900);
  const L = DATA.letters[k];
  const react = [[who('sora', 'sad', '父さん……。')], [inParty('riku') && who('riku', 'determined', '師匠……？ 闇の王に、名前が あるってのか。')], [inParty('mio') && who('mio', 'sad', 'ずっと 泣いてる こえ……あれは、その人の こえ だったんだ。')],
    [who('sora', 'determined', 'ひとりじゃ 夜は 長すぎる……。 だから 灯が あるんだね。')], [inParty('riku') && who('riku', 'smile', '待ってる、か。 ……いい 親父さんじゃ ねえか。')]][k].filter(Boolean);
  const rw = DATA.beaconRewards[k];
  await say([`${k + 1}つめの 灯が ともった！`, '火皿の 下に、古い 封筒が はさまっていた。', who('kaito', 'smile', L[0]), who('kaito', 'smile', L[1]), ...react,
    { t: `【報酬】${rw.text}`, fx: () => { if (rw.kind === 'warp') { G.warp = true; G.stamMax += 20; G.stam = G.stamMax; } if (rw.kind === 'sp') G.party.forEach(m => G.sp[m.id] = (G.sp[m.id] || 0) + 2);
      if (rw.kind === 'glider') G.flags.glider = true; if (rw.kind === 'hp') { G.hpPct = (G.hpPct || 0) + .1; G.party.forEach(m => { calc(m); m.hp = m.st.hp; }); } Music.sfx('friend'); } }]);
  if (rw.kind === 'warp') tip('<b>ワープが つかえるように なった</b><span>メニューの「地図」から、ともした 灯台と 村へ 一瞬で もどれる。</span>', 'warp');
  if (rw.kind === 'sp') tip('<b>スキルポイントを もらった</b><span>メニューの「スキル」で 技や 能力を 覚えよう。</span>', 'sp2');
  save(); hud();
  if (G.order === 5) await finalOpen();
}
let darkness = 0, darkTarget = 0;
async function finalOpen() {
  await say(['五つの 灯が ともった、その とき——', { t: '島じゅうの 空が、墨を 流したように 黒く 染まった。', fx: () => { darkTarget = 1; } },
    who('yomi', 'angry', '……よくも 灯を ともしてくれたな、カイトの 子よ。 あいつと 同じ 目を して。'), who('yomi', 'neutral', '島の いちばん 高い 場所、宵の祠で 待つ。'), who('sora', 'determined', '行こう。 父さんも、きっと そこに いる。')]);
  G.flags.shrineOpen = true; save();
}
async function shrineEvent() {
  await say([`（推奨Lv${DATA.bossCfg.yomikage[0]}　連戦に なる。 準備は いいか？）`, who('yomi', 'neutral', '来たか。'), who('yomi', 'angry', '灯が あるから、人は 海へ 出る。 そして 帰ってこない。 ……だから 消した。 もう だれも、見送らなくて すむように。'),
    who('sora', 'determined', 'ちがう！ ぼくは 三年、消えた 灯台を 見てた。 灯が ないほうが、待つ 夜は ずっと 長いんだ！'), inParty('mio') ? who('mio', 'sad', 'きこえる……あなたの 中で、ずっと 泣いてる 女の子の こえ。') : null, who('yomi', 'angry', '……黙れ！ 夜よ、すべてを のみこめ！')]);
  let res = await runBattle([{ boss: 'yomikage' }], { boss: true, noFlee: true });
  if (res !== 'win') return defeated();
  await say([who('yomi', 'angry', 'まだだ……！ この 悲しみごと、永遠の 夜に しずめてやる！'), { t: '闇が ふくれあがり、空いっぱいの 王の すがたに なった！', fx: () => battleParty().forEach(m => { m.hp = Math.max(m.hp, Math.round(m.st.hp * .8)); m.mp = Math.max(m.mp, Math.round(m.st.mp * .6)); }) }]);
  res = await runBattle([{ boss: 'yoiyami' }], { boss: true, noFlee: true, keepMusic: true });
  if (res !== 'win') return defeated();
  await say(['宵闇の 王の からだから、黒い 霧が ほどけていく。', who('kurou', 'sad', '……あたたかい。 ああ、ハル……おまえも、この灯を 見ていたのか。'), '霧の むこうから、ひとりの 男が 歩いてきた。',
    who('kaito', 'smile', '師匠。 帰りましょう。 灯は ともっています。'), who('sora', 'surprised', '……父さん！'), who('kaito', 'joy', '大きく なったな、{name}。 ……よく ここまで 来た。'),
    who('sora', 'angry', '……おそいよ。 三年も。'), who('kaito', 'sad', 'ああ。 ……すまなかった。'),
    { t: '……夜が 明けていく。', fx: () => { darkTarget = 0; G.tod = .255; } }]);
  G.flags.cleared = true; await fade(true); player.x = 2; player.z = 4; player.y = surfaceAt(2, 4, 99); trail.length = 0; await fade(false);
  await say([who('yui', 'sad', '……おかえりなさい、あなた。'), who('kaito', 'smile', 'ただいま。 ……灯が 見えたから、帰ってこられた。'), who('gen', 'sad', '……帰ってきやがった。 ばかやろうが。'),
    who('nagi', 'grin', 'さあさあ！ 今夜は かざみ亭で 宴会だよ！'), who('sora', 'joy', '父さん、母さん。 ……ただいま！')]);
  save(); await credits(1);
  await say(['——第1章 クリア。 宴の 夜、広場の すみで クロウが ひとり、海を 見ている……。']);
}
// ---- chapter 2 ----
async function midbossEvent() {
  if (HOOK.gate2) { const g = HOOK.gate2(); if (g) { await say(g); return; } }
  await say([`（推奨Lv${DATA.bossCfg.ishigakiG[0]}）`, '遺跡の 奥から、重たい 足音が 近づいてくる。', '苔むした 石の 巨人が 立ちはだかった！']);
  const res = await runBattle([{ boss: 'ishigakiG' }], { boss: true, noFlee: true });
  if (res !== 'win') return defeated();
  G.flags.c2mid = true; await say(['石の 巨人は 静かに 崩れ、道が ひらけた。', inParty('riku') ? who('riku', 'determined', 'この先だ。 ……サナの 気配が する。') : null]); save();
}
async function altarEvent() {
  await say([`（推奨Lv${DATA.bossCfg.sanaShadow[0]}　連戦に なる）`, '祭壇の 上で、ひとりの 少女が 宙に 浮かんでいる。 その 目は、星のように 冷たく 光っていた。',
    inParty('riku') ? who('riku', 'surprised', 'サナ！！') : null, who('sana', 'angry', '……星の 道を じゃまする者は、ここで 消えなさい。'),
    inParty('riku') ? who('riku', 'angry', 'ふざけんな！ 目を さませ、サナ！') : null, inParty('mio') ? who('mio', 'worried', 'ちがう……この子の こえじゃない。 だれかが 口を 借りてる！') : null]);
  let res = await runBattle([{ boss: 'sanaShadow' }], { boss: true, noFlee: true });
  if (res !== 'win') return defeated();
  await say([who('sana', 'sad', '……にい、さん……？'), '少女の からだから、星空を 丸ごと 飲みこんだような 影が あふれだした！',
    { t: '「ひかりを……よこせ……。 星も、灯も、ぜんぶ わたしの ものだ……」', fx: () => battleParty().forEach(m => { m.hp = Math.max(m.hp, Math.round(m.st.hp * .8)); m.mp = Math.max(m.mp, Math.round(m.st.mp * .6)); }) },
    who('sora', 'determined', 'これが……星喰い！')]);
  res = await runBattle([{ boss: 'hoshikui' }], { boss: true, noFlee: true, keepMusic: true });
  if (res !== 'win') return defeated();
  await say(['星喰いは 悲鳴を あげ、無数の 光の 粒に なって 空へ 還っていった。', who('sana', 'sad', '兄さん……ごめんなさい。 わたし、あの こえに 自分で「はい」って 言ったんです。'),
    who('sana', 'sad', '「故郷の 灯を 返してあげる」って……。 ほしかった。 ぜんぶ、わたしの ものに したかった。'),
    inParty('riku') ? who('riku', 'sad', '……ばかやろう。 おれだって、あの夜 逃げたんだ。 おまえを 置いて。') : null, inParty('riku') ? who('riku', 'smile', '……おあいこだ。 よく 生きてたな、サナ。') : null,
    who('sana', 'smile', '{name}さん。 みなさん。 ありがとう ございます。 こんどは 自分の 足で、いっしょに 行かせてください。'),
    { t: 'サナが なかまに くわわった！', fx: () => { G.party.push(mkHuman('sana', Math.max(...G.party.map(m => m.lv)))); fixTeam(); Music.sfx('friend'); } },
    who('sana', 'worried', '……でも、星喰いは「かけら」でした。 空の 向こうに、もっと 大きな なにかが います。 星の こえが、そう 言っています。'),
    who('sora', 'determined', 'だったら、そこへも 行こう。 みんなで。 ……ひとりで 行くのは、もう なしだよ。')]);
  G.flags.c2done = true; save(); await credits(2);
  await say(['——第2章 クリア。 サラムの ウララさんも、きっと サナの 顔を 見たがっている……。']);
}
// ---- chapter 3 ----
const nightNow = () => World.skyInfo(G.tod).night > .5;
async function waitNight(title) { const c = await menu({ title, items: [{ label: '夜まで 待つ' }, { label: 'やめておく' }] }); if (c !== 0) return false;
  await fade(true); G.tod = .84; await wait(300); await fade(false); return true; }
async function flightCut(lines) { const el = $('cut'); el.hidden = false; const ph = phase; phase = 'cut'; Music.play('sky', { restart: true });
  for (const l of lines) { el.innerHTML = `<p>${l}</p>`; await wait(2500); } el.hidden = true; phase = ph; }
async function skyTravel(dest) {
  await fade(true); G.region = dest; World.setRegion(dest); enemies = []; const r = REGr();
  if (dest === 2) { player.x = r.pier.x; player.z = r.pier.z - 12; cam.yaw = Math.PI; player.yaw = Math.PI; }
  else { player.x = r.altar.x + 2.5; player.z = r.altar.z; cam.yaw = 0; }
  player.y = surfaceAt(player.x, player.z, 99); player.vx = player.vz = player.vy = 0; trail.length = 0; player.glide = false; player.safe = { x: player.x, z: player.z };
  await cinematic(dest === 2 ? 'sky' : 'skydown', REGION_NAME[dest], dest === 2 ? '— ホシクジラの 背に のって —' : '— 地上へ おりる —');
  Music.play(fieldSong(), { restart: true }); await wait(250); await fade(false); save(); }
async function fluteEvent() {
  const F = G.flags;
  if (F.c3arrive) { if (!(await confirm('星笛を ふいて、天空の浮島へ 向かいますか？'))) return; await say(['星笛の ねいろが 空に ひびく——', 'ホシクジラが 舞いおりてきた！']); await skyTravel(2); return; }
  if (!nightNow() && !(await waitNight('星笛は 夜空に しか ひびかない ようだ。'))) return;
  await say(['祭壇の 上で、星笛を ふいた。', '澄んだ ねいろが、星の 少ない 夜空へ すいこまれていく——',
    inParty('sana') ? who('sana', 'surprised', '……こたえが、あります！ 空の 上から！') : null,
    { t: '雲を 割って、星を まとった 巨大な くじらが 舞いおりてきた！', fx: () => Music.sfx('magic') },
    inParty('mio') ? who('mio', 'joy', 'この子……「乗って」って 言ってる！') : null,
    inParty('riku') ? who('riku', 'smirk', '……くじらに 乗って 空の 上、か。 もう なんでも ありだな。') : null,
    who('sora', 'determined', '行こう。 星が ぜんぶ 消えてしまう 前に！')]);
  await flightCut(['ホシクジラは 星の 海を 泳ぐように、夜空へ のぼっていく。', '雲を つきぬけ、さらに 高く——', '——雲の 上には、朝が あった。']);
  G.tod = .3; F.c3arrive = true; await skyTravel(2);
  await say(['見わたす かぎりの 雲の 海。 その 上に、いくつもの 島が 浮かんでいる。',
    inParty('riku') ? who('riku', 'surprised', 'おいおい……島が 浮いてやがる。') : null,
    who('haru', 'surprised', '……くじらに 乗って、地上から？ あなたたち、何者？'),
    who('sora', 'smile', 'ぼくは {name}。 風灯の島から 来たんだ。 星が 消えている わけを 知りたくて。'),
    who('haru', 'neutral', '……わたしは ハル。 この 先の「雲の里ククル」の 風読み。'),
    inParty('mio') ? who('mio', 'surprised', 'ハル……？ クロウさんの 娘さんと、同じ 名前……。') : null,
    who('haru', 'worried', 'クロウ……？ ……知らない。 わたし、四十年より 前の ことは なにも 覚えていないの。'),
    inParty('riku') ? who('riku', 'surprised', '四十年……？ どう見ても おれらと 同じくらいだろ。') : null,
    who('haru', 'smile', '空の 上では、時間が ゆっくり ながれるの。 ……長老さまに 会って。 里は この 先よ。'),
    who('sora', 'grin', '……ねえ、ここ 落ちたら どうなるの？'), who('haru', 'neutral', '雲が 近くの 島まで はこんでくれる。 ちょっと 痛いけど。')]);
  tip('<b>天空の浮島</b><span>光る 風の 柱＝上昇気流。 ジャンプ→もう一度 ジャンプで 滑空すると 空高く 舞いあがる。</span>', 'updraft'); save(); }
async function whaleEvent() { if (!(await confirm('ホシクジラに 乗って、霧の大陸（星の遺跡）へ おりますか？'))) return;
  await say(['ホシクジラは ゆっくりと 雲の 下へ おりていく——']); await skyTravel(1); }
async function talkHaruNpc() { await say([who('haru', 'neutral', '長老さまの 家は この 奥。 青い 屋根の 家よ。')]); }
async function talkSoyogi() {
  const F = G.flags;
  if (!F.c3elder) {
    await say([who('soyogi', 'smile', 'ほっほ。 地上の 客人とは、何十年ぶりかのう。 わしは ソヨギ。 この 里の 長老じゃ。'),
      who('soyogi', 'neutral', '北の「星巣の塔」には、空の 星を 守る 星守（ほしもり）さまが おられた。'),
      who('soyogi', 'sad', 'じゃが 四十年前、燃えつきて 消えていく 星を 見て、星守さまは 変わってしまわれた。 「消えるくらいなら、喰らって しまっておこう」と……。'),
      who('soyogi', 'sad', 'いまは「天喰み（あまはみ）」と 呼ばれておる。'),
      who('sora', 'worried', '……たいせつだから、しまっておきたい。 その 気持ちは、ちょっと わかるかも。'),
      inParty('sana') ? who('sana', 'worried', '天喰み……。 わたしを 操っていた 星喰いは、その かけら だったんですね。') : null,
      who('soyogi', 'determined', '塔は 風の 結界に 守られておる。 東・南西・西の 三つの「風の祠」で 試練を こえ、祠に 風を 通せば、虹の 橋が かかるじゃろう。'),
      who('soyogi', 'smile', 'ハルや。 この 子らを 案内して おあげ。 ……おまえは 風が 運んできた 子じゃ。 風の 道が 見えるじゃろう。'),
      who('haru', 'surprised', 'え……わたし？'), who('haru', 'determined', '……わかった。 星が 消えるのは、わたしも いや。'),
      { t: 'ハルが なかまに くわわった！', fx: () => { F.c3elder = true; const lv = Math.max(...G.party.map(m => m.lv)); G.eq.haru = { w: (G.eq.haru && G.eq.haru.w) || 0, a: Math.max((G.eq.haru && G.eq.haru.a) || 0, ...G.party.map(m => G.eq[m.id].a)) };
        G.party.push(mkHuman('haru', lv)); if (G.team.length >= 4) G.team[3] = 'haru'; else G.team.push('haru'); fixTeam(); Music.sfx('friend'); } },
      who('haru', 'smile', '……それと、ミオ。 くじらの 上で 口ずさんでた 歌。 わたし、どこかで 聞いた 気が するの。'),
      inParty('mio') ? who('mio', 'surprised', 'え……あれは、風灯の島に 古くから ある 子守歌だよ？') : null,
      who('soyogi', 'sad', '…………。')]);
    tip('<b>風の祠は どこからでも</b><span>東・南西・西、好きな 順に 挑める。 推奨Lvは 東30・南西32・西34。</span>', 'wind1'); save(); return; }
  const c = await menu({ title: 'ソヨギ', items: [{ label: 'はなす' }, { label: '空の 話を きく' }] });
  if (c === 0) { const left = DATA.windTrials.filter((_, i) => !G.wind[i]).map(t => `${t.where}の ${t.name}`);
    await say([!F.c3bridge ? who('soyogi', 'neutral', `のこる 祠は……${left.join('、')}じゃな。 あせらず 行きなされ。`) : !F.c3done ? who('soyogi', 'determined', '虹の 橋が かかった。 星守さまを……たのんだぞ。') : who('soyogi', 'joy', '星が もどった。 ハルも 家族に 会えたそうじゃな。 ……長生き してみる もんじゃ。')]); }
  else if (c === 1) await say([who('soyogi', 'smile', '雲の 上では 風が 道じゃ。 光る 風の 柱に 乗れば、どこまでも 高く 行ける。'), who('soyogi', 'neutral', '雲わたは 空の いきものが 落とす。 雲ブロックに すれば、空に 足場も 作れるぞい。')]);
}
async function windEvent(sh) {
  if (HOOK.gate3) { const g = HOOK.gate3(); if (g) { await say(g); return; } }
  const i = sh.i, T = DATA.windTrials[i], st = G.wtrial[i], F = G.flags;
  if (!F.c3elder) { await say(['祠は 静まりかえっている。', who('sora', 'neutral', '……まずは 里の 長老に 話を きこう。')]); return; }
  if (!st.seen) { st.seen = 1; await say([`【風の祠の試練　${T.name}】`, T.text]); }
  if (i === 1 && (st.got || []).length < 3) { await say([`風の羽が 足りない（${(st.got || []).length}/3）。 島の まわりの 空に 浮かぶ 羽を さがそう。`, who('haru', 'neutral', '羽の 下には 上昇気流が ある。 崖から 飛んで、風に 乗って。')]); return; }
  if (i === 2 && (st.waves || 0) < 3) {
    if (!nightNow() && !(await waitNight('祠の 扉は 星の 光で しか ひらかない。'))) return;
    if (!(await confirm(`星の嵐が 近づいてくる。（推奨Lv${DATA.bossCfg.hoshigarasu[0] - 2}） 迎えうつ？`))) return;
    for (let w = st.waves || 0; w < 3; w++) { await say([`星の嵐 第${w + 1}波！`]); const lv = 30 + w; const pool = ['tsukimiusa', 'hoshikakera', 'amatsubame', 'kumomo'];
      const res = await runBattle(Array.from({ length: 2 + (w > 0 ? 1 : 0) }, () => ({ sp: pool[Math.floor(R() * pool.length)], lv, shiny: R() < 1 / 64 })), { noFlee: true });
      if (res !== 'win') return defeated(); st.waves = w + 1; save(); }
    await say([{ t: '星の嵐が やんだ。 祠の 風が みんなを いやした。', fx: () => { allMembers().forEach(m => { m.hp = m.st.hp; m.mp = m.st.mp; }); Music.sfx('heal'); } }]); save(); }
  if (!st.guard) {
    const gid = WIND_BOSS[i]; const pre = [`（推奨Lv${DATA.bossCfg[gid][0]}）`];
    if (i === 0) pre.push('つむじ風が 渦を まき、風の 番人が 舞いおりた！', inParty('haru') ? who('haru', 'worried', 'ツムジカゼ……！ 風が 怒ってる。 天喰みの 力に あてられて いるんだ。') : null);
    if (i === 1) pre.push('雲の 中から、ふわりと 巨大な くらげが あらわれた！', inParty('mio') ? who('mio', 'worried', 'この子……眠たいのに、眠れないって 泣いてる。') : null);
    if (i === 2) pre.push('星の 光が ゆがみ、黒い 鳥の すがたに なった！', inParty('sana') ? who('sana', 'angry', '星を 喰らった 鳥……星喰いと 同じ 気配です！') : null);
    await say(pre); const res = await runBattle([{ boss: gid }], { boss: true, noFlee: true }); if (res !== 'win') return defeated();
    st.guard = 1; await say([`${DATA.enemies[gid].name}の かげが はれて、澄んだ 風に なって 空へ かえっていった。`]); save(); }
  G.wind[i] = 1; if (G.wind.every(Boolean)) { G.flags.c3bridge = true; buildBridge(); } Music.jingle('light', fieldSong()); allMembers().forEach(m => { m.hp = m.st.hp; m.mp = m.st.mp; }); await wait(900);
  const rw = DATA.windRewards[G.wind.filter(Boolean).length - 1]; const M = DATA.haruMem[G.wind.filter(Boolean).length - 1];
  const react = [[inParty('mio') && who('mio', 'worried', 'ハル……その 歌、もしかして——'), who('haru', 'sad', 'わからない。 でも、とても なつかしい。')],
    [inParty('riku') && who('riku', 'surprised', '嵐の 夜に、灯台の 灯が 消えてた……？ どっかで 聞いた 話だな。'), who('sora', 'surprised', '……クロウさんの 話と、同じだ。')],
    [who('sora', 'determined', 'ハル。 地上に、きみを 待ってる 人が いるかもしれない。'), who('haru', 'sad', '……うん。 塔の 上で、星守さまに 聞けば わかる 気が する。')]][G.wind.filter(Boolean).length - 1].filter(Boolean);
  await say(['祠に 風が かよった！', { t: '光る 風が、北の 空へ 吹きぬけていく——', fx: () => Music.sfx('magic') }, who('haru', 'surprised', '……っ！ いま、なにか……思い出した。'), who('haru', 'sad', M[0]), who('haru', 'sad', M[1]), ...react,
    { t: `【報酬】${rw.text}`, fx: () => { if (rw.kind === 'stam') { G.stamMax += 30; G.stam = G.stamMax; G.party.forEach(m => G.sp[m.id] = (G.sp[m.id] || 0) + 2); } if (rw.kind === 'sp') G.party.forEach(m => G.sp[m.id] = (G.sp[m.id] || 0) + 3); if (rw.kind === 'glider2') G.flags.glider2 = true; Music.sfx('friend'); } }]);
  save(); hud();
  if (G.wind.every(Boolean)) {
    await say(['みっつの 祠の 風が、北の 空で ひとつに なった——', { t: 'ゴゴゴゴ……', fx: () => Music.sfx('encounter') },
      { t: '雲の里から 北の 島へ、虹の 橋が かかった！', fx: () => { Music.jingle('light', fieldSong()); } },
      who('haru', 'determined', '星巣の塔への 道が ひらいた。 ……行こう。 答えは、あそこに ある。')]); save(); }
}
async function towerGateEvent() {
  await say([`（推奨Lv${DATA.bossCfg.seishouG[0]}）`, '塔の 扉の 前で、星晶の 巨人が 目を ひらいた。', inParty('haru') ? who('haru', 'worried', '塔の 番人……！ 星守さまの 言いつけを、ずっと 守ってるんだ。') : null]);
  const res = await runBattle([{ boss: 'seishouG' }], { boss: true, noFlee: true }); if (res !== 'win') return defeated();
  G.flags.c3mid = true; await say(['星晶の 巨人は ひざを つき、道を ゆずった。', '（塔の 中の らせん階段を のぼって、頂を めざそう）']); save(); }
async function finalEvent3() {
  const heal = () => battleParty().forEach(m => { m.hp = Math.max(m.hp, Math.round(m.st.hp * .8)); m.mp = Math.max(m.mp, Math.round(m.st.mp * .6)); });
  await say([`（推奨Lv${DATA.bossCfg.amahami[0]}　連戦に なる。 準備は いいか？）`, '塔の 頂。 星空を 丸ごと 閉じこめたような 巨大な 影が、とぐろを 巻いていた。',
    nm('天喰み', '……また 来たか。 地上の 小さな 灯よ。'), nm('天喰み', '星は 燃えつき、消えていく。 だから わたしが 喰らい、しまっておくのだ。 永遠に。'),
    inParty('sana') ? who('sana', 'determined', 'ちがいます……！ 星は 消えても、その 光は 旅を つづけるんです。') : null,
    who('sora', 'determined', 'なくすのが こわいのは、ぼくも いっしょだ。 でも 灯も 星も、しまいこんだら だれの 帰り道も 照らせない！'),
    inParty('haru') ? who('haru', 'determined', '星守さま。 わたしは……あなたを 止めに きました。') : null, nm('天喰み', '……ならば その 灯ごと、喰らってやろう！')]);
  let res = await runBattle([{ boss: 'amahami' }], { boss: true, noFlee: true, song: 'lastboss' }); if (res !== 'win') return defeated();
  await say(['天喰みの からだが 裂け、喰らわれた 星々が あふれだす！', { t: 'その 中心に、ひび割れた 光の 鳥が いた。 ——ハルの 扇から、あたたかい 風が 吹いた。', fx: () => { battleParty().forEach(m => { m.hp = m.st.hp; m.mp = Math.max(m.mp, Math.round(m.st.mp * .8)); }); Music.sfx('heal'); } }, nm('星守', 'なぜ……なぜ 消えるものを 追う……！ しまっておけば、二度と 失わないのに……！')]);
  res = await runBattle([{ boss: 'hoshimoriB' }], { boss: true, noFlee: true, keepMusic: true, song: 'lastboss' }); if (res !== 'win') return defeated();
  await say(['星守の からだから、黒い もやが ほどけていく。', nm('星守', '……あたたかい。 これは……灯……？'),
    who('haru', 'sad', '星守さま。 四十年前の 嵐の 夜、海に 落ちた わたしを 空へ 運んでくれたのは……あなた、でしたね。'),
    nm('星守', '……消えそうな 小さな 灯を、見すごせなかった。 わたしは ただ、守りたかった だけ なのに……。'),
    inParty('mio') ? who('mio', 'smile', 'だいじょうぶ。 もう ひとりで 見送らなくて いいんだよ。') : null,
    nm('星守', '……星を、空へ かえそう。'),
    { t: '夜空いっぱいに、星が よみがえった——', fx: () => { G.flags.c3done = true; G.tod = .86; Music.jingle('light'); } },
    who('haru', 'determined', '{name}。 わたし、思い出したの。 ぜんぶ。'), who('haru', 'sad', '……会いたい 人が いる。 地上の、小さな 灯台の 島に。')]);
  save(); await reunion(); save(); await credits(3);
  await say(['——第3章 クリア。 ハルは これからも いっしょに 旅を する。 空へは 星の遺跡の 祭壇から 行ける。', '……ソヨギさまは、ハルに まだ 言っていない ことが ありそうだ。', 'うわさでは、星が もどった 夜、星巣の塔の 頂に なにかが 舞いおりるらしい……。']); }
async function reunion() {
  await fade(true); G.region = 0; World.setRegion(0); enemies = []; player.x = 1; player.z = 8; player.y = surfaceAt(1, 8, 99); cam.yaw = Math.PI; trail.length = 0; G.tod = .7; Music.play('village', { restart: true }); await wait(400); await fade(false);
  await say(['——風灯の島。 夕暮れの 広場。', who('kurou', 'surprised', '……{name}？ 空から くじらが おりてきたと 聞いたが——'), who('haru', 'worried', '……あの。'), who('kurou', 'surprised', '…………。'),
    who('kurou', 'sad', 'その 目……その 歌うような 声……。 まさか……ハル……？'), who('haru', 'sad', '……おとうさん。 わたし、ずっと 空の 上に いたの。'),
    who('haru', 'smile', '灯台の 灯……見えてたよ。 雲の 切れ間から、ずっと。'), who('kurou', 'sad', 'すまなかった……。 あの 夜、灯を 消したままで……わたしは……。'),
    who('haru', 'joy', 'ううん。 おとうさんの 子守歌、ちゃんと 覚えてた。 ……ただいま。'), who('kurou', 'joy', '……おかえり。 おかえり、ハル……！'),
    who('kaito', 'smile', '……師匠の 灯が、やっと 帰ってきたな。'), inParty('mio') ? who('mio', 'joy', 'あの 子守歌……クロウさんが ハルに 歌ってた 歌 だったんだね。') : null,
    inParty('riku') ? who('riku', 'smile', '……ったく。 泣かせやがる。') : null, who('sora', 'joy', '灯は、帰る場所の しるし。 ……ほんとうに、そうだったね。')]); G.flags.c3reunion = true; }
async function defeated() {
  Music.jingle('gameover');
  await say(['{name}たちは ちからつきた……']);
  const r = REGr(); const h = r.home; player.x = h.npc.x + 1.5; player.z = h.npc.z + 1; player.y = surfaceAt(player.x, player.z, 99); trail.length = 0; player.vx = player.vz = player.vy = 0;
  allMembers().forEach(m => { m.hp = m.st.hp; m.mp = m.st.mp; }); G.gold = Math.floor(G.gold / 2);
  await say([G.region === 0 ? who('yui', 'worried', '……気が ついた？ 無理は しないでおくれ。') : G.region === 2 ? nm('雲の宿の 主人', '雲の上で たおれてたのを 運んできたよ。 お金は 半分 もらっておくね。') : nm('宿屋の おかみ', 'あんたたち、町に 運びこまれたのよ。 お金は 半分 治療代に もらったからね。')]);
  Music.play(fieldSong()); hud();
}
function fade(on) { return new Promise(r => { $('fade').classList.toggle('on', on); setTimeout(r, 900); }); }
async function credits(ch) {
  Music.play('ending', { restart: true });
  const c = DATA.cast; const list = (ch === 1 ? ['sora', 'mio', 'riku', 'kaito', 'yui', 'gen', 'nagi', 'yomi'] : ch === 2 ? ['sora', 'mio', 'riku', 'sana', 'tsumugi', 'baldo', 'kurou'] : ch === 3 ? ['sora', 'mio', 'riku', 'sana', 'haru', 'soyogi', 'kurou'] : ['sora', 'mio', 'riku', 'sana', 'haru', 'kaito', 'yui', 'kurou']).map(k => k === 'kurou' ? { k, n: 'クロウ', r: 'かつての灯台守' } : { k, n: k === 'sora' ? esc(G.name) : c[k].name, r: `${c[k].role}・${c[k].title}` });
  const el = $('credits'); el.innerHTML = `<div class="cr-roll"><h2>ともしびアイランド</h2><p class="cr-sub">${['', '第一章　ともしびの継ぎ手', '第二章　星くずの大陸', '第三章　天空の星巣', '第四章　海の底'][ch]}</p>${list.map(o => `<div class="cr-row"><div class="cr-face">${Art.portrait(o.k, o.k === 'yomi' ? 'neutral' : 'smile')}</div><div><b>${o.n}</b><span>${o.r}</span></div></div>`).join('')}
    <p class="cr-h">いきもの</p><p>なかま ${Object.keys(G.dex.got).length} / ${DEX_N} 種</p><p class="cr-h">音楽</p><p>オリジナル・オーケストラ</p><p class="cr-h">企画</p><p>あなた</p><p class="cr-h">制作</p><p>Claude</p>
    <p class="cr-end">${['', 'そして 灯は、帰る場所の しるしに なった。', '星は 空へ 還り、旅は つづく。', 'そして 星は、帰る場所を 照らしつづける。', 'そして 灯は、海の いちばん 深い 場所まで とどいた。'][ch]}</p><p class="cr-end">— ${['', '第一章 おわり', 'つづく', '第三章 おわり', '第四章 おわり ・ ありがとう'][ch]} —</p></div><button class="btn-close" type="button">旅に もどる</button>`;
  el.hidden = false; await new Promise(r => el.querySelector('.btn-close').addEventListener('click', r, { once: true })); el.hidden = true; Music.play(fieldSong());
}

// ================= battle =================
const B = { active: false }; let bSkip = false;
$('bMsg').addEventListener('pointerdown', () => { bSkip = true; });
$('bSpd').addEventListener('click', () => { G.speed = G.speed === 1 ? 2 : G.speed === 2 ? 3 : 1; $('bSpd').textContent = `はやさ ×${G.speed}`; $('battle').style.setProperty('--bs', G.speed); $('bfx').style.setProperty('--bs', G.speed); });
// バトル画面の どこを タップしても 演出を とばせる（コマンド・ボタン類は のぞく）／ 右クリックで もどる
$('battle').addEventListener('pointerdown', e => { if (!e.target.closest('.menu,.bctl,.bnav')) bSkip = true; });
$('battle').addEventListener('contextmenu', e => { e.preventDefault(); const M = MENUS[MENUS.length - 1]; if (M && M.cancel && M.el.classList.contains('m-battle')) { Music.sfx('cancel'); closeMenu(M, -1); } });
const bspd = () => G.speed || 1;
async function bwait(ms) { bSkip = false; const t0 = performance.now(); while (performance.now() - t0 < ms / bspd() && !bSkip) await wait(20); const s = bSkip; bSkip = false; return s; }
async function btap(autoMs) { bSkip = false; const t0 = performance.now(); while (!bSkip && !(G.auto && performance.now() - t0 > autoMs / bspd())) await wait(25); bSkip = false; }
function bAdd(cls, html, host = $('battle')) { const el = document.createElement('div'); el.className = cls; el.innerHTML = html; host.appendChild(el); return el; }
const CONF = ['#ffd36a', '#ff7fb0', '#8fe06a', '#7fd0ff', '#fff6c9', '#b98cff', '#ff9a4a'];
function confetti(n, o = {}) { let h = ''; for (let i = 0; i < n; i++) { const a = (o.a0 ?? -Math.PI) + R() * (o.arc ?? Math.PI), d = (o.d || 160) * (.4 + R() * .8);
  h += `<i class="${o.cls || 'cf'}" style="--x:${Math.cos(a) * d * 1.6}px;--y:${Math.sin(a) * d}px;--fall:${60 + R() * 120}px;--r:${Math.round(R() * 720 - 360)}deg;--c:${CONF[i % CONF.length]};--dl:${(R() * .25).toFixed(2)}s;--sz:${4 + R() * 6}px">${o.ch || ''}</i>`; } return h; }
function cryOf(f, o = {}) { try { if (f.sp) return Music.cry(f.sp, { shadow: !SPC[f.sp].legend, ...o }); if (f.bid) return Music.cry(f.bid, { boss: true, ...o }); } catch (e) { console.error(e); } return 0; }
$('bAuto').addEventListener('click', () => { G.auto = !G.auto; $('bAuto').textContent = G.auto ? 'おまかせ ON' : 'おまかせ OFF';
  if (G.auto) for (const M of MENUS.slice().reverse()) if (M.el.classList.contains('m-battle')) closeMenu(M, 'auto'); });
function wildLevel(x, z) { if (G.region === 0) return Math.max(1, 1 + G.order * 3 + (G.flags.cleared ? 4 : 0) + Math.floor(R() * 2));
  if (G.region === 3) { const b = World.biomeAt(x, z); return ({ sand: 40, kelp: 41, coral: 42, rock: 44, trench: 47 }[b] || 40) + Math.floor(R() * 3) + (G.flags.c4done ? 5 : 0); }
  if (G.region === 2) { const b = World.biomeAt(x, z); return ({ grass: 29, forest: 30, rock: 32, crystal: 33 }[b] || 29) + Math.floor(R() * 3) + (G.flags.c3done ? 6 : 0); }
  const b = World.biomeAt(x, z); const base = { grass: 15, shore: 16, forest: 18, desert: 20, snow: 22, ruins: 24 }[b] || 15; return base + Math.floor(R() * 3) + (G.flags.c2done ? 3 : 0) + (G.flags.c3done ? 3 : 0); }
const S0 = spec => SPC[spec.sp] || {};
function mkFoe(spec) {
  if (spec.boss) { const d = DATA.enemies[spec.boss];
    return { foe: true, boss: true, bid: spec.boss, d, lv: d.lv, name: d.name, type: d.type || null, hp: d.hp, max: d.hp, atk: d.atk, def: d.def, spd: d.spd, exp: d.exp, gold: d.gold ?? Math.round(d.exp * .8), sleep: 0, slow: 0,
      art: d.portrait ? Art.portrait(d.portrait, 'angry') : d.spArt ? Art.species(d.spArt, { shadow: true }) : Art.monster(d.art[0], d.art[1]) }; }
  const RM = G.region === 2 && !S0(spec).legend ? [1.6, 1.2, 1.1] : [1, 1, 1];
  const S = SPC[spec.sp], L = spec.lv; const st = S.base.map((b, i) => Math.round(b + S.grow[i] * (L - 1)));
  return { foe: true, sp: spec.sp, lv: L, shiny: spec.shiny, d: {}, name: (S.legend ? '' : 'かげ') + S.name + (spec.shiny ? '★' : ''), type: S.type, hp: Math.round(st[0] * .9 * RM[0]), max: Math.round(st[0] * .9 * RM[0]), atk: Math.round(st[2] * .74 * RM[1]), def: Math.round(st[3] * .8 * RM[2]), spd: st[4],
    skills: S.sk.filter(([, l]) => l <= L).map(([s]) => s), exp: Math.round((6 + L * 2.8) * (S.rare ? 3 : S.legend ? 6 : 1) * (S.evo ? 1 : 1.25) * (G.region === 2 ? 1.8 : 1)), gold: Math.round((4 + L * 2.3) * (G.region === 2 ? 1.8 : 1)), sleep: 0, slow: 0,
    art: Art.species(spec.sp, { shadow: !S.legend, shiny: spec.shiny }) }; }
async function bmsg(t, hold = 520) {
  const box = $('bMsg'); const line = document.createElement('div'); box.appendChild(line); while (box.children.length > 3) box.firstChild.remove();
  const full = t.replace(/{name}/g, G.name); bSkip = false;
  const sp = (G.speed || 1) * Math.max(.6, HOOK.OPT.text); for (let i = 1; i <= full.length; i += sp) { if (bSkip) break; line.textContent = full.slice(0, i); if (i % 2 === 0) Music.sfx('blip'); await wait(16 / sp); }
  line.textContent = full; bSkip = false; const t0 = performance.now(); while (performance.now() - t0 < hold / sp && !bSkip) await wait(25); bSkip = false; }
function faceOf(m) { return m.kind === 'human' ? Art.portrait(m.id, m.hp <= 0 ? 'closed' : m.hp < m.st.hp * .3 ? 'worried' : 'determined') : Art.species(m.id, { shiny: m.shiny }); }
const typeTag = t => t ? `<span class="tt" style="background:${DATA.typeCol[t]}">${DATA.types[t]}</span>` : '';
// 再描画は その場で 更新（要素を 作りなおさない → HPバーが なめらかに へり、演出クラスや ダメージ数字が 消えない）
const B_TRANS = ['hurt', 'shake', 'hitw', 'lunge', 'enter', 'love', 'pop', 'actor', 'tgt', 'mpglow', 'lunge2', 'casting', 'strike', 'dodge', 'healg'];
function keepCls(el, base) { const keep = B_TRANS.filter(c => el.classList.contains(c)); const cn = [base, ...keep].join(' '); if (el.className !== cn) el.className = cn; }
function setBar(bar, pct) { pct = Math.max(0, Math.min(100, pct)).toFixed(1) + '%'; const i = bar.querySelector('i'), g = bar.querySelector('b'); if (i.style.width !== pct) i.style.width = pct; if (g && g.style.width !== pct) g.style.width = pct; }
const barH = cls => `<div class="bar ${cls}"><b></b><i></i></div>`;
function drawParty(P, ai = -1) {
  const host = $('bParty');
  if (host.children.length !== P.length || [...host.children].some((e, i) => e.id !== 'pc' + i))
    host.innerHTML = P.map((m, i) => `<div class="pc" id="pc${i}"><div class="pc-face"></div><div class="pc-st"></div>${wpnOf(m) ? `<div class="pc-wpn w-${wpnOf(m)}" title="${WPN_NAME[wpnOf(m)]}">${wsvg(wpnOf(m))}</div>` : `<div class="pc-wpn mon t-${m.type || 'normal'}"></div>`}<div class="pc-info"><div class="pc-name"></div>${barH('hp')}${barH('mp')}<div class="pc-num"></div></div></div>`).join('');
  P.forEach((m, i) => { const el = host.children[i]; keepCls(el, `pc${i === ai ? ' act' : ''}${m.hp <= 0 ? ' down' : ''}${m.hp > 0 && m.hp < m.st.hp * .25 ? ' low' : ''}`);
    const face = el.querySelector('.pc-face'), fk = m.id + ':' + (m.kind === 'human' ? (m.hp <= 0 ? 'c' : m.hp < m.st.hp * .3 ? 'w' : 'd') : m.shiny ? 's' : '');
    if (face.dataset.k !== fk) { face.dataset.k = fk; face.innerHTML = faceOf(m); }
    const nmH = `${esc(nameOf(m))}<small>Lv${m.lv}</small>`; const stH = stBadges(m); const stEl = el.querySelector('.pc-st'); if (stEl.dataset.k !== stH) { stEl.dataset.k = stH; stEl.innerHTML = stH; }
    const nmEl = el.querySelector('.pc-name'); if (nmEl.innerHTML !== nmH) nmEl.innerHTML = nmH;
    const [hb, mb] = el.querySelectorAll('.bar'); setBar(hb, m.hp / m.st.hp * 100); setBar(mb, m.st.mp ? m.mp / m.st.mp * 100 : 0);
    el.querySelector('.pc-num').innerHTML = `HP <b>${m.hp}</b>/${m.st.hp}　MP <b>${m.mp}</b>/${m.st.mp}`; }); }
function drawFoes(F) {
  const host = $('bFoes');
  if (host.children.length !== F.length || [...host.children].some((e, i) => e.id !== 'foe' + i))
    host.innerHTML = F.map((f, i) => `<div class="foe" id="foe${i}"><div class="foe-st"></div><div class="foe-art">${f.art}</div><div class="foe-shadow"></div><div class="foe-name"></div>${barH('hp' + (f.boss ? ' boss' : ''))}<div class="foe-weak">${weakTxt(f.type)}</div></div>`).join('');
  F.forEach((f, i) => { const el = host.children[i]; keepCls(el, `foe${f.hp <= 0 ? ' gone' : ''}${f.boss ? ' boss' : ''}${f.charging ? ' charging' : ''}`); { const stH = stBadges(f), stEl = el.querySelector('.foe-st'); if (stEl.dataset.k !== stH) { stEl.dataset.k = stH; stEl.innerHTML = stH; } }
    const nH = `${typeTag(f.type)}${f.name}${f.lv ? ` <small>Lv${f.lv}</small>` : ''}${f.charging ? ' <b class="chg">⚠ため</b>' : ''}`;
    const ne = el.querySelector('.foe-name'); if (ne.innerHTML !== nH) ne.innerHTML = nH; setBar(el.querySelector('.bar'), f.hp / f.max * 100); }); }
// 状態バッジ（アニメつき）：どく・やけど・まひ・ねむり・強化・鈍足
function stBadges(m) { let h = ''; if (m.ail) h += `<i class="sb s-${m.ail}" title="${DATA.ailName[m.ail] || ''}">${DATA.ailIcon[m.ail] || '!'}</i>`; if (m.sleep > 0) h += '<i class="sb s-sleep" title="ねむり">Z<b>z</b></i>';
  if (m.atkUp > 0) h += '<i class="sb s-atk" title="こうげき↑">⚔</i>'; if (m.defUp > 0) h += '<i class="sb s-def" title="ぼうぎょ↑">🛡</i>'; if (m.spdUp > 0) h += '<i class="sb s-spd" title="すばやさ↑">»</i>'; if (m.slow > 0) h += '<i class="sb s-slow" title="鈍足">«</i>'; return h; }
function weakTxt(t) { if (!t || t === 'normal') return ''; const w = Object.keys(DATA.strong).filter(a => DATA.typeMul(a, t) > 1); return w.length ? `<div class="weak">弱点 ${w.map(a => typeTag(a)).join('')}</div>` : ''; }
const effMark = (type, f) => { const m = DATA.typeMul(type, f.type); return m > 1 ? ' <b class="eff good">◎ばつぐん</b>' : m < 1 ? ' <b class="eff bad">△いまひとつ</b>' : ''; };
const costOf = (m, s) => Math.ceil(DATA.skills[s].mp * (1 - ((m.pas && m.pas.mpSave) || 0)));
// ダメージ数字：ふつう＜ばつぐん（緑・！）＜会心（金・大・ラベル）。 味方への ダメージは 赤み。 重ならないよう 左右に ずらす
function hitFx(el, dmg, heal, cls = '') { if (!el) return; if (!heal) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  const n = document.createElement('div'); n.className = 'dmg' + (heal ? ' heal' : '') + (cls ? ' ' + cls : ''); n.style.setProperty('--dx', Math.round((R() - .5) * 40) + 'px');
  n.innerHTML = /crit/.test(cls) ? `<small>かいしん！</small>${dmg}` : /good/.test(cls) ? `${dmg}<small>!</small>` : esc(String(dmg)); el.appendChild(n); setTimeout(() => n.remove(), 1150); }
// ---- 手ごたえ：ヒットストップ／画面キック／振動（「画面の ゆれ：へらす」で キックと 振動は 止まる） ----
const calmOn = () => !!(HOOK.OPT && HOOK.OPT.calm);
function buzz(p) { if (calmOn()) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {} }
async function hitStop(ms) { const b = $('battle'), fx = $('bfx'); b.classList.add('hitstop'); fx.classList.add('hitstop'); await wait(ms / bspd()); b.classList.remove('hitstop'); fx.classList.remove('hitstop'); }
function kick(k) { if (calmOn() || k <= 0) return; const b = $('battle'); b.style.setProperty('--kick', Math.min(14, 2 + k * 8).toFixed(1) + 'px'); b.classList.remove('quake'); void b.offsetWidth; b.classList.add('quake');
  clearTimeout(kick.t); kick.t = setTimeout(() => b.style.removeProperty('--kick'), 420); }
// 属性ごとの ヒットエフェクト（DOM パーティクル）
const FXC = { fire: ['#ffb347', '#ff6a2a', '#ffe070'], water: ['#9fe6ff', '#4fb0e0', '#ffffff'], rock: ['#b89a6a', '#8a7a60', '#d8c09a'], light: ['#fff6c9', '#ffe38a', '#ffffff'], dark: ['#b58cff', '#6b3fb0', '#ff6fb0'],
  heal: ['#c9ffd9', '#6fd08a', '#ffffff'], song: ['#ffd6f0', '#b98cff', '#ffffff'], wind: ['#c8fff0', '#9fe0d0', '#ffffff'], leaf: ['#9fe07a', '#5aa83a', '#e8ffb0'], slash: ['#ffffff', '#e0e8ff', '#fff6c9'] };
const TYPE_FX = { fire: 'fire', water: 'water', earth: 'rock', light: 'light', dark: 'dark', wind: 'wind', grass: 'leaf' };
function fxAt(el, kind, opt = {}) { if (!el) return; const r = el.getBoundingClientRect(); if (!r.width) return; const L = $('bfx'); while (L.childElementCount > 70) L.firstChild.remove();
  const box = document.createElement('div'); box.className = 'fxl';
  box.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`; L.appendChild(box); const C = FXC[kind] || FXC[opt.el ? EL2FX[opt.el] : ''] || FXC.slash; const add = h => box.insertAdjacentHTML('beforeend', h);
  const q = fxQ(), N = n => Math.max(2, Math.round(n * q));
  const parts = (n, spread, up, sz, dur, cls = '', cc = C) => { for (let i = 0, m = N(n); i < m; i++) { const a = R() * 6.283, d = spread * (.4 + R() * .6); add(`<span class="fx-p${cls}" style="--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d - up * (.5 + R())).toFixed(0)}px;--c:${cc[i % cc.length]};--s:${(sz * (.6 + R() * .8)).toFixed(1)}px;--d:${(dur * (.7 + R() * .6)).toFixed(2)}s;--r:${Math.round(R() * 720 - 360)}deg"></span>`); } };
  const core = (c, s = 1) => add(`<span class="fx-core" style="--c:${c};--k:${s}"></span>`);
  const ring = (c, dl = 0, w = 4) => add(`<span class="fx-ring" style="--c:${c};border-width:${w}px;animation-delay:${dl}s"></span>`);
  const glyphs = (n, chs, cc, spread, up, fs, dur) => { for (let i = 0, m = N(n); i < m; i++) add(`<span class="fx-g" style="color:${cc[i % cc.length]};font-size:${fs * (.7 + R() * .6)}px;--x:${((R() - .5) * spread).toFixed(0)}px;--y:${(-up * (.4 + R() * .8)).toFixed(0)}px;--d:${dur}s;--r:${Math.round(R() * 60 - 30)}deg">${chs[i % chs.length]}</span>`); };
  switch (kind) {
    // ---- 属性（技・魔法の 着弾） ----
    case 'slash': add('<span class="fx-slash" style="--r:-28deg"></span><span class="fx-slash b" style="--r:24deg"></span>'); parts(8, 60, 0, 6, .5); break;
    case 'fire': core('#ffb347', 1.2); ring(C[0]); ring(C[1], .1, 6); parts(16, 50, 80, 12, .8, ' flame'); parts(8, 90, 10, 4, .5); add('<span class="fx-smoke"></span>'); break;
    case 'water': core('#bff0ff'); ring(C[0]); ring(C[2], .12); ring(C[1], .22, 3); parts(14, 90, -20, 8, .8, ' drop'); add('<span class="fx-splash"></span>'); break;
    case 'rock': core('#e8d0a0', .9); for (let i = 0, m = N(12); i < m; i++) { const a = -2.8 + R() * 2.6, d = 50 + R() * 60; add(`<span class="fx-p rock" style="--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d + 70).toFixed(0)}px;--c:${C[i % 3]};--s:${(8 + R() * 12).toFixed(0)}px;--d:.8s;--r:${Math.round(R() * 400)}deg"></span>`); } ring(C[0], 0, 7); add('<span class="fx-dust"></span><span class="fx-crack"></span>'); break;
    case 'light': add('<span class="fx-pillar"></span>'); core('#fffbe8', 1.3); ring('#ffe38a', .05); glyphs(8, ['✦', '✧'], C, 140, 60, 18, .9); parts(10, 60, 40, 6, .8); break;
    case 'dark': core('#6b3fb0', 1.1); add('<span class="fx-vortex"></span>'); ring(C[0]); ring(C[2], .15, 3); parts(16, 80, 10, 10, .8, ' wisp'); break;
    case 'wind': add(`<span class="fx-spiral" style="--c:${C[1]}"></span><span class="fx-spiral" style="--c:${C[0]};animation-delay:.1s"></span><span class="fx-streaks"></span>`); parts(10, 100, 20, 6, .7); break;
    case 'leaf': add('<span class="fx-slash" style="--r:-20deg;background:linear-gradient(90deg,transparent,#9fe07a,transparent)"></span>'); parts(14, 80, 20, 10, .9, ' leaf'); ring(C[0], .05, 3); break;
    case 'heal': add('<span class="fx-hcol"></span>'); glyphs(7, ['✚', '✦', '✚'], C, 80, 90, 16, 1.1); parts(10, 30, 90, 7, 1.1); break;
    case 'song': ring(C[1], 0, 3); ring(C[0], .12, 3); ring(C[2], .24, 3); glyphs(7, ['♪', '♫'], C, 110, 70, 22, 1); break;
    // ---- 武器の 着弾 ----
    case 'w_sword': add('<span class="fx-arc" style="--r:-30deg"></span><span class="fx-arc b" style="--r:150deg"></span><span class="fx-clang"></span>'); parts(12, 70, 0, 5, .45, ' spark', ['#ffffff', '#fff6c9', '#ffd36a']); break;
    case 'w_spear': add(`<span class="fx-pierce" style="--r:${(opt.ang || -40).toFixed(0)}deg"></span><span class="fx-pierce b" style="--r:${(opt.ang || -40).toFixed(0)}deg"></span>`); ring('#ffffff', .05, 3); parts(10, 50, 0, 4, .4, ' spark', ['#ffffff', '#dfe8ff']); break;
    case 'w_harp': ring('#ff8ac0', 0, 3); ring('#ffd6f0', .1, 3); ring('#b98cff', .2, 3); glyphs(8, ['♪', '♫', '♬'], ['#ffd6f0', '#ff8ac0', '#fff'], 150, 80, 22, 1); break;
    case 'w_staff': core('#fff6c9', 1.1); glyphs(8, ['✦', '✧', '★'], ['#ffe38a', '#fff', '#b8d8ff'], 150, 70, 20, .9); ring('#ffe38a', .05, 3); break;
    case 'w_fan': add(`<span class="fx-spiral" style="--c:#6fd8c0"></span><span class="fx-spiral" style="--c:#ffffff;animation-delay:.08s"></span><span class="fx-streaks"></span>`); parts(12, 100, 30, 9, .9, ' leaf', ['#bff0e2', '#ffb8d0', '#ffffff']); break;
    case 'w_anchor': core('#dfe8ff', 1.4); ring('#9fb0d0', 0, 8); ring('#ffffff', .1, 4); add('<span class="fx-dust"></span><span class="fx-crack"></span>'); for (let i = 0, m = N(10); i < m; i++) { const a = -2.9 + R() * 2.8, d = 60 + R() * 60; add(`<span class="fx-p rock" style="--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d + 60).toFixed(0)}px;--c:${['#8a7a60', '#b89a6a', '#5a6078'][i % 3]};--s:${(6 + R() * 10).toFixed(0)}px;--d:.8s;--r:${Math.round(R() * 400)}deg"></span>`); } break;
    case 'w_bow': add(`<span class="fx-pierce" style="--r:${(opt.ang || -20).toFixed(0)}deg"></span>`); add('<span class="fx-arrow"></span>'); ring('#fff6dc', 0, 3); parts(8, 50, 0, 4, .4, ' spark', ['#ffffff', '#fff6c9']); break;
    case 'w_dagger': for (let i = 0; i < 3; i++) add(`<span class="fx-slash" style="--r:${-40 + i * 38}deg;animation-delay:${i * .06}s;height:5px;left:25%;width:50%"></span>`); parts(10, 50, 0, 4, .35, ' spark', ['#ffffff', '#e8d8ff', '#b98cff']); break;
    case 'w_axe': add('<span class="fx-arc heavy" style="--r:-60deg"></span><span class="fx-crack"></span><span class="fx-dust"></span>'); core('#fff0d8', 1.2); ring('#ffd6a0', 0, 7); parts(12, 80, -20, 8, .7, ' rock', ['#b89a6a', '#8a7a60', '#ffffff']); break;
    case 'w_fist': add('<span class="fx-burst"></span>'); ring('#ffffff', 0, 5); parts(8, 60, 0, 5, .4, ' spark'); break;
    // ---- いきものの こうげき ----
    case 'm_bite': add('<span class="fx-jaw u"></span><span class="fx-jaw l"></span>'); parts(8, 60, 0, 5, .45, ' spark', ['#ffffff', '#ffe0e0']); break;
    case 'm_peck': for (let i = 0; i < 3; i++) add(`<span class="fx-burst sm" style="left:${30 + R() * 40}%;top:${30 + R() * 40}%;animation-delay:${i * .09}s"></span>`); break;
    case 'm_bump': core('#ffffff', .9); ring('#ffffff', 0, 6); add('<span class="fx-dust"></span>'); add('<span class="fx-burst"></span>'); break;
    case 'm_slam': core('#e0d8ff', 1.3); ring('#b8a0ff', 0, 8); ring('#ffffff', .1, 4); add('<span class="fx-dust"></span><span class="fx-crack"></span>'); parts(10, 80, -30, 9, .8, ' rock', ['#8a7a60', '#6a5a80', '#b89a6a']); break;
    case 'm_splash': ring('#9fe6ff', 0, 4); ring('#ffffff', .1, 3); parts(16, 90, 40, 8, .8, ' drop', FXC.water); add('<span class="fx-splash"></span>'); break;
    case 'm_crackle': add('<span class="fx-bolt"></span><span class="fx-bolt b"></span>'); parts(12, 80, 0, 4, .4, ' spark', ['#fff6a0', '#ffffff', '#9fe0ff']); break;
    case 'm_whip': add('<span class="fx-lash"></span>'); parts(8, 60, 0, 5, .45, ' spark', ['#e8ffb0', '#ffffff']); break;
  }
  // 武器・いきもの 攻撃に 属性が のっていれば その色の 粒を かさねる
  if (opt.el && opt.el !== 'normal' && EL[opt.el] && /^[wm]_/.test(kind)) { parts(10, 70, 30, 8, .7, opt.el === 'fire' ? ' flame' : opt.el === 'water' ? ' drop' : '', EL[opt.el].c); ring(EL[opt.el].c[0], .06, 3); }
  if (opt.stamp) add(`<span class="stamp${opt.stamp === 'bad' ? ' bad' : ''}">${opt.stamp === 'bad' ? '△ いまひとつ' : '◎ ばつぐん！'}</span>`);
  if (opt.crit) { add(`<span class="fx-ring" style="--c:#ffe36a;border-width:6px"></span><span class="fx-burst crit"></span>`); parts(16, 120, 0, 8, .6); }
  setTimeout(() => box.remove(), 1300); }
function screenFx(kind) { const f = $('bFlash'); f.className = 'bflash ' + kind; void f.offsetWidth; f.classList.add('go'); }
// ===== battle v8：だれが 動いているか／武器の 個性／属性エフェクト（#bfx の 軽い DOM レイヤー・--bs で 倍速・calm で ひかえめ） =====
const WPN_DEF = { sora: 'sword', mio: 'harp', riku: 'spear', sana: 'staff', haru: 'fan', kaito: 'anchor' };
const WPN_ALIAS = { sword: 'sword', blade: 'sword', katana: 'sword', '剣': 'sword', '刀': 'sword', dagger: 'dagger', knife: 'dagger', '短剣': 'dagger', 'ナイフ': 'dagger', spear: 'spear', lance: 'spear', trident: 'spear', '槍': 'spear', bow: 'bow', '弓': 'bow', crossbow: 'bow', sling: 'bow',
  axe: 'axe', hammer: 'axe', '斧': 'axe', 'おの': 'axe', '槌': 'axe', 'ハンマー': 'axe', harp: 'harp', lyre: 'harp', instrument: 'harp', bell: 'harp', flute: 'harp', '竪琴': 'harp',
  staff: 'staff', rod: 'staff', wand: 'staff', cane: 'staff', '杖': 'staff', fan: 'fan', '扇': 'fan', anchor: 'anchor', club: 'anchor', mace: 'anchor', 'いかり': 'anchor', '錨': 'anchor', '鈍器': 'anchor', blunt: 'anchor', fist: 'fist', claw: 'fist', knuckle: 'fist', glove: 'fist' };
const WPN_NAME = { sword: '剣', harp: '竪琴', spear: '槍', staff: '杖', fan: '扇', anchor: 'いかり', fist: 'こぶし', bow: '弓', dagger: '短剣', axe: '斧' };
// 武器の 種類：装備（DATA.gear の cat/category/wtype）→ 職業（wpn/weapon）→ キャラの 既定
function wpnOf(m) { if (!m || m.foe || m.kind !== 'human') return null;
  try { const e = (G.eq && G.eq[m.id]) || {}; const g = ((DATA.gear || {})[m.id] || [])[e.w | 0] || {}; const c = g.cat || g.category || g.wtype || g.weapon; if (c && WPN_ALIAS[c]) return WPN_ALIAS[c];
    const jr = G.job && G.job[m.id]; const j = jr && (DATA.jobs || []).find(x => x.id === jr.cur); const jc = j && (j.wpn || j.weapon || j.cat); if (jc && WPN_ALIAS[jc]) return WPN_ALIAS[jc]; } catch (_) {}
  return WPN_DEF[m.id] || 'sword'; }
// いきものの こうげき：体の つくり（arch）ごと
const MON_ATK = { quad: 'bite', fish: 'splash', bird: 'peck', blob: 'bump', fluff: 'bump', golem: 'slam', plant: 'whip', sprite: 'crackle' };
function archOf(x) { try { if (x.sp || (!x.foe && x.kind === 'mon')) return SPC[x.sp || x.id].arch; if (x.boss) { const d = x.d || {}; if (d.spArt && SPC[d.spArt]) return SPC[d.spArt].arch; return 'boss'; } } catch (_) {} return 'quad'; }
const monAtk = x => archOf(x) === 'boss' ? 'slam' : MON_ATK[archOf(x)] || 'bump';
const WSVG = {
  sword: '<path d="M41 4 L45 3 L44 7 L20 31 L16 28 Z" fill="#eef3ff" stroke="#8a9ab8" stroke-width="1.2"/><path d="M40 8 L21 27" stroke="#fff" stroke-width="1" opacity=".8"/><path d="M12 24 L24 36" stroke="#f3c15a" stroke-width="4.5" stroke-linecap="round"/><path d="M17 31 L8 40" stroke="#7a4a2a" stroke-width="4.5" stroke-linecap="round"/><circle cx="7" cy="41" r="3" fill="#f3c15a"/>',
  spear: '<path d="M5 43 L34 14" stroke="#8a5a32" stroke-width="3.5" stroke-linecap="round"/><path d="M33 9 L45 3 L39 15 L35 17 L31 13 Z" fill="#dfe8f6" stroke="#7a8aa8" stroke-width="1.2"/><path d="M30 18 Q26 24 24 20 M30 18 Q34 26 29 24" stroke="#e8584a" stroke-width="2.4" fill="none"/>',
  harp: '<path d="M13 43 Q6 14 28 6 Q41 4 39 15 Q31 19 35 43 Z" fill="none" stroke="#f3c15a" stroke-width="3.4" stroke-linejoin="round"/><path d="M17 40 L19 12 M22 40 L24 9 M27 40 L28 8 M31 41 L32 15" stroke="#fff6dc" stroke-width="1.1"/><circle cx="36" cy="10" r="2.6" fill="#ff8ac0"/>',
  staff: '<path d="M9 45 L29 16" stroke="#8a5a32" stroke-width="3.6" stroke-linecap="round"/><circle cx="33" cy="11" r="9" fill="#fff6c9" opacity=".35"/><path d="M33 2 L35.5 8.5 L42 11 L35.5 13.5 L33 20 L30.5 13.5 L24 11 L30.5 8.5 Z" fill="#ffe38a" stroke="#fff" stroke-width="1"/>',
  fan: '<path d="M10 42 L3 13 A31 31 0 0 1 39 15 Z" fill="#bff0e2" stroke="#4a9a8a" stroke-width="1.6"/><path d="M10 42 L9 11 M10 42 L16 8 M10 42 L24 8 M10 42 L31 10 M10 42 L37 13" stroke="#4a9a8a" stroke-width="1"/><path d="M5 17 A28 28 0 0 1 36 17" stroke="#e8584a" stroke-width="2.4" fill="none"/><circle cx="10" cy="42" r="2.4" fill="#f3c15a"/>',
  anchor: '<circle cx="24" cy="7" r="4" fill="none" stroke="#4a5a7a" stroke-width="3"/><path d="M24 11 L24 42 M14 16 L34 16" stroke="#4a5a7a" stroke-width="4" stroke-linecap="round"/><path d="M7 29 Q10 43 24 43 Q38 43 41 29" fill="none" stroke="#4a5a7a" stroke-width="4" stroke-linecap="round"/><path d="M4 31 L7 25 L11 32 Z M44 31 L41 25 L37 32 Z" fill="#4a5a7a"/><path d="M24 14 L24 40" stroke="#9fb0d0" stroke-width="1.2"/>',
  bow: '<path d="M12 4 Q40 24 12 44" fill="none" stroke="#8a5a32" stroke-width="3.6" stroke-linecap="round"/><path d="M12 4 L12 44" stroke="#fff6dc" stroke-width="1"/><path d="M8 24 L44 24" stroke="#c8a070" stroke-width="2"/><path d="M44 24 L37 20 L39 24 L37 28 Z" fill="#dfe8f6" stroke="#7a8aa8" stroke-width="1"/><path d="M10 24 L6 20 M10 24 L6 28" stroke="#e8584a" stroke-width="2"/>',
  dagger: '<path d="M38 6 L42 5 L41 9 L24 26 L20 23 Z" fill="#eef3ff" stroke="#8a9ab8" stroke-width="1.2"/><path d="M16 21 L25 30" stroke="#f3c15a" stroke-width="4" stroke-linecap="round"/><path d="M20 27 L12 35" stroke="#5a3a6a" stroke-width="4.5" stroke-linecap="round"/><circle cx="11" cy="36" r="2.6" fill="#b98cff"/>',
  axe: '<path d="M10 44 L32 10" stroke="#8a5a32" stroke-width="4" stroke-linecap="round"/><path d="M26 6 Q44 4 46 20 Q40 16 33 18 Z" fill="#dfe8f6" stroke="#6a7a98" stroke-width="1.4"/><path d="M27 7 Q20 14 24 22 L31 17 Z" fill="#c8d4e8" stroke="#6a7a98" stroke-width="1.2"/>',
  fist: '<rect x="11" y="14" width="26" height="22" rx="8" fill="#f0b890" stroke="#8a5a3a" stroke-width="1.6"/><path d="M17 14 L17 24 M23 14 L23 24 M29 14 L29 24" stroke="#8a5a3a" stroke-width="1.2"/><rect x="13" y="34" width="22" height="8" rx="2" fill="#e8584a"/>',
};
const wsvg = w => `<svg viewBox="0 0 48 48" aria-hidden="true">${WSVG[w] || WSVG.sword}</svg>`;
// 属性：色・画面の いろみ
const EL = { fire: { c: ['#ffb347', '#ff5a1f', '#ffe070'], tint: 'rgba(255,96,24,.30)' }, water: { c: ['#9fe6ff', '#3f9fe0', '#ffffff'], tint: 'rgba(40,130,230,.30)' },
  wind: { c: ['#c8fff0', '#6fd8c0', '#ffffff'], tint: 'rgba(80,220,190,.24)' }, earth: { c: ['#c9a064', '#8a6a40', '#e8d0a0'], tint: 'rgba(140,96,40,.32)' },
  light: { c: ['#fff6c9', '#ffe38a', '#ffffff'], tint: 'rgba(255,236,150,.32)' }, dark: { c: ['#b58cff', '#6b3fb0', '#ff6fb0'], tint: 'rgba(40,10,70,.45)' },
  grass: { c: ['#9fe07a', '#4fa83a', '#e8ffb0'], tint: 'rgba(80,190,70,.24)' }, heal: { c: ['#c9ffd9', '#5fe08a', '#ffffff'], tint: 'rgba(90,230,140,.22)' },
  buff: { c: ['#ffe38a', '#ffb347', '#ffffff'], tint: 'rgba(255,200,80,.22)' }, debuff: { c: ['#8a9aff', '#5a4ab8', '#d0d8ff'], tint: 'rgba(60,50,150,.30)' },
  song: { c: ['#ffd6f0', '#ff8ac0', '#b98cff'], tint: 'rgba(255,130,200,.22)' }, normal: { c: ['#ffffff', '#e0e8ff', '#fff6c9'], tint: 'rgba(255,255,255,.12)' } };
const FX2EL = { fire: 'fire', water: 'water', rock: 'earth', light: 'light', dark: 'dark', heal: 'heal', song: 'song', wind: 'wind', leaf: 'grass', slash: 'normal' };
const EL2FX = { fire: 'fire', water: 'water', earth: 'rock', light: 'light', dark: 'dark', wind: 'wind', grass: 'leaf', heal: 'heal', song: 'song', normal: 'slash', buff: 'light', debuff: 'dark' };
function elemOf(s, a) { let e = 'normal';
  if (s.heal || s.cure) e = 'heal'; else if (s.buff) e = 'buff'; else if (!s.power && (s.sleep || s.slow)) e = s.fx === 'song' ? 'song' : 'debuff'; else if (s.drain && !s.power) e = 'dark';
  else if (s.type && s.type !== 'normal' && EL[s.type]) e = s.type; else if (s.fx && FX2EL[s.fx]) e = FX2EL[s.fx];
  if (e === 'normal' && a && a.foe) e = (a.type && EL[a.type] && a.type !== 'normal') ? a.type : a.boss ? 'dark' : 'normal'; return e; }
// ---- 位置 ----
const bElOf = x => x && (x.foe ? $('foe' + B.F.indexOf(x)) : $('pc' + B.P.indexOf(x)));
// 仲間の ステージ上の すがた（#bAllies の コマ）。 なければ 上の カード
const bSprOf = x => x && !x.foe && B.P ? $('al' + B.P.indexOf(x)) : null;
const bArtOf = x => { if (x && !x.foe) { const s = bSprOf(x); if (s && s.offsetWidth) return s.querySelector('.al-art') || s; } const e = bElOf(x); return e && (e.querySelector('.foe-art') || e.querySelector('.pc-face') || e); };
const ctrOf = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r }; };
// ---- fx ノード（上限つき・寿命で 自動で 消える） ----
function fxNode(cls, x, y, html = '', life = 900, vars = '') { const L = $('bfx'); while (L.childElementCount > 70) L.firstChild.remove();
  const n = document.createElement('div'); n.className = 'bx ' + cls; n.style.cssText = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;${vars}`; if (html) n.innerHTML = html; L.appendChild(n);
  setTimeout(() => n.remove(), life / bspd()); return n; }
const fxQ = () => calmOn() ? .5 : 1;
// 腕の みせどころは 待ちも スキップ可能（タップで その行動の 演出を まとめて とばす）
async function fxw(ms) { if (B.fxSkip) return; if (await bwait(ms)) B.fxSkip = true; }
// ---- カメラ：ステージ・敵・味方を 同じ 点を 中心に すこし ズーム＆パン ----
function camTo(el, s = 1.06) { if (B.d3 && HOOK.b3dCam && B.active) return HOOK.b3dCam(el, s); if (!el || calmOn() || !B.active) return camReset(); const c = ctrOf(el), W = innerWidth, H = innerHeight;
  const px = Math.max(-40, Math.min(40, (W / 2 - c.x) * .1)), py = Math.max(-18, Math.min(18, (H * .42 - c.y) * .1));
  for (const id of ['bStage', 'bFoes', 'bAllies']) { const e = $(id); if (!e) continue; e.style.transformOrigin = `${(c.x - e.offsetLeft).toFixed(0)}px ${(c.y - e.offsetTop).toFixed(0)}px`; e.style.scale = s; e.style.translate = `${px.toFixed(1)}px ${py.toFixed(1)}px`; } }
function camReset() { if (B.d3 && HOOK.b3dCam) HOOK.b3dCam(null); for (const id of ['bStage', 'bFoes', 'bAllies']) { const e = $(id); if (e) { e.style.scale = ''; e.style.translate = ''; } } }
// ---- 行動者の リボン「ソラの こうげき！」 ----
function ribbon(x, text, cls = '') { const el = bElOf(x); if (!el) return; const r = (x.foe ? (el.querySelector('.foe-art') || el) : (bSprOf(x) || el)).getBoundingClientRect(); if (!r.width) return;
  const W = innerWidth, cx = Math.max(90, Math.min(W - 90, r.left + r.width / 2)); const y = Math.max(16, r.top + (x.foe ? 2 : -2));
  fxNode('b-rib' + (x.foe ? ' foe' : ' ally') + (cls ? ' ' + cls : ''), cx, y, `<span>${esc(text)}</span>`, 1250); }
function setCls(x, c, on) { const e = bElOf(x); if (e) e.classList.toggle(c, on); const s = bSprOf(x); if (s) s.classList.toggle(c, on); }
// ねらいの 目印（照準）
function markTgt(t, on = true) { const e = bElOf(t); if (!e) return; setCls(t, 'tgt', on); if (on) { clearTimeout(t._tg); t._tg = setTimeout(() => setCls(t, 'tgt', false), 1400 / bspd()); } if (!on) return; const a = bArtOf(t); if (!a) return; const c = ctrOf(a);
  fxNode('reticle' + (t.foe ? '' : ' ally'), c.x, c.y, '<i></i><i></i>', 700); }
// ---- 画面の いろみ（ステージだけ 染める：キャラは くっきり） ----
function tint(el, ms = 700) { const t = $('bTint'); if (!t || !EL[el]) return; t.style.setProperty('--tc', EL[el].tint); t.className = 'on' + (calmOn() ? ' calm' : ''); clearTimeout(tint.t); tint.t = setTimeout(() => { t.className = ''; }, ms / bspd()); }
// ---- 武器：ふりかぶり → 飛ぶ／走る → （hit() で 武器ごとの 着弾） ----
function wpnWind(a, w, el = 'normal') { const fa = bArtOf(a); if (!fa) return; const A = ctrOf(fa); const ec = EL[el] || EL.normal;
  const dir = a.foe ? (A.x > innerWidth / 2 ? -1 : 1) : (B.P.indexOf(a) % 2 ? -1 : 1);
  Music.sfx('w_' + w); fxNode('wg w-' + w + (el !== 'normal' ? ' el' : ''), A.x + dir * 14, A.y - 26, wsvg(w), 700, `--ec:${ec.c[0]};--ec2:${ec.c[1]};--dir:${dir}`); }
async function wpnFly(a, t, w, el = 'normal') { const fa = bArtOf(a), ta = bArtOf(t); if (!fa || !ta) return 0; const A = ctrOf(fa), T = ctrOf(ta);
  const dx = T.x - A.x, dy = T.y - A.y, dist = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI; const ec = EL[el] || EL.normal;
  const vars = `--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--len:${dist.toFixed(0)}px;--ang:${ang.toFixed(1)}deg;--ec:${ec.c[0]};--ec2:${ec.c[1]}`;
  camTo(ta, 1.09); markTgt(t); Music.sfx('v_' + w);
  if (w === 'sword' || w === 'fist') fxNode('tr tr-dash' + (el !== 'normal' ? ' el' : ''), A.x, A.y, '', 420, vars);
  else if (w === 'spear') { fxNode('tr tr-line', A.x, A.y, '', 420, vars); fxNode('tr tr-tip', A.x, A.y, wsvg('spear'), 300, vars); }
  else if (w === 'harp') { for (let i = 0; i < 3; i++) fxNode('tr tr-note', A.x, A.y, i % 2 ? '♫' : '♪', 520, vars + `;--i:${i}`); fxNode('tr tr-wave', A.x, A.y, '', 520, vars); }
  else if (w === 'staff') { fxNode('tr tr-star', A.x, A.y, '✦', 420, vars); fxNode('tr tr-star s2', A.x, A.y, '✦', 480, vars); }
  else if (w === 'fan') { fxNode('tr tr-gust', A.x, A.y, '', 460, vars); fxNode('tr tr-gust s2', A.x, A.y, '', 520, vars); }
  else if (w === 'anchor') { fxNode('tr tr-chain', A.x, A.y, '', 560, vars); fxNode('tr tr-anchor', A.x, A.y, wsvg('anchor'), 440, vars); }
  else if (w === 'bow') { fxNode('tr tr-line thin', A.x, A.y, '', 300, vars); fxNode('tr tr-arrow', A.x, A.y, '', 260, vars); }
  else if (w === 'dagger') { fxNode('tr tr-dash quick', A.x, A.y, '', 300, vars); }
  else if (w === 'axe') { fxNode('tr tr-axe', A.x, A.y, wsvg('axe'), 440, vars); }
  if (el !== 'normal' && w !== 'sword') fxNode('tr tr-trail', A.x, A.y, '', 460, vars);
  await fxw({ sword: 130, fist: 120, spear: 150, harp: 280, staff: 240, fan: 260, anchor: 300, bow: 200, dagger: 90, axe: 300 }[w] || 160); return ang; }
// ---- 敵の とびかかり（ねらった 仲間の ほうへ） ----
async function foeLunge(f, t) { const fe = bElOf(f), fa = bArtOf(f), ta = bArtOf(t); if (!fe || !fa) return; let lx = 0, ly = 26; if (t) markTgt(t);
  if (ta) { const A = ctrOf(fa), T = ctrOf(ta); const dx = T.x - A.x, dy = T.y - A.y, d = Math.hypot(dx, dy) || 1, k = Math.min(.42, 130 / d); lx = dx * k; ly = dy * k; }
  fe.style.setProperty('--lx', lx.toFixed(0) + 'px'); fe.style.setProperty('--ly', ly.toFixed(0) + 'px'); fe.classList.remove('lunge', 'lunge2'); void fe.offsetWidth; fe.classList.add('lunge2');
  setTimeout(() => fe.classList.remove('lunge2'), 520 / bspd()); }
// ---- 魔法：詠唱の 輪 → 属性ごとの 弾／落下／光柱 ----
function castStart(a, el, big) { const fa = bArtOf(a); if (!fa) return; const A = ctrOf(fa); const ec = EL[el] || EL.normal; tint(el, big ? 2200 : 1500);
  fxNode('cast-ring' + (a.foe ? ' foe' : '') + (big ? ' big' : ''), A.x, A.y, '<i></i><b></b>', 900, `--ec:${ec.c[0]};--ec2:${ec.c[1]}`); Music.sfx('e_' + (EL[el] ? el : 'normal')); }
async function castFly(a, el, T) { const fa = bArtOf(a); if (!fa || !T.length || el === 'heal' || el === 'buff') return; const A = ctrOf(fa); const ec = EL[el] || EL.normal;
  const first = bArtOf(T[0]); if (T.length === 1 && first) camTo(first, 1.08); else camTo(T[0].foe ? $('bFoes') : $('bParty'), 1.03);
  T.forEach((t, i) => { const ta = bArtOf(t); if (!ta) return; const C = ctrOf(ta); const dx = C.x - A.x, dy = C.y - A.y, ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const vars = `--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--ang:${ang.toFixed(1)}deg;--ec:${ec.c[0]};--ec2:${ec.c[1]};--ec3:${ec.c[2]};animation-delay:${(i * 60 / bspd()).toFixed(0)}ms`;
    if (el === 'earth') fxNode('pj pj-rock', C.x, C.y - 150, '<i></i><i></i><i></i>', 520, vars.replace(/--dx:[^;]+;--dy:[^;]+/, '--dx:0px;--dy:150px'));
    else if (el === 'light') fxNode('pj pj-beam', C.x, C.y, '', 620, vars);
    else if (el === 'debuff' || el === 'song') fxNode('pj pj-wave', A.x, A.y, el === 'song' ? '♪' : '', 520, vars);
    else fxNode('pj pj-' + (EL[el] ? el : 'normal'), A.x, A.y, '<i></i>', 520, vars); });
  await fxw(el === 'light' ? 280 : 300); }
// ---- 状態・強化の 演出 ----
const AIL_EL = { poison: 'dark', burn: 'fire', para: 'light' };
function ailFx(t, ail) { const a = bArtOf(t); if (!a) return; const C = ctrOf(a); const g = { poison: '☠', burn: '🔥', para: '⚡', sleep: 'Z', slow: '«' }[ail] || '!';
  fxNode('ailfx a-' + ail, C.x, C.y, `<b>${g}</b><i></i><i></i><i></i><i></i>`, 1000); Music.sfx('ail_' + ail); }
function buffFx(T, kind) { T.forEach((t, i) => { const a = bArtOf(t); if (!a) return; const C = ctrOf(a); const g = { atk: '⚔', def: '🛡', spd: '»' }[kind] || '↑';
  fxNode('bufffx b-' + kind, C.x, C.y, `<b>${g}<small>↑</small></b><i></i><i></i><i></i><i></i><i></i>`, 1100, `animation-delay:${i * 70}ms`); }); Music.sfx('buff'); }
function mpFx(a, cost) { const e = bElOf(a); if (!e || !cost) return; e.classList.remove('mpglow'); void e.offsetWidth; e.classList.add('mpglow'); setTimeout(() => e.classList.remove('mpglow'), 700 / bspd());
  const mb = e.querySelectorAll('.bar')[1]; if (mb) { const C = ctrOf(mb); fxNode('mpnum', C.x, C.y - 6, `MP −${cost}`, 900); } Music.sfx('mp'); }
// ---- 仲間の コマ：ステージの 左右に 立つ ミニフィギュア（カードは 上で ステータス表示） ----
function acol(m) { try { if (m.kind === 'human') { const p = Art.P && Art.P[m.id]; if (p && p.bg) return p.bg; return { sora: '#f0a040', mio: '#2f9a8a', riku: '#c23a35', sana: '#4a5fb0', haru: '#6fc0e0', kaito: '#2f6f73' }[m.id] || '#f3c15a'; }
  return DATA.typeCol[SPC[m.id].type] || '#8fe06a'; } catch (_) { return '#f3c15a'; } }
function drawAllies(P, ai = -1) { let host = $('bAllies'); if (!host) { host = document.createElement('div'); host.id = 'bAllies'; host.setAttribute('aria-hidden', 'true'); $('bFoes').after(host); }
  const base = (m, i) => `al ${i % 2 ? 'r' : 'l'} s${i >> 1} ${m.kind === 'human' ? 'hu' : 'mo'}`;
  if (host.children.length !== P.length || [...host.children].some((e, i) => e.id !== 'al' + i || e.dataset.id !== P[i].id))
    host.innerHTML = P.map((m, i) => { const w = wpnOf(m); return `<div class="${base(m, i)}" id="al${i}" data-id="${m.id}" style="--ac:${acol(m)}"><div class="al-body"><div class="al-shadow"></div><div class="al-art"></div>${w ? `<div class="al-wpn w-${w}">${wsvg(w)}</div>` : ''}<div class="al-n"></div></div></div>`; }).join('');
  P.forEach((m, i) => { const el = host.children[i]; keepCls(el, `${base(m, i)}${i === ai ? ' act' : ''}${m.hp <= 0 ? ' down' : ''}${m.hp > 0 && m.hp < m.st.hp * .25 ? ' low' : ''}${m.guard ? ' guard' : ''}`);
    const a = el.querySelector('.al-art'), fk = m.id + ':' + (m.kind === 'human' ? (m.hp <= 0 ? 'c' : m.hp < m.st.hp * .3 ? 'w' : 'd') : m.shiny ? 's' : ''); if (a.dataset.k !== fk) { a.dataset.k = fk; a.innerHTML = faceOf(m); }
    const n = el.querySelector('.al-n'), nt = nameOf(m); if (n.textContent !== nt) n.textContent = nt; }); }
// 行動者：一歩 前へ（カードも ステージの コマも）＋ 名前リボン＋ 軽い カメラ寄り
// v12：行動者の 名札（画面上部・大きく）＋ スポットライト（行動者と ねらい以外を 暗く）
function actorPlate(a, label) { const old = B.plate; if (old) old.remove(); const L = String(label || ''), k = L.indexOf('の '); const nm = k > 0 ? L.slice(0, k) : (a.foe ? a.name : nameOf(a)), act = k > 0 ? L.slice(k + 2) : L;
  const f = a.foe ? '<span class="ap-f foe">⚔</span>' : `<span class="ap-f">${a.kind === 'human' ? Art.portrait(a.id, 'determined') : faceOf(a)}</span>`;
  const el = bAdd('aplate ' + (a.foe ? 'foe' : 'ally'), `${f}<b>${esc(nm)}</b><em>${esc(act)}</em>`); el.style.setProperty('--ac', a.foe ? '#d0405a' : acol(a)); el.style.setProperty('--bs', bspd()); B.plate = el; }
function actorOn(a, label) { B.fxSkip = false; setCls(a, 'actor', true); if (label) actorPlate(a, label); if (!calmOn()) $('battle').classList.add('spot'); const s = a.foe ? bArtOf(a) : bSprOf(a); if (s) camTo(s, 1.04); }
function actorOff(...A) { for (const a of A) if (a) { setCls(a, 'actor', false); setCls(a, 'strike', false); } camReset(); $('battle').classList.remove('spot'); const p = B.plate; if (p) { B.plate = null; p.classList.add('out'); setTimeout(() => p.remove(), 220); } }
function strike(a) { const s = a.foe ? bElOf(a) : bSprOf(a); if (!s) return; s.classList.remove('strike'); void s.offsetWidth; s.classList.add('strike'); }
// 数字は ステージの コマに（なければ カード）
function numAt(x, v, heal, cls = '') { const el = x.foe ? bElOf(x) : (bSprOf(x) || bElOf(x)); hitFx(el, v, heal, cls); }
// ふつうの こうげき：武器（ふりかぶり → 軌跡 → 着弾）／ いきもの（体あたり等）
async function strikeFx(a, t) { const w = wpnOf(a); if (!t) return {};
  if (w) { strike(a); wpnWind(a, w); await fxw(150); const ang = await wpnFly(a, t, w); return { fx: 'w_' + w, wpn: w, ang }; }
  const k = monAtk(a); if (a.foe) await foeLunge(a, t); else { strike(a); markTgt(t); const ta = bArtOf(t); if (ta) camTo(ta, 1.07); }
  await fxw(a.foe ? 190 : 170); return { fx: 'm_' + k, msfx: k }; }
// ---- バトル背景：地域・バイオームごとの 描き割りステージ（表示中は フィールドの 3D描画を 止める → 軽い） ----
const STAGES = {
  meadow: { sky: ['#4f9be0', '#98cdf0', '#f6e8c4'], far: '#86aeb8', near: '#4d8a58', g: ['#79b85e', '#3d7a3a'], sil: 'hills', fg: 'grass', pt: 'leaf', sun: 1 },
  forest: { sky: ['#3f82b8', '#86bcd4', '#d6e8c2'], far: '#5d8a78', near: '#28543a', g: ['#4e8a3c', '#244e28'], sil: 'trees', fg: 'canopy', pt: 'leaf' },
  shore: { sky: ['#3f96dc', '#98d4f0', '#fff0d2'], far: '#4aa6cc', near: '#5a6878', g: ['#ecdcac', '#c4a878'], sil: 'sea', fg: 'palm', pt: 'spark', sun: 1 },
  highland: { sky: ['#5690cc', '#a6c6e0', '#e8e2d4'], far: '#8a9ab4', near: '#5e6e62', g: ['#8a9a6a', '#56664a'], sil: 'mountains', fg: 'rocks', pt: 'dust' },
  desert: { sky: ['#e0924e', '#f6c888', '#fff0c8'], far: '#d6a070', near: '#9a6a44', g: ['#ecc484', '#bc8a48'], sil: 'dunes', fg: 'cactus', pt: 'sand', sun: 1 },
  snow: { sky: ['#7392c0', '#b6c8e2', '#eef2f8'], far: '#a4b6d2', near: '#6a7e98', g: ['#f2f6fc', '#b8c6de'], sil: 'mountains', snowcap: 1, fg: 'pine', pt: 'snow' },
  ruins: { sky: ['#5e6c86', '#9ca4ae', '#d8d0c0'], far: '#88867a', near: '#56564e', g: ['#8a8a70', '#56563f'], sil: 'ruins', fg: 'column', pt: 'dust' },
  skyisle: { sky: ['#347fdc', '#8cc6f8', '#f2f9ff'], far: '#ffffff', near: '#5a7a9a', g: ['#8fd07a', '#4e9048'], sil: 'clouds', fg: 'puff', pt: 'spark', sun: 1, float: 1 },
  skyrock: { sky: ['#4270bc', '#94b6e8', '#e8f0ff'], far: '#ffffff', near: '#5a6078', g: ['#a4a4ae', '#6a6a7a'], sil: 'clouds', fg: 'puff', pt: 'spark', float: 1 },
  crystal: { sky: ['#2e2270', '#7458b4', '#dab8f2'], far: '#a48ee0', near: '#4a3490', g: ['#8a70c8', '#40327e'], sil: 'crystals', fg: 'shards', pt: 'spark' },
  seabed: { sky: ['#07284f', '#15608e', '#4aaec6'], far: '#2a6886', near: '#174666', g: ['#c8b890', '#86785e'], sil: 'reef', fg: 'kelp', pt: 'bubble', sea: 1 },
  kelp: { sky: ['#062a40', '#156270', '#3a9e9a'], far: '#1a5858', near: '#0c3a2e', g: ['#6a8a60', '#34543a'], sil: 'kelp', fg: 'kelp', pt: 'bubble', sea: 1 },
  coral: { sky: ['#08386c', '#2878ae', '#6ac8d8'], far: '#c46a8a', near: '#86386a', g: ['#e0c8a0', '#9c8464'], sil: 'coral', fg: 'coral', pt: 'bubble', sea: 1 },
  trench: { sky: ['#01040c', '#05142a', '#0a2846'], far: '#0a2036', near: '#040a16', g: ['#1a2a3a', '#080e18'], sil: 'reef', fg: 'rocks', pt: 'glow', sea: 1 },
  // 地域ごとの ボス舞台
  boss0: { sky: ['#1a0a2a', '#6a2a4a', '#e8804a'], far: '#3a2440', near: '#140a18', g: ['#4a3a3a', '#1a1216'], sil: 'lighthouse', fg: 'rocks', pt: 'ember', boss: 1 },
  boss1: { sky: ['#0e0a22', '#3a2a5a', '#8a6a8a'], far: '#2a2440', near: '#120e1c', g: ['#4a4440', '#1a1816'], sil: 'ruins', fg: 'column', pt: 'meteor', boss: 1 },
  boss2: { sky: ['#02030e', '#1a1450', '#5a3a9a'], far: '#4a3a8a', near: '#140c34', g: ['#3a2e6a', '#120c28'], sil: 'nest', fg: 'shards', pt: 'star', boss: 1, float: 1 },
  boss3: { sky: ['#000206', '#04101e', '#0a2036'], far: '#0c2a3a', near: '#02080e', g: ['#12202a', '#04080c'], sil: 'abyss', fg: 'kelp', pt: 'glow', boss: 1, sea: 1 },
};
function stageKind(opts) { if (opts.stage && STAGES[opts.stage]) return opts.stage; if (opts.boss) return 'boss' + Math.min(3, G.region | 0);
  let b = 'grass'; try { b = World.biomeAt(player.x, player.z); } catch (_) {}
  const r = G.region;
  if (r === 3) return { kelp: 'kelp', coral: 'coral', trench: 'trench' }[b] || 'seabed';
  if (r === 2) return { rock: 'skyrock', crystal: 'crystal' }[b] || 'skyisle';
  if (r === 1) return { shore: 'shore', forest: 'forest', desert: 'desert', snow: 'snow', ruins: 'ruins' }[b] || 'meadow';
  return { shore: 'shore', forest: 'forest', rock: 'highland' }[b] || 'meadow'; }
// 地平線の シルエット（viewBox 1000×200・下辺まで 塗る）。 far＝遠景、near＝近景。 .hi＝明るい ハイライト（雪・光）
function silSVG(kind, layer, seed, opt = {}) {
  let s = seed >>> 0; const rn = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const far = layer === 'far', H = 200, f = n => n.toFixed(0); let d = '', ex = '';
  const ridge = (n, amp, base, jag, peaks) => { let p = `M0 ${H} L0 ${f(base - rn() * amp)}`; for (let i = 1; i <= n; i++) { const x = i / n * 1000, y = base - rn() * amp;
    if (jag) { const mx = x - 500 / n + (rn() - .5) * 30, my = base - amp * (.2 + rn() * .5); p += ` L${f(mx)} ${f(my)} L${f(x)} ${f(y)}`; if (peaks) peaks.push([x, y]); }
    else p += ` Q${f(x - 500 / n)} ${f(y - amp * .35)} ${f(x)} ${f(y)}`; } return p + ` L1000 ${H} Z`; };
  const canopy = (base, amp, step) => { let p = `M0 ${H} L0 ${base}`; for (let x = 0; x < 1000; x += step) { const r = step * (.5 + rn() * .5), y = base - rn() * amp; p += ` L${f(x)} ${f(y)} A${f(r)} ${f(r)} 0 0 1 ${f(x + step)} ${f(y)}`; } return p + ` L1000 ${base} L1000 ${H} Z`; };
  const pine = (x, h, w, b = 196) => ` M${f(x - w)} ${b} L${f(x)} ${f(b - h)} L${f(x + w)} ${b} Z M${f(x - w * .8)} ${f(b - h * .35)} L${f(x)} ${f(b - h * 1.1)} L${f(x + w * .8)} ${f(b - h * .35)} Z M${f(x - 2)} 200 L${f(x - 2)} ${b} L${f(x + 2)} ${b} L${f(x + 2)} 200 Z`;
  const leafy = (x, h, r, b = 196) => { ex += `<circle cx="${f(x)}" cy="${f(b - h)}" r="${f(r)}"/><circle cx="${f(x - r * .7)}" cy="${f(b - h + r * .45)}" r="${f(r * .75)}"/><circle cx="${f(x + r * .75)}" cy="${f(b - h + r * .4)}" r="${f(r * .7)}"/>`; return ` M${f(x - 3)} 200 L${f(x - 2)} ${f(b - h + r * .5)} L${f(x + 2)} ${f(b - h + r * .5)} L${f(x + 3)} 200 Z`; };
  const isle = (x, y, w, trees) => { let p = ` M${f(x - w)} ${f(y)} Q${f(x)} ${f(y - w * .18)} ${f(x + w)} ${f(y)} L${f(x + w * .55)} ${f(y + w * .35)} L${f(x + w * .1)} ${f(y + w * .8)} L${f(x - w * .3)} ${f(y + w * .45)} Z`;
    if (trees) for (let k = 0; k < 3; k++) { const tx = x - w * .6 + k * w * .55; p += pine(tx, w * (.35 + rn() * .2), w * .1, y - w * .06); }
    ex += `<path class="st" style="--sw:2px" d="M${f(x - w * .2)} ${f(y + w * .5)} q4 ${f(w * .3)} -2 ${f(w * .55)} M${f(x + w * .3)} ${f(y + w * .3)} q-3 ${f(w * .25)} 3 ${f(w * .45)}"/>`; return p; };
  switch (kind) {
    case 'hills': if (far) d = ridge(4, 60, 150, false); else { d = ridge(6, 30, 190, false); for (let i = 0; i < 5; i++) ex += `<circle cx="${f(rn() * 1000)}" cy="${f(186 + rn() * 6)}" r="${f(8 + rn() * 12)}"/>`; d += leafy(120 + rn() * 100, 70, 26) + leafy(760 + rn() * 120, 56, 20); } break;
    case 'mountains': { if (far) { const pk = []; d = ridge(7, 120, 186, true, pk); if (opt.snow) for (const [x, y] of pk) if (y < 120) ex += `<path class="hi" d="M${f(x - 20)} ${f(y + 22)} L${f(x)} ${f(y)} L${f(x + 22)} ${f(y + 24)} L${f(x + 8)} ${f(y + 16)} L${f(x - 4)} ${f(y + 26)} Z"/>`; }
      else { d = ridge(9, 40, 196, false); for (let x = 30; x < 1000; x += 60 + rn() * 90) d += pine(x, 40 + rn() * 50, 12 + rn() * 6); } break; }
    case 'dunes': d = ridge(far ? 3 : 4, far ? 46 : 26, far ? 168 : 192, false); if (far) ex += `<path d="M600 175 L640 120 L680 175 Z M650 175 L672 146 L694 175 Z"/>`; else for (const x of [180 + rn() * 80, 820 + rn() * 60]) d += ` M${f(x - 5)} 200 L${f(x - 5)} 120 Q${f(x)} 110 ${f(x + 5)} 120 L${f(x + 5)} 200 Z M${f(x - 5)} 160 L${f(x - 18)} 160 L${f(x - 18)} 138 L${f(x - 12)} 138 L${f(x - 12)} 154 L${f(x - 5)} 154 Z M${f(x + 5)} 150 L${f(x + 16)} 150 L${f(x + 16)} 128 L${f(x + 22)} 128 L${f(x + 22)} 156 L${f(x + 5)} 156 Z`; break;
    case 'trees': if (far) d = canopy(150, 30, 34); else { d = `M0 ${H} L0 196 L1000 196 L1000 ${H} Z`; for (let x = -10; x < 1030; x += 34 + rn() * 50) d += rn() < .5 ? pine(x, 70 + rn() * 70, 16 + rn() * 10) : leafy(x, 60 + rn() * 60, 20 + rn() * 14); } break;
    case 'sea': if (far) { d = `M0 ${H} L0 178 L620 178 Q680 146 740 160 Q770 140 812 172 L1000 178 L1000 ${H} Z M705 152 L709 118 L717 118 L721 152 Z`; ex += `<circle class="hi" cx="713" cy="116" r="4"/>`; }
      else { d = `M0 ${H} L0 194 L1000 194 L1000 ${H} Z`; for (const [x, w] of [[90, 90], [880, 110], [520, 40]]) d += ` M${x - w} 200 Q${x - w * .6} ${f(170 - rn() * 20)} ${x} ${f(165 - rn() * 20)} Q${x + w * .7} ${f(168 - rn() * 10)} ${x + w} 200 Z`; } break;
    case 'ruins': if (far) { d = ridge(5, 40, 176, false); for (let x = 80; x < 1000; x += 140 + rn() * 120) d += ` M${f(x)} 180 L${f(x)} ${f(120 - rn() * 30)} L${f(x + 14)} ${f(118 - rn() * 30)} L${f(x + 14)} 180 Z`; }
      else { d = `M0 ${H} L0 196 L1000 196 L1000 ${H} Z`;
        for (let x = 30; x < 1000; x += 110 + rn() * 130) { if (x > 380 && x < 600) continue; const h = 60 + rn() * 80, w = 18 + rn() * 8, br = rn() < .5; d += ` M${f(x)} 200 L${f(x)} ${f(H - h)} L${f(x + w)} ${f(H - h - (br ? 12 : 0))} L${f(x + w)} 200 Z` + (br ? '' : ` M${f(x - 6)} ${f(H - h)} L${f(x + w + 6)} ${f(H - h)} L${f(x + w + 6)} ${f(H - h - 8)} L${f(x - 6)} ${f(H - h - 8)} Z`); }
        d += ` M430 200 L430 96 Q490 40 550 96 L550 200 L532 200 L532 106 Q490 66 448 106 L448 200 Z M380 200 L388 186 L412 184 L420 200 Z`; } break;
    case 'clouds': if (far) { d = `M0 ${H} L0 176 L1000 176 L1000 ${H} Z`; for (let i = 0; i < 16; i++) ex += `<circle cx="${f(i * 66 + rn() * 30)}" cy="${f(176 + rn() * 10)}" r="${f(22 + rn() * 26)}"/>`; }
      else d = isle(150 + rn() * 60, 70 + rn() * 20, 62, true) + isle(830 + rn() * 70, 44 + rn() * 20, 48, true) + isle(560 + rn() * 50, 130, 26, false); break;
    case 'crystals': if (far) d = ridge(6, 70, 180, true); else { d = `M0 ${H} L0 196`; for (let x = 0; x < 1030; x += 26 + rn() * 50) { const h = 30 + rn() * 110, w = 8 + rn() * 12, lean = (rn() - .5) * 20; d += ` L${f(x - w)} 196 L${f(x + lean)} ${f(196 - h)} L${f(x + w)} 196`; if (h > 90) ex += `<path class="hi" d="M${f(x + lean)} ${f(196 - h)} L${f(x + w * .6)} 196 L${f(x + lean * .5)} 196 Z"/>`; } d += ` L1000 196 L1000 ${H} Z`; } break;
    case 'reef': d = far ? ridge(6, 70, 176, false) : ridge(10, 30, 196, true); if (!far) d += ` M620 200 L630 120 Q700 70 770 120 L780 200 L760 200 L752 130 Q700 100 648 130 L640 200 Z`; break;
    case 'kelp': if (far) d = ridge(6, 40, 176, false); else { d = `M0 ${H} L0 196 L1000 196 L1000 ${H} Z`;
      for (let x = 10; x < 1000; x += 28 + rn() * 44) { const h = 80 + rn() * 110, sw = 10 + rn() * 14; ex += `<path class="st" style="--sw:${(5 + rn() * 4).toFixed(1)}px;--kd:${(-rn() * 5).toFixed(1)}s" d="M${f(x)} 200 Q${f(x + sw)} ${f(200 - h * .33)} ${f(x)} ${f(200 - h * .6)} T${f(x + sw * .3)} ${f(200 - h)}"/>`; } } break;
    case 'coral': if (far) d = ridge(7, 50, 180, false); else { d = `M0 ${H} L0 194 L1000 194 L1000 ${H} Z`;
      for (let x = 30; x < 1000; x += 80 + rn() * 110) { const r = 18 + rn() * 26; ex += `<circle cx="${f(x)}" cy="${f(194 - r * .5)}" r="${f(r)}"/><path class="st" style="--sw:5px" d="M${f(x + r + 10)} 200 L${f(x + r + 10)} ${f(160 - rn() * 30)} M${f(x + r + 10)} ${f(178)} L${f(x + r + 26)} ${f(150 - rn() * 20)} M${f(x + r + 10)} 184 L${f(x + r - 6)} ${f(158 - rn() * 20)}"/>`; } } break;
    case 'lighthouse': if (far) d = ridge(5, 50, 176, false); else { d = `M0 ${H} L0 190 Q300 184 560 190 L700 150 L780 130 L1000 136 L1000 ${H} Z M820 134 L834 34 L866 34 L880 134 Z M826 34 L874 34 L870 22 L830 22 Z M838 22 L850 8 L862 22 Z`; ex += `<path class="hi dim" d="M834 22 L866 22 L866 34 L834 34 Z"/>`; } break;
    case 'nest': if (far) { d = `M0 ${H} L0 190 L1000 190 L1000 ${H} Z`; for (let i = 0; i < 7; i++) { const x = 60 + i * 140 + rn() * 40, y = 60 + rn() * 80, h = 14 + rn() * 26; d += ` M${f(x)} ${f(y - h)} L${f(x + h * .4)} ${f(y)} L${f(x)} ${f(y + h * .7)} L${f(x - h * .4)} ${f(y)} Z`; } }
      else { d = `M0 ${H} L0 186 L1000 186 L1000 ${H} Z`; ex += `<path class="st" style="--sw:14px" d="M-20 150 Q200 60 380 150 M1020 150 Q800 50 620 150 M-10 180 Q250 110 500 176 Q750 110 1010 180"/>`; } break;
    case 'abyss': if (far) { d = ridge(6, 90, 190, true); d += ` M460 190 L470 60 L480 30 L490 60 L500 20 L510 60 L520 30 L530 60 L540 190 Z`; }
      else { d = `M0 ${H} L0 150 Q60 60 150 40 L170 200 Z M1000 ${H} L1000 140 Q940 50 850 40 L830 200 Z M0 196 L1000 196 L1000 ${H} L0 ${H} Z`; for (const [x, y] of [[150, 60], [850, 56]]) ex += `<circle class="hi glow" cx="${x}" cy="${y}" r="5"/>`; } break;
    default: d = ridge(5, 50, 170, false);
  }
  return `<svg class="bst-sil ${layer}" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/>${ex}</svg>`; }
// 手前の 額縁（左右の 端）：画面の へりに 大きな シルエットを おいて 奥行きを だす
function fgSVG(kind, seed) {
  let s = seed >>> 0; const rn = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; const f = n => n.toFixed(0); let d = '', ex = '';
  switch (kind) {
    case 'grass': for (let i = 0; i < 14; i++) { const x = rn() * 200, h = 60 + rn() * 110, c = (rn() - .5) * 60; d += ` M${f(x - 4)} 300 Q${f(x + c * .5)} ${f(300 - h * .6)} ${f(x + c)} ${f(300 - h)} Q${f(x + c * .4 + 3)} ${f(300 - h * .5)} ${f(x + 5)} 300 Z`; } ex += `<circle class="hi" cx="${f(60 + rn() * 80)}" cy="${f(180 + rn() * 40)}" r="6"/>`; break;
    case 'canopy': d = 'M0 0 L200 0 Q170 40 120 50 Q150 80 90 90 Q70 130 30 120 Q10 170 0 160 Z M20 0 L34 300 L6 300 L0 0 Z'; for (let i = 0; i < 6; i++) ex += `<circle cx="${f(rn() * 150)}" cy="${f(rn() * 100)}" r="${f(24 + rn() * 26)}"/>`; break;
    case 'palm': d = 'M30 300 Q40 180 90 90 L98 94 Q54 180 46 300 Z'; ex += '<path d="M94 92 Q140 60 190 90 Q140 74 96 96 Z M94 92 Q60 40 10 50 Q60 60 92 96 Z M94 92 Q120 30 160 20 Q120 50 98 94 Z M94 92 Q50 90 20 130 Q60 100 94 96 Z"/>'; break;
    case 'rocks': d = 'M0 300 L0 150 Q30 110 80 130 Q120 120 140 170 Q170 190 180 250 L200 300 Z'; ex += '<path class="hi" d="M20 150 Q40 128 70 138 L60 146 Q40 140 26 156 Z"/>'; break;
    case 'cactus': d = 'M80 300 L80 110 Q95 90 110 110 L110 300 Z M80 200 L50 200 L50 150 Q58 140 66 150 L66 186 L80 186 Z M110 180 L140 180 L140 130 Q148 120 156 130 L156 196 L110 196 Z M0 300 L0 260 Q60 240 200 270 L200 300 Z'; break;
    case 'pine': d = 'M0 0 L200 30 L150 40 L190 60 L120 66 L160 90 L60 96 L100 116 L0 130 Z'; ex += '<path class="hi" d="M40 12 L160 34 L120 38 Z M30 70 L140 70 L100 78 Z"/>'; break;
    case 'column': d = 'M40 300 L40 80 L30 80 L30 64 L110 64 L110 80 L100 80 L100 300 Z M0 300 L0 270 L140 262 L160 300 Z'; ex += '<path class="hi" d="M52 90 L58 90 L58 290 L52 290 Z"/>'; break;
    case 'puff': for (let i = 0; i < 6; i++) ex += `<circle cx="${f(rn() * 180)}" cy="${f(220 + rn() * 70)}" r="${f(30 + rn() * 30)}"/>`; d = 'M0 300 L0 280 L200 280 L200 300 Z'; break;
    case 'shards': for (let i = 0; i < 5; i++) { const x = 20 + rn() * 150, h = 80 + rn() * 150, w = 12 + rn() * 16; d += ` M${f(x - w)} 300 L${f(x + (rn() - .5) * 30)} ${f(300 - h)} L${f(x + w)} 300 Z`; } ex += '<path class="hi" d="M60 300 L70 150 L74 300 Z"/>'; break;
    case 'kelp': for (let i = 0; i < 5; i++) { const x = 20 + i * 36 + rn() * 20, h = 150 + rn() * 140; ex += `<path class="st" style="--sw:${f(8 + rn() * 6)}px;--kd:${(-rn() * 4).toFixed(1)}s" d="M${f(x)} 300 Q${f(x + 30)} ${f(300 - h * .35)} ${f(x)} ${f(300 - h * .65)} T${f(x + 10)} ${f(300 - h)}"/>`; } break;
    case 'coral': d = 'M0 300 L0 230 Q40 200 90 230 Q140 210 170 260 L190 300 Z'; ex += '<path class="st" style="--sw:9px" d="M60 240 L60 150 M60 200 L100 140 M60 180 L24 130 M130 240 L140 170 M140 200 L170 160"/><circle cx="100" cy="140" r="10"/><circle cx="24" cy="128" r="9"/><circle cx="170" cy="158" r="8"/>'; break;
  }
  return `<svg viewBox="0 0 200 300" preserveAspectRatio="xMinYMax meet" aria-hidden="true"><path d="${d}"/>${ex}</svg>`; }
function buildStage(opts) {
  const kind = stageKind(opts), S = STAGES[kind], boss = !!opts.boss || !!S.boss;
  let night = false; try { night = !S.sea && !S.boss && World.skyInfo(G.tod).night > .5; } catch (_) {}
  let st = $('bStage'); if (!st) { st = document.createElement('div'); st.id = 'bStage'; st.setAttribute('aria-hidden', 'true'); $('battle').prepend(st); }
  st.className = `bst k-${kind}${boss ? ' boss' : ''}${S.boss ? ' rboss' : ''}${night ? ' night' : ''}${S.sea ? ' sea' : ''}${S.float ? ' skyf' : ''}`;
  const sky = night ? ['#060a20', '#141e48', S.float ? '#3a4a80' : '#2e3460'] : S.sky;
  st.style.cssText = `--s0:${sky[0]};--s1:${sky[1]};--s2:${sky[2]};--far:${S.far};--near:${S.near};--g0:${S.g[0]};--g1:${S.g[1]}`;
  const seed = [...kind].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) + (G.region * 101);
  let pts = ''; for (let i = 0; i < 12; i++) pts += `<i style="--x:${(R() * 100).toFixed(1)}%;--y:${(R() * 92).toFixed(1)}%;--d:${(5 + R() * 7).toFixed(1)}s;--dl:${(-R() * 12).toFixed(1)}s;--z:${(.5 + R() * .9).toFixed(2)}"></i>`;
  const fg = S.fg ? `<div class="bst-fg l">${fgSVG(S.fg, seed + 3)}</div><div class="bst-fg r">${fgSVG(S.fg, seed + 9)}</div>` : '';
  st.innerHTML = `<div class="bst-sky"></div>${night || S.pt === 'star' ? '<div class="bst-stars"></div>' : ''}${night ? '<div class="bst-moon"></div>' : S.sun ? '<div class="bst-sun"></div>' : ''}${S.sea ? '<div class="bst-shafts"><i></i><i></i><i></i><i></i></div>' : ''}`
    + `<div class="bst-par far">${silSVG(S.sil, 'far', seed, { snow: S.snowcap })}</div><div class="bst-ground"></div><div class="bst-par near">${silSVG(S.sil, 'near', seed + 17)}</div>`
    + `${boss ? '<div class="bst-aura"></div><div class="bst-bolt"></div>' : ''}<div class="bst-pt p-${S.pt}">${pts}</div>${fg}<div class="bst-vig"></div><div id="bTint"></div>`;
  B.stage = true; }
if (DEBUG) window.__bstage = buildStage;
// ---- 地域移動の シネマ（3〜4秒・タップで スキップ）と 章タイトルカード ----
function skippable(el, ms) { return new Promise(res => { let done = false; const t0 = performance.now();
  const end = () => { if (done) return; done = true; el.removeEventListener('pointerdown', tap); window.removeEventListener('keydown', kd, true); res(); };
  const tap = () => { if (performance.now() - t0 > 350) end(); };
  const kd = e => { if (['Enter', ' ', 'Escape', 'e', 'E', 'z', 'Z'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); tap(); } };
  el.addEventListener('pointerdown', tap); window.addEventListener('keydown', kd, true); setTimeout(end, ms); }); }
const SHIP = '<svg class="cn-ship" viewBox="0 0 200 130"><path d="M100 8 L100 84" stroke="#3a2a1a" stroke-width="4"/><path d="M104 12 Q150 40 104 78 Z" fill="#fff6e0"/><path d="M96 16 Q58 44 96 76 Z" fill="#f4ead0"/><path d="M104 4 L124 10 L104 14 Z" fill="#e8584a"/><path d="M18 84 L184 84 L160 112 L40 112 Z" fill="#6a3a22"/><path d="M26 90 L176 90" stroke="#f3c15a" stroke-width="3"/><circle cx="60" cy="98" r="3" fill="#f3c15a"/><circle cx="84" cy="98" r="3" fill="#f3c15a"/><circle cx="108" cy="98" r="3" fill="#f3c15a"/></svg>';
const WHALE = '<svg class="cn-whale" viewBox="0 0 300 120"><path d="M8 62 C28 22 120 12 188 40 C212 50 228 58 246 50 L282 26 L272 60 L292 90 L250 72 C226 84 196 98 146 98 C86 100 26 92 8 62 Z" fill="#1c2a5a"/><path d="M20 70 C60 92 130 96 200 80 C160 104 60 100 20 70 Z" fill="#8fb4ff" opacity=".55"/><path d="M110 88 L92 116 L132 94 Z" fill="#1c2a5a"/><circle cx="46" cy="56" r="4" fill="#fff6c9"/><g fill="#fff6c9"><circle cx="120" cy="40" r="2"/><circle cx="150" cy="46" r="1.6"/><circle cx="90" cy="36" r="1.4"/><circle cx="176" cy="54" r="2"/><circle cx="70" cy="44" r="1.2"/></g></svg>';
// 横に 無限に つながる 帯（波・雲海・岩礁）：幅200%の SVG を 左へ 流す
function cnStrip(cls, d, fill) { return `<div class="cn-strip ${cls}"><svg viewBox="0 0 2000 100" preserveAspectRatio="none"><path d="${d}" fill="${fill}"/></svg></div>`; }
const cnWave = (amp, n, base) => { let d = `M0 100 L0 ${base}`; for (let i = 0; i < n; i++) { const x0 = i * 2000 / n, w = 2000 / n; d += ` Q${x0 + w * .25} ${base - amp} ${x0 + w * .5} ${base} T${x0 + w} ${base}`; } return d + ' L2000 100 Z'; };
const cnBumps = (amp, n, base, seed) => { let d = `M0 100 L0 ${base}`, s = seed; const rn = () => (s = (s * 9301 + 49297) % 233280) / 233280; const pts = []; for (let i = 0; i < n; i++) pts.push(base - rn() * amp); pts.push(pts[0]); for (let i = 1; i <= n; i++) d += ` Q${((i - .5) * 2000 / n).toFixed(0)} ${(Math.min(pts[i - 1], pts[i % n]) - amp * .3).toFixed(0)} ${(i * 2000 / n).toFixed(0)} ${pts[i].toFixed(0)}`; return d + ' L2000 100 Z'; };
const FISH = '<svg viewBox="0 0 40 16"><path d="M2 8 Q14 0 28 8 Q14 16 2 8 Z M28 8 L38 2 L36 8 L38 14 Z" fill="#0a2a48"/></svg>';
function cineArt(kind) { let h = ''; const dots = (n, cls) => { let o = ''; for (let i = 0; i < n; i++) o += `<i class="${cls}" style="--x:${(R() * 100).toFixed(1)}%;--y:${(R() * 100).toFixed(1)}%;--d:${(1.6 + R() * 2.4).toFixed(2)}s;--dl:${(-R() * 3).toFixed(2)}s;--z:${(.4 + R()).toFixed(2)}"></i>`; return o; };
  if (kind === 'sail') h = `<div class="cn-sky"></div><div class="cn-sun"></div><div class="cn-cloud c1"></div><div class="cn-cloud c2"></div><div class="cn-cloud c3"></div>`
    + cnStrip('isles', cnBumps(40, 5, 92, 7), '#7b86a6') + `<div class="cn-sea"></div><div class="cn-glint">${dots(16, 'cn-gl')}</div>`
    + cnStrip('w1', cnWave(5, 14, 40), '#2f6aa8') + `<div class="cn-shipw">${SHIP}</div>` + cnStrip('w2', cnWave(9, 8, 44), '#1d4a88') + cnStrip('w3', cnWave(14, 5, 50), '#123468') + dots(5, 'cn-gull');
  else if (kind === 'sky' || kind === 'skydown') h = `<div class="cn-sky"></div><div class="cn-stars"></div><div class="cn-moon"></div>` + cnStrip('isles sky', cnBumps(60, 4, 96, 3), '#26336e')
    + `${dots(9, 'cn-puff')}<div class="cn-whalew">${WHALE}</div>${dots(14, 'cn-trail')}` + cnStrip('csea1', cnBumps(26, 9, 50, 5), '#aab6e8') + cnStrip('csea2', cnBumps(30, 6, 56, 9), '#dfe6ff');
  else h = `<div class="cn-sky"></div><div class="cn-shafts"><i></i><i></i><i></i><i></i><i></i></div>` + cnStrip('reef1', cnBumps(50, 7, 90, 4), '#0d3a60')
    + `<div class="cn-school">${Array.from({ length: 7 }, (_, k) => `<i style="--k:${k}">${FISH}</i>`).join('')}</div>${dots(26, 'cn-bub')}` + cnStrip('reef2', cnBumps(40, 5, 70, 11), '#06203a') + '<div class="cn-weed l"></div><div class="cn-weed r"></div>';
  return `<div class="cn-scene">${h}</div>`; }
async function cinematic(kind, title, sub) {
  releaseInputs(); const ph = phase; phase = 'cut';
  const el = document.createElement('div'); el.className = 'cine cn-' + kind;
  el.innerHTML = cineArt(kind) + `<div class="cn-card"><div class="bc-bar t"></div><div class="bc-bar b"></div><div class="cn-band"><small class="cn-sub">${esc(sub || '')}</small><div class="cn-name">${esc(title)}</div><i class="bc-shine"></i></div></div><p class="cn-skip">タップで スキップ</p>`;
  document.body.appendChild(el); void el.offsetWidth; el.classList.add('on');
  try { Music.jingle({ sail: 'voyage', sky: 'skyflight', skydown: 'skyflight', dive: 'dive', surface: 'light' }[kind] || 'chapter'); Music.sfx(kind === 'dive' || kind === 'surface' ? 'magic' : 'swoosh'); } catch (e) { console.error(e); }
  await skippable(el, 3800); el.classList.add('out'); await wait(420); el.remove(); phase = ph; }
async function titleCard(title, sub) {
  releaseInputs(); const ph = phase; phase = 'cut';
  try { Music.jingle('chapter', fieldSong()); } catch (e) { console.error(e); }
  const el = document.createElement('div'); el.className = 'tcard';
  el.innerHTML = `<div class="tc-rays"></div><div class="bc-bar t"></div><div class="bc-bar b"></div><div class="tc-band"><small class="tc-sub">${esc(title)}</small><div class="tc-name">${esc(sub || '')}</div><i class="bc-shine"></i></div><p class="cn-skip">タップで つぎへ</p>`;
  document.body.appendChild(el); await skippable(el, 3600); el.classList.add('out'); await wait(420); el.remove(); phase = ph; }

async function runBattle(specs, opts = {}) {
  B.active = true; releaseInputs(); Music.sfx('encounter'); const sp0 = bspd();
  $('battle').classList.remove('res-on', 'won', 'lose'); $('battle').style.setProperty('--bs', sp0);
  const enc = bAdd('b-enc' + (opts.boss ? ' boss' : ''), '<i></i>', document.body); enc.style.setProperty('--bs', sp0);
  setTimeout(() => Music.sfx('swoosh'), 180 / sp0); await wait((opts.boss ? 860 : 660) / sp0);
  const bsong = opts.song || (opts.boss ? 'boss' : 'battle'); if (!opts.keepMusic || Music.current !== bsong) Music.play(bsong, { restart: true, cut: true });
  const P = battleParty(); const F = specs.map(mkFoe); B.P = P; B.F = F; B.fxSkip = false; $('bfx').style.setProperty('--bs', sp0); $('bfx').innerHTML = '';
  const cnt = {}; F.forEach(f => cnt[f.name] = (cnt[f.name] || 0) + 1); const seen = {}; F.forEach(f => { if (cnt[f.name] > 1) { seen[f.name] = (seen[f.name] || 0) + 1; f.name += 'ABCD'[seen[f.name] - 1]; } });
  F.forEach(f => { if (f.sp) G.dex.seen[f.sp] = 1; });
  P.forEach(m => { m.defUp = 0; m.atkUp = 0; m.spdUp = 0; m.sleep = 0; m.guard = false; m.slow = 0; m.ail = null; });
  let friendBoost = 1;
  $('bAuto').textContent = G.auto ? 'おまかせ ON' : 'おまかせ OFF'; $('bSpd').textContent = `はやさ ×${G.speed || 1}`;
  if (!G.tips.battle1) tip('<b>バトルの コツ</b><span>敵の 下の「弱点」タイプの 技は 1.5倍。「おまかせ」で 自動、「はやさ」で 倍速に できる。</span>', 'battle1');
  $('bMsg').innerHTML = ''; buildStage(opts); B.d3 = false; try { B.d3 = !!(HOOK.b3dStart && HOOK.b3dStart(opts, P, F)); } catch (e) { console.error(e); } if (B.d3) B.stage = false; $('battle').hidden = false; $('battle').classList.toggle('isboss', !!opts.boss);
  const redraw = (ai = -1) => { drawParty(P, ai); drawAllies(P, ai); drawFoes(F); };
  redraw(); $('swipe').classList.remove('go');
  // 登場演出：うずまきが ひらき、敵が はずんで 着地 → なきごえ
  F.forEach((f, i) => { const el = $('foe' + i); if (el) { el.style.setProperty('--i', i); el.classList.add('enter'); }
    setTimeout(() => { Music.sfx('drop'); cryOf(f); }, (opts.boss ? 420 : 300 + i * 150) / sp0); });
  enc.classList.add('out'); setTimeout(() => enc.remove(), 700 / sp0);
  const appear = opts.boss ? `${F[0].name}が 立ちはだかった！` : F.length > 1 ? `${F[0].name.replace(/[A-D]$/, '')}たちが あらわれた！` : `${F[0].name}が あらわれた！`;
  if (opts.boss) { await bwait(380); $('battle').classList.remove('quake'); void $('battle').offsetWidth; $('battle').classList.add('quake');
    const bc = bAdd('bosscard', `<div class="bc-bar t"></div><div class="bc-bar b"></div><div class="bc-band"><small class="bc-sub">— ぬし —</small><div class="bc-name">${esc(F[0].name)}</div>
      <small class="bc-meta">${F[0].type ? typeTag(F[0].type) : ''}${F[0].lv ? ` Lv ${F[0].lv}` : ''}</small><i class="bc-shine"></i></div>`, document.body); bc.style.setProperty('--bs', sp0);
    await bwait(1500); bc.classList.add('out'); setTimeout(() => bc.remove(), 400 / sp0); }
  else { const bn = bAdd('b-banner', `<span>${esc(appear)}</span>`); await bwait(420); setTimeout(() => bn.remove(), 1000 / sp0); }
  const aliveF = () => F.filter(f => f.hp > 0), aliveP = () => P.filter(m => m.hp > 0);
  const nameOr = x => x.foe ? x.name : nameOf(x);
  if (F.some(f => f.shiny)) { screenFx('light'); Music.sfx('magic'); await bmsg('……！ 色ちがいの いきものだ！', 500); }
  await bmsg(appear);
  let result = null;
  // コマンド用メニュー：大きな「もどる」と いま だれの 何を えらんでいるかを 上に 表示
  const bmenu = (items, crumb, back = true, main = false) => { const pr = menu({ items, where: 'battle', cancel: back }); const M = MENUS[MENUS.length - 1];
    M.el.querySelectorAll('.m-x.solo').forEach(x => x.remove()); if (!main) M.el.classList.add('one');
    const nav = bAdd('bnav', `${back ? '<button type="button" class="bback" aria-label="もどる">◀ もどる</button>' : ''}<span class="bcrumb">${crumb}</span>`, $('bCmd'));
    const bb = nav.querySelector('.bback'); if (bb) bb.addEventListener('click', e => { e.stopPropagation(); if (!MENUS.includes(M)) return; Music.sfx('cancel'); closeMenu(M, -1); });
    return pr.then(v => { nav.remove(); return v; }); };
  const pickFoe = async (type, who = '') => { const A = aliveF(); if (A.length === 1) return A[0]; const i = await bmenu(A.map(f => ({ label: f.name + effMark(type, f), sub: `HP ${Math.ceil(f.hp / f.max * 100)}%` })), `${who} ▸ <b>どの 敵に？</b>`); return i === 'auto' ? 'auto' : i < 0 ? null : A[i]; };
  const pickAlly = async (who = '') => { const A = P.filter(m => m.hp > 0); const i = await bmenu(A.map(m => ({ label: nameOf(m), sub: `HP ${m.hp}/${m.st.hp}` })), `${who} ▸ <b>だれに？</b>`); return i === 'auto' ? 'auto' : i < 0 ? null : A[i]; };
  const battleItems = () => Object.keys(DATA.items).filter(k => (G.inv[k] || 0) > 0 && (DATA.items[k].heal || DATA.items[k].mp || DATA.items[k].healAll || DATA.items[k].battle || DATA.items[k].cure));
  const setAil = async (t, ail, ch) => { if (!ail || !t || t.hp <= 0 || t.ail || R() >= ch * (t.boss ? .45 : 1)) return; t.ail = ail; redraw(); ailFx(t, ail); await bmsg(`${nameOr(t)}は ${DATA.ailName[ail]}に なった！`, 300);
    if (!G.tips.ail) tip('<b>状態異常</b><span>☠どく・🔥やけど（毎ターン ダメージ）、⚡まひ（ときどき 動けない）。どくけし草や 回復の歌で なおる。</span>', 'ail'); };
  // 復活：たおれた 味方を 最大HPの s.revive 割で 起こす（状態異常も はらう）。HOOK.revive が あれば そちらを 優先
  const reviveDown = (L, s) => L.filter(t => t.hp <= 0).map(t => { t.hp = Math.max(1, Math.round(t.st.hp * (s.revive || .3))); t.ail = null; t.sleep = 0; return t; });
  const cureAll = T => { let any = false; for (const t of T) { if (t.ail || t.sleep > 0) { t.ail = null; t.sleep = 0; any = true; } } return any; };
  const combosFor = m => (DATA.combos || []).filter(c => (c.a === m.id || c.b === m.id || c.b === m.uid)).map(c => ({ c, partner: P.find(x => (x.id === (c.a === m.id ? c.b : c.a) || x.uid === (c.a === m.id ? c.b : c.a))) })).filter(o => o.partner && o.partner.hp > 0 && !(o.partner.sleep > 0) && m.mp >= o.c.mp && o.partner.mp >= o.c.mp);
  let turnN = 0;
  function aiPlan(m) {
    const A = aliveP(), Fs = aliveF(); const can = sid => m.mp >= costOf(m, sid);
    if (Fs.some(f => f.charging) && m.hp < m.st.hp * .7 && !m.skills.some(sid => DATA.skills[sid].heal && can(sid))) return { type: 'guard' };
    if (Fs.some(f => f.boss) && turnN % 3 === 2) { const cb = combosFor(m).find(o => o.c.power); if (cb) return { type: 'combo', c: cb.c, partner: cb.partner, t: Fs[0] }; }
    if (A.some(a => a.ail === 'poison' || a.ail === 'burn') && !A.some(a => a.hp < a.st.hp * .45)) { const cs = m.skills.find(sid => DATA.skills[sid].cure && can(sid)); if (cs) return { type: 'skill', s: cs, t: null }; }
    if (Fs.some(f => f.boss) && !A.some(a => a.hp < a.st.hp * .45)) { for (const [sid, key] of [['mamori', 'defUp'], ['hagemashi', 'atkUp'], ['oikaze', 'spdUp']]) if (m.skills.includes(sid) && can(sid) && !A.some(a => a[key] > 1)) return { type: 'skill', s: sid, t: null }; }
    const low = A.filter(a => a.hp < a.st.hp * .45); const heals = m.skills.filter(sid => DATA.skills[sid].heal && can(sid));
    if (heals.length && (low.length >= 2 || A.some(a => a.hp < a.st.hp * .3))) { const hp = heals.find(sid => DATA.skills[sid].tg === 'party') || heals[0]; return { type: 'skill', s: hp, t: low.sort((a, b) => a.hp / a.st.hp - b.hp / b.st.hp)[0] }; }
    const est = (pow, type, magic, f) => (m.st.atk * pow - f.def * (magic ? .25 : .5)) * DATA.typeMul(type, f.type);
    let best = null, bs = -1e9;
    for (const f of Fs) { const v = est(1, null, false, f); if (v > bs) { bs = v; best = { type: 'atk', t: f }; } }
    const base = bs;
    for (const sid of m.skills) { const sk = DATA.skills[sid]; if (!sk.power || !can(sid)) continue;
      if (sk.tg === 'enemies') { const v = Fs.reduce((a, f) => a + Math.max(1, est(sk.power, sk.type, sk.magic, f)), 0); if (v > bs && v > base * 1.3) { bs = v; best = { type: 'skill', s: sid, t: null }; } }
      else for (const f of Fs) { const v = est(sk.power, sk.type, sk.magic, f); if (v > bs && v > base * 1.3) { bs = v; best = { type: 'skill', s: sid, t: f }; } } }
    return best; }
  async function chooseFor(m, canBack) {
    const nm0 = esc(nameOf(m));
    while (true) {
      if (G.auto) return aiPlan(m);
      const sk = m.skills;
      const cbs = combosFor(m);
      const c = await bmenu([{ label: 'たたかう' }, { label: 'とくぎ', disabled: !sk.length }, { label: 'どうぐ', disabled: !battleItems().length }, { label: 'ぼうぎょ' }, { label: 'にげる', disabled: !!opts.noFlee }, ...(cbs.length ? [{ label: '✦れんけい' }] : [])], `<b>${nm0}</b>の こうどう`, canBack, true);
      if (c === 5) { const i = await bmenu(cbs.map(o => ({ label: o.c.name + (o.c.type && o.c.type !== 'normal' ? ` ${typeTag(o.c.type)}` : ''), sub: `MP${o.c.mp}×2`, hint: o.c.desc })), `${nm0} ▸ <b>れんけい</b>`); if (i === 'auto') return aiPlan(m); if (i < 0) continue;
        const o = cbs[i]; let t = null; if (o.c.tg === 'enemy') { t = await pickFoe(o.c.type, nm0); if (t === 'auto') return aiPlan(m); if (!t) continue; } return { type: 'combo', c: o.c, partner: o.partner, t }; }
      if (c === 'auto') return aiPlan(m);
      if (c === -1) { if (canBack) return { type: 'back' }; continue; }
      if (c === 0) { const t = await pickFoe(null, nm0); if (t === 'auto') return aiPlan(m); if (t) return { type: 'atk', t }; continue; }
      if (c === 1) { const i = await bmenu(sk.map(sid => { const d = DATA.skills[sid]; return { label: d.name + (d.type && d.type !== 'normal' ? ` ${typeTag(d.type)}` : ''), sub: `MP${costOf(m, sid)}`, hint: d.desc, disabled: m.mp < costOf(m, sid) }; }), `${nm0} ▸ <b>とくぎ</b>`);
        if (i === 'auto') return aiPlan(m); if (i < 0) continue; const d = DATA.skills[sk[i]]; let t = null;
        if (d.tg === 'enemy') { t = await pickFoe(d.type, nm0); if (t === 'auto') return aiPlan(m); if (!t) continue; } else if (d.tg === 'ally') { t = await pickAlly(nm0); if (t === 'auto') return aiPlan(m); if (!t) continue; }
        return { type: 'skill', s: sk[i], t }; }
      if (c === 2) { const its = battleItems(); const i = await bmenu(its.map(k => ({ label: DATA.items[k].name, sub: `×${G.inv[k]}`, hint: DATA.items[k].desc })), `${nm0} ▸ <b>どうぐ</b>`); if (i === 'auto') return aiPlan(m); if (i < 0) continue;
        const it = DATA.items[its[i]]; let t = null; if (it.heal || it.mp || it.cure) { t = await pickAlly(nm0); if (t === 'auto') return aiPlan(m); if (!t) continue; } return { type: 'item', it: its[i], t }; }
      if (c === 3) return { type: 'guard' };
      if (c === 4) return { type: 'flee' };
    }
  }
  async function hit(a, t, power = 1, o = {}) {
    const aAtk = (a.foe ? a.atk : a.st.atk) * (a.atkUp > 0 ? 1.4 : 1) * (a.ail === 'burn' ? .8 : 1); const tDef = t.foe ? t.def : t.st.def * (t.defUp > 0 ? 1.5 : 1);
    let dmg = o.magic ? (aAtk * power * .95 - tDef * .25) : (aAtk * power - tDef * .5);
    const tm = DATA.typeMul(o.type, t.type);
    dmg = Math.max(1, Math.round(dmg * tm * (.86 + R() * .28)));
    if (!o.magic && !o.noMiss && R() < 1 / 32) { Music.sfx('miss'); { const se = t.foe ? bElOf(t) : bSprOf(t); if (se) { se.classList.remove('dodge'); void se.offsetWidth; se.classList.add('dodge'); setTimeout(() => se.classList.remove('dodge'), 500 / bspd()); } } await bmsg(`${nameOr(t)}は ひらりと かわした！`); return; }
    const crit = !a.foe && !o.noCrit && R() < 1 / 18 + ((a.pas && a.pas.crit) || 0); if (crit) dmg = Math.round(dmg * 1.7 + 2);
    if (t.guard) dmg = Math.ceil(dmg / 2);
    if (crit) { Music.sfx('crit'); screenFx('white'); await bmsg('するどい いちげき！', 200); }
    if (o.wpn) Music.sfx('i_' + o.wpn); else if (o.msfx) Music.sfx('m_' + o.msfx); if (!o.wpn) Music.sfx(t.foe ? 'hit' : 'hurt');
    t.hp = Math.max(0, t.hp - dmg); let endured = false; if (!t.foe && t.kind === 'mon' && t.hp <= 0 && (t.bond || 0) >= 30 && !t.endured && R() < (t.bond || 0) / 400) { t.hp = 1; t.endured = endured = true; } redraw();
    const el = t.foe ? $('foe' + F.indexOf(t)) : $('pc' + P.indexOf(t)); const artEl = bArtOf(t) || (el && (el.querySelector('.foe-art') || el)); const spr = t.foe ? el : (bSprOf(t) || el);
    const ratio = Math.min(1, dmg / Math.max(1, t.foe ? t.max : t.st.hp));
    fxAt(artEl, o.fx || TYPE_FX[o.type] || 'slash', { stamp: t.foe && tm > 1 ? 'good' : t.foe && tm < 1 ? 'bad' : null, crit, el: o.type && o.type !== 'normal' ? o.type : o.el, ang: o.ang });
    // ヒットストップ：白く光った 瞬間で 60〜90ms 止める（ダメージ量・会心で のびる）→ はじけて 数字と キック
    for (const e of new Set([el, spr])) if (e) { e.classList.remove('hitw', 'hurt'); void e.offsetWidth; e.classList.add('hitw'); if (!t.foe) e.classList.add('hurt'); }
    await hitStop(crit ? 90 : Math.round(60 + 30 * Math.min(1, ratio * 2.5))); for (const e of new Set([el, spr])) if (e) e.classList.remove('hitw');
    hitFx(spr, dmg, false, (crit ? 'crit' : tm > 1 ? 'good' : tm < 1 ? 'bad' : '') + (t.foe ? '' : ' ouch'));
    kick(crit ? 1 + ratio * 1.5 : t.foe ? ratio * 1.4 + (tm > 1 ? .3 : 0) : .4 + ratio * 1.6);
    if (crit) buzz([35, 30, 55]); else if (!t.foe) buzz(ratio > .3 ? 70 : 30);
    if (tm > 1) await bmsg('こうかが ばつぐんに でた！', 200); else if (tm < 1) await bmsg('あまり きいていない ようだ……', 200);
    await bmsg(t.foe ? `${t.name}に ${dmg}の ダメージ！` : `${nameOf(t)}は ${dmg}の ダメージを うけた！`);
    if (t.sleep > 0 && t.hp > 0 && R() < .5) { t.sleep = 0; await bmsg(`${nameOr(t)}は めを さました！`); }
    if (endured) await bmsg(`${nameOf(t)}は ${G.name}の ために ふんばった！（なつき）`, 400);
    if (t.hp <= 0) { redraw(); await bmsg(t.foe ? `${t.name}を しずめた！` : `${nameOf(t)}は たおれた……`); }
  }
  async function useSkill(a, id, tgt, isFoe, costPaid = false) {
    const s = DATA.skills[id];
    if (!isFoe && !costPaid) { const cst = costOf(a, id); if (a.mp < cst) { await bmsg(`${nameOf(a)}は ${s.name}を つかおうとした。 しかし MPが たりない！`); return; } a.mp -= cst; redraw(); mpFx(a, cst); }
    const el = elemOf(s, a), big = s.tg === 'enemies' || s.tg === 'all' || s.tg === 'party' || !!a.boss;
    redraw(); actorOn(a, `${nameOr(a)}の ${s.name}！`); castStart(a, el, big); if (isFoe) cryOf(a, { vol: .8 }); if (big) screenFx(s.fx || (el === 'heal' ? 'heal' : 'light'));
    try {
    if (!isFoe && a.kind === 'human') { const ci = bAdd('cutin', `<div class="ci-face">${Art.portrait(a.id, 'determined')}</div><b>${esc(s.name)}</b>`); ci.style.setProperty('--bs', bspd()); setTimeout(() => ci.remove(), 950 / bspd()); }
    await bmsg(`${nameOr(a)}は ${s.name}を ${s.verb || 'はなった'}！`, 250);
    const foesOf = () => isFoe ? aliveP() : aliveF(), alliesOf = () => isFoe ? aliveF() : aliveP();
    if (s.power) { const T = (s.tg === 'enemies' || s.tg === 'all') ? foesOf() : [tgt && tgt.hp > 0 && tgt.foe !== !!isFoe ? tgt : foesOf()[Math.floor(R() * foesOf().length)]];
      T.forEach(t => t && markTgt(t)); await castFly(a, el, T.filter(Boolean));
      for (const t of T) { if (t && t.hp > 0) { await hit(a, t, s.power, { magic: s.magic, noCrit: true, noMiss: true, type: s.type, el, fx: s.type === 'wind' ? 'wind' : s.type === 'grass' ? 'leaf' : s.fx === 'song' ? 'song' : (TYPE_FX[s.type] || s.fx) }); if (s.ail) await setAil(t, s.ail[0], s.ail[1]); if (s.slow && t.hp > 0) { t.slow = 2; redraw(); ailFx(t, 'slow'); await bmsg(`${nameOr(t)}の うごきが にぶった！`, 250); } } } }
    if (s.heal) { const T = s.tg === 'party' ? alliesOf() : [tgt && tgt.hp > 0 ? tgt : a]; for (const t of T) { if (t.hp <= 0) continue; const mx = t.foe ? t.max : t.st.hp; const v = Math.min(Math.round((s.heal + (s.healPct || 0) * mx) * (1 + ((!isFoe && a.pas && a.pas.healUp) || 0))), mx - t.hp); t.hp += v; redraw();
      numAt(t, '+' + v, true); fxAt(bArtOf(t), 'heal'); if (!t.foe) { const ce = bElOf(t); if (ce) { ce.classList.remove('healg'); void ce.offsetWidth; ce.classList.add('healg'); } } await bmsg(`${nameOr(t)}の HPが ${v} かいふくした！`, 300); } }
    if (s.cure) { const T = alliesOf(); if (cureAll(T)) { redraw(); T.forEach(t => fxAt(bArtOf(t), 'heal')); Music.sfx('heal'); await bmsg('みんなの 状態異常が なおった！', 300); } }
    if (s.revive && !isFoe) { const up = (HOOK.revive || reviveDown)(P, s); if (up.length) { redraw(); up.forEach(t => fxAt(bArtOf(t), 'heal')); Music.sfx('heal'); await bmsg(`${up.map(nameOf).join('と ')}が 灯に みちびかれて 立ちあがった！`, 400); } } // v9：復活（balance.js）
    if (s.buff === 'def') { alliesOf().forEach(m => m.defUp = 3); redraw(); buffFx(alliesOf(), 'def'); await bmsg('みんなの まもりが 灯に つつまれた！'); }
    if (s.buff === 'atk') { alliesOf().forEach(m => m.atkUp = 3); redraw(); buffFx(alliesOf(), 'atk'); await bmsg('みんなの こうげきりょくが あがった！'); }
    if (s.buff === 'spd') { alliesOf().forEach(m => m.spdUp = 3); redraw(); buffFx(alliesOf(), 'spd'); await bmsg('おいかぜが ふいた！ みんなの すばやさが あがった！'); }
    if (s.sleep && s.tg === 'enemy') { const t = tgt && tgt.hp > 0 ? tgt : aliveF()[0]; if (!t) return; markTgt(t); if (!s.power) await castFly(a, el, [t]); if (!t.boss && R() < s.sleep) { t.sleep = 2 + Math.floor(R() * 2); redraw(); ailFx(t, 'sleep'); await bmsg(`${t.name}は ねむってしまった！`); } else { Music.sfx('miss'); await bmsg(`${t.name}には きかなかった！`); } }
    } finally { actorOff(a); }
  }
  async function doParty(a, p) {
    if (p.type === 'skip') return;
    { const pe = $('pc' + P.indexOf(a)); if (pe && p.type !== 'guard') { pe.classList.remove('lunge'); void pe.offsetWidth; pe.classList.add('lunge'); } }
    if (a.ail === 'para' && R() < .25) { ailFx(a, 'para'); await bmsg(`${nameOf(a)}は しびれて うごけない！`, 300); return; }
    if (p.type === 'combo') { const pt = p.partner; if (pt.hp <= 0 || a.mp < p.c.mp || pt.mp < p.c.mp) { await bmsg(`${nameOf(a)}は れんけいを しようとしたが うまく いかなかった！`); return; }
      a.mp -= p.c.mp; pt.mp -= p.c.mp; redraw(); mpFx(a, p.c.mp); mpFx(pt, p.c.mp); screenFx('white'); Music.sfx('crit'); setCls(pt, 'actor', true); ribbon(pt, `${nameOf(pt)}も あわせる！`, 'combo'); await bmsg(`${nameOf(a)}と ${nameOf(pt)}の れんけい！`, 300);
      const el1 = $('pc' + P.indexOf(a)), el2 = $('pc' + P.indexOf(pt)); [el1, el2].forEach(e => e && e.classList.add('act')); try { await useSkill(a, p.c.id, p.t, false, true); } finally { actorOff(pt); } return; }
    if (p.type === 'guard') { a.guard = true; redraw(); setCls(a, 'actor', true); ribbon(a, `${nameOf(a)}は ぼうぎょ！`, 'guard'); Music.sfx('guard'); await bmsg(`${nameOf(a)}は みを まもっている。`, 300); actorOff(a); return; }
    if (p.type === 'atk') { const t = p.t.hp > 0 ? p.t : aliveF()[0]; if (!t) return; actorOn(a, `${nameOf(a)}の こうげき！`);
      try { const bm = bmsg(`${nameOf(a)}の こうげき！`, 150); const o = await strikeFx(a, t); await bm; await hit(a, t, 1, o); } finally { actorOff(a); } return; }
    if (p.type === 'item') { const it = DATA.items[p.it]; G.inv[p.it]--; const t = p.t; actorOn(a, `${nameOf(a)}の ${it.name}！`); Music.sfx('item'); try { await bmsg(`${nameOf(a)}は ${it.name}を つかった！`, 200); } finally { actorOff(a); }
      if (it.battle === 'friend') { friendBoost = 2.2; screenFx('heal'); await bmsg('あまい かおりが ただよった……（なかまに なりやすく なった）'); return; }
      if (it.healAll) { aliveP().forEach(m => { m.hp = m.st.hp; m.mp = m.st.mp; fxAt(bArtOf(m), 'heal'); }); Music.sfx('heal'); tint('heal', 900); redraw(); await bmsg('みんなの HPと MPが ぜんかいふくした！'); return; }
      if (it.cure) { if (cureAll([t])) { Music.sfx('heal'); fxAt(bArtOf(t), 'heal'); redraw(); await bmsg(`${nameOf(t)}の 状態異常が なおった！`); } else await bmsg('しかし なにも おこらなかった。'); return; }
      if (it.stam) { G.stam = G.stamMax; await bmsg('がんばりが 満タンに なった！'); return; }
      if (t.hp <= 0) { await bmsg('しかし なにも おこらなかった。'); return; }
      if (it.heal) { const v = Math.min(it.heal, t.st.hp - t.hp); t.hp += v; Music.sfx('heal'); redraw(); numAt(t, '+' + v, true); fxAt(bArtOf(t), 'heal'); await bmsg(`${nameOf(t)}の HPが ${v} かいふくした！`); }
      if (it.mp) { const v = Math.min(it.mp, t.st.mp - t.mp); t.mp += v; Music.sfx('mp'); redraw(); numAt(t, '+' + v, true, 'mpn'); { const ce = bElOf(t); if (ce) { ce.classList.remove('mpglow'); void ce.offsetWidth; ce.classList.add('mpglow'); } } await bmsg(`${nameOf(t)}の MPが ${v} かいふくした！`); } return; }
    if (p.type === 'skill') await useSkill(a, p.s, p.t, false);
  }
  // MPを うばう：drainOne なら 1人だけ（立て直しの 余地を のこす）
  async function drainMp(s) { const A = aliveP(); const L = s.drainOne ? [A[Math.floor(R() * A.length)]].filter(Boolean) : A; L.forEach(m => { m.mp = Math.max(0, m.mp - s.drain); mpFx(m, s.drain); }); redraw(); await bmsg(s.drainOne && L[0] ? `${nameOf(L[0])}の MPが すいとられた！` : 'みんなの MPが すいとられた！'); }
  async function doFoe(f) {
    const T1 = () => { const A = aliveP(); return A[Math.floor(R() * A.length)]; };
    if (f.ail === 'para' && R() < (f.boss ? .12 : .25)) { ailFx(f, 'para'); await bmsg(`${f.name}は しびれて うごけない！`, 300); return; }
    if (f.charging) { f.charging = false; f.allLast = true; const s = DATA.skills[f.d.charge]; const el = elemOf(s, f); redraw(); screenFx('dark'); Music.sfx('crit'); cryOf(f, { vol: 1.1 }); $('battle').classList.remove('quake'); void $('battle').offsetWidth; $('battle').classList.add('quake');
      actorOn(f, `${f.name}の ${s.name}！！`); castStart(f, el, true); try { await bmsg(`${f.name}の ${s.name}！！`, 400); aliveP().forEach(t => markTgt(t)); await castFly(f, el, aliveP()); for (const t of aliveP()) await hit(f, t, s.power, { noMiss: true, type: s.type, el }); } finally { actorOff(f); }
      if (s.drain) await drainMp(s); if (s.ail) for (const t of aliveP()) await setAil(t, s.ail[0], s.ail[1]); return; }
    if (f.boss) { const acts = f.d.acts || [['atk', 1]]; let r = R(), pick = acts[0][0]; for (const [k, pr] of acts) { if ((r -= pr) <= 0) { pick = k; break; } }
      const fe = $('foe' + F.indexOf(f)); if (fe && !(pick === 'atk' || (pick === 'charge' && f.chargedLast))) { fe.classList.remove('lunge'); void fe.offsetWidth; fe.classList.add('lunge'); }
      if (pick === 'charge' && f.d.charge && !f.chargedLast) { f.charging = true; f.chargedLast = true; redraw(); Music.sfx('charge'); cryOf(f, { vol: .9 }); castStart(f, elemOf(DATA.skills[f.d.charge] || {}, f), true); ribbon(f, `${f.name}は ちからを ためている！`, 'warn'); await bmsg(`${f.name}は ちからを ためている……！`, 500);
        if (!G.tips.charge) tip('<b>⚠ ため攻撃が くる！</b><span>次の ターンに 全体へ 大ダメージ。「ぼうぎょ」で 半分に できる。回復も 先に。</span>', 'charge'); return; }
      f.chargedLast = false; if (pick === 'charge') pick = 'atk';
      { const S0 = DATA.skills[pick]; const isAll = !!(S0 && S0.power && S0.tg !== 'one'); if (isAll && f.allLast) pick = 'atk'; f.allLast = isAll && pick !== 'atk'; } // 全体攻撃は 2回 つづけない
      if (pick === 'atk') { const t = T1(); actorOn(f, `${f.name}の こうげき！`); try { const bm = bmsg(`${f.name}の こうげき！`, 150); const o = await strikeFx(f, t); await bm; await hit(f, t, 1, { type: f.type, ...o }); } finally { actorOff(f); } return; }
      const s = DATA.skills[pick]; const el = elemOf(s, f); cryOf(f, { vol: .9 }); actorOn(f, `${f.name}の ${s.name}！`); castStart(f, el, s.tg !== 'one'); screenFx('dark'); Music.sfx('magic'); await bmsg(`${f.name}の ${s.name}！`, 250);
      try {
      if (s.tg === 'one' && s.power) { const t = T1(); markTgt(t); await castFly(f, el, [t]); await hit(f, t, s.power, { noMiss: true, type: s.type, el }); if (s.slow && t.hp > 0) { t.slow = 2; redraw(); ailFx(t, 'slow'); await bmsg(`${nameOf(t)}の うごきが にぶった！`); } }
      else if (s.power) { aliveP().forEach(t => markTgt(t)); await castFly(f, el, aliveP()); for (const t of aliveP()) await hit(f, t, s.power, { noMiss: true, type: s.type, el }); }
      else if (el === 'debuff' || el === 'song' || el === 'dark') await castFly(f, el, aliveP());
      } finally { actorOff(f); }
      if (s.drain) await drainMp(s);
      if (s.sleep) { let any = false; for (const m of aliveP()) if (R() < s.sleep) { m.sleep = 2; any = true; redraw(); ailFx(m, 'sleep'); await bmsg(`${nameOf(m)}は ねむってしまった！`, 300); } if (!any) await bmsg('しかし みんな もちこたえた！'); redraw(); }
      if (s.ail) { for (const t of (s.tg === 'all' ? aliveP() : [aliveP()[Math.floor(R() * aliveP().length)]])) await setAil(t, s.ail[0], s.ail[1]); }
      return; }
    if (f.skills && f.skills.length && R() < .35) { const id = f.skills[Math.floor(R() * f.skills.length)]; const s = DATA.skills[id];
      if (s.heal) { if (f.hp < f.max * .6) return useSkill(f, id, f, true); }
      else return useSkill(f, id, T1(), true); }
    { const t = T1(); actorOn(f, `${f.name}の こうげき！`); try { const bm = bmsg(`${f.name}の こうげき！`, 150); const o = await strikeFx(f, t); await bm; await hit(f, t, 1, o); } finally { actorOff(f); } }
  }
  while (!result) { turnN++;
    P.forEach(m => m.guard = false);
    const plan = new Map(); let flee = false; const hist = [];
    for (let i = 0; i < P.length; i++) { const m = P[i]; if (m.hp <= 0 || m.sleep > 0) continue; if (plan.get(m) && plan.get(m).type === 'skip') continue;
      redraw(i); P.forEach((x, k) => { if (plan.has(x) && k !== i) { const e = $('pc' + k); if (e) e.classList.add('ready'); } });
      const p = await chooseFor(m, hist.length > 0);
      if (p.type === 'back') { const j = hist.pop(); if (j == null) { i--; continue; } // ひとつ前の 仲間の 入力を 取り消して やりなおす
        const pp = plan.get(P[j]); plan.delete(P[j]); if (pp && pp.type === 'combo') { if (pp.prevPartner) plan.set(pp.partner, pp.prevPartner); else plan.delete(pp.partner); }
        i = j - 1; continue; }
      if (p.type === 'flee') { flee = true; break; } plan.set(m, p); hist.push(i); if (p.type === 'combo') { p.prevPartner = plan.get(p.partner); plan.set(p.partner, { type: 'skip' }); } }
    redraw();
    if (flee) { await bmsg(`${G.name}たちは にげだした！`, 200);
      if (opts.noFlee) await bmsg('しかし 逃げられない！');
      else if (R() < .72) { Music.sfx('run'); await bmsg('うまく にげきった！'); result = 'flee'; break; } else await bmsg('しかし にげきれなかった！');
      plan.clear(); }
    const order = [];
    for (const [m, p] of plan) order.push({ a: m, p, s: m.st.spd * (m.slow > 0 ? .5 : 1) * (m.spdUp > 0 ? 1.5 : 1) * (.8 + R() * .4) + (m.pas && m.pas.first ? 1e4 : 0) });
    for (const m of P) if (m.hp > 0 && m.sleep > 0) order.push({ a: m, p: { type: 'sleep' }, s: 0 });
    for (const f of aliveF()) { const n = f.d.twice ? 2 : 1; for (let k = 0; k < n; k++) order.push({ a: f, s: f.spd * (f.slow > 0 ? .5 : 1) * (.8 + R() * .4) - k * 5 }); }
    order.sort((x, y) => y.s - x.s);
    for (const o of order) {
      if (o.a.hp <= 0) continue;
      if (o.a.sleep > 0) { o.a.sleep--; await bmsg(o.a.sleep <= 0 ? `${nameOr(o.a)}は めを さました！` : `${nameOr(o.a)}は ねむっている……`, 300); continue; }
      if (o.p && o.p.type === 'sleep') continue;
      if (o.a.foe) await doFoe(o.a); else await doParty(o.a, o.p);
      if (!aliveF().length) { result = 'win'; break; } if (!aliveP().length) { result = 'lose'; break; }
    }
    if (!result) for (const t of [...aliveP(), ...aliveF()]) { if (t.ail !== 'poison' && t.ail !== 'burn') continue; const mx = t.foe ? t.max : t.st.hp; const v = Math.max(1, Math.round(mx * (t.ail === 'poison' ? (t.boss ? .03 : .08) : (t.boss ? .025 : .06))));
      t.hp = Math.max(t.foe ? 0 : 1, t.hp - v); redraw(); numAt(t, v, false, 'dot ' + t.ail); ailFx(t, t.ail); await bmsg(`${nameOr(t)}は ${t.ail === 'poison' ? 'どく' : 'やけど'}で ${v}の ダメージ！`, 200);
      if (t.foe && t.hp <= 0) await bmsg(`${t.name}を しずめた！`); if (!aliveF().length) { result = 'win'; break; } }
    if (!result) { let healed = false; const aura = P.filter(m => m.hp > 0).reduce((a, m) => a + ((m.pas && m.pas.aura) || 0), 0);
      for (const m of P) if (m.hp > 0) { const pct = ((m.pas && m.pas.regen) || 0) + aura; if (pct > 0 && m.hp < m.st.hp) { const v = Math.min(m.st.hp - m.hp, Math.max(1, Math.round(m.st.hp * pct))); m.hp += v; numAt(m, '+' + v, true); healed = true; } }
      if (healed) redraw(); }
    [...P, ...F].forEach(m => { if (m.defUp > 0) m.defUp--; if (m.atkUp > 0) m.atkUp--; if (m.spdUp > 0) m.spdUp--; if (m.slow > 0) m.slow--; });
  }
  const evolving = [];
  if (result === 'win') {
    Music.jingle('victory', opts.boss ? null : fieldSong());
    const exp = F.reduce((s, f) => s + f.exp, 0), gold = F.reduce((s, f) => s + (f.gold || 0), 0);
    F.forEach(f => { if (f.sp) quest(f.sp); }); if (opts.boss) G.bosses = (G.bosses || 0) + 1;
    // しょうり！ スタンプ＋紙ふぶき
    $('battle').classList.add('won'); Music.sfx('stamp'); screenFx('white');
    const vic = bAdd('b-win', `<div class="b-win-t">しょうり！</div><div class="b-win-cf">${confetti(38, { d: 190 })}${confetti(10, { cls: 'sp', ch: '✦', d: 150, arc: Math.PI * 2 })}</div>`);
    setTimeout(() => Music.sfx('sparkle'), 260 / bspd());
    await bmsg(opts.boss ? `${F[0].name}を うちまかした！` : 'かげものたちを しずめた！', 400); await bwait(350);
    if (gold) G.gold += gold;
    const rows = [];
    for (const m of P) { const row = { m, lv0: m.lv, e0: m.exp / need(m.lv), st0: { ...m.st }, skills: [], sp: 0, alive: m.hp > 0 };
      if (m.kind === 'mon' && m.hp > 0) { m.bond = Math.min(100, (m.bond || 0) + 1); m.endured = false; }
      if (m.hp > 0 && exp) { m.exp += exp; while (m.exp >= need(m.lv)) { m.exp -= need(m.lv); const old = m.skills.slice(), ohp = m.st.hp, omp = m.st.mp; m.lv++; calc(m); m.hp += m.st.hp - ohp; m.mp += m.st.mp - omp;
        if (m.kind === 'human') { const g = 1 + (m.lv % 5 === 0 ? 1 : 0); G.sp[m.id] = (G.sp[m.id] || 0) + g; row.sp += g; }
        for (const sk of m.skills) if (!old.includes(sk)) row.skills.push(DATA.skills[sk].name);
        if (m.kind === 'mon' && SPC[m.id].evo && m.lv >= SPC[m.id].evo.lv && !evolving.includes(m)) evolving.push(m); } }
      rows.push(row); }
    const statList = r => ['hp', 'mp', 'atk', 'def', 'spd'].map(k => { const d = r.m.st[k] - r.st0[k]; return d > 0 ? `<span>${{ hp: 'HP', mp: 'MP', atk: 'こうげき', def: 'ぼうぎょ', spd: 'すばやさ' }[k]}<b>+${d}</b></span>` : ''; }).join('');
    $('battle').classList.add('res-on'); vic.classList.add('out'); setTimeout(() => vic.remove(), 500);
    // リザルト：数字が カウントアップ、けいけんちバーが のびる
    const resEl = bAdd('win b-res', `<div class="b-res-h"><b>しょうり！</b><span>けいけんち <em class="cnt" data-to="${exp}">0</em></span><span>ゴールド <em class="cnt" data-to="${gold}">0</em>G</span></div>
      <div class="b-res-list">${rows.map(r => `<div class="b-rr${r.alive ? '' : ' down'}${r.m.lv > r.lv0 ? ' lvup' : ''}"><div class="res-face">${r.m.kind === 'human' ? Art.portrait(r.m.id, !r.alive ? 'closed' : r.m.lv > r.lv0 ? 'joy' : 'smile') : faceOf(r.m)}</div>
        <div class="b-rr-n">${esc(nameOf(r.m))}<small>Lv <span class="lvn">${r.lv0}</span></small></div><div class="xp big"><i class="xpa" style="width:${Math.round(r.e0 * 100)}%"></i></div>
        <div class="b-rr-s">${r.alive ? r.m.lv > r.lv0 ? '<b class="lvb">LEVEL UP!</b>' : `あと ${need(r.m.lv) - r.m.exp}` : 'たおれていた'}</div></div>`).join('')}</div><p class="res-tap">タップ／Enter で つぎへ</p>`);
    { const cnts = [...resEl.querySelectorAll('.cnt')], rrs = [...resEl.querySelectorAll('.b-rr')], T = 900 / bspd(), t0 = performance.now(); let n = 0; bSkip = false; await wait(30);
      const bar = (r, k) => { const el = rrs[rows.indexOf(r)], xa = el.querySelector('.xpa'); const L = r.m.lv - r.lv0, e1 = r.m.exp / need(r.m.lv); const tot = L + e1 - r.e0; let v = r.e0 + tot * k, lv = r.lv0 + Math.floor(v); if (lv > r.m.lv) lv = r.m.lv;
        xa.style.width = ((lv === r.m.lv ? Math.min(v - L, 1) : v - Math.floor(v)) * 100).toFixed(1) + '%'; const ln = el.querySelector('.lvn'); if (+ln.textContent !== lv) { ln.textContent = lv; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); Music.sfx('sparkle'); } };
      while (true) { const k = Math.min(1, (performance.now() - t0) / T), e = 1 - Math.pow(1 - k, 3); cnts.forEach(c => c.textContent = Math.round(+c.dataset.to * e)); rows.forEach(r => { if (r.alive) bar(r, e); });
        if (k >= 1 || bSkip) break; if (n++ % 3 === 0) Music.sfx('tally'); await wait(30); }
      cnts.forEach(c => c.textContent = c.dataset.to); rows.forEach(r => { if (r.alive) bar(r, 1); }); resEl.classList.add('done'); }
    await btap(1300); resEl.remove();
    // レベルアップ カード（なかま ひとりずつ）
    for (const r of rows.filter(r => r.m.lv > r.lv0)) {
      Music.jingle('levelup', opts.boss ? null : fieldSong());
      const card = bAdd('b-lv', `<div class="b-lv-rays"></div><div class="b-lv-cf">${confetti(24, { d: 170, arc: Math.PI * 2, cls: 'sp', ch: '✦' })}</div>
        <div class="b-lv-face">${r.m.kind === 'human' ? Art.portrait(r.m.id, 'joy') : faceOf(r.m)}</div>
        <div class="b-lv-body"><div class="b-lv-t">レベルアップ！</div><div class="b-lv-n">${esc(nameOf(r.m))}　Lv${r.lv0} <i>→</i> <b>Lv${r.m.lv}</b></div>
          <div class="b-lv-st">${statList(r)}</div>${r.skills.map(s => `<div class="b-lv-new">あたらしく <b>${esc(s)}</b>を おぼえた！</div>`).join('')}
          ${r.sp ? `<div class="b-lv-sp">スキルポイント <b>+${r.sp}</b>（メニューの「スキル」で つかえる）</div>` : ''}</div><p class="res-tap">タップで つぎへ</p>`);
      await bwait(260); await btap(1500 + r.skills.length * 500); card.classList.add('out'); await wait(160 / bspd()); card.remove(); }
    $('battle').classList.remove('res-on');
    if (rows.some(r => r.sp)) tip('<b>スキルポイントが たまった！</b><span>メニューの「スキル」で 技や 能力を 覚えよう。</span>', 'sp1');
    for (const f of F) if (f.sp) { const b = SPC[f.sp].type; const pool = b === 'earth' ? ['ishi', 'ishi', 'mi'] : b === 'grass' ? ['mi', 'kinoko', 'ha'] : b === 'water' ? ['mi', 'shizuku'] : b === 'light' || b === 'dark' ? ['shizuku', 'hoshikake'] : b === 'wind' ? ['kumowata', 'kumowata', 'mi'] : ['mi'];
      if (R() < .35) { const it = pool[Math.floor(R() * pool.length)]; gain(it); await bmsg(`${f.name}は ${DATA.items[it].name}を おとしていった。`, 300); } }
    for (const f of F.filter(f => f.sp)) {
      const S = SPC[f.sp]; const rate = S.legend ? 1 : Math.min(.9, (S.rare ? .16 : .3) * (inParty('mio') ? 1.3 : 1) * friendBoost * (f.shiny ? 1.5 : 1));
      if (R() < rate) { $('bFoes').innerHTML = `<div class="foe befriend"><div class="foe-art">${Art.species(f.sp, { shiny: f.shiny })}</div><div class="foe-shadow"></div></div>`; screenFx('light'); Music.sfx('magic');
        await bmsg(`かげが はれて、${S.name}の すがたに もどった。`, 400); await bmsg(`${S.name}は しばらく ${G.name}を 見つめていたが……`, 500);
        const m = mkMon(f.sp, Math.max(1, f.lv - 1), f.shiny); G.mons.push(m); const isNew = !G.dex.got[f.sp]; G.dex.got[f.sp] = 1; fixTeam();
        { const fe = $('bFoes').querySelector('.foe'); if (fe) { fe.classList.add('love'); bAdd('b-hearts', confetti(16, { cls: 'ht', ch: '♥', d: 150, arc: Math.PI * 2 }), fe); } }
        Music.cry(f.sp, { vol: 1.1 }); setTimeout(() => Music.sfx('heart'), 260 / bspd()); setTimeout(() => Music.sfx('friend'), 700 / bspd()); await bmsg(`${S.name}${f.shiny ? '★' : ''}が なかまに くわわった！${isNew ? '（図鑑に 登録された！）' : ''}`, 900);
        if (!G.team.includes(m.uid)) await bmsg(`（${S.name}は 牧場で まっている。 メニューの「なかま」で 入れかえ できる）`, 700);
        break; } }
  } else if (result === 'lose') { $('battle').classList.add('lose'); Music.sfx('lose'); const lb = bAdd('b-banner lose', '<span>ちからつきた……</span>');
    await bmsg(`${G.name}たちは ちからつきた……`, 600); await bwait(900); lb.remove(); }
  P.forEach(m => { if (m.hp <= 0 && result !== 'lose') m.hp = 1; m.sleep = 0; m.defUp = 0; m.slow = 0; m.ail = null; });
  if (evolving.length && B.d3) $('battle').classList.remove('b3d'); // 進化の 場面は 2Dで みせる
  for (const m of evolving) { const from = SPC[m.id], to = SPC[from.evo.to];
    $('bFoes').innerHTML = `<div class="foe evo"><div class="foe-art">${Art.species(m.id, { shiny: m.shiny })}</div></div>`; await bmsg(`${from.name}の からだが 光に つつまれていく……！`, 700);
    screenFx('white'); Music.jingle('light', opts.boss ? null : fieldSong()); m.id = from.evo.to; const r = m.hp / m.st.hp; calc(m); m.hp = Math.max(1, Math.round(m.st.hp * r)); G.dex.seen[m.id] = 1; G.dex.got[m.id] = 1;
    $('bFoes').innerHTML = `<div class="foe evo"><div class="foe-art">${Art.species(m.id, { shiny: m.shiny })}</div></div>`; await bmsg(`${from.name}は ${to.name}に すがたを かえた！`, 1200); }
  $('battle').querySelectorAll('.b-win,.b-banner,.b-res,.b-lv').forEach(e => e.remove()); $('battle').classList.remove('res-on', 'won', 'lose'); camReset(); $('bfx').innerHTML = ''; { const tn = $('bTint'); if (tn) tn.className = ''; }
  if (B.d3 && HOOK.b3dEnd) HOOK.b3dEnd(); B.d3 = false; $('battle').hidden = true; B.active = false; B.stage = false;
  for (const f of HOOK.battleEnd) try { await f(result, specs, opts, P); } catch (e) { console.error(e); }
  if (result === 'flee') Music.play(fieldSong());
  hud(); return result;
}

// ================= pause menu =================
function rankPts() { return G.bosses * 20 + G.order * 15 + G.bountyDone * 6 + Object.keys(G.dex.got).length * 5 + Object.keys(G.seedGot).length * 2 + Object.keys(G.chests).length * 3 + (G.flags.cleared ? 40 : 0) + (G.flags.c2done ? 60 : 0) + (G.flags.c3done ? 80 : 0) + (G.wind || []).filter(Boolean).length * 15; }
function rankOf(p) { let r = DATA.ranks[0], nx = null; for (const x of DATA.ranks) { if (p >= x.pts) r = x; else if (!nx) nx = x; } return { r, nx }; }
function checkRank() { const p = rankPts(); for (const x of DATA.ranks) if (p >= x.pts && x.reward && !G.rankClaimed[x.r]) { G.rankClaimed[x.r] = 1; const w = x.reward; const got = [];
  if (w.gold) { G.gold += w.gold; got.push(`${w.gold}G`); } if (w.give) for (const [k, v] of Object.entries(w.give)) { gain(k, v); got.push(`${DATA.items[k].name}×${v}`); } if (w.blocks) for (const [k, v] of Object.entries(w.blocks)) { G.blk[k] = (G.blk[k] || 0) + v; got.push(`${DATA.blocks[k]}ブロック×${v}`); }
  Music.sfx('friend'); tip(`<b>冒険者ランク ${x.r} に あがった！</b><span>ごほうび：${got.join('・')}</span>`); } }
const expBar = m => `<div class="xp"><i style="width:${Math.min(100, m.exp / need(m.lv) * 100)}%"></i></div>`;
// メインメニュー：9つの タイル（3列×3段）。モジュールの HOOK.menu は「ストーリー」「システム」「そのほか」に まとめる
const MENU_IC = { 'きろく帳': '📔', 'しょくぎょう': '🎓', 'せってい': '⚙️' };
const tile = (ic, label, sub, o = {}) => ({ label: `<i class="ti" aria-hidden="true">${ic}</i><b>${label}</b>`, sub: sub || '', ...o });
const howtoPanel = () => panel(`<h3>あそびかた</h3><ul class="howto"><li><b>目標</b>：左上の「▶」が いま やること。上の 矢印が 方角。メニューの「ストーリー」と「地図」で くわしく 見られる。</li>
      <li><b>成長</b>：レベルが 上がると スキルポイント（SP）。メニューの「スキル」で 技や 能力を 覚える。</li>
      <li><b>移動</b>：画面左を ドラッグ（PCは WASD）。大きく たおすと 走る。崖や 壁は がんばりゲージで よじ登れる。</li><li><b>滑空</b>：風布を 手に入れたら、空中で もう一度 ジャンプ。</li>
      <li><b>しらべる</b>：E／しらべる ボタン。木（薪）・岩（石）・しげみ（木の実）・キノコ・砂・宝箱・石像・たき火。</li><li><b>バトル</b>：タイプ相性 ◎は 1.5倍。「おまかせ」「倍速」ボタンで テンポよく。</li>
      <li><b>つくる</b>：クラフトで ブロックを 作り、つくる（B）→ 置く（F）・こわす（R）・切りかえ（Q）。</li><li><b>ひかりの種</b>：高台に かくれている。石像に 4こ ささげると 強くなる。</li>
      <li><b>空の島</b>：光る 風の柱（上昇気流）で ジャンプ→滑空すると 舞いあがる。雲海に 落ちると 近くの 島へ もどされる（HPが 少し へる）。</li><li><b>お店</b>：タブで ぶき／ぼうぐ／うる を切りかえ。▲▼で 今の そうびとの 差が わかる。武器は 下取り あり。</li></ul>`, 'wide');
async function subGrid(title, list) { while (true) {
  const n = list.length, cols = n <= 2 || n === 4 ? 2 : 3;
  const c = await menu({ title, items: list.map(t => tile(t.ic, t.label, t.sub, { disabled: t.disabled })), where: 'grid', cls: cols === 2 ? 'c2' : '', cols });
  if (c < 0) return; const r = await list[c].fn(); if (r === 'close' || r === 'warped') return r; } }
let menuSel = 0;
async function openMenu() { await run(async () => {
  while (true) {
    const spTotal = G.party.reduce((a, m) => a + (G.sp[m.id] || 0), 0); const rk = rankOf(rankPts()).r.r;
    const extra = HOOK.menu.map(f => { try { return f(); } catch (e) { return null; } }).filter(Boolean);
    const take = re => { const i = extra.findIndex(x => re.test(String(x.label))); return i < 0 ? null : extra.splice(i, 1)[0]; };
    const story = take(/ストーリー|クエスト/), opt = take(/せってい|設定/);
    const others = [{ ic: '🔨', label: 'クラフト', sub: 'ブロックを つくる', fn: craftMenu }, ...extra.map(x => ({ ic: MENU_IC[x.label] || '✦', label: x.label, sub: x.sub, fn: x.fn, disabled: x.disabled })), { ic: '👥', label: 'じんぶつ', sub: 'であった 人たち', fn: charBook }];
    const sys = [{ ic: '💾', label: 'きろくする', sub: 'ぼうけんを 保存', fn: async () => { const ok = save(); await panel(`<h3>きろく</h3><p>${ok ? 'ぼうけんの きろくを のこした。' : 'このブラウザでは 保存が できないようだ。'}</p>`); } },
      ...(opt ? [{ ic: '⚙️', label: opt.label, sub: opt.sub, fn: opt.fn }] : []), { ic: '❓', label: 'あそびかた', sub: '操作と しくみ', fn: howtoPanel }];
    const nItems = Object.keys(G.inv).filter(k => G.inv[k] > 0 && DATA.items[k]).length;
    const T = [
      tile('🛡️', 'つよさ', `ランク ${rk}`),
      tile('✨', 'スキル', spTotal ? `SP ${spTotal} つかえる` : 'わざ・のうりょく', { cls: spTotal ? 'badge' : '' }),
      tile('👜', 'どうぐ', `${nItems}しゅるい`),
      tile('🐾', 'なかま', `たいれつ・牧場 ${G.mons.length}ひき`),
      tile('📖', 'いきもの図鑑', `${Object.keys(G.dex.got).length} / ${DEX_N}`),
      tile('📜', 'ストーリー', 'クエスト・あらすじ'),
      tile('🗺️', '地図', G.warp || G.region > 0 ? '現在地・ワープ' : '現在地・目的地'),
      tile('🧰', 'そのほか', others.map(o => o.label).join('・')),
      tile('⚙️', 'システム', sys.map(o => o.label).join('・')) ];
    const c = await menu({ title: `メニュー<small>${G.gold}G　ランク${rk}${G.title ? `　${esc(G.title)}` : ''}</small>`, items: T, where: 'grid', cols: 3, sel: menuSel });
    if (c < 0) return; menuSel = c; let r;
    if (c === 0) await statusPanel();
    if (c === 1) await skillMenu();
    if (c === 2) r = await itemMenu();
    if (c === 3) await partyMenu();
    if (c === 4) await dexMenu();
    if (c === 5) r = story ? await story.fn() : await questLog();
    if (c === 6) r = await mapPanel();
    if (c === 7) r = await subGrid('そのほか', others);
    if (c === 8) r = await subGrid('システム', sys);
    if (r === 'warped' || r === 'close') return;
  } }); }
async function statusPanel() {
  const rk = rankOf(rankPts()); const cell = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  await panel(`<h3>つよさ　<small>冒険者ランク ${rk.r.r}${rk.nx ? `（次の ${rk.nx.r} まで ${rk.nx.pts - rankPts()}pt）` : ''}${G.title ? `　称号：${esc(G.title)}` : ''}</small></h3><div class="st-grid">${battleParty().map(m => { const hu = m.kind === 'human', eq = hu && G.eq[m.id], W = eq && DATA.gear[m.id][eq.w], A = eq && DATA.armor[eq.a];
    return `<div class="st-card"><div class="st-face">${faceOf(m)}</div><div class="st-main"><div class="st-head"><b>${esc(nameOf(m))}</b><small>Lv${m.lv}</small>${typeTag(m.type)}</div>${expBar(m)}<div class="st-next">つぎのLvまで ${need(m.lv) - m.exp} EXP${hu ? `<span>SP ${G.sp[m.id] || 0}</span>` : ''}</div></div>
    <dl class="st-stats">${cell('HP', `${m.hp}/${m.st.hp}`)}${cell('MP', `${m.mp}/${m.st.mp}`)}${cell('こうげき', m.st.atk)}${cell('ぼうぎょ', m.st.def)}${cell('すばやさ', m.st.spd)}${hu ? cell('そうび', `+${W.atk} / +${A.def}`) : cell('なつき', `${m.bond || 0}/100`)}</dl>
    <div class="st-sk">${m.skills.map(s => DATA.skills[s].name).join('・') || '—'}</div>${hu ? `<p class="st-eq"><span>ぶき　<b>${W.name}</b>（こうげき+${W.atk}）</span><span>ぼうぐ　<b>${A.name}</b>（ぼうぎょ+${A.def}）</span></p>` : ''}</div>`; }).join('')}</div>
    <p class="st-foot"><span>がんばり <b>${Math.round(G.stamMax)}</b></span><span>ひかりの種 <b>${G.seeds}</b>こ（見つけた ${Object.keys(G.seedGot).length}/${SEED_N()}）</span><span>依頼達成 <b>${G.bountyDone}</b></span>${G.flags.glider ? '<span>風布あり</span>' : ''}</p>`, 'wide'); }
async function skillMenu() {
  if (HOOK.skillUI) { if (!G.tips.skillHelp2) { G.tips.skillHelp2 = 1; await say(['【スキル】 レベルと 職業レベルが 上がると スキルポイント（SP）が もらえる。', '固有わざ は レベルで 自動で 覚える。 SPは「個性ボード」（ずっと のこる）と「職業ツリー」（転職で 全額 もどる）に ふれる。']); } return HOOK.skillUI(); }
  if (!G.tips.skillHelp) { G.tips.skillHelp = 1; await say(['【スキル】 レベルが 上がると スキルポイント（SP）が もらえる。', 'SPを つかって、技を 覚えたり 能力を 伸ばしたり できる。 🔒は 前の マスを 覚えると ひらく。']); }
  while (true) {
    const i = await menu({ title: 'スキル（キャラを えらぶ）', items: G.party.map(m => ({ label: nameOf(m), sub: `SP ${G.sp[m.id] || 0}　${(G.board[m.id] || []).length}/8` })), where: 'side' });
    if (i < 0) return; const m = G.party[i];
    while (true) {
      const B = DATA.boards[m.id], own = G.board[m.id] = G.board[m.id] || [], sp = G.sp[m.id] || 0;
      const j = await menu({ title: `${nameOf(m)}　のこりSP ${sp}`, items: B.map(n => { const have = own.includes(n.id), lock = n.req && !own.includes(n.req);
        return { label: (have ? '★ ' : lock ? '🔒 ' : '') + n.name, sub: have ? '習得ずみ' : lock ? `「${B.find(x => x.id === n.req).name}」の あと` : `${n.cost}SP　${n.desc}`, disabled: have || lock || sp < n.cost }; }), where: 'side' });
      if (j < 0) break; const n = B[j];
      if (!(await confirm(`${n.name}：${n.desc}\n${n.cost}SPで 覚えますか？`))) continue;
      G.sp[m.id] -= n.cost; own.push(n.id); const r = m.hp / m.st.hp; calc(m); m.hp = Math.round(m.st.hp * r); m.mp = Math.min(m.mp, m.st.mp); Music.sfx('friend'); toast(`${nameOf(m)}は ${n.name}を 覚えた！`, 1500); hud(); } } }
function useItemField(k, m) { const it = DATA.items[k]; G.inv[k]--; if (it.heal) m.hp = Math.min(m.st.hp, m.hp + it.heal); if (it.mp) m.mp = Math.min(m.st.mp, m.mp + it.mp); Music.sfx('heal'); hud(); }
async function itemMenu() {
  while (true) {
    const cats = Object.keys(DATA.itemCats);
    const c = await menu({ title: 'どうぐ', items: cats.map(cat => { const n = Object.keys(DATA.items).filter(k => DATA.items[k].cat === cat && (G.inv[k] || 0) > 0).length; return { label: DATA.itemCats[cat], sub: `${n}しゅるい` }; }), where: 'side' });
    if (c < 0) return; const cat = cats[c];
    while (true) {
      const ks = Object.keys(DATA.items).filter(k => DATA.items[k].cat === cat && (G.inv[k] || 0) > 0);
      if (!ks.length) { await panel(`<h3>${DATA.itemCats[cat]}</h3><p>なにも もっていない。</p>`); break; }
      const i = await menu({ title: DATA.itemCats[cat], items: ks.map(k => ({ label: DATA.items[k].name, sub: `×${G.inv[k]}` })), where: 'side' });
      if (i < 0) break; const k = ks[i], it = DATA.items[k];
      const usable = it.heal || it.mp || it.stam || it.healAll || it.warp;
      const a = await menu({ title: `${it.name}　×${G.inv[k]}`, items: [{ label: usable ? 'つかう' : it.battle ? 'バトルで つかう' : 'つかえない（素材）', disabled: !usable }, { label: `効果：${it.desc}`, disabled: true }, { label: `入手：${it.src || '—'}`, disabled: true }, { label: `使いみち：${it.use || '—'}`, disabled: true }], where: 'side' });
      if (a !== 0) continue;
      if (it.warp) { G.inv[k]--; await warpTo(REGr().town.x + 2, REGr().town.z + 3); return 'warped'; }
      if (it.stam) { G.inv[k]--; G.stam = G.stamMax; player.tired = false; Music.sfx('heal'); toast('がんばりが 全回復した！', 1200); continue; }
      if (it.healAll) { G.inv[k]--; allMembers().forEach(m => { m.hp = m.st.hp; m.mp = m.st.mp; }); Music.sfx('heal'); toast('みんな 全回復した！', 1200); hud(); continue; }
      const P = battleParty(); const j = await menu({ title: `だれに つかう？`, items: P.map(m => ({ label: nameOf(m), sub: `HP ${m.hp}/${m.st.hp}  MP ${m.mp}/${m.st.mp}` })), where: 'side' });
      if (j >= 0) useItemField(k, P[j]); } } }
async function travel(dest, x, z, yaw = Math.PI, cine = null) { await fade(true); G.region = dest; World.setRegion(dest); enemies = []; player.x = x; player.z = z; player.y = surfaceAt(x, z, 99); player.vx = player.vz = player.vy = 0; player.glide = false; trail.length = 0; cam.yaw = yaw; camFrame(yaw); player.yaw = cam.yaw; player.safe = { x, z }; if (cine) await cinematic(cine.kind, cine.title || REGION_NAME[dest], cine.sub); Music.play(fieldSong(), { restart: true }); await wait(cine ? 250 : 400); await fade(false); save(); }
async function warpTo(x, z) { await fade(true); player.x = x; player.z = z; player.y = surfaceAt(x, z, 99); player.safe = { x, z }; player.vx = player.vz = player.vy = 0; trail.length = 0; enemies = []; camFrame(cam.yaw); player.yaw = cam.yaw; await wait(200); await fade(false); }
const mapCache = {};
function mapImage() {
  if (mapCache[G.region]) return mapCache[G.region];
  const S = 180, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); const img = x.createImageData(S, S);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const wx = (i / S - .5) * 540, wz = (j / S - .5) * 540, h = hAt(wx, wz); const b = World.biomeAt(wx, wz); let col;
    if (G.region === 3) { col = b === 'trench' ? [22, 30, 70] : b === 'rock' || h > 30 ? [70, 96, 112] : b === 'coral' ? [214, 120, 128] : b === 'kelp' ? [58, 120, 90] : [178, 170, 140]; col = col.map((v, q) => v * .8 + [20, 60, 90][q] * .2); }
    else if (G.region === 2 && h < 1) col = [226, 232, 244]; else if (b === 'crystal') col = [168, 158, 214]; else if (h < -2) col = [28, 58, 96]; else if (h < 0) col = [60, 118, 150]; else if (b === 'shore' || h < 2) col = [214, 196, 146]; else if (b === 'desert') col = [206, 170, 106]; else if (b === 'snow') col = [232, 238, 244];
    else if (b === 'ruins') col = [168, 150, 120]; else if (b === 'rock' || h > 26) col = [138, 132, 124]; else if (b === 'forest') col = [58, 104, 52]; else col = [104, 150, 74];
    const sh = hAt(wx - 3, wz - 3) - h; const k = 1 + Math.max(-.25, Math.min(.25, sh * .06)); const o = (j * S + i) * 4; img.data[o] = col[0] * k; img.data[o + 1] = col[1] * k; img.data[o + 2] = col[2] * k; img.data[o + 3] = 255; }
  x.putImageData(img, 0, 0); return mapCache[G.region] = c.toDataURL(); }
function mapPanel() { return new Promise(res => {
  const r = REGr(); const pos = (x, z) => `left:${(x / 540 + .5) * 100}%;top:${(z / 540 + .5) * 100}%`; const ob = objective(); const marks = [];
  const warps = []; if (G.region === 2) { warps.push({ n: '雲の里ククル', x: r.town.x + 2, z: r.town.z + 4 }); r.shrines.forEach(sh => { if (G.wind[sh.i]) warps.push({ n: DATA.windTrials[sh.i].name, x: sh.x + 1, z: sh.z + 1 }); }); if (G.flags.c3bridge) warps.push({ n: '星巣の塔 入口', x: r.midboss.x, z: r.midboss.z + 3 }); }
  else if (G.warp || G.region === 1) { warps.push({ n: TOWN_NAME[G.region], x: r.town.x + 2, z: r.town.z + 4 }); if (G.region === 0) r.beacons.forEach(b => { if (b.lit) warps.push({ n: `灯台：${DATA.trials[b.i].name}`, x: b.x + 3, z: b.z + 3 }); }); if (G.region === 1 && G.flags.c2rumor) warps.push({ n: '星の遺跡 入口', x: r.ruinsEntrance.x - 3, z: r.ruinsEntrance.z }); }
  if (G.warp || G.region > 0) for (const f of HOOK.warps) warps.push(...f(G.region));
  const hasWarp = t => warps.some(w => w.n.startsWith(t)); // ワープピンが 名前を 出すので、同じ場所の 文字ラベルは はぶく
  if (!hasWarp(TOWN_NAME[G.region])) marks.push(`<span class="mk town" style="${pos(r.town.x, r.town.z)}">${TOWN_NAME[G.region]}</span>`);
  if (G.region === 0) { r.beacons.forEach(b => marks.push(`<span class="mk bc${b.lit ? ' lit' : ''}" style="${pos(b.x, b.z)}" title="${DATA.trials[b.i].name}">${b.lit ? '🔥' : '◇'}</span>`)); if (G.order >= 5) marks.push(`<span class="mk" style="${pos(r.shrine.x, r.shrine.z)}">⛩</span>`); }
  else if (G.region === 1) { if (!hasWarp('星の遺跡')) marks.push(`<span class="mk ru" style="${pos(World.RUINS1[0], World.RUINS1[1])}">星の遺跡</span>`); }
  else if (G.region === 3) { r.lh.forEach(L => marks.push(`<span class="mk bc${(G.lh || [])[L.i] ? ' lit' : ''}" style="${pos(L.x, L.z)}">${(G.lh || [])[L.i] ? '🔥' : '◇'}</span>`)); marks.push(`<span class="mk ru" style="${pos(r.palace.x, r.palace.z)}">深淵の宮</span>`); }
  else { r.shrines.forEach(sh => marks.push(`<span class="mk bc${G.wind[sh.i] ? ' lit' : ''}" style="${pos(sh.x, sh.z)}" title="${DATA.windTrials[sh.i].name}">${G.wind[sh.i] ? '🌀' : '◇'}</span>`)); if (!hasWarp('星巣の塔')) marks.push(`<span class="mk ru" style="${pos(r.tower.x, r.tower.z)}">星巣の塔</span>`); }
  marks.push(`<span class="mk" style="${pos(r.pier.x, r.pier.z)}">⚓</span>`);
  for (const f of HOOK.mapMarks) marks.push(...f(G.region, pos).filter(h => !warps.some(w => String(h).includes(`>${w.n}<`))));
  if (ob.p) marks.push(`<span class="mk goal" style="${pos(ob.p.x, ob.p.z)}">★</span>`);
  marks.push(`<span class="mk me" style="${pos(player.x, player.z)};transform:translate(-50%,-50%) rotate(${Math.PI - player.yaw}rad)">▲</span>`);
  const pins = warps.map((w, i) => `<button class="wp" type="button" data-i="${i}" style="${pos(w.x, w.z)}" aria-label="${w.n}へ ワープ"><i>◆</i>${w.n.replace(/^灯台：/, '')}</button>`).join('');
  const el = document.createElement('div'); el.className = 'win panel mapp';
  el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button><div class="mapwrap"><div class="map"><img src="${mapImage()}" alt="${REGION_NAME[G.region]}の 地図">${marks.join('')}${pins}</div>
    <div class="mapside"><h3>地図：${REGION_NAME[G.region]}</h3><p class="q-now">★ ${ob.t}</p><p class="map-legend"><span><b>▲</b> いま</span><span><b class="g">★</b> 目的地</span>${warps.length ? '<span><b class="g">◆</b> ピンを タップで ワープ</span>' : ''}</p>
      ${warps.length ? `<details class="wdet"><summary>ワープ先 一覧（${warps.length}）</summary><div class="wlist">${warps.map((w, i) => `<button class="t-btn wbtn" type="button" data-i="${i}">${w.n}</button>`).join('')}</div></details>` : '<p class="st-eq">最初の 灯台を ともすと ワープが つかえる。</p>'}</div></div>`;
  const M = { el, panel: true, items: [], res }; el.querySelector('.m-x').addEventListener('click', () => { Music.sfx('cancel'); closeMenu(M, -1); });
  el.querySelectorAll('.wbtn,.wp').forEach(b => b.addEventListener('click', async () => { const w = warps[+b.dataset.i]; M.res = () => {}; closeMenu(M, -1); Music.sfx('magic'); await warpTo(w.x, w.z); res('warped'); }));
  $('ui').appendChild(el); MENUS.push(M); layoutPins(el.querySelector('.map')); }); }
// ワープピンの ラベルが 重ならないよう 上→下→右→左 の 順に 置き場所を さがす（地図の 外にも はみ出さない）
function layoutPins(map) { if (!map) return; const mr = map.getBoundingClientRect(); const placed = [], pad = 3;
  const pins = [...map.querySelectorAll('.wp')]; const anchors = pins.map(p => { p.className = 'wp'; const r = p.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.bottom + 7 }; });
  const hit = (a, b) => a.l < b.r + pad && a.r > b.l - pad && a.t < b.b + pad && a.b > b.t - pad;
  pins.forEach((p, i) => { let best = null, bestN = 1e9;
    for (const d of ['', 'b', 'r', 'l']) { p.className = 'wp' + (d ? ' ' + d : ''); const r = p.getBoundingClientRect(); const box = { l: r.left, r: r.right, t: r.top, b: r.bottom };
      const out = box.l < mr.left || box.r > mr.right || box.t < mr.top || box.b > mr.bottom;
      const n = placed.filter(q => hit(box, q)).length + anchors.filter((a, j) => j !== i && a.x > box.l && a.x < box.r && a.y > box.t && a.y < box.b).length + (out ? 5 : 0);
      if (n < bestN) { bestN = n; best = d; } if (n === 0) break; }
    p.className = 'wp' + (best ? ' ' + best : ''); const r = p.getBoundingClientRect(); placed.push({ l: r.left, r: r.right, t: r.top, b: r.bottom }); }); }
async function questLog() {
  const F = G.flags, ck = v => v ? '<b class="ok">✓</b>' : '<b class="ng">□</b>'; const ob = objective(); const rk = rankOf(rankPts());
  const r0 = REG[0];
  const ch1 = [['母さん（ユイ）と 話す', F.metYui], ['ゲンの 工房へ', F.metGen], ['ミオを 仲間に', F.mio], ...r0.beacons.map(b => [`灯台「${DATA.trials[b.i].name}」`, b.lit]), ['宵の祠で 決着', F.cleared]];
  const ch2 = [['クロウの 話を 聞く', F.c2start], ['霧の大陸へ わたる', F.c2arrive], ['ツムギに 会う', F.dex], ['ギルドで 情報収集', F.c2rumor], ['遺跡の 番人', F.c2mid], ['祭壇の 決戦', F.c2done]];
  const got = Object.keys(G.dex.got).length, nx = DATA.dexRewards.find(x => got < x.n);
  const chests = REG[0].chests.length + REG[1].chests.length + REG[2].chests.length;
  const ch3 = [['ツムギの 話を 聞く', F.c3start], ['星笛で 空へ', F.c3arrive], ['長老ソヨギに 会う', F.c3elder], ...DATA.windTrials.map((t, i) => [`${t.name}（${t.where}）`, G.wind[i]]), ['星巣の塔の 番人', F.c3mid], ['塔の 頂の 決戦', F.c3done]];
  await panel(`<h3>クエスト</h3><p class="q-now">▶ ${ob.t}</p><div class="qgrid">
    <section><h4>第1章　ともしびの継ぎ手</h4><ul class="ql">${ch1.map(([t, d]) => `<li>${ck(d)} ${t}</li>`).join('')}</ul>${F.cleared ? `<h4>第2章　星くずの大陸</h4><ul class="ql">${ch2.map(([t, d]) => `<li>${ck(d)} ${t}</li>`).join('')}</ul>` : ''}${F.c2done ? `<h4>第3章　天空の星巣</h4><ul class="ql">${ch3.map(([t, d]) => `<li>${ck(d)} ${t}</li>`).join('')}</ul>` : ''}</section>
    <section><h4>やりこみ</h4><ul class="ql">
      <li>冒険者ランク <b>${rk.r.r}</b> ${rk.nx ? `（${rankPts()}/${rk.nx.pts}pt → 次は ${rk.nx.r}）` : '（最高ランク！）'}</li>
      <li>いきもの図鑑 ${got}/${DEX_N} ${nx ? `（あと ${nx.n - got}種で ごほうび：${nx.text}）` : '（完成！）'}</li>
      <li>ひかりの種 ${Object.keys(G.seedGot).length}/${SEED_N()}（石像に 4こで 強化）</li>
      <li>宝箱 ${Object.keys(G.chests).length}/${chests}</li>
      <li>ギルドの 依頼 達成 ${G.bountyDone}件${F.c2rumor ? '' : '（港町ミナトで 受けられる）'}</li>
      ${HOOK.quest.map(f => f()).join('')}
      ${G.bounties.map(b => `<li class="sub">・${b.text} ${b.kind === 'hunt' || b.kind === 'huntSp' ? `${b.c}/${b.n}` : bDone(b) ? '★達成' : ''}</li>`).join('')}
    </ul><p class="st-eq">ランクpt：ボス20・灯台15・依頼6・図鑑5・宝箱3・種2</p></section></div>`, 'wide'); }
async function partyMenu() {
  while (true) {
    fixTeam(); const team = G.team.map(member);
    const i = await menu({ title: 'なかま：たいれつ（最大4）', items: [...team.map((m, k) => ({ label: `${k + 1}. ${esc(nameOf(m))}`, sub: `Lv${m.lv} HP${m.hp}/${m.st.hp}` })), { label: '牧場の いきものを 見る', sub: `${G.mons.length}ひき` }], where: 'side' });
    if (i < 0) return;
    if (i === team.length) { await ranch(); continue; }
    const m = team[i]; if (m.id === 'sora') { await window.KZ.monPanel(m); continue; }
    const c = await menu({ title: esc(nameOf(m)), items: [{ label: 'くわしく 見る' }, { label: 'たいれつから はずす' }, { label: '前へ', disabled: i <= 1 }] });
    if (c === 0) await window.KZ.monPanel(m); if (c === 1) G.team.splice(i, 1); if (c === 2) { [G.team[i - 1], G.team[i]] = [G.team[i], G.team[i - 1]]; }
  } }
async function monPanel(m) { if (m.kind === 'human') { await charPanel(m.id); return; } const S = SPC[m.id];
  await panel(`<div class="fr"><div class="fr-art">${Art.species(m.id, { shiny: m.shiny })}</div><div><h3>${esc(nameOf(m))} <small>Lv${m.lv}</small> ${typeTag(S.type)}</h3><p>${S.desc}</p>
    <p>HP ${m.hp}/${m.st.hp}　MP ${m.mp}/${m.st.mp}　こうげき ${m.st.atk}　ぼうぎょ ${m.st.def}　すばやさ ${m.st.spd}</p>
    <p>こせい <b class="grade g${ivGrade(m)}">${ivGrade(m)}</b>　${['hp', 'atk', 'def', 'spd', 'mp'].map(k => `${{ hp: 'HP', atk: 'こう', def: 'ぼう', spd: 'すば', mp: 'MP' }[k]}${'★'.repeat(Math.round(((m.iv || {})[k] ?? 8) / 5))}`).join(' ')}</p>
    <p>なつき <span class="bond">${'♥'.repeat(Math.floor((m.bond || 0) / 20))}${'♡'.repeat(5 - Math.floor((m.bond || 0) / 20))}</span> ${m.bond || 0}/100 <small>（30〜：ふんばり　80〜：会心アップ）</small></p>
    <p>とくぎ：${m.skills.map(s => DATA.skills[s].name + ((m.extra || []).includes(s) ? '（継承）' : '')).join('・')}</p>${S.evo ? `<p class="st-sk">Lv${S.evo.lv}で すがたが 変わるらしい……</p>` : ''}</div></div>`, 'wide'); }
async function ranch() {
  while (true) {
    const list = G.mons.slice(); if (!list.length) { await panel('<h3>牧場</h3><p>まだ いきものの なかまは いない。 かげものを たおすと、なかまに なってくれることが ある。</p>'); return; }
    const i = await menu({ title: `牧場（${list.length}ひき）`, items: list.map(m => ({ label: (G.team.includes(m.uid) ? '◆ ' : '') + nameOf(m), sub: `Lv${m.lv} ${DATA.types[SPC[m.id].type]}` })), where: 'side' });
    if (i < 0) return; const m = list[i]; const inTeam = G.team.includes(m.uid);
    const snack = ['stew', 'kinojiru', 'yakimi', 'pan', 'mi'].find(k => (G.inv[k] || 0) > 0);
    const c = await menu({ title: nameOf(m), items: [{ label: 'くわしく 見る' }, { label: inTeam ? 'たいれつから はずす' : 'たいれつに 入れる' }, { label: 'にがす', disabled: G.mons.length <= 1 || inTeam }, { label: 'おやつを あげる', sub: snack ? `${DATA.items[snack].name}（のこり${G.inv[snack]}）` : 'たべもの なし', disabled: !snack || (m.bond || 0) >= 100 }] });
    if (c === 3) { G.inv[snack]--; const up = { stew: 12, kinojiru: 8, yakimi: 5, pan: 4, mi: 2 }[snack]; m.bond = Math.min(100, (m.bond || 0) + up); calc(m); Music.sfx('friend'); await say([`${nameOf(m)}は ${DATA.items[snack].name}を おいしそうに たべた！`, `なつき +${up}（${m.bond}/100）`]); save(); }
    if (c === 0) await window.KZ.monPanel(m);
    if (c === 1) { if (inTeam) G.team.splice(G.team.indexOf(m.uid), 1); else { if (G.team.length >= 4) G.team[3] = m.uid; else G.team.push(m.uid); } }
    if (c === 2 && await confirm(`${nameOf(m)}を 自然に かえしますか？`)) { G.mons = G.mons.filter(x => x !== m); await say([`${nameOf(m)}は なんども ふりかえりながら 帰っていった。`]); }
  } }
async function dexMenu() {
  const got = Object.keys(G.dex.got).length, seen = Object.keys(G.dex.seen).length;
  const cells = DATA.speciesOrder.map(k => { const S = SPC[k]; const g = G.dex.got[k], s = G.dex.seen[k];
    return `<button class="dx${g ? ' got' : s ? ' seen' : ''}" type="button" data-k="${k}"><span class="dx-no">No.${String(S.no).padStart(2, '0')}</span><span class="dx-art">${s ? Art.species(k, { shadow: !g }) : '<span class="dx-q">？</span>'}</span><span class="dx-n">${s ? S.name : '？？？'}</span></button>`; }).join('');
  const p = panel(`<h3>いきもの図鑑　<small>見つけた ${seen}　なかま ${got} / ${DEX_N}</small></h3><div class="dex">${cells}</div><p class="st-eq">なかまに すると くわしい 情報が 見られる。 ツムギに 報告すると ごほうびが ある。</p>`, 'wide dexp');
  const top = MENUS[MENUS.length - 1];
  top.el.querySelectorAll('.dx.got,.dx.seen').forEach(b => b.addEventListener('click', () => { const k = b.dataset.k, S = SPC[k], g = G.dex.got[k]; const h = S.hab;
    const where = h ? `${h.r === -1 ? '島と大陸' : REGION_NAME[h.r]}・${h.b.map(x => ({ grass: '草原', forest: '森', rock: '岩場', shore: '浜辺', desert: '砂漠', snow: '雪原', ruins: '遺跡', crystal: '星晶の島' }[x])).join('／')}・${{ day: '昼', night: '夜', any: 'いつでも' }[h.t]}` : S.legend ? '？？？' : 'すがたが 変わると あらわれる';
    toast(`<b>${S.name}</b>（${DATA.types[S.type]}）<br><span style="font-size:.6em">${g ? S.desc + '<br>' : ''}すみか：${g ? where : '？？？'}</span>`, 4200); }));
  await p;
}
async function craftMenu() {
  while (true) {
    const can = r => Object.entries(r.need).every(([k, v]) => (G.inv[k] || 0) >= v);
    const i = await menu({ title: 'クラフト（ブロックを つくる）', items: DATA.recipes.map(r => ({ label: `${DATA.blocks[r.out]} ×${r.n}`, sub: `${Object.entries(r.need).map(([k, v]) => `${DATA.items[k].name}${v}`).join(' ')}（もち ${G.blk[r.out] || 0}）`, disabled: !can(r) })), where: 'side' });
    if (i < 0) return; const r = DATA.recipes[i]; for (const [k, v] of Object.entries(r.need)) G.inv[k] -= v; G.blk[r.out] = (G.blk[r.out] || 0) + r.n; G.mat = r.out; Music.sfx('place'); hud();
    toast(`${DATA.blocks[r.out]}ブロックを ${r.n}こ つくった<br><span style="font-size:.6em">「つくる」で 置ける</span>`, 1600); } }
async function charPanel(k) { const c = DATA.cast[k]; const secret = k === 'yomi' && !G.flags.cleared;
  await panel(`<div class="cb"><div class="cb-face">${Art.portrait(k, k === 'yomi' ? (secret ? 'neutral' : 'sad') : 'smile')}</div><div class="cb-body">
    <p class="cb-role">${c.role}・${c.title}</p><h3>${k === 'sora' ? esc(G.name) : c.name} <small>${c.age}${typeof c.age === 'number' ? 'さい' : ''}</small></h3>
    <dl><dt>見た目</dt><dd>${c.look}</dd><dt>性格</dt><dd>${c.body}</dd><dt>過去</dt><dd>${secret ? '？？？（物語を すすめると わかる）' : c.past}</dd><dt>好きなもの</dt><dd>${c.like}</dd></dl><p class="cb-line">${c.line.replace(/{name}/g, esc(G.name))}</p></div></div>`, 'wide'); }
async function charBook() {
  const order = ['sora', 'mio', 'riku', 'sana', 'haru', 'kaito', 'yui', 'gen', 'nagi', 'tsumugi', 'baldo', 'soyogi', 'yomi'];
  while (true) {
    const i = await menu({ title: 'じんぶつ', items: order.map(k => ({ label: G.met[k] ? (k === 'sora' ? G.name : DATA.cast[k].name) : '？？？', sub: G.met[k] ? DATA.cast[k].role : '', disabled: !G.met[k] })), where: 'side' });
    if (i < 0) return; await charPanel(order[i]); } }

// ================= field =================
function fieldSong() { for (const f of HOOK.song) { const s = f(); if (s) return s; }
  if (G.region === 0) { if (G.flags.shrineOpen && !G.flags.cleared) return 'night'; if (Math.hypot(player.x, player.z) < 32) return 'village'; }
  else if (G.region === 1) { const t = REG[1].town; if (Math.hypot(player.x - t.x, player.z - t.z) < 34) return 'town'; if (Math.hypot(player.x - World.RUINS1[0], player.z - World.RUINS1[1]) < 36) return 'dungeon'; }
  else { const r = REG[2]; if (Math.hypot(player.x - r.town.x, player.z - r.town.z) < 36) return 'skytown'; if (Math.hypot(player.x - r.tower.x, player.z - r.tower.z) < 44) return 'tower'; return World.skyInfo(G.tod).night > .5 ? 'night' : 'sky'; }
  return World.skyInfo(G.tod).night > .5 ? 'night' : 'field'; }
let songCheck = 0;
function spawnEnemies(dt, night) {
  spawnT -= dt; if (spawnT > 0) return; spawnT = 1.1;
  enemies = enemies.filter(e => Math.hypot(e.x - player.x, e.z - player.z) < 110);
  const cap = (COARSE ? 9 : 12) + (night > .5 ? 4 : 0); if (enemies.length >= cap) return;
  const r = REGr();
  for (let k = 0; k < 6; k++) { const a = R() * 6.28, rr = 40 + R() * 45, x = player.x + Math.cos(a) * rr, z = player.z + Math.sin(a) * rr, h = hAt(x, z);
    if (h < (G.region === 2 ? 4 : .3) || Math.hypot(x - r.town.x, z - r.town.z) < 36 || (r.tower && Math.hypot(x - r.tower.x, z - r.tower.z) < 16) || Math.max(Math.abs(x), Math.abs(z)) > 250 || (r.beacons || []).some(b => Math.hypot(b.x - x, b.z - z) < 10) || surfaceAt(x, z, h + 30) > h + .5 || blocked(x, z, h)) continue; // 建物の 中・上には わかない
    const b = World.biomeAt(x, z); const tod = night > .5 ? 'night' : 'day';
    const pool = []; for (const k2 of DATA.speciesOrder) { const S = SPC[k2]; if (!S.hab) continue; const hb = S.hab; if (hb.r !== -1 && hb.r !== G.region) continue; if (!hb.b.includes(b)) continue; if (hb.t !== 'any' && hb.t !== tod) continue; pool.push([k2, hb.w]); }
    if (!pool.length) continue;
    const pick = () => { let s = pool.reduce((a, [, w]) => a + w, 0) * R(); for (const [k2, w] of pool) { if ((s -= w) <= 0) return k2; } return pool[0][0]; };
    const n = (G.region === 0 && G.order === 0 && !G.flags.mio) ? 1 : 1 + (R() < .45 ? 1 : 0) + ((G.region === 1 || G.order >= 2) && R() < .3 ? 1 : 0);
    const group = Array.from({ length: n }, () => ({ sp: pick(), lv: wildLevel(x, z), shiny: R() < 1 / 64 }));
    enemies.push({ x, z, y: h, hx: x, hz: z, yaw: R() * 6.28, group, tx: x, tz: z, wt: 0 }); break; }
  if (G.region === 2 && G.flags.c3done && !G.dex.got.hoshimori && night > .5 && !enemies.some(e => e.legend) && Math.hypot(player.x - r.tower.x, player.z - r.tower.z) < 30 && player.y > r.tower.top - 2) {
    const a = r.altar; enemies.push({ x: a.x + 2.5, z: a.z, y: a.y, fixedY: a.y, hx: a.x + 2.5, hz: a.z, yaw: 0, legend: true, group: [{ sp: 'hoshimori', lv: 45, shiny: false }], tx: a.x, tz: a.z, wt: 0 }); }
  if (G.region === 1 && G.flags.c2done && !G.dex.got.hoshikujira && night > .5 && !enemies.some(e => e.legend) && Math.hypot(player.x - World.RUINS1[0], player.z - World.RUINS1[1]) < 80) {
    const [x, z] = World.RUINS1; enemies.push({ x: x + 24, z, y: hAt(x + 24, z), hx: x + 24, hz: z, yaw: 0, legend: true, group: [{ sp: 'hoshikujira', lv: 38, shiny: false }], tx: x, tz: z, wt: 0 }); }
}
function moveEntity(e, tx, tz, spd, dt) { const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz); if (d < .1) return 0; const st = Math.min(d, spd * dt); e.x += dx / d * st; e.z += dz / d * st;
  let yd = Math.atan2(dx, dz) - e.yaw; yd = Math.atan2(Math.sin(yd), Math.cos(yd)); e.yaw += yd * Math.min(1, dt * 8); return st; }
function blocked(x, z, y) { for (const [ox, oz] of [[-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]]) { const cx = Math.floor(x + ox), cz = Math.floor(z + oz);
  for (let iy = Math.floor(y + .65); iy <= Math.floor(y + 1.7); iy++) if (Blocks.has(cx, iy, cz)) return true; } return false; }
// ---- 物理（QA）：足の 四すみで 支える・めりこみ 押し出し・落下の 記録 ----
const FOOT = [[-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]];
// 足もとの 支え：中心の 地形 ＋ 足の 四すみ いずれかの 下の ブロック上面（ふちに 立てる／角に 食いこまない）
function footAt(x, z, yRef) { let g = surfaceAt(x, z, yRef); const top = Math.floor(yRef + .6);
  for (const [ox, oz] of FOOT) { const cx = Math.floor(x + ox), cz = Math.floor(z + oz); for (let iy = top; iy + 1 > g; iy--) if (Blocks.has(cx, iy, cz)) { g = iy + 1; break; } }
  return g; }
// めりこみ 押し出し：近い 横の 空き → 1段 上 → 遠い 横の 空き（最大 .9）
function depen(p) { if (!blocked(p.x, p.z, p.y)) return false;
  const side = (d0, d1) => { for (let d = d0; d <= d1; d += .05) for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, x = p.x + Math.sin(a) * d, z = p.z + Math.cos(a) * d; if (!blocked(x, z, p.y)) { p.x = x; p.z = z; return true; } } return false; };
  if (side(.05, .35)) return true;
  const up = footAt(p.x, p.z, p.y + 1.1); if (up - p.y <= 1.1 && !blocked(p.x, p.z, up)) { p.y = up; return true; }
  return side(.4, .9); }
// 落下ダメージ：7.5m を こえる 落下で、高さに 応じて へる（ぜったいに たおれない＝HP1のこる）。 滑空・水・上昇気流・海の底は なし
const FALL_SAFE = 7.5;
function fallHurt(drop) { const f = clamp((drop - FALL_SAFE) * .04 + .05, .05, .6); let hit = 0;
  for (const m of battleParty()) { if (!(m.hp > 1)) continue; const d = Math.max(1, Math.round(m.st.hp * f)); m.hp = Math.max(1, m.hp - d); hit = Math.max(hit, d); }
  player.stag = .3 + Math.min(.45, (drop - FALL_SAFE) * .03); player.vx *= .2; player.vz *= .2; player.sq = .9;
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; puffs.push({ x: player.x + Math.cos(a) * .7, y: player.y + .1, z: player.z + Math.sin(a) * .7, t: 0, big: 1 }); }
  Music.sfx('hurt'); if (hit) try { floatText([player.x, player.y + 2.2, player.z], `ドスン！ -${hit}`); } catch (_) {}
  hud(); tip('高い ところから 落ちると ダメージ（HPは 1 のこる）。<br>滑空・水・上昇気流で 着地すれば だいじょうぶ', 'fall', 3600); }

// ================= followers（V字で 2.5〜3.5 うしろ・カメラの 視線を よける） =================
const folSt = {};
function followPos(m, i, dt) { const back = i < 2 ? 3.3 : 4.4, lat = (i % 2 ? 1 : -1) * (i < 2 ? 1.7 : 2.8); const k = m.uid || m.id;
  let px = player.x, pz = player.z, acc = 0, bx = px - Math.sin(player.yaw) * back, bz = pz - Math.cos(player.yaw) * back, hy = player.yaw, by = player.y;
  for (const t of trail) { const sd = Math.hypot(t.x - px, t.z - pz); if (sd < 1e-4) continue; if (acc + sd >= back) { const u = (back - acc) / sd; bx = px + (t.x - px) * u; bz = pz + (t.z - pz) * u; hy = Math.atan2(px - t.x, pz - t.z); by = t.y; acc = -1; break; } acc += sd; hy = Math.atan2(px - t.x, pz - t.z); px = t.x; pz = t.z; by = t.y; }
  if (acc >= 0) { hy = player.yaw; bx = player.x + Math.sin(hy) * .6; bz = player.z + Math.cos(hy) * .6; by = player.y; } // 足あとが まだ 短い（出発直後）：手前を ふさがず 左右に ならぶ
  let gx = bx - Math.cos(hy) * lat, gz = bz + Math.sin(hy) * lat;
  const e = cam.eye; if (e) { const lx = player.x - e[0], lz = player.z - e[2], L2 = lx * lx + lz * lz; if (L2 > .01) { const u = ((gx - e[0]) * lx + (gz - e[2]) * lz) / L2; if (u > -.1 && u < 1.1) { const qx = e[0] + lx * u, qz = e[2] + lz * u, dx = gx - qx, dz = gz - qz, dd = Math.hypot(dx, dz), L = Math.sqrt(L2);
    if (dd < 1.2) { const sx = dd > .05 ? dx / dd : (lat < 0 ? -lz : lz) / L, sz = dd > .05 ? dz / dd : (lat < 0 ? lx : -lx) / L; gx = qx + sx * 1.2; gz = qz + sz * 1.2; } } } }
  if (blocked(gx, gz, by) && !blocked(bx, bz, by)) { gx = bx; gz = bz; }
  let st = folSt[k]; if (!st || Math.hypot(st.x - gx, st.z - gz) > 9) st = folSt[k] = { x: gx, z: gz, yaw: hy };
  const ox = st.x, oz = st.z; st.x = lerp(st.x, gx, Math.min(1, dt * 5)); st.z = lerp(st.z, gz, Math.min(1, dt * 5));
  const mv = Math.hypot(st.x - ox, st.z - oz); let ty = mv > dt * .6 ? Math.atan2(st.x - ox, st.z - oz) : hy; let yd = ty - st.yaw; yd = Math.atan2(Math.sin(yd), Math.cos(yd)); st.yaw += yd * Math.min(1, dt * 7);
  const y = Math.max(surfaceAt(st.x, st.z, by + .5), -1); let hide = !!G.build || (cam.cd != null && cam.cd < 3);
  if (e) { const cx = st.x - e[0], cy = y + .8 - e[1], cz = st.z - e[2]; if (Math.hypot(cx, cy, cz) < 1.5) hide = true;
    else { const hx = player.x - e[0], hy2 = player.y + 1.4 - e[1], hz = player.z - e[2], H2 = hx * hx + hy2 * hy2 + hz * hz, u = (cx * hx + cy * hy2 + cz * hz) / H2; if (u > 0 && u < .85 && Math.hypot(cx - hx * u, cy - hy2 * u, cz - hz * u) < .55) hide = true; } }
  return { x: st.x, z: st.z, y, yaw: st.yaw, hide }; }
// ================= camera helpers =================
function camFollow(dt) { const g = [player.x, player.y + 1.6, player.z];
  if (!cam.tp || phase !== 'field' || Math.hypot(g[0] - cam.tp[0], g[1] - cam.tp[1], g[2] - cam.tp[2]) > 8) { cam.tp = g.slice(); cam.tv = [0, 0, 0]; return g; }
  for (let i = 0; i < 3; i++) { const st = i === 1 ? .16 : .085, w = 2 / st, x = w * dt, ex = 1 / (1 + x + .48 * x * x + .235 * x * x * x); const ch = cam.tp[i] - g[i], tmp = (cam.tv[i] + w * ch) * dt;
    cam.tv[i] = (cam.tv[i] - w * tmp) * ex; cam.tp[i] = g[i] + (ch + tmp) * ex; }
  return cam.tp.slice(); }
const camOcc = (x, y, z) => Blocks.has(Math.floor(x), Math.floor(y), Math.floor(z)) || y < hAt(x, z) - .05;
// 目の まわり（ニアクリップ）に ブロックが あると 画面が 壁で うまるので、太さを もたせて 判定
const camFat = e => { for (const ox of [-.32, .32]) for (const oy of [-.32, .32]) for (const oz of [-.32, .32]) if (Blocks.has(Math.floor(e[0] + ox), Math.floor(e[1] + oy), Math.floor(e[2] + oz))) return true; return false; };
function camEyeAt(tgt, pitch, d) { const cp = Math.cos(pitch); const e = [tgt[0] - Math.sin(cam.yaw) * cp * d, tgt[1] + Math.sin(pitch) * d, tgt[2] - Math.cos(cam.yaw) * cp * d];
  e[1] = Math.max(e[1], hAt(e[0], e[2]) + .7, G.region === 2 ? -24 : .6); return e; }
// その 角度で どこまで 引けるか（ブロック＋地形。 目の 高さ補正後の 線分も 見る）
function camReach(tgt, pitch, want) { const cp = Math.cos(pitch), fx = Math.sin(cam.yaw) * cp, fy = Math.sin(pitch), fz = Math.cos(cam.yaw) * cp;
  let d = want; for (let s = .45; s < want + .35; s += .3) { const x = tgt[0] - fx * s, y = tgt[1] + fy * s, z = tgt[2] - fz * s; if (Blocks.has(Math.floor(x), Math.floor(y), Math.floor(z))) { d = Math.max(.5, s - .45); break; } }
  for (let k = 0; k < 8 && d > .6; k++) { const e = camEyeAt(tgt, pitch, d); if (camFat(e)) { d = Math.max(.5, d - .35); continue; } const L =Math.hypot(e[0] - tgt[0], e[1] - tgt[1], e[2] - tgt[2]); let hit = -1;
    for (let s = .45; s < L; s += .35) { const u = s / L; if (camOcc(tgt[0] + (e[0] - tgt[0]) * u, tgt[1] + (e[1] - tgt[1]) * u, tgt[2] + (e[2] - tgt[2]) * u)) { hit = s; break; } }
    if (hit < 0) break; d = Math.max(.5, Math.min(d - .3, hit * d / L - .4)); }
  return d; }
function camSolve(tgt, dt, md) {
  if (phase !== 'field') { cam.cd = cam.dist; cam.pa = 0; return camEyeAt(tgt, cam.pitch, cam.dist); }
  // 動いている間、手で さわって 1.2秒 たてば、ゆっくり 背中側へ
  const hs = Math.hypot(player.vx, player.vz);
  if (md === 'field' && !G.build && look.id === null && hs > 1.5 && performance.now() - (cam.inAt || 0) > 1200) { let d = player.yaw - cam.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) < 2.1) { if (Math.abs(d) > .35) cam.rcN = (cam.rcN || 0) + dt; } if (Math.abs(d) < 2.1) cam.yaw += d * Math.min(1, dt * .9 * Math.min(1, hs / 5.4)) * (1 - Math.abs(d) / 2.6); }
  // つくるモード：見下ろし（ピッチ .62 以上）・6m 以上 引いて、主人公と 置く ブロックを 両方 見せる
  const bld = !!G.build && md === 'field'; cam.bp = lerp(cam.bp ?? cam.pitch, bld ? Math.max(cam.pitch, .62) : cam.pitch, Math.min(1, dt * 5));
  const bp = cam.bp, MIN = bld ? 3 : 2.2, want = bld ? Math.max(cam.dist, 6) : cam.dist; let pa = 0, reach = camReach(tgt, bp, want);
  if (reach < MIN) { let best = reach; for (const add of [.25, .5, .75, 1]) { const p = Math.min(1.35, bp + add); const r = camReach(tgt, p, want); if (r > best + .05) { best = r; pa = p - bp; } if (r >= MIN) break; } }
  cam.pa = cam.pa == null ? pa : lerp(cam.pa, pa, Math.min(1, dt * (pa > cam.pa ? 7 : 1.6)));
  const pitch = bp + cam.pa, dT = Math.min(want, camReach(tgt, pitch, want));
  if (cam.cd == null || dT < cam.cd) cam.cd = dT; else cam.cd = lerp(cam.cd, dT, Math.min(1, dt * (bld ? 4 : 1.7))); if (bld) cam.cd = Math.max(cam.cd, 3);
  return camEyeAt(tgt, pitch, cam.cd); }
// 出発・移動直後の 向き：16方向を しらべ、うしろ 8m が ひらけて 前が 長く 見通せる 向きへ
function camFrame(pref) { const head = [player.x, player.y + 1.6, player.z]; let best = null; const p0 = pref ?? cam.yaw;
  for (let k = 0; k < 16; k++) { const yaw = p0 + k / 16 * 6.2832; let back = 8; for (const o of [0, -.3, .3, -.55, .55]) { cam.yaw = yaw + o; back = Math.min(back, camReach(head, .3, 8) + (o ? Math.abs(o) * 2 : 0)); } let fwd = 0;
    for (let s = 1; s <= 30; s++) { const x = head[0] + Math.sin(yaw) * s, z = head[2] + Math.cos(yaw) * s, yy = head[1] + .2; if (Blocks.has(Math.floor(x), Math.floor(yy), Math.floor(z)) || hAt(x, z) > yy) break; fwd = s; }
    const sc = back * 3 + (back >= 7.9 ? 6 : 0) + fwd * .5 + Math.cos(yaw - p0) * 3; if (!best || sc > best.sc) best = { sc, yaw }; }
  cam.yaw = Math.atan2(Math.sin(best.yaw), Math.cos(best.yaw)); cam.tp = null; cam.cd = null; cam.pa = 0; cam.inAt = 0; return cam.yaw; }

let last = performance.now(), T = 0, saveT = 0, shinyFx = [];
function frame(now) { if (DEBUG && window.__norender) setTimeout(() => frame(performance.now()), 16); else requestAnimationFrame(frame); try { frameBody(now); } catch (e) { if (DEBUG) window.__ferr = String(e && e.stack || e).slice(0, 400); if ((frame.err = (frame.err || 0) + 1) < 4) console.error(e); try { dlgUpdate(.016); Music.tick(); } catch (_) {} } }
function frameBody(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now; T += dt;
  const md = mode();
  document.body.classList.toggle('modal', phase === 'field' && md !== 'field'); document.body.classList.toggle('inbattle', B.active);
  if (phase === 'field' && !B.active) { G.tod = (G.tod + dt / 480) % 1; G.play += dt; }
  darkness = lerp(darkness, G.region === 0 ? darkTarget : 0, Math.min(1, dt * .8));
  const night = Math.max(World.skyInfo(G.tod).night, darkness);
  const r = REGr();
  sandCd = Math.max(0, sandCd - dt);

  if (phase === 'field') {
    let ix = 0, iz = 0;
    if (md === 'field') {
      if (keys.has('KeyW') || keys.has('ArrowUp')) iz += 1; if (keys.has('KeyS') || keys.has('ArrowDown')) iz -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1; if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
      ix += stick.x; iz -= stick.y;
      if (DEBUG && window.__inp) { ix = window.__inp.x; iz = window.__inp.z; }
    }
    let im = Math.hypot(ix, iz); if (im > 1) { ix /= im; iz /= im; im = 1; }
    if (player.stag > 0) { player.stag -= dt; ix = iz = 0; im = 0; } // 着地の よろけ
    const wantSprint = keys.has('ShiftLeft') || keys.has('ShiftRight') || (stick.id !== null && Math.hypot(stick.x, stick.y) > .92);
    const fw = [Math.sin(cam.yaw), Math.cos(cam.yaw)], rt = [-Math.cos(cam.yaw), Math.sin(cam.yaw)];
    let wx = fw[0] * iz + rt[0] * ix, wz = fw[1] * iz + rt[1] * ix;
    const terr = hAt(player.x, player.z);
    player.swim = G.region !== 2 && terr < -1.2 && player.y < -.5;
    const gn = nAt(player.x, player.z);
    const sprint = wantSprint && !player.tired && im > .1 && player.ground && !player.swim;
    let speed = sprint ? 9.5 : 5.4; let climbing = false;
    if (im > .01 && player.ground && !player.swim) { const upH = -(gn[0] * wx + gn[2] * wz) / Math.max(im, 1e-3);
      if (gn[1] < .62 && upH > .35) { climbing = true; speed = 2.6; } else speed *= clamp(1 - Math.max(upH, 0) * .9, .45, 1); }
    if (player.swim) speed = 3.2; else if (terr < -.3) speed *= .6;
    if (player.glide) { speed = G.flags.glider2 ? 10.5 : 8; if (im < .05) { wx = Math.sin(player.yaw); wz = Math.cos(player.yaw); im = 1; } }
    const acc = player.swim ? (im > .05 ? 5 : 2.5) : player.ground ? (im > .05 ? 12 : 9) : player.glide ? 12 : 3; // 止まる ときは すこし すべる・水中は ゆっくり 加速
    player.vx = lerp(player.vx, wx * speed, Math.min(1, acc * dt)); player.vz = lerp(player.vz, wz * speed, Math.min(1, acc * dt));
    if (player.glide) { // 風布：慣性・旋回率の 上限・バンク・対気速度
      const trim = G.flags.glider2 ? 10.5 : 8; if (player.gHead == null) player.gHead = hsp0() > 1 ? Math.atan2(player.vx, player.vz) : player.yaw;
      let turn = 0; if (im > .15) { let d = Math.atan2(wx, wz) - player.gHead; d = Math.atan2(Math.sin(d), Math.cos(d)); turn = clamp(d * 2.2, -1.45, 1.45) * Math.min(1, im * 1.3); }
      player.gHead += turn * dt; player.bank = lerp(player.bank || 0, clamp(-turn * .42, -.62, .62), Math.min(1, dt * 3.2));
      const tgtSp = trim * (.82 + .3 * Math.min(im, 1)) * (1 - Math.abs(player.bank) * .12); player.gSpd = lerp(player.gSpd ?? hsp0(), tgtSp, Math.min(1, dt * (player.gSpd > tgtSp ? .9 : 1.6)));
      const flare = player.y - gh0() < 1.6 ? .55 : 1; player.vx = Math.sin(player.gHead) * player.gSpd * flare; player.vz = Math.cos(player.gHead) * player.gSpd * flare; }
    else { player.gHead = null; player.gSpd = null; player.bank = lerp(player.bank || 0, 0, Math.min(1, dt * 6)); }
    let nx = player.x + player.vx * dt, nz = player.z + player.vz * dt;
    if (Math.max(Math.abs(nx), Math.abs(nz)) > 268) { nx = player.x; nz = player.z; }
    let wallClimb = false;
    if (!isFinite(player.x + player.y + player.z)) { const s = player.safe || r.pier || r.town; player.x = s.x; player.z = s.z; player.y = surfaceAt(s.x, s.z, 99); player.vx = player.vz = player.vy = 0; nx = player.x; nz = player.z; }
    depen(player); // めりこみ（ふた・押しブロック・NPC押し・保存位置など）を まず 解消
    if (player.swim && G.region !== 3) { const gx = gn[0], gz = gn[2], gl = Math.hypot(gx, gz); if (gl > .015) { const s = (G.region % 2 ? -1 : 1) * .45 / gl; nx += -gz * s * dt; nz += gx * s * dt; } } // 海流：岸に そって ゆるく 流される
    for (const f of HOOK.push) f(nx, nz, player.y, wx, wz, dt);
    if (blocked(nx, nz, player.y) && player.ground && !player.swim && !(HOOK.noStep && HOOK.noStep(nx, nz, player.y)) && !blocked(nx, nz, player.y + 1.05) && !blocked(player.x, player.z, player.y + 1.05)) { const up = footAt(nx, nz, player.y + 1.1); if (up - player.y <= 1.06) player.y = up; }
    if (blocked(nx, nz, player.y)) {
      // かべ：押しこむ 向きが つよい ときだけ のぼる（ななめ入力は かべぞいに すべる・頭上に すきまが 必要）
      const bx = blocked(nx, player.z, player.y), bz = blocked(player.x, nz, player.y), il = Math.max(Math.hypot(wx, wz), 1e-3);
      const into = bx && !bz ? Math.abs(wx) / il : !bx && bz ? Math.abs(wz) / il : bx ? 1 : 0;
      const canClimb = im > .3 && !player.tired && md === 'field' && !player.swim && !(HOOK.noClimb && HOOK.noClimb()) && into > .55 && !blocked(player.x, player.z, player.y + 2.6 * dt + .02);
      if (canClimb) { wallClimb = true; player.y += 2.6 * dt; player.vy = 0; if (blocked(nx, nz, player.y)) { nx = player.x; nz = player.z; } }
      else if (!bx) nz = player.z; else if (!bz) nx = player.x; else { nx = player.x; nz = player.z; } }
    if (climbing && player.tired) { const tx = player.x + gn[0] * 2.5 * dt, tz = player.z + gn[2] * 2.5 * dt; if (!blocked(tx, tz, player.y)) { nx = tx; nz = tz; } }
    else if (!climbing && player.ground && !player.swim && gn[1] < .56 && footAt(player.x, player.z, player.y) - terr < .05) { const k = (.62 - gn[1]) * 9 * dt, tx = nx + gn[0] * k, tz = nz + gn[2] * k; if (!blocked(tx, tz, player.y)) { nx = tx; nz = tz; } } // 急な 斜面は ずり落ちる
    const pre = [nx, nz], okP = (x, z) => !blocked(x, z, player.y); // 木・岩・NPCの 押し出しで ブロックに めりこませない
    for (const t of r.trees) if (t.state === 'ok' && Math.abs(t.x - nx) < 2 && Math.abs(t.z - nz) < 2) { const dx = nx - t.x, dz = nz - t.z, rr = .45 * t.s + .3, d = Math.hypot(dx, dz); if (d < rr && d > 1e-4 && player.y < t.y + 3) { const qx = t.x + dx / d * rr, qz = t.z + dz / d * rr; if (okP(qx, qz)) { nx = qx; nz = qz; } else { nx = player.x; nz = player.z; } } }
    for (const k of r.rocks) if (k.state === 'ok' && Math.abs(k.x - nx) < 2.5 && Math.abs(k.z - nz) < 2.5) { const dx = nx - k.x, dz = nz - k.z, rr = .8 * k.s + .3, d = Math.hypot(dx, dz); if (d < rr && d > 1e-4 && player.y < k.y + 1) { const qx = k.x + dx / d * rr, qz = k.z + dz / d * rr; if (okP(qx, qz)) { nx = qx; nz = qz; } else { nx = player.x; nz = player.z; } } }
    for (const b of r.beacons || []) { const dx = nx - b.x, dz = nz - b.z, rr = 1.9, d = Math.hypot(dx, dz); if (d < rr && d > 1e-4) { const qx = b.x + dx / d * rr, qz = b.z + dz / d * rr; if (okP(qx, qz)) { nx = qx; nz = qz; } else { nx = player.x; nz = player.z; } } }
    for (const n of npcNow()) { const dx = nx - n.x, dz = nz - n.z, d = Math.hypot(dx, dz); if (d < .7 && d > 1e-4) { const qx = n.x + dx / d * .7, qz = n.z + dz / d * .7; if (okP(qx, qz)) { nx = qx; nz = qz; } else { nx = player.x; nz = player.z; } } }
    if (G.region === 2 && !G.flags.c3bridge) { const dx = nx - r.tower.x, dz = nz - r.tower.z, d = Math.hypot(dx, dz); if (d < 88) { nx = r.tower.x + dx / d * 88; nz = r.tower.z + dz / d * 88; if (barrierT <= 0) { toast('風の 結界に はばまれた……<br><span style="font-size:.6em">三つの 風の祠を ひらこう</span>', 1800); barrierT = 3; } } }
    if ((nx !== pre[0] || nz !== pre[1]) && blocked(nx, nz, player.y) && !blocked(player.x, player.z, player.y)) { nx = player.x; nz = player.z; }
    const moved = Math.hypot(nx - player.x, nz - player.z); player.x = nx; player.z = nz;
    let gh = footAt(player.x, player.z, player.y); if (gh < -1.0 && G.region !== 2) gh = -1.0;
    let inUD = null; if (G.region === 2) for (const u of r.updrafts) if (Math.abs(player.x - u.x) < u.r && Math.abs(player.z - u.z) < u.r && Math.hypot(player.x - u.x, player.z - u.z) < u.r && player.y < u.top) { inUD = u; break; }
    if (jumpReq && md === 'field') {
      if (player.ground && !player.swim) { player.vy = 8.4; player.ground = false; }
      else if (player.glide) player.glide = false;
      else if (!player.ground && !wallClimb && G.flags.glider && G.region !== 3 && !player.tired && G.stam > 1) { player.glide = true; player.deploy = 0; Music.sfx('wind'); }
    }
    jumpReq = false;
    if (inUD && !player.ground && !player.glide && G.flags.glider && !player.tired && G.stam > 1 && !wallClimb && player.vy < 2) { player.glide = true; player.deploy = 0; Music.sfx('wind'); }
    if (wallClimb) player.ground = false;
    else if (player.glide) { player.deploy = Math.min(1, (player.deploy || 0) + dt / .45); const base = G.flags.glider2 ? 1.25 : 1.6;
      const sink = -(base + Math.pow(Math.abs(player.bank || 0), 1.4) * 2.6 + Math.max(0, (player.gSpd || 0) - (G.flags.glider2 ? 10.5 : 8)) * .35) * (player.y - gh < 1.6 ? .45 : 1);
      if (inUD) player.vy = Math.min(player.vy + 30 * dt * player.deploy, 9.5); else player.vy = lerp(player.vy, sink, Math.min(1, dt * (player.vy < sink ? 2.6 + 3 * player.deploy : 1.4)));
      player.y += player.vy * dt; }
    else { player.vy -= (G.region === 3 ? 11 : 22) * dt; if (G.region === 3) player.vy = Math.max(player.vy, -7); player.y += player.vy * dt; }
    if ((player.vy > 0 || wallClimb) && blocked(player.x, player.z, player.y)) { const y0 = player.y - Math.max(player.vy, 2.6) * dt; if (!blocked(player.x, player.z, y0)) { player.y = y0; player.vy = Math.min(player.vy, 0); } } // 天井に 頭を ぶつける
    const water = G.region !== 2 && G.region !== 3 && hAt(player.x, player.z) < -1.2;
    if (player.ground || player.glide || wallClimb || player.swim || inUD || G.region === 3) player.fallTop = player.y; else player.fallTop = Math.max(player.fallTop ?? player.y, player.y);
    if (player.y <= gh) { const drop = (player.fallTop ?? gh) - gh, wasAir = !player.ground, vIn = player.vy;
      if (wasAir && vIn < -6.5) { for (let k = 0; k < 3; k++) puffs.push({ x: player.x + (R() - .5) * .8, y: gh + .1, z: player.z + (R() - .5) * .8, t: 0, big: 1 }); Music.sfx('step'); player.sq = clamp(-vIn / 22, .2, .7); }
      player.y = gh; player.vy = 0; player.ground = true; player.glide = false; player.fallTop = gh;
      if (wasAir && !water && drop > FALL_SAFE && md === 'field') fallHurt(drop); }
    else if (player.y > gh + .15) player.ground = false;
    if (player.sq > 0) player.sq = Math.max(0, player.sq - dt * 4);
    dustT -= dt; if (sprint && player.ground && hsp0() > 6 && dustT <= 0) { dustT = .2; puffs.push({ x: player.x - Math.sin(player.yaw) * .4, y: player.y + .05, z: player.z - Math.cos(player.yaw) * .4, t: 0 }); }
    if (player.glide) { glideT -= dt; if (glideT <= 0) { glideT = .06; const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw); for (const sx of [-1, 1]) streaks.push({ x: player.x + rx * sx * 1.3, y: player.y + 2.5, z: player.z + rz * sx * 1.3, t: 0 }); } }
    const using = (sprint ? 14 : 0) + ((climbing && im > .1) || wallClimb ? 12 : 0) + (player.glide && !G.flags.glider3 ? (G.flags.glider2 ? 2.2 : 4.5) * (inUD ? .5 : 1) : 0) + (player.swim ? (im > .05 ? 7 : 2) : 0);
    if (using > 0) G.stam = Math.max(0, G.stam - using * dt); else if (player.ground && !player.swim) G.stam = Math.min(G.stamMax, G.stam + (moved < .01 ? 40 : 26) * dt);
    if (G.stam <= 0) { player.tired = true; player.glide = false; } if (player.tired && G.stam > G.stamMax * .35) player.tired = false;
    if (player.swim && G.stam <= 0) { toast('おぼれかけて、岸に もどった……', 1600); const s = player.safe || r.pier; player.x = s.x; player.z = s.z; player.y = surfaceAt(s.x, s.z, 99); G.stam = G.stamMax * .5; player.tired = false; }
    if (player.ground && !player.swim && terr > (G.region === 2 ? 3 : .2) && !blocked(player.x, player.z, player.y)) player.safe = { x: player.x, z: player.z };
    goodT -= dt; if (goodT <= 0 && player.ground && !player.swim && !wallClimb) { goodT = .4; if (!blocked(player.x, player.z, player.y) && [[.5, 0], [-.5, 0], [0, .5], [0, -.5]].filter(([a, b]) => !blocked(player.x + a, player.z + b, player.y)).length >= 2) player.good = { x: player.x, y: player.y, z: player.z, r: G.region }; }
    if (G.region === 2 && player.y < -22) { const s = player.safe || r.pier; player.x = s.x; player.z = s.z; player.y = surfaceAt(s.x, s.z, 99) + .5; player.vx = player.vz = player.vy = 0; player.glide = false; trail.length = 0;
      battleParty().forEach(m => { m.hp = Math.max(1, m.hp - Math.round(m.st.hp * .1)); }); G.stam = Math.max(G.stam, G.stamMax * .5); player.tired = false; toast('雲海に 落ちた……<br><span style="font-size:.6em">みんなの HPが 少し へった</span>', 1800); }
    barrierT -= dt;
    player.climb = climbing || wallClimb;
    const hsp = Math.hypot(player.vx, player.vz);
    if (hsp > .3 && md === 'field') { let d = Math.atan2(player.vx, player.vz) - player.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); player.yaw += d * Math.min(1, dt * 10); }
    player.phase += hsp * dt * 2.1;
    trailAcc += moved; if (trailAcc > .35 || !trail.length) { trail.unshift({ x: player.x, z: player.z, y: player.y, yaw: player.yaw }); trailAcc = 0; if (trail.length > 40) trail.pop(); }

    // ---- resources ----
    r.trees.forEach((t, i) => { let s = t.s; if (t.shake > 0) { t.shake = Math.max(0, t.shake - dt * 3); s *= 1 + Math.sin(T * 50) * .04 * t.shake; }
      if (t.state === 'fall') { t.t += dt; s *= Math.max(0, 1 - t.t * 2); if (t.t > .5) { t.state = 'gone'; t.t = 0; } }
      else if (t.state === 'gone') { t.t += dt; s = 0; if (t.t > 90 && Math.hypot(t.x - player.x, t.z - player.z) > 20) { t.state = 'grow'; t.t = 0; } }
      else if (t.state === 'grow') { t.t += dt; s *= Math.min(1, t.t / 2); if (t.t > 2) t.state = 'ok'; }
      mTree.set(i, t.x, t.y, t.z, s, t.r); }); mTree.n = r.trees.length;
    r.rocks.forEach((k, i) => { let s = k.s; if (k.shake > 0) { k.shake = Math.max(0, k.shake - dt * 3); s *= 1 + Math.sin(T * 60) * .03 * k.shake; }
      if (k.state === 'fall') { k.t += dt; s *= Math.max(0, 1 - k.t * 3); if (k.t > .35) { k.state = 'gone'; k.t = 0; } }
      else if (k.state === 'gone') { k.t += dt; s = 0; if (k.t > 120 && Math.hypot(k.x - player.x, k.z - player.z) > 20) k.state = 'ok'; }
      mRock.set(i, k.x, k.y, k.z, s, k.r); }); mRock.n = r.rocks.length;
    r.bushes.forEach((b, i) => { if (!b.has) { b.t += dt; if (b.t > 50) b.has = true; } mBush.set(i, b.x, b.y, b.z, b.s, b.r); mBerry.set(i, b.x, b.y, b.z, b.has ? b.s : 0, b.r); }); mBush.n = mBerry.n = r.bushes.length;
    r.shrooms.forEach((s, i) => { if (!s.has) { s.t += dt; if (s.t > 70) s.has = true; } mShroom.set(i, s.x, s.y, s.z, s.has ? s.s : 0, s.r); }); mShroom.n = r.shrooms.length;
    let si = 0; for (const s of r.seeds) { if (G.seedGot[s.id]) continue; const d = Math.hypot(s.x - player.x, s.z - player.z);
      if (d < 1.6 && Math.abs(player.y - s.y) < 2.5 && md === 'field') { G.seedGot[s.id] = 1; G.seeds++; Music.sfx('friend'); toast(`ひかりの種を 見つけた！（${Object.keys(G.seedGot).length}/${SEED_N()}）`, 1800); continue; }
      if (d < 70 && si < 30) mSeed.set(si++, s.x, s.y + Math.sin(T * 2 + s.x) * .1, s.z, 1, T); } mSeed.n = si;
    mShard.n = 0; if (G.region === 0 && !r.beacons[0].lit) { const st = G.trial[0]; st.got = st.got || []; r.beacons[0].shards.forEach((sh, k) => { if (st.got.includes(k)) return;
      if (Math.hypot(sh.x - player.x, sh.z - player.z) < 1.6 && Math.abs(player.y - sh.y) < 2.5 && md === 'field') { st.got.push(k); st.shards = st.got.length; Music.sfx('friend'); toast(`灯の欠片を 手に入れた！（${st.shards}/3）`, 1800); return; }
      mShard.set(mShard.n++, sh.x, sh.y + Math.sin(T * 2 + k) * .15, sh.z, 1, T); }); }
    mFeather.n = 0; if (G.region === 2 && G.flags.c3elder && !G.wind[1]) { const st = G.wtrial[1]; st.got = st.got || []; r.feathers.forEach((f, k) => { if (st.got.includes(k)) return;
      if (Math.hypot(f.x - player.x, f.z - player.z) < 2.4 && Math.abs(player.y - f.y) < 2.8 && md === 'field') { st.got.push(k); st.seen = 1; Music.sfx('friend'); toast(`風の羽を 手に入れた！（${st.got.length}/3）`, 1800); save(); return; }
      mFeather.set(mFeather.n++, f.x, f.y + Math.sin(T * 2 + k) * .25, f.z, 1.3, T * 1.5); }); }
    mSkyRock.n = 0; if (G.region === 2) { r.skyRocks.forEach((k, i) => mSkyRock.set(i, k.x, k.y + Math.sin(T * .3 + k.ph) * .8, k.z, k.s, k.r + T * .01)); mSkyRock.n = r.skyRocks.length; }
    if (G.region === 2 && G.flags.c3arrive) { const w = r.whale; mWhale.set(0, w.x, w.y + Math.sin(T * .7) * .6, w.z, 3.4, Math.PI / 2 + Math.sin(T * .3) * .1); mWhale.n = 1; } else mWhale.n = 0;
    if (G.region === 0) { r.beacons.forEach((b, i) => mBeacon.set(i, b.x, b.y, b.z, 1, i * .7)); mBeacon.n = 5; mShrine.set(0, r.shrine.x, r.shrine.y, r.shrine.z, 1, 0); mShrine.n = 1; } else { mBeacon.n = 0; mShrine.n = 0; }
    mShip.set(0, r.ship.x, -.2 + Math.sin(T * .8) * .12, r.ship.z, 1, r.ship.yaw + Math.sin(T * .6) * .03); mShip.n = G.region !== 2 && (G.region === 1 || G.flags.c2start) ? 1 : 0;
    let ci = 0; for (const c of r.chests) if (!G.chests[c.id] && ci < 16) mChest.set(ci++, c.x, c.y, c.z, 1, 0); mChest.n = ci;
    if (r.board) { mBoard.set(0, r.board.x, surfaceAt(r.board.x, r.board.z, 99), r.board.z, 1, 0); mBoard.n = 1; } else mBoard.n = 0;
    if (r.altar) { mAltar.set(0, r.altar.x, r.altar.y, r.altar.z, 1, 0); mAltar.n = 1; } else mAltar.n = 0;
    mFire.set(0, r.fire.x, surfaceAt(r.fire.x, r.fire.z, 99), r.fire.z, 1, 0); mFire.n = 1;
    mH.statue.set(0, r.statue.x, surfaceAt(r.statue.x, r.statue.z, 99), r.statue.z, 1.25, 0); mH.statue.n = 1;

    for (const f of HOOK.frame) f(dt, T, r, md, night);
    // ---- characters ----
    const walkBob = player.ground ? Math.abs(Math.sin(player.phase)) * .07 : 0;
    const sq = player.sq || 0; mH.sora.set(0, player.x, player.swim ? player.y - .1 + Math.sin(T * 2.2) * .06 : player.y + walkBob, player.z, 1 - sq * .09, player.yaw); mH.sora.n = 1; // 着地で ぐっと しずむ・水面で ゆれる
    if (player.glide) { player.fold = 1; const d = player.deploy || 0, e = d < 1 ? 1 + 2.2 * Math.pow(d - 1, 3) + 1.2 * Math.pow(d - 1, 2) : 1; const sw = Math.sin(T * 1.7) * .03 + Math.sin(T * 3.1) * .015;
      mGlider.set(0, player.x, player.y - (1 - d) * .6, player.z, Math.max(.15, e), player.yaw, (player.bank || 0) + sw); }
    else if (player.fold > 0) { player.fold = Math.max(0, player.fold - dt * 2.6); const f = player.fold; mGlider.set(0, player.x - Math.sin(player.yaw) * (1 - f) * 1.2, player.y - (1 - f) * 1.4, player.z - Math.cos(player.yaw) * (1 - f) * 1.2, .3 + f * .7, player.yaw, (player.bank || 0) * f); if (!f) mGlider.n = 0; }
    else mGlider.n = 0;
    for (const k in mSp) mSp[k].n = 0;
    for (const k in mH) if (k !== 'sora' && k !== 'statue') mH[k].n = 0;
    const team = battleParty(); const followers = team.filter(m => m.id !== 'sora');
    followers.forEach((m, i) => { const tp = followPos(m, i, dt); if (tp.hide) return;
      const y = tp.y;
      if (m.kind === 'human') { mH[m.id].set(0, tp.x, y + walkBob, tp.z, 1, tp.yaw); mH[m.id].n = 1; }
      else { const ms = mSp[m.id]; const S = SPC[m.id]; ms.set(ms.n++, tp.x, y + Math.abs(Math.sin(T * 6 + i)) * .12 + (S.arch === 'sprite' || S.arch === 'bird' ? .4 : 0), tp.z, (S.size || 1) * .9, tp.yaw + (m.shiny ? 100 : 0)); } });
    for (const n of npcNow()) { const m = mH[n.id]; if (!m || followers.some(f => f.id === n.id)) continue; const d = Math.hypot(player.x - n.x, player.z - n.z); const ty = d < 6 ? Math.atan2(player.x - n.x, player.z - n.z) : n.baseYaw;
      let yd = ty - n.yaw; yd = Math.atan2(Math.sin(yd), Math.cos(yd)); n.yaw += yd * Math.min(1, dt * 4);
      m.set(0, n.x, surfaceAt(n.x, n.z, 99), n.z, 1, n.yaw); m.n = 1; }

    for (const f of HOOK.actors) f((sp, x, y, z, sc, yaw) => { const ms = mSp[sp]; if (ms && ms.n < 12) ms.set(ms.n++, x, y, z, sc, yaw); }, T, dt);
    if (DEBUG && window.__lineup) { let i = 0; for (const k in mH) { if (k === 'statue') continue; mH[k].set(0, player.x - 4.6 + i * .58, surfaceAt(player.x - 4.6 + i * .58, player.z + 3.2, 99), player.z + 3.2, 1, Math.PI); mH[k].n = 1; i++; } }
    // ---- enemies ----
    if (md === 'field' && G.flags.metGen) spawnEnemies(dt, night);
    cool = Math.max(0, cool - dt);
    shinyFx = [];
    for (const e of enemies) { const d = Math.hypot(player.x - e.x, player.z - e.z);
      if (md === 'field') { const ox = e.x, oz = e.z;
        if (d < (e.tut ? 5 : 12) && cool <= 0 && !player.glide) moveEntity(e, player.x, player.z, (night > .5 ? 5.2 : 4.3) * (e.legend ? .6 : 1), dt);
        else { e.wt -= dt; if (e.wt <= 0) { e.tx = e.hx + (R() - .5) * 16; e.tz = e.hz + (R() - .5) * 16; e.wt = 3 + R() * 4; } moveEntity(e, e.tx, e.tz, 1.4, dt); }
        if (G.region === 2 && !e.fixedY && hAt(e.x, e.z) < 4) { e.x = e.px ?? e.hx; e.z = e.pz ?? e.hz; e.wt = 0; }
        if (!e.fixedY && blocked(e.x, e.z, e.y) && !blocked(ox, oz, e.y)) { e.x = ox; e.z = oz; e.wt = 0; } // 魔物も かべを すりぬけない
        e.px = e.x; e.pz = e.z;
        if (d < 1.3 && cool > 0 && Math.abs(player.y - e.y) < 2.5 && !player.glide) { const u = Math.max(d, .05); player.vx += (player.x - e.x) / u * 30 * dt; player.vz += (player.z - e.z) / u * 30 * dt; } // にげた あと ふれたら 軽く おしかえす
        if (d < 1.5 && cool <= 0 && Math.abs(player.y - e.y) < 2.5) { const ee = e; cool = .5; run(async () => { const res = await runBattle(ee.group);
          if (res === 'win') enemies = enemies.filter(x => x !== ee); else if (res === 'flee') cool = 3; else await defeated(); if (res !== 'lose') Music.play(fieldSong()); }); }
      }
      e.y = e.fixedY ?? Math.max(surfaceAt(e.x, e.z, (e.y ?? hAt(e.x, e.z)) + .5), -.5); const lead = e.group[0]; const S = SPC[lead.sp]; const ms = mSp[lead.sp];
      if (ms.n < 14) ms.set(ms.n++, e.x, e.y + (S.arch === 'sprite' || S.arch === 'bird' || S.arch === 'fish' ? .6 + Math.sin(T * 2 + e.hx) * .2 : Math.abs(Math.sin(T * 3 + e.hx)) * .15), e.z, (e.legend ? 1 : -1) * (S.size || 1) * (1.05 + e.group.length * .08), e.yaw);
      if (e.group.some(g => g.shiny) && d < 40) shinyFx.push([e.x, e.y + 1.6, e.z]); }
    let gi = 0; if (G.region === 0) for (const b of r.beacons) if (!b.guard) { const a = Math.atan2(-b.x, -b.z); mGuard.set(gi++, b.x + Math.sin(a) * 3.2, b.y + .3 + Math.sin(T * 1.5 + b.i) * .15, b.z + Math.cos(a) * 3.2, .8 + G.order * .12, a); }
    if (G.region === 1 && G.flags.c2rumor && !G.flags.c2mid) mGuard.set(gi++, r.midboss.x, r.midboss.y + .2, r.midboss.z, 1, 0);
    if (G.region === 2 && G.flags.c3elder) { for (const sh of r.shrines) if (!G.wind[sh.i] && !G.wtrial[sh.i].guard) mGuard.set(gi++, sh.x, sh.y + 1.5 + Math.sin(T * 1.5 + sh.i) * .3, sh.z - 3.2, 1.1, T * .4); if (G.flags.c3bridge && !G.flags.c3mid) mGuard.set(gi++, r.midboss.x, r.midboss.y + 1, r.midboss.z, 1.4, 0); }
    mGuard.n = gi;
    if (G.region === 0 && G.flags.shrineOpen && !G.flags.cleared) { mKing.set(0, r.shrine.x, r.shrine.y + .3 + Math.sin(T) * .2, r.shrine.z + 3, 1.3, 0); mKing.n = 1; }
    else if (G.region === 1 && G.flags.c2mid && !G.flags.c2done) { mKing.set(0, r.altar.x, r.altar.y + 1, r.altar.z, 1.1, T * .3); mKing.n = 1; }
    else if (G.region === 2 && G.flags.c3mid && !G.flags.c3done) { mKing.set(0, r.altar.x, r.altar.y + 1.5 + Math.sin(T) * .3, r.altar.z - 2.5, 1.5, T * .2); mKing.n = 1; } else mKing.n = 0;

    // ---- target & HUD ----
    target = md === 'field' && !player.glide ? findTarget() : null;
    const lab = $('tlabel');
    if (target) { const y = target.type === 'npc' ? surfaceAt(target.x, target.z, 99) + 2.3 : target.type === 'wshrine' || target.type === 'altar3' ? target.o.y + 2.4 : target.type === 'whale' ? player.y + 2.2 : target.type === 'beacon' ? target.o.y + 5 : target.type === 'shrine' ? r.shrine.y + 4 : (target.o.y ?? surfaceAt(target.x, target.z, 99)) + 2.2;
      const s = World.project([target.x, y, target.z]); if (s) { lab.hidden = false; lab.style.transform = `translate(${s[0]}px,${s[1]}px) translate(-50%,-100%)`; lab.innerHTML = `${COARSE ? '' : '<kbd>E</kbd> '}${actLabel(target)}`; } else lab.hidden = true; }
    else lab.hidden = true;
    $('btnAct').classList.toggle('ready', !!target); $('btnActLabel').textContent = target ? actLabel(target) : 'しらべる';
    $('btnJump').textContent = !player.ground && G.flags.glider ? (player.glide ? 'とじる' : '滑空') : '跳ぶ';
    const ob = (HOOK.track && HOOK.track()) || objective(); if (ob.t !== frameBody.obj) { frameBody.obj = ob.t; $('obj').innerHTML = objHTML(ob.t); const o = $('obj'); o.classList.remove('fresh'); void o.offsetWidth; o.classList.add('fresh'); clearTimeout(frameBody.objT); frameBody.objT = setTimeout(() => o.classList.remove('fresh'), 6000); }
    if (ob.p) { const d = Math.hypot(ob.p.x - player.x, ob.p.z - player.z); const ang = Math.atan2(ob.p.x - player.x, ob.p.z - player.z) - cam.yaw;
      $('arrow').style.transform = `rotate(${-ang}rad)`; $('guideD').textContent = d < 6 ? 'ここ' : `${Math.round(d)}m`; $('guide').hidden = false; } else $('guide').hidden = true;
    songCheck -= dt; if (songCheck <= 0 && !B.active && !Music.busy) { songCheck = 1; const want = fieldSong(); if (Music.current !== want) Music.play(want); }
    hudT -= dt; if (hudT <= 0) { hudT = .3; hud(); } stamHud();
    saveT += dt; if (saveT > 60 && md === 'field' && player.ground && !player.swim) { saveT = 0; save(); }
  }

  // ---- camera ----（臨界減衰の 追従・壁/地形の 遮蔽・最短2.2は 見下ろしで かわす・ゆっくり 戻る）
  const tgt = camFollow(dt); let eye = camSolve(tgt, dt, md);
  if (phase === 'field') { const hd = Math.hypot(eye[0] - player.x, eye[1] - player.y - 1.6, eye[2] - player.z); if (hd < 1.2) { mH.sora.n = 0; mGlider.n = 0; } }
  cam.eye = eye;
  if (phase === 'title' || phase === 'splash') { const a = T * .03; eye = [Math.cos(a) * 60, 32, Math.sin(a) * 60]; tgt[0] = 0; tgt[1] = 8; tgt[2] = 0; }

  // ---- fx ----
  const fx = [];
  if (G.region === 0) r.beacons.forEach(b => { if (!b.lit) return; b.t += dt; const g = smooth(0, 1.2, b.t), top = b.fireAt;
    fx.push({ type: 2, p: [top[0], top[1] + 45, top[2]], size: [1.3, 45], grow: g, cyl: true }); fx.push({ type: 1, p: [top[0], top[1] + .9, top[2]], size: [7, 7], grow: g });
    fx.push({ type: 0, p: [top[0], top[1] + 1.05 * g, top[2]], size: [1.05 * g, 1.3 * g], grow: g, seed: b.i * 3.1, cyl: true }); });
  if (G.region === 0 && G.flags.shrineOpen && !G.flags.cleared) fx.push({ type: 2, p: [r.shrine.x, r.shrine.y + 50, r.shrine.z], size: [2.2, 50], grow: 1, cyl: true, tint: [.6, .4, 1] });
  if (phase === 'field') for (const f of HOOK.fx) f(fx, dt, T, r, night);
  if (G.region === 2 && phase === 'field') {
    for (const u of r.updrafts) { const d = Math.hypot(u.x - player.x, u.z - player.z); if (d > 170) continue; const bot = u.spire ? hAt(u.x, u.z) : Math.max(hAt(u.x, u.z), -24), span = u.top - bot;
      fx.push({ type: 2, p: [u.x, bot + span / 2, u.z], size: [u.r * .9, span / 2 + 2], grow: 4, cyl: true, tint: [.6, 1, .9] });
      // 上昇気流の リング：カメラに 近いほど うすく、画面上の 大きさは 視野の 一部に おさえる（近くで 白い 大円に ならない）
      if (d < 90) for (let k = 0; k < 4; k++) { const y = bot + ((T * 7 + k * span / 4) % span); const cd = Math.hypot(u.x - eye[0], y - eye[1], u.z - eye[2]);
        const near = Math.max(0, Math.min(1, (cd - 7) / 14)); if (near <= 0) continue; const sz = Math.min(u.r * .6, cd * .28);
        fx.push({ type: 3, p: [u.x, y, u.z], size: [sz, sz], grow: .38 * near * (1 - Math.abs(y - bot - span / 2) / span), tint: [.7, 1, .95], seed: k + u.x }); } }
    r.shrines.forEach(sh => { if (G.wind[sh.i]) fx.push({ type: 2, p: [sh.x, sh.y + 45, sh.z], size: [1.4, 45], grow: 3, cyl: true, tint: [.5, 1, .9] }); });
    if (!G.flags.c3bridge) for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283 + T * .02; fx.push({ type: 2, p: [r.tower.x + Math.cos(a) * 88, 40, r.tower.z + Math.sin(a) * 88], size: [7, 60], grow: 3, cyl: true, tint: [.6, .45, 1] }); }
    if (!G.flags.c3done) fx.push({ type: 2, p: [r.altar.x, r.altar.y + 60, r.altar.z], size: [2.5, 60], grow: 3, cyl: true, tint: [.7, .55, 1] });
    if (G.flags.c3elder && !G.wind[1]) r.feathers.forEach((f, k) => { if (!(G.wtrial[1].got || []).includes(k)) fx.push({ type: 1, p: [f.x, f.y + .7, f.z], size: [3, 3], grow: 2, tint: [.7, 1, .95] }); }); }
  if (G.region === 1 && !G.flags.c2done) fx.push({ type: 2, p: [World.RUINS1[0], 60, World.RUINS1[1]], size: [2.5, 55], grow: 1, cyl: true, tint: [.7, .6, 1] });
  if (r.fire) { const fp = [r.fire.x, surfaceAt(r.fire.x, r.fire.z, 99), r.fire.z]; fx.push({ type: 1, p: [fp[0], fp[1] + .6, fp[2]], size: [3, 3], grow: 1 }); fx.push({ type: 0, p: [fp[0], fp[1] + .55, fp[2]], size: [.45, .6], grow: 1, cyl: true, seed: 7 }); }
  if (phase === 'field') for (const s of r.seeds) if (!G.seedGot[s.id] && Math.hypot(s.x - player.x, s.z - player.z) < 30) fx.push({ type: 1, p: [s.x, s.y + .6, s.z], size: [1.4, 1.4], grow: 1.6, tint: [.6, 1, .5] });
  for (const p of shinyFx) fx.push({ type: 3, p, size: [.8, .8], grow: 1, tint: [1, .95, .6], seed: p[0] });
  { const sandy = G.region === 1 && World.biomeAt(player.x, player.z) === 'desert'; const tint = sandy ? [.9, .78, .55] : G.region === 2 ? [.95, .97, 1] : [.85, .82, .72];
    for (let k = puffs.length - 1; k >= 0; k--) { const q = puffs[k]; q.t += dt; if (q.t > .6) { puffs.splice(k, 1); continue; } const g = 1 - q.t / .6, sz = (q.big ? 1.1 : .5) * (.5 + q.t * 2);
      fx.push({ type: 1, p: [q.x, q.y + q.t * .6, q.z], size: [sz, sz], grow: g * (q.big ? 2.2 : 1.4), tint }); }
    for (let k = streaks.length - 1; k >= 0; k--) { const q = streaks[k]; q.t += dt; if (q.t > .45) { streaks.splice(k, 1); continue; } fx.push({ type: 1, p: [q.x, q.y, q.z], size: [.35, .35], grow: (1 - q.t / .45) * 2.5, tint: [.9, 1, 1] }); }
    if (puffs.length > 40) puffs.splice(0, puffs.length - 40); if (streaks.length > 30) streaks.splice(0, streaks.length - 30); }
  const lightMon = battleParty().some(m => m.kind === 'mon' && SPC[m.id].type === 'light');
  const lan = [player.x + Math.cos(player.yaw) * .44 + Math.sin(player.yaw) * .14, player.y + .85, player.z - Math.sin(player.yaw) * .44 + Math.cos(player.yaw) * .14, lightMon ? 2.6 : 1.6];
  fx.push({ type: 1, p: lan.slice(0, 3), size: [.9, .9], grow: night * .5 });
  const beaconU = new Float32Array(20); if (G.region === 0) r.beacons.forEach((b, i) => beaconU.set([b.fireAt[0], b.fireAt[1] + .25, b.fireAt[2], b.lit ? 1 : 0], i * 4));
  if (G.region === 0 && phase === 'field') { const b0 = r.beacons[0]; if (!b0.lit) b0.shards.forEach((sh, k) => { if (!(G.trial[0].got || []).includes(k)) fx.push({ type: 1, p: [sh.x, sh.y + .7, sh.z], size: [1.6, 1.6], grow: 1.5, tint: [1, .8, .35] }); }); }
  let ghost = null; if (G.build && md === 'field') { const [x, y, z] = buildCell(); ghost = [x, y, z, G.mat]; }
  if (DEBUG) { const hid = window.__norender ? 'hidden' : ''; if (cv.style.visibility !== hid) cv.style.visibility = hid; }
  let rEye = eye, rTgt = tgt; if (B.active && B.d3 && HOOK.b3dFrame) { const c = HOOK.b3dFrame(dt, T); if (c) { rEye = c.eye; rTgt = c.tgt; } }
  if (!(DEBUG && window.__norender) && !B.stage) World.render({ eye: rEye, tgt: rTgt, tod: G.tod, T, player: [player.x, player.y, player.z], lantern: lan, beaconU, fx, ghost, darkness, stars: G.flags.c3done ? 1.7 : G.flags.c3start ? .35 : 1 });
  if (B.active && B.d3 && HOOK.b3dAnchors) HOOK.b3dAnchors();
  dlgUpdate(dt); Music.tick();
  if (DEBUG) { window.__fc = (window.__fc || 0) + 1; window.__md = md; }
}

// ================= boot =================
World.resize(); addEventListener('resize', () => World.resize());
requestAnimationFrame(frame);
$('splash').addEventListener('click', async () => {
  Music.init(); try { await document.documentElement.requestFullscreen?.(); await screen.orientation?.lock?.('landscape'); } catch (_) {}
  $('splash').hidden = true; phase = 'title'; Music.play('title'); $('title').hidden = false; $('btnCont').hidden = !hasSave();
});
function showSlots(mode, ch) { const box = $('slotMenu'); $('titleMenu').hidden = true; box.hidden = false;
  const btns = [1, 2, 3].map(n => { const inf = slotInfo(n); return `<button class="t-btn slot" type="button" data-n="${n}" ${mode === 'load' && !inf ? 'disabled' : ''}><b>きろく ${n}</b><small>${inf ? `${esc(inf.name)}　${inf.ch}　Lv${inf.lv}　${inf.time}` : 'ー　あき　ー'}</small></button>`; }).join('');
  box.innerHTML = `<p class="slot-h">${mode === 'load' ? 'つづきから：きろくを えらぶ' : `第${ch}章から：どこに きろくする？`}</p>${btns}<button class="t-btn" type="button" data-back="1">もどる</button>`;
  box.querySelector('[data-back]').onclick = () => { Music.sfx('cancel'); box.hidden = true; $('titleMenu').hidden = false; };
  box.querySelectorAll('.slot').forEach(b => b.onclick = () => { const n = +b.dataset.n, inf = slotInfo(n);
    if (mode === 'new' && inf && !b.dataset.arm) { b.dataset.arm = 1; b.classList.add('warn'); b.querySelector('small').textContent = '上書き されます。もう一度 タップ'; Music.sfx('cancel'); return; }
    Music.sfx('ok'); SLOT = n; box.hidden = true;
    if (mode === 'load') { if (!load()) { toast('きろくが 読みこめなかった'); $('titleMenu').hidden = false; return; } $('title').hidden = true; World.setRegion(G.region);
      if (G.pos && isFinite(G.pos.x + G.pos.z)) { player.x = G.pos.x; player.z = G.pos.z; player.y = footAt(player.x, player.z, G.pos.y != null && isFinite(G.pos.y) ? G.pos.y + .5 : 99); } player.safe = { x: REGr().town.x + 2, z: REGr().town.z + 4 };
      if (blocked(player.x, player.z, player.y) && !depen(player)) { player.x = player.safe.x; player.z = player.safe.z; player.y = footAt(player.x, player.z, 99); } // 古い セーブで めりこんで いても 出す
      if (G.region === 2 && hAt(player.x, player.z) < 3) { player.x = player.safe.x; player.z = player.safe.z; player.y = surfaceAt(player.x, player.z, 99); } startField(); toast(`きろく ${n} から つづき`); }
    else { G.startCh = ch; $('nameForm').hidden = false; $('nameIn').focus(); } }); }
$('btnCont').addEventListener('click', () => { Music.sfx('ok'); showSlots('load'); });
$('btnNew').addEventListener('click', () => { Music.sfx('ok'); showSlots('new', 1); });
$('btnCh2').addEventListener('click', () => { Music.sfx('ok'); showSlots('new', 2); });
$('btnCh3').addEventListener('click', () => { Music.sfx('ok'); showSlots('new', 3); });
$('nameForm').addEventListener('submit', async e => { e.preventDefault(); const v = $('nameIn').value.trim().slice(0, 6); G.name = v || 'ソラ'; Music.sfx('ok'); $('title').hidden = true;
  for (const f of HOOK.init) f(G);
  if (HOOK.startCh && HOOK.startCh[G.startCh]) { await HOOK.startCh[G.startCh](); } else if (G.startCh === 3) { setupCh3(); startField(); await wait(300); run(talkTsumugi); } else if (G.startCh === 2) { setupCh2(); startField(); await wait(300); run(talkKurou); } else await opening(); });
function setupCh2() {
  Object.assign(G.flags, { metYui: 1, metGen: 1, metNagi: 1, mio: 1, cleared: 1, shrineOpen: 1 }); G.order = 5; REG[0].beacons.forEach(b => { b.lit = true; b.guard = true; });
  G.eq.sora.w = 2; HUMAN_IDS.forEach(k => G.eq[k].a = 2); Object.assign(G.flags, { glider: 1 }); G.warp = true; G.stamMax = 120; G.stam = 120; G.hpPct = .1; G.bosses = 7;
  G.trial = [{ seen: 1, shards: 3, got: [0, 1, 2] }, { seen: 1 }, { seen: 1, waves: 3 }, { seen: 1 }, { seen: 1 }]; G.sp = { sora: 0, mio: 0, riku: 0, sana: 0 }; G.rankClaimed = { D: 1, C: 1, B: 1 };
  G.party = [mkHuman('sora', 18), mkHuman('mio', 18), mkHuman('riku', 18)];
  G.mons = [mkMon('watafuwari', 17)]; G.dex.got.watapoko = 1; G.dex.seen.watapoko = 1; G.dex.got.watafuwari = 1; G.dex.seen.watafuwari = 1; G.gold = 900; G.inv.pan = 3; G.inv.mi = 6; G.inv.maki = 6; G.inv.ishi = 4; G.team = [];
  ['sora', 'mio', 'riku', 'kaito', 'yui', 'gen', 'nagi', 'yomi'].forEach(k => G.met[k] = true);
  fixTeam(); player.x = 1; player.z = 8; player.y = surfaceAt(1, 8, 99); }
function setupCh3() {
  setupCh2(); Object.assign(G.flags, { c2start: 1, c2arrive: 1, dex: 1, c2rumor: 1, c2mid: 1, c2done: 1 }); G.region = 1; World.setRegion(1);
  G.sp = { sora: 0, mio: 0, riku: 0, sana: 0, haru: 0, kaito: 0 }; G.board = { sora: [], mio: [], riku: [], sana: [], haru: [], kaito: [] };
  G.party = [mkHuman('sora', 29), mkHuman('mio', 29), mkHuman('riku', 29), mkHuman('sana', 29)];
  for (const m of G.party) { for (const n of DATA.boards[m.id]) { if (n.req && !G.board[m.id].includes(n.req)) continue; if (G.sp[m.id] >= n.cost) { G.sp[m.id] -= n.cost; G.board[m.id].push(n.id); } } calc(m); m.hp = m.st.hp; m.mp = m.st.mp; } G.eq.sora.w = 4; G.eq.mio.w = 2; G.eq.riku.w = 2; G.eq.sana.w = 1; HUMAN_IDS.forEach(k => G.eq[k].a = 4);
  G.mons = [mkMon('watafuwari', 28), mkMon('sunawaniking', 27), mkMon('homura', 27)]; ['watapoko', 'watafuwari', 'sunawani', 'sunawaniking', 'hibana', 'homura', 'yukiusa', 'kazetaka', 'morinoko'].forEach(k => { G.dex.seen[k] = 1; G.dex.got[k] = 1; });
  G.gold = 3000; G.inv.pan = 5; G.inv.shizuku = 4; G.inv.nakayoshi = 3; G.bosses = 10; G.stamMax = 140; G.stam = 140; G.rankClaimed = { D: 1, C: 1, B: 1, A: 1 }; G.team = [];
  ['sora', 'mio', 'riku', 'kaito', 'yui', 'gen', 'nagi', 'yomi', 'sana', 'tsumugi', 'baldo'].forEach(k => G.met[k] = true); fixTeam();
  const t = npcAt('tsumugi', 1); player.x = t.x; player.z = t.z + 3; player.y = surfaceAt(player.x, player.z, 99); }
async function opening() {
  const el = $('cut'); el.hidden = false; phase = 'cut'; Music.play('night');
  const L = ['「いってきます。 灯が 見えたら、それが 父さんだ」', 'そう 言って、灯台守の 父さんは 小舟で 夜の 海へ 出ていった。', 'その夜、島の 五つの 灯台は ひとつ残らず 消えた。', '……あれから 三年。 灯は まだ、どこにも 見えない。'];
  // タップ／Enter で 次の 行へ。 右下の「スキップ」か Esc で 全部 とばす
  let skipAll = false, poke = null; const on = e => { if (e.type === 'keydown' && !['Enter', 'Space', 'NumpadEnter', 'Escape', 'KeyE'].includes(e.code)) return; if (e.type === 'keydown') e.preventDefault();
    if (e.code === 'Escape' || (e.target && e.target.closest && e.target.closest('.cut-skip'))) skipAll = true; poke && poke(); };
  el.addEventListener('pointerdown', on); addEventListener('keydown', on, true);
  for (const l of L) { if (skipAll) break; el.innerHTML = `<p>${l}</p><button class="cut-skip" type="button" style="position:absolute;right:calc(16px + env(safe-area-inset-right,0px));bottom:14px;background:none;border:1px solid rgba(255,255,255,.35);color:#ddd;border-radius:6px;padding:6px 12px;font-size:12px">スキップ ▶▶</button><small style="position:absolute;left:0;right:0;bottom:18px;color:#999;font-size:11px;text-align:center;pointer-events:none">タップで すすむ</small>`;
    await new Promise(res => { const t = setTimeout(res, 2800); poke = () => { clearTimeout(t); poke = null; setTimeout(res, 120); }; }); }
  el.removeEventListener('pointerdown', on); removeEventListener('keydown', on, true);
  el.hidden = true; await titleCard('第1章', 'ともしびの継ぎ手'); startField(); await wait(400); run(talkYui);
}
function startField() { if (G.flags.c3done && !G.flags.c3reunion) setTimeout(() => run(async () => { await reunion(); save(); }), 600); phase = 'field'; $('hud').hidden = false; document.body.classList.add('infield'); cam.yaw = Math.atan2(REGr().town.x - player.x, REGr().town.z - player.z); camFrame(cam.yaw); player.yaw = cam.yaw; hud(); Music.play(fieldSong(), { restart: true });
  if (G.region === 0 && G.flags.shrineOpen && !G.flags.cleared) { darkTarget = 1; darkness = 1; } if (!G.blk[G.mat]) cycleMat(true); }
window.KZ = { HOOK, get G() { return G; }, shopUI0, ICON, B, mH, mSp, player, cam, REG, SPC, DEBUG, COARSE, get phase() { return phase; }, set phase(v) { phase = v; }, get busy() { return busy; }, get region() { return G.region; },
  say, who, nm, menu, panel, confirm, run, toast, tip, gain, save, load, hud, fade, wait, R, esc, $, floatText, runBattle, titleCard, cinematic, mkMon, mkHuman, calc, fixTeam, battleParty, allMembers, member, nameOf, inParty,
  defeated, fieldSong, warpTo, credits, rest, objective, need, regionName: r => REGION_NAME[r], townName: r => TOWN_NAME[r], get enemies() { return enemies; }, set enemies(v) { enemies = v; },
  surfaceAt, hAt, Blocks, blocked, footAt, depen, faceOf, typeTag, closeMenu, MENUS, releaseInputs, startField, npcAt, NPCS, rankPts, get SLOT() { return SLOT; }, keyOf, slotInfo, buildHouse, cookMenu, craftMenu, monPanel, ranch, mapImage, mapPanel, questLog, get cam2() { return cam; }, travel, shopUI, talkInn, wildLevel, setupCh3, showSlots, get trail() { return trail; }, DEX_N: () => DATA.speciesOrder.length, SEED_N };
if (DEBUG) window.__dbg = { shrineEvent, cam, calc, skyTravel2: () => skyTravel(2), get busy() { return busy; }, get phase() { return phase; }, setupCh3, skyTravel, fluteEvent, windEvent, towerGateEvent, finalEvent3, talkSoyogi, buildBridge, objective, credits, questLog, mapPanel, skillMenu, statusPanel, G: () => G, player, REG, runBattle, say, run, mkHuman, mkMon, setupCh2, startField, sail, talk, NPCS, beaconEvent, midbossEvent, altarEvent, openMenu, dexMenu, fixTeam, craftMenu,
  tp: (x, z) => { player.x = x; player.z = z; player.y = surfaceAt(x, z, 99); },
  sim: (n, dtMs = 33) => { for (let i = 0; i < n; i++) { last = performance.now() - dtMs; frameBody(last + dtMs); } }, blocked, get jumpReq() { return jumpReq; }, set jumpReq(v) { jumpReq = v; } };
})();
