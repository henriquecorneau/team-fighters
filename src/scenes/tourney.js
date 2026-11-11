// Modo torneio: chave de quatro lutas em sequência e tela especial do campeão.
import { W, H, COL } from '../core/config.js';
import { Game } from '../core/game.js';
import { Audio } from '../core/audio.js';
import { settings, save } from '../core/settings.js';
import { CHAR } from '../characters/index.js';
import { STAGE } from '../stages/index.js';
import { LEVELS } from '../ai/bot.js';
import { text, body, panel, menuBg, title, hint, Menu } from '../render/ui.js';
import { Show } from './common.js';
import { FX } from '../render/fx.js';
import { TAU, clamp, easeOutBack } from '../core/util.js';

const ROUND_NAME = ['1ª LUTA', '2ª LUTA', 'SEMIFINAL', 'GRANDE FINAL'];

function trophy(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, '#c98a1c'); g.addColorStop(0.45, '#fff3a6'); g.addColorStop(1, '#f2a81d');
  ctx.fillStyle = '#16131f'; ctx.strokeStyle = '#16131f'; ctx.lineWidth = 7; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-58, -110); ctx.lineTo(58, -110); ctx.quadraticCurveTo(54, -20, 12, -6); ctx.lineTo(12, 26); ctx.lineTo(40, 34); ctx.lineTo(40, 56); ctx.lineTo(-40, 56); ctx.lineTo(-40, 34); ctx.lineTo(-12, 26); ctx.lineTo(-12, -6); ctx.quadraticCurveTo(-54, -20, -58, -110); ctx.closePath();
  ctx.stroke(); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 11; ctx.strokeStyle = '#16131f';
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 62, -76, 24, d > 0 ? -Math.PI / 2 : Math.PI / 2, d > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.stroke(); }
  ctx.lineWidth = 5; ctx.strokeStyle = '#f2c21d';
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 62, -76, 24, d > 0 ? -Math.PI / 2 : Math.PI / 2, d > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.stroke(); }
  ctx.fillStyle = '#16131f'; ctx.beginPath(); ctx.roundRect(-56, 54, 112, 26, 5); ctx.fill();
  ctx.fillStyle = '#e3212f'; ctx.beginPath(); ctx.roundRect(-51, 58, 102, 18, 3); ctx.fill();
  text(ctx, 'TEAM', 0, 67, 13, '#fff', { align: 'center' });
  text(ctx, '1', 0, -62, 54, '#b5750c', { align: 'center', italic: false });
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.2 * Math.sin(t * 0.1)})`;
  ctx.beginPath(); ctx.ellipse(-28, -70, 8, 30, 0.2, 0, TAU); ctx.fill();
  ctx.restore();
}

export default {
  enter() {
    const tn = this.tn = Game.session.tourney;
    this.t = 0; this.fx = new FX();
    this.player = CHAR[tn.player];
    this.champ = tn.idx >= tn.order.length;
    this.show = new Show(this.player, 1, this.champ ? 'win' : 'idle');
    if (this.champ) {
      if (!tn.saved) { tn.saved = true; settings.stats.tourney[tn.player] = (settings.stats.tourney[tn.player] || 0) + 1; save(); }
      this.menu = new Menu([{ label: 'MENU PRINCIPAL', onOk: () => Game.go('title', { menu: true }) }, { label: 'NOVO TORNEIO', onOk: () => Game.go('select', { mode: 'tournament' }) }]);
      Audio.playMusic('victory'); Audio.sfx('trophy');
    } else {
      this.menu = new Menu([{ label: 'LUTAR!', onOk: () => Game.go('fight') }, { label: 'ABANDONAR TORNEIO', onOk: () => Game.go('title', { menu: true }) }], { onBack: () => Game.go('title', { menu: true }) });
      Audio.playMusic('select');
    }
  },
  update() {
    this.t++; this.show.update(false); this.fx.update();
    if (this.champ && this.t % 14 === 1) this.fx.confetti(Math.random() * W, -10, 14);
    if (this.t > 20) this.menu.update();
  },
  draw(ctx) {
    const t = this.t, tn = this.tn, p = this.player;
    menuBg(ctx, t, this.champ ? '#c98a1c' : '#7a1a8f');
    if (this.champ) {
      this.fx.draw(ctx, false);
      const k = easeOutBack(clamp(t / 20, 0, 1));
      ctx.save(); ctx.translate(W / 2, 92); ctx.scale(k, k);
      text(ctx, 'CAMPEÃO DO TEAM!', 0, 0, 74, COL.yellow, { align: 'center', stroke: '#0b1020', sw: 14 });
      ctx.restore();
      this.show.draw(ctx, 360, 640, 1.8, t);
      trophy(ctx, 640, 420 + Math.sin(t * 0.05) * 8, 1.5, t);
      panel(ctx, 780, 190, 440, 300, { accent: p.color });
      text(ctx, p.name.toUpperCase(), 810, 232, 44, '#fff');
      text(ctx, p.title, 812, 270, 18, p.color);
      const secs = Math.round(tn.frames / 60);
      const rows = [['Dificuldade', LEVELS[tn.level].label], ['Tempo total de luta', Math.floor(secs / 60) + 'min ' + String(secs % 60).padStart(2, '0') + 's'], ['Rounds perfeitos', String(tn.perfects)], ['Maior combo', tn.maxCombo + ' hits'], ['Títulos com ' + p.name, String(settings.stats.tourney[tn.player] || 1)]];
      rows.forEach((r, i) => { body(ctx, r[0], 812, 312 + i * 30, 16, '#b9c2dc'); body(ctx, r[1], 1196, 312 + i * 30, 16, '#fff', { align: 'right', weight: 800 }); });
      body(ctx, '“' + p.quote + '”', 1000, 468, 15, '#fff', { align: 'center', maxW: 410 });
      this.menu.draw(ctx, 790, 520, 420, { ih: 58, size: 24 });
      this.fx.draw(ctx, true);
      return;
    }
    title(ctx, 'TORNEIO DO TEAM', `${ROUND_NAME[tn.idx]}  ·  dificuldade ${LEVELS[tn.level].label}`);
    this.show.draw(ctx, 170, 560, 1.4, t);
    text(ctx, p.name.toUpperCase(), 170, 590, 30, '#fff', { align: 'center', stroke: '#0b1020', sw: 6 });
    body(ctx, 'VOCÊ', 170, 618, 14, COL.p1, { align: 'center', weight: 900 });
    // chave
    tn.order.forEach((id, i) => {
      const c = CHAR[id], x = 350 + i * 228, y = 150 - (i === 3 ? 14 : 0), w = 206, h = 290 + (i === 3 ? 28 : 0);
      const done = i < tn.idx, cur = i === tn.idx;
      if (i > 0) { ctx.strokeStyle = done || cur ? COL.yellow : '#3a4266'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 22, 300); ctx.lineTo(x, 300); ctx.stroke(); }
      ctx.save();
      if (cur) ctx.translate(0, -6 + Math.sin(t * 0.12) * 3);
      ctx.fillStyle = cur ? COL.yellow : i === 3 ? '#7a5a12' : '#0a0d1a'; ctx.beginPath(); ctx.roundRect(x - 5, y - 5, w + 10, h + 10, 14); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c.color); g.addColorStop(1, '#141a36');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      const st = i === 3 ? STAGE.labreal : STAGE[c.stage];
      if (st.thumb) { ctx.globalAlpha = 0.5; ctx.drawImage(st.thumb, x - 80, y, 370, 208); ctx.globalAlpha = 1; }
      if (c.portraitBig) ctx.drawImage(c.portraitBig, x - 12, y + 6, 230, 230);
      ctx.fillStyle = 'rgba(8,11,24,0.9)'; ctx.fillRect(x, y + h - 74, w, 74);
      if (done) { ctx.fillStyle = 'rgba(8,11,24,0.72)'; ctx.fillRect(x, y, w, h); }
      ctx.restore();
      body(ctx, ROUND_NAME[i], x + w / 2, y + h - 58, 12, i === 3 ? COL.yellow : '#9fb0d8', { align: 'center', weight: 900 });
      text(ctx, c.name.toUpperCase(), x + w / 2, y + h - 34, 24, '#fff', { align: 'center' });
      body(ctx, st.name, x + w / 2, y + h - 12, 10.5, '#c9d1ea', { align: 'center', maxW: w - 12 });
      if (done) { ctx.save(); ctx.translate(x + w / 2, y + 120); ctx.rotate(-0.2); text(ctx, 'VENCIDO', 0, 0, 34, COL.red, { align: 'center', stroke: '#0b1020', sw: 8 }); ctx.restore(); }
      ctx.restore();
    });
    const opp = CHAR[tn.order[tn.idx]];
    panel(ctx, 350, 486, 660, 86, { accent: opp.color });
    text(ctx, 'PRÓXIMO: ' + opp.name.toUpperCase(), 380, 514, 26, '#fff');
    body(ctx, opp.desc, 380, 548, 13.5, '#c9d1ea', { maxW: 610 });
    this.menu.draw(ctx, 1030, 484, 230, { ih: 50, size: 19 });
    hint(ctx, 'Enter / Espaço / J: confirmar   ·   Esc: abandonar');
  },
};
