// Configurações gerais: volumes independentes, tela cheia e regras da partida.
import { W, COL } from '../core/config.js';
import { Game } from '../core/game.js';
import { Audio } from '../core/audio.js';
import { settings, save } from '../core/settings.js';
import { LEVELS } from '../ai/bot.js';
import { buildPortraits } from '../characters/index.js';
import { panel, menuBg, title, hint, Menu, pct } from '../render/ui.js';
import { clamp } from '../core/util.js';

const TIMES = [60, 99, 0];
const LV = Object.keys(LEVELS);

export default {
  enter() {
    this.t = 0;
    const vol = (k, label) => ({
      label, value: () => pct(settings[k]),
      onLeft: () => { settings[k] = clamp(Math.round(settings[k] * 10 - 1) / 10, 0, 1); save(); Audio.applyVolumes(); if (k === 'sfx') Audio.sfx('hit_l'); },
      onRight: () => { settings[k] = clamp(Math.round(settings[k] * 10 + 1) / 10, 0, 1); save(); Audio.applyVolumes(); if (k === 'sfx') Audio.sfx('hit_l'); },
    });
    const cyc = (arr, cur, d) => arr[(arr.indexOf(cur) + d + arr.length) % arr.length];
    const back = () => Game.go('title', { menu: true, sel: 4 });
    const style = () => { settings.pixel = !settings.pixel; save(); buildPortraits(); };
    this.menu = new Menu([
      { header: true, label: 'ÁUDIO' },
      vol('music', 'Volume da música'), vol('sfx', 'Volume dos efeitos'),
      { header: true, label: 'VÍDEO' },
      { label: 'Tela cheia', value: () => (Game.fullscreen ? 'LIGADA' : 'DESLIGADA'), onOk: () => Game.toggleFullscreen() },
      { label: 'Estilo dos personagens', value: () => (settings.pixel ? 'PIXEL ART' : 'VETORIAL'), onLeft: () => style(), onRight: () => style() },
      { header: true, label: 'PARTIDA' },
      { label: 'Rounds para vencer', value: () => String(settings.rounds), onLeft: () => { settings.rounds = clamp(settings.rounds - 1, 1, 3); save(); }, onRight: () => { settings.rounds = clamp(settings.rounds + 1, 1, 3); save(); } },
      { label: 'Tempo do round', value: () => (settings.time ? settings.time + ' s' : 'Infinito'), onLeft: () => { settings.time = cyc(TIMES, settings.time, -1); save(); }, onRight: () => { settings.time = cyc(TIMES, settings.time, 1); save(); } },
      { label: 'Dificuldade padrão do bot', value: () => LEVELS[settings.difficulty].label, onLeft: () => { settings.difficulty = cyc(LV, settings.difficulty, -1); save(); }, onRight: () => { settings.difficulty = cyc(LV, settings.difficulty, 1); save(); } },
      { header: true, label: 'CONTROLES' },
      { label: 'CONFIGURAR CONTROLES…', onOk: () => Game.go('controls') },
      { label: 'VOLTAR', onOk: back },
    ], { onBack: back });
  },
  update() { this.t++; this.menu.update(); },
  draw(ctx) {
    menuBg(ctx, this.t, '#3a4a9a');
    title(ctx, 'CONFIGURAÇÕES', 'As opções ficam salvas neste navegador.');
    panel(ctx, W / 2 - 360, 104, 720, 560, {});
    this.menu.draw(ctx, W / 2 - 320, 114, 640, { ih: 43, size: 19, color: COL.red });
    hint(ctx, '↑ ↓: navegar   ·   ← →: ajustar   ·   Enter: confirmar   ·   Esc: voltar   ·   F: tela cheia a qualquer momento');
  },
};
