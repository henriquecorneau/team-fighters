// RAMAS — Computadores & IA. Zoner técnico: visão computacional, hologramas e sobrecarga digital.
import { BASE_MOVES } from '../combat/moves.js';
import { S, A, atk, P } from '../render/poses.js';
import { Ent, cpose } from '../combat/entities.js';
import { drawOrb } from '../render/props.js';
import { GROUND, W, H, FONT_M } from '../core/config.js';
import { Audio } from '../core/audio.js';
import { rand, clamp, TAU } from '../core/util.js';

const idleA = P({ lean: -2, hy: 98, ff: [18, 0], fb: [-22, 0], af: [72, 58], ab: [-14, 28] });
const idleB = P({ lean: -1, hy: 95, ff: [18, 0], fb: [-22, 0], af: [77, 50], ab: [-10, 32] });
const coolB = P({ lean: -5, head: -6, hy: 99, ff: [14, 0], fb: [-14, 0], af: [42, 112], ab: [37, 117] });

function detBox(ctx, x, y, w, h, col, label, t) {
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineJoin = 'miter';
  const c = 22;
  ctx.beginPath();
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const px = x + (sx * w) / 2, py = y + (sy * h) / 2;
    ctx.moveTo(px - sx * c, py); ctx.lineTo(px, py); ctx.lineTo(px, py - sy * c);
  }
  ctx.stroke();
  ctx.globalAlpha = 0.14; ctx.fillStyle = col; ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.globalAlpha = 1;
  ctx.font = `bold 14px ${FONT_M}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  const tw = ctx.measureText(label).width + 10;
  ctx.fillStyle = col; ctx.fillRect(x - w / 2, y - h / 2 - 20, tw, 20);
  ctx.fillStyle = '#04121a'; ctx.fillText(label, x - w / 2 + 5, y - h / 2 - 3);
  ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
  const sy = y - h / 2 + ((t * 5) % h);
  ctx.beginPath(); ctx.moveTo(x - w / 2, sy); ctx.lineTo(x + w / 2, sy); ctx.stroke(); ctx.globalAlpha = 1;
}

function aiLock(f, opp, m) {
  Audio.sfx('boot');
  m.ents.push(new Ent({
    owner: f, x: opp.x, y: opp.y + 120, life: 72, hit: null, warn: true, lockT: 32, fireT: 46, persist: true, rehit: 40,
    tick(e, mm) {
      const o = mm.f[1 - e.owner.idx];
      if (e.t < 32) { e.x += (o.x - e.x) * 0.3; e.y += (o.y + (o.crouching ? 80 : 120) - e.y) * 0.3; }
      if (e.t === 32) Audio.sfx('ai_lock');
      if (e.t === 46) { e.hit = { dmg: 70, stun: 26, bstun: 13, push: 4, chip: 7, gdmg: 22, hit: 'hit_h', hs: 8 }; Audio.sfx('ai_fire'); mm.fx.burst(e.x, GROUND - e.y, 14, ['#3fe0ff', '#ff4fd8', '#fff'], 11, { type: 'sq', size: 6, front: true }); }
      if (e.t === 52) e.hit = null;
    },
    getBox(e) { return { x: e.x - 60, y: GROUND - e.y - 125, w: 120, h: 250 }; },
    draw(ctx, e, mm) {
      const locked = e.t >= 32, y = GROUND - e.y;
      const conf = locked ? '0.99' : (0.5 + e.t * 0.015).toFixed(2);
      detBox(ctx, e.x, y, 128, 256, locked ? '#ff4455' : '#3fe0ff', (locked ? 'ALVO ' : 'oponente ') + conf, mm.t);
      if (e.t >= 46 && e.t < 60) {
        const k = e.t < 52 ? 1 : (60 - e.t) / 8;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(63,224,255,${0.7 * k})`; ctx.fillRect(e.x - 44 * k, 0, 88 * k, y + 125);
        ctx.fillStyle = `rgba(255,255,255,${0.9 * k})`; ctx.fillRect(e.x - 16 * k, 0, 32 * k, y + 125);
        ctx.restore();
      }
    },
  }));
}

function overload(f, o, m) {
  Audio.sfx('digital');
  m.ents.push(new Ent({
    owner: f, x: f.x + f.facing * 64, y: 112, vx: f.facing * 12, w: 74, h: 224, life: 46, hits: 3, rehit: 7, clash: true, persist: false, dirn: f.facing,
    hit: { dmg: 25, stun: 18, bstun: 10, push: 9, chip: 4, gdmg: 12, hit: 'hit_l', gain: 1.5, hs: 4 },
    tick(e, mm) { if (e.t % 2 === 0) mm.fx.add({ type: 'sq', x: e.x + rand(-30, 30), y: GROUND - rand(10, 220), vx: -e.dirn * rand(1, 4), life: 14, size: rand(4, 9), color: Math.random() < 0.5 ? '#3fe0ff' : '#ff4fd8' }); },
    draw(ctx, e, mm) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i++) {
        const y = GROUND - 226 + i * 16, off = Math.sin(mm.t * 0.9 + i * 1.7) * 26, w = 40 + ((i * 37 + mm.t * 3) % 50);
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,79,216,0.75)' : 'rgba(63,224,255,0.75)';
        ctx.fillRect(e.x + off - w / 2, y, w, 11);
      }
      ctx.font = `bold 16px ${FONT_M}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      for (let i = 0; i < 6; i++) ctx.fillText(((mm.t + i * 3) >> 2) % 2 ? '1' : '0', e.x + Math.sin(i * 2.1 + mm.t * 0.3) * 24, GROUND - 30 - i * 36);
      ctx.restore();
    },
  }));
}

const NODES = Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU + 0.5; return [Math.cos(a) * 320, Math.sin(a) * 150 - 40]; });

// Corpo a corpo do Ramas: econômico, como quem aperta teclas — clique, chute lateral e "enter".
const clickW = P({ lean: -2, hy: 98, ff: [18, 0], fb: [-22, 0], af: [60, 110], ab: [-14, 28] });
const click = P({ lean: 6, hy: 96, ff: [28, 0], fb: [-22, 0], af: [96, 0], ab: [-16, 30] });
const sideW = P({ lean: -10, hy: 98, ff: [16, 50], fb: [-10, 0], af: [30, 90], ab: [10, 100] });
const sideKick = P({ lean: -28, head: 8, hy: 99, ff: [104, 88], fb: [-10, 0], af: [-34, 50], ab: [24, 92] });
const enterW = P({ lean: -8, head: -6, hy: 100, ff: [18, 0], fb: [-22, 0], af: [172, 8], ab: [-20, 40] });
const enter = P({ lean: 24, head: 6, hy: 86, ff: [36, 0], fb: [-30, 0], af: [60, 0], ab: [-34, 50] });

export default (look) => ({
  id: 'ramas', name: 'Ramas', title: 'Computadores & IA', color: '#b06bff', stage: 'tech',
  desc: 'Programa, treina e faz o deploy da sua derrota. A IA dele detecta o alvo onde quer que esteja.',
  quote: 'Acurácia de 100%. Pode commitar essa vitória.',
  style: 'Técnico e calculista',
  look, speed: 4.2, power: 1.03, defense: 1, compX: 62, compY: 285,
  anims: { idle: A(true, [0, idleA], [32, idleB], [64, idleA]), win: A(true, [0, S.armsX], [30, coolB], [60, S.armsX]) },
  info: {
    sp1: { name: 'Ataque de IA', desc: 'A IA detecta o alvo, trava a caixa e dispara.' },
    sp2: { name: 'Sobrecarga Digital', desc: 'Parede de glitch que atravessa a arena (3 acertos).' },
    super: { name: 'Domínio da IA', desc: 'Rede neural holográfica executa o oponente.' },
  },
  ai: { sp1: [200, 1100], sp2: [90, 520], sup: 540 },
  moves: {
    ...BASE_MOVES,
    light1: { ...BASE_MOVES.light1, anim: atk(4, 3, 9, clickW, click) },
    light2: { ...BASE_MOVES.light2, anim: atk(5, 3, 10, sideW, sideKick), box: [16, 80, 116, 60] },
    light3: { ...BASE_MOVES.light3, anim: atk(7, 4, 16, enterW, enter), box: [20, 60, 120, 180] },
    heavy: { ...BASE_MOVES.heavy, st: 11, act: 5, rec: 20, dmg: 76, box: [20, 90, 164, 112], anim: atk(11, 5, 20, S.palmW, S.palm),
      events: { 12: (f, o, m) => { m.fx.add({ type: 'ring', x: f.x + f.facing * 130, y: GROUND - 150, life: 14, r0: 10, r1: 70, w: 6, color: '#3fe0ff', front: true }); Audio.sfx('glitch'); } } },
    sp1: { special: true, cost: 20, st: 12, act: 1, rec: 24, anim: A(false, [0, S.type], [5, S.typeB], [10, S.type], [15, S.typeB], [20, S.type], [37, S.stA]), sfx: 'glitch', events: { 10: aiLock } },
    sp2: { special: true, cost: 30, st: 16, act: 1, rec: 26, anim: atk(16, 1, 26, S.bothW, S.both), sfx: 'whoosh_h', events: { 16: overload } },
    super: { super: true, name: 'DOMÍNIO DA INTELIGÊNCIA ARTIFICIAL', st: 12, act: 8, rec: 30, box: [0, 0, 620, 340], dmg: 20, cine: true, chip: 25, bstun: 20, gdmg: 30, inv: [0, 14], hit: 'hit_h', hs: 8, anim: atk(12, 8, 30, S.upW, S.up), events: { 11: () => Audio.sfx('digital') } },
  },
  companion(ctx, f, t) { drawOrb(ctx, f.cx, GROUND - f.cy, 0.9, t + f.idx * 30); },
  overlay(ctx, f, t) {
    const mv = f.move;
    if (f.state === 'attack' && mv && mv.super && f.mf > mv.st - 3 && f.mf <= mv.st + mv.act + 6) {
      const k = clamp((f.mf - mv.st + 3) / 8, 0, 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const x0 = f.facing > 0 ? f.x : f.x - 620 * k;
      ctx.fillStyle = 'rgba(63,224,255,0.16)'; ctx.fillRect(x0, GROUND - 340, 620 * k, 340);
      ctx.strokeStyle = 'rgba(63,224,255,0.8)'; ctx.lineWidth = 2;
      for (let x = 0; x <= 620 * k; x += 62) { ctx.beginPath(); ctx.moveTo(x0 + x, GROUND - 340); ctx.lineTo(x0 + x, GROUND); ctx.stroke(); }
      for (let y = 0; y <= 340; y += 68) { ctx.beginPath(); ctx.moveTo(x0, GROUND - y); ctx.lineTo(x0 + 620 * k, GROUND - y); ctx.stroke(); }
      ctx.restore();
    }
  },
  cine: {
    dur: 222,
    hits: [...Array.from({ length: 10 }, (_, i) => [50 + i * 10, 17, 'ai_fire', 0.8]), [194, 110, 'explosion', 2]],
    step(m, a, d, f, c) {
      a.exprOverride = 'n';
      cpose(a, f > 184 ? S.point : f % 12 < 6 ? S.type : S.typeB, 4);
      cpose(d, S.hitHigh, 6);
      d.y *= 0.8;
      d.x = c.dx + (f % 7 < 2 ? rand(-7, 7) : 0);
      if (f === 2) Audio.sfx('boot');
      if (f === 30) Audio.sfx('ai_lock');
      if (f >= 50 && f <= 140 && (f - 50) % 10 === 0) {
        const nd = NODES[((f - 50) / 10) % 6], cx = c.dx, cy = GROUND - 150;
        m.fx.add({ type: 'line', x: cx + nd[0], y: cy + nd[1], x2: cx, y2: cy + 20, life: 9, size: 8, color: (f / 10) % 2 ? '#3fe0ff' : '#ff4fd8', front: true });
        m.fx.add({ type: 'line', x: cx + nd[0], y: cy + nd[1], x2: cx, y2: cy + 20, life: 6, size: 3, color: '#fff', front: true });
      }
      if (f === 150) Audio.sfx('glitch');
      if (f === 194) {
        m.fx.burst(c.dx, GROUND - 150, 50, ['#3fe0ff', '#ff4fd8', '#fff'], 20, { type: 'sq', size: 9, front: true, life: 1.6, g: 0.1 });
        m.fx.text(c.dx, GROUND - 330, 'DELETADO!', '#ff4fd8', 48);
        m.flashA = 0.7; m.shake = 18;
      }
    },
    drawBack(ctx, m, a, d, f, c) {
      const k = Math.min(1, f / 24), cam = m.cam.x, cx = c.dx, cy = GROUND - 150;
      ctx.save();
      ctx.globalAlpha = k;
      // chuva de código
      ctx.font = `bold 15px ${FONT_M}`; ctx.textAlign = 'center';
      for (let i = 0; i < 44; i++) {
        const x = cam + ((i * 31) % W), sp = 3 + (i % 5), y0 = ((f * sp + i * 97) % (GROUND + 100)) - 50;
        for (let j = 0; j < 7; j++) { ctx.fillStyle = j === 0 ? '#dffbff' : `rgba(63,224,255,${0.5 - j * 0.06})`; ctx.fillText(String.fromCharCode(48 + ((i * 7 + j * 3 + (f >> 2)) % 42)), x, y0 - j * 17); }
      }
      // piso em grade com perspectiva
      ctx.strokeStyle = 'rgba(176,107,255,0.7)'; ctx.lineWidth = 1.5;
      for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 40, GROUND - 30); ctx.lineTo(cx + i * 150, H); ctx.stroke(); }
      for (let j = 0; j < 6; j++) { const y = GROUND - 30 + j * j * 4 + ((f * 0.6) % 4) * j; ctx.beginPath(); ctx.moveTo(cam, y); ctx.lineTo(cam + W, y); ctx.stroke(); }
      // rede neural holográfica
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
        const act = ((f >> 2) + i * 3 + j) % 7 === 0;
        ctx.strokeStyle = act ? 'rgba(255,255,255,0.9)' : 'rgba(63,224,255,0.22)'; ctx.lineWidth = act ? 2.5 : 1;
        ctx.beginPath(); ctx.moveTo(cx + NODES[i][0], cy + NODES[i][1]); ctx.lineTo(cx + NODES[j][0], cy + NODES[j][1]); ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const fire = f >= 50 && f <= 146 && Math.floor((f - 50) / 10) % 6 === i;
        ctx.fillStyle = fire ? '#fff' : 'rgba(63,224,255,0.85)';
        ctx.beginPath(); ctx.arc(cx + NODES[i][0], cy + NODES[i][1], fire ? 22 : 14 + Math.sin(f * 0.2 + i) * 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#b06bff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx + NODES[i][0], cy + NODES[i][1], 24, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    },
    drawFront(ctx, m, a, d, f, c) {
      if (f > 14 && f < 194) {
        const sz = 1 + Math.max(0, 34 - f) * 0.05;
        detBox(ctx, c.dx, GROUND - 126, 140 * sz, 268 * sz, f >= 30 ? '#ff4455' : '#3fe0ff', f >= 30 ? 'classe: oponente | conf: 0.99' : 'detectando...', f);
      }
      if (f >= 146 && f < 200) {
        const x = m.cam.x + W / 2 - 230, y = 120, p = clamp((f - 150) / 40, 0, 1);
        ctx.fillStyle = 'rgba(4,10,24,0.88)'; ctx.fillRect(x, y, 460, 74);
        ctx.strokeStyle = '#3fe0ff'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 460, 74);
        ctx.font = `bold 18px ${FONT_M}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#7dffb0';
        ctx.fillText('$ sudo rm -rf /arena/oponente', x + 16, y + 28);
        ctx.fillStyle = '#12303a'; ctx.fillRect(x + 16, y + 42, 380, 16);
        ctx.fillStyle = '#ff4fd8'; ctx.fillRect(x + 16, y + 42, 380 * p, 16);
        ctx.fillStyle = '#fff'; ctx.fillText(Math.round(p * 100) + '%', x + 404, y + 57);
      }
    },
  },
});
