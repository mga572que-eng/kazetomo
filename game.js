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
const HOOK = { frame: [], fx: [], target: [], objective: [], menu: [], load: [], init: [], song: [], push: [], battleEnd: [], mapMarks: [], quest: [], warps: [], actors: [], labels: {}, acts: {}, talks: {}, OPT: { text: 1, look: 1, calm: false, lefty: false } };

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
  ushio: { skin: '#d8b89a', hair: '#9fd8d0', hairStyle: 'long', eye: [.2, .5, .55], top: '#3a8a9a', robe: true, beard: 'big', scale: 1, shawl: '#e8f4f0', accent: '#f3c15a' },
  kai: { skin: '#e8c8a8', hair: '#3a6a8a', hairStyle: 'bob', eye: [.25, .45, .6], top: '#5ab0c0', bottom: '#2a4a5a', kid: true, accent: '#ffe08a' },
  soyogi: { skin: '#ecd9c4', hair: '#f6f6fb', hairStyle: 'floor', eye: [.45, .5, .65], top: '#e8e2f4', robe: true, kid: true, scale: .95, chime: true, stoop: true, shawl: '#b8a8e0' },
  inn: { skin: '#f0cfae', hair: '#6a4a3a', hairStyle: 'bun', top: '#b5654a', robe: true, apron: true },
  item: { skin: '#e8c4a0', hair: '#2a2a2a', hairStyle: 'short', top: '#4a7a5a', bottom: '#3a3a44', band: true, accent: '#e8d8a0', satchel: true },
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
    for (const k in mul) st[k] = st[k] * (1 + mul[k]);
    const e = G.eq[m.id] || { w: 0, a: 0 }; st.atk += (DATA.gear[m.id][e.w] || { atk: 0 }).atk; st.def += DATA.armor[e.a].def; st.hp += G.hpBonus;
    for (const k in st) st[k] = Math.round(st[k]);
    m.skills = [...d.skills.filter(([, l]) => l <= m.lv).map(([s]) => s), ...extra]; m.type = null; m.pas = pas; }
  else { const S = SPC[m.id]; const iv = m.iv || {}; ['hp', 'mp', 'atk', 'def', 'spd'].forEach((k, i) => st[k] = Math.round((S.base[i] + S.grow[i] * (m.lv - 1)) * (1 + (iv[k] ?? 8) / 100)));
    m.skills = [...S.sk.filter(([, l]) => l <= m.lv).map(([s]) => s), ...(m.extra || []).filter(s => DATA.skills[s])]; m.skills = m.skills.filter((s, i) => m.skills.indexOf(s) === i);
    m.type = S.type; m.pas = { crit: (m.bond || 0) >= 80 ? .05 : 0, regen: 0, mpSave: 0, healUp: 0, aura: 0, first: 0 }; }
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
function save() { try { G.pos = { x: player.x, z: player.z, y: player.y }; G.placed = [Blocks.placed(0), Blocks.placed(1), Blocks.placed(2), Blocks.placed(3)]; G.lit = REG[0].beacons.map(b => b.lit ? 1 : 0); G.guard = REG[0].beacons.map(b => b.guard ? 1 : 0);
  localStorage.setItem(keyOf(SLOT), JSON.stringify({ G, uidN })); return true; } catch (e) { return false; } }
function hasSave() { return [1, 2, 3].some(n => slotInfo(n)); }
function load() { try {
  let raw = localStorage.getItem(keyOf(SLOT));
  if (raw) { const d = JSON.parse(raw); const inv = Object.assign({}, G.inv, d.G.inv); const def = { sp: G.sp, board: G.board, trial: G.trial, itemSeen: G.itemSeen, tips: G.tips, rankClaimed: G.rankClaimed, wtrial: G.wtrial, wind: G.wind }; G = Object.assign(G, def, d.G); G.inv = inv; uidN = d.uidN || 100; }
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
let enemies = [], spawnT = 0, cool = 0, barrierT = 0, hudT = 0, dustT = 0, glideT = 0; const puffs = [], streaks = []; const hsp0 = () => Math.hypot(player.vx, player.vz);

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
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
});
cv.addEventListener('pointermove', e => {
  if (e.pointerId === stick.id) { let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy; const m = Math.hypot(dx, dy), Rr = 50; if (m > Rr) { dx *= Rr / m; dy *= Rr / m; }
    stick.x = dx / Rr; stick.y = dy / Rr; knob.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`; }
  else if (e.pointerId === look.id) { const k = (e.pointerType === 'mouse' ? .005 : .0065) * HOOK.OPT.look; cam.yaw -= (e.clientX - look.x) * k; cam.pitch = clamp(cam.pitch + (e.clientY - look.y) * k, -.3, 1.2); look.x = e.clientX; look.y = e.clientY; }
});
const pup = e => { if (e.pointerId === stick.id) { stick.id = null; stick.x = stick.y = 0; stickEl.hidden = true; } if (e.pointerId === look.id) look.id = null; };
cv.addEventListener('pointerup', pup); cv.addEventListener('pointercancel', pup);
cv.addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * .01, 4, 16); e.preventDefault(); }, { passive: false });
cv.addEventListener('contextmenu', e => e.preventDefault());
function releaseInputs() { keys.clear(); stick.id = null; stick.x = stick.y = 0; stickEl.hidden = true; look.id = null; }
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (MENUS.length) { menuKey(e); return; }
  if (D.active) { if (['Space', 'Enter', 'KeyE', 'NumpadEnter'].includes(e.code)) { e.preventDefault(); dlgAdvance(); } return; }
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
async function run(fn) { if (busy) return; busy = true; releaseInputs(); try { await fn(); } catch (e) { console.error(e); } finally { busy = false; } }

// ================= dialogue =================
const D = { active: false, q: [], full: '', shown: 0, res: null };
const dlgEl = $('dlg'), dlgName = $('dlgName'), dlgText = $('dlgText'), dlgFace = $('dlgFace'), dlgMore = $('dlgMore');
dlgEl.addEventListener('pointerdown', e => { e.preventDefault(); dlgAdvance(); });
function say(lines) { return new Promise(res => { D.q = lines.filter(Boolean); D.res = res; D.active = true; dlgEl.hidden = false; nextLine(); }); }
function nextLine() {
  const L = D.q.shift();
  if (!L) { D.active = false; dlgEl.hidden = true; const r = D.res; D.res = null; r && r(); return; }
  const o = typeof L === 'string' ? { t: L } : L; if (o.fx) o.fx();
  D.full = o.t.replace(/{name}/g, G.name); D.shown = 0;
  if (o.who) { const c = DATA.cast[o.who]; dlgName.textContent = o.who === 'sora' ? G.name : o.who === 'kurou' ? 'クロウ' : c.name; dlgName.hidden = false;
    dlgFace.innerHTML = Art.portrait(o.who, o.ex || 'smile'); dlgFace.hidden = false; const pc = Art.P[o.who] && Art.P[o.who].bg; dlgName.style.setProperty('--nc', pc ? pc + 'aa' : '');
    dlgFace.classList.remove('pop'); void dlgFace.offsetWidth; dlgFace.classList.add('pop'); if (!G.met[o.who]) G.met[o.who] = true; dlgEl.classList.remove('narr'); }
  else if (o.nm) { dlgName.textContent = o.nm; dlgName.hidden = false; dlgName.style.setProperty('--nc', ''); dlgFace.hidden = true; dlgEl.classList.add('narr'); }
  else { dlgName.hidden = true; dlgFace.hidden = true; dlgEl.classList.add('narr'); }
  dlgText.textContent = ''; dlgMore.hidden = true;
}
function dlgAdvance() { if (!D.active) return; if (D.shown < D.full.length) D.shown = D.full.length; else { Music.sfx('cursor'); nextLine(); } }
function dlgUpdate(dt) { if (!D.active) return; if (D.shown < D.full.length) { const before = Math.floor(D.shown); D.shown = Math.min(D.full.length, D.shown + dt * 42 * HOOK.OPT.text);
    if (Math.floor(D.shown) !== before && Math.floor(D.shown) % 2 === 0) Music.sfx('blip'); }
  dlgText.textContent = D.full.slice(0, Math.floor(D.shown)); dlgMore.hidden = D.shown < D.full.length; }
const who = (w, ex, t) => ({ who: w, ex, t });
const nm = (n, t) => ({ nm: n, t });

// ================= menus =================
const MENUS = [];
function menu({ title, items, where = 'center', cancel = true }) {
  return new Promise(res => {
    const host = where === 'battle' ? $('bCmd') : $('ui');
    const el = document.createElement('div'); el.className = 'win menu m-' + where + (items.some(i => i.hint) ? ' one' : '');
    el.innerHTML = (title ? `<div class="m-title"><span>${title}</span>${cancel ? '<button class="m-x" type="button" aria-label="もどる">✕</button>' : ''}</div>` : '') + '<div class="m-list"></div>';
    const list = el.querySelector('.m-list');
    const M = { el, items, sel: Math.max(0, items.findIndex(i => !i.disabled)), res, cancel };
    items.forEach((it, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'm-item' + (it.disabled ? ' dis' : '');
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
  const cols = M.el.classList.contains('m-battle') && !M.el.classList.contains('one') ? 2 : 1;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); step(cols); }
  else if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); step(-cols); }
  else if (cols === 2 && (e.code === 'ArrowRight' || e.code === 'KeyD')) { e.preventDefault(); step(1); }
  else if (cols === 2 && (e.code === 'ArrowLeft' || e.code === 'KeyA')) { e.preventDefault(); step(-1); }
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
function stamHud() { const s = $('stam'); const f = G.stam / G.stamMax; s.style.setProperty('--f', f.toFixed(3)); s.classList.toggle('low', f < .25 || player.tired); s.classList.toggle('full', f >= .999 && !player.climb && !player.glide); }

// ================= tips / item gain =================
const tipQ = []; let tipBusy = false;
function tip(html, key) { if (key) { if (G.tips[key]) return; G.tips[key] = 1; } tipQ.push(html); if (!tipBusy) nextTip(); }
function nextTip() { const el = $('tip'); const h = tipQ.shift(); if (!h) { tipBusy = false; el.classList.remove('on'); return; } tipBusy = true; el.innerHTML = h; el.classList.add('on'); setTimeout(() => { el.classList.remove('on'); setTimeout(nextTip, 450); }, 5200); }
function gain(k, n = 1) { G.inv[k] = (G.inv[k] || 0) + n; if (!G.itemSeen[k]) { G.itemSeen[k] = 1; const it = DATA.items[k]; tip(`<b>はじめて 手に入れた：${it.name}</b><span>入手：${it.src || '—'}</span><span>使いみち：${it.use || it.desc}</span>`); } }

// ================= objectives =================
function npcAt(id, r) { const n = NPCS.find(n => n.id === id && n.r === r); return n ? { x: n.x, z: n.z } : null; }
function objective() {
  const F = G.flags, r0 = REG[0], r1 = REG[1];
  if (!F.metYui) return { t: '母さん（ユイ）と 話そう', p: npcAt('yui', 0) };
  if (!F.metGen) return { t: 'おじの ゲンの 工房へ いこう', p: npcAt('gen', 0) };
  if (!F.mio) return { t: '広場の ミオに 声を かけよう', p: npcAt('mio', 0) };
  if (G.order < 5) { if (G.region !== 0) return { t: '風灯の島へ もどろう', p: npcAt('baldo', 1) };
    let best = null, bd = 1e9; for (const b of r0.beacons) if (!b.lit) { const d = Math.hypot(b.x - player.x, b.z - player.z); if (d < bd) { bd = d; best = b; } }
    const T = DATA.trials[best.i], st = G.trial[best.i]; const lv = DATA.guardLv[G.order];
    let step; if (!st.seen) step = `灯台「${T.name}」を しらべる`; else if (!trialDone(best)) step = best.i === 0 ? `灯の欠片を 集める ${st.shards || 0}/3` : `群れを しずめる ${st.waves || 0}/3`;
    else if (!best.guard) step = best.i === 3 ? '夜に 灯台の 番人と たたかう' : best.act.top ? `${best.i === 1 ? '塔の てっぺん' : '浮き足場'}で 番人と たたかう` : '灯台の 番人と たたかう';
    else if (!fuelOk(best)) step = `燃料を 集める（${fuelTxt(best)}）`; else step = best.act.top ? `${best.i === 1 ? '塔の てっぺん' : '浮き足場'}で 火を ともす` : '火を ともす';
    return { t: `【灯台 ${G.order}/5・推奨Lv${lv}】${step}`, p: best.act.top && st.seen ? best.act : best }; }
  if (!F.cleared) return { t: `【決戦・推奨Lv${DATA.bossCfg.yomikage[0]}】島で いちばん 高い 場所、宵の祠へ`, p: r0.shrine };
  if (!F.c2start) return { t: '【第2章】広場の クロウと 話そう', p: npcAt('kurou', 0) };
  if (!F.c2done && (!F.c2arrive || G.region !== 1)) { if (G.region === 0) return { t: '桟橋の バルド船長の 船で 霧の大陸へ', p: npcAt('baldo', 0) }; }
  if (G.region === 1 && !F.dex) return { t: '港町ミナトの 研究所で ツムギに 会おう', p: npcAt('tsumugi', 1) };
  if (G.region === 1 && !F.c2rumor) return { t: 'ギルドで 情報を 集めよう', p: npcAt('guild', 1) };
  if (!F.c2done) { if (G.region !== 1) return { t: '霧の大陸へ もどろう', p: npcAt('baldo', 0) }; return { t: F.c2mid ? `【推奨Lv${DATA.bossCfg.sanaShadow[0]}】遺跡の 奥の 祭壇へ` : `【推奨Lv${DATA.bossCfg.ishigakiG[0]}】東の 砂漠の「星の遺跡」の 奥へ`, p: F.c2mid ? r1.altar : r1.midboss }; }
  const r2 = REG[2];
  if (!F.c3start) return G.region === 1 ? { t: '【第3章】港町ミナトの 研究所で ツムギに 会おう', p: npcAt('tsumugi', 1) } : { t: '【第3章】霧の大陸の ツムギが 呼んでいる（バルド船長の 船へ）', p: npcAt('baldo', 0) };
  if (!F.c3arrive || (!F.c3done && G.region !== 2)) { if (G.region === 0) return { t: '霧の大陸へ わたろう（バルド船長の 船）', p: npcAt('baldo', 0) };
    if (G.region === 1) return { t: F.c3arrive ? '星の遺跡の 祭壇で 星笛を ふいて 空へ もどろう' : '星の遺跡の 祭壇で 星笛を ふこう（夜に ひびく）', p: r1.altar }; }
  if (!F.c3done) {
    if (!F.c3elder) return { t: '雲の里ククルの 長老ソヨギに 会おう', p: npcAt('soyogi', 2) };
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
  if (L.gear) { const [id, i] = L.gear; const g = DATA.gear[id][i]; lines.push(`${g.name}を 手に入れた！`);
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
  if (!F.metYui) { F.metYui = true;
    await say([who('yui', 'smile', 'おはよう、{name}。 ……また 岬で 灯台を 見ていたの？'), who('sora', 'worried', 'うん。 今日も、どこも ついてなかった。'),
      who('yui', 'sad', 'あの人が 夜の海へ 出て、もう 三年ね。'), who('yui', 'determined', '{name}。 父さんは 灯台に、なにか 残していったと 言っていたわ。'),
      who('yui', 'smile', 'おじの ゲンさんの ところへ 行ってごらん。 旅の じゅんびを 手伝ってくれるはずよ。'),
      '（ユイの 家では 休んで 回復・記録が できる。 旅先では 宿屋が 同じ 役目だ）']); save(); return; }
  const c = await menu({ title: 'ユイ', items: [{ label: 'やすむ', sub: '全回復＋記録' }, { label: 'はなす' }] });
  if (c === 0) await rest(0);
  else if (c === 1) await say([G.order < 5 ? who('yui', 'smile', 'むちゃだけは しないでね。 帰る場所は ここよ。') : !F.cleared ? who('yui', 'worried', 'この 空……。 {name}、 あなたの 帰る場所は ここよ。')
    : !F.c2done ? who('yui', 'smile', '大陸へ 行くのね。 ……お父さんと 同じ 顔を してる。 いってらっしゃい。') : who('yui', 'joy', 'サナちゃんも 連れて 帰ってきたのね。 今夜は ごちそうよ！')]);
}
async function talkGen() {
  const F = G.flags;
  if (!F.metGen) { F.metGen = true;
    await say([who('gen', 'neutral', '……来たか、{name}。'), who('gen', 'neutral', '灯台には かげものが 巣くってる。 準備は しっかり しとけ。'),
      '（ゲンの 工房では、石や 薪で 武器・防具を 作ってもらえる）', who('gen', 'neutral', '木は 切れば 薪、岩を 砕けば 石。 メニューの「クラフト」で ブロックにして 積めるぞ。'),
      '（「つくる」ボタン（B）で ブロックを 置ける。 崖も 壁も、がんばりが あれば よじ登れる）', who('gen', 'neutral', '……それと、広場の ミオが おまえを 探してたぞ。')]); return; }
  const w = DATA.gear.sora[G.eq.sora.w + 1], ha = G.eq.sora.a;
  const aNext = ha < 2 ? DATA.armor[ha + 1] : null; const aCost = [null, { maki: 5, ishi: 2 }, { ishi: 12, maki: 4 }][ha + 1];
  const costTxt = c => Object.entries(c).map(([k, v]) => `${DATA.items[k].name}${v}`).join(' '); const can = c => c && Object.entries(c).every(([k, v]) => (G.inv[k] || 0) >= v);
  const c = await menu({ title: 'ゲンの工房', items: [
    { label: w && w.cost ? `${w.name}を つくる` : 'ぶき：ここでは これ以上 作れない', sub: w && w.cost ? costTxt(w.cost) : '', disabled: !w || !w.cost || !can(w.cost) },
    { label: aNext ? `${aNext.name}を つくる（全員）` : 'ぼうぐ：ここでは これ以上 作れない', sub: aNext ? costTxt(aCost) : '', disabled: !aNext || !can(aCost) }, { label: 'はなす' }] });
  const pay = cst => Object.entries(cst).forEach(([k, v]) => G.inv[k] -= v);
  if (c === 0) { pay(w.cost); G.eq.sora.w++; allMembers().forEach(calc); Music.sfx('place'); await say([who('gen', 'grin', `……よし。 ${w.name}だ。`), `${G.name}は ${w.name}を そうびした！`]); }
  else if (c === 1) { pay(aCost); HUMAN_IDS.forEach(k => { if (G.eq[k].a < ha + 1) G.eq[k].a = ha + 1; }); G.party.forEach(m => { const r = m.hp / m.st.hp; calc(m); m.hp = Math.round(m.st.hp * r); }); Music.sfx('place'); await say([who('gen', 'neutral', `${aNext.name}だ。 仲間の ぶんも ある。`)]); }
  else if (c === 2) await say([!F.cleared ? who('gen', 'sad', '……カイトを 止められなかったのは、おれだ。 だから おまえの 武器は、おれが 打つ。') : who('gen', 'smile', '大陸の 港町には、もっと いい 武器屋が あるらしいぞ。 金を ためな。')]);
}
async function talkNagi() {
  const F = G.flags;
  if (!F.metNagi) { F.metNagi = true; G.inv.pan += 2;
    await say([who('nagi', 'grin', 'あら {name}！ 旅に 出るんだって？'), who('nagi', 'smile', 'ほら、焼きたての 実のパン。 腹が へっては 冒険は できないよ！'), '実のパンを 2つ もらった！',
      who('nagi', 'smile', 'たき火で 料理も できるからね。 キノコと 木の実を 組みあわせてごらん。')]); return; }
  const c = await menu({ title: 'かざみ亭', items: [{ label: 'パンを やいてもらう', sub: '木の実3 → 実のパン1', disabled: G.inv.mi < 3 }, { label: 'はなす' }] });
  if (c === 0) { G.inv.mi -= 3; G.inv.pan++; Music.sfx('pick'); await say([who('nagi', 'grin', 'はい、おまちどう！'), '実のパンを 1つ もらった！']); }
  else if (c === 1) await say([!F.cleared ? who('nagi', 'grin', 'ねえ、リクって 子を 見たかい？ 本土から 来た 槍使いだって、うわさだよ！') : who('nagi', 'grin', '大陸の 料理も 気になるねえ。 おいしいもの 見つけたら 教えておくれ！')]);
}
async function talkMio() {
  const F = G.flags;
  if (!F.metYui) { await say([who('mio', 'smile', '{name}、 おはよう！ 先に ユイさんに 顔を 見せてきなよ。')]); return; }
  await say([who('mio', 'grin', '{name}！ 旅に 出るって ほんと？'), who('mio', 'worried', '……あのね。 最近、夜に なると きこえるの。 灯台の ほうから、だれかが 泣いてる こえ。'),
    who('mio', 'determined', 'わたしも 行く。 カイトさんには 命を 助けてもらったもの。'),
    { t: 'ミオが なかまに くわわった！', fx: () => { F.mio = true; G.party.push(mkHuman('mio', G.party[0].lv)); fixTeam(); Music.sfx('friend'); } },
    who('mio', 'smile', 'かげものも、たおせば かげが はれて もとに もどるの。 なかよく なれるかも！')]); save();
}
async function talkKurou() {
  if (!G.flags.c2start) {
    await say([who('kurou', 'neutral', '{name}。 ……話して おかねば ならないことが ある。'),
      who('kurou', 'sad', 'わたしが 闇に 堕ちた 夜。 北の 海に、星が ひとつ 落ちるのを 見た。 あの 光に ふれてから、悲しみが 止まらなく なった。'),
      who('kurou', 'determined', '霧の大陸では いまも 星が 落ちつづけている。 星を 喰らう なにかが いる。 ……わたしの 闇は、その かけらに すぎなかった。'),
      inParty('riku') ? who('riku', 'surprised', '霧の大陸……？ サナが……妹が 最後に 見えたのも、その 方角だ。') : null,
      who('kurou', 'smile', '桟橋に 古い 友の 船が 来ている。 バルドという 男だ。 ……頼む。'),
      { t: '【第2章　星くずの大陸】', fx: () => { G.flags.c2start = true; } }]); save(); return; }
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
    await say([who('baldo', 'grin', '着いたぞ！ ここが 霧の大陸の 玄関口、港町ミナトだ！'), who('baldo', 'neutral', 'ここの 研究所に、いきものに くわしい ちびっこが いる。 まずは 会ってみな。'),
      '（大陸の いきものは 島より 強い。 町の 武器屋で 装備を ととのえよう）']); save(); return; }
  const dest = G.region === 0 ? 1 : 0;
  if (await confirm(`${dest ? '霧の大陸' : '風灯の島'}へ 船を 出すか？`)) await sail(dest);
}
async function sail(dest) {
  await fade(true);
  G.region = dest; World.setRegion(dest); enemies = []; const r = REGr();
  player.x = r.pier.x; player.z = r.pier.z - 8; player.y = surfaceAt(player.x, player.z, 99); player.vx = player.vz = player.vy = 0; trail.length = 0; cam.yaw = Math.PI; player.yaw = Math.PI;
  Music.play(fieldSong(), { restart: true }); await wait(400); await fade(false); save(); }
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
function shopUI(kind) {
  return new Promise(res => {
    const sky = G.region === 2, sea = G.region === 3; const shopName = kind === 'weapon' ? (sea ? '海の武具屋' : sky ? '空の武具屋' : '武器と防具の店') : (sea ? '海の道具屋' : sky ? '空の道具屋' : '道具屋');
    const tabs = kind === 'weapon' ? [['w', 'ぶき'], ['a', 'ぼうぐ'], ['s', 'うる']] : [['i', 'かう'], ['s', 'うる']];
    let tab = tabs[0][0], sel = 0, qty = 1, armed = null, line = kind === 'weapon' ? (sky ? '雲の上の 鍛冶は 軽くて 強いのさ。' : 'いらっしゃい！ いい品が そろってるよ。') : (sky ? '空の 旅には がんばり串が 欠かせないよ。' : 'まいど！ 旅の 備えは 万全かい？');
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
      who('tsumugi', 'smile', 'わたし、ツムギ。 いきもの研究家の……見習い。 おばあちゃんの 未完成の 図鑑を 完成させるのが 夢なの。'),
      who('tsumugi', 'determined', 'ねえ、手伝って くれない？ 島と 大陸には 28種の いきものが いるって、おばあちゃんの ノートに 書いてあるの。'),
      { t: '「いきもの図鑑」を もらった！', fx: () => { F.dex = true; Music.sfx('friend'); } },
      who('tsumugi', 'smile', 'いきものは 住む 場所や 時間帯で ちがうの。 夜にしか 出ない子、雪原にしか いない子……。 育てると すがたが 変わる子も いるよ。'),
      who('tsumugi', 'grin', 'それと、ごくたまに 色が ちがう 子が いるんだって。 見つけたら ぜったい 教えてね！'),
      F.glider ? who('tsumugi', 'surprised', 'あっ、その 風布……！ おばあちゃんが 作ってた ものと 同じ 織りかただ。 大事に してね！')
        : who('tsumugi', 'smile', 'あと、これ。 おばあちゃんの 形見の「風布」。 高い ところから 飛びおりて ひろげれば、風に のって 空を すべれるよ。'),
      F.glider ? null : { t: '「風布」を 手に入れた！（空中で もう一度 ジャンプすると 滑空）', fx: () => { F.glider = true; Music.sfx('friend'); } },
      who('tsumugi', 'smile', '図鑑が うまったら、ここに 報告に きてね。 おばあちゃんの 宝物を わけてあげる！')]); save(); return; }
  if (F.c2done && !F.c3start) {
    await say([who('tsumugi', 'surprised', 'あっ、{name}！ たいへん たいへん！ おばあちゃんの ノートの 最後の ページ、やっと 読めたの！'),
      who('tsumugi', 'determined', '「星の遺跡の 祭壇で 星笛を ふけば、星の くじらが 空の 島へ はこんでくれる」……だって！'),
      inParty('sana') ? who('sana', 'worried', 'やっぱり……。 星の こえが 言っているんです。 空の 上で、星が ひとつずつ 消えている、と。') : null,
      who('sora', 'surprised', 'そういえば 最近、夜空の 星が 少ない 気が する……。'),
      inParty('riku') ? who('riku', 'determined', '星喰いは「かけら」だった。 本体は 空の 上って わけか。') : null,
      who('tsumugi', 'smile', 'はい、これ。 おばあちゃんが 遺した「星笛」。 わたしは 図鑑の 仕事が あるから ここで 待ってるね。'),
      { t: '「星笛」を 手に入れた！', fx: () => { F.c3start = true; Music.sfx('friend'); } },
      who('tsumugi', 'grin', '空の いきもの、ぜったい 見せてね！ 図鑑は 38種まで ふえたんだから！'),
      '【第3章　天空の星巣】']); save(); return; }
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
      nm('ギルドの 受付', '……え、星の 話？ ええ、最近 東の 砂漠の「星の遺跡」に 星が 落ちつづけてるの。 それに——'),
      nm('ギルドの 受付', '紺色の 髪の 女の子が、ひとりで 遺跡へ 入っていくのを 見たって 人が いたわ。 星の 髪飾りを つけた子。'),
      inParty('riku') ? who('riku', 'surprised', '……星の 髪飾り。 サナだ。 まちがいねえ。') : null,
      inParty('riku') ? who('riku', 'determined', '{name}、 悪いが 急ぐぞ。') : who('sora', 'determined', '東の 砂漠……行ってみよう。'), { t: '（遺跡は 町から 東の 砂漠。 空に 立ちのぼる 光が 目印だ）', fx: () => { F.c2rumor = true; } }]); save(); return; }
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
  if (!st.seen) { st.seen = 1; await say([`【灯台の試練　${T.name}】`, T.text, `（火を ともす 燃料：${fuelTxt(b)}）`]); }
  if (b.act.top && !atTop) { await say([b.i === 1 ? '火皿は 灯台ではなく、となりの 高い 塔の てっぺんに ある。 がんばりゲージが あれば 壁を よじ登れる。 ブロックで 階段を 作っても いい。'
    : '火皿は 崖の 先に 浮かぶ 足場の 上だ。 風布で 滑空するか、ブロックで 橋を かけよう。']); return; }
  if (b.i === 0 && (st.shards || 0) < 3) { await say([`灯の欠片が 足りない（${st.shards || 0}/3）。 灯台の まわりで 光っている 欠片を さがそう。`]); return; }
  if (b.i === 2 && (st.waves || 0) < 3) {
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
    if (gi === 0) pre.push('とつぜん、灯台の 足もとから 黒い つるが のびてきた！', inParty('mio') ? who('mio', 'worried', 'この子……灯を こわがってる。 でも、とめなきゃ！') : who('sora', 'determined', 'くるぞ……！'));
    if (gi === 1) pre.push(who('riku', 'angry', '待て。 その灯台に 火を つけるな。'), who('sora', 'surprised', 'だ、だれ？'), who('riku', 'smirk', '灯を ともせば、あいつが 気づく。 ……おれの 町は、それで 喰われた。'), who('riku', 'determined', 'どうしても やるってんなら、おれを 倒してからに しな、甘ちゃん。'));
    if (gi === 2) pre.push('大地が ゆれる。 岩の かたまりが 立ち上がった！');
    if (gi === 3) pre.push('海が 黒く ふくらみ、なにかが 顔を 出した！', inParty('mio') ? who('mio', 'sad', 'この子の こえ……さみしい、って。') : null);
    if (gi === 4) pre.push('空が 裂け、夜の とばりが 鳥の かたちに なった！', who('sora', 'determined', 'これが 最後の 灯台だ。 みんな、いくよ！'));
    await say(pre);
    const res = await runBattle([{ boss: gid }], { boss: true, noFlee: true });
    if (res !== 'win') return defeated();
    b.guard = true;
    if (gi === 1) await say([who('riku', 'sad', '……ちっ。 まっすぐな 剣だ。'), who('sora', 'smile', 'きみの 町の 灯も、きっと また ともせる。 いっしょに 行こう。'),
      who('riku', 'smirk', '……リクだ。 勘違いすんなよ。 あいつを 追うのに 都合が いいだけだ。'), { t: 'リクが なかまに くわわった！', fx: () => { G.party.push(mkHuman('riku', Math.max(G.party[0].lv, 6))); fixTeam(); Music.sfx('friend'); } }]);
    else await say([`${DATA.enemies[gid].name}の かげが はれて、光の 粒に なって 消えていった。`]);
    save();
  }
  if (!fuelOk(b)) { await say([`火皿は 冷えきっている。 燃料が 足りない。`, `（必要：${fuelTxt(b)}）`, '（木を 切ると 薪と 葉っぱ、岩を 掘ると 石、夜の いきものから 夜露の しずくが 手に入る）']); return; }
  if (!(await confirm(`燃料（${Object.entries(fuelOf(b)).map(([k, v]) => DATA.items[k].name + v).join('・')}）を つかって 火を ともしますか？`))) return;
  for (const [k, v] of Object.entries(fuelOf(b))) G.inv[k] -= v;
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
    who('yomi', 'angry', '……よくも 灯を ともしてくれたな、カイトの 子よ。'), who('yomi', 'neutral', '島の いちばん 高い 場所、宵の祠で 待つ。'), who('sora', 'determined', '行こう。 父さんも、きっと そこに いる。')]);
  G.flags.shrineOpen = true; save();
}
async function shrineEvent() {
  await say([`（推奨Lv${DATA.bossCfg.yomikage[0]}　連戦に なる。 準備は いいか？）`, who('yomi', 'neutral', '来たか。'), who('yomi', 'angry', '灯を ともして 何になる。 灯が あるから、人は 海へ 出て 帰ってこない。'),
    who('sora', 'determined', 'それでも 灯は、帰る場所の しるしだ！'), inParty('mio') ? who('mio', 'sad', 'きこえる……あなたの 中で、ずっと 泣いてる 女の子の こえ。') : null, who('yomi', 'angry', '……黙れ！ 夜よ、すべてを のみこめ！')]);
  let res = await runBattle([{ boss: 'yomikage' }], { boss: true, noFlee: true });
  if (res !== 'win') return defeated();
  await say([who('yomi', 'angry', 'まだだ……！ この 悲しみごと、永遠の 夜に しずめてやる！'), { t: '闇が ふくれあがり、空いっぱいの 王の すがたに なった！', fx: () => battleParty().forEach(m => { m.hp = Math.max(m.hp, Math.round(m.st.hp * .8)); m.mp = Math.max(m.mp, Math.round(m.st.mp * .6)); }) }]);
  res = await runBattle([{ boss: 'yoiyami' }], { boss: true, noFlee: true, keepMusic: true });
  if (res !== 'win') return defeated();
  await say(['宵闇の 王の からだから、黒い 霧が ほどけていく。', who('kurou', 'sad', '……あたたかい。 ああ、ハル……おまえも、この灯を 見ていたのか。'), '霧の むこうから、ひとりの 男が 歩いてきた。',
    who('kaito', 'smile', '師匠。 帰りましょう。 灯は ともっています。'), who('sora', 'surprised', '……父さん！'), who('kaito', 'joy', '大きく なったな、{name}。 ……よく ここまで 来た。'),
    { t: '……夜が 明けていく。', fx: () => { darkTarget = 0; G.tod = .255; } }]);
  G.flags.cleared = true; await fade(true); player.x = 2; player.z = 4; player.y = surfaceAt(2, 4, 99); trail.length = 0; await fade(false);
  await say([who('yui', 'sad', '……おかえりなさい、あなた。'), who('kaito', 'smile', 'ただいま。 ……灯が 見えたから、帰ってこられた。'), who('nagi', 'grin', 'さあさあ！ 今夜は かざみ亭で 宴会だよ！'), who('sora', 'joy', '父さん、母さん。 ……ただいま！')]);
  save(); await credits(1);
  await say(['（第1章 クリア！ 広場の クロウが なにか 話したそうに している……）']);
}
// ---- chapter 2 ----
async function midbossEvent() {
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
  await say(['星喰いは 悲鳴を あげ、無数の 光の 粒に なって 空へ 還っていった。', who('sana', 'sad', '兄さん……ずっと、星に 祈っていました。 いつか 迎えに きてくれるって。'),
    inParty('riku') ? who('riku', 'sad', '……遅くなって、わりい。') : null, inParty('riku') ? who('riku', 'smile', '……よく がんばったな、サナ。') : null,
    who('sana', 'smile', '{name}さん。 みなさん。 ありがとう ございます。 わたしも、いっしょに 行かせてください。'),
    { t: 'サナが なかまに くわわった！', fx: () => { G.party.push(mkHuman('sana', Math.max(...G.party.map(m => m.lv)))); fixTeam(); Music.sfx('friend'); } },
    who('sana', 'worried', '……でも、星喰いは「かけら」でした。 空の 向こうに、もっと 大きな なにかが います。 星の こえが、そう 言っています。'),
    who('sora', 'determined', 'だったら、そこへも 行こう。 みんなで。')]);
  G.flags.c2done = true; save(); await credits(2);
  await say(['（第2章 クリア！ 図鑑うめ・依頼・建築・ひかりの種あつめ など、旅は つづく……）']);
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
  Music.play(fieldSong(), { restart: true }); await wait(400); await fade(false); save(); }
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
    '（天空の浮島：雲海に 落ちると 近くの 島に もどされる。 空の いきものは 強いが、経験値も 多い）']);
  tip('<b>天空の浮島</b><span>光る 風の 柱＝上昇気流。 ジャンプ→もう一度 ジャンプで 滑空すると 空高く 舞いあがる。</span>', 'updraft'); save(); }
async function whaleEvent() { if (!(await confirm('ホシクジラに 乗って、霧の大陸（星の遺跡）へ おりますか？'))) return;
  await say(['ホシクジラは ゆっくりと 雲の 下へ おりていく——']); await skyTravel(1); }
async function talkHaruNpc() { await say([who('haru', 'neutral', '長老さまの 家は この 奥。 青い 屋根の 家よ。')]); }
async function talkSoyogi() {
  const F = G.flags;
  if (!F.c3elder) {
    await say([who('soyogi', 'smile', 'ほっほ。 地上の 客人とは、何十年ぶりかのう。 わしは ソヨギ。 この 里の 長老じゃ。'),
      who('soyogi', 'neutral', '星が 消えておる わけを 知りたいそうじゃな。 ……よかろう。'),
      who('soyogi', 'neutral', 'この 空の 北に「星巣の塔」が ある。 空の 星を 守る 星守（ほしもり）さまの すみかじゃった。'),
      who('soyogi', 'sad', 'じゃが 四十年前、星守さまは 変わってしまわれた。 燃えつきて 消えていく 星を 見て——'),
      who('soyogi', 'sad', '「消えるくらいなら、喰らって わが身に しまっておこう」と……。 いまは「天喰み（あまはみ）」と 呼ばれておる。'),
      inParty('sana') ? who('sana', 'worried', '天喰み……。 わたしを 操っていた 星喰いは、その かけら だったんですね。') : null,
      who('soyogi', 'determined', '塔は 風の 結界に 守られておる。 東・南西・西の 三つの「風の祠」で 試練を こえ、祠に 風を 通せば、虹の 橋が かかるじゃろう。'),
      who('soyogi', 'smile', 'ハルや。 この 子らを 案内して おあげ。 おまえには 風の 道が 見えるじゃろう。'),
      who('haru', 'surprised', 'え……わたし？'), who('haru', 'determined', '……わかった。 星が 消えるのは、わたしも いや。'),
      { t: 'ハルが なかまに くわわった！', fx: () => { F.c3elder = true; const lv = Math.max(...G.party.map(m => m.lv)); G.eq.haru = { w: (G.eq.haru && G.eq.haru.w) || 0, a: Math.max((G.eq.haru && G.eq.haru.a) || 0, ...G.party.map(m => G.eq[m.id].a)) };
        G.party.push(mkHuman('haru', lv)); if (G.team.length >= 4) G.team[3] = 'haru'; else G.team.push('haru'); fixTeam(); Music.sfx('friend'); } },
      who('haru', 'smile', '……それと、ミオ。 くじらの 上で 口ずさんでた 歌。 わたし、どこかで 聞いた 気が するの。'),
      inParty('mio') ? who('mio', 'surprised', 'え……あれは、風灯の島に 古くから ある 子守歌だよ？') : null,
      '（ハルは 4人めとして たいれつに 入った。 メニューの「なかま」で 入れかえ できる）']);
    tip('<b>風の祠は どこからでも</b><span>東・南西・西、好きな 順に 挑める。 推奨Lvは 東30・南西32・西34。</span>', 'wind1'); save(); return; }
  const c = await menu({ title: 'ソヨギ', items: [{ label: 'はなす' }, { label: '空の 話を きく' }] });
  if (c === 0) { const left = DATA.windTrials.filter((_, i) => !G.wind[i]).map(t => `${t.where}の ${t.name}`);
    await say([!F.c3bridge ? who('soyogi', 'neutral', `のこる 祠は……${left.join('、')}じゃな。 あせらず 行きなされ。`) : !F.c3done ? who('soyogi', 'determined', '虹の 橋が かかった。 星守さまを……たのんだぞ。') : who('soyogi', 'joy', '星が もどった。 ハルも 家族に 会えたそうじゃな。 ……長生き してみる もんじゃ。')]); }
  else if (c === 1) await say([who('soyogi', 'smile', '雲の 上では 風が 道じゃ。 光る 風の 柱に 乗れば、どこまでも 高く 行ける。'), who('soyogi', 'neutral', '雲わたは 空の いきものが 落とす。 雲ブロックに すれば、空に 足場も 作れるぞい。')]);
}
async function windEvent(sh) {
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
    who('sora', 'determined', '灯も 星も、だれかが 帰る 場所の しるしだ。 閉じこめたら、だれも 帰れない！'),
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
  await say(['（第3章 クリア！ ハルは これからも いっしょに 旅を する。 天空の浮島へは 星の遺跡の 祭壇から 行ける）', '（うわさ：星が もどった 夜、星巣の塔の 頂に なにかが 舞いおりるらしい……）']); }
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
$('bSpd').addEventListener('click', () => { G.speed = G.speed === 1 ? 2 : G.speed === 2 ? 3 : 1; $('bSpd').textContent = `はやさ ×${G.speed}`; });
$('bAuto').addEventListener('click', () => { G.auto = !G.auto; $('bAuto').textContent = G.auto ? 'おまかせ ON' : 'おまかせ OFF';
  if (G.auto) for (const M of MENUS.slice().reverse()) if (M.el.classList.contains('m-battle')) closeMenu(M, 'auto'); });
function wildLevel(x, z) { if (G.region === 0) return Math.max(1, 1 + G.order * 3 + (G.flags.cleared ? 4 : 0) + Math.floor(R() * 2));
  if (G.region === 3) { const b = World.biomeAt(x, z); return ({ sand: 40, kelp: 41, coral: 42, rock: 44, trench: 47 }[b] || 40) + Math.floor(R() * 3) + (G.flags.c4done ? 5 : 0); }
  if (G.region === 2) { const b = World.biomeAt(x, z); return ({ grass: 29, forest: 30, rock: 32, crystal: 33 }[b] || 29) + Math.floor(R() * 3) + (G.flags.c3done ? 6 : 0); }
  const b = World.biomeAt(x, z); const base = { grass: 15, shore: 16, forest: 18, desert: 20, snow: 22, ruins: 24 }[b] || 15; return base + Math.floor(R() * 3) + (G.flags.c2done ? 3 : 0) + (G.flags.c3done ? 3 : 0); }
const S0 = spec => SPC[spec.sp] || {};
function mkFoe(spec) {
  if (spec.boss) { const d = DATA.enemies[spec.boss];
    return { foe: true, boss: true, d, lv: d.lv, name: d.name, type: d.type || null, hp: d.hp, max: d.hp, atk: d.atk, def: d.def, spd: d.spd, exp: d.exp, gold: d.gold ?? Math.round(d.exp * .8), sleep: 0, slow: 0,
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
function drawParty(P, ai = -1) {
  $('bParty').innerHTML = P.map((m, i) => `<div class="pc${i === ai ? ' act' : ''}${m.hp <= 0 ? ' down' : ''}" id="pc${i}"><div class="pc-face">${faceOf(m)}</div><div class="pc-info"><div class="pc-name">${esc(nameOf(m))}<small>Lv${m.lv}</small></div>
    <div class="bar hp"><i style="width:${m.hp / m.st.hp * 100}%"></i></div><div class="pc-num">HP ${m.hp}/${m.st.hp}</div><div class="bar mp"><i style="width:${m.st.mp ? m.mp / m.st.mp * 100 : 0}%"></i></div><div class="pc-num">MP ${m.mp}/${m.st.mp}${m.sleep > 0 ? ' 💤' : ''}${m.ail ? ' ' + DATA.ailIcon[m.ail] : ''}${m.defUp > 0 ? ' 🛡' : ''}${m.atkUp > 0 ? ' ⚔' : ''}${m.spdUp > 0 ? ' 💨' : ''}</div></div></div>`).join(''); }
function drawFoes(F) {
  $('bFoes').innerHTML = F.map((f, i) => `<div class="foe${f.hp <= 0 ? ' gone' : ''}${f.boss ? ' boss' : ''}" id="foe${i}"><div class="foe-art">${f.art}</div><div class="foe-shadow"></div>
    <div class="foe-name">${typeTag(f.type)}${f.name}${f.lv ? ` <small>Lv${f.lv}</small>` : ''}${f.sleep > 0 ? ' 💤' : ''}${f.ail ? ' ' + DATA.ailIcon[f.ail] : ''}${f.charging ? ' <b class="chg">⚠ため</b>' : ''}</div><div class="bar hp${f.boss ? ' boss' : ''}"><i style="width:${f.hp / f.max * 100}%"></i></div>${weakTxt(f.type)}</div>`).join(''); }
function weakTxt(t) { if (!t || t === 'normal') return ''; const w = Object.keys(DATA.strong).filter(a => DATA.typeMul(a, t) > 1); return w.length ? `<div class="weak">弱点 ${w.map(a => typeTag(a)).join('')}</div>` : ''; }
const effMark = (type, f) => { const m = DATA.typeMul(type, f.type); return m > 1 ? ' <b class="eff good">◎ばつぐん</b>' : m < 1 ? ' <b class="eff bad">△いまひとつ</b>' : ''; };
const costOf = (m, s) => Math.ceil(DATA.skills[s].mp * (1 - ((m.pas && m.pas.mpSave) || 0)));
function hitFx(el, dmg, heal, cls = '') { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  const n = document.createElement('div'); n.className = 'dmg' + (heal ? ' heal' : '') + (cls ? ' ' + cls : ''); n.textContent = dmg; el.appendChild(n); setTimeout(() => n.remove(), 950); }
// 属性ごとの ヒットエフェクト（DOM パーティクル）
const FXC = { fire: ['#ffb347', '#ff6a2a', '#ffe070'], water: ['#9fe6ff', '#4fb0e0', '#ffffff'], rock: ['#b89a6a', '#8a7a60', '#d8c09a'], light: ['#fff6c9', '#ffe38a', '#ffffff'], dark: ['#b58cff', '#6b3fb0', '#ff6fb0'],
  heal: ['#c9ffd9', '#6fd08a', '#ffffff'], song: ['#ffd6f0', '#b98cff', '#ffffff'], wind: ['#c8fff0', '#9fe0d0', '#ffffff'], leaf: ['#9fe07a', '#5aa83a', '#e8ffb0'], slash: ['#ffffff', '#e0e8ff', '#fff6c9'] };
const TYPE_FX = { fire: 'fire', water: 'water', earth: 'rock', light: 'light', dark: 'dark', wind: 'wind', grass: 'leaf' };
function fxAt(el, kind, opt = {}) { if (!el) return; const r = el.getBoundingClientRect(); if (!r.width) return; const L = $('bfx'); const box = document.createElement('div'); box.className = 'fxl';
  box.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`; L.appendChild(box); const C = FXC[kind] || FXC.slash; const add = h => box.insertAdjacentHTML('beforeend', h);
  const parts = (n, spread, up, sz, dur) => { for (let i = 0; i < n; i++) { const a = R() * 6.283, d = spread * (.4 + R() * .6); add(`<span class="fx-p" style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - up * (.5 + R())}px;--c:${C[i % C.length]};--s:${sz * (.6 + R() * .8)}px;--d:${dur * (.7 + R() * .6)}s"></span>`); } };
  if (kind === 'slash') { add('<span class="fx-slash" style="--r:-28deg"></span><span class="fx-slash b" style="--r:24deg"></span>'); parts(8, 60, 0, 6, .5); }
  else if (kind === 'fire') { add(`<span class="fx-ring" style="--c:${C[0]}"></span>`); parts(18, 50, 70, 12, .8); }
  else if (kind === 'water') { add(`<span class="fx-ring" style="--c:${C[0]}"></span><span class="fx-ring" style="--c:${C[2]};animation-delay:.12s"></span>`); parts(14, 80, -10, 9, .7); }
  else if (kind === 'rock') { for (let i = 0; i < 10; i++) { const a = -2.6 + R() * 2.2, d = 50 + R() * 50; add(`<span class="fx-p" style="border-radius:2px;--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d + 60}px;--c:${C[i % 3]};--s:${8 + R() * 10}px;--d:.7s"></span>`); } add(`<span class="fx-ring" style="--c:${C[0]}"></span>`); }
  else if (kind === 'light') { add('<span class="fx-pillar"></span>'); parts(12, 60, 40, 7, .8); }
  else if (kind === 'dark') { add(`<span class="fx-ring" style="--c:${C[0]}"></span>`); parts(14, 70, 10, 10, .7); }
  else if (kind === 'wind') { add(`<span class="fx-spiral" style="--c:${C[1]}"></span><span class="fx-spiral" style="--c:${C[0]};animation-delay:.1s"></span>`); parts(10, 90, 20, 6, .7); }
  else if (kind === 'leaf') { add('<span class="fx-slash" style="--r:-20deg;background:linear-gradient(90deg,transparent,#9fe07a,transparent)"></span>'); parts(14, 70, 20, 9, .8); }
  else if (kind === 'heal') parts(12, 30, 80, 8, 1);
  else if (kind === 'song') { for (let i = 0; i < 7; i++) add(`<span class="fx-p" style="background:none;box-shadow:none;color:${C[i % 3]};font-size:20px;--x:${(R() - .5) * 90}px;--y:${-40 - R() * 60}px;--d:1s">${i % 2 ? '♪' : '♫'}</span>`); }
  if (opt.stamp) add(`<span class="stamp${opt.stamp === 'bad' ? ' bad' : ''}">${opt.stamp === 'bad' ? '△ いまひとつ' : '◎ ばつぐん！'}</span>`);
  if (opt.crit) { add(`<span class="fx-ring" style="--c:#ffe36a;border-width:6px"></span>`); parts(16, 110, 0, 8, .6); }
  setTimeout(() => box.remove(), 1200); }
function screenFx(kind) { const f = $('bFlash'); f.className = 'bflash ' + kind; void f.offsetWidth; f.classList.add('go'); }

async function runBattle(specs, opts = {}) {
  B.active = true; releaseInputs(); Music.sfx('encounter');
  $('swipe').classList.add('go'); await wait(650);
  const bsong = opts.song || (opts.boss ? 'boss' : 'battle'); if (!opts.keepMusic || Music.current !== bsong) Music.play(bsong, { restart: true, cut: true });
  const P = battleParty(); const F = specs.map(mkFoe);
  const cnt = {}; F.forEach(f => cnt[f.name] = (cnt[f.name] || 0) + 1); const seen = {}; F.forEach(f => { if (cnt[f.name] > 1) { seen[f.name] = (seen[f.name] || 0) + 1; f.name += 'ABCD'[seen[f.name] - 1]; } });
  F.forEach(f => { if (f.sp) G.dex.seen[f.sp] = 1; });
  P.forEach(m => { m.defUp = 0; m.atkUp = 0; m.spdUp = 0; m.sleep = 0; m.guard = false; m.slow = 0; m.ail = null; });
  let friendBoost = 1;
  $('bAuto').textContent = G.auto ? 'おまかせ ON' : 'おまかせ OFF'; $('bSpd').textContent = `はやさ ×${G.speed || 1}`;
  if (!G.tips.battle1) tip('<b>バトルの コツ</b><span>敵の 下の「弱点」タイプの 技は 1.5倍。「おまかせ」で 自動、「はやさ」で 倍速に できる。</span>', 'battle1');
  $('bMsg').innerHTML = ''; $('battle').hidden = false; $('battle').classList.toggle('isboss', !!opts.boss);
  const redraw = (ai = -1) => { drawParty(P, ai); drawFoes(F); };
  redraw(); $('swipe').classList.remove('go'); $('battle').classList.remove('res-on');
  if (opts.boss) { const bc = document.createElement('div'); bc.className = 'bosscard'; bc.innerHTML = `<small>${F[0].type ? DATA.types[F[0].type] + 'タイプ' : ''}${F[0].lv ? '　推奨Lv' + F[0].lv : ''}</small>${esc(F[0].name)}`; document.body.appendChild(bc); setTimeout(() => bc.remove(), 1850); await wait(1100); }
  const aliveF = () => F.filter(f => f.hp > 0), aliveP = () => P.filter(m => m.hp > 0);
  const nameOr = x => x.foe ? x.name : nameOf(x);
  if (F.some(f => f.shiny)) { screenFx('light'); Music.sfx('magic'); await bmsg('……！ 色ちがいの いきものだ！', 500); }
  await bmsg(opts.boss ? `${F[0].name}が 立ちはだかった！` : F.length > 1 ? `${F[0].name.replace(/[A-D]$/, '')}たちが あらわれた！` : `${F[0].name}が あらわれた！`);
  let result = null;
  const pickFoe = async (type) => { const A = aliveF(); if (A.length === 1) return A[0]; const i = await menu({ items: A.map(f => ({ label: f.name + effMark(type, f), sub: `HP ${Math.ceil(f.hp / f.max * 100)}%` })), where: 'battle' }); return i === 'auto' ? 'auto' : i < 0 ? null : A[i]; };
  const pickAlly = async () => { const A = P.filter(m => m.hp > 0); const i = await menu({ items: A.map(m => ({ label: nameOf(m), sub: `HP ${m.hp}/${m.st.hp}` })), where: 'battle' }); return i < 0 ? null : A[i]; };
  const battleItems = () => Object.keys(DATA.items).filter(k => (G.inv[k] || 0) > 0 && (DATA.items[k].heal || DATA.items[k].mp || DATA.items[k].healAll || DATA.items[k].battle || DATA.items[k].cure));
  const setAil = async (t, ail, ch) => { if (!ail || !t || t.hp <= 0 || t.ail || R() >= ch * (t.boss ? .45 : 1)) return; t.ail = ail; redraw(); Music.sfx('hurt'); await bmsg(`${nameOr(t)}は ${DATA.ailName[ail]}に なった！`, 300);
    if (!G.tips.ail) tip('<b>状態異常</b><span>☠どく・🔥やけど（毎ターン ダメージ）、⚡まひ（ときどき 動けない）。どくけし草や 回復の歌で なおる。</span>', 'ail'); };
  const cureAll = T => { let any = false; for (const t of T) { if (t.ail || t.sleep > 0) { t.ail = null; t.sleep = 0; any = true; } } return any; };
  const combosFor = m => (DATA.combos || []).filter(c => (c.a === m.id || c.b === m.id)).map(c => ({ c, partner: P.find(x => x.id === (c.a === m.id ? c.b : c.a)) })).filter(o => o.partner && o.partner.hp > 0 && !(o.partner.sleep > 0) && m.mp >= o.c.mp && o.partner.mp >= o.c.mp);
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
  async function chooseFor(m) {
    while (true) {
      if (G.auto) return aiPlan(m);
      const sk = m.skills;
      const cbs = combosFor(m);
      const c = await menu({ items: [{ label: 'たたかう' }, { label: 'とくぎ', disabled: !sk.length }, { label: 'どうぐ', disabled: !battleItems().length }, { label: 'ぼうぎょ' }, { label: 'にげる', disabled: !!opts.noFlee }, ...(cbs.length ? [{ label: '✦れんけい' }] : [])], where: 'battle' });
      if (c === 5) { const i = await menu({ items: cbs.map(o => ({ label: o.c.name + (o.c.type && o.c.type !== 'normal' ? ` ${typeTag(o.c.type)}` : ''), sub: `MP${o.c.mp}×2`, hint: o.c.desc })), where: 'battle' }); if (i === 'auto') return aiPlan(m); if (i < 0) continue;
        const o = cbs[i]; let t = null; if (o.c.tg === 'enemy') { t = await pickFoe(o.c.type); if (t === 'auto') return aiPlan(m); if (!t) continue; } return { type: 'combo', c: o.c, partner: o.partner, t }; }
      if (c === 'auto') return aiPlan(m);
      if (c === -1) return { type: 'back' };
      if (c === 0) { const t = await pickFoe(null); if (t === 'auto') return aiPlan(m); if (t) return { type: 'atk', t }; continue; }
      if (c === 1) { const i = await menu({ items: sk.map(sid => { const d = DATA.skills[sid]; return { label: d.name + (d.type && d.type !== 'normal' ? ` ${typeTag(d.type)}` : ''), sub: `MP${costOf(m, sid)}`, hint: d.desc, disabled: m.mp < costOf(m, sid) }; }), where: 'battle' });
        if (i === 'auto') return aiPlan(m); if (i < 0) continue; const d = DATA.skills[sk[i]]; let t = null;
        if (d.tg === 'enemy') { t = await pickFoe(d.type); if (t === 'auto') return aiPlan(m); if (!t) continue; } else if (d.tg === 'ally') { t = await pickAlly(); if (!t) continue; }
        return { type: 'skill', s: sk[i], t }; }
      if (c === 2) { const its = battleItems(); const i = await menu({ items: its.map(k => ({ label: DATA.items[k].name, sub: `×${G.inv[k]}`, hint: DATA.items[k].desc })), where: 'battle' }); if (i === 'auto') return aiPlan(m); if (i < 0) continue;
        const it = DATA.items[its[i]]; let t = null; if (it.heal || it.mp || it.cure) { t = await pickAlly(); if (!t) continue; } return { type: 'item', it: its[i], t }; }
      if (c === 3) return { type: 'guard' };
      if (c === 4) return { type: 'flee' };
    }
  }
  async function hit(a, t, power = 1, o = {}) {
    const aAtk = (a.foe ? a.atk : a.st.atk) * (a.atkUp > 0 ? 1.4 : 1) * (a.ail === 'burn' ? .8 : 1); const tDef = t.foe ? t.def : t.st.def * (t.defUp > 0 ? 1.5 : 1);
    let dmg = o.magic ? (aAtk * power * .95 - tDef * .25) : (aAtk * power - tDef * .5);
    const tm = DATA.typeMul(o.type, t.type);
    dmg = Math.max(1, Math.round(dmg * tm * (.86 + R() * .28)));
    if (!o.magic && !o.noMiss && R() < 1 / 32) { Music.sfx('miss'); await bmsg(`${nameOr(t)}は ひらりと かわした！`); return; }
    const crit = !a.foe && !o.noCrit && R() < 1 / 18 + ((a.pas && a.pas.crit) || 0); if (crit) dmg = Math.round(dmg * 1.7 + 2);
    if (t.guard) dmg = Math.ceil(dmg / 2);
    if (crit) { Music.sfx('crit'); screenFx('white'); await bmsg('するどい いちげき！', 200); } else Music.sfx(t.foe ? 'hit' : 'hurt');
    t.hp = Math.max(0, t.hp - dmg); let endured = false; if (!t.foe && t.kind === 'mon' && t.hp <= 0 && (t.bond || 0) >= 30 && !t.endured && R() < (t.bond || 0) / 400) { t.hp = 1; t.endured = endured = true; } redraw();
    const el = t.foe ? $('foe' + F.indexOf(t)) : $('pc' + P.indexOf(t)); const artEl = el && (el.querySelector('.foe-art') || el);
    fxAt(artEl, o.fx || TYPE_FX[o.type] || 'slash', { stamp: t.foe && tm > 1 ? 'good' : t.foe && tm < 1 ? 'bad' : null, crit });
    if (el) { el.classList.add('hitw'); setTimeout(() => el.classList.remove('hitw'), 90); } await wait((crit ? 140 : 60) / (G.speed || 1));
    hitFx(el, dmg, false, crit ? 'crit' : tm > 1 ? 'good' : tm < 1 ? 'bad' : ''); if (!t.foe || crit) { $('battle').classList.remove('quake'); void $('battle').offsetWidth; $('battle').classList.add('quake'); }
    if (tm > 1) await bmsg('こうかが ばつぐんに でた！', 200); else if (tm < 1) await bmsg('あまり きいていない ようだ……', 200);
    await bmsg(t.foe ? `${t.name}に ${dmg}の ダメージ！` : `${nameOf(t)}は ${dmg}の ダメージを うけた！`);
    if (t.sleep > 0 && t.hp > 0 && R() < .5) { t.sleep = 0; await bmsg(`${nameOr(t)}は めを さました！`); }
    if (endured) await bmsg(`${nameOf(t)}は ${G.name}の ために ふんばった！（なつき）`, 400);
    if (t.hp <= 0) { redraw(); await bmsg(t.foe ? `${t.name}を しずめた！` : `${nameOf(t)}は たおれた……`); }
  }
  async function useSkill(a, id, tgt, isFoe) {
    const s = DATA.skills[id];
    if (!isFoe) { const cst = costOf(a, id); if (a.mp < cst) { await bmsg(`${nameOf(a)}は ${s.name}を つかおうとした。 しかし MPが たりない！`); return; } a.mp -= cst; }
    redraw(); Music.sfx(s.heal ? 'heal' : 'magic'); screenFx(s.fx || 'light');
    await bmsg(`${nameOr(a)}は ${s.name}を ${s.verb || 'はなった'}！`, 250);
    const foesOf = () => isFoe ? aliveP() : aliveF(), alliesOf = () => isFoe ? aliveF() : aliveP();
    if (s.power) { const T = (s.tg === 'enemies' || s.tg === 'all') ? foesOf() : [tgt && tgt.hp > 0 && tgt.foe !== !!isFoe ? tgt : foesOf()[Math.floor(R() * foesOf().length)]];
      for (const t of T) { if (t && t.hp > 0) { await hit(a, t, s.power, { magic: s.magic, noCrit: true, noMiss: true, type: s.type, fx: s.type === 'wind' ? 'wind' : s.type === 'grass' ? 'leaf' : s.fx === 'song' ? 'song' : (TYPE_FX[s.type] || s.fx) }); if (s.ail) await setAil(t, s.ail[0], s.ail[1]); if (s.slow && t.hp > 0) { t.slow = 2; await bmsg(`${nameOr(t)}の うごきが にぶった！`, 250); } } } }
    if (s.heal) { const T = s.tg === 'party' ? alliesOf() : [tgt && tgt.hp > 0 ? tgt : a]; for (const t of T) { if (t.hp <= 0) continue; const mx = t.foe ? t.max : t.st.hp; const v = Math.min(Math.round((s.heal + (s.healPct || 0) * mx) * (1 + ((!isFoe && a.pas && a.pas.healUp) || 0))), mx - t.hp); t.hp += v; redraw();
      if (!t.foe) { hitFx($('pc' + P.indexOf(t)), '+' + v, true); fxAt($('pc' + P.indexOf(t)), 'heal'); } await bmsg(`${nameOr(t)}の HPが ${v} かいふくした！`, 300); } }
    if (s.cure && cureAll(alliesOf())) { redraw(); await bmsg('みんなの 状態異常が なおった！', 300); }
    if (s.buff === 'def') { alliesOf().forEach(m => m.defUp = 3); redraw(); await bmsg('みんなの まもりが 灯に つつまれた！'); }
    if (s.buff === 'atk') { alliesOf().forEach(m => m.atkUp = 3); redraw(); await bmsg('みんなの こうげきりょくが あがった！'); }
    if (s.buff === 'spd') { alliesOf().forEach(m => m.spdUp = 3); redraw(); await bmsg('おいかぜが ふいた！ みんなの すばやさが あがった！'); }
    if (s.sleep && s.tg === 'enemy') { const t = tgt && tgt.hp > 0 ? tgt : aliveF()[0]; if (!t.boss && R() < s.sleep) { t.sleep = 2 + Math.floor(R() * 2); redraw(); await bmsg(`${t.name}は ねむってしまった！`); } else await bmsg(`${t.name}には きかなかった！`); }
  }
  async function doParty(a, p) {
    if (p.type === 'skip') return;
    if (a.ail === 'para' && R() < .25) { await bmsg(`${nameOf(a)}は しびれて うごけない！`, 300); return; }
    if (p.type === 'combo') { const pt = p.partner; if (pt.hp <= 0 || a.mp < p.c.mp || pt.mp < p.c.mp) { await bmsg(`${nameOf(a)}は れんけいを しようとしたが うまく いかなかった！`); return; }
      a.mp -= p.c.mp; pt.mp -= p.c.mp; screenFx('white'); Music.sfx('crit'); await bmsg(`${nameOf(a)}と ${nameOf(pt)}の れんけい！`, 300);
      const el1 = $('pc' + P.indexOf(a)), el2 = $('pc' + P.indexOf(pt)); [el1, el2].forEach(e => e && e.classList.add('act')); await useSkill(a, p.c.id, p.t, false); return; }
    if (p.type === 'guard') { a.guard = true; await bmsg(`${nameOf(a)}は みを まもっている。`, 300); return; }
    if (p.type === 'atk') { const t = p.t.hp > 0 ? p.t : aliveF()[0]; await bmsg(`${nameOf(a)}の こうげき！`, 150); await hit(a, t, 1); return; }
    if (p.type === 'item') { const it = DATA.items[p.it]; G.inv[p.it]--; const t = p.t; await bmsg(`${nameOf(a)}は ${it.name}を つかった！`, 200);
      if (it.battle === 'friend') { friendBoost = 2.2; screenFx('heal'); await bmsg('あまい かおりが ただよった……（なかまに なりやすく なった）'); return; }
      if (it.healAll) { aliveP().forEach(m => { m.hp = m.st.hp; m.mp = m.st.mp; }); Music.sfx('heal'); redraw(); await bmsg('みんなの HPと MPが ぜんかいふくした！'); return; }
      if (it.cure) { if (cureAll([t])) { Music.sfx('heal'); redraw(); await bmsg(`${nameOf(t)}の 状態異常が なおった！`); } else await bmsg('しかし なにも おこらなかった。'); return; }
      if (it.stam) { G.stam = G.stamMax; await bmsg('がんばりが 満タンに なった！'); return; }
      if (t.hp <= 0) { await bmsg('しかし なにも おこらなかった。'); return; }
      if (it.heal) { const v = Math.min(it.heal, t.st.hp - t.hp); t.hp += v; Music.sfx('heal'); redraw(); hitFx($('pc' + P.indexOf(t)), '+' + v, true); await bmsg(`${nameOf(t)}の HPが ${v} かいふくした！`); }
      if (it.mp) { const v = Math.min(it.mp, t.st.mp - t.mp); t.mp += v; Music.sfx('heal'); redraw(); await bmsg(`${nameOf(t)}の MPが ${v} かいふくした！`); } return; }
    if (p.type === 'skill') await useSkill(a, p.s, p.t, false);
  }
  async function doFoe(f) {
    const T1 = () => { const A = aliveP(); return A[Math.floor(R() * A.length)]; };
    if (f.ail === 'para' && R() < (f.boss ? .12 : .25)) { await bmsg(`${f.name}は しびれて うごけない！`, 300); return; }
    if (f.charging) { f.charging = false; const s = DATA.skills[f.d.charge]; redraw(); screenFx('dark'); Music.sfx('crit'); $('battle').classList.remove('quake'); void $('battle').offsetWidth; $('battle').classList.add('quake');
      await bmsg(`${f.name}の ${s.name}！！`, 400); for (const t of aliveP()) await hit(f, t, s.power, { noMiss: true, type: s.type });
      if (s.drain) { aliveP().forEach(m => m.mp = Math.max(0, m.mp - s.drain)); redraw(); await bmsg('みんなの MPが すいとられた！'); } if (s.ail) for (const t of aliveP()) await setAil(t, s.ail[0], s.ail[1]); return; }
    if (f.boss) { const acts = f.d.acts || [['atk', 1]]; let r = R(), pick = acts[0][0]; for (const [k, pr] of acts) { if ((r -= pr) <= 0) { pick = k; break; } }
      const fe = $('foe' + F.indexOf(f)); if (fe) { fe.classList.remove('lunge'); void fe.offsetWidth; fe.classList.add('lunge'); }
      if (pick === 'charge' && f.d.charge && !f.chargedLast) { f.charging = true; f.chargedLast = true; redraw(); Music.sfx('magic'); await bmsg(`${f.name}は ちからを ためている……！`, 500);
        if (!G.tips.charge) tip('<b>⚠ ため攻撃が くる！</b><span>次の ターンに 全体へ 大ダメージ。「ぼうぎょ」で 半分に できる。回復も 先に。</span>', 'charge'); return; }
      f.chargedLast = false; if (pick === 'charge') pick = 'atk';
      if (pick === 'atk') { await bmsg(`${f.name}の こうげき！`, 150); await hit(f, T1(), 1, { type: f.type }); return; }
      const s = DATA.skills[pick]; screenFx('dark'); Music.sfx('magic'); await bmsg(`${f.name}の ${s.name}！`, 250);
      if (s.tg === 'one' && s.power) { const t = T1(); await hit(f, t, s.power, { noMiss: true, type: s.type }); if (s.slow && t.hp > 0) { t.slow = 2; await bmsg(`${nameOf(t)}の うごきが にぶった！`); } }
      else if (s.power) { for (const t of aliveP()) await hit(f, t, s.power, { noMiss: true, type: s.type }); }
      if (s.drain) { aliveP().forEach(m => m.mp = Math.max(0, m.mp - s.drain)); redraw(); await bmsg('みんなの MPが すいとられた！'); }
      if (s.sleep) { let any = false; for (const m of aliveP()) if (R() < s.sleep) { m.sleep = 2; any = true; await bmsg(`${nameOf(m)}は ねむってしまった！`, 300); } if (!any) await bmsg('しかし みんな もちこたえた！'); redraw(); }
      if (s.ail) { for (const t of (s.tg === 'all' ? aliveP() : [aliveP()[Math.floor(R() * aliveP().length)]])) await setAil(t, s.ail[0], s.ail[1]); }
      return; }
    if (f.skills && f.skills.length && R() < .35) { const id = f.skills[Math.floor(R() * f.skills.length)]; const s = DATA.skills[id];
      if (s.heal) { if (f.hp < f.max * .6) return useSkill(f, id, f, true); }
      else return useSkill(f, id, T1(), true); }
    { const fe = $('foe' + F.indexOf(f)); if (fe) { fe.classList.remove('lunge'); void fe.offsetWidth; fe.classList.add('lunge'); } }
    await bmsg(`${f.name}の こうげき！`, 150); await hit(f, T1(), 1);
  }
  while (!result) { turnN++;
    P.forEach(m => m.guard = false);
    const plan = new Map(); let flee = false;
    for (let i = 0; i < P.length; i++) { const m = P[i]; if (m.hp <= 0 || m.sleep > 0) continue; if (plan.get(m) && plan.get(m).type === 'skip') continue;
      redraw(i); const p = await chooseFor(m);
      if (p.type === 'back') { let j = i - 1; while (j >= 0 && (P[j].hp <= 0 || P[j].sleep > 0)) j--; if (j >= 0) { plan.delete(P[j]); i = j - 1; } else i = i - 1; continue; }
      if (p.type === 'flee') { flee = true; break; } plan.set(m, p); if (p.type === 'combo') plan.set(p.partner, { type: 'skip' }); }
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
      t.hp = Math.max(t.foe ? 0 : 1, t.hp - v); redraw(); hitFx(t.foe ? $('foe' + F.indexOf(t)) : $('pc' + P.indexOf(t)), v); await bmsg(`${nameOr(t)}は ${t.ail === 'poison' ? 'どく' : 'やけど'}で ${v}の ダメージ！`, 200);
      if (t.foe && t.hp <= 0) await bmsg(`${t.name}を しずめた！`); if (!aliveF().length) { result = 'win'; break; } }
    if (!result) { let healed = false; const aura = P.filter(m => m.hp > 0).reduce((a, m) => a + ((m.pas && m.pas.aura) || 0), 0);
      for (const m of P) if (m.hp > 0) { const pct = ((m.pas && m.pas.regen) || 0) + aura; if (pct > 0 && m.hp < m.st.hp) { const v = Math.min(m.st.hp - m.hp, Math.max(1, Math.round(m.st.hp * pct))); m.hp += v; hitFx($('pc' + P.indexOf(m)), '+' + v, true); healed = true; } }
      if (healed) redraw(); }
    [...P, ...F].forEach(m => { if (m.defUp > 0) m.defUp--; if (m.atkUp > 0) m.atkUp--; if (m.spdUp > 0) m.spdUp--; if (m.slow > 0) m.slow--; });
  }
  const evolving = [];
  if (result === 'win') {
    Music.jingle('victory', opts.boss ? null : fieldSong());
    const exp = F.reduce((s, f) => s + f.exp, 0), gold = F.reduce((s, f) => s + (f.gold || 0), 0);
    F.forEach(f => { if (f.sp) quest(f.sp); }); if (opts.boss) G.bosses = (G.bosses || 0) + 1;
    await bmsg(opts.boss ? `${F[0].name}を うちまかした！` : 'かげものたちを しずめた！', 400);
    if (gold) G.gold += gold;
    const rows = [];
    for (const m of P) { const row = { m, lv0: m.lv, e0: m.exp / need(m.lv), st0: { ...m.st }, skills: [], sp: 0, alive: m.hp > 0 };
      if (m.kind === 'mon' && m.hp > 0) { m.bond = Math.min(100, (m.bond || 0) + 1); m.endured = false; }
      if (m.hp > 0 && exp) { m.exp += exp; while (m.exp >= need(m.lv)) { m.exp -= need(m.lv); const old = m.skills.slice(), ohp = m.st.hp, omp = m.st.mp; m.lv++; calc(m); m.hp += m.st.hp - ohp; m.mp += m.st.mp - omp;
        if (m.kind === 'human') { const g = 1 + (m.lv % 5 === 0 ? 1 : 0); G.sp[m.id] = (G.sp[m.id] || 0) + g; row.sp += g; }
        for (const sk of m.skills) if (!old.includes(sk)) row.skills.push(DATA.skills[sk].name);
        if (m.kind === 'mon' && SPC[m.id].evo && m.lv >= SPC[m.id].evo.lv && !evolving.includes(m)) evolving.push(m); } }
      rows.push(row); }
    const leveled = rows.some(r => r.m.lv > r.lv0); if (leveled) Music.jingle('levelup', opts.boss ? null : fieldSong());
    const statDiff = r => ['hp', 'mp', 'atk', 'def', 'spd'].map(k => { const d = r.m.st[k] - r.st0[k]; return d > 0 ? `${{ hp: 'HP', mp: 'MP', atk: 'こうげき', def: 'ぼうぎょ', spd: 'すばやさ' }[k]}+${d}` : ''; }).filter(Boolean).join(' ');
    $('battle').classList.add('res-on');
    const resP = panel(`<h3>しょうり！</h3><p class="res-top">けいけんち <b>+${exp}</b>　ゴールド <b>+${gold}</b></p><div class="res-list">${rows.map((r, i) => `<div class="res-row${r.alive ? '' : ' down'}"><div class="res-face">${r.m.kind === 'human' ? Art.portrait(r.m.id, !r.alive ? 'closed' : r.m.lv > r.lv0 ? 'joy' : 'smile') : faceOf(r.m)}</div><div>
      <div class="res-name">${esc(nameOf(r.m))}　Lv ${r.lv0}${r.m.lv > r.lv0 ? ` → <b class="up">${r.m.lv}</b>` : ''}${r.alive ? '' : '（たおれていた）'}</div>
      <div class="xp big"><i class="xpa" data-from="${Math.round(r.e0 * 100)}" data-to="${Math.round(r.m.exp / need(r.m.lv) * 100)}" data-lv="${r.m.lv - r.lv0}" style="width:${Math.round(r.e0 * 100)}%"></i></div>
      ${r.m.lv > r.lv0 ? `<div class="res-up">${statDiff(r)}${r.sp ? `　<b>SP+${r.sp}</b>` : ''}${r.skills.length ? `　<b>新しい技：${r.skills.join('・')}</b>` : ''}</div>` : `<div class="res-sub">つぎのLvまで ${need(r.m.lv) - r.m.exp}</div>`}</div></div>`).join('')}</div>
      ${rows.some(r => r.sp) ? '<p class="st-eq">SPは メニューの「スキル」で つかえる</p>' : ''}<p class="res-tap">タップ／Enter で つぎへ</p>`, 'wide res');
    { const top = MENUS[MENUS.length - 1]; top.el.addEventListener('click', () => { if (MENUS.includes(top)) closeMenu(top, -1); });
      top.el.querySelectorAll('.xpa').forEach(el => { const to = +el.dataset.to, lv = +el.dataset.lv; setTimeout(() => { if (lv > 0) { el.style.width = '100%'; setTimeout(() => { el.style.transition = 'none'; el.style.width = '0%'; void el.offsetWidth; el.style.transition = ''; el.style.width = to + '%'; }, 650); } else el.style.width = to + '%'; }, 150); }); }
    await resP;
    if (rows.some(r => r.sp)) tip('<b>スキルポイントが たまった！</b><span>メニューの「スキル」で 技や 能力を 覚えよう。</span>', 'sp1');
    for (const f of F) if (f.sp) { const b = SPC[f.sp].type; const pool = b === 'earth' ? ['ishi', 'ishi', 'mi'] : b === 'grass' ? ['mi', 'kinoko', 'ha'] : b === 'water' ? ['mi', 'shizuku'] : b === 'light' || b === 'dark' ? ['shizuku', 'hoshikake'] : b === 'wind' ? ['kumowata', 'kumowata', 'mi'] : ['mi'];
      if (R() < .35) { const it = pool[Math.floor(R() * pool.length)]; gain(it); await bmsg(`${f.name}は ${DATA.items[it].name}を おとしていった。`, 300); } }
    for (const f of F.filter(f => f.sp)) {
      const S = SPC[f.sp]; const rate = S.legend ? 1 : Math.min(.9, (S.rare ? .16 : .3) * (inParty('mio') ? 1.3 : 1) * friendBoost * (f.shiny ? 1.5 : 1));
      if (R() < rate) { await bmsg(`かげが はれて、${S.name}の すがたに もどった。`, 400); await bmsg(`${S.name}は しばらく ${G.name}を 見つめていたが……`, 500);
        const m = mkMon(f.sp, Math.max(1, f.lv - 1), f.shiny); G.mons.push(m); const isNew = !G.dex.got[f.sp]; G.dex.got[f.sp] = 1; fixTeam();
        Music.sfx('friend'); await bmsg(`${S.name}${f.shiny ? '★' : ''}が なかまに くわわった！${isNew ? '（図鑑に 登録された！）' : ''}`, 900);
        if (!G.team.includes(m.uid)) await bmsg(`（${S.name}は 牧場で まっている。 メニューの「なかま」で 入れかえ できる）`, 700);
        break; } }
  } else if (result === 'lose') { await bmsg(`${G.name}たちは ちからつきた……`, 600); }
  P.forEach(m => { if (m.hp <= 0 && result !== 'lose') m.hp = 1; m.sleep = 0; m.defUp = 0; m.slow = 0; m.ail = null; });
  for (const m of evolving) { const from = SPC[m.id], to = SPC[from.evo.to];
    $('bFoes').innerHTML = `<div class="foe evo"><div class="foe-art">${Art.species(m.id, { shiny: m.shiny })}</div></div>`; await bmsg(`${from.name}の からだが 光に つつまれていく……！`, 700);
    screenFx('white'); Music.jingle('light', opts.boss ? null : fieldSong()); m.id = from.evo.to; const r = m.hp / m.st.hp; calc(m); m.hp = Math.max(1, Math.round(m.st.hp * r)); G.dex.seen[m.id] = 1; G.dex.got[m.id] = 1;
    $('bFoes').innerHTML = `<div class="foe evo"><div class="foe-art">${Art.species(m.id, { shiny: m.shiny })}</div></div>`; await bmsg(`${from.name}は ${to.name}に すがたを かえた！`, 1200); }
  $('battle').hidden = true; B.active = false;
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
async function openMenu() { await run(async () => {
  while (true) {
    const spTotal = G.party.reduce((a, m) => a + (G.sp[m.id] || 0), 0); const rk = rankOf(rankPts()).r.r;
    const base = [{ label: 'つよさ' }, { label: 'スキル', sub: spTotal ? `SP ${spTotal}` : '' }, { label: 'どうぐ' }, { label: 'なかま', sub: `${G.mons.length}ひき` },
      { label: 'いきもの図鑑', sub: `${Object.keys(G.dex.got).length}/${DEX_N}` }, { label: 'クエスト' }, { label: '地図', sub: G.warp ? 'ワープ' : '' }, { label: 'クラフト' }, { label: 'じんぶつ' }, { label: 'きろくする' }, { label: 'あそびかた' }];
    const extra = HOOK.menu.map(f => f()).filter(Boolean);
    const c = await menu({ title: `メニュー　${G.gold}G　ランク${rk}`, items: [...base, ...extra], where: 'side' });
    if (c < 0) return;
    if (c >= base.length) { const r = await extra[c - base.length].fn(); if (r === 'close') return; continue; }
    if (c === 0) await statusPanel();
    if (c === 1) await skillMenu();
    if (c === 2) { const r = await itemMenu(); if (r === 'warped') return; }
    if (c === 3) await partyMenu();
    if (c === 4) await dexMenu();
    if (c === 5) await questLog();
    if (c === 6) { const r = await mapPanel(); if (r === 'warped') return; }
    if (c === 7) await craftMenu();
    if (c === 8) await charBook();
    if (c === 9) { const ok = save(); await panel(`<h3>きろく</h3><p>${ok ? 'ぼうけんの きろくを のこした。' : 'このブラウザでは 保存が できないようだ。'}</p>`); }
    if (c === 10) await panel(`<h3>あそびかた</h3><ul class="howto"><li><b>目標</b>：左上の「▶」が いま やること。上の 矢印が 方角。メニューの「クエスト」と「地図」で くわしく 見られる。</li>
      <li><b>成長</b>：レベルが 上がると スキルポイント（SP）。メニューの「スキル」で 技や 能力を 覚える。</li>
      <li><b>移動</b>：画面左を ドラッグ（PCは WASD）。大きく たおすと 走る。崖や 壁は がんばりゲージで よじ登れる。</li><li><b>滑空</b>：風布を 手に入れたら、空中で もう一度 ジャンプ。</li>
      <li><b>しらべる</b>：E／しらべる ボタン。木（薪）・岩（石）・しげみ（木の実）・キノコ・砂・宝箱・石像・たき火。</li><li><b>バトル</b>：タイプ相性 ◎は 1.5倍。「おまかせ」「倍速」ボタンで テンポよく。</li>
      <li><b>つくる</b>：クラフトで ブロックを 作り、つくる（B）→ 置く（F）・こわす（R）・切りかえ（Q）。</li><li><b>ひかりの種</b>：高台に かくれている。石像に 4こ ささげると 強くなる。</li>
      <li><b>空の島</b>：光る 風の柱（上昇気流）で ジャンプ→滑空すると 舞いあがる。雲海に 落ちると 近くの 島へ もどされる（HPが 少し へる）。</li><li><b>お店</b>：タブで ぶき／ぼうぐ／うる を切りかえ。▲▼で 今の そうびとの 差が わかる。武器は 下取り あり。</li></ul>`, 'wide');
  } }); }
async function statusPanel() {
  const rk = rankOf(rankPts());
  await panel(`<h3>つよさ　<small>冒険者ランク ${rk.r.r}${rk.nx ? `（次の ${rk.nx.r} まで ${rk.nx.pts - rankPts()}pt）` : ''}${G.title ? `　称号：${G.title}` : ''}</small></h3><div class="st-grid">${battleParty().map(m => `<div class="st-card"><div class="st-face">${faceOf(m)}</div><div><b>${esc(nameOf(m))}</b> <small>Lv${m.lv}</small> ${typeTag(m.type)}${expBar(m)}<small class="xpn">つぎのLvまで ${need(m.lv) - m.exp} EXP${m.kind === 'human' ? `　SP ${G.sp[m.id] || 0}` : ''}</small>
    <table><tr><td>HP</td><td>${m.hp}/${m.st.hp}</td><td>MP</td><td>${m.mp}/${m.st.mp}</td></tr><tr><td>こうげき</td><td>${m.st.atk}</td><td>ぼうぎょ</td><td>${m.st.def}</td></tr><tr><td>すばやさ</td><td>${m.st.spd}</td><td></td><td></td></tr></table>
    <div class="st-sk">${m.skills.map(s => DATA.skills[s].name).join('・') || '—'}</div>${m.kind === 'human' ? `<div class="st-eq">ぶき：${DATA.gear[m.id][G.eq[m.id].w].name}（こうげき+${DATA.gear[m.id][G.eq[m.id].w].atk}）<br>ぼうぐ：${DATA.armor[G.eq[m.id].a].name}（ぼうぎょ+${DATA.armor[G.eq[m.id].a].def}）</div>` : ''}</div></div>`).join('')}</div>
    <p class="st-eq">がんばり ${Math.round(G.stamMax)}　ひかりの種 ${G.seeds}こ（見つけた ${Object.keys(G.seedGot).length}/${SEED_N()}）　依頼達成 ${G.bountyDone}　${G.flags.glider ? '風布あり' : ''}</p>`, 'wide'); }
async function skillMenu() {
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
async function travel(dest, x, z, yaw = Math.PI) { await fade(true); G.region = dest; World.setRegion(dest); enemies = []; player.x = x; player.z = z; player.y = surfaceAt(x, z, 99); player.vx = player.vz = player.vy = 0; player.glide = false; trail.length = 0; cam.yaw = yaw; player.yaw = yaw; player.safe = { x, z }; Music.play(fieldSong(), { restart: true }); await wait(400); await fade(false); save(); }
async function warpTo(x, z) { await fade(true); player.x = x; player.z = z; player.y = surfaceAt(x, z, 99); player.safe = { x, z }; player.vx = player.vz = player.vy = 0; trail.length = 0; enemies = []; await wait(200); await fade(false); }
const mapCache = {};
function mapImage() {
  if (mapCache[G.region]) return mapCache[G.region];
  const S = 180, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); const img = x.createImageData(S, S);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const wx = (i / S - .5) * 540, wz = (j / S - .5) * 540, h = hAt(wx, wz); const b = World.biomeAt(wx, wz); let col;
    if (G.region === 2 && h < 1) col = [226, 232, 244]; else if (b === 'crystal') col = [168, 158, 214]; else if (h < -2) col = [28, 58, 96]; else if (h < 0) col = [60, 118, 150]; else if (b === 'shore' || h < 2) col = [214, 196, 146]; else if (b === 'desert') col = [206, 170, 106]; else if (b === 'snow') col = [232, 238, 244];
    else if (b === 'ruins') col = [168, 150, 120]; else if (b === 'rock' || h > 26) col = [138, 132, 124]; else if (b === 'forest') col = [58, 104, 52]; else col = [104, 150, 74];
    const sh = hAt(wx - 3, wz - 3) - h; const k = 1 + Math.max(-.25, Math.min(.25, sh * .06)); const o = (j * S + i) * 4; img.data[o] = col[0] * k; img.data[o + 1] = col[1] * k; img.data[o + 2] = col[2] * k; img.data[o + 3] = 255; }
  x.putImageData(img, 0, 0); return mapCache[G.region] = c.toDataURL(); }
function mapPanel() { return new Promise(res => {
  const r = REGr(); const pos = (x, z) => `left:${(x / 540 + .5) * 100}%;top:${(z / 540 + .5) * 100}%`; const ob = objective(); const marks = [];
  marks.push(`<span class="mk town" style="${pos(r.town.x, r.town.z)}">${TOWN_NAME[G.region]}</span>`);
  if (G.region === 0) { r.beacons.forEach(b => marks.push(`<span class="mk bc${b.lit ? ' lit' : ''}" style="${pos(b.x, b.z)}" title="${DATA.trials[b.i].name}">${b.lit ? '🔥' : '◇'}</span>`)); if (G.order >= 5) marks.push(`<span class="mk" style="${pos(r.shrine.x, r.shrine.z)}">⛩</span>`); }
  else if (G.region === 1) { marks.push(`<span class="mk ru" style="${pos(World.RUINS1[0], World.RUINS1[1])}">星の遺跡</span>`); }
  else if (G.region === 3) { r.lh.forEach(L => marks.push(`<span class="mk bc${(G.lh || [])[L.i] ? ' lit' : ''}" style="${pos(L.x, L.z)}">${(G.lh || [])[L.i] ? '🔥' : '◇'}</span>`)); marks.push(`<span class="mk ru" style="${pos(r.palace.x, r.palace.z)}">深淵の宮</span>`); }
  else { r.shrines.forEach(sh => marks.push(`<span class="mk bc${G.wind[sh.i] ? ' lit' : ''}" style="${pos(sh.x, sh.z)}" title="${DATA.windTrials[sh.i].name}">${G.wind[sh.i] ? '🌀' : '◇'}</span>`)); marks.push(`<span class="mk ru" style="${pos(r.tower.x, r.tower.z)}">星巣の塔</span>`); }
  marks.push(`<span class="mk" style="${pos(r.pier.x, r.pier.z)}">⚓</span>`);
  for (const f of HOOK.mapMarks) marks.push(...f(G.region, pos));
  if (ob.p) marks.push(`<span class="mk goal" style="${pos(ob.p.x, ob.p.z)}">★</span>`);
  marks.push(`<span class="mk me" style="${pos(player.x, player.z)};transform:translate(-50%,-50%) rotate(${Math.PI - player.yaw}rad)">▲</span>`);
  const warps = []; if (G.region === 2) { warps.push({ n: '雲の里ククル', x: r.town.x + 2, z: r.town.z + 4 }); r.shrines.forEach(sh => { if (G.wind[sh.i]) warps.push({ n: DATA.windTrials[sh.i].name, x: sh.x + 1, z: sh.z + 1 }); }); if (G.flags.c3bridge) warps.push({ n: '星巣の塔 入口', x: r.midboss.x, z: r.midboss.z + 3 }); }
  else if (G.warp || G.region === 1) { warps.push({ n: TOWN_NAME[G.region], x: r.town.x + 2, z: r.town.z + 4 }); if (G.region === 0) r.beacons.forEach(b => { if (b.lit) warps.push({ n: `灯台：${DATA.trials[b.i].name}`, x: b.x + 3, z: b.z + 3 }); }); if (G.region === 1 && G.flags.c2rumor) warps.push({ n: '星の遺跡 入口', x: r.ruinsEntrance.x - 3, z: r.ruinsEntrance.z }); }
  if (G.warp || G.region > 0) for (const f of HOOK.warps) warps.push(...f(G.region));
  const el = document.createElement('div'); el.className = 'win panel wide mapp';
  el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button><h3>地図：${REGION_NAME[G.region]}</h3><div class="mapwrap"><div class="map"><img src="${mapImage()}" alt="">${marks.join('')}</div>
    <div class="mapside"><p class="q-now">★ ${ob.t}</p>${warps.length ? `<p class="mh">ワープ</p>${warps.map((w, i) => `<button class="t-btn wbtn" type="button" data-i="${i}">${w.n}</button>`).join('')}` : '<p class="st-eq">最初の 灯台を ともすと ワープが つかえる。</p>'}</div></div>`;
  const M = { el, panel: true, items: [], res }; el.querySelector('.m-x').addEventListener('click', () => { Music.sfx('cancel'); closeMenu(M, -1); });
  el.querySelectorAll('.wbtn').forEach(b => b.addEventListener('click', async () => { const w = warps[+b.dataset.i]; closeMenu(M, -1); Music.sfx('magic'); await warpTo(w.x, w.z); res('warped'); M.res = () => {}; }));
  $('ui').appendChild(el); MENUS.push(M); }); }
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
    const m = team[i]; if (m.id === 'sora') { await monPanel(m); continue; }
    const c = await menu({ title: esc(nameOf(m)), items: [{ label: 'くわしく 見る' }, { label: 'たいれつから はずす' }, { label: '前へ', disabled: i <= 1 }] });
    if (c === 0) await monPanel(m); if (c === 1) G.team.splice(i, 1); if (c === 2) { [G.team[i - 1], G.team[i]] = [G.team[i], G.team[i - 1]]; }
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
    if (c === 0) await monPanel(m);
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
    if (h < (G.region === 2 ? 4 : .3) || Math.hypot(x - r.town.x, z - r.town.z) < 36 || (r.tower && Math.hypot(x - r.tower.x, z - r.tower.z) < 16) || Math.max(Math.abs(x), Math.abs(z)) > 250 || (r.beacons || []).some(b => Math.hypot(b.x - x, b.z - z) < 10)) continue;
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
    }
    let im = Math.hypot(ix, iz); if (im > 1) { ix /= im; iz /= im; im = 1; }
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
    const acc = player.ground || player.glide || player.swim ? 12 : 3;
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
    for (const f of HOOK.push) f(nx, nz, player.y, wx, wz, dt);
    if (blocked(nx, nz, player.y) && player.ground && !player.swim && !(HOOK.noStep && HOOK.noStep(nx, nz, player.y)) && !blocked(nx, nz, player.y + 1.05) && !blocked(player.x, player.z, player.y + 1.05)) { const up = surfaceAt(nx, nz, player.y + 1.1); if (up - player.y <= 1.06) player.y = up; }
    if (blocked(nx, nz, player.y)) {
      if (im > .3 && !player.tired && md === 'field' && !player.swim && !(HOOK.noClimb && HOOK.noClimb())) { wallClimb = true; player.y += 2.6 * dt; player.vy = 0; const px = nx, pz2 = nz; nx = player.x; nz = player.z; if (!blocked(px, pz2, player.y)) { nx = px; nz = pz2; } }
      else if (!blocked(nx, player.z, player.y)) nz = player.z; else if (!blocked(player.x, nz, player.y)) nx = player.x; else { nx = player.x; nz = player.z; } }
    if (climbing && player.tired) { nx = player.x + gn[0] * 2.5 * dt; nz = player.z + gn[2] * 2.5 * dt; }
    for (const t of r.trees) if (t.state === 'ok' && Math.abs(t.x - nx) < 2 && Math.abs(t.z - nz) < 2) { const dx = nx - t.x, dz = nz - t.z, rr = .45 * t.s + .3, d = Math.hypot(dx, dz); if (d < rr && d > 1e-4 && player.y < t.y + 3) { nx = t.x + dx / d * rr; nz = t.z + dz / d * rr; } }
    for (const k of r.rocks) if (k.state === 'ok' && Math.abs(k.x - nx) < 2.5 && Math.abs(k.z - nz) < 2.5) { const dx = nx - k.x, dz = nz - k.z, rr = .8 * k.s + .3, d = Math.hypot(dx, dz); if (d < rr && d > 1e-4 && player.y < k.y + 1) { nx = k.x + dx / d * rr; nz = k.z + dz / d * rr; } }
    for (const b of r.beacons || []) { const dx = nx - b.x, dz = nz - b.z, rr = 1.9, d = Math.hypot(dx, dz); if (d < rr && d > 1e-4) { nx = b.x + dx / d * rr; nz = b.z + dz / d * rr; } }
    for (const n of npcNow()) { const dx = nx - n.x, dz = nz - n.z, d = Math.hypot(dx, dz); if (d < .7 && d > 1e-4) { nx = n.x + dx / d * .7; nz = n.z + dz / d * .7; } }
    if (G.region === 2 && !G.flags.c3bridge) { const dx = nx - r.tower.x, dz = nz - r.tower.z, d = Math.hypot(dx, dz); if (d < 88) { nx = r.tower.x + dx / d * 88; nz = r.tower.z + dz / d * 88; if (barrierT <= 0) { toast('風の 結界に はばまれた……<br><span style="font-size:.6em">三つの 風の祠を ひらこう</span>', 1800); barrierT = 3; } } }
    const moved = Math.hypot(nx - player.x, nz - player.z); player.x = nx; player.z = nz;
    let gh = surfaceAt(player.x, player.z, player.y); if (gh < -1.0 && G.region !== 2) gh = -1.0;
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
    if (player.y <= gh) { if (!player.ground && player.vy < -6.5) { for (let k = 0; k < 3; k++) puffs.push({ x: player.x + (R() - .5) * .8, y: gh + .1, z: player.z + (R() - .5) * .8, t: 0, big: 1 }); Music.sfx('step'); } player.y = gh; player.vy = 0; player.ground = true; player.glide = false; } else if (player.y > gh + .15) player.ground = false;
    dustT -= dt; if (sprint && player.ground && hsp0() > 6 && dustT <= 0) { dustT = .2; puffs.push({ x: player.x - Math.sin(player.yaw) * .4, y: player.y + .05, z: player.z - Math.cos(player.yaw) * .4, t: 0 }); }
    if (player.glide) { glideT -= dt; if (glideT <= 0) { glideT = .06; const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw); for (const sx of [-1, 1]) streaks.push({ x: player.x + rx * sx * 1.3, y: player.y + 2.5, z: player.z + rz * sx * 1.3, t: 0 }); } }
    const using = (sprint ? 14 : 0) + ((climbing && im > .1) || wallClimb ? 12 : 0) + (player.glide && !G.flags.glider3 ? (G.flags.glider2 ? 2.2 : 4.5) * (inUD ? .5 : 1) : 0) + (player.swim ? (im > .05 ? 7 : 2) : 0);
    if (using > 0) G.stam = Math.max(0, G.stam - using * dt); else if (player.ground && !player.swim) G.stam = Math.min(G.stamMax, G.stam + (moved < .01 ? 40 : 26) * dt);
    if (G.stam <= 0) { player.tired = true; player.glide = false; } if (player.tired && G.stam > G.stamMax * .35) player.tired = false;
    if (player.swim && G.stam <= 0) { toast('おぼれかけて、岸に もどった……', 1600); const s = player.safe || r.pier; player.x = s.x; player.z = s.z; player.y = surfaceAt(s.x, s.z, 99); G.stam = G.stamMax * .5; player.tired = false; }
    if (player.ground && !player.swim && terr > (G.region === 2 ? 3 : .2)) player.safe = { x: player.x, z: player.z };
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
    mH.sora.set(0, player.x, player.swim ? player.y - .1 : player.y + walkBob, player.z, 1, player.yaw); mH.sora.n = 1;
    if (player.glide) { player.fold = 1; const d = player.deploy || 0, e = d < 1 ? 1 + 2.2 * Math.pow(d - 1, 3) + 1.2 * Math.pow(d - 1, 2) : 1; const sw = Math.sin(T * 1.7) * .03 + Math.sin(T * 3.1) * .015;
      mGlider.set(0, player.x, player.y - (1 - d) * .6, player.z, Math.max(.15, e), player.yaw, (player.bank || 0) + sw); }
    else if (player.fold > 0) { player.fold = Math.max(0, player.fold - dt * 2.6); const f = player.fold; mGlider.set(0, player.x - Math.sin(player.yaw) * (1 - f) * 1.2, player.y - (1 - f) * 1.4, player.z - Math.cos(player.yaw) * (1 - f) * 1.2, .3 + f * .7, player.yaw, (player.bank || 0) * f); if (!f) mGlider.n = 0; }
    else mGlider.n = 0;
    for (const k in mSp) mSp[k].n = 0;
    for (const k in mH) if (k !== 'sora' && k !== 'statue') mH[k].n = 0;
    const team = battleParty(); const followers = team.filter(m => m.id !== 'sora');
    followers.forEach((m, i) => { const tp = trail[Math.min(trail.length - 1, 5 + i * 5)] || { x: player.x - 1, z: player.z - 1, y: player.y, yaw: player.yaw };
      const y = Math.max(surfaceAt(tp.x, tp.z, tp.y + .5), -1);
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
      if (md === 'field') {
        if (d < 12 && cool <= 0 && !player.glide) moveEntity(e, player.x, player.z, (night > .5 ? 5.2 : 4.3) * (e.legend ? .6 : 1), dt);
        else { e.wt -= dt; if (e.wt <= 0) { e.tx = e.hx + (R() - .5) * 16; e.tz = e.hz + (R() - .5) * 16; e.wt = 3 + R() * 4; } moveEntity(e, e.tx, e.tz, 1.4, dt); }
        if (G.region === 2 && !e.fixedY && hAt(e.x, e.z) < 4) { e.x = e.px ?? e.hx; e.z = e.pz ?? e.hz; e.wt = 0; } e.px = e.x; e.pz = e.z;
        if (d < 1.5 && cool <= 0 && Math.abs(player.y - e.y) < 2.5) { const ee = e; cool = .5; run(async () => { const res = await runBattle(ee.group);
          if (res === 'win') enemies = enemies.filter(x => x !== ee); else if (res === 'flee') cool = 3; else await defeated(); if (res !== 'lose') Music.play(fieldSong()); }); }
      }
      e.y = e.fixedY ?? Math.max(hAt(e.x, e.z), -.5); const lead = e.group[0]; const S = SPC[lead.sp]; const ms = mSp[lead.sp];
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
    const ob = objective(); if (ob.t !== frameBody.obj) { frameBody.obj = ob.t; $('obj').textContent = ob.t; const o = $('obj'); o.classList.remove('fresh'); void o.offsetWidth; o.classList.add('fresh'); clearTimeout(frameBody.objT); frameBody.objT = setTimeout(() => o.classList.remove('fresh'), 6000); }
    if (ob.p) { const d = Math.hypot(ob.p.x - player.x, ob.p.z - player.z); const ang = Math.atan2(ob.p.x - player.x, ob.p.z - player.z) - cam.yaw;
      $('arrow').style.transform = `rotate(${-ang}rad)`; $('guideD').textContent = d < 6 ? 'ここ' : `${Math.round(d)}m`; $('guide').hidden = false; } else $('guide').hidden = true;
    songCheck -= dt; if (songCheck <= 0 && !B.active && !Music.busy) { songCheck = 1; const want = fieldSong(); if (Music.current !== want) Music.play(want); }
    hudT -= dt; if (hudT <= 0) { hudT = .3; hud(); } stamHud();
    saveT += dt; if (saveT > 60 && md === 'field' && player.ground && !player.swim) { saveT = 0; save(); }
  }

  // ---- camera ----
  const tgt = [player.x, player.y + 1.6, player.z];
  const cp = Math.cos(cam.pitch), f = [Math.sin(cam.yaw) * cp, -Math.sin(cam.pitch), Math.cos(cam.yaw) * cp];
  let dist = cam.dist; for (let d = .6; d < cam.dist; d += .3) { const q = V.sub(tgt, V.scale(f, d)); if (Blocks.has(Math.floor(q[0]), Math.floor(q[1]), Math.floor(q[2]))) { dist = Math.max(.8, d - .4); break; } }
  let eye = V.sub(tgt, V.scale(f, dist)); eye[1] = Math.max(eye[1], hAt(eye[0], eye[2]) + .7, G.region === 2 ? -24 : .6);
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
      if (d < 90) for (let k = 0; k < 4; k++) { const y = bot + ((T * 7 + k * span / 4) % span); fx.push({ type: 3, p: [u.x, y, u.z], size: [u.r * .6, u.r * .6], grow: .38 * (1 - Math.abs(y - bot - span / 2) / span), tint: [.7, 1, .95], seed: k + u.x }); } }
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
  if (G.region === 0 && phase === 'field') { const b0 = r.beacons[0]; if (!b0.lit) for (const sh of b0.shards) if (!sh.got) fx.push({ type: 1, p: [sh.x, sh.y + .7, sh.z], size: [1.6, 1.6], grow: 1.5, tint: [1, .8, .35] }); }
  let ghost = null; if (G.build && md === 'field') { const [x, y, z] = buildCell(); ghost = [x, y, z, G.mat]; }
  if (DEBUG) { const hid = window.__norender ? 'hidden' : ''; if (cv.style.visibility !== hid) cv.style.visibility = hid; }
  if (!(DEBUG && window.__norender)) World.render({ eye, tgt, tod: G.tod, T, player: [player.x, player.y, player.z], lantern: lan, beaconU, fx, ghost, darkness, stars: G.flags.c3done ? 1.7 : G.flags.c3start ? .35 : 1 });
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
      if (G.pos) { player.x = G.pos.x; player.z = G.pos.z; player.y = surfaceAt(player.x, player.z, G.pos.y != null ? G.pos.y + .5 : 99); } player.safe = { x: REGr().town.x + 2, z: REGr().town.z + 4 };
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
  const L = ['むかし、この島には 五つの 灯台が あった。', '灯は 海を ゆく 船と、島に すむ いきものたちの 道しるべだった。', 'けれど ある夜、灯は ひとつ残らず 消えた。', 'そして 灯台守の カイトも、夜の 海へ 消えた。', 'それから 三年——'];
  for (const l of L) { el.innerHTML = `<p>${l}</p>`; await wait(2800); }
  el.hidden = true; startField(); await wait(400); run(talkYui);
}
function startField() { if (G.flags.c3done && !G.flags.c3reunion) setTimeout(() => run(async () => { await reunion(); save(); }), 600); phase = 'field'; $('hud').hidden = false; document.body.classList.add('infield'); cam.yaw = Math.atan2(REGr().town.x - player.x, REGr().town.z - player.z); hud(); Music.play(fieldSong(), { restart: true });
  if (G.region === 0 && G.flags.shrineOpen && !G.flags.cleared) { darkTarget = 1; darkness = 1; } if (!G.blk[G.mat]) cycleMat(true); }
window.KZ = { HOOK, get G() { return G; }, player, cam, REG, SPC, DEBUG, COARSE, get phase() { return phase; }, set phase(v) { phase = v; }, get busy() { return busy; }, get region() { return G.region; },
  say, who, nm, menu, panel, confirm, run, toast, tip, gain, save, load, hud, fade, wait, R, esc, $, floatText, runBattle, mkMon, mkHuman, calc, fixTeam, battleParty, allMembers, member, nameOf, inParty,
  defeated, fieldSong, warpTo, credits, rest, objective, need, regionName: r => REGION_NAME[r], townName: r => TOWN_NAME[r], get enemies() { return enemies; }, set enemies(v) { enemies = v; },
  surfaceAt, hAt, Blocks, faceOf, typeTag, closeMenu, MENUS, releaseInputs, startField, npcAt, NPCS, rankPts, get SLOT() { return SLOT; }, keyOf, slotInfo, cookMenu, craftMenu, monPanel, ranch, travel, shopUI, talkInn, wildLevel, setupCh3, showSlots, get trail() { return trail; }, DEX_N: () => DATA.speciesOrder.length, SEED_N };
if (DEBUG) window.__dbg = { shrineEvent, cam, calc, skyTravel2: () => skyTravel(2), get busy() { return busy; }, get phase() { return phase; }, setupCh3, skyTravel, fluteEvent, windEvent, towerGateEvent, finalEvent3, talkSoyogi, buildBridge, objective, credits, questLog, mapPanel, skillMenu, statusPanel, G: () => G, player, REG, runBattle, say, run, mkHuman, mkMon, setupCh2, startField, sail, talk, NPCS, beaconEvent, midbossEvent, altarEvent, openMenu, dexMenu, fixTeam, craftMenu,
  tp: (x, z) => { player.x = x; player.z = z; player.y = surfaceAt(x, z, 99); } };
})();
