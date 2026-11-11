// Configuração de controles: dispositivo de cada jogador, remapeamento de teclas e botões, status dos gamepads.
import { W, COL } from '../core/config.js';
import { Game } from '../core/game.js';
import { Input, ACTIONS, ACTION_LABEL, PAD_ACTIONS, PAD_BTN } from '../core/input.js';
import { settings, save, resetControls, setKb2Layout } from '../core/settings.js';
import { text, body, panel, menuBg, title, hint, Menu } from '../render/ui.js';
import { TAU } from '../core/util.js';

const KB_OPTS = ['kb1', 'kb2', 'none'];
const KB_NAME = { kb1: 'Teclado A (WASD)', kb2: 'Teclado B (Setas)', none: 'Nenhum' };
const PAD_OPTS = [0, 1, -1];
const cyc = (arr, cur, d) => arr[(arr.indexOf(cur) + d + arr.length) % arr.length];

export default {
  enter() { this.t = 0; this.sub = null; this.wait = null; this.main = this.buildMain(); },

  buildMain() {
    const padName = (i) => (i < 0 || i === null || i === undefined ? 'Nenhum' : `Controle ${i + 1}` + (Input.pads[i] ? ' ✔' : ' (desconectado)'));
    const player = (n) => {
      const p = settings['p' + n];
      return [
        { header: true, label: 'JOGADOR ' + n },
        { label: 'Teclado', value: () => KB_NAME[p.kb] || 'Nenhum', onLeft: () => { p.kb = cyc(KB_OPTS, p.kb, -1); save(); }, onRight: () => { p.kb = cyc(KB_OPTS, p.kb, 1); save(); } },
        { label: 'Gamepad', value: () => padName(p.pad), onLeft: () => { p.pad = cyc(PAD_OPTS, p.pad, -1); save(); }, onRight: () => { p.pad = cyc(PAD_OPTS, p.pad, 1); save(); } },
      ];
    };
    const back = () => Game.go('settings');
    return new Menu([
      ...player(1), ...player(2),
      { header: true, label: 'MAPEAMENTO' },
      { label: 'Remapear Teclado A…', onOk: () => this.openRemap('kb1') },
      { label: 'Remapear Teclado B…', onOk: () => this.openRemap('kb2') },
      { label: 'Layout do Teclado B', value: () => (settings.kb2layout === 'compact' ? 'Compacto (sem NumPad)' : 'NumPad'), onLeft: () => setKb2Layout(settings.kb2layout === 'compact' ? 'numpad' : 'compact'), onRight: () => setKb2Layout(settings.kb2layout === 'compact' ? 'numpad' : 'compact') },
      { label: 'Remapear gamepad…', onOk: () => this.openRemap('pad') },
      { label: 'RESTAURAR PADRÕES', onOk: () => { resetControls(); this.main = this.buildMain(); Game.toast('Controles restaurados'); } },
      { label: 'VOLTAR', onOk: back },
    ], { onBack: back });
  },

  openRemap(target) {
    const isPad = target === 'pad', acts = isPad ? PAD_ACTIONS : ACTIONS;
    const items = acts.map((a) => ({
      label: ACTION_LABEL[a],
      value: () => (this.wait === a ? (isPad ? 'APERTE UM BOTÃO…' : 'APERTE UMA TECLA…') : isPad ? PAD_BTN[settings.pad[a]] : (settings.keys[target][a].map((c) => Input.keyLabel(c)).join(' / ') || '—')),
      onOk: () => {
        this.wait = a;
        if (isPad) {
          Input.capture('pad', (btn) => {
            this.wait = null;
            const other = PAD_ACTIONS.find((o) => o !== a && settings.pad[o] === btn);
            if (other) settings.pad[other] = settings.pad[a];
            settings.pad[a] = btn; save();
          });
        } else {
          Input.capture('key', (code) => {
            this.wait = null;
            if (!code) return;
            for (const kb of ['kb1', 'kb2']) for (const o of ACTIONS) {
              const arr = settings.keys[kb][o], i = arr.indexOf(code);
              if (i >= 0 && !(kb === target && o === a)) { arr.splice(i, 1); Game.toast(`${Input.keyLabel(code)} saiu de "${ACTION_LABEL[o]}" (${KB_NAME[kb]})`, COL.yellow); }
            }
            settings.keys[target][a] = [code]; save();
          });
        }
      },
    }));
    items.push({ label: 'CONCLUIR', onOk: () => { this.sub = null; } });
    this.sub = { target, menu: new Menu(items, { onBack: () => { this.sub = null; } }) };
  },

  update() {
    this.t++;
    if (Input.capturing) {
      // enquanto espera a tecla/botão, o outro tipo de dispositivo pode cancelar
      if (this.wait && Input.menu.some((e) => e.act === 'back' || e.act === 'esc')) { Input.cancelCapture(); this.wait = null; }
      return;
    }
    (this.sub ? this.sub.menu : this.main).update();
  },

  draw(ctx) {
    menuBg(ctx, this.t, '#8f3a1a');
    title(ctx, 'CONTROLES', this.sub ? 'Selecione a ação e aperte a nova tecla/botão (Esc cancela).' : 'Cada jogador pode usar um teclado e um gamepad ao mesmo tempo.');
    panel(ctx, 30, 104, 590, 570, {});
    if (this.sub) {
      text(ctx, this.sub.target === 'pad' ? 'GAMEPAD' : KB_NAME[this.sub.target].toUpperCase(), 60, 134, 22, COL.yellow);
      this.sub.menu.draw(ctx, 50, 154, 550, { ih: this.sub.target === 'pad' ? 56 : 46, size: 20 });
    } else this.main.draw(ctx, 50, 110, 550, { ih: 45, size: 19 });

    // painel de referência: mapeamento atual + gamepads conectados
    panel(ctx, 640, 104, 610, 570, {});
    text(ctx, 'MAPEAMENTO ATUAL', 664, 132, 18, COL.yellow);
    const cols = [664, 850, 990, 1130];
    ['AÇÃO', 'TECLADO A', 'TECLADO B', 'GAMEPAD'].forEach((h, i) => body(ctx, h, cols[i], 160, 12, '#9fb0d8', { weight: 800 }));
    ACTIONS.forEach((a, r) => {
      const y = 184 + r * 26;
      if (r % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(654, y - 13, 582, 26); }
      body(ctx, ACTION_LABEL[a], cols[0], y, 14, '#fff');
      body(ctx, settings.keys.kb1[a].map((c) => Input.keyLabel(c)).join(' / ') || '—', cols[1], y, 14, '#dfe4f2', { maxW: 130 });
      body(ctx, settings.keys.kb2[a].map((c) => Input.keyLabel(c)).join(' / ') || '—', cols[2], y, 14, '#dfe4f2', { maxW: 130 });
      body(ctx, PAD_ACTIONS.includes(a) ? PAD_BTN[settings.pad[a]] : 'Direcional / analógico', cols[3], y, 14, '#dfe4f2', { maxW: 110 });
    });
    text(ctx, 'GAMEPADS DETECTADOS', 664, 470, 18, COL.yellow);
    for (let s = 0; s < 2; s++) {
      const gp = Input.pads[s], y = 500 + s * 78;
      panel(ctx, 660, y, 570, 66, { r: 8, fill: 'rgba(255,255,255,0.05)', border: gp ? 'rgba(63,224,255,0.7)' : 'rgba(255,255,255,0.1)' });
      body(ctx, `Controle ${s + 1}`, 680, y + 20, 15, gp ? COL.cyan : '#7c86a4', { weight: 800 });
      body(ctx, gp ? (gp.id || 'Gamepad').slice(0, 52) : 'Não conectado — ligue por USB/Bluetooth e aperte um botão', 680, y + 44, 12.5, gp ? '#dfe4f2' : '#7c86a4', { maxW: 330 });
      if (gp) {
        for (let b = 0; b < Math.min(16, gp.buttons.length); b++) {
          const on = gp.buttons[b].pressed, bx = 1030 + (b % 8) * 24, by = y + 20 + Math.floor(b / 8) * 26;
          ctx.fillStyle = on ? COL.yellow : 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.arc(bx, by, 9, 0, TAU); ctx.fill();
          body(ctx, PAD_BTN[b], bx, by + 0.5, 7.5, on ? '#0b1020' : '#b9c2dc', { align: 'center', weight: 800 });
        }
      }
    }
    hint(ctx, '↑ ↓: navegar   ·   ← →: alterar   ·   Enter: confirmar   ·   Esc: voltar');
  },
};
