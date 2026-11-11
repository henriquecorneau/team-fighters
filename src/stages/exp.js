// SALA DE EXPERIMENTOS — arena de testes de drones e visão computacional (alvos de calibração, mocap, rede de proteção).
import { Stage, vgrad, box, glow, floor, label, HORIZON } from './base.js';
import { H } from '../core/config.js';
import { drawDrone, drawTurtlebot } from '../render/props.js';
import { TAU } from '../core/util.js';

const CAMS = [150, 420, 700, 980, 1250, 1500];

function tag(x, px, py, s, rnd) {
  box(x, '#fafafa', px - 4, py - 4, s * 6 + 8, s * 6 + 8, 2);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    const edge = r === 0 || c === 0 || r === 5 || c === 5;
    if (edge || rnd() < 0.5) box(x, '#111', px + c * s, py + r * s, s + 0.5, s + 0.5);
  }
}

function wall(x, w, rnd) {
  x.fillStyle = vgrad(x, 0, HORIZON, ['#c9ced6', '#e6e9ee', '#d5d9df']); x.fillRect(0, 0, w, HORIZON + 4);
  x.strokeStyle = 'rgba(120,130,145,0.35)'; x.lineWidth = 2;
  for (let px = 0; px < w; px += 190) { x.beginPath(); x.moveTo(px, 0); x.lineTo(px, HORIZON); x.stroke(); }
  x.beginPath(); x.moveTo(0, 300); x.lineTo(w, 300); x.stroke();
  // janela da sala de controle
  box(x, '#2a303c', w * 0.5 - 190, 190, 380, 150, 6);
  x.fillStyle = vgrad(x, 196, 334, ['#16324a', '#0c1a2a']); x.fillRect(w * 0.5 - 184, 196, 368, 138);
  for (let i = 0; i < 4; i++) { const px = w * 0.5 - 150 + i * 96; box(x, '#0a0f18', px, 262, 64, 44, 3); box(x, i % 2 ? '#1f6a8a' : '#2a8a5a', px + 4, 266, 56, 36, 2); x.fillStyle = '#05080e'; x.beginPath(); x.arc(px + 32, 250 - (i % 2) * 6, 15, 0, TAU); x.fill(); x.fillRect(px + 12, 262, 40, 60); }
  x.fillStyle = 'rgba(255,255,255,0.08)'; x.beginPath(); x.moveTo(w * 0.5 - 184, 196); x.lineTo(w * 0.5 - 60, 196); x.lineTo(w * 0.5 - 140, 334); x.lineTo(w * 0.5 - 184, 334); x.fill();
  label(x, 'SALA DE CONTROLE', w * 0.5, 176, 15, '#4a5362');
  // alvo de calibração (tabuleiro de xadrez) e marcadores fiduciais
  const bx = 150, by = 300, s = 22;
  box(x, '#e9e9e9', bx - 8, by - 8, 9 * s + 16, 6 * s + 16, 3);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) if ((r + c) % 2 === 0) box(x, '#15161a', bx + c * s, by + r * s, s, s);
  box(x, '#3b414c', bx + 92, by + 6 * s + 8, 8, HORIZON - by - 6 * s);
  tag(x, 470, 380, 13, rnd); tag(x, w - 520, 372, 13, rnd); tag(x, w - 330, 250, 16, rnd); tag(x, 620, 420, 9, rnd);
  // placa de aviso
  x.save(); x.translate(w - 170, 420);
  box(x, '#16171b', -100, -52, 200, 104, 8); box(x, '#ffd23f', -95, -47, 190, 94, 6);
  label(x, '⚠ ÁREA DE TESTES', 0, -18, 19, '#16171b'); label(x, 'DRONES EM VOO', 0, 8, 17, '#16171b'); label(x, 'use óculos de proteção', 0, 30, 11, '#3a3210', { weight: 700 });
  x.restore();
  // treliça com câmeras de captura de movimento
  box(x, '#2b3038', 0, 44, w, 12); box(x, '#2b3038', 0, 84, w, 8);
  x.strokeStyle = '#2b3038'; x.lineWidth = 4;
  for (let px = 0; px < w; px += 60) { x.beginPath(); x.moveTo(px, 50); x.lineTo(px + 30, 88); x.lineTo(px + 60, 50); x.stroke(); }
  for (const px of CAMS) { box(x, '#16181d', px - 18, 92, 36, 26, 5); x.fillStyle = '#0b0c0f'; x.beginPath(); x.arc(px, 112, 13, 0, TAU); x.fill(); }
  // rede de proteção
  x.strokeStyle = 'rgba(40,46,56,0.16)'; x.lineWidth = 1;
  for (let px = -HORIZON; px < w; px += 26) { x.beginPath(); x.moveTo(px, 96); x.lineTo(px + HORIZON - 96, HORIZON); x.stroke(); x.beginPath(); x.moveTo(px + HORIZON - 96, 96); x.lineTo(px, HORIZON); x.stroke(); }
  box(x, '#16171b', 0, HORIZON - 12, w, 16);
  for (let px = 0; px < w; px += 44) { x.fillStyle = '#ffd23f'; x.beginPath(); x.moveTo(px, HORIZON + 4); x.lineTo(px + 22, HORIZON + 4); x.lineTo(px + 34, HORIZON - 12); x.lineTo(px + 12, HORIZON - 12); x.fill(); }
}

function ground(x, w) {
  floor(x, w, HORIZON, ['#3f7a5a', '#2f6248', '#234a36'], 'rgba(255,255,255,0.2)', { step: 160, lw: 2.5 });
  // heliponto
  x.save(); x.translate(w / 2, 588); x.scale(1, 0.2);
  x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 14; x.beginPath(); x.arc(0, 0, 190, 0, TAU); x.stroke();
  x.restore();
  label(x, 'H', w / 2, 590, 40, 'rgba(255,255,255,0.7)');
  // tripés com câmeras, cones e cases
  for (const px of [330, 1430]) {
    x.strokeStyle = '#1b1d22'; x.lineWidth = 5; x.lineCap = 'round';
    x.beginPath(); x.moveTo(px, 470); x.lineTo(px - 34, 596); x.moveTo(px, 470); x.lineTo(px + 34, 596); x.moveTo(px, 470); x.lineTo(px + 4, 600); x.stroke();
    box(x, '#1b1d22', px - 26, 444, 52, 30, 5); x.fillStyle = '#2f6fb8'; x.beginPath(); x.arc(px + (px < 800 ? 18 : -18), 459, 9, 0, TAU); x.fill();
  }
  for (const px of [560, 1210, 90]) { x.fillStyle = '#ff7a1a'; x.beginPath(); x.moveTo(px - 16, 600); x.lineTo(px, 554); x.lineTo(px + 16, 600); x.fill(); box(x, '#fff', px - 9, 574, 18, 7); box(x, '#d85f0c', px - 22, 598, 44, 6, 2); }
  box(x, '#20242c', 1580, 548, 130, 54, 6); box(x, '#aab1bc', 1580, 572, 130, 5); box(x, '#aab1bc', 1634, 566, 22, 16, 3);
  box(x, '#20242c', 1606, 508, 90, 42, 6); box(x, '#aab1bc', 1606, 526, 90, 4);
}

export default new Stage({
  id: 'exp', name: 'SALA DE EXPERIMENTOS', music: 'exp',
  desc: 'Arena de voo e visão computacional: alvos de calibração, marcadores e câmeras por todo lado.',
  layers: [
    {
      f: 0.5, seed: 31, paint: wall,
      dyn(x, t) {
        CAMS.forEach((px, i) => { const on = Math.sin(t * 0.08 + i * 1.3) > -0.3; x.fillStyle = on ? '#ff3344' : '#5a1218'; x.beginPath(); x.arc(px, 112, 6, 0, TAU); x.fill(); if (on) glow(x, px, 112, 26, 'rgba(255,50,70,0.45)'); });
        drawDrone(x, 360 + Math.sin(t * 0.011) * 190, 190 + Math.sin(t * 0.023) * 40, 0.9, t, { tilt: Math.cos(t * 0.011) * 0.2 });
        drawDrone(x, 1120 + Math.sin(t * 0.008 + 2) * 230, 230 + Math.cos(t * 0.019) * 46, 0.7, t + 30, { tilt: Math.cos(t * 0.008 + 2) * 0.2, led: '#7dff8a' });
      },
    },
    {
      f: 1, seed: 6, paint: ground,
      dyn(x, t) {
        const px = 880 + Math.sin(t * 0.006) * 560;
        x.fillStyle = 'rgba(0,0,0,0.2)'; x.beginPath(); x.ellipse(px, 600, 36, 7, 0, 0, TAU); x.fill();
        drawTurtlebot(x, px, 600, 0.75, t);
      },
    },
  ],
});
