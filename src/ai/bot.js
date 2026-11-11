// Inteligência artificial do adversário. O bot enxerga a luta (distância, golpes, projéteis, energia)
// e produz os mesmos comandos de um jogador humano — com tempo de reação e acerto variando por dificuldade.
import { weighted, chance, rand, randi } from '../core/util.js';
import { MAX_EN } from '../core/config.js';

export const LEVELS = {
  easy: { label: 'FÁCIL', react: 20, think: 26, block: 0.18, aggro: 0.4, sp: 0.12, combo: 0.22, sup: 0.25, aa: 0.1, punish: 0.1, dodge: 0.1, idle: 0.42 },
  normal: { label: 'NORMAL', react: 11, think: 13, block: 0.52, aggro: 0.6, sp: 0.42, combo: 0.65, sup: 0.7, aa: 0.5, punish: 0.5, dodge: 0.4, idle: 0.14 },
  hard: { label: 'DIFÍCIL', react: 5, think: 6, block: 0.86, aggro: 0.78, sp: 0.66, combo: 0.95, sup: 1, aa: 0.9, punish: 0.92, dodge: 0.75, idle: 0.03 },
};

const blank = () => ({ left: false, right: false, up: false, down: false, light: false, heavy: false, sp1: false, sp2: false, super: false, block: false });
const tap = (...k) => ({ k, n: 2 });
const gap = (n) => ({ k: [], n });

export class Bot {
  constructor(level = 'normal') {
    this.level = level; this.p = LEVELS[level];
    this.out = blank(); this.plan = []; this.wait = 30; this.seenSeq = -1; this.willBlock = false; this.reactAt = 0;
    this.entSeen = new WeakMap(); this.idleMode = null; this.inCombo = false; this.wakeDone = false;
  }

  read(me, opp, m) {
    const o = this.out;
    for (const k in o) o[k] = false;
    if (m.phase !== 'fight' || m.cine) { this.plan.length = 0; return o; }
    const p = this.p, dx = opp.x - me.x, d = Math.abs(dx), dir = dx >= 0 ? 1 : -1;
    const F = dir > 0 ? 'right' : 'left', B = dir > 0 ? 'left' : 'right';

    if (me.stunned || me.state === 'down') { this.plan.length = 0; this.inCombo = false; this.wakeDone = false; return o; }
    if (me.state === 'getup') {
      // defesa ao levantar
      if (!this.wakeDone) { this.wakeDone = true; this.plan = chance(p.block) && d < 260 ? [{ k: ['block'], n: 34 }] : []; }
    }

    // ----- leitura de ameaças -----
    let threat = false, low = false, high = false;
    const mv = opp.move;
    if (opp.state === 'attack' && mv && mv.box && !opp.moveHit && opp.mf <= mv.st + mv.act) {
      const reach = mv.box[0] + mv.box[2] + (mv.lunge ? (mv.lunge[1] - mv.lunge[0]) * mv.lunge[2] * 0.8 : 0) + 56;
      if (d < reach) {
        if (this.seenSeq !== opp.moveSeq) {
          this.seenSeq = opp.moveSeq;
          this.willBlock = chance(p.block);
          this.reactAt = Math.min(p.react, Math.max(1, mv.st - 1));
          if (mv.st < p.react * 0.7 && me.state !== 'blockstun' && me.state !== 'block') this.willBlock = this.willBlock && chance(0.45);
        }
        if (this.willBlock && opp.mf >= this.reactAt) { threat = true; low = mv.lvl === 'low'; high = mv.lvl === 'high'; }
      }
    }
    for (const e of m.ents) {
      if (e.owner === me) continue;
      let danger = false, dist = Math.abs(e.x - me.x);
      if (e.warn) {
        if (dist < 96 && e.t >= e.lockT - 6 && e.t < e.fireT + 10) danger = true;
      } else if (e.hit) {
        const toward = (e.vx || 0) * (me.x - e.x) > 0 || dist < 110;
        if (toward && dist < 130 + Math.abs(e.vx || 0) * 9) danger = true;
      }
      if (!danger) continue;
      let dec = this.entSeen.get(e);
      if (dec === undefined) {
        dec = !chance(Math.min(0.97, p.block + 0.12)) ? 'none' : e.warn ? (chance(p.dodge) ? 'dash' : 'block') : (e.ground && chance(p.dodge) ? 'jump' : 'block');
        this.entSeen.set(e, dec);
        if (dec === 'dash' && me.actionable) { const away = e.x > me.x ? B : F; this.plan = [{ k: [away === F ? 'F' : 'B'], n: 2 }, gap(2), { k: [away === F ? 'F' : 'B'], n: 2 }, gap(10)]; }
      }
      if (dec === 'block') { threat = true; if (e.hit && e.hit.lvl === 'high') high = true; }
      else if (dec === 'jump' && me.actionable && dist < 200) { o.up = true; o[F] = true; this.plan.length = 0; return o; }
    }
    if (threat && (me.actionable || me.state === 'blockstun')) { this.plan.length = 0; this.inCombo = false; o.block = true; o.down = low && !high; return o; }
    if (me.state === 'blockstun') { o.block = true; o.down = me.lowBlock; return o; }

    // ----- execução do plano em andamento -----
    if (this.plan.length) {
      const s = this.plan[0];
      for (const k of s.k) o[k === 'F' ? F : k === 'B' ? B : k] = true;
      if (--s.n <= 0) this.plan.shift();
      if (this.inCombo && me.lastRes === 'block' && this.plan.length > 2 && chance(p.punish * 0.06)) { this.plan = [{ k: ['block'], n: 16 }]; this.inCombo = false; }
      if (!this.plan.length) this.inCombo = false;
      return o;
    }
    if (!me.actionable) return o;
    if (--this.wait > 0) {
      if (this.idleMode) o[this.idleMode === 'F' ? F : this.idleMode === 'B' ? B : this.idleMode] = true;
      return o;
    }
    this.decide(me, opp, m, d);
    return o;
  }

  decide(me, opp, m, d) {
    const p = this.p, ai = me.char.ai, en = me.en, mvs = me.char.moves;
    this.idleMode = null;
    this.wait = p.think * rand(0.6, 1.5);
    const oppDown = opp.state === 'down' || opp.state === 'getup' || opp.state === 'launch';
    const oppVuln = opp.state === 'dizzy' || opp.state === 'land' || (opp.state === 'attack' && opp.move && opp.mf > opp.move.st + (opp.move.act || 0));
    const can = (sp) => en >= mvs[sp].cost && d >= ai[sp][0] && d <= ai[sp][1] && !(sp === 'sp2' && ai.shield && me.shield);

    if (en >= MAX_EN && d < ai.sup && !oppDown && opp.y <= 0 && chance(oppVuln ? p.sup : p.sup * 0.1)) return this.set([tap('super'), gap(6)]);
    if (opp.y > 30 && d < 230 && !oppDown && chance(p.aa)) return this.set([tap('heavy'), gap(8)]);
    if (oppVuln && d < 175 && chance(p.punish)) return this.combo(me, d, true);
    if (oppDown) {
      if (d > 300 && can('sp1') && chance(p.sp * 0.5)) return this.set([tap('sp1'), gap(8)]);
      if (ai.shield && can('sp2') && chance(p.sp * 0.4)) return this.set([tap('sp2'), gap(8)]);
      if (d < 130) return this.set([{ k: ['B'], n: randi(6, 12) }]);
      if (d > 230) return this.set([{ k: ['F'], n: randi(8, 16) }]);
      this.wait = 8; return;
    }
    if (chance(p.idle)) { this.wait = rand(18, 46); this.idleMode = chance(0.3) ? 'B' : null; return; }

    let act;
    if (d > 430) {
      act = weighted([[3, 'walk'], [p.aggro * 2, 'dash'], [0.8, 'jump'], [can('sp1') ? p.sp * 5 : 0, 'sp1'], [can('sp2') ? p.sp * 4 : 0, 'sp2'], [0.5, 'wait']]);
    } else if (d > 165) {
      act = weighted([[2, 'walk'], [p.aggro * 2.5, 'dash'], [p.aggro * 1.6, 'jumpin'], [can('sp1') ? p.sp * 2.5 : 0, 'sp1'], [can('sp2') ? p.sp * 3 : 0, 'sp2'], [1 - p.aggro, 'back'], [0.4, 'wait']]);
    } else {
      act = weighted([[p.combo * 5 + 0.6, 'combo'], [1.5, 'light'], [1.2, 'heavy'], [1.2, 'low'], [0.8, 'sweep'], [(1 - p.aggro) * 2, 'guard'], [0.6, 'backdash'], [can('sp2') ? p.sp * 2 : 0, 'sp2'], [can('sp1') ? p.sp : 0, 'sp1'], [0.25, 'jumpback']]);
    }
    switch (act) {
      case 'walk': return this.set([{ k: ['F'], n: randi(10, 24) }], 1);
      case 'back': return this.set([{ k: ['B'], n: randi(8, 18) }]);
      case 'dash': return this.set([tap('F'), gap(2), tap('F'), gap(9)], 1);
      case 'jump': return this.set([{ k: ['up', 'F'], n: 3 }, gap(30)]);
      case 'jumpin': return this.set([{ k: ['up', 'F'], n: 3 }, gap(randi(17, 22)), tap('heavy'), gap(12)], 1);
      case 'jumpback': return this.set([{ k: ['up', 'B'], n: 3 }, gap(30)]);
      case 'sp1': case 'sp2': return this.set([tap(act), gap(10)]);
      case 'light': return this.set([tap('light'), gap(8)]);
      case 'heavy': return this.set([tap('heavy'), gap(12)]);
      case 'low': return this.set([{ k: ['down', 'light'], n: 3 }, gap(8)]);
      case 'sweep': return this.set([{ k: ['down', 'heavy'], n: 3 }, gap(14)]);
      case 'guard': return this.set([{ k: ['block'], n: randi(14, 30) }]);
      case 'backdash': return this.set([tap('B'), gap(2), tap('B'), gap(14)]);
      case 'combo': return this.combo(me, d, false);
      default: this.wait = rand(8, 20);
    }
  }

  set(plan, wait) { this.plan = plan; if (wait !== undefined) this.wait = wait; }

  // Sequências de combo — quanto maior a dificuldade, mais longas e com cancelamento em poder/supremo.
  combo(me, d, punish) {
    const p = this.p, en = me.en, mvs = me.char.moves, ai = me.char.ai;
    const L = [tap('light'), gap(9)], H = [tap('heavy'), gap(12)];
    const closeSp = ['sp1', 'sp2'].filter((s) => en >= mvs[s].cost && ai[s][0] <= 150 && !(s === 'sp2' && ai.shield));
    const opts = [[2, [...L, ...L, ...L]], [2, [...L, ...L, ...H]]];
    if (this.level === 'easy') opts.push([4, [...L, ...L]], [2, [...L]]);
    if (this.level !== 'easy') {
      opts.push([1.5, [{ k: ['down', 'light'], n: 3 }, gap(8), { k: ['down', 'heavy'], n: 3 }, gap(14)]]);
      if (closeSp.length) opts.push([3 * p.sp + 1, [...L, ...L, tap('heavy'), gap(11), tap(closeSp[0]), gap(10)]]);
      if (punish) opts.push([2, [...H]]);
    }
    if (this.level === 'hard' && en >= MAX_EN && d < ai.sup) opts.push([9, [...L, ...L, tap('heavy'), gap(11), tap('super'), gap(8)]]);
    else if (en >= MAX_EN && d < Math.min(ai.sup, 200) && chance(p.sup * 0.5)) opts.push([4, [...L, tap('heavy'), gap(11), tap('super'), gap(8)]]);
    this.plan = weighted(opts).map((s) => ({ k: s.k, n: s.n }));
    this.inCombo = true;
    this.wait = 2;
  }
}
