// HUD de combate: barras de vida/guarda/energia, cronômetro, rounds, combos e locutor.
import { W, H, COL, MAX_HP, MAX_EN, MAX_GUARD } from '../core/config.js';
import { clamp, TAU, easeOutBack } from '../core/util.js';
import { text, body } from './ui.js';

function para(ctx, x0, x1, y, h, sl) {
  ctx.beginPath(); ctx.moveTo(x0 + sl, y); ctx.lineTo(x1 + sl, y); ctx.lineTo(x1, y + h); ctx.lineTo(x0, y + h); ctx.closePath();
}

function side(ctx, f, m, tag) {
  // desenhado para o lado esquerdo; o lado direito é espelhado pelo chamador
  const x0 = 104, x1 = 588, y = 30, h = 30, sl = 12;
  ctx.fillStyle = '#0a0d1a'; para(ctx, x0 - 6, x1 + 6, y - 5, h + 10, sl + 4); ctx.fill();
  ctx.fillStyle = '#3a1016'; para(ctx, x0, x1, y, h, sl); ctx.fill();
  const lag = clamp(f.hpLag / MAX_HP, 0, 1), hp = clamp(f.hp / MAX_HP, 0, 1), L = x1 - x0;
  ctx.save(); para(ctx, x0, x1, y, h, sl); ctx.clip();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x1 - L * lag - 2, y, L * lag + sl + 4, h);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (hp > 0.3) { g.addColorStop(0, '#fff27a'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, '#f29a1f'); }
  else { g.addColorStop(0, '#ff9a7a'); g.addColorStop(1, '#e3212f'); }
  ctx.fillStyle = g; ctx.fillRect(x1 - L * hp, y, L * hp + sl + 4, h);
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x0, y + 3, L + sl, 5);
  ctx.restore();
  // guarda
  ctx.fillStyle = '#0a0d1a'; para(ctx, x0 + 150, x1 - 4, y + h + 6, 9, 4); ctx.fill();
  const gd = clamp(f.guard / MAX_GUARD, 0, 1);
  ctx.fillStyle = f.state === 'dizzy' ? '#ff4455' : '#3fe0ff'; para(ctx, x1 - 6 - (L - 156) * gd, x1 - 6, y + h + 8, 5, 2); ctx.fill();
  // retrato
  ctx.fillStyle = '#0a0d1a'; ctx.beginPath(); ctx.arc(56, 56, 46, 0, TAU); ctx.fill();
  ctx.fillStyle = f.char.color; ctx.beginPath(); ctx.arc(56, 56, 42, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(56, 56, 38, 0, TAU); ctx.clip();
  ctx.fillStyle = '#141a36'; ctx.fillRect(10, 10, 92, 92);
  if (f.char.portrait) ctx.drawImage(f.char.portrait, 14, 16, 88, 88);
  if (f.flash > 0) { ctx.fillStyle = 'rgba(255,60,60,0.5)'; ctx.fillRect(10, 10, 92, 92); }
  ctx.restore();
  // marcadores de round
  for (let i = 0; i < Math.min(m.roundsToWin, 3); i++) {
    const cx = x1 - 14 - i * 26, cy = y + h + 28;
    ctx.fillStyle = '#0a0d1a'; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, TAU); ctx.fill();
    ctx.fillStyle = i < f.wins ? COL.yellow : '#2a3150'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fill();
  }
  // energia
  const ex0 = 110, ex1 = 400, ey = 98, eh = 13;
  ctx.fillStyle = '#0a0d1a'; para(ctx, ex0 - 5, ex1 + 5, ey - 4, eh + 8, 10); ctx.fill();
  ctx.fillStyle = f.denyT > 0 && f.denyT % 6 < 3 ? '#7a1420' : '#161d38'; para(ctx, ex0, ex1, ey, eh, 8); ctx.fill();
  const en = clamp(f.en / MAX_EN, 0, 1), full = en >= 1;
  ctx.save(); para(ctx, ex0, ex1, ey, eh, 8); ctx.clip();
  const eg = ctx.createLinearGradient(ex0, 0, ex1, 0);
  if (full) { const p = 0.5 + 0.5 * Math.sin(m.t * 0.25); eg.addColorStop(0, '#ffd23f'); eg.addColorStop(1, p > 0.5 ? '#fff' : '#ff8a3c'); }
  else { eg.addColorStop(0, '#2a7bff'); eg.addColorStop(1, '#3fe0ff'); }
  ctx.fillStyle = eg; ctx.fillRect(ex0, ey, (ex1 - ex0) * en + 8, eh);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(ex0, ey + 2, ex1 - ex0 + 8, 4);
  ctx.fillStyle = '#0a0d1a'; for (let i = 1; i < 5; i++) ctx.fillRect(ex0 + (ex1 - ex0) * i / 5 + 4, ey, 3, eh);
  ctx.restore();
}

export function drawHUD(ctx, m, labels = ['J1', 'J2']) {
  const [a, b] = m.f;
  ctx.save(); side(ctx, a, m); ctx.restore();
  ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); side(ctx, b, m); ctx.restore();
  // textos (não espelhados)
  text(ctx, a.char.name.toUpperCase(), 118, 80, 20, '#fff', { stroke: '#0a0d1a', sw: 5 });
  text(ctx, b.char.name.toUpperCase(), W - 118, 80, 20, '#fff', { align: 'right', stroke: '#0a0d1a', sw: 5 });
  body(ctx, labels[0], 56, 113, 12, COL.p1, { align: 'center', weight: 800, maxW: 98 });
  body(ctx, labels[1], W - 56, 113, 12, COL.p2, { align: 'center', weight: 800, maxW: 98 });
  for (const [f, x, al] of [[a, 62, 'left'], [b, W - 62, 'right']]) {
    const full = f.en >= MAX_EN;
    text(ctx, full ? 'SUPREMO PRONTO!' : 'ENERGIA', al === 'left' ? 420 : W - 420, 105, 13, full ? (m.t % 20 < 10 ? COL.yellow : '#fff') : '#9fb0d8', { align: al, stroke: '#0a0d1a', sw: 4 });
    if (f.shield) text(ctx, 'ESCUDO x' + f.shield.hits, al === 'left' ? 116 : W - 116, 130, 14, '#b8ff9a', { align: al, stroke: '#0a0d1a', sw: 4 });
  }
  // cronômetro
  ctx.fillStyle = '#0a0d1a'; ctx.beginPath(); ctx.moveTo(596, 14); ctx.lineTo(684, 14); ctx.lineTo(700, 50); ctx.lineTo(684, 86); ctx.lineTo(596, 86); ctx.lineTo(580, 50); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = COL.red; ctx.lineWidth = 3; ctx.stroke();
  const secs = m.timer === Infinity ? '∞' : String(Math.max(0, Math.ceil(m.timer / 60)));
  const low = m.timer !== Infinity && m.timer <= 600;
  text(ctx, secs, 640, 51, secs === '∞' ? 50 : 44, low ? (m.t % 30 < 15 ? COL.red : '#fff') : '#fff', { align: 'center', italic: false });
  if (!m.training) body(ctx, m.isFinalRound() ? 'ROUND FINAL' : 'ROUND ' + m.round, 640, 100, 12, '#c9d1ea', { align: 'center', weight: 800 });

  // combos
  for (const [f, x, al] of [[a, 60, 'left'], [b, W - 60, 'right']]) {
    if (f.comboShow > 0 && f.combo >= 2) {
      const k = Math.min(1, f.comboShow / 12), pop = 1 + Math.max(0, (f.comboShow - 88) / 12) * 0.3;
      ctx.save(); ctx.globalAlpha = k; ctx.translate(x, 210); ctx.scale(pop, pop);
      text(ctx, f.combo + ' HITS', 0, 0, 46, COL.yellow, { align: al, stroke: '#0a0d1a', sw: 9 });
      text(ctx, f.comboDmg + ' de dano', 0, 38, 18, '#fff', { align: al, stroke: '#0a0d1a', sw: 5 });
      ctx.restore();
    }
  }
  // locutor
  if (m.banner) {
    const bn = m.banner, k = easeOutBack(clamp(bn.t / 10, 0, 1)), out = clamp((bn.dur - bn.t) / 8, 0, 1);
    ctx.save(); ctx.globalAlpha = out; ctx.translate(W / 2, 300); ctx.scale(0.4 + k * 0.6, 0.4 + k * 0.6);
    ctx.fillStyle = 'rgba(10,13,26,0.6)'; ctx.beginPath(); ctx.moveTo(-W, -62); ctx.lineTo(W, -78); ctx.lineTo(W, 62); ctx.lineTo(-W, 78); ctx.fill();
    text(ctx, bn.text, 0, 0, bn.text.length > 12 ? 78 : 112, bn.color, { align: 'center', stroke: '#0a0d1a', sw: 16, maxW: 1100 });
    if (bn.sub) text(ctx, bn.sub, 0, 82, 24, '#fff', { align: 'center', stroke: '#0a0d1a', sw: 6 });
    ctx.restore();
  }
  if (m.phase === 'finish' && m.fin && m.fin.human) {
    // o comando é secreto: só aparece o tempo restante
    const fn = m.fin, k = clamp(1 - m.pt / fn.T, 0, 1), w = 360, x0 = W / 2 - w / 2, y = 640;
    ctx.fillStyle = 'rgba(10,13,26,0.88)'; ctx.beginPath(); ctx.roundRect(x0 - 20, y - 34, w + 40, 60, 12); ctx.fill();
    ctx.strokeStyle = COL.red; ctx.lineWidth = 3; ctx.stroke();
    text(ctx, 'EXECUTE A FINALIZAÇÃO', W / 2, y - 14, 17, m.t % 30 < 15 ? COL.yellow : '#fff', { align: 'center' });
    ctx.fillStyle = '#2a3150'; ctx.fillRect(x0, y + 6, w, 8); ctx.fillStyle = k < 0.3 ? COL.red : COL.cyan; ctx.fillRect(x0, y + 6, w * k, 8);
  }
  if (m.training) {
    ctx.fillStyle = 'rgba(10,13,26,0.8)'; ctx.beginPath(); ctx.roundRect(W / 2 - 250, 122, 500, 34, 8); ctx.fill();
    body(ctx, `Último golpe: ${a.lastDmg}   ·   Combo: ${a.combo} hits / ${a.comboDmg} de dano   ·   ESC: opções`, W / 2, 139, 14, '#dfe4f2', { align: 'center' });
  }
}
