// O LABORATÓRIO REAL — arena recriada a partir da fotografia do laboratório da equipe:
// forro modular com luminárias de LED e ar-condicionado cassete, parede vermelha com painéis cinza e a TV,
// armários de madeira, porta de vidro, quadro branco "TEAM", robô humanoide, carrinho de alumínio,
// cadeiras bordô, piso laminado e as bancadas com monitores em primeiro plano.
import { Stage, vgrad, box, glow, label, HORIZON } from './base.js';
import { H, FONT_D } from '../core/config.js';
import { drawHumanoid } from '../render/props.js';
import { TAU } from '../core/util.js';

const TV = { x: 868, y: 338, w: 284, h: 166 };

function paintWall(x, w, rnd) {
  const line = (a, b, c, d) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); };
  // parede do fundo e parede lateral direita
  x.fillStyle = vgrad(x, 150, HORIZON, ['#f1f1ef', '#dddedf']); x.fillRect(0, 150, w, HORIZON - 150 + 4);
  const rx = w - 292;
  x.fillStyle = vgrad(x, 110, HORIZON, ['#e0e1e2', '#cbcdcf']);
  x.beginPath(); x.moveTo(rx, 172); x.lineTo(w, 96); x.lineTo(w, HORIZON + 40); x.lineTo(rx, HORIZON + 4); x.fill();

  // parede vermelha + painéis acústicos cinza (como na foto)
  x.fillStyle = vgrad(x, 170, HORIZON, ['#dc2030', '#c41a28']); x.fillRect(1012, 172, rx - 1012, HORIZON - 168);
  box(x, '#5d626b', 918, 222, 96, 118); box(x, '#bfc2c8', 836, 318, 90, 28);
  box(x, '#d01e2c', 808, 346, 92, 196); box(x, '#bfc2c8', 900, 500, 30, 60); box(x, '#5d626b', 928, 504, 86, 60);
  x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 2; line(808, 444, 900, 444); line(918, 281, 1014, 281);

  // forro modular
  x.fillStyle = vgrad(x, 0, 176, ['#cdcdc7', '#e9e9e4']); x.fillRect(0, 0, w, 176);
  const vy = 430, vx = w * 0.5;
  x.strokeStyle = 'rgba(110,110,104,0.5)'; x.lineWidth = 1.6;
  for (const y of [1, 54, 96, 128, 151, 166, 175]) line(0, y, w, y);
  for (let bx = -900; bx < w + 900; bx += 124) line(bx, 175, vx + (bx - vx) * (vy / (vy - 175)), 0);
  const quad = (cx, y0, y1, ww, col) => {
    const s0 = (vy - y0) / (vy - 175), s1 = (vy - y1) / (vy - 175), a = vx + (cx - vx) * s0, b = vx + (cx - vx) * s1;
    x.fillStyle = col; x.beginPath(); x.moveTo(a - ww * s0 / 2, y0); x.lineTo(a + ww * s0 / 2, y0); x.lineTo(b + ww * s1 / 2, y1); x.lineTo(b - ww * s1 / 2, y1); x.fill();
    return [a, b];
  };
  // luminárias de LED embutidas
  for (const [cx, y0, y1, ww] of [[330, 70, 96, 70], [640, 128, 142, 60], [1010, 96, 118, 66], [1250, 132, 146, 56], [1420, 60, 90, 72], [130, 130, 144, 56]]) {
    const [a] = quad(cx, y0, y1, ww, '#ffffff');
    glow(x, a, (y0 + y1) / 2, 150, 'rgba(255,255,245,0.5)');
    quad(cx, y0, y1, ww, '#ffffff');
  }
  // ar-condicionado cassete
  quad(790, 78, 128, 250, '#f4f4f2'); quad(790, 84, 122, 214, '#dcdcd8'); quad(790, 92, 114, 150, '#c9c9c4');
  x.strokeStyle = 'rgba(90,90,90,0.35)'; x.lineWidth = 1;
  for (let i = 0; i < 9; i++) line(748 + i * 12, 95, 746 + i * 12.6, 112);
  // sombra sob o forro
  x.fillStyle = vgrad(x, 175, 215, ['rgba(0,0,0,0.16)', 'rgba(0,0,0,0)']); x.fillRect(0, 175, w, 40);

  // porta de vidro à esquerda
  box(x, '#22252b', 22, 196, 168, HORIZON - 190);
  x.fillStyle = vgrad(x, 200, HORIZON, ['#cfe3e6', '#a9c4c9']); x.fillRect(32, 206, 148, HORIZON - 204);
  x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(32, 372, 148, 96);
  x.strokeStyle = 'rgba(150,180,186,0.9)'; x.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) { x.beginPath(); for (let px = 32; px <= 180; px += 6) x.lineTo(px, 392 + i * 16 + Math.sin(px * 0.09 + i) * 5); x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.moveTo(60, 206); x.lineTo(96, 206); x.lineTo(56, 364); x.lineTo(32, 364); x.lineTo(32, 300); x.fill();
  box(x, '#22252b', 104, 206, 5, HORIZON - 204); box(x, '#3b6ea8', 36, 430, 8, 22, 3);

  // três armários de madeira
  for (let i = 0; i < 3; i++) {
    const ax = 226 + i * 190;
    box(x, '#a8845d', ax, 318, 190, HORIZON - 314);
    x.fillStyle = vgrad(x, 322, HORIZON, ['#cfab82', '#bf9870']); x.fillRect(ax + 3, 322, 184, HORIZON - 322);
    x.strokeStyle = 'rgba(120,84,50,0.22)'; x.lineWidth = 1;
    for (let k = 0; k < 26; k++) { const gx = ax + 6 + rnd() * 178; line(gx, 326 + rnd() * 40, gx + rnd() * 5 - 2, HORIZON - 6 - rnd() * 40); }
    x.strokeStyle = '#8d6c49'; x.lineWidth = 2; line(ax + 95, 322, ax + 95, HORIZON);
    box(x, '#d9dde2', ax + 84, 426, 4, 26, 2); box(x, '#d9dde2', ax + 102, 426, 4, 26, 2);
    box(x, '#e8e8e8', ax + 78, 324, 22, 8, 2);
  }
  box(x, '#9a7650', 222, 312, 578, 8); box(x, '#8b6845', 226, HORIZON - 6, 570, 8);
  // objetos em cima dos armários
  box(x, '#f3f1ea', 250, 286, 30, 26, 4); box(x, '#3f8fd6', 286, 296, 36, 16, 6); box(x, '#3d9a4a', 262, 274, 12, 14, 3);
  box(x, '#1c1d21', 372, 300, 88, 12, 2);
  const cube = ['#e3212f', '#3f8fd6', '#ffd23f', '#3fb56a', '#ff8a3c', '#b06bff'];
  for (let i = 0; i < 9; i++) box(x, cube[i % 6], 512 + (i % 3) * 11, 280 + Math.floor(i / 3) * 11, 10, 10, 2);
  x.fillStyle = 'rgba(235,240,245,0.75)'; x.strokeStyle = '#b8c0c8'; x.lineWidth = 2; x.beginPath(); x.roundRect(606, 266, 104, 46, 5); x.fill(); x.stroke();
  box(x, '#e9c64a', 618, 290, 22, 16, 3); box(x, '#d8d2c4', 646, 284, 26, 22, 3); box(x, '#e3212f', 678, 294, 18, 12, 2); box(x, '#dfe3e8', 602, 262, 112, 8, 3);
  box(x, '#17181c', 724, 306, 70, 6, 2);

  // gaveteiro, bancada e tomadas
  for (const [px, py] of [[866, 520], [w - 250, 498], [w - 220, 494]]) { x.fillStyle = '#f6f6f6'; x.strokeStyle = '#c4c6c9'; x.lineWidth = 1.5; x.beginPath(); x.roundRect(px, py, 16, 22, 3); x.fill(); x.stroke(); }

  // TV (moldura; a imagem é animada)
  box(x, '#0c0d10', TV.x - 6, TV.y - 6, TV.w + 12, TV.h + 12, 5);
  box(x, '#15171c', 1004, TV.y + TV.h + 6, 12, 60); box(x, '#2a2c33', TV.x + 4, TV.y - 26, 5, 22);

  // quadro branco "TEAM" na parede lateral (com a capivara e o drone rabiscados)
  x.save();
  x.transform(1, -0.2, 0, 1, rx + 70, 372);
  box(x, '#b9bdc2', -6, -6, 192, 132, 3); box(x, '#fbfbf9', 0, 0, 180, 120, 2);
  x.strokeStyle = '#1f2125'; x.lineWidth = 2.6; x.lineJoin = 'round'; x.font = `900 36px ${FONT_D}`; x.textAlign = 'center';
  x.strokeText('TEAM', 82, 62);
  x.lineWidth = 1.8;
  x.beginPath(); x.ellipse(146, 24, 14, 9, 0, 0, TAU); x.stroke(); x.beginPath(); x.roundRect(152, 12, 16, 12, 4); x.stroke();
  line(134, 31, 134, 38); line(154, 31, 154, 38);
  x.beginPath(); x.arc(140, 92, 6, 0, TAU); x.stroke(); line(124, 86, 156, 86); line(124, 82, 132, 82); line(148, 82, 156, 82);
  x.font = `900 11px ${FONT_D}`; x.fillStyle = '#1f2125'; x.fillText('ZUNE', 140, 112);
  x.fillStyle = '#e3212f'; x.font = '18px sans-serif'; x.fillText('♥', 58, 100);
  x.restore();
  x.fillStyle = vgrad(x, HORIZON - 30, HORIZON + 4, ['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)']); x.fillRect(0, HORIZON - 30, w, 34);
}

function tvScreen(x, t) {
  x.save();
  x.beginPath(); x.rect(TV.x, TV.y, TV.w, TV.h); x.clip();
  x.fillStyle = vgrad(x, TV.y, TV.y + TV.h, ['#141c38', '#070a14']); x.fillRect(TV.x, TV.y, TV.w, TV.h);
  const cx = TV.x + TV.w / 2, cy = TV.y + TV.h / 2;
  x.strokeStyle = 'rgba(227,33,47,0.5)'; x.lineWidth = 12;
  for (let i = -3; i < 8; i++) { const ox = ((t * 0.6) % 60) + i * 60; x.beginPath(); x.moveTo(TV.x + ox, TV.y + TV.h); x.lineTo(TV.x + ox + 70, TV.y); x.stroke(); }
  const p = 1 + Math.sin(t * 0.08) * 0.04;
  x.translate(cx, cy); x.scale(p, p);
  label(x, 'TEAM', 0, -22, 54, '#fff', { italic: true, stroke: '#0a0c14', sw: 7 });
  label(x, 'FIGHTERS', 0, 26, 34, '#ffd23f', { italic: true, stroke: '#0a0c14', sw: 6 });
  x.restore();
  for (let i = 0; i < 16; i++) { const hh = 6 + Math.abs(Math.sin(t * 0.1 + i * 0.9)) * 16; box(x, i % 2 ? '#3fe0ff' : '#e3212f', TV.x + 14 + i * 16.4, TV.y + TV.h - 8 - hh, 10, hh); }
  x.fillStyle = 'rgba(255,255,255,0.07)'; x.beginPath(); x.moveTo(TV.x, TV.y); x.lineTo(TV.x + 120, TV.y); x.lineTo(TV.x + 40, TV.y + TV.h); x.lineTo(TV.x, TV.y + TV.h); x.fill();
  // fluxo de ar do cassete
  x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 2; x.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const k = ((t * 0.02 + i * 0.2) % 1); x.globalAlpha = (1 - k) * 0.5; x.beginPath(); x.moveTo(720 + i * 36, 132 + k * 50); x.lineTo(716 + i * 38, 146 + k * 60); x.stroke(); }
  x.globalAlpha = 1;
}

function chair(x, px, py, s = 1, flip = 1) {
  x.save(); x.translate(px, py); x.scale(s * flip, s);
  box(x, '#1b1c20', -3, -46, 6, 30); box(x, '#1b1c20', -30, -10, 60, 6, 3);
  for (const wx of [-28, 0, 28]) { x.fillStyle = '#101114'; x.beginPath(); x.arc(wx, 0, 6, 0, TAU); x.fill(); }
  box(x, '#57141f', -34, -62, 68, 18, 8); box(x, '#7a2130', -34, -66, 68, 16, 8);
  box(x, '#1b1c20', 22, -100, 7, 42); box(x, '#57141f', 2, -146, 46, 62, 12); box(x, '#7a2130', 0, -148, 44, 60, 12);
  box(x, '#1b1c20', -38, -84, 30, 6, 3);
  x.restore();
}

function monitor(x, px, py, w, h, on) {
  box(x, '#0c0d10', px - w / 2, py - h, w, h, 4);
  box(x, on ? '#101a30' : '#15171c', px - w / 2 + 4, py - h + 4, w - 8, h - 8, 2);
  box(x, '#0c0d10', px - 5, py, 10, 16); box(x, '#0c0d10', px - 24, py + 14, 48, 5, 2);
}

function paintFloor(x, w, rnd) {
  // piso laminado de madeira
  x.fillStyle = vgrad(x, HORIZON, H, ['#b89169', '#a37d57', '#8d6945']); x.fillRect(0, HORIZON, w, H - HORIZON);
  x.strokeStyle = 'rgba(80,52,28,0.3)'; x.lineWidth = 1.4;
  for (let i = 1, y = HORIZON; y < H; i++) {
    const y0 = y; y = HORIZON + i * i * 2.6;
    x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke();
    const n = 9 + i;
    for (let k = 0; k < n; k++) { const px = ((k + rnd()) / n) * w; x.beginPath(); x.moveTo(px, y0); x.lineTo(px, Math.min(H, y)); x.stroke(); }
  }
  for (const lx of [300, 880, 1420]) { x.fillStyle = vgrad(x, HORIZON, H, ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']); x.beginPath(); x.moveTo(lx - 40, HORIZON); x.lineTo(lx + 40, HORIZON); x.lineTo(lx + 150, H); x.lineTo(lx - 150, H); x.fill(); }
  box(x, '#f2f2f0', 0, HORIZON - 3, w, 9); box(x, 'rgba(0,0,0,0.18)', 0, HORIZON + 6, w, 5);

  // mesa à esquerda com controle do ar
  box(x, '#8b6845', 40, 548, 250, 10, 3); box(x, '#c9a67c', 40, 542, 250, 8, 3); box(x, '#a9adb3', 60, 556, 8, 44); box(x, '#a9adb3', 262, 556, 8, 44);
  box(x, '#f1f1f1', 150, 534, 38, 9, 3); box(x, '#e8e4da', 70, 528, 26, 14, 4);
  chair(x, 150, 604, 0.72, -1);
  // bobinas de filamento, cadeiras e bancada ao fundo
  for (const [px, col] of [[742, '#e8e8e8'], [772, '#1a1a1a']]) { x.fillStyle = '#2a2b30'; x.beginPath(); x.ellipse(px, 588, 22, 9, 0, 0, TAU); x.fill(); x.fillStyle = col; x.beginPath(); x.ellipse(px, 584, 19, 7, 0, 0, TAU); x.fill(); x.fillStyle = '#2a2b30'; x.beginPath(); x.ellipse(px, 584, 6, 2.4, 0, 0, TAU); x.fill(); }
  box(x, '#c9a67c', 800, 536, 150, 8, 2); box(x, '#eef0f2', 806, 484, 44, 52, 3);
  x.strokeStyle = '#c3c7cc'; x.lineWidth = 1.5; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(806, 484 + i * 13); x.lineTo(850, 484 + i * 13); x.stroke(); }
  box(x, '#e3722c', 858, 526, 30, 9, 2); box(x, '#33353b', 892, 522, 22, 13, 2);
  chair(x, 930, 606, 0.74, 1); chair(x, 1004, 610, 0.78, -1);
  // carrinho de alumínio com rodas
  x.strokeStyle = '#c5cad1'; x.lineWidth = 6; x.lineJoin = 'round';
  x.strokeRect(1296, 500, 108, 84); x.beginPath(); x.moveTo(1296, 542); x.lineTo(1404, 542); x.stroke();
  for (const wx of [1300, 1400]) { x.fillStyle = '#1b1c20'; x.beginPath(); x.arc(wx, 590, 11, 0, TAU); x.fill(); x.fillStyle = '#9aa0a8'; x.beginPath(); x.arc(wx, 590, 4, 0, TAU); x.fill(); }
  box(x, '#1d1f24', 1312, 470, 76, 30, 5); box(x, '#30333a', 1318, 462, 64, 10, 4);
  box(x, '#2a5fb0', 1330, 594, 54, 10, 3);
  // vaso e caixas à direita
  box(x, '#7a4a2c', 1596, 574, 50, 30, 8); box(x, '#5a3a22', 1592, 570, 58, 9, 4);
  box(x, '#c9a67c', 1660, 548, 110, 9, 3); box(x, '#b98d5b', 1680, 508, 70, 40, 3); box(x, '#16171b', 1700, 498, 44, 10, 2);
  // sombras de contato
  x.fillStyle = 'rgba(0,0,0,0.16)';
  for (const [px, pw] of [[150, 70], [930, 60], [1004, 64], [1350, 130], [1500, 80], [1620, 60]]) { x.beginPath(); x.ellipse(px, 608, pw, 8, 0, 0, TAU); x.fill(); }
}

function front(x, t, w) {
  // bancadas em primeiro plano: monitores de costas, gabinete com as peças amarelas impressas em 3D e o adesivo TEAM
  const y = 716;
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, 700, w, 30);
  monitor(x, 170, y + 34, 250, 96, false); monitor(x, 420, y + 40, 210, 90, false);
  box(x, '#0e0f12', 600, 672, 190, 60, 6); box(x, '#191b20', 606, 678, 178, 12, 3);
  for (let i = 0; i < 4; i++) { const px = 630 + i * 40; box(x, '#c79a12', px - 13, 652, 26, 24, 9); box(x, '#f2c21d', px - 12, 650, 24, 22, 9); box(x, '#f2c21d', px + 6, 644, 12, 10, 4); x.fillStyle = '#16131f'; x.beginPath(); x.arc(px + 12, 648, 1.6, 0, TAU); x.fill(); }
  x.fillStyle = '#f4f4f4'; x.beginPath(); x.arc(760, 704, 16, 0, TAU); x.fill();
  label(x, 'TEAM', 760, 705, 9, '#111');
  monitor(x, w - 430, y + 44, 230, 92, false); monitor(x, w - 190, y + 30, 260, 100, false);
  box(x, '#6b1f2a', 930, 690, 150, 40, 14);
}

export default new Stage({
  id: 'labreal', name: 'LABORATÓRIO TEAM', music: 'labreal',
  desc: 'O laboratório de verdade: parede vermelha, a TV, os armários, o robô do canto e o quadro branco.',
  layers: [
    { f: 0.55, seed: 11, paint: paintWall, dyn: tvScreen },
    {
      f: 1, seed: 5, paint: paintFloor,
      dyn(x, t) {
        // robô humanoide do canto acompanha a luta com a cabeça
        drawHumanoid(x, 1500, 606, 0.86, t, Math.sin(t * 0.012));
        x.fillStyle = `rgba(63,224,255,${0.5 + 0.5 * Math.sin(t * 0.1)})`; x.fillRect(1352, 480, 8, 4);
      },
    },
  ],
  front,
});
