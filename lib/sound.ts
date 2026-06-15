// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
let _ac = null;
let _sfxOn = true;
export function setSfxOn(v) { _sfxOn = v; }
export function ac() {
  if (!_ac) {
    const Ctx = typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext);
    if (Ctx) try { _ac = new Ctx(); } catch (e) { _ac = null; }
  }
  if (_ac && _ac.state === "suspended") _ac.resume();
  return _ac;
}
function sfxTone(freq, dur, opt: any = {}) {
  const c = ac(); if (!c || !_sfxOn) return;
  const { type = "sine", vol = 0.12, delay = 0, slide } = opt;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function sfxNoise(dur, opt: any = {}) {
  const c = ac(); if (!c || !_sfxOn) return;
  const { vol = 0.1, delay = 0, freq = 2800, q = 0.8 } = opt;
  const t0 = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start(t0);
}

// ── 앰비언트 (스토리 전용 — 미니멀 피아노) ──
let _ambGain = null;
let _ambOscs = [];
let _ambShimmer = null;
let _ambNoteIdx = 0;
const _MELODY = [330, 392, 440, 392, 330, 294];

export function storyAmbientStart() {
  storyAmbientStop(0);
  const c = ac(); if (!c || !_sfxOn) return;
  const master = c.createGain();
  master.gain.setValueAtTime(0, c.currentTime);
  master.gain.linearRampToValueAtTime(1, c.currentTime + 1.2);
  master.connect(c.destination);
  _ambGain = master;
  _ambNoteIdx = 0;

  const playNote = () => {
    if (!_ambGain) return;
    const freq = _MELODY[_ambNoteIdx % _MELODY.length];
    _ambNoteIdx++;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = "triangle"; o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.1, c.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.04, c.currentTime + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.6);
    o.connect(g); g.connect(master); o.start(); o.stop(c.currentTime + 1.6);
    _ambOscs.push(o);
    const o2 = c.createOscillator(); const g2 = c.createGain();
    o2.type = "sine"; o2.frequency.value = freq * 2;
    g2.gain.setValueAtTime(0, c.currentTime);
    g2.gain.linearRampToValueAtTime(0.022, c.currentTime + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);
    o2.connect(g2); g2.connect(master); o2.start(); o2.stop(c.currentTime + 0.8);
    _ambOscs.push(o2);
    _ambShimmer = setTimeout(playNote, 1350 + Math.random() * 180);
  };
  _ambShimmer = setTimeout(playNote, 700);
}

export function storyAmbientStop(fadeMs = 600) {
  if (_ambShimmer !== null) { clearTimeout(_ambShimmer); _ambShimmer = null; }
  const g = _ambGain; _ambGain = null;
  if (g) {
    const c = ac();
    if (c && fadeMs > 0) {
      g.gain.cancelScheduledValues(0);
      g.gain.setValueAtTime(g.gain.value, c.currentTime);
      g.gain.linearRampToValueAtTime(0, c.currentTime + fadeMs / 1000);
      setTimeout(() => { _ambOscs.forEach(o => { try { o.stop(); } catch {} }); _ambOscs = []; }, fadeMs + 120);
    } else {
      _ambOscs.forEach(o => { try { o.stop(); } catch {} }); _ambOscs = [];
    }
  } else {
    _ambOscs.forEach(o => { try { o.stop(); } catch {} }); _ambOscs = [];
  }
}

export const SFX = {
  deal() { sfxNoise(0.07, { vol: 0.22, freq: 3200, q: 0.6 }); sfxTone(1900, 0.045, { type: "triangle", vol: 0.05, delay: 0.012 }); },
  good() { sfxTone(660, 0.1, { vol: 0.1 }); sfxTone(990, 0.16, { vol: 0.09, delay: 0.09 }); },
  bad() { sfxTone(240, 0.22, { type: "sawtooth", vol: 0.055, slide: 150 }); },
  phase() { sfxTone(523, 0.12, { vol: 0.05 }); sfxTone(784, 0.18, { vol: 0.045, delay: 0.07 }); },
  typeTick() { sfxTone(640 + Math.random() * 160, 0.022, { type: "square", vol: 0.02 }); },
  sceneTransition() {
    sfxTone(310, 0.2, { type: "sine", vol: 0.09, slide: 85 });
    sfxNoise(0.13, { vol: 0.04, freq: 1100, q: 1.3, delay: 0.02 });
  },
  storyFinish() {
    sfxTone(72, 0.38, { type: "sine", vol: 0.2, slide: 44 });
    sfxTone(432, 0.5, { type: "sine", vol: 0.07, delay: 0.06 });
    sfxTone(2160, 0.6, { type: "sine", vol: 0.04, delay: 0.09, slide: 3100 });
  },
  chipGrab() { [0, 28, 52, 74].forEach(d => sfxNoise(0.048, { vol: 0.13, freq: 2000 + Math.random() * 900, q: 1.3, delay: d / 1000 })); },
  chipClick() {
    sfxNoise(0.052, { vol: 0.15, freq: 2500 + Math.random() * 700, q: 1.1 });
    sfxTone(880 + Math.random() * 220, 0.04, { type: "triangle", vol: 0.038, delay: 0.006 });
  },
  murmur() { [0, 75, 155, 235, 305, 410].forEach(d => sfxTone(170 + Math.random() * 320, 0.1 + Math.random() * 0.07, { type: "sawtooth", vol: 0.014 + Math.random() * 0.009, delay: d / 1000 })); },
};
