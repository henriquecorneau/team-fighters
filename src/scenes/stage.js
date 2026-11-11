// Seleção de cenário com pré-visualização de cada arena.
import { W, H, COL } from '../core/config.js';
import { Game } from '../core/game.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { STAGES } from '../stages/index.js';
import { text, body, menuBg, title, hint } from '../render/ui.js';
import { randi } from '../core/util.js';

const TW = 372, TH = 209, GX = 22, X0 = (W - (3 * TW + 2 * GX)) / 2, Y0 = 112, RH = TH + 62;
const rect = (i) => ({ x: X0 + (i % 3) * (TW + GX), y: Y0 + Math.floor(i / 3) * RH });

export default {
  enter() { this.t = 0; this.sel = Math.max(0, STAGES.findIndex((s) => s.id === Game.session.stage)); this.doneT = 0; },
  choose(i) {
    if (this.doneT) return;
    if (i === 6) i = randi(0, 5);
    this.sel = i; Game.session.stage = STAGES[i].id;
    Audio.sfx('pick'); this.doneT = 26;
  },
  update() {
    this.t++;
    if (this.doneT) { if (--this.doneT <= 0) Game.go('fight'); return; }
    for (const e of Input.menu) {
      const s = this.sel;
      if (e.act === 'left') this.sel = s === 6 ? 6 : Math.floor(s / 3) * 3 + ((s % 3) + 2) % 3;
      else if (e.act === 'right') this.sel = s === 6 ? 6 : Math.floor(s / 3) * 3 + ((s % 3) + 1) % 3;
      else if (e.act === 'up') this.sel = s === 6 ? 4 : s >= 3 ? s - 3 : 6;
      else if (e.act === 'down') this.sel = s === 6 ? 1 : s < 3 ? s + 3 : 6;
      else if (e.act === 'ok') { this.choose(this.sel); return; }
      else if (e.act === 'back' || e.act === 'esc') { Audio.sfx('ui_back'); Game.go('select', { mode: Game.session.mode }); return; }
      if (this.sel !== s) Audio.sfx('ui_move');
    }
    const m = Input.mouse;
    for (let i = 0; i < 6; i++) {
      const r = rect(i);
      if (m.x >= r.x && m.x <= r.x + TW && m.y >= r.y && m.y <= r.y + TH + 40) {
        if (m.moved && this.sel !== i) { this.sel = i; Audio.sfx('ui_move'); }
        if (m.click) this.choose(i);
      }
    }
    if (m.x > W / 2 - 150 && m.x < W / 2 + 150 && m.y > 652 && m.y < 684) { if (m.moved && this.sel !== 6) this.sel = 6; if (m.click) this.choose(6); }
  },
  draw(ctx) {
    menuBg(ctx, this.t, '#1f6a4a');
    title(ctx, 'ESCOLHA O CENÁRIO', this.sel < 6 ? STAGES[this.sel].desc : 'Sorteia uma das seis arenas.');
    STAGES.forEach((s, i) => {
      const r = rect(i), sel = i === this.sel, k = sel ? 1 + Math.sin(this.t * 0.12) * 0.012 : 1;
      ctx.save(); ctx.translate(r.x + TW / 2, r.y + TH / 2); ctx.scale(k, k); ctx.translate(-TW / 2, -TH / 2);
      ctx.fillStyle = sel ? COL.yellow : '#0a0d1a'; ctx.beginPath(); ctx.roundRect(-6, -6, TW + 12, TH + 50, 12); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, TW, TH, 8); ctx.clip();
      if (s.thumb) ctx.drawImage(s.thumb, 0, 0, TW, TH);
      if (!sel) { ctx.fillStyle = 'rgba(8,11,24,0.42)'; ctx.fillRect(0, 0, TW, TH); }
      ctx.restore();
      if (i === 0) { ctx.fillStyle = COL.red; ctx.beginPath(); ctx.roundRect(8, 8, 150, 24, 12); ctx.fill(); body(ctx, '★ BASEADO NA FOTO REAL', 83, 20.5, 10.5, '#fff', { align: 'center', weight: 900 }); }
      text(ctx, s.name, TW / 2, TH + 22, 19, sel ? '#0b1020' : '#fff', { align: 'center', maxW: TW - 20 });
      ctx.restore();
    });
    const rs = this.sel === 6;
    ctx.fillStyle = rs ? COL.yellow : 'rgba(10,14,30,0.8)'; ctx.beginPath(); ctx.roundRect(W / 2 - 150, 652, 300, 32, 16); ctx.fill();
    text(ctx, '🎲 CENÁRIO ALEATÓRIO', W / 2, 669, 16, rs ? '#0b1020' : '#fff', { align: 'center', italic: false });
    hint(ctx, 'Setas / WASD: escolher   ·   Enter / Espaço / J: lutar!   ·   Esc: voltar');
  },
};
