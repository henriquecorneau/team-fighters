// Elenco do TEAM FIGHTERS.
import { buildLook } from './looks.js';
import { makePortrait } from '../render/rig.js';
import { PIX, makePixelPortrait } from '../render/pixel.js';
import { S } from '../render/poses.js';
import baiano from './baiano.js';
import rinaldo from './rinaldo.js';
import tibas from './tibas.js';
import ramas from './ramas.js';
import elber from './elber.js';
import peidin from './peidin.js';
import { FATALS } from './fatals.js';

// Qual fotografia de referência define a aparência de cada personagem (confirmado pela equipe).
export const PHOTO_OF = {
  baiano: 'foto6',   // camiseta azul-clara de mecatrônica, segurando o drone
  rinaldo: 'foto1',  // segurando o robô montado em discos
  tibas: 'foto5',    // camisa social e crachá de congresso
  ramas: 'foto2',    // camiseta ZUNE
  elber: 'foto3',    // óculos aviador, fones, celular e sacola
  peidin: 'peidin',  // polo preta, bigode e óculos de aro fino
};

// Equipamento de luta somado à aparência da foto.
const GEAR = {
  baiano: { gear: 'controller', goggles: true },
  rinaldo: { gear: 'wrench', toolbelt: true, glove: '#e8b93a' },
  tibas: { gear: 'gauntlet' },
  ramas: { gear: 'holo' },
  elber: {},
  peidin: { gear: 'spinner' },
};

const FACTORY = { baiano, rinaldo, tibas, ramas, elber, peidin };

export const ROSTER = Object.keys(FACTORY).map((id) => FACTORY[id](buildLook(PHOTO_OF[id], GEAR[id])));
for (const c of ROSTER) c.fatal = FATALS[c.id];
export const CHAR = Object.fromEntries(ROSTER.map((c) => [c.id, c]));

export function buildPortraits() {
  for (const c of ROSTER) {
    c.portrait = PIX.on ? makePixelPortrait(c.look, 200, S.relax) : makePortrait(c.look, 160, S.relax);
    c.portraitBig = PIX.on ? makePixelPortrait(c.look, 400, S.relax) : makePortrait(c.look, 420, S.relax);
  }
}
