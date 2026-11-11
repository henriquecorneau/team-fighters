// Estilo pixel art 16-bit: o desenho vetorial é renderizado com superamostragem e convertido em pixels
// (cor dominante por bloco, paleta limitada por personagem e contorno de 1 px na silhueta).
import { settings } from '../core/settings.js';
import { drawFighter } from './rig.js';
import { S } from './poses.js';

export const PX = 3;                                   // tamanho do pixel em unidades lógicas
export const PIX = { get on() { return settings.pixel !== false; } };
export const snap = (v) => Math.round(v / PX) * PX;

const SS = 2, K = SS / PX;                             // amostras por pixel (lado) e escala do render auxiliar
// Sprite do lutador, em pixels: origem nos pés. A largura total só é usada com o braço hidráulico estendido.
const LW = 176, LH = 120, LN = 128, LOX = 59, LOY = 116;
const PLW = 240, PLH = 180;                            // tamanho máximo de um objeto (drone, capivara, ferramenta), em pixels
const OL = [22, 19, 31];

const mk = (w, h, read) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', read ? { willReadFrequently: true } : undefined)]; };
const [, hx] = mk(LW * SS, LH * SS, true);
const [, phx] = mk(PLW * SS, PLH * SS, true);

const keys = new Int32Array(9), cols = new Uint8Array(27);

// Converte a região (0,0,lw*ss,lh*ss) de `sx` em lw x lh pixels dentro de `img` (que pode ser mais largo).
function pixelate(sx, lw, lh, ss, pal, img, flash) {
  const w = lw * ss, src = sx.getImageData(0, 0, w, lh * ss).data, W = img.width, out = img.data, n = ss * ss;
  out.fill(0);
  for (let by = 0; by < lh; by++) {
    for (let bx = 0; bx < lw; bx++) {
      let op = 0, dark = 0;
      const base = (by * ss * w + bx * ss) * 4;
      for (let sy = 0; sy < ss; sy++) {
        let i = base + sy * w * 4;
        for (let s = 0; s < ss; s++, i += 4) {
          if (src[i + 3] < 128) continue;
          const r = src[i], g = src[i + 1], b = src[i + 2];
          keys[op] = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
          cols[op * 3] = r; cols[op * 3 + 1] = g; cols[op * 3 + 2] = b;
          if (r + g + b < 110) dark++;
          op++;
        }
      }
      if (op * 2 < n) continue;
      const o = (by * W + bx) * 4;
      if (flash) { out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 255; continue; }
      // cor dominante do bloco; o contorno escuro tem prioridade para manter as linhas contínuas
      const wantDark = dark * 3 >= n;
      let best = 0, bestN = 0;
      for (let a = 0; a < op; a++) {
        const isDark = cols[a * 3] + cols[a * 3 + 1] + cols[a * 3 + 2] < 110;
        if (isDark !== wantDark && (wantDark || dark < op)) continue;
        let cnt = 0;
        for (let b = 0; b < op; b++) if (keys[b] === keys[a]) cnt++;
        if (cnt > bestN) { bestN = cnt; best = a; }
      }
      let r = cols[best * 3], g = cols[best * 3 + 1], b = cols[best * 3 + 2];
      if (pal) {
        const k = keys[best];
        let pi = pal.cache[k];
        if (pi < 0) {
          let pd = 1e9;
          for (let q = 0; q < pal.cols.length; q++) { const c = pal.cols[q], d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < pd) { pd = d; pi = q; } }
          pal.cache[k] = pi;
        }
        const c = pal.cols[pi]; r = c[0]; g = c[1]; b = c[2];
      } else { r = (r & 0xf0) | 8; g = (g & 0xf0) | 8; b = (b & 0xf0) | 8; }
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255;
    }
  }
  // contorno de 1 px em volta da silhueta (alfa 254 marca o que é contorno)
  const row = W * 4;
  for (let y = 0; y < lh; y++) {
    for (let x = 0; x < lw; x++) {
      const o = (y * W + x) * 4;
      if (out[o + 3]) continue;
      if ((x > 0 && out[o - 1] === 255) || (x < lw - 1 && out[o + 7] === 255) || (y > 0 && out[o - row + 3] === 255) || (y < lh - 1 && out[o + row + 3] === 255)) {
        if (flash) { out[o] = 255; out[o + 1] = 110; out[o + 2] = 125; } else { out[o] = OL[0]; out[o + 1] = OL[1]; out[o + 2] = OL[2]; }
        out[o + 3] = 254;
      }
    }
  }
}

function renderFighter(look, pose, o) {
  hx.setTransform(1, 0, 0, 1, 0, 0); hx.clearRect(0, 0, LW * SS, LH * SS);
  hx.setTransform(K, 0, 0, K, LOX * SS, LOY * SS);
  drawFighter(hx, look, pose, o);
}

// Paleta limitada de cada personagem: as cores mais presentes em algumas poses (até 20).
const palettes = new WeakMap();
function paletteOf(look) {
  let pal = palettes.get(look);
  if (pal) return pal;
  const counts = new Map();
  for (const [pose, expr] of [[S.stA, 'n'], [S.winA, 'w'], [S.jab, 'a'], [S.swing, 'a'], [S.hitHigh, 'h'], [S.blockS, 'b']]) {
    renderFighter(look, pose, { expr, flip: 1, gearExt: 0.5 });
    const d = hx.getImageData(0, 0, LW * SS, LH * SS).data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 250) continue;
      const key = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  const list = [OL.slice()];
  for (const [key] of [...counts].sort((a, b) => b[1] - a[1])) {
    const c = [(((key >> 10) & 31) << 3) | 4, (((key >> 5) & 31) << 3) | 4, ((key & 31) << 3) | 4];
    if (list.every((p) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2 > 800)) list.push(c);
    if (list.length >= 20) break;
  }
  pal = { cols: list, cache: new Int16Array(4096).fill(-1) };
  palettes.set(look, pal);
  return pal;
}

// Sprite em pixels de um lutador. É refeito quando a pose muda — em quadros alternados (`lazy`), como animação de
// sprite a 30 quadros/s, exceto quando a expressão ou o flash de dano mudam (resposta imediata ao golpe).
export class Sprite {
  constructor() {
    [this.c, this.x] = mk(LW, LH);
    this.img = this.x.createImageData(LW, LH);
    this.last = new Float32Array(14); this.key = null; this.look = null;
  }
  update(look, pose, o) {
    const key = `${o.expr}|${o.flash ? 1 : 0}|${o.flip}|${(o.gearExt || 0) > 0.02 ? 1 : 0}`;
    const sameKey = key === this.key && look === this.look;
    if (sameKey && o.lazy) return;
    if (sameKey && o.gearExt === this.ext) {
      let same = true;
      for (let i = 0; i < 14; i++) if (pose[i] !== this.last[i]) { same = false; break; }
      if (same && look.gear !== 'holo' && look.gear !== 'spinner') return;
    }
    this.key = key; this.look = look; this.ext = o.gearExt; this.last.set(pose);
    renderFighter(look, pose, { expr: o.expr, t: o.t, gearExt: o.gearExt, flip: o.flip });
    pixelate(hx, (o.gearExt || 0) > 0.02 ? LW : LN, LH, SS, paletteOf(look), this.img, o.flash);
    this.x.putImageData(this.img, 0, 0);
  }
  // O contexto já deve estar transladado para os pés (e espelhado conforme o lado).
  draw(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.c, -LOX * PX, -LOY * PX, LW * PX, LH * PX);
    ctx.imageSmoothingEnabled = true;
  }
}

// Desenha um objeto (drone, capivara, ferramenta...) em pixels. `fn(ctx)` desenha o objeto com a origem em (0,0);
// l, r, u, d = quanto ele se estende para a esquerda, direita, cima e baixo da origem.
// Com `key`, o resultado fica em cache (os quadros de animação se repetem, como numa folha de sprites).
const cache = new Map();
export function pixelProp(ctx, x, y, l, r, u, d, fn, key) {
  l = Math.ceil(l / PX) * PX; u = Math.ceil(u / PX) * PX;
  const lw = Math.ceil((l + r) / PX), lh = Math.ceil((u + d) / PX);
  if (lw > PLW || lh > PLH) { ctx.save(); ctx.translate(x, y); fn(ctx); ctx.restore(); return; }
  let e = key && cache.get(key);
  if (!e) {
    phx.setTransform(1, 0, 0, 1, 0, 0); phx.clearRect(0, 0, lw * SS, lh * SS);
    phx.save(); phx.setTransform(K, 0, 0, K, l * K, u * K); fn(phx); phx.restore();
    const [c, cx] = mk(lw, lh);
    const img = cx.createImageData(lw, lh);
    pixelate(phx, lw, lh, SS, null, img, false);
    cx.putImageData(img, 0, 0);
    e = c;
    if (key) { if (cache.size > 900) cache.clear(); cache.set(key, e); }
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(e, snap(x - l), snap(y - u), lw * PX, lh * PX);
  ctx.imageSmoothingEnabled = true;
}

// Retrato em pixels (busto), com pixels mais finos que o sprite de luta.
export function makePixelPortrait(look, size, pose) {
  const N = 100, k = 2.4;
  phx.setTransform(1, 0, 0, 1, 0, 0); phx.clearRect(0, 0, N * 3, N * 3);
  phx.save(); phx.setTransform(k, 0, 0, k, N * 1.5 - 12, 126 + 221 * k);
  drawFighter(phx, look, pose, { expr: 'n', flip: 1 });
  phx.restore();
  const [low, lx] = mk(N, N);
  const img = lx.createImageData(N, N);
  pixelate(phx, N, N, 3, paletteOf(look), img, false);
  lx.putImageData(img, 0, 0);
  const [c, x] = mk(size, size);
  x.imageSmoothingEnabled = false;
  x.drawImage(low, 0, 0, size, size);
  return c;
}
