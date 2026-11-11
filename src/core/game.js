// Gerenciador de cenas, transições e avisos.
import { W, H, COL } from './config.js';
import { Audio } from './audio.js';

export const Game = {
  scenes: {}, scene: null, sceneName: '', t: 0, trans: null, toasts: [],
  session: { mode: 'bot', chars: ['baiano', 'rinaldo'], level: 'normal', stage: 'labreal', tourney: null },

  register(name, sc) { this.scenes[name] = sc; },

  go(name, params, instant) {
    if (this.trans) return;
    if (instant) { this._switch(name, params); return; }
    this.trans = { t: 0, name, params };
    Audio.sfx('transition');
  },
  _switch(name, params) {
    if (this.scene && this.scene.exit) this.scene.exit();
    this.scene = this.scenes[name]; this.sceneName = name;
    this.scene.enter(params || {});
  },

  toast(msg, color = COL.cyan) { this.toasts.push({ msg, t: 0, color }); if (this.toasts.length > 4) this.toasts.shift(); },

  toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => this.toast('Tela cheia bloqueada pelo navegador', COL.red));
    } catch { /* API indisponível */ }
  },
  get fullscreen() { return !!document.fullscreenElement; },

  update() {
    this.t++;
    if (this.trans) {
      const tr = this.trans;
      tr.t++;
      if (tr.t === 15) this._switch(tr.name, tr.params);
      if (tr.t >= 30) this.trans = null;
    }
    if (this.scene) this.scene.update();
    for (const t of this.toasts) t.t++;
    while (this.toasts.length && this.toasts[0].t > 210) this.toasts.shift();
  },

  draw(ctx) {
    if (this.scene) this.scene.draw(ctx);
    if (this.trans) {
      const p = this.trans.t / 30, left = -1.9 * W + p * 3.3 * W;
      ctx.fillStyle = COL.red;
      ctx.beginPath(); ctx.moveTo(left + 0.2 * W, 0); ctx.lineTo(left + 1.7 * W, 0); ctx.lineTo(left + 1.5 * W, H); ctx.lineTo(left, H); ctx.fill();
      ctx.fillStyle = '#0b1020';
      ctx.beginPath(); ctx.moveTo(left + 0.26 * W, 0); ctx.lineTo(left + 1.64 * W, 0); ctx.lineTo(left + 1.44 * W, H); ctx.lineTo(left + 0.06 * W, H); ctx.fill();
    }
    this.toasts.forEach((t, i) => {
      const a = Math.min(1, t.t / 10, (210 - t.t) / 20), y = 130 + i * 44;
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = '700 16px "Segoe UI","DejaVu Sans",sans-serif';
      const w = ctx.measureText(t.msg).width + 44;
      ctx.fillStyle = 'rgba(8,11,24,0.92)'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, y, w, 36, 18); ctx.fill();
      ctx.strokeStyle = t.color; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t.msg, W / 2, y + 19);
      ctx.restore();
    });
  },
};
