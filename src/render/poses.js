// Biblioteca de poses-chave e animações (interpoladas em tempo real pelo rig).
import { P, mixPose } from './rig.js';
import { smooth } from '../core/util.js';

// ---------- poses ----------
export const S = {
  stA: P({}),
  stB: P({ lean: 9, head: 1, hy: 88, af: [42, 92], ab: [9, 106] }),
  relax: P({ lean: 0, hy: 103, ff: [12, 0], fb: [-12, 0], af: [4, 10], ab: [-6, 10] }),
  relaxB: P({ lean: 1, hy: 101, ff: [12, 0], fb: [-12, 0], af: [6, 14], ab: [-4, 12] }),
  w0: P({ hy: 92, ff: [32, 0], fb: [-30, 0], af: [44, 94], ab: [0, 112] }),
  w1: P({ hy: 96, ff: [6, 0], fb: [-2, 16], af: [38, 98], ab: [5, 112] }),
  w2: P({ hy: 92, ff: [-28, 0], fb: [32, 0], af: [32, 102], ab: [10, 110] }),
  w3: P({ hy: 96, ff: [0, 16], fb: [6, 0], af: [38, 98], ab: [5, 112] }),
  crouch: P({ lean: 16, head: -6, hy: 50, ff: [32, 0], fb: [-26, 0], af: [45, 100], ab: [15, 112] }),
  crouchB: P({ lean: 18, head: -6, hy: 47, ff: [32, 0], fb: [-26, 0], af: [48, 96], ab: [18, 108] }),
  jumpUp: P({ lean: 2, hy: 98, ff: [10, 16], fb: [-14, 2], af: [75, 60], ab: [-25, 45] }),
  jumpTuck: P({ lean: 8, hy: 68, ff: [22, 6], fb: [-8, 0], af: [50, 80], ab: [10, 90] }),
  jumpFall: P({ lean: -2, hy: 99, ff: [14, 6], fb: [-12, 0], af: [125, 25], ab: [105, 30] }),
  land: P({ lean: 14, hy: 68, ff: [30, 0], fb: [-30, 0], af: [30, 80], ab: [10, 90] }),
  dashF: P({ lean: 28, head: -10, hy: 80, ff: [42, 0], fb: [-46, 8], af: [20, 100], ab: [-35, 80] }),
  dashB: P({ lean: -16, head: 4, hy: 86, ff: [32, 10], fb: [-28, 0], af: [60, 80], ab: [30, 100] }),
  blockS: P({ lean: -5, head: -5, hy: 88, ff: [24, 0], fb: [-32, 0], af: [62, 112], ab: [48, 122] }),
  blockC: P({ lean: 8, head: -6, hy: 50, ff: [30, 0], fb: [-26, 0], af: [62, 112], ab: [48, 122] }),
  hitHigh: P({ lean: -24, head: -22, hy: 90, ff: [22, 0], fb: [-38, 0], af: [-25, 35], ab: [-45, 25] }),
  hitLow: P({ lean: 30, head: 22, hy: 78, ff: [20, 0], fb: [-32, 0], af: [35, 85], ab: [25, 95] }),
  hitCrouch: P({ lean: 28, head: 18, hy: 46, ff: [28, 0], fb: [-28, 0], af: [30, 60], ab: [10, 70] }),
  launch: P({ lean: -30, head: -25, hy: 82, ff: [36, 30], fb: [14, 48], af: [-70, 25], ab: [-110, 15], rot: -30 }),
  down: P({ lean: 0, head: -8, hy: 100, ff: [8, 0], fb: [-8, 0], af: [-25, 12], ab: [-45, 10], rot: -90, oy: -84 }),
  downB: P({ lean: 0, head: -4, hy: 100, ff: [12, 6], fb: [-8, 0], af: [-20, 16], ab: [-45, 10], rot: -90, oy: -83 }),
  sit: P({ lean: 34, head: 10, hy: 40, ff: [40, 0], fb: [-10, 0], af: [-10, 20], ab: [-40, 10], rot: -18 }),
  dzA: P({ lean: 12, head: 16, hy: 86, ff: [22, 0], fb: [-26, 0], af: [8, 12], ab: [-10, 10] }),
  dzB: P({ lean: -8, head: -14, hy: 88, ff: [22, 0], fb: [-26, 0], af: [-6, 14], ab: [-20, 12] }),
  winA: P({ lean: -4, head: -6, hy: 100, ff: [14, 0], fb: [-14, 0], af: [165, 12], ab: [-12, 22] }),
  winB: P({ lean: -6, head: -10, hy: 94, ff: [14, 0], fb: [-14, 0], af: [176, 4], ab: [-8, 30] }),
  kneel: P({ lean: 34, head: 30, hy: 44, ff: [30, 0], fb: [-34, 0], af: [14, 12], ab: [2, 12] }),
  kneelB: P({ lean: 37, head: 34, hy: 42, ff: [30, 0], fb: [-34, 0], af: [16, 10], ab: [4, 10] }),
  // ataques
  jabW: P({ lean: 5, af: [25, 125] }),
  jab: P({ lean: 15, hy: 90, ff: [36, 0], af: [90, 2], ab: [0, 118] }),
  crossW: P({ lean: 10, ab: [-20, 122], af: [40, 100] }),
  cross: P({ lean: 22, head: -4, hy: 88, ff: [38, 0], fb: [-34, 0], ab: [93, 0], af: [10, 130] }),
  kickW: P({ lean: -6, hy: 97, ff: [20, 34], fb: [-12, 0], af: [40, 100] }),
  kick: P({ lean: -22, head: 6, hy: 99, ff: [94, 116], fb: [-8, 0], af: [-20, 70], ab: [30, 100] }),
  roundW: P({ lean: 12, hy: 90, ff: [6, 14], fb: [-20, 0], af: [50, 90], ab: [20, 100] }),
  round: P({ lean: -28, head: 8, hy: 99, ff: [104, 100], fb: [-6, 0], af: [-35, 60], ab: [45, 95] }),
  lowW: P({ lean: 14, head: -6, hy: 48, ff: [18, 12], fb: [-26, 0], af: [45, 100], ab: [15, 112] }),
  low: P({ lean: 12, head: -4, hy: 46, ff: [92, 5], fb: [-26, 0], af: [45, 100], ab: [12, 112] }),
  sweepW: P({ lean: 4, hy: 44, ff: [8, 8], fb: [-24, 0], af: [30, 90], ab: [20, 100] }),
  sweep: P({ lean: -32, head: 10, hy: 38, ff: [108, 3], fb: [-22, 0], af: [-50, 15], ab: [35, 95] }),
  airKick: P({ lean: 14, hy: 76, ff: [74, -8], fb: [-24, 42], af: [40, 100], ab: [-20, 60] }),
  airSmashW: P({ lean: -8, hy: 80, ff: [10, 20], fb: [-20, 30], af: [172, 8], ab: [165, 10] }),
  airSmash: P({ lean: 24, hy: 72, ff: [34, 30], fb: [-30, 38], af: [72, 10], ab: [66, 14] }),
  // conjurações / especiais
  point: P({ lean: 12, hy: 90, ff: [34, 0], fb: [-32, 0], af: [92, 0], ab: [-25, 40] }),
  pointW: P({ lean: -2, hy: 94, af: [150, 60], ab: [-10, 60] }),
  up: P({ lean: -4, head: -10, hy: 99, ff: [16, 0], fb: [-18, 0], af: [168, 8], ab: [158, 12] }),
  upW: P({ lean: 12, hy: 80, af: [30, 60], ab: [20, 70] }),
  both: P({ lean: 16, hy: 86, ff: [36, 0], fb: [-34, 0], af: [88, 4], ab: [82, 8] }),
  bothW: P({ lean: -8, hy: 92, af: [10, 130], ab: [0, 135] }),
  slam: P({ lean: 42, head: 10, hy: 56, ff: [38, 0], fb: [-32, 0], af: [35, 5], ab: [30, 5] }),
  throwW: P({ lean: -14, hy: 94, ff: [20, 0], fb: [-30, 0], af: [205, 30], ab: [40, 80] }),
  throw: P({ lean: 26, hy: 86, ff: [40, 0], fb: [-34, 0], af: [78, 0], ab: [-30, 50] }),
  swingW: P({ lean: -12, hy: 96, ff: [18, 0], fb: [-28, 0], af: [195, 15], ab: [30, 90] }),
  swing: P({ lean: 30, hy: 82, ff: [42, 0], fb: [-34, 0], af: [62, 4], ab: [-20, 60] }),
  hayW: P({ lean: -10, hy: 88, ff: [18, 0], fb: [-36, 0], af: [-55, 95], ab: [40, 100] }),
  hay: P({ lean: 28, head: -6, hy: 84, ff: [46, 0], fb: [-38, 0], af: [96, 0], ab: [-20, 80] }),
  palmW: P({ lean: -6, hy: 92, af: [0, 120], ab: [-10, 125] }),
  palm: P({ lean: 20, hy: 86, ff: [42, 0], fb: [-34, 0], af: [92, 0], ab: [86, 4] }),
  buttW: P({ lean: -14, head: -16, hy: 90, ff: [16, 0], fb: [-30, 0], af: [-20, 60], ab: [-30, 50] }),
  butt: P({ lean: 52, head: 20, hy: 80, ff: [50, 0], fb: [-40, 0], af: [-30, 30], ab: [-45, 20] }),
  type: P({ lean: 4, hy: 96, ff: [18, 0], fb: [-20, 0], af: [62, 48], ab: [50, 62] }),
  typeB: P({ lean: 5, hy: 95, ff: [18, 0], fb: [-20, 0], af: [56, 62], ab: [58, 46] }),
  whistle: P({ lean: -6, head: -8, hy: 98, ff: [16, 0], fb: [-18, 0], af: [150, 125], ab: [-12, 24] }),
  ride: P({ lean: 34, head: -20, hy: 70, ff: [10, 30], fb: [-40, 20], af: [80, 10], ab: [70, 14] }),
  flex: P({ lean: -2, head: -4, hy: 98, ff: [22, 0], fb: [-22, 0], af: [100, 110], ab: [-100, -110] }),
  shrug: P({ lean: -3, head: 4, hy: 100, ff: [14, 0], fb: [-14, 0], af: [50, 70], ab: [-40, -60] }),
  armsX: P({ lean: -4, head: -4, hy: 101, ff: [14, 0], fb: [-14, 0], af: [40, 115], ab: [35, 120] }),
};

// ---------- animações ----------
export const A = (loop, ...keys) => ({ loop, keys, dur: keys[keys.length - 1][0] });

export const ANIMS = {
  idle: A(true, [0, S.stA], [26, S.stB], [52, S.stA]),
  relax: A(true, [0, S.relax], [40, S.relaxB], [80, S.relax]),
  walk: A(true, [0, S.w0], [8, S.w1], [16, S.w2], [24, S.w3], [32, S.w0]),
  crouch: A(true, [0, S.crouch], [30, S.crouchB], [60, S.crouch]),
  jump: A(false, [0, S.jumpUp], [0.5, S.jumpTuck], [1, S.jumpFall]),
  land: A(false, [0, S.land]),
  dash: A(false, [0, S.dashF]),
  backdash: A(false, [0, S.dashB]),
  blockS: A(false, [0, S.blockS]),
  blockC: A(false, [0, S.blockC]),
  hitHigh: A(false, [0, S.hitHigh]),
  hitLow: A(false, [0, S.hitLow]),
  hitCrouch: A(false, [0, S.hitCrouch]),
  launch: A(false, [0, S.launch]),
  down: A(true, [0, S.down], [40, S.downB], [80, S.down]),
  getup: A(false, [0, S.down], [9, S.sit], [17, S.crouch], [24, S.stA]),
  dizzy: A(true, [0, S.dzA], [22, S.dzB], [44, S.dzA]),
  win: A(true, [0, S.winA], [16, S.winB], [32, S.winA]),
  lose: A(true, [0, S.kneel], [40, S.kneelB], [80, S.kneel]),
  intro: A(false, [0, S.relax], [34, S.relaxB], [52, S.stA]),
};

// Animação de ataque: preparação -> golpe (snap) -> sustentação -> volta à guarda.
export function atk(st, act, rec, wind, strike, end = S.stA, strike2) {
  const tot = st + act + rec;
  return A(false, [0, wind], [Math.max(1, st * 0.45), wind, 'out'], [st, strike, 'in'], [st + act + rec * 0.3, strike2 || strike], [tot, end]);
}

export function sample(anim, t, out) {
  const k = anim.keys;
  if (anim.loop && anim.dur > 0) t %= anim.dur;
  if (t <= k[0][0]) { out.set(k[0][1]); return out; }
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      let u = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0] || 1);
      u = k[i][2] === 'in' ? u * u * u : k[i][2] === 'out' ? 1 - (1 - u) ** 3 : smooth(u);
      return mixPose(k[i - 1][1], k[i][1], u, out);
    }
  }
  out.set(k[k.length - 1][1]);
  return out;
}

export { P };
