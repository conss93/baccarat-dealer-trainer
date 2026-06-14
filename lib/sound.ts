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
export const SFX = {
  deal() { sfxNoise(0.07, { vol: 0.22, freq: 3200, q: 0.6 }); sfxTone(1900, 0.045, { type: "triangle", vol: 0.05, delay: 0.012 }); },
  good() { sfxTone(660, 0.1, { vol: 0.1 }); sfxTone(990, 0.16, { vol: 0.09, delay: 0.09 }); },
  bad() { sfxTone(240, 0.22, { type: "sawtooth", vol: 0.055, slide: 150 }); },
  phase() { sfxTone(523, 0.12, { vol: 0.05 }); sfxTone(784, 0.18, { vol: 0.045, delay: 0.07 }); },
};
