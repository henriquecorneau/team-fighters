// Finalizações (estilo "fatality", em versão bem-humorada): cena exclusiva de cada personagem ao vencer a luta.
// cmd: sequência de comandos — 'f' frente, 'b' trás, 'd' baixo — seguida de um botão de ação.
import { S } from '../render/poses.js';
import { Ent, cpose } from '../combat/entities.js';
import { drawDrone, drawCapy, drawGear } from '../render/props.js';
import { drawSpinner } from './peidin.js';
import { GROUND, W, H, FONT_D, FONT_M } from '../core/config.js';
import { Audio } from '../core/audio.js';
import { clamp, rand, easeIn, easeOut, smooth, easeOutBack } from '../core/util.js';

const begin = (m, a, d, c) => { c.dir = d.x >= a.x ? 1 : -1; a.facing = c.dir; d.facing = -c.dir; c.dx = d.x; };
const leave = (m, a, x, draw) => m.ents.push(new Ent({ owner: a, x, y: 0, life: 1e9, hit: null, back: true, draw }));
const label = (ctx, txt, x, y, size, col, stroke = '#16131f') => {
  ctx.font = `italic 900 ${size}px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.22; ctx.strokeStyle = stroke; ctx.strokeText(txt, x, y);
  ctx.fillStyle = col; ctx.fillText(txt, x, y);
};

// ---------- peças de cena ----------
// Lutador de cabeça para baixo, enterrado até a cintura (só as pernas para fora do chão).
function drawPlanted(ctx, d, t) {
  const was = d.hidden; d.hidden = false; d.noComp = true;
  ctx.save();
  ctx.beginPath(); ctx.rect(d.x - 170, 0, 340, GROUND + 2); ctx.clip();
  ctx.translate(0, GROUND - 104); ctx.scale(1, -1); ctx.translate(0, -GROUND);
  d.draw(ctx, t);
  ctx.restore();
  d.hidden = was; d.noComp = false;
}
function cracks(ctx, x) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(x, GROUND + 4, 74, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#16131f'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const [dx, a, l] of [[-60, 2.9, 90], [-40, 2.4, 60], [50, 0.3, 100], [36, 0.9, 54], [-10, 1.5, 46], [70, -0.2, 60]]) {
    ctx.beginPath(); ctx.moveTo(x + dx, GROUND + 4);
    ctx.lineTo(x + dx + Math.cos(a) * l * 0.5, GROUND + 6 + Math.abs(Math.sin(a)) * l * 0.12 + 5);
    ctx.lineTo(x + dx + Math.cos(a) * l, GROUND + 8 + Math.abs(Math.sin(a)) * l * 0.2);
    ctx.stroke();
  }
}
// Engrenagem estampada com o rosto do perdedor (produto final da linha de produção).
function gearFace(ctx, x, y, rot, d) {
  drawGear(ctx, x, y, 62, 11, rot, '#aeb6c4', '#16131f', 0.62);
  if (d.char.portrait) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, 37, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#e9ecf2'; ctx.fillRect(x - 40, y - 40, 80, 80);
    ctx.drawImage(d.char.portrait, x - 40, y - 42, 84, 84);
    ctx.restore();
  }
}
// O perdedor depois de "adotado": uma capivara sentada, de óculos e laranja na cabeça.
function newCapy(ctx, x, dir, t) {
  drawCapy(ctx, x, GROUND + 4, 1.15, t, { dir, sit: true, orange: true });
  ctx.fillStyle = '#16131f'; ctx.fillRect(x + dir * 30 - 12, GROUND - 60, 24, 5); ctx.fillRect(x + dir * 30 - 13, GROUND - 62, 11, 12); ctx.fillRect(x + dir * 30 + 2, GROUND - 62, 11, 12);
  ctx.fillStyle = 'rgba(200,230,255,0.75)'; ctx.fillRect(x + dir * 30 - 10, GROUND - 59, 5, 6); ctx.fillRect(x + dir * 30 + 5, GROUND - 59, 5, 6);
}
function brawlCloud(ctx, x, f, k, dir) {
  // nuvem de briga de desenho animado: bolhas de poeira, estrelas e capivaras entrando e saindo
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4 + f * 0.21, r = (60 + 40 * Math.sin(f * 0.3 + i * 1.7)) * k;
    ctx.fillStyle = i % 3 ? '#efe8da' : '#d9d0bd';
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 1.3, GROUND - 100 + Math.sin(a) * r * 0.8, (46 + 14 * Math.sin(f * 0.5 + i)) * k, 0, Math.PI * 2); ctx.fill();
  }
  if (k > 0.6) {
    for (let i = 0; i < 3; i++) { const a = f * 0.17 + i * 2.1; drawCapy(ctx, x + Math.cos(a) * 120, GROUND - 60 + Math.sin(a * 1.3) * 70, 0.7, f + i * 9, { dir: Math.cos(a) > 0 ? -1 : 1, run: true, angry: true }); }
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#16131f'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { const a = -f * 0.25 + i * 1.26, sx = x + Math.cos(a) * 150, sy = GROUND - 110 + Math.sin(a) * 100; ctx.beginPath(); for (let q = 0; q < 10; q++) { const b = q / 10 * Math.PI * 2 + f * 0.1, rr = q % 2 ? 6 : 14; ctx.lineTo(sx + Math.cos(b) * rr, sy + Math.sin(b) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
}

// Desenha o lutador em fatias horizontais (cada uma com seu deslocamento) — usado no "corte de precisão".
// top/bot = alturas acima do chão; dx/dy = deslocamento da fatia.
function drawSlices(ctx, d, t, parts) {
  const was = d.hidden; d.hidden = false; d.noComp = true;
  for (const p of parts) {
    ctx.save(); ctx.translate(p.dx, p.dy);
    ctx.beginPath(); ctx.rect(d.x - 170, GROUND - p.top, 340, p.top - p.bot); ctx.clip();
    d.draw(ctx, t);
    ctx.restore();
  }
  d.hidden = was; d.noComp = false;
}
function drawShrunk(ctx, d, t, kx, ky) {
  const was = d.hidden; d.hidden = false; d.noComp = true;
  ctx.save(); ctx.translate(d.x, GROUND); ctx.scale(kx, ky); ctx.translate(-d.x, -GROUND);
  d.draw(ctx, t);
  ctx.restore();
  d.hidden = was; d.noComp = false;
}
const HEAD = 176, WAIST = 96;                      // alturas dos dois cortes
function sliceParts(f) {
  const sl = smooth(clamp((f - 104) / 22, 0, 1));
  const a = smooth(clamp((f - 132) / 24, 0, 1)), b = smooth(clamp((f - 158) / 24, 0, 1)), c = smooth(clamp((f - 184) / 18, 0, 1));
  return [
    { top: 300, bot: HEAD, dx: 36 * sl + 130 * a - 166 * c, dy: 176 * a - Math.sin(a * Math.PI) * 30 },          // cabeça: sai de lado e vai para baixo
    { top: HEAD, bot: WAIST, dx: -28 * sl * (1 - b), dy: -18 * b - Math.sin(b * Math.PI) * 40 },                 // tronco: sobe um pouco
    { top: WAIST, bot: -14, dx: 0, dy: -206 * b - Math.sin(b * Math.PI) * 60 },                                  // pernas: vão para o topo
  ];
}
function seamTape(ctx, x, n) {
  ctx.lineCap = 'round';
  for (const [i, h] of [114, 194].entries()) {
    if (i >= n) break;
    const y = GROUND - h;
    ctx.strokeStyle = '#16131f'; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(x - 50, y + 4); ctx.lineTo(x + 50, y - 4); ctx.stroke();
    ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 15; ctx.stroke();
    ctx.strokeStyle = '#9aa1ad'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 46, y - 1); ctx.lineTo(x + 46, y - 7); ctx.stroke();
  }
}
function saw(ctx, x, y, t) {
  drawGear(ctx, x, y, 46, 18, t * 0.9, '#d7dde6', '#16131f', 0.2);
  ctx.fillStyle = '#16131f'; ctx.fillRect(x - 12, y - 12, 24, 24); ctx.fillStyle = '#e3212f'; ctx.fillRect(x - 8, y - 8, 16, 16);
}
function sign(ctx, x, y, rot, l1, l2) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = '#16131f'; ctx.fillRect(-84, -30, 168, 60);
  ctx.fillStyle = '#5dff7a'; ctx.fillRect(-80, -26, 160, 52);
  ctx.font = `900 17px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#0c2a12';
  ctx.fillText(l1, 0, -9); ctx.font = `700 11px ${FONT_D}`; ctx.fillText(l2, 0, 11);
  ctx.restore();
}
function zipIcon(ctx, x, y, name) {
  ctx.fillStyle = '#16131f'; ctx.beginPath(); ctx.roundRect(x - 33, y - 62, 66, 62, 7); ctx.fill();
  ctx.fillStyle = '#f2c84b'; ctx.beginPath(); ctx.roundRect(x - 30, y - 59, 60, 56, 5); ctx.fill();
  ctx.fillStyle = '#d9a92a'; ctx.fillRect(x - 30, y - 59, 26, 10);
  ctx.fillStyle = '#16131f'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 4 + (i % 2) * 4, y - 56 + i * 8, 4, 6);
  ctx.fillStyle = '#c9ced8'; ctx.fillRect(x - 5, y - 12, 10, 8);
  ctx.font = `bold 13px ${FONT_M}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const w = ctx.measureText(name).width + 12; ctx.fillStyle = 'rgba(4,10,24,0.85)'; ctx.fillRect(x - w / 2, y + 4, w, 20);
  ctx.fillStyle = '#7dffb0'; ctx.fillText(name, x, y + 7);
}
function trash(ctx, x, t, full, shake = 0) {
  ctx.save(); ctx.translate(x + Math.sin(t * 1.3) * shake, GROUND); ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#3fe0ff'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.fillStyle = 'rgba(63,224,255,0.18)';
  ctx.beginPath(); ctx.moveTo(-44, -104); ctx.lineTo(44, -104); ctx.lineTo(34, 0); ctx.lineTo(-34, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-54, -112); ctx.lineTo(54, -112); ctx.moveTo(-16, -112); ctx.lineTo(-12, -124); ctx.lineTo(12, -124); ctx.lineTo(16, -112); ctx.stroke();
  for (const lx of [-18, 0, 18]) { ctx.beginPath(); ctx.moveTo(lx, -90); ctx.lineTo(lx * 0.8, -14); ctx.stroke(); }
  if (full) { ctx.fillStyle = '#f2c84b'; ctx.fillRect(-16, -122, 32, 16); }
  ctx.restore();
}
function cursor(ctx, x, y, click) {
  ctx.save(); ctx.translate(x, y); if (click) ctx.scale(0.82, 0.82);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#16131f'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(16, 42); ctx.lineTo(23, 39); ctx.lineTo(16, 24); ctx.lineTo(27, 24); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function dialog(ctx, cx, y, pressed) {
  const x = cx - 230;
  ctx.fillStyle = '#16131f'; ctx.fillRect(x - 4, y - 4, 468, 168);
  ctx.fillStyle = '#e9ecf2'; ctx.fillRect(x, y, 460, 160);
  ctx.fillStyle = '#2a5fb0'; ctx.fillRect(x, y, 460, 30);
  ctx.font = `bold 15px ${FONT_M}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('Lixeira', x + 12, y + 16);
  ctx.fillStyle = '#16131f'; ctx.font = `bold 17px ${FONT_M}`; ctx.fillText('Esvaziar a lixeira?', x + 22, y + 58);
  ctx.font = `600 13px ${FONT_M}`; ctx.fillText('Esta ação não pode ser desfeita. (ainda bem)', x + 22, y + 84);
  ctx.fillStyle = '#c9ced8'; ctx.fillRect(x + 200, y + 112, 110, 32); ctx.fillStyle = pressed ? '#8f0f1b' : '#e3212f'; ctx.fillRect(x + 326, y + 112, 110, 32);
  ctx.textAlign = 'center'; ctx.font = `bold 15px ${FONT_M}`; ctx.fillStyle = '#16131f'; ctx.fillText('Cancelar', x + 255, y + 129); ctx.fillStyle = '#fff'; ctx.fillText('SIM', x + 381, y + 129);
}
function press(ctx, cx, bottom, f) {
  ctx.fillStyle = '#16131f'; ctx.fillRect(cx - 42, -20, 84, bottom - 150);
  ctx.fillStyle = '#c9d0db'; ctx.fillRect(cx - 36, -20, 72, bottom - 150);
  ctx.fillStyle = '#eef2f7'; ctx.fillRect(cx - 28, -20, 16, bottom - 150);
  ctx.fillStyle = '#16131f'; ctx.beginPath(); ctx.roundRect(cx - 190, bottom - 170, 380, 170, 14); ctx.fill();
  ctx.fillStyle = '#566072'; ctx.beginPath(); ctx.roundRect(cx - 184, bottom - 164, 368, 158, 10); ctx.fill();
  ctx.fillStyle = '#7b8697'; ctx.fillRect(cx - 184, bottom - 164, 368, 30);
  ctx.save(); ctx.beginPath(); ctx.rect(cx - 184, bottom - 42, 368, 36); ctx.clip();
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(cx - 190, bottom - 50, 380, 60);
  ctx.fillStyle = '#16131f'; for (let i = -1; i < 12; i++) { ctx.beginPath(); ctx.moveTo(cx - 200 + i * 40, bottom); ctx.lineTo(cx - 170 + i * 40, bottom - 50); ctx.lineTo(cx - 150 + i * 40, bottom - 50); ctx.lineTo(cx - 180 + i * 40, bottom); ctx.fill(); }
  ctx.restore();
  drawGear(ctx, cx - 110, bottom - 100, 34, 9, f * 0.2, '#f28c28'); drawGear(ctx, cx + 110, bottom - 100, 34, 9, -f * 0.2, '#f28c28');
}
function shoe(ctx, x, y, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = '#16131f'; ctx.beginPath(); ctx.roundRect(-22, -15, 44, 22, 8); ctx.fill(); ctx.fillRect(-22, -30, 20, 20);
  ctx.fillStyle = '#3a3d4a'; ctx.beginPath(); ctx.roundRect(-19, -12, 38, 14, 6); ctx.fill(); ctx.fillRect(-19, -27, 14, 16);
  ctx.fillStyle = '#e9ecf2'; ctx.fillRect(-21, 3, 42, 4);
  ctx.restore();
}

const DRONE_OFF = [[-92, -30], [-34, 6], [34, 6], [92, -30]];

export const FATALS = {
  // BAIANO — os drones levam o perdedor até 3000 m, soltam, e ele volta plantado de cabeça no chão.
  baiano: {
    name: 'QUEDA LIVRE', desc: 'Os drones sobem com o adversário a 3000 m... e soltam.', cmd: ['d', 'f', 'd', 'sp1'], dur: 276, hits: [], begin,
    step(m, a, d, f, c) {
      a.exprOverride = 'w'; d.exprOverride = 'h'; d.x = c.dx;
      a.x += (c.dx - c.dir * 190 - a.x) * 0.12;
      cpose(a, f < 150 ? S.point : f < 186 ? S.up : S.winA, 8);
      if (f < 186) { cpose(d, f < 62 ? S.dzA : S.hitHigh, 8); d.y = f < 62 ? d.y * 0.7 : easeIn(clamp((f - 62) / 60, 0, 1)) * 900; d.hidden = f >= 124; }
      else { d.y = 0; d.hidden = true; cpose(d, f % 16 < 8 ? S.w0 : S.w2, 6); }
      if (f === 2 || f === 62 || f === 100) Audio.sfx('drone');
      if (f === 50) Audio.sfx('lockon');
      if (f === 150) { Audio.sfx('ui_deny'); m.fx.text(c.dx, 190, 'CARGA LIBERADA', '#ff4455', 34, { life: 40, vy: 0 }); }
      if (f === 156) Audio.sfx('laser');
      if (f === 186) {
        Audio.sfx('press'); Audio.sfx('ko'); m.shake = 34; m.flashA = 0.8;
        m.fx.dust(c.dx - 70, GROUND, -1, 16); m.fx.dust(c.dx + 70, GROUND, 1, 16);
        m.fx.burst(c.dx, GROUND - 10, 26, ['#8a8f99', '#c9ced8', '#5a5f69'], 20, { type: 'sq', size: 10, front: true, g: 0.6, life: 1.6 });
        m.fx.text(c.dx, GROUND - 330, 'ENTREGA NO CHÃO!', '#ffd23f', 44, { life: 70 });
      }
      if (f === 240) { Audio.sfx('stamp'); m.fx.text(c.dx, GROUND - 270, 'ENTREGUE ✔', '#5dff7a', 30, { life: 50 }); }
    },
    drawBack(ctx, m, a, d, f, c) { if (f >= 186) cracks(ctx, c.dx); },
    drawFront(ctx, m, a, d, f, c) {
      if (f < 150) {
        const k = easeOut(clamp(f / 46, 0, 1)), by = GROUND - d.y - 330 - (1 - k) * 420;
        for (const [ox, oy] of DRONE_OFF) {
          ctx.strokeStyle = '#16131f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(c.dx + ox, by + oy + 10); ctx.lineTo(c.dx + ox * 0.25, GROUND - d.y - 190); ctx.stroke();
          drawDrone(ctx, c.dx + ox, by + oy, 1.1, m.t + ox, { led: '#7dff8a' });
        }
      }
      if (f >= 100 && f < 186) {
        // altímetro e sombra do que vem caindo
        const alt = f < 150 ? Math.round(easeOut(clamp((f - 100) / 50, 0, 1)) * 3000) : Math.round(3000 * (1 - easeIn(clamp((f - 150) / 36, 0, 1))));
        const x = m.cam.x + W / 2 - 170;
        ctx.fillStyle = 'rgba(4,10,24,0.9)'; ctx.fillRect(x, 120, 340, 54); ctx.strokeStyle = f >= 150 ? '#ff4455' : '#3fe0ff'; ctx.lineWidth = 2; ctx.strokeRect(x, 120, 340, 54);
        ctx.font = `bold 24px ${FONT_M}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = f >= 150 ? '#ff4455' : '#7dffb0';
        ctx.fillText('ALTITUDE: ' + alt + ' m', x + 170, 148);
        if (f >= 150) { const k = easeIn(clamp((f - 150) / 36, 0, 1)); ctx.fillStyle = `rgba(0,0,0,${0.15 + 0.4 * k})`; ctx.beginPath(); ctx.ellipse(c.dx, GROUND + 6, 20 + 60 * k, 4 + 10 * k, 0, 0, Math.PI * 2); ctx.fill(); if (f >= 170) drawShrunk(ctx, { ...d, x: c.dx, hidden: true, draw: (cx, t) => { cx.save(); cx.translate(0, -(1 - clamp((f - 170) / 16, 0, 1)) * 760); cx.translate(0, GROUND - 250); cx.scale(1, -1); cx.translate(0, -GROUND); d.hidden = false; d.noComp = true; d.draw(cx, t); d.hidden = true; d.noComp = false; cx.restore(); } }, m.t, 1, 1); }
      }
      if (f >= 186) {
        drawPlanted(ctx, d, m.t);
        if (f >= 214) { const k = easeOut(clamp((f - 214) / 26, 0, 1)); drawDrone(ctx, c.dx, -60 + (GROUND - 222 + 60) * k, 1.1, m.t, { led: '#7dff8a' }); }
      }
    },
    end(m, a, d, c) {
      d.hidden = true; d.y = 0; d.x = c.dx; d.poseOverride = S.w0;
      leave(m, a, c.dx, (ctx, e, mm) => { cracks(ctx, e.x); drawPlanted(ctx, d, mm.t); drawDrone(ctx, e.x, GROUND - 222, 1.1, mm.t, { led: '#7dff8a' }); });
      m.ents[m.ents.length - 1].back = false;
    },
  },

  // RINALDO — corta o perdedor em três com a esmerilhadeira, remonta na ordem errada e prende com fita.
  rinaldo: {
    name: 'GAMBIARRA ANATÔMICA', desc: 'Corta em três, remonta na ordem errada e prende com fita.', cmd: ['b', 'f', 'b', 'heavy'], dur: 262, hits: [], begin,
    step(m, a, d, f, c) {
      a.x += (c.dx - c.dir * 150 - a.x) * 0.2; d.y = 0; d.x = c.dx; d.hidden = true;
      a.exprOverride = f < 104 ? 'a' : 'w'; d.exprOverride = 'h';
      cpose(a, f < 104 ? S.both : f < 204 ? (f % 26 < 13 ? S.throwW : S.throw) : f < 226 ? S.point : S.winA, 6);
      cpose(d, S.relax, 6);
      if (f === 6) { Audio.sfx('gambiarra'); m.fx.text(a.x, GROUND - 320, 'ESMERILHADEIRA!', '#ffd23f', 30, { life: 46 }); }
      if (f === 40 || f === 72) Audio.sfx('drill');
      if ((f >= 40 && f < 68) || (f >= 72 && f < 100)) {
        const k = ((f >= 72 ? f - 72 : f - 40) / 28), sx = c.dx + c.dir * (-100 + 200 * k), sy = GROUND - (f >= 72 ? WAIST : HEAD);
        m.fx.burst(sx, sy, 3, ['#ffd23f', '#fff', '#ff8a3c'], 14, { front: true, arc: 1.1, dir: c.dir > 0 ? Math.PI : 0 });
        m.shake = Math.max(m.shake, 3);
      }
      if (f === 104) { Audio.sfx('whoosh_h'); m.fx.text(c.dx, GROUND - 340, 'CORTE DE PRECISÃO!', '#fff', 34, { life: 50 }); }
      if (f === 156 || f === 182 || f === 202) { Audio.sfx('bonk'); m.shake = 8; m.fx.dust(c.dx, GROUND, 0, 6); }
      if (f === 208 || f === 218) Audio.sfx('tape');
      if (f === 230) { Audio.sfx('stamp'); m.fx.text(c.dx, GROUND - 350, 'RESOLVIDO!', '#5dff7a', 44, { life: 60 }); m.fx.text(c.dx, GROUND - 310, '(mais ou menos)', '#fff', 20, { life: 60 }); m.fx.confetti(c.dx, GROUND - 320, 24); }
    },
    drawFront(ctx, m, a, d, f, c) {
      drawSlices(ctx, d, m.t, sliceParts(f));
      for (const [f0, h] of [[40, HEAD], [72, WAIST]]) {
        if (f >= f0 - 14 && f < f0 + 34) { const k = clamp((f - f0) / 28, 0, 1); saw(ctx, c.dx + c.dir * (-100 + 200 * k), GROUND - h, f); }
        if (f >= f0 + 28 && f < 132) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c.dx - 70, GROUND - h); ctx.lineTo(c.dx + 70, GROUND - h); ctx.stroke(); }
      }
      if (f >= 208) seamTape(ctx, c.dx, f >= 218 ? 2 : 1);
      if (f >= 232) sign(ctx, c.dx + c.dir * 120, GROUND - 60, 0.05, 'RESOLVIDO ✔', 'garantia: nenhuma');
    },
    end(m, a, d, c) {
      d.hidden = true; d.poseOverride = S.relax; d.x = c.dx; d.y = 0;
      const dir = c.dir;
      leave(m, a, c.dx, (ctx, e, mm) => { drawSlices(ctx, d, mm.t, sliceParts(999)); seamTape(ctx, e.x, 2); sign(ctx, e.x + dir * 120, GROUND - 60, 0.05, 'RESOLVIDO ✔', 'garantia: nenhuma'); });
      m.ents[m.ents.length - 1].back = false;
    },
  },

  // TIBAS — a prensa achata o perdedor e a segunda batida estampa uma engrenagem com o rosto dele.
  tibas: {
    name: 'LINHA DE PRODUÇÃO', desc: 'Prensado, estampado e aprovado: vira a peça nº 0001.', cmd: ['d', 'd', 'f', 'heavy'], dur: 286, hits: [], begin,
    step(m, a, d, f, c) {
      a.exprOverride = 'w'; d.exprOverride = 'h'; d.y *= 0.7; d.x = c.dx;
      a.x += (c.dx - c.dir * 250 - a.x) * 0.15;
      cpose(a, f < 92 ? S.flex : f < 124 ? S.slam : f < 176 ? S.flex : f < 206 ? S.slam : S.winA, 6);
      cpose(d, f < 100 ? (f % 30 < 15 ? S.dzA : S.dzB) : S.relax, 6);
      d.squash = f < 100 ? 1 : 0.09; d.hidden = f >= 190;
      if (f === 4) { Audio.sfx('gear'); Audio.sfx('turbine'); }
      if (f === 40 || f === 160) Audio.sfx('hydraulic');
      if (f === 100) { Audio.sfx('press'); m.shake = 28; m.flashA = 0.6; m.fx.dust(c.dx - 90, GROUND, -1, 14); m.fx.dust(c.dx + 90, GROUND, 1, 14); m.fx.text(c.dx, GROUND - 340, 'ETAPA 1: LAMINAÇÃO', '#f28c28', 36, { life: 56 }); }
      if (f === 134) Audio.sfx('gear');
      if (f === 190) { Audio.sfx('press'); Audio.sfx('clang'); m.shake = 30; m.flashA = 0.7; m.fx.burst(c.dx, GROUND - 30, 30, ['#cfd6e2', '#f28c28', '#fff'], 18, { type: 'sq', size: 8, front: true, g: 0.5 }); m.fx.text(c.dx, GROUND - 340, 'ETAPA 2: ESTAMPARIA', '#f28c28', 36, { life: 56 }); }
      if (f === 246) { Audio.sfx('stamp'); m.fx.text(c.dx, GROUND - 230, 'PEÇA Nº 0001', '#fff', 34, { life: 80 }); m.fx.text(c.dx, GROUND - 195, 'controle de qualidade: APROVADO', '#5dff7a', 20, { life: 80 }); m.fx.confetti(c.dx, GROUND - 260, 20); }
    },
    drawFront(ctx, m, a, d, f, c) {
      if (f >= 190) gearFace(ctx, c.dx, GROUND - 64 - Math.max(0, Math.sin(clamp((f - 222) / 30, 0, 1) * Math.PI)) * 26, f > 222 ? (f - 222) * 0.03 : 0, d);
      // duas batidas da prensa: laminação (f=100) e estamparia (f=190)
      const k1 = f < 100 ? easeIn(clamp((f - 30) / 70, 0, 1)) : f < 124 ? 1 : 1 - smooth(clamp((f - 124) / 30, 0, 1));
      const k2 = f < 160 ? 0 : f < 190 ? easeIn(clamp((f - 160) / 30, 0, 1)) : f < 204 ? 1 : 1 - smooth(clamp((f - 204) / 30, 0, 1));
      const k = Math.max(k1, k2 * 0.86);
      if (f > 28 && k > 0) press(ctx, c.dx, -80 + (GROUND - 16 + 80) * k, f);
    },
    end(m, a, d, c) {
      d.hidden = true; d.squash = 1; d.poseOverride = S.relax;
      leave(m, a, c.dx, (ctx, e, mm) => gearFace(ctx, e.x, GROUND - 64, mm.t * 0.03, d));
      m.ents[m.ents.length - 1].back = false;
    },
  },

  // RAMAS — compacta o perdedor num .zip, arrasta para a lixeira e esvazia a lixeira.
  ramas: {
    name: 'EXCLUSÃO PERMANENTE', desc: 'Compacta em .zip, joga na lixeira e esvazia.', cmd: ['f', 'b', 'f', 'sp2'], dur: 268, hits: [], begin,
    step(m, a, d, f, c) {
      a.exprOverride = f > 226 ? 'w' : 'n'; d.exprOverride = 'h'; d.y = 0; d.hidden = true;
      cpose(a, f < 226 ? (f % 12 < 6 ? S.type : S.typeB) : S.armsX, 6);
      cpose(d, f < 40 ? S.hitHigh : S.hitLow, 8);
      d.x = c.dx + (f < 104 && f % 5 < 2 ? rand(-6, 6) : 0);
      if (f === 2) Audio.sfx('boot');
      if (f === 26) Audio.sfx('ai_lock');
      if (f === 40) { Audio.sfx('hydraulic'); m.fx.text(c.dx, GROUND - 330, 'COMPACTANDO...', '#3fe0ff', 28, { life: 56 }); }
      if (f > 40 && f < 104 && f % 9 === 0) { Audio.sfx('glitch'); m.shake = Math.max(m.shake, 4); m.fx.burst(c.dx, GROUND - 100, 4, ['#3fe0ff', '#ff4fd8'], 9, { type: 'sq', size: 6, front: true }); }
      if (f === 104) { Audio.sfx('boing'); m.flashA = 0.35; m.fx.text(c.dx, GROUND - 190, '3 KB!', '#7dffb0', 40, { life: 40 }); m.fx.burst(c.dx, GROUND - 40, 14, ['#3fe0ff', '#ff4fd8', '#fff'], 12, { type: 'sq', size: 7, front: true }); }
      if (f === 126) Audio.sfx('ui_move');
      if (f === 176) { Audio.sfx('bonk'); m.shake = 6; }
      if (f === 186) Audio.sfx('ui_deny');
      if (f === 222) Audio.sfx('ui_ok');
      if (f === 226) {
        const bx = c.dx + c.dir * 190;
        Audio.sfx('explosion'); m.shake = 22; m.flashA = 0.6;
        m.fx.explosion(bx, GROUND - 60, 0.9, ['#fff', '#3fe0ff', '#ff4fd8', '#b06bff']);
        m.fx.burst(bx, GROUND - 60, 40, ['#3fe0ff', '#ff4fd8', '#fff'], 18, { type: 'sq', size: 8, front: true, life: 1.6 });
        m.fx.text(c.dx, GROUND - 330, 'EXCLUÍDO PERMANENTEMENTE', '#ff4fd8', 34, { life: 70 });
      }
    },
    drawBack(ctx, m, a, d, f) {
      ctx.save(); ctx.globalAlpha = Math.min(1, f / 20) * 0.6; ctx.font = `bold 15px ${FONT_M}`; ctx.textAlign = 'center';
      for (let i = 0; i < 40; i++) { const x = m.cam.x + ((i * 33) % W), y0 = ((f * (3 + (i % 5)) + i * 97) % (GROUND + 100)) - 50; for (let j = 0; j < 6; j++) { ctx.fillStyle = `rgba(63,224,255,${0.5 - j * 0.07})`; ctx.fillText(String.fromCharCode(48 + ((i * 7 + j * 3 + (f >> 2)) % 42)), x, y0 - j * 17); } }
      ctx.restore();
    },
    drawFront(ctx, m, a, d, f, c) {
      const bx = c.dx + c.dir * 190, name = d.char.id + '.zip';
      if (f >= 112 && f < 226) trash(ctx, bx, f, f >= 176, f >= 176 && f < 190 ? 5 : 0);
      else if (f >= 226) trash(ctx, bx, f, false, 0);
      if (f < 104) {
        // prensa holográfica: as paredes fecham e o lutador encolhe (mais rápido na altura, para ficar "amassado")
        const k = f < 40 ? 0 : easeIn(clamp((f - 40) / 64, 0, 1)), kx = 1 - 0.78 * k, ky = 1 - 0.8 * k * (0.6 + 0.4 * k);
        drawShrunk(ctx, d, m.t, kx, ky);
        const hw = 80 * kx + 8, hh = 262 * ky + 10;
        ctx.strokeStyle = f >= 26 ? '#ff4455' : '#3fe0ff'; ctx.lineWidth = 4; ctx.strokeRect(d.x - hw, GROUND - hh, hw * 2, hh + 4);
        ctx.fillStyle = 'rgba(63,224,255,0.14)'; ctx.fillRect(d.x - hw, GROUND - hh, hw * 2, hh + 4);
        if (f >= 40) {
          const x = m.cam.x + W / 2 - 250, y = 126;
          ctx.fillStyle = 'rgba(4,10,24,0.9)'; ctx.fillRect(x, y, 500, 76); ctx.strokeStyle = '#3fe0ff'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 500, 76);
          ctx.font = `bold 17px ${FONT_M}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#7dffb0';
          ctx.fillText('$ zip -9 ' + name + ' /arena/' + d.char.id, x + 16, y + 30);
          ctx.fillStyle = '#12303a'; ctx.fillRect(x + 16, y + 44, 410, 16); ctx.fillStyle = '#ff4fd8'; ctx.fillRect(x + 16, y + 44, 410 * k, 16);
          ctx.fillStyle = '#fff'; ctx.fillText(Math.round(k * 100) + '%', x + 436, y + 59);
        }
      } else if (f < 176) {
        // o cursor pega o arquivo e arrasta em arco até a lixeira
        const k = smooth(clamp((f - 128) / 46, 0, 1)), ix = c.dx + (bx - c.dx) * k, iy = GROUND - Math.sin(k * Math.PI) * 150 - k * 108;
        zipIcon(ctx, ix, iy, name);
        const ck = smooth(clamp((f - 108) / 18, 0, 1));
        cursor(ctx, ix + 6 + (1 - ck) * 160 * c.dir, iy - 30 - (1 - ck) * 200, f >= 126);
      }
      if (f >= 186 && f < 226) {
        const dy = 140, cxm = m.cam.x + W / 2, k = smooth(clamp((f - 192) / 24, 0, 1));
        dialog(ctx, cxm, dy, f >= 220);
        cursor(ctx, cxm - 60 + k * 208, dy + 60 + k * 62, f >= 220);
      }
    },
    end(m, a, d, c) { d.hidden = true; d.x = c.dx; const bx = c.dx + c.dir * 190; leave(m, a, bx, (ctx, e, mm) => trash(ctx, e.x, mm.t, false, 0)); },
  },

  // ELBER — a manada parte para cima numa nuvem de briga; quando a poeira baixa, o perdedor virou capivara.
  elber: {
    name: 'VIROU CAPIVARA', desc: 'A manada resolve no braço... e ganha um novo integrante.', cmd: ['b', 'd', 'f', 'light'], dur: 280, hits: [], begin,
    step(m, a, d, f, c) {
      a.exprOverride = 'w'; d.exprOverride = 'h'; d.y *= 0.7; d.x = c.dx;
      a.x += (c.dx - c.dir * 300 - a.x) * 0.12;
      cpose(a, f < 44 ? S.whistle : f < 196 ? S.armsX : f % 24 < 12 ? S.winA : S.winB, 6);
      cpose(d, f % 30 < 15 ? S.dzA : S.dzB, 6);
      d.hidden = f >= 84;
      if (f === 4) Audio.sfx('rustle');
      if (f === 20 || f === 200) Audio.sfx('capy');
      if (f === 30) Audio.sfx('stampede');
      if (f === 60) m.fx.text(c.dx, GROUND - 300, '!?', '#fff', 60, { life: 30, vy: -0.4 });
      if (f >= 84 && f < 178) {
        if (f % 9 === 0) { Audio.sfx(['hit_h', 'bonk', 'boing', 'hit_l', 'clang'][(f / 9) % 5 | 0]); m.shake = Math.max(m.shake, 9); }
        if (f % 16 === 4) m.fx.text(c.dx + rand(-150, 150), GROUND - rand(120, 300), ['POF!', 'CRASH!', 'NHAC!', 'TUM!', 'AI!', 'CUÍÍ!'][(f / 16) % 6 | 0], ['#ffd23f', '#fff', '#ff8a3c'][(f / 16) % 3 | 0], 34, { life: 26, rot: rand(-0.3, 0.3) });
        if (f % 22 === 0) Audio.sfx('capy');
      }
      if (f === 196) { Audio.sfx('shield'); m.flashA = 0.4; m.fx.burst(c.dx, GROUND - 60, 18, ['#7dff8a', '#c8f7a0', '#4fae5a'], 12, { type: 'leaf', size: 9, front: true, life: 1.4 }); m.fx.text(c.dx, GROUND - 230, 'BEM-VINDO À MANADA!', '#b8ff9a', 36, { life: 80 }); }
    },
    drawBack(ctx, m, a, d, f) {
      const k = Math.min(1, f / 20, (280 - f) / 12), g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, `rgba(255,150,70,${0.45 * k})`); g.addColorStop(1, `rgba(120,200,90,${0.3 * k})`);
      ctx.fillStyle = g; ctx.fillRect(m.cam.x, 0, W, H);
    },
    drawFront(ctx, m, a, d, f, c) {
      // a manada chega pelos dois lados, briga dentro da nuvem e depois senta em volta
      const k = easeOut(clamp((f - 24) / 56, 0, 1));
      if (f < 84 || f >= 178) {
        const out = f >= 178 ? easeOut(clamp((f - 178) / 30, 0, 1)) : 0;
        for (let i = 0; i < 6; i++) {
          const side = i % 2 ? 1 : -1, tx = c.dx + side * (f < 84 ? 60 + i * 12 : 110 + i * 34 * out);
          drawCapy(ctx, f < 84 ? tx + side * (1 - k) * 760 : tx, GROUND + 4 + (i % 3) * 7, 0.9, m.t + i * 5, { dir: -side, run: f < 84, sit: f >= 208, angry: f < 84 });
        }
      }
      if (f >= 188) newCapy(ctx, c.dx, -c.dir, m.t);
      if (f >= 80 && f < 200) brawlCloud(ctx, c.dx, f, f < 96 ? (f - 80) / 16 : f < 178 ? 1 : Math.max(0, 1 - (f - 178) / 22), c.dir);
    },
    end(m, a, d, c) {
      d.hidden = true; d.y = 0; const dir = -c.dir;
      leave(m, a, c.dx, (ctx, e, mm) => { for (let i = 0; i < 6; i++) { const side = i % 2 ? 1 : -1; drawCapy(ctx, e.x + side * (110 + i * 34), GROUND + 4 + (i % 3) * 7, 0.9, mm.t + i * 5, { dir: -side, sit: true }); } newCapy(ctx, e.x, dir, mm.t); });
      m.ents[m.ents.length - 1].back = false;
    },
  },

  // PEIDIN — gira o perdedor como um fidget spinner até a velocidade máxima e sopra ele para a estratosfera.
  peidin: {
    name: 'SPINNER HUMANO', desc: 'Gira o adversário como um spinner e assopra para longe.', cmd: ['f', 'd', 'b', 'sp1'], dur: 286, hits: [], begin,
    step(m, a, d, f, c) {
      a.x += (c.dx - c.dir * 170 - a.x) * 0.2; a.exprOverride = f < 168 ? 'w' : 'n'; d.exprOverride = 'h';
      cpose(a, f < 40 ? S.palm : f < 150 ? (f % 10 < 5 ? S.throwW : S.throw) : f < 168 ? S.whistle : f < 200 ? S.both : S.winA, 5);
      cpose(d, S.flex, 8);
      if (f < 170) {
        d.x = c.dx; d.y = 110 * smooth(clamp((f - 20) / 30, 0, 1));
        c.spd = f < 40 ? 0 : Math.min(58, 3 + (f - 40) * 0.45); c.ang = (c.ang || 0) + c.spd; d.spinA = c.ang;
        if (f > 40 && f % Math.max(3, 14 - Math.floor((f - 40) / 10)) === 0) Audio.sfx('gear');
        if (f > 90 && f % 3 === 0) m.fx.add({ type: 'smoke', x: c.dx + rand(-90, 90), y: GROUND - 200 + rand(-90, 90), vx: rand(-4, 4), vy: rand(-2, 2), drag: 0.94, life: 22, size: rand(8, 16), color: '#d9dde6', alpha: 0.5 });
      } else {
        c.ang += 58; d.spinA = c.ang; d.x += c.dir * 13; d.y += 9 + (f - 170) * 1.1; d.hidden = f > 204;
      }
      if (f === 20) Audio.sfx('pop');
      if (f === 60) m.fx.text(c.dx, GROUND - 400, 'GIRA, GIRA!', '#ffd23f', 34, { life: 50 });
      if (f === 130) { m.fx.text(c.dx, GROUND - 400, 'VELOCIDADE MÁXIMA!', '#ff4fd8', 36, { life: 40 }); m.shake = 8; }
      if (f === 170) { Audio.sfx('puff'); Audio.sfx('whoosh_h'); m.shake = 16; m.flashA = 0.4; for (let i = 0; i < 18; i++) m.fx.add({ type: 'smoke', x: a.x + c.dir * rand(40, 200), y: GROUND - rand(120, 260), vx: c.dir * rand(4, 12), vy: rand(-4, -1), drag: 0.95, life: rand(30, 50), size: rand(16, 30), color: '#cfd4de', alpha: 0.7, front: true }); }
      if (f === 216) { Audio.sfx('energy_full'); m.fx.add({ type: 'flash', x: c.dx + c.dir * 330, y: 110, life: 26, size: 60, color: '#ffffff', pts: 4, front: true }); m.fx.text(c.dx, GROUND - 330, 'ATÉ NUNCA MAIS!', '#fff', 38, { life: 60 }); }
      if (f === 262) { Audio.sfx('land'); m.fx.dust(c.dx, GROUND, 0, 5); }
    },
    drawBack(ctx, m, a, d, f, c) { if (f > 40 && f < 205) drawSpinner(ctx, d.x, GROUND - d.y - 104, 92, (c.ang || 0) * 0.0174); },
    drawFront(ctx, m, a, d, f, c) {
      if (f >= 236) { const k = easeIn(clamp((f - 236) / 26, 0, 1)), y = -40 + (GROUND - 6 + 40) * k - (f > 262 ? Math.max(0, Math.sin(clamp((f - 262) / 16, 0, 1) * Math.PI)) * 26 : 0); shoe(ctx, c.dx, y, f < 262 ? f * 0.3 : 0.1); }
    },
    end(m, a, d, c) { d.hidden = true; d.y = 0; d.x = c.dx; d.spinA = 0; leave(m, a, c.dx, (ctx, e) => shoe(ctx, e.x, GROUND - 6, 0.1)); },
  },
};
