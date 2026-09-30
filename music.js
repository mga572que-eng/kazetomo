// 風灯の島 — orchestral synth & original score (WebAudio)
'use strict';
const Music = (() => {
  let C = null, master, musicBus, sfxBus, rev, delayIn, noiseBuf;
  let cur = null, muted = false, queued = null, volM = .75, volS = .7;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function nm(s) { const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); if (!m) throw new Error('note ' + s);
    return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
  const QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6], sus4: [0, 5, 7], aug: [0, 4, 8] };
  function parseMel(str) { const ev = []; let t = 0;
    for (const tok of str.trim().split(/\s+/)) { if (tok === '|') continue; const [n, d] = tok.split(':'); const dur = parseFloat(d);
      if (n !== 'R') ev.push({ t, n: n.split('+').map(nm), d: dur }); t += dur; }
    return { ev, len: t }; }
  function parseChords(str) { const out = []; let t = 0;
    for (const tok of str.trim().split(/\s+/)) { if (tok === '|') continue; const [c, d] = tok.split(':'); const dur = parseFloat(d);
      const m = /^([A-G][#b]?)(maj7|m7|sus4|dim|aug|m|7)?(?:\/([A-G][#b]?))?$/.exec(c);
      const root = nm(m[1] + '3'); const bass = m[3] ? nm(m[3] + '2') : root - 12;
      out.push({ t, d: dur, root, iv: QUAL[m[2] || ''], bass: bass < 36 ? bass + 12 : bass }); t += dur; }
    return { ch: out, len: t }; }

  // ---------- instruments ----------
  function env(p, t, dur, peak, att, rel) { const hold = Math.max(att, dur);
    p.setValueAtTime(0, t); p.linearRampToValueAtTime(peak, t + att); p.setValueAtTime(peak, t + hold); p.linearRampToValueAtTime(0, t + hold + rel); return hold + rel; }
  function osc(type, f, t, end, dest, det = 0) { const o = C.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; o.connect(dest); o.start(t); o.stop(end + .05); return o; }
  function vib(t, end, f, depth, rate = 5.2, delay = .3) { const l = C.createOscillator(); l.frequency.value = rate; const g = C.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(f * depth, t + delay); l.connect(g); l.start(t); l.stop(end + .05); return g; }
  function noise(t, dur, type, freq, peak, dest, q = .7) { const s = C.createBufferSource(); s.buffer = noiseBuf; const f = C.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = C.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur + .05); }

  function voice(inst, m, t, dur, vel, dest) {
    const f = mtof(m); const g = C.createGain(); g.connect(dest); let end;
    switch (inst) {
      case 'violin': case 'strings': case 'cello': {
        const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = inst === 'violin' ? 3400 : inst === 'cello' ? 1300 : 2100; lp.Q.value = .3; lp.connect(g);
        const att = inst === 'violin' ? .06 : .2; end = t + env(g.gain, t, dur, vel * (inst === 'violin' ? .07 : .045), att, .4);
        const v = vib(t, end, f, .0045);
        for (const d of [-9, 0, 8]) { const o = osc('sawtooth', f, t, end, lp, d); v.connect(o.frequency); }
        break; }
      case 'brass': case 'trumpet': {
        const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2; lp.connect(g);
        lp.frequency.setValueAtTime(350, t); lp.frequency.exponentialRampToValueAtTime(inst === 'trumpet' ? 3600 : 2400, t + .07); lp.frequency.exponentialRampToValueAtTime(inst === 'trumpet' ? 2200 : 1400, t + .35);
        end = t + env(g.gain, t, dur, vel * .075, .035, .18);
        const v = vib(t, end, f, .003, 5.5, .4);
        for (const d of [-5, 5]) { const o = osc('sawtooth', f, t, end, lp, d); v.connect(o.frequency); }
        break; }
      case 'horn': {
        const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 850; lp.connect(g);
        end = t + env(g.gain, t, dur, vel * .08, .09, .3);
        osc('sawtooth', f, t, end, lp, -4); osc('sine', f, t, end, g); break; }
      case 'flute': {
        end = t + env(g.gain, t, dur, vel * .14, .05, .22);
        const v = vib(t, end, f, .006, 5, .25);
        const o = osc('sine', f, t, end, g); v.connect(o.frequency);
        const g2 = C.createGain(); g2.gain.value = .12; g2.connect(g); osc('triangle', f * 2, t, end, g2);
        break; }
      case 'oboe': {
        const bp = C.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = .9; bp.connect(g);
        end = t + env(g.gain, t, dur, vel * .12, .04, .2);
        const v = vib(t, end, f, .005, 5.4, .3); const o = osc('square', f, t, end, bp); v.connect(o.frequency); break; }
      case 'pizz': {
        const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600; lp.connect(g);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * .16, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .32); end = t + .34;
        osc('triangle', f, t, end, lp); osc('sawtooth', f, t, end, lp, 6); break; }
      case 'harp': case 'glock': {
        const d = inst === 'harp' ? 1.7 : 1.2;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * (inst === 'harp' ? .13 : .07), t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + d); end = t + d;
        osc('sine', f, t, end, g); const g2 = C.createGain(); g2.gain.value = inst === 'harp' ? .3 : .25; g2.connect(g);
        osc(inst === 'harp' ? 'triangle' : 'sine', inst === 'harp' ? f : f * 4, t, end, g2); break; }
      case 'bass': {
        const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480; lp.connect(g);
        end = t + env(g.gain, t, dur, vel * .15, .04, .15);
        osc('sawtooth', f, t, end, lp); osc('sine', f, t, end, g); break; }
      case 'organ': {
        const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.connect(g);
        end = t + env(g.gain, t, dur, vel * .045, .12, .35);
        [[1, 1], [2, .6], [3, .3], [4, .25]].forEach(([h, a]) => { const gg = C.createGain(); gg.gain.value = a; gg.connect(lp); osc('sine', f * h, t, end, gg); });
        break; }
      case 'timp': {
        const o = C.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.45, t); o.frequency.exponentialRampToValueAtTime(f, t + .08); o.connect(g);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * .55, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + 1.1); end = t + 1.1;
        o.start(t); o.stop(end + .05); noise(t, .18, 'lowpass', 380, vel * .3, dest); break; }
      case 'snare': noise(t, .16, 'highpass', 1600, vel * .12, dest); end = t + .2; break;
      case 'cymbal': noise(t, 2.4, 'highpass', 5200, vel * .09, dest); end = t + 2.4; break;
    }
    setTimeout(() => { try { g.disconnect(); } catch (_) {} }, (end - C.currentTime + 1) * 1000);
  }

  // ---------- accompaniment styles ----------
  const timpP = r => { let p = r % 12 + 36; if (p < 41) p += 12; return p; };
  function accomp(chs, style, bpb) {
    const E = []; const push = (t, inst, n, d, v) => E.push({ t, inst, n, d, v });
    chs.forEach((c, ci) => {
      const tn = c.iv.map(i => c.root + i), t = c.t, d = c.d, b = c.bass;
      if (style === 'march') {
        push(t, 'strings', tn.map(x => x + 12), d, .55);
        for (let k = 0; k < d; k++) { push(t + k, 'bass', [k % 2 ? b + 7 : b], .8, .75); push(t + k, 'pizz', [k % 2 ? b + 19 : b + 12], .4, .45); }
        for (let k = 0; k < d; k += 2) push(t + k, 'horn', [tn[1] + 12, tn[2] + 12], Math.min(2, d - k) * .95, .5);
        push(t, 'timp', [timpP(c.root)], 1, .5);
      } else if (style === 'waltz') {
        push(t, 'strings', tn.map(x => x + 12), d, .32);
        for (let k = 0; k < d; k += bpb) { push(t + k, 'bass', [b], .9, .6); push(t + k, 'pizz', [b + 12], .5, .5);
          push(t + k + 1, 'pizz', tn.map(x => x + 12), .4, .38); push(t + k + 2, 'pizz', tn.map(x => x + 12), .4, .32);
          if (Math.random() < .5) push(t + k + 1.5, 'glock', [tn[(k + ci) % tn.length] + 36], .5, .5); }
      } else if (style === 'battle') {
        const pat = [0, 0, 12, 0, 7, 0, 12, 7];
        for (let k = 0; k < d * 2; k++) push(t + k * .5, 'bass', [b + pat[k % 8]], .42, .8);
        const arp = [tn[0] + 12, tn[1] + 12, tn[2] + 12, tn[0] + 24], seq = [0, 1, 2, 3, 2, 1, 2, 3];
        for (let k = 0; k < d * 4; k++) push(t + k * .25, 'violin', [arp[seq[k % 8]]], .2, .32);
        for (let k = 0; k < d; k += 4) { push(t + k, 'brass', tn.map(x => x + 12), .55, .55); if (k + 2.5 < d) push(t + k + 2.5, 'brass', tn.map(x => x + 12), .4, .45);
          push(t + k, 'timp', [timpP(c.root)], .5, .6); if (k + 2 < d) push(t + k + 2, 'timp', [timpP(c.root)], .5, .45);
          push(t + k + 1, 'snare', [60], .1, .5); if (k + 3 < d) push(t + k + 3, 'snare', [60], .1, .5); }
        if (d < 4) { push(t, 'brass', tn.map(x => x + 12), .5, .5); push(t, 'timp', [timpP(c.root)], .5, .5); }
      } else if (style === 'boss') {
        for (let k = 0; k < d * 4; k++) push(t + k * .25, 'cello', [k % 2 ? b + 19 : b + 12], .22, .5);
        push(t, 'organ', tn.map(x => x + 12), d, .55);
        push(t, 'brass', tn.map(x => x + 12), Math.min(d, 2) * .9, .6);
        for (let k = 0; k < d; k++) push(t + k, 'timp', [timpP(c.root)], .5, k === 0 ? .8 : .4);
        push(t, 'bass', [b], d * .95, .8);
        if (ci === 0) push(t, 'cymbal', [60], 2, .8);
      } else if (style === 'nocturne') {
        push(t, 'strings', tn.map(x => x + 12), d, .26);
        const arp = [b + 12, tn[2], tn[0] + 12, tn[1] + 12, tn[2] + 12, tn[1] + 12, tn[0] + 12, tn[2]];
        for (let k = 0; k < d * 2; k++) push(t + k * .5, 'harp', [arp[k % 8]], .5, .55);
        push(t, 'bass', [b], d * .9, .35);
      } else if (style === 'fanfare') {
        push(t, 'brass', tn.map(x => x + 12), d * .95, .5); push(t, 'strings', tn.map(x => x + 24), d, .5); push(t, 'bass', [b], d * .9, .7);
        push(t, 'timp', [timpP(c.root)], .5, .7);
        if (ci === chs.length - 1) { for (let k = 0; k < 8; k++) push(t + k * .125, 'timp', [timpP(c.root)], .2, .25 + k * .05); push(t + 1, 'cymbal', [60], 2, .7); }
      } else if (style === 'hymn') {
        push(t, 'strings', tn.map(x => x + 12), d, .45); push(t, 'horn', [tn[0] + 12, tn[2] + 12], d, .3); push(t, 'bass', [b], d * .95, .5);
        for (let k = 0; k < d; k++) push(t + k, 'harp', [tn[k % tn.length] + 24], 1, .35);
      }
    });
    return E;
  }

  // ---------- score (all melodies original) ----------
  const SONGS = {
    title: { bpm: 92, bpb: 4, style: 'march', loop: true,
      mel: [{ s: 'G4:.5 C5:.5 E5:.5 G5:.5 C6:2 | B5:.75 A5:.25 G5:1 E5:1 C5:1 | D5:1.5 E5:.5 F5:1 A5:1 | G5:4 | A5:1.5 G5:.5 F5:1 D5:1 | E5:1.5 D5:.5 C5:1 A4:1 | B4:1 C5:1 D5:1 G5:1 | C6:3 R:1',
        parts: [['trumpet', 0, .9], ['violin', 12, .45]] }],
      ch: 'C:4 C:2 G/B:2 Dm:2 F:2 G:4 F:2 Dm:2 C:2 Am:2 G:2 G7:2 C:4' },
    village: { bpm: 126, bpb: 3, style: 'waltz', loop: true, secs: [
      { mel: [{ s: 'C5:1 F5:1 A5:1 | G5:2 F5:1 | E5:1 G5:1 C6:1 | A5:3 | Bb5:1 A5:1 G5:1 | A5:1 F5:1 D5:1 | E5:1 F5:1 G5:1 | C5:3 | C5:1 F5:1 A5:1 | C6:2 A5:1 | Bb5:1 D6:1 Bb5:1 | A5:3 | G5:1 Bb5:1 A5:1 | G5:1 E5:1 C5:1 | D5:1 E5:1 G5:1 | F5:3', parts: [['oboe', 0, .9], ['flute', 12, .35]] }], ch: 'F:3 C:3 C:3 F:3 Bb:3 Dm:3 C:3 C7:3 F:3 F:3 Bb:3 F:3 Gm:3 C:3 C7:3 F:3' },
      // B：ニ短調へ ひとやすみ（バイオリンが うたう）
      { mel: [{ s: 'A5:2 D6:1 | D6:1 C6:1 Bb5:1 | G5:2 Bb5:1 | A5:3 | F5:1 A5:1 D6:1 | E6:2 C6:1 | D6:1 Bb5:1 G5:1 | C6:3 | C6:1 A5:1 F5:1 | F5:1 G5:1 Bb5:1 | D6:2 C6:1 | Bb5:1 A5:1 G5:1 | A5:1 C6:1 F6:1 | E6:1 D6:1 A5:1 | Bb5:1 G5:1 E5:1 | F5:3',
        parts: [['violin', -12, .75], ['harp', 0, .3]] }], ch: 'Dm:3 Bb:3 Gm:3 A:3 Dm:3 C:3 Bb:3 C:3 F:3 Bb:3 Gm:3 C:3 F:3 Dm:3 C7:3 F:3' },
      // A'：フルートと グロッケンで 明るく くりかえし
      { mel: [{ s: 'C5:1 F5:1 A5:1 | G5:2 F5:1 | E5:1 G5:1 C6:1 | A5:3 | Bb5:1 A5:1 G5:1 | A5:1 F5:1 D5:1 | E5:1 F5:1 G5:1 | C5:3 | C5:1 F5:1 A5:1 | C6:2 A5:1 | Bb5:1 D6:1 Bb5:1 | A5:3 | G5:1 Bb5:1 A5:1 | G5:1 E5:1 C5:1 | D5:1 E5:1 G5:1 | F5:3', parts: [['flute', 0, .8], ['glock', 12, .22], ['pizz', -12, .35]] }], ch: 'F:3 C:3 C:3 F:3 Bb:3 Dm:3 C:3 C7:3 F:3 F:3 Bb:3 F:3 Gm:3 C:3 C7:3 F:3' }] },
    field: { bpm: 104, bpb: 4, style: 'march', loop: true, secs: [
      { mel: [{ s: 'D5:1.5 E5:.5 F#5:1 A5:1 | B5:1.5 A5:.5 F#5:1 D5:1 | E5:1.5 F#5:.5 G5:1 B5:1 | A5:3 R:1 | B5:1.5 A5:.5 G5:1 E5:1 | F#5:1.5 E5:.5 D5:1 B4:1 | G5:1 F#5:1 E5:1 D5:1 | E5:3 R:1 | F#5:1.5 G5:.5 A5:1 D6:1 | C#6:1.5 B5:.5 A5:2 | B5:1 G5:1 E5:1 G5:1 | A5:1.5 F#5:.5 D5:2 | G5:1.5 F#5:.5 E5:1 B5:1 | A5:1.5 G5:.5 F#5:1 D5:1 | E5:1 F#5:.5 G5:.5 A5:1 C#5:1 | D5:4', parts: [['violin', 0, 1], ['horn', -12, .45]] }], ch: 'D:4 Bm:4 G:2 Em:2 D:4 G:4 D:2 Bm:2 Em:2 A:2 A:4 D:4 A:4 Em:4 D:4 G:4 D:4 A7:4 D:4' },
      // B：ロ短調の 広い 野原（フルートと 讃歌風の 伴奏）
      { style: 'hymn', mel: [{ s: 'F#5:2 E5:1 D5:1 | B4:1.5 D5:.5 G5:2 | G5:1 F#5:1 E5:1 B4:1 | C#5:3 R:1 | D5:1 F#5:1 B5:1.5 A5:.5 | G5:1 F#5:1 E5:2 | E5:1 F#5:1 G5:1 A5:1 | F#5:3 R:1 | B5:2 A5:1 G5:1 | A5:2 F#5:1 D5:1 | E5:1 G5:1 B5:1 D6:1 | C#6:3 R:1 | D6:1.5 C#6:.5 B5:1 F#5:1 | G5:1.5 A5:.5 B5:1 G5:1 | E5:1 G5:1 A5:1 C#5:1 | D5:2 A4:1 D5:1',
        parts: [['flute', 0, .85], ['oboe', -12, .3]] }], ch: 'Bm:4 G:4 Em:4 F#:4 Bm:4 G:4 A:4 D:4 G:4 D/F#:4 Em:4 A:4 Bm:4 G:4 Em:2 A7:2 D:4' },
      // A'：トランペットで 主題を もう一度
      { mel: [{ s: 'D5:1.5 E5:.5 F#5:1 A5:1 | B5:1.5 A5:.5 F#5:1 D5:1 | E5:1.5 F#5:.5 G5:1 B5:1 | A5:3 R:1 | B5:1.5 A5:.5 G5:1 E5:1 | F#5:1.5 E5:.5 D5:1 B4:1 | G5:1 F#5:1 E5:1 D5:1 | E5:3 R:1 | F#5:1.5 G5:.5 A5:1 D6:1 | C#6:1.5 B5:.5 A5:2 | B5:1 G5:1 E5:1 G5:1 | A5:1.5 F#5:.5 D5:2 | G5:1.5 F#5:.5 E5:1 B5:1 | A5:1.5 G5:.5 F#5:1 D5:1 | E5:1 F#5:.5 G5:.5 A5:1 C#5:1 | D5:4', parts: [['trumpet', 0, .7], ['violin', 12, .3], ['glock', 12, .12]] }], ch: 'D:4 Bm:4 G:2 Em:2 D:4 G:4 D:2 Bm:2 Em:2 A:2 A:4 D:4 A:4 Em:4 D:4 G:4 D:4 A7:4 D:4' }] },
    // 夜：オリジナル（ホ短調の ノクターン → ト長調の 星空 → くりかえし）
    night: { bpm: 76, bpb: 4, style: 'nocturne', loop: true, secs: [
      { mel: [{ s: 'B4:1 E5:1 G5:1.5 F#5:.5 | E5:2 B4:2 | C5:1 E5:1 A5:1.5 G5:.5 | F#5:3 D#5:1 | E5:1 G5:1 B5:1.5 A5:.5 | G5:1 E5:1 C6:2 | B5:1 A5:1 F#5:1 D#5:1 | E5:4', parts: [['flute', 0, .8], ['strings', -12, .22]] }], ch: 'Em:4 Cmaj7:4 Am7:4 B7:4 Em:4 Cmaj7:4 Am:2 B7:2 Em:4' },
      { mel: [{ s: 'D5:1 G5:1 B5:1 D6:1 | C#6:1.5 A5:.5 F#5:2 | G5:1 B5:1 E6:1.5 D6:.5 | C6:3 R:1 | A5:1 C6:1 E6:1 D6:1 | D6:1.5 C6:.5 A5:1 F#5:1 | G5:1 A5:1 B5:1 D6:1 | B5:4',
        parts: [['violin', -12, .6], ['glock', 12, .14]] }], ch: 'G:4 D/F#:4 Em:4 C:4 Am7:4 D:4 C:2 D:2 G:4' },
      { mel: [{ s: 'B4:1 E5:1 G5:1.5 F#5:.5 | E5:2 B4:2 | C5:1 E5:1 A5:1.5 G5:.5 | F#5:3 D#5:1 | E5:1 G5:1 B5:1.5 A5:.5 | G5:1 E5:1 C6:2 | B5:1 A5:1 F#5:1 D#5:1 | E5:4', parts: [['oboe', 0, .7], ['flute', 12, .2]] }], ch: 'Em:4 Cmaj7:4 Am7:4 B7:4 Em:4 Cmaj7:4 Am:2 B7:2 Em:4' }] },
    battle: { bpm: 152, bpb: 4, style: 'battle', loop: true, secs: [
      { mel: [{ s: 'A5:.5 E5:.5 A5:.5 C6:.5 B5:1 A5:1 | G#5:.5 E5:.5 G#5:.5 B5:.5 A5:2 | F5:.5 A5:.5 D6:.5 C6:.5 B5:.5 A5:.5 G#5:.5 A5:.5 | B5:3 R:1 | C6:.5 B5:.5 A5:.5 G5:.5 F5:1 A5:1 | B5:.5 A5:.5 G5:.5 F5:.5 E5:2 | D5:.5 E5:.5 F5:.5 G5:.5 A5:.5 B5:.5 C6:.5 D6:.5 | E6:3 R:1 | E6:1 D6:.5 C6:.5 B5:1 A5:1 | D6:1 C6:.5 B5:.5 A5:1 G#5:1 | C6:1 B5:.5 A5:.5 G5:1 F5:1 | E5:2 G#5:2 | A5:.5 B5:.5 C6:.5 D6:.5 E6:1 C6:1 | F6:1 E6:.5 D6:.5 C6:1 B5:1 | A5:.5 G#5:.5 A5:.5 B5:.5 C6:.5 B5:.5 A5:.5 G#5:.5 | A5:3 R:1', parts: [['violin', -12, 1], ['trumpet', -12, .5]] }], ch: 'Am:4 E:4 Dm:2 E:2 E:4 F:4 G:2 C:2 Dm:2 G:2 C:2 E:2 Am:4 Dm:2 E:2 F:2 Dm:2 E:4 Am:4 Dm:2 G:2 E7:4 Am:4' },
      // B：ヘ長調へ ぬける 反撃の 主題（トランペット）
      { mel: [{ s: 'A5:1 C6:1 F6:1.5 E6:.5 | D6:1 B5:1 G5:2 | E6:.5 D6:.5 B5:.5 G5:.5 E5:1 G5:1 | A5:3 R:1 | F5:.5 G5:.5 A5:.5 C6:.5 F6:1 E6:1 | D6:.5 C6:.5 B5:.5 A5:.5 G5:2 | G#5:1 B5:1 E6:1 D6:1 | B5:3 R:1 | D6:1 F6:1 E6:.5 D6:.5 C6:1 | B5:1 D6:1 G5:2 | C6:1 E6:1 D6:.5 C6:.5 B5:1 | A5:2 E5:2 | F5:.5 A5:.5 C6:.5 F6:.5 E6:1 C6:1 | D6:.5 B5:.5 G5:.5 B5:.5 D6:1 G6:1 | E6:1 D6:.5 C6:.5 B5:1 G#5:1 | E5:.5 F5:.5 G#5:.5 A5:.5 B5:.5 C6:.5 D6:.5 E6:.5',
        parts: [['trumpet', -12, .9], ['violin', 0, .35]] }], ch: 'F:4 G:4 Em:4 Am:4 F:4 G:4 E:4 E7:4 Dm:4 G:4 C:4 Am:4 F:4 G:4 E:4 E7:4' },
      // A'：オクターブ上の バイオリン＋金管で もりあげる
      { mel: [{ s: 'A5:.5 E5:.5 A5:.5 C6:.5 B5:1 A5:1 | G#5:.5 E5:.5 G#5:.5 B5:.5 A5:2 | F5:.5 A5:.5 D6:.5 C6:.5 B5:.5 A5:.5 G#5:.5 A5:.5 | B5:3 R:1 | C6:.5 B5:.5 A5:.5 G5:.5 F5:1 A5:1 | B5:.5 A5:.5 G5:.5 F5:.5 E5:2 | D5:.5 E5:.5 F5:.5 G5:.5 A5:.5 B5:.5 C6:.5 D6:.5 | E6:3 R:1 | E6:1 D6:.5 C6:.5 B5:1 A5:1 | D6:1 C6:.5 B5:.5 A5:1 G#5:1 | C6:1 B5:.5 A5:.5 G5:1 F5:1 | E5:2 G#5:2 | A5:.5 B5:.5 C6:.5 D6:.5 E6:1 C6:1 | F6:1 E6:.5 D6:.5 C6:1 B5:1 | A5:.5 G#5:.5 A5:.5 B5:.5 C6:.5 B5:.5 A5:.5 G#5:.5 | A5:3 R:1', parts: [['violin', 0, .75], ['brass', -12, .5], ['glock', 12, .1]] }], ch: 'Am:4 E:4 Dm:2 E:2 E:4 F:4 G:2 C:2 Dm:2 G:2 C:2 E:2 Am:4 Dm:2 E:2 F:2 Dm:2 E:4 Am:4 Dm:2 G:2 E7:4 Am:4' }] },
    boss: { bpm: 132, bpb: 4, style: 'boss', loop: true, secs: [
      { mel: [{ s: 'D5:1 D5:.5 E5:.5 F5:1 A5:1 | G#5:2 A5:2 | Bb5:1 A5:.5 G5:.5 F5:1 E5:1 | D5:1 C#5:1 D5:2 | F5:1 F5:.5 G5:.5 A5:1 D6:1 | C#6:2 A5:2 | Bb5:.5 C6:.5 Bb5:.5 A5:.5 G5:.5 F5:.5 E5:.5 G5:.5 | A5:4 | D6:1.5 C6:.5 Bb5:1 A5:1 | G5:1.5 F5:.5 E5:1 C#5:1 | D5:1 F5:1 A5:1 D6:1 | E6:2 C#6:2 | F6:1.5 E6:.5 D6:1 A5:1 | Bb5:1.5 A5:.5 G5:1 E5:1 | F5:1 E5:1 D5:1 C#5:1 | D5:4', parts: [['brass', -12, .9], ['violin', 0, .55]] }], ch: 'Dm:4 E:2 A:2 Gm:4 A:2 Dm:2 Dm:4 A:4 Gm:2 C:2 F:2 A:2 Bb:4 Gm:2 A:2 Dm:4 A:4 Dm:4 Gm:2 A:2 Bb:2 A:2 Dm:4' },
      // B：変ロ長調で たたみかける
      { mel: [{ s: 'D6:1 D6:.5 C6:.5 Bb5:1 F5:1 | A5:2 C6:2 | G5:1 G5:.5 A5:.5 Bb5:1 D6:1 | C#6:2 E6:2 | F6:1 E6:.5 D6:.5 A5:1 F5:1 | G5:1.5 A5:.5 Bb5:1 D6:1 | G#5:1 B5:1 E6:1 D6:1 | C#6:4 | D5:.5 F5:.5 A5:.5 D6:.5 F6:1 D6:1 | Bb5:.5 D6:.5 G6:.5 D6:.5 Bb5:2 | C6:.5 E6:.5 G6:.5 E6:.5 C6:1 G5:1 | A5:4 | Bb5:1 A5:.5 G5:.5 F5:1 D5:1 | G5:1 Bb5:.5 D6:.5 G6:2 | E6:1 C#6:1 A5:1 G5:1 | D6:2 R:2', parts: [['trumpet', -12, .8], ['violin', 0, .45]] }], ch: 'Bb:4 F:4 Gm:4 A:4 Dm:4 Bb:4 E:4 A:4 Dm:4 Gm:4 C:4 F:4 Bb:4 Gm:4 A7:4 Dm:4' },
      // A'：楽器を かえて 主題を もう一度
      { mel: [{ s: 'D5:1 D5:.5 E5:.5 F5:1 A5:1 | G#5:2 A5:2 | Bb5:1 A5:.5 G5:.5 F5:1 E5:1 | D5:1 C#5:1 D5:2 | F5:1 F5:.5 G5:.5 A5:1 D6:1 | C#6:2 A5:2 | Bb5:.5 C6:.5 Bb5:.5 A5:.5 G5:.5 F5:.5 E5:.5 G5:.5 | A5:4 | D6:1.5 C6:.5 Bb5:1 A5:1 | G5:1.5 F5:.5 E5:1 C#5:1 | D5:1 F5:1 A5:1 D6:1 | E6:2 C#6:2 | F6:1.5 E6:.5 D6:1 A5:1 | Bb5:1.5 A5:.5 G5:1 E5:1 | F5:1 E5:1 D5:1 C#5:1 | D5:4', parts: [['violin', 0, .7], ['brass', -12, .7], ['trumpet', 0, .2]] }], ch: 'Dm:4 E:2 A:2 Gm:4 A:2 Dm:2 Dm:4 A:4 Gm:2 C:2 F:2 A:2 Bb:4 Gm:2 A:2 Dm:4 A:4 Dm:4 Gm:2 A:2 Bb:2 A:2 Dm:4' }] },
    // エンディング：オリジナル（ヘ長調の 讃歌 → ニ短調で ふりかえり → 金管で 大きく 帰結）
    ending: { bpm: 72, bpb: 4, style: 'hymn', loop: true, secs: [
      { mel: [{ s: 'C5:1 F5:1 A5:1.5 G5:.5 | G5:2 E5:1 C5:1 | D5:1 F5:1 A5:1 D6:1 | C6:2 Bb5:1 A5:1 | A5:1.5 Bb5:.5 C6:1 F5:1 | G5:1 A5:1 Bb5:1 D6:1 | C6:1 Bb5:1 A5:1 G5:1 | F5:4', parts: [['violin', 0, .75], ['flute', 12, .22]] }], ch: 'F:4 C/E:4 Dm:4 Bb:4 F/A:4 Gm:4 C:2 C7:2 F:4' },
      { style: 'nocturne', mel: [{ s: 'A5:1 D6:1 C6:1 A5:1 | Bb5:1.5 A5:.5 G5:1 F5:1 | G5:1 Bb5:1 D6:1.5 C6:.5 | C#6:3 R:1 | D6:1 F6:1 E6:1 D6:1 | D6:1.5 C6:.5 Bb5:2 | Bb5:1 A5:1 G5:1 E5:1 | C6:2 E5:1 G5:1',
        parts: [['oboe', 0, .7], ['strings', -12, .3]] }], ch: 'Dm:4 Bb:4 Gm:4 A:4 Dm:4 Bb:4 Gm:2 C7:2 C:4' },
      { style: 'fanfare', mel: [{ s: 'C5:1 F5:1 A5:1.5 G5:.5 | G5:2 E5:1 C5:1 | D5:1 F5:1 A5:1 D6:1 | C6:2 Bb5:1 A5:1 | A5:1.5 Bb5:.5 C6:1 F5:1 | G5:1 A5:1 Bb5:1 D6:1 | C6:1 Bb5:1 A5:1 G5:1 | F5:4', parts: [['violin', 12, .55], ['horn', 0, .5], ['trumpet', 0, .3]] }], ch: 'F:4 C/E:4 Dm:4 Bb:4 F/A:4 Gm:4 C:2 C7:2 F:4' }] },
    dungeon: { bpm: 84, bpb: 4, style: 'nocturne', loop: true, secs: [
      { mel: [{ s: 'E5:1 G5:1 B5:2 | A5:1 G5:1 F#5:2 | G5:1 E5:1 C5:2 | D#5:4 | E5:1 G5:1 B5:2 | C6:1 B5:1 A5:2 | G5:1 F#5:1 D#5:1 F#5:1 | E5:4', parts: [['oboe', 0, .8], ['strings', -12, .35]] }], ch: 'Em:4 D:4 C:4 B:4 Em:4 Am:4 B:4 Em:4' },
      // B：ト長調の かげり（フルートと ハープ）
      { mel: [{ s: 'B4:2 E5:1 G5:1 | F#5:3 D5:1 | E5:1 C5:1 A4:2 | B4:4 | C5:1 E5:1 A5:2 | G5:1 E5:1 B4:2 | C5:1 B4:1 A4:1 F#4:1 | B4:4', parts: [['flute', 0, .6], ['harp', -12, .4]] }], ch: 'Em:4 D:4 Am:4 B:4 Am:4 Em:4 Am:2 B7:2 B:4' },
      // A'：楽器を かえて 主題を もう一度
      { mel: [{ s: 'E5:1 G5:1 B5:2 | A5:1 G5:1 F#5:2 | G5:1 E5:1 C5:2 | D#5:4 | E5:1 G5:1 B5:2 | C6:1 B5:1 A5:2 | G5:1 F#5:1 D#5:1 F#5:1 | E5:4', parts: [['violin', 0, .6], ['oboe', -12, .35]] }], ch: 'Em:4 D:4 C:4 B:4 Em:4 Am:4 B:4 Em:4' }] },
    town: { bpm: 112, bpb: 4, style: 'march', loop: true, secs: [
      { mel: [{ s: 'G5:1 E5:.5 G5:.5 C6:1 G5:1 | A5:1 F5:.5 A5:.5 C6:2 | B5:1 G5:.5 B5:.5 D6:1 B5:1 | C6:3 R:1 | E6:1 D6:.5 C6:.5 A5:1 C6:1 | B5:1 A5:.5 G5:.5 E5:2 | F5:1 A5:1 G5:1 B4:1 | C5:3 R:1', parts: [['flute', 0, .8], ['pizz', -12, .5]] }], ch: 'C:4 F:4 G:4 C:4 Am:4 Em:4 F:2 G:2 C:4' },
      // B：イ短調で 市場の ざわめき
      { mel: [{ s: 'E5:1 C5:.5 E5:.5 A5:1 E5:1 | F5:1 A5:.5 C6:.5 A5:2 | G5:1 B5:.5 D6:.5 B5:1 G5:1 | E5:3 R:1 | A5:1 C6:.5 E6:.5 C6:1 A5:1 | F5:1 A5:.5 D6:.5 A5:2 | G5:1 F5:.5 E5:.5 D5:1 B4:1 | D5:3 R:1 | C6:1 A5:.5 C6:.5 F6:1 C6:1 | E6:1 C6:.5 E6:.5 G5:2 | F5:1 A5:.5 D6:.5 F6:1 D6:1 | D6:3 R:1 | E6:1 D6:.5 C6:.5 G5:1 E5:1 | F5:1 A5:.5 C6:.5 A5:1 F5:1 | D5:1 G5:1 B5:1 D6:1 | C6:3 R:1', parts: [['oboe', 0, .75], ['pizz', -12, .45]] }], ch: 'Am:4 F:4 G:4 C:4 Am:4 Dm:4 G:4 G7:4 F:4 C:4 Dm:4 G:4 C:4 F:4 G:2 G7:2 C:4' },
      // A'：楽器を かえて 主題を もう一度
      { mel: [{ s: 'G5:1 E5:.5 G5:.5 C6:1 G5:1 | A5:1 F5:.5 A5:.5 C6:2 | B5:1 G5:.5 B5:.5 D6:1 B5:1 | C6:3 R:1 | E6:1 D6:.5 C6:.5 A5:1 C6:1 | B5:1 A5:.5 G5:.5 E5:2 | F5:1 A5:1 G5:1 B4:1 | C5:3 R:1', parts: [['violin', 0, .6], ['glock', 12, .2], ['pizz', -12, .45]] }], ch: 'C:4 F:4 G:4 C:4 Am:4 Em:4 F:2 G:2 C:4' }] },
    sky: { bpm: 100, bpb: 3, style: 'waltz', loop: true, secs: [
      { mel: [{ s: 'Bb4:1 Eb5:1 G5:1 | Bb5:2 G5:1 | Ab5:1 G5:1 F5:1 | G5:3 | Ab5:1 C6:1 Bb5:1 | Ab5:1 G5:1 F5:1 | G5:1 Eb5:1 C5:1 | D5:3 | Bb4:1 Eb5:1 G5:1 | Bb5:2 Eb6:1 | D6:1 C6:1 Bb5:1 | C6:3 | Ab5:1 C6:1 Eb6:1 | D6:1 Bb5:1 G5:1 | Ab5:1 F5:1 D5:1 | Eb5:3', parts: [['flute', 0, .8], ['violin', 12, .3], ['horn', -12, .35]] }], ch: 'Eb:3 Eb:3 Ab:3 Eb:3 Ab:3 Fm:3 Cm:3 Bb:3 Eb:3 Eb:3 Bb:3 Ab:3 Ab:3 Eb:3 Bb7:3 Eb:3' },
      // B：ハ短調の 雲間（バイオリン）
      { mel: [{ s: 'G5:2 C6:1 | C6:1 Bb5:1 Ab5:1 | F5:2 Ab5:1 | G5:3 | Eb5:1 G5:1 C6:1 | D6:2 Bb5:1 | C6:1 Ab5:1 F5:1 | Bb5:3 | G5:1 Bb5:1 Eb6:1 | Eb6:2 C6:1 | Ab5:1 C6:1 F6:1 | F6:2 D6:1 | Eb6:1 D6:1 Bb5:1 | C6:1 G5:1 Eb5:1 | F5:1 Ab5:1 D5:1 | Eb5:3', parts: [['violin', 0, .6], ['harp', -12, .4]] }], ch: 'Cm:3 Ab:3 Fm:3 G:3 Cm:3 Bb:3 Ab:3 Bb:3 Eb:3 Ab:3 Fm:3 Bb:3 Eb:3 Cm:3 Bb7:3 Eb:3' },
      // A'：楽器を かえて 主題を もう一度
      { mel: [{ s: 'Bb4:1 Eb5:1 G5:1 | Bb5:2 G5:1 | Ab5:1 G5:1 F5:1 | G5:3 | Ab5:1 C6:1 Bb5:1 | Ab5:1 G5:1 F5:1 | G5:1 Eb5:1 C5:1 | D5:3 | Bb4:1 Eb5:1 G5:1 | Bb5:2 Eb6:1 | D6:1 C6:1 Bb5:1 | C6:3 | Ab5:1 C6:1 Eb6:1 | D6:1 Bb5:1 G5:1 | Ab5:1 F5:1 D5:1 | Eb5:3', parts: [['oboe', 0, .7], ['glock', 12, .18], ['horn', -12, .3]] }], ch: 'Eb:3 Eb:3 Ab:3 Eb:3 Ab:3 Fm:3 Cm:3 Bb:3 Eb:3 Eb:3 Bb:3 Ab:3 Ab:3 Eb:3 Bb7:3 Eb:3' }] },
    skytown: { bpm: 100, bpb: 4, style: 'march', loop: true, secs: [
      { mel: [{ s: 'A5:.5 C6:.5 A5:.5 F5:.5 G5:1 C5:1 | A5:.5 Bb5:.5 C6:.5 D6:.5 C6:2 | Bb5:.5 A5:.5 G5:.5 F5:.5 E5:1 G5:1 | F5:3 R:1 | D6:1 C6:.5 Bb5:.5 A5:1 F5:1 | G5:1 A5:.5 Bb5:.5 C6:2 | Bb5:.5 A5:.5 G5:.5 A5:.5 Bb5:1 E5:1 | F5:3 R:1', parts: [['oboe', 0, .8], ['pizz', -12, .5], ['glock', 12, .2]] }], ch: 'F:4 F:2 Bb:2 C:2 C7:2 F:4 Bb:4 F:2 C:2 Gm:2 C7:2 F:4' },
      // B：ニ短調の 風車小路
      { mel: [{ s: 'D5:.5 F5:.5 A5:.5 D6:.5 C6:1 A5:1 | Bb5:.5 A5:.5 G5:.5 F5:.5 D5:2 | E5:.5 G5:.5 C6:.5 E6:.5 D6:1 C6:1 | A5:3 R:1 | F5:1 A5:.5 D6:.5 C6:1 A5:1 | Bb5:1 G5:.5 D5:.5 G5:2 | C6:.5 Bb5:.5 A5:.5 G5:.5 E5:1 C5:1 | E5:3 R:1 | D6:1 F6:.5 D6:.5 Bb5:1 F5:1 | A5:1 C6:.5 A5:.5 F5:2 | G5:.5 A5:.5 Bb5:.5 D6:.5 G6:1 D6:1 | E6:3 R:1 | F6:1 C6:.5 A5:.5 F5:1 A5:1 | Bb5:1 D6:.5 Bb5:.5 F5:2 | G5:.5 A5:.5 Bb5:.5 G5:.5 E5:1 G5:1 | F5:3 R:1', parts: [['flute', 0, .75], ['pizz', -12, .5]] }], ch: 'Dm:4 Bb:4 C:4 F:4 Dm:4 Gm:4 C:4 C7:4 Bb:4 F:4 Gm:4 C:4 F:4 Bb:4 C:2 C7:2 F:4' },
      // A'：楽器を かえて 主題を もう一度
      { mel: [{ s: 'A5:.5 C6:.5 A5:.5 F5:.5 G5:1 C5:1 | A5:.5 Bb5:.5 C6:.5 D6:.5 C6:2 | Bb5:.5 A5:.5 G5:.5 F5:.5 E5:1 G5:1 | F5:3 R:1 | D6:1 C6:.5 Bb5:.5 A5:1 F5:1 | G5:1 A5:.5 Bb5:.5 C6:2 | Bb5:.5 A5:.5 G5:.5 A5:.5 Bb5:1 E5:1 | F5:3 R:1', parts: [['violin', 0, .6], ['pizz', -12, .5], ['glock', 12, .22]] }], ch: 'F:4 F:2 Bb:2 C:2 C7:2 F:4 Bb:4 F:2 C:2 Gm:2 C7:2 F:4' }] },
    tower: { bpm: 80, bpb: 4, style: 'nocturne', loop: true, secs: [
      { mel: [{ s: 'D5:1 F5:1 A5:1 D6:1 | C#6:2 A5:2 | Bb5:1 A5:1 G5:1 F5:1 | E5:4 | F5:1 A5:1 C6:1 F6:1 | E6:2 C6:2 | D6:1 C6:1 Bb5:1 A5:1 | A5:4', parts: [['strings', 0, .7], ['harp', 12, .35], ['flute', 12, .22]] }], ch: 'Dm:4 A:4 Gm:4 A:4 F:4 C:4 Bb:4 A:4' },
      // B：変ロ長調で 塔を のぼる
      { mel: [{ s: 'D5:1 F5:1 Bb5:1 D6:1 | C6:2 A5:2 | G5:1 Bb5:1 D6:1 G6:1 | E6:4 | F6:1 E6:1 D6:1 A5:1 | Bb5:1 D6:1 F6:2 | E6:1 D6:1 Bb5:1 G5:1 | A5:4', parts: [['violin', 0, .6], ['harp', 12, .3], ['cello', -12, .3]] }], ch: 'Bb:4 F:4 Gm:4 A:4 Dm:4 Bb:4 Gm:2 A7:2 A:4' },
      // A'：楽器を かえて 主題を もう一度
      { mel: [{ s: 'D5:1 F5:1 A5:1 D6:1 | C#6:2 A5:2 | Bb5:1 A5:1 G5:1 F5:1 | E5:4 | F5:1 A5:1 C6:1 F6:1 | E6:2 C6:2 | D6:1 C6:1 Bb5:1 A5:1 | A5:4', parts: [['flute', 0, .6], ['strings', -12, .45], ['glock', 12, .12]] }], ch: 'Dm:4 A:4 Gm:4 A:4 F:4 C:4 Bb:4 A:4' }] },
    lastboss: { bpm: 144, bpb: 4, style: 'boss', loop: true, secs: [
      { mel: [{ s: 'E5:.5 E5:.5 G5:.5 B5:.5 E6:1 D6:1 | C6:.5 B5:.5 A5:.5 G5:.5 F#5:2 | G5:.5 A5:.5 B5:.5 C6:.5 D6:1 B5:1 | E6:3 R:1 | E6:.5 D6:.5 C6:.5 B5:.5 A5:1 C6:1 | B5:.5 A5:.5 G5:.5 F#5:.5 E5:2 | C6:1 B5:1 A5:1 F#5:1 | G5:1 A5:1 B5:2 | E6:1.5 D#6:.5 E6:1 B5:1 | C6:1.5 B5:.5 A5:1 E5:1 | F#5:1 G5:1 A5:1 D#5:1 | E5:4', parts: [['brass', -12, .85], ['violin', 0, .6], ['trumpet', 0, .22]] }], ch: 'Em:4 Am:2 B:2 Em:2 G:2 B:4 C:2 Am:2 Em:2 B:2 Am:2 D:2 G:2 B7:2 Em:4 C:4 Am:2 B:2 Em:4' },
      // B：ハ長調へ 反撃の 光（トランペット）
      { mel: [{ s: 'E5:.5 G5:.5 C6:.5 E6:.5 G6:1 E6:1 | F#6:.5 E6:.5 D6:.5 A5:.5 F#5:2 | B5:.5 D6:.5 F#6:.5 D6:.5 B5:1 F#5:1 | G5:3 R:1 | C6:1 E6:1 G6:1.5 F#6:.5 | F#6:1 D6:1 A5:2 | B5:.5 D#6:.5 F#6:.5 D#6:.5 B5:1 F#5:1 | A5:2 D#5:2 | A5:.5 C6:.5 E6:.5 C6:.5 A5:1 E5:1 | G5:.5 B5:.5 E6:.5 B5:.5 G5:1 E5:1 | C6:1 D6:1 E6:1 G6:1 | F#6:3 R:1 | E6:1 D6:.5 E6:.5 B5:1 G5:1 | C6:1 B5:.5 C6:.5 G5:1 E5:1 | A5:1 C6:1 B5:1 D#6:1 | E6:2 B5:2', parts: [['trumpet', -12, .75], ['violin', 0, .5], ['brass', -24, .3]] }], ch: 'C:4 D:4 Bm:4 Em:4 C:4 D:4 B:4 B7:4 Am:4 Em:4 C:4 D:4 Em:4 C:4 Am:2 B7:2 Em:4' },
      // A'：楽器を かえて 主題を もう一度
      { mel: [{ s: 'E5:.5 E5:.5 G5:.5 B5:.5 E6:1 D6:1 | C6:.5 B5:.5 A5:.5 G5:.5 F#5:2 | G5:.5 A5:.5 B5:.5 C6:.5 D6:1 B5:1 | E6:3 R:1 | E6:.5 D6:.5 C6:.5 B5:.5 A5:1 C6:1 | B5:.5 A5:.5 G5:.5 F#5:.5 E5:2 | C6:1 B5:1 A5:1 F#5:1 | G5:1 A5:1 B5:2 | E6:1.5 D#6:.5 E6:1 B5:1 | C6:1.5 B5:.5 A5:1 E5:1 | F#5:1 G5:1 A5:1 D#5:1 | E5:4', parts: [['violin', 0, .7], ['brass', -12, .7], ['trumpet', 0, .2]] }], ch: 'Em:4 Am:2 B:2 Em:2 G:2 B:4 C:2 Am:2 Em:2 B:2 Am:2 D:2 G:2 B7:2 Em:4 C:4 Am:2 B:2 Em:4' }] },
    sea: { bpm: 80, bpb: 3, style: 'waltz', loop: true, secs: [
      { mel: [{ s: 'D5:1 F5:1 A5:1 | G5:2 F5:1 | E5:1 F5:1 G5:1 | A5:3 | C6:1 A5:1 F5:1 | G5:1.5 F5:.5 E5:1 | D5:1 E5:1 C5:1 | D5:3 | F5:1 A5:1 D6:1 | C6:2 A5:1 | Bb5:1 A5:1 G5:1 | A5:3 | G5:1 Bb5:1 D6:1 | C6:1 A5:1 F5:1 | E5:1 G5:1 C#5:1 | D5:3', parts: [['flute', 0, .7], ['harp', -12, .45], ['strings', -12, .25]] }], ch: 'Dm:3 Gm:3 C:3 F:3 F:3 Bb:3 Gm:3 Dm:3 Dm:3 F:3 Gm:3 Dm:3 Bb:3 F:3 A7:3 Dm:3' },
      // B：ヘ長調の 光の 海流
      { mel: [{ s: 'A5:2 C6:1 | C6:1 Bb5:1 G5:1 | F5:2 A5:1 | E5:3 | D5:1 F5:1 Bb5:1 | A5:2 F5:1 | G5:1 Bb5:1 D6:1 | C6:3 | C6:1 F6:1 C6:1 | D6:2 A5:1 | Bb5:1 D6:1 F6:1 | E6:3 | D6:1 Bb5:1 G5:1 | F5:1 A5:1 D6:1 | C#6:1 A5:1 E5:1 | D5:3', parts: [['violin', -12, .55], ['harp', 0, .4]] }], ch: 'F:3 C:3 Dm:3 A:3 Bb:3 F:3 Gm:3 C:3 F:3 Dm:3 Bb:3 A:3 Gm:3 Dm:3 A7:3 Dm:3' },
      // A'：楽器を かえて 主題を もう一度
      { mel: [{ s: 'D5:1 F5:1 A5:1 | G5:2 F5:1 | E5:1 F5:1 G5:1 | A5:3 | C6:1 A5:1 F5:1 | G5:1.5 F5:.5 E5:1 | D5:1 E5:1 C5:1 | D5:3 | F5:1 A5:1 D6:1 | C6:2 A5:1 | Bb5:1 A5:1 G5:1 | A5:3 | G5:1 Bb5:1 D6:1 | C6:1 A5:1 F5:1 | E5:1 G5:1 C#5:1 | D5:3', parts: [['oboe', 0, .6], ['harp', -12, .45], ['glock', 12, .12]] }], ch: 'Dm:3 Gm:3 C:3 F:3 F:3 Bb:3 Gm:3 Dm:3 Dm:3 F:3 Gm:3 Dm:3 Bb:3 F:3 A7:3 Dm:3' }] },
    seatown: { bpm: 96, bpb: 4, style: 'march', loop: true, secs: [
      { mel: [{ s: 'C5:.5 F5:.5 A5:.5 C6:.5 A5:1 F5:1 | G5:.5 A5:.5 Bb5:.5 G5:.5 A5:2 | Bb5:.5 A5:.5 G5:.5 F5:.5 E5:1 C5:1 | F5:3 R:1 | A5:1 C6:.5 D6:.5 C6:1 A5:1 | Bb5:.5 C6:.5 Bb5:.5 A5:.5 G5:2 | A5:.5 G5:.5 F5:.5 E5:.5 D5:1 E5:1 | F5:3 R:1', parts: [['oboe', 0, .7], ['harp', -12, .45], ['glock', 12, .18]] }], ch: 'F:4 C:4 Bb:2 C:2 F:4 F:4 Gm:4 Bb:2 C:2 F:4' },
      // B：ニ短調の 泡の 路地
      { mel: [{ s: 'A5:.5 F5:.5 D5:.5 F5:.5 A5:1 D6:1 | D6:.5 C6:.5 Bb5:.5 A5:.5 F5:2 | G5:.5 A5:.5 Bb5:.5 C6:.5 E5:1 G5:1 | A5:3 R:1 | F5:1 A5:.5 D6:.5 F6:1 D6:1 | D6:.5 C6:.5 Bb5:.5 A5:.5 G5:2 | E5:.5 F5:.5 G5:.5 A5:.5 Bb5:1 G5:1 | C6:3 R:1 | C6:1 A5:.5 C6:.5 F6:1 C6:1 | D6:1 Bb5:.5 D6:.5 F6:2 | G5:.5 Bb5:.5 D6:.5 G6:.5 F6:1 D6:1 | E6:3 R:1 | D6:1 A5:.5 F5:.5 D5:1 F5:1 | Bb5:1 A5:.5 G5:.5 F5:1 D5:1 | C5:.5 E5:.5 G5:.5 Bb5:.5 C6:1 E5:1 | F5:3 R:1', parts: [['flute', 0, .65], ['harp', -12, .45]] }], ch: 'Dm:4 Bb:4 C:4 F:4 Dm:4 Gm:4 C:4 C7:4 F:4 Bb:4 Gm:4 C:4 Dm:4 Bb:4 C:2 C7:2 F:4' },
      // A'：楽器を かえて 主題を もう一度
      { mel: [{ s: 'C5:.5 F5:.5 A5:.5 C6:.5 A5:1 F5:1 | G5:.5 A5:.5 Bb5:.5 G5:.5 A5:2 | Bb5:.5 A5:.5 G5:.5 F5:.5 E5:1 C5:1 | F5:3 R:1 | A5:1 C6:.5 D6:.5 C6:1 A5:1 | Bb5:.5 C6:.5 Bb5:.5 A5:.5 G5:2 | A5:.5 G5:.5 F5:.5 E5:.5 D5:1 E5:1 | F5:3 R:1', parts: [['violin', 0, .55], ['harp', -12, .45], ['glock', 12, .18]] }], ch: 'F:4 C:4 Bb:2 C:2 F:4 F:4 Gm:4 Bb:2 C:2 F:4' }] },
    seaboss: { bpm: 138, bpb: 4, style: 'boss', loop: true, secs: [
      { mel: [{ s: 'D5:.5 D5:.5 F5:.5 A5:.5 D6:1 C6:1 | Bb5:.5 A5:.5 G5:.5 F5:.5 E5:2 | F5:.5 G5:.5 A5:.5 Bb5:.5 C6:1 A5:1 | D6:3 R:1 | D6:.5 C6:.5 Bb5:.5 A5:.5 G5:1 Bb5:1 | A5:.5 G5:.5 F5:.5 E5:.5 D5:2 | Bb5:1 A5:1 G5:1 E5:1 | D5:4', parts: [['brass', -12, .85], ['violin', 0, .55], ['trumpet', 0, .2]] }], ch: 'Dm:4 Gm:2 A:2 Dm:2 F:2 Bb:2 A:2 Gm:2 C:2 Dm:2 Bb:2 Gm:2 A:2 Dm:4' },
      // B：変ロ長調へ 深みの 渦（トランペット）
      { mel: [{ s: 'F5:.5 Bb5:.5 D6:.5 F6:.5 D6:1 Bb5:1 | C6:.5 E6:.5 G6:.5 E6:.5 C6:2 | C#6:.5 A5:.5 E5:.5 A5:.5 C#6:1 E6:1 | D6:3 R:1 | G5:.5 Bb5:.5 D6:.5 G6:.5 F6:1 D6:1 | E6:.5 C#6:.5 A5:.5 C#6:.5 E6:2 | F6:1 E6:.5 D6:.5 C6:1 Bb5:1 | A5:2 C#6:2 | D6:.5 D6:.5 F6:.5 D6:.5 A5:1 F5:1 | G5:.5 G5:.5 C6:.5 G5:.5 E5:1 C5:1 | D5:.5 F5:.5 Bb5:.5 D6:.5 F6:1 D6:1 | C#6:3 R:1 | Bb5:1 A5:.5 G5:.5 D6:1 G5:1 | A5:1 F5:.5 D5:.5 A5:1 D6:1 | E6:.5 D6:.5 C#6:.5 A5:.5 G5:1 E5:1 | D5:.5 E5:.5 F5:.5 G5:.5 A5:.5 C6:.5 C#6:.5 E6:.5', parts: [['trumpet', -12, .8], ['violin', 0, .45]] }], ch: 'Bb:4 C:4 A:4 Dm:4 Gm:4 A:4 Bb:4 A7:4 Dm:4 C:4 Bb:4 A:4 Gm:4 Dm:4 A7:4 Dm:4' },
      { mel: [{ s: 'D5:.5 D5:.5 F5:.5 A5:.5 D6:1 C6:1 | Bb5:.5 A5:.5 G5:.5 F5:.5 E5:2 | F5:.5 G5:.5 A5:.5 Bb5:.5 C6:1 A5:1 | D6:3 R:1 | D6:.5 C6:.5 Bb5:.5 A5:.5 G5:1 Bb5:1 | A5:.5 G5:.5 F5:.5 E5:.5 D5:2 | Bb5:1 A5:1 G5:1 E5:1 | D5:4', parts: [['violin', 0, .7], ['brass', -12, .6], ['glock', 12, .1]] }], ch: 'Dm:4 Gm:2 A:2 Dm:2 F:2 Bb:2 A:2 Gm:2 C:2 Dm:2 Bb:2 Gm:2 A:2 Dm:4' },
      // B'：弦と 金管で B を くりかえす
      { mel: [{ s: 'F5:.5 Bb5:.5 D6:.5 F6:.5 D6:1 Bb5:1 | C6:.5 E6:.5 G6:.5 E6:.5 C6:2 | C#6:.5 A5:.5 E5:.5 A5:.5 C#6:1 E6:1 | D6:3 R:1 | G5:.5 Bb5:.5 D6:.5 G6:.5 F6:1 D6:1 | E6:.5 C#6:.5 A5:.5 C#6:.5 E6:2 | F6:1 E6:.5 D6:.5 C6:1 Bb5:1 | A5:2 C#6:2 | D6:.5 D6:.5 F6:.5 D6:.5 A5:1 F5:1 | G5:.5 G5:.5 C6:.5 G5:.5 E5:1 C5:1 | D5:.5 F5:.5 Bb5:.5 D6:.5 F6:1 D6:1 | C#6:3 R:1 | Bb5:1 A5:.5 G5:.5 D6:1 G5:1 | A5:1 F5:.5 D5:.5 A5:1 D6:1 | E6:.5 D6:.5 C#6:.5 A5:.5 G5:1 E5:1 | D5:.5 E5:.5 F5:.5 G5:.5 A5:.5 C6:.5 C#6:.5 E6:.5', parts: [['violin', 0, .7], ['brass', -12, .55]] }], ch: 'Bb:4 C:4 A:4 Dm:4 Gm:4 A:4 Bb:4 A7:4 Dm:4 C:4 Bb:4 A:4 Gm:4 Dm:4 A7:4 Dm:4' }] },
    // jingles
    victory: { bpm: 120, bpb: 4, style: 'fanfare', loop: false,
      mel: [{ s: 'G4:.5 C5:.5 E5:.5 G5:1.5 E5:.5 G5:1 C6:3 R:.5', parts: [['trumpet', 0, 1], ['violin', 12, .4]] }], ch: 'C:4 G:2 C:2' },
    levelup: { bpm: 132, bpb: 4, style: 'fanfare', loop: false,
      mel: [{ s: 'C5:.25 E5:.25 G5:.25 C6:.25 E6:1.5 R:.5', parts: [['trumpet', 0, .9], ['glock', 12, .6]] }], ch: 'C:3' },
    light: { bpm: 96, bpb: 4, style: 'fanfare', loop: false,
      mel: [{ s: 'D5:.5 F#5:.5 A5:.5 D6:1.5 C#6:.5 D6:4 R:.5', parts: [['horn', 0, 1], ['violin', 12, .5], ['harp', 12, .6]] }], ch: 'D:4 A:2 D:2' },
    inn: { bpm: 84, bpb: 4, style: 'hymn', loop: false,
      mel: [{ s: 'F5:1 A5:1 C6:1 F6:3', parts: [['flute', 0, .8], ['harp', 0, .6]] }], ch: 'F:3 F:3' },
    chapter: { bpm: 100, bpb: 4, style: 'fanfare', loop: false,
      mel: [{ s: 'F4:.5 C5:.5 F5:.5 A5:1.5 G5:.5 A5:.5 C6:3', parts: [['horn', 0, .9], ['violin', 12, .45], ['harp', 12, .5]] }], ch: 'F:2 C:2 F:3' },
    voyage: { bpm: 110, bpb: 4, style: 'hymn', loop: false,
      mel: [{ s: 'D5:.5 F#5:.5 A5:1 B5:.5 A5:.5 F#5:1 G5:.5 B5:.5 D6:3', parts: [['oboe', 0, .85], ['flute', 12, .3]] }], ch: 'D:2 G:2 D:4' },
    skyflight: { bpm: 104, bpb: 4, style: 'fanfare', loop: false,
      mel: [{ s: 'Bb4:.5 Eb5:.5 G5:.5 Bb5:.5 Eb6:2 D6:1 Bb5:1 Eb6:2', parts: [['flute', 0, .8], ['violin', 0, .45], ['glock', 12, .2]] }], ch: 'Eb:2 Ab:2 Bb:2 Eb:2' },
    dive: { bpm: 96, bpb: 4, style: 'nocturne', loop: false,
      mel: [{ s: 'A5:1 F5:1 D5:1 A4:1 Bb4:1 D5:1 F5:2', parts: [['flute', 0, .8], ['glock', 12, .15]] }], ch: 'Dm:4 Bb:2 F:2' },
    gameover: { bpm: 60, bpb: 4, style: 'hymn', loop: false,
      mel: [{ s: 'A4:1 G#4:1 A4:1 E4:3', parts: [['oboe', 0, .8]] }], ch: 'Am:3 E:1 Am:2' },
  };

  // def.secs があれば A→B→A' の ように 区間を つなげる（各区間で 伴奏スタイルを かえられる）
  function compile(def) {
    const E = []; let off = 0;
    for (const sec of def.secs || [def]) {
      const chs = parseChords(sec.ch); let len = chs.len;
      for (const e of accomp(chs.ch, sec.style || def.style, def.bpb)) { e.t += off; E.push(e); }
      for (const m of sec.mel) { const p = parseMel(m.s); len = Math.max(len, p.len);
        for (const e of p.ev) for (const [inst, sh, v] of m.parts) E.push({ t: e.t + off, inst, n: e.n.map(x => x + sh), d: e.d * .95, v }); }
      off += len; }
    E.sort((a, b) => a.t - b.t); return { E, len: off, bpm: def.bpm, loop: def.loop };
  }
  const compiled = {};

  function init() {
    if (C) { if (C.state !== 'running') C.resume(); return; }
    try {
      C = new (window.AudioContext || window.webkitAudioContext)();
      master = C.createGain(); master.gain.value = .8; master.connect(C.destination);
      const comp = C.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.connect(master);
      musicBus = C.createGain(); musicBus.gain.value = volM; sfxBus = C.createGain(); sfxBus.gain.value = volS;
      rev = C.createConvolver(); const L = C.sampleRate * 3.2, ib = C.createBuffer(2, L, C.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ib.getChannelData(ch); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 2.8); }
      rev.buffer = ib; const rg = C.createGain(); rg.gain.value = .5; rev.connect(rg); rg.connect(comp);
      musicBus.connect(comp); musicBus.connect(rev); sfxBus.connect(comp); sfxBus.connect(rev);
      noiseBuf = C.createBuffer(1, C.sampleRate * 2, C.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    } catch (e) { C = null; }
  }

  function play(name, opts = {}) {
    if (!C) return;
    if (cur && cur.name === name && !opts.restart) return;
    const def = SONGS[name]; if (!def) return;
    compiled[name] = compiled[name] || compile(def);
    const now = C.currentTime;
    if (cur) { const old = cur.bus; old.gain.cancelScheduledValues(now); old.gain.setValueAtTime(old.gain.value, now); old.gain.linearRampToValueAtTime(0, now + (opts.cut ? .08 : .7)); setTimeout(() => old.disconnect(), 1500); }
    const bus = C.createGain(); bus.gain.value = 1; bus.connect(musicBus);
    cur = { name, song: compiled[name], bus, start: now + .12, idx: 0, loopN: 0, then: opts.then || null, done: false };
    startClock(); pump();
  }
  function jingle(name, then) { play(name, { restart: true, cut: true, then }); }
  // ---------- scheduler：rAF から 切りはなした タイマー（Worker 優先 → setInterval）で 1秒先まで 予約 ----------
  // 描画が カクついても 音は 落ちない。 Music.tick() は 互換のため 残す（時計が 止まっている ときだけ 補助）
  let clock = null, lastPump = 0; const HORIZON = 1.0, PERIOD = 90;
  function startClock() {
    if (clock) return; const cb = () => { try { pump(); } catch (e) { console.error(e); } };
    const fallback = () => { if (clock && clock.w) try { clock.w.terminate(); } catch (_) {} clock = { id: setInterval(cb, PERIOD) }; };
    try { const src = 'let i=0;onmessage=e=>{clearInterval(i);i=setInterval(()=>postMessage(0),e.data)}';
      const w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))); w.onmessage = cb; w.onerror = e => { if (e && e.preventDefault) e.preventDefault(); fallback(); }; w.postMessage(PERIOD); clock = { w };
    } catch (e) { fallback(); }
  }
  function tick() { if (C && cur && !cur.done && performance.now() - lastPump > 300) { try { pump(); } catch (e) { console.error(e); } } }
  function pump() {
    lastPump = performance.now();
    if (!C || !cur || cur.done) return;
    const s = cur.song, spb = 60 / s.bpm, horizon = C.currentTime + HORIZON;
    while (true) {
      if (cur.idx >= s.E.length) {
        if (!s.loop) { cur.done = true; const endAt = cur.start + s.len * spb; const then = cur.then;
          if (then) setTimeout(() => play(then), Math.max(0, (endAt - C.currentTime) * 1000)); return; }
        cur.idx = 0; cur.loopN++;
      }
      const e = s.E[cur.idx]; const at = cur.start + (cur.loopN * s.len + e.t) * spb;
      if (at > horizon) break;
      if (at > C.currentTime - .05) for (const n of e.n) voice(e.inst, n, at, e.d * spb, e.v, cur.bus);
      cur.idx++;
    }
  }
  // ---------- sfx ----------
  function sfx(kind) {
    if (!C) return; const t = C.currentTime + .01, d = sfxBus;
    const bl = (f, dt, len, type = 'square', v = .035) => { const g = C.createGain(); g.connect(d); g.gain.setValueAtTime(v, t + dt); g.gain.exponentialRampToValueAtTime(.0001, t + dt + len); osc(type, f, t + dt, t + dt + len, g); };
    if (bsfx(kind, t, d, bl)) return;
    switch (kind) {
      case 'blip': bl(1250, 0, .035, 'square', .018); break;
      case 'cursor': bl(1800, 0, .04, 'square', .03); break;
      case 'ok': bl(1320, 0, .06); bl(1760, .06, .08); break;
      case 'cancel': bl(660, 0, .08); break;
      case 'hit': noise(t, .12, 'lowpass', 1400, .5, d); bl(140, 0, .12, 'triangle', .25); break;
      case 'crit': noise(t, .2, 'bandpass', 2500, .5, d, 2); bl(200, 0, .2, 'sawtooth', .15); break;
      case 'hurt': noise(t, .18, 'lowpass', 700, .6, d); bl(90, 0, .2, 'square', .12); break;
      case 'magic': [74, 79, 83, 86, 91].forEach((m, i) => bl(mtof(m), i * .04, .3, 'sine', .08)); break;
      case 'heal': [72, 76, 79, 84].forEach((m, i) => bl(mtof(m), i * .07, .5, 'sine', .08)); break;
      case 'miss': bl(300, 0, .12, 'sine', .08); break;
      case 'chop': noise(t, .1, 'bandpass', 900, .5, d, 1.5); bl(180, 0, .1, 'triangle', .2); break;
      case 'mine': noise(t, .12, 'highpass', 2200, .3, d); bl(110, 0, .1, 'square', .1); break;
      case 'pick': bl(880, 0, .12, 'sine', .1); bl(1320, .06, .15, 'sine', .08); break;
      case 'friend': [74, 78, 81, 86].forEach((m, i) => bl(mtof(m), i * .09, .35, 'triangle', .09)); break;
      case 'place': bl(220, 0, .1, 'triangle', .2); noise(t, .06, 'lowpass', 900, .3, d); break;
      case 'encounter': [0, 1, 2, 3, 4, 5].forEach(i => bl(mtof(84 - i * 3), i * .035, .06, 'square', .05)); noise(t, .5, 'bandpass', 1200, .3, d, 3); break;
      case 'run': [0, 1, 2].forEach(i => bl(mtof(72 - i * 5), i * .06, .08, 'square', .04)); break;
      case 'step': noise(t, .14, 'lowpass', 500, .35, d); bl(70, 0, .12, 'sine', .18); break;
      case 'wind': noise(t, .6, 'bandpass', 700, .18, d, .8); break;
      case 'swoosh': noise(t, .35, 'bandpass', 1800, .35, d, 1.2); [0, 1, 2, 3].forEach(i => bl(mtof(60 + i * 7), i * .05, .08, 'triangle', .05)); break;
      case 'drop': bl(220, 0, .1, 'triangle', .18); noise(t, .08, 'lowpass', 600, .25, d); break;
      case 'stamp': noise(t, .25, 'lowpass', 900, .55, d); bl(110, 0, .22, 'triangle', .3); [84, 88, 91, 96].forEach((m, i) => bl(mtof(m), .08 + i * .045, .25, 'sine', .07)); break;
      case 'tally': bl(2100, 0, .025, 'square', .014); break;
      case 'sparkle': [91, 95, 98, 103].forEach((m, i) => bl(mtof(m), i * .05, .22, 'sine', .06)); break;
      case 'heart': [76, 81, 85, 88].forEach((m, i) => bl(mtof(m), i * .07, .3, 'sine', .08)); bl(mtof(64), 0, .4, 'triangle', .07); break;
      case 'lose': [67, 63, 60, 55].forEach((m, i) => bl(mtof(m), i * .22, .45, 'triangle', .07)); noise(t, 1.2, 'lowpass', 400, .15, d); break;
      case 'buy': [79, 84, 88].forEach((m, i) => bl(mtof(m), i * .05, .18, 'triangle', .08)); noise(t + .1, .08, 'highpass', 5000, .15, d); break;
    }
  }
  // ---------- battle sfx：武器ごとの ふりかぶり（w_）・軌跡（v_）・着弾（i_）／ いきもの（m_）／ 属性の 詠唱（e_）／ 状態（ail_） ----------
  let bsLast = {};
  function bsfx(kind, t, d, bl) {
    if (!/^(w_|v_|i_|m_|e_|ail_)|^(buff|mp|guard|item|charge)$/.test(kind)) return false;
    const now = C.currentTime; if (bsLast[kind] && now - bsLast[kind] < .045) return true; bsLast[kind] = now;
    // 周波数スイープ音
    const sw = (f0, f1, dt, len, type = 'sine', v = .1, at = .005) => { const g = C.createGain(); g.connect(d); g.gain.setValueAtTime(.0001, t + dt); g.gain.linearRampToValueAtTime(v, t + dt + at); g.gain.exponentialRampToValueAtTime(.0001, t + dt + len);
      const o = C.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t + dt); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dt + len); o.connect(g); o.start(t + dt); o.stop(t + dt + len + .05); };
    // フィルタが 動く ノイズ（かぜ・スイング）
    const nz = (dt, len, type, f0, f1, v, q = 1, at = .02) => { const s = C.createBufferSource(); s.buffer = noiseBuf; const f = C.createBiquadFilter(); f.type = type; f.Q.value = q;
      f.frequency.setValueAtTime(f0, t + dt); f.frequency.exponentialRampToValueAtTime(f1, t + dt + len); const g = C.createGain(); g.gain.setValueAtTime(.0001, t + dt); g.gain.linearRampToValueAtTime(v, t + dt + at); g.gain.exponentialRampToValueAtTime(.0001, t + dt + len);
      s.connect(f); f.connect(g); g.connect(d); s.start(t + dt, Math.random()); s.stop(t + dt + len + .05); };
    const clk = (dt, f = 5000, v = .25, len = .025) => noise(t + dt, len, 'highpass', f, v, d, 1.5);
    const bell = (f, dt, len, v = .07) => { bl(f, dt, len, 'sine', v); bl(f * 2.76, dt, len * .5, 'sine', v * .35); bl(f * 5.4, dt, len * .25, 'sine', v * .15); };
    const metal = (dt, v = .06) => { [1480, 2210, 3130, 4270].forEach((f, i) => bl(f, dt, .28 - i * .04, i % 2 ? 'square' : 'triangle', v * (1 - i * .18))); clk(dt, 4500, .3, .05); };
    const gl = (ms, dt, step, len, type = 'triangle', v = .06) => ms.forEach((m, i) => bl(mtof(m), dt + i * step, len, type, v));
    switch (kind) {
      // ---- 武器 ----
      case 'w_sword': nz(0, .2, 'bandpass', 700, 4200, .38, 1.4, .07); break;
      case 'i_sword': metal(0, .07); sw(160, 70, 0, .14, 'triangle', .28); noise(t, .1, 'lowpass', 1800, .35, d); break;
      case 'w_spear': nz(0, .16, 'bandpass', 400, 1400, .3, 2, .1); break;
      case 'v_spear': nz(0, .12, 'bandpass', 1800, 3800, .3, 3, .02); break;
      case 'i_spear': sw(2600, 600, 0, .09, 'sawtooth', .07); clk(0, 3000, .45, .05); sw(200, 90, .02, .12, 'triangle', .3); break;
      case 'w_harp': gl([60, 64, 67, 71, 72, 76, 79, 83, 84], 0, .028, .55, 'triangle', .055); gl([72, 76, 79, 83, 84, 88, 91, 95, 96], .01, .028, .4, 'sine', .03); break;
      case 'v_harp': gl([84, 88], 0, .09, .3, 'sine', .04); break;
      case 'i_harp': gl([72, 76, 79, 84], 0, 0, .7, 'triangle', .06); gl([96, 100], .04, .05, .5, 'sine', .035); nz(0, .3, 'bandpass', 900, 2600, .16, 3, .01); break;
      case 'w_staff': bell(mtof(88), 0, .8, .07); bell(mtof(95), .08, .7, .05); break;
      case 'v_staff': gl([96, 100, 103], 0, .04, .2, 'sine', .035); break;
      case 'i_staff': gl([91, 95, 98, 103, 107], 0, .035, .35, 'sine', .055); noise(t, .35, 'highpass', 6500, .12, d); sw(300, 120, 0, .15, 'sine', .2); break;
      case 'w_fan': nz(0, .38, 'bandpass', 900, 2600, .26, .7, .14); nz(.05, .3, 'highpass', 3000, 6000, .08, .7, .1); break;
      case 'v_fan': nz(0, .28, 'bandpass', 1600, 700, .2, 1.2, .05); break;
      case 'i_fan': nz(0, .34, 'lowpass', 3200, 500, .38, .8, .01); for (let i = 0; i < 5; i++) clk(.03 + i * .045, 5500, .08, .03); break;
      case 'w_anchor': for (let i = 0; i < 6; i++) { clk(i * .038, 4200 + (i % 3) * 700, .22, .03); bl(2600 + (i % 2) * 500, i * .038, .04, 'square', .012); } nz(.1, .25, 'bandpass', 250, 700, .35, 1.2, .1); break;
      case 'v_anchor': for (let i = 0; i < 5; i++) clk(i * .045, 5000, .18, .025); break;
      case 'i_anchor': sw(130, 38, 0, .45, 'sine', .6); noise(t, .45, 'lowpass', 320, .8, d); metal(.01, .035); for (let i = 0; i < 6; i++) clk(.12 + i * .04, 4800, .16, .025); break;
      case 'w_bow': sw(160, 190, 0, .12, 'sawtooth', .025, .08); break;
      case 'v_bow': sw(330, 150, 0, .22, 'triangle', .22); bl(660, 0, .12, 'sawtooth', .03); sw(2600, 1500, .03, .2, 'sine', .035, .02); break;
      case 'i_bow': sw(240, 90, 0, .1, 'triangle', .35); noise(t, .06, 'lowpass', 1400, .4, d); clk(0, 3500, .2, .03); break;
      case 'w_dagger': nz(0, .09, 'bandpass', 2400, 5200, .3, 2, .02); break;
      case 'v_dagger': nz(0, .07, 'bandpass', 3000, 6000, .25, 2, .01); break;
      case 'i_dagger': clk(0, 3500, .4, .04); clk(.07, 3800, .35, .04); bl(900, 0, .04, 'square', .03); bl(1100, .07, .04, 'square', .025); break;
      case 'w_axe': nz(0, .28, 'bandpass', 260, 900, .45, 1.3, .12); break;
      case 'i_axe': noise(t, .16, 'bandpass', 900, .7, d, 1.2); sw(170, 55, 0, .3, 'triangle', .45); metal(.005, .03); break;
      case 'w_fist': nz(0, .1, 'bandpass', 600, 1800, .3, 1.5, .03); break;
      case 'i_fist': sw(170, 55, 0, .14, 'sine', .5); noise(t, .08, 'lowpass', 1600, .5, d); break;
      // ---- いきもの ----
      case 'm_bite': noise(t, .05, 'bandpass', 2600, .55, d, 2); noise(t + .08, .05, 'bandpass', 2200, .5, d, 2); bl(320, 0, .04, 'square', .05); bl(260, .08, .05, 'square', .05); break;
      case 'm_bump': sw(190, 80, 0, .2, 'sine', .45); noise(t, .12, 'lowpass', 700, .45, d); break;
      case 'm_peck': for (let i = 0; i < 3; i++) { bl(1900 - i * 150, i * .07, .03, 'square', .045); clk(i * .07, 3200, .22, .025); } break;
      case 'm_splash': nz(0, .4, 'bandpass', 1800, 450, .4, 1, .01); for (let i = 0; i < 4; i++) sw(420 + i * 90, 1300 + i * 200, .05 + i * .06, .06, 'sine', .08); break;
      case 'm_crackle': for (let i = 0; i < 11; i++) clk(Math.random() * .3, 2500 + Math.random() * 5000, .12 + Math.random() * .2, .018); sw(1400, 180, 0, .14, 'sawtooth', .04); break;
      case 'm_slam': sw(95, 32, 0, .6, 'sawtooth', .12); sw(70, 30, 0, .6, 'sine', .5); noise(t, .6, 'lowpass', 220, .8, d); break;
      case 'm_whip': nz(0, .12, 'highpass', 1800, 6500, .35, 1, .09); clk(.11, 3500, .55, .04); break;
      // ---- 属性の 詠唱 ----
      case 'e_fire': nz(0, .55, 'lowpass', 350, 2800, .4, .8, .16); for (let i = 0; i < 8; i++) clk(.1 + Math.random() * .45, 3000 + Math.random() * 3000, .12, .02); break;
      case 'e_water': for (let i = 0; i < 5; i++) sw(380 + i * 70, 1200 + i * 150, i * .07, .07, 'sine', .08); nz(0, .5, 'bandpass', 700, 1600, .18, 1.5, .15); break;
      case 'e_wind': nz(0, .65, 'bandpass', 380, 1900, .32, 1.1, .25); nz(.2, .4, 'bandpass', 1900, 600, .18, 1.1, .05); break;
      case 'e_earth': sw(72, 44, 0, .7, 'sawtooth', .12, .1); noise(t, .7, 'lowpass', 180, .55, d); for (let i = 0; i < 4; i++) clk(.2 + i * .1, 1200, .15, .05); break;
      case 'e_light': gl([84, 88, 91, 96, 100, 103], 0, .05, .7, 'sine', .05); noise(t, .6, 'highpass', 7000, .08, d); break;
      case 'e_dark': sw(420, 110, 0, .7, 'sawtooth', .05, .1); sw(426, 106, 0, .7, 'sawtooth', .05, .1); noise(t, .7, 'lowpass', 480, .3, d); break;
      case 'e_grass': for (let i = 0; i < 6; i++) clk(i * .05, 4500, .1, .06); gl([76, 79, 83], 0, .07, .4, 'triangle', .05); break;
      case 'e_heal': gl([72, 76, 79, 84, 88], 0, .06, .6, 'sine', .06); noise(t, .5, 'highpass', 6000, .06, d); break;
      case 'e_buff': case 'buff': gl([67, 71, 74, 79, 83], 0, .05, .25, 'square', .025); gl([79, 83, 86, 91], .2, .04, .4, 'sine', .05); break;
      case 'e_debuff': gl([79, 75, 72, 67, 63], 0, .07, .35, 'triangle', .055); sw(300, 150, .1, .5, 'sine', .08); break;
      case 'e_song': gl([72, 76, 79, 83, 84, 88], 0, .05, .6, 'triangle', .05); gl([84, 88, 91], .25, .08, .6, 'sine', .04); break;
      case 'e_normal': gl([74, 79, 83, 86, 91], 0, .04, .3, 'sine', .07); break;
      // ---- 状態 ----
      case 'ail_poison': for (let i = 0; i < 4; i++) sw(260 + i * 40, 560 + i * 60, i * .08, .08, 'sine', .1); sw(220, 140, 0, .4, 'triangle', .06); break;
      case 'ail_burn': nz(0, .35, 'lowpass', 500, 2400, .35, .8, .05); for (let i = 0; i < 6; i++) clk(Math.random() * .3, 4000, .15, .02); break;
      case 'ail_para': for (let i = 0; i < 7; i++) bl(i % 2 ? 900 : 1900, i * .028, .026, 'square', .04); clk(0, 5000, .25, .12); break;
      case 'ail_sleep': sw(620, 300, 0, .55, 'sine', .08, .08); bell(mtof(84), .3, .5, .035); break;
      case 'ail_slow': sw(520, 140, 0, .5, 'triangle', .09, .03); break;
      case 'mp': sw(900, 1700, 0, .16, 'sine', .06); bl(1760, .1, .15, 'sine', .03); break;
      case 'guard': bl(1250, 0, .18, 'triangle', .09); bl(1870, .03, .22, 'sine', .05); clk(0, 3000, .2, .04); break;
      case 'item': sw(600, 1300, 0, .1, 'sine', .1); bl(1500, .08, .12, 'sine', .05); break;
      case 'charge': sw(70, 260, 0, 1.0, 'sawtooth', .07, .4); nz(0, 1.0, 'lowpass', 180, 1400, .3, 1, .6); break;
      default: return false;
    }
    return true;
  }
  // ---------- monster cries（種ごとに決まる 合成の なきごえ） ----------
  let distCurve = null, cryLast = 0;
  function cry(id, opt = {}) {
    if (!C || muted) return 0; const now = C.currentTime; if (now - cryLast < .04) return 0; cryLast = now;
    const DT = window.DATA || {}; let S = DT.species && DT.species[id], boss = !!opt.boss;
    if (!S && DT.enemies && DT.enemies[id]) { const e = DT.enemies[id]; S = (e.spArt && DT.species[e.spArt]) || { no: 0, type: e.type, arch: 'golem', size: 1.6, name: e.name }; boss = true; }
    if (!S) S = { no: 0, type: 'normal', arch: 'quad', name: String(id) };
    let seed = 0; const key = (S.no || 0) + ':' + (S.name || id); for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const arch = S.arch || 'quad', type = S.type || 'normal', size = S.size || 1;
    const shadow = !!opt.shadow || boss; const P0 = { fluff: 950, sprite: 1150, bird: 1250, blob: 520, plant: 760, quad: 640, fish: 600, golem: 150 }[arch] || 640;
    let f0 = P0 / Math.pow(size, 1.3) * (.82 + rnd() * .4) * (shadow ? .78 : 1) * (boss ? .55 : 1);
    let dur = ({ fluff: .16, sprite: .14, bird: .2, blob: .18, plant: .2, quad: .22, fish: .2, golem: .34 }[arch] || .2) * (.8 + rnd() * .5) * Math.min(1.5, size) * (boss ? 1.5 : 1);
    dur = Math.min(.4, Math.max(.08, dur)); const syl = arch === 'golem' || boss ? 1 : 1 + Math.floor(rnd() * (arch === 'fluff' || arch === 'sprite' || arch === 'bird' ? 3 : 2));
    const contour = Math.floor(rnd() * 4); // 0 rise 1 fall 2 rise-fall 3 trill
    const VOW = [[800, 1200], [300, 2300], [350, 900], [500, 1900], [450, 800]]; const vw = VOW[Math.floor(rnd() * VOW.length)];
    const out = C.createGain(); out.gain.value = (opt.vol || 1) * (boss ? .5 : .38); let tail = out;
    if (shadow) { if (!distCurve) { distCurve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; distCurve[i] = Math.tanh(x * 3.2); } }
      const ws = C.createWaveShaper(); ws.curve = distCurve; const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = boss ? 1800 : 3200; ws.connect(lp); lp.connect(out); tail = ws; }
    out.connect(sfxBus);
    const t0 = now + .02, sd = dur / syl, gap = sd * .18;
    const wave = arch === 'golem' || type === 'earth' ? 'sawtooth' : type === 'wind' || arch === 'bird' ? 'sine' : type === 'grass' || arch === 'plant' ? 'triangle' : arch === 'fish' || type === 'water' ? 'triangle' : 'square';
    const formant = arch !== 'bird' && type !== 'wind';
    for (let k = 0; k < syl; k++) {
      const t = t0 + k * sd, e = t + sd - gap, fk = f0 * (1 + (syl > 1 ? (k === syl - 1 ? -.08 : .06 * k) : 0));
      const o = C.createOscillator(); o.type = wave; const fr = o.frequency;
      if (contour === 0) { fr.setValueAtTime(fk * .8, t); fr.exponentialRampToValueAtTime(fk * 1.25, e); }
      else if (contour === 1) { fr.setValueAtTime(fk * 1.3, t); fr.exponentialRampToValueAtTime(fk * .75, e); }
      else if (contour === 2) { fr.setValueAtTime(fk * .85, t); fr.exponentialRampToValueAtTime(fk * 1.3, t + (e - t) * .4); fr.exponentialRampToValueAtTime(fk * .8, e); }
      else { fr.setValueAtTime(fk, t); const n = 4; for (let j = 1; j <= n; j++) fr.setValueAtTime(fk * (j % 2 ? 1.18 : 1), t + (e - t) * j / (n + 1)); }
      if (type === 'water' || arch === 'fish') { const l = C.createOscillator(); l.type = 'sine'; l.frequency.value = 22 + rnd() * 14; const lg = C.createGain(); lg.gain.value = fk * .22; l.connect(lg); lg.connect(fr); l.start(t); l.stop(e + .02); }
      if (type === 'wind' || arch === 'bird' || type === 'light') { const l = C.createOscillator(); l.frequency.value = 9 + rnd() * 6; const lg = C.createGain(); lg.gain.value = fk * .04; l.connect(lg); lg.connect(fr); l.start(t); l.stop(e + .02); }
      const g = C.createGain(); const pk = wave === 'square' || wave === 'sawtooth' ? .22 : .5;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + Math.min(.025, sd * .2)); g.gain.setValueAtTime(pk * .8, e - sd * .3); g.gain.exponentialRampToValueAtTime(.0005, e);
      if (arch === 'golem' || boss) { const am = C.createOscillator(); am.frequency.value = 26 + rnd() * 12; const ag = C.createGain(); ag.gain.value = pk * .5; am.connect(ag); ag.connect(g.gain); am.start(t); am.stop(e + .02); }
      o.connect(g);
      if (formant) { const f1 = C.createBiquadFilter(), f2 = C.createBiquadFilter(); f1.type = f2.type = 'bandpass'; f1.frequency.value = Math.max(fk * 1.1, vw[0] * (arch === 'golem' ? .6 : 1)); f2.frequency.value = vw[1] * (arch === 'golem' ? .6 : 1); f1.Q.value = 4; f2.Q.value = 6;
        const mix = C.createGain(); mix.gain.value = 2.4; g.connect(f1); g.connect(f2); f1.connect(mix); f2.connect(mix); const dry = C.createGain(); dry.gain.value = .35; g.connect(dry); dry.connect(tail); mix.connect(tail); }
      else g.connect(tail);
      o.start(t); o.stop(e + .03);
      if (shadow) { const sub = C.createOscillator(); sub.type = 'sine'; sub.frequency.setValueAtTime(fk * .5, t); sub.frequency.exponentialRampToValueAtTime(fk * .42, e); const sg = C.createGain(); sg.gain.setValueAtTime(0, t); sg.gain.linearRampToValueAtTime(boss ? .35 : .2, t + .03); sg.gain.exponentialRampToValueAtTime(.0005, e); sub.connect(sg); sg.connect(tail); sub.start(t); sub.stop(e + .03); }
    }
    if (type === 'fire') for (let i = 0; i < 5; i++) noise(t0 + rnd() * dur, .03, 'highpass', 3000 + rnd() * 3000, .22, out);
    if (arch === 'golem' || boss || type === 'earth') noise(t0, dur, 'lowpass', 260, boss ? .5 : .3, out);
    if (type === 'water') for (let i = 0; i < 3; i++) { const b = C.createOscillator(), bg = C.createGain(), tb = t0 + dur * (.2 + i * .28); b.type = 'sine'; b.frequency.setValueAtTime(500 + rnd() * 400, tb); b.frequency.exponentialRampToValueAtTime(1400 + rnd() * 600, tb + .05); bg.gain.setValueAtTime(.12, tb); bg.gain.exponentialRampToValueAtTime(.0005, tb + .06); b.connect(bg); bg.connect(out); b.start(tb); b.stop(tb + .08); }
    setTimeout(() => { try { out.disconnect(); } catch (_) {} }, (dur + .6) * 1000);
    return dur;
  }
  function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : .8; return muted; }
  function setVol(m, s) { volM = m; volS = s; if (musicBus) musicBus.gain.value = m; if (sfxBus) sfxBus.gain.value = s; }
  return { init, play, jingle, tick, sfx, cry, toggleMute, setVol, get current() { return cur && cur.name; }, get ready() { return !!C; }, get busy() { return !!(cur && !cur.song.loop && !cur.done); } };
})();
