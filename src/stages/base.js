// Infraestrutura dos cenários: camadas estáticas pré-renderizadas com paralaxe + elementos animados por frame.
import { W, H, WORLD_W } from '../core/config.js';
import { mulberry } from '../core/util.js';

const SC = 1.25;
export const layerW = (f) => W + (WORLD_W - W) * f;
export const HORIZON = 560;    // encontro da parede com o piso

export class Stage {
  constructor(def) { this.def = def; this.id = def.id; this.name = def.name; this.desc = def.desc; this.music = def.music; this.layers = null; this.thumb = null; }

  build() {
    if (this.layers) return;
    this.layers = this.def.layers.map((L) => {
      const w = layerW(L.f);
      const c = document.createElement('canvas');
      c.width = Math.ceil(w * SC); c.height = Math.ceil(H * SC);
      const x = c.getContext('2d');
      x.scale(SC, SC);
      L.paint(x, w, mulberry(L.seed || 1));
      return { c, w, f: L.f, dyn: L.dyn };
    });
  }
  free() { this.layers = null; }

  drawBack(ctx, cam, t) {
    if (!this.layers) this.build();
    for (const L of this.layers) {
      const ox = -cam * L.f;
      ctx.drawImage(L.c, ox, 0, L.w, H);
      if (L.dyn) { ctx.save(); ctx.translate(ox, 0); L.dyn(ctx, t, L.w); ctx.restore(); }
    }
  }
  drawFront(ctx, cam, t) {
    if (!this.def.front) return;
    ctx.save(); ctx.translate(-cam * 1.15, 0);
    this.def.front(ctx, t, layerW(1.15));
    ctx.restore();
  }

  makeThumb(w = 480, h = 270) {
    this.build();
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.scale(w / W, h / H);
    const cam = (WORLD_W - W) / 2;
    this.drawBack(x, cam, 40); this.drawFront(x, cam, 40);
    this.thumb = c;
    this.free();
  }
}

// ---------- utilitários de pintura ----------
export function vgrad(x, y0, y1, stops) {
  const g = x.createLinearGradient(0, y0, 0, y1);
  stops.forEach((s, i) => g.addColorStop(typeof s === 'string' ? i / (stops.length - 1) : s[0], typeof s === 'string' ? s : s[1]));
  return g;
}
export function box(x, col, px, py, w, h, r = 0) {
  x.fillStyle = col;
  if (r) { x.beginPath(); x.roundRect(px, py, w, h, r); x.fill(); } else x.fillRect(px, py, w, h);
}
export function glow(x, cx, cy, r, col) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
// Piso com perspectiva: linhas convergindo para o ponto de fuga + faixas horizontais.
export function floor(x, w, top, cols, line, o = {}) {
  x.fillStyle = vgrad(x, top, H, cols); x.fillRect(0, top, w, H - top);
  const vx = w / 2, vy = top - (o.vp || 190), k = (top - vy) / (H - vy);
  x.strokeStyle = line; x.lineWidth = o.lw || 1.5;
  const step = o.step || 110;
  for (let bx = -w; bx < w * 2; bx += step) { x.beginPath(); x.moveTo(vx + (bx - vx) * k, top); x.lineTo(bx, H); x.stroke(); }
  if (!o.noH) for (let i = 1, y = top; y < H; i++) { y = top + i * i * (o.hs || 3.2); x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
}
export function label(x, txt, px, py, size, col, o = {}) {
  x.font = `${o.italic ? 'italic ' : ''}${o.weight || 900} ${size}px ${o.font || '"Arial Black","DejaVu Sans",sans-serif'}`;
  x.textAlign = o.align || 'center'; x.textBaseline = 'middle';
  if (o.stroke) { x.lineWidth = o.sw || 4; x.lineJoin = 'round'; x.strokeStyle = o.stroke; x.strokeText(txt, px, py); }
  x.fillStyle = col; x.fillText(txt, px, py);
}
