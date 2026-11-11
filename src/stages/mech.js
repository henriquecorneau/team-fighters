// ÁREA DE ENGENHARIA MECÂNICA — oficina com engrenagens, ponte rolante, braço de solda e torno.
import { Stage, vgrad, box, glow, floor, label, HORIZON } from './base.js';
import { H } from '../core/config.js';
import { drawGear, drawTool } from '../render/props.js';
import { TAU, rand } from '../core/util.js';

function wall(x, w, rnd) {
  x.fillStyle = vgrad(x, 0, HORIZON, ['#2c2a30', '#4a4038', '#5a4a3c']); x.fillRect(0, 0, w, HORIZON + 4);
  // chapa corrugada em cima, tijolos embaixo
  x.strokeStyle = 'rgba(0,0,0,0.22)'; x.lineWidth = 3;
  for (let px = 0; px < w; px += 18) { x.beginPath(); x.moveTo(px, 0); x.lineTo(px, 300); x.stroke(); }
  x.fillStyle = vgrad(x, 300, HORIZON, ['#7a4a38', '#5e3828']); x.fillRect(0, 300, w, HORIZON - 296);
  x.strokeStyle = 'rgba(30,16,10,0.4)'; x.lineWidth = 1.5;
  for (let r = 0, y = 300; y < HORIZON; r++, y += 20) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); for (let px = (r % 2) * 24; px < w; px += 48) { x.beginPath(); x.moveTo(px, y); x.lineTo(px, y + 20); x.stroke(); } }
  box(x, '#33363d', 0, 292, w, 12);
  // janelas industriais com luz quente
  for (const px of [180, 1180]) {
    box(x, '#1d1f24', px - 8, 90, 236, 176, 4);
    x.fillStyle = vgrad(x, 96, 260, ['#ffd08a', '#ff9d4a']); x.fillRect(px, 98, 220, 160);
    x.strokeStyle = '#1d1f24'; x.lineWidth = 5; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(px + i * 55, 98); x.lineTo(px + i * 55, 258); x.stroke(); } x.beginPath(); x.moveTo(px, 178); x.lineTo(px + 220, 178); x.stroke();
    x.fillStyle = 'rgba(255,190,110,0.1)'; x.beginPath(); x.moveTo(px, 258); x.lineTo(px + 220, 258); x.lineTo(px + 480, HORIZON); x.lineTo(px + 120, HORIZON); x.fill();
  }
  // painel de ferramentas
  box(x, '#3a3d44', 520, 330, 300, 170, 4); box(x, '#caa572', 526, 336, 288, 158, 2);
  x.fillStyle = 'rgba(60,40,20,0.35)'; for (let r = 0; r < 9; r++) for (let c = 0; c < 17; c++) { x.beginPath(); x.arc(536 + c * 16.8, 346 + r * 17, 1.6, 0, TAU); x.fill(); }
  const tools = [['wrench', 570, 380, 1.2], ['hammer', 640, 392, 1.5], ['screw', 700, 376, 1.6], ['wrench', 750, 400, 1.9], ['drill', 600, 450, 0], ['tape', 690, 455, 0], ['screw', 760, 452, 1.2]];
  for (const [k, px, py, r] of tools) drawTool(x, k, px, py, r, 0.82);
  // placa de segurança e tubulação
  box(x, '#16171b', w - 400, 350, 250, 76, 6); box(x, '#ffd23f', w - 395, 355, 240, 66, 4);
  label(x, 'SEGURANÇA', w - 275, 376, 22, '#16171b'); label(x, 'EM 1º LUGAR', w - 275, 402, 18, '#16171b');
  x.strokeStyle = '#8a4a2a'; x.lineWidth = 14; x.beginPath(); x.moveTo(0, 60); x.lineTo(w, 60); x.stroke();
  x.strokeStyle = '#b8683c'; x.lineWidth = 5; x.beginPath(); x.moveTo(0, 56); x.lineTo(w, 56); x.stroke();
  for (let px = 90; px < w; px += 260) box(x, '#5d3018', px, 50, 14, 22, 2);
  // viga da ponte rolante
  box(x, '#c98a1c', 0, 150, w, 26); box(x, '#16171b', 0, 174, w, 5);
  for (let px = 0; px < w; px += 56) { x.fillStyle = '#16171b'; x.beginPath(); x.moveTo(px, 150); x.lineTo(px + 18, 150); x.lineTo(px + 44, 176); x.lineTo(px + 26, 176); x.fill(); }
  // eixos das engrenagens
  box(x, '#1d1f24', 890, 300, 250, 200, 6); box(x, '#2b2e36', 896, 306, 238, 188, 4);
}

function ground(x, w) {
  floor(x, w, HORIZON, ['#6a655f', '#524e4a', '#3b3836'], 'rgba(0,0,0,0.2)', { step: 200, lw: 2 });
  for (const [px, pw] of [[400, 90], [1100, 130], [700, 60]]) { x.fillStyle = 'rgba(20,18,16,0.25)'; x.beginPath(); x.ellipse(px, 660, pw, 14, 0, 0, TAU); x.fill(); }
  // faixa de segurança
  box(x, '#16171b', 0, HORIZON - 2, w, 22);
  for (let px = 0; px < w; px += 52) { x.fillStyle = '#ffd23f'; x.beginPath(); x.moveTo(px, HORIZON + 20); x.lineTo(px + 26, HORIZON + 20); x.lineTo(px + 44, HORIZON - 2); x.lineTo(px + 18, HORIZON - 2); x.fill(); }
  // torno mecânico
  box(x, '#1d2a24', 1380, 500, 300, 100, 8); box(x, '#2f6a52', 1386, 506, 288, 60, 6); box(x, '#16171b', 1400, 566, 30, 34); box(x, '#16171b', 1630, 566, 30, 34);
  box(x, '#c8ced8', 1470, 520, 130, 12, 6); box(x, '#16171b', 1410, 512, 54, 44, 6); box(x, '#e3212f', 1640, 516, 16, 16, 8);
  // barris e carrinho de ferramentas
  for (const [px, col] of [[60, '#2a5fb0'], [130, '#b0382a']]) { box(x, '#111', px - 28, 510, 56, 92, 8); box(x, col, px - 25, 513, 50, 86, 6); box(x, 'rgba(0,0,0,0.3)', px - 25, 538, 50, 5); box(x, 'rgba(0,0,0,0.3)', px - 25, 570, 50, 5); }
  box(x, '#16171b', 1160, 540, 110, 54, 5); box(x, '#d5202c', 1164, 544, 102, 46, 4); box(x, '#16171b', 1164, 560, 102, 3); box(x, '#16171b', 1164, 575, 102, 3);
  for (const px of [1176, 1254]) { x.fillStyle = '#111'; x.beginPath(); x.arc(px, 598, 8, 0, TAU); x.fill(); }
  // base do braço de solda
  box(x, '#16171b', 250, 560, 110, 42, 6); box(x, '#f28c28', 256, 564, 98, 16, 4);
}

export default new Stage({
  id: 'mech', name: 'ENGENHARIA MECÂNICA', music: 'mech',
  desc: 'Oficina pesada: engrenagens girando, solda faiscando e EPI obrigatório.',
  layers: [
    {
      f: 0.5, seed: 12, paint: wall,
      dyn(x, t, w) {
        drawGear(x, 960, 400, 70, 12, t * 0.02, '#8b95a5');
        drawGear(x, 1066, 432, 44, 8, -t * 0.03 + 0.2, '#c98a1c');
        drawGear(x, 1010, 330, 30, 7, t * 0.046, '#667086');
        // gancho da ponte rolante
        const hx = 700 + Math.sin(t * 0.004) * 420, sw = Math.sin(t * 0.03) * 0.08;
        box(x, '#16171b', hx - 34, 172, 68, 22, 4);
        x.save(); x.translate(hx, 194); x.rotate(sw);
        x.strokeStyle = '#1b1c20'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 86); x.stroke();
        x.strokeStyle = '#c98a1c'; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.arc(0, 104, 16, -Math.PI / 2, Math.PI * 0.9); x.stroke();
        x.restore();
      },
    },
    {
      f: 1, seed: 2, paint: ground,
      dyn(x, t) {
        // braço robótico soldando
        const a1 = 0.5 + Math.sin(t * 0.017) * 0.25, a2 = 1.3 + Math.sin(t * 0.027) * 0.3;
        const bx = 305, by = 562, l1 = 96, l2 = 84;
        const ex = bx + Math.sin(a1) * l1, ey = by - Math.cos(a1) * l1, hx = ex + Math.sin(a1 + a2) * l2, hy = ey - Math.cos(a1 + a2) * l2;
        x.lineCap = 'round'; x.lineJoin = 'round';
        x.strokeStyle = '#16171b'; x.lineWidth = 26; x.beginPath(); x.moveTo(bx, by); x.lineTo(ex, ey); x.lineTo(hx, hy); x.stroke();
        x.strokeStyle = '#f28c28'; x.lineWidth = 19; x.stroke();
        for (const [px, py] of [[bx, by], [ex, ey]]) { x.fillStyle = '#16171b'; x.beginPath(); x.arc(px, py, 11, 0, TAU); x.fill(); }
        box(x, '#3a3d44', 420, 570, 90, 26, 4);
        if (Math.sin(t * 0.05) > -0.2) {
          glow(x, hx, hy, 60 + rand(20), 'rgba(160,220,255,0.75)');
          x.strokeStyle = '#ffe9a8'; x.lineWidth = 2;
          for (let i = 0; i < 6; i++) { const a = rand(TAU), r = rand(14, 54); x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r * 0.8 + r * 0.3); x.stroke(); }
        }
      },
    },
  ],
});
