// Entrada unificada: dois layouts de teclado + até dois gamepads (Gamepad API) + mouse nos menus.
import { settings } from './settings.js';
import { W, H } from './config.js';

export const ACTIONS = ['left', 'right', 'up', 'down', 'light', 'heavy', 'sp1', 'sp2', 'super', 'block'];
export const ACTION_LABEL = {
  left: 'Esquerda', right: 'Direita', up: 'Pular', down: 'Agachar', light: 'Ataque leve',
  heavy: 'Ataque forte', sp1: 'Poder 1', sp2: 'Poder 2', super: 'Supremo', block: 'Defesa',
};
export const PAD_ACTIONS = ['light', 'heavy', 'sp1', 'sp2', 'super', 'block'];
export const PAD_BTN = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Select', 'Start', 'L3', 'R3', '↑', '↓', '←', '→', 'Home'];

const KB_MENU = {
  KeyW: ['kb1', 'up'], KeyS: ['kb1', 'down'], KeyA: ['kb1', 'left'], KeyD: ['kb1', 'right'],
  KeyJ: ['kb1', 'ok'], Space: ['kb1', 'ok'], KeyK: ['kb1', 'back'],
  ArrowUp: ['kb2', 'up'], ArrowDown: ['kb2', 'down'], ArrowLeft: ['kb2', 'left'], ArrowRight: ['kb2', 'right'],
  Enter: ['kb2', 'ok'], NumpadEnter: ['kb2', 'ok'], Numpad1: ['kb2', 'ok'], KeyB: ['kb2', 'ok'],
  Backspace: ['kb2', 'back'], Numpad2: ['kb2', 'back'], KeyN: ['kb2', 'back'],
  Numpad8: ['kb2', 'up'], Numpad5: ['kb2', 'down'], Numpad4: ['kb2', 'left'], Numpad6: ['kb2', 'right'],
  Escape: ['kb1', 'esc'], KeyP: ['kb1', 'pause'],
};

const down = new Set();
let capture = null;                       // {kind:'key'|'pad', cb}
const padMenuPrev = [{}, {}];
const padRepeat = [{}, {}];
const padBtnPrev = [[], []];

export const Input = {
  menu: [],            // eventos de menu deste frame: {dev, act}
  pads: [null, null],  // gamepads conectados (slots 0 e 1)
  padEvents: [],       // {type:'on'|'off', slot, name}
  mouse: { x: -1, y: -1, click: false, moved: false, down: false },
  anyPressed: false,
  _queue: [],
  _any: false,
  _click: false,
  _moved: false,

  init(canvas) {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^F\d+$/.test(e.code)) return;
      e.preventDefault();
      if (capture && capture.kind === 'key') {
        if (e.repeat) return;
        const c = capture; capture = null;
        c.cb(e.code === 'Escape' ? null : e.code);
        return;
      }
      if (!e.repeat) { down.add(e.code); this._any = true; }
      const m = KB_MENU[e.code];
      if (m && (!e.repeat || m[1] === 'up' || m[1] === 'down' || m[1] === 'left' || m[1] === 'right')) {
        this._queue.push({ dev: m[0], act: m[1] });
      }
    });
    window.addEventListener('keyup', (e) => down.delete(e.code));
    window.addEventListener('blur', () => down.clear());

    const pos = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((cx - r.left) / r.width) * W;
      this.mouse.y = ((cy - r.top) / r.height) * H;
    };
    canvas.addEventListener('mousemove', (e) => { pos(e.clientX, e.clientY); this._moved = true; });
    canvas.addEventListener('mousedown', (e) => { pos(e.clientX, e.clientY); this._click = true; this._any = true; canvas.focus(); });
    canvas.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      pos(t.clientX, t.clientY); this._click = true; this._any = true; this._moved = true;
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('gamepadconnected', (e) => this._padChange('on', e.gamepad));
    window.addEventListener('gamepaddisconnected', (e) => this._padChange('off', e.gamepad));
  },

  _padChange(type, gp) {
    if (!gp) return;
    const before = this.pads.map((p) => p && p.index);
    this._scanPads();
    let slot = this.pads.findIndex((p) => p && p.index === gp.index);
    if (type === 'off') slot = before.indexOf(gp.index);
    this.padEvents.push({ type, slot, name: (gp.id || 'Controle').replace(/\s*\(.*\)\s*/g, '').slice(0, 28) });
  },

  _scanPads() {
    let list = [];
    try { list = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter((g) => g && g.connected); } catch { /* API bloqueada */ }
    list.sort((a, b) => a.index - b.index);
    this.pads[0] = list[0] || null;
    this.pads[1] = list[1] || null;
  },

  // Chamado uma vez por frame de render.
  update() {
    this._scanPads();
    this.menu = this._queue; this._queue = [];
    this.anyPressed = this._any; this._any = false;
    this.mouse.click = this._click; this._click = false;
    this.mouse.moved = this._moved; this._moved = false;

    for (let s = 0; s < 2; s++) {
      const gp = this.pads[s];
      const prev = padMenuPrev[s], rep = padRepeat[s], bprev = padBtnPrev[s];
      if (!gp) { padMenuPrev[s] = {}; padBtnPrev[s] = []; continue; }
      const b = (i) => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      const cur = {
        up: b(12) || ay < -0.6, down: b(13) || ay > 0.6, left: b(14) || ax < -0.6, right: b(15) || ax > 0.6,
        ok: b(0), back: b(1), pause: b(9),
      };
      // Captura de remapeamento: primeiro botão recém-pressionado.
      if (capture && capture.kind === 'pad') {
        for (let i = 0; i < Math.min(gp.buttons.length, 12); i++) {
          if (b(i) && !bprev[i]) { const c = capture; capture = null; c.cb(i); break; }
        }
      } else {
        for (const act of Object.keys(cur)) {
          if (cur[act] && !prev[act]) {
            this.menu.push({ dev: 'pad' + s, act }); this.anyPressed = true; rep[act] = 22;
          } else if (cur[act] && (act === 'up' || act === 'down' || act === 'left' || act === 'right')) {
            if (--rep[act] <= 0) { this.menu.push({ dev: 'pad' + s, act }); rep[act] = 7; }
          }
        }
      }
      padMenuPrev[s] = cur;
      for (let i = 0; i < gp.buttons.length; i++) bprev[i] = b(i);
    }
  },

  // Estado "segurado" das 10 ações, combinando uma lista de dispositivos.
  state(devs, out = {}) {
    for (const a of ACTIONS) out[a] = false;
    for (const dev of devs) {
      if (!dev) continue;
      if (dev.startsWith('kb')) {
        const map = settings.keys[dev];
        if (!map) continue;
        for (const a of ACTIONS) {
          const codes = map[a];
          for (let i = 0; i < codes.length; i++) if (down.has(codes[i])) { out[a] = true; break; }
        }
      } else {
        const gp = this.pads[+dev.slice(3)];
        if (!gp) continue;
        const b = (i) => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
        const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
        if (b(14) || ax < -0.45) out.left = true;
        if (b(15) || ax > 0.45) out.right = true;
        if (b(12) || ay < -0.62) out.up = true;
        if (b(13) || ay > 0.55) out.down = true;
        for (const a of PAD_ACTIONS) if (b(settings.pad[a])) out[a] = true;
      }
    }
    return out;
  },

  // Dispositivos de um jogador (1 ou 2) conforme as configurações.
  devsFor(player) {
    const p = settings['p' + player];
    const list = [];
    if (p.kb && p.kb !== 'none') list.push(p.kb);
    if (p.pad !== null && p.pad !== -1 && p.pad !== undefined) list.push('pad' + p.pad);
    return list;
  },
  allDevs() { return ['kb1', 'kb2', 'pad0', 'pad1']; },

  capture(kind, cb) { capture = { kind, cb }; },
  cancelCapture() { capture = null; },
  get capturing() { return !!capture; },
  isDown(code) { return down.has(code); },

  keyLabel(code) {
    if (!code) return '—';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return 'Num' + code.slice(6);
    const m = {
      ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'Espaço', Enter: 'Enter',
      ShiftLeft: 'Shift E', ShiftRight: 'Shift D', ControlLeft: 'Ctrl E', ControlRight: 'Ctrl D',
      Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']',
      Backspace: 'Backspace', Tab: 'Tab', Minus: '-', Equal: '=',
    };
    return m[code] || code;
  },

  // Rótulo do comando de uma ação para um conjunto de dispositivos (usado nas telas de ajuda).
  actionLabel(action, devs) {
    const parts = [];
    for (const dev of devs) {
      if (dev.startsWith('kb')) {
        const c = settings.keys[dev] && settings.keys[dev][action];
        if (c && c.length) parts.push(this.keyLabel(c[0]));
      } else if (this.pads[+dev.slice(3)]) {
        if (PAD_ACTIONS.includes(action)) parts.push('🎮' + PAD_BTN[settings.pad[action]]);
        else parts.push('🎮' + { left: '←', right: '→', up: '↑', down: '↓' }[action]);
      }
    }
    return parts.join(' / ') || '—';
  },
};
