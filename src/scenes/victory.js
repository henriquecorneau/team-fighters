// Tela de resultado: pose de vitória, frase do personagem, estatísticas e próximos passos.
import { W, H, COL } from '../core/config.js';
import { Game } from '../core/game.js';
import { Audio } from '../core/audio.js';
import { settings, save } from '../core/settings.js';
import { CHAR } from '../characters/index.js';
import { STAGE } from '../stages/index.js';
import { text, body, wrap, panel, Menu } from '../render/ui.js';
import { Show } from './common.js';
import { FX } from '../render/fx.js';
import { TAU, clamp, easeOutBack } from '../core/util.js';

export default {
  enter(p) {
    this.p = p; this.t = 0;
    const r = p.result, w = r.winner;
    this.win = CHAR[p.chars[w]]; this.los = CHAR[p.chars[1 - w]];
    this.show = new Show(this.win, w === 0 ? 1 : -1, 'win');
    this.loser = new Show(this.los, w === 0 ? -1 : 1, 'lose');
    this.fx = new FX();
    this.humanWon = p.mode === 'versus' || w === 0;
    this.thumb = STAGE[p.stage] && STAGE[p.stage].thumb;
    settings.stats.wins[this.win.id] = (settings.stats.wins[this.win.id] || 0) + 1; save();
    const t = Game.session.tourney, items = [];
    if (p.mode === 'tournament') {
      if (w === 0) {
        t.frames += r.stats.frames; t.perfects += r.stats.perfect[0]; t.maxCombo = Math.max(t.maxCombo, r.stats.maxCombo[0]); t.idx++;
        items.push({ label: t.idx >= t.order.length ? 'VER A PREMIAÇÃO' : 'PRÓXIMA LUTA', onOk: () => Game.go('tourney') });
      } else {
        items.push({ label: 'TENTAR DE NOVO', onOk: () => Game.go('fight') }, { label: 'DESISTIR DO TORNEIO', onOk: () => Game.go('title', { menu: true }) });
      }
    } else {
      items.push({ label: 'JOGAR NOVAMENTE', onOk: () => Game.go('fight') }, { label: 'TROCAR PERSONAGENS', onOk: () => Game.go('select', { mode: p.mode }) }, { label: 'MENU PRINCIPAL', onOk: () => Game.go('title', { menu: true }) });
    }
    this.menu = new Menu(items);
    Audio.playMusic('victory');
    Audio.sfx(this.humanWon ? 'win' : 'lose');
  },
  update() {
    this.t++;
    this.show.update(false); this.loser.update(false); this.fx.update();
    if (this.humanWon && this.t % 26 === 1 && this.t < 400) this.fx.confetti(200 + Math.random() * 880, -10, 12);
    if (this.t > 40) this.menu.update();
  },
  draw(ctx) {
    const t = this.t, p = this.p, r = p.result, w = r.winner, c = this.win;
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
    if (this.thumb) { ctx.globalAlpha = 0.3; ctx.drawImage(this.thumb, 0, 0, W, H); ctx.globalAlpha = 1; }
    // raios na cor do vencedor
    ctx.save(); ctx.translate(330, 420); ctx.rotate(t * 0.004); ctx.globalAlpha = 0.22; ctx.fillStyle = c.color;
    for (let i = 0; i < 14; i++) { ctx.rotate(TAU / 14); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(900, -70); ctx.lineTo(900, 70); ctx.fill(); }
    ctx.restore();
    const v = ctx.createLinearGradient(0, 0, W, 0); v.addColorStop(0, 'rgba(8,11,24,0)'); v.addColorStop(0.55, 'rgba(8,11,24,0.86)'); v.addColorStop(1, 'rgba(8,11,24,0.96)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    this.fx.draw(ctx, false);
    this.show.draw(ctx, 330, 650, 1.9, t);
    ctx.save(); ctx.globalAlpha = 0.9; this.loser.draw(ctx, 96, 668, 0.7, t); ctx.restore();

    const k = easeOutBack(clamp(t / 16, 0, 1));
    const head = p.mode === 'versus' ? (w === 0 ? 'JOGADOR 1 VENCEU!' : 'JOGADOR 2 VENCEU!') : this.humanWon ? 'VITÓRIA!' : 'DERROTA…';
    ctx.save(); ctx.translate(660, 86); ctx.scale(k, k);
    text(ctx, head, 0, 0, 62, this.humanWon ? COL.yellow : COL.red, { stroke: '#0b1020', sw: 12, maxW: 580 });
    ctx.restore();
    text(ctx, c.name.toUpperCase(), 662, 160, 46, '#fff', { stroke: '#0b1020', sw: 8 });
    text(ctx, c.title, 664, 198, 18, c.color);
    if (r.fatal) text(ctx, 'FINALIZAÇÃO · ' + r.fatal, 1230, 198, 17, COL.yellow, { align: 'right', stroke: '#0b1020', sw: 5, maxW: 330 });
    // frase personalizada
    panel(ctx, 660, 222, 570, 84, { accent: c.color });
    wrap(ctx, '“' + c.quote + '”', 690, 252, 520, 19, '#fff', 26);
    // resultado
    panel(ctx, 660, 322, 570, 148, {});
    const st = r.stats, secs = Math.round(st.frames / 60);
    const rows = [
      ['Placar de rounds', `${r.wins[0]}  ×  ${r.wins[1]}`],
      ['Maior combo de ' + c.name, st.maxCombo[w] + ' hits'],
      ['Dano causado', st.dmg[w] + '  ×  ' + st.dmg[1 - w]],
      ['Rounds perfeitos · Supremos', st.perfect[w] + '  ·  ' + st.supers[w]],
      ['Tempo de luta', Math.floor(secs / 60) + 'min ' + String(secs % 60).padStart(2, '0') + 's'],
    ];
    rows.forEach((row, i) => { body(ctx, row[0], 684, 346 + i * 25, 15, '#b9c2dc'); body(ctx, row[1], 1206, 346 + i * 25, 15, '#fff', { align: 'right', weight: 800 }); });
    body(ctx, `Derrotado: ${this.los.name}`, 96, 700, 13, '#c9d1ea', { align: 'center' });
    if (t > 40) this.menu.draw(ctx, 670, 490, 540, { ih: 58, size: 25 });
    this.fx.draw(ctx, true);
  },
};
