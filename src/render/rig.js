// Rig esquelético vetorial dos lutadores: pernas por IK, braços por FK, tudo desenhado em Canvas 2D.
// O "sprite" de cada personagem é gerado em tempo real a partir da pose (animação fluida, sem imagens estáticas).
import { D, TAU, shade } from '../core/util.js';

export const BODY = { thigh: 50, shin: 50, torso: 78, neck: 40, headR: 37, upper: 38, fore: 36, hipW: 9, shX: 7, ankle: 8 };
const OLC = '#16131f', OLW = 2.6;

// Vetor de pose: [lean, head, hy, ox, oy, rot, ffx, ffy, fbx, fby, afs, afe, abs, abe] (ângulos em graus)
export const BASE = [7, 0, 92, 0, 0, 0, 28, 0, -30, 0, 38, 98, 5, 112];

export function P(o = {}, base = BASE) {
  const p = Float32Array.from(base);
  if (o.lean !== undefined) p[0] = o.lean;
  if (o.head !== undefined) p[1] = o.head;
  if (o.hy !== undefined) p[2] = o.hy;
  if (o.ox !== undefined) p[3] = o.ox;
  if (o.oy !== undefined) p[4] = o.oy;
  if (o.rot !== undefined) p[5] = o.rot;
  if (o.ff) { p[6] = o.ff[0]; p[7] = o.ff[1]; }
  if (o.fb) { p[8] = o.fb[0]; p[9] = o.fb[1]; }
  if (o.af) { p[10] = o.af[0]; p[11] = o.af[1]; }
  if (o.ab) { p[12] = o.ab[0]; p[13] = o.ab[1]; }
  return p;
}

export function mixPose(a, b, t, out) {
  for (let i = 0; i < 14; i++) out[i] = a[i] + (b[i] - a[i]) * t;
  return out;
}

function ik(ax, ay, bx, by, l1, l2) {
  let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
  const m = l1 + l2 - 0.5;
  if (d > m) { dx *= m / d; dy *= m / d; d = m; bx = ax + dx; by = ay + dy; }
  if (d < 1) { d = 1; dy = 1; dx = 0; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  return [ax + (dx * a) / d + (h * dy) / d, ay + (dy * a) / d - (h * dx) / d, bx, by];
}

// Calcula as juntas no espaço local do lutador (origem nos pés, x para frente, y para baixo).
export function skeleton(p, B = BODY) {
  const ls = B.ls || 1;                       // escala das pernas (proporções alternativas reaproveitam as mesmas poses)
  const L = p[0] * D, ha = (p[0] * 0.55 + p[1]) * D, hy = p[2] * ls;
  const ux = Math.sin(L), uy = -Math.cos(L), fx = Math.cos(L), fy = Math.sin(L);
  const neck = [B.torso * ux, B.torso * uy];
  const head = [neck[0] + B.neck * Math.sin(ha), neck[1] - B.neck * Math.cos(ha)];
  const shF = [neck[0] + fx * B.shX - ux * 13, neck[1] + fy * B.shX - uy * 13];
  const shB = [neck[0] - fx * B.shX - ux * 13, neck[1] - fy * B.shX - uy * 13];
  const a1 = p[10] * D, a2 = a1 + p[11] * D, b1 = p[12] * D, b2 = b1 + p[13] * D;
  const elF = [shF[0] + B.upper * Math.sin(a1), shF[1] + B.upper * Math.cos(a1)];
  const haF = [elF[0] + B.fore * Math.sin(a2), elF[1] + B.fore * Math.cos(a2)];
  const elB = [shB[0] + B.upper * Math.sin(b1), shB[1] + B.upper * Math.cos(b1)];
  const haB = [elB[0] + B.fore * Math.sin(b2), elB[1] + B.fore * Math.cos(b2)];
  const kf = ik(B.hipW, 0, p[6] * ls, hy - p[7] * ls - B.ankle, B.thigh, B.shin);
  const kb = ik(-B.hipW, 0, p[8] * ls, hy - p[9] * ls - B.ankle, B.thigh, B.shin);
  const s = {
    hip: [0, 0], neck, head, shF, shB, elF, haF, elB, haB,
    hipF: [B.hipW, 0], hipB: [-B.hipW, 0], knF: [kf[0], kf[1]], ftF: [kf[2], kf[3]], knB: [kb[0], kb[1]], ftB: [kb[2], kb[3]],
  };
  const r = p[5] * D, c = Math.cos(r), sn = Math.sin(r), tx = p[3] * ls, ty = -hy - p[4] * ls;
  for (const k in s) { const q = s[k], x = q[0], y = q[1]; q[0] = x * c - y * sn + tx; q[1] = x * sn + y * c + ty; }
  s.L = L + r; s.ha = ha * 0.8 + r; s.rot = r;
  return s;
}

function seg(ctx, pts, w, col, ol = OLC) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = ol; ctx.lineWidth = w + OLW * 2; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
}
const along = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function blobs(ctx, list, R, col, ol) {
  ctx.fillStyle = ol;
  for (const b of list) { ctx.beginPath(); ctx.arc(b[0] * R, b[1] * R, b[2] * R + OLW, 0, TAU); ctx.fill(); }
  ctx.fillStyle = col;
  for (const b of list) { ctx.beginPath(); ctx.arc(b[0] * R, b[1] * R, b[2] * R, 0, TAU); ctx.fill(); }
}

function shoe(ctx, ft, r, C, dark) {
  const c = Math.cos(r), s = Math.sin(r);
  const pt = (x, y) => [ft[0] + x * c - y * s, ft[1] + x * s + y * c];
  const col = dark ? shade(C.shoes, -0.25) : C.shoes;
  seg(ctx, [pt(-5, 1), pt(17, 2)], 13, col, C.ol);
  ctx.strokeStyle = C.sole; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); const a = pt(-9, 7.5), b = pt(22, 7.5); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
}

function leg(ctx, hip, kn, ft, C, lk, dark, rot) {
  const col = dark ? shade(C.pants, -0.22) : C.pants;
  seg(ctx, [hip, kn, ft], lk.legW, col, C.ol);
  if (C.fade && !dark) {
    ctx.strokeStyle = C.fade; ctx.lineWidth = lk.legW * 0.42; ctx.lineCap = 'round';
    const a = along(hip, kn, 0.3), b = along(hip, kn, 0.95);
    ctx.beginPath(); ctx.moveTo(a[0] + 2, a[1]); ctx.lineTo(b[0] + 2, b[1]); ctx.stroke();
  }
  shoe(ctx, ft, rot, C, dark);
}

function arm(ctx, sh, el, ha, C, lk, dark, front, opts) {
  const sk = dark ? shade(C.skin, -0.2) : C.skin, sv = dark ? shade(C.shirt, -0.25) : C.shirt;
  const w = lk.armW;
  const dx = ha[0] - el[0], dy = ha[1] - el[1], dl = Math.hypot(dx, dy) || 1, nx = dx / dl, ny = dy / dl;
  if (front && lk.gear === 'gauntlet') {
    // Braço hidráulico do Tibas: antebraço de aço, pistão e punho que se estende.
    if (lk.sleeve === 'long') seg(ctx, [sh, el], w + 1, sv, C.ol);
    else { seg(ctx, [sh, el], w, sk, C.ol); seg(ctx, [sh, along(sh, el, 0.6)], w + 3, sv, C.ol); }
    const ext = (opts.gearExt || 0) * 190;
    const fist = [ha[0] + nx * ext, ha[1] + ny * ext];
    if (ext > 2) {
      seg(ctx, [ha, fist], 8, C.flashing ? '#fff' : '#d7dde6', C.ol);
      ctx.strokeStyle = C.flashing ? '#fff' : '#f28c28'; ctx.lineWidth = 3;
      for (let t = 0.2; t < 1; t += 0.2) { const q = along(ha, fist, t); ctx.beginPath(); ctx.moveTo(q[0] - ny * 7, q[1] + nx * 7); ctx.lineTo(q[0] + ny * 7, q[1] - nx * 7); ctx.stroke(); }
    }
    seg(ctx, [el, ha], w + 9, C.metal, C.ol);
    seg(ctx, [along(el, ha, 0.12), along(el, ha, 0.3)], w + 12, C.accent, C.ol);
    ctx.strokeStyle = '#e9eef5'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(el[0] - ny * 15 + nx * 6, el[1] + nx * 15 + ny * 6); ctx.lineTo(ha[0] - ny * 15 - nx * 4, ha[1] + nx * 15 - ny * 4); ctx.stroke();
    ctx.fillStyle = C.ol; ctx.beginPath(); ctx.arc(fist[0], fist[1], 17 + OLW, 0, TAU); ctx.fill();
    ctx.fillStyle = C.metalDark; ctx.beginPath(); ctx.arc(fist[0], fist[1], 17, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.metal; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(fist[0], fist[1], 10, 0, TAU); ctx.stroke();
    ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(fist[0], fist[1], 4.5, 0, TAU); ctx.fill();
    return;
  }
  if (lk.sleeve === 'long') {
    seg(ctx, [sh, el, ha], w, sv, C.ol);
    seg(ctx, [along(el, ha, 0.78), along(el, ha, 0.92)], w + 1.5, dark ? shade(C.shirt, -0.1) : shade(C.shirt, 0.18), C.ol);
  } else {
    seg(ctx, [sh, el, ha], w, sk, C.ol);
    seg(ctx, [sh, along(sh, el, 0.62)], w + 3, sv, C.ol);
  }
  if (front && lk.watch) seg(ctx, [along(el, ha, 0.74), along(el, ha, 0.86)], w + 1, '#3a2a22', C.ol);
  if (front && lk.gear === 'controller') {
    seg(ctx, [along(el, ha, 0.45), along(el, ha, 0.85)], w + 3, '#262b38', C.ol);
    seg(ctx, [along(el, ha, 0.55), along(el, ha, 0.75)], w - 5, C.flashing ? '#fff' : '#3fe0ff', 'rgba(0,0,0,0)');
  }
  if (front && lk.gear === 'wrench') {
    // Chave inglesa do Rinaldo, sempre na mão da frente.
    const a = [ha[0] - nx * 10, ha[1] - ny * 10], b = [ha[0] + nx * 50, ha[1] + ny * 50];
    seg(ctx, [a, b], 7, C.metal, C.ol);
    const ang = Math.atan2(ny, nx);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = C.ol; ctx.lineWidth = 9 + OLW * 2; ctx.beginPath(); ctx.arc(b[0] + nx * 8, b[1] + ny * 8, 9, ang + 0.75, ang - 0.75 + TAU); ctx.stroke();
    ctx.strokeStyle = C.metal; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(b[0] + nx * 8, b[1] + ny * 8, 9, ang + 0.85, ang - 0.85 + TAU); ctx.stroke();
    ctx.lineCap = 'round';
  }
  // mão
  const hr = lk.handR;
  ctx.fillStyle = C.ol; ctx.beginPath(); ctx.arc(ha[0], ha[1], hr + OLW, 0, TAU); ctx.fill();
  ctx.fillStyle = C.glove ? (dark ? shade(C.glove, -0.2) : C.glove) : sk; ctx.beginPath(); ctx.arc(ha[0], ha[1], hr, 0, TAU); ctx.fill();
  if (front && lk.gear === 'spinner') {
    // fidget spinner girando na mão
    const a0 = (opts.t || 0) * 0.45, cx = ha[0] + nx * 6, cy = ha[1] + ny * 6;
    const cols = C.flashing ? ['#fff', '#fff', '#fff'] : ['#3fe0ff', '#ff4fd8', '#ffd23f'];
    for (let i = 0; i < 3; i++) {
      const a = a0 + (i / 3) * TAU, lx = cx + Math.cos(a) * 11, ly = cy + Math.sin(a) * 11;
      ctx.fillStyle = C.ol; ctx.beginPath(); ctx.arc(lx, ly, 7.5, 0, TAU); ctx.fill();
      ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(lx, ly, 5.2, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = C.ol; ctx.beginPath(); ctx.arc(cx, cy, 5.5, 0, TAU); ctx.fill();
    ctx.fillStyle = C.flashing ? '#fff' : '#c8ccd6'; ctx.beginPath(); ctx.arc(cx, cy, 3.4, 0, TAU); ctx.fill();
  }
  if (lk.gear === 'holo') {
    ctx.strokeStyle = C.flashing ? '#fff' : 'rgba(63,224,255,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ha[0], ha[1], hr + 5 + Math.sin((opts.t || 0) * 0.15) * 1.5, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(63,224,255,0.16)'; ctx.fill();
  }
}

function torso(ctx, sk, C, lk, opts) {
  const L = sk.L, ux = Math.sin(L), uy = -Math.cos(L), fx = Math.cos(L), fy = Math.sin(L);
  const h = sk.hip, n = sk.neck, sw = lk.sw / 2, ww = lk.ww / 2, bl = lk.belly || 0;
  const pt = (o, f, u) => [o[0] + fx * f + ux * u, o[1] + fy * f + uy * u];
  const poly = [pt(h, ww + bl * 3, 3), pt(h, -ww, 3), pt(n, -sw, -15), pt(n, sw, -15)];
  if (bl) poly.push(pt(h, ww + bl * 9, 30));
  const path = () => { ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]); ctx.closePath(); };
  // quadril (calça) por baixo da barra da camiseta
  seg(ctx, [sk.hipB, sk.hipF], lk.legW + 1, C.pants, C.ol);
  ctx.lineJoin = 'round';
  path(); ctx.strokeStyle = C.ol; ctx.lineWidth = 12 + OLW * 2; ctx.stroke();
  ctx.strokeStyle = C.shirt; ctx.lineWidth = 12; ctx.stroke(); ctx.fillStyle = C.shirt; ctx.fill();
  // estampa e acessórios no espaço local do tronco
  ctx.save();
  path(); ctx.lineWidth = 11; ctx.clip();
  const cx = n[0] * 0.6 + h[0] * 0.4, cy = n[1] * 0.6 + h[1] * 0.4;
  ctx.translate(cx, cy); ctx.rotate(L);
  // sombra suave nas costas para dar volume
  ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(-sw - 12, -60, sw * 0.62, 130);
  if (!C.flashing) drawPrint(ctx, lk, C, sw, opts);
  ctx.restore();
}

function drawPrint(ctx, lk, C, sw, opts) {
  const flip = opts.flip || 1, t = opts.t || 0;
  switch (lk.print) {
    case 'zune': {
      ctx.save(); ctx.translate(-7, -15); ctx.scale(flip, 1);
      ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-11, -6); ctx.lineTo(11, -6); ctx.moveTo(-6, -6); ctx.lineTo(-3, -1); ctx.moveTo(6, -6); ctx.lineTo(3, -1); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -2, 3.2, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-9, -8, 5, 1.3, 0, 0, TAU); ctx.ellipse(9, -8, 5, 1.3, 0, 0, TAU); ctx.fill();
      ctx.font = '900 10px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ZUNE', 0, 11);
      ctx.restore();
      break;
    }
    case 'leaf': {
      ctx.fillStyle = '#a4a6bd'; ctx.fillRect(-sw - 14, -24, sw * 2 + 28, 54);
      ctx.fillStyle = '#1c1c28'; ctx.fillRect(-sw - 14, -27, sw * 2 + 28, 4);
      ctx.fillStyle = '#e8e8f0'; for (let x = -sw - 12; x < sw + 14; x += 7) ctx.fillRect(x, -26, 3, 2);
      ctx.strokeStyle = '#5f6488'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      const leaf = (x, y, r, a) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = 'rgba(92,98,140,0.55)'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.42, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
        for (let i = -2; i <= 2; i++) { ctx.moveTo(i * r * 0.3, 0); ctx.lineTo(i * r * 0.3 + r * 0.2, -r * 0.3); ctx.moveTo(i * r * 0.3, 0); ctx.lineTo(i * r * 0.3 + r * 0.2, r * 0.3); }
        ctx.stroke(); ctx.restore();
      };
      leaf(-8, -4, 20, -0.5); leaf(14, 12, 18, 0.5); leaf(-16, 20, 14, 0.2); leaf(12, -14, 12, -1.1);
      break;
    }
    case 'robotarm': {
      ctx.save(); ctx.translate(-6, -8); ctx.scale(flip, 1);
      ctx.strokeStyle = '#27405c'; ctx.fillStyle = '#27405c'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-10, 12); ctx.lineTo(-8, -2); ctx.lineTo(4, -12); ctx.lineTo(14, -6); ctx.stroke();
      ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(19, -9); ctx.moveTo(14, -6); ctx.lineTo(18, -1); ctx.stroke();
      for (const q of [[-10, 12], [-8, -2], [4, -12]]) { ctx.beginPath(); ctx.arc(q[0], q[1], 3.4, 0, TAU); ctx.fill(); }
      ctx.fillRect(-16, 13, 13, 3);
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, 21); ctx.lineTo(16, 21); ctx.moveTo(-8, 25); ctx.lineTo(10, 25); ctx.stroke();
      ctx.restore();
      break;
    }
    case 'badge': {
      // camisa social: gola, botões, cinto e crachá de congresso balançando
      ctx.fillStyle = shade(C.shirt, 0.16);
      ctx.beginPath(); ctx.moveTo(-2, -34); ctx.lineTo(16, -34); ctx.lineTo(9, -22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(C.shirt, -0.3);
      for (let y = -14; y < 34; y += 11) { ctx.beginPath(); ctx.arc(11, y, 1.5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#17171b'; ctx.fillRect(-sw - 14, 36, sw * 2 + 30, 8);
      ctx.fillStyle = '#c9ccd4'; ctx.fillRect(10, 36, 8, 8);
      const sway = Math.sin(t * 0.07) * 0.1 + (opts.sway || 0);
      ctx.save(); ctx.translate(6, -32); ctx.rotate(sway);
      ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(0, 40); ctx.lineTo(9, 0); ctx.stroke();
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(-9, 38, 18, 22);
      ctx.fillStyle = '#f0632c'; ctx.fillRect(-9, 38, 18, 9); ctx.fillRect(-9, 55, 18, 5);
      ctx.restore();
      break;
    }
    case 'polo': {
      // gola polo, botões e corrente com pingente
      ctx.fillStyle = shade(C.shirt, 0.16);
      ctx.beginPath(); ctx.moveTo(-6, -36); ctx.lineTo(4, -20); ctx.lineTo(10, -36); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, -36); ctx.lineTo(13, -20); ctx.lineTo(22, -36); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e9ecf2'; for (const y of [-14, -4]) { ctx.beginPath(); ctx.arc(10, y, 1.6, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#c8ccd6'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-2, -34); ctx.lineTo(9, 8); ctx.lineTo(18, -34); ctx.stroke();
      ctx.fillStyle = '#dfe3ea'; ctx.beginPath(); ctx.arc(9, 10, 3.6, 0, TAU); ctx.fill();
      break;
    }
    case 'necklace': {
      ctx.strokeStyle = '#c8ccd6'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-6, -36); ctx.lineTo(8, -12); ctx.lineTo(16, -36); ctx.stroke();
      ctx.fillStyle = '#dfe3ea'; ctx.beginPath(); ctx.arc(8, -10, 3, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(63,224,255,0.75)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-sw, 6); ctx.lineTo(-6, 6); ctx.lineTo(0, 14); ctx.lineTo(sw + 10, 14); ctx.moveTo(-sw, 22); ctx.lineTo(4, 22); ctx.lineTo(9, 28); ctx.lineTo(sw + 10, 28); ctx.stroke();
      ctx.fillStyle = '#3fe0ff'; ctx.beginPath(); ctx.arc(0, 14, 2.4, 0, TAU); ctx.arc(9, 28, 2.4, 0, TAU); ctx.fill();
      break;
    }
  }
  if (lk.toolbelt) {
    ctx.fillStyle = '#7a4a22'; ctx.fillRect(-sw - 14, 36, sw * 2 + 30, 9);
    ctx.fillStyle = '#5c3615'; ctx.fillRect(-sw + 2, 38, 17, 16);
    ctx.fillStyle = '#d9b23c'; ctx.fillRect(12, 37, 7, 7);
  }
}

function face(ctx, R, C, lk, ex) {
  const ex1 = R * 0.2, ex2 = R * 0.68, ey = -R * 0.05;
  const dark = '#1b1722';
  const aviator = lk.glasses === 'aviator';
  // sobrancelhas
  ctx.strokeStyle = C.hair; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
  const bt = ex === 'a' || ex === 'b' ? 4 : ex === 'h' || ex === 'k' ? -4 : 0;
  ctx.beginPath();
  ctx.moveTo(ex1 - 8, ey - 13 - bt * 0.6); ctx.lineTo(ex1 + 7, ey - 12 + bt);
  ctx.moveTo(ex2 - 5, ey - 12 + bt); ctx.lineTo(ex2 + 5, ey - 13 - bt * 0.4);
  ctx.stroke();
  // olhos
  if (!aviator) {
    if (ex === 'k') {
      ctx.strokeStyle = dark; ctx.lineWidth = 2.6;
      for (const [x, s] of [[ex1, 5], [ex2, 4]]) { ctx.beginPath(); ctx.moveTo(x - s, ey - s); ctx.lineTo(x + s, ey + s); ctx.moveTo(x + s, ey - s); ctx.lineTo(x - s, ey + s); ctx.stroke(); }
    } else if (ex === 'h') {
      ctx.strokeStyle = dark; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(ex1 - 6, ey - 4); ctx.lineTo(ex1 + 4, ey); ctx.lineTo(ex1 - 6, ey + 4); ctx.moveTo(ex2 + 5, ey - 4); ctx.lineTo(ex2 - 3, ey); ctx.lineTo(ex2 + 5, ey + 4); ctx.stroke();
    } else if (ex === 'w') {
      ctx.strokeStyle = dark; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ex1, ey + 3, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex2, ey + 3, 4.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else {
      const sq = ex === 'a' || ex === 'b' ? 0.75 : 1;
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(ex1, ey, 4.8, 6.8 * sq, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ex2, ey, 3.5, 6.2 * sq, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex1 + 1.6, ey - 2.4, 1.7, 0, TAU); ctx.arc(ex2 + 1.2, ey - 2.2, 1.3, 0, TAU); ctx.fill();
    }
  }
  // nariz
  ctx.strokeStyle = shade(C.skin, -0.28); ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(R * 0.5, R * 0.1); ctx.quadraticCurveTo(R * 0.62, R * 0.2, R * 0.5, R * 0.24); ctx.stroke();
  // barba
  if (lk.beard && lk.beard !== 'none') {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, R * 0.04, R * 0.97, R * 1.05, 0, 0, TAU); ctx.clip();
    const shape = (y0) => {
      ctx.beginPath(); ctx.moveTo(-R * 0.62, -R * 0.08 + y0 * 0.4);
      ctx.quadraticCurveTo(-R * 0.3, R * 0.42 + y0, R * 0.15, R * 0.3 + y0);
      ctx.quadraticCurveTo(R * 0.5, R * 0.2 + y0, R * 1.0, R * 0.3 + y0);
      ctx.lineTo(R * 1.2, R * 1.3); ctx.lineTo(-R * 1.2, R * 1.3); ctx.lineTo(-R * 1.0, -R * 0.08); ctx.closePath();
    };
    if (lk.beard === 'full') { ctx.fillStyle = C.hair; shape(0); ctx.fill(); }
    else if (lk.beard === 'short') { ctx.fillStyle = C.hair; ctx.globalAlpha = 0.9; shape(R * 0.2); ctx.fill(); ctx.globalAlpha = 1; }
    else if (lk.beard === 'stubble') { ctx.fillStyle = C.hair; ctx.globalAlpha = 0.22; shape(R * 0.06); ctx.fill(); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(R * 0.5, R * 0.86, R * 0.3, R * 0.16, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
    // bigode
    const mw = lk.beard === 'full' ? 6 : lk.beard === 'mustache' ? 5.5 : lk.beard === 'short' ? 4 : 2.6;
    ctx.globalAlpha = lk.beard === 'stubble' ? 0.6 : 1;
    ctx.strokeStyle = C.hair; ctx.lineWidth = mw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(R * 0.2, R * 0.4); ctx.quadraticCurveTo(R * 0.52, R * 0.28, R * 0.86, R * 0.4); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // boca
  const mx = R * 0.5, my = R * 0.56;
  if (ex === 'a' || ex === 'h' || ex === 'k') {
    ctx.fillStyle = '#3a1218'; ctx.beginPath(); ctx.ellipse(mx, my + 1, ex === 'a' ? 8 : 6, ex === 'a' ? 6.5 : 7.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(mx - 5, my - 4.5, 10, 2.6);
  } else if (ex === 'w') {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = dark; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(mx - 11, my - 3); ctx.quadraticCurveTo(mx, my + 12, mx + 11, my - 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (ex === 'b') {
    ctx.strokeStyle = dark; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(mx - 7, my + 1); ctx.lineTo(mx + 7, my - 1); ctx.stroke();
  } else {
    ctx.strokeStyle = lk.beard === 'full' ? shade(C.skin, -0.1) : dark; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(mx - 7, my - 1); ctx.quadraticCurveTo(mx, my + (lk.smile ? 5 : 2), mx + 8, my - 2); ctx.stroke();
  }
  // óculos
  if (lk.glasses) {
    const g = lk.glasses;
    const frame = g === 'aviator' ? '#c9a24a' : g === 'thin' ? '#3b3f4d' : '#17151c';
    const lw = g === 'aviator' ? 2 : g === 'thin' ? 1.8 : 3.4;
    const lens = (x, w, h) => {
      ctx.beginPath();
      if (g === 'aviator') { ctx.moveTo(x - w / 2, ey - h * 0.45); ctx.lineTo(x + w / 2, ey - h * 0.45); ctx.quadraticCurveTo(x + w * 0.56, ey + h * 0.5, x, ey + h * 0.62); ctx.quadraticCurveTo(x - w * 0.56, ey + h * 0.5, x - w / 2, ey - h * 0.45); }
      else ctx.roundRect(x - w / 2, ey - h / 2, w, h, g === 'thin' ? 5 : 3.5);
    };
    ctx.lineWidth = lw; ctx.strokeStyle = frame;
    const sizes = g === 'aviator' ? [[ex1, 23, 21], [ex2, 15, 20]] : [[ex1, 21, 16], [ex2, 14, 15]];
    for (const [x, w, h] of sizes) {
      lens(x, w, h);
      if (g === 'aviator') { const gr = ctx.createLinearGradient(0, ey - 10, 0, ey + 12); gr.addColorStop(0, 'rgba(70,45,30,0.92)'); gr.addColorStop(1, 'rgba(190,120,70,0.75)'); ctx.fillStyle = gr; }
      else ctx.fillStyle = g === 'thin' ? 'rgba(140,190,255,0.2)' : 'rgba(255,255,255,0.2)';
      ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(ex1 + sizes[0][1] / 2, ey - 3); ctx.lineTo(ex2 - sizes[1][1] / 2, ey - 3);
    ctx.moveTo(ex1 - sizes[0][1] / 2, ey - 3); ctx.lineTo(-R * 0.42, ey - 1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(ex1 - 5, ey - 4); ctx.lineTo(ex1 - 1, ey - 6); ctx.stroke();
  }
}

function hairBack(ctx, R, C, lk) {
  if (lk.hairStyle === 'wavy') blobs(ctx, [[-0.78, 0.05, 0.5], [-0.95, -0.35, 0.48], [-0.72, 0.45, 0.36], [-0.52, 0.74, 0.25]], R, C.hair, C.ol);
}

function hairTop(ctx, R, C, lk) {
  const hs = lk.hairStyle;
  const cap = (alpha) => {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, R * 0.97, R * 1.03, 0, 0, TAU); ctx.clip();
    ctx.globalAlpha = alpha; ctx.fillStyle = C.hair;
    ctx.beginPath(); ctx.moveTo(-R * 1.2, R * 0.12); ctx.lineTo(-R * 0.62, R * 0.12); ctx.lineTo(-R * 0.5, -R * 0.25);
    ctx.quadraticCurveTo(-R * 0.1, -R * 0.62, R * 0.5, -R * 0.66); ctx.lineTo(R * 0.9, -R * 0.56); ctx.lineTo(R * 1.2, -R * 0.6);
    ctx.lineTo(R * 1.2, -R * 1.3); ctx.lineTo(-R * 1.2, -R * 1.3); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  const shape = (pts) => {
    ctx.beginPath(); ctx.moveTo(pts[0][0] * R, pts[0][1] * R);
    for (let i = 1; i < pts.length; i++) {
      const q = pts[i];
      if (q.length === 6) ctx.bezierCurveTo(q[0] * R, q[1] * R, q[2] * R, q[3] * R, q[4] * R, q[5] * R); else ctx.lineTo(q[0] * R, q[1] * R);
    }
    ctx.closePath();
    ctx.lineJoin = 'round'; ctx.strokeStyle = C.ol; ctx.lineWidth = OLW * 2; ctx.stroke();
    ctx.fillStyle = C.hair; ctx.fill();
  };
  if (hs === 'fringe') {
    shape([[-1.02, 0.12], [-1.25, -0.75, -0.5, -1.34, 0.15, -1.26], [0.75, -1.2, 1.14, -0.8, 1.0, -0.36],
      [0.82, -0.54], [0.7, -0.3], [0.45, -0.56], [0.28, -0.36], [0, -0.6], [-0.3, -0.5], [-0.45, -0.05], [-0.62, -0.2], [-0.7, 0.2]]);
  } else if (hs === 'short') {
    shape([[-1.0, 0.08], [-1.18, -0.7, -0.55, -1.24, 0.1, -1.2], [0.6, -1.22, 1.04, -1.08, 0.98, -0.58],
      [0.78, -0.68], [0.3, -0.74], [-0.25, -0.62], [-0.42, -0.1], [-0.6, -0.22], [-0.68, 0.15]]);
  } else if (hs === 'buzz') {
    cap(0.92);
  } else if (hs === 'wavy') {
    blobs(ctx, [[-0.62, -0.72, 0.5], [-0.15, -0.98, 0.5], [0.35, -0.95, 0.46], [0.75, -0.7, 0.34], [0.96, -0.42, 0.2], [-0.72, -0.12, 0.3]], R, C.hair, C.ol);
  } else if (hs === 'curlytop') {
    cap(0.9);
    blobs(ctx, [[-0.8, -0.55, 0.26], [-0.55, -0.82, 0.3], [-0.2, -1.0, 0.32], [0.2, -1.05, 0.32], [0.58, -0.92, 0.3], [0.86, -0.68, 0.24], [0.0, -0.8, 0.3], [0.4, -0.78, 0.28]], R, C.hair, C.ol);
  }
  if (hs !== 'buzz' && !C.flashing) {
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(R * 0.1, -R * 0.55, R * 0.55, Math.PI * 1.25, Math.PI * 1.7); ctx.stroke();
  }
  if (lk.goggles) {
    // óculos FPV de piloto de drone erguidos na testa
    ctx.strokeStyle = '#1d2029'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-R * 0.92, -R * 0.3); ctx.quadraticCurveTo(-R * 0.3, -R * 0.95, R * 0.4, -R * 0.82); ctx.stroke();
    ctx.save(); ctx.translate(R * 0.62, -R * 0.78); ctx.rotate(0.28);
    ctx.fillStyle = C.ol; ctx.beginPath(); ctx.roundRect(-20 - OLW, -11 - OLW, 40 + OLW * 2, 22 + OLW * 2, 7); ctx.fill();
    ctx.fillStyle = '#2b3040'; ctx.beginPath(); ctx.roundRect(-20, -11, 40, 22, 6); ctx.fill();
    const gr = ctx.createLinearGradient(-14, -6, 14, 6); gr.addColorStop(0, '#9af3ff'); gr.addColorStop(1, '#1b8fb5');
    ctx.fillStyle = C.flashing ? '#fff' : gr; ctx.beginPath(); ctx.roundRect(-15, -6.5, 30, 13, 4); ctx.fill();
    ctx.restore();
  }
}

const WHITE = { get: (t, k) => (k === 'flashing' ? true : k === 'ol' ? '#ff9aa5' : typeof t[k] === 'string' && (t[k][0] === '#' || t[k].startsWith('rgb')) ? '#ffffff' : t[k]) };

// Deriva medidas e cores auxiliares de um "look" (aparência baseada na foto).
export function prepLook(lk) {
  const b = lk.build || 1;
  lk.sw = 50 * b; lk.ww = (lk.belly ? 50 : 41) * b; lk.legW = 22 * Math.sqrt(b) + 1; lk.armW = 16.5 * Math.sqrt(b); lk.handR = 10 * Math.sqrt(b);
  lk.ol = OLC;
  lk.metal = lk.metal || '#aeb6c4'; lk.metalDark = lk.metalDark || '#596273'; lk.accent = lk.accent || '#f28c28';
  lk.white = new Proxy(lk, WHITE);
  return lk;
}

// Desenha o lutador. O contexto já deve estar transladado para os pés e espelhado conforme o lado.
// opts: {expr, t, flash, gearExt, flip, sway, squash, body}
export function drawFighter(ctx, lk, pose, opts = {}) {
  const B = opts.body || BODY;
  const sk = skeleton(pose, B);
  const C = opts.flash ? lk.white : lk;
  const R = BODY.headR;
  arm(ctx, sk.shB, sk.elB, sk.haB, C, lk, true, false, opts);
  leg(ctx, sk.hipB, sk.knB, sk.ftB, C, lk, true, sk.rot);
  leg(ctx, sk.hipF, sk.knF, sk.ftF, C, lk, false, sk.rot);
  torso(ctx, sk, C, lk, opts);
  seg(ctx, [[sk.neck[0] - Math.sin(sk.L) * 6, sk.neck[1] + Math.cos(sk.L) * 6], along(sk.neck, sk.head, 0.5)], 15, shade(lk.skin, opts.flash ? 1 : -0.12), C.ol);
  ctx.save();
  ctx.translate(sk.head[0], sk.head[1]); ctx.rotate(sk.ha);
  if (B !== BODY) ctx.scale(B.headR / BODY.headR, B.headR / BODY.headR);
  hairBack(ctx, R, C, lk);
  ctx.fillStyle = C.ol; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.94 + OLW, R + OLW, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = C.skin; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.94, R, 0, 0, TAU); ctx.fill();
  // orelha
  ctx.fillStyle = C.ol; ctx.beginPath(); ctx.ellipse(-R * 0.36, R * 0.1, 7 + OLW * 0.7, 10 + OLW * 0.7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = opts.flash ? '#fff' : shade(lk.skin, -0.1); ctx.beginPath(); ctx.ellipse(-R * 0.36, R * 0.1, 7, 10, 0, 0, TAU); ctx.fill();
  if (!opts.flash) face(ctx, R, C, lk, opts.expr || 'n');
  if (lk.earphone && !opts.flash) {
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-R * 0.36, R * 0.14, 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-R * 0.36, R * 0.2); ctx.quadraticCurveTo(-R * 0.5, R * 0.9, -R * 0.1, R * 1.25); ctx.stroke();
  }
  hairTop(ctx, R, C, lk);
  ctx.restore();
  arm(ctx, sk.shF, sk.elF, sk.haF, C, lk, false, true, opts);
  return sk;
}

// Retrato (busto) usado na seleção e no HUD.
export function makePortrait(lk, size, pose, bg) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, size, size); }
  const k = size / 150;
  x.translate(size * 0.45, size * 2.3); x.scale(k * 1.25, k * 1.25);
  drawFighter(x, lk, pose, { expr: 'n' });
  return c;
}
