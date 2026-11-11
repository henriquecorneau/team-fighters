// Objetos animados usados nos golpes e cenários: drones, capivaras, engrenagens, ferramentas, hologramas e robôs.
import { TAU, shade } from '../core/util.js';
import { PIX, pixelProp } from './pixel.js';

const OL = '#16131f';

// Drone quadricóptero (visto de frente). s = escala; t = tempo para as hélices.
function droneRaw(ctx, x, y, s = 1, t = 0, o = {}) {
  ctx.save();
  ctx.translate(x, y + (o.still ? 0 : Math.sin(t * 0.13 + x * 0.01) * 2 * s)); ctx.rotate(o.tilt || 0); ctx.scale(s, s);
  const body = o.body || '#eef1f7', dark = o.dark || '#1b2a4a', led = o.led || '#3fe0ff';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // braços
  ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-30, -4); ctx.lineTo(30, -4); ctx.stroke();
  ctx.strokeStyle = dark; ctx.lineWidth = 4; ctx.stroke();
  // motores e hélices (borrão de rotação)
  for (const sx of [-30, 30, -16, 16]) {
    const back = Math.abs(sx) < 20;
    ctx.fillStyle = OL; ctx.fillRect(sx - 3.5, -12, 7, 9);
    ctx.fillStyle = back ? 'rgba(200,220,255,0.28)' : 'rgba(220,235,255,0.5)';
    const w = (back ? 13 : 19) * (0.75 + 0.25 * Math.sin(t * 1.7 + sx));
    ctx.beginPath(); ctx.ellipse(sx, -13, w, back ? 2 : 2.8, 0, 0, TAU); ctx.fill();
  }
  // corpo
  ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(-17, -11, 34, 20, 7); ctx.fill();
  ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-15, -9, 30, 16, 6); ctx.fill();
  ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(-15, 0, 30, 7, [0, 0, 6, 6]); ctx.fill();
  // trem de pouso
  ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(-14, 15); ctx.moveTo(10, 8); ctx.lineTo(14, 15); ctx.stroke();
  // câmera/LED
  ctx.fillStyle = OL; ctx.beginPath(); ctx.arc(0, 1, 6.5, 0, TAU); ctx.fill();
  ctx.fillStyle = led; ctx.beginPath(); ctx.arc(0, 1, 4.2, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 0.3);
  ctx.beginPath(); ctx.arc(0, 1, 11, 0, TAU); ctx.fill();
  ctx.restore();
}

// Capivara (de lado, olhando para +x). Origem nos pés. o: {run, sit, crown, orange, dark, squash}
function capyRaw(ctx, x, y, s = 1, t = 0, o = {}) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s * (o.dir || 1), s);
  const run = o.run ? 1 : 0;
  const bob = run ? Math.abs(Math.sin(t * 0.45)) * -6 : Math.sin(t * 0.06) * 1.2;
  const fur = o.color || '#a9713e', furD = shade(fur, -0.2), furL = shade(fur, 0.22), ol = '#3a2413';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // pernas
  const legs = [[-24, 0], [-12, 1.6], [16, 3.1], [27, 4.7]];
  for (let i = 0; i < 4; i++) {
    const sw = run ? Math.sin(t * 0.45 + legs[i][1]) * 11 : 0;
    const lx = legs[i][0], ly = o.sit ? -4 : -16 + bob * 0.3;
    ctx.strokeStyle = ol; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + sw, -3 - (run ? Math.max(0, Math.cos(t * 0.45 + legs[i][1])) * 5 : 0)); ctx.stroke();
    ctx.strokeStyle = i % 2 ? fur : furD; ctx.lineWidth = 8; ctx.stroke();
  }
  ctx.translate(0, bob - (o.sit ? -8 : 0));
  // corpo
  ctx.fillStyle = ol; ctx.beginPath(); ctx.ellipse(-4, -34, 41, 24.5, -0.04, 0, TAU); ctx.fill();
  ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(-4, -34, 38.5, 22, -0.04, 0, TAU); ctx.fill();
  ctx.fillStyle = furL; ctx.beginPath(); ctx.ellipse(0, -24, 28, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = furD; ctx.beginPath(); ctx.ellipse(-22, -44, 16, 8, -0.3, 0, TAU); ctx.fill();
  // cabeça retangular característica
  ctx.fillStyle = ol; ctx.beginPath(); ctx.roundRect(16, -66, 44, 36, 13); ctx.fill();
  ctx.fillStyle = fur; ctx.beginPath(); ctx.roundRect(18.5, -63.5, 39, 31, 11); ctx.fill();
  ctx.fillStyle = furD; ctx.beginPath(); ctx.roundRect(44, -56, 13.5, 21, [4, 9, 9, 4]); ctx.fill();
  // orelha, olho sonolento, focinho
  ctx.fillStyle = ol; ctx.beginPath(); ctx.ellipse(25, -66, 6.5, 5.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = furD; ctx.beginPath(); ctx.ellipse(25, -66, 4, 3.3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1b120a'; ctx.beginPath(); ctx.ellipse(36, -52, 3.4, o.angry ? 2.2 : 3.2, 0, 0, TAU); ctx.fill();
  if (!o.angry) { ctx.fillStyle = fur; ctx.fillRect(31, -57, 10, 3.4); }
  else { ctx.strokeStyle = '#1b120a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(31, -58); ctx.lineTo(41, -55); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(37, -53, 1, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.ellipse(55, -50, 2.4, 3.4, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(57, -41); ctx.lineTo(48, -40); ctx.stroke();
  if (o.orange) {
    ctx.fillStyle = '#b85a00'; ctx.beginPath(); ctx.arc(36, -72, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff9a1f'; ctx.beginPath(); ctx.arc(36, -72, 7.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3f8a2a'; ctx.beginPath(); ctx.ellipse(38, -80, 4, 2, -0.5, 0, TAU); ctx.fill();
  }
  if (o.crown) {
    ctx.fillStyle = '#7a5600'; ctx.strokeStyle = '#7a5600'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(22, -64); ctx.lineTo(20, -82); ctx.lineTo(28, -72); ctx.lineTo(35, -86); ctx.lineTo(42, -72); ctx.lineTo(50, -82); ctx.lineTo(48, -64); ctx.closePath();
    ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e3212f'; ctx.beginPath(); ctx.arc(35, -70, 2.6, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function gearRaw(ctx, x, y, r, teeth, rot, fill, stroke = OL, hole = 0.35) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  const n = teeth * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, rr = i % 4 < 2 ? r : r * 0.8;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1.5, r * 0.05); ctx.lineJoin = 'round'; ctx.stroke(); }
  ctx.fillStyle = stroke || OL; ctx.beginPath(); ctx.arc(0, 0, r * hole, 0, TAU); ctx.fill();
  ctx.fillStyle = shade(fill.startsWith('#') ? fill : '#888888', -0.3);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58, r * 0.07, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// Ferramentas: 'wrench' | 'hammer' | 'screw' | 'drill' | 'tape' | 'ext' (extintor)
function toolRaw(ctx, kind, x, y, rot = 0, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const bar = (x0, x1, w, col) => { ctx.strokeStyle = OL; ctx.lineWidth = w + 5; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
  if (kind === 'wrench') {
    bar(-26, 22, 8, '#b6becb');
    ctx.lineCap = 'butt';
    ctx.strokeStyle = OL; ctx.lineWidth = 15; ctx.beginPath(); ctx.arc(31, 0, 10, 0.75, TAU - 0.75); ctx.stroke();
    ctx.strokeStyle = '#b6becb'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(31, 0, 10, 0.85, TAU - 0.85); ctx.stroke();
    ctx.fillStyle = OL; ctx.beginPath(); ctx.arc(-28, 0, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b6becb'; ctx.beginPath(); ctx.arc(-28, 0, 6.5, 0, TAU); ctx.fill();
    ctx.fillStyle = OL; ctx.beginPath(); ctx.arc(-28, 0, 3, 0, TAU); ctx.fill();
  } else if (kind === 'hammer') {
    bar(-30, 18, 7, '#9a6a3c');
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(14, -19, 22, 38, 4); ctx.fill();
    ctx.fillStyle = '#7f8896'; ctx.beginPath(); ctx.roundRect(16.5, -16.5, 17, 33, 3); ctx.fill();
    ctx.fillStyle = '#b8c0cc'; ctx.fillRect(18, -15, 5, 30);
  } else if (kind === 'screw') {
    bar(-28, -4, 11, '#e3212f'); bar(0, 30, 4, '#c8ced8');
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(-22, -5.5, 4, 11);
  } else if (kind === 'drill') {
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(-30, -15, 46, 28, 7); ctx.roundRect(-24, 8, 16, 28, 5); ctx.fill();
    ctx.fillStyle = '#f2b01e'; ctx.beginPath(); ctx.roundRect(-27.5, -12.5, 41, 23, 5); ctx.roundRect(-21.5, 8, 11, 25.5, 4); ctx.fill();
    ctx.fillStyle = '#23262e'; ctx.fillRect(12, -8, 9, 14); ctx.fillRect(-23, 27, 14, 7);
    bar(22, 44, 3.5, '#c8ced8');
  } else if (kind === 'tape') {
    ctx.fillStyle = OL; ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b9bec7'; ctx.beginPath(); ctx.arc(0, 0, 17.5, 0, TAU); ctx.fill();
    ctx.fillStyle = OL; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6b5a3a'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
  } else if (kind === 'ext') {
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(-40, -15, 78, 30, 13); ctx.fill();
    ctx.fillStyle = '#d5202c'; ctx.beginPath(); ctx.roundRect(-37.5, -12.5, 73, 25, 11); ctx.fill();
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(-12, -12.5, 20, 25);
    ctx.fillStyle = '#23262e'; ctx.fillRect(34, -6, 12, 12); ctx.fillRect(-50, -4, 12, 8);
  } else if (kind === 'fan') {
    ctx.fillStyle = OL; ctx.fillRect(-5, 0, 10, 44); ctx.beginPath(); ctx.ellipse(0, 46, 24, 6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -8, 34, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#c8ced8'; ctx.lineWidth = 2.5; ctx.stroke();
  }
  ctx.restore();
}

// Orbe holográfico de IA (companheiro do Ramas).
function orbRaw(ctx, x, y, s = 1, t = 0, col = '#3fe0ff', still = false) {
  ctx.save(); ctx.translate(x, y + (still ? 0 : Math.sin(t * 0.08) * 4)); ctx.scale(s, s);
  const w = 15 * Math.abs(Math.cos(t * 0.05)) + 4;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(63,224,255,0.14)'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(w, 0); ctx.lineTo(0, 19); ctx.lineTo(-w, 0); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(w, 0); ctx.moveTo(0, -19); ctx.lineTo(0, 19); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
  ctx.restore();
}

// Robô de pesquisa em pilha de discos (estilo TurtleBot).
function turtlebotRaw(ctx, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#17181d'; ctx.beginPath(); ctx.roundRect(-36, -20, 72, 18, 7); ctx.fill();
  ctx.fillStyle = '#2a2c34'; ctx.fillRect(-30, -17, 60, 4);
  ctx.fillStyle = '#c9ced6'; for (const px of [-26, 26]) { ctx.fillRect(px - 2, -74, 4, 54); }
  ctx.fillStyle = '#17181d';
  for (const py of [-34, -52, -76]) { ctx.beginPath(); ctx.roundRect(-33, py, 66, 5, 2.5); ctx.fill(); }
  ctx.fillStyle = '#0f1014'; ctx.fillRect(-24, -62, 48, 10);
  ctx.fillStyle = Math.sin(t * 0.2) > 0 ? '#3fe0ff' : '#1b6f85'; ctx.fillRect(-6, -59, 4, 4); ctx.fillStyle = '#e3212f'; ctx.fillRect(4, -59, 4, 4);
  ctx.fillStyle = '#0c0c0f'; ctx.beginPath(); ctx.arc(-22, -3, 6, 0, TAU); ctx.arc(22, -3, 6, 0, TAU); ctx.fill();
  ctx.restore();
}

// Robô humanoide cinza impresso em 3D (o do canto do laboratório).
export function drawHumanoid(ctx, x, y, s = 1, t = 0, look = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = '#7f8894', gd = '#5b636e', ol = '#262a33';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const limb = (pts, w) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.strokeStyle = ol; ctx.lineWidth = w + 4; ctx.stroke(); ctx.strokeStyle = g; ctx.lineWidth = w; ctx.stroke(); };
  limb([-13, -92, -17, -48, -15, -6], 12); limb([13, -92, 17, -48, 15, -6], 12);
  ctx.fillStyle = ol; ctx.fillRect(-27, -8, 22, 9); ctx.fillRect(5, -8, 22, 9);
  ctx.fillStyle = '#e3212f'; ctx.fillRect(-18, -52, 6, 6); ctx.fillRect(12, -52, 6, 6);
  ctx.fillStyle = ol; ctx.beginPath(); ctx.roundRect(-26, -160, 52, 72, 6); ctx.fill();
  ctx.fillStyle = gd; ctx.beginPath(); ctx.roundRect(-23, -157, 46, 66, 5); ctx.fill();
  ctx.fillStyle = '#16181d'; ctx.fillRect(-11, -148, 22, 30);
  ctx.fillStyle = '#e3212f'; ctx.fillRect(-9, -146, 18, 6);
  const sw = Math.sin(t * 0.03) * 4;
  limb([-30, -152, -38, -116, -34 + sw, -84], 10); limb([30, -152, 38, -116, 34 - sw, -84], 10);
  ctx.save(); ctx.translate(look * 4, -178);
  ctx.fillStyle = ol; ctx.beginPath(); ctx.roundRect(-17, -19, 34, 36, 7); ctx.fill();
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-14.5, -16.5, 29, 31, 6); ctx.fill();
  ctx.fillStyle = '#16181d'; ctx.fillRect(-11 + look * 2, -9, 22, 9);
  ctx.fillStyle = Math.sin(t * 0.05) > -0.92 ? '#ff4455' : '#5a1218'; ctx.fillRect(-8 + look * 3, -7, 6, 5); ctx.fillRect(2 + look * 3, -7, 6, 5);
  ctx.restore();
  ctx.restore();
}

// ---------- versões públicas: em pixel art quando o estilo está ativo, vetoriais caso contrário ----------
// Em pixel art a animação é quantizada em poucos quadros (hélice, passada, rotação), que ficam em cache como sprites.
const CAPY_CYCLE = TAU / 0.45;

export function drawDrone(ctx, x, y, s = 1, t = 0, o = {}) {
  if (!PIX.on) return droneRaw(ctx, x, y, s, t, o);
  const bob = Math.sin(t * 0.13 + x * 0.01) * 2 * s, tq = Math.round((o.tilt || 0) / 0.1), ph = Math.floor(t) & 3;
  pixelProp(ctx, x, y + bob, 58 * s, 58 * s, 40 * s, 40 * s, (c) => droneRaw(c, 0, 0, s, ph * 1.3, { ...o, tilt: tq * 0.1, still: true }),
    `drone|${s}|${tq}|${ph}|${o.led || ''}|${o.body || ''}|${o.dark || ''}`);
}
export function drawCapy(ctx, x, y, s = 1, t = 0, o = {}) {
  if (!PIX.on) return capyRaw(ctx, x, y, s, t, o);
  const ph = o.run ? Math.floor(((((t % CAPY_CYCLE) + CAPY_CYCLE) % CAPY_CYCLE) / CAPY_CYCLE) * 8) : -1;
  pixelProp(ctx, x, y, 72 * s, 72 * s, 100 * s, 10 * s, (c) => capyRaw(c, 0, 0, s, o.run ? ((ph + 0.5) * CAPY_CYCLE) / 8 : 0, o),
    `capy|${s}|${o.dir || 1}|${ph}|${o.sit ? 1 : 0}|${o.orange ? 1 : 0}|${o.crown ? 1 : 0}|${o.angry ? 1 : 0}|${o.color || ''}`);
}
export function drawGear(ctx, x, y, r, teeth, rot, fill, stroke = OL, hole = 0.35) {
  if (!PIX.on || r > 64) return gearRaw(ctx, x, y, r, teeth, rot, fill, stroke, hole);
  const rq = ((Math.round(rot / (TAU / 48)) % 48) + 48) % 48;
  pixelProp(ctx, x, y, r + 4, r + 4, r + 4, r + 4, (c) => gearRaw(c, 0, 0, r, teeth, (rq * TAU) / 48, fill, stroke, hole), `gear|${r}|${teeth}|${rq}|${fill}|${stroke}|${hole}`);
}
export function drawTool(ctx, kind, x, y, rot = 0, s = 1) {
  if (!PIX.on) return toolRaw(ctx, kind, x, y, rot, s);
  const rq = ((Math.round(rot / (TAU / 24)) % 24) + 24) % 24, sq = Math.round(s * 10) / 10;
  pixelProp(ctx, x, y, 62 * sq, 62 * sq, 62 * sq, 62 * sq, (c) => toolRaw(c, kind, 0, 0, (rq * TAU) / 24, sq), `tool|${kind}|${sq}|${rq}`);
}
export function drawOrb(ctx, x, y, s = 1, t = 0, col = '#3fe0ff') {
  if (!PIX.on) return orbRaw(ctx, x, y, s, t, col);
  const wq = Math.round(Math.abs(Math.cos(t * 0.05)) * 6);
  pixelProp(ctx, x, y + Math.sin(t * 0.08) * 4, 30 * s, 30 * s, 34 * s, 34 * s, (c) => orbRaw(c, 0, 0, s, Math.acos(wq / 6) / 0.05, col, true), `orb|${s}|${wq}|${col}`);
}
export function drawTurtlebot(ctx, x, y, s = 1, t = 0) {
  if (!PIX.on) return turtlebotRaw(ctx, x, y, s, t);
  const on = Math.sin(t * 0.2) > 0;
  pixelProp(ctx, x, y, 42 * s, 42 * s, 84 * s, 10 * s, (c) => turtlebotRaw(c, 0, 0, s, on ? 1 : 20), `tb|${s}|${on ? 1 : 0}`);
}
