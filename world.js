// 風灯の島 — WebGL2 world renderer (terrain, grass, water, sky, shadows, instanced meshes, blocks, particles)
'use strict';
const World = (() => {
  const V = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s] };
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  function persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2), nf = 1 / (n - fa); return new Float32Array([t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) * nf, -1, 0, 0, 2 * fa * n * nf, 0]); }
  function ortho(l, r, b, t, n, f) { return new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1]); }
  function lookAt(e, c, u) { const z = V.norm(V.sub(e, c)), x = V.norm(V.cross(u, z)), y = V.cross(z, x);
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -V.dot(x, e), -V.dot(y, e), -V.dot(z, e), 1]); }
  function mul(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
  function inv(m) { const o = new Float32Array(16);
    const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12,
      b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * d; o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * d; o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * d; o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * d;
    o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * d; o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * d; o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * d; o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * d;
    o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * d; o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * d; o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * d; o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * d;
    o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * d; o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * d; o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * d; o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * d; return o; }

  // ---------- noise & terrain ----------
  let seed = 7331; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  function h2(x, z) { let h = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function vn(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = h2(xi, zi), b = h2(xi + 1, zi), c = h2(xi, zi + 1), d = h2(xi + 1, zi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, z, o) { let s = 0, a = .5, t = 0; for (let i = 0; i < o; i++) { s += a * vn(x, z); t += a; const nx = x * 1.6 - z * 1.2, nz = x * 1.2 + z * 1.6; x = nx + 17.3; z = nz - 9.1; a *= .5; } return s / t; }
  function ridge(x, z, o) { let s = 0, a = .5, t = 0; for (let i = 0; i < o; i++) { const r = 1 - Math.abs(vn(x, z) * 2 - 1); s += a * r * r; t += a; const nx = x * 1.7 - z * 1.1, nz = x * 1.1 + z * 1.7; x = nx + 5.2; z = nz + 31.7; a *= .5; } return s / t; }
  const WORLD = 560, N = 281, SP = WORLD / (N - 1);
  function genHeight(x, z) {
    const d = Math.hypot(x, z) / (WORLD * .5);
    const n = fbm(x * .0055 + 3, z * .0055 - 4, 5), r = ridge(x * .0042 + 10, z * .0042 - 7, 4);
    let h = (n - .42) * 46 + Math.pow(r, 2.4) * 46 + 4;
    const mask = smooth(1.0, .62, d + (vn(x * .01, z * .01) - .5) * .15);
    h = h * mask - 16 * (1 - mask);
    h = lerp(h, 5.2, smooth(.12, .045, d));
    return h;
  }
  // 霧の大陸 (region 1): town south, desert east, snow north, forest west, ruins in the desert
  const TOWN1 = [0, 165], RUINS1 = [150, -20];
  function desertW(x, z) { return smooth(40, 90, x + 25 * Math.sin(z * .02)); }
  function snowW(x, z) { return smooth(-110, -160, z + 20 * Math.sin(x * .025)); }
  function genHeight1(x, z) {
    const d = Math.max(Math.abs(x), Math.abs(z)) / (WORLD * .5);
    const mask = smooth(1.0, .86, d + (vn(x * .012, z * .012) - .5) * .08);
    const coast = smooth(222, 196, z + 12 * Math.sin(x * .03));
    const n = fbm(x * .005 + 11, z * .005 - 3, 5), r = ridge(x * .004 - 4, z * .004 + 9, 4);
    let h = (n - .4) * 30 + 7;
    const mt = smooth(-30, -150, z); h += Math.pow(r, 2.1) * 72 * mt + mt * 8;
    const de = desertW(x, z); h = lerp(h, 5.5 + Math.sin(x * .08 + z * .03) * 1.6 + fbm(x * .02, z * .02, 3) * 5, de * .85);
    const land = mask * coast; h = h * land - 14 * (1 - land);
    h = lerp(h, 4.6, smooth(34, 18, Math.hypot(x - TOWN1[0], z - TOWN1[1])));
    h = lerp(h, 6.5, smooth(40, 26, Math.hypot(x - RUINS1[0], z - RUINS1[1])));
    const pier = smooth(5, 2, Math.abs(x - 6)) * smooth(180, 186, z) * smooth(214, 208, z); h = Math.max(h, lerp(h, .2, pier));
    return h;
  }
  // 天空の浮島 (region 2): 雲海に 浮かぶ 島々
  const TOWN2 = [0, 70], TOWER2 = [0, -160];
  const ISL2 = [
    { x: 0, z: 70, r: 62, h: 14, n: 5 }, { x: 170, z: 25, r: 44, h: 16, n: 6, spire: [182, 14, 64] }, { x: -125, z: 168, r: 40, h: 12, n: 5 },
    { x: -182, z: -35, r: 44, h: 18, n: 7 }, { x: 0, z: -160, r: 66, h: 22, n: 5 },
    { x: 96, z: -72, r: 20, h: 20, n: 6 }, { x: -86, z: -112, r: 18, h: 27, n: 6 }, { x: 96, z: 156, r: 22, h: 10, n: 5 }, { x: -78, z: 18, r: 14, h: 22, n: 4 },
    { x: 210, z: -112, r: 18, h: 30, n: 6 }, { x: -212, z: 104, r: 18, h: 8, n: 4 }, { x: 66, z: -18, r: 13, h: 28, n: 4 }, { x: 150, z: 190, r: 15, h: 6, n: 4 } ];
  function genHeight2(x, z) {
    let h = -60;
    for (const I of ISL2) { const d = Math.hypot(x - I.x, z - I.z); if (d > I.r * 1.35 + 6) continue;
      const e = d + (vn(x * .03 + I.x, z * .03 + I.z) - .5) * I.r * .38 + (vn(x * .11 - I.z, z * .11 + I.x) - .5) * 7;
      const top = I.h + (fbm(x * .02 + I.x * .1, z * .02 - I.z * .1, 4) - .5) * I.n * 2.4 + Math.pow(ridge(x * .015 + I.x, z * .015, 3), 2) * I.n;
      const f = smooth(I.r * 1.04, I.r * .76, e); let v = lerp(-60, top, Math.pow(f, .55));
      if (I.spire) { const [sx, sz, sh] = I.spire; const ds = Math.hypot(x - sx, z - sz) + (vn(x * .25, z * .25) - .5) * 2.4; v = Math.max(v, lerp(v, sh, smooth(11, 5, ds))); }
      h = Math.max(h, v); }
    const dt = Math.hypot(x - TOWN2[0], z - TOWN2[1]); if (dt < 30) h = lerp(h, 14.5, smooth(30, 18, dt));
    const dw = Math.hypot(x - TOWER2[0], z - TOWER2[1]); if (dw < 26) h = lerp(h, 24, smooth(26, 14, dw));
    return h;
  }
  // 海の底 (region 3): 光のとどく 海底の 盆地。 北に 深淵の宮、南に アワの里
  const TOWN3 = [0, 130], PALACE3 = [0, -175], LH3 = [[-150, 20], [150, 40], [10, -60]], TRENCH3 = [-120, -150];
  function genHeight3(x, z) {
    const d = Math.max(Math.abs(x), Math.abs(z)) / (WORLD * .5);
    const n = fbm(x * .006 + 21, z * .006 - 13, 5), r = ridge(x * .005 - 9, z * .005 + 3, 4);
    let h = 8 + (n - .45) * 14 + Math.pow(r, 2.6) * 26;
    const dunes = Math.sin(x * .07 + fbm(x * .01, z * .01, 2) * 6) * .8; h += dunes * smooth(20, 0, Math.abs(n - .45) * 60);
    const wall = smooth(.8, 1.0, d + (vn(x * .02, z * .02) - .5) * .1); h = lerp(h, 46 + fbm(x * .02, z * .02, 3) * 20, wall);
    const tr = Math.hypot(x - TRENCH3[0], z - TRENCH3[1]); h = lerp(h, 2.2, smooth(34, 16, tr + (vn(x * .05, z * .05) - .5) * 12));
    for (const [lx, lz] of LH3) h = lerp(h, 11, smooth(20, 11, Math.hypot(x - lx, z - lz)));
    h = lerp(h, 8, smooth(34, 22, Math.hypot(x - TOWN3[0], z - TOWN3[1])));
    h = lerp(h, 14, smooth(40, 26, Math.hypot(x - PALACE3[0], z - PALACE3[1])));
    return Math.max(h, 2.2);
  }
  const GEN = [genHeight, genHeight1, genHeight2, genHeight3];
  let REGION = 0;
  const H = new Float32Array(N * N);
  function fillH(r) { for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) H[j * N + i] = GEN[r](-WORLD / 2 + i * SP, -WORLD / 2 + j * SP); }
  fillH(0);
  function hAt(x, z) { const fx = clamp((x + WORLD / 2) / SP, 0, N - 1.001), fz = clamp((z + WORLD / 2) / SP, 0, N - 1.001), i = fx | 0, j = fz | 0, tx = fx - i, tz = fz - j, k = j * N + i;
    return lerp(lerp(H[k], H[k + 1], tx), lerp(H[k + N], H[k + N + 1], tx), tz); }
  function biomeAt(x, z) { const h = hAt(x, z);
    if (REGION === 3) { if (Math.hypot(x - TRENCH3[0], z - TRENCH3[1]) < 36) return 'trench'; if (h > 30) return 'rock'; const k = fbm(x * .02 + 3, z * .02 + 8, 3); return k > .58 ? 'coral' : k < .4 ? 'kelp' : 'sand'; }
    if (REGION === 2) { if (h < 3) return 'void'; if (Math.hypot(x - TOWER2[0], z - TOWER2[1]) < 72) return 'crystal'; if (h > 30) return 'rock'; return fbm(x * .015 + 7, z * .015 - 3, 3) > .56 ? 'forest' : 'grass'; }
    if (REGION === 0) { if (h < 2.6) return 'shore'; if (h > 18) return 'rock'; return fbm(x * .012 + 40, z * .012 + 40, 3) > .52 ? 'forest' : 'grass'; }
    if (Math.hypot(x - RUINS1[0], z - RUINS1[1]) < 40) return 'ruins';
    if (h < 2.4) return 'shore'; if (desertW(x, z) > .5) return 'desert'; if (snowW(x, z) > .4 || h > 38) return 'snow'; if (x < -60) return 'forest'; return 'grass'; }
  function nAt(x, z) { const e = 1; return V.norm([hAt(x - e, z) - hAt(x + e, z), 2 * e, hAt(x, z - e) - hAt(x, z + e)]); }

  // ---------- blocks ----------
  const RB = [{ b: new Map(), p: new Set() }, { b: new Map(), p: new Set() }, { b: new Map(), p: new Set() }, { b: new Map(), p: new Set() }];
  let blocks = RB[0].b, protectedB = RB[0].p; let blocksDirty = true;
  const bkey = (x, y, z) => x + ',' + y + ',' + z;
  const Blocks = {
    has: (x, y, z) => blocks.has(bkey(x, y, z)), get: (x, y, z) => blocks.get(bkey(x, y, z)),
    set(x, y, z, t, prot, r) { const B = r == null ? { b: blocks, p: protectedB } : RB[r]; const k = bkey(x, y, z); B.b.set(k, t); if (prot) B.p.add(k); if (r == null || RB[r].b === blocks) blocksDirty = true; },
    del(x, y, z) { const k = bkey(x, y, z); if (protectedB.has(k) || !blocks.has(k)) return null; const t = blocks.get(k); blocks.delete(k); blocksDirty = true; return t; },
    isProt: (x, y, z) => protectedB.has(bkey(x, y, z)),
    move(x, y, z, nx, ny, nz, r) { const B = r == null ? { b: blocks, p: protectedB } : RB[r]; const k = bkey(x, y, z); if (!B.b.has(k)) return false; const t = B.b.get(k), pr = B.p.has(k); B.b.delete(k); B.p.delete(k); const k2 = bkey(nx, ny, nz); B.b.set(k2, t); if (pr) B.p.add(k2); blocksDirty = true; return true; },
    rm(x, y, z, r) { const B = r == null ? { b: blocks, p: protectedB } : RB[r]; const k = bkey(x, y, z); B.b.delete(k); B.p.delete(k); blocksDirty = true; },
    each(r, fn) { for (const [k, t] of RB[r].b) fn(k, t, RB[r].p.has(k)); },
    placed(r) { const B = r == null ? RB[REGION] : RB[r]; const o = []; for (const [k, t] of B.b) if (!B.p.has(k)) o.push(k + ',' + t); return o; },
    load(list, r) { const B = r == null ? RB[REGION] : RB[r]; for (const s of list) { const [x, y, z, t] = s.split(','); B.b.set(x + ',' + y + ',' + z, +t); } blocksDirty = true; },
    into(r) { blocks = RB[r].b; protectedB = RB[r].p; },
  };
  function surfaceAt(x, z, yRef) { const g = hAt(x, z); const ix = Math.floor(x), iz = Math.floor(z);
    for (let iy = Math.floor(yRef + .6); iy >= Math.floor(g) - 1; iy--) if (blocks.has(bkey(ix, iy, iz))) return Math.max(g, iy + 1);
    return g; }

  // ---------- GL ----------
  let gl, cv, COARSE, W = 1, Hh = 1;
  function prog(vs, fs) { const mk = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name.replace('[0]', ''); u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u }; }
  function buf(data, target, usage) { target = target || gl.ARRAY_BUFFER; const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, data, usage || gl.STATIC_DRAW); return b; }
  function attr(loc, b, size, div) { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); if (div) gl.vertexAttribDivisor(loc, div); }

  const COMMON = `
precision highp sampler2DShadow;
uniform vec3 uL; uniform vec3 uLC; uniform vec3 uSkyZ; uniform vec3 uSkyH; uniform vec3 uCam; uniform float uNight; uniform float uT;
uniform vec4 uBeacon[5]; uniform vec4 uPL; uniform float uFlick; uniform float uUW;
uniform sampler2DShadow uShadow; uniform mat4 uLVP; uniform float uShTex;
float hs(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float vnz(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<4;i++){ s+=a*vnz(p); p=mat2(1.6,1.2,-1.2,1.6)*p+17.1; a*=.5; } return s/.9375; }
float shadowAt(vec3 p, vec3 n){
  vec4 s=uLVP*vec4(p+n*.14,1.); vec3 c=s.xyz/s.w*.5+.5;
  if(c.x<0.||c.x>1.||c.y<0.||c.y>1.||c.z>1.) return 1.;
  float sum=0.;
  for(int i=-1;i<=1;i++) for(int j=-1;j<=1;j++) sum+=texture(uShadow, vec3(c.xy+vec2(i,j)*uShTex, c.z-.0006));
  vec2 e=abs(c.xy-.5)*2.; return mix(sum/9., 1., smoothstep(.82,1.,max(e.x,e.y)));
}
vec3 lightIt(vec3 alb, vec3 n, vec3 p, float wrap){
  float d=max((dot(n,uL)+wrap)/(1.+wrap),0.);
  float cl=mix(1., .62, smoothstep(.52,.78, fbm(p.xz*.0032+vec2(uT*.018,uT*.007))))*(1.-uNight)+uNight;
  d*=shadowAt(p,n)*cl;
  vec3 ambN=mix(uSkyH*.7, uSkyZ*.95, n.y*.5+.5)*.8;
  vec3 fill=mix(uSkyH,uSkyZ,.5)*vec3(.46,.48,.5)+uLC*vec3(.15,.1,.04);
  vec3 amb=mix(mix(uLC*vec3(.4,.28,.17), fill, n.y*.5+.5), ambN, uNight);
  vec3 c=alb*(amb+uLC*d);
  if(uUW>.5){ vec2 q=p.xz*.35; float k1=vnz(q+vec2(uT*.35,uT*.2)), k2=vnz(q*1.7-vec2(uT*.28,-uT*.31)); float cs=pow(1.-abs(k1-k2),10.); c+=alb*uLC*cs*.32*max(n.y,0.)*(1.-uNight*.8); }
  for(int i=0;i<5;i++){ if(uBeacon[i].w<.5) continue;
    vec3 v=uBeacon[i].xyz-p; float r=length(v);
    c+=alb*vec3(1.,.55,.25)*(1./(1.+r*r*.012))*max(dot(n,v/r)*.7+.3,0.)*(.35+uNight*2.2)*uFlick; }
  vec3 v=uPL.xyz-p; float r=length(v);
  c+=alb*vec3(1.,.72,.42)*uNight*uPL.w*1.4/(1.+r*r*.06)*max(dot(n,v/max(r,1e-3))*.7+.3,0.);
  return c;
}
vec3 fogIt(vec3 c, vec3 p){ vec3 d=p-uCam; float dist=length(d);
  if(uUW>.5){ float fu=1.-exp(-max(dist-6.,0.)*.021); vec3 fcu=mix(uSkyH, uSkyZ, clamp(.5-d.y/dist,0.,1.)); return mix(c*mix(vec3(1.),vec3(.7,.95,1.05),clamp(dist*.02,0.,1.)), fcu, clamp(fu,0.,1.)); }
  float hk=mix(1.4,.55,smoothstep(-10.,70.,p.y)); float f=1.-exp(-max(dist-38.,0.)*.0024*hk); f*=f*(3.-2.*f);
  vec3 fc=mix(uSkyH, uSkyZ, clamp(d.y/dist,0.,1.)*.5);
  fc+=uLC*pow(max(dot(normalize(d),uL),0.),8.)*.25*(1.-uNight);
  return mix(c, fc, clamp(f,0.,1.)); }
uniform vec2 uRes;
vec3 tone(vec3 c){ c*=1.14; float lu=dot(c,vec3(.299,.587,.114)); c=max(mix(vec3(lu),c,1.13),0.); c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.); c=mix(c,c*c*(3.-2.*c),.25); vec2 q=gl_FragCoord.xy/max(uRes,vec2(1.)); float v=smoothstep(.9,.3,length((q-.5)*vec2(1.,.8))); return c*mix(.74,1.,v); }
`;
  const FS_DEPTH = `#version 300 es
precision mediump float; out vec4 o; void main(){ o=vec4(1.); }`;
  // 道の デカール（地形シェーダで 土色に・草を よける）。 World.setPaths(region, [[x0,z0,x1,z1,w],...]) で 設定（最大8本）
  const PATHF = `
uniform vec4 uPath[8]; uniform float uPathW[8]; uniform float uPathN;
float pathD(vec2 p){ float d=1e4; for(int i=0;i<8;i++){ if(float(i)>=uPathN) break; vec4 s=uPath[i]; vec2 ab=s.zw-s.xy; float t=clamp(dot(p-s.xy,ab)/max(dot(ab,ab),1e-4),0.,1.); d=min(d, length(p-s.xy-ab*t)-uPathW[i]); } return d; }
float pathMask(vec2 p){ return uPathN<.5 ? 1. : smoothstep(-.3,.8,pathD(p)); }
`;
  const PATHS = [0, 1, 2, 3].map(() => ({ s: new Float32Array(32), w: new Float32Array(8), n: 0 }));
  function setPaths(r, list) { const P0 = PATHS[r]; P0.n = Math.min(8, list.length); list.slice(0, 8).forEach((l, i) => { P0.s.set(l.slice(0, 4), i * 4); P0.w[i] = l[4] || 1; }); }
  let grsCells = new Int16Array(2 * 210 * 210), grsCB, grsN = 0;

  let P = {}, VAO = {}, hmTex, shTex, shFbo, SHS, GRID, GSP, terPB, terNB, grsKey = '', shValid = false;
  function setRegion(r) { if (r === REGION && terPB) return; REGION = r; fillH(r);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hmTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, N, gl.RED, gl.FLOAT, H);
    const [Pp, Nn] = terrainArrays(); gl.bindBuffer(gl.ARRAY_BUFFER, terPB); gl.bufferSubData(gl.ARRAY_BUFFER, 0, Pp); gl.bindBuffer(gl.ARRAY_BUFFER, terNB); gl.bufferSubData(gl.ARRAY_BUFFER, 0, Nn);
    chunkBounds(); grsKey = ''; shValid = false;
    Blocks.into(r); blocksDirty = true; }
  // ---------- terrain chunks (10×10, 3 LODs, skirts) ----------
  // 頂点バッファ = N×N の 地表 + N×N の スカート（SKD だけ 下げた 複製）。 インデックスは LOD ごとに チャンク順で 並べ、連続する 可視チャンクを 1回の draw に まとめる
  const CHN = 10, CQ = (N - 1) / CHN, LODS = [1, 2, 4], SKD = 7; let chOff, chCnt, chBox, chLod, chVis;
  function terrainArrays() { const Pp = new Float32Array(N * N * 6), Nn = new Float32Array(N * N * 6);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const k = j * N + i, x = -WORLD / 2 + i * SP, z = -WORLD / 2 + j * SP;
      const l = H[j * N + Math.max(i - 1, 0)], r = H[j * N + Math.min(i + 1, N - 1)], d = H[Math.max(j - 1, 0) * N + i], u = H[Math.min(j + 1, N - 1) * N + i];
      const n = V.norm([l - r, 2 * SP, d - u]); Pp[k * 3] = x; Pp[k * 3 + 1] = H[k]; Pp[k * 3 + 2] = z; Nn.set(n, k * 3);
      const q = (k + N * N) * 3; Pp[q] = x; Pp[q + 1] = H[k] - SKD; Pp[q + 2] = z; Nn.set(n, q); } return [Pp, Nn]; }
  function terrainIndex() { const L = []; chOff = LODS.map(() => new Int32Array(CHN * CHN)); chCnt = LODS.map(() => new Int32Array(CHN * CHN)); let c = 0;
    LODS.forEach((s, li) => { for (let cj = 0; cj < CHN; cj++) for (let ci = 0; ci < CHN; ci++) { const i0 = ci * CQ, j0 = cj * CQ, n = CQ / s, v = (a, b) => (j0 + b * s) * N + i0 + a * s; chOff[li][cj * CHN + ci] = c;
      for (let b = 0; b < n; b++) for (let a = 0; a < n; a++) { const p = v(a, b), q = v(a + 1, b), r = v(a, b + 1), t = v(a + 1, b + 1); L.push(p, r, q, q, r, t); c += 6; }
      const edge = (f) => { for (let k = 0; k < n; k++) { const t0 = f(k), t1 = f(k + 1), b0 = t0 + N * N, b1 = t1 + N * N; L.push(t0, t1, b0, t1, b1, b0); c += 6; } };
      if (cj > 0) edge(k => v(k, 0)); if (cj < CHN - 1) edge(k => v(k, n)); if (ci > 0) edge(k => v(0, k)); if (ci < CHN - 1) edge(k => v(n, k));
      chCnt[li][cj * CHN + ci] = c - chOff[li][cj * CHN + ci]; } });
    return new Uint32Array(L); }
  function chunkBounds() { if (!chBox) { chBox = new Float32Array(CHN * CHN * 6); chLod = new Int8Array(CHN * CHN); chVis = new Uint8Array(CHN * CHN); }
    for (let cj = 0; cj < CHN; cj++) for (let ci = 0; ci < CHN; ci++) { let lo = 1e9, hi = -1e9;
      for (let j = cj * CQ; j <= (cj + 1) * CQ; j++) for (let i = ci * CQ; i <= (ci + 1) * CQ; i++) { const h = H[j * N + i]; if (h < lo) lo = h; if (h > hi) hi = h; }
      const o = (cj * CHN + ci) * 6; chBox[o] = -WORLD / 2 + ci * CQ * SP; chBox[o + 1] = lo - SKD; chBox[o + 2] = -WORLD / 2 + cj * CQ * SP; chBox[o + 3] = chBox[o] + CQ * SP; chBox[o + 4] = hi + .5; chBox[o + 5] = chBox[o + 2] + CQ * SP; } }
  // ---------- frustum helpers（列優先の VP 行列から 6平面） ----------
  function planesOf(m, out) { out = out || new Float32Array(24); const R = i => [m[i], m[4 + i], m[8 + i], m[12 + i]], r0 = R(0), r1 = R(1), r2 = R(2), r3 = R(3);
    [[1, r0], [-1, r0], [1, r1], [-1, r1], [1, r2], [-1, r2]].forEach(([s, r], k) => { const a = r3[0] + s * r[0], b = r3[1] + s * r[1], c = r3[2] + s * r[2], d = r3[3] + s * r[3], l = Math.hypot(a, b, c) || 1;
      out[k * 4] = a / l; out[k * 4 + 1] = b / l; out[k * 4 + 2] = c / l; out[k * 4 + 3] = d / l; }); return out; }
  function boxIn(Pl, x0, y0, z0, x1, y1, z1) { for (let k = 0; k < 24; k += 4) { const a = Pl[k], b = Pl[k + 1], c = Pl[k + 2]; if (a * (a > 0 ? x1 : x0) + b * (b > 0 ? y1 : y0) + c * (c > 0 ? z1 : z0) + Pl[k + 3] < 0) return false; } return true; }
  function sphIn(Pl, x, y, z, r) { for (let k = 0; k < 24; k += 4) if (Pl[k] * x + Pl[k + 1] * y + Pl[k + 2] * z + Pl[k + 3] < -r) return false; return true; }
  const meshes = [];
  const Geo = () => ({ p: [], n: [], c: [] });
  function tri(G, a, b, c, col, ctr) { if (typeof col === 'function') col = col(); let n = V.norm(V.cross(V.sub(b, a), V.sub(c, a)));
    const m = V.scale(V.add(V.add(a, b), c), 1 / 3); if (ctr && V.dot(n, V.sub(m, ctr)) < 0) n = V.scale(n, -1);
    for (const v of [a, b, c]) { G.p.push(...v); G.n.push(...n); G.c.push(...col); } }
  function prism(G, r0, r1, y0, y1, sides, col, cx = 0, cz = 0, sx = 1, sz = 1) {
    const ctr = [cx, (y0 + y1) / 2, cz];
    for (let i = 0; i < sides; i++) { const a0 = i / sides * Math.PI * 2, a1 = (i + 1) / sides * Math.PI * 2; const cc = typeof col === 'function' ? col() : col;
      const P0 = (a, r, y) => [cx + Math.cos(a) * r * sx, y, cz + Math.sin(a) * r * sz];
      const p00 = P0(a0, r0, y0), p01 = P0(a1, r0, y0), p10 = P0(a0, r1, y1), p11 = P0(a1, r1, y1);
      tri(G, p00, p01, p10, cc, ctr); tri(G, p01, p11, p10, cc, ctr); tri(G, [cx, y1, cz], p10, p11, cc, ctr); tri(G, [cx, y0, cz], p00, p01, cc, ctr); } }
  function ico(G, r, c, colFn, jit, sub = 1, sy = .9) {
    const t = (1 + Math.sqrt(5)) / 2; let v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(V.norm);
    let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let s = 0; s < sub; s++) { const cache = {}, nf = []; const mid = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (cache[k] == null) { v.push(V.norm(V.scale(V.add(v[a], v[b]), .5))); cache[k] = v.length - 1; } return cache[k]; };
      for (const [a, b, cc] of f) { const ab = mid(a, b), bc = mid(b, cc), ca = mid(cc, a); nf.push([a, ab, ca], [b, bc, ab], [cc, ca, bc], [ab, bc, ca]); } f = nf; }
    const vv = v.map(p => { const k = 1 + (rnd() - .5) * jit; return [c[0] + p[0] * r * k, c[1] + p[1] * r * k * sy, c[2] + p[2] * r * k]; });
    for (const [a, b, cc] of f) tri(G, vv[a], vv[b], vv[cc], colFn(), c); }
  const shade = (c, v, e = 0) => () => { const k = 1 + (rnd() - .5) * v; return [c[0] * k, c[1] * k, c[2] * k, e]; };
  const solid = (c, e = 0) => () => [c[0], c[1], c[2], e];
  const hex = (h, e = 0) => { const n = parseInt(h.slice(1), 16); return solid([(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255], e); };

  // ---- cute-character kit (v6): auto-smooth normals, ellipsoids, face decals ----
  // smoothN: 位置が一致する頂点の法線を 角度しきい値内で平均 → 丸みのある陰影（三角形数は不変）
  function smoothN(G, from = 0, deg = 68) {
    const cosT = Math.cos(deg * Math.PI / 180), P = G.p, Nn = G.n, nt = P.length / 9, fn = [], map = new Map();
    const key = i => Math.round(P[i] * 2e3) + ',' + Math.round(P[i + 1] * 2e3) + ',' + Math.round(P[i + 2] * 2e3);
    for (let t = from; t < nt; t++) { const o = t * 9; const a = [P[o], P[o + 1], P[o + 2]], b = [P[o + 3], P[o + 4], P[o + 5]], c = [P[o + 6], P[o + 7], P[o + 8]];
      let n = V.cross(V.sub(b, a), V.sub(c, a)); if (V.dot(n, [Nn[o], Nn[o + 1], Nn[o + 2]]) < 0) n = V.scale(n, -1);
      const u = V.norm(n), P3 = [a, b, c], ang = [0, 1, 2].map(k => { const e1 = V.norm(V.sub(P3[(k + 1) % 3], P3[k])), e2 = V.norm(V.sub(P3[(k + 2) % 3], P3[k])); return Math.acos(clamp(V.dot(e1, e2), -1, 1)); });
      fn[t] = [u, ang]; for (let k = 0; k < 3; k++) { const kk = key(o + k * 3); let L = map.get(kk); if (!L) map.set(kk, L = []); L.push(t * 3 + k); } }
    for (let t = from; t < nt; t++) { const o = t * 9, u = fn[t][0];
      for (let k = 0; k < 3; k++) { let s = [0, 0, 0]; for (const tk of map.get(key(o + k * 3))) { const f = fn[(tk / 3) | 0]; if (V.dot(f[0], u) > cosT) s = V.add(s, V.scale(f[0], f[1][tk % 3])); }
        s = V.norm(s); Nn[o + k * 3] = s[0]; Nn[o + k * 3 + 1] = s[1]; Nn[o + k * 3 + 2] = s[2]; } } return G; }
  const cat = (G, H) => { G.p.push(...H.p); G.n.push(...H.n); G.c.push(...H.c); return G; };
  // ellipsoid (smoothed later). ax = optional local frame [X,Y,Z] so it can be squashed along a surface normal
  function ell(G, c, rx, ry, rz, col, sub = 1, jit = 0, ax) {
    const T = Geo(); ico(T, 1, [0, 0, 0], col, jit, sub, 1);
    for (let i = 0; i < T.p.length; i += 3) { const x = T.p[i] * rx, y = T.p[i + 1] * ry, z = T.p[i + 2] * rz;
      const w = ax ? V.add(V.add(V.scale(ax[0], x), V.scale(ax[1], y)), V.scale(ax[2], z)) : [x, y, z];
      T.p[i] = c[0] + w[0]; T.p[i + 1] = c[1] + w[1]; T.p[i + 2] = c[2] + w[2]; }
    for (let i = 0; i < T.n.length; i += 3) { let n = [T.n[i] / rx, T.n[i + 1] / ry, T.n[i + 2] / rz]; if (ax) n = V.add(V.add(V.scale(ax[0], n[0]), V.scale(ax[1], n[1])), V.scale(ax[2], n[2])); n = V.norm(n); T.n[i] = n[0]; T.n[i + 1] = n[1]; T.n[i + 2] = n[2]; }
    return cat(G, T); }
  // local frame on a surface: Z = normal, Y = "up" projected, X = side
  function frame(N) { const Z = V.norm(N); let Y = V.sub([0, 1, 0], V.scale(Z, Z[1])); if (Math.hypot(...Y) < 1e-3) Y = [0, 0, -1]; Y = V.norm(Y); return [V.cross(Y, Z), Y, Z]; }
  // point + normal on an ellipsoid (center c, radii r) toward direction d
  function onEll(c, r, d) { d = V.norm(d); const k = 1 / Math.hypot(d[0] / r[0], d[1] / r[1], d[2] / r[2]); const p = V.add(c, V.scale(d, k));
    return [p, V.norm([d[0] * k / (r[0] * r[0]), d[1] * k / (r[1] * r[1]), d[2] * k / (r[2] * r[2])])]; }
  // domed flat decal (fan) lying on a surface: w/h radii in the local frame, lift along normal
  function decal(G, P, N, w, h, col, n = 6, dome = .25, lift = .004, half = false) {
    const [X, Y, Z] = frame(N), c0 = V.add(P, V.scale(Z, lift + Math.min(w, h) * dome)), ctr = V.sub(P, V.scale(Z, 1)); const cc = typeof col === 'function' ? col() : col;
    const pt = a => V.add(V.add(P, V.scale(Z, lift)), V.add(V.scale(X, Math.cos(a) * w), V.scale(Y, Math.sin(a) * h)));
    const a0 = half ? Math.PI : 0, span = half ? Math.PI : Math.PI * 2;
    for (let i = 0; i < n; i++) tri(G, c0, pt(a0 + i / n * span), pt(a0 + (i + 1) / n * span), cc, ctr); }
  // big glossy eye: dark dome + lighter lower iris + 2 highlight sparkles (emissive)
  function cuteEye(G, P, N, r, o = {}) {
    const [X, Y, Z] = frame(N), side = o.side || 1, dark = o.dark || [.1, .07, .09], iris = o.iris || [.42, .26, .2], tall = o.tall || 1.25;
    const Xs = V.scale(X, side), dz = r * .45, back = -r * .14;
    const at = (x, y) => { const q = 1 - (x * x) - (y * y); return V.add(V.add(V.add(P, V.scale(Xs, x * r)), V.scale(Y, y * r * tall)), V.scale(Z, back + dz * Math.sqrt(Math.max(q, 0)) + r * .03)); };
    ell(G, V.add(P, V.scale(Z, back)), r, r * tall, dz, solid(dark, o.glow ? 1 : 0), 0, 0, [X, Y, Z]);
    { const ic = solid(iris, o.glow ? 1 : .3)(), c0 = at(0, -.36), ctr = V.sub(P, V.scale(Z, r)); for (let i = 0; i < 6; i++) { const a0 = i / 6 * 6.283, a1 = (i + 1) / 6 * 6.283;
      tri(G, c0, at(Math.cos(a0) * .7, -.36 + Math.sin(a0) * .56), at(Math.cos(a1) * .7, -.36 + Math.sin(a1) * .56), ic, ctr); } }
    decal(G, at(.3, .36), Z, r * .3, r * .36, solid([1, 1, 1], 1), 5, .15, 0);
    decal(G, at(-.34, -.44), Z, r * .14, r * .14, solid([1, 1, 1], 1), 4, .15, 0); }
  const rgbOf = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // saturated pastel: 彩度を少し上げ、暗部を持ち上げる
  function pastel(c, sat = 1.18, lift = .14) { const l = (c[0] + c[1] + c[2]) / 3; const s = c.map(v => clamp(l + (v - l) * sat, 0, 1)); return s.map(v => v + (1 - v) * lift); }

  // human model (faces +z) — v5: chibi 頭身・髪型・小物で 個性を出す
  function seg(G, a, b, r0, r1, sides, col) {
    const d = V.sub(b, a), L = Math.hypot(d[0], d[1], d[2]) || 1e-4, w = V.scale(d, 1 / L); const up = Math.abs(w[1]) > .9 ? [1, 0, 0] : [0, 1, 0];
    const u = V.norm(V.cross(up, w)), v = V.cross(w, u); const ctr = V.scale(V.add(a, b), .5);
    for (let i = 0; i < sides; i++) { const a0 = i / sides * Math.PI * 2, a1 = (i + 1) / sides * Math.PI * 2; const cc = typeof col === 'function' ? col() : col;
      const P0 = (an, r, base) => V.add(base, V.add(V.scale(u, Math.cos(an) * r), V.scale(v, Math.sin(an) * r)));
      const p00 = P0(a0, r0, a), p01 = P0(a1, r0, a), p10 = P0(a0, r1, b), p11 = P0(a1, r1, b);
      tri(G, p00, p01, p10, cc, ctr); tri(G, p01, p11, p10, cc, ctr); if (r1 > 0) tri(G, b, p10, p11, cc, ctr); if (r0 > 0) tri(G, a, p00, p01, cc, ctr); } }
  function human(o) {
    const G = Geo(); const s = (o.kid ? .8 : 1) * (o.scale || 1), W = o.wide || 1, T = o.tall || 1;
    const skin = hex(o.skin), hair = hex(o.hair), top = hex(o.top), bot = hex(o.bottom || '#3a3a44'), acc = hex(o.accent || o.top), boot = hex(o.boot || '#4a3222'), trim = hex(o.trim || '#f3c15a');
    const lx = .1 * s * W, legH = .58 * s * T, bodyY0 = legH, bodyY1 = legH + .52 * s * T;
    // legs & round little shoes
    // o.pose = { legL, legR, armL, armR }（ラジアン。前へ ふる＝正）：関節（腰・肩）で 回して 歩く・はたらく 形を つくる
    const PO = o.pose || null, swing = (i0, py, pz, ang) => { if (!ang) return; const c = Math.cos(ang), sn = Math.sin(ang);
      for (let i = i0; i < G.p.length; i += 3) { const dy = G.p[i + 1] - py, dz = G.p[i + 2] - pz; G.p[i + 1] = py + dy * c - dz * sn; G.p[i + 2] = pz + dy * sn + dz * c; const ny = G.n[i + 1], nz = G.n[i + 2]; G.n[i + 1] = ny * c - nz * sn; G.n[i + 2] = ny * sn + nz * c; } };
    for (const sx of [-1, 1]) { const i0 = G.p.length; prism(G, .085 * s, .07 * s, .08 * s, legH, 6, bot, sx * lx, 0); prism(G, .09 * s, .082 * s, .02 * s, .2 * s, 6, boot, sx * lx, 0); ell(G, [sx * lx, .065 * s, .045 * s], .09 * s, .07 * s, .13 * s, boot, 0);
      if (PO) { const ang = sx < 0 ? PO.legL : PO.legR; swing(i0, legH, 0, -(ang || 0)); } }
    // torso
    if (o.belly) ico(G, .34 * s * W, [0, bodyY0 + .24 * s, .04 * s], top, .03, 1, 1.05);
    if (o.robe) prism(G, .32 * s * W, .19 * s * W, .07 * s, bodyY1, 8, top, 0, 0, 1, .85);
    else { prism(G, .21 * s * W, .23 * s * W, bodyY0, bodyY1, 8, top, 0, 0, 1, .8); prism(G, .235 * s * W, .225 * s * W, bodyY0 - .04 * s, bodyY0 + .06 * s, 8, hex(o.belt || '#4a3222'), 0, 0, 1, .82); if (o.skirt) prism(G, .3 * s * W, .22 * s * W, bodyY0 - .14 * s, bodyY0 + .08 * s, 8, hex(o.skirt), 0, 0, 1, .85); }
    if (o.apron) prism(G, .2 * s * W, .18 * s * W, bodyY0 - .15 * s, bodyY1 - .08 * s, 6, hex(o.apron === true ? '#f4ecdb' : o.apron), 0, .07 * s, 1, .55);
    if (o.shawl) ico(G, .3 * s * W, [0, bodyY1 - .05 * s, 0], hex(o.shawl), .04, 1, .45);
    if (o.collar) prism(G, .16 * s, .14 * s, bodyY1 - .06 * s, bodyY1 + .16 * s, 8, hex(o.collar), 0, .01);
    // arms (short, soft) + small round hands
    const sh = bodyY1 - .06 * s, ax = .27 * s * W;
    for (const sx of [-1, 1]) { const i0 = G.p.length, hand = [sx * (ax + .06 * s), bodyY0 - .02 * s, .03 * s]; seg(G, [sx * ax, sh, 0], hand, .07 * s, .058 * s, 6, o.sleeve === 'rolled' ? skin : top);
      if (o.sleeve === 'rolled') seg(G, [sx * ax, sh, 0], [sx * (ax + .02 * s), sh - .15 * s, .01], .082 * s, .077 * s, 6, top); ico(G, .056 * s, hand, skin, 0, 0);
      if (PO) { const ang = sx < 0 ? PO.armL : PO.armR; swing(i0, sh, 0, -(ang || 0)); } }
    if (o.pauldron) ico(G, .14 * s, [ax * (o.pauldron === 'L' ? -1 : 1), sh + .02 * s, 0], hex('#8a8f98'), .1, 1, .6);
    if (o.epaulet) for (const sx of [-1, 1]) prism(G, .13 * s, .11 * s, sh, sh + .05 * s, 8, trim, sx * ax, 0);
    // neck & head (chibi: 大きめの頭・丸い頬)
    prism(G, .065 * s, .065 * s, bodyY1 - .02 * s, bodyY1 + .1 * s, 6, skin);
    const hr = .245 * s * (o.kid ? 1.12 : 1) * (o.headK || 1), hy = bodyY1 + .08 * s + hr * .9, HR = [hr * 1.03, hr * .97, hr];
    const skinW = (() => { const c = skin(); return () => [c[0], c[1], c[2], .3]; })();
    ell(G, [0, hy, 0], HR[0], HR[1], HR[2], o.stone ? skin : skinW, 2);
    // eyes: 大きな たて長の瞳 + ハイライト2つ（発光）
    const eyeCol = o.eye || [.28, .18, .12]; const irisC = mixC(eyeCol, [1, 1, 1], .12), darkC = mixC(eyeCol, [0, 0, 0], .72);
    let ey = 0, ez = 0;
    for (const sx of [-1, 1]) { const [P, N] = onEll([0, hy, 0], HR, [sx * .36, -.2, .9]); ey = P[1]; ez = P[2];
      cuteEye(G, P, N, hr * .15, { side: sx, dark: darkC, iris: irisC, tall: 1.2 });
      const [Q, M] = onEll([0, hy, 0], HR, [sx * .56, -.46, .72]); if (o.kid) decal(G, Q, M, hr * .12, hr * .06, solid([1, .56, .6], .2), 6, .1, hr * .01); }
    { const [P, N] = onEll([0, hy, 0], HR, [0, -.5, .88]); decal(G, P, N, hr * .075, hr * .06, solid([.55, .2, .22]), 4, 0, hr * .006, true); }
    // hair
    const H = o.hairStyle || 'short', hc = hair;
    ico(G, hr * 1.08, [0, hy + hr * .13, -hr * .12], hc, .01, 1, .98);
    const bang = (x, l) => seg(G, [x, hy + hr * .82, hr * .55], [x * 1.1, hy + hr * (.5 - l), hr * 1.0], hr * .22, hr * .04, 5, hc);
    [-.45, -.15, .15, .45].forEach((x, i) => bang(x * hr, i % 2 ? .1 : 0));
    if (H === 'spiky') { for (let i = 0; i < 7; i++) { const a = -1.2 + i * .4; seg(G, [Math.sin(a) * hr * .6, hy + hr * .6, -hr * .2], [Math.sin(a) * hr * 1.25, hy + hr * (1.25 - Math.abs(a) * .3), -hr * .85], hr * .3, 0, 5, hc); }
      seg(G, [0, hy + hr * .9, hr * .1], [hr * .15, hy + hr * 1.7, hr * .3], hr * .18, 0, 5, hc); }
    if (H === 'twin') for (const sx of [-1, 1]) { ico(G, hr * .2, [sx * hr * .85, hy + hr * .05, -hr * .35], hc, .1, 0); seg(G, [sx * hr * .95, hy - hr * .05, -hr * .4], [sx * hr * 1.15, hy - hr * 1.9, -hr * .55], hr * .28, hr * .08, 6, hc); }
    if (H === 'long' || H === 'veil') seg(G, [0, hy + hr * .2, -hr * .6], [0, hy - hr * 2.4, -hr * .75], hr * .95, hr * .7, 8, hc);
    if (H === 'bob' || H === 'cloud') for (const sx of [-1, 1]) ico(G, hr * .5, [sx * hr * .72, hy - hr * .45, -hr * .1], hc, .04, 1, 1);
    if (H === 'cloud') { [[0, 1.05, -.2, .5], [-.55, .85, -.25, .38], [.55, .85, -.25, .38], [0, .55, -.8, .45]].forEach(([x, y, z, r]) => ico(G, hr * r, [x * hr, hy + y * hr, z * hr], hc, .05, 1, 1)); }
    if (H === 'braid') for (let k = 0; k < 5; k++) ico(G, hr * (.26 - k * .02), [hr * .55, hy - hr * (.5 + k * .42), -hr * .35 + k * .02], hc, .1, 0);
    if (H === 'buns') for (const sx of [-1, 1]) ico(G, hr * .32, [sx * hr * .7, hy + hr * .8, -hr * .1], hc, .1, 1);
    if (H === 'bun') ico(G, hr * .42, [0, hy + hr * .95, -hr * .45], hc, .1, 1);
    if (H === 'pony') seg(G, [0, hy + hr * .5, -hr * .9], [0, hy - hr * 1.2, -hr * 1.3], hr * .35, hr * .05, 6, hc);
    if (H === 'floor') { seg(G, [0, hy + hr * .3, -hr * .6], [0, .1, -hr * 1.2], hr * 1.0, hr * 1.5, 8, hc); [[.7, 1.1, .5], [-.6, 1.2, .5], [0, 1.25, .6]].forEach(([x, y, r]) => ico(G, hr * r, [x * hr, hy + y * hr, -hr * .3], hc, .15, 1, 1)); }
    if (o.lock) seg(G, [hr * .3, hy + hr * .8, hr * .5], [hr * .5, hy - hr * .6, hr * .9], hr * .14, hr * .04, 5, hex(o.lock));
    if (H === 'veil') { seg(G, [0, hy + hr * 1.3, -hr * .2], [0, hy - hr * 2.2, -hr * 1.1], hr * .6, hr * 1.1, 8, hex(o.veil || '#2f3f7a')); for (const y of [.4, -.4, -1.2]) ico(G, hr * .1, [0, hy + y * hr, -hr * 1.05], solid([1, .9, .5], 1), 0, 0); }
    // headwear / face props
    if (o.band) { prism(G, hr * 1.08, hr * 1.08, hy + hr * .35, hy + hr * .55, 12, acc); if (o.bandTail) seg(G, [0, hy + hr * .45, -hr * 1.05], [hr * .5, hy - hr * .9, -hr * 2.2], hr * .12, hr * .08, 4, acc); }
    if (o.goggles) { prism(G, hr * 1.1, hr * 1.1, hy + hr * .6, hy + hr * .72, 12, hex('#6a4a2e')); for (const sx of [-1, 1]) prism(G, hr * .22, hr * .22, hy + hr * .55, hy + hr * .85, 8, solid([1, .78, .35], .6), sx * hr * .38, hr * .95, 1, .45); }
    if (o.glasses) for (const sx of [-1, 1]) { const c = [sx * hr * .36, ey, ez + hr * .14]; for (let k = 0; k < 8; k++) { const a0 = k / 8 * 6.283, a1 = (k + 1) / 8 * 6.283; seg(G, [c[0] + Math.cos(a0) * hr * .26, c[1] + Math.sin(a0) * hr * .26, c[2]], [c[0] + Math.cos(a1) * hr * .26, c[1] + Math.sin(a1) * hr * .26, c[2]], hr * .03, hr * .03, 4, hex('#5a4a3a')); } }
    if (o.kerchief) { ico(G, hr * 1.1, [0, hy + hr * .35, -hr * .05], acc, .05, 1, .62); for (const sx of [-1, 1]) seg(G, [sx * hr * .2, hy + hr * 1.0, -hr * .4], [sx * hr * .55, hy + hr * 1.6, -hr * .5], hr * .16, hr * .05, 4, acc); }
    if (o.flower) { for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; ico(G, hr * .13, [hr * .75 + Math.cos(a) * hr * .14, hy + hr * .55 + Math.sin(a) * hr * .14, hr * .3], solid([1, 1, .96], .3), 0, 0); } ico(G, hr * .08, [hr * .75, hy + hr * .55, hr * .36], solid([1, .8, .3], 1), 0, 0); }
    if (o.feather) seg(G, [-hr * .8, hy + hr * .3, 0], [-hr * 1.1, hy + hr * 1.3, -hr * .2], hr * .16, hr * .02, 4, solid([1, 1, 1], .2));
    if (o.tubes) for (const sx of [-1, 1]) prism(G, hr * .12, hr * .12, hy - hr * .9, hy - hr * .6, 6, trim, sx * hr * .75, -hr * .2);
    if (o.beard === 'big') { ico(G, hr * .62, [0, hy - hr * .78, hr * .42], o.beardCol ? hex(o.beardCol) : hc, .18, 1, .9); for (const sx of [-1, 1]) ico(G, hr * .3, [sx * hr * .55, hy - hr * .45, hr * .55], o.beardCol ? hex(o.beardCol) : hc, .15, 0, 1); }
    if (o.beard === 'stubble') ico(G, hr * .34, [0, hy - hr * .7, hr * .6], shade([.42, .32, .26], .05), .05, 1, .45);
    if (o.hat === 'bicorne') { seg(G, [-hr * 1.3, hy + hr * .75, 0], [hr * 1.3, hy + hr * .75, 0], hr * .45, hr * .45, 3, acc); seg(G, [hr * .4, hy + hr * 1.0, 0], [hr * 1.0, hy + hr * 1.8, -hr * .2], hr * .12, 0, 4, solid([1, 1, 1])); }
    else if (o.hat) { prism(G, hr * 1.7, hr * 1.7, hy + hr * .55, hy + hr * .68, 12, acc); prism(G, hr * .9, hr * .02, hy + hr * .6, hy + hr * 1.9, 8, acc); }
    // back / body props
    const by = (bodyY0 + bodyY1) / 2;
    if (o.scarf) { prism(G, .2 * s * W, .2 * s * W, bodyY1 - .04 * s, bodyY1 + .1 * s, 10, acc); seg(G, [.08 * s, bodyY1 + .02 * s, -.18 * s], [.3 * s, bodyY1 - .25 * s, -.75 * s], .09 * s, .07 * s, 4, acc); seg(G, [-.06 * s, bodyY1, -.18 * s], [.05 * s, bodyY1 - .38 * s, -.62 * s], .08 * s, .06 * s, 4, acc); }
    if (o.cape) { const cc = hex(o.cape === true ? (o.accent || o.top) : o.cape); seg(G, [0, bodyY1 + .02 * s, -.12 * s], [0, (o.capeLen || .3) * s, -.34 * s], .26 * s * W, .36 * s * W, 6, cc); }
    if (o.kite) { const c1 = hex('#7fc8e6'), c2 = hex('#f6c64a'); const top0 = [0, bodyY1, -.2 * s]; tri(G, top0, [-.55 * s, by, -.42 * s], [0, .15 * s, -.4 * s], c1(), [0, by, 0]); tri(G, top0, [.55 * s, by, -.42 * s], [0, .15 * s, -.4 * s], c2(), [0, by, 0]); }
    if (o.mantle) for (let k = 0; k < 9; k++) { const a = Math.PI + (k - 4) * .32; seg(G, [Math.sin(a) * .25 * s, bodyY1, Math.cos(a) * .2 * s], [Math.sin(a) * .5 * s, bodyY1 - .55 * s, Math.cos(a) * .42 * s], .09 * s, 0, 4, hex('#1e1b2a')); }
    if (o.sword) seg(G, [-.25 * s, bodyY1 + .15 * s, -.26 * s], [.25 * s, bodyY0 - .1 * s, -.28 * s], .03 * s, .02 * s, 4, hex('#c9ced6'));
    if (o.harp) { for (let k = 0; k < 10; k++) { const a0 = k / 10 * 3.6 - .3, a1 = (k + 1) / 10 * 3.6 - .3; seg(G, [Math.cos(a0) * .2 * s, by + Math.sin(a0) * .25 * s, -.3 * s], [Math.cos(a1) * .2 * s, by + Math.sin(a1) * .25 * s, -.3 * s], .025 * s, .025 * s, 4, trim); } }
    if (o.spear) { seg(G, [.34 * s, .1, .12], [.5 * s, 2.3 * s, .2], .025, .025, 5, hex('#8a6a45')); seg(G, [.5 * s, 2.3 * s, .2], [.52 * s, 2.62 * s, .21], .06, 0, 4, hex('#dfe6ee')); }
    if (o.staff) { seg(G, [-.36 * s, .05, .12], [-.42 * s, 1.95 * s, .16], .025, .025, 5, hex('#6a4a2e')); ico(G, .09 * s, [-.42 * s, 2.05 * s, .16], solid(o.staffGlow || [1, .92, .55], 1), 0, 0); }
    if (o.chime) { seg(G, [-.3 * s, .05, .12], [-.34 * s, 1.5 * s, .14], .025, .025, 5, hex('#8a6a45')); for (let k = 0; k < 3; k++) seg(G, [-.34 * s + (k - 1) * .05, 1.45 * s, .14], [-.34 * s + (k - 1) * .06, 1.25 * s, .14], .012, .012, 3, solid([.8, .95, 1], .5)); }
    if (o.fan) { const c0 = [.33 * s, bodyY0 + .05 * s, .12 * s]; for (let k = 0; k < 5; k++) { const a = -.7 + k * .35; tri(G, c0, [c0[0] + Math.sin(a) * .28 * s, c0[1] + Math.cos(a) * .28 * s, c0[2] + .05], [c0[0] + Math.sin(a + .35) * .28 * s, c0[1] + Math.cos(a + .35) * .28 * s, c0[2] + .05], (k % 2 ? hex('#8fcfe6') : hex('#ffffff'))(), c0); } }
    if (o.lantern) { const lc = o.lanternCol || [1, .74, .36]; seg(G, [.3 * s, bodyY0 + .02 * s, .1 * s], [.34 * s, bodyY0 - .1 * s, .14 * s], .01, .01, 3, hex('#3a2a1a')); prism(G, .07 * s, .07 * s, bodyY0 - .3 * s, bodyY0 - .1 * s, 6, solid(lc, 1), .34 * s, .14 * s); prism(G, .08 * s, .04 * s, bodyY0 - .1 * s, bodyY0 - .06 * s, 6, hex('#3a2a1a'), .34 * s, .14 * s); }
    if (o.satchel) { seg(G, [-.2 * s, bodyY1, .12 * s], [.24 * s, bodyY0 + .05 * s, .14 * s], .02 * s, .02 * s, 3, hex('#6a4a2e')); prism(G, .16 * s, .16 * s, bodyY0 - .18 * s, bodyY0 + .08 * s, 4, hex('#a07a4a'), .3 * s, .05 * s, 1, .55); }
    if (o.notebook) prism(G, .1 * s, .1 * s, bodyY0 + .02 * s, bodyY0 + .2 * s, 4, hex('#e8e0c8'), -.3 * s, .12 * s, 1, .4);
    if (o.basket) { prism(G, .16 * s, .13 * s, bodyY0 - .12 * s, bodyY0 + .06 * s, 8, hex('#b88a4a'), -.36 * s, .08 * s); ico(G, .09 * s, [-.36 * s, bodyY0 + .1 * s, .08 * s], hex('#d8a060'), .1, 0, .7); }
    if (o.hammers) for (const sx of [-1, 1]) { seg(G, [sx * .22 * s, bodyY0, .18 * s], [sx * .24 * s, bodyY0 - .28 * s, .2 * s], .018, .018, 4, hex('#6a4a2e')); prism(G, .05 * s, .05 * s, bodyY0 - .05 * s, bodyY0 + .02 * s, 4, hex('#8a8f98'), sx * .22 * s, .18 * s, 1.8, 1); }
    if (o.spyglass) seg(G, [.25 * s, bodyY0 + .02 * s, .1 * s], [.28 * s, bodyY0 - .26 * s, .12 * s], .035 * s, .028 * s, 6, trim);
    if (o.ladle) seg(G, [-.24 * s, bodyY0 + .1 * s, .15 * s], [-.26 * s, bodyY0 - .25 * s, .17 * s], .015, .015, 4, hex('#b88a4a'));
    if (o.buttons) for (let k = 0; k < 3; k++) ico(G, .025 * s, [.05 * s, bodyY1 - .1 * s - k * .12 * s, .2 * s], trim, 0, 0);
    if (o.crown) { for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; prism(G, .05, 0, hy + hr * .7, hy + hr * 1.6, 4, solid([.55, .42, .85], 1), Math.cos(a) * hr * .8, Math.sin(a) * hr * .8); } }
    smoothN(G);
    if (o.stone) for (let k = 0; k < G.c.length; k += 4) { const l = (G.c[k] + G.c[k + 1] + G.c[k + 2]) / 3 * .35 + .38; G.c[k] = l; G.c[k + 1] = l * .98; G.c[k + 2] = l * .93; G.c[k + 3] = 0; }
    if (o.stoop) { for (let k = 0; k < G.p.length; k += 3) { const y = G.p[k + 1]; if (y > bodyY0) G.p[k + 2] += (y - bodyY0) * .18; } }
    return G;
  }
  function creature(kind) {
    const G = Geo(); const eye = hex('#1d1512');
    if (kind === 'watapoko') { const w = shade([.97, .95, .9], .06); [[0, .42, 0, .34], [-.22, .36, 0, .2], [.22, .36, 0, .2], [-.12, .62, 0, .2], [.12, .62, 0, .2], [0, .7, 0, .2]].forEach(([x, y, z, r]) => ico(G, r, [x, y, z], w, .25, 1, 1));
      prism(G, .02, .01, .8, 1.0, 4, hex('#7fb35a')); ico(G, .05, [-.1, .46, .31], eye, 0, 0); ico(G, .05, [.1, .46, .31], eye, 0, 0); }
    else if (kind === 'iwanoko') { const b = shade([.79, .65, .49], .08); ico(G, .34, [0, .34, 0], b, .1, 1, .8); ico(G, .24, [0, .44, .32], b, .1, 1, 1);
      [[-.18, -.14], [.18, -.14], [-.18, .16], [.18, .16]].forEach(([x, z]) => prism(G, .07, .07, 0, .2, 5, b, x, z));
      [-.16, 0, .16].forEach(z => prism(G, .14, 0, .5, .78, 4, shade([.55, .56, .58], .1), 0, z)); ico(G, .045, [-.09, .5, .53], eye, 0, 0); ico(G, .045, [.09, .5, .53], eye, 0, 0); }
    else if (kind === 'mizumochi') { ico(G, .42, [0, .34, 0], shade([.56, .83, .9], .04), .05, 1, .75); prism(G, .09, 0, .5, .78, 4, hex('#5fb2cf'), -.2, 0); prism(G, .09, 0, .5, .78, 4, hex('#5fb2cf'), .2, 0);
      ico(G, .055, [-.12, .4, .38], eye, 0, 0); ico(G, .055, [.12, .4, .38], eye, 0, 0); }
    else if (kind === 'hoshikage') { ico(G, .32, [0, .4, 0], shade([.18, .23, .47], .05), .15, 1, 1.1); prism(G, .09, 0, .6, .85, 4, hex('#1b2250'), -.16, 0); prism(G, .09, 0, .6, .85, 4, hex('#1b2250'), .16, 0);
      for (let i = 0; i < 7; i++) { const a = i * 2.3; ico(G, .045, [Math.cos(a) * .3, .4 + Math.sin(i * 1.7) * .22, Math.sin(a) * .3], solid([1, .89, .54], 1), 0, 0); }
      ico(G, .06, [-.1, .45, .28], solid([1, 1, 1], 1), 0, 0); ico(G, .06, [.1, .45, .28], solid([1, 1, 1], 1), 0, 0); }
    return G;
  }
  function shadowGeo(kind) {
    const G = Geo(); const dark = shade([.2, .15, .3], .15); const eyeC = solid([1, .43, .69], 1);
    if (kind === 'blob') { ico(G, .5, [0, .5, 0], dark, .35, 1, .9); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; prism(G, .1, 0, .6, 1.1, 4, dark, Math.cos(a) * .25, Math.sin(a) * .25); }
      ico(G, .07, [-.15, .62, .42], eyeC, 0, 0); ico(G, .07, [.15, .62, .42], eyeC, 0, 0); }
    else if (kind === 'guardian') { ico(G, 1.3, [0, 1.3, 0], dark, .4, 1, 1); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; prism(G, .25, 0, 1.6, 2.9, 4, dark, Math.cos(a) * .7, Math.sin(a) * .7); }
      ico(G, .18, [-.4, 1.6, 1.1], eyeC, 0, 0); ico(G, .18, [.4, 1.6, 1.1], eyeC, 0, 0); }
    else if (kind === 'king') { prism(G, .9, .3, 0, 2.4, 9, shade([.1, .08, .15], .1)); ico(G, .32, [0, 2.6, 0], hex('#e8e2f2'), 0, 1, 1);
      ico(G, .06, [-.11, 2.62, .28], solid([1, .83, .42], 1), 0, 0); ico(G, .06, [.11, 2.62, .28], solid([1, .83, .42], 1), 0, 0);
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; prism(G, .07, 0, 2.8, 3.3, 4, solid([.55, .42, .85], 1), Math.cos(a) * .26, Math.sin(a) * .26); } }
    return G;
  }

  // species model (faces +z), parametric by archetype — v6: まるい・大きな瞳・ほっぺ・短い手足（オリジナル造形）
  function rbox(G, c, w, y0, y1, d, b, col) { // 面取りした箱（正面が平ら）
    const pts = [[w, -(d - b)], [w, d - b], [w - b, d], [-(w - b), d], [-w, d - b], [-w, -(d - b)], [-(w - b), -d], [w - b, -d]], ctr = [c[0], (y0 + y1) / 2, c[2]], cc = typeof col === 'function' ? col() : col;
    for (let i = 0; i < 8; i++) { const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % 8]; const a0 = [c[0] + ax, y0, c[2] + az], b0 = [c[0] + bx, y0, c[2] + bz], a1 = [c[0] + ax, y1, c[2] + az], b1 = [c[0] + bx, y1, c[2] + bz];
      tri(G, a0, b0, a1, cc, ctr); tri(G, b0, b1, a1, cc, ctr); tri(G, [c[0], y1, c[2]], a1, b1, cc, ctr); tri(G, [c[0], y0, c[2]], a0, b0, cc, ctr); } }
  const tilt = (az, ax = 0) => { const ca = Math.cos(az), sa = Math.sin(az), cx = Math.cos(ax), sx = Math.sin(ax); // roll about z, then pitch about x
    const X = [ca, sa, 0], Y = [-sa * cx, ca * cx, sx], Z = V.cross(X, Y); return [X, Y, Z]; };
  function cone(G, a, b, r, n, col) { const d = V.sub(b, a), w = V.norm(d), up = Math.abs(w[1]) > .9 ? [1, 0, 0] : [0, 1, 0], u = V.norm(V.cross(up, w)), v = V.cross(w, u), ctr = V.add(a, V.scale(d, .3));
    for (let i = 0; i < n; i++) { const a0 = i / n * 6.283, a1 = (i + 1) / n * 6.283, P = an => V.add(a, V.add(V.scale(u, Math.cos(an) * r), V.scale(v, Math.sin(an) * r))); tri(G, P(a0), P(a1), b, typeof col === 'function' ? col() : col, ctr); } }
  function gem(G, c, r, col) { const P = [[r, 0, 0], [-r, 0, 0], [0, r * 1.3, 0], [0, -r * 1.3, 0], [0, 0, r], [0, 0, -r]].map(d => V.add(c, d));
    for (const [i, j, k] of [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [0, 3, 4], [4, 3, 1], [1, 3, 5], [5, 3, 0]]) tri(G, P[i], P[j], P[k], col(), c); }
  function halo(G, y, r, col, z = 0) { for (let i = 0; i < 12; i++) { const a0 = i / 12 * 6.283, a1 = (i + 1) / 12 * 6.283, P = (a, rr) => [Math.cos(a) * rr, y, z + Math.sin(a) * rr];
    const p0 = P(a0, r), p1 = P(a1, r), q0 = P(a0, r * .78), q1 = P(a1, r * .78); tri(G, p0, p1, q0, col(), [0, y - 1, z]); tri(G, p1, q1, q0, col(), [0, y - 1, z]); } }
  function speciesGeo(S) {
    const G = Geo(), Hd = Geo(); const [ca0, cb0, cc0] = S.col.map(rgbOf); const ca = pastel(ca0), cb = pastel(cb0, 1.15, .08), cc = pastel(cc0, 1.2, .05);
    const A = solid(ca), B = solid(cb), Cc = solid(cc), f = new Set(S.feat || []);
    const lum = c => c[0] * .3 + c[1] * .55 + c[2] * .15, darkBody = lum(ca0) < .3;
    const irisC = mixC(pastel(cb0, 1.5, 0), [0, 0, 0], .35), pink = solid([1, .55, .62], .3), cream = solid(mixC(ca, [1, .99, .95], .6));
    const face = (c, r, o = {}) => { const dx = o.dx || .4, ey = o.ey || 0, er = o.er || .07, hard = o.G || G;
      for (const sx of [-1, 1]) { const [P, N] = o.flat ? [[c[0] + sx * dx, c[1] + ey, c[2] + r[2]], [0, 0, 1]] : onEll(c, r, [sx * dx, ey, 1]);
        cuteEye(hard, P, N, er, darkBody ? { side: sx, dark: cc, iris: mixC(cc, [.15, .05, .2], .55), glow: 1, tall: 1.2 } : { side: sx, dark: [.09, .06, .1], iris: irisC, tall: 1.28 });
        const [Q, M] = o.flat ? [[c[0] + sx * (dx + er * 1.3), c[1] + ey - er * 1.9, c[2] + r[2]], [0, 0, 1]] : onEll(c, r, [sx * (dx + .2), ey - .32, 1]); decal(hard, Q, M, er * 1.05, er * .6, pink, 5, .1, er * .08); }
      const [P, N] = o.flat ? [[c[0], c[1] + ey - er * 1.7, c[2] + r[2]], [0, 0, 1]] : onEll(c, r, [0, ey - .3, 1]); if (!o.noMouth) decal(hard, P, N, er * .5, er * .42, solid([.5, .16, .2]), 4, 0, er * .06, true); };
    const flatBase = (from, y0) => { for (let i = from * 9; i < G.p.length; i += 3) if (G.p[i + 1] < y0) G.p[i + 1] = y0; };
    const tri0 = () => G.p.length / 9;
    let top = .82, topZ = 0;
    switch (S.arch) {
      case 'fluff': { const c = [0, .44, 0], r = [.36, .33, .33]; ell(G, c, ...r, A, 1);
        [[-.27, .55, -.04, .18, 1], [.27, .55, -.04, .18, 1], [0, .75, -.06, .21, 1], [0, .52, -.24, .22, 1]].forEach(([x, y, z, rr, sb]) => ell(G, [x, y, z], rr, rr * .92, rr, A, sb));
        for (const sx of [-1, 1]) ell(G, [sx * .15, .07, .1], .09, .065, .1, B, 0);
        if (f.has('sprout')) { seg(G, [0, .82, -.02], [.02, .98, 0], .02, .015, 4, Cc); for (const sx of [-1, 1]) ell(G, [sx * .08, 1.0, 0], .085, .02, .045, Cc, 0, 0, tilt(sx * .35)); }
        if (f.has('wings')) for (const sx of [-1, 1]) ell(G, [sx * .38, .6, -.14], .2, .1, .035, cream, 0, 0, tilt(sx * .5, -.3));
        if (f.has('horns')) for (const sx of [-1, 1]) cone(G, [sx * .15, .8, 0], [sx * .24, 1.0, -.02], .065, 5, Cc);
        if (f.has('bolt')) { const z = .36, y = .3; const p = [[0, y + .14], [.07, y + .03], [.01, y + .03], [.05, y - .1], [-.06, y + .01], [0, y + .01]].map(([x, yy]) => [x, yy, z]); tri(Hd, p[0], p[1], p[5], Cc(), [0, y, 0]); tri(Hd, p[2], p[3], p[4], Cc(), [0, y, 0]); for (let i = 0; i < Hd.c.length; i += 4) Hd.c[i + 3] = 1; }
        face(c, r, { dx: .4, ey: .02, er: .075 }); top = .9; break; }
      case 'blob': { const c = [0, .3, 0], r = [.46, .32, .42], t0 = tri0(); ell(G, c, ...r, A, 2); flatBase(t0, .04);
        if (f.has('ears')) { const fin = solid(mixC(ca, [1, 1, 1], .3)); for (const sx of [-1, 1]) ell(G, [sx * .47, .2, .04], .14, .03, .09, fin, 0, 0, tilt(-sx * .45));
          // wave-curl tuft: 渦を巻く 波の しっぽ（スパイラル状に 小さな玉を つなぐ）
          const wc = solid(mixC(cb, ca, .25)), curl = (x0, y0, R, s, n, r0, flip) => { for (let i = 0; i < n; i++) { const t = i / (n - 1), a = Math.PI * (1.05 - 1.55 * t), rr = R * (1 - .45 * t);
              ell(G, [x0 + flip * Math.cos(a) * rr, y0 + Math.sin(a) * rr * s, -.02], r0 * (1 - .5 * t), r0 * (1 - .5 * t), r0 * (1 - .5 * t) * .8, wc, 0); } };
          ell(G, [-.02, .6, -.02], .09, .07, .08, wc, 0); curl(.03, .72, .13, 1.1, 6, .07, 1); if (f.has('crown')) curl(-.2, .64, .08, 1, 4, .05, -1); }
        if (f.has('crown')) { // scallop shell tiara + pearl（王冠ではなく 貝がら）
          const hinge = [.22, .56, .16], [X, Y, Z] = tilt(-.32, -.3), sh = solid([1, .78, .86]);
          for (let i = 0; i < 5; i++) { const a = (i - 2) * .36, d = V.add(V.scale(X, Math.sin(a)), V.scale(Y, Math.cos(a)));
            ell(G, V.add(hinge, V.scale(d, .13)), .042, .13, .022, sh, 0, 0, [V.norm(V.cross(d, Z)), d, Z]); }
          ell(G, V.add(hinge, V.scale(Z, .04)), .05, .05, .05, solid([1, .98, .94], .3), 0); }
        if (f.has('frills')) for (let i = 0; i < 5; i++) ell(G, [(i - 2) * .14, .58 - Math.abs(i - 2) * .05, -.1], .07, .12, .05, Cc, 0, 0, tilt(-(i - 2) * .3));
        { const [P, N] = onEll(c, r, [-.45, .85, .35]); decal(G, P, N, .1, .05, solid([1, 1, 1], .3), 6, .15, .006); const [P2, N2] = onEll(c, r, [-.2, .75, .6]); decal(G, P2, N2, .03, .03, solid([1, 1, 1], .3), 5, .15, .006); }
        face(c, r, { dx: .36, ey: .12, er: .085 }); top = .64; break; }
      case 'quad': { const hc = [0, .5, .2], hr = [.27, .25, .24]; ell(G, [0, .3, -.12], .26, .2, .3, A, 1); ell(G, hc, ...hr, A, 1);
        [[-.15, -.28], [.15, -.28], [-.15, .03], [.15, .03]].forEach(([x, z]) => ell(G, [x, .08, z], .075, .09, .075, B, 0));
        ell(G, [0, .38, -.43], .075, .075, .075, f.has('snout') ? A : cream, 0);
        { const [P, N] = onEll([0, .3, -.12], [.26, .2, .3], [0, -.5, .6]); decal(G, P, N, .14, .1, cream, 6, .1, .004); }
        if (f.has('plates')) [[-.28, .47, .11], [-.1, .5, .1], [.06, .47, .08]].forEach(([z, y, rr]) => ell(G, [0, y, z], rr, rr * .75, rr, Cc, 0, .1));
        if (f.has('spikes')) [-.3, -.14, .02].forEach((z, i) => cone(G, [0, .45, z], [0, .57, z - .04], .055, 5, B));
        if (f.has('snout')) { ell(G, [0, .44, .44], .17, .1, .13, A, 1); for (const sx of [-1, 1]) decal(G, [sx * .05, .53, .5], [0, .6, .8], .018, .014, solid([.2, .12, .12]), 4, 0, .003); }
        if (f.has('nose')) ell(G, [0, .47, .45], .06, .05, .05, Cc, 0);
        if (f.has('claws')) for (const sx of [-1, 1]) for (let k = -1; k <= 1; k++) tri(G, [sx * .15 + k * .035 - .012, .03, .1], [sx * .15 + k * .035 + .012, .03, .1], [sx * .15 + k * .035, .02, .15], solid([1, .97, .9])(), [sx * .15, .1, .03]);
        if (f.has('longears')) for (const sx of [-1, 1]) { const ax = tilt(-sx * .2, -.15); ell(G, [sx * .11, .86, .16], .07, .22, .045, A, 0, 0, ax); decal(G, V.add([sx * .11, .86, .16], V.scale(ax[2], .045)), ax[2], .035, .15, solid(mixC(cc, [1, .7, .75], .5)), 6, .05, .002); }
        else if (!f.has('snout')) for (const sx of [-1, 1]) ell(G, [sx * .17, .72, .17], .075, .085, .04, B, 0, 0, tilt(-sx * .35));
        face(hc, hr, f.has('snout') ? { dx: .45, ey: .28, er: .06 } : { dx: .42, ey: f.has('nose') ? .12 : 0, er: .065, noMouth: f.has('nose') });
        top = f.has('longears') ? .74 : .74; topZ = .2; break; }
      case 'bird': { const c = [0, .5, 0], r = [.3, .32, .28]; ell(G, c, ...r, A, 1);
        { const [P, N] = onEll(c, r, [0, -.35, 1]); decal(G, P, N, .17, .17, cream, 8, .15, .004); }
        if (f.has('bat')) { for (const sx of [-1, 1]) { const s = sx, sh = [s * .26, .58, -.02]; const tipA = [s * .8, .78, -.14], tipB = [s * .75, .42, -.18], tipC = [s * .45, .32, -.12];
            tri(G, sh, tipA, tipB, B(), [0, .5, 0]); tri(G, sh, tipB, tipC, B(), [0, .5, 0]); tri(G, sh, [s * .3, .44, -.05], tipC, B(), [0, .5, 0]);
            cone(G, [s * .14, .72, 0], [s * .22, .96, -.04], .07, 4, B); }
          tri(G, [.02, .41, .265], [.05, .41, .262], [.035, .37, .262], solid([1, 1, 1])(), [0, .5, 0]); }
        else { for (const sx of [-1, 1]) ell(G, [sx * .3, .5, -.03], .06, .16, .2, B, 0, 0, tilt(sx * .25, .2));
          cone(G, [0, .51, .25], [0, .49, .36], .05, 4, solid([1, .72, .3])); for (const sx of [-1, 0, 1]) ell(G, [sx * .07, .46, -.32], .05, .03, .14, B, 0, 0, tilt(0, -.5)); }
        for (const sx of [-1, 1]) seg(G, [sx * .09, .22, .05], [sx * .1, 0, .08], .03, .02, 4, solid([1, .72, .3]));
        if (f.has('crest')) [[0, .86, 0, 0], [-.06, .84, -.06, .3], [.06, .84, -.06, -.3]].forEach(([x, y, z, a]) => ell(G, [x, y, z], .035, .11, .06, Cc, 0, 0, tilt(a, .4)));
        if (f.has('horns')) for (const sx of [-1, 1]) cone(G, [sx * .1, .78, .06], [sx * .16, .98, .0], .05, 5, Cc);
        face(c, r, { dx: .36, ey: .24, er: .068 }); top = f.has('crest') ? .96 : .84; break; }
      case 'sprite': { const c = [0, .5, 0], r = [.3, .29, .28]; ell(G, c, ...r, A, 1);
        cone(G, [0, .32, -.06], [.06, .06, -.28], .17, 6, A); ell(G, [.07, .06, -.3], .05, .05, .05, A, 0);
        for (const sx of [-1, 1]) ell(G, [sx * .3, .38, .06], .07, .06, .06, A, 0);
        if (f.has('ears')) for (const sx of [-1, 1]) cone(G, [sx * .15, .68, 0], [sx * .27, .95, -.04], .09, 5, B);
        if (f.has('flame')) { const fo = solid(mixC(cc, [1, .38, .14], .8), 1), fi = solid(mixC(cc, [1, .8, .3], .35), 1);
          ell(G, [0, .8, -.05], .17, .13, .15, fo, 1); cone(G, [0, .82, -.08], [.06, 1.04, -.2], .13, 6, fo); ell(G, [0, .8, .02], .09, .08, .09, fi, 0); cone(G, [0, .82, 0], [.03, .95, -.07], .07, 5, fi);
          for (const sx of [-1, 1]) cone(G, [sx * .13, .76, -.04], [sx * .2, .9, -.12], .07, 5, fo); }
        if (f.has('horns')) for (const sx of [-1, 1]) cone(G, [sx * .2, .72, .06], [sx * .3, .9, .02], .05, 5, B);
        if (f.has('leaf')) { seg(G, [0, .78, 0], [.02, .88, 0], .018, .014, 4, B); ell(G, [.1, .92, 0], .14, .025, .06, Cc, 0, 0, tilt(.3)); }
        if (f.has('stars')) for (let i = 0; i < 5; i++) { const a = i * 1.26 + .3; gem(Hd, [Math.cos(a) * .42, .5 + Math.sin(i * 2.1) * .2, Math.sin(a) * .36], .05, solid(cc, 1)); }
        if (f.has('wings')) for (const sx of [-1, 1]) { const w = solid(mixC(cc, [1, 1, 1], .3), .3); tri(G, [sx * .15, .6, -.2], [sx * .6, .85, -.3], [sx * .5, .5, -.3], w(), [0, .5, 0]); tri(G, [sx * .15, .55, -.2], [sx * .45, .4, -.28], [sx * .3, .28, -.26], w(), [0, .5, 0]); }
        face(c, r, { dx: .38, ey: 0, er: .075 }); top = f.has('ears') ? .86 : .84; break; }
      case 'golem': { rbox(Hd, [0, 0, 0], .22, .15, .52, .19, .06, B); rbox(Hd, [0, 0, .03], .34, .5, .98, .28, .1, A); rbox(Hd, [0, 0, .03], .3, .98, 1.04, .24, .08, solid(mixC(ca, [1, 1, 1], .25)));
        for (const sx of [-1, 1]) { rbox(Hd, [sx * .14, 0, .03], .09, 0, .17, .12, .03, B); ell(G, [sx * .32, .34, .04], .1, .14, .1, A, 0); }
        if (f.has('core')) ell(G, [0, .34, .2], .07, .08, .04, solid(cc, 1), 0);
        if (f.has('moss')) [[-.18, 1.05, -.05, .13], [.12, 1.06, .05, .11], [.22, 1.0, -.12, .09]].forEach(([x, y, z, rr]) => ell(G, [x, y, z], rr, rr * .55, rr, solid(pastel([.35, .6, .3])), 0, .15));
        face([0, .74, .03], [.34, .24, .28], { flat: 1, G: Hd, dx: .14, ey: 0, er: .08 }); top = 1.04; topZ = .02; break; }
      case 'plant': if (f.has('cactus')) { seg(G, [0, .12, 0], [0, .64, 0], .23, .23, 8, A); ell(G, [0, .64, 0], .23, .2, .23, A, 1);
          for (const sx of [-1, 1]) { seg(G, [sx * .2, .38, 0], [sx * .34, .4, 0], .07, .07, 6, A); seg(G, [sx * .34, .4, 0], [sx * .35, .56, 0], .07, .07, 6, A); ell(G, [sx * .35, .56, 0], .07, .06, .07, A, 0); }
          for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; ell(G, [Math.cos(a) * .07, .86, Math.sin(a) * .07], .07, .03, .07, Cc, 0); } ell(G, [0, .87, 0], .04, .03, .04, solid([1, .95, .8]), 0);
          for (const [x, y] of [[-.18, .3], [.17, .26], [-.1, .7], [.12, .74], [0, .2]]) { const [P, N] = onEll([0, .45, 0], [.23, .5, .23], [x, y - .45, .3]); decal(G, P, N, .012, .012, solid([1, 1, .95]), 3, .6, .004); }
          face([0, .5, 0], [.23, .32, .23], { dx: .42, ey: .05, er: .06 }); top = .9; }
        else { const c = [0, .42, 0], r = [.3, .3, .28]; ell(G, c, ...r, A, 1);
          for (const sx of [-1, 1]) { ell(G, [sx * .12, .06, .05], .08, .06, .09, B, 0); ell(G, [sx * .34, .4, .05], .15, .035, .07, B, 0, 0, tilt(sx * .35)); ell(G, [sx * .07, .76, 0], .08, .02, .04, B, 0, 0, tilt(sx * .5)); }
          { const [P, N] = onEll(c, r, [0, -.4, 1]); decal(G, P, N, .15, .12, cream, 6, .1, .004); }
          if (f.has('bud')) { ell(G, [0, .86, 0], .11, .13, .11, Cc, 1); cone(G, [0, .96, 0], [0, 1.06, .02], .05, 5, Cc); }
          if (f.has('petals')) { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; const d = [Math.cos(a), 0, Math.sin(a)]; ell(G, [d[0] * .16, .76, d[2] * .16 - .02], .1, .035, .07, Cc, 0, 0, [[d[2], 0, -d[0]], [-d[0] * .4, .92, -d[2] * .4], [d[0], .38, d[2]]].map(V.norm)); } ell(G, [0, .78, -.02], .07, .04, .07, solid([1, .88, .4]), 0); }
          face(c, r, { dx: .4, ey: .02, er: .07 }); top = f.has('petals') ? .82 : .8; }
        break;
      case 'fish': { const c = [0, .5, 0], r = [.34, .3, .42]; ell(G, c, ...r, A, 1); { const [P, N] = onEll(c, r, [0, -.6, .5]); decal(G, P, N, .24, .2, cream, 8, .12, .004); }
        seg(G, [0, .52, -.36], [0, .58, -.72], .15, .05, 6, A); for (const sx of [-1, 1]) ell(G, [sx * .13, .6, -.76], .15, .03, .08, B, 0, 0, tilt(sx * .3));
        const big = f.has('fins'); for (const sx of [-1, 1]) ell(G, [sx * (big ? .4 : .34), .44, .04], big ? .26 : .14, .03, big ? .14 : .08, B, 0, 0, tilt(-sx * .35));
        ell(G, [0, .8, -.08], .03, .08, .1, B, 0, 0, tilt(0, .5));
        if (f.has('stars')) for (let i = 0; i < 5; i++) gem(Hd, [(i % 3 - 1) * .16, .8 - (i % 2) * .04, (i / 3 | 0) * .24 - .12], .045, solid(cc, 1));
        if (f.has('rainbow')) { const cols = [[1, .55, .6], [1, .9, .5], [.55, .85, 1]]; cols.forEach((cl, k) => { const R0 = .3 - k * .05, R1 = R0 - .045; for (let i = 0; i < 8; i++) { const a0 = i / 8 * Math.PI, a1 = (i + 1) / 8 * Math.PI, P = (a, rr) => [Math.cos(a) * rr, .86 + Math.sin(a) * rr, -.12];
            tri(G, P(a0, R0), P(a1, R0), P(a0, R1), solid(cl, .3)(), [0, .86, -.5]); tri(G, P(a1, R0), P(a1, R1), P(a0, R1), solid(cl, .3)(), [0, .86, -.5]); } }); }
        face(c, r, { dx: .5, ey: .08, er: .075 }); top = .82; break; }
    }
    if (f.has('halo')) halo(Hd, top + (f.has('crown') ? .26 : .14), .16, solid(mixC(cc, [1, .95, .7], .5), 1), topZ);
    if (f.has('crown') && S.arch !== 'blob') for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; cone(Hd, [Math.cos(a) * .11, top - .02, Math.sin(a) * .11 + topZ], [Math.cos(a) * .13, top + .15, Math.sin(a) * .13 + topZ], .05, 4, solid([1, .82, .36], .6)); }
    if (f.has('crown') && S.arch !== 'blob') halo(Hd, top + .01, .15, solid([1, .82, .36], .6), topZ);
    smoothN(G); return cat(G, Hd);
  }
  function propGeo(kind) {
    const G = Geo();
    if (kind === 'ship') { prism(G, 1.6, 2.2, -.8, .9, 10, shade([.45, .30, .18], .1), 0, 0, 1, 2.6); prism(G, 1.8, 1.8, .9, 1.05, 10, shade([.58, .42, .26], .1), 0, 0, 1, 2.5);
      prism(G, .1, .08, 1, 7.5, 6, hex('#6a4a2e'), 0, .6); prism(G, .06, .06, 5.8, 6, 4, hex('#6a4a2e'), 0, .6, 30, 1);
      tri(G, [-2, 6, .7], [2, 6, .7], [2, 2.2, .9], solid([.95, .93, .86])); tri(G, [-2, 6, .7], [2, 2.2, .9], [-2, 2.2, .9], solid([.95, .93, .86])); tri(G, [0, 7.4, .6], [0, 6.2, .6], [1.2, 6.6, .6], solid([.85, .25, .2])); }
    else if (kind === 'chest') { prism(G, .5, .5, 0, .5, 4, hex('#7a4a22'), 0, 0, 1, .7); prism(G, .52, .45, .5, .7, 4, hex('#8a5a2a'), 0, 0, 1, .7); prism(G, .08, .08, .3, .55, 4, solid([.95, .78, .3]), 0, .35); }
    else if (kind === 'board') { prism(G, .06, .06, 0, 1.8, 4, hex('#5a3a22'), -.8, 0); prism(G, .06, .06, 0, 1.8, 4, hex('#5a3a22'), .8, 0); prism(G, 1.05, 1.05, 1, 1.8, 4, hex('#8a6a42'), 0, 0, .78, .08);
      for (let i = 0; i < 3; i++) prism(G, .18, .18, 1.2 + (i % 2) * .25, 1.4 + (i % 2) * .25, 4, solid([.95, .92, .82]), -.45 + i * .45, .06, .9, .1); }
    else if (kind === 'altar') { prism(G, 2.4, 2.2, 0, .5, 8, shade([.55, .52, .48], .1)); prism(G, 1.4, 1.2, .5, .9, 8, shade([.62, .6, .55], .1)); ico(G, .5, [0, 1.6, 0], solid([.9, .85, 1], 1), 0, 1, 1); }
    return G;
  }
  // ---------- mesh (instanced) ----------
  // m.data / m.set / m.n / m.dirty は そのまま（game.js・各モジュールの 契約）。 GPU へは 毎フレーム 視錐台（影は ライト箱）で 間引いた 詰め直しを 送る
  function makeMesh(G, maxN, opts = {}) {
    const pb = buf(new Float32Array(G.p)), nb = buf(new Float32Array(G.n)), cb = buf(new Float32Array(G.c));
    const data = new Float32Array(maxN * 5);
    const mk = () => { const vao = gl.createVertexArray(); gl.bindVertexArray(vao); attr(0, pb, 3); attr(1, nb, 3);
      gl.bindBuffer(gl.ARRAY_BUFFER, cb); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
      const ib = buf(new Float32Array(maxN * 5), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 20, 0); gl.vertexAttribDivisor(3, 1);
      gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 20, 12); gl.vertexAttribDivisor(4, 1);
      gl.enableVertexAttribArray(5); gl.vertexAttribPointer(5, 1, gl.FLOAT, false, 20, 16); gl.vertexAttribDivisor(5, 1); return [vao, ib]; };
    const [vao, ib] = mk(), [svao, sib] = mk();
    // 形の 外接球（y軸回転に 不変）： 中心の 高さ cy・半径 br（スケール1あたり）
    let rxz = 0, y0 = 1e9, y1 = -1e9; for (let i = 0; i < G.p.length; i += 3) { rxz = Math.max(rxz, Math.hypot(G.p[i], G.p[i + 2])); y0 = Math.min(y0, G.p[i + 1]); y1 = Math.max(y1, G.p[i + 1]); }
    if (!(y1 >= y0)) { y0 = y1 = 0; }
    const m = { vao, ib, svao, sib, data, cdata: new Float32Array(maxN * 5), count: G.p.length / 3, n: 0, vn: 0, sn: 0, maxN, sway: opts.sway || 0, cast: opts.cast !== false, dirty: true,
      cy: (y0 + y1) / 2, br: Math.hypot(rxz, (y1 - y0) / 2) + (opts.sway ? .4 : .05),
      set(i, x, y, z, s, r) { const o = i * 5; data[o] = x; data[o + 1] = y; data[o + 2] = z; data[o + 3] = s; data[o + 4] = r; this.dirty = true; } };
    meshes.push(m); return m;
  }
  // 可視インスタンスだけを 詰めて アップロード（返り値＝描く数）
  function cullMesh(m, Pl, vaoIb, maxD, cx, cz) { const d = m.data, o = m.cdata, n = Math.min(m.n, m.maxN); let k = 0;
    for (let i = 0; i < n; i++) { const b = i * 5, s = Math.abs(d[b + 3]); if (!(s > 1e-4)) continue; const x = d[b], z = d[b + 2], r = m.br * s;
      if (maxD && (x - cx) * (x - cx) + (z - cz) * (z - cz) > (maxD + r) * (maxD + r)) continue;
      if (!sphIn(Pl, x, d[b + 1] + m.cy * s, z, r)) continue;
      const q = k * 5; o[q] = x; o[q + 1] = d[b + 1]; o[q + 2] = z; o[q + 3] = d[b + 3]; o[q + 4] = d[b + 4]; k++; }
    if (k) { gl.bindBuffer(gl.ARRAY_BUFFER, vaoIb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, o, 0, k * 5); } return k; }

  // ---------- init ----------
  let quadVAO, triVAO, partVAO, cubeVAO, blockIB, blockN = 0, blockData = new Float32Array(4 * 9000), ghostIB, ghostVAO;
  const PARTS = 260;
  function init(canvas, coarse) {
    cv = canvas; COARSE = coarse;
    gl = cv.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance' });
    if (!gl) return false;
    GRID = COARSE ? 150 : 210; GSP = COARSE ? .34 : .31; SHS = COARSE ? 1536 : 2048; QL = COARSE ? 1 : 2;
    hmTex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hmTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, N, N, 0, gl.RED, gl.FLOAT, H);
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    shTex = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, shTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, SHS, SHS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    shFbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, shFbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shTex, 0);
    gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);

    // sky
    P.sky = prog(`#version 300 es
in vec2 aP; out vec2 vP; void main(){ vP=aP; gl_Position=vec4(aP,1.,1.); }`, `#version 300 es
precision highp float; in vec2 vP; out vec4 o; uniform mat4 uInvVP; uniform vec3 uSun; uniform float uStars;
${COMMON}
void main(){
  vec4 w=uInvVP*vec4(vP,1.,1.); vec3 dir=normalize(w.xyz/w.w-uCam); float y=dir.y;
  if(uUW>.5){ vec3 cu=mix(uSkyZ*.55, uSkyH*1.15, smoothstep(-.4,.95,y)); float ray=pow(max(y,0.),3.)*(.5+.5*sin(dir.x*18.+uT*.6)*sin(dir.z*14.-uT*.45)); cu+=uLC*ray*.35*(1.-uNight*.7);
    if(y>.2){ vec2 sq=dir.xz/y*3.+uT*.05; cu+=uLC*pow(1.-abs(vnz(sq)-vnz(sq*1.3+4.)),12.)*smoothstep(.2,.9,y)*.5; } o=vec4(tone(cu),1.); return; }
  vec3 col=mix(uSkyH, uSkyZ, pow(clamp(y,0.,1.),.55)); col=mix(col, uSkyH*.75, smoothstep(0.,-.25,y));
  float sd=max(dot(dir,uSun),0.); float up=smoothstep(-.12,.02,uSun.y);
  col+=uLC*(pow(sd,900.)*14.+pow(sd,24.)*.35+pow(sd,4.)*.08)*up;
  vec3 moon=normalize(-uSun+vec3(0,.2,0)); float md=max(dot(dir,moon),0.);
  col+=vec3(.8,.85,1.)*(smoothstep(.9994,.9997,md)*.9+pow(md,60.)*.08)*uNight;
  vec3 sp=floor(dir*420.); float st=hs(sp.xy+sp.z*7.1);
  col+=vec3(.9,.92,1.)*step(1.-.0025*uStars,st)*uNight*smoothstep(0.,.25,y)*(.6+.4*sin(uT*3.+st*80.));
  if(y>.005){ vec2 cp=dir.xz/(y+.08)*.55+vec2(uT*.006,uT*.0025);
    float cn=fbm(cp*1.4)*.7+fbm(cp*4.1)*.3; float cov=smoothstep(.46,.78,cn)*smoothstep(0.,.2,y);
    vec3 cc=mix(uSkyH*1.05+uLC*.25, uSkyZ*.5+uLC*.75+vec3(.08), smoothstep(.5,.8,cn));
    cc=mix(cc, uSkyH*.6+vec3(.02,.02,.05), uNight*.8); col=mix(col, cc, cov*.88); }
  o=vec4(tone(col),1.);
}`);
    triVAO = gl.createVertexArray(); gl.bindVertexArray(triVAO); attr(0, buf(new Float32Array([-1, -1, 3, -1, -1, 3])), 2);

    // terrain
    const TVS = `#version 300 es
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; uniform mat4 uVP; out vec3 vW; out vec3 vN;
void main(){ vW=aP; vN=aN; gl_Position=uVP*vec4(aP,1.); }`;
    P.ter = prog(TVS, `#version 300 es
precision highp float; in vec3 vW; in vec3 vN; out vec4 o; uniform float uRegion;
${COMMON}
${PATHF}
void main(){
  vec3 n=normalize(vN); float slope=1.-n.y;
  float m1=fbm(vW.xz*.045), m2=fbm(vW.xz*.011+4.);
  vec3 grass=mix(vec3(.17,.37,.1), vec3(.33,.52,.14), m1); grass=mix(grass, vec3(.58,.56,.22), smoothstep(.56,.78,m2)*.45);
  vec3 rock=mix(vec3(.40,.39,.36), vec3(.58,.55,.50), fbm(vW.xz*.25+vW.y*.3)); rock*=.85+.3*smoothstep(.3,.7,fbm(vec2(vW.x+vW.z,vW.y*3.)*.3));
  vec3 sand=mix(vec3(.80,.74,.57), vec3(.70,.64,.49), m1);
  vec3 c=grass; c=mix(c, rock, smoothstep(.24,.36,slope+(m1-.5)*.12));
  c=mix(c, sand, smoothstep(2.2,1.,vW.y+(m1-.5)*1.2)); c=mix(c, sand*.62, smoothstep(0.,-1.5,vW.y));
  c=mix(c, vec3(.93,.95,.98), smoothstep(46.,52.,vW.y+m1*6.)*smoothstep(.55,.8,n.y));
  if(uRegion<.5){ float path=smoothstep(3.5,1.5,abs(length(vW.xz)-14.))*step(length(vW.xz),24.); c=mix(c, vec3(.62,.54,.40)*(.9+.2*m1), path*.7); }
  else if(uRegion>2.5){
    vec3 sd=mix(vec3(.60,.58,.48), vec3(.72,.68,.54), m1); sd*=.9+.12*sin(vW.x*.9+vW.z*.4+fbm(vW.xz*.2)*5.);
    vec3 rk=mix(vec3(.30,.36,.40), vec3(.46,.50,.50), fbm(vW.xz*.2+vW.y*.3));
    float cr=smoothstep(.56,.66,fbm(vW.xz*.02+vec2(3.,8.))); vec3 coral=mix(vec3(.95,.45,.45), vec3(1.,.66,.3), fbm(vW.xz*.3)); coral=mix(coral, vec3(.62,.42,.86), step(.62,fbm(vW.xz*.12+2.)));
    float kl=smoothstep(.42,.36,fbm(vW.xz*.02+vec2(3.,8.))); vec3 kelp=mix(vec3(.2,.42,.26), vec3(.34,.56,.3), m1);
    c=mix(sd, rk, smoothstep(.22,.34,slope+(m1-.5)*.12)); c=mix(c, coral*(.8+.3*fbm(vW.xz*1.3)), cr*.75*smoothstep(.4,.2,slope)); c=mix(c, kelp, kl*.7*smoothstep(.4,.2,slope));
    float tn=smoothstep(26.,12.,length(vW.xz-vec2(0.,130.))); c=mix(c, vec3(.86,.84,.78)*(.9+.2*m1), tn*.7);
    float pl=smoothstep(30.,16.,length(vW.xz-vec2(0.,-175.))); vec3 marble=mix(vec3(.62,.66,.78),vec3(.78,.8,.9),step(.5,fract(floor(vW.x*.5)*.5+floor(vW.z*.5)*.5))); c=mix(c, marble, pl*.85);
    c=mix(c, vec3(.05,.08,.16), smoothstep(8.,2.5,vW.y)*.8);
  }
  else if(uRegion>1.5){
    vec3 g2=mix(vec3(.24,.52,.16), vec3(.46,.68,.2), m1); g2=mix(g2, vec3(.66,.66,.36), smoothstep(.55,.8,m2)*.5);
    g2=mix(g2, vec3(.95,.80,.86), smoothstep(.78,.86,fbm(vW.xz*.35+3.))*.35);
    vec3 r2=mix(vec3(.66,.62,.55), vec3(.84,.80,.71), fbm(vW.xz*.2+vW.y*.35)); r2*=.86+.16*sin(vW.y*1.3+fbm(vW.xz*.1)*3.);
    c=mix(g2, r2, smoothstep(.22,.34,slope+(m1-.5)*.12));
    float tw=smoothstep(72.,54.,length(vW.xz-vec2(0.,-160.))); vec3 cry=mix(vec3(.30,.28,.52), vec3(.56,.48,.82), fbm(vW.xz*.08)); cry=mix(cry, vec3(.36,.46,.30), smoothstep(.55,.75,fbm(vW.xz*.05+9.))*.5); cry+=vec3(.25,.2,.35)*step(.93,hs(floor(vW.xz*1.5)))*(.4+uNight);
    c=mix(c, cry*(.9+.2*m1), tw*smoothstep(.45,.2,slope)*.9);
    float town=smoothstep(22.,11.,length(vW.xz-vec2(0.,70.))); vec3 pave=mix(vec3(.72,.64,.50),vec3(.62,.55,.44),step(.5,fract(floor(vW.x*.5)*.5+floor(vW.z*.5)*.5))); c=mix(c, pave*(.9+.2*m1), town*.85);
    c=mix(c, vec3(.9,.92,1.)*(.8+.2*uLC), smoothstep(-4.,-24.,vW.y)*.9);
  }
  else {
    float de=smoothstep(40.,90.,vW.x+25.*sin(vW.z*.02)); float sn=smoothstep(-110.,-160.,vW.z+20.*sin(vW.x*.025));
    vec3 dune=mix(vec3(.74,.56,.34), vec3(.84,.66,.42), fbm(vW.xz*.06)); dune*=.92+.1*sin(vW.x*.9+vW.z*.35+fbm(vW.xz*.2)*4.);
    c=mix(c, dune, de*smoothstep(.45,.25,slope+.1));
    c=mix(c, vec3(.92,.94,.98)*(.94+.06*m1), max(sn, smoothstep(34.,42.,vW.y))*smoothstep(.45,.75,n.y));
    float town=smoothstep(26.,14.,length(vW.xz-vec2(0.,165.))); c=mix(c, vec3(.66,.60,.50)*(.9+.2*m1), town*.8);
    float ru=smoothstep(34.,22.,length(vW.xz-vec2(150.,-20.))); c=mix(c, vec3(.62,.54,.42)*(.85+.25*fbm(vW.xz*.3)), ru*.8);
    c=mix(c, vec3(.18,.36,.14)*(.9+.2*m1), smoothstep(-60.,-90.,vW.x)*(1.-sn)*(1.-de)*smoothstep(.3,.2,slope)*.6);
  }
  if(uPathN>.5){ float pd=pathD(vW.xz)+(m1-.5)*.7; vec3 dirt=mix(vec3(.60,.51,.37),vec3(.70,.62,.46),fbm(vW.xz*.7)); c=mix(c, dirt*(.88+.2*m1), smoothstep(.45,-.35,pd)*.8*smoothstep(.45,.2,slope)); }
  o=vec4(tone(fogIt(lightIt(c,n,vW,.15),vW)),1.);
}`);
    P.terD = prog(TVS, FS_DEPTH);
    VAO.ter = gl.createVertexArray(); gl.bindVertexArray(VAO.ter);
    { const [Pp, Nn] = terrainArrays(); terPB = buf(Pp, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); terNB = buf(Nn, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); attr(0, terPB, 3); attr(1, terNB, 3);
      buf(terrainIndex(), gl.ELEMENT_ARRAY_BUFFER); chunkBounds(); }

    // water
    P.wat = prog(`#version 300 es
layout(location=0) in vec2 aP; uniform mat4 uVP; uniform float uRegion; out vec3 vW; void main(){ vW=vec3(aP.x,(uRegion>1.5&&uRegion<2.5)?-26.:0.,aP.y); gl_Position=uVP*vec4(vW,1.); }`, `#version 300 es
precision highp float; in vec3 vW; out vec4 o; uniform sampler2D uHm; uniform float uWorld, uSp, uN; uniform float uRegion;
${COMMON}
void main(){
  if(uRegion>1.5&&uRegion<2.5){
    vec2 q=vW.xz*.011+vec2(uT*.008,uT*.003); float c1=fbm(q); float c2=fbm(q*3.3+c1*1.6-uT*.015);
    float lit=clamp(.5+(c2-.45)*1.6,0.,1.);
    vec3 base=mix(uSkyH*.82+vec3(.03,.03,.06), uLC*.92+uSkyZ*.22+vec3(.08), lit);
    base=mix(base, uSkyZ*.55+vec3(.03,.04,.1), uNight*.55);
    base*=mix(.7,1.,shadowAt(vec3(vW.x,-26.,vW.z),vec3(0,1,0)));
    base+=uLC*pow(max(dot(normalize(vW-uCam),uL),0.),6.)*.18*(1.-uNight);
    o=vec4(tone(fogIt(base,vW)),1.); return; }
  float th=texture(uHm,((vW.xz+uWorld*.5)/uSp+.5)/uN).r; float depth=max(-th,0.);
  vec2 g=vec2(0);
  for(int i=0;i<5;i++){ float fi=float(i); float a=.6+fi*1.3; vec2 d=vec2(cos(a),sin(a)); float k=.35+fi*.42; g+=d*cos(dot(d,vW.xz)*k-uT*(1.1+fi*.35))*(.09/(1.+fi)); }
  g+=(vec2(fbm(vW.xz*.4+uT*.3),fbm(vW.xz*.4-uT*.25+7.))-.5)*.12;
  vec3 n=normalize(vec3(-g.x,1.,-g.y)); vec3 v=normalize(uCam-vW);
  float fr=.03+.97*pow(1.-max(dot(n,v),0.),5.); vec3 r=reflect(-v,n);
  vec3 refl=mix(uSkyH, uSkyZ, clamp(r.y*1.6,0.,1.));
  vec3 amb=uSkyZ*.5+uSkyH*.3+uLC*.45;
  vec3 wc=mix(vec3(.22,.60,.58), vec3(.03,.17,.30), smoothstep(0.,7.,depth))*amb;
  vec3 c=mix(wc, refl, fr*.85)*mix(.7,1.,shadowAt(vW,vec3(0,1,0)));
  c+=uLC*pow(max(dot(r,uL),0.),260.)*3.*(1.-uNight*.7);
  float foam=smoothstep(.7,0.,depth)*(.55+.45*sin(uT*1.8-depth*14.+fbm(vW.xz*.8)*6.));
  c=mix(c, (uLC*.7+uSkyZ*.5+.1), clamp(foam,0.,1.)*.75);
  float a=mix(.45,.96,smoothstep(0.,3.5,depth)); a=max(a,foam*.8);
  o=vec4(tone(fogIt(c,vW)),a);
}`);
    VAO.wat = gl.createVertexArray(); gl.bindVertexArray(VAO.wat); attr(0, buf(new Float32Array([-1600, -1600, 1600, -1600, -1600, 1600, 1600, -1600, 1600, 1600, -1600, 1600])), 2);

    // grass
    P.grs = prog(`#version 300 es
layout(location=0) in vec3 aP; layout(location=1) in vec2 aCell;
uniform mat4 uVP; uniform vec3 uPlayer; uniform vec3 uCenter; uniform float uT; uniform float uWorld,uSp,uN,uGsp; uniform int uG; uniform sampler2D uHm; uniform float uRegion; uniform vec3 uCam;
out vec3 vW; out float vY; out vec3 vTint;
${PATHF}
float hs(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float Hm(vec2 xz){ return texture(uHm,((xz+uWorld*.5)/uSp+.5)/uN).r; }
float vnz(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y); }
void main(){
  vec2 base=floor(uCenter.xz/uGsp)*uGsp; vec2 cell=base+(aCell-float(uG)*.5)*uGsp; vec2 cid=floor(cell/uGsp+.5);
  float r1=hs(cid),r2=hs(cid+3.7),r3=hs(cid+9.1),r4=hs(cid+1.3);
  vec2 xz=cell+(vec2(r1,r2)-.5)*uGsp; float h=Hm(xz); float e=1.2;
  vec3 n=normalize(vec3(Hm(xz-vec2(e,0))-Hm(xz+vec2(e,0)),2.*e,Hm(xz-vec2(0,e))-Hm(xz+vec2(0,e))));
  float R=float(uG)*uGsp*.5; float dist=length(xz-uCenter.xz); float fade=1.-smoothstep(R*.55,R*.95,dist);
  float patchN=vnz(xz*.06)*.7+vnz(xz*.23)*.3;
  float village=uRegion>2.5 ? smoothstep(14.,22.,length(xz-vec2(0.,130.)))*smoothstep(26.,34.,length(xz-vec2(0.,-175.)))*smoothstep(4.,6.,h) : uRegion>1.5 ? smoothstep(12.,20.,length(xz-vec2(0.,70.)))*smoothstep(50.,62.,length(xz-vec2(0.,-160.)))*smoothstep(3.,6.,h) : uRegion<.5 ? smoothstep(10.,14.,abs(length(xz)-14.)+ (length(xz)>24.?20.:0.)) : smoothstep(18.,26.,length(xz-vec2(0.,165.)))*smoothstep(26.,36.,length(xz-vec2(150.,-20.)))*(1.-smoothstep(40.,80.,xz.x+25.*sin(xz.y*.02)))*(1.-smoothstep(-100.,-140.,xz.y+20.*sin(xz.x*.025)))*(1.-smoothstep(30.,38.,h));
  float ok=smoothstep(1.4,2.2,h)*smoothstep(.74,.82,n.y)*(1.-smoothstep(40.,44.,h))*fade*(uRegion<.5 ? .25+.75*village : village)*pathMask(xz);
  bool sea=uRegion>2.5;
  float height=(.32+r3*.55)*(.55+patchN*.95)*ok*smoothstep(1.2,3.5,length(vec3(xz.x,h,xz.y)-uCam))*mix(.35,1.,smoothstep(.3,.9,length(xz-uPlayer.xz)))*(sea?1.5:1.);
  float ang=r4*6.2831; vec2 dir=vec2(cos(ang),sin(ang)); float t=aP.y;
  vec2 wd=normalize(vec2(1.,.45));
  float wave=sin(uT*1.9-dot(xz,wd)*.22+r1*.8)*.5+.5; float gust=smoothstep(.3,.9,vnz(xz*.025-wd*uT*.9));
  float bend=(.18+.35*wave+.75*gust*wave)*t*t;
  vec2 pv=xz-uPlayer.xz; float pd=length(pv); vec2 push=pd<1.3? normalize(pv+1e-4)*(1.3-pd)*1.1*t : vec2(0);
  vec2 off=(wd*bend+push)*height; float wx=aP.x*.085;
  if(sea){ float ph=uT*1.15+r1*6.2831; // 海草：リボン状に 波うつ
    off=(vec2(sin(ph+t*2.8), cos(ph*.83+t*2.3+r2*3.))*(.16*t+.22*t*t)+push*.6)*height; wx=sign(aP.x)*.1*(1.-.45*t*t); bend=.1; }
  vec3 wp=vec3(xz.x,h,xz.y)+vec3(-dir.y,0.,dir.x)*wx+vec3(off.x, t*height*(1.-.35*min(bend,1.)), off.y);
  vW=wp; vY=t; vTint=vec3(patchN, gust*wave, r3); gl_Position=uVP*vec4(wp,1.);
}`, `#version 300 es
precision highp float; in vec3 vW; in float vY; in vec3 vTint; out vec4 o; uniform float uRegion;
${COMMON}
void main(){
  vec3 baseC=mix(vec3(.17,.38,.08), vec3(.3,.52,.12), vTint.x);
  vec3 tipC=mix(vec3(.46,.7,.22), vec3(.8,.78,.36), smoothstep(.55,.85,vTint.x)*.6+vTint.z*.2);
  if(uRegion>2.5){ baseC=mix(vec3(.04,.17,.13), vec3(.1,.24,.12), vTint.x); tipC=mix(vec3(.2,.46,.34), vec3(.5,.5,.2), vTint.z*.7+smoothstep(.6,.9,vTint.x)*.3); tipC=mix(tipC, vec3(.62,.3,.36), step(.93,vTint.z)*.7); }
  vec3 c=mix(baseC, tipC, vY)+vec3(.10,.10,.04)*vTint.y*vY;
  vec3 col=lightIt(c, vec3(0.,1.,0.), vW, .4);
  col+=c*uLC*pow(max(dot(normalize(vW-uCam),uL),0.),6.)*.7*vY*(1.-uNight);
  col*=.72+.28*vY; o=vec4(tone(fogIt(col,vW)),1.);
}`);
    VAO.grs = gl.createVertexArray(); gl.bindVertexArray(VAO.grs);
    { const L = [[.5, 0], [.4, .4], [.25, .75], [0, 1]], A = [];
      for (let s = 0; s < 3; s++) { const [w0, y0] = L[s], [w1, y1] = L[s + 1]; A.push(-w0, y0, 0, w0, y0, 0, -w1, y1, 0, w0, y0, 0, w1, y1, 0, -w1, y1, 0); }
      attr(0, buf(new Float32Array(A)), 3);
      grsCB = buf(grsCells, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.SHORT, false, 0, 0); gl.vertexAttribDivisor(1, 1); }

    // objects
    const OVS = `#version 300 es
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in vec4 aC;
layout(location=3) in vec3 iP; layout(location=4) in float iS; layout(location=5) in float iR;
uniform mat4 uVP; uniform float uT; uniform float uSway; out vec3 vW; out vec3 vN; out vec4 vC;
void main(){ float shiny=iR>50.?1.:0.; float rr=iR-shiny*100.; float c=cos(rr), s=sin(rr); float sc=abs(iS); vec3 p=aP*sc; p=vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); vec3 n=vec3(c*aN.x+s*aN.z, aN.y, -s*aN.x+c*aN.z);
  if(uSway>0. && aP.y>1.3){ float k=(aP.y-1.3)*uSway; p.x+=sin(uT*1.4+iP.x*.23+iP.z*.1)*.13*k; p.z+=cos(uT*1.15+iP.z*.21)*.07*k; }
  vW=iP+p; vN=n; float tint=fract(sin(dot(iP.xz,vec2(12.9898,78.233)))*43758.5453);
  vec3 col=aC.rgb*mix(1.,.8+.4*tint,uSway>0.&&aC.a<.5?1.:0.); float em=aC.a;
  if(shiny>.5) col=col.brg*1.05+.05;
  if(iS<0.){ if(em>.5) col=vec3(1.,.43,.69); else col=mix(col, vec3(.2,.13,.3), .78); }
  vC=vec4(col, em); gl_Position=uVP*vec4(vW,1.); }`;
    P.obj = prog(OVS, `#version 300 es
precision highp float; in vec3 vW; in vec3 vN; in vec4 vC; out vec4 o;
${COMMON}
void main(){ vec3 n=normalize(vN); vec3 col = vC.a>.5 ? vC.rgb*(1.2+uNight*1.8) : lightIt(vC.rgb, n, vW, .25); if(vC.a>.2&&vC.a<.5) col+=vC.rgb*(uLC*.18+vec3(.1,.06,.04));
  float rim=pow(1.-max(dot(n,normalize(uCam-vW)),0.),3.); col+=(uSkyH*.22+uLC*.3)*rim*.45*(1.-vC.a); o=vec4(tone(fogIt(col,vW)),1.); }`);
    P.objD = prog(OVS, FS_DEPTH);

    // blocks
    const BVS = `#version 300 es
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in vec2 aUV; layout(location=3) in vec4 iB;
uniform mat4 uVP; uniform float uInflate; out vec3 vW; out vec3 vN; out vec2 vUV; flat out float vT; flat out vec3 vB;
void main(){ vec3 w=iB.xyz+.5+(aP-.5)*(1.+uInflate); vW=w; vN=aN; vUV=aUV; vT=iB.w; vB=iB.xyz; gl_Position=uVP*vec4(w,1.); }`;
    P.blk = prog(BVS, `#version 300 es
precision highp float; in vec3 vW; in vec3 vN; in vec2 vUV; flat in float vT; flat in vec3 vB; out vec4 o; uniform float uGhost;
${COMMON}
void main(){
  vec2 tx=floor(vUV*16.); float r=hs(tx+vB.xz*7.3+vB.y*3.1+vT*11.); vec3 n=normalize(vN); vec3 c; float emi=0.; int t=int(vT+.5);
  if(t==0){ c=vec3(.66,.47,.27); float row=mod(tx.y,4.); c*= row<.5?.72:1.; c*=1.-.25*step(15.,mod(tx.x+floor(tx.y/4.)*5.,16.)); c*=.9+.18*r; }
  else if(t==1){ c=vec3(.56,.56,.54)*(.78+.3*r); c*= r>.94?.7:1.; c*=1.-.2*step(15.,mod(tx.x+floor(tx.y/8.)*8.,16.))-.2*step(15.,mod(tx.y,8.)); }
  else if(t==2){ bool fr=tx.x<2.||tx.x>13.||tx.y<2.||tx.y>13.; if(fr) c=vec3(.30,.21,.13)*(.9+.2*r); else { c=mix(vec3(1.,.72,.35),vec3(1.,.9,.6),r); emi=1.; } }
  else if(t==3){ c=vec3(.62,.27,.17); c*=.8+.25*(mod(tx.y,4.)/3.); c*=.9+.15*r; }
  else if(t==4){ c=vec3(.90,.87,.80)*(.93+.08*r); }
  else if(t==5){ if(abs(n.y)>.5){ float d=length(vUV-.5); c=mix(vec3(.62,.46,.28),vec3(.45,.32,.19), step(.5,fract(d*9.))); } else c=vec3(.38,.26,.16)*(.8+.25*hs(vec2(tx.x,vB.x+vB.z))); }
  else if(t==6){ float row=floor(tx.y/4.); float off=mod(row,2.)*4.; float mortar=max(step(3.,mod(tx.y,4.)), step(7.,mod(tx.x+off,8.))); c=mix(vec3(.60,.58,.55)*(.85+.25*r), vec3(.42,.41,.39), mortar); }
  else if(t==7){ bool fr=tx.x<1.||tx.x>14.||tx.y<1.||tx.y>14.; c= fr? vec3(.85,.9,.92) : vec3(.62,.82,.92)*(.9+.15*step(.9,r)); c+=step(abs(tx.x-tx.y-2.),.5)*.25; }
  else if(t==8){ c=vec3(.24,.48,.18)*(.7+.5*r); c*= r<.12?.6:1.; }
  else if(t==9){ c=vec3(.88,.78,.56)*(.9+.14*r); }
  else if(t==12){ c=vec3(.62,.44,.24)*(.85+.2*r); float d1=abs(vUV.x-vUV.y), d2=abs(vUV.x+vUV.y-1.); c*=1.-.45*step(min(d1,d2),.07); c*=1.-.35*step(.43,max(abs(vUV.x-.5),abs(vUV.y-.5))); }
  else if(t==13||t==14){ c=vec3(.55,.55,.58)*(.85+.2*r); float d=length(vUV-.5); float ring=smoothstep(.04,0.,abs(d-.3)); if(n.y>.5){ c=mix(c, t==14?vec3(.4,1.,.9):vec3(.3,.34,.4), ring); if(t==14) emi=.6*ring+.1; } }
  else if(t==15){ if(n.y>.5){ c=vUV.y<.28? vec3(.95,.95,.92) : vec3(.78,.22,.25)*(.9+.15*r); } else c=vec3(.52,.36,.22)*(.85+.2*r); }
  else if(t==16){ if(n.y>.5){ c=vec3(.66,.48,.28); c*=1.-.3*step(15.,mod(tx.x,8.)+mod(tx.y,8.)*0.+7.); c=mix(c,vec3(.55,.55,.6),step(.7,vUV.x)*step(.6,vUV.y)); } else { c=vec3(.5,.35,.2)*(.85+.2*r); c=mix(c,vec3(.3,.22,.14),step(.8,vUV.y)); } }
  else if(t==17){ c=vec3(.5,.49,.47)*(.8+.3*r); if(abs(n.y)<.5 && vUV.y<.5 && abs(vUV.x-.5)<.25){ c=mix(vec3(1.,.5,.15),vec3(1.,.85,.4),r); emi=1.; } }
  else if(t==18){ if(n.y>.5){ c=vec3(.3,.55,.2)*(.8+.3*r); if(r>.82) { c=vec3(1.,.5,.6); if(hs(tx*1.7)>.5) c=vec3(1.,.9,.35); } } else c=vec3(.45,.32,.2)*(.8+.3*r); }
  else if(t==10){ float hh=fract((vB.x+vB.y+vB.z)*.13+tx.y/16.*.5+uT*.05); c=.72+.28*cos(6.2831*(hh+vec3(0.,.33,.67))); c=mix(c,vec3(1.),.18); emi=.6; }
  else { float cl=vnz(vUV*3.+vB.xz*1.7+vB.y); c=mix(vec3(.84,.88,.97), vec3(1.,1.,1.), cl)*(.94+.06*r); emi=.55; }
  if(uGhost>0.){ o=vec4(tone(c*1.1+.2), uGhost); return; }
  { vec2 e2=abs(vUV-.5); float ed=max(e2.x,e2.y); c*=1.-smoothstep(.36,.5,ed)*.22; if(t==10) c+=vec3(1.,.95,1.)*smoothstep(.44,.5,ed)*.35; }
  vec3 col = emi>.9 ? c*(1.3+uNight*1.6) : emi>.5 ? mix(lightIt(c,n,vW,.2), c, .6) : lightIt(c,n,vW,.2);
  o=vec4(tone(fogIt(col,vW)),1.);
}`);
    P.blkD = prog(BVS, FS_DEPTH);
    const F = [[[1, 0, 0], [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]]], [[-1, 0, 0], [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]]], [[0, 1, 0], [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]]],
      [[0, -1, 0], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]], [[0, 0, 1], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]], [[0, 0, -1], [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]]]];
    const cp = [], cn = [], cu = [], UV = [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (const [n, cs] of F) for (const i of [0, 1, 2, 0, 2, 3]) { cp.push(...cs[i]); cn.push(...n); cu.push(...UV[i]); }
    const cpB = buf(new Float32Array(cp)), cnB = buf(new Float32Array(cn)), cuB = buf(new Float32Array(cu));
    cubeVAO = gl.createVertexArray(); gl.bindVertexArray(cubeVAO); attr(0, cpB, 3); attr(1, cnB, 3); attr(2, cuB, 2);
    blockIB = buf(blockData, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); attr(3, blockIB, 4, 1);
    ghostVAO = gl.createVertexArray(); gl.bindVertexArray(ghostVAO); attr(0, cpB, 3); attr(1, cnB, 3); attr(2, cuB, 2);
    ghostIB = buf(new Float32Array(4), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); attr(3, ghostIB, 4, 1);

    // fx
    P.fx = prog(`#version 300 es
layout(location=0) in vec2 aP; uniform mat4 uVP; uniform vec3 uC; uniform vec2 uSize; uniform vec3 uRight; uniform vec3 uUp;
out vec2 vUv; void main(){ vUv=aP; vec3 w=uC+uRight*aP.x*uSize.x+uUp*(aP.y*uSize.y); gl_Position=uVP*vec4(w,1.); }`, `#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform float uType,uGrow,uSeed; uniform vec3 uTint;
${COMMON}
void main(){ vec2 p=vUv;
  if(uType<.5){ float yy=p.y*.5+.5; float nz=fbm(vec2(p.x*2.2+uSeed, p.y*1.6-uT*3.2)); p.x+=(nz-.5)*.55*yy;
    float w=.62*(1.-yy*.85)+.04; float d=length(vec2(p.x/w,(p.y+.45)*.72)); float I=smoothstep(1.05,.15,d+nz*.35*yy);
    vec3 c=mix(vec3(1.,.28,.04), vec3(1.,.86,.52), I*I); o=vec4(c*I*1.6, I*uGrow); }
  else if(uType<1.5){ float a=exp(-dot(p,p)*3.2)*(.28+uNight*.75)*uGrow*uFlick; o=vec4(uTint*a, a); }
  else if(uType<2.5){ float v=p.y*.5+.5; float a=pow(1.-abs(p.x),2.5)*pow(1.-v,1.6)*(.07+.55*uNight)*uGrow; a*=.8+.2*sin(v*30.-uT*2.); o=vec4(uTint*a,a); }
  else { float d=length(p); float a=smoothstep(1.,.0,d)*uGrow; float ring=smoothstep(.2,0.,abs(d-.7+.3*sin(uT*3.+uSeed))); o=vec4(uTint*(a*.5+ring), a*.5+ring*.6); }
}`);
    quadVAO = gl.createVertexArray(); gl.bindVertexArray(quadVAO); attr(0, buf(new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1])), 2);

    // particles (seeds by day, fireflies by night)
    P.part = prog(`#version 300 es
layout(location=0) in float aI; uniform mat4 uVP; uniform vec3 uCenter; uniform float uT, uNight, uPx; uniform sampler2D uHm; uniform float uWorld,uSp,uN; uniform vec3 uCam;
out float vA; out vec3 vCol;
float hs(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main(){ float id=aI; vec3 r=vec3(hs(vec2(id,1.)),hs(vec2(id,2.)),hs(vec2(id,3.))); float R=26.;
  vec2 pos=r.xy*2.*R+vec2(uT*(.6+r.z)*(1.-uNight*.8), uT*.25)+vec2(sin(uT*.7+id),cos(uT*.5+id*1.7))*1.5;
  vec2 xz=uCenter.xz+mod(pos-uCenter.xz+R,2.*R)-R;
  float h=texture(uHm,((xz+uWorld*.5)/uSp+.5)/uN).r;
  float y=max(h,0.)+mix(.8+r.z*4.,.4+r.z*1.8,uNight)+sin(uT*1.3+id)*.3;
  vec3 w=vec3(xz.x,y,xz.y); float d=length(w-uCam);
  float blink=mix(.5, .5+.5*sin(uT*2.3+id*7.), uNight);
  vA=blink*(1.-smoothstep(R*.7,R,length(xz-uCenter.xz)))*mix(.5,1.,uNight);
  vCol=mix(vec3(1.,1.,.95), vec3(.8,1.,.45), uNight);
  gl_Position=uVP*vec4(w,1.); gl_PointSize=uPx*mix(2.2,4.5,uNight)*clamp(14./d,.25,2.5); }`, `#version 300 es
precision highp float; in float vA; in vec3 vCol; out vec4 o; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.0,d)*vA; o=vec4(vCol*a,a); }`);
    partVAO = gl.createVertexArray(); gl.bindVertexArray(partVAO); attr(0, buf(new Float32Array(Array.from({ length: PARTS }, (_, i) => i))), 1);
    return true;
  }
  let QL = 2, shOff = false, shCleared = false, partN = 260;
  // 低画質は DPR 1.0（.85 は ぼやける）→ 草・粒子・地形LOD距離で 補う
  function setQuality(q) { QL = Math.max(0, Math.min(2, q)); GRID = [76, 140, 210][QL]; GSP = [.5, .36, .31][QL]; shOff = QL === 0; shCleared = false; shValid = false; grsKey = ''; partN = [90, 200, 260][QL]; resize(); }
  function resize() { const dpr = Math.min(devicePixelRatio || 1, [1, 1.15, COARSE ? 1.4 : 1.6][QL]); W = cv.width = Math.round((window.__vw || innerWidth) * dpr); Hh = cv.height = Math.round((window.__vh || innerHeight) * dpr); }

  // ---------- sky palette ----------
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const PAL = { day: { z: [.18, .45, .92], h: [.68, .85, .98], l: [1.14, 1.0, .82] }, set: { z: [.2, .26, .54], h: [1.0, .58, .36], l: [1.05, .55, .28] }, night: { z: [.03, .045, .11], h: [.08, .11, .2], l: [.2, .24, .38] } };
  function palette(e) { if (e >= .28) return PAL.day; const f = (a, b, t) => ({ z: mix3(a.z, b.z, t), h: mix3(a.h, b.h, t), l: mix3(a.l, b.l, t) });
    if (e >= 0) return f(PAL.set, PAL.day, smooth(0, .28, e)); if (e >= -.2) return f(PAL.night, PAL.set, smooth(-.2, 0, e)); return PAL.night; }
  function skyInfo(tod) { const a = (tod - .25) * Math.PI * 2; const sun = V.norm([Math.cos(a) * .85, Math.sin(a), .42]); return { sun, night: smooth(.04, -.18, sun[1]) }; }

  // ---------- render ----------
  let lastVP = null; const plV = new Float32Array(24), plL = new Float32Array(24); let shAge = 0, shC = null, shL = [0, 1, 0], shLVP = null, bkts = [];
  // 可視チャンクを LOD ごとに まとめ、インデックスが 連続する ものは 1回の drawElements に 結合
  function drawTer(Pl) { let s = -1, e = -1;
    for (let L = 0; L < LODS.length; L++) for (let c = 0; c < CHN * CHN; c++) { if (chLod[c] !== L) continue; const o = c * 6;
      if (!boxIn(Pl, chBox[o], chBox[o + 1], chBox[o + 2], chBox[o + 3], chBox[o + 4], chBox[o + 5])) continue;
      const off = chOff[L][c], n = chCnt[L][c]; if (off === e) e += n; else { if (s >= 0) gl.drawElements(gl.TRIANGLES, e - s, gl.UNSIGNED_INT, s * 4); s = off; e = off + n; } }
    if (s >= 0) gl.drawElements(gl.TRIANGLES, e - s, gl.UNSIGNED_INT, s * 4); }
  function drawBlocks(Pl) { gl.bindVertexArray(cubeVAO); gl.bindBuffer(gl.ARRAY_BUFFER, blockIB); let s = -1, e = -1;
    const flush = () => { if (s < 0) return; gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 16, s * 16); gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, e - s); };
    for (const b of bkts) { if (!boxIn(Pl, b.x0, b.y0, b.z0, b.x1, b.y1, b.z1)) continue; if (b.s === e) e += b.n; else { flush(); s = b.s; e = b.s + b.n; } }
    flush(); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 16, 0); }
  // 草：プレイヤー中心の グリッドを 10×10 セルの タイルに 分け、視錐台・半径・水面下の タイルを 除いて インスタンス列を つくる
  const grsLast = new Float64Array(28);
  function grassCells(Pl, player) { const G = GRID, bx = Math.floor(player[0] / GSP) * GSP, bz = Math.floor(player[2] / GSP) * GSP;
    // 毎フレーム 文字列を 作らない：前回の 値と 数値で 比べる
    let same = grsKey === 'ok' && grsLast[24] === G && grsLast[25] === bx && grsLast[26] === bz && grsLast[27] === REGION;
    for (let i = 0; i < 24; i++) { const v = Math.round(Pl[i] * 60); if (grsLast[i] !== v) { grsLast[i] = v; same = false; } } if (same) return; grsLast[24] = G; grsLast[25] = bx; grsLast[26] = bz; grsLast[27] = REGION; grsKey = 'ok';
    const R = G * GSP * .5 * .95 + GSP, TS = 10; let k = 0;
    for (let tj = 0; tj < G; tj += TS) for (let ti = 0; ti < G; ti += TS) { const i1 = Math.min(G, ti + TS), j1 = Math.min(G, tj + TS);
      const x0 = bx + (ti - G / 2 - .5) * GSP, x1 = bx + (i1 - G / 2 + .5) * GSP, z0 = bz + (tj - G / 2 - .5) * GSP, z1 = bz + (j1 - G / 2 + .5) * GSP;
      const nx = clamp(player[0], x0, x1) - player[0], nz = clamp(player[2], z0, z1) - player[2]; if (nx * nx + nz * nz > R * R) continue;
      let lo = 1e9, hi = -1e9; for (const [sx, sz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [(x0 + x1) / 2, (z0 + z1) / 2]]) { const h = hAt(sx, sz); lo = Math.min(lo, h); hi = Math.max(hi, h); }
      if (hi < .9 || lo > 45) continue; if (!boxIn(Pl, x0 - 1.6, lo - .3, z0 - 1.6, x1 + 1.6, hi + 2.6, z1 + 1.6)) continue;
      for (let j = tj; j < j1; j++) for (let i = ti; i < i1; i++) { grsCells[k++] = i; grsCells[k++] = j; } }
    grsN = k / 2; if (k) { gl.bindBuffer(gl.ARRAY_BUFFER, grsCB); gl.bufferSubData(gl.ARRAY_BUFFER, 0, grsCells, 0, k); } }
  function render(S) {
    const { eye, tgt, tod, T, player, lantern, beaconU, fx, ghost, darkness = 0 } = S;
    const proj = persp(1.05, W / Hh, .1, 1800), view = lookAt(eye, tgt, [0, 1, 0]), VP = mul(proj, view); lastVP = VP;
    const { sun, night: n0 } = skyInfo(tod); const night = Math.max(n0, darkness);
    let Pal = palette(sun[1]); if (darkness > 0) Pal = { z: mix3(Pal.z, [.05, .02, .09], darkness), h: mix3(Pal.h, [.12, .06, .16], darkness), l: mix3(Pal.l, [.3, .2, .4], darkness) };
    if (REGION === 3) { const dn = 1 - night * .75; Pal = { z: [.015 * dn, .1 * dn, .2 * dn], h: [.05 * dn, .34 * dn, .44 * dn], l: [.62 * dn + .05, .9 * dn + .05, .95 * dn + .1] }; }
    const Ldir = REGION === 3 ? V.norm([.25, 1, .2]) : sun[1] > -.02 ? sun : V.norm([-sun[0], -sun[1], -sun[2]]);
    const Lc = Pal.l.map(c => c * (sun[1] > -.02 ? smooth(-.03, .12, sun[1]) * .9 + .1 : 1));
    const flick = .85 + .15 * Math.sin(T * 9.3) * Math.sin(T * 5.7 + 1.3);
    // light VP (stabilized)
    const R = COARSE ? 42 : 55; const center = [player[0], player[1], player[2]];
    const lv = lookAt(V.add(center, V.scale(Ldir, 160)), center, [0, 1, 0]);
    const ts = 2 * R / SHS; lv[12] = Math.round(lv[12] / ts) * ts; lv[13] = Math.round(lv[13] / ts) * ts;
    const LVP = mul(ortho(-R, R, -R, R, 1, 380), lv);

    const PlV = planesOf(VP, plV);
    // blocks: 16m バケツ順に 並べ替えて アップロード（描画は 可視バケツの 連続区間ごと）
    if (blocksDirty) { const L = []; for (const [k, t] of blocks) { if (t === 19) continue; /* 19＝見えない 当たり判定（家具など） */ if (L.length >= 9000) break; const [x, y, z] = k.split(',').map(Number); L.push([((Math.floor(x / 16) + 64) << 8) | (Math.floor(z / 16) + 64), x, y, z, t]); }
      L.sort((a, b) => a[0] - b[0]); blockN = L.length; bkts = [];
      L.forEach((e, i) => { blockData[i * 4] = e[1]; blockData[i * 4 + 1] = e[2]; blockData[i * 4 + 2] = e[3]; blockData[i * 4 + 3] = e[4]; let b = bkts[bkts.length - 1];
        if (!b || b.k !== e[0]) bkts.push(b = { k: e[0], s: i, n: 0, x0: 1e9, y0: 1e9, z0: 1e9, x1: -1e9, y1: -1e9, z1: -1e9 });
        b.n++; b.x0 = Math.min(b.x0, e[1]); b.y0 = Math.min(b.y0, e[2]); b.z0 = Math.min(b.z0, e[3]); b.x1 = Math.max(b.x1, e[1] + 1); b.y1 = Math.max(b.y1, e[2] + 1); b.z1 = Math.max(b.z1, e[3] + 1); });
      gl.bindBuffer(gl.ARRAY_BUFFER, blockIB); gl.bufferSubData(gl.ARRAY_BUFFER, 0, blockData, 0, blockN * 4); blocksDirty = false; shValid = false; }
    // terrain LOD（カメラからの 距離で チャンクごとに 選ぶ）
    { const LD = [[40, 95], [56, 130], [72, 170]][QL]; for (let c = 0; c < CHN * CHN; c++) { const o = c * 6;
      const dx = Math.max(chBox[o] - eye[0], 0, eye[0] - chBox[o + 3]), dy = Math.max(chBox[o + 1] + SKD - eye[1], 0, eye[1] - chBox[o + 4]), dz = Math.max(chBox[o + 2] - eye[2], 0, eye[2] - chBox[o + 5]);
      const d = Math.hypot(dx, dy * .5, dz); chLod[c] = d < LD[0] ? 0 : d < LD[1] ? 1 : 2; } }

    gl.disable(gl.CULL_FACE);
    // ---- shadow pass（2〜3フレームに1回。 光の中心が 動いた・光の向きが 変わった・ブロックが 変わったときは すぐ） ----
    if (shOff) { if (!shCleared) { gl.bindFramebuffer(gl.FRAMEBUFFER, shFbo); gl.viewport(0, 0, SHS, SHS); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT); shCleared = true; } shValid = false; shLVP = LVP; }
    else { shAge++; const moved = !shValid || !shC || Math.hypot(center[0] - shC[0], center[1] - shC[1], center[2] - shC[2]) > 2.5 || V.dot(Ldir, shL) < .9997;
      if (moved || shAge >= (QL >= 2 ? 2 : 3)) { shAge = 0; shValid = true; shC = center; shL = Ldir; shLVP = LVP; shCleared = true; const PlL = planesOf(LVP, plL);
        gl.bindFramebuffer(gl.FRAMEBUFFER, shFbo); gl.viewport(0, 0, SHS, SHS); gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(2.2, 4);
        gl.useProgram(P.terD.p); gl.uniformMatrix4fv(P.terD.u.uVP, false, LVP); gl.bindVertexArray(VAO.ter); drawTer(PlL);
        gl.useProgram(P.objD.p); gl.uniformMatrix4fv(P.objD.u.uVP, false, LVP); gl.uniform1f(P.objD.u.uT, T);
        for (const m of meshes) { m.sn = m.cast && m.n ? cullMesh(m, PlL, m.sib) : 0; if (m.sn) { gl.uniform1f(P.objD.u.uSway, m.sway); gl.bindVertexArray(m.svao); gl.drawArraysInstanced(gl.TRIANGLES, 0, m.count, m.sn); } }
        if (blockN) { gl.useProgram(P.blkD.p); gl.uniformMatrix4fv(P.blkD.u.uVP, false, LVP); gl.uniform1f(P.blkD.u.uInflate, 0); drawBlocks(PlL); }
        gl.disable(gl.POLYGON_OFFSET_FILL); } }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, Hh);
    // upload dynamic instances（視錐台カリング済み）
    for (const m of meshes) { m.vn = m.n ? cullMesh(m, PlV, m.ib) : 0; m.dirty = false; }

    const lan = [lantern[0], lantern[1], lantern[2], lantern[3]], PT = PATHS[REGION];
    function common(p) { const u = p.u; gl.useProgram(p.p);
      gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uL, Ldir); gl.uniform3fv(u.uLC, Lc);
      gl.uniform3fv(u.uSkyZ, Pal.z); gl.uniform3fv(u.uSkyH, Pal.h); gl.uniform3fv(u.uCam, eye); gl.uniform1f(u.uNight, night); gl.uniform1f(u.uT, T);
      gl.uniform4fv(u.uBeacon, beaconU); gl.uniform4fv(u.uPL, lan); gl.uniform1f(u.uFlick, flick);
      gl.uniform1i(u.uHm, 0); gl.uniform1i(u.uShadow, 1); gl.uniformMatrix4fv(u.uLVP, false, shLVP); gl.uniform1f(u.uShTex, 1 / SHS);
      gl.uniform1f(u.uWorld, WORLD); gl.uniform1f(u.uSp, SP); gl.uniform1f(u.uN, N); gl.uniform1f(u.uRegion, REGION); gl.uniform1f(u.uUW, REGION === 3 ? 1 : 0); gl.uniform2f(u.uRes, W, Hh);
      if (u.uPathN) { gl.uniform1f(u.uPathN, PT.n); if (PT.n) { gl.uniform4fv(u.uPath, PT.s); gl.uniform1fv(u.uPathW, PT.w); } } }

    gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.disable(gl.BLEND);
    common(P.sky); gl.uniformMatrix4fv(P.sky.u.uInvVP, false, inv(VP)); gl.uniform3fv(P.sky.u.uSun, sun); gl.uniform1f(P.sky.u.uStars, S.stars ?? 1); gl.bindVertexArray(triVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.depthFunc(gl.LEQUAL); gl.clear(gl.DEPTH_BUFFER_BIT);
    common(P.ter); gl.bindVertexArray(VAO.ter); drawTer(PlV);
    common(P.obj); for (const m of meshes) if (m.vn) { gl.uniform1f(P.obj.u.uSway, m.sway); gl.bindVertexArray(m.vao); gl.drawArraysInstanced(gl.TRIANGLES, 0, m.count, m.vn); }
    if (blockN) { common(P.blk); gl.uniform1f(P.blk.u.uGhost, 0); gl.uniform1f(P.blk.u.uInflate, 0); drawBlocks(PlV); }
    grassCells(PlV, player);
    if (grsN) { common(P.grs); gl.uniform3fv(P.grs.u.uPlayer, player); gl.uniform3fv(P.grs.u.uCenter, player); gl.uniform1i(P.grs.u.uG, GRID); gl.uniform1f(P.grs.u.uGsp, GSP);
      gl.bindVertexArray(VAO.grs); gl.drawArraysInstanced(gl.TRIANGLES, 0, 18, grsN); }

    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    if (REGION !== 3) { common(P.wat); gl.bindVertexArray(VAO.wat); gl.drawArrays(gl.TRIANGLES, 0, 6); }
    if (ghost) { common(P.blk); gl.uniform1f(P.blk.u.uGhost, .35); gl.uniform1f(P.blk.u.uInflate, .02); gl.bindBuffer(gl.ARRAY_BUFFER, ghostIB); gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(ghost));
      gl.bindVertexArray(ghostVAO); gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, 1); }

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    common(P.part); gl.uniform3fv(P.part.u.uCenter, player); gl.uniform1f(P.part.u.uPx, W / (window.__vw || innerWidth)); gl.bindVertexArray(partVAO); gl.drawArrays(gl.POINTS, 0, Math.min(PARTS, partN));
    common(P.fx); gl.bindVertexArray(quadVAO);
    const camR = [view[0], view[4], view[8]], camU = [view[1], view[5], view[9]];
    for (const f of fx) {
      if (!sphIn(PlV, f.p[0], f.p[1], f.p[2], Math.hypot(f.size[0], f.size[1]) * 1.05) || !(f.grow ?? 1)) continue; // 画面外・透明の ビルボードは 描かない
      let r = camR, u = camU;
      if (f.cyl) { const toC = V.norm([eye[0] - f.p[0], 0, eye[2] - f.p[2]]); r = V.norm(V.cross([0, 1, 0], toC)); u = [0, 1, 0]; }
      gl.uniform3fv(P.fx.u.uRight, r); gl.uniform3fv(P.fx.u.uUp, u); gl.uniform1f(P.fx.u.uType, f.type); gl.uniform1f(P.fx.u.uGrow, f.grow ?? 1);
      gl.uniform1f(P.fx.u.uSeed, f.seed || 0); gl.uniform3fv(P.fx.u.uTint, f.tint || [1, .62, .3]); gl.uniform3fv(P.fx.u.uC, f.p); gl.uniform2fv(P.fx.u.uSize, f.size);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
    return { night, VP };
  }
  function project(p) { const m = lastVP; if (!m) return null; const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    if (w <= .1) return null; return [(x / w * .5 + .5) * (window.__vw || innerWidth), (1 - (y / w * .5 + .5)) * (window.__vh || innerHeight)]; }

  return { setQuality, get quality() { return QL; }, init, resize, render, project, hAt, nAt, surfaceAt, skyInfo, Blocks, setRegion, biomeAt, speciesGeo, propGeo, seg, TOWN1, RUINS1, TOWN2, TOWER2, ISL2, TOWN3, PALACE3, LH3, TRENCH3, get region() { return REGION; }, Geo, prism, ico, shade, solid, hex, human, creature, shadowGeo, makeMesh, setPaths, fbm, rnd, WORLD, V, clamp, lerp, smooth };
})();
