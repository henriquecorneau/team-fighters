// Tela de combate: monta a partida conforme o modo, desenha o HUD e cuida da pausa.
import { W, H, COL } from '../core/config.js';
import { Game } from '../core/game.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { settings, save } from '../core/settings.js';
import { CHAR } from '../characters/index.js';
import { STAGE } from '../stages/index.js';
import { Match } from '../combat/match.js';
import { HumanCtl, DummyCtl } from '../combat/entities.js';
import { Bot, LEVELS } from '../ai/bot.js';
import { drawHUD } from '../render/hud.js';
import { text, body, panel, Menu, pct } from '../render/ui.js';
import { drawMoves, drawBasics } from './common.js';
import { clamp } from '../core/util.js';

const DUMMY = [['stand', 'Parado'], ['crouch', 'Agachado'], ['jump', 'Pulando'], ['block', 'Defende tudo'], ['bot', 'Luta (bot normal)']];
const TLEVEL = ['easy', 'normal', 'hard'];

export default {
  enter() {
    const s = Game.session, mode = s.mode, all = Input.allDevs();
    let chars = s.chars.map((id) => CHAR[id]), stage = STAGE[s.stage] || STAGE.labreal, ctls, labels;
    this.dummy = 0;
    if (mode === 'versus') {
      this.devs = [Input.devsFor(1), Input.devsFor(2)];
      ctls = [new HumanCtl(this.devs[0]), new HumanCtl(this.devs[1])]; labels = ['JOGADOR 1', 'JOGADOR 2'];
    } else {
      this.devs = [['kb1', 'pad0'], ['kb1', 'pad0']];
      if (mode === 'tournament') {
        const t = s.tourney, opp = CHAR[t.order[t.idx]], last = t.idx === t.order.length - 1;
        chars = [CHAR[t.player], opp]; stage = last ? STAGE.labreal : STAGE[opp.stage];
        const lv = TLEVEL[clamp(TLEVEL.indexOf(t.level) + (t.idx >= 2 ? 1 : 0), 0, 2)];
        ctls = [new HumanCtl(all), new Bot(lv)]; labels = ['VOCÊ', 'BOT · ' + LEVELS[lv].label];
      } else if (mode === 'training') {
        ctls = [new HumanCtl(all), new DummyCtl('stand')]; labels = ['VOCÊ', 'BONECO'];
      } else {
        ctls = [new HumanCtl(all), new Bot(s.level)]; labels = ['VOCÊ', 'BOT · ' + LEVELS[s.level].label];
      }
    }
    this.mode = mode; this.labels = labels; this.chars = chars;
    stage.build();
    this.m = new Match({ chars, ctls, stage, rounds: settings.rounds, time: settings.time, mode });
    this.paused = false; this.view = 'menu'; this.overT = 0;
    this.buildMenu();
    Audio.playMusic(stage.music);
  },
  exit() { if (this.m) this.m.stage.free(); },

  buildMenu() {
    const m = this.m, vol = (k) => ({
      label: k === 'music' ? 'Música' : 'Efeitos sonoros', value: () => pct(settings[k]),
      onLeft: () => { settings[k] = clamp(Math.round(settings[k] * 10 - 1) / 10, 0, 1); save(); Audio.applyVolumes(); },
      onRight: () => { settings[k] = clamp(Math.round(settings[k] * 10 + 1) / 10, 0, 1); save(); Audio.applyVolumes(); if (k === 'sfx') Audio.sfx('hit_l'); },
    });
    const items = [
      { label: 'CONTINUAR', onOk: () => this.resume() },
      { label: 'REINICIAR LUTA', onOk: () => Game.go('fight') },
      { label: 'COMANDOS', onOk: () => { this.view = 'moves'; } },
    ];
    if (this.mode === 'training') {
      const setDummy = (d) => { this.dummy = (this.dummy + d + DUMMY.length) % DUMMY.length; const k = DUMMY[this.dummy][0]; m.ctls[1] = k === 'bot' ? new Bot('normal') : new DummyCtl(k); };
      items.push(
        { label: 'Boneco', value: () => DUMMY[this.dummy][1], onLeft: () => setDummy(-1), onRight: () => setDummy(1) },
        { label: 'Energia infinita', value: () => (m.infinite[0] ? 'LIGADA' : 'DESLIGADA'), onRight: () => { m.infinite[0] = !m.infinite[0]; }, onLeft: () => { m.infinite[0] = !m.infinite[0]; } },
        { label: 'Mostrar hitboxes', value: () => (m.showBoxes ? 'SIM' : 'NÃO'), onRight: () => { m.showBoxes = !m.showBoxes; }, onLeft: () => { m.showBoxes = !m.showBoxes; } },
        { label: 'REINICIAR POSIÇÕES', onOk: () => { m.startRound(); this.resume(); } },
      );
    }
    items.push(
      { header: true, label: 'CONFIGURAÇÕES' }, vol('music'), vol('sfx'),
      { label: 'Tela cheia', value: () => (Game.fullscreen ? 'SIM' : 'NÃO'), onOk: () => Game.toggleFullscreen() },
      { header: true, label: 'SAIR' },
      { label: 'VOLTAR À SELEÇÃO', onOk: () => Game.go(this.mode === 'tournament' ? 'tourney' : 'select', { mode: this.mode }) },
      { label: 'MENU PRINCIPAL', onOk: () => Game.go('title', { menu: true }) },
    );
    this.menu = new Menu(items, { onBack: () => this.resume() });
  },

  pause() { if (this.m.phase === 'over') return; this.paused = true; this.view = 'menu'; this.menu.sel = 0; Audio.sfx('ui_back'); if (Audio.ready) Audio.duck.gain.setTargetAtTime(0.35, Audio.ctx.currentTime, 0.05); },
  resume() { this.paused = false; if (Audio.ready) Audio.duck.gain.setTargetAtTime(1, Audio.ctx.currentTime, 0.05); },
  onPad(ev) { if (ev.type === 'off' && !this.paused) this.pause(); },

  update() {
    const m = this.m;
    if (this.paused) {
      if (this.view === 'moves') { if (Input.menu.some((e) => ['ok', 'back', 'esc', 'pause'].includes(e.act)) || Input.mouse.click) { this.view = 'menu'; Audio.sfx('ui_back'); } }
      else {
        if (Input.menu.some((e) => e.act === 'pause')) { this.resume(); return; }
        this.menu.update();
      }
      return;
    }
    if (Input.menu.some((e) => e.act === 'esc' || e.act === 'pause')) { this.pause(); return; }
    m.step();
    if (m.phase === 'over' && ++this.overT > 10 && !Game.trans) {
      Game.go('victory', { result: m.result, chars: this.chars.map((c) => c.id), mode: this.mode, labels: this.labels, stage: m.stage.id });
    }
  },

  draw(ctx) {
    this.m.draw(ctx);
    drawHUD(ctx, this.m, this.labels);
    if (!this.paused) return;
    ctx.fillStyle = 'rgba(4,6,16,0.78)'; ctx.fillRect(0, 0, W, H);
    if (this.view === 'moves') {
      text(ctx, 'COMANDOS', W / 2, 50, 36, '#fff', { align: 'center' });
      for (let i = 0; i < 2; i++) {
        if (i === 1 && this.mode !== 'versus') break;
        const c = this.chars[i], x = this.mode === 'versus' ? (i ? 660 : 60) : 360, w = 560;
        panel(ctx, x, 84, w, 590, { accent: c.color });
        text(ctx, c.name.toUpperCase(), x + 26, 116, 30, '#fff');
        body(ctx, this.labels[i] + ' · ' + c.style, x + w - 20, 116, 14, c.color, { align: 'right', weight: 800 });
        const y = drawBasics(ctx, this.devs[i], x + 26, 154, w - 52);
        drawMoves(ctx, c, this.devs[i], x + 20, y + 4, w - 40, c.color, false, true);
        body(ctx, 'Custos de energia: Poder 1 = 20 · Poder 2 = 30 · Supremo = barra cheia. Golpes cancelam em poderes ao acertar.', x + w / 2, 660, 11, '#9fb0d8', { align: 'center', maxW: w - 40 });
      }
      body(ctx, 'Qualquer botão para voltar', W / 2, 698, 15, '#c9d1ea', { align: 'center' });
      return;
    }
    const n = this.menu.items.length, ih = n > 10 ? 40 : 46, ph = 96 + n * ih;
    panel(ctx, W / 2 - 270, (H - ph) / 2, 540, ph, { accent: COL.red });
    text(ctx, 'PAUSA', W / 2, (H - ph) / 2 + 40, 34, '#fff', { align: 'center' });
    this.menu.draw(ctx, W / 2 - 220, (H - ph) / 2 + 72, 440, { ih, size: n > 10 ? 19 : 21 });
  },
};
