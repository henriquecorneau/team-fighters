// Áudio 100% procedural (Web Audio API): efeitos sintetizados e trilhas originais geradas por sequenciador.
import { settings } from './settings.js';
import { mulberry, clamp } from './util.js';

const SCALES = {
  minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], phryg: [0, 1, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10], mixo: [0, 2, 4, 5, 7, 9, 10],
};

// Cada trilha é original: progressão + padrões rítmicos + melodia gerada por seed fixa.
const TRACKS = {
  menu: { bpm: 116, root: 57, scale: 'minor', prog: [0, 5, 2, 6], seed: 7, kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', bass: '0..0..0.0..0..8.', arp: 2, lead: 'square', pad: true },
  select: { bpm: 104, root: 55, scale: 'dorian', prog: [0, 3, 0, 4], seed: 21, kick: 'x.....x...x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: '0.....0.8.....5.', arp: 2, lead: 'triangle', pad: true },
  labreal: { bpm: 150, root: 52, scale: 'minor', prog: [0, 0, 5, 6], seed: 3, kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: '0.0.0.0.0.0.0.8.', arp: 0, lead: 'sawtooth', pad: false },
  main: { bpm: 132, root: 50, scale: 'dorian', prog: [0, 3, 0, 4], seed: 5, kick: 'x..x....x.x.....', snare: '....x..x....x...', hat: 'x.xxx.xxx.xxx.xx', bass: '0..0.8..0.0..5.8', arp: 2, lead: 'square', pad: false },
  exp: { bpm: 140, root: 48, scale: 'minor', prog: [0, 6, 5, 4], seed: 9, kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', bass: '0.80.80.0.80.808', arp: 1, lead: 'triangle', pad: false },
  tech: { bpm: 126, root: 54, scale: 'minor', prog: [0, 5, 3, 6], seed: 13, kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', bass: '0.0.0.0.0.0.0.0.', arp: 1, lead: 'sawtooth', pad: true },
  mech: { bpm: 120, root: 50, scale: 'phryg', prog: [0, 1, 0, 6], seed: 17, kick: 'x.x...x.x.x...x.', snare: '....x.......x..x', hat: '..x...x...x...x.', bass: '0..0.0..0..0.05.', arp: 0, lead: 'sawtooth', pad: false, clank: true },
  capy: { bpm: 126, root: 55, scale: 'mixo', prog: [0, 3, 6, 0], seed: 19, kick: 'x..x..x.x..x..x.', snare: '......x.......x.', hat: 'x.xxx.xxx.xxx.xx', bass: '0..0..5.0..0..5.', arp: 0, lead: 'triangle', pad: true, bright: true },
  victory: { bpm: 124, root: 60, scale: 'major', prog: [0, 3, 4, 0], seed: 23, kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: '0..0..0.5..5..8.', arp: 2, lead: 'square', pad: true },
};

const RHY = [[0, 3, 6, 8, 11, 14], [0, 2, 4, 8, 12], [0, 4, 6, 8, 10, 12, 14], [2, 4, 6, 8, 12, 14], [0, 6, 8, 14]];

function genLead(seed) {
  const rnd = mulberry(seed);
  const mk = () => {
    const r = RHY[Math.floor(rnd() * RHY.length)];
    let off = [0, 2, 4][Math.floor(rnd() * 3)];
    return r.map((s, i) => {
      if (i) {
        off += [-2, -1, -1, 1, 1, 2][Math.floor(rnd() * 6)];
        if (s % 8 === 0) off = Math.round(off / 2) * 2;
      }
      off = clamp(off, -3, 7);
      return [s, off];
    });
  };
  const A = mk(), B = mk(), C = mk(), E = mk();
  return [A, B, A, C, E, B, A, C];
}

export const Audio = {
  ctx: null, ready: false, track: null, trackId: null, stepI: 0, nextT: 0,

  // Só pode ser criado após interação do usuário (política de autoplay dos navegadores).
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const c = this.ctx = new AC();
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.18;
      comp.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.connect(comp);
      this.musicVol = c.createGain(); this.musicVol.connect(comp);
      this.duck = c.createGain(); this.duck.connect(this.musicVol);
      const bus = (type, f) => {
        const flt = c.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.connect(this.duck); return flt;
      };
      this.bassBus = bus('lowpass', 620);
      this.leadBus = bus('lowpass', 3000);
      this.arpBus = bus('lowpass', 2400);
      this.padBus = bus('lowpass', 1000);
      this.drumBus = c.createGain(); this.drumBus.connect(this.duck);
      this.delay = c.createDelay(1.0);
      const fb = c.createGain(); fb.gain.value = 0.3;
      const wet = c.createGain(); wet.gain.value = 0.28;
      this.delay.connect(fb); fb.connect(this.delay); this.delay.connect(wet); wet.connect(this.duck);
      this.leadBus.connect(this.delay); this.arpBus.connect(this.delay);

      const len = c.sampleRate * 2;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

      this.ready = true;
      this.applyVolumes();
      setInterval(() => this._tick(), 35);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) c.suspend(); else c.resume().then(() => { this.nextT = c.currentTime + 0.1; });
      });
      if (this.pending) { const p = this.pending; this.pending = null; this.playMusic(p); }
    } catch { this.ready = false; }
  },

  applyVolumes() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(settings.sfx * settings.sfx * 1.1, t, 0.02);
    this.musicVol.gain.setTargetAtTime(settings.music * settings.music * 0.75, t, 0.02);
  },

  tone({ type = 'sine', f = 440, f2, dur = 0.15, vol = 0.3, at = 0, a = 0.004, bus }) {
    const c = this.ctx, t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || this.sfxBus);
    o.start(t); o.stop(t + dur + 0.03);
  },

  noise({ dur = 0.2, vol = 0.3, at = 0, type = 'lowpass', f = 2000, f2, q = 0.8, a = 0.002, bus }) {
    const c = this.ctx, t = c.currentTime + at;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const flt = c.createBiquadFilter(); flt.type = type; flt.Q.value = q;
    flt.frequency.setValueAtTime(f, t);
    if (f2) flt.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(flt); flt.connect(g); g.connect(bus || this.sfxBus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.03);
  },

  sfx(name, p) {
    if (!this.ready || this.ctx.state !== 'running') return;
    const fn = SFX[name];
    if (fn) { try { fn(this, p || {}); } catch { /* um efeito com falha não derruba o jogo */ } }
  },

  // ---------- música ----------
  playMusic(id) {
    if (!this.ready) { this.pending = id; return; }
    if (this.trackId === id) return;
    this.trackId = id;
    const c = this.ctx, t = c.currentTime;
    this.duck.gain.cancelScheduledValues(t);
    this.duck.gain.setTargetAtTime(0, t, 0.05);
    const tr = TRACKS[id];
    if (!tr) { this.track = null; return; }
    if (!tr.leadPat) tr.leadPat = genLead(tr.seed);
    clearTimeout(this._sw);
    this.track = null;
    this._sw = setTimeout(() => {
      this.track = tr; this.stepI = 0; this.nextT = c.currentTime + 0.06;
      this.delay.delayTime.value = (60 / tr.bpm) * 0.75;
      this.duck.gain.cancelScheduledValues(c.currentTime);
      this.duck.gain.setTargetAtTime(1, c.currentTime, 0.04);
    }, 240);
  },

  stopMusic() { this.playMusic(null); this.trackId = null; },

  _tick() {
    const tr = this.track;
    if (!tr || !this.ready || this.ctx.state !== 'running') return;
    const sd = 60 / tr.bpm / 4;
    if (this.nextT < this.ctx.currentTime - 0.3) this.nextT = this.ctx.currentTime + 0.05;
    while (this.nextT < this.ctx.currentTime + 0.2) {
      this._step(tr, this.stepI, this.nextT - this.ctx.currentTime, sd);
      this.nextT += sd; this.stepI++;
    }
  },

  _mnote(bus, type, midi, at, dur, vol, a = 0.006) {
    this.tone({ type, f: 440 * 2 ** ((midi - 69) / 12), dur, vol, at, a, bus });
  },

  _step(tr, i, at, sd) {
    const s = i % 16, bar = Math.floor(i / 16), sc = SCALES[tr.scale];
    const deg = tr.prog[bar % tr.prog.length];
    const st = (idx) => sc[((idx % 7) + 7) % 7] + 12 * Math.floor(idx / 7);
    const fill = bar % 8 === 7 && s >= 12;
    // bateria
    if (tr.kick[s] === 'x') { this.tone({ f: 150, f2: 42, dur: 0.2, vol: 0.5, at, bus: this.drumBus }); }
    if (tr.snare[s] === 'x' || fill) {
      this.noise({ dur: 0.13, vol: fill ? 0.2 : 0.26, at, type: 'bandpass', f: 1900, q: 0.7, bus: this.drumBus });
      this.tone({ type: 'triangle', f: 210, f2: 130, dur: 0.08, vol: 0.16, at, bus: this.drumBus });
      if (tr.clank) this.tone({ type: 'square', f: 1480, f2: 1300, dur: 0.06, vol: 0.05, at, bus: this.drumBus });
    }
    if (tr.hat[s] === 'x') this.noise({ dur: 0.035, vol: s % 4 === 2 ? 0.1 : 0.055, at, type: 'highpass', f: tr.bright ? 9000 : 7000, bus: this.drumBus });
    // baixo
    const bc = tr.bass[s];
    if (bc !== '.') {
      const add = bc === '8' ? 12 : bc === '5' ? 7 : 0;
      const m = tr.root - 24 + st(deg) + add;
      this._mnote(this.bassBus, 'sawtooth', m, at, sd * 1.7, 0.3);
      this._mnote(this.bassBus, 'square', m, at, sd * 1.5, 0.12);
    }
    // pad (acorde sustentado por compasso)
    if (tr.pad && s === 0) {
      for (const k of [0, 2, 4]) this._mnote(this.padBus, 'sawtooth', tr.root + st(deg + k), at, sd * 16, 0.045, 0.3);
    }
    // arpejo
    if (tr.arp && s % tr.arp === 0 && bar >= 2) {
      const seq = [0, 2, 4, 7, 4, 2];
      const k = seq[(s / tr.arp) % seq.length];
      this._mnote(this.arpBus, 'square', tr.root + 12 + st(deg + k), at, sd * 0.9, 0.05);
    }
    // melodia (entra depois da introdução)
    if (bar >= 4) {
      const pat = tr.leadPat[bar % 8];
      for (let n = 0; n < pat.length; n++) {
        if (pat[n][0] !== s) continue;
        const nextS = n + 1 < pat.length ? pat[n + 1][0] : 16;
        const len = Math.min(nextS - s, 5) * sd * 0.95;
        let idx = deg + pat[n][1];
        if (bar % 8 === 7 && n === pat.length - 1) idx = 7;
        const up = Math.floor(bar / 8) % 2 === 1 ? 12 : 0;
        const m = tr.root + 12 + up + st(idx);
        this._mnote(this.leadBus, tr.lead, m, at, len, tr.lead === 'triangle' ? 0.2 : 0.1, 0.012);
        if (tr.lead !== 'triangle') this._mnote(this.leadBus, tr.lead, m + 0.08, at, len, 0.05, 0.012);
      }
    }
  },
};

// ---------- catálogo de efeitos sonoros ----------
const SFX = {
  ui_move: (A) => A.tone({ type: 'square', f: 620, f2: 820, dur: 0.05, vol: 0.07 }),
  ui_ok: (A) => { A.tone({ type: 'square', f: 660, dur: 0.07, vol: 0.09 }); A.tone({ type: 'square', f: 990, dur: 0.12, vol: 0.09, at: 0.06 }); },
  ui_back: (A) => A.tone({ type: 'square', f: 440, f2: 220, dur: 0.12, vol: 0.08 }),
  ui_deny: (A) => A.tone({ type: 'sawtooth', f: 140, f2: 110, dur: 0.14, vol: 0.1 }),
  ui_start: (A) => { [523, 659, 784, 1047].forEach((f, i) => A.tone({ type: 'square', f, dur: 0.12, vol: 0.09, at: i * 0.06 })); A.noise({ dur: 0.4, vol: 0.12, type: 'highpass', f: 3000, f2: 9000, at: 0.2 }); },
  pick: (A) => { A.tone({ type: 'sawtooth', f: 220, f2: 880, dur: 0.18, vol: 0.12 }); A.tone({ type: 'square', f: 1320, dur: 0.2, vol: 0.07, at: 0.14 }); A.noise({ dur: 0.25, vol: 0.14, type: 'bandpass', f: 1200, f2: 4000, at: 0.05 }); },
  transition: (A) => A.noise({ dur: 0.35, vol: 0.14, type: 'bandpass', f: 400, f2: 3200, q: 1.2 }),

  whoosh_l: (A) => A.noise({ dur: 0.1, vol: 0.1, type: 'bandpass', f: 900, f2: 2600, q: 1.5 }),
  whoosh_h: (A) => A.noise({ dur: 0.2, vol: 0.16, type: 'bandpass', f: 500, f2: 2000, q: 1.2 }),
  hit_l: (A) => { A.noise({ dur: 0.09, vol: 0.4, f: 3200, f2: 500 }); A.tone({ f: 190, f2: 70, dur: 0.1, vol: 0.4 }); },
  hit_h: (A) => { A.noise({ dur: 0.2, vol: 0.55, f: 2600, f2: 200 }); A.tone({ f: 150, f2: 38, dur: 0.26, vol: 0.6 }); A.tone({ type: 'square', f: 90, f2: 50, dur: 0.08, vol: 0.2 }); },
  hit_s: (A) => { A.noise({ dur: 0.3, vol: 0.6, f: 3500, f2: 150 }); A.tone({ f: 120, f2: 30, dur: 0.4, vol: 0.7 }); A.tone({ type: 'sawtooth', f: 400, f2: 80, dur: 0.2, vol: 0.14 }); },
  block: (A) => { A.noise({ dur: 0.06, vol: 0.25, type: 'highpass', f: 2500 }); A.tone({ type: 'square', f: 820, f2: 520, dur: 0.06, vol: 0.1 }); },
  guardbreak: (A) => { [1900, 2500, 3300, 4100].forEach((f, i) => A.tone({ f, f2: f * 0.6, dur: 0.3, vol: 0.09, at: i * 0.015 })); A.noise({ dur: 0.3, vol: 0.3, type: 'highpass', f: 3000 }); },
  jump: (A) => A.tone({ f: 280, f2: 560, dur: 0.11, vol: 0.09 }),
  land: (A) => A.noise({ dur: 0.08, vol: 0.16, f: 500, f2: 120 }),
  dash: (A) => A.noise({ dur: 0.16, vol: 0.16, type: 'bandpass', f: 1200, f2: 350, q: 1 }),
  fall: (A) => { A.noise({ dur: 0.2, vol: 0.35, f: 700, f2: 90 }); A.tone({ f: 100, f2: 40, dur: 0.2, vol: 0.4 }); },
  ko: (A) => { A.tone({ f: 130, f2: 26, dur: 1.0, vol: 0.7 }); A.noise({ dur: 1.0, vol: 0.5, f: 1800, f2: 90 }); A.tone({ type: 'sawtooth', f: 600, f2: 60, dur: 0.7, vol: 0.12 }); },
  super_flash: (A) => { A.tone({ type: 'sawtooth', f: 160, f2: 1700, dur: 0.55, vol: 0.16 }); A.noise({ dur: 0.6, vol: 0.2, type: 'bandpass', f: 500, f2: 7000, q: 2 }); [392, 494, 587, 784].forEach((f) => A.tone({ type: 'square', f, dur: 0.5, vol: 0.06, at: 0.55 })); A.tone({ f: 90, f2: 30, dur: 0.5, vol: 0.5, at: 0.55 }); },
  energy_full: (A) => { [784, 988, 1175].forEach((f, i) => A.tone({ type: 'triangle', f, dur: 0.14, vol: 0.12, at: i * 0.07 })); },
  round: (A) => { A.tone({ type: 'triangle', f: 196, dur: 0.9, vol: 0.3 }); A.tone({ type: 'triangle', f: 294, dur: 0.9, vol: 0.2 }); A.tone({ f: 587, f2: 580, dur: 0.7, vol: 0.1 }); },
  fight: (A) => { A.tone({ type: 'sawtooth', f: 220, f2: 880, dur: 0.25, vol: 0.2 }); A.tone({ type: 'square', f: 880, dur: 0.4, vol: 0.12, at: 0.2 }); A.noise({ dur: 0.5, vol: 0.3, f: 5000, f2: 400, at: 0.2 }); },
  win: (A) => { [523, 659, 784, 1047, 1319].forEach((f, i) => A.tone({ type: 'square', f, dur: 0.22, vol: 0.1, at: i * 0.11 })); },
  lose: (A) => { [440, 392, 330, 262].forEach((f, i) => A.tone({ type: 'triangle', f, dur: 0.3, vol: 0.16, at: i * 0.18 })); },
  tick: (A) => A.tone({ type: 'square', f: 1000, dur: 0.04, vol: 0.06 }),
  trophy: (A) => { [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => A.tone({ type: 'square', f, dur: 0.24, vol: 0.1, at: i * 0.12 })); },

  // Baiano — drones e tecnologia aérea
  drone: (A) => { A.tone({ type: 'sawtooth', f: 170, f2: 290, dur: 0.5, vol: 0.09 }); A.tone({ type: 'sawtooth', f: 176, f2: 300, dur: 0.5, vol: 0.09 }); A.noise({ dur: 0.5, vol: 0.05, type: 'bandpass', f: 2400, q: 3 }); },
  laser: (A) => A.tone({ type: 'sawtooth', f: 1900, f2: 220, dur: 0.2, vol: 0.13 }),
  beam: (A) => { A.tone({ type: 'square', f: 95, f2: 70, dur: 0.6, vol: 0.2 }); A.noise({ dur: 0.6, vol: 0.3, type: 'highpass', f: 1800, f2: 5000 }); A.tone({ type: 'sawtooth', f: 1400, f2: 300, dur: 0.6, vol: 0.1 }); },
  explosion: (A) => { A.noise({ dur: 0.7, vol: 0.7, f: 2800, f2: 70 }); A.tone({ f: 95, f2: 24, dur: 0.7, vol: 0.7 }); },
  lockon: (A) => { [0, 0.09, 0.18].forEach((at) => A.tone({ type: 'square', f: 1250, dur: 0.045, vol: 0.08, at })); A.tone({ type: 'square', f: 1900, dur: 0.16, vol: 0.09, at: 0.27 }); },
  // Rinaldo — ferramentas e gambiarras
  clang: (A) => { [523, 1187, 1973, 2731].forEach((f) => A.tone({ f, dur: 0.28, vol: 0.09 })); A.noise({ dur: 0.04, vol: 0.3, type: 'highpass', f: 3500 }); },
  bonk: (A) => { A.tone({ type: 'triangle', f: 320, f2: 140, dur: 0.16, vol: 0.4 }); A.tone({ f: 640, f2: 420, dur: 0.1, vol: 0.14 }); },
  drill: (A) => { A.tone({ type: 'sawtooth', f: 240, f2: 520, dur: 0.5, vol: 0.12 }); A.tone({ type: 'square', f: 61, dur: 0.5, vol: 0.1 }); A.noise({ dur: 0.5, vol: 0.1, type: 'bandpass', f: 3200, q: 4 }); },
  tape: (A) => A.noise({ dur: 0.4, vol: 0.25, type: 'bandpass', f: 1500, f2: 4200, q: 3 }),
  zap: (A) => { for (let i = 0; i < 7; i++) A.noise({ dur: 0.035, vol: 0.3, type: 'bandpass', f: 2000 + Math.random() * 4000, q: 5, at: i * 0.045 }); A.tone({ type: 'square', f: 62, dur: 0.35, vol: 0.14 }); },
  fan: (A) => { A.noise({ dur: 0.75, vol: 0.3, type: 'bandpass', f: 450, f2: 900, q: 0.8, a: 0.1 }); A.tone({ type: 'sawtooth', f: 90, f2: 140, dur: 0.75, vol: 0.07 }); },
  rocket: (A) => { A.noise({ dur: 0.7, vol: 0.4, f: 500, f2: 3500, a: 0.05 }); A.tone({ type: 'sawtooth', f: 80, f2: 260, dur: 0.7, vol: 0.1 }); },
  gambiarra: (A) => { [330, 415, 494, 622, 740].forEach((f, i) => A.tone({ type: 'square', f, dur: 0.07, vol: 0.08, at: i * 0.05 })); A.tone({ type: 'triangle', f: 180, f2: 700, dur: 0.2, vol: 0.14, at: 0.25 }); },
  stamp: (A) => { A.tone({ f: 140, f2: 50, dur: 0.25, vol: 0.5 }); A.noise({ dur: 0.1, vol: 0.3, f: 1500 }); [784, 1047].forEach((f, i) => A.tone({ type: 'square', f, dur: 0.2, vol: 0.09, at: 0.1 + i * 0.1 })); },
  // Tibas — mecânica e hidráulica
  hydraulic: (A) => { A.noise({ dur: 0.28, vol: 0.3, type: 'highpass', f: 2800, f2: 6500 }); A.tone({ f: 85, f2: 38, dur: 0.3, vol: 0.5, at: 0.2 }); A.tone({ type: 'square', f: 300, f2: 120, dur: 0.1, vol: 0.08, at: 0.2 }); },
  turbine: (A) => { A.tone({ type: 'sawtooth', f: 70, f2: 760, dur: 0.6, vol: 0.12 }); A.noise({ dur: 0.6, vol: 0.2, type: 'bandpass', f: 300, f2: 3000, q: 2 }); },
  shock: (A) => { A.tone({ f: 75, f2: 28, dur: 0.6, vol: 0.6 }); A.noise({ dur: 0.5, vol: 0.4, f: 1200, f2: 100 }); },
  gear: (A) => { for (let i = 0; i < 5; i++) A.tone({ type: 'square', f: 180 + i * 12, dur: 0.03, vol: 0.09, at: i * 0.06 }); },
  press: (A) => { A.noise({ dur: 0.9, vol: 0.7, f: 1500, f2: 60 }); A.tone({ f: 70, f2: 22, dur: 0.9, vol: 0.8 }); [311, 733, 1409].forEach((f) => A.tone({ f, dur: 0.5, vol: 0.06 })); },
  // Ramas — digital e IA
  ai_lock: (A) => { [0, 0.08, 0.16].forEach((at) => A.tone({ type: 'square', f: 1568, dur: 0.04, vol: 0.07, at })); },
  ai_fire: (A) => { A.tone({ type: 'sawtooth', f: 2400, f2: 300, dur: 0.22, vol: 0.13 }); A.tone({ type: 'square', f: 1200, f2: 150, dur: 0.22, vol: 0.07 }); },
  glitch: (A) => { for (let i = 0; i < 7; i++) A.tone({ type: 'square', f: 200 + Math.random() * 2200, dur: 0.03, vol: 0.08, at: i * 0.035 }); },
  digital: (A) => { A.tone({ type: 'sawtooth', f: 260, f2: 1300, dur: 0.3, vol: 0.12 }); for (let i = 0; i < 5; i++) A.tone({ type: 'square', f: 800 + i * 220, dur: 0.035, vol: 0.06, at: i * 0.05 }); A.noise({ dur: 0.35, vol: 0.14, type: 'bandpass', f: 3000, f2: 800, q: 4 }); },
  boot: (A) => { [262, 330, 392, 523, 659, 784].forEach((f, i) => A.tone({ type: 'triangle', f, dur: 0.1, vol: 0.1, at: i * 0.05 })); },
  // Peidin — fumaça e brinquedos satisfatórios
  pop: (A) => { A.tone({ f: 520, f2: 1300, dur: 0.05, vol: 0.3 }); A.noise({ dur: 0.03, vol: 0.2, type: 'highpass', f: 3000 }); },
  puff: (A) => { A.noise({ dur: 0.7, vol: 0.34, f: 900, f2: 300, a: 0.12, q: 0.6 }); A.tone({ f: 140, f2: 90, dur: 0.5, vol: 0.08, a: 0.1 }); },
  // Elber — capivaras e natureza
  capy: (A) => { A.tone({ f: 720, f2: 1150, dur: 0.07, vol: 0.14 }); A.tone({ f: 800, f2: 1250, dur: 0.09, vol: 0.14, at: 0.1 }); },
  stampede: (A) => { for (let i = 0; i < 9; i++) A.noise({ dur: 0.07, vol: 0.28, f: 260, f2: 90, at: i * 0.06 }); },
  shield: (A) => { A.tone({ f: 392, f2: 784, dur: 0.3, vol: 0.14 }); A.tone({ type: 'triangle', f: 1175, dur: 0.35, vol: 0.08, at: 0.12 }); },
  boing: (A) => A.tone({ type: 'triangle', f: 180, f2: 520, dur: 0.16, vol: 0.2 }),
  rustle: (A) => A.noise({ dur: 0.22, vol: 0.14, type: 'highpass', f: 4200, f2: 2500 }),
};
