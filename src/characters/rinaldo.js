// RINALDO — O Faz-Tudo. Versátil e imprevisível: ferramentas, gambiarras e improviso.
import { BASE_MOVES } from '../combat/moves.js';
import { S, A, atk, P } from '../render/poses.js';
import { Ent, cpose } from '../combat/entities.js';
import { drawTool, drawTurtlebot } from '../render/props.js';
import { skeleton } from '../render/rig.js';
import { GROUND, FONT_D } from '../core/config.js';
import { Audio } from '../core/audio.js';
import { rand, clamp, TAU, easeOutBack } from '../core/util.js';

const idleA = P({ lean: 2, hy: 95, ff: [24, 0], fb: [-26, 0], af: [22, 148], ab: [10, 100] });
const idleB = P({ lean: 3, hy: 90, ff: [24, 0], fb: [-26, 0], af: [27, 141], ab: [14, 94] });
const winA = P({ lean: -4, head: -6, hy: 100, ff: [14, 0], fb: [-14, 0], af: [150, 30], ab: [-30, -70] });
const winB = P({ lean: -6, head: -10, hy: 95, ff: [14, 0], fb: [-14, 0], af: [165, 12], ab: [-36, -60] });

function throwTool(f, m, kind) {
  Audio.sfx('whoosh_h');
  const base = { owner: f, x: f.x + f.facing * 56, w: 50, h: 34, life: 95, clash: true, kind, rot: 0 };
  if (kind === 'wrench') {
    m.ents.push(new Ent({
      ...base, y: 152, vx: f.facing * 13.5,
      hit: { dmg: 40, stun: 20, bstun: 11, push: 4, chip: 5, gdmg: 14, hit: 'clang', gain: 2.5, hs: 6 },
      tick(e) { e.rot += 0.5 * Math.sign(e.vx); },
      onHit(e, mm) { mm.fx.burst(e.x, GROUND - e.y, 8, ['#fff', '#cfd6e2'], 9, { front: true }); },
      draw(ctx, e) { drawTool(ctx, 'wrench', e.x, GROUND - e.y, e.rot, 1.05); },
    }));
  } else {
    m.ents.push(new Ent({
      ...base, y: 200, vx: f.facing * 8.6, vy: 9.5,
      hit: { dmg: 50, stun: 24, bstun: 12, push: 5, chip: 6, gdmg: 16, lvl: 'high', hit: 'bonk', gain: 2.5, hs: 7 },
      tick(e, mm) { e.vy -= 0.55; e.rot += 0.32 * Math.sign(e.vx); if (e.y < 18) { e.dead = true; mm.fx.dust(e.x, GROUND, 0, 5); Audio.sfx('land'); } },
      onHit(e, mm) { mm.fx.add({ type: 'star', x: e.x, y: GROUND - e.y - 20, vy: -3, vx: rand(-2, 2), g: 0.2, life: 30, size: 12, color: '#ffd23f', vr: 0.3, front: true }); },
      draw(ctx, e) { drawTool(ctx, 'hammer', e.x, GROUND - e.y, e.rot, 1.05); },
    }));
  }
}

const gamb = (txt) => (f, o, m) => { Audio.sfx('gambiarra'); m.fx.text(f.x, GROUND - 300, txt, '#ffd23f', 26, { life: 50 }); };

function fanGust(f, o, m) {
  Audio.sfx('fan');
  m.ents.push(new Ent({
    owner: f, x: f.x + f.facing * 78, y: 110, life: 44, hits: 5, rehit: 8, dirn: f.facing,
    hit: { dmg: 13, stun: 15, bstun: 9, push: 11, chip: 2, gdmg: 6, hit: 'hit_l', gain: 1, hs: 2 },
    getBox(e) { return { x: e.dirn > 0 ? e.x : e.x - 430, y: GROUND - 210, w: 430, h: 200 }; },
    tick(e, mm) {
      for (let i = 0; i < 2; i++) mm.fx.add({ type: 'spark', x: e.x + e.dirn * rand(10, 60), y: GROUND - rand(30, 200), vx: e.dirn * rand(16, 26), vy: rand(-1, 1), g: 0, drag: 0.97, life: 16, size: 2.5, color: 'rgba(255,255,255,0.7)' });
    },
    draw(ctx, e, mm) {
      drawTool(ctx, 'fan', e.x, GROUND - 106, 0, 1.35);
      ctx.save(); ctx.translate(e.x, GROUND - 118); ctx.rotate(mm.t * 0.9);
      ctx.fillStyle = 'rgba(210,225,240,0.75)';
      for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.beginPath(); ctx.ellipse(20, 0, 22, 7, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
    },
  }));
}

function bolt(ctx, x0, y0, x1, y1, seg, amp) {
  ctx.beginPath(); ctx.moveTo(x0, y0);
  for (let i = 1; i < seg; i++) { const k = i / seg; ctx.lineTo(x0 + (x1 - x0) * k + rand(-amp, amp) * 0.4, y0 + (y1 - y0) * k + rand(-amp, amp)); }
  ctx.lineTo(x1, y1); ctx.stroke();
}

// Corpo a corpo do Rinaldo: tudo com a chave inglesa (ou com o cotovelo, quando a mão está ocupada).
const tapW = P({ lean: -4, hy: 95, ff: [24, 0], fb: [-26, 0], af: [150, 40], ab: [10, 100] });
const tap = P({ lean: 14, hy: 91, ff: [32, 0], fb: [-28, 0], af: [72, 8], ab: [0, 110] });
const elbowW = P({ lean: 2, hy: 93, ff: [24, 0], fb: [-28, 0], af: [30, 140], ab: [-30, 130] });
const elbow = P({ lean: 24, head: -6, hy: 88, ff: [40, 0], fb: [-32, 0], af: [14, 146], ab: [84, 126] });
const upW = P({ lean: 26, head: 8, hy: 74, ff: [30, 0], fb: [-30, 0], af: [14, 24], ab: [20, 100] });
const upper = P({ lean: -14, head: -12, hy: 103, ff: [28, 0], fb: [-26, 0], af: [152, 8], ab: [-20, 70] });

export default (look) => ({
  id: 'rinaldo', name: 'Rinaldo', title: 'O Faz-Tudo', color: '#ffd23f', stage: 'main',
  desc: 'Se quebrou, ele conserta. Se não existe, ele inventa. Imprevisível com qualquer ferramenta na mão.',
  quote: 'Tá resolvido! Próximo chamado?',
  style: 'Versátil e imprevisível',
  look, speed: 4.5, power: 1.07, defense: 0.96, compX: 96, compY: 0,
  anims: { idle: A(true, [0, idleA], [20, idleB], [40, idleA]), win: A(true, [0, winA], [14, winB], [28, winA]) },
  info: {
    sp1: { name: 'Caixa de Ferramentas', desc: 'Arremessa uma chave reta e um martelo em arco.' },
    sp2: { name: 'Gambiarra Suprema', desc: 'Improvisa um aparelho aleatório: ventilador, choque ou foguete.' },
    super: { name: 'O Faz-Tudo Resolve', desc: 'Chave, martelo, furadeira, fita e a chave gigante.' },
  },
  ai: { sp1: [220, 900], sp2: [70, 400], sup: 320 },
  moves: {
    ...BASE_MOVES,
    light1: { ...BASE_MOVES.light1, anim: atk(4, 3, 9, tapW, tap), box: [16, 110, 124, 110], hit: 'clang' },
    light2: { ...BASE_MOVES.light2, anim: atk(5, 3, 10, elbowW, elbow), box: [16, 120, 86, 60] },
    light3: { ...BASE_MOVES.light3, anim: atk(7, 4, 16, upW, upper), box: [20, 100, 110, 190], hit: 'clang' },
    heavy: { ...BASE_MOVES.heavy, st: 12, act: 4, rec: 20, dmg: 84, box: [20, 50, 152, 180], hit: 'clang', anim: atk(12, 4, 20, S.swingW, S.swing), onHit: () => Audio.sfx('hit_h') },
    sp1: { special: true, cost: 20, st: 10, act: 1, rec: 26, anim: A(false, [0, S.throwW], [9, S.throw, 'in'], [15, S.throwW], [20, S.throw, 'in'], [37, S.stA]), events: { 10: (f, o, m) => throwTool(f, m, 'wrench'), 21: (f, o, m) => throwTool(f, m, 'hammer') } },
    sp2: { special: true, cost: 30, variants: ['sp2a', 'sp2b', 'sp2c'] },
    sp2a: { special: true, st: 18, act: 1, rec: 44, anim: atk(18, 1, 44, S.bothW, S.both), events: { 3: gamb('VENTILADOR TURBO!'), 17: fanGust } },
    sp2b: { special: true, st: 16, act: 6, rec: 24, box: [20, 40, 300, 200], dmg: 78, stun: 46, push: 2, chip: 10, gdmg: 26, bstun: 16, hit: 'hit_h', hs: 12, anim: atk(16, 6, 24, S.bothW, S.both), events: { 3: gamb('EXTENSÃO ENERGIZADA!'), 15: () => Audio.sfx('zap') } },
    sp2c: { special: true, st: 14, act: 22, rec: 20, lunge: [14, 37, 15], box: [0, 30, 96, 150], dmg: 88, kd: [8, 11], chip: 10, gdmg: 30, bstun: 18, hit: 'hit_s', hs: 10, anim: A(false, [0, S.bothW], [12, S.ride, 'in'], [38, S.ride], [56, S.stA]), events: { 3: gamb('FOGUETE DE EXTINTOR!'), 13: () => Audio.sfx('rocket') },
      tick(f, o, m, fr) { if (fr > 12 && fr < 40) for (let i = 0; i < 2; i++) m.fx.add({ type: 'smoke', x: f.x - f.facing * 70, y: GROUND - 80 + rand(-12, 12), vx: -f.facing * rand(3, 7), vy: rand(-1, 1), drag: 0.95, life: 26, size: rand(10, 18), color: '#f0f0f0', alpha: 0.7 }); } },
    super: { super: true, name: 'O FAZ-TUDO RESOLVE', st: 8, act: 12, rec: 30, lunge: [8, 20, 19], box: [10, 40, 104, 170], dmg: 20, cine: true, chip: 25, bstun: 20, gdmg: 30, inv: [0, 10], hit: 'clang', hs: 8, anim: atk(8, 12, 30, S.swingW, S.swing) },
  },
  companion(ctx, f, t) { drawTurtlebot(ctx, f.cx, GROUND + 4, 0.62, t); },
  drawBack(ctx, f) {
    const mv = f.move;
    if (f.state === 'attack' && mv === f.char.moves.sp2c && f.mf > 9 && f.mf < 44) drawTool(ctx, 'ext', -16, -74, -0.08, 1.2);
  },
  overlay(ctx, f, t) {
    const mv = f.move;
    if (f.state === 'attack' && mv === f.char.moves.sp2b && f.mf > mv.st - 2 && f.mf <= mv.st + mv.act + 3) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
      const ox = f.x + f.facing * 96, oy = GROUND - 170;
      for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = i % 2 ? '#fff' : '#7fd4ff'; ctx.lineWidth = i % 2 ? 2.5 : 5;
        bolt(ctx, ox, oy, ox + f.facing * rand(170, 300), oy + rand(-110, 110), 7, 26);
      }
      ctx.restore();
    }
  },
  cine: {
    dur: 235,
    hits: [[16, 40, 'clang', 1.2], [48, 40, 'bonk', 1.2], [70, 10, 'hit_l', 0.7], [78, 10, 'hit_l', 0.7], [86, 10, 'hit_l', 0.7], [94, 10, 'hit_l', 0.7], [102, 10, 'hit_l', 0.7], [188, 140, 'hit_s', 2]],
    begin(m, a, d, c) { c.dir = d.x >= a.x ? 1 : -1; a.facing = c.dir; d.facing = -c.dir; },
    step(m, a, d, f, c) {
      a.x += (d.x - c.dir * 128 - a.x) * 0.3; d.y *= 0.7;
      a.exprOverride = 'a';
      const fx = m.fx, hx = d.x, hy = GROUND - 190;
      if (f < 30) { cpose(a, f < 12 ? S.swingW : S.swing, 4); if (f === 16) fx.text(hx, hy - 80, 'CLANG!', '#cfd6e2', 40, { rot: -0.15 }); }
      else if (f < 60) {
        cpose(a, f < 44 ? S.swingW : S.swing, 4);
        if (f === 48) { fx.text(hx, hy - 90, 'BONK!', '#ffd23f', 44, { rot: 0.12 }); for (let i = 0; i < 5; i++) fx.add({ type: 'star', x: hx, y: hy - 60, vx: rand(-5, 5), vy: rand(-7, -3), g: 0.3, life: 40, size: 12, color: '#ffd23f', vr: 0.3, front: true }); }
        d.squash = f >= 48 && f < 58 ? 0.62 : 1;
      } else if (f < 112) {
        cpose(a, S.both, 5);
        if (f === 64) { Audio.sfx('drill'); fx.text(hx, hy - 90, 'BZZZZT!', '#ff8a3c', 38); }
        if (f === 86) Audio.sfx('drill');
        if (f > 66 && f < 106 && f % 2 === 0) fx.burst(hx - c.dir * 30, GROUND - 150, 2, ['#ffd23f', '#fff'], 12, { front: true, arc: 1.2, dir: c.dir > 0 ? Math.PI : 0 });
      } else if (f < 152) {
        cpose(a, f % 16 < 8 ? S.throwW : S.throw, 5);
        if (f === 114) { Audio.sfx('tape'); fx.text(hx, hy - 90, 'FITA NELE!', '#d0d4dc', 34); }
        if (f === 132) Audio.sfx('tape');
      } else {
        cpose(a, f < 180 ? S.swingW : S.swing, f < 180 ? 10 : 4);
        if (f === 154) Audio.sfx('gambiarra');
        if (f === 188) { fx.explosion(hx, hy + 40, 1.3, ['#fff', '#ffd23f', '#ff8a3c']); m.flashA = 0.7; m.shake = 20; }
        if (f === 196) { Audio.sfx('stamp'); }
      }
      cpose(d, f % 30 < 15 ? S.dzA : S.dzB, 10);
      if (c.def.hits.some((h) => f >= h[0] && f < h[0] + 7)) cpose(d, S.hitHigh, 2);
    },
    drawFront(ctx, m, a, d, f, c) {
      // ferramenta do momento na mão do Rinaldo
      const sk = skeleton(a.pose), hand = sk.haF;
      const wx = a.x + a.facing * hand[0], wy = GROUND - a.y + hand[1];
      const ang = Math.atan2(sk.haF[1] - sk.elF[1], (sk.haF[0] - sk.elF[0]) * a.facing);
      if (f >= 30 && f < 60) drawTool(ctx, 'hammer', wx + Math.cos(ang) * 30, wy + Math.sin(ang) * 30, ang, 1.5);
      else if (f >= 60 && f < 112) drawTool(ctx, 'drill', wx + a.facing * 26 + rand(-2, 2), wy + rand(-2, 2), a.facing > 0 ? 0 : Math.PI, 1.5);
      else if (f >= 112 && f < 152) drawTool(ctx, 'tape', wx, wy, f * 0.3, 1.1);
      else if (f >= 152 && f < 200) { const s = 1 + easeOutBack(clamp((f - 152) / 16, 0, 1)) * 2.8; drawTool(ctx, 'wrench', wx + Math.cos(ang) * 34 * s, wy + Math.sin(ang) * 34 * s, ang, s); }
      // fita silver tape em volta do adversário
      if (f >= 116 && f < 200) {
        const n = Math.min(5, Math.floor((f - 112) / 7));
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          const y = GROUND - 100 - i * 26;
          ctx.strokeStyle = '#16131f'; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(d.x - 42, y + 5); ctx.lineTo(d.x + 42, y - 5); ctx.stroke();
          ctx.strokeStyle = i % 2 ? '#aeb4bf' : '#c9ced8'; ctx.lineWidth = 11; ctx.stroke();
        }
      }
      // carimbo final
      if (f >= 196) {
        const k = easeOutBack(clamp((f - 196) / 9, 0, 1));
        ctx.save(); ctx.translate(m.cam.x + 640, 300); ctx.rotate(-0.12); ctx.scale(2.4 - k * 1.4, 2.4 - k * 1.4);
        ctx.font = `italic 900 96px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0c2a12'; ctx.strokeText('RESOLVIDO ✔', 0, 0);
        ctx.fillStyle = '#5dff7a'; ctx.fillText('RESOLVIDO ✔', 0, 0);
        ctx.restore();
      }
    },
  },
});
