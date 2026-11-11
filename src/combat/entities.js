// Entidades de combate: projéteis, invocações (drones, capivaras, ferramentas) e áreas de efeito.
import { GROUND, WORLD_W } from '../core/config.js';
import { Input } from '../core/input.js';

export class Ent {
  constructor(o) {
    this.t = 0; this.dead = false; this.hits = 1; this.cool = 0; this.vx = 0; this.vy = 0;
    this.w = 40; this.h = 40; this.life = 120; this.y = 100;
    Object.assign(this, o);
  }
  update(m) {
    this.t++;
    if (this.cool > 0) this.cool--;
    this.x += this.vx; this.y += this.vy;
    if (this.tick) this.tick(this, m);
    if (this.t >= this.life || this.x < -260 || this.x > WORLD_W + 260) { this.dead = true; if (this.onEnd) this.onEnd(this, m); }
  }
  // y = altura do centro acima do chão
  box() { return this.getBox ? this.getBox(this) : { x: this.x - this.w / 2, y: GROUND - this.y - this.h / 2, w: this.w, h: this.h }; }
  get sy() { return GROUND - this.y; }
}

// Troca suave da pose durante cinemáticas.
export function cpose(f, p, blend = 5) {
  if (f.poseOverride !== p) { f.from.set(f.pose); f.blend = blend; f.blendT = 0; f.poseOverride = p; }
}

// ---------- controladores ----------
export class HumanCtl {
  constructor(devs) { this.devs = devs; this.out = {}; this.human = true; }
  read() { return Input.state(this.devs, this.out); }
}

// Boneco de treino: parado, agachado, pulando ou defendendo tudo.
export class DummyCtl {
  constructor(mode = 'stand') { this.mode = mode; this.out = { left: false, right: false, up: false, down: false, light: false, heavy: false, sp1: false, sp2: false, super: false, block: false }; this.t = 0; }
  read(me, opp) {
    const o = this.out; this.t++;
    o.up = o.down = o.block = false;
    if (this.mode === 'crouch') o.down = true;
    else if (this.mode === 'jump') o.up = this.t % 70 < 4;
    else if (this.mode === 'block') {
      o.block = true;
      const mv = opp.move;
      o.down = !!(mv && mv.lvl === 'low');
    }
    return o;
  }
}
