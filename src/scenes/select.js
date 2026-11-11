// Seleção de personagens — serve aos quatro modos (bot, 2 jogadores, treino e torneio).
import { W, H, COL } from '../core/config.js';
import { Game } from '../core/game.js';
import { Input } from '../core/input.js';
import { Audio } from '../core/audio.js';
import { settings, save } from '../core/settings.js';
import { ROSTER } from '../characters/index.js';
import { LEVELS } from '../ai/bot.js';
import { text, body, wrap, panel, menuBg, title, hint, Menu } from '../render/ui.js';
import { Show, drawMoves } from './common.js';
import { randi, shuffle } from '../core/util.js';

const CARD = { w: 128, h: 148, gap: 14, y: 506 };
const RND = ROSTER.length, NC = ROSTER.length + 1;        // índice do cartão "aleatório" e total de cartões
const cardX = (i) => (W - (NC * CARD.w + (NC - 1) * CARD.gap)) / 2 + i * (CARD.w + CARD.gap);
const TITLES = { bot: 'JOGADOR × BOT', versus: '2 JOGADORES', training: 'TREINAMENTO', tournament: 'TORNEIO' };

export default {
  enter(p) {
    this.mode = p.mode || Game.session.mode; Game.session.mode = this.mode;
    this.t = 0; this.cur = [0, 1]; this.pick = [null, null]; this.doneT = 0;
    this.phase = this.mode === 'versus' ? 'both' : 'p1';
    const all = Input.allDevs();
    this.devs = this.mode === 'versus' ? [Input.devsFor(1), Input.devsFor(2)] : [all, all];
    this.helpDevs = this.mode === 'versus' ? this.devs : [['kb1', 'pad0'], ['kb1', 'pad0']];
    this.shows = ROSTER.map((c) => [new Show(c, 1), new Show(c, -1)]);
    this.p2tag = { bot: 'BOT', versus: 'J2', training: 'BONECO', tournament: '' }[this.mode];
    const lv = Object.keys(LEVELS);
    this.diff = new Menu(lv.map((k) => ({ label: LEVELS[k].label, onOk: () => { settings.difficulty = k; save(); this.finish(k); } })), { onBack: () => { this.phase = this.mode === 'tournament' ? 'p1' : 'p2'; this.pick[this.mode === 'tournament' ? 0 : 1] = null; } });
    this.diff.sel = Math.max(0, lv.indexOf(settings.difficulty));
    Audio.playMusic('select');
  },

  finish(level) {
    const s = Game.session;
    s.chars = [this.pick[0], this.pick[1] || this.pick[0]]; s.level = level || settings.difficulty;
    this.phase = 'done'; this.doneT = 30;
    if (this.mode === 'tournament') {
      const order = shuffle(ROSTER.filter((c) => c.id !== this.pick[0]).map((c) => c.id)).slice(0, 4);
      s.tourney = { player: this.pick[0], order, idx: 0, level: s.level, frames: 0, perfects: 0, maxCombo: 0 };
    }
  },

  confirm(pl) {
    let i = this.cur[pl];
    if (i === RND) { i = randi(0, RND - 1); this.cur[pl] = i; }
    this.pick[pl] = ROSTER[i].id;
    this.shows[i][pl].set('win');
    Audio.sfx('pick');
    if (this.phase === 'both') { if (this.pick[0] && this.pick[1]) this.finish(); return; }
    if (this.phase === 'p1') {
      if (this.mode === 'tournament') this.phase = 'diff';
      else { this.phase = 'p2'; if (this.cur[1] === this.cur[0]) this.cur[1] = (this.cur[0] + 1) % RND; }
    } else if (this.phase === 'p2') {
      if (this.mode === 'bot') this.phase = 'diff'; else this.finish();
    }
  },

  back(pl) {
    Audio.sfx('ui_back');
    if (this.phase === 'both' && pl !== undefined && this.pick[pl]) { this.shows[this.cur[pl]][pl].set('idle'); this.pick[pl] = null; return; }
    if (this.phase === 'p2') { this.phase = 'p1'; this.shows[this.cur[0]][0].set('idle'); this.pick[0] = null; return; }
    Game.go('title', { menu: true, sel: ['bot', 'versus', 'training', 'tournament'].indexOf(this.mode) });
  },

  update() {
    this.t++;
    for (let pl = 0; pl < 2; pl++) { const i = this.cur[pl]; if (i < RND) this.shows[i][pl].update(false); }
    if (this.phase === 'done') { if (--this.doneT <= 0) Game.go(this.mode === 'tournament' ? 'tourney' : 'stage'); return; }
    if (this.phase === 'diff') { this.diff.update(); return; }
    const active = this.phase === 'both' ? [0, 1] : [this.phase === 'p1' ? 0 : 1];
    for (const e of Input.menu) {
      if (this.phase !== 'both' && this.phase !== 'p1' && this.phase !== 'p2') break;
      if (e.act === 'esc') { this.back(); return; }
      const now = this.phase === 'both' ? [0, 1] : [this.phase === 'p1' ? 0 : 1];
      const pl = now.find((i) => this.devs[i].includes(e.dev));
      if (pl === undefined) continue;
      if (this.pick[pl]) { if (e.act === 'back') this.back(pl); continue; }
      if (e.act === 'left' || e.act === 'right') { this.cur[pl] = (this.cur[pl] + (e.act === 'left' ? NC - 1 : 1)) % NC; Audio.sfx('ui_move'); }
      else if (e.act === 'ok') this.confirm(pl);
      else if (e.act === 'back') { this.back(pl); return; }
    }
    // mouse: escolhe para quem ainda não confirmou
    const m = Input.mouse, pl = active.find((i) => !this.pick[i]);
    if (pl !== undefined && (this.phase === 'both' || this.phase === 'p1' || this.phase === 'p2')) {
      for (let i = 0; i < NC; i++) {
        const x = cardX(i);
        if (m.x >= x && m.x <= x + CARD.w && m.y >= CARD.y && m.y <= CARD.y + CARD.h) {
          if (m.moved && this.cur[pl] !== i) { this.cur[pl] = i; Audio.sfx('ui_move'); }
          if (m.click) { this.cur[pl] = i; this.confirm(pl); }
        }
      }
    }
  },

  drawSide(ctx, pl) {
    const left = pl === 0, i = this.cur[pl], c = i < RND ? ROSTER[i] : null;
    const tag = left ? 'J1' : this.p2tag, col = left ? COL.p1 : COL.p2;
    const waiting = !left && this.phase === 'p1' && this.mode !== 'versus';
    const fx = left ? 165 : W - 165, px = left ? 318 : 652, pw = 310;
    if (this.mode === 'tournament' && !left) {
      text(ctx, '?', fx, 330, 220, 'rgba(255,255,255,0.18)', { align: 'center' });
      panel(ctx, px, 118, pw, 150, { accent: COL.yellow });
      text(ctx, 'TORNEIO DO TEAM', px + 24, 150, 24, COL.yellow);
      wrap(ctx, 'Enfrente os outros quatro integrantes em sequência. Vença a final e seja o campeão do laboratório.', px + 24, 186, pw - 44, 14, '#dfe4f2');
      return;
    }
    ctx.save();
    if (waiting) ctx.globalAlpha = 0.35;
    if (c) this.shows[i][pl].draw(ctx, fx, 480, 1.28, this.t);
    else text(ctx, '?', fx, 330, 220, 'rgba(255,255,255,0.3)', { align: 'center' });
    panel(ctx, px, 108, pw, 380, { accent: c ? c.color : col });
    body(ctx, tag, px + 24, 128, 13, col, { weight: 800 });
    if (c) {
      text(ctx, c.name.toUpperCase(), px + 24, 158, 38, '#fff');
      text(ctx, c.title, px + 24, 190, 15, c.color);
      wrap(ctx, c.desc, px + 24, 214, pw - 44, 12.5, '#c9d1ea', 16.5);
      drawMoves(ctx, c, this.helpDevs[pl], px + 16, 282, pw - 30, c.color);
    } else {
      text(ctx, 'ALEATÓRIO', px + 24, 158, 34, '#fff');
      wrap(ctx, 'Deixe o destino (ou o orientador) escolher o seu lutador.', px + 24, 200, pw - 44, 14, '#c9d1ea');
    }
    if (this.pick[pl]) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(px + pw - 108, 116, 96, 26, 13); ctx.fill(); body(ctx, 'PRONTO!', px + pw - 60, 130, 13, '#0b1020', { align: 'center', weight: 900 }); }
    ctx.restore();
  },

  draw(ctx) {
    const t = this.t;
    menuBg(ctx, t, '#2a3a8f');
    const who = this.phase === 'p2' ? (this.mode === 'bot' ? 'Escolha o adversário (bot)' : 'Escolha o boneco de treino') : this.phase === 'both' ? 'Cada jogador escolhe com o seu controle' : 'Escolha o seu lutador';
    title(ctx, 'SELEÇÃO · ' + TITLES[this.mode], who);
    this.drawSide(ctx, 0); this.drawSide(ctx, 1);
    text(ctx, 'VS', W / 2, 92, 30, COL.yellow, { align: 'center', stroke: '#0b1020', sw: 6 });
    // cartões do elenco
    for (let i = 0; i < NC; i++) {
      const x = cardX(i), c = ROSTER[i];
      const s1 = this.cur[0] === i, s2 = this.cur[1] === i && this.mode !== 'tournament' && !(this.phase === 'p1' && this.mode !== 'versus');
      const lift = (s1 || s2) ? -8 - Math.sin(t * 0.12) * 2 : 0;
      ctx.save(); ctx.translate(0, lift);
      ctx.fillStyle = '#0a0d1a'; ctx.beginPath(); ctx.roundRect(x - 4, CARD.y - 4, CARD.w + 8, CARD.h + 8, 12); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, CARD.y, CARD.w, CARD.h, 9); ctx.clip();
      const g = ctx.createLinearGradient(0, CARD.y, 0, CARD.y + CARD.h);
      g.addColorStop(0, c ? c.color : '#8b93a8'); g.addColorStop(1, '#141a36');
      ctx.fillStyle = g; ctx.fillRect(x, CARD.y, CARD.w, CARD.h);
      if (c && c.portrait) ctx.drawImage(c.portrait, x - 6, CARD.y - 2, 140, 140);
      else text(ctx, '?', x + CARD.w / 2, CARD.y + 62, 90, '#fff', { align: 'center' });
      ctx.fillStyle = 'rgba(8,11,24,0.88)'; ctx.fillRect(x, CARD.y + CARD.h - 34, CARD.w, 34);
      text(ctx, c ? c.name.toUpperCase() : 'ALEATÓRIO', x + CARD.w / 2, CARD.y + CARD.h - 16, c ? 19 : 15, '#fff', { align: 'center', maxW: CARD.w - 12 });
      ctx.restore();
      ctx.lineWidth = 5;
      if (s1) { ctx.strokeStyle = COL.p1; ctx.beginPath(); ctx.roundRect(x - 3, CARD.y - 3, CARD.w + 6, CARD.h + 6, 11); ctx.stroke(); ctx.fillStyle = COL.p1; ctx.beginPath(); ctx.roundRect(x - 6, CARD.y - 16, 40, 22, 6); ctx.fill(); body(ctx, 'J1', x + 14, CARD.y - 4.5, 13, '#fff', { align: 'center', weight: 900 }); }
      if (s2) { ctx.strokeStyle = COL.p2; ctx.beginPath(); ctx.roundRect(x - 3 + (s1 ? 5 : 0), CARD.y - 3 + (s1 ? 5 : 0), CARD.w + 6 - (s1 ? 10 : 0), CARD.h + 6 - (s1 ? 10 : 0), 11); ctx.stroke(); const tw = this.p2tag.length > 3 ? 68 : 44; ctx.fillStyle = COL.p2; ctx.beginPath(); ctx.roundRect(x + CARD.w - tw + 6, CARD.y + CARD.h - 4, tw, 22, 6); ctx.fill(); body(ctx, this.p2tag, x + CARD.w - tw / 2 + 6, CARD.y + CARD.h + 7.5, 13, '#0b1020', { align: 'center', weight: 900 }); }
      ctx.restore();
    }
    if (this.phase === 'diff') {
      ctx.fillStyle = 'rgba(4,6,16,0.72)'; ctx.fillRect(0, 0, W, H);
      panel(ctx, W / 2 - 250, 190, 500, 330, { accent: COL.yellow });
      text(ctx, 'DIFICULDADE DO BOT', W / 2, 232, 28, '#fff', { align: 'center' });
      this.diff.draw(ctx, W / 2 - 190, 270, 380, { ih: 62, size: 28 });
      const d = ['Reage devagar e defende pouco. Bom para aprender.', 'Usa combos, poderes e defesa equilibrada.', 'Pune erros, administra energia e fecha combos no supremo.'][this.diff.sel];
      body(ctx, d, W / 2, 482, 14, '#c9d1ea', { align: 'center' });
    }
    hint(ctx, this.mode === 'versus'
      ? `J1: ${Input.actionLabel('left', this.devs[0])} ${Input.actionLabel('right', this.devs[0])} + ${Input.actionLabel('light', this.devs[0])}     ·     J2: ${Input.actionLabel('left', this.devs[1])} ${Input.actionLabel('right', this.devs[1])} + ${Input.actionLabel('light', this.devs[1])}     ·     Esc: voltar`
      : '← → : escolher   ·   Enter / Espaço / J: confirmar   ·   Esc / K: voltar   ·   mouse e gamepad também funcionam');
  },
};
