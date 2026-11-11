// Créditos.
import { W, H, COL } from '../core/config.js';
import { Game } from '../core/game.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { ROSTER } from '../characters/index.js';
import { text, body, menuBg, logo, hint } from '../render/ui.js';
import { Show } from './common.js';

const LINES = [
  ['h', 'ELENCO'],
  ...['Baiano — Zune Drones', 'Rinaldo — O Faz-Tudo', 'Tibas — Engenharia Mecânica', 'Ramas — Computadores & IA', 'Elber — O Poder das Capivaras', 'Peidin — Fumaça & Fidget'].map((s) => ['p', s]),
  ['h', 'PARTICIPAÇÕES ESPECIAIS'],
  ['p', 'A manada de capivaras do campus'], ['p', 'O esquadrão de drones da Zune'], ['p', 'O robô humanoide do canto do laboratório'],
  ['h', 'ARTE, ANIMAÇÃO E CENÁRIOS'],
  ['p', 'Personagens vetoriais com esqueleto animado em tempo real (Canvas 2D)'], ['p', 'Seis arenas originais — uma delas recriada a partir da foto do laboratório'],
  ['h', 'MÚSICA E EFEITOS SONOROS'],
  ['p', 'Trilhas e efeitos originais, sintetizados em tempo real com a Web Audio API'],
  ['h', 'TECNOLOGIA'],
  ['p', 'HTML5 · JavaScript (ES Modules) · Canvas · Web Audio API · Gamepad API'], ['p', 'Sem dependências externas — roda em qualquer hospedagem estática'],
  ['h', 'AGRADECIMENTO'],
  ['p', 'A toda a equipe do laboratório TEAM. Bons combates!'],
];

export default {
  enter() { this.t = 0; this.shows = ROSTER.map((c, i) => new Show(c, i < 3 ? 1 : -1, 'win')); },
  update() {
    this.t++;
    for (const s of this.shows) s.update(false);
    if (this.t > 20 && (Input.menu.some((e) => ['ok', 'back', 'esc'].includes(e.act)) || Input.mouse.click)) { Audio.sfx('ui_back'); Game.go('title', { menu: true, sel: 5 }); }
  },
  draw(ctx) {
    menuBg(ctx, this.t, '#1a6a8f');
    this.shows.forEach((s, i) => s.draw(ctx, i < 3 ? 70 + i * 100 : W - 70 - (i - 3) * 100, 660, 0.7, this.t));
    ctx.save();
    ctx.beginPath(); ctx.rect(330, 0, 620, H - 40); ctx.clip();
    const total = LINES.length * 34 + 420;
    let y = H - ((this.t * 1.1) % (total + H));
    logo(ctx, W / 2 - 14, y + 90, 0.62, this.t); y += 230;
    for (const [k, s] of LINES) {
      if (k === 'h') { y += 26; text(ctx, s, W / 2, y, 21, COL.yellow, { align: 'center', stroke: '#0b1020', sw: 5 }); y += 34; }
      else { body(ctx, s, W / 2, y, 16, '#fff', { align: 'center', maxW: 600 }); y += 27; }
    }
    ctx.restore();
    hint(ctx, 'Enter / Esc: voltar ao menu');
  },
};
