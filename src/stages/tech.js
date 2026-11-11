// LABORATÓRIO TECNOLÓGICO — sala de servidores e IA: racks, neon e uma rede neural holográfica.
import { Stage, vgrad, box, glow, floor, label, HORIZON } from './base.js';
import { H, FONT_M } from '../core/config.js';
import { TAU, mulberry } from '../core/util.js';

const NET = (() => {
  const r = mulberry(77), layers = [3, 5, 6, 5, 2], nodes = [];
  layers.forEach((n, li) => { for (let i = 0; i < n; i++) nodes.push({ l: li, x: -200 + li * 100, y: (i - (n - 1) / 2) * 44 + (r() - 0.5) * 8 }); });
  const edges = [];
  nodes.forEach((a, i) => nodes.forEach((b, j) => { if (b.l === a.l + 1 && r() < 0.75) edges.push([i, j, r() * 10]); }));
  return { nodes, edges };
})();

function wall(x, w, rnd) {
  x.fillStyle = vgrad(x, 0, HORIZON, ['#070a1a', '#0d1230', '#151040']); x.fillRect(0, 0, w, HORIZON + 4);
  // hexágonos
  x.strokeStyle = 'rgba(90,110,255,0.13)'; x.lineWidth = 1.5;
  for (let r = 0; r < 12; r++) for (let c = 0; c < 34; c++) {
    const cx = c * 52 + (r % 2) * 26, cy = r * 45 + 20;
    x.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; x.lineTo(cx + Math.cos(a) * 29, cy + Math.sin(a) * 29); } x.closePath(); x.stroke();
  }
  // faixas de neon
  for (const [y, col] of [[70, '#ff4fd8'], [HORIZON - 30, '#3fe0ff']]) { glow(x, w / 2, y, 10, col); x.fillStyle = col; x.fillRect(0, y - 2, w, 4); x.fillStyle = col.replace('#', '#') + '33'; x.fillRect(0, y - 12, w, 24); }
  // telões laterais de código (moldura)
  for (const px of [90, w - 370]) { box(x, '#04060f', px - 6, 150, 292, 250, 8); box(x, '#081226', px, 156, 280, 238, 4); }
  // pedestal do holograma
  box(x, '#1a1f44', w / 2 - 170, HORIZON - 34, 340, 34, 8); box(x, '#3fe0ff', w / 2 - 160, HORIZON - 36, 320, 4, 2);
  glow(x, w / 2, HORIZON - 30, 260, 'rgba(63,224,255,0.22)');
  label(x, 'NÚCLEO DE IA', w / 2, 116, 20, '#3fe0ff', { font: FONT_M, weight: 700 });
}

function ground(x, w, rnd) {
  floor(x, w, HORIZON, ['#1a1c4a', '#0e1030', '#06071a'], 'rgba(63,224,255,0.35)', { step: 120, lw: 1.6 });
  x.fillStyle = vgrad(x, HORIZON, HORIZON + 70, ['rgba(63,224,255,0.3)', 'rgba(63,224,255,0)']); x.fillRect(0, HORIZON, w, 70);
  // racks de servidores (a animação dos LEDs é dinâmica)
  for (const px of [40, 200, 360, 1300, 1460, 1620]) {
    box(x, '#05060c', px - 6, 300, 132, 300, 6); box(x, '#111528', px, 306, 120, 288, 4);
    for (let k = 0; k < 13; k++) { box(x, '#1b2140', px + 6, 312 + k * 21.6, 108, 16, 2); box(x, '#0a0d1c', px + 60, 316 + k * 21.6, 48, 8, 1); }
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.ellipse(px + 60, 602, 80, 8, 0, 0, TAU); x.fill();
  }
  x.strokeStyle = '#0a0c18'; x.lineWidth = 7; x.lineCap = 'round';
  for (const [a, b] of [[170, 520], [1280, 1090]]) { x.beginPath(); x.moveTo(a, 598); x.bezierCurveTo(a + (b - a) * 0.3, 640, a + (b - a) * 0.7, 584, b, 604); x.stroke(); }
}

export default new Stage({
  id: 'tech', name: 'LABORATÓRIO TECNOLÓGICO', music: 'tech',
  desc: 'Onde os modelos são treinados. Cuidado para não tropeçar nos cabos de rede.',
  layers: [
    {
      f: 0.45, seed: 9, paint: wall,
      dyn(x, t, w) {
        // rede neural holográfica com pulsos percorrendo as conexões
        x.save(); x.translate(w / 2, 330); x.globalCompositeOperation = 'lighter';
        for (const [i, j, ph] of NET.edges) {
          const a = NET.nodes[i], b = NET.nodes[j];
          x.strokeStyle = 'rgba(63,224,255,0.22)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
          const k = ((t * 0.02 + ph) % 3);
          if (k < 1) { x.fillStyle = '#fff'; x.beginPath(); x.arc(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 2.6, 0, TAU); x.fill(); }
        }
        NET.nodes.forEach((n, i) => { const p = 0.6 + 0.4 * Math.sin(t * 0.07 + i); x.fillStyle = n.l === 4 ? `rgba(255,79,216,${p})` : `rgba(63,224,255,${p})`; x.beginPath(); x.arc(n.x, n.y, 8 + p * 2, 0, TAU); x.fill(); });
        x.restore();
        x.fillStyle = 'rgba(63,224,255,0.06)'; x.beginPath(); x.moveTo(w / 2 - 150, HORIZON - 34); x.lineTo(w / 2 + 150, HORIZON - 34); x.lineTo(w / 2 + 260, 150); x.lineTo(w / 2 - 260, 150); x.fill();
        // código rolando nos telões
        x.font = `600 11px ${FONT_M}`; x.textAlign = 'left'; x.textBaseline = 'top';
        const lines = ['import torch', 'model = Net().cuda()', 'for epoch in range(100):', '  loss = criterion(y, t)', '  loss.backward()', '  optim.step()', 'acc = 0.9987', 'T_map_base @ T_base_cam', 'ros2 launch team fight.py', '[INFO] treino concluído', 'git push origin main', 'pose = slam.track(frame)', 'det = yolo(frame)[0]', 'colcon build --symlink-install'];
        [90, w - 370].forEach((px, s) => {
          x.save(); x.beginPath(); x.rect(px, 156, 280, 238); x.clip();
          const off = (t * 0.5) % 17;
          for (let i = 0; i < 16; i++) { const li = (Math.floor(t * 0.5 / 17) + i + s * 5) % lines.length; x.fillStyle = li % 4 === 0 ? '#ff4fd8' : li % 3 === 0 ? '#7dff8a' : '#3fe0ff'; x.fillText(lines[li], px + 10, 160 + i * 17 - off); }
          x.restore();
        });
      },
    },
    {
      f: 1, seed: 3, paint: ground,
      dyn(x, t) {
        const cols = ['#3fe0ff', '#7dff8a', '#ff4fd8', '#ffd23f'];
        [40, 200, 360, 1300, 1460, 1620].forEach((px, r) => {
          for (let k = 0; k < 13; k++) for (let c = 0; c < 4; c++) {
            const s = Math.sin(t * (0.05 + c * 0.03) + k * 2.1 + r * 5 + c);
            if (s > 0.1) { x.fillStyle = cols[(k + c + r) % 4]; x.fillRect(px + 10 + c * 10, 318 + k * 21.6, 5, 4); }
          }
        });
      },
    },
  ],
});
