// Kit de interface: tipografia, painéis, fundo animado dos menus e lista de opções (teclado, gamepad e mouse).
import { W, H, COL, FONT_D, FONT_B } from '../core/config.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { TAU } from '../core/util.js';

export function text(ctx, str, x, y, size, color = '#fff', o = {}) {
  ctx.save();
  ctx.font = `${o.italic === false ? '' : 'italic '}${o.weight || 900} ${size}px ${o.font || FONT_D}`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.maxW) { const w = ctx.measureText(str).width; if (w > o.maxW) { ctx.translate(x, y); ctx.scale(o.maxW / w, 1); ctx.translate(-x, -y); } }
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.sw || size * 0.18; ctx.strokeStyle = o.stroke; ctx.strokeText(str, x, y); }
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(str, x + (o.sx || 3), y + (o.sy || 3)); }
  ctx.fillStyle = color; ctx.fillText(str, x, y);
  ctx.restore();
}
export const body = (ctx, str, x, y, size, color = '#dfe4f2', o = {}) => text(ctx, str, x, y, size, color, { font: FONT_B, italic: false, weight: 600, ...o });

// Quebra de linha simples para descrições.
export function wrap(ctx, str, x, y, maxW, size, color, lh = size * 1.35, o = {}) {
  ctx.save(); ctx.font = `600 ${size}px ${FONT_B}`;
  const words = str.split(' '); let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { body(ctx, line, x, yy, size, color, o); line = w; yy += lh; } else line = test;
  }
  if (line) body(ctx, line, x, yy, size, color, o);
  ctx.restore();
  return yy + lh;
}

export function panel(ctx, x, y, w, h, o = {}) {
  ctx.save();
  ctx.fillStyle = o.fill || 'rgba(10,14,30,0.86)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, o.r === undefined ? 12 : o.r); ctx.fill();
  if (o.border !== null) { ctx.strokeStyle = o.border || 'rgba(255,255,255,0.14)'; ctx.lineWidth = o.bw || 2; ctx.stroke(); }
  if (o.accent) { ctx.fillStyle = o.accent; ctx.beginPath(); ctx.roundRect(x, y, 7, h, [12, 0, 0, 12]); ctx.fill(); }
  ctx.restore();
}

// Fundo animado padrão dos menus.
export function menuBg(ctx, t, accent = COL.red) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0b1020'); g.addColorStop(0.6, '#141a36'); g.addColorStop(1, '#1d1030');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.5; ctx.fillStyle = accent;
  ctx.beginPath(); ctx.moveTo(W * 0.62, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(W * 0.4, H); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.16; ctx.fillStyle = '#000';
  for (let i = -2; i < 12; i++) { const x = ((t * 0.7) % 160) + i * 160; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 70, 0); ctx.lineTo(x - 150, H); ctx.lineTo(x - 220, H); ctx.fill(); }
  ctx.globalAlpha = 0.09; ctx.fillStyle = '#fff';
  for (let y = 20; y < H; y += 34) for (let x = 20 + ((y / 34) % 2) * 17; x < W; x += 34) ctx.fillRect(x, y, 2.5, 2.5);
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

export function title(ctx, str, sub) {
  ctx.save();
  ctx.fillStyle = COL.red; ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(560, 26); ctx.lineTo(520, 92); ctx.lineTo(0, 92); ctx.fill();
  ctx.fillStyle = '#0b1020'; ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(546, 32); ctx.lineTo(513, 86); ctx.lineTo(0, 86); ctx.fill();
  ctx.restore();
  text(ctx, str, 40, 60, 34, '#fff', { maxW: 440 });
  if (sub) body(ctx, sub, 580, 60, 17, '#c9d1ea', { maxW: 680 });
}

export function hint(ctx, str) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, H - 36, W, 36);
  body(ctx, str, W / 2, H - 18, 15, '#c9d1ea', { align: 'center' });
}

export function logo(ctx, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.transform(1, 0, -0.14, 1, 0, 0);
  ctx.fillStyle = COL.red; ctx.beginPath(); ctx.moveTo(-250, -84); ctx.lineTo(262, -84); ctx.lineTo(240, 6); ctx.lineTo(-272, 6); ctx.fill();
  ctx.fillStyle = '#0b1020'; ctx.beginPath(); ctx.moveTo(-160, 6); ctx.lineTo(318, 6); ctx.lineTo(300, 78); ctx.lineTo(-178, 78); ctx.fill();
  ctx.restore();
  text(ctx, 'TEAM', x - 6 * s, y - 36 * s, 104 * s, '#fff', { align: 'center', stroke: '#0b1020', sw: 12 * s });
  const g = ctx.createLinearGradient(0, y + 10 * s, 0, y + 74 * s); g.addColorStop(0, '#fff3a6'); g.addColorStop(0.55, COL.yellow); g.addColorStop(1, '#ff9d1f');
  text(ctx, 'FIGHTERS', x + 62 * s, y + 43 * s, 70 * s, g, { align: 'center', stroke: '#0b1020', sw: 10 * s });
  // faísca decorativa
  ctx.save(); ctx.translate(x + 268 * s, y - 80 * s); ctx.rotate(t * 0.02); ctx.fillStyle = COL.yellow;
  ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, r = (i % 2 ? 7 : 24) * s; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill();
  ctx.restore();
}

// Lista de opções navegável.
export class Menu {
  constructor(items, o = {}) { this.items = items; this.o = o; this.sel = 0; this.t = 0; this.rects = []; while (this.sel < items.length - 1 && this.isOff(items[this.sel])) this.sel++; }
  move(d) {
    const n = this.items.length; let i = this.sel;
    for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (!this.isOff(this.items[i])) break; }
    if (i !== this.sel) { this.sel = i; Audio.sfx('ui_move'); }
  }
  isOff(it) { return it.header || (typeof it.disabled === 'function' ? it.disabled() : it.disabled); }
  update(devs) {
    this.t++;
    const it = this.items[this.sel];
    for (const e of Input.menu) {
      if (devs && !devs.includes(e.dev)) continue;
      if (e.act === 'up') this.move(-1);
      else if (e.act === 'down') this.move(1);
      else if (e.act === 'left' && it.onLeft) { it.onLeft(); Audio.sfx('ui_move'); }
      else if (e.act === 'right' && it.onRight) { it.onRight(); Audio.sfx('ui_move'); }
      else if (e.act === 'ok') { if (it.onOk) { Audio.sfx('ui_ok'); it.onOk(); } else if (it.onRight) { it.onRight(); Audio.sfx('ui_move'); } }
      else if ((e.act === 'back' || e.act === 'esc') && this.o.onBack) { Audio.sfx('ui_back'); this.o.onBack(); return; }
    }
    const m = Input.mouse;
    for (let i = 0; i < this.rects.length; i++) {
      const r = this.rects[i], item = this.items[i];
      if (!r || this.isOff(item)) continue;
      if (m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h) {
        if (m.moved && this.sel !== i) { this.sel = i; Audio.sfx('ui_move'); }
        if (m.click) {
          this.sel = i;
          if (item.onOk) { Audio.sfx('ui_ok'); item.onOk(); }
          else if (m.x < r.x + r.w * 0.6 && item.onLeft) { item.onLeft(); Audio.sfx('ui_move'); }
          else if (item.onRight) { item.onRight(); Audio.sfx('ui_move'); }
        }
      }
    }
  }
  draw(ctx, x, y, w, o = {}) {
    const ih = o.ih || 54, size = o.size || 26;
    this.rects.length = 0;
    let yy = y;
    this.items.forEach((it, i) => {
      if (it.header) { body(ctx, it.label, x + 4, yy + ih * 0.55, 14, COL.yellow, { weight: 800 }); this.rects.push(null); yy += ih * 0.8; return; }
      const sel = i === this.sel, off = this.isOff(it);
      this.rects.push({ x, y: yy, w, h: ih - 6 });
      ctx.save();
      const push = sel ? 14 + Math.sin(this.t * 0.15) * 3 : 0;
      ctx.translate(push, 0);
      ctx.fillStyle = sel ? (o.color || COL.red) : 'rgba(10,14,30,0.72)';
      ctx.beginPath(); ctx.moveTo(x + 14, yy); ctx.lineTo(x + w, yy); ctx.lineTo(x + w - 14, yy + ih - 6); ctx.lineTo(x, yy + ih - 6); ctx.closePath(); ctx.fill();
      if (sel) { ctx.fillStyle = COL.yellow; ctx.beginPath(); ctx.moveTo(x + 14, yy); ctx.lineTo(x + 24, yy); ctx.lineTo(x + 10, yy + ih - 6); ctx.lineTo(x, yy + ih - 6); ctx.fill(); }
      const label = typeof it.label === 'function' ? it.label() : it.label;
      text(ctx, label, x + 34, yy + (ih - 6) / 2 + 1, size, off ? '#6a7188' : '#fff', { maxW: it.value ? w * 0.5 : w - 60 });
      if (it.value) {
        const v = it.value();
        text(ctx, (it.onLeft && sel ? '◀ ' : '') + v + (it.onRight && sel ? ' ▶' : ''), x + w - 30, yy + (ih - 6) / 2 + 1, size * 0.82, sel ? '#fff' : COL.yellow, { align: 'right', maxW: w * 0.46 });
      }
      ctx.restore();
      yy += ih;
    });
    return yy;
  }
}

// Barra de valor 0..1 em texto (para volumes).
export const pct = (v) => Math.round(v * 100) + '%';
