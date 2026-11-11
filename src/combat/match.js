// Partida: rounds, cronômetro, resolução de golpes (hitbox x hurtbox), supers cinematográficos e câmera.
import { W, H, GROUND, WORLD_W, WALL, MAX_HP, MAX_EN, FONT_D, COL } from '../core/config.js';
import { clamp, overlap, rand, TAU } from '../core/util.js';
import { Fighter } from './fighter.js';
import { FX } from '../render/fx.js';
import { Audio } from '../core/audio.js';

export class Match {
  constructor(o) {
    this.o = o;
    this.stage = o.stage; this.mode = o.mode; this.training = o.mode === 'training';
    this.roundsToWin = this.training ? 99 : o.rounds; this.roundTime = this.training ? 0 : o.time;
    this.f = [new Fighter(o.chars[0], 0), new Fighter(o.chars[1], 1)];
    this.ctls = o.ctls;
    this.ents = []; this.fx = new FX();
    this.cam = { x: (WORLD_W - W) / 2 };
    this.t = 0; this.round = 1; this.shake = 0; this.hitstop = 0; this.flashA = 0; this.slow = 0;
    this.sf = null; this.cine = null; this.banner = null;
    this.infinite = [false, false]; this.showBoxes = false;
    this.stats = { maxCombo: [0, 0], dmg: [0, 0], perfect: [0, 0], supers: [0, 0], frames: 0 };
    this.result = null;
    this.startRound();
  }

  startRound() {
    const [a, b] = this.f;
    a.reset(WORLD_W / 2 - 190, 1); b.reset(WORLD_W / 2 + 190, -1);
    this.ents.length = 0; this.fx.clear();
    this.cine = null; this.sf = null; this.hitstop = 0; this.slow = 0;
    this.timer = this.roundTime ? this.roundTime * 60 : Infinity;
    this.koWinner = null; this.timeUp = false; this.fin = null; this.fatalDone = null;
    this.phase = 'intro'; this.pt = this.training ? 60 : 0;
    for (const f of this.f) { f.enter('intro', 'intro', 0); f.animT = this.training ? 40 : 0; }
    this.cam.x = (WORLD_W - W) / 2;
  }

  say(text, dur = 70, sub = '', color = COL.yellow) { this.banner = { text, sub, t: 0, dur, color }; }
  deny(f) { f.denyT = 18; if (this.ctls[f.idx].human) Audio.sfx('ui_deny'); }

  superFlash(att, mv) {
    this.sf = { t: 54, who: att, name: mv.name };
    this.stats.supers[att.idx]++;
    Audio.sfx('super_flash');
    this.flashA = 0.5;
  }

  startCine(a, d) {
    this.ents.length = 0;
    this.cine = { def: a.char.cine, a, d, f: 0, ax: a.x, dx: d.x, data: {} };
    a.move = null; d.move = null; a.vx = d.vx = 0; a.vy = d.vy = 0; a.gearExt = 0;
    a.enter('cine', null); d.enter('cine', null);
    a.y = 0; d.shield = null;
    if (a.char.cine.begin) a.char.cine.begin(this, a, d, this.cine);
  }

  cineHit(dmg, sfx = 'hit_h', power = 1.2) {
    const { a, d } = this.cine;
    const real = Math.round(dmg * a.char.power * d.char.defense);
    d.hp = Math.max(this.training ? 1 : 0, d.hp - real);
    a.combo++; a.comboDmg += real; a.comboShow = 120; a.lastDmg = real;
    this.stats.dmg[a.idx] += real; this.stats.maxCombo[a.idx] = Math.max(this.stats.maxCombo[a.idx], a.combo);
    d.flash = 4;
    this.fx.hit(d.x + rand(-24, 24), GROUND - d.y - 130 + rand(-40, 40), power, a.char.color);
    this.shake = Math.max(this.shake, power * 7);
    Audio.sfx(sfx);
  }

  endCine() {
    const { a, d, def } = this.cine;
    if (this.cine.fatal) {
      // fim da finalização: o perdedor fica como a cena deixou e o vencedor comemora
      if (def.end) def.end(this, a, d, this.cine);
      a.poseOverride = null; a.exprOverride = null; a.spinA = d.spinA = 0; a.squash = 1;
      a.x = clamp(a.x, WALL, WORLD_W - WALL);
      a.enter('idle', 'idle', 8); d.state = 'ko'; d.vx = d.vy = 0;
      this.cine = null; this.fatalDone = def.name;
      this.koWinner = a.idx; this.phase = 'ko'; this.pt = 104;
      return;
    }
    if (def.end) def.end(this, a, d, this.cine);
    a.poseOverride = d.poseOverride = null; a.hidden = d.hidden = false; a.squash = d.squash = 1; a.spinA = d.spinA = 0; a.exprOverride = d.exprOverride = null;
    a.x = clamp(a.x, WALL, WORLD_W - WALL); d.x = clamp(d.x, WALL, WORLD_W - WALL);
    const dir = d.x >= a.x ? 1 : -1;
    a.enter('idle', 'idle', 10);
    this.cine = null;
    d.juggle = 9;
    if (d.hp <= 0) this.ko(a, d, dir);
    else { d.setLaunch(dir * 7, 11); d.juggle = 9; }
  }

  // Nocaute: se for o golpe que decide a luta, o perdedor fica em pé, tonto, esperando a finalização.
  ko(att, def, dir) {
    if (this.phase !== 'fight') return;
    if (!this.training && att.hp > 0 && att.wins === this.roundsToWin - 1 && att.char.fatal) { this.startFinish(att, def); return; }
    def.setLaunch(dir * 9, 13); this.onKO(att.idx);
  }

  startFinish(a, d) {
    const ctl = this.ctls[a.idx];
    this.phase = 'finish'; this.pt = 0; this.ents.length = 0;
    this.fin = { a, d, seq: a.char.fatal.cmd, i: 0, prev: {}, T: 330, human: !!ctl.human, bot: !ctl.human && Math.random() < ({ easy: 0.25, normal: 0.6, hard: 0.95 }[ctl.level] || 0) };
    if (!this.fin.human) this.fin.T = this.fin.bot ? 140 : 70;
    d.hp = 0; d.move = null; d.gearExt = 0; d.stun = 1e9; d.vx *= 0.3; d.vy = Math.min(d.vy, 0); d.juggle = 0;
    d.enter('dizzy', 'dizzy', 4);
    this.shake = 12; this.flashA = 0.5;
    Audio.sfx('guardbreak'); Audio.sfx('round');
    this.say('FINALIZE!', 80, a.char.name + ' pode executar a finalização', COL.red);
  }

  // Lê a sequência de comandos do vencedor (frente/trás relativos ao lado para onde ele olha).
  finishStep() {
    const fn = this.fin, { a, d } = fn, inp = a.inp, fwd = a.facing > 0 ? 'right' : 'left', back = a.facing > 0 ? 'left' : 'right';
    a.facing = d.x >= a.x ? 1 : -1;
    const now = { f: inp[fwd], b: inp[back], d: inp.down, light: inp.light, heavy: inp.heavy, sp1: inp.sp1, sp2: inp.sp2, super: inp.super };
    if (fn.human && this.pt > 20) {
      for (const k in now) {
        if (now[k] && !fn.prev[k]) {
          if (k === fn.seq[fn.i]) { fn.i++; Audio.sfx('tick'); }
          else fn.i = k === fn.seq[0] ? 1 : 0;
        }
      }
    }
    fn.prev = now;
    if (fn.i >= fn.seq.length || (fn.bot && this.pt === 100)) { this.startFatal(); return; }
    if (this.pt > fn.T) {
      // tempo esgotado: nocaute comum
      d.setLaunch((d.x >= a.x ? 1 : -1) * 6, 10);
      this.fin = null; this.koWinner = a.idx; this.phase = 'ko'; this.pt = 0; this.slow = 40; this.shake = 12;
      Audio.sfx('ko'); this.say('K.O.', 100, '', COL.red);
    }
  }

  startFatal() {
    const { a, d } = this.fin, def = a.char.fatal;
    this.fin = null; this.phase = 'fatal';
    this.cine = { def, a, d, f: 0, ax: a.x, dx: d.x, data: {}, fatal: true };
    a.move = null; a.vx = d.vx = 0; a.vy = d.vy = 0; a.gearExt = 0; a.y = 0;
    a.enter('cine', null); d.enter('cine', null);
    if (def.begin) def.begin(this, a, d, this.cine);
    this.flashA = 0.7; this.shake = 10;
    Audio.sfx('super_flash');
    this.say(def.name, 110, 'FINALIZAÇÃO DE ' + a.char.name.toUpperCase(), a.char.color);
  }

  onKO(winnerIdx) {
    if (this.phase !== 'fight') return;
    const both = this.f[0].hp <= 0 && this.f[1].hp <= 0;
    this.koWinner = both ? -1 : winnerIdx;
    this.phase = 'ko'; this.pt = 0; this.slow = 55;
    this.shake = 16; this.flashA = 0.8;
    Audio.sfx('ko');
    this.say(both ? 'DUPLO K.O.' : 'K.O.', 110, '', COL.red);
  }

  // Resolve um golpe (corpo a corpo ou projétil). Retorna 'hit' | 'block' | 'armor' | 'shield' | null.
  applyHit(att, def, hit, srcX, melee) {
    if (def.invulnerable()) return null;
    const dir = def.x === srcX ? att.facing : def.x > srcX ? 1 : -1;
    const hx = def.x - dir * 22, hy = hit.hy !== undefined ? GROUND - hit.hy : GROUND - def.y - (def.crouching ? 92 : hit.lvl === 'low' ? 40 : 150);
    const fx = this.fx;

    if (def.shield && def.shield.hits > 0 && !hit.cine) {
      def.shield.hits--;
      fx.add({ type: 'ring', x: def.x, y: GROUND - def.y - 120, life: 16, r0: 40, r1: 150, w: 8, color: '#9dff8a', front: true });
      fx.text(def.x, GROUND - def.y - 270, 'CAPI-ESCUDO!', '#b8ff9a', 24);
      Audio.sfx('boing'); Audio.sfx('capy');
      if (melee) { att.hp = Math.max(1, att.hp - 12); att.setHitstun(14, -dir * 8, true); att.flash = 4; }
      this.hitstop = 5;
      return 'shield';
    }

    const lvlOk = hit.lvl === 'low' ? def.inp.down : hit.lvl === 'high' ? !def.inp.down : true;
    if (!hit.unblock && def.y <= 0 && def.isBlocking(dir) && lvlOk) {
      def.hp = Math.max(1, def.hp - (hit.chip || 0));
      def.guard -= hit.gdmg !== undefined ? hit.gdmg : Math.max(8, hit.dmg * 0.27);
      def.guardCool = 50;
      att.en = Math.min(MAX_EN, att.en + 1.5);
      if (def.guard <= 0) {
        def.guard = 0; def.move = null; def.stun = 78; def.vx = dir * 4;
        def.enter('dizzy', 'dizzy', 3);
        Audio.sfx('guardbreak'); fx.text(def.x, GROUND - 280, 'GUARDA QUEBRADA!', '#9fe8ff', 30);
        fx.burst(hx, hy, 16, ['#9fe8ff', '#fff'], 12, { type: 'sq', size: 7, front: true });
        this.hitstop = 10; this.shake = 8;
      } else {
        def.setBlockstun(hit.bstun || 10, dir * (hit.push || 4) * 0.8);
        Audio.sfx('block'); fx.block(hx, hy);
        this.hitstop = Math.max(this.hitstop, 3);
      }
      if (melee && (def.x <= WALL + 4 || def.x >= WORLD_W - WALL - 4)) att.vx = -dir * 5;
      return 'block';
    }

    const kill = (real) => {
      def.hp = Math.max(this.training ? 1 : 0, def.hp - real);
      this.stats.dmg[att.idx] += real;
    };

    if (def.armored() && !hit.cine) {
      kill(Math.round(hit.dmg * 0.5 * att.char.power * def.char.defense));
      def.flash = 4; Audio.sfx('hit_l'); fx.hit(hx, hy, 0.7, '#cfd6e2');
      fx.text(def.x, GROUND - 270, 'ARMADURA!', '#cfd6e2', 22);
      this.hitstop = 4;
      if (def.hp <= 0) this.ko(att, def, dir);
      return 'armor';
    }

    if (!def.stunned) { att.combo = 0; att.comboDmg = 0; }
    const scale = Math.max(0.35, 1 - 0.1 * Math.max(0, att.combo - 1));
    const real = Math.max(1, Math.round(hit.dmg * scale * att.char.power * def.char.defense));
    kill(real);
    att.combo++; att.comboDmg += real; att.comboShow = 100; att.lastDmg = real;
    this.stats.maxCombo[att.idx] = Math.max(this.stats.maxCombo[att.idx], att.combo);
    att.en = Math.min(MAX_EN, att.en + (hit.gain !== undefined ? hit.gain : real * 0.085));
    def.en = Math.min(MAX_EN, def.en + real * 0.05);
    def.flash = 5;
    const power = real >= 60 ? 1.5 : real >= 38 ? 1.15 : 0.85;
    fx.hit(hx, hy, power, att.char.color);
    fx.text(hx + rand(-10, 10), hy - 40, String(real), power > 1.2 ? '#ffd23f' : '#fff', power > 1.2 ? 28 : 20, { life: 34 });
    Audio.sfx(hit.hit || 'hit_l');
    this.shake = Math.max(this.shake, power * 5.5);
    this.hitstop = Math.max(this.hitstop, hit.hs || 6);

    if (def.hp <= 0) { this.ko(att, def, dir); return 'hit'; }
    if (hit.cine) { this.startCine(att, def); return 'hit'; }
    if (hit.kd || def.y > 0 || def.state === 'launch') { const kd = hit.kd || [5, 9.5]; def.setLaunch(dir * kd[0], kd[1]); }
    else def.setHitstun(hit.stun || 16, dir * (hit.push || 4), hy < GROUND - 125);
    if (melee && (def.x <= WALL + 4 || def.x >= WORLD_W - WALL - 4)) att.vx = -dir * (hit.push || 4) * 0.8;
    return 'hit';
  }

  // Um frame de simulação (60 Hz).
  step() {
    this.t++;
    const [a, b] = this.f;
    a.poll(this.ctls[0].read(a, b, this));
    b.poll(this.ctls[1].read(b, a, this));
    if (this.shake > 0) this.shake *= 0.86;
    if (this.flashA > 0) this.flashA -= 0.05;
    if (this.banner && ++this.banner.t > this.banner.dur) this.banner = null;
    for (const f of this.f) if (f.denyT > 0) f.denyT--;

    if (this.sf) { if (--this.sf.t <= 0) this.sf = null; this.fx.update(); return; }
    if (this.hitstop > 0) { this.hitstop--; this.fx.update(); return; }
    if (this.slow > 0) { this.slow--; if (this.t % 3) return; }

    this.phaseStep();

    if (this.cine) {
      const c = this.cine, cd = c.def;
      c.f++;
      cd.step(this, c.a, c.d, c.f, c);
      for (const h of cd.hits) if (h[0] === c.f) this.cineHit(h[1], h[2], h[3]);
      if (c.f >= cd.dur) this.endCine();
    }

    a.update(b, this); b.update(a, this);

    // empurra os lutadores para não se atravessarem e mantém os dois na tela
    if (!this.cine) {
      const dx = b.x - a.x, minD = 92;
      if (Math.abs(dx) < minD && Math.abs(a.y - b.y) < 150 && a.state !== 'down' && b.state !== 'down' && a.state !== 'ko' && b.state !== 'ko') {
        const push = (minD - Math.abs(dx)) / 2, s = dx >= 0 ? 1 : -1;
        a.x = clamp(a.x - s * push, WALL, WORLD_W - WALL); b.x = clamp(b.x + s * push, WALL, WORLD_W - WALL);
      }
      const far = Math.abs(b.x - a.x) - 1040;
      if (far > 0) { const s = b.x > a.x ? 1 : -1; a.x += s * far / 2; b.x -= s * far / 2; }
    }

    // golpes corpo a corpo (resolvidos em conjunto para permitir trocas)
    if (this.phase === 'fight' && !this.cine) {
      const act = [a.attackActive() && overlap(a.attackBox(), b.hurtbox()), b.attackActive() && overlap(b.attackBox(), a.hurtbox())];
      const mv = [a.move, b.move];
      for (let i = 0; i < 2; i++) {
        if (!act[i] || this.cine || this.phase !== 'fight') continue;
        const at = this.f[i], df = this.f[1 - i];
        const res = this.applyHit(at, df, mv[i], at.x, true);
        if (res) { at.moveHit = true; at.lastRes = res; if (mv[i].onHit) mv[i].onHit(at, df, this, res); }
      }
    }

    // entidades
    const es = this.ents;
    for (let i = 0; i < es.length; i++) {
      const e = es[i];
      e.update(this);
      if (e.dead || !e.hit || e.cool > 0 || this.phase !== 'fight' || this.cine) continue;
      const d = this.f[1 - e.owner.idx];
      if (overlap(e.box(), d.hurtbox())) {
        const res = this.applyHit(e.owner, d, e.hit, e.x, false);
        if (res) {
          e.hits--; e.cool = e.rehit || 12;
          if (e.onHit) e.onHit(e, this, res, d);
          if (e.hits <= 0 && !e.persist) e.dead = true;
        }
      }
    }
    for (let i = 0; i < es.length; i++) {
      const e = es[i];
      if (e.dead || !e.clash || !e.hit) continue;
      for (let j = i + 1; j < es.length; j++) {
        const g = es[j];
        if (g.dead || !g.clash || !g.hit || g.owner === e.owner) continue;
        if (overlap(e.box(), g.box())) {
          e.dead = g.dead = true;
          this.fx.hit((e.x + g.x) / 2, GROUND - (e.y + g.y) / 2, 1, '#fff'); Audio.sfx('block');
        }
      }
    }
    for (let i = es.length - 1; i >= 0; i--) if (es[i].dead) es.splice(i, 1);

    this.fx.update();
    const tx = clamp((a.x + b.x) / 2 - W / 2, 0, WORLD_W - W);
    this.cam.x += (tx - this.cam.x) * 0.14;
  }

  phaseStep() {
    const [a, b] = this.f;
    this.pt++;
    if (this.phase === 'intro') {
      if (this.pt === 12 && !this.training) { this.say(this.isFinalRound() ? 'ROUND FINAL' : 'ROUND ' + this.round, 62, this.stage.name, '#fff'); Audio.sfx('round'); }
      if (this.pt === 78) { this.say(this.training ? 'TREINO LIVRE' : 'LUTE!', 44, '', COL.yellow); Audio.sfx('fight'); }
      if (this.pt >= 96) { this.phase = 'fight'; this.pt = 0; for (const f of this.f) f.enter('idle', 'idle', 6); }
    } else if (this.phase === 'fight') {
      this.stats.frames++;
      if (this.training) {
        for (const f of this.f) {
          const o = this.f[1 - f.idx];
          if (!f.stunned && f.state !== 'down' && f.state !== 'getup') { f.regenT = (f.regenT || 0) + 1; if (f.regenT > 50) { f.hp = MAX_HP; f.hpLag = MAX_HP; if (o.comboShow <= 0) { o.combo = 0; } } } else f.regenT = 0;
        }
      } else if (!this.cine && this.timer !== Infinity) {
        this.timer--;
        if (this.timer <= 600 && this.timer > 0 && this.timer % 60 === 0) Audio.sfx('tick');
        if (this.timer <= 0) {
          this.timeUp = true;
          this.koWinner = a.hp === b.hp ? -1 : a.hp > b.hp ? 0 : 1;
          this.phase = 'ko'; this.pt = 60;
          this.say('TEMPO ESGOTADO', 100, '', '#fff'); Audio.sfx('round');
        }
      }
    } else if (this.phase === 'finish') {
      this.finishStep();
    } else if (this.phase === 'ko') {
      const w = this.koWinner;
      if (this.pt === 120) {
        if (w >= 0) {
          const win = this.f[w], los = this.f[1 - w];
          win.wins++;
          if (win.hp >= MAX_HP) { this.stats.perfect[w]++; this.say('PERFEITO!', 90, win.char.name + ' venceu sem levar dano', COL.yellow); }
          else this.say(win.char.name.toUpperCase() + ' VENCE', 90, win.wins >= this.roundsToWin ? '' : 'Round ' + this.round, '#fff');
          if (win.y <= 0) { win.move = null; win.enter('win', 'win', 8); win.facing = los.x >= win.x ? 1 : -1; }
          if (this.timeUp && los.y <= 0) { los.move = null; los.enter('lose', 'lose', 10); }
          Audio.sfx('win');
          this.fx.confetti(win.x, GROUND - 320, 30);
        } else this.say('EMPATE', 90, 'O round será repetido', '#fff');
      }
      if (this.pt >= 250) {
        const win = w >= 0 ? this.f[w] : null;
        if (win && win.wins >= this.roundsToWin) {
          this.phase = 'over';
          this.result = { winner: w, wins: [a.wins, b.wins], stats: this.stats, rounds: this.round, fatal: this.fatalDone || null };
        } else { if (w >= 0) this.round++; this.startRound(); }
      }
    }
  }

  isFinalRound() { return this.f[0].wins === this.roundsToWin - 1 && this.f[1].wins === this.roundsToWin - 1 && this.roundsToWin > 1; }

  // ---------- desenho ----------
  draw(ctx) {
    const [a, b] = this.f;
    const t = this.t, cam = this.cam.x;
    const sx = this.shake > 0.5 ? rand(-this.shake, this.shake) : 0, sy = this.shake > 0.5 ? rand(-this.shake, this.shake) * 0.7 : 0;
    ctx.save();
    if (this.sf) {
      const k = Math.min(1, (54 - this.sf.t) / 8, this.sf.t / 6), z = 1 + 0.13 * k;
      const px = clamp(this.sf.who.x - cam, 200, W - 200), py = GROUND - 140;
      ctx.translate(px, py); ctx.scale(z, z); ctx.translate(-px, -py);
    }
    ctx.translate(sx, sy);
    this.stage.drawBack(ctx, cam, t);
    ctx.save();
    ctx.translate(-cam, 0);
    const dim = this.sf ? Math.min(1, (54 - this.sf.t) / 6) * 0.72 : this.cine ? Math.min(1, this.cine.f / 10, (this.cine.def.dur - this.cine.f) / 10) * 0.8 : 0;
    if (dim > 0) { ctx.fillStyle = `rgba(6,8,20,${dim})`; ctx.fillRect(cam - 60, -60, W + 120, H + 120); }
    if (this.cine && this.cine.def.drawBack) this.cine.def.drawBack(ctx, this, this.cine.a, this.cine.d, this.cine.f, this.cine);
    a.drawShadow(ctx); b.drawShadow(ctx);
    for (const e of this.ents) if (e.back && e.draw) e.draw(ctx, e, this);
    this.fx.draw(ctx, false);
    const top = this.cine ? this.cine.d.idx : (b.state === 'attack' || a.stunned) && !(a.state === 'attack') ? 1 : 0;
    const hs = this.hitstop > 0 ? 3.5 : 0;
    const bot = this.f[1 - top], tp = this.f[top];
    bot.draw(ctx, t, bot.stunned && hs ? rand(-hs, hs) : 0);
    tp.draw(ctx, t, tp.stunned && hs ? rand(-hs, hs) : 0);
    for (const f of this.f) if (f.char.overlay) f.char.overlay(ctx, f, t, this);
    for (const e of this.ents) if (!e.back && e.draw) e.draw(ctx, e, this);
    this.fx.draw(ctx, true);
    if (this.cine && this.cine.def.drawFront) this.cine.def.drawFront(ctx, this, this.cine.a, this.cine.d, this.cine.f, this.cine);
    if (this.showBoxes) this.drawBoxes(ctx);
    ctx.restore();
    this.stage.drawFront(ctx, cam, t);
    ctx.restore();

    if (this.sf) this.drawSuperFlash(ctx);
    if (this.flashA > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flashA})`; ctx.fillRect(0, 0, W, H); }
  }

  drawBoxes(ctx) {
    ctx.lineWidth = 2;
    for (const f of this.f) {
      const h = f.hurtbox();
      ctx.strokeStyle = f.invulnerable() ? 'rgba(160,160,160,0.9)' : 'rgba(80,255,120,0.9)'; ctx.fillStyle = 'rgba(80,255,120,0.12)';
      ctx.fillRect(h.x, h.y, h.w, h.h); ctx.strokeRect(h.x, h.y, h.w, h.h);
      if (f.state === 'attack' && f.move && f.move.box && f.mf > f.move.st && f.mf <= f.move.st + f.move.act) {
        const r = f.attackBox();
        ctx.strokeStyle = 'rgba(255,60,60,0.95)'; ctx.fillStyle = 'rgba(255,60,60,0.25)';
        ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeRect(r.x, r.y, r.w, r.h);
      }
    }
    for (const e of this.ents) {
      if (!e.hit) continue;
      const r = e.box();
      ctx.strokeStyle = 'rgba(255,170,40,0.95)'; ctx.fillStyle = 'rgba(255,170,40,0.2)';
      ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
  }

  drawSuperFlash(ctx) {
    const s = this.sf, who = s.who, k = Math.min(1, (54 - s.t) / 9), out = Math.min(1, s.t / 7);
    const left = who.idx === 0;
    ctx.save();
    ctx.globalAlpha = out;
    // faixas de velocidade
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 3;
    for (let i = 0; i < 16; i++) { const y = (i * 53 + this.t * 31) % H, x = (i * 197 + this.t * 60) % (W + 400) - 200; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 240, y); ctx.stroke(); }
    const y0 = 250, hh = 190, off = (1 - k * k * (3 - 2 * k)) * (left ? -W : W);
    ctx.translate(off, 0);
    ctx.fillStyle = who.char.color;
    ctx.beginPath(); ctx.moveTo(-40, y0 + 30); ctx.lineTo(W + 40, y0 - 30); ctx.lineTo(W + 40, y0 + hh - 30); ctx.lineTo(-40, y0 + hh + 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(8,10,22,0.82)';
    ctx.beginPath(); ctx.moveTo(-40, y0 + 44); ctx.lineTo(W + 40, y0 - 16); ctx.lineTo(W + 40, y0 + hh - 44); ctx.lineTo(-40, y0 + hh + 16); ctx.closePath(); ctx.fill();
    const p = who.char.portraitBig;
    if (p) {
      ctx.save();
      ctx.beginPath(); ctx.moveTo(-40, y0 + 44); ctx.lineTo(W + 40, y0 - 16); ctx.lineTo(W + 40, y0 + hh - 44); ctx.lineTo(-40, y0 + hh + 16); ctx.closePath(); ctx.clip();
      const px = left ? 60 : W - 60 - 300;
      if (!left) { ctx.translate(px + 150, 0); ctx.scale(-1, 1); ctx.translate(-(px + 150), 0); }
      ctx.drawImage(p, px, y0 - 70, 300, 300);
      ctx.restore();
    }
    ctx.font = `italic 900 60px ${FONT_D}`; ctx.textAlign = left ? 'left' : 'right'; ctx.textBaseline = 'middle';
    const tx = left ? 380 : W - 380;
    ctx.lineJoin = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = '#000'; ctx.strokeText(s.name, tx, y0 + hh / 2 + 4);
    ctx.fillStyle = '#fff'; ctx.fillText(s.name, tx, y0 + hh / 2 + 4);
    ctx.font = `italic 900 22px ${FONT_D}`; ctx.fillStyle = who.char.color;
    ctx.fillText('GOLPE SUPREMO  ·  ' + who.char.name.toUpperCase(), tx, y0 + hh / 2 - 44);
    ctx.restore();
  }
}
