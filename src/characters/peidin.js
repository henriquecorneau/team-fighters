// PEIDIN — Fumaça & Fidget. Controla o espaço com nuvens de fumaça e brinquedos satisfatórios (spinner e pop-it).
import { BASE_MOVES } from '../combat/moves.js';
import { S, A, atk, P } from '../render/poses.js';
import { Ent, cpose } from '../combat/entities.js';
import { PIX, pixelProp } from '../render/pixel.js';
import { GROUND } from '../core/config.js';
import { Audio } from '../core/audio.js';
import { rand, clamp, TAU } from '../core/util.js';

const idleA = P({ lean: 0, hy: 98, ff: [18, 0], fb: [-20, 0], af: [62, 68], ab: [-12, 22] });
const idleB = P({ lean: 1, hy: 95, ff: [18, 0], fb: [-20, 0], af: [66, 62], ab: [-8, 26] });
const puffW = P({ lean: -10, head: -12, hy: 98, ff: [16, 0], fb: [-20, 0], af: [150, 120], ab: [-10, 24] });
const puff = P({ lean: 16, head: 6, hy: 90, ff: [30, 0], fb: [-30, 0], af: [40, 60], ab: [-30, 40] });
const chillA = P({ lean: -6, head: -8, hy: 100, ff: [14, 0], fb: [-14, 0], af: [150, 120], ab: [-14, 20] });
const chillB = P({ lean: -8, head: -12, hy: 98, ff: [14, 0], fb: [-14, 0], af: [120, 60], ab: [-10, 24] });

const LOBES = ['#3fe0ff', '#ff4fd8', '#ffd23f'];
function spinnerRaw(ctx, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU, lx = Math.cos(a) * r * 0.62, ly = Math.sin(a) * r * 0.62;
    ctx.strokeStyle = '#16131f'; ctx.lineWidth = r * 0.42 + 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lx, ly); ctx.stroke();
    ctx.strokeStyle = '#e9ecf2'; ctx.lineWidth = r * 0.42; ctx.stroke();
    ctx.fillStyle = '#16131f'; ctx.beginPath(); ctx.arc(lx, ly, r * 0.36 + 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = LOBES[i]; ctx.beginPath(); ctx.arc(lx, ly, r * 0.36, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = '#16131f'; ctx.beginPath(); ctx.arc(0, 0, r * 0.26 + 2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8b93a8'; ctx.beginPath(); ctx.arc(0, 0, r * 0.26, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawSpinner(ctx, x, y, r, rot) {
  if (!PIX.on) return spinnerRaw(ctx, x, y, r, rot);
  const q = ((Math.round(rot / (TAU / 18)) % 6) + 6) % 6;          // simetria de 3 pontas: 6 quadros bastam
  pixelProp(ctx, x, y, r + 6, r + 6, r + 6, r + 6, (c) => spinnerRaw(c, 0, 0, r, (q * TAU) / 18), `spin|${r}|${q}`);
}

function smokeCloud(f, o, m) {
  Audio.sfx('puff');
  const puffs = Array.from({ length: 9 }, () => [rand(-60, 60), rand(-70, 70), rand(34, 56), rand(TAU)]);
  m.ents.push(new Ent({
    owner: f, x: f.x + f.facing * 90, y: 120, vx: f.facing * 7, w: 170, h: 190, life: 120, hits: 4, rehit: 18, dirn: f.facing,
    hit: { dmg: 14, stun: 20, bstun: 10, push: 2, chip: 2, gdmg: 7, hit: 'hit_l', gain: 1.2, hs: 3 },
    tick(e) { e.vx *= 0.965; },
    onHit(e, mm, res, d) { if (res === 'hit') mm.fx.text(d.x, GROUND - 270, 'COF! COF!', '#d9dde6', 22, { life: 30 }); },
    draw(ctx, e, mm) {
      const k = Math.min(1, e.t / 12, (e.life - e.t) / 26);
      ctx.save(); ctx.globalAlpha = 0.72 * k;
      for (const [i, p] of puffs.entries()) {
        const wob = Math.sin(mm.t * 0.07 + p[3]) * 8, r = p[2] * (0.7 + 0.3 * k + e.t * 0.002);
        ctx.fillStyle = i % 3 ? '#cfd4de' : '#a9afbb';
        const px = Math.round((e.x + p[0] + wob) / 6) * 6, py = Math.round((GROUND - e.y + p[1] - e.t * 0.2) / 6) * 6;
        ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
      }
      ctx.restore();
    },
  }));
}

function throwSpinner(f, o, m) {
  Audio.sfx('gear'); Audio.sfx('whoosh_h');
  m.ents.push(new Ent({
    owner: f, x: f.x + f.facing * 60, y: 150, vx: f.facing * 15, w: 60, h: 50, life: 96, hits: 2, rehit: 26, clash: true, dirn: f.facing, rot: 0,
    hit: { dmg: 34, stun: 19, bstun: 11, push: 4, chip: 4, gdmg: 12, hit: 'clang', gain: 2, hs: 6 },
    tick(e, mm) {
      e.vx -= e.dirn * 0.34; e.rot += 0.5;                          // vai e volta, como bumerangue
      if (e.t > 50 && Math.abs(e.x - e.owner.x) < 50) { e.dead = true; Audio.sfx('pop'); }
      if (e.t % 4 === 0) mm.fx.add({ type: 'glow', x: e.x, y: GROUND - e.y, life: 10, size: 7, color: LOBES[(e.t >> 2) % 3] });
    },
    draw(ctx, e) { drawSpinner(ctx, e.x, GROUND - e.y, 30, e.rot); },
  }));
}

const BUB = ['#ff5a6a', '#ff9d3c', '#ffd23f', '#7dff8a', '#3fe0ff', '#7c8cff', '#c77dff', '#ff7ad1', '#ff5a6a'];

// Corpo a corpo do Peidin: com preguiça — peteleco de spinner, joelhada e empurrão de duas mãos.
const flickW = P({ lean: -2, hy: 98, ff: [18, 0], fb: [-20, 0], af: [44, 132], ab: [-12, 22] });
const flick = P({ lean: 4, hy: 97, ff: [26, 0], fb: [-20, 0], af: [98, -12], ab: [-14, 24] });
const kneeW = P({ lean: 4, hy: 96, ff: [10, 10], fb: [-16, 0], af: [60, 80], ab: [30, 100] });
const knee = P({ lean: -10, head: -4, hy: 101, ff: [50, 66], fb: [-10, 0], af: [70, 90], ab: [40, 100] });
const shoveW = P({ lean: -8, hy: 96, ff: [18, 0], fb: [-22, 0], af: [0, 124], ab: [-10, 128] });
const shove = P({ lean: 20, hy: 88, ff: [40, 0], fb: [-32, 0], af: [94, 0], ab: [86, 4] });

export default (look) => ({
  id: 'peidin', name: 'Peidin', title: 'Fumaça & Fidget', color: '#c9b6ff', stage: 'main',
  desc: 'Nunca está de mãos vazias: ou é a fumaça, ou é um brinquedinho satisfatório. Irrita o adversário até ele desistir.',
  quote: 'Respira fundo... ah é, não dá mais.',
  style: 'Controle de espaço',
  look, speed: 4.3, power: 0.96, defense: 1.02, compX: 0, compY: 0,
  anims: { idle: A(true, [0, idleA], [34, idleB], [68, idleA]), win: A(true, [0, chillA], [40, chillB], [80, chillA]) },
  info: {
    sp1: { name: 'Cortina de Fumaça', desc: 'Nuvem lenta que fica no ar e acerta várias vezes.' },
    sp2: { name: 'Spinner Turbo', desc: 'Arremessa o spinner, que vai e volta como bumerangue.' },
    super: { name: 'Pop-it Infernal', desc: 'Estoura o adversário bolha por bolha e fecha com uma baforada.' },
  },
  ai: { sp1: [60, 440], sp2: [200, 900], sup: 300 },
  moves: {
    ...BASE_MOVES,
    light1: { ...BASE_MOVES.light1, anim: atk(4, 3, 9, flickW, flick), hit: 'pop' },
    light2: { ...BASE_MOVES.light2, anim: atk(5, 3, 10, kneeW, knee), box: [16, 86, 88, 80] },
    light3: { ...BASE_MOVES.light3, anim: atk(7, 4, 16, shoveW, shove), box: [20, 100, 126, 90] },
    heavy: { ...BASE_MOVES.heavy, st: 11, act: 5, rec: 20, dmg: 78, box: [20, 90, 150, 110], hit: 'pop', anim: atk(11, 5, 20, S.roundW, S.round), onHit: () => Audio.sfx('hit_h') },
    sp1: { special: true, cost: 20, st: 16, act: 1, rec: 24, anim: A(false, [0, puffW], [11, puffW], [16, puff, 'in'], [30, puff], [41, S.stA]), events: { 16: smokeCloud } },
    sp2: { special: true, cost: 30, st: 12, act: 1, rec: 24, anim: A(false, [0, S.throwW], [11, S.throw, 'in'], [26, S.throw], [37, S.stA]), events: { 12: throwSpinner } },
    super: { super: true, name: 'POP-IT INFERNAL', st: 8, act: 12, rec: 30, lunge: [8, 20, 19], box: [10, 40, 104, 170], dmg: 20, cine: true, chip: 25, bstun: 20, gdmg: 30, inv: [0, 10], hit: 'pop', hs: 8, anim: atk(8, 12, 30, S.palmW, S.palm) },
  },
  cine: {
    dur: 232,
    hits: [...Array.from({ length: 10 }, (_, i) => [34 + i * 13, 16, 'pop', 0.9]), [196, 125, 'explosion', 2]],
    begin(m, a, d, c) { c.dir = d.x >= a.x ? 1 : -1; a.facing = c.dir; d.facing = -c.dir; },
    step(m, a, d, f, c) {
      a.x += (c.dx - c.dir * 150 - a.x) * 0.2; d.y *= 0.7; d.x = c.dx; a.exprOverride = f > 160 ? 'n' : 'w';
      const n = Math.floor((f - 34) / 13), ph = (f - 34) - n * 13;
      cpose(a, f < 164 ? (ph < 6 && n >= 0 ? S.palm : S.palmW) : f < 192 ? puffW : puff, 4);
      cpose(d, f < 164 ? (ph < 6 && n >= 0 ? (n % 2 ? S.hitLow : S.hitHigh) : S.dzA) : S.dzB, 3);
      if (f >= 34 && f < 164 && ph === 0) m.fx.text(c.dx + rand(-90, 90), GROUND - rand(150, 300), 'POP!', BUB[n % 8], 34, { life: 22, rot: rand(-0.3, 0.3) });
      if (f === 170) Audio.sfx('fan');
      if (f === 196) { Audio.sfx('puff'); m.flashA = 0.6; m.shake = 20; m.fx.text(c.dx, GROUND - 340, 'PUFFF!', '#e9ecf2', 54, { life: 50 }); for (let i = 0; i < 26; i++) m.fx.add({ type: 'smoke', x: c.dx + rand(-90, 90), y: GROUND - rand(20, 260), vx: c.dir * rand(1, 6), vy: rand(-3, 1), drag: 0.96, life: rand(40, 70), size: rand(24, 44), color: i % 2 ? '#cfd4de' : '#9aa1ad', alpha: 0.7, front: true }); }
    },
    drawBack(ctx, m, a, d, f, c) {
      // pop-it gigante atrás do adversário: cada golpe estoura uma bolha
      const k = Math.min(1, f / 20, (232 - f) / 12), popped = clamp(Math.floor((f - 34) / 13) + 1, 0, 10) * 3;
      ctx.save(); ctx.globalAlpha = k;
      ctx.fillStyle = '#16131f'; ctx.beginPath(); ctx.roundRect(c.dx - 320, GROUND - 400, 640, 360, 40); ctx.fill();
      ctx.fillStyle = '#2a2f4a'; ctx.beginPath(); ctx.roundRect(c.dx - 312, GROUND - 392, 624, 344, 34); ctx.fill();
      for (let r = 0; r < 4; r++) for (let q = 0; q < 8; q++) {
        const i = r * 8 + q, x = c.dx - 266 + q * 76, y = GROUND - 350 + r * 84, isPop = ((i * 7) % 32) < popped;
        ctx.fillStyle = '#16131f'; ctx.beginPath(); ctx.arc(x, y, 33, 0, TAU); ctx.fill();
        ctx.fillStyle = BUB[q]; ctx.globalAlpha = k * (isPop ? 0.45 : 1); ctx.beginPath(); ctx.arc(x, y, 29, 0, TAU); ctx.fill();
        ctx.globalAlpha = k;
        if (isPop) { ctx.strokeStyle = '#16131f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 17, 0, TAU); ctx.stroke(); }
        else { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - 9, y - 10, 8, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
    },
  },
});

export { drawSpinner };
