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
    village: { bpm: 126, bpb: 3, style: 'waltz', loop: true,
      mel: [{ s: 'C5:1 F5:1 A5:1 | G5:2 F5:1 | E5:1 G5:1 C6:1 | A5:3 | Bb5:1 A5:1 G5:1 | A5:1 F5:1 D5:1 | E5:1 F5:1 G5:1 | C5:3 | C5:1 F5:1 A5:1 | C6:2 A5:1 | Bb5:1 D6:1 Bb5:1 | A5:3 | G5:1 Bb5:1 A5:1 | G5:1 E5:1 C5:1 | D5:1 E5:1 G5:1 | F5:3',
        parts: [['oboe', 0, .9], ['flute', 12, .35]] }],
      ch: 'F:3 C:3 C:3 F:3 Bb:3 Dm:3 C:3 C7:3 F:3 F:3 Bb:3 F:3 Gm:3 C:3 C7:3 F:3' },
    field: { bpm: 104, bpb: 4, style: 'march', loop: true,
      mel: [{ s: 'D5:1.5 E5:.5 F#5:1 A5:1 | B5:1.5 A5:.5 F#5:1 D5:1 | E5:1.5 F#5:.5 G5:1 B5:1 | A5:3 R:1 | B5:1.5 A5:.5 G5:1 E5:1 | F#5:1.5 E5:.5 D5:1 B4:1 | G5:1 F#5:1 E5:1 D5:1 | E5:3 R:1 | F#5:1.5 G5:.5 A5:1 D6:1 | C#6:1.5 B5:.5 A5:2 | B5:1 G5:1 E5:1 G5:1 | A5:1.5 F#5:.5 D5:2 | G5:1.5 F#5:.5 E5:1 B5:1 | A5:1.5 G5:.5 F#5:1 D5:1 | E5:1 F#5:.5 G5:.5 A5:1 C#5:1 | D5:4',
        parts: [['violin', 0, 1], ['horn', -12, .45]] }],
      ch: 'D:4 Bm:4 G:2 Em:2 D:4 G:4 D:2 Bm:2 Em:2 A:2 A:4 D:4 A:4 Em:4 D:4 G:4 D:4 A7:4 D:4' },
    night: { bpm: 76, bpb: 4, style: 'nocturne', loop: true,
      mel: [{ s: 'D5:1.5 E5:.5 F#5:1 A5:1 | B5:1.5 A5:.5 F#5:1 D5:1 | E5:1.5 F#5:.5 G5:1 B5:1 | A5:3 R:1 | B5:1.5 A5:.5 G5:1 E5:1 | F#5:1.5 E5:.5 D5:1 B4:1 | G5:1 F#5:1 E5:1 D5:1 | E5:3 R:1 | F#5:1.5 G5:.5 A5:1 D6:1 | C#6:1.5 B5:.5 A5:2 | B5:1 G5:1 E5:1 G5:1 | A5:1.5 F#5:.5 D5:2 | G5:1.5 F#5:.5 E5:1 B5:1 | A5:1.5 G5:.5 F#5:1 D5:1 | E5:1 F#5:.5 G5:.5 A5:1 C#5:1 | D5:4',
        parts: [['flute', 0, .85]] }],
      ch: 'D:4 Bm:4 G:2 Em:2 D:4 G:4 D:2 Bm:2 Em:2 A:2 A:4 D:4 A:4 Em:4 D:4 G:4 D:4 A7:4 D:4' },
    battle: { bpm: 152, bpb: 4, style: 'battle', loop: true,
      mel: [{ s: 'A5:.5 E5:.5 A5:.5 C6:.5 B5:1 A5:1 | G#5:.5 E5:.5 G#5:.5 B5:.5 A5:2 | F5:.5 A5:.5 D6:.5 C6:.5 B5:.5 A5:.5 G#5:.5 A5:.5 | B5:3 R:1 | C6:.5 B5:.5 A5:.5 G5:.5 F5:1 A5:1 | B5:.5 A5:.5 G5:.5 F5:.5 E5:2 | D5:.5 E5:.5 F5:.5 G5:.5 A5:.5 B5:.5 C6:.5 D6:.5 | E6:3 R:1 | E6:1 D6:.5 C6:.5 B5:1 A5:1 | D6:1 C6:.5 B5:.5 A5:1 G#5:1 | C6:1 B5:.5 A5:.5 G5:1 F5:1 | E5:2 G#5:2 | A5:.5 B5:.5 C6:.5 D6:.5 E6:1 C6:1 | F6:1 E6:.5 D6:.5 C6:1 B5:1 | A5:.5 G#5:.5 A5:.5 B5:.5 C6:.5 B5:.5 A5:.5 G#5:.5 | A5:3 R:1',
        parts: [['violin', -12, 1], ['trumpet', -12, .5]] }],
      ch: 'Am:4 E:4 Dm:2 E:2 E:4 F:4 G:2 C:2 Dm:2 G:2 C:2 E:2 Am:4 Dm:2 E:2 F:2 Dm:2 E:4 Am:4 Dm:2 G:2 E7:4 Am:4' },
    boss: { bpm: 132, bpb: 4, style: 'boss', loop: true,
      mel: [{ s: 'D5:1 D5:.5 E5:.5 F5:1 A5:1 | G#5:2 A5:2 | Bb5:1 A5:.5 G5:.5 F5:1 E5:1 | D5:1 C#5:1 D5:2 | F5:1 F5:.5 G5:.5 A5:1 D6:1 | C#6:2 A5:2 | Bb5:.5 C6:.5 Bb5:.5 A5:.5 G5:.5 F5:.5 E5:.5 G5:.5 | A5:4 | D6:1.5 C6:.5 Bb5:1 A5:1 | G5:1.5 F5:.5 E5:1 C#5:1 | D5:1 F5:1 A5:1 D6:1 | E6:2 C#6:2 | F6:1.5 E6:.5 D6:1 A5:1 | Bb5:1.5 A5:.5 G5:1 E5:1 | F5:1 E5:1 D5:1 C#5:1 | D5:4',
        parts: [['brass', -12, .9], ['violin', 0, .55]] }],
      ch: 'Dm:4 E:2 A:2 Gm:4 A:2 Dm:2 Dm:4 A:4 Gm:2 C:2 F:2 A:2 Bb:4 Gm:2 A:2 Dm:4 A:4 Dm:4 Gm:2 A:2 Bb:2 A:2 Dm:4' },
    ending: { bpm: 72, bpb: 4, style: 'hymn', loop: true,
      mel: [{ s: 'G4:.5 C5:.5 E5:.5 G5:.5 C6:2 | B5:.75 A5:.25 G5:1 E5:1 C5:1 | D5:1.5 E5:.5 F5:1 A5:1 | G5:4 | A5:1.5 G5:.5 F5:1 D5:1 | E5:1.5 D5:.5 C5:1 A4:1 | B4:1 C5:1 D5:1 G5:1 | C6:3 R:1',
        parts: [['violin', 0, .8], ['flute', 12, .3]] }],
      ch: 'C:4 C:2 G/B:2 Dm:2 F:2 G:4 F:2 Dm:2 C:2 Am:2 G:2 G7:2 C:4' },
    dungeon: { bpm: 84, bpb: 4, style: 'nocturne', loop: true,
      mel: [{ s: 'E5:1 G5:1 B5:2 | A5:1 G5:1 F#5:2 | G5:1 E5:1 C5:2 | D#5:4 | E5:1 G5:1 B5:2 | C6:1 B5:1 A5:2 | G5:1 F#5:1 D#5:1 F#5:1 | E5:4',
        parts: [['oboe', 0, .8], ['strings', -12, .35]] }],
      ch: 'Em:4 D:4 C:4 B:4 Em:4 Am:4 B:4 Em:4' },
    town: { bpm: 112, bpb: 4, style: 'march', loop: true,
      mel: [{ s: 'G5:1 E5:.5 G5:.5 C6:1 G5:1 | A5:1 F5:.5 A5:.5 C6:2 | B5:1 G5:.5 B5:.5 D6:1 B5:1 | C6:3 R:1 | E6:1 D6:.5 C6:.5 A5:1 C6:1 | B5:1 A5:.5 G5:.5 E5:2 | F5:1 A5:1 G5:1 B4:1 | C5:3 R:1',
        parts: [['flute', 0, .8], ['pizz', -12, .5]] }],
      ch: 'C:4 F:4 G:4 C:4 Am:4 Em:4 F:2 G:2 C:4' },
    sky: { bpm: 100, bpb: 3, style: 'waltz', loop: true,
      mel: [{ s: 'Bb4:1 Eb5:1 G5:1 | Bb5:2 G5:1 | Ab5:1 G5:1 F5:1 | G5:3 | Ab5:1 C6:1 Bb5:1 | Ab5:1 G5:1 F5:1 | G5:1 Eb5:1 C5:1 | D5:3 | Bb4:1 Eb5:1 G5:1 | Bb5:2 Eb6:1 | D6:1 C6:1 Bb5:1 | C6:3 | Ab5:1 C6:1 Eb6:1 | D6:1 Bb5:1 G5:1 | Ab5:1 F5:1 D5:1 | Eb5:3',
        parts: [['flute', 0, .8], ['violin', 12, .3], ['horn', -12, .35]] }],
      ch: 'Eb:3 Eb:3 Ab:3 Eb:3 Ab:3 Fm:3 Cm:3 Bb:3 Eb:3 Eb:3 Bb:3 Ab:3 Ab:3 Eb:3 Bb7:3 Eb:3' },
    skytown: { bpm: 100, bpb: 4, style: 'march', loop: true,
      mel: [{ s: 'A5:.5 C6:.5 A5:.5 F5:.5 G5:1 C5:1 | A5:.5 Bb5:.5 C6:.5 D6:.5 C6:2 | Bb5:.5 A5:.5 G5:.5 F5:.5 E5:1 G5:1 | F5:3 R:1 | D6:1 C6:.5 Bb5:.5 A5:1 F5:1 | G5:1 A5:.5 Bb5:.5 C6:2 | Bb5:.5 A5:.5 G5:.5 A5:.5 Bb5:1 E5:1 | F5:3 R:1',
        parts: [['oboe', 0, .8], ['pizz', -12, .5], ['glock', 12, .2]] }],
      ch: 'F:4 F:2 Bb:2 C:2 C7:2 F:4 Bb:4 F:2 C:2 Gm:2 C7:2 F:4' },
    tower: { bpm: 80, bpb: 4, style: 'nocturne', loop: true,
      mel: [{ s: 'D5:1 F5:1 A5:1 D6:1 | C#6:2 A5:2 | Bb5:1 A5:1 G5:1 F5:1 | E5:4 | F5:1 A5:1 C6:1 F6:1 | E6:2 C6:2 | D6:1 C6:1 Bb5:1 A5:1 | A5:4',
        parts: [['strings', 0, .7], ['harp', 12, .35], ['flute', 12, .22]] }],
      ch: 'Dm:4 A:4 Gm:4 A:4 F:4 C:4 Bb:4 A:4' },
    lastboss: { bpm: 144, bpb: 4, style: 'boss', loop: true,
      mel: [{ s: 'E5:.5 E5:.5 G5:.5 B5:.5 E6:1 D6:1 | C6:.5 B5:.5 A5:.5 G5:.5 F#5:2 | G5:.5 A5:.5 B5:.5 C6:.5 D6:1 B5:1 | E6:3 R:1 | E6:.5 D6:.5 C6:.5 B5:.5 A5:1 C6:1 | B5:.5 A5:.5 G5:.5 F#5:.5 E5:2 | C6:1 B5:1 A5:1 F#5:1 | G5:1 A5:1 B5:2 | E6:1.5 D#6:.5 E6:1 B5:1 | C6:1.5 B5:.5 A5:1 E5:1 | F#5:1 G5:1 A5:1 D#5:1 | E5:4',
        parts: [['brass', -12, .85], ['violin', 0, .6], ['trumpet', 0, .22]] }],
      ch: 'Em:4 Am:2 B:2 Em:2 G:2 B:4 C:2 Am:2 Em:2 B:2 Am:2 D:2 G:2 B7:2 Em:4 C:4 Am:2 B:2 Em:4' },
    sea: { bpm: 80, bpb: 3, style: 'waltz', loop: true,
      mel: [{ s: 'D5:1 F5:1 A5:1 | G5:2 F5:1 | E5:1 F5:1 G5:1 | A5:3 | C6:1 A5:1 F5:1 | G5:1.5 F5:.5 E5:1 | D5:1 E5:1 C5:1 | D5:3 | F5:1 A5:1 D6:1 | C6:2 A5:1 | Bb5:1 A5:1 G5:1 | A5:3 | G5:1 Bb5:1 D6:1 | C6:1 A5:1 F5:1 | E5:1 G5:1 C#5:1 | D5:3',
        parts: [['flute', 0, .7], ['harp', -12, .45], ['strings', -12, .25]] }],
      ch: 'Dm:3 Gm:3 C:3 F:3 F:3 Bb:3 Gm:3 Dm:3 Dm:3 F:3 Gm:3 Dm:3 Bb:3 F:3 A7:3 Dm:3' },
    seatown: { bpm: 96, bpb: 4, style: 'march', loop: true,
      mel: [{ s: 'C5:.5 F5:.5 A5:.5 C6:.5 A5:1 F5:1 | G5:.5 A5:.5 Bb5:.5 G5:.5 A5:2 | Bb5:.5 A5:.5 G5:.5 F5:.5 E5:1 C5:1 | F5:3 R:1 | A5:1 C6:.5 D6:.5 C6:1 A5:1 | Bb5:.5 C6:.5 Bb5:.5 A5:.5 G5:2 | A5:.5 G5:.5 F5:.5 E5:.5 D5:1 E5:1 | F5:3 R:1',
        parts: [['oboe', 0, .7], ['harp', -12, .45], ['glock', 12, .18]] }],
      ch: 'F:4 C:4 Bb:2 C:2 F:4 F:4 Gm:4 Bb:2 C:2 F:4' },
    seaboss: { bpm: 138, bpb: 4, style: 'boss', loop: true,
      mel: [{ s: 'D5:.5 D5:.5 F5:.5 A5:.5 D6:1 C6:1 | Bb5:.5 A5:.5 G5:.5 F5:.5 E5:2 | F5:.5 G5:.5 A5:.5 Bb5:.5 C6:1 A5:1 | D6:3 R:1 | D6:.5 C6:.5 Bb5:.5 A5:.5 G5:1 Bb5:1 | A5:.5 G5:.5 F5:.5 E5:.5 D5:2 | Bb5:1 A5:1 G5:1 E5:1 | D5:4',
        parts: [['brass', -12, .85], ['violin', 0, .55], ['trumpet', 0, .2]] }],
      ch: 'Dm:4 Gm:2 A:2 Dm:2 F:2 Bb:2 A:2 Gm:2 C:2 Dm:2 Bb:2 Gm:2 A:2 Dm:4' },
    // jingles
    victory: { bpm: 120, bpb: 4, style: 'fanfare', loop: false,
      mel: [{ s: 'G4:.5 C5:.5 E5:.5 G5:1.5 E5:.5 G5:1 C6:3 R:.5', parts: [['trumpet', 0, 1], ['violin', 12, .4]] }], ch: 'C:4 G:2 C:2' },
    levelup: { bpm: 132, bpb: 4, style: 'fanfare', loop: false,
      mel: [{ s: 'C5:.25 E5:.25 G5:.25 C6:.25 E6:1.5 R:.5', parts: [['trumpet', 0, .9], ['glock', 12, .6]] }], ch: 'C:3' },
    light: { bpm: 96, bpb: 4, style: 'fanfare', loop: false,
      mel: [{ s: 'D5:.5 F#5:.5 A5:.5 D6:1.5 C#6:.5 D6:4 R:.5', parts: [['horn', 0, 1], ['violin', 12, .5], ['harp', 12, .6]] }], ch: 'D:4 A:2 D:2' },
    inn: { bpm: 84, bpb: 4, style: 'hymn', loop: false,
      mel: [{ s: 'F5:1 A5:1 C6:1 F6:3', parts: [['flute', 0, .8], ['harp', 0, .6]] }], ch: 'F:3 F:3' },
    gameover: { bpm: 60, bpb: 4, style: 'hymn', loop: false,
      mel: [{ s: 'A4:1 G#4:1 A4:1 E4:3', parts: [['oboe', 0, .8]] }], ch: 'Am:3 E:1 Am:2' },
  };

  function compile(def) {
    const chs = parseChords(def.ch); const E = accomp(chs.ch, def.style, def.bpb); let len = chs.len;
    for (const m of def.mel) { const p = parseMel(m.s); len = Math.max(len, p.len);
      for (const e of p.ev) for (const [inst, sh, v] of m.parts) E.push({ t: e.t, inst, n: e.n.map(x => x + sh), d: e.d * .95, v }); }
    E.sort((a, b) => a.t - b.t); return { E, len, bpm: def.bpm, loop: def.loop };
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
  }
  function jingle(name, then) { play(name, { restart: true, cut: true, then }); }
  function tick() {
    if (!C || !cur || cur.done) return;
    const s = cur.song, spb = 60 / s.bpm, horizon = C.currentTime + .35;
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
      case 'buy': [79, 84, 88].forEach((m, i) => bl(mtof(m), i * .05, .18, 'triangle', .08)); noise(t + .1, .08, 'highpass', 5000, .15, d); break;
    }
  }
  function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : .8; return muted; }
  function setVol(m, s) { volM = m; volS = s; if (musicBus) musicBus.gain.value = m; if (sfxBus) sfxBus.gain.value = s; }
  return { init, play, jingle, tick, sfx, toggleMute, setVol, get current() { return cur && cur.name; }, get ready() { return !!C; }, get busy() { return !!(cur && !cur.song.loop && !cur.done); } };
})();
