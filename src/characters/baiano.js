// BAIANO — Zune Drones. Zoner de precisão: controla o espaço aéreo com drones.
import { BASE_MOVES } from '../combat/moves.js';
import { S, A, atk, P } from '../render/poses.js';
import { Ent, cpose } from '../combat/entities.js';
import { drawDrone } from '../render/props.js';
import { GROUND, FONT_M } from '../core/config.js';
import { Audio } from '../core/audio.js';
import { clamp, rand, smooth, easeOut, TAU } from '../core/util.js';

const idleA = P({ lean: 4, hy: 94, af: [58, 68], ab: [10, 118] });
const idleB = P({ lean: 6, hy: 90, af: [62, 62], ab: [14, 112] });

function spawnDrone(f, opp, m, i) {
  if (i === 0) Audio.sfx('drone');
  m.ents.push(new Ent({
    owner: f, x: f.x + f.facing * 36, y: 200 + i * 26, vx: f.facing * (5 + i * 1.5), vy: 3.5 - i * 2.4, w: 46, h: 30, life: 135, clash: true,
    hit: { dmg: 26, stun: 17, bstun: 10, push: 3, hs: 4, chip: 3, gdmg: 9, gain: 2, hit: 'hit_l' },
    tick(e, mm) {
      const o = mm.f[1 - e.owner.idx];
      if (e.t > 7) {
        const dx = o.x - e.x, dy = o.y + (o.crouching ? 80 : 130) - e.y, d = Math.hypot(dx, dy) || 1;
        e.vx += (dx / d) * 0.7; e.vy += (dy / d) * 0.7;
        const sp = Math.hypot(e.vx, e.vy);
        if (sp > 9.2) { e.vx *= 9.2 / sp; e.vy *= 9.2 / sp; }
      }
      if (e.y < 26) { e.y = 26; e.vy = Math.abs(e.vy) * 0.4; }
      if (e.t % 3 === 0) mm.fx.add({ type: 'glow', x: e.x, y: GROUND - e.y, life: 10, size: 6, color: 'rgba(63,224,255,0.45)' });
    },
    onHit(e, mm) { mm.fx.explosion(e.x, GROUND - e.y, 0.32, ['#fff', '#3fe0ff', '#ffd23f']); },
    draw(ctx, e, mm) { drawDrone(ctx, e.x, GROUND - e.y, 0.82, mm.t + i * 9, { tilt: clamp(e.vx * 0.045, -0.5, 0.5), led: '#ff4455' }); },
  }));
}

function airStrike(f, opp, m) {
  Audio.sfx('drone');
  m.ents.push(new Ent({
    owner: f, x: opp.x, y: 0, life: 84, hit: null, warn: true, lockT: 34, fireT: 56, persist: true, rehit: 40,
    tick(e, mm) {
      const o = mm.f[1 - e.owner.idx];
      if (e.t < 34) e.x += (o.x - e.x) * 0.14;
      if (e.t === 34) Audio.sfx('lockon');
      if (e.t === 56) { e.hit = { dmg: 95, kd: [4, 14], hs: 10, chip: 14, bstun: 16, gdmg: 34, hit: 'hit_s', hy: 110 }; Audio.sfx('beam'); mm.shake = Math.max(mm.shake, 9); }
      if (e.t === 66) e.hit = null;
      if (e.t >= 56 && e.t < 68 && e.t % 2 === 0) mm.fx.burst(e.x + rand(-44, 44), GROUND - 4, 3, ['#3fe0ff', '#fff'], 10, { arc: 0.9, dir: -Math.PI / 2 });
    },
    getBox(e) { return { x: e.x - 58, y: 0, w: 116, h: GROUND }; },
    draw(ctx, e, mm) {
      const locked = e.t >= 34, col = locked ? '#ff4455' : '#3fe0ff';
      const dy = 118 + Math.max(0, 14 - e.t) * -16;
      // mira no chão
      ctx.save(); ctx.translate(e.x, GROUND + 4); ctx.scale(1, 0.28);
      ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.globalAlpha = 0.9;
      const r = locked ? 62 : 62 + (34 - e.t) * 2.2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.rotate(mm.t * 0.08);
      for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.beginPath(); ctx.moveTo(r + 14, 0); ctx.lineTo(r - 18, 0); ctx.stroke(); }
      ctx.restore();
      // linha de mira e carga
      if (e.t < 56) {
        ctx.strokeStyle = col; ctx.globalAlpha = locked ? 0.5 + 0.4 * Math.sin(e.t * 0.9) : 0.25; ctx.lineWidth = 2; ctx.setLineDash([10, 9]);
        ctx.beginPath(); ctx.moveTo(e.x, dy + 20); ctx.lineTo(e.x, GROUND); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        if (locked) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(63,224,255,0.6)'; ctx.beginPath(); ctx.arc(e.x, dy + 24, (e.t - 34) * 0.9, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
      } else if (e.t < 76) {
        const k = e.t < 66 ? 1 : (76 - e.t) / 10, w = 104 * k;
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(e.x - w / 2, 0, e.x + w / 2, 0);
        g.addColorStop(0, 'rgba(63,224,255,0)'); g.addColorStop(0.3, 'rgba(63,224,255,0.85)'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.7, 'rgba(63,224,255,0.85)'); g.addColorStop(1, 'rgba(63,224,255,0)');
        ctx.fillStyle = g; ctx.fillRect(e.x - w / 2, dy + 16, w, GROUND - dy - 12);
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(e.x, GROUND, w * 0.9, 16 * k, 0, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      drawDrone(ctx, e.x, dy, 1.55, mm.t, { led: col });
    },
  }));
}

function dronePos(i, f, d, n = 12) {
  const cx = d.x, cy = GROUND - d.y - 130;
  const a = (i / n) * TAU + f * 0.07;
  const k = easeOut(clamp((f - i * 3) / 30, 0, 1));
  const conv = f > 176 ? clamp(1 - (f - 176) / 12, 0, 1) : 1;
  const rx = (240 + (1 - k) * 620) * conv, ry = (84 + (1 - k) * 260) * conv;
  return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry - (1 - k) * 200, front: Math.sin(a) >= 0, a };
}

// Corpo a corpo do Baiano: chutes rápidos de quem vive desviando de hélice.
const snapW = P({ lean: -4, hy: 96, ff: [26, 40], fb: [-12, 0], af: [44, 100], ab: [10, 112] });
const snap = P({ lean: -12, hy: 97, ff: [84, 74], fb: [-10, 0], af: [40, 104], ab: [12, 112] });
const backfistW = P({ lean: -6, hy: 94, ff: [24, 0], fb: [-28, 0], af: [-34, 110], ab: [20, 110] });
const backfist = P({ lean: 8, head: -4, hy: 92, ff: [34, 0], fb: [-30, 0], af: [100, 0], ab: [-10, 100] });
const flyKneeW = P({ lean: 12, hy: 80, ff: [26, 0], fb: [-26, 0], af: [30, 90], ab: [10, 100] });
const flyKnee = P({ lean: 14, hy: 96, oy: 30, ff: [62, 44], fb: [-34, 26], af: [26, 100], ab: [-30, 60] });
const axeW = P({ lean: -22, head: 6, hy: 99, ff: [58, 176], fb: [-8, 0], af: [-20, 60], ab: [40, 100] });
const axe = P({ lean: 16, hy: 90, ff: [102, 52], fb: [-10, 0], af: [-24, 60], ab: [30, 100] });

export default (look) => ({
  id: 'baiano', name: 'Baiano', title: 'Zune Drones', color: '#3fe0ff', stage: 'exp',
  desc: 'Piloto de drones da Zune. Domina o espaço aéreo e castiga de longe com precisão cirúrgica.',
  quote: 'Espaço aéreo liberado. Zune no comando!',
  style: 'Controle à distância',
  look, speed: 4.2, power: 1.02, defense: 1, compX: 54, compY: 262,
  anims: { idle: A(true, [0, idleA], [28, idleB], [56, idleA]) },
  info: {
    sp1: { name: 'Esquadrão de Drones', desc: 'Três drones perseguem o adversário.' },
    sp2: { name: 'Ataque Aéreo Zune', desc: 'Um drone trava a mira e dispara um feixe vertical.' },
    super: { name: 'Enxame Zune', desc: 'Doze drones cercam o alvo e disparam em sequência.' },
  },
  ai: { sp1: [280, 1100], sp2: [240, 1100], sup: 900 },
  moves: {
    ...BASE_MOVES,
    light1: { ...BASE_MOVES.light1, anim: atk(4, 3, 9, snapW, snap), box: [16, 70, 108, 60] },
    light2: { ...BASE_MOVES.light2, anim: atk(5, 3, 10, backfistW, backfist) },
    light3: { ...BASE_MOVES.light3, anim: atk(7, 4, 16, flyKneeW, flyKnee), box: [16, 90, 104, 110], lunge: [1, 7, 6] },
    heavy: { ...BASE_MOVES.heavy, st: 12, act: 4, rec: 19, dmg: 82, box: [20, 40, 138, 190], anim: atk(12, 4, 19, axeW, axe) },
    sp1: { special: true, cost: 20, st: 12, act: 1, rec: 24, anim: atk(12, 1, 24, S.pointW, S.point), sfx: 'whoosh_l', events: { 12: (f, o, m) => spawnDrone(f, o, m, 0), 19: (f, o, m) => spawnDrone(f, o, m, 1), 26: (f, o, m) => spawnDrone(f, o, m, 2) } },
    sp2: { special: true, cost: 30, st: 18, act: 1, rec: 22, anim: atk(18, 1, 22, S.upW, S.up), sfx: 'whoosh_h', events: { 14: airStrike } },
    super: { super: true, name: 'ENXAME ZUNE', st: 10, act: 8, rec: 34, box: [30, 0, 1000, 340], dmg: 20, cine: true, chip: 30, bstun: 22, gdmg: 30, inv: [0, 18], hit: 'hit_h', hs: 8, anim: atk(10, 8, 34, S.pointW, S.point), events: { 10: () => Audio.sfx('laser') } },
  },
  companion(ctx, f, t) { drawDrone(ctx, f.cx, GROUND - f.cy, 0.72, t + f.idx * 40, { tilt: clamp((f.x - f.facing * 54 - f.cx) * 0.012, -0.4, 0.4) }); },
  overlay(ctx, f, t) {
    const mv = f.move;
    if (f.state === 'attack' && mv && mv.super && f.mf > mv.st - 2 && f.mf <= mv.st + mv.act + 4) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const ox = f.x + f.facing * 90, oy = GROUND - 190;
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = i === 2 ? '#fff' : 'rgba(255,68,85,0.8)'; ctx.lineWidth = i === 2 ? 5 : 3;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + f.facing * 1100, oy + (i - 2) * 150 + Math.sin(t * 0.8 + i) * 40); ctx.stroke();
      }
      ctx.restore();
    }
  },
  cine: {
    dur: 215,
    hits: [...Array.from({ length: 10 }, (_, i) => [76 + i * 9, 16, 'laser', 0.75]), [188, 130, 'explosion', 2]],
    step(m, a, d, f) {
      cpose(a, f < 172 ? S.point : S.up, 8); a.exprOverride = 'a';
      cpose(d, S.launch, 6);
      d.y = smooth(clamp(f / 45, 0, 1)) * 150 + (f > 45 ? Math.sin(f * 0.2) * 6 : 0);
      if (f === 1) Audio.sfx('drone');
      if (f === 40) { Audio.sfx('lockon'); m.fx.text(d.x, GROUND - d.y - 300, 'ALVO TRAVADO', '#ff4455', 30, { life: 60, vy: -0.3 }); }
      if (f >= 76 && f <= 157 && (f - 76) % 9 === 0) {
        const p = dronePos(((f - 76) / 9 * 5) % 12, f, d);
        m.fx.add({ type: 'line', x: p.x, y: p.y, x2: d.x, y2: GROUND - d.y - 130, life: 9, size: 7, color: '#ff4455', front: true });
        m.fx.add({ type: 'line', x: p.x, y: p.y, x2: d.x, y2: GROUND - d.y - 130, life: 6, size: 3, color: '#ffffff', front: true });
      }
      if (f === 172) Audio.sfx('drone');
      if (f === 188) { m.fx.explosion(d.x, GROUND - d.y - 130, 1.7, ['#fff', '#3fe0ff', '#ffd23f', '#ff4455']); m.flashA = 0.75; m.shake = 20; }
    },
    drawBack(ctx, m, a, d, f) {
      // grade holográfica de controle de voo
      ctx.save(); ctx.globalAlpha = Math.min(1, f / 20) * 0.35; ctx.strokeStyle = '#3fe0ff'; ctx.lineWidth = 1;
      for (let x = Math.floor((m.cam.x) / 80) * 80; x < m.cam.x + 1300; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND); ctx.stroke(); }
      for (let y = 40; y < GROUND; y += 80) { ctx.beginPath(); ctx.moveTo(m.cam.x, y); ctx.lineTo(m.cam.x + 1300, y); ctx.stroke(); }
      ctx.restore();
      if (f < 190) for (let i = 0; i < 12; i++) { const p = dronePos(i, f, d); if (!p.front) drawDrone(ctx, p.x, p.y, 0.8, m.t + i * 7, { led: '#ff4455' }); }
    },
    drawFront(ctx, m, a, d, f) {
      if (f < 190) for (let i = 0; i < 12; i++) { const p = dronePos(i, f, d); if (p.front) drawDrone(ctx, p.x, p.y, 1.05, m.t + i * 7, { led: '#ff4455' }); }
      if (f > 28 && f < 186) {
        const cx = d.x, cy = GROUND - d.y - 130, r = 70 + Math.max(0, 50 - f) * 6;
        ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = '#ff4455'; ctx.lineWidth = 3; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
        ctx.rotate(f * 0.05);
        for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.beginPath(); ctx.moveTo(r + 16, 0); ctx.lineTo(r - 22, 0); ctx.stroke(); }
        ctx.restore();
        ctx.font = `bold 15px ${FONT_M}`; ctx.fillStyle = '#ff4455'; ctx.textAlign = 'left';
        ctx.fillText(`DIST ${(120 - f * 0.4).toFixed(1)}m  LOCK ${Math.min(100, Math.round((f - 28) * 3))}%`, cx + r + 14, cy - r + 10);
      }
    },
  },
});
