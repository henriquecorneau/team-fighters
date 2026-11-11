// Utilitários compartilhados pelas telas: lutador de vitrine animado e tabela de comandos.
import { Fighter } from '../combat/fighter.js';
import { GROUND, COL } from '../core/config.js';
import { Input } from '../core/input.js';
import { text, body, panel } from '../render/ui.js';
import { pick } from '../core/util.js';

const LOOPS = ['idle', 'win', 'relax', 'lose', 'crouch', 'walk'];

// Lutador animado fora de uma partida (menus, seleção, vitória).
export class Show {
  constructor(char, facing = 1, base = 'idle') {
    this.f = new Fighter(char, 0);
    this.f.facing = facing; this.f.x = 0; this.t = Math.floor(Math.random() * 60); this.base = base; this.left = 0;
    this.set(base, 0);
  }
  set(name, blend = 6) {
    const f = this.f;
    this.mode = name;
    if (LOOPS.includes(name)) {
      f.state = name === 'win' ? 'win' : name === 'lose' ? 'lose' : 'idle'; f.exprOverride = null;
      f.setAnim(name, blend); this.left = 0;
    } else {
      const mv = f.char.moves[name];
      if (!mv || !mv.anim) return this.set('heavy', blend);
      f.state = 'idle'; f.exprOverride = 'a';
      f.anim = null; f.setAnim(mv.anim, blend); this.left = mv.anim.dur + 16;
    }
  }
  update(auto) {
    const f = this.f;
    this.t++;
    f.x = 0; f.cx = -f.facing * (f.char.compX || 56); f.cy = f.char.compY || 250;
    if (this.left > 0 && --this.left <= 0) this.set(this.base);
    else if (auto && this.mode === this.base && this.t % 140 === 100) this.set(pick(['light1', 'light2', 'heavy', 'light3', 'sp1', 'sp2']));
    f.tickAnim();
  }
  draw(ctx, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s); ctx.translate(0, -GROUND);
    this.f.drawShadow(ctx);
    this.f.draw(ctx, t);
    ctx.restore();
  }
}

// Tabela de comandos de um personagem, com as teclas/botões do jogador.
export function drawMoves(ctx, char, devs, x, y, w, color = COL.red, compact = false, withFatal = false) {
  const L = (a) => Input.actionLabel(a, devs);
  const rows = [
    ['PODER 1', char.info.sp1.name, L('sp1'), char.info.sp1.desc, '20'],
    ['PODER 2', char.info.sp2.name, L('sp2'), char.info.sp2.desc, '30'],
    ['SUPREMO', char.info.super.name, L('super'), char.info.super.desc, '100'],
  ];
  if (withFatal && char.fatal) rows.push(['FINALIZAÇÃO (ao vencer a luta)', char.fatal.name, char.fatal.cmd.map((k) => ({ f: 'frente', b: 'trás', d: '↓' }[k] || L(k))).join(' › '), char.fatal.desc, '']);
  let yy = y;
  for (const r of rows) {
    panel(ctx, x, yy, w, compact ? 40 : 58, { r: 8, accent: r[0] === 'SUPREMO' ? COL.yellow : color, border: null, fill: 'rgba(10,14,30,0.82)' });
    body(ctx, r[0], x + 18, yy + 13, 11, r[0] === 'SUPREMO' ? COL.yellow : '#9fb0d8', { weight: 800 });
    text(ctx, r[1], x + 18, yy + (compact ? 28 : 31), compact ? 15 : 17, '#fff', { maxW: w - (r[4] === '' ? 276 : 110) });
    if (!compact) body(ctx, r[3], x + 18, yy + 48, 11.5, '#b9c2dc', { maxW: w - 30 });
    const kw = r[4] === '' ? 236 : 74;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x + w - kw - 10, yy + 7, kw, 24, 6); ctx.fill();
    body(ctx, r[2], x + w - kw / 2 - 10, yy + 19.5, 13, '#0b1020', { align: 'center', weight: 800, maxW: kw - 6 });
    yy += compact ? 45 : 64;
  }
  return yy;
}

export function drawBasics(ctx, devs, x, y, w) {
  const L = (a) => Input.actionLabel(a, devs);
  const rows = [
    ['Andar', L('left') + '  ' + L('right')], ['Pular / Agachar', L('up') + '  ' + L('down')],
    ['Ataque leve (3x = combo)', L('light')], ['Ataque forte', L('heavy')], ['Defesa (ou segure para trás)', L('block')],
    ['Corrida / Esquiva', '2x frente / 2x trás'], ['Rasteira', 'Agachar + forte'],
  ];
  let yy = y;
  for (const r of rows) {
    body(ctx, r[0], x, yy, 13.5, '#c9d1ea');
    body(ctx, r[1], x + w, yy, 13.5, '#fff', { align: 'right', weight: 800 });
    yy += 22;
  }
  return yy;
}
