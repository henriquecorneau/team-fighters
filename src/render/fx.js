// Sistema de partículas e efeitos de impacto.
import { TAU, rand, pick } from '../core/util.js';
import { FONT_D } from '../core/config.js';

export class FX {
  constructor() { this.p = []; }
  clear() { this.p.length = 0; }
  add(o) {
    o.max = o.life; o.g = o.g || 0; o.drag = o.drag === undefined ? 1 : o.drag; o.vx = o.vx || 0; o.vy = o.vy || 0;
    if (this.p.length < 700) this.p.push(o);
    return o;
  }

  update() {
    const p = this.p;
    for (let i = p.length - 1; i >= 0; i--) {
      const q = p[i];
      if (q.delay > 0) { q.delay--; continue; }
      q.life--;
      if (q.life <= 0) { p[i] = p[p.length - 1]; p.pop(); continue; }
      q.x += q.vx; q.y += q.vy; q.vy += q.g; q.vx *= q.drag; q.vy *= q.drag;
      if (q.vr) q.rot = (q.rot || 0) + q.vr;
      if (q.floor && q.y > q.floor) { q.y = q.floor; q.vy *= -0.4; q.vx *= 0.7; }
    }
  }

  draw(ctx, front) {
    for (const q of this.p) {
      if (q.delay > 0 || !!q.front !== !!front) continue;
      const k = q.life / q.max;
      ctx.globalAlpha = Math.min(1, k * (q.fade || 1.6));
      switch (q.type) {
        case 'spark':
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = q.color; ctx.lineWidth = q.size * (0.4 + k); ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 2.4, q.y - q.vy * 2.4); ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
          break;
        case 'dot':
          ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(0.3, q.size * (q.grow ? 1 + (1 - k) * q.grow : k)), 0, TAU); ctx.fill();
          break;
        case 'glow':
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(0.3, q.size * k), 0, TAU); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          break;
        case 'ring':
          ctx.strokeStyle = q.color; ctx.lineWidth = Math.max(0.5, q.w * k);
          ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r0 + (q.r1 - q.r0) * (1 - k * k), (q.r0 + (q.r1 - q.r0) * (1 - k * k)) * (q.squash || 1), 0, 0, TAU); ctx.stroke();
          break;
        case 'flash': {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = q.color;
          const r = q.size * (0.4 + k * 0.6), n = q.pts || 4;
          ctx.beginPath();
          for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU + (q.rot || 0); const rr = i % 2 ? r * 0.22 : r; ctx.lineTo(q.x + Math.cos(a) * rr, q.y + Math.sin(a) * rr); }
          ctx.closePath(); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          break;
        }
        case 'smoke':
          ctx.globalAlpha = k * (q.alpha || 0.5);
          ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1 + (1 - k) * 1.6), 0, TAU); ctx.fill();
          break;
        case 'sq':
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot || 0);
          ctx.fillStyle = q.color; ctx.fillRect(-q.size / 2, -q.size / 2, q.size, q.size * (q.ratio || 1)); ctx.restore();
          break;
        case 'leaf':
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot || 0);
          ctx.fillStyle = q.color; ctx.beginPath(); ctx.ellipse(0, 0, q.size, q.size * 0.45, 0, 0, TAU); ctx.fill(); ctx.restore();
          break;
        case 'star': {
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot || 0);
          ctx.fillStyle = q.color; ctx.strokeStyle = '#3a2a00'; ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2; const rr = i % 2 ? q.size * 0.45 : q.size; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
          ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
          break;
        }
        case 'text': {
          const pop = Math.min(1, (q.max - q.life) / 5);
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot || 0); ctx.scale(0.5 + pop * 0.5, 0.5 + pop * 0.5);
          ctx.font = `italic 900 ${q.size}px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round'; ctx.lineWidth = q.size * 0.22; ctx.strokeStyle = q.stroke || '#14101c'; ctx.strokeText(q.str, 0, 0);
          ctx.fillStyle = q.color; ctx.fillText(q.str, 0, 0); ctx.restore();
          break;
        }
        case 'line':
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = q.color; ctx.lineWidth = q.size * k; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x2, q.y2); ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
          break;
      }
    }
    ctx.globalAlpha = 1;
  }

  // ----- efeitos compostos -----
  burst(x, y, n, color, speed = 8, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = o.arc ? o.dir + rand(-o.arc, o.arc) : rand(TAU), v = rand(speed * 0.35, speed);
      this.add({ type: o.type || 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.g || 0.25, drag: o.drag || 0.94, life: rand(10, 22) * (o.life || 1), size: o.size || 3, color: Array.isArray(color) ? pick(color) : color, rot: rand(TAU), vr: rand(-0.3, 0.3), floor: o.floor, front: o.front });
    }
  }

  hit(x, y, power = 1, color = '#ffd23f') {
    this.add({ type: 'flash', x, y, life: 9, size: 46 * power, color: '#ffffff', rot: rand(TAU), pts: 4, front: true });
    this.add({ type: 'flash', x, y, life: 12, size: 70 * power, color, rot: rand(TAU), pts: 6, front: true });
    this.add({ type: 'ring', x, y, life: 14, r0: 8, r1: 60 * power, w: 7, color: '#fff', front: true });
    this.burst(x, y, Math.round(9 * power), [color, '#fff', '#ff8a3c'], 13 * power, { front: true });
  }

  block(x, y) {
    this.add({ type: 'ring', x, y, life: 12, r0: 10, r1: 44, w: 5, color: '#9fe8ff', front: true });
    this.add({ type: 'flash', x, y, life: 8, size: 34, color: '#bff2ff', rot: rand(TAU), front: true });
    this.burst(x, y, 6, ['#9fe8ff', '#fff'], 8, { front: true });
  }

  dust(x, y, dir = 0, n = 5) {
    for (let i = 0; i < n; i++) this.add({ type: 'smoke', x: x + rand(-14, 14), y: y - rand(0, 8), vx: dir * rand(1, 3.5) + rand(-0.8, 0.8), vy: -rand(0.2, 1.2), drag: 0.92, life: rand(16, 28), size: rand(6, 11), color: '#d9d2c4', alpha: 0.45 });
  }

  text(x, y, str, color = '#fff', size = 30, o = {}) {
    this.add({ type: 'text', x, y, vy: o.vy === undefined ? -1.1 : o.vy, vx: o.vx || 0, drag: 0.95, life: o.life || 44, size, color, str, rot: o.rot || 0, stroke: o.stroke, front: true, fade: 3 });
  }

  explosion(x, y, s = 1, colors = ['#fff', '#ffd23f', '#ff8a3c', '#e3212f']) {
    this.add({ type: 'flash', x, y, life: 16, size: 150 * s, color: '#fff', pts: 8, rot: rand(TAU), front: true });
    this.add({ type: 'ring', x, y, life: 22, r0: 20, r1: 190 * s, w: 12, color: colors[1], front: true });
    this.add({ type: 'ring', x, y, life: 30, r0: 10, r1: 260 * s, w: 6, color: '#fff', front: true });
    this.burst(x, y, Math.round(26 * s), colors, 18 * s, { front: true, life: 1.4, size: 4 });
    for (let i = 0; i < 10 * s; i++) this.add({ type: 'smoke', x: x + rand(-40, 40) * s, y: y + rand(-40, 40) * s, vx: rand(-2, 2), vy: rand(-3, -0.5), drag: 0.95, life: rand(26, 46), size: rand(16, 30) * s, color: pick(['#555', '#777', '#3a3a3a']), alpha: 0.5 });
  }

  confetti(x, y, n = 40) {
    for (let i = 0; i < n; i++) this.add({ type: 'sq', x: x + rand(-30, 30), y, vx: rand(-7, 7), vy: rand(-13, -3), g: 0.28, drag: 0.98, life: rand(60, 130), size: rand(6, 11), ratio: 0.5, color: pick(['#e3212f', '#ffd23f', '#3fe0ff', '#fff', '#7dff8a']), rot: rand(TAU), vr: rand(-0.3, 0.3), front: true, fade: 4 });
  }
}
