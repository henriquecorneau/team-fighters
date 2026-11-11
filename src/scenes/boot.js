// Tela de carregamento: gera retratos e pré-visualizações dos cenários aos poucos, com barra de progresso.
import { W, H, COL } from '../core/config.js';
import { Game } from '../core/game.js';
import { buildPortraits } from '../characters/index.js';
import { STAGES } from '../stages/index.js';
import { text, body, logo } from '../render/ui.js';

export default {
  enter() { this.i = -2; this.total = STAGES.length + 1; this.done = 0; this.msg = 'Preparando lutadores…'; },
  update() {
    this.i++;
    if (this.i < 0) return;                       // deixa a tela aparecer antes do trabalho pesado
    if (this.i === 0) { buildPortraits(); this.done = 1; this.msg = 'Montando cenários…'; return; }
    const s = STAGES[this.i - 1];
    if (s) { s.makeThumb(); this.done++; this.msg = 'Cenário: ' + s.name; return; }
    if (this.i > STAGES.length + 4) Game.go('title', {}, true);
  },
  draw(ctx) {
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
    logo(ctx, W / 2 - 20, 300, 0.9, Game.t);
    const p = this.done / this.total;
    ctx.fillStyle = '#1a2142'; ctx.beginPath(); ctx.roundRect(W / 2 - 240, 470, 480, 16, 8); ctx.fill();
    ctx.fillStyle = COL.yellow; ctx.beginPath(); ctx.roundRect(W / 2 - 240, 470, Math.max(16, 480 * p), 16, 8); ctx.fill();
    body(ctx, this.msg, W / 2, 510, 16, '#c9d1ea', { align: 'center' });
    text(ctx, 'CARREGANDO', W / 2, 446, 16, '#fff', { align: 'center' });
  },
};
