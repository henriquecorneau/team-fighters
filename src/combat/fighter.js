// Lutador: máquina de estados, física, buffer de comandos, cancelamentos/combos e desenho.
import { GROUND, WORLD_W, WALL, MAX_HP, MAX_EN, MAX_GUARD, GRAV } from '../core/config.js';
import { clamp, smooth, pick } from '../core/util.js';
import { ANIMS, sample } from '../render/poses.js';
import { drawFighter, mixPose } from '../render/rig.js';
import { PIX, Sprite, snap } from '../render/pixel.js';
import { Audio } from '../core/audio.js';

const JUMP = 19.5;
let SEQ = 0;
const BLANK = { left: false, right: false, up: false, down: false, light: false, heavy: false, sp1: false, sp2: false, super: false, block: false };

export class Fighter {
  constructor(char, idx) {
    this.char = char; this.idx = idx; this.look = char.look;
    this.pose = new Float32Array(14); this.from = new Float32Array(14); this.tmp = new Float32Array(14);
    this.buf = { light: 0, heavy: 0, sp1: 0, sp2: 0, super: 0 };
    this.prev = { ...BLANK }; this.inp = { ...BLANK };
    this.wins = 0; this.en = 30;
    this.cx = 0; this.cy = 0;
    this.reset(idx === 0 ? WORLD_W / 2 - 190 : WORLD_W / 2 + 190, idx === 0 ? 1 : -1);
  }

  reset(x, facing) {
    this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.facing = facing;
    this.hp = MAX_HP; this.hpLag = MAX_HP; this.guard = MAX_GUARD; this.guardCool = 0;
    this.state = 'idle'; this.stT = 0; this.move = null; this.mf = 0; this.moveHit = false; this.moveSeq = 0;
    this.combo = 0; this.comboDmg = 0; this.comboShow = 0; this.lastDmg = 0;
    this.juggle = 0; this.stun = 0; this.shield = null; this.gearExt = 0; this.flash = 0; this.invT = 0; this.grav = GRAV;
    this.tapT = 0; this.tapDir = null; this.dashReq = null; this.airUsed = false; this.lowBlock = false; this.lastRes = null;
    this.poseOverride = null; this.squash = 1; this.hidden = false; this.spinA = 0; this.exprOverride = null;
    for (const k in this.buf) this.buf[k] = 0;
    this.anim = null; this.setAnim('idle', 0);
    sample(this.anim, 0, this.pose);
    this.cx = x - facing * 50; this.cy = 250;
  }

  // ---------- animação ----------
  getAnim(name) { return typeof name === 'string' ? (this.char.anims[name] || ANIMS[name]) : name; }
  setAnim(name, blend = 5, speed = 1) {
    const a = this.getAnim(name);
    if (a === this.anim && a.loop) { this.animSp = speed; return; }
    this.from.set(this.pose); this.blend = blend; this.blendT = 0;
    this.anim = a; this.animT = 0; this.animSp = speed;
  }
  tickAnim() {
    let t;
    if (this.state === 'attack' && this.move) t = this.mf;
    else if (this.anim === ANIMS.jump) t = clamp((JUMP - this.vy) / (JUMP * 2), 0, 1);
    else { this.animT += this.animSp; t = this.animT; if (this.anim.loop) t = ((t % this.anim.dur) + this.anim.dur) % this.anim.dur; }
    sample(this.anim, t, this.tmp);
    if (this.poseOverride) this.tmp.set(this.poseOverride);
    if (this.blendT < this.blend) { this.blendT++; mixPose(this.from, this.tmp, smooth(this.blendT / this.blend), this.pose); }
    else this.pose.set(this.tmp);
    if (this.state === 'launch') this.pose[5] = clamp(-28 - this.stT * 4.5, -112, 0);
    if (this.spinA) this.pose[5] += this.spinA;
  }

  enter(state, anim, blend = 5) { this.state = state; this.stT = 0; if (anim) this.setAnim(anim, blend); }

  // ---------- consultas ----------
  get actionable() { const s = this.state; return s === 'idle' || s === 'walk' || s === 'crouch' || s === 'block' || s === 'land'; }
  get crouching() {
    const s = this.state;
    return s === 'crouch' || ((s === 'block' || s === 'blockstun') && this.lowBlock) || (s === 'attack' && this.move && this.move.crouch) || (s === 'hitstun' && this.crouchHit);
  }
  get stunned() { const s = this.state; return s === 'hitstun' || s === 'launch' || s === 'dizzy' || s === 'cine'; }
  invulnerable() {
    const s = this.state;
    if (this.invT > 0 || s === 'down' || s === 'getup' || s === 'cine' || s === 'ko' || s === 'win' || s === 'lose' || s === 'intro') return true;
    if (s === 'launch' && this.juggle > 4) return true;
    const mv = this.move;
    return s === 'attack' && mv && mv.inv && this.mf >= mv.inv[0] && this.mf <= mv.inv[1];
  }
  armored() { const mv = this.move; return this.state === 'attack' && mv && mv.armor && this.mf >= mv.armor[0] && this.mf <= mv.armor[1]; }
  attackActive() { const mv = this.move; return this.state === 'attack' && mv && mv.box && !this.moveHit && this.mf > mv.st && this.mf <= mv.st + mv.act; }
  attackBox() {
    const b = this.move.box;
    return { x: this.facing > 0 ? this.x + b[0] : this.x - b[0] - b[2], y: GROUND - this.y - b[1] - b[3], w: b[2], h: b[3] };
  }
  hurtbox() {
    const s = this.state;
    let w = 64, h = 232;
    if (this.crouching) h = 150;
    else if (s === 'jump' || s === 'launch' || (s === 'attack' && this.move && this.move.air)) h = 190;
    if (s === 'down' || s === 'ko') { w = 150; h = 50; }
    return { x: this.x - w / 2, y: GROUND - this.y - h, w, h };
  }
  // Defende se segurar o botão de defesa OU segurar para trás (guarda clássica).
  isBlocking(dir) {
    const s = this.state, i = this.inp;
    if (s === 'block' || s === 'blockstun') return true;
    if (s === 'idle' || s === 'walk' || s === 'crouch') {
      const back = dir > 0 ? i.right : i.left;       // dir = sentido do golpe; "trás" é a direção para onde ele empurra
      return i.block || back;
    }
    return false;
  }

  // ---------- entrada ----------
  poll(inp) {
    const p = this.prev;
    for (const a in this.buf) if (inp[a] && !p[a]) this.buf[a] = 9;
    for (const d of ['left', 'right']) {
      if (inp[d] && !p[d]) {
        if (this.tapDir === d && this.tapT > 0) { this.dashReq = d; this.tapT = 0; }
        else { this.tapDir = d; this.tapT = 13; }
      }
    }
    for (const k in BLANK) { p[k] = inp[k]; this.inp[k] = inp[k]; }
  }
  take(a) { if (this.buf[a] > 0) { this.buf[a] = 0; return true; } return false; }

  // ---------- atualização ----------
  update(opp, m) {
    for (const k in this.buf) if (this.buf[k] > 0) this.buf[k]--;
    if (this.tapT > 0) this.tapT--;
    if (this.flash > 0) this.flash--;
    if (this.invT > 0) this.invT--;
    if (this.comboShow > 0) this.comboShow--;
    this.stT++;
    if (m.phase === 'fight') {
      if (m.infinite && m.infinite[this.idx]) this.en = MAX_EN;
      else if (this.en < MAX_EN) { const was = this.en; this.en = Math.min(MAX_EN, this.en + 0.032); if (was < MAX_EN && this.en >= MAX_EN) Audio.sfx('energy_full'); }
    }
    if (this.guardCool > 0) this.guardCool--; else if (this.guard < MAX_GUARD) this.guard = Math.min(MAX_GUARD, this.guard + 0.4);
    if (this.shield) { this.shield.t--; if (this.shield.t <= 0 || this.shield.hits <= 0) this.shield = null; }
    if (this.hpLag > this.hp && !this.stunned) this.hpLag = Math.max(this.hp, this.hpLag - 6);

    const s = this.state;
    switch (s) {
      case 'idle': case 'walk': case 'crouch': case 'block': this.neutral(opp, m); break;
      case 'land': if (this.stT >= 3) this.neutral(opp, m); else this.vx = 0; break;
      case 'jump':
        if (!this.airUsed && m.phase === 'fight') {
          if (this.take('heavy')) { this.airUsed = true; this.startMove('aheavy', m); }
          else if (this.take('light')) { this.airUsed = true; this.startMove('alight', m); }
        }
        break;
      case 'attack': this.runMove(opp, m); break;
      case 'dash':
        this.vx *= 0.9;
        if (this.stT > 5 && (this.trySpecials(m) || this.tryNormals(m))) break;
        if (this.stT >= 15) this.enter('idle', 'idle', 6);
        break;
      case 'backdash':
        this.vx *= 0.9;
        if (this.stT >= 18) this.enter('idle', 'idle', 6);
        break;
      case 'hitstun': case 'blockstun': case 'dizzy':
        this.vx *= 0.86;
        if (--this.stun <= 0) {
          if (s === 'dizzy') this.guard = MAX_GUARD;
          if (s === 'blockstun' && this.inp.block) this.enter('block', this.inp.down ? 'blockC' : 'blockS', 3);
          else this.enter('idle', 'idle', 6);
          this.crouchHit = false;
        } else if (s === 'dizzy' && this.stT % 14 === 0) {
          m.fx.add({ type: 'star', x: this.x + (Math.random() - 0.5) * 60, y: GROUND - 250, vx: (Math.random() - 0.5) * 2, vy: -1, life: 26, size: 9, color: '#ffd23f', vr: 0.2, front: true });
        }
        break;
      case 'down':
        this.vx *= 0.8;
        if (this.stT > 26) { this.enter('getup', 'getup', 0); }
        break;
      case 'getup':
        if (this.stT >= 24) { this.invT = 5; this.enter('idle', 'idle', 4); }
        break;
      case 'ko': case 'win': case 'lose': case 'intro': this.vx *= 0.8; break;
      case 'cine': this.vx = 0; break;
    }
    this.dashReq = null;

    // física
    if (this.state !== 'cine') {
      this.x += this.vx;
      if (this.y > 0 || this.vy > 0) {
        this.vy -= this.grav; this.y += this.vy;
        if (this.y <= 0) { this.y = 0; this.vy = 0; this.onLand(m); }
      }
      this.x = clamp(this.x, WALL, WORLD_W - WALL);
    }
    // companheiro (drone, orbe ou capivara) segue com suavidade
    const tx = this.x - this.facing * (this.char.compX || 56), ty = this.char.compY || 250;
    this.cx += (tx - this.cx) * 0.1; this.cy += (ty + this.y * 0.6 - this.cy) * 0.1;
    this.tickAnim();
  }

  neutral(opp, m) {
    const inp = this.inp;
    if (m.phase !== 'fight') { this.vx = 0; if (this.state !== 'idle') this.enter('idle', 'idle', 6); return; }
    this.facing = opp.x >= this.x ? 1 : -1;
    const f = this.facing > 0 ? inp.right : inp.left, b = this.facing > 0 ? inp.left : inp.right;
    if (this.trySpecials(m) || this.tryNormals(m)) return;
    if (inp.block) {
      this.vx = 0;
      if (this.state !== 'block' || this.lowBlock !== inp.down) { this.lowBlock = inp.down; this.enter('block', inp.down ? 'blockC' : 'blockS', 4); }
      return;
    }
    if (this.dashReq) {
      const dir = this.dashReq === 'right' ? 1 : -1;
      this.dashReq = null;
      Audio.sfx('dash'); m.fx.dust(this.x, GROUND, -dir, 6);
      if (dir === this.facing) { this.enter('dash', 'dash', 3); this.vx = dir * 13.5; }
      else { this.enter('backdash', 'backdash', 3); this.vx = dir * 12.5; this.invT = 9; }
      return;
    }
    if (inp.up) {
      this.vx = this.facing * (f ? 1 : b ? -1 : 0) * 6;
      this.vy = JUMP; this.y = 0.01; this.airUsed = false;
      this.enter('jump', 'jump', 3);
      Audio.sfx('jump'); m.fx.dust(this.x, GROUND, 0, 4);
      return;
    }
    if (inp.down) { this.vx = 0; if (this.state !== 'crouch') this.enter('crouch', 'crouch', 5); return; }
    if (f || b) {
      const d = f ? 1 : -1;
      this.vx = this.facing * d * this.char.speed * (f ? 1 : 0.78);
      if (this.state !== 'walk') this.enter('walk', 'walk', 5);
      this.animSp = d * 1.1;
      return;
    }
    this.vx = 0;
    if (this.state !== 'idle') this.enter('idle', 'idle', 6);
  }

  trySpecials(m) {
    if (this.buf.super > 0) {
      this.buf.super = 0;
      if (this.en >= MAX_EN) { this.startMove('super', m); return true; }
      m.deny(this);
    }
    for (const sp of ['sp1', 'sp2']) {
      if (this.buf[sp] > 0) {
        this.buf[sp] = 0;
        if (this.en >= this.char.moves[sp].cost) { this.startMove(sp, m); return true; }
        m.deny(this);
      }
    }
    return false;
  }
  tryNormals(m) {
    if (this.take('heavy')) { this.startMove(this.inp.down ? 'cheavy' : 'heavy', m); return true; }
    if (this.take('light')) { this.startMove(this.inp.down ? 'clight' : 'light1', m); return true; }
    return false;
  }

  startMove(id, m) {
    let mv = this.char.moves[id];
    if (mv.super) this.en = 0;
    else if (mv.cost && !(m.infinite && m.infinite[this.idx])) this.en = Math.max(0, this.en - mv.cost);
    if (mv.variants) mv = this.char.moves[pick(mv.variants)];
    this.move = mv; this.moveId = id; this.mf = 0; this.moveHit = false; this.moveSeq = ++SEQ; this.gearExt = 0; this.lastRes = null;
    this.state = 'attack'; this.stT = 0;
    this.setAnim(mv.anim, 2);
    if (this.y <= 0) this.vx *= 0.3;
    if (mv.sfx) Audio.sfx(mv.sfx);
    if (mv.super) m.superFlash(this, mv);
    if (mv.start) mv.start(this, m);
  }

  runMove(opp, m) {
    const mv = this.move;
    const f = ++this.mf;
    if (mv.events && mv.events[f]) mv.events[f](this, opp, m);
    if (mv.tick) mv.tick(this, opp, m, f);
    if (this.move !== mv) return;                       // o evento pode ter trocado o estado (ex.: cinemática)
    if (mv.lunge && f >= mv.lunge[0] && f < mv.lunge[1]) this.vx = this.facing * mv.lunge[2];
    else if (this.y <= 0) this.vx *= 0.8;
    if (f > mv.st && m.phase === 'fight') {
      const contact = this.moveHit;
      if (mv.cancelSp && contact && this.lastRes !== 'whiff') {
        if (this.buf.super > 0 && this.en >= MAX_EN && !mv.super) { this.buf.super = 0; this.startMove('super', m); return; }
        if (!mv.special) {
          for (const sp of ['sp1', 'sp2']) {
            if (this.buf[sp] > 0 && this.en >= this.char.moves[sp].cost) { this.buf[sp] = 0; this.startMove(sp, m); return; }
          }
        }
      }
      if (mv.next) {
        for (const a in mv.next) {
          if ((contact || (mv.chain && a === 'light' && f > mv.st + mv.act)) && this.buf[a] > 0) {
            this.buf[a] = 0;
            this.facing = opp.x >= this.x ? 1 : -1;
            this.startMove(mv.next[a], m);
            return;
          }
        }
      }
    }
    if (!mv.air && f >= mv.st + mv.act + mv.rec) this.endMove();
    else if (mv.air && f >= mv.st + mv.act + mv.rec && this.y > 0) { this.move = null; this.state = 'jump'; this.setAnim('jump', 6); }
  }

  endMove() {
    const crouch = this.move && this.move.crouch && this.inp.down;
    this.move = null; this.gearExt = 0;
    if (crouch) this.enter('crouch', 'crouch', 5); else this.enter('idle', 'idle', 6);
  }

  onLand(m) {
    const s = this.state;
    if (s === 'jump' || (s === 'attack' && this.move && this.move.air)) {
      this.move = null; this.vx = 0;
      this.enter('land', 'land', 2);
      Audio.sfx('land'); m.fx.dust(this.x, GROUND, 0, 4);
    } else if (s === 'launch') {
      this.juggle = 0; this.grav = GRAV; this.vx *= 0.5;
      Audio.sfx('fall'); m.fx.dust(this.x, GROUND, 0, 9); m.shake = Math.max(m.shake, 5);
      if (this.hp <= 0) this.enter('ko', 'down', 3); else this.enter('down', 'down', 3);
    }
  }

  // ---------- reações ----------
  setHitstun(frames, vx, high) {
    const wasCrouch = this.crouching;
    this.move = null; this.gearExt = 0; this.stun = frames; this.vx = vx; this.crouchHit = wasCrouch;
    this.enter('hitstun', wasCrouch ? 'hitCrouch' : high ? 'hitHigh' : 'hitLow', 2);
  }
  setLaunch(vx, vy) {
    this.move = null; this.gearExt = 0; this.vx = vx; this.vy = vy; this.y = Math.max(this.y, 0.01);
    this.juggle++; this.grav = GRAV * (1 + 0.22 * Math.max(0, this.juggle - 1));
    this.enter('launch', 'launch', 2);
  }
  setBlockstun(frames, vx) {
    this.stun = frames; this.vx = vx;
    if (this.state !== 'blockstun' && this.state !== 'block') this.lowBlock = this.inp.down;
    this.enter('blockstun', this.lowBlock ? 'blockC' : 'blockS', 2);
  }

  // ---------- desenho ----------
  expr() {
    const s = this.state;
    if (s === 'attack') return 'a';
    if (s === 'hitstun' || s === 'launch' || s === 'dizzy' || s === 'lose') return 'h';
    if (s === 'block' || s === 'blockstun') return 'b';
    if (s === 'down' || s === 'ko') return 'k';
    if (s === 'win') return 'w';
    return this.exprOverride || 'n';
  }

  drawShadow(ctx) {
    const k = clamp(1 - this.y / 420, 0.35, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(this.x, GROUND + 6, 62 * k, 11 * k, 0, 0, Math.PI * 2); ctx.fill();
  }

  draw(ctx, t, shakeX = 0) {
    if (this.hidden) return;
    const ch = this.char;
    if (ch.companion && !this.noComp) ch.companion(ctx, this, t);
    ctx.save();
    const pix = PIX.on;
    if (pix) ctx.translate(snap(this.x + shakeX), snap(GROUND - this.y)); else ctx.translate(this.x + shakeX, GROUND - this.y);
    ctx.scale(this.facing, 1);
    if (this.squash !== 1) ctx.scale(1 + (1 - this.squash) * 0.5, this.squash);
    if (ch.drawBack) ch.drawBack(ctx, this, t);
    const o = { expr: this.expr(), t, flash: this.flash > 0, gearExt: this.gearExt, flip: this.facing, lazy: ((t + this.idx) & 1) === 1 };
    if (pix) {
      if (!this.sprite) this.sprite = new Sprite();
      this.sprite.update(this.look, this.pose, o);
      this.sprite.draw(ctx);
    } else drawFighter(ctx, this.look, this.pose, o);
    if (ch.drawFront) ch.drawFront(ctx, this, t);
    ctx.restore();
  }
}

export { JUMP, BLANK };
