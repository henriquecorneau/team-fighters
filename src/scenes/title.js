// Tela inicial: animação de abertura do logo + menu principal.
import { W, H, COL } from '../core/config.js';
import { Game } from '../core/game.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { ROSTER } from '../characters/index.js';
import { text, body, logo, menuBg, Menu, hint } from '../render/ui.js';
import { Show } from './common.js';
import { FX } from '../render/fx.js';
import { easeOutBack, clamp, shuffle } from '../core/util.js';

export default {
  enter(p) {
    this.t = 0; this.state = p.menu ? 'menu' : 'press';
    this.fx = new FX();
    this.order = shuffle(ROSTER.slice()); this.pair = 0;
    this.newPair();
    const go = (mode) => () => { Game.session.mode = mode; Game.go('select', { mode }); };
    this.menu = new Menu([
      { label: 'JOGAR CONTRA BOT', onOk: go('bot') },
      { label: 'JOGAR COM 2 JOGADORES', onOk: go('versus') },
      { label: 'TREINAMENTO', onOk: go('training') },
      { label: 'TORNEIO', onOk: go('tournament') },
      { label: 'CONFIGURAÇÕES', onOk: () => Game.go('settings', { back: 'title' }) },
      { label: 'CRÉDITOS', onOk: () => Game.go('credits') },
    ]);
    if (p.sel !== undefined) this.menu.sel = p.sel;
    Audio.playMusic('menu');
  },
  newPair() {
    const n = this.order.length, a = this.order[this.pair % n], b = this.order[(this.pair + 1) % n];
    this.pair += 2;
    this.sa = new Show(a, 1); this.sb = new Show(b, -1); this.sb.t += 70;
    this.swapT = 0;
  },
  update() {
    this.t++; this.swapT++;
    this.sa.update(this.swapT > 40); this.sb.update(this.swapT > 40);
    this.fx.update();
    if (this.swapT > 520) this.newPair();
    if (this.t === 22 || this.t === 40) { Audio.sfx('hit_h'); this.fx.burst(W / 2 + (this.t === 22 ? -60 : 80), this.t === 22 ? 190 : 270, 22, [COL.yellow, '#fff', COL.red], 16, { front: true }); }
    if (this.state === 'press') {
      if (this.t > 30 && (Input.anyPressed || Input.menu.length)) {
        Audio.init(); Audio.sfx('ui_start'); Audio.playMusic('menu');
        this.state = 'menu'; this.mt = 0;
      }
    } else {
      this.mt = (this.mt || 0) + 1;
      if (this.mt > 8) this.menu.update();
    }
  },
  draw(ctx) {
    const t = this.t;
    menuBg(ctx, t);
    const inMenu = this.state === 'menu', k = inMenu ? clamp((this.mt || 0) / 18, 0, 1) : 0;
    // lutadores em exibição
    const a = Math.min(1, this.swapT / 20, (520 - this.swapT) / 20);
    ctx.save(); ctx.globalAlpha = Math.max(0, a);
    const lx = 250 - k * 60, rx = W - 250 + k * 130;
    this.sa.draw(ctx, lx, 640, 1.4, t);
    if (!inMenu || k < 1) { ctx.globalAlpha = Math.max(0, a * (1 - k)); this.sb.draw(ctx, rx, 640, 1.4, t); }
    ctx.restore();
    if (a > 0.5) {
      text(ctx, this.sa.f.char.name.toUpperCase(), lx, 664, 26, '#fff', { align: 'center', stroke: '#0b1020', sw: 6, alpha: a });
      if (!inMenu) text(ctx, this.sb.f.char.name.toUpperCase(), rx, 664, 26, '#fff', { align: 'center', stroke: '#0b1020', sw: 6, alpha: a });
    }
    // logo: "TEAM" cai e "FIGHTERS" entra
    const drop = easeOutBack(clamp(t / 22, 0, 1));
    const ly = (inMenu ? 150 - k * 6 : 230) , ls = inMenu ? 1 - k * 0.3 : 1;
    ctx.save();
    const shake = t >= 22 && t < 32 ? (32 - t) * 0.8 : 0;
    ctx.translate((Math.random() - 0.5) * shake, -360 * (1 - drop) + (Math.random() - 0.5) * shake);
    logo(ctx, (inMenu ? W / 2 + k * 190 : W / 2) - 20, ly, ls, t);
    ctx.restore();
    if (!inMenu) {
      text(ctx, 'O COMBATE DOS PESQUISADORES', W / 2, 352, 26, '#fff', { align: 'center', stroke: '#0b1020', sw: 6, alpha: clamp((t - 44) / 20, 0, 1) });
      if (t > 60 && t % 60 < 40) text(ctx, 'PRESSIONE ENTER, ESPAÇO OU START', W / 2, 460, 24, COL.yellow, { align: 'center', stroke: '#0b1020', sw: 6 });
      body(ctx, 'Jogo de luta 2D para navegador  ·  teclado e gamepads  ·  1 ou 2 jogadores', W / 2, 508, 15, '#c9d1ea', { align: 'center' });
    } else {
      ctx.save(); ctx.globalAlpha = k; ctx.translate((1 - k) * 200, 0);
      this.menu.draw(ctx, 640, 262, 520, { ih: 62, size: 27 });
      ctx.restore();
      hint(ctx, '↑ ↓ ou W S: navegar   ·   Enter / Espaço / J: confirmar   ·   F: tela cheia   ·   também funciona com mouse e gamepad');
    }
    this.fx.draw(ctx, true); this.fx.draw(ctx, false);
    body(ctx, 'v1.0', W - 16, 18, 12, 'rgba(255,255,255,0.5)', { align: 'right' });
  },
};
