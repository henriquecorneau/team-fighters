// LABORATÓRIO PRINCIPAL — grande salão de pesquisa à noite, com janelões para a cidade.
import { Stage, vgrad, box, glow, floor, label, HORIZON } from './base.js';
import { H, FONT_M } from '../core/config.js';
import { TAU } from '../core/util.js';

function sky(x, w, rnd) {
  x.fillStyle = vgrad(x, 0, HORIZON, ['#0a1030', '#1c2460', '#4a3a78', '#a25a72']); x.fillRect(0, 0, w, H);
  for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; x.fillRect(rnd() * w, rnd() * 300, 1.6, 1.6); }
  glow(x, w * 0.72, 150, 150, 'rgba(255,240,200,0.35)');
  x.fillStyle = '#fff3d6'; x.beginPath(); x.arc(w * 0.72, 150, 38, 0, TAU); x.fill();
  // skyline
  for (let layer = 0; layer < 2; layer++) {
    let px = -20;
    while (px < w) {
      const bw = 50 + rnd() * 90, bh = (layer ? 90 : 160) + rnd() * (layer ? 190 : 150);
      x.fillStyle = layer ? '#141a3c' : '#232a58'; x.fillRect(px, HORIZON - bh, bw, bh + 10);
      for (let wy = HORIZON - bh + 10; wy < HORIZON - 10; wy += 15) for (let wx = px + 7; wx < px + bw - 8; wx += 13) {
        if (rnd() < 0.36) { x.fillStyle = rnd() < 0.7 ? 'rgba(255,214,120,0.85)' : 'rgba(120,220,255,0.8)'; x.fillRect(wx, wy, 6, 8); }
      }
      px += bw + rnd() * 16;
    }
  }
}

function hall(x, w) {
  // estrutura das janelas
  for (let px = 0; px < w; px += 250) { box(x, '#10142a', px - 9, 60, 18, HORIZON - 56); box(x, '#1c2244', px - 5, 60, 4, HORIZON - 56); }
  box(x, '#10142a', 0, 0, w, 78); box(x, '#10142a', 0, 300, w, 9); box(x, '#161b38', 0, 70, w, 10);
  x.fillStyle = 'rgba(160,200,255,0.05)'; for (let px = 30; px < w; px += 250) { x.beginPath(); x.moveTo(px, 80); x.lineTo(px + 70, 80); x.lineTo(px + 10, HORIZON); x.lineTo(px - 30, HORIZON); x.fill(); }
  // faixas TEAM
  for (const px of [w * 0.2, w * 0.8]) {
    box(x, '#8f0f1b', px - 46, 78, 92, 210); box(x, '#e3212f', px - 42, 78, 84, 204);
    x.fillStyle = '#e3212f'; x.beginPath(); x.moveTo(px - 42, 282); x.lineTo(px, 262); x.lineTo(px + 42, 282); x.lineTo(px + 42, 300); x.lineTo(px, 282); x.lineTo(px - 42, 300); x.fill();
    x.save(); x.translate(px, 180); x.rotate(-Math.PI / 2); label(x, 'TEAM', 0, 2, 44, '#fff', { italic: true }); x.restore();
  }
  // luminárias pendentes
  for (let px = 125; px < w; px += 250) {
    box(x, '#0a0d1c', px - 1.5, 78, 3, 70); box(x, '#262c52', px - 30, 146, 60, 14, 6);
    glow(x, px, 170, 190, 'rgba(255,210,130,0.28)');
    x.fillStyle = 'rgba(255,220,150,0.07)'; x.beginPath(); x.moveTo(px - 26, 160); x.lineTo(px + 26, 160); x.lineTo(px + 150, HORIZON); x.lineTo(px - 150, HORIZON); x.fill();
  }
  box(x, '#0c1024', 0, HORIZON - 44, w, 48); box(x, '#232a52', 0, HORIZON - 46, w, 5);
  // relógio digital (moldura)
  box(x, '#05070f', w / 2 - 96, 96, 192, 62, 8); box(x, '#161c3a', w / 2 - 92, 100, 184, 54, 6);
}

function floorL(x, w, rnd) {
  floor(x, w, HORIZON, ['#2a3157', '#1a1f3c', '#101326'], 'rgba(120,150,255,0.14)', { step: 140 });
  for (const lx of [220, 700, 1180, 1620]) { x.fillStyle = vgrad(x, HORIZON, H, ['rgba(255,210,130,0.22)', 'rgba(255,210,130,0)']); x.beginPath(); x.moveTo(lx - 50, HORIZON); x.lineTo(lx + 50, HORIZON); x.lineTo(lx + 170, H); x.lineTo(lx - 170, H); x.fill(); }
  // fileiras de estações de trabalho ao fundo
  for (let i = 0; i < 9; i++) {
    const px = 60 + i * 200 + (i % 2) * 20;
    if (px > 760 && px < 1000) continue;
    box(x, '#3b3150', px - 70, 540, 150, 9, 3); box(x, '#231d33', px - 62, 548, 8, 46); box(x, '#231d33', px + 66, 548, 8, 46);
    box(x, '#0a0c16', px - 44, 486, 76, 50, 4); box(x, '#11284a', px - 40, 490, 68, 42, 2);
    x.fillStyle = i % 3 ? 'rgba(63,224,255,0.75)' : 'rgba(125,255,138,0.75)';
    for (let k = 0; k < 6; k++) x.fillRect(px - 36, 494 + k * 6, 14 + rnd() * 44, 2.4);
    box(x, '#0a0c16', px - 8, 536, 6, 6);
    glow(x, px - 6, 512, 80, 'rgba(63,224,255,0.14)');
    box(x, '#151a30', px + 44, 520, 26, 20, 3);
  }
  // pedestal do braço robótico e plantas
  box(x, '#1b2038', 840, 560, 90, 36, 6); box(x, '#e3212f', 840, 560, 90, 6, 3);
  for (const px of [30, 1730]) { box(x, '#3a2c2a', px - 22, 566, 44, 34, 6); x.fillStyle = '#2f7a4a'; for (let k = 0; k < 7; k++) { x.beginPath(); x.ellipse(px + Math.cos(k * 0.9) * 22, 540 - k * 9, 9, 26, Math.cos(k * 0.9) * 0.8, 0, TAU); x.fill(); } }
}

export default new Stage({
  id: 'main', name: 'LABORATÓRIO PRINCIPAL', music: 'main',
  desc: 'O salão central de pesquisa em plena madrugada de prazo de entrega.',
  layers: [
    { f: 0.25, seed: 4, paint: sky, dyn(x, t, w) { for (let i = 0; i < 14; i++) { const a = 0.5 + 0.5 * Math.sin(t * 0.05 + i * 2.3); x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect((i * 137.5) % w, 30 + ((i * 71) % 220), 2.4, 2.4); } } },
    {
      f: 0.6, seed: 2, paint: hall,
      dyn(x, t, w) {
        const d = new Date();
        const txt = String(d.getHours()).padStart(2, '0') + (d.getSeconds() % 2 ? ':' : ' ') + String(d.getMinutes()).padStart(2, '0');
        label(x, txt, w / 2, 128, 40, '#ff5a66', { font: FONT_M, weight: 700 });
      },
    },
    {
      f: 1, seed: 8, paint: floorL,
      dyn(x, t) {
        // braço robótico de demonstração
        const a1 = -0.5 + Math.sin(t * 0.02) * 0.5, a2 = 1.2 + Math.sin(t * 0.031) * 0.6;
        const bx = 885, by = 560, l1 = 78, l2 = 64;
        const ex = bx + Math.sin(a1) * l1, ey = by - Math.cos(a1) * l1, hx = ex + Math.sin(a1 + a2) * l2, hy = ey - Math.cos(a1 + a2) * l2;
        x.lineCap = 'round'; x.lineJoin = 'round';
        x.strokeStyle = '#0c0e1a'; x.lineWidth = 22; x.beginPath(); x.moveTo(bx, by); x.lineTo(ex, ey); x.lineTo(hx, hy); x.stroke();
        x.strokeStyle = '#e8ebf2'; x.lineWidth = 16; x.stroke();
        for (const [px, py] of [[bx, by], [ex, ey], [hx, hy]]) { x.fillStyle = '#e3212f'; x.beginPath(); x.arc(px, py, 8, 0, TAU); x.fill(); }
      },
    },
  ],
});
