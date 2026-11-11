// ARENA DAS CAPIVARAS — beira do lago do campus ao pôr do sol, com a manada assistindo.
import { Stage, vgrad, box, glow, label, HORIZON } from './base.js';
import { H } from '../core/config.js';
import { drawCapy } from '../render/props.js';
import { TAU } from '../core/util.js';

function sky(x, w, rnd) {
  x.fillStyle = vgrad(x, 0, 470, ['#3b3f8f', '#b0569a', '#ff8f5a', '#ffd27a']); x.fillRect(0, 0, w, H);
  glow(x, w * 0.6, 380, 330, 'rgba(255,240,190,0.75)');
  x.fillStyle = '#fff6d8'; x.beginPath(); x.arc(w * 0.6, 392, 62, 0, TAU); x.fill();
  for (let i = 0; i < 9; i++) {
    const cx = rnd() * w, cy = 70 + rnd() * 230, s = 0.6 + rnd() * 0.9;
    x.fillStyle = `rgba(255,${190 + rnd() * 40},${170 + rnd() * 50},0.55)`;
    for (let k = 0; k < 5; k++) { x.beginPath(); x.ellipse(cx + k * 34 * s - 60 * s, cy + Math.sin(k * 1.7) * 8, 46 * s, 15 * s, 0, 0, TAU); x.fill(); }
  }
  // morros distantes
  for (const [base, amp, col] of [[430, 50, '#8a4f86'], [462, 36, '#5c3d74']]) {
    x.fillStyle = col; x.beginPath(); x.moveTo(0, H);
    for (let px = 0; px <= w; px += 20) x.lineTo(px, base - Math.sin(px * 0.006 + base) * amp - Math.sin(px * 0.017) * amp * 0.4);
    x.lineTo(w, H); x.fill();
  }
}

function lake(x, w, rnd) {
  // margem oposta com árvores e o prédio do campus
  x.fillStyle = '#2f4a4a'; x.beginPath(); x.moveTo(0, 470);
  for (let px = 0; px <= w; px += 14) x.lineTo(px, 452 - Math.abs(Math.sin(px * 0.021)) * 26 - Math.abs(Math.sin(px * 0.057)) * 14);
  x.lineTo(w, 480); x.lineTo(0, 480); x.fill();
  box(x, '#e9d9b8', w * 0.2, 414, 150, 50, 2); box(x, '#c9b28a', w * 0.2, 410, 150, 6);
  for (let i = 0; i < 6; i++) box(x, '#6a5a70', w * 0.2 + 10 + i * 24, 426, 14, 12);
  // lago
  x.fillStyle = vgrad(x, 470, HORIZON + 10, ['#ffb47a', '#c9768a', '#5a5a9a']); x.fillRect(0, 470, w, HORIZON - 460);
  x.fillStyle = 'rgba(255,246,216,0.5)'; x.beginPath(); x.moveTo(w * 0.6 - 60, 470); x.lineTo(w * 0.6 + 60, 470); x.lineTo(w * 0.6 + 130, HORIZON); x.lineTo(w * 0.6 - 130, HORIZON); x.fill();
}

function tree(x, px, base, s, rnd) {
  x.fillStyle = '#3a2618'; x.beginPath(); x.moveTo(px - 26 * s, base); x.quadraticCurveTo(px - 8 * s, base - 200 * s, px - 14 * s, base - 430 * s); x.lineTo(px + 14 * s, base - 430 * s); x.quadraticCurveTo(px + 10 * s, base - 200 * s, px + 30 * s, base); x.fill();
  x.fillStyle = '#5a3c26'; x.fillRect(px - 6 * s, base - 400 * s, 6 * s, 380 * s);
  for (let i = 0; i < 16; i++) {
    const a = rnd() * TAU, r = rnd() * 150 * s;
    x.fillStyle = ['#2f6b3a', '#3d8246', '#27552f', '#4f9a52'][i % 4];
    x.beginPath(); x.arc(px + Math.cos(a) * r, base - 450 * s + Math.sin(a) * r * 0.6, (60 + rnd() * 50) * s, 0, TAU); x.fill();
  }
}

function ground(x, w, rnd) {
  // gramado com a trilha de terra onde acontece a luta
  x.fillStyle = vgrad(x, HORIZON - 14, H, ['#5aa04e', '#3f8a44', '#2c6a38']); x.fillRect(0, HORIZON - 14, w, H);
  x.fillStyle = '#6fb85a'; x.beginPath(); x.moveTo(0, HORIZON - 6);
  for (let px = 0; px <= w; px += 10) x.lineTo(px, HORIZON - 14 - Math.abs(Math.sin(px * 0.13)) * 8);
  x.lineTo(w, HORIZON); x.lineTo(0, HORIZON); x.fill();
  x.fillStyle = vgrad(x, 600, 660, ['#c7a878', '#b08e62']); x.beginPath(); x.ellipse(w / 2, 634, w * 0.62, 32, 0, 0, TAU); x.fill();
  x.fillStyle = 'rgba(90,60,30,0.18)'; for (let i = 0; i < 70; i++) x.fillRect(rnd() * w, 612 + rnd() * 44, 3 + rnd() * 6, 2);
  x.strokeStyle = '#2f7a3a'; x.lineWidth = 2.5; x.lineCap = 'round';
  for (let i = 0; i < 260; i++) { const px = rnd() * w, py = HORIZON + rnd() * 160; if (py > 604 && py < 664) continue; x.beginPath(); x.moveTo(px, py); x.lineTo(px + rnd() * 6 - 3, py - 6 - rnd() * 9); x.stroke(); }
  for (let i = 0; i < 40; i++) { const px = rnd() * w, py = HORIZON + 6 + rnd() * 40; x.fillStyle = ['#fff', '#ffd23f', '#ff9ad0'][i % 3]; x.beginPath(); x.arc(px, py, 2.6, 0, TAU); x.fill(); }
  tree(x, 70, 600, 1, rnd); tree(x, w - 60, 604, 1.1, rnd);
  // placa "cuidado: capivaras"
  box(x, '#5a5f66', 1296, 470, 7, 130);
  x.save(); x.translate(1300, 470); x.rotate(Math.PI / 4); box(x, '#16171b', -44, -44, 88, 88, 8); box(x, '#ffd23f', -39, -39, 78, 78, 6); x.restore();
  drawCapy(x, 1294, 488, 0.42, 0, { color: '#16171b' });
  box(x, '#16171b', 1250, 524, 100, 24, 4); label(x, 'CAPIVARAS', 1300, 537, 13, '#ffd23f');
  // banco do campus
  box(x, '#6a4a2c', 400, 560, 150, 9, 3); box(x, '#6a4a2c', 400, 536, 150, 8, 3); box(x, '#3a3d44', 412, 540, 8, 54); box(x, '#3a3d44', 530, 540, 8, 54);
}

const HERD = [[250, 590, 0.62, 1, 0], [640, 584, 0.5, -1, 1], [760, 592, 0.66, 1, 2], [1010, 586, 0.54, -1, 0], [1130, 594, 0.7, -1, 1], [1500, 588, 0.6, 1, 0]];
const SWIM = [[300, 508], [520, 530], [880, 500], [1100, 524]];

export default new Stage({
  id: 'capy', name: 'ARENA DAS CAPIVARAS', music: 'capy',
  desc: 'À beira do lago, a manada assiste em silêncio. Elas torcem pelo Elber, claro.',
  layers: [
    { f: 0.18, seed: 21, paint: sky },
    {
      f: 0.5, seed: 14, paint: lake,
      dyn(x, t, w) {
        // brilho na água e capivaras nadando (só a cabeça de fora)
        x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 2; x.lineCap = 'round';
        for (let i = 0; i < 26; i++) { const px = (i * 173 + Math.sin(t * 0.02 + i) * 14) % w, py = 478 + ((i * 37) % 78), l = 10 + (i % 5) * 6; x.globalAlpha = 0.25 + 0.3 * Math.sin(t * 0.05 + i * 1.7); x.beginPath(); x.moveTo(px, py); x.lineTo(px + l, py); x.stroke(); }
        x.globalAlpha = 1;
        SWIM.forEach(([px, py], i) => {
          const bx = px + Math.sin(t * 0.004 + i * 2) * 60, by = py + Math.sin(t * 0.05 + i) * 2;
          x.save(); x.beginPath(); x.rect(bx - 60, by - 60, 120, 60); x.clip();
          drawCapy(x, bx - 20, by + 24, 0.5, t, { dir: Math.cos(t * 0.004 + i * 2) > 0 ? 1 : -1, orange: i === 2 });
          x.restore();
          x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 2; x.beginPath(); x.ellipse(bx, by + 1, 30, 4, 0, 0, TAU); x.stroke();
        });
      },
    },
    {
      f: 1, seed: 17, paint: ground,
      dyn(x, t) {
        HERD.forEach(([px, py, s, dir, kind], i) => {
          x.fillStyle = 'rgba(0,0,0,0.18)'; x.beginPath(); x.ellipse(px, py + 2, 44 * s, 7 * s, 0, 0, TAU); x.fill();
          const hop = Math.sin(t * 0.09 + i * 1.9) > 0.93 ? -5 : 0;
          drawCapy(x, px, py + hop, s, t + i * 20, { dir, sit: kind === 1, orange: kind === 2 });
        });
      },
    },
  ],
  front(x, t, w) {
    x.strokeStyle = '#1f5a2c'; x.lineWidth = 5; x.lineCap = 'round';
    for (let i = 0; i < 90; i++) { const px = (i * 21.7) % w, sw = Math.sin(t * 0.04 + i) * 5, hh = 16 + (i * 13 % 22); x.beginPath(); x.moveTo(px, 724); x.quadraticCurveTo(px + sw * 0.5, 724 - hh * 0.6, px + sw, 724 - hh); x.stroke(); }
    // vaga-lumes
    for (let i = 0; i < 12; i++) { const px = (i * 163 + Math.sin(t * 0.013 + i) * 60) % w, py = 520 + ((i * 59) % 170) + Math.sin(t * 0.02 + i * 2) * 14, a = 0.4 + 0.6 * Math.sin(t * 0.07 + i * 3); if (a > 0) glow(x, px, py, 9, `rgba(230,255,150,${a})`); }
  },
});
