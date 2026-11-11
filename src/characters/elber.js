// ELBER — O Poder das Capivaras. Invocador bem-humorado: manada, escudo vivo e o Rei Capivara.
import { BASE_MOVES } from '../combat/moves.js';
import { S, A, atk, P } from '../render/poses.js';
import { Ent, cpose } from '../combat/entities.js';
import { drawCapy } from '../render/props.js';
import { GROUND, W, H } from '../core/config.js';
import { Audio } from '../core/audio.js';
import { rand, clamp, TAU, easeIn } from '../core/util.js';

const idleA = P({ lean: 3, hy: 96, ff: [22, 0], fb: [-24, 0], af: [32, 108], ab: [14, 96] });
const idleB = P({ lean: 4, hy: 90, ff: [22, 0], fb: [-24, 0], af: [38, 100], ab: [18, 90] });
const joyA = P({ lean: -4, head: -8, hy: 100, ff: [16, 0], fb: [-16, 0], af: [160, 14], ab: [-160, -14] });
const joyB = P({ lean: -2, head: -4, hy: 88, ff: [20, 0], fb: [-20, 0], af: [140, 40], ab: [-140, -40] });

function capy(f, m, second) {
  Audio.sfx('capy');
  m.ents.push(new Ent({
    owner: f, x: f.x - f.facing * 100, y: 32, vx: f.facing * 11, w: 92, h: 64, life: 150, clash: true, ground: true, dirn: f.facing,
    hit: { dmg: 32, stun: 18, bstun: 11, push: 6, chip: 3, gdmg: 12, hit: 'hit_h', gain: 1.5, hs: 6, kd: second ? [5, 8.5] : undefined },
    tick(e, mm) { if (e.t % 5 === 0) mm.fx.dust(e.x - e.dirn * 40, GROUND, -e.dirn, 1); },
    onHit(e, mm) { Audio.sfx('boing'); mm.fx.burst(e.x, GROUND - 40, 6, ['#7dff8a', '#c8f7a0'], 8, { type: 'leaf', size: 7, front: true }); },
    draw(ctx, e, mm) { drawCapy(ctx, e.x, GROUND + 4, 1, mm.t + (second ? 7 : 0), { dir: e.dirn, run: true, angry: true }); },
  }));
}

function shieldOn(f, o, m) {
  f.shield = { hits: 2, t: 210 };
  Audio.sfx('shield'); Audio.sfx('capy');
  m.fx.add({ type: 'ring', x: f.x, y: GROUND - 120, life: 20, r0: 20, r1: 150, w: 8, color: '#9dff8a', front: true });
  m.fx.burst(f.x, GROUND - 120, 10, ['#7dff8a', '#c8f7a0', '#4fae5a'], 9, { type: 'leaf', size: 8, front: true });
  m.fx.text(f.x, GROUND - 300, 'ESCUDO CAPIVARA!', '#b8ff9a', 24);
}

function stampede(f, o, m) {
  Audio.sfx('stampede'); Audio.sfx('capy');
  m.ents.push(new Ent({
    owner: f, x: f.x - f.facing * 240, y: 56, vx: f.facing * 17, w: 230, h: 112, life: 90, ground: true, dirn: f.facing,
    hit: { dmg: 20, cine: true, chip: 25, bstun: 20, gdmg: 30, hit: 'hit_h', hs: 8 },
    tick(e, mm) { if (e.t % 2 === 0) mm.fx.dust(e.x - e.dirn * 100, GROUND, -e.dirn, 2); if (e.t % 14 === 0) Audio.sfx('stampede'); },
    draw(ctx, e, mm) {
      const off = [[-90, 0, 0.9], [-30, -10, 0.85], [40, 4, 1], [-140, 6, 1], [95, -6, 0.9], [0, 10, 1.1]];
      for (let i = 0; i < off.length; i++) drawCapy(ctx, e.x + off[i][0] * e.dirn, GROUND + off[i][1] + 2, off[i][2], mm.t + i * 5, { dir: e.dirn, run: true, angry: true });
    },
  }));
}

// Corpo a corpo do Elber: tapa, barrigada e voadora com os dois pés.
const slapW = P({ lean: -6, hy: 96, ff: [22, 0], fb: [-24, 0], af: [140, 70], ab: [14, 96] });
const slap = P({ lean: 14, head: 6, hy: 92, ff: [32, 0], fb: [-26, 0], af: [84, -20], ab: [10, 100] });
const bellyW = P({ lean: 12, hy: 90, ff: [20, 0], fb: [-26, 0], af: [-20, 40], ab: [-30, 30] });
const belly = P({ lean: -24, head: -6, hy: 92, ox: 22, ff: [30, 0], fb: [-40, 0], af: [-50, 30], ab: [-64, 20] });
const dropW = P({ lean: 14, hy: 70, ff: [24, 0], fb: [-24, 0], af: [20, 80], ab: [10, 90] });
const dropKick = P({ lean: -46, head: 14, hy: 74, oy: 46, rot: -14, ff: [108, 74], fb: [98, 62], af: [-70, 10], ab: [-84, 10] });

export default (look) => ({
  id: 'elber', name: 'Elber', title: 'O Poder das Capivaras', color: '#7dff8a', stage: 'capy',
  desc: 'Ninguém sabe explicar, mas as capivaras obedecem. Calmo por fora, uma manada inteira por dentro.',
  quote: 'As capivaras mandaram um abraço.',
  style: 'Invocador bem-humorado',
  look, speed: 4.4, power: 0.92, defense: 1.04, compX: 84, compY: 0,
  anims: { idle: A(true, [0, idleA], [18, idleB], [36, idleA]), win: A(true, [0, joyA], [12, joyB], [24, joyA]) },
  info: {
    sp1: { name: 'Investida das Capivaras', desc: 'Duas capivaras disparam pelo chão.' },
    sp2: { name: 'Escudo Capivara', desc: 'Capivaras protetoras absorvem 2 golpes e revidam.' },
    super: { name: 'O Reino das Capivaras', desc: 'A manada invade a arena e o Rei Capivara desce.' },
  },
  ai: { sp1: [240, 1000], sp2: [0, 1100], sup: 800, shield: true },
  moves: {
    ...BASE_MOVES,
    light1: { ...BASE_MOVES.light1, anim: atk(4, 3, 9, slapW, slap) },
    light2: { ...BASE_MOVES.light2, anim: atk(5, 3, 10, bellyW, belly), box: [16, 70, 92, 100], hit: 'boing' },
    light3: { ...BASE_MOVES.light3, anim: atk(7, 4, 16, dropW, dropKick), box: [20, 70, 132, 90], lunge: [1, 7, 6] },
    heavy: { ...BASE_MOVES.heavy, st: 10, act: 5, rec: 20, dmg: 78, box: [20, 110, 124, 96], lunge: [6, 14, 7], hit: 'bonk', anim: atk(10, 5, 20, S.buttW, S.butt), onHit: () => Audio.sfx('hit_h') },
    sp1: { special: true, cost: 20, st: 12, act: 1, rec: 24, anim: A(false, [0, S.whistle], [9, S.whistle], [13, S.point, 'in'], [28, S.point], [37, S.stA]), sfx: 'rustle', events: { 10: (f, o, m) => capy(f, m, false), 21: (f, o, m) => capy(f, m, true) } },
    sp2: { special: true, cost: 30, st: 10, act: 1, rec: 20, anim: A(false, [0, S.armsX], [10, S.shrug, 'in'], [31, S.stA]), events: { 10: shieldOn } },
    super: { super: true, name: 'O REINO DAS CAPIVARAS', st: 14, act: 1, rec: 40, inv: [0, 16], anim: A(false, [0, S.whistle], [12, S.whistle], [16, S.point, 'in'], [44, S.point], [55, S.stA]), events: { 14: stampede } },
  },
  companion(ctx, f, t) { drawCapy(ctx, f.cx, GROUND + 4, 0.6, t, { dir: f.facing, run: Math.abs(f.x - f.facing * 84 - f.cx) > 14, orange: true }); },
  drawBack(ctx, f, t) {
    if (!f.shield) return;
    const n = f.shield.hits + 1;
    for (let i = 0; i < n; i++) { const a = t * 0.07 + (i / n) * TAU; if (Math.sin(a) < 0) drawCapy(ctx, Math.cos(a) * 84, 2, 0.5, t + i * 9, { dir: Math.sin(a) < 0 ? -1 : 1, run: true }); }
  },
  drawFront(ctx, f, t) {
    if (!f.shield) return;
    const n = f.shield.hits + 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(125,255,138,${0.12 + 0.05 * Math.sin(t * 0.2)})`; ctx.strokeStyle = 'rgba(157,255,138,0.75)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, -124, 96, 142, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    for (let i = 0; i < n; i++) { const a = t * 0.07 + (i / n) * TAU; if (Math.sin(a) >= 0) drawCapy(ctx, Math.cos(a) * 84, 10, 0.6, t + i * 9, { dir: 1, run: true }); }
  },
  cine: {
    dur: 242,
    hits: [...Array.from({ length: 10 }, (_, i) => [36 + i * 13, 17, i % 2 ? 'boing' : 'hit_h', 1]), [206, 110, 'press', 2.2]],
    begin(m, a, d, c) { c.dir = d.x >= a.x ? 1 : -1; },
    step(m, a, d, f, c) {
      a.exprOverride = 'w';
      cpose(a, f % 24 < 12 ? joyA : joyB, 6);
      if (f === 2 || f === 60 || f === 120) Audio.sfx('stampede');
      if (f % 22 === 5 && f < 170) Audio.sfx('capy');
      if (f < 164) {
        cpose(d, S.launch, 5);
        const k = clamp(f / 30, 0, 1);
        d.y = k * (120 + Math.abs(Math.sin((f - 30) * 0.12)) * 130);
        d.spinA = f * 9;
        d.x = c.dx + Math.sin(f * 0.07) * 60;
        if (f % 3 === 0) m.fx.dust(d.x + rand(-200, 200), GROUND, -c.dir, 1);
      } else if (f < 206) {
        d.spinA = 0; cpose(d, S.down, 8); d.y *= 0.75; d.x += (c.dx - d.x) * 0.2;
        if (f === 170) m.fx.text(d.x, GROUND - 200, '!?', '#fff', 60, { life: 34, vy: -0.4 });
      } else {
        d.hidden = f < 236; d.y = 0;
        if (f === 206) {
          m.shake = 26; m.flashA = 0.6;
          m.fx.dust(d.x - 160, GROUND, -1, 16); m.fx.dust(d.x + 160, GROUND, 1, 16);
          m.fx.burst(d.x, GROUND - 30, 24, ['#7dff8a', '#c8f7a0', '#4fae5a'], 16, { type: 'leaf', size: 9, front: true, life: 1.5 });
          m.fx.text(d.x, GROUND - 420, 'VIDA LONGA AO REI!', '#ffd23f', 44, { life: 60 });
          Audio.sfx('capy');
        }
      }
    },
    drawBack(ctx, m, a, d, f, c) {
      const cam = m.cam.x, k = Math.min(1, f / 20, (242 - f) / 12);
      // pôr do sol dourado
      const g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, `rgba(255,150,70,${0.5 * k})`); g.addColorStop(1, `rgba(120,200,90,${0.35 * k})`);
      ctx.fillStyle = g; ctx.fillRect(cam, 0, W, H);
      if (f < 200) for (let i = 0; i < 12; i++) {
        const x = ((f * 12 + i * 190) % (W + 500)) - 250;
        drawCapy(ctx, cam + (c.dir > 0 ? x : W - x), GROUND - 14 - (i % 3) * 8, 0.72, f + i * 11, { dir: c.dir, run: true, color: '#8f5f34' });
      }
    },
    drawFront(ctx, m, a, d, f, c) {
      const cam = m.cam.x;
      if (f < 204) for (let i = 0; i < 9; i++) {
        const x = ((f * 16 + i * 260) % (W + 600)) - 300;
        drawCapy(ctx, cam + (c.dir > 0 ? x : W - x), GROUND + 26 + (i % 2) * 22, 1.15, f + i * 13, { dir: c.dir, run: true, angry: i % 3 === 0 });
      }
      // sombra crescente e o Rei Capivara caindo do céu
      if (f >= 168) {
        const k = easeIn(clamp((f - 176) / 30, 0, 1));
        const ky = f < 206 ? -700 + (GROUND + 700) * k : GROUND + Math.max(0, 6 - (f - 206)) * -4;
        ctx.fillStyle = `rgba(0,0,0,${0.15 + 0.3 * k})`;
        ctx.beginPath(); ctx.ellipse(c.dx, GROUND + 8, 60 + 150 * k, 10 + 22 * k, 0, 0, TAU); ctx.fill();
        drawCapy(ctx, c.dx - c.dir * 20, ky + 6, 4.4, f, { dir: -c.dir, sit: f >= 206, crown: true });
      }
    },
  },
});
