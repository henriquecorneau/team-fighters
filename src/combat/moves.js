// Golpes normais compartilhados (cada personagem sobrescreve o que for próprio do seu estilo).
// Dados de frame: st = preparação, act = frames ativos, rec = recuperação.
// box = [x à frente, base acima dos pés, largura, altura]; lvl = 'mid' | 'low' (defender agachado) | 'high' (defender em pé).
import { S, atk } from '../render/poses.js';

export const BASE_MOVES = {
  light1: { st: 4, act: 3, rec: 9, dmg: 28, stun: 17, bstun: 9, push: 3.2, lvl: 'mid', box: [16, 128, 96, 48], next: { light: 'light2', heavy: 'heavy' }, chain: true, cancelSp: true, sfx: 'whoosh_l', hit: 'hit_l', hs: 5, anim: atk(4, 3, 9, S.jabW, S.jab) },
  light2: { st: 5, act: 3, rec: 10, dmg: 32, stun: 19, bstun: 10, push: 3.6, lvl: 'mid', box: [16, 120, 104, 52], next: { light: 'light3', heavy: 'heavy' }, chain: true, cancelSp: true, lunge: [1, 5, 3.5], sfx: 'whoosh_l', hit: 'hit_l', hs: 5, anim: atk(5, 3, 10, S.crossW, S.cross) },
  light3: { st: 7, act: 4, rec: 16, dmg: 46, stun: 20, bstun: 12, push: 8, lvl: 'mid', box: [20, 120, 122, 84], cancelSp: true, lunge: [1, 6, 3], sfx: 'whoosh_h', hit: 'hit_h', hs: 8, anim: atk(7, 4, 16, S.kickW, S.kick) },
  heavy: { st: 11, act: 4, rec: 19, dmg: 80, stun: 24, bstun: 15, push: 8.5, lvl: 'mid', box: [20, 100, 134, 100], cancelSp: true, lunge: [3, 10, 4], sfx: 'whoosh_h', hit: 'hit_h', hs: 9, anim: atk(11, 4, 19, S.roundW, S.round) },
  clight: { st: 5, act: 3, rec: 9, dmg: 24, stun: 14, bstun: 8, push: 3, lvl: 'low', box: [20, 0, 118, 44], crouch: true, next: { light: 'clight', heavy: 'cheavy' }, cancelSp: true, sfx: 'whoosh_l', hit: 'hit_l', hs: 5, anim: atk(5, 3, 9, S.lowW, S.low, S.crouch) },
  cheavy: { st: 9, act: 5, rec: 22, dmg: 70, stun: 20, bstun: 14, push: 5, lvl: 'low', kd: [4.5, 9], box: [20, 0, 146, 46], crouch: true, sfx: 'whoosh_h', hit: 'hit_h', hs: 9, anim: atk(9, 5, 22, S.sweepW, S.sweep, S.crouch) },
  alight: { st: 4, act: 12, rec: 30, dmg: 34, stun: 16, bstun: 10, push: 3.5, lvl: 'high', box: [10, -24, 100, 96], air: true, sfx: 'whoosh_l', hit: 'hit_l', hs: 5, anim: atk(4, 12, 30, S.jumpTuck, S.airKick, S.airKick) },
  aheavy: { st: 8, act: 7, rec: 30, dmg: 66, stun: 22, bstun: 14, push: 5, lvl: 'high', box: [6, -16, 106, 116], air: true, sfx: 'whoosh_h', hit: 'hit_h', hs: 9, anim: atk(8, 7, 30, S.airSmashW, S.airSmash, S.airSmash) },
};
