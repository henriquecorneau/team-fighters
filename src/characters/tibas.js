// TIBAS — Engenharia Mecânica. Peso-pesado: braço hidráulico, turbinas e máquinas gigantes.
import { BASE_MOVES } from '../combat/moves.js';
import { S, A, atk, P } from '../render/poses.js';
import { Ent, cpose } from '../combat/entities.js';
import { drawGear } from '../render/props.js';
import { GROUND, W } from '../core/config.js';
import { Audio } from '../core/audio.js';
import { rand, clamp, TAU, easeIn } from '../core/util.js';

const idleA = P({ lean: 12, hy: 84, ff: [36, 0], fb: [-36, 0], af: [52, 78], ab: [0, 120] });
const idleB = P({ lean: 14, hy: 80, ff: [36, 0], fb: [-36, 0], af: [56, 72], ab: [4, 114] });
const flexB = P({ lean: -4, head: -8, hy: 94, ff: [22, 0], fb: [-22, 0], af: [108, 100], ab: [-108, -100] });

function shockwave(f, o, m) {
  Audio.sfx('shock'); m.shake = Math.max(m.shake, 12);
  m.fx.add({ type: 'ring', x: f.x, y: GROUND, life: 20, r0: 30, r1: 240, w: 12, color: '#ffb35c', squash: 0.25, front: true });
  m.fx.dust(f.x, GROUND, 0, 12);
  m.ents.push(new Ent({
    owner: f, x: f.x + f.facing * 90, y: 76, vx: f.facing * 10.5, w: 84, h: 152, life: 70, clash: true, ground: true, dirn: f.facing,
    hit: { dmg: 78, kd: [6, 11], chip: 10, gdmg: 30, bstun: 16, hit: 'hit_s', hs: 9 },
    tick(e, mm) { if (e.t % 2 === 0) mm.fx.add({ type: 'smoke', x: e.x - e.dirn * 20, y: GROUND - rand(0, 20), vx: -e.dirn * 2, vy: -rand(0.5, 2), life: 18, size: rand(8, 14), color: '#cdb89a', alpha: 0.5 }); },
    draw(ctx, e, mm) {
      ctx.save(); ctx.translate(e.x, GROUND); ctx.scale(e.dirn, 1); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const k = 1 - i * 0.2, ph = Math.sin(mm.t * 0.6 + i) * 6;
        ctx.strokeStyle = i === 0 ? '#fff' : `rgba(255,${170 - i * 20},70,${0.9 - i * 0.2})`; ctx.lineWidth = 14 - i * 3;
        ctx.beginPath(); ctx.ellipse(-i * 30 - 30, 0, 60 * k, 150 * k + ph, 0, -Math.PI / 2, 0); ctx.stroke();
      }
      ctx.restore();
    },
  }));
}

function piston(ctx, x0, x1, y, t, flip) {
  // barra + cilindro + punho com faixas de segurança
  const d = x1 > x0 ? 1 : -1;
  ctx.fillStyle = '#16131f'; ctx.fillRect(Math.min(x0, x1), y - 24, Math.abs(x1 - x0), 48);
  ctx.fillStyle = '#c9d0db'; ctx.fillRect(Math.min(x0, x1), y - 19, Math.abs(x1 - x0), 38);
  ctx.fillStyle = '#eef2f7'; ctx.fillRect(Math.min(x0, x1), y - 15, Math.abs(x1 - x0), 8);
  ctx.fillStyle = '#16131f'; ctx.beginPath(); ctx.roundRect(x0 - 70, y - 62, 140, 124, 12); ctx.fill();
  ctx.fillStyle = '#566072'; ctx.beginPath(); ctx.roundRect(x0 - 65, y - 57, 130, 114, 9); ctx.fill();
  drawGear(ctx, x0, y, 40, 9, t * 0.08 * d, '#f28c28');
  ctx.fillStyle = '#16131f'; ctx.beginPath(); ctx.roundRect(x1 - 46, y - 58, 92, 116, 14); ctx.fill();
  ctx.fillStyle = '#7b8697'; ctx.beginPath(); ctx.roundRect(x1 - 41, y - 53, 82, 106, 11); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.rect(x1 + d * 22 - 16, y - 53, 32, 106); ctx.clip();
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(x1 - 46, y - 58, 92, 116);
  ctx.fillStyle = '#16131f'; for (let i = -6; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x1 - 60, y + i * 24); ctx.lineTo(x1 + 60, y + i * 24 - 50); ctx.lineTo(x1 + 60, y + i * 24 - 38); ctx.lineTo(x1 - 60, y + i * 24 + 12); ctx.fill(); }
  ctx.restore();
}

// Corpo a corpo do Tibas: pesado, com a manopla, o ombro e uma marretada de duas mãos.
const hookW = P({ lean: 6, hy: 84, ff: [34, 0], fb: [-36, 0], af: [-20, 90], ab: [0, 120] });
const hook = P({ lean: 20, head: -4, hy: 82, ff: [40, 0], fb: [-36, 0], af: [72, 42], ab: [-6, 118] });
const shoulderW = P({ lean: -6, hy: 86, ff: [26, 0], fb: [-36, 0], af: [10, 120], ab: [-20, 100] });
const shoulder = P({ lean: 36, head: -14, hy: 80, ff: [50, 0], fb: [-42, 0], af: [16, 128], ab: [-30, 70] });
const malletW = P({ lean: -12, head: -8, hy: 92, ff: [26, 0], fb: [-34, 0], af: [176, 6], ab: [168, 10] });
const mallet = P({ lean: 38, head: 10, hy: 72, ff: [42, 0], fb: [-36, 0], af: [52, 4], ab: [46, 8] });

export default (look) => ({
  id: 'tibas', name: 'Tibas', title: 'Engenharia Mecânica', color: '#f28c28', stage: 'mech',
  desc: 'Força bruta com cálculo estrutural. Pistões, engrenagens e torque de sobra — lento, mas cada golpe pesa.',
  quote: 'Projeto aprovado. Tolerância zero pra você.',
  style: 'Força e armadura',
  look, speed: 3.6, power: 1.04, defense: 0.93, compX: 0, compY: 0,
  anims: { idle: A(true, [0, idleA], [30, idleB], [60, idleA]), win: A(true, [0, S.flex], [18, flexB], [36, S.flex]) },
  info: {
    sp1: { name: 'Braço Hidráulico', desc: 'Soco de pistão de longo alcance, com armadura.' },
    sp2: { name: 'Turbina Mecânica', desc: 'Explosão ao redor e onda de choque pelo chão.' },
    super: { name: 'Engenharia de Destruição', desc: 'Pistões gigantes e uma prensa hidráulica.' },
  },
  ai: { sp1: [140, 320], sp2: [0, 620], sup: 250 },
  moves: {
    ...BASE_MOVES,
    light1: { ...BASE_MOVES.light1, anim: atk(4, 3, 9, hookW, hook), box: [16, 100, 100, 70] },
    light2: { ...BASE_MOVES.light2, anim: atk(5, 3, 10, shoulderW, shoulder), box: [16, 100, 92, 100], lunge: [1, 6, 6] },
    light3: { ...BASE_MOVES.light3, anim: atk(7, 4, 16, malletW, mallet), box: [20, 30, 124, 200], hit: 'hit_h' },
    heavy: { ...BASE_MOVES.heavy, st: 14, act: 5, rec: 22, dmg: 98, push: 10, box: [20, 90, 152, 92], hs: 11, lunge: [4, 13, 4.5], anim: atk(14, 5, 22, S.hayW, S.hay) },
    sp1: { special: true, cost: 20, st: 18, act: 5, rec: 26, armor: [3, 23], dmg: 120, kd: [11, 8], chip: 14, gdmg: 40, bstun: 18, box: [40, 100, 280, 66], hs: 12, hit: 'hit_s', sfx: 'hydraulic', anim: atk(18, 5, 26, S.hayW, S.hay),
      tick(f, o, m, fr) {
        f.gearExt = fr < 17 ? 0 : fr <= 24 ? clamp((fr - 16) / 3, 0, 1) : clamp(1 - (fr - 24) / 14, 0, 1);
        if (fr === 18) { m.shake = Math.max(m.shake, 6); for (let i = 0; i < 6; i++) m.fx.add({ type: 'smoke', x: f.x + f.facing * 60, y: GROUND - 150 + rand(-10, 10), vx: -f.facing * rand(1, 4), vy: rand(-2, 0), life: 20, size: rand(7, 12), color: '#f4f4f4', alpha: 0.6 }); }
      } },
    sp2: { special: true, cost: 30, st: 22, act: 4, rec: 26, box: [-112, 0, 224, 170], dmg: 60, kd: [7, 10], chip: 8, gdmg: 26, bstun: 14, hit: 'hit_h', hs: 8, sfx: 'turbine',
      anim: A(false, [0, S.upW], [12, S.flex], [22, S.slam, 'in'], [34, S.slam], [52, S.stA]), events: { 22: shockwave } },
    super: { super: true, name: 'ENGENHARIA DE DESTRUIÇÃO', st: 12, act: 6, rec: 34, lunge: [10, 18, 16], armor: [0, 30], box: [20, 60, 236, 150], dmg: 20, cine: true, chip: 25, bstun: 20, gdmg: 30, hit: 'hit_s', hs: 8, sfx: 'hydraulic', anim: atk(12, 6, 34, S.hayW, S.hay),
      tick(f, o, m, fr) { f.gearExt = fr >= 12 && fr < 22 ? 0.55 : 0; } },
  },
  drawBack(ctx, f, t) {
    // turbina nas costas, gira mais rápido ao carregar a Turbina Mecânica
    const mv = f.move, charging = f.state === 'attack' && mv === f.char.moves.sp2;
    const sp = charging ? 0.5 + f.mf * 0.05 : 0.04;
    if (charging) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,150,60,${Math.min(0.7, f.mf * 0.03)})`; ctx.beginPath(); ctx.arc(-34, -150, 46 + f.mf, 0, TAU); ctx.fill(); ctx.restore(); }
    drawGear(ctx, -34 + f.pose[0] * 0.5, -(f.pose[2] + 58), charging ? 30 : 23, 8, t * sp, '#8b95a5');
  },
  cine: {
    dur: 232,
    hits: [...Array.from({ length: 8 }, (_, i) => [46 + i * 13, 20, 'hit_h', 1.2]), [198, 120, 'press', 2.2]],
    begin(m, a, d, c) { c.dir = d.x >= a.x ? 1 : -1; },
    step(m, a, d, f, c) {
      a.x += (c.dx - c.dir * 400 - a.x) * 0.2; d.y *= 0.7;
      a.exprOverride = 'a';
      cpose(a, f < 180 ? (f % 26 < 13 ? S.flex : flexB) : S.slam, 6);
      if (f === 4) { Audio.sfx('gear'); Audio.sfx('turbine'); }
      const n = Math.floor((f - 46) / 13), ph = (f - 46) - n * 13;
      if (f >= 40 && f < 150) {
        const side = n % 2 === 0 ? 1 : -1;
        cpose(d, ph < 7 && n >= 0 ? (n % 2 ? S.hitLow : S.hitHigh) : S.dzA, 3);
        d.x = c.dx + (ph < 7 && n >= 0 ? side * (7 - ph) * 3 : 0);
        if (ph === 10) Audio.sfx('hydraulic');
      } else if (f >= 150) {
        d.x = c.dx; cpose(d, f >= 198 ? S.down : S.dzB, 4);
        d.squash = f >= 198 && f < 216 ? 0.45 : 1;
        if (f === 160) Audio.sfx('gear');
        if (f === 198) { m.shake = 24; m.flashA = 0.6; m.fx.dust(d.x - 80, GROUND, -1, 12); m.fx.dust(d.x + 80, GROUND, 1, 12); m.fx.burst(d.x, GROUND - 20, 22, ['#cfd6e2', '#f28c28', '#fff'], 16, { type: 'sq', size: 8, front: true, g: 0.5 }); m.fx.text(d.x, GROUND - 330, 'PRENSADO!', '#f28c28', 46); }
      }
    },
    drawBack(ctx, m, a, d, f, c) {
      const cx = c.dx, k = Math.min(1, f / 30);
      // prancheta técnica ao fundo
      ctx.save(); ctx.globalAlpha = 0.3 * k; ctx.strokeStyle = '#7fb4ff'; ctx.lineWidth = 1;
      for (let x = Math.floor(m.cam.x / 60) * 60; x < m.cam.x + W + 60; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND); ctx.stroke(); }
      for (let y = 20; y < GROUND; y += 60) { ctx.beginPath(); ctx.moveTo(m.cam.x, y); ctx.lineTo(m.cam.x + W, y); ctx.stroke(); }
      ctx.restore();
      const rise = (1 - k) * 300;
      drawGear(ctx, cx - 300, GROUND - 60 + rise, 170, 14, f * 0.03, '#4c5565');
      drawGear(ctx, cx + 300, GROUND - 60 + rise, 170, 14, -f * 0.03 + 0.2, '#4c5565');
      drawGear(ctx, cx, GROUND - 330 + rise * 0.5, 110, 11, f * 0.05, '#667086');
      // pistões gigantes alternados
      const n = Math.floor((f - 46) / 13), ph = (f - 46) - n * 13;
      for (const side of [-1, 1]) {
        const mine = f >= 40 && f < 152 && n >= 0 && (n % 2 === 0 ? -1 : 1) === side;
        const ext = mine ? Math.max(0, 1 - Math.abs(ph) / 5) : (f >= 40 && f < 152 && ph > 8 && ((n + 1) % 2 === 0 ? -1 : 1) === side ? -0.3 : 0);
        const base = cx + side * (520 + (1 - k) * 400), tip = cx + side * (290 - ext * 215);
        piston(ctx, base, f < 152 ? tip : cx + side * (290 + (f - 152) * 6), GROUND - 150, f);
      }
    },
    drawFront(ctx, m, a, d, f, c) {
      if (f < 156) return;
      // prensa hidráulica descendo
      const k = f < 198 ? easeIn(clamp((f - 156) / 42, 0, 1)) : f < 214 ? 1 : 1 - clamp((f - 214) / 16, 0, 1) * 0.5;
      const bottom = -80 + (GROUND - 72 + 80) * k, cx = c.dx;
      ctx.fillStyle = '#16131f'; ctx.fillRect(cx - 42, -20, 84, bottom - 150);
      ctx.fillStyle = '#c9d0db'; ctx.fillRect(cx - 36, -20, 72, bottom - 150);
      ctx.fillStyle = '#eef2f7'; ctx.fillRect(cx - 28, -20, 16, bottom - 150);
      ctx.fillStyle = '#16131f'; ctx.beginPath(); ctx.roundRect(cx - 190, bottom - 170, 380, 170, 14); ctx.fill();
      ctx.fillStyle = '#566072'; ctx.beginPath(); ctx.roundRect(cx - 184, bottom - 164, 368, 158, 10); ctx.fill();
      ctx.fillStyle = '#7b8697'; ctx.fillRect(cx - 184, bottom - 164, 368, 30);
      ctx.save(); ctx.beginPath(); ctx.rect(cx - 184, bottom - 42, 368, 36); ctx.clip();
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(cx - 190, bottom - 50, 380, 60);
      ctx.fillStyle = '#16131f'; for (let i = -1; i < 12; i++) { ctx.beginPath(); ctx.moveTo(cx - 200 + i * 40, bottom); ctx.lineTo(cx - 170 + i * 40, bottom - 50); ctx.lineTo(cx - 150 + i * 40, bottom - 50); ctx.lineTo(cx - 180 + i * 40, bottom); ctx.fill(); }
      ctx.restore();
      drawGear(ctx, cx - 110, bottom - 100, 34, 9, f * 0.2, '#f28c28'); drawGear(ctx, cx + 110, bottom - 100, 34, 9, -f * 0.2, '#f28c28');
    },
  },
});
